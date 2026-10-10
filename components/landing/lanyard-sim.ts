/**
 * Lanyard physics: a small XPBD (extended position-based dynamics) solver.
 *
 * The strap is a chain of light particles hanging from a fixed anchor. The card is a rigid triangle of three
 * heavy particles (the hang point at the crimp and the two bottom corners), so it swings, tilts and spins
 * like a real card. Everything is solved with many small substeps, which keeps the strap bounded and the
 * card rigid without jitter, and keeps momentum when a drag is released (you can fling it).
 *
 * Plain arrays and math only (no three.js), so it is cheap and unit-testable.
 */

export type LanyardDims = {
  /** Fixed top of the strap. */
  anchor: [number, number, number];
  /** Strap length from the anchor to the card's hang point. */
  strapLength: number;
  /** Number of strap segments. */
  segments: number;
  cardW: number;
  cardH: number;
  /** Hang point in card space (x = 0), above the card's centre. */
  hangY: number;
};

const GRAVITY = -72;
/** Fixed simulation tick and substeps per tick. */
export const TICK = 1 / 120;
const SUBSTEPS = 10;
/** Extra length allowed under a pull, as a fraction of each strap segment. */
export const stretchMax = 0.16;
/** Extension compliance at the start of a pull (lower is firmer). */
export const stiffness = 2e-6;
/** Added recoil speed per unit of strap extension on release. */
export const releaseBoost = 7;
/** Damping applied to the recoil impulse as it settles, per second. */
export const damping = 2.8;
/** Air drag, per second. */
const STRAP_DRAG = 3;
/** Fabric's internal damping: evens out velocity between neighbouring strap points (kills fast wobble, keeps swing). Per second. */
const STRAP_INTERNAL_DAMPING = 60;
const CARD_DRAG = 0.6;
/** Dry friction at the pivot (units/s²): ends small leftover swings in finite time, barely touches big ones. */
const PIVOT_FRICTION = 0.15;
/** Friction in the ring and swivel: damps the card spinning/rocking about its own centre, not its swing. */
const CARD_SPIN_DRAG = 2.2;
/** Masses: a light strap and a card whose particles put its centre of mass at the card's centre. */
const STRAP_MASS = 0.05;
const CARD_CORNER_MASS = 1;
/** Compliances (inverse stiffness). 0 = rigid. */
const STRAP_BEND_COMPLIANCE = 1.5e-3; // strap resists sharp kinks
/** Half-thickness kept between the strap and the card faces. */
const STRAP_CLEARANCE = 0.05;
const CLAMP_COMPLIANCE = 6e-4; // strap leaves the crimp roughly straight
/** Strap twist: turns the card to show whichever face (front or back) is nearer the viewer. rad/s. */
const FACING_OMEGA = 2.2;
/** Spin given by a tap (flip to the other side) and by a sideways flick on release. */
const FLIP_SPIN = 5; // rad/s
const FLICK_SPIN = 0.9; // rad/s per unit/s of hand speed
const MAX_FLICK_SPIN = 16; // rad/s
const HOLD_COMPLIANCE = 2e-8; // slight give lets strap tension pull against the hand
/** Held card: pointer smoothing, how fast it rights itself, and how much it leans when moved sideways. */
const HOLD_RESPONSE = 20; // rad/s: the hand is a critically damped spring toward the pointer, so uneven pointer events don't show
const HOLD_UPRIGHT = 0.3; // s
const HOLD_LEAN = 0.035; // rad per unit/s of hand speed
const HOLD_MAX_LEAN = 0.45; // rad
/** Speed cap per particle (units/s), against runaway flings. */
const MAX_SPEED = 60;

export class LanyardSim {
  readonly dims: LanyardDims;
  readonly count: number;
  /** Index of the card's hang point (last strap particle); the two corners follow it. */
  readonly hang: number;
  readonly bl: number;
  readonly br: number;
  readonly seg: number;

  pos: Float64Array;
  private prev: Float64Array;
  /** Positions at the start of the latest tick, for render interpolation. */
  private tickStart: Float64Array;
  private invMass: Float64Array;
  private drag: number[];
  private cardEdges: [number, number, number][];

  private grab: Hold | null = null;
  /** Face the card turns to: 0 = front, PI = back. */
  private faceGoal = 0;
  /** True while a flip is under way, so the twist spring pulls toward the new face instead of the nearest one. */
  private flipping = false;
  private pendingSpin = 0;
  private recoil = 0;
  /** Ticks in a row with (almost) no motion; past a second the sim sleeps until touched. */
  private stillTicks = 0;

