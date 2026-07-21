/*
 * Client-side document generator.
 *
 * Renders an official-looking certificate onto a high-resolution canvas, then
 * wraps it as a real one-page PDF (JPEG image embedded via DCTDecode). Used to
 * produce DUMMY documents on demand for the prototype so View and Download work
 * without shipping a static file per document. The Residence Certificate keeps
 * its own real PDF asset — this is only for the other services.
 *
 * No external dependencies: the PDF byte layout is assembled by hand.
 */

export interface DocField {
  label: string;
  value: string;
}

export interface DocSpec {
  /** Big document title, e.g. "National Identity Card". */
  title: string;
  /** Small kicker above the title, e.g. "Civil Registration". */
  kicker: string;
  refNo: string;
  holderName: string;
  /** Issuing office / authority. */
  office: string;
  fields: DocField[];
  issued: string;
  validUntil?: string;
  /** Short verification code shown in the footer + faux QR. */
  verifyCode: string;
  /** Draw a portrait placeholder (for ID-type documents). */
  hasPhoto?: boolean;
}

// 2× A4 portrait for a crisp raster; the PDF page is A4 in points.
const IMG_W = 1190;
const IMG_H = 1684;
const PAGE_W = 595;
const PAGE_H = 842;
const BRAND = "#344EAD";
const BRAND_DARK = "#1a2d7a";
const GOLD = "#F5C542";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawDocument(spec: DocSpec): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = IMG_W;
  canvas.height = IMG_H;
  const ctx = canvas.getContext("2d")!;

  // Page
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, IMG_W, IMG_H);

  // Outer border
  ctx.strokeStyle = "#E5E7EB";
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, IMG_W - 80, IMG_H - 80);

  // ── Header band ──
  const bandH = 300;
  const grad = ctx.createLinearGradient(0, 0, IMG_W, bandH);
  grad.addColorStop(0, BRAND);
  grad.addColorStop(1, BRAND_DARK);
  ctx.fillStyle = grad;
  ctx.fillRect(40, 40, IMG_W - 80, bandH);

  // Emblem — white disc + gold star
  const ecx = 190;
  const ecy = 40 + bandH / 2;
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.beginPath();
  ctx.arc(ecx, ecy, 96, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ecx, ecy, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = GOLD;
  star(ctx, ecx, ecy, 56, 24);
  ctx.fill();

  // Header text
  const hx = 320;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Georgia, 'Times New Roman', serif";
  ctx.fillText("Lao People's Democratic Republic", hx, 40 + bandH / 2 - 34);
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "italic 24px Georgia, serif";
  ctx.fillText("Peace · Independence · Democracy · Unity · Prosperity", hx, 40 + bandH / 2 + 6);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "22px Arial, sans-serif";
  ctx.fillText(spec.office, hx, 40 + bandH / 2 + 46);

  // ── Title block ──
  let y = 40 + bandH + 70;
  ctx.textAlign = "center";
  ctx.fillStyle = BRAND;
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.fillText(spec.kicker.toUpperCase(), IMG_W / 2, y);
  y += 56;
  ctx.fillStyle = "#111827";
  ctx.font = "bold 52px Georgia, serif";
  ctx.fillText(spec.title, IMG_W / 2, y);
  y += 40;

  // Ref pill
  ctx.font = "600 22px Arial, sans-serif";
  const refText = `No. ${spec.refNo}`;
  const pillW = ctx.measureText(refText).width + 56;
  roundRect(ctx, IMG_W / 2 - pillW / 2, y, pillW, 46, 23);
  ctx.fillStyle = "#EEF2FF";
  ctx.fill();
  ctx.fillStyle = BRAND;
  ctx.textBaseline = "middle";
  ctx.fillText(refText, IMG_W / 2, y + 24);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  y += 100;

  // ── Body ──
  const left = 110;
  const contentRight = IMG_W - 110;
  const photoW = 220;
  const photoX = contentRight - photoW;
  const fieldRight = spec.hasPhoto ? photoX - 50 : contentRight;

  // Holder
  ctx.fillStyle = "#6B7280";
  ctx.font = "600 20px Arial, sans-serif";
  ctx.fillText("This is to certify that", left, y);
  y += 42;
  ctx.fillStyle = "#111827";
  ctx.font = "bold 40px Georgia, serif";
  ctx.fillText(spec.holderName, left, y);
  y += 30;
  ctx.strokeStyle = "#E5E7EB";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(fieldRight, y);
  ctx.stroke();
  y += 46;

  // Photo placeholder (ID docs)
  if (spec.hasPhoto) {
    const photoY = 40 + bandH + 230;
    const photoH = 280;
    roundRect(ctx, photoX, photoY, photoW, photoH, 16);
    ctx.fillStyle = "#F3F4F6";
    ctx.fill();
    ctx.strokeStyle = "#D1D5DB";
    ctx.lineWidth = 2;
    ctx.stroke();
    // silhouette
    ctx.fillStyle = "#C7CDD6";
    ctx.beginPath();
    ctx.arc(photoX + photoW / 2, photoY + 105, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(photoX + photoW / 2, photoY + 250, 92, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "600 18px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PHOTO", photoX + photoW / 2, photoY + photoH + 34);
    ctx.textAlign = "left";
  }

  // Fields — two per row
  const colGap = 40;
  const colW = (fieldRight - left - colGap) / 2;
  spec.fields.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = left + col * (colW + colGap);
    const fy = y + row * 92;
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "600 18px Arial, sans-serif";
    ctx.fillText(f.label.toUpperCase(), fx, fy);
    ctx.fillStyle = "#1F2937";
    ctx.font = "600 26px Arial, sans-serif";
    ctx.fillText(f.value, fx, fy + 34);
  });
  const rows = Math.ceil(spec.fields.length / 2);
  y += rows * 92 + 40;

  // ── QR + validity strip (QR sits to the left of the strip) ──
  const stripY = Math.max(y, IMG_H - 470);
  const qs = 96;
  const qrX = left;
  const qrY = stripY;
  const stripX = qrX + qs + 24;
  roundRect(ctx, stripX, stripY, contentRight - stripX, qs, 14);
  ctx.fillStyle = "#F8FAFC";
  ctx.fill();
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "600 18px Arial, sans-serif";
  ctx.fillText("ISSUED", stripX + 32, stripY + 34);
  ctx.fillStyle = "#1F2937";
  ctx.font = "600 24px Arial, sans-serif";
  ctx.fillText(spec.issued, stripX + 32, stripY + 66);
  if (spec.validUntil) {
    const vx = stripX + (contentRight - stripX) / 2 + 20;
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "600 18px Arial, sans-serif";
    ctx.fillText("VALID UNTIL", vx, stripY + 34);
    ctx.fillStyle = "#1F2937";
    ctx.font = "600 24px Arial, sans-serif";
    ctx.fillText(spec.validUntil, vx, stripY + 66);
  }

  // ── Seal + signature ──
  const sealCx = contentRight - 140;
  const sealCy = IMG_H - 250;
  ctx.strokeStyle = BRAND;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(sealCx, sealCy, 92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = BRAND;
  ctx.textAlign = "center";
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.fillText("OFFICIAL", sealCx, sealCy - 8);
  ctx.fillText("SEAL", sealCx, sealCy + 16);
  ctx.font = "600 14px Arial, sans-serif";
  ctx.fillText("LAO PDR", sealCx, sealCy + 44);
  ctx.textAlign = "left";

  // Signature
  const sigX = left;
  const sigY = IMG_H - 220;
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sigX, sigY);
  ctx.bezierCurveTo(sigX + 40, sigY - 40, sigX + 90, sigY + 30, sigX + 140, sigY - 20);
  ctx.bezierCurveTo(sigX + 170, sigY - 45, sigX + 190, sigY + 10, sigX + 220, sigY - 12);
  ctx.stroke();
  ctx.strokeStyle = "#9CA3AF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sigX, sigY + 24);
  ctx.lineTo(sigX + 300, sigY + 24);
  ctx.stroke();
  ctx.fillStyle = "#6B7280";
  ctx.font = "600 20px Arial, sans-serif";
  ctx.fillText("Authorised Officer", sigX, sigY + 54);

  // ── Faux QR (deterministic from verifyCode), aligned with the validity strip ──
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX, qrY, qs, qs);
  ctx.strokeStyle = "#E5E7EB";
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX, qrY, qs, qs);
  const modules = 11;
  const m = qs / (modules + 2);
  let seed = 0;
  for (const ch of spec.verifyCode + spec.refNo) seed = (seed * 31 + ch.charCodeAt(0)) % 1000000007;
  ctx.fillStyle = "#111827";
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const finder =
        (r < 3 && c < 3) || (r < 3 && c >= modules - 3) || (r >= modules - 3 && c < 3);
      if (finder || seed % 2 === 0) {
        ctx.fillRect(qrX + (c + 1) * m, qrY + (r + 1) * m, m, m);
      }
    }
  }

  // ── Footer ──
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `System-generated via Lao Citizen Center · Verify at lcc.gov.la/verify · Code ${spec.verifyCode}`,
    IMG_W / 2,
    IMG_H - 96
  );
  ctx.fillText("Prototype document — for demonstration purposes only.", IMG_W / 2, IMG_H - 68);
  ctx.textAlign = "left";

  return canvas;
}

