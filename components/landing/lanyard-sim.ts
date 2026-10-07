/**
 * Lanyard physics: a small XPBD (extended position-based dynamics) solver.
 *
 * The strap is a chain of light particles hanging from a fixed anchor. The card is a rigid triangle of three
 * heavy particles (the hang point at the crimp and the two bottom corners), so it swings, tilts and spins
 * like a real card. Everything is solved with many small substeps, which keeps the strap inextensible and the
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
/** Air drag, per second. */
const STRAP_DRAG = 3;
const CARD_DRAG = 0.45;
/** Friction in the ring and swivel: damps the card spinning/rocking about its own centre, not its swing. */
const CARD_SPIN_DRAG = 2.2;
/** Masses: a light strap and a card whose particles put its centre of mass at the card's centre. */
const STRAP_MASS = 0.05;
const CARD_CORNER_MASS = 1;
/** Compliances (inverse stiffness). 0 = rigid. */
const STRAP_BEND_COMPLIANCE = 4e-3; // strap resists sharp kinks
const CLAMP_COMPLIANCE = 6e-4; // strap leaves the crimp roughly straight
const FACING_COMPLIANCE = 0.6; // card drifts back to face the viewer
const HOLD_COMPLIANCE = 1.5e-4; // how firmly the held card follows the hand
/** Held card: pointer smoothing, how fast it rights itself, and how much it leans when moved sideways. */
const HOLD_SMOOTHING = 0.03; // s
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
    const { cardW: w, cardH: h, hangY } = this.dims;
    this.grab = {
      local: [
        [-x, hangY - y, 0],
        [-w / 2 - x, -h / 2 - y, 0],
        [w / 2 - x, -h / 2 - y, 0],
      ],
      q: this.cardQuat(),
      raw: [...at],
      hand: [...at],
      vel: [0, 0, 0],
      targets: [[...at], [...at], [...at]],
    };
  }

  moveDrag(x: number, y: number, z: number) {
    if (this.grab) this.grab.raw = [x, y, z];
  }

  endDrag() {
    this.grab = null;
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
    const follow = 1 - Math.exp(-TICK / HOLD_SMOOTHING);
    const before = g.hand;
    g.hand = before.map((v, c) => v + (g.raw[c] - v) * follow) as Vec;
    const vk = 1 - Math.exp(-TICK / 0.08);
    g.vel = g.vel.map((v, c) => v + ((g.hand[c] - before[c]) / TICK - v) * vk) as Vec;

    const lean = Math.max(-HOLD_MAX_LEAN, Math.min(HOLD_MAX_LEAN, -g.vel[0] * HOLD_LEAN));
    const upright: Quat = [0, 0, Math.sin(lean / 2), Math.cos(lean / 2)];
    g.q = nlerp(g.q, upright, 1 - Math.exp(-TICK / HOLD_UPRIGHT));

    g.targets = g.local.map((l) => add(g.hand, rotate(g.q, l)));
    // Never ask for more than the strap allows; otherwise hand and strap fight and the card shakes.
    const [ax, ay, az] = this.dims.anchor;
    const toHang = sub(g.targets[0], [ax, ay, az]);
    const over = Math.hypot(...toHang) - this.dims.strapLength * 0.995;
    if (over > 0) {
      const shift = scale(normalize(toHang), -over);
      g.targets = g.targets.map((t) => add(t, shift));
      g.hand = add(g.hand, shift);
    }
  }

  /** Advance one fixed tick. */
  tick() {
    this.tickStart.set(this.pos);
    if (this.grab) this.updateHold(this.grab);
    const dt = TICK / SUBSTEPS;
    for (let s = 0; s < SUBSTEPS; s++) this.substep(dt);
    if (!this.healthy()) this.reset("hanging");
  }

  private substep(dt: number) {
    const { pos, prev, invMass } = this;
    this.dampCardSpin(dt);
    const maxStep = MAX_SPEED * dt;
    for (let i = 0; i < this.count; i++) {
      if (invMass[i] === 0) continue;
      const damp = Math.exp(-this.drag[i] * dt);
      const o = i * 3;
      let vx = (pos[o] - prev[o]) * damp;
      let vy = (pos[o + 1] - prev[o + 1]) * damp;
      let vz = (pos[o + 2] - prev[o + 2]) * damp;
      const v = Math.hypot(vx, vy, vz);
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
    // Strap: inextensible links, then a soft bend so it curves instead of kinking.
    for (let i = 0; i < this.hang; i++) this.solveDistance(i, i + 1, this.seg, 0);
    for (let i = 0; i < this.hang - 1; i++) this.solveDistance(i, i + 2, this.seg * 2, STRAP_BEND_COMPLIANCE * a, true);
    // Card: rigid triangle.
    for (const [i, j, len] of this.cardEdges) this.solveDistance(i, j, len, 0);
    // The crimp clamps the strap end, so the strap leaves the card along the card's "up".
    this.solveClamp(CLAMP_COMPLIANCE * a);
    if (!this.grab) this.solveFacing(FACING_COMPLIANCE * a);
  }

  private solveTarget(i: number, target: Vec, alpha: number) {
    const w = this.invMass[i];
    const k = w / (w + alpha);
    for (let c = 0; c < 3; c++) this.pos[i * 3 + c] += (target[c] - this.pos[i * 3 + c]) * k;
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

  private solveDistance(i: number, j: number, rest: number, alpha: number, onlyWhenShorter = false) {
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
    if (onlyWhenShorter && c >= 0) return;
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

  /** Weak twist spring: brings the bottom corners level in depth, so the card ends up facing front. */
  private solveFacing(alpha: number) {
    const { pos, invMass, bl, br } = this;
    const c = pos[br * 3 + 2] - pos[bl * 3 + 2];
    const lambda = -c / (invMass[bl] + invMass[br] + alpha);
    pos[br * 3 + 2] += lambda * invMass[br];
    pos[bl * 3 + 2] -= lambda * invMass[bl];
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
