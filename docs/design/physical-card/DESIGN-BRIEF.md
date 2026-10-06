# Design Brief — SU Card (physical)

Hi team,

We need a design for the new **SU Card**: a physical membership card for NU students. Students show it at partner vendors to get discounts, and the vendor scans the QR code on it.

**What the card is**
- One **generic design** for all students. No name or photo on the card.
- Every printed card has a **different QR code**, filled in automatically at print time, so please design a **template with a QR placeholder**. There is **no serial number or code printed** — just the QR. The attached sample QR shows the exact size and density of the real ones.

**Specs**
- Size: standard ID/bank card, **85.6 × 54 mm** (CR80), rounded corners 3 mm
- Bleed: 3 mm on all sides; keep text and logos 3 mm inside the edge
- Color: CMYK, 300 dpi minimum for any images
- Front and back

**Content**
- **Front:** NUSU logo and "SU CARD". Brand look is up to you.
- **Back** (or front, your call):
  - **QR placeholder:** at least **25 × 25 mm**, with a white margin of about 2 mm around it
  - One short line, e.g. *"Activate at sucard.app · Show at partner stores"*. The exact website is still being confirmed.

**QR style**
We're going with the branded style in the attached sample: navy round dots, rounded corner "eyes", and the NUSU icon in the centre. Because every card has a different QR, **our system will draw the QRs automatically in this style**. From you we need the **style pieces**, not finished QRs:
- **Corner eye shape** as SVG (outer frame + inner square), if you want a custom shape like the sample
- **Dot style** (round dots, as in the sample)
- **Centre logo** as SVG. It may cover **at most 20% of the QR width**, with a small white gap around it
- **Colors:** dots and eyes in navy `#0F3056` or black. Don't use the light blues for the dots, since they're too low-contrast to scan reliably. The centre logo can be full color.

**QR rules (important, or it won't scan)**
- **Size on the card: at least 25 × 25 mm**, plus a clear white margin of about 2 mm around it. The styled version needs more room than a plain QR.
- **Plain white** behind the QR. No gradients, patterns or images.
- Don't stretch it, rotate it, or put it across a fold, an edge or an embossed area.
- We'll test a printed proof with several phones before the full print run.

**Brand**
- Colors: `#000000`, `#0F3056`, `#0F548D`, `#018BCE`
- Fonts: **Anton** (titles), **Poppins** (text)
- Logo: NUSU logo, attached

**Please deliver**
- Print-ready **PDF** (with bleed and crop marks) and the source file (**AI** or **Figma**)
- QR on its own layer, marked as a placeholder
- A PNG preview of front and back

**Attached:** NUSU logos, branding PDF, sample styled QR (`sample-qr-styled.png`, made with a real-length card link)
**Deadline:** [date]

Thanks!
