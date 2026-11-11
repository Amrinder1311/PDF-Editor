// PDF helpers shared by all tools (pdf-lib for writing, pdf.js for reading/rendering)
import { lib, vendorUrl } from './lib.js';
import { askPassword, nextFrame } from './ui.js';

export const PL = () => lib('pdflib');

// ── Loading ─────────────────────────────────────────────────
export async function openPdf(bytes) {
  const pdfjs = await lib('pdfjs');
  return pdfjs.getDocument({
    data: bytes.slice(0), // pdf.js transfers the buffer, so give it a copy
    cMapUrl: vendorUrl('pdfjs/cmaps/'), cMapPacked: true,
    standardFontDataUrl: vendorUrl('pdfjs/standard_fonts/'),
    isEvalSupported: false, enableXfa: false,
  }).promise;
}

export async function loadDoc(bytes, extra = {}) {
  const { PDFDocument } = await PL();
  const doc = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: false, ...extra });
  stripSecurity(doc, PDFDocument);
  return doc;
}

// After decrypting, make sure the saved file is not re-encrypted.
export function stripSecurity(doc) {
  const P = window.PDFLib;
  doc.context.security = undefined;
  delete doc.context.trailerInfo.Encrypt;
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    const d = obj instanceof P.PDFDict ? obj : obj?.dict;
    if (!d || !(d instanceof P.PDFDict)) continue;
    const f = d.get(P.PDFName.of('Filter'));
    if (f && f.toString() === '/Standard' && d.has(P.PDFName.of('O')) && d.has(P.PDFName.of('U'))) doc.context.delete(ref);
  }
}

// Read an uploaded file. PDFs that are password protected are unlocked
// once here (after asking the user), so every tool works with plain bytes.
export async function prepareFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name) || isPdfBytes(bytes);
  const entry = { file, name: file.name, size: file.size, bytes, isPdf, encrypted: false };
  if (!isPdf) return entry;
  const { PDFDocument } = await PL();
  let d;
  try {
    d = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false });
  } catch (e) {
    // pdf-lib could not parse it — pdf.js is more forgiving (Repair PDF uses this)
    try { const pdf = await openPdf(bytes); entry.pageCount = pdf.numPages; entry.broken = true; return entry; }
    catch (e2) { throw new Error(`“${file.name}” is not a valid PDF or is badly damaged.`); }
  }
  entry.pageCount = d.getPageCount();
  if (!d.isEncrypted) return entry;
  // Encrypted: try empty password (owner-password-only files), then ask.
  entry.encrypted = true;
  let pw = '', tries = 0;
  for (;;) {
    try {
      const d = await PDFDocument.load(bytes, { password: pw, updateMetadata: false, throwOnInvalidObject: false });
      stripSecurity(d);
      entry.bytes = await d.save({ useObjectStreams: true });
      entry.password = pw;
      entry.pageCount = d.getPageCount();
      return entry;
    } catch (e) {
      pw = await askPassword(file.name, tries++ > 0);
      if (pw == null) throw new Error(`“${file.name}” needs a password to open.`);
    }
  }
}

export function isPdfBytes(b) { return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; }

export async function saveDoc(doc, opts = {}) {
  const bytes = await doc.save({ useObjectStreams: true, ...opts });
  return new Blob([bytes], { type: 'application/pdf' });
}

// ── Page ranges ─────────────────────────────────────────────
// "1-3, 5, 8-" → [[0,1,2],[4],[7,8,...]] (0-based)
export function parseRangeGroups(str, total) {
  const groups = [];
  for (let part of String(str || '').split(/[,;]+/)) {
    part = part.trim().toLowerCase(); if (!part) continue;
    let a, b;
    if (part === 'odd' || part === 'even') { const g = []; for (let i = part === 'odd' ? 0 : 1; i < total; i += 2) g.push(i); groups.push(g); continue; }
    const m = part.match(/^(\d*|last)\s*(?:-|to|–)\s*(\d*|last)$/);
    if (m) { a = m[1] === 'last' ? total : (m[1] ? +m[1] : 1); b = m[2] === 'last' ? total : (m[2] ? +m[2] : total); }
    else if (/^(\d+|last)$/.test(part)) a = b = part === 'last' ? total : +part;
    else throw new Error(`“${part}” is not a valid page range. Use e.g. 1-3, 5, 8-10`);
    a = Math.max(1, a); b = Math.min(total, b);
    const g = [];
    if (a <= b) for (let i = a; i <= b; i++) g.push(i - 1); else for (let i = a; i >= b; i--) g.push(i - 1);
    if (g.length) groups.push(g);
  }
  return groups;
}
export function parsePages(str, total, fallbackAll = true) {
  if (!String(str || '').trim()) return fallbackAll ? [...Array(total).keys()] : [];
  return [...new Set(parseRangeGroups(str, total).flat())].sort((x, y) => x - y);
}