  constructor(dims: LanyardDims) {
    this.dims = dims;
    this.hang = dims.segments;
    this.bl = this.hang + 1;
    this.br = this.hang + 2;
    this.count = this.hang + 3;
    this.seg = dims.strapLength / dims.segments;
    this.pos = new Float64Array(this.count * 3);
    this.prev = new Float64Array(this.count * 3);
    this.tickStart = new Float64Array(this.count * 3);
    this.invMass = new Float64Array(this.count);
    this.drag = [];
    for (let i = 1; i < this.hang; i++) {
      this.invMass[i] = 1 / STRAP_MASS;
      this.drag[i] = STRAP_DRAG;
    }
    // Centre of mass at the card centre: hangMass * hangY = 2 * cornerMass * (cardH / 2).
    const hangMass = (CARD_CORNER_MASS * dims.cardH) / dims.hangY;
    this.invMass[this.hang] = 1 / hangMass;
    this.invMass[this.bl] = 1 / CARD_CORNER_MASS;
    this.invMass[this.br] = 1 / CARD_CORNER_MASS;
    for (const i of [this.hang, this.bl, this.br]) this.drag[i] = CARD_DRAG;

    const { cardW: w, cardH: h, hangY } = dims;
    const side = Math.hypot(w / 2, hangY + h / 2);
    this.cardEdges = [
      [this.hang, this.bl, side],
      [this.hang, this.br, side],
      [this.bl, this.br, w],
    ];
    this.reset("hanging");
  }

  /** "hanging": at rest. "swing-in": strap held out to the right, so the card swings in on load. */
  reset(pose: "hanging" | "swing-in") {
    const [ax, ay, az] = this.dims.anchor;
    for (let i = 0; i <= this.hang; i++) {
      if (pose === "swing-in") this.set(i, ax + this.seg * i, ay, az);
      else this.set(i, ax, ay - this.seg * i, az);
    }
    const p = this.hang * 3;
    const hx = this.pos[p];
    const hy = this.pos[p + 1];
    const { cardW: w, cardH: h, hangY } = this.dims;
    this.set(this.bl, hx - w / 2, hy - hangY - h / 2, az);
    this.set(this.br, hx + w / 2, hy - hangY - h / 2, az);
    this.prev.set(this.pos);
    this.tickStart.set(this.pos);
    this.grab = null;
    this.recoil = 0;
    this.stillTicks = 0;
  }

  private set(i: number, x: number, y: number, z: number) {
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
  }

  /**
   * Affine weights of a card-space point (x, y) over the hang point and the two bottom corners.
   * Any point in the card's plane is this weighted sum of the three particles, since the triangle is rigid.
   */
  cardWeights(x: number, y: number): [number, number, number] {
    const { cardW: w, cardH: h, hangY } = this.dims;
    const s = (hangY - y) / (hangY + h / 2);
    const d = (2 * x) / w;
    return [1 - s, (s - d) / 2, (s + d) / 2];
  }

  /** Pinch the card at card-space point (x, y): it then follows the hand, keeping its grip. */
  startDrag(x: number, y: number) {
    const at = this.cardPoint(this.cardWeights(x, y));
    this.recoil = 0;
    const { cardW: w, cardH: h, hangY } = this.dims;
    this.grab = {
      local: [
        [-x, hangY - y, 0],
        [-w / 2 - x, -h / 2 - y, 0],
        [w / 2 - x, -h / 2 - y, 0],
      ],
      q: this.cardQuat(),
      face: nearestFace(this.yaw()),
      raw: [...at],
      hand: [...at],
      vel: [0, 0, 0],
      targets: [[...at], [...at], [...at]],
    };
  }

  moveDrag(x: number, y: number, z: number) {
    if (this.grab) this.grab.raw = [x, y, z];
  }

  /** Release; a sideways flick sets the card spinning. */
  endDrag() {
    if (!this.grab) return;
    const [ax, ay, az] = this.dims.anchor;
    const h = this.hang * 3;
    const away: Vec = [this.pos[h] - ax, this.pos[h + 1] - ay, this.pos[h + 2] - az];
    const extension = Math.max(0, Math.hypot(...away) - this.dims.strapLength);
    if (extension > 0) {
      const speed = Math.min(MAX_SPEED * 0.5, extension * releaseBoost);
      const direction = normalize(away);
      for (const i of [this.hang, this.bl, this.br]) {
        for (let c = 0; c < 3; c++) this.prev[i * 3 + c] += direction[c] * speed * (TICK / SUBSTEPS);
      }
      this.recoil = speed;
    }
    this.pendingSpin += Math.max(-MAX_FLICK_SPIN, Math.min(MAX_FLICK_SPIN, this.grab.vel[0] * FLICK_SPIN));
    this.faceGoal = this.grab.face;
    this.flipping = false;
    this.grab = null;
  }

