/**
 * Optional artwork for the 3D landing card. Put PNGs in public/card/ and point to them here;
 * leave null to use the built-in design. Spec: docs/card-design/README.md.
 */
export const CARD_ART: { front: string | null; back: string | null } = {
  front: "/card/front.png",
  back: "/card/back.png",
};

/**
 * The sample front artwork shows a student's name and ID; real SU Cards are generic (only the QR on the
 * back differs), so this area is always covered in the artwork's navy. Fractions of the face.
 */
export const SAMPLE_PATCH = { x: 0.065, y: 0.6, w: 0.543, h: 0.17, color: "#082441" };

/** The same patch as CSS, for DOM renderings of the front. */
export const SAMPLE_PATCH_STYLE = {
  left: `${SAMPLE_PATCH.x * 100}%`,
  top: `${SAMPLE_PATCH.y * 100}%`,
  width: `${SAMPLE_PATCH.w * 100}%`,
  height: `${SAMPLE_PATCH.h * 100}%`,
  background: SAMPLE_PATCH.color,
} as const;