// ── Rendering ───────────────────────────────────────────────
export async function renderPage(pdf, num, { scale, width, dpi, maxPixels = 16e6, bg = '#ffffff', intent = 'display', annotations = true } = {}) {
  const page = typeof num === 'object' ? num : await pdf.getPage(num);
  const base = page.getViewport({ scale: 1 });
  let s = scale ?? (width ? width / base.width : dpi ? dpi / 72 : 1);
  if (base.width * base.height * s * s > maxPixels) s = Math.sqrt(maxPixels / (base.width * base.height));
  const vp = page.getViewport({ scale: s });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(vp.width)); canvas.height = Math.max(1, Math.floor(vp.height));
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  await page.render({ canvasContext: ctx, viewport: vp, intent, annotationMode: annotations ? 1 : 0 }).promise;
  canvas.pdfSize = { w: base.width, h: base.height };
  return canvas;
}

export function canvasBlob(canvas, type = 'image/jpeg', quality = 0.9) {
  return new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Image encoding failed')), type, quality));
}
export async function canvasBytes(canvas, type, quality) { return new Uint8Array(await (await canvasBlob(canvas, type, quality)).arrayBuffer()); }

// Rasterize pages into a new PDF (used by grayscale, dark mode, redact, compress-strong, scan cleanup…)
export async function rasterizeToPdf(pdf, { dpi = 150, quality = 0.82, format = 'jpg', pages, transform, onProgress, keepPages } = {}) {
  const { PDFDocument } = await PL();
  const out = await PDFDocument.create();
  const list = pages || [...Array(pdf.numPages).keys()];
  for (let k = 0; k < list.length; k++) {
    const i = list[k];
    onProgress?.(k / list.length, `Rendering page ${i + 1} of ${pdf.numPages}`);
    let canvas = await renderPage(pdf, i + 1, { dpi });
    if (transform) canvas = (await transform(canvas, i)) || canvas;
    const bytes = await canvasBytes(canvas, format === 'png' ? 'image/png' : 'image/jpeg', quality);
    const img = format === 'png' ? await out.embedPng(bytes) : await out.embedJpg(bytes);
    const { w, h } = canvas.pdfSize;
    const p = out.addPage([w, h]);
    p.drawImage(img, { x: 0, y: 0, width: w, height: h });
    await nextFrame();
  }
  return out;
}

// ── Text extraction ─────────────────────────────────────────
// Returns items in top-left page coordinates (points, rotation applied)
export async function pageText(pdf, num) {
  const page = await pdf.getPage(num);
  const vp = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  const items = [];
  for (const it of tc.items) {
    if (!it.str) continue;
    const [a, b, c, d, e, f] = it.transform;
    const [x, y] = vp.convertToViewportPoint(e, f);
    const size = Math.hypot(c, d) || Math.hypot(a, b) || 10;
    const vertical = Math.abs(b) > Math.abs(a);
    items.push({ str: it.str, x, y, w: it.width, h: size, size, font: it.fontName, eol: it.hasEOL, vertical });
  }
  return { items, width: vp.width, height: vp.height, page, vp };
}

export function toLines(items) {
  const sorted = items.filter(i => i.str.trim() || i.str === ' ').sort((p, q) => (Math.abs(p.y - q.y) < Math.min(p.size, q.size) * 0.45 ? p.x - q.x : p.y - q.y));
  const lines = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - it.y) < Math.min(last.size, it.size) * 0.45) last.items.push(it);
    else lines.push({ y: it.y, size: it.size, items: [it] });
  }
  for (const ln of lines) {
    ln.items.sort((p, q) => p.x - q.x);
    let s = '', end = null;
    for (const it of ln.items) {
      if (end != null && it.x - end > it.size * 0.2 && !s.endsWith(' ') && !it.str.startsWith(' ')) s += it.x - end > it.size * 2 ? '\t' : ' ';
      s += it.str; end = it.x + it.w;
    }
    ln.text = s.replace(/\s+$/, '');
    ln.x = ln.items[0].x;
    ln.size = Math.max(...ln.items.map(i => i.size));
  }
  return lines;
}