  /** Spin round to show the other side. */
  flip() {
    if (this.grab) return;
    this.faceGoal = nearestFace(this.yaw()) === 0 ? Math.PI : 0;
    this.flipping = true;
    this.pendingSpin += FLIP_SPIN;
  }

  /** Which way the card faces about the vertical: 0 = front to the viewer, PI = back. */
  yaw() {
    const o = this.bl * 3;
    const p = this.br * 3;
    return Math.atan2(-(this.pos[p + 2] - this.pos[o + 2]), this.pos[p] - this.pos[o]);
  }

  get dragging() {
    return this.grab !== null;
  }

  private cardPoint(w: [number, number, number]): [number, number, number] {
    const out: [number, number, number] = [0, 0, 0];
    const ids = [this.hang, this.bl, this.br];
    for (let k = 0; k < 3; k++) for (let c = 0; c < 3; c++) out[c] += w[k] * this.pos[ids[k] * 3 + c];
    return out;
  }

  /** The card's rotation, from its three particles. */
  private cardQuat(): Quat {
    const p = (i: number): Vec => [this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]];
    const bl = p(this.bl);
    const br = p(this.br);
    const x = normalize(sub(br, bl));
    const y0 = sub(p(this.hang), scale(add(bl, br), 0.5));
    const y = normalize(sub(y0, scale(x, dot(y0, x))));
    return quatFromBasis(x, y, cross(x, y));
  }

  /** Moves the hand toward the pointer (smoothed), eases the grip upright with a lean, and sets particle targets. */
  private updateHold(g: Hold) {
    // Critically damped spring (semi-implicit): smooth position and velocity whatever the pointer does.
    const w = HOLD_RESPONSE;
    for (let c = 0; c < 3; c++) {
      g.vel[c] += (w * w * (g.raw[c] - g.hand[c]) - 2 * w * g.vel[c]) * TICK;
      g.hand[c] += g.vel[c] * TICK;
    }

    const lean = Math.max(-HOLD_MAX_LEAN, Math.min(HOLD_MAX_LEAN, -g.vel[0] * HOLD_LEAN));
    // Upright, still showing the face it was grabbed on, leaning against the motion.
    const leanQ: Quat = [0, 0, Math.sin(lean / 2), Math.cos(lean / 2)];
    const upright = g.face === 0 ? leanQ : qmul(leanQ, [0, 1, 0, 0]);
    g.q = nlerp(g.q, upright, 1 - Math.exp(-TICK / HOLD_UPRIGHT));

    g.targets = g.local.map((l) => add(g.hand, rotate(g.q, l)));
    // Keep the hand within the hard elastic reach so the grip and strap cannot fight indefinitely.
    const [ax, ay, az] = this.dims.anchor;
    const toHang = sub(g.targets[0], [ax, ay, az]);
    const over = Math.hypot(...toHang) - this.dims.strapLength * (1 + stretchMax) * 0.995;
    if (over > 0) {
      const shift = scale(normalize(toHang), -over);
      g.targets = g.targets.map((t) => add(t, shift));
      g.hand = add(g.hand, shift);
      const n = normalize(toHang);
      const out = dot(g.vel, n);
      if (out > 0) g.vel = sub(g.vel, scale(n, out));
    }
  }

  /** True once everything has come to rest (no work is done until the card is touched again). */
  get sleeping() {
    return this.stillTicks > 1 / TICK;
  }

  /** Advance one fixed tick. */
  tick() {
    if (this.grab || this.pendingSpin !== 0) this.stillTicks = 0;
    if (this.sleeping) {
      this.tickStart.set(this.pos);
      return;
    }
    this.tickStart.set(this.pos);
    if (this.grab) this.updateHold(this.grab);
    const dt = TICK / SUBSTEPS;
    for (let s = 0; s < SUBSTEPS; s++) this.substep(dt);
    if (this.recoil > 0) {
      this.recoil *= Math.exp(-damping * TICK);
      if (this.recoil < 0.05) this.recoil = 0;
    }
    if (!this.healthy()) this.reset("hanging");
    let moved = 0;
    for (let i = 0; i < this.pos.length; i++) moved = Math.max(moved, Math.abs(this.pos[i] - this.tickStart[i]));
    this.stillTicks = moved < 8e-5 ? this.stillTicks + 1 : 0; // ~1 px/s
  }

  private substep(dt: number) {
    const { pos, prev, invMass } = this;
    this.dampCardSpin(dt);
    this.dampStrapWobble(dt);
    if (this.pendingSpin !== 0) {
      this.addSpin(this.pendingSpin, dt);
      this.pendingSpin = 0;
    }
    const maxStep = MAX_SPEED * dt;
    for (let i = 0; i < this.count; i++) {
      if (invMass[i] === 0) continue;
      const damp = Math.exp(-(this.drag[i] + (i >= this.hang && this.recoil > 0 ? damping : 0)) * dt);
      const o = i * 3;
      let vx = (pos[o] - prev[o]) * damp;
      let vy = (pos[o + 1] - prev[o + 1]) * damp;
      let vz = (pos[o + 2] - prev[o + 2]) * damp;
      let v = Math.hypot(vx, vy, vz);
      if (i >= this.hang && v > 0) {
        const k = Math.max(0, v - PIVOT_FRICTION * dt * dt) / v;
        vx *= k;
        vy *= k;
        vz *= k;
        v *= k;
      }
      if (v > maxStep) {
        const k = maxStep / v;
        vx *= k;
        vy *= k;
        vz *= k;
      }
      prev[o] = pos[o];
      prev[o + 1] = pos[o + 1];
      prev[o + 2] = pos[o + 2];
      pos[o] += vx;
      pos[o + 1] += vy + GRAVITY * dt * dt;
      pos[o + 2] += vz;
    }

    const a = 1 / (dt * dt);
    if (this.grab) {
      const ids = [this.hang, this.bl, this.br];
      for (let k = 0; k < 3; k++) this.solveTarget(ids[k], this.grab.targets[k], HOLD_COMPLIANCE * a);
    }
    // The weave yields at first, firms up with extension, and has an absolute length limit.
    for (let i = 0; i < this.hang; i++) {
      const len = Math.hypot(
        pos[(i + 1) * 3] - pos[i * 3],
        pos[(i + 1) * 3 + 1] - pos[i * 3 + 1],
        pos[(i + 1) * 3 + 2] - pos[i * 3 + 2],
      );
      const strain = Math.max(0, (len / this.seg - 1) / stretchMax);
      const compliance = strain > 0 ? stiffness * (1 - Math.min(1, strain)) ** 2 : 0;
      this.solveDistance(i, i + 1, this.seg, compliance * a);
    }
    for (let i = 0; i < this.hang - 1; i++) this.solveDistance(i, i + 2, this.seg * 2, STRAP_BEND_COMPLIANCE * a, "short");
    // Card: rigid triangle.
    for (const [i, j, len] of this.cardEdges) this.solveDistance(i, j, len, 0);
    // The crimp clamps the strap end, so the strap leaves the card along the card's "up".
    this.solveClamp(CLAMP_COMPLIANCE * a);
    this.capStrapLength();
    this.collideStrapWithCard();
    if (!this.grab) this.solveFacing(dt);
  }

  private solveTarget(i: number, target: Vec, alpha: number) {
    const w = this.invMass[i];
    const k = w / (w + alpha);
    for (let c = 0; c < 3; c++) this.pos[i * 3 + c] += (target[c] - this.pos[i * 3 + c]) * k;
  }

  /** Move the remaining chain together so no later solve can reopen an overlong link. */
  private capStrapLength() {
    const max = this.seg * (1 + stretchMax);
    for (let i = 0; i < this.hang; i++) {
      const a = i * 3;
      const b = a + 3;
      const dx = this.pos[b] - this.pos[a];
      const dy = this.pos[b + 1] - this.pos[a + 1];
      const dz = this.pos[b + 2] - this.pos[a + 2];
      const len = Math.hypot(dx, dy, dz);
      if (len <= max) continue;
      const k = 1 - max / len;
      for (let j = i + 1; j < this.count; j++) {
        this.pos[j * 3] -= dx * k;
        this.pos[j * 3 + 1] -= dy * k;
        this.pos[j * 3 + 2] -= dz * k;
      }
    }
  }

  /** Moves each strap point's velocity toward the average of its neighbours'. */
  private dampStrapWobble(dt: number) {
    const { pos, prev } = this;
    const k = 1 - Math.exp(-STRAP_INTERNAL_DAMPING * dt);
    const v = (i: number, c: number) => pos[i * 3 + c] - prev[i * 3 + c];
    for (let c = 0; c < 3; c++) {
      let left = v(0, c);
      for (let i = 1; i < this.hang; i++) {
        const here = v(i, c);
        const target = (left + v(i + 1, c)) / 2;
        prev[i * 3 + c] = pos[i * 3 + c] - (here + (target - here) * k);
        left = here;
      }
    }
  }

  /** Blends each card particle's velocity toward the card's centre-of-mass velocity. */
  private dampCardSpin(dt: number) {
    const { pos, prev, invMass } = this;
    const ids = [this.hang, this.bl, this.br];
    const k = Math.exp(-CARD_SPIN_DRAG * dt);
    let m = 0;
    const v = [0, 0, 0];
    for (const i of ids) {
      const mi = 1 / invMass[i];
      m += mi;
      for (let c = 0; c < 3; c++) v[c] += mi * (pos[i * 3 + c] - prev[i * 3 + c]);
    }
    for (let c = 0; c < 3; c++) v[c] /= m;
    for (const i of ids) {
      for (let c = 0; c < 3; c++) {
        const o = i * 3 + c;
        const vi = pos[o] - prev[o];
        prev[o] = pos[o] - (v[c] + (vi - v[c]) * k);
      }
    }
  }

  private solveDistance(i: number, j: number, rest: number, alpha: number, limit?: "short") {
    const { pos, invMass } = this;
    const wi = invMass[i];
    const wj = invMass[j];
    const w = wi + wj;
    if (w === 0) return;
    const oi = i * 3;
    const oj = j * 3;
    const dx = pos[oj] - pos[oi];
    const dy = pos[oj + 1] - pos[oi + 1];
    const dz = pos[oj + 2] - pos[oi + 2];
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-9) return;
    const c = len - rest;
    if (limit === "short" && c >= 0) return;
    const lambda = -c / (w + alpha);
    const nx = dx / len;
    const ny = dy / len;
    const nz = dz / len;
    pos[oi] -= nx * lambda * wi;
    pos[oi + 1] -= ny * lambda * wi;
    pos[oi + 2] -= nz * lambda * wi;
    pos[oj] += nx * lambda * wj;
    pos[oj + 1] += ny * lambda * wj;
    pos[oj + 2] += nz * lambda * wj;
  }

  /** Pulls the weighted card point (and optionally an extra particle) toward a target. */
  private solvePoint(ids: number[], w: number[], target: [number, number, number], alpha: number, extra = -1) {
    const { pos, invMass } = this;
    let denom = alpha;
    for (let k = 0; k < ids.length; k++) denom += w[k] * w[k] * invMass[ids[k]];
    if (extra >= 0) denom += invMass[extra];
    if (denom === 0) return;
    for (let c = 0; c < 3; c++) {
      let p = 0;
      for (let k = 0; k < ids.length; k++) p += w[k] * pos[ids[k] * 3 + c];
      const t = extra >= 0 ? pos[extra * 3 + c] : target[c];
      const lambda = (t - p) / denom;
      for (let k = 0; k < ids.length; k++) pos[ids[k] * 3 + c] += w[k] * invMass[ids[k]] * lambda;
      if (extra >= 0) pos[extra * 3 + c] -= invMass[extra] * lambda;
    }
  }

  /** The strap particle above the hang point is pulled to sit one segment straight "up" out of the crimp. */
  private solveClamp(alpha: number) {
    const w = this.cardWeights(0, this.dims.hangY + this.seg);
    this.solvePoint([this.hang, this.bl, this.br], w, [0, 0, 0], alpha, this.hang - 1);
  }

  /** Keeps the strap from passing through the card: strap points inside the card's slab are pushed back out of the face they came from. */
  private collideStrapWithCard() {
    const { pos, prev } = this;
    const p = (i: number): Vec => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
    const bl = p(this.bl);
    const br = p(this.br);
    const x = normalize(sub(br, bl));
    const mid = scale(add(bl, br), 0.5);
    const y0 = sub(p(this.hang), mid);
    const y = normalize(sub(y0, scale(x, dot(y0, x))));
    const z = cross(x, y);
    const { cardW: w, cardH: h } = this.dims;
    const centre = add(mid, scale(y, h / 2));
    const r = STRAP_CLEARANCE;
    for (let i = 1; i < this.hang; i++) {
      const d = sub(p(i), centre);
      const lz = dot(d, z);
      if (Math.abs(lz) >= r || Math.abs(dot(d, x)) > w / 2 + r || Math.abs(dot(d, y)) > h / 2 + r) continue;
      const was = dot(sub([prev[i * 3], prev[i * 3 + 1], prev[i * 3 + 2]], centre), z);
      const push = (was >= 0 ? r : -r) - lz;
      for (let c = 0; c < 3; c++) pos[i * 3 + c] += z[c] * push;
    }
  }

  /** Spins the card about the vertical through its hang point (rad/s). */
  private addSpin(omega: number, dt: number) {
    const h = this.hang * 3;
    for (const i of [this.bl, this.br]) {
      const o = i * 3;
      const rx = this.pos[o] - this.pos[h];
      const rz = this.pos[o + 2] - this.pos[h + 2];
      this.prev[o] -= omega * rz * dt;
      this.prev[o + 2] += omega * rx * dt;
    }
  }

  /** Strap twist as a spring on the card's yaw, toward the face it is turning to. */
  private solveFacing(dt: number) {
    const yaw = this.yaw();
    if (!this.flipping) this.faceGoal = nearestFace(yaw);
    const err = wrapAngle(this.faceGoal - yaw);
    if (this.flipping && Math.abs(err) < 0.3) this.flipping = false;
    const turn = err * (FACING_OMEGA * dt) ** 2;
    const c = Math.cos(turn);
    const sn = Math.sin(turn);
    const h = this.hang * 3;
    for (const i of [this.bl, this.br]) {
      const o = i * 3;
      const rx = this.pos[o] - this.pos[h];
      const rz = this.pos[o + 2] - this.pos[h + 2];
      // Rotation about +y by `turn` (raises yaw by `turn`).
      this.pos[o] = this.pos[h] + rx * c + rz * sn;
      this.pos[o + 2] = this.pos[h + 2] - rx * sn + rz * c;
    }
  }

  private healthy() {
    const [ax, ay, az] = this.dims.anchor;
    const reach = this.dims.strapLength + this.dims.hangY + this.dims.cardH * 2;
    for (let i = 0; i < this.count; i++) {
      const dx = this.pos[i * 3] - ax;
      const dy = this.pos[i * 3 + 1] - ay;
      const dz = this.pos[i * 3 + 2] - az;
      const d = Math.hypot(dx, dy, dz);
      if (!Number.isFinite(d) || d > reach) return false;
    }
    return true;
  }

  /** Positions blended between the last two ticks (alpha in 0..1), for smooth rendering at any refresh rate. */
  interpolate(alpha: number, out: Float64Array) {
    for (let i = 0; i < out.length; i++) out[i] = this.tickStart[i] + (this.pos[i] - this.tickStart[i]) * alpha;
  }
}

