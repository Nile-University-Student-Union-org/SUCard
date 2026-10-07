import * as THREE from "three";
import QRCode from "qrcode";

/**
 * Generates front card texture at 2048x1292 resolution (ISO ID-1 ratio 1.585)
 * Deep navy/blue brand palette with high contrast, large Anton typography,
 * SU logo, STUDENT badge, holographic strip, and high-contrast QR code.
 * (No chip, no NFC waves, no year/expiry).
 */
export function createCardFrontTexture(): {
  texture: THREE.CanvasTexture;
  cleanup: () => void;
} {
  const width = 2048;
  const height = 1292;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });

  if (!ctx) {
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    return { texture: fallbackTexture, cleanup: () => {} };
  }

  // Texture setup
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  let isDisposed = false;
  let cachedLogoImg: HTMLImageElement | null = null;

  const renderCanvas = () => {
    if (isDisposed) return;

    // 1. Base Gradient (Deep NUSU Navy to SU Blue)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#081E38"); // Deep midnight navy
    bgGrad.addColorStop(0.45, "#0F3056"); // NUSU primary navy
    bgGrad.addColorStop(1, "#0F548D"); // SU blue
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Soft Sky Accent Radial Glow (adds depth without washing out)
    const radialGlow = ctx.createRadialGradient(
      width * 0.72,
      height * 0.28,
      40,
      width * 0.72,
      height * 0.28,
      850
    );
    radialGlow.addColorStop(0, "rgba(1, 139, 206, 0.45)");
    radialGlow.addColorStop(0.5, "rgba(1, 139, 206, 0.14)");
    radialGlow.addColorStop(1, "rgba(1, 139, 206, 0)");
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Security Guilloche / Wave Micro-lines
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      const offset = i * 75;
      ctx.moveTo(0, offset);
      ctx.bezierCurveTo(
        width * 0.35,
        offset + 140,
        width * 0.65,
        offset - 140,
        width,
        offset + 90
      );
      ctx.stroke();
    }
    ctx.restore();

    // 4. Subtle Isometric Micro-dot Grid
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    const dotSpacing = 52;
    for (let x = 40; x < width - 40; x += dotSpacing) {
      for (let y = 40; y < height - 40; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 5. Holographic Iridescent Security Foil Strip (Left Edge)
    const holoX = 80;
    const holoW = 95;
    const holoGrad = ctx.createLinearGradient(holoX, 0, holoX + holoW, height);
    holoGrad.addColorStop(0, "rgba(56, 189, 248, 0.6)");
    holoGrad.addColorStop(0.2, "rgba(167, 243, 208, 0.65)");
    holoGrad.addColorStop(0.4, "rgba(251, 191, 36, 0.6)");
    holoGrad.addColorStop(0.6, "rgba(244, 114, 182, 0.65)");
    holoGrad.addColorStop(0.8, "rgba(129, 140, 248, 0.65)");
    holoGrad.addColorStop(1, "rgba(56, 189, 248, 0.6)");

    ctx.save();
    ctx.fillStyle = holoGrad;
    ctx.fillRect(holoX, 0, holoW, height);

    // Diagonal foil shimmer patterns
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 3;
    for (let y = -200; y < height + 200; y += 36) {
      ctx.beginPath();
      ctx.moveTo(holoX, y);
      ctx.lineTo(holoX + holoW, y + 70);
      ctx.stroke();
    }
    ctx.restore();

    // 6. Top Header: Nile University Student Union Logo
    const logoX = 220;
    const logoY = 100;
    if (cachedLogoImg && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
      const logoAspect = cachedLogoImg.naturalWidth / cachedLogoImg.naturalHeight;
      const logoH = 125;
      const logoW = logoH * logoAspect;
      ctx.drawImage(cachedLogoImg, logoX, logoY, logoW, logoH);
    } else {
      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 52px sans-serif";
      ctx.fillText("NILE UNIVERSITY", logoX, logoY + 55);
      ctx.fillStyle = "#018BCE";
      ctx.font = "bold 34px sans-serif";
      ctx.fillText("STUDENT UNION", logoX, logoY + 105);
      ctx.restore();
    }

    // 7. Prominent Card Heading: "SU CARD" in Anton Display
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(1, 139, 206, 0.65)";
    ctx.shadowBlur = 24;
    ctx.font = "900 250px 'Anton', -apple-system, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("SU CARD", 215, 600);
    ctx.restore();

    // 8. Student Status Pill Badge (Bold & Clean)
    const pillX = 220;
    const pillY = 680;
    const pillW = 310;
    const pillH = 86;

    ctx.save();
    ctx.fillStyle = "rgba(1, 139, 206, 0.35)";
    ctx.strokeStyle = "#018BCE";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 42px 'Poppins', -apple-system, sans-serif";
    ctx.letterSpacing = "5px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("STUDENT", pillX + pillW / 2, pillY + pillH / 2);
    ctx.restore();

    // 9. Student Union Text Labels
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 40px 'Poppins', -apple-system, sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText("NILE UNIVERSITY STUDENT UNION", 220, 890);

    ctx.fillStyle = "#8FB8E8";
    ctx.font = "600 30px 'Poppins', -apple-system, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("DIGITAL VERIFICATION & PARTNER SAVINGS", 220, 950);
    ctx.restore();

    // 10. High-Contrast QR Code Container (Right Side)
    const qrBoxX = 1360;
    const qrBoxY = 380;
    const qrBoxSize = 560;
    const qrBoxRadius = 42;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, qrBoxRadius);
    ctx.fill();
    ctx.restore();

    try {
      const qr = QRCode.create("NUSU1:DEMO0000000000000000", {
        errorCorrectionLevel: "H",
      });
      const moduleCount = qr.modules.size;
      const qrPadding = 52;
      const qrInnerSize = qrBoxSize - qrPadding * 2;
      const cellSize = qrInnerSize / moduleCount;

      ctx.save();
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.modules.get(r, c)) {
            const isFinder =
              (r < 7 && c < 7) ||
              (r < 7 && c >= moduleCount - 7) ||
              (r >= moduleCount - 7 && c < 7);

            ctx.fillStyle = isFinder ? "#018BCE" : "#081E38";
            const px = qrBoxX + qrPadding + c * cellSize;
            const py = qrBoxY + qrPadding + r * cellSize;
            ctx.beginPath();
            ctx.roundRect(px, py, cellSize * 0.96, cellSize * 0.96, cellSize * 0.25);
            ctx.fill();
          }
        }
      }

      // Center NUSU emblem in QR code
      const centerSize = 76;
      const centerX = qrBoxX + qrBoxSize / 2 - centerSize / 2;
      const centerY = qrBoxY + qrBoxSize / 2 - centerSize / 2;
      ctx.fillStyle = "#081E38";
      ctx.beginPath();
      ctx.roundRect(centerX, centerY, centerSize, centerSize, 14);
      ctx.fill();
      ctx.strokeStyle = "#018BCE";
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 28px 'Poppins', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SU", centerX + centerSize / 2, centerY + centerSize / 2);
      ctx.restore();
    } catch {
      // QR fallback
    }

    // Label below QR
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px 'Poppins', sans-serif";
    ctx.letterSpacing = "4px";
    ctx.textAlign = "center";
    ctx.fillText("SCAN TO VERIFY", qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 70);
    ctx.restore();

    // 11. Top Lanyard Slot Outline
    const slotW = 300;
    const slotH = 44;
    const slotX = width / 2 - slotW / 2;
    const slotY = 28;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(slotX, slotY, slotW, slotH, slotH / 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    texture.needsUpdate = true;
  };

  renderCanvas();

  if (typeof window !== "undefined") {
    if (document.fonts) {
      document.fonts.ready.then(() => {
        if (!isDisposed) renderCanvas();
      });
    }

    const logo = new window.Image();
    logo.crossOrigin = "anonymous";
    logo.src = "/brand/su-logo-white@hd.png";
    logo.onload = () => {
      if (!isDisposed) {
        cachedLogoImg = logo;
        renderCanvas();
      }
    };
  }

  return {
    texture,
    cleanup: () => {
      isDisposed = true;
      texture.dispose();
    },
  };
}

