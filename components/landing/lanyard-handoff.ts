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
 * CSS matrix() of the parallelogram that best fits the quad (averaged opposite edges). Unlike the
 * projective fit it can never blow up when the quad is skewed or nearly degenerate mid-flight.
 */
export function quadToAffine(w: number, h: number, q: Quad) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const ux = (x1 - x0 + x2 - x3) / 2;
  const uy = (y1 - y0 + y2 - y3) / 2;
  const vx = (x3 - x0 + x2 - x1) / 2;
  const vy = (y3 - y0 + y2 - y1) / 2;
  const cx = (x0 + x1 + x2 + x3) / 4;
  const cy = (y0 + y1 + y2 + y3) / 4;
  return [ux / w, uy / w, vx / h, vy / h, cx - (ux + vx) / 2, cy - (uy + vy) / 2];
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