type Vec = [number, number, number];
type Quat = [number, number, number, number];
type Hold = {
  /** Face shown when grabbed (0 front, PI back); the held card keeps it. */
  face: number;
  /** Hang point and bottom corners relative to the grab point, in card space. */
  local: Vec[];
  /** Grip orientation. */
  q: Quat;
  raw: Vec;
  hand: Vec;
  vel: Vec;
  targets: Vec[];
};

const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (a: Vec): Vec => scale(a, 1 / (Math.hypot(...a) || 1));

function quatFromBasis(x: Vec, y: Vec, z: Vec): Quat {
  const [m00, m10, m20] = x;
  const [m01, m11, m21] = y;
  const [m02, m12, m22] = z;
  const tr = m00 + m11 + m22;
  let q: Quat;
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2;
    q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4];
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s];
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s];
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s];
  }
  return q;
}

function nlerp(a: Quat, b: Quat, t: number): Quat {
  const sign = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] < 0 ? -1 : 1;
  const q = a.map((v, i) => v + (sign * b[i] - v) * t) as Quat;
  const n = Math.hypot(...q) || 1;
  return q.map((v) => v / n) as Quat;
}

function rotate(q: Quat, v: Vec): Vec {
  const u: Vec = [q[0], q[1], q[2]];
  const t = scale(cross(u, v), 2);
  return add(add(v, scale(t, q[3])), cross(u, t));
}

function qmul(a: Quat, b: Quat): Quat {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const nearestFace = (yaw: number) => (Math.abs(wrapAngle(yaw)) <= Math.PI / 2 ? 0 : Math.PI);