/** Assemble a one-page PDF that embeds `jpeg` (DCTDecode) at A4. */
function jpegToPdf(jpeg: Uint8Array): Blob {
  const enc = (s: string) => new TextEncoder().encode(s);
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let len = 0;
  const push = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? enc(chunk) : chunk;
    parts.push(bytes);
    len += bytes.length;
  };
  const obj = () => offsets.push(len);

  push("%PDF-1.3\n");
  obj();
  push("1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n");
  obj();
  push("2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n");
  obj();
  push(
    `3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${PAGE_W} ${PAGE_H}]` +
      `/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>\nendobj\n`
  );
  obj();
  push(
    `4 0 obj\n<</Type/XObject/Subtype/Image/Width ${IMG_W}/Height ${IMG_H}` +
      `/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpeg.length}>>\nstream\n`
  );
  push(jpeg);
  push("\nendstream\nendobj\n");
  const content = `q ${PAGE_W} 0 0 ${PAGE_H} 0 0 cm /Im0 Do Q`;
  obj();
  push(`5 0 obj\n<</Length ${content.length}>>\nstream\n${content}\nendstream\nendobj\n`);

  const xrefStart = len;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (const off of offsets) xref += String(off).padStart(10, "0") + " 00000 n \n";
  push(xref);
  push(`trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`);

  const out = new Uint8Array(len);
  let p = 0;
  for (const b of parts) {
    out.set(b, p);
    p += b.length;
  }
  return new Blob([out], { type: "application/pdf" });
}

/** Generate a PDF Blob for the given document spec. */
export function generateDocumentPdf(spec: DocSpec): Blob {
  const canvas = drawDocument(spec);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bin = atob(b64);
  const jpeg = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) jpeg[i] = bin.charCodeAt(i);
  return jpegToPdf(jpeg);
}
