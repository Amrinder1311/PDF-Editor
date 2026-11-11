// OCR & scan tools: OCR PDF, image to text, deskew, clean up, auto-crop, remove blank pages
import { loadDoc, saveDoc, PL, renderPage, canvasBytes, visualToUser, visualSize, getFont, canEncode, parsePages } from '../core/pdf.js';
import { lib, vendorUrl } from '../core/lib.js';
import { h, nextFrame, toast } from '../core/ui.js';
import { CONFIG } from '../config.js';
import { outName } from './common.js';
import { textResultView } from './convert-from.js';
import { applyScanFilter } from './convert-to.js';

const LANGS = [['eng', 'English'], ['hin', 'Hindi (हिंदी)'], ['pan', 'Punjabi (ਪੰਜਾਬੀ)'], ['ben', 'Bengali'], ['guj', 'Gujarati'], ['mar', 'Marathi'], ['tam', 'Tamil'], ['tel', 'Telugu'], ['kan', 'Kannada'], ['mal', 'Malayalam'], ['urd', 'Urdu'], ['san', 'Sanskrit'], ['fra', 'French'], ['deu', 'German'], ['spa', 'Spanish'], ['ara', 'Arabic'], ['chi_sim', 'Chinese (Simplified)'], ['jpn', 'Japanese'], ['rus', 'Russian']];
const LATIN = new Set(['eng', 'fra', 'deu', 'spa', 'ita', 'por', 'nld']);
const langOpts = [
  { key: 'lang', type: 'select', label: 'Document language', default: 'eng', options: LANGS },
  { key: 'lang2', type: 'select', label: 'Second language (optional)', default: '', options: [['', 'None'], ...LANGS] },
];
const langStr = v => [v.lang, v.lang2].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join('+');

async function ocrWorker(langs, progress) {
  const T = await lib('tesseract');
  progress?.(0.02, 'Downloading OCR engine & language data (first time only)…');
  try {
    return await T.createWorker(langs, 1, { workerPath: vendorUrl('tesseract/worker.min.js'), corePath: CONFIG.TESSERACT_CORE, langPath: CONFIG.TESSERACT_LANG, workerBlobURL: false });
  } catch (e) { throw new Error('Could not load the OCR engine. Please check your internet connection (language data is downloaded once).'); }
}

