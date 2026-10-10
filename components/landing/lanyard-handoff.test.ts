import { describe, expect, it } from "vitest";
import { quadToMatrix3d, signedArea, type Quad } from "./lanyard-handoff";

/** Applies a column-major matrix3d to a 2D point. */
function apply(m: number[], x: number, y: number) {
  const w = m[3] * x + m[7] * y + m[15];
  return [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w];
}

describe("quadToMatrix3d", () => {
  it("maps the box corners onto a perspective quad", () => {
    const quad: Quad = [
      [120, 80],
      [410, 110],
      [380, 330],
      [90, 290],
    ];
    const m = quadToMatrix3d(707, 516, quad);
    const corners = [apply(m, 0, 0), apply(m, 707, 0), apply(m, 707, 516), apply(m, 0, 516)];
    corners.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(quad[i][0], 6);
      expect(y).toBeCloseTo(quad[i][1], 6);
    });
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