export async function extractText(pdf, onProgress) {
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.((i - 1) / pdf.numPages, `Reading page ${i} of ${pdf.numPages}`);
    const { items, width, height } = await pageText(pdf, i);
    const lines = toLines(items);
    pages.push({ num: i, width, height, lines, text: linesToText(lines) });
  }
  return pages;
}
export function linesToText(lines) {
  let out = '', prev = null;
  for (const ln of lines) {
    if (prev && ln.y - prev.y > prev.size * 1.9) out += '\n';
    out += ln.text.replace(/\t/g, '    ') + '\n'; prev = ln;
  }
  return out.trim();
}

// Proportional text measuring (Arial ≈ Helvetica metrics) to locate matches inside a text run
let _mctx; function measureStr(t) { _mctx ||= document.createElement('canvas').getContext('2d'); _mctx.font = '100px Arial, Helvetica, sans-serif'; return _mctx.measureText(t).width; }
// Find text matches → rectangles in top-left coordinates
export function findInItems(items, matcher) {
  const rects = [];
  for (const it of items) {
    const s = it.str; if (!s) continue;
    const re = matcher instanceof RegExp ? new RegExp(matcher.source, matcher.flags.includes('g') ? matcher.flags : matcher.flags + 'g') : null;
    const hits = [];
    if (re) { let m; while ((m = re.exec(s))) { if (!m[0]) { re.lastIndex++; continue; } hits.push([m.index, m[0].length, m[0]]); } }
    else { const q = matcher.toLowerCase(); let i = s.toLowerCase().indexOf(q); while (q && i >= 0) { hits.push([i, q.length, s.substr(i, q.length)]); i = s.toLowerCase().indexOf(q, i + q.length); } }
    if (!hits.length) continue;
    const full = measureStr(s) || 1, k = it.w / full;
    for (const [i, len, text] of hits) {
      const x0 = measureStr(s.slice(0, i)) * k, x1 = measureStr(s.slice(0, i + len)) * k;
      rects.push({ x: it.x + x0, y: it.y - it.size * 0.95, w: Math.max(1, x1 - x0), h: it.size * 1.25, text, size: it.size });
    }
  }
  return rects;
}

