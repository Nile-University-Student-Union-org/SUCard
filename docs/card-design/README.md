# 3D landing card artwork

The hanging card on the landing page (`/`) can show your own front and back designs.

## Spec

- PNG, **2560 × 1615 px** (ID-1 card ratio 1.585 : 1), sRGB. Other sizes with the same ratio work; they're scaled.
- One file for the front, one for the back. Use `card-template.png` in this folder as a guide layer.
- The corners are rounded (radius 136 px) by the 3D model — extend your background into them.
- A slot is punched at the top centre and a metal ring hangs in front of it: keep **x 1020–1540, y 0–240** free of text and logos.
- Keep text and logos inside the 120 px safe margin.
- No transparency needed; transparent areas show as the navy card body.

## Installing a design

1. Save the files as `public/card/front.png` and `public/card/back.png`.
2. In `components/landing/card-art.ts` set:

   ```ts
   export const CARD_ART = { front: "/card/front.png", back: "/card/back.png" };
   ```

Leave either value `null` to keep the built-in design for that side.
