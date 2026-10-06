import "server-only";
import { ZipArchive } from "archiver";
import { Readable } from "node:stream";
import type { ExportOptions } from "./types";
import type { getBatchWithCards } from "./batches";
import { buildQrPayload, formatSerial } from "./token";
import { renderQrSvg } from "@/lib/qr-style/render";
import { svgToPng } from "@/lib/qr-style/png";

type FoundBatch = NonNullable<Awaited<ReturnType<typeof getBatchWithCards>>>;
function csv(value: string): string { return `"${value.replaceAll('"', '""')}"`; }
export function streamBatchZip(batch: FoundBatch, options: ExportOptions): Readable {
  const zip = new ZipArchive({ zlib: { level: 6 } });
  const append = async (data: string | Buffer, name: string, store = false) => {
    const done = new Promise<void>((resolve, reject) => {
      const onEntry = () => { zip.off("error", onError); resolve(); };
      const onError = (error: Error) => { zip.off("entry", onEntry); reject(error); };
      zip.once("entry", onEntry);
      zip.once("error", onError);
    });
    zip.append(data, { name, store });
    await done;
  };
  void (async () => {
    try {
      await append(`Batch ${batch.batch.number}: ${batch.batch.label} (${batch.batch.count} cards)\nQR content format NUSU1:<code>\nGenerated at: ${new Date().toISOString()}\n`, "README.txt");
      const manifest = ["serial,qr_content,svg_file,png_file"];
      for (const card of batch.cards) {
        const serial = formatSerial(card.serialNumber), payload = buildQrPayload(card.token);
        const svgFile = options.svg ? `qr/svg/${serial}.svg` : "";
        const pngFile = options.png ? `qr/png/${serial}.png` : "";
        manifest.push([serial, payload, svgFile, pngFile].map(csv).join(","));
      }
      await append(manifest.join("\n") + "\n", "manifest.csv");
      for (const card of batch.cards) {
        const serial = formatSerial(card.serialNumber);
        const svg = renderQrSvg(buildQrPayload(card.token));
        if (options.svg) await append(svg, `qr/svg/${serial}.svg`);
        if (options.png) await append(svgToPng(svg, options.pngSize), `qr/png/${serial}.png`, true);
      }
      await zip.finalize();
    } catch (error) { zip.abort(); zip.destroy(error as Error); }
  })();
  return zip;
}
