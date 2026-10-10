/**
 * Shared-element handoff between the hero's WebGL card and the "How it works" stage card.
 * The hero scene registers a probe (the card's on-screen corners) and a switch to hide its card;
 * the How-it-works scroll engine drives a DOM card between the two.
 */

/** Screen points (CSS px, viewport space) of the card's TL, TR, BR, BL corners, as seen on its front. */
export type Quad = [number, number][];

export const lanyardHandoff: {
  probe: (() => Quad | null) | null;
  setDetached: ((detached: boolean) => void) | null;
} = { probe: null, setDetached: null };

/**
 * CSS matrix3d that maps a w x h box (transform-origin 0 0) onto an arbitrary quad: the projective
 * transform of a plane, so it reproduces a perspective-rendered card exactly.
 */
export function quadToMatrix3d(w: number, h: number, q: Quad) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1 || 1e-9;
  const g = (sx * dy2 - dx2 * sy) / den;
  const k = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + k * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + k * y3;
  return [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
}

/** Positive when the quad's corners run clockwise on screen, i.e. the card's front faces the viewer. */
export function signedArea(q: Quad) {
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = q[i];
    const [bx, by] = q[(i + 1) % 4];
    s += ax * by - bx * ay;
  }
  return s / 2;
}