export function detectSkew(canvas) {
  const W = 500, s = W / canvas.width, hh = Math.round(canvas.height * s);
  const c = document.createElement('canvas'); c.width = W; c.height = hh; const x = c.getContext('2d'); x.drawImage(canvas, 0, 0, W, hh);
  const d = x.getImageData(0, 0, W, hh).data; const pts = [];
  for (let y = 0; y < hh; y += 1) for (let i = 0; i < W; i += 1) { const k = (y * W + i) * 4; if (d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11 < 128) pts.push(i, y); }
  if (pts.length < 200) return 0;
  let best = 0, bestScore = -1;
  for (let a = -6; a <= 6.001; a += 0.2) {
    const t = Math.tan(a * Math.PI / 180); const rows = new Float64Array(hh * 2 + 10);
    for (let k = 0; k < pts.length; k += 2) { const r = Math.round(pts[k + 1] - pts[k] * t) + hh; if (r >= 0 && r < rows.length) rows[r]++; }
    let score = 0; for (let r = 1; r < rows.length; r++) score += (rows[r] - rows[r - 1]) ** 2;
    if (score > bestScore) { bestScore = score; best = a; }
  }
  return best;
}
function rotateCanvas(src, deg) {
  const a = deg * Math.PI / 180; const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.translate(c.width / 2, c.height / 2); x.rotate(a); x.drawImage(src, -src.width / 2, -src.height / 2); return c;
}
function inkBox(canvas, thresh = 235) {
  const x = canvas.getContext('2d'); const { width: W, height: H } = canvas; const d = x.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1, ink = 0;
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) { const k = (y * W + i) * 4; if (d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11 < thresh) { ink++; if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  return { x0, y0, x1, y1, ink: ink / (W * H), W, H };
}
// Replace selected pages with processed images, copy the rest untouched
async function rebuild(ctx, pages, process, dpi) {
  const { PDFDocument } = await PL(); const src = await loadDoc(ctx.files[0].bytes); const pdf = await ctx.pdf(); const out = await PDFDocument.create(); let changed = 0;
  for (let i = 0; i < pdf.numPages; i++) {
    ctx.progress(i / pdf.numPages, `Processing page ${i + 1} of ${pdf.numPages}`);
    if (!pages.has(i)) { out.addPage((await out.copyPages(src, [i]))[0]); continue; }
    const c = await renderPage(pdf, i + 1, { dpi }); const r = await process(c, i);
    if (!r) { out.addPage((await out.copyPages(src, [i]))[0]); continue; }
    changed++; const img = await out.embedJpg(await canvasBytes(r, 'image/jpeg', 0.85));
    const p = out.addPage([c.pdfSize.w, c.pdfSize.h]); p.drawImage(img, { x: 0, y: 0, width: c.pdfSize.w, height: c.pdfSize.h });
    await nextFrame();
  }
  return { out, changed };
}

export default {
  'ocr-pdf': {
    accept: 'pdf', view: 'thumbs', action: 'Run OCR', actionIcon: 'scan-text', busyText: 'Reading your document…',
    options: [...langOpts,
      { key: 'output', type: 'cards', label: 'Output', default: 'pdf', options: [['pdf', 'Searchable PDF', 'select & search text'], ['txt', 'Text file', '.txt']] },
      { key: 'dpi', type: 'select', label: 'Accuracy', default: '250', options: [['200', 'Fast'], ['250', 'Balanced'], ['300', 'Best (slower)']] },
      { key: 'pages', type: 'pages', label: 'Pages (optional)' },
      { type: 'info', html: 'Runs on your device. The OCR engine and language (≈10–20 MB) download once, then work offline. Big documents can take a few minutes on phones.' }],
    async run(ctx) {
      const v = ctx.values; const pdf = await ctx.pdf(); const idx = new Set(parsePages(v.pages, pdf.numPages)); const langs = langStr(v);
      const worker = await ocrWorker(langs, ctx.progress); const latin = langs.split('+').every(l => LATIN.has(l));
      const { PDFDocument } = await PL(); const src = await loadDoc(ctx.files[0].bytes); const out = await PDFDocument.create(); const font = await getFont(out, 'Helvetica');
      let text = '';
      try {
        for (let i = 0; i < pdf.numPages; i++) {
          if (!idx.has(i)) { if (v.output === 'pdf') out.addPage((await out.copyPages(src, [i]))[0]); continue; }
          ctx.progress(0.05 + 0.95 * i / pdf.numPages, `Recognising page ${i + 1} of ${pdf.numPages}…`);
          const c = await renderPage(pdf, i + 1, { dpi: +v.dpi, annotations: false });
          const wantPdf = v.output === 'pdf' && !latin;
          const { data } = await worker.recognize(c, {}, { text: true, blocks: true, pdf: wantPdf });
          text += `----- Page ${i + 1} -----\n${data.text}\n`;
          if (v.output !== 'pdf') continue;
          if (wantPdf && data.pdf) { const pd = await PDFDocument.load(new Uint8Array(data.pdf)); const [pg] = await out.copyPages(pd, [0]); pg.scale(c.pdfSize.w / pg.getWidth(), c.pdfSize.h / pg.getHeight()); out.addPage(pg); continue; }
          const [pg] = await out.copyPages(src, [i]); out.addPage(pg); const k = 72 / +v.dpi; const { h: H } = visualSize(pg);
          const words = data.words || (data.blocks || []).flatMap(b => b.paragraphs.flatMap(p => p.lines.flatMap(l => l.words)));
          for (const w of words) {
            const t = (w.text || '').trim(); if (!t || w.confidence < 30) continue;
            if (!canEncode(font, t)) continue;
            const bw = (w.bbox.x1 - w.bbox.x0) * k, bh = (w.bbox.y1 - w.bbox.y0) * k; const size = Math.max(2, Math.min(bh * 1.15, bw / Math.max(0.01, font.widthOfTextAtSize(t, 1))));
            const q = visualToUser(pg, w.bbox.x0 * k, H - w.bbox.y1 * k + bh * 0.15);
            pg.drawText(t, { x: q.x, y: q.y, size, font, opacity: 0, rotate: window.PDFLib.degrees(q.r) });
          }
          c.width = c.height = 0;
        }
      } finally { await worker.terminate(); }
      if (v.output === 'txt') return { files: [{ name: outName(ctx, 'ocr', 'txt'), blob: new Blob([text], { type: 'text/plain;charset=utf-8' }) }], html: textResultView(text) };
      return { files: [{ name: outName(ctx, 'searchable'), blob: await saveDoc(out) }], message: 'Your PDF is now searchable — try Ctrl+F / Find in your PDF reader.', html: textResultView(text, 10) };
    },
  },

  'ocr-image': {
    accept: 'image', multiple: true, camera: true, view: 'files', action: 'Extract text', actionIcon: 'scan-text',
    options: [...langOpts, { type: 'info', html: 'Works best with clear, straight photos. The language data downloads once.' }],
    async run(ctx) {
      const worker = await ocrWorker(langStr(ctx.values), ctx.progress); let text = '';
      try {
        for (let i = 0; i < ctx.files.length; i++) {
          ctx.progress(0.1 + 0.9 * i / ctx.files.length, `Reading ${ctx.files[i].name}…`);
          const { data } = await worker.recognize(ctx.files[i].file);
          text += (ctx.files.length > 1 ? `----- ${ctx.files[i].name} -----\n` : '') + data.text + '\n';
        }
      } finally { await worker.terminate(); }
      if (!text.trim()) throw new Error('No text could be recognised. Try a clearer photo.');
      return { files: [{ name: ctx.files.length > 1 ? 'ocr-text.txt' : outName(ctx, 'text', 'txt'), blob: new Blob([text], { type: 'text/plain;charset=utf-8' }) }], html: textResultView(text) };
    },
  },

  'deskew-pdf': {
    accept: 'pdf', view: 'thumbs', action: 'Straighten pages', actionIcon: 'ruler',
    options: [{ key: 'dpi', type: 'select', label: 'Output quality', default: '200', options: [['150', 'Good'], ['200', 'High'], ['300', 'Print']] }, { key: 'pages', type: 'pages', label: 'Pages (optional)' }, { type: 'info', html: 'Detects tilted scans (up to ±6°) and rotates them straight. Pages that are already straight are left untouched.' }],
    async run(ctx) {
      const pdf = await ctx.pdf(); const angles = {};
      const { out, changed } = await rebuild(ctx, new Set(parsePages(ctx.values.pages, pdf.numPages)), (c, i) => { const a = detectSkew(c); angles[i] = a; return Math.abs(a) >= 0.2 ? rotateCanvas(c, -a) : null; }, +ctx.values.dpi);
      if (!changed) throw new Error('All pages already look straight.');
      return { files: [{ name: outName(ctx, 'straightened'), blob: await saveDoc(out) }], message: `${changed} page${changed > 1 ? 's' : ''} straightened (${Object.entries(angles).filter(([, a]) => Math.abs(a) >= 0.2).map(([i, a]) => `p${+i + 1}: ${a.toFixed(1)}°`).slice(0, 8).join(', ')}).` };
    },
  },

  'clean-scan': {
    accept: 'pdf', view: 'thumbs', action: 'Clean up', actionIcon: 'sparkles',
    options: [
      { key: 'mode', type: 'cards', label: 'Look', default: 'doc', options: [['doc', 'Whiten', 'grey paper → white'], ['bw', 'Black & White', 'crisp text'], ['gray', 'Grayscale', 'soft'], ['enhance', 'Colour boost', 'vivid']] },
      { key: 'despeckle', type: 'check', label: 'Remove dust & specks', default: true },
      { key: 'deskew', type: 'check', label: 'Also straighten tilted pages', default: true },
      { key: 'dpi', type: 'select', label: 'Output quality', default: '200', options: [['150', 'Good'], ['200', 'High'], ['300', 'Print']] },
    ],
    async run(ctx) {
      const v = ctx.values; const pdf = await ctx.pdf();
      const { out } = await rebuild(ctx, new Set([...Array(pdf.numPages).keys()]), c => {
        if (v.deskew) { const a = detectSkew(c); if (Math.abs(a) >= 0.2) c = rotateCanvas(c, -a); }
        applyScanFilter(c, v.mode); if (v.despeckle) despeckle(c); return c;
      }, +v.dpi);
      return { files: [{ name: outName(ctx, 'clean'), blob: await saveDoc(out) }] };
    },
  },

  'auto-crop': {
    accept: 'pdf', view: 'thumbs', action: 'Auto crop', actionIcon: 'crop',
    options: [{ key: 'pad', type: 'range', label: 'Keep a margin of', default: 5, min: 0, max: 30, unit: ' mm' }, { key: 'same', type: 'seg', label: 'Crop', default: 'each', options: [['each', 'Each page separately'], ['same', 'All pages the same']] }],
    async run(ctx) {
      const pdf = await ctx.pdf(); const doc = await loadDoc(ctx.files[0].bytes); const boxes = [];
      for (let i = 0; i < pdf.numPages; i++) { ctx.progress(i / pdf.numPages, `Measuring page ${i + 1}`); boxes.push(inkBox(await renderPage(pdf, i + 1, { dpi: 60, annotations: false }))); }
      let union = null;
      if (ctx.values.same === 'same') { union = boxes.filter(b => b.x1 >= 0).reduce((u, b) => ({ x0: Math.min(u.x0, b.x0 / b.W), y0: Math.min(u.y0, b.y0 / b.H), x1: Math.max(u.x1, b.x1 / b.W), y1: Math.max(u.y1, b.y1 / b.H) }), { x0: 1, y0: 1, x1: 0, y1: 0 }); }
      let n = 0;
      doc.getPages().forEach((p, i) => {
        const b = boxes[i]; if (b.x1 < 0) return;
        const f = union || { x0: b.x0 / b.W, y0: b.y0 / b.H, x1: (b.x1 + 1) / b.W, y1: (b.y1 + 1) / b.H };
        const { w: W, h: H } = visualSize(p); const pad = ctx.values.pad * 72 / 25.4;
        const vx0 = Math.max(0, f.x0 * W - pad), vx1 = Math.min(W, f.x1 * W + pad), vyTop = Math.min(H, H - f.y0 * H + pad), vyBot = Math.max(0, H - f.y1 * H - pad);
        if (vx1 - vx0 > W * 0.98 && vyTop - vyBot > H * 0.98) return;
        const a = visualToUser(p, vx0, vyBot), c = visualToUser(p, vx1, vyTop);
        const x = Math.min(a.x, c.x), y = Math.min(a.y, c.y), w = Math.abs(a.x - c.x), hh = Math.abs(a.y - c.y);
        p.setCropBox(x, y, w, hh); p.setMediaBox(x, y, w, hh); n++;
      });
      if (!n) throw new Error('No empty borders were found to trim.');
      return { files: [{ name: outName(ctx, 'cropped'), blob: await saveDoc(doc) }], message: `${n} page${n > 1 ? 's' : ''} trimmed. Text and graphics stay sharp.` };
    },
  },

  'remove-blank-pages': {
    accept: 'pdf', view: 'thumbs', action: 'Remove blank pages', actionIcon: 'file-x',
    options: [{ key: 'sens', type: 'seg', label: 'Sensitivity', default: 'normal', options: [['strict', 'Only totally blank'], ['normal', 'Normal'], ['loose', 'Also nearly blank (scans)']] }],
    async init(ctx) {
      const pdf = await ctx.pdf(); ctx.state.ink = [];
      for (let i = 0; i < Math.min(pdf.numPages, 400); i++) ctx.state.ink.push(inkBox(await renderPage(pdf, i + 1, { dpi: 30, annotations: false }), 225).ink);
    },
    onOption(ctx, k) { if (k === 'sens') ctx.refreshView(); },
    thumbFlag: ctx => ctx.state.ink.map(x => (x <= limit(ctx.values.sens) ? 'BLANK' : '')),
    async run(ctx) {
      const doc = await loadDoc(ctx.files[0].bytes); const blank = ctx.state.ink.map((x, i) => x <= limit(ctx.values.sens) ? i : -1).filter(i => i >= 0);
      if (!blank.length) throw new Error('No blank pages were found. Try a looser sensitivity.');
      if (blank.length >= doc.getPageCount()) throw new Error('Every page looks blank — nothing was removed.');
      [...blank].reverse().forEach(i => doc.removePage(i));
      return { files: [{ name: outName(ctx, 'no-blanks'), blob: await saveDoc(doc) }], message: `Removed ${blank.length} blank page${blank.length > 1 ? 's' : ''} (${blank.map(i => i + 1).slice(0, 20).join(', ')}).` };
    },
  },
};
const limit = s => ({ strict: 0.0005, normal: 0.003, loose: 0.012 }[s] || 0.003);
function despeckle(c) {
  const x = c.getContext('2d'); const { width: W, height: H } = c; const id = x.getImageData(0, 0, W, H); const p = id.data; const dark = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) dark[i] = p[i * 4] < 140 ? 1 : 0;
  for (let y = 1; y < H - 1; y++) for (let i = 1; i < W - 1; i++) {
    const k = y * W + i; if (!dark[k]) continue;
    const n = dark[k - 1] + dark[k + 1] + dark[k - W] + dark[k + W] + dark[k - W - 1] + dark[k - W + 1] + dark[k + W - 1] + dark[k + W + 1];
    if (n <= 1) { p[k * 4] = p[k * 4 + 1] = p[k * 4 + 2] = 255; }
  }
  x.putImageData(id, 0, 0);
}
