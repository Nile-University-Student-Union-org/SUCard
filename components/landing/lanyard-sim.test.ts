import { describe, expect, it } from "vitest";
import { LanyardSim, TICK, type LanyardDims } from "./lanyard-sim";

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

  it("keeps the strap inextensible and the card rigid while being yanked", () => {
    const sim = new LanyardSim(dims);
    sim.startDrag(0, 0);
    sim.moveDrag(9, -9, 3);
    run(sim, 2);
    for (let i = 0; i < sim.hang; i++) expect(dist(at(sim, i), at(sim, i + 1))).toBeLessThan(sim.seg * 1.03);
    expect(dist(at(sim, sim.bl), at(sim, sim.br))).toBeCloseTo(dims.cardW, 1);
  });

  it("follows the pointer and keeps momentum on release", () => {
    const sim = new LanyardSim(dims);
    sim.startDrag(0, 0);
    sim.moveDrag(1.5, 0, 0);
    run(sim, 1);
    const [w0, w1, w2] = sim.cardWeights(0, 0);
    const centre = [0, 1, 2].map((c) => w0 * sim.pos[sim.hang * 3 + c] + w1 * sim.pos[sim.bl * 3 + c] + w2 * sim.pos[sim.br * 3 + c]);
    expect(dist(centre, [1.5, 0, 0])).toBeLessThan(0.15);
    sim.endDrag();
    sim.tick();
    const before = at(sim, sim.bl)[0];
    run(sim, 0.1);
    expect(at(sim, sim.bl)[0]).toBeLessThan(before); // swings back toward the middle
  });
});
