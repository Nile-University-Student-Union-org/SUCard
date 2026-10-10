import { describe, expect, it } from "vitest";
import { LanyardSim, TICK, stretchMax, type LanyardDims } from "./lanyard-sim";

const dims: LanyardDims = { anchor: [0, 4, 0], strapLength: 2.88, segments: 12, cardW: 3.2, cardH: 2.02, hangY: 1.4 };

function run(sim: LanyardSim, seconds: number) {
  for (let t = 0; t < seconds; t += TICK) sim.tick();
}

const at = (sim: LanyardSim, i: number) => [sim.pos[i * 3], sim.pos[i * 3 + 1], sim.pos[i * 3 + 2]];
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe("LanyardSim", () => {
  it("swings in and settles hanging straight down, facing front", () => {
    const sim = new LanyardSim(dims);
    sim.reset("swing-in");
    run(sim, 12);
    const hang = at(sim, sim.hang);
    expect(Math.abs(hang[0])).toBeLessThan(0.02);
    expect(hang[1]).toBeCloseTo(4 - 2.88, 1);
    const bl = at(sim, sim.bl);
    const br = at(sim, sim.br);
    expect(Math.abs(bl[2] - br[2])).toBeLessThan(0.02);
    expect(br[0]).toBeGreaterThan(bl[0]);
  });

  it("bounds elastic stretch and keeps the card rigid under a large pull", () => {
    const sim = new LanyardSim(dims);
    sim.startDrag(0, 0);
    sim.moveDrag(9, -9, 3);
    run(sim, 2);
    const lengths = Array.from({ length: sim.hang }, (_, i) => dist(at(sim, i), at(sim, i + 1)));
    expect(lengths.reduce((sum, len) => sum + len, 0)).toBeGreaterThan(dims.strapLength * 1.04);
    for (const length of lengths) expect(length).toBeLessThanOrEqual(sim.seg * (1 + stretchMax) + 0.0005);
    expect(dist(at(sim, sim.bl), at(sim, sim.br))).toBeCloseTo(dims.cardW, 1);
  });

  it("releases more quickly toward the anchor after a stronger pull", () => {
    const recoil = (pull: number) => {
      const sim = new LanyardSim(dims);
      sim.startDrag(0, 0);
      sim.moveDrag(0, pull, 0);
      run(sim, 1);
      const before = at(sim, sim.hang)[1];
      sim.endDrag();
      sim.tick();
      return (at(sim, sim.hang)[1] - before) / TICK;
    };
    expect(recoil(-8)).toBeGreaterThan(0);
    expect(recoil(-8)).toBeGreaterThan(recoil(-0.3) + 0.5);
  });

  it("damps the stretched strap and card back to rest", () => {
    const sim = new LanyardSim(dims);
    sim.startDrag(0, 0);
    sim.moveDrag(0, -8, 0);
    run(sim, 1);
    sim.endDrag();
    run(sim, 10);
    expect(dist(at(sim, sim.hang), [0, dims.anchor[1] - dims.strapLength, 0])).toBeLessThan(0.05);
    expect(sim.sleeping).toBe(true);
  });

  it("remains finite after an extreme pointer jump and release", () => {
    const sim = new LanyardSim(dims);
    sim.startDrag(0, 0);
    sim.moveDrag(1e8, -1e8, 1e8);
    run(sim, 0.5);
    sim.endDrag();
    run(sim, 2);
    expect([...sim.pos].every(Number.isFinite)).toBe(true);
  });

  it("follows the pointer and keeps momentum on release", () => {
    const sim = new LanyardSim(dims);
    sim.startDrag(0, 0);
    sim.moveDrag(1, 0.3, 0);
    run(sim, 1);
    const [w0, w1, w2] = sim.cardWeights(0, 0);
    const centre = [0, 1, 2].map((c) => w0 * sim.pos[sim.hang * 3 + c] + w1 * sim.pos[sim.bl * 3 + c] + w2 * sim.pos[sim.br * 3 + c]);
    expect(dist(centre, [1, 0.3, 0])).toBeLessThan(0.05);
    sim.endDrag();
    sim.tick();
    const before = at(sim, sim.bl)[0];
    run(sim, 0.1);
    expect(at(sim, sim.bl)[0]).toBeLessThan(before); // swings back toward the middle
  });

  it("holds the card steady and upright when grabbed by a corner and moved around", () => {
    const sim = new LanyardSim(dims);
    sim.startDrag(1.4, -0.9);
    for (let t = 0; t < 1.5; t += TICK) {
      sim.moveDrag(1.4 + Math.sin(t * 4) * 1.2, -1 + Math.cos(t * 3) * 0.6, 0);
      sim.tick();
    }
    sim.moveDrag(1.4, -1, 0);
    run(sim, 1);
    const bl = at(sim, sim.bl);
    const br = at(sim, sim.br);
    const hang = at(sim, sim.hang);
    expect(br[0] - bl[0]).toBeGreaterThan(dims.cardW * 0.95); // level, not flipped
    expect(hang[1]).toBeGreaterThan(bl[1]); // hang point stays on top
  });

  it("flips to show the back when tapped, and back again", () => {
    const sim = new LanyardSim(dims);
    run(sim, 1);
    sim.flip();
    run(sim, 4);
    expect(Math.abs(Math.abs(sim.yaw()) - Math.PI)).toBeLessThan(0.05);
    sim.flip();
    run(sim, 4);
    expect(Math.abs(sim.yaw())).toBeLessThan(0.05);
  });

  it("spins on a fast sideways flick and settles on a face", () => {
    const sim = new LanyardSim(dims);
    sim.startDrag(0.5, 0);
    for (let k = 0; k < 30; k++) {
      sim.moveDrag(-1.5 + k * 0.12, -0.28, 0);
      sim.tick();
    }
    sim.endDrag();
    let turned = 0;
    let last = sim.yaw();
    for (let t = 0; t < 6; t += TICK) {
      sim.tick();
      const d = sim.yaw() - last;
      turned += Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
      last = sim.yaw();
    }
    expect(turned).toBeGreaterThan(Math.PI / 2);
    const y = Math.abs(sim.yaw());
    expect(Math.min(y, Math.abs(y - Math.PI))).toBeLessThan(0.05);
  });

  it("keeps showing the back while held", () => {
    const sim = new LanyardSim(dims);
    sim.flip();
    run(sim, 4);
    sim.startDrag(0, 0);
    sim.moveDrag(0.8, 0, 0);
    run(sim, 2);
    expect(Math.abs(Math.abs(sim.yaw()) - Math.PI)).toBeLessThan(0.1);
  });

  it("sleeps once settled and wakes when touched", () => {
    const sim = new LanyardSim(dims);
    run(sim, 10);
    expect(sim.sleeping).toBe(true);
    sim.flip();
    sim.tick();
    expect(sim.sleeping).toBe(false);
    run(sim, 12);
    expect(sim.sleeping).toBe(true);
    sim.startDrag(0, 0);
    sim.moveDrag(0.5, 0, 0);
    run(sim, 0.5);
    expect(sim.sleeping).toBe(false);
  });
});
