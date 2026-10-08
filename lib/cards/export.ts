import "server-only";
import { ZipArchive } from "archiver";
import { Readable } from "node:stream";
import type { ExportOptions } from "./types";
import { batchCards, type getBatchWithCards } from "./batches";
import { buildQrPayload, formatSerial } from "./token";
import { renderQrSvg } from "@/lib/qr-style/render";
import { nusuLogoDataUri } from "@/lib/qr-style/render";
import { renderQrSvgFromConfig } from "@/lib/qr-style/render-core";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { svgToPng } from "@/lib/qr-style/png";

type FoundBatch = NonNullable<Awaited<ReturnType<typeof getBatchWithCards>>>;
function csv(value: string): string { return `"${value.replaceAll('"', '""')}"`; }
export function streamBatchZip(batch: FoundBatch, options: ExportOptions, config?: QrStyleConfig): Readable {
  const zip = new ZipArchive({ zlib: { level: 6 } });
  const append = async (data: string | Buffer | Readable, name: string, store = false) => {
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
      const manifest = Readable.from((async function* () {
        yield "serial,qr_content,svg_file,png_file\n";
        for await (const card of batchCards(batch.batch.id)) {
          const serial = formatSerial(card.serialNumber), payload = buildQrPayload(card.token);
          const svgFile = options.svg ? `qr/svg/${serial}.svg` : "";
          const pngFile = options.png ? `qr/png/${serial}.png` : "";
          yield [serial, payload, svgFile, pngFile].map(csv).join(",") + "\n";
        }
      })());
      await append(manifest, "manifest.csv");
      for await (const card of batch.cards) {
        const serial = formatSerial(card.serialNumber);
        const svg = config ? renderQrSvgFromConfig(buildQrPayload(card.token), config, { logoDataUri: config.logo.type === "nusu" ? nusuLogoDataUri() : undefined }) : renderQrSvg(buildQrPayload(card.token));
        if (options.svg) await append(svg, `qr/svg/${serial}.svg`);
        if (options.png) await append(svgToPng(svg, options.pngSize), `qr/png/${serial}.png`, true);
      }
      await zip.finalize();
    } catch (error) { zip.abort(); zip.destroy(error as Error); }
  })();
  return zip;
}
