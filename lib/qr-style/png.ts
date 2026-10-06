import { Resvg } from "@resvg/resvg-js";

export function svgToPng(svg: string, widthPx: number): Buffer {
  return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: widthPx } }).render().asPng());
}