// ── Drawing helpers (pdf-lib) ───────────────────────────────
export function hexRgb(hex) {
  const P = window.PDFLib; const n = parseInt(String(hex || '#000').replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  return P.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const fontCache = new WeakMap();
export async function getFont(doc, name = 'Helvetica') {
  const P = window.PDFLib;
  let m = fontCache.get(doc); if (!m) fontCache.set(doc, (m = {}));
  return m[name] || (m[name] = await doc.embedFont(P.StandardFonts[name] || P.StandardFonts.Helvetica));
}
export function canEncode(font, text) {
  const enc = font.embedder?.encoding;
  if (enc?.canEncodeUnicodeCodePoint) { for (const ch of String(text)) { if (ch === '\n' || ch === '\r') continue; if (!enc.canEncodeUnicodeCodePoint(ch.codePointAt(0))) return false; } return true; }
  try { font.encodeText(text); return true; } catch { return false; }
}

export const CSS_FONT = { Helvetica: 'Helvetica, Arial, sans-serif', HelveticaBold: 'bold Helvetica, Arial, sans-serif', TimesRoman: '"Times New Roman", Times, serif', TimesRomanBold: 'bold "Times New Roman", serif', Courier: '"Courier New", monospace', CourierBold: 'bold "Courier New", monospace' };

// Text → transparent PNG (for scripts the standard PDF fonts can't encode, e.g. Hindi, Punjabi, emoji)
export async function textPng(text, sizePt, color = '#000', fontName = 'Helvetica') {
  const k = 4; const lines = String(text).split('\n');
  const famRaw = CSS_FONT[fontName] || CSS_FONT.Helvetica; const bold = famRaw.startsWith('bold '); const fam = famRaw.replace('bold ', '');
  const font = `${bold ? 'bold ' : ''}${sizePt * k}px ${fam}, "Noto Sans", "Nirmala UI", "Mangal", sans-serif`;
  const c = document.createElement('canvas'); const x = c.getContext('2d'); x.font = font;
  const w = Math.ceil(Math.max(...lines.map(l => x.measureText(l).width), 1)) + 2;
  const lh = sizePt * 1.2 * k;
  c.width = w; c.height = Math.ceil(lh * lines.length);
  x.font = font; x.fillStyle = color; x.textBaseline = 'alphabetic';
  lines.forEach((l, i) => x.fillText(l, 1, lh * i + sizePt * k * 0.95));
  return { bytes: await canvasBytes(c, 'image/png'), w: c.width / k, h: c.height / k };
}

// Draw text with standard fonts when possible, otherwise as a crisp image.
// (x, y) = baseline of first line, like pdf-lib's drawText.
export async function drawTextSmart(doc, page, text, { x, y, size = 12, font = 'Helvetica', color = '#000000', opacity = 1, rotate = 0, lineHeight = 1.2 }) {
  const P = window.PDFLib; const f = await getFont(doc, font);
  if (canEncode(f, text)) {
    page.drawText(text, { x, y, size, font: f, color: hexRgb(color), opacity, rotate: P.degrees(rotate), lineHeight: size * lineHeight });
    return { width: Math.max(...text.split('\n').map(l => f.widthOfTextAtSize(l, size))) };
  }
  const t = await textPng(text, size, color, font);
  const img = await doc.embedPng(t.bytes);
  page.drawImage(img, { x, y: y - t.h + size * 0.95, width: t.w, height: t.h, opacity, rotate: P.degrees(rotate) });
  return { width: t.w };
}
export async function textWidth(doc, text, size, font = 'Helvetica') {
  const f = await getFont(doc, font);
  if (canEncode(f, text)) return Math.max(...text.split('\n').map(l => f.widthOfTextAtSize(l, size)));
  const c = document.createElement('canvas').getContext('2d'); c.font = `${size}px sans-serif`;
  return Math.max(...text.split('\n').map(l => c.measureText(l).width));
}

// Place a box anchored at one of 9 positions ('tl','tc','tr','ml','mc','mr','bl','bc','br')
export function anchorXY(pos, pw, ph, w, h, margin) {
  const col = pos[1], row = pos[0];
  const x = col === 'l' ? margin : col === 'r' ? pw - w - margin : (pw - w) / 2;
  const y = row === 't' ? ph - h - margin : row === 'b' ? margin : (ph - h) / 2;
  return { x, y };
}

// Visible page box (crop box) — so stamps land inside the visible area
export function pageBox(page) {
  const b = page.getCropBox ? page.getCropBox() : page.getMediaBox();
  return { x: b.x, y: b.y, w: b.width, h: b.height, rot: ((page.getRotation().angle % 360) + 360) % 360 };
}

// Draw something positioned in the *visual* (rotated) page frame.
// cb receives (x, y, rotateDeg) in PDF user space for a point given in visual coords (bottom-left origin).
export function visualToUser(page, vx, vy) {
  const { x, y, w, h, rot } = pageBox(page);
  switch (rot) {
    case 90: return { x: x + w - vy, y: y + vx, r: 90 };
    case 180: return { x: x + w - vx, y: y + h - vy, r: 180 };
    case 270: return { x: x + vy, y: y + h - vx, r: 270 };
    default: return { x: x + vx, y: y + vy, r: 0 };
  }
}
export function visualSize(page) { const { w, h, rot } = pageBox(page); return rot % 180 ? { w: h, h: w } : { w, h }; }

// Image file → { bytes, type:'jpg'|'png', w, h } ready for embedding
export async function imageForPdf(src, { maxDim = 4000, quality = 0.9, forceJpeg = false } = {}) {
  const blob = src instanceof Blob ? src : new Blob([src]);
  const t = blob.type;
  if (!forceJpeg && (t === 'image/jpeg' || t === 'image/png')) {
    const bmp = await createImageBitmap(blob).catch(() => null);
    if (bmp && Math.max(bmp.width, bmp.height) <= maxDim) {
      const r = { bytes: new Uint8Array(await blob.arrayBuffer()), type: t === 'image/png' ? 'png' : 'jpg', w: bmp.width, h: bmp.height };
      bmp.close?.(); return r;
    }
  }
  const img = await loadImage(blob);
  const s = Math.min(1, maxDim / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  const x = c.getContext('2d');
  const hasAlpha = /png|gif|webp|svg|avif/.test(t) && !forceJpeg;
  if (!hasAlpha) { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
  x.drawImage(img, 0, 0, c.width, c.height);
  return { bytes: await canvasBytes(c, hasAlpha ? 'image/png' : 'image/jpeg', quality), type: hasAlpha ? 'png' : 'jpg', w: c.width, h: c.height };
}
export function loadImage(blob) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob); const img = new Image();
    img.onload = () => { res(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('This image could not be read. Try JPG or PNG.')); };
    img.src = url;
  });
}
export async function embedImage(doc, im) { return im.type === 'png' ? doc.embedPng(im.bytes) : doc.embedJpg(im.bytes); }

export const PAGE_SIZES = { A3: [841.89, 1190.55], A4: [595.28, 841.89], A5: [419.53, 595.28], Letter: [612, 792], Legal: [612, 1008], Tabloid: [792, 1224], B5: [498.9, 708.66] };
export const MM = 72 / 25.4;
