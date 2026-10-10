import { describe, expect, it } from "vitest";
import { quadToAffine, signedArea, type Quad } from "./lanyard-handoff";

/** Applies a CSS matrix(a, b, c, d, e, f) to a 2D point. */
function apply(m: number[], x: number, y: number) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

describe("quadToAffine", () => {
  it("maps the box corners onto a parallelogram exactly", () => {
    const quad: Quad = [
      [120, 80],
      [410, 110],
      [380, 330],
      [90, 300],
    ];
    const m = quadToAffine(707, 516, quad);
    const corners = [apply(m, 0, 0), apply(m, 707, 0), apply(m, 707, 516), apply(m, 0, 516)];
    corners.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(quad[i][0], 6);
      expect(y).toBeCloseTo(quad[i][1], 6);
    });
  });

  it("stays bounded for a degenerate edge-on quad", () => {
    const m = quadToAffine(707, 516, [[100, 100], [101, 100], [101, 300], [100, 300]]);
    m.forEach((v) => expect(Math.abs(v)).toBeLessThan(1000));
  });

  it("tells a front-facing quad from a mirrored one", () => {
    const front: Quad = [
      [0, 0],
      [10, 0],
      [10, 5],
      [0, 5],
    ];
    expect(signedArea(front)).toBeGreaterThan(0);
    expect(signedArea([front[1], front[0], front[3], front[2]])).toBeLessThan(0);
  });
});
