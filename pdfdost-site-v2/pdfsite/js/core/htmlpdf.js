// HTML → PDF (renders in a hidden sandboxed frame with html2canvas, page by page,
// choosing page breaks between lines of text so nothing is cut in half).
import { lib } from './lib.js';
import { PL, canvasBytes, getFont, canEncode, hexRgb } from './pdf.js';
import { h, nextFrame } from './ui.js';

const PX = 96 / 72;

export async function htmlToPdf(html, { pageSize = [595.28, 841.89], margin = 40, css = '', onProgress, quality = 0.92, scale = 2 } = {}) {
  const html2canvas = await lib('html2canvas');
  const { PDFDocument } = await PL();
  const [W, H] = pageSize;
  const pxW = Math.round((W - 2 * margin) * PX), pxH = Math.floor((H - 2 * margin) * PX);
  const frame = h('iframe', { sandbox: 'allow-same-origin', 'aria-hidden': 'true', style: { position: 'fixed', left: '-12000px', top: '0', width: pxW + 'px', height: '200px', border: '0', background: '#fff' } });
  document.body.appendChild(frame);
  try {
    const d = frame.contentDocument;
    d.open();
    d.write(`<!doctype html><html><head><meta charset="utf-8"><style>
      html,body{margin:0;padding:0;background:#fff;color:#111;font:14px/1.55 -apple-system,"Segoe UI",Roboto,"Noto Sans","Noto Sans Devanagari","Noto Sans Gurmukhi","Nirmala UI",Arial,sans-serif;word-wrap:break-word;overflow-wrap:anywhere}
      img,svg,video{max-width:100%;height:auto} pre{white-space:pre-wrap} table{border-collapse:collapse;max-width:100%}
      ${css}</style></head><body>${html}</body></html>`);
    d.close();
    await Promise.race([Promise.all([...d.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))), new Promise(r => setTimeout(r, 4000))]);
    await d.fonts?.ready; await nextFrame();
    const total = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight, 1);
    frame.style.height = total + 'px'; await nextFrame();

    // Candidate break positions = bottoms of text lines / images / table rows
    const tops = [], bottoms = [];
    const walker = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
    const range = d.createRange();
    for (let n; (n = walker.nextNode());) { if (!n.textContent.trim()) continue; range.selectNodeContents(n); for (const r of range.getClientRects()) { tops.push(r.top); bottoms.push(r.bottom); } }
    d.querySelectorAll('img,svg,tr,hr,li,canvas').forEach(e => { const r = e.getBoundingClientRect(); tops.push(r.top); bottoms.push(r.bottom); });
    const cands = [...new Set(bottoms.map(b => Math.ceil(b)))].sort((a, b) => a - b);
    const cuts = (y) => tops.some((t, i) => t < y - 1 && bottoms[i] > y + 1); // would cut through something
    const breaks = [0]; let y = 0;
    while (y + pxH < total) {
      const limit = y + pxH; let best = 0;
      for (const c of cands) { if (c > limit) break; if (c > y + pxH * 0.5 && !cuts(c)) best = c; }
      y = best || limit; breaks.push(y);
    }
    breaks.push(total);

    const out = await PDFDocument.create();
    const pages = breaks.length - 1;
    for (let i = 0; i < pages; i++) {
      onProgress?.(i / pages, `Rendering page ${i + 1} of ${pages}`);
      const top = breaks[i], hgt = Math.max(1, breaks[i + 1] - top);
      const canvas = await html2canvas(d.body, { scale, backgroundColor: '#ffffff', logging: false, useCORS: true, x: 0, y: top, width: pxW, height: hgt, windowWidth: pxW, windowHeight: Math.min(total, 20000), scrollX: 0, scrollY: 0 });
      const img = await out.embedJpg(await canvasBytes(canvas, 'image/jpeg', quality));
      const p = out.addPage([W, H]);
      p.drawImage(img, { x: margin, y: H - margin - hgt / PX, width: pxW / PX, height: hgt / PX });
    }
    return out;
  } finally { frame.remove(); }
}

// Plain text → PDF with real (selectable) text when the standard fonts can encode it.
// Returns null if the text needs a Unicode font (caller then falls back to htmlToPdf).
export async function textLayout(text, { font = 'Helvetica', size = 11, pageSize = [595.28, 841.89], margin = 50, lineNumbers = false, lineHeight = 1.35, color = '#111111', header = '' } = {}) {
  const { PDFDocument, rgb } = await PL();
  const doc = await PDFDocument.create();
  const f = await getFont(doc, font);
  text = String(text).replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
  if (!canEncode(f, text.replace(/\n/g, ''))) return null;
  const [W, H] = pageSize; const lh = size * lineHeight;
  const srcLines = text.split('\n');
  const numW = lineNumbers ? f.widthOfTextAtSize(String(srcLines.length), size * 0.85) + 12 : 0;
  const maxW = W - 2 * margin - numW;
  const wrapLine = ln => {
    if (!ln) return [''];
    const out = []; let cur = '';
    for (let tok of ln.split(/(\s+)/).filter(Boolean)) {
      if (f.widthOfTextAtSize(cur + tok, size) <= maxW) { cur += tok; continue; }
      if (/^\s+$/.test(tok)) { out.push(cur); cur = ''; continue; }
      if (cur) { out.push(cur.replace(/\s+$/, '')); cur = ''; }
      while (f.widthOfTextAtSize(tok, size) > maxW) { let k = tok.length; while (k > 1 && f.widthOfTextAtSize(tok.slice(0, k), size) > maxW) k--; out.push(tok.slice(0, k)); tok = tok.slice(k); }
      cur = tok;
    }
    out.push(cur); return out;
  };
  let page, y; const col = hexRgb(color);
  const newPage = () => {
    page = doc.addPage([W, H]); y = H - margin - size;
    if (header) { page.drawText(header, { x: margin, y: H - margin / 2 - 4, size: 8, font: f, color: rgb(0.45, 0.45, 0.45) }); }
  };
  newPage();
  srcLines.forEach((ln, i) => {
    wrapLine(ln).forEach((part, k) => {
      if (y < margin) newPage();
      if (lineNumbers && k === 0) page.drawText(String(i + 1).padStart(String(srcLines.length).length, ' '), { x: margin, y, size: size * 0.85, font: f, color: rgb(0.6, 0.6, 0.6) });
      if (part) page.drawText(part, { x: margin + numW, y, size, font: f, color: col });
      y -= lh;
    });
  });
  const n = doc.getPageCount();
  if (n > 1) doc.getPages().forEach((p, i) => { const s = `${i + 1} / ${n}`; p.drawText(s, { x: W - margin - f.widthOfTextAtSize(s, 8), y: margin / 2, size: 8, font: f, color: rgb(0.55, 0.55, 0.55) }); });
  return doc;
}

export function escapeHtml(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

export function parseCSV(text, delim) {
  text = text.replace(/^﻿/, '');
  if (!delim) { const first = text.split('\n')[0]; delim = [',', ';', '\t', '|'].sort((a, b) => first.split(b).length - first.split(a).length)[0]; }
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true; else if (c === delim) { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
}
export function toCSV(rows) { return rows.map(r => r.map(c => /[",\n;]/.test(c) ? `"${String(c).replace(/"/g, '""')}"` : c).join(',')).join('\n'); }
