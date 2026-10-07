import * as THREE from "three";
import QRCode from "qrcode";

/**
 * Generates front card texture at 2048x1292 resolution (ISO ID-1 ratio 1.585)
 * Returns a THREE.CanvasTexture with max anisotropy and crisp mipmapping.
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

    // 1. Background Gradient (NUSU Navy to SU Blue)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#07172F"); // Deep midnight navy
    bgGrad.addColorStop(0.45, "#0F3056"); // NUSU primary navy
    bgGrad.addColorStop(1, "#0F548D"); // SU blue
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Soft Sky Accent Radial Glow
    const radialGlow = ctx.createRadialGradient(
      width * 0.7,
      height * 0.25,
      50,
      width * 0.7,
      height * 0.25,
      900
    );
    radialGlow.addColorStop(0, "rgba(1, 139, 206, 0.45)");
    radialGlow.addColorStop(0.5, "rgba(1, 139, 206, 0.15)");
    radialGlow.addColorStop(1, "rgba(1, 139, 206, 0)");
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Security Guilloche / Micro-mesh curves
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      const offset = i * 65;
      ctx.moveTo(0, offset);
      ctx.bezierCurveTo(
        width * 0.3,
        offset + 120,
        width * 0.7,
        offset - 120,
        width,
        offset + 80
      );
      ctx.stroke();
    }
    ctx.restore();

    // 4. Subtle Isometric Micro-dot Grid
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    const dotSpacing = 48;
    for (let x = 40; x < width - 40; x += dotSpacing) {
      for (let y = 40; y < height - 40; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 5. Holographic Iridescent Vertical Security Strip
    const holoX = 140;
    const holoW = 90;
    const holoGrad = ctx.createLinearGradient(holoX, 0, holoX + holoW, height);
    holoGrad.addColorStop(0, "rgba(56, 189, 248, 0.45)");
    holoGrad.addColorStop(0.2, "rgba(167, 243, 208, 0.5)");
    holoGrad.addColorStop(0.4, "rgba(251, 191, 36, 0.45)");
    holoGrad.addColorStop(0.6, "rgba(244, 114, 182, 0.5)");
    holoGrad.addColorStop(0.8, "rgba(129, 140, 248, 0.5)");
    holoGrad.addColorStop(1, "rgba(56, 189, 248, 0.45)");

    ctx.save();
    ctx.fillStyle = holoGrad;
    ctx.fillRect(holoX, 0, holoW, height);

    // Diagonal shimmer lines over holographic strip
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2.5;
    for (let y = -200; y < height + 200; y += 32) {
      ctx.beginPath();
      ctx.moveTo(holoX, y);
      ctx.lineTo(holoX + holoW, y + 60);
      ctx.stroke();
    }
    ctx.restore();

    // 6. Header: Nile University Student Union Logo
    const logoX = 270;
    const logoY = 90;
    if (cachedLogoImg && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
      const logoAspect = cachedLogoImg.naturalWidth / cachedLogoImg.naturalHeight;
      const logoH = 110;
      const logoW = logoH * logoAspect;
      ctx.drawImage(cachedLogoImg, logoX, logoY, logoW, logoH);
    } else {
      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText("NILE UNIVERSITY", logoX, logoY + 45);
      ctx.fillStyle = "#018BCE";
      ctx.font = "600 28px sans-serif";
      ctx.fillText("STUDENT UNION", logoX, logoY + 85);
      ctx.restore();
    }

    // 7. Contactless / NFC Wave Icon (Top Right)
    const nfcX = width - 260;
    const nfcY = 140;
    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.arc(nfcX, nfcY, r * 22, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();
    }
    ctx.fillStyle = "#018BCE";
    ctx.beginPath();
    ctx.arc(nfcX - 8, nfcY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 8. Physical Smart Chip Graphic (Left-Center)
    const chipX = 270;
    const chipY = 320;
    const chipW = 210;
    const chipH = 160;
    const chipR = 18;

    const chipGrad = ctx.createLinearGradient(
      chipX,
      chipY,
      chipX + chipW,
      chipY + chipH
    );
    chipGrad.addColorStop(0, "#E5C158");
    chipGrad.addColorStop(0.3, "#FFF1A8");
    chipGrad.addColorStop(0.7, "#B88E12");
    chipGrad.addColorStop(1, "#E5C158");

    ctx.save();
    ctx.fillStyle = chipGrad;
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, chipW, chipH, chipR);
    ctx.fill();

    ctx.strokeStyle = "#7A5A05";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(chipX, chipY + chipH / 2);
    ctx.lineTo(chipX + chipW, chipY + chipH / 2);
    ctx.stroke();
    ctx.strokeRect(chipX + 55, chipY + 35, chipW - 110, chipH - 70);
    ctx.beginPath();
    ctx.moveTo(chipX + 55, chipY + chipH / 2);
    ctx.lineTo(chipX + chipW - 55, chipY + chipH / 2);
    ctx.moveTo(chipX + 55, chipY);
    ctx.lineTo(chipX + 55, chipY + 35);
    ctx.moveTo(chipX + chipW - 55, chipY);
    ctx.lineTo(chipX + chipW - 55, chipY + 35);
    ctx.moveTo(chipX + 55, chipY + chipH - 35);
    ctx.lineTo(chipX + 55, chipY + chipH);
    ctx.moveTo(chipX + chipW - 55, chipY + chipH - 35);
    ctx.lineTo(chipX + chipW - 55, chipY + chipH);
    ctx.stroke();
    ctx.restore();

    // 9. Card Title: "SU CARD" in Anton Display Style
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(1, 139, 206, 0.7)";
    ctx.shadowBlur = 22;
    ctx.font = "900 170px var(--font-heading), 'Anton', -apple-system, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("SU CARD", 270, 710);
    ctx.restore();

    // Subheading: "OFFICIAL MEMBERSHIP"
    ctx.save();
    ctx.fillStyle = "#8FB8E8";
    ctx.font = "700 36px var(--font-sans), 'Poppins', sans-serif";
    ctx.letterSpacing = "5px";
    ctx.fillText("OFFICIAL NUSU MEMBERSHIP", 275, 780);
    ctx.restore();

    // 10. Student Status Pill Badge (Bottom-Left)
    const pillX = 270;
    const pillY = 880;
    const pillW = 260;
    const pillH = 75;

    ctx.save();
    ctx.fillStyle = "rgba(1, 139, 206, 0.25)";
    ctx.strokeStyle = "#018BCE";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 34px var(--font-sans), 'Poppins', sans-serif";
    ctx.letterSpacing = "4px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("STUDENT", pillX + pillW / 2, pillY + pillH / 2);
    ctx.restore();

    // Additional Student Union details
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "600 32px var(--font-sans), 'Poppins', sans-serif";
    ctx.letterSpacing = "1px";
    ctx.fillText("NILE UNIVERSITY STUDENT UNION", 275, 1020);

    ctx.fillStyle = "rgba(143, 184, 232, 0.9)";
    ctx.font = "500 24px var(--font-sans), 'Poppins', sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("DIGITAL VERIFICATION & PARTNER ACCESS", 275, 1070);
    ctx.restore();

    // 11. Right Side: Decorative QR Code Container
    const qrBoxX = 1420;
    const qrBoxY = 480;
    const qrBoxSize = 480;
    const qrBoxRadius = 36;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 30;
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
      const qrPadding = 48;
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

            ctx.fillStyle = isFinder ? "#018BCE" : "#0F3056";
            const px = qrBoxX + qrPadding + c * cellSize;
            const py = qrBoxY + qrPadding + r * cellSize;
            ctx.beginPath();
            ctx.roundRect(px, py, cellSize * 0.95, cellSize * 0.95, cellSize * 0.25);
            ctx.fill();
          }
        }
      }

      const centerSize = 64;
      const centerX = qrBoxX + qrBoxSize / 2 - centerSize / 2;
      const centerY = qrBoxY + qrBoxSize / 2 - centerSize / 2;
      ctx.fillStyle = "#0F3056";
      ctx.beginPath();
      ctx.roundRect(centerX, centerY, centerSize, centerSize, 12);
      ctx.fill();
      ctx.strokeStyle = "#018BCE";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px 'Poppins', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SU", centerX + centerSize / 2, centerY + centerSize / 2);
      ctx.restore();
    } catch {
      // QR drawing fallback
    }

    // Label below QR
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px 'Poppins', sans-serif";
    ctx.letterSpacing = "3px";
    ctx.textAlign = "center";
    ctx.fillText("SCAN TO VERIFY", qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 65);
    ctx.restore();

    // 12. Top Lanyard Slot Outline
    const slotW = 280;
    const slotH = 40;
    const slotX = width / 2 - slotW / 2;
    const slotY = 30;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(slotX, slotY, slotW, slotH, slotH / 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    texture.needsUpdate = true;
  };

  renderCanvas();

  if (typeof window !== "undefined") {
    // Re-render when web fonts load
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
    ctx.font = "bold 60px 'Anton', sans-serif";
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

    // 3. Black Magnetic Stripe
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

    // 4. White Signature / Authorization Panel
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

    // CVC / Authorization Security Code Box
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
      "• Show this card at participating campus venues & commercial partner stores.",
      "• Valid only for the registered Nile University student. Privileges are non-transferable.",
      "• Add to Google Wallet on supported devices for one-tap offline verification.",
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
    const slotW = 280;
    const slotH = 40;
    const slotX = width / 2 - slotW / 2;
    const slotY = 30;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 3;
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
  texture.repeat.set(6, 1);
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
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    for (let x = 0; x < width; x += 4) {
      ctx.fillRect(x, 0, 2, height);
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }
    ctx.restore();

    // 3. Stitched Borders (Top and Bottom)
    ctx.save();
    ctx.strokeStyle = "#018BCE";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(width, 10);
    ctx.moveTo(0, height - 10);
    ctx.lineTo(width, height - 10);
    ctx.stroke();
    ctx.restore();

    // 4. Repeated Branding Pattern
    ctx.save();
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    // Segment 1: Star & NUSU
    ctx.fillStyle = "#018BCE";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("★", 120, height / 2);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 42px 'Anton', -apple-system, sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText("NUSU", 280, height / 2);

    // Segment 2: Star & NILE UNIVERSITY
    ctx.fillStyle = "#018BCE";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("★", 440, height / 2);

    ctx.fillStyle = "#8FB8E8";
    ctx.font = "700 32px 'Poppins', sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("NILE UNIVERSITY", 660, height / 2);

    // Segment 3: Star & SU CARD
    ctx.fillStyle = "#018BCE";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("★", 880, height / 2);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 42px 'Anton', -apple-system, sans-serif";
    ctx.fillText("SU CARD", 980, height / 2);

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
