import { readFile } from "node:fs/promises";
import path from "node:path";
export default async function PrivacyPage() {
  const text = await readFile(path.join(process.cwd(), "docs/PRIVACY-NOTICE.md"), "utf8");
  return <main className="mx-auto max-w-3xl p-8"><h1 className="text-3xl font-bold">SU Card privacy notice</h1>
    {text.split(/\n\s*\n/).slice(1).map((paragraph, index) => <p className="mt-5" key={index}>{paragraph}</p>)}</main>;
}
