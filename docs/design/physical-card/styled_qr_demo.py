"""Prototype: render a card QR in the NUSU style (round dots, rounded eyes, logo in the centre).

Proves the style can be generated per card by the system. The production version
will live in lib/cards/ and output SVG for the print PDF.
"""
import sys
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
NAVY = (15, 48, 86)
SKY = (1, 139, 206)
MODULE = 40          # px per module
QUIET = 2            # modules of white margin
LOGO_MODULES = 9     # cleared square in the centre, in modules


def colored_icon(size_px: int) -> Image.Image:
    """Crisp two-colour icon: shape from the HD white mask, colours sampled from the original."""
    mask = Image.open(ROOT / "assets/brand/su-icon-white@hd.png").split()[3]
    src = Image.open(ROOT / "assets/brand/su-icon-color.png").convert("RGBA")
    # The HD mask has 6 px padding at 10x scale; crop it to match the source framing.
    pad = 60
    mask = mask.crop((pad, pad, mask.width - pad, mask.height - pad))
    src = src.resize(mask.size, Image.LANCZOS)
    out = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    sp, mp, op = src.load(), mask.load(), out.load()
    for y in range(mask.height):
        for x in range(mask.width):
            a = mp[x, y]
            if a:
                r, g, b, _ = sp[x, y]
                op[x, y] = (*(SKY if b > 150 and r < 80 else NAVY), a)
    scale = size_px / max(out.size)
    return out.resize((int(out.width * scale), int(out.height * scale)), Image.LANCZOS)


def eye(draw: ImageDraw.ImageDraw, x: int, y: int) -> None:
    m = MODULE
    draw.rounded_rectangle([x, y, x + 7 * m - 1, y + 7 * m - 1], radius=int(2.2 * m), fill=NAVY)
    draw.rounded_rectangle([x + m, y + m, x + 6 * m - 1, y + 6 * m - 1], radius=int(1.5 * m), fill="white")
    draw.rounded_rectangle([x + 2 * m, y + 2 * m, x + 5 * m - 1, y + 5 * m - 1], radius=int(0.8 * m), fill=NAVY)


def render(data: str, out: Path) -> None:
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, border=0)
    qr.add_data(data)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    n = len(matrix)
    size = (n + 2 * QUIET) * MODULE
    img = Image.new("RGB", (size, size), "white")
    d = ImageDraw.Draw(img)

    lo = (n - LOGO_MODULES) // 2
    hi = lo + LOGO_MODULES

    def in_eye(r, c):
        return (r < 7 and c < 7) or (r < 7 and c >= n - 7) or (r >= n - 7 and c < 7)

    for r, row in enumerate(matrix):
        for c, on in enumerate(row):
            if not on or in_eye(r, c) or (lo <= r < hi and lo <= c < hi):
                continue
            x, y = (c + QUIET) * MODULE, (r + QUIET) * MODULE
            pad = MODULE * 0.08
            d.ellipse([x + pad, y + pad, x + MODULE - pad, y + MODULE - pad], fill=NAVY)

    for r, c in [(0, 0), (0, n - 7), (n - 7, 0)]:
        eye(d, (c + QUIET) * MODULE, (r + QUIET) * MODULE)

    icon = colored_icon(int((LOGO_MODULES - 2) * MODULE))
    cx = cy = size // 2
    img.paste(icon, (cx - icon.width // 2, cy - icon.height // 2), icon)
    img.save(out)
    print(f"{out.name}: version {qr.version}, {n}x{n} modules, EC=H")


if __name__ == "__main__":
    data = sys.argv[1] if len(sys.argv) > 1 else "https://sucard.app/c/K7Q2X9M4PZ3B8WN5TD6R"
    render(data, Path(__file__).with_name("sample-qr-styled.png"))
