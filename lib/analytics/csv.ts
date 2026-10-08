export function csvCell(value: unknown): string {
  let cell = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(cell)) cell = `'${cell}`;
  return `"${cell.replaceAll('"', '""')}"`;
}
export function csvDocument(headers: string[], rows: Iterable<unknown[]>): string {
  return "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
export function csvResponse(filename: string, headers: string[], rows: unknown[][]): Response {
  return new Response(csvDocument(headers, rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
}
export function csvStreamResponse(filename: string, headers: string[], rows: AsyncIterable<unknown[]>): Response {
  const encoder = new TextEncoder();
  const iterator = rows[Symbol.asyncIterator]();
  let first = true;
  return new Response(new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (first) {
        first = false;
        controller.enqueue(encoder.encode("\uFEFF" + headers.map(csvCell).join(",") + "\r\n"));
        return;
      }
      const next = await iterator.next();
      if (next.done) controller.close();
      else controller.enqueue(encoder.encode(next.value.map(csvCell).join(",") + "\r\n"));
    },
    async cancel() { await iterator.return?.(); },
  }), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
}
