import jsQR from "jsqr";
import type { QrStyleConfig } from "@/lib/qr-style/config";
import { renderQrSvgFromConfig } from "@/lib/qr-style/render-core";

export interface ScanConditionResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  score: number;
  details?: string;
}

export interface LiveScanTestResult {
  score: number;
  passed: boolean;
  conditions: ScanConditionResult[];
  testedAt: number;
}

async function svgToImage(svgString: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function decodeCanvas(
  canvas: HTMLCanvasElement,
  expectedPayload: string
): { passed: boolean; detected?: string } {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { passed: false };
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  if (code && code.data === expectedPayload) {
    return { passed: true, detected: code.data };
  }
  return { passed: false, detected: code?.data };
}

export async function runLiveScanTest(
  config: QrStyleConfig,
  payload: string,
  logoDataUri?: string
): Promise<LiveScanTestResult> {
  const svg = renderQrSvgFromConfig(payload, config, {
    logoDataUri: config.logo.type === "nusu" ? logoDataUri : undefined,
  });

  const img = await svgToImage(svg);
  const conditions: ScanConditionResult[] = [];

  // 1. Standard Print (Actual size @ 300 DPI)
  try {
    const printSizeMm = config.output.printSizeMm || 25;
    const px = Math.max(120, Math.round((printSizeMm / 25.4) * 300));
    const canvas = document.createElement("canvas");
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = config.background.type === "solid" ? config.background.color : "#FFFFFF";
    ctx.fillRect(0, 0, px, px);
    ctx.drawImage(img, 0, 0, px, px);

    const res = decodeCanvas(canvas, payload);
    conditions.push({
      id: "standard",
      name: "Standard 300 DPI",
      description: `Rasterized at configured ${printSizeMm} mm @ 300 DPI (${px}px)`,
      passed: res.passed,
      score: res.passed ? 20 : 0,
    });
  } catch {
    conditions.push({
      id: "standard",
      name: "Standard 300 DPI",
      description: "Standard resolution print simulation",
      passed: false,
      score: 0,
    });
  }

  // 2. Small Size (15 mm @ 150 DPI ~88px)
  try {
    const px = Math.round((15 / 25.4) * 150); // ~88px
    const canvas = document.createElement("canvas");
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = config.background.type === "solid" ? config.background.color : "#FFFFFF";
    ctx.fillRect(0, 0, px, px);
    ctx.drawImage(img, 0, 0, px, px);

    const res = decodeCanvas(canvas, payload);
    conditions.push({
      id: "small",
      name: "Compact 15 mm",
      description: "Low-resolution / far-distance simulation (88px)",
      passed: res.passed,
      score: res.passed ? 20 : 0,
    });
  } catch {
    conditions.push({
      id: "small",
      name: "Compact 15 mm",
      description: "Low-resolution / far-distance simulation",
      passed: false,
      score: 0,
    });
  }

  // 3. 1px Defocus Blur
  try {
    const px = 280;
    const canvas = document.createElement("canvas");
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = config.background.type === "solid" ? config.background.color : "#FFFFFF";
    ctx.fillRect(0, 0, px, px);
    ctx.filter = "blur(1px)";
    ctx.drawImage(img, 0, 0, px, px);
    ctx.filter = "none";

    const res = decodeCanvas(canvas, payload);
    conditions.push({
      id: "blur",
      name: "1px Lens Blur",
      description: "Slight out-of-focus camera capture simulation",
      passed: res.passed,
      score: res.passed ? 20 : 0,
    });
  } catch {
    conditions.push({
      id: "blur",
      name: "1px Lens Blur",
      description: "Slight out-of-focus camera capture simulation",
      passed: false,
      score: 0,
    });
  }

  // 4. Low Contrast / Dim Light (50% contrast, 80% brightness)
  try {
    const px = 280;
    const canvas = document.createElement("canvas");
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = config.background.type === "solid" ? config.background.color : "#FFFFFF";
    ctx.fillRect(0, 0, px, px);
    ctx.filter = "contrast(55%) brightness(85%)";
    ctx.drawImage(img, 0, 0, px, px);
    ctx.filter = "none";

    const res = decodeCanvas(canvas, payload);
    conditions.push({
      id: "contrast",
      name: "Low Lighting & Contrast",
      description: "Dim lighting environment simulation (55% contrast)",
      passed: res.passed,
      score: res.passed ? 20 : 0,
    });
  } catch {
    conditions.push({
      id: "contrast",
      name: "Low Lighting & Contrast",
      description: "Dim lighting environment simulation",
      passed: false,
      score: 0,
    });
  }

  // 5. 10° Camera Tilt / Rotation
  try {
    const px = 260;
    const boxSize = Math.round(px * 1.35);
    const canvas = document.createElement("canvas");
    canvas.width = boxSize;
    canvas.height = boxSize;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = config.background.type === "solid" ? config.background.color : "#FFFFFF";
    ctx.fillRect(0, 0, boxSize, boxSize);

    ctx.save();
    ctx.translate(boxSize / 2, boxSize / 2);
    ctx.rotate((10 * Math.PI) / 180);
    ctx.drawImage(img, -px / 2, -px / 2, px, px);
    ctx.restore();

    const res = decodeCanvas(canvas, payload);
    conditions.push({
      id: "rotation",
      name: "10° Angled Scan",
      description: "Handheld camera tilt / angled scanner simulation",
      passed: res.passed,
      score: res.passed ? 20 : 0,
    });
  } catch {
    conditions.push({
      id: "rotation",
      name: "10° Angled Scan",
      description: "Handheld camera tilt simulation",
      passed: false,
      score: 0,
    });
  }

  const totalScore = conditions.reduce((sum, c) => sum + c.score, 0);

  return {
    score: totalScore,
    passed: totalScore >= 60,
    conditions,
    testedAt: Date.now(),
  };
}