/**
 * Generates back card texture at 2048x1292 resolution (ISO ID-1 ratio 1.585)
 */
export function createCardBackTexture(): {
  texture: THREE.CanvasTexture;
  cleanup: () => void;
} {
  const width = 2048;
  const height = 1292;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });

  if (!ctx) {
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    return { texture: fallbackTexture, cleanup: () => {} };
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  let isDisposed = false;

  const renderCanvas = () => {
    if (isDisposed) return;

    // 1. Midnight Navy Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#081424");
    bgGrad.addColorStop(0.5, "#0A2240");
    bgGrad.addColorStop(1, "#0F3056");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Watermark Repeating NUSU Icon Motif
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.font = "bold 64px 'Anton', sans-serif";
    ctx.textAlign = "center";
    for (let x = 120; x < width; x += 320) {
      for (let y = 380; y < height; y += 180) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.25);
        ctx.fillText("NUSU", 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();

    // 3. Magnetic Stripe
    const magY = 120;
    const magH = 210;
    const magGrad = ctx.createLinearGradient(0, magY, 0, magY + magH);
    magGrad.addColorStop(0, "#090D14");
    magGrad.addColorStop(0.5, "#151D2A");
    magGrad.addColorStop(1, "#080B10");
    ctx.fillStyle = magGrad;
    ctx.fillRect(0, magY, width, magH);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, magY + 40);
    ctx.lineTo(width, magY + 40);
    ctx.stroke();

    // 4. Signature & Authorization Panel
    const sigX = 140;
    const sigY = 400;
    const sigW = 1280;
    const sigH = 150;

    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(sigX, sigY, sigW, sigH);

    ctx.save();
    ctx.strokeStyle = "rgba(15, 48, 86, 0.12)";
    ctx.lineWidth = 2;
    for (let x = -200; x < sigW + 200; x += 30) {
      ctx.beginPath();
      ctx.moveTo(sigX + x, sigY);
      ctx.lineTo(sigX + x + 80, sigY + sigH);
      ctx.stroke();
    }
    ctx.restore();

    // Security Code Box
    const cvcX = sigX + sigW + 40;
    const cvcW = 440;
    const cvcH = sigH;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(cvcX, sigY, cvcW, cvcH);
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 3;
    ctx.strokeRect(cvcX, sigY, cvcW, cvcH);

    ctx.fillStyle = "#0F3056";
    ctx.font = "italic bold 44px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NUSU-VERIFIED", cvcX + cvcW / 2, sigY + cvcH / 2);

    // 5. Terms & Instructions
    ctx.save();
    ctx.textAlign = "left";
    ctx.fillStyle = "#018BCE";
    ctx.font = "bold 34px 'Poppins', sans-serif";
    ctx.fillText("NILE UNIVERSITY STUDENT UNION — CARDHOLDER PRIVILEGES", 140, 640);

    ctx.fillStyle = "#E2E8F0";
    ctx.font = "500 28px 'Poppins', sans-serif";
    ctx.letterSpacing = "0.5px";

    const instructions = [
      "• Show this card at participating campus venues & partner stores.",
      "• Valid only for the registered Nile University student.",
      "• Add to Google Wallet for instant offline QR verification.",
      "• Inquiries & partner directory: visit nusu.org or scan the front QR code.",
    ];

    let lineY = 705;
    for (const line of instructions) {
      ctx.fillText(line, 140, lineY);
      lineY += 50;
    }
    ctx.restore();

    // 6. Union Footer & Security Seal
    ctx.save();
    ctx.fillStyle = "rgba(143, 184, 232, 0.75)";
    ctx.font = "600 24px 'Poppins', sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(
      "NILE UNIVERSITY STUDENT UNION • CAIRO, EGYPT • ALL RIGHTS RESERVED",
      140,
      1160
    );

    const sealX = width - 300;
    const sealY = 1040;
    const sealR = 90;

    const sealGrad = ctx.createRadialGradient(
      sealX,
      sealY,
      10,
      sealX,
      sealY,
      sealR
    );
    sealGrad.addColorStop(0, "rgba(56, 189, 248, 0.5)");
    sealGrad.addColorStop(0.7, "rgba(15, 84, 141, 0.6)");
    sealGrad.addColorStop(1, "rgba(1, 139, 206, 0.3)");

    ctx.fillStyle = sealGrad;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#018BCE";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px 'Poppins', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("OFFICIAL", sealX, sealY - 20);
    ctx.fillText("NUSU SEAL", sealX, sealY + 15);
    ctx.restore();

    // 7. Top Lanyard Slot Indicator
    const slotW = 300;
    const slotH = 44;
    const slotX = width / 2 - slotW / 2;
    const slotY = 28;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(slotX, slotY, slotW, slotH, slotH / 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    texture.needsUpdate = true;
  };

  renderCanvas();

  if (typeof window !== "undefined" && document.fonts) {
    document.fonts.ready.then(() => {
      if (!isDisposed) renderCanvas();
    });
  }

  return {
    texture,
    cleanup: () => {
      isDisposed = true;
      texture.dispose();
    },
  };
}

