import { admin, body, failed } from "@/lib/qr-studio/http";
import { previewStyleSchema } from "@/lib/qr-studio/validation";
import { renderQrSvgFromConfig } from "@/lib/qr-style/render-core";
import { nusuLogoDataUri } from "@/lib/qr-style/render";
import { svgToPng } from "@/lib/qr-style/png";
export const runtime = "nodejs";
export async function POST(request: Request) { try {
  await admin(request); const input = await body(request, previewStyleSchema);
  const config = structuredClone(input.config); if (input.transparent) config.background.type = "transparent";
  const svg = renderQrSvgFromConfig(input.payload ?? "NUSU1:0123456789ABCDEFGHJK", config, { logoDataUri: config.logo.type === "nusu" ? nusuLogoDataUri() : undefined });
  const headers = { "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="qr-preview.${input.format}"` };
  if (input.format === "svg") return new Response(svg, { headers: { ...headers, "Content-Type": "image/svg+xml" } });
  const px = Math.round((input.printSizeMm ?? config.output.printSizeMm) / 25.4 * (input.dpi ?? config.output.dpi));
  return new Response(new Uint8Array(svgToPng(svg, px)), { headers: { ...headers, "Content-Type": "image/png" } });
} catch (e) { return failed(e); } }