/**
 * Generates lanyard fabric strap texture with woven fabric details
 * and repeated "NUSU" / "NILE UNIVERSITY" branding pattern.
 */
export function createLanyardStrapTexture(): {
  texture: THREE.CanvasTexture;
  cleanup: () => void;
} {
  const width = 1024;
  const height = 128;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });

  if (!ctx) {
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    return { texture: fallbackTexture, cleanup: () => {} };
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 1);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  let isDisposed = false;

  const renderCanvas = () => {
    if (isDisposed) return;

    // 1. Navy Fabric Base
    ctx.fillStyle = "#0B213D";
    ctx.fillRect(0, 0, width, height);

    // 2. Micro Weave Fabric Texture
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    for (let x = 0; x < width; x += 4) {
      ctx.fillRect(x, 0, 2, height);
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }
    ctx.restore();

    // 3. Stitched Borders (Top and Bottom)
    ctx.save();
    ctx.strokeStyle = "#018BCE";
    ctx.lineWidth = 3.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(width, 8);
    ctx.moveTo(0, height - 8);
    ctx.lineTo(width, height - 8);
    ctx.stroke();
    ctx.restore();

    // 4. Repeated Branding Pattern
    ctx.save();
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    // Segment 1: Star & NUSU
    ctx.fillStyle = "#018BCE";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("★", 100, height / 2);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 48px 'Anton', -apple-system, sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText("NUSU", 260, height / 2);

    // Segment 2: Star & NILE UNIVERSITY
    ctx.fillStyle = "#018BCE";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("★", 420, height / 2);

    ctx.fillStyle = "#8FB8E8";
    ctx.font = "700 36px 'Poppins', sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("NILE UNIVERSITY", 640, height / 2);

    // Segment 3: Star & SU CARD
    ctx.fillStyle = "#018BCE";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("★", 860, height / 2);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 48px 'Anton', -apple-system, sans-serif";
    ctx.fillText("SU CARD", 960, height / 2);

    ctx.restore();

    texture.needsUpdate = true;
  };

  renderCanvas();

  if (typeof window !== "undefined" && document.fonts) {
    document.fonts.ready.then(() => {
      if (!isDisposed) renderCanvas();
    });
  }

  return {
    texture,
    cleanup: () => {
      isDisposed = true;
      texture.dispose();
    },
  };
}
