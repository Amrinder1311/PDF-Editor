// Convert FROM PDF: images, SVG, text, HTML, Markdown, CSV, JSON, XML, grayscale, audio
import { openPdf, renderPage, canvasBlob, parsePages, extractText, pageText, toLines, rasterizeToPdf, saveDoc } from '../core/pdf.js';
import { lib } from '../core/lib.js';
import { h, ic, esc, toast, nextFrame, baseName } from '../core/ui.js';
import { toCSV, escapeHtml } from '../core/htmlpdf.js';
import { outName } from './common.js';

const rangeOpt = { key: 'pages', type: 'pages', label: 'Pages (optional)', hint: 'Leave empty for all pages.' };
const dpiOpt = { key: 'dpi', type: 'cards', label: 'Resolution', default: '150', options: [['72', 'Low', '72 DPI · web'], ['150', 'Medium', '150 DPI'], ['220', 'High', '220 DPI'], ['300', 'Print', '300 DPI']] };

function imageTool(fmt, mime, ext, { quality = true, multiTiff = false } = {}) {
  return {
    accept: 'pdf', view: 'thumbs', action: `Convert to ${fmt}`, actionIcon: 'image-down',
    options: [dpiOpt, ...(quality ? [{ key: 'quality', type: 'range', label: 'Image quality', default: 85, min: 40, max: 100, unit: '%' }] : []), rangeOpt,
      ...(multiTiff ? [{ key: 'multi', type: 'check', label: 'One multi-page TIFF file', default: true }] : []),
      { key: 'bg', type: 'check', label: 'Transparent background', show: () => ext === 'png' || ext === 'webp' }],
    async run(ctx) {
      const pdf = await ctx.pdf(); const v = ctx.values; const pages = parsePages(v.pages, pdf.numPages);
      const files = []; const tiffPages = [];
      for (let k = 0; k < pages.length; k++) {
        const i = pages[k]; ctx.progress(k / pages.length, `Converting page ${i + 1}`);
        const c = await renderPage(pdf, i + 1, { dpi: +v.dpi, bg: v.bg ? null : '#ffffff' });
        let blob;
        if (ext === 'bmp') blob = encodeBMP(c);
        else if (ext === 'tif') { if (v.multi) { tiffPages.push(rgbOf(c)); continue; } blob = await encodeTIFF([rgbOf(c)]); }
        else blob = await canvasBlob(c, mime, (+v.quality || 90) / 100);
        files.push({ name: outName(ctx, `page-${String(i + 1).padStart(String(pdf.numPages).length, '0')}`, ext), blob });
        c.width = c.height = 0; await nextFrame();
      }
      if (tiffPages.length) files.push({ name: outName(ctx, '', 'tif'), blob: await encodeTIFF(tiffPages) });
      return { files, zipName: outName(ctx, ext, 'zip'), message: `${pages.length} page${pages.length > 1 ? 's' : ''} converted to ${fmt}.`, html: gallery(files) };
    },
  };
}
function gallery(files) {
  const imgs = files.filter(f => /^image\/(jpeg|png|webp)/.test(f.blob.type)).slice(0, 24);
  if (!imgs.length) return null;
  return h('div.gallery', imgs.map(f => { const u = URL.createObjectURL(f.blob); return h('a', { href: u, download: f.name }, h('img', { src: u, alt: f.name, loading: 'lazy' }), esc(f.name)); }));
}
function rgbOf(c) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const rgb = new Uint8Array(c.width * c.height * 3); for (let i = 0, j = 0; i < d.length; i += 4) { rgb[j++] = d[i]; rgb[j++] = d[i + 1]; rgb[j++] = d[i + 2]; } return { rgb, w: c.width, h: c.height }; }
async function encodeTIFF(pages) {
  const UTIF = await lib('utif');
  const ifd = (p, off) => ({ t256: [p.w], t257: [p.h], t258: [8, 8, 8], t259: [1], t262: [2], t273: [off], t277: [3], t278: [p.h], t279: [p.rgb.length], t282: [150], t283: [150], t284: [1], t296: [2] });
  const head = new Uint8Array(UTIF.encode(pages.map(p => ifd(p, 0))));
  let off = head.length; const ifds = pages.map(p => { const d = ifd(p, off); off += p.rgb.length; return d; });
  const prefix = new Uint8Array(UTIF.encode(ifds));
  return new Blob([prefix, ...pages.map(p => p.rgb)], { type: 'image/tiff' });
}
function encodeBMP(c) {
  const w = c.width, hh = c.height, d = c.getContext('2d').getImageData(0, 0, w, hh).data;
  const row = Math.ceil(w * 3 / 4) * 4, size = 54 + row * hh; const b = new ArrayBuffer(size); const v = new DataView(b);
  v.setUint16(0, 0x424D); v.setUint32(2, size, true); v.setUint32(10, 54, true); v.setUint32(14, 40, true); v.setInt32(18, w, true); v.setInt32(22, hh, true);
  v.setUint16(26, 1, true); v.setUint16(28, 24, true); v.setUint32(34, row * hh, true); v.setInt32(38, 3780, true); v.setInt32(42, 3780, true);
  const u = new Uint8Array(b);
  for (let y = 0; y < hh; y++) { let o = 54 + (hh - 1 - y) * row; for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; u[o++] = d[i + 2]; u[o++] = d[i + 1]; u[o++] = d[i]; } }
  return new Blob([b], { type: 'image/bmp' });
}

// ── Text helpers ──
export function bodySize(pages) {
  const count = {}; for (const p of pages) for (const l of p.lines) { const s = Math.round(l.size); count[s] = (count[s] || 0) + l.text.length; }
  return +Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 11;
}
export function paragraphs(lines, body) {
  const out = []; let cur = null;
  for (const l of lines) {
    const big = l.size >= body * 1.12; const bullet = /^\s*([•●▪◦‣∙·\-*–]|\d{1,2}[.)])\s+/.test(l.text);
    if (cur && !big && !cur.big && !bullet && l.y - cur.lastY < l.size * 1.75 && Math.abs(l.size - cur.size) < 1) { cur.text += (cur.text.endsWith('-') ? '' : ' ') + l.text.trim(); cur.text = cur.text.replace(/-\s(?=[a-z])/g, ''); cur.lastY = l.y; continue; }
    cur = { text: l.text.trim(), size: l.size, big, bullet, lastY: l.y }; out.push(cur);
  }
  return out.filter(p => p.text);
}
function headingLevel(size, body) { return size >= body * 1.6 ? 1 : size >= body * 1.3 ? 2 : size >= body * 1.12 ? 3 : 0; }

export function tablesFromLines(lines) {
  const cellsOf = l => { const cells = []; let cur = null; for (const it of l.items) { if (!it.str.trim()) continue; if (cur && it.x - cur.x2 < it.size * 0.9) { cur.text += (it.x - cur.x2 > it.size * 0.15 ? ' ' : '') + it.str; cur.x2 = it.x + it.w; } else { cur = { x: it.x, x2: it.x + it.w, text: it.str }; cells.push(cur); } } return cells.map(c => ({ ...c, text: c.text.trim() })); };
  const tables = []; let block = [];
  const flush = () => { if (block.length >= 2) tables.push(block); block = []; };
  for (const l of lines) { const c = cellsOf(l); if (c.length >= 2) block.push(c); else flush(); }
  flush();
  return tables.map(rows => {
    const xs = rows.flat().map(c => c.x).sort((a, b) => a - b); const anchors = [];
    for (const x of xs) if (!anchors.length || x - anchors[anchors.length - 1] > 14) anchors.push(x);
    return rows.map(cells => { const r = Array(anchors.length).fill(''); for (const c of cells) { let k = 0; for (let j = 0; j < anchors.length; j++) if (anchors[j] <= c.x + 14) k = j; r[k] = r[k] ? r[k] + ' ' + c.text : c.text; } return r; });
  });
}
export function tableHtml(rows) { return `<table class="report"><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }
export function textResultView(text, rows = 16) {
  const ta = h('textarea.out-text', { readonly: true, rows, 'aria-label': 'Result' }, esc(text));
  return h('div', h('div', { style: { display: 'flex', gap: '.5rem', marginBottom: '.5rem', justifyContent: 'flex-end' } }, h('button.mini-btn', { type: 'button', on: { click: async () => { try { await navigator.clipboard.writeText(text); toast('Copied to clipboard', 'success'); } catch { ta.select(); document.execCommand('copy'); toast('Copied', 'success'); } } } }, ic('copy'), 'Copy all')), ta);
}

async function readPages(ctx) {
  const pdf = await ctx.pdf(); const idx = parsePages(ctx.values.pages, pdf.numPages);
  const all = []; for (const i of idx) { ctx.progress(all.length / idx.length, `Reading page ${i + 1}`); const t = await pageText(pdf, i + 1); const lines = toLines(t.items); all.push({ num: i + 1, width: t.width, height: t.height, lines, text: lines.map(l => l.text).join('\n') }); }
  return all;
}
const noText = pages => !pages.some(p => p.text.trim());
const scannedMsg = 'No text found — this looks like a scanned PDF. Run it through OCR PDF first.';

export default {
  'pdf-to-jpg': imageTool('JPG', 'image/jpeg', 'jpg'),
  'pdf-to-png': imageTool('PNG', 'image/png', 'png', { quality: false }),
  'pdf-to-webp': imageTool('WEBP', 'image/webp', 'webp'),
  'pdf-to-bmp': imageTool('BMP', 'image/bmp', 'bmp', { quality: false }),
  'pdf-to-tiff': imageTool('TIFF', 'image/tiff', 'tif', { quality: false, multiTiff: true }),

  'pdf-to-svg': {
    accept: 'pdf', view: 'thumbs', action: 'Convert to SVG', actionIcon: 'pen-tool', options: [rangeOpt, { key: 'fonts', type: 'check', label: 'Embed fonts (larger, more accurate)', default: true }],
    async run(ctx) {
      const pdfjs = await lib('pdfjs'); const pdf = await ctx.pdf(); const idx = parsePages(ctx.values.pages, pdf.numPages); const files = [];
      for (const i of idx) {
        ctx.progress(files.length / idx.length, `Converting page ${i + 1}`);
        const page = await pdf.getPage(i + 1); const vp = page.getViewport({ scale: 1 }); let svgText;
        try {
          const ops = await page.getOperatorList(); const g = new pdfjs.SVGGraphics(page.commonObjs, page.objs); g.embedFonts = !!ctx.values.fonts;
          const svg = await g.getSVG(ops, vp); svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svgText = new XMLSerializer().serializeToString(svg);
        } catch (e) {
          const c = await renderPage(pdf, i + 1, { dpi: 200 }); const url = c.toDataURL('image/png');
          svgText = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${vp.width}" height="${vp.height}" viewBox="0 0 ${vp.width} ${vp.height}"><image width="${vp.width}" height="${vp.height}" xlink:href="${url}"/></svg>`;
        }
        files.push({ name: outName(ctx, `page-${i + 1}`, 'svg'), blob: new Blob([svgText], { type: 'image/svg+xml' }) });
      }
      return { files, zipName: outName(ctx, 'svg', 'zip') };
    },
  },

  'pdf-to-text': {
    accept: 'pdf', view: 'thumbs', action: 'Extract text', actionIcon: 'file-type',
    options: [rangeOpt, { key: 'mode', type: 'seg', label: 'Layout', default: 'para', options: [['para', 'Paragraphs'], ['lines', 'Keep lines']] }, { key: 'sep', type: 'check', label: 'Mark page breaks', default: true }],
    async run(ctx) {
      const pages = await readPages(ctx); if (noText(pages)) throw new Error(scannedMsg);
      const body = bodySize(pages);
      const text = pages.map(p => (ctx.values.sep ? `----- Page ${p.num} -----\n` : '') + (ctx.values.mode === 'lines' ? p.text : paragraphs(p.lines, body).map(x => x.text).join('\n\n'))).join('\n\n');
      return { files: [{ name: outName(ctx, '', 'txt'), blob: new Blob([text], { type: 'text/plain;charset=utf-8' }) }], html: textResultView(text) };
    },
  },

  'pdf-to-html': {
    accept: 'pdf', view: 'thumbs', action: 'Convert to HTML', actionIcon: 'code-xml',
    options: [{ key: 'mode', type: 'cards', label: 'Style', default: 'flow', options: [['flow', 'Reflowable', 'clean text, mobile friendly'], ['exact', 'Exact look', 'page images + selectable text']] }, rangeOpt],
    async run(ctx) {
      const pages = await readPages(ctx); const title = escapeHtml(baseName(ctx.files[0].name)); let bodyHtml;
      if (ctx.values.mode === 'exact') {
        const pdf = await ctx.pdf(); const parts = [];
        for (const p of pages) {
          ctx.progress(p.num / pages.length, `Rendering page ${p.num}`);
          const url = (await renderPage(pdf, p.num, { dpi: 110 })).toDataURL('image/jpeg', 0.8);
          const spans = p.lines.flatMap(l => l.items).map(it => `<span style="left:${(it.x / p.width * 100).toFixed(2)}%;top:${((it.y - it.size * 0.85) / p.height * 100).toFixed(2)}%;font-size:${(it.size / p.width * 100).toFixed(3)}cqw">${escapeHtml(it.str)}</span>`).join('');
          parts.push(`<div class="pg" style="aspect-ratio:${p.width}/${p.height}"><img src="${url}" alt="Page ${p.num}">${spans}</div>`);
        }
        bodyHtml = parts.join('\n');
        return htmlFile(ctx, title, bodyHtml, `.pg{position:relative;max-width:900px;margin:16px auto;box-shadow:0 2px 12px #0002;container-type:inline-size;background:#fff}.pg img{width:100%;display:block}.pg span{position:absolute;color:transparent;white-space:pre;line-height:1}.pg span::selection{background:#4f46e555}`);
      }
      if (noText(pages)) throw new Error(scannedMsg);
      const body = bodySize(pages);
      bodyHtml = pages.map(p => `<section id="page-${p.num}">\n${paragraphs(p.lines, body).map(x => { const lv = headingLevel(x.size, body); return lv ? `<h${lv}>${escapeHtml(x.text)}</h${lv}>` : x.bullet ? `<li>${escapeHtml(x.text.replace(/^\s*([•●▪◦‣∙·\-*–]|\d{1,2}[.)])\s+/, ''))}</li>` : `<p>${escapeHtml(x.text)}</p>`; }).join('\n')}\n</section>`).join('\n<hr>\n');
      return htmlFile(ctx, title, bodyHtml, 'body{max-width:760px;margin:2rem auto;padding:0 1rem;font:17px/1.7 system-ui,sans-serif;color:#1f2937}h1,h2,h3{line-height:1.25}hr{border:0;border-top:1px solid #e5e7eb;margin:2rem 0}');
    },
  },

  'pdf-to-markdown': {
    accept: 'pdf', view: 'thumbs', action: 'Convert to Markdown', actionIcon: 'hash', options: [rangeOpt, { key: 'sep', type: 'check', label: 'Add a divider between pages' }],
    async run(ctx) {
      const pages = await readPages(ctx); if (noText(pages)) throw new Error(scannedMsg);
      const body = bodySize(pages);
      const md = pages.map(p => paragraphs(p.lines, body).map(x => { const lv = headingLevel(x.size, body); return lv ? `${'#'.repeat(lv)} ${x.text}` : x.bullet ? x.text.replace(/^\s*[•●▪◦‣∙·*–]\s+/, '- ') : x.text; }).join('\n\n')).join(ctx.values.sep ? '\n\n---\n\n' : '\n\n');
      return { files: [{ name: outName(ctx, '', 'md'), blob: new Blob([md], { type: 'text/markdown;charset=utf-8' }) }], html: textResultView(md) };
    },
  },

  'pdf-to-csv': {
    accept: 'pdf', view: 'thumbs', action: 'Extract tables to CSV', actionIcon: 'sheet', options: [rangeOpt, { key: 'split', type: 'seg', label: 'Output', default: 'one', options: [['one', 'One CSV file'], ['each', 'One file per table']] }],
    run: ctx => tablesRun(ctx),
  },

  'pdf-to-json': { accept: 'pdf', view: 'thumbs', action: 'Export JSON', actionIcon: 'braces', options: [rangeOpt, { key: 'detail', type: 'check', label: 'Include word positions', default: false }], run: ctx => structRun(ctx, 'json') },
  'pdf-to-xml': { accept: 'pdf', view: 'thumbs', action: 'Export XML', actionIcon: 'code', options: [rangeOpt, { key: 'detail', type: 'check', label: 'Include word positions', default: false }], run: ctx => structRun(ctx, 'xml') },

  'pdf-to-grayscale': {
    accept: 'pdf', view: 'thumbs', action: 'Convert to grayscale', actionIcon: 'contrast', suffix: 'grayscale',
    options: [{ key: 'mode', type: 'seg', label: 'Colour', default: 'gray', options: [['gray', 'Grayscale'], ['bw', 'Pure black & white']] }, { key: 'dpi', type: 'select', label: 'Quality', default: '150', options: [['110', 'Smaller file'], ['150', 'Good'], ['220', 'High'], ['300', 'Print']] }, { type: 'info', html: 'Pages are re-drawn as images, so text won’t be selectable afterwards. Run OCR PDF if you need searchable text.' }],
    async apply(bytes, v, progress) {
      const pdf = await openPdf(bytes);
      return rasterizeToPdf(pdf, { dpi: +v.dpi || 150, quality: 0.8, onProgress: progress, transform: c => grayscale(c, v.mode === 'bw') });
    },
    async run(ctx) { const doc = await this.apply(ctx.files[0].bytes, ctx.values, ctx.progress); const blob = await saveDoc(doc); return { files: [{ name: outName(ctx, 'grayscale'), blob }], stats: { before: ctx.files[0].size, after: blob.size } }; },
  },

  'pdf-to-audio': {
    accept: 'pdf', view: 'thumbs', action: 'Read aloud', actionIcon: 'volume-2',
    options: () => {
      const voices = (window.speechSynthesis?.getVoices() || []);
      const pref = voices.filter(v => /^(en|hi|pa)/i.test(v.lang));
      return [
        { key: 'voice', type: 'select', label: 'Voice', default: (pref[0] || voices[0])?.name || '', options: (voices.length ? [...pref, ...voices.filter(v => !pref.includes(v))] : [{ name: '', lang: '' }]).map(v => [v.name, v.name ? `${v.name} (${v.lang})` : 'Default voice']) },
        { key: 'rate', type: 'range', label: 'Speed', default: 1, min: 0.5, max: 2, step: 0.1, format: x => `${x}×` },
        rangeOpt,
        { type: 'info', html: 'Uses your device’s built-in voices. MP3 download is coming with our server version.' },
      ];
    },
    async init(ctx) { if (!('speechSynthesis' in window)) throw new Error('Your browser does not support text-to-speech.'); if (!speechSynthesis.getVoices().length) await new Promise(r => { speechSynthesis.onvoiceschanged = r; setTimeout(r, 1200); }); },
    async run(ctx) {
      const pages = await readPages(ctx); if (noText(pages)) throw new Error(scannedMsg);
      const body = bodySize(pages); const paras = pages.flatMap(p => paragraphs(p.lines, body).map(x => x.text));
      return { title: 'Ready to listen', message: `${paras.length} paragraphs from ${pages.length} pages.`, html: audioPlayer(paras, ctx.values), files: [] };
    },
  },
};

export function grayscale(c, bw) {
  const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height); const p = d.data;
  for (let i = 0; i < p.length; i += 4) { let l = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114; if (bw) l = l > 160 ? 255 : 0; p[i] = p[i + 1] = p[i + 2] = l; }
  x.putImageData(d, 0, 0); return c;
}

function htmlFile(ctx, title, body, css) {
  const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body>\n${body}\n</body></html>`;
  return { files: [{ name: outName(ctx, '', 'html'), blob: new Blob([html], { type: 'text/html;charset=utf-8' }) }] };
}

export async function tablesRun(ctx, asResultOnly) {
  const pages = await readPages(ctx); if (noText(pages)) throw new Error(scannedMsg);
  const tables = []; pages.forEach(p => tablesFromLines(p.lines).forEach(t => tables.push({ page: p.num, rows: t })));
  if (!tables.length) throw new Error('No tables were detected in this PDF.');
  const files = ctx.values.split === 'each'
    ? tables.map((t, i) => ({ name: outName(ctx, `table-${i + 1}-p${t.page}`, 'csv'), blob: new Blob(['﻿' + toCSV(t.rows)], { type: 'text/csv;charset=utf-8' }) }))
    : [{ name: outName(ctx, 'tables', 'csv'), blob: new Blob(['﻿' + tables.map(t => toCSV(t.rows)).join('\n\n')], { type: 'text/csv;charset=utf-8' }) }];
  const preview = h('div', tables.slice(0, 5).map((t, i) => h('div', { style: { marginBottom: '1rem' } }, h('h4', { style: { fontSize: '.9rem', margin: '.5rem 0' } }, `Table ${i + 1} · page ${t.page} · ${t.rows.length} rows`), h('div.report-wrap', { html: tableHtml(t.rows.slice(0, 30)) }))));
  return { files, message: `${tables.length} table${tables.length > 1 ? 's' : ''} found. Open the CSV in Excel or Google Sheets.`, html: preview };
}

async function structRun(ctx, kind) {
  const pdf = await ctx.pdf(); const pages = await readPages(ctx); const meta = await pdf.getMetadata().catch(() => ({}));
  const data = { file: ctx.files[0].name, pageCount: pdf.numPages, info: meta.info || {}, pages: pages.map(p => ({ number: p.num, width: +p.width.toFixed(2), height: +p.height.toFixed(2), text: p.text, lines: p.lines.map(l => ({ text: l.text, x: +l.x.toFixed(1), y: +l.y.toFixed(1), size: +l.size.toFixed(1), ...(ctx.values.detail ? { words: l.items.map(i => ({ t: i.str, x: +i.x.toFixed(1), w: +i.w.toFixed(1) })) } : {}) })) })) };
  let out;
  if (kind === 'json') out = JSON.stringify(data, null, 2);
  else {
    const x = s => escapeHtml(String(s)).replace(/"/g, '&quot;');
    out = `<?xml version="1.0" encoding="UTF-8"?>\n<document file="${x(data.file)}" pages="${data.pageCount}">\n  <info>${Object.entries(data.info).filter(([, v]) => typeof v !== 'object').map(([k, v]) => `<${k.replace(/[^\w]/g, '')}>${x(v)}</${k.replace(/[^\w]/g, '')}>`).join('')}</info>\n` +
      data.pages.map(p => `  <page number="${p.number}" width="${p.width}" height="${p.height}">\n${p.lines.map(l => `    <line x="${l.x}" y="${l.y}" size="${l.size}">${x(l.text)}</line>`).join('\n')}\n  </page>`).join('\n') + '\n</document>';
  }
  return { files: [{ name: outName(ctx, '', kind), blob: new Blob([out], { type: kind === 'json' ? 'application/json' : 'application/xml' }) }], html: textResultView(out.slice(0, 200000)) };
}

function audioPlayer(paras, v) {
  const synth = window.speechSynthesis; let i = 0, playing = false;
  const now = h('div.audio-now'); const status = h('span', { style: { fontSize: '.85rem', color: 'var(--text-3)' } });
  const show = () => { now.innerHTML = paras.slice(Math.max(0, i - 1), i + 3).map((p, k) => (k === (i > 0 ? 1 : 0) ? `<mark>${esc(p)}</mark>` : esc(p))).join('<br><br>'); status.textContent = `Paragraph ${i + 1} of ${paras.length}`; };
  const speak = () => {
    if (i >= paras.length) { playing = false; btn.innerHTML = ic('play') + 'Play'; i = 0; show(); return; }
    const u = new SpeechSynthesisUtterance(paras[i]); const voice = synth.getVoices().find(x => x.name === v.voice); if (voice) { u.voice = voice; u.lang = voice.lang; } u.rate = +v.rate || 1;
    u.onend = () => { if (playing) { i++; show(); speak(); } };
    synth.speak(u);
  };
  const jump = d => { const was = playing; playing = false; synth.cancel(); i = Math.max(0, Math.min(paras.length - 1, i + d)); show(); if (was) setTimeout(() => { playing = true; speak(); }, 60); };
  const btn = h('button.btn.btn-primary.btn-lg', { type: 'button', on: { click: () => { if (playing) { playing = false; synth.cancel(); btn.innerHTML = ic('play') + 'Play'; } else { playing = true; synth.cancel(); speak(); btn.innerHTML = ic('pause') + 'Pause'; } } } }, ic('play'), 'Play');
  const ctl = h('div', { style: { display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' } }, btn,
    h('button.btn.btn-ghost', { type: 'button', 'aria-label': 'Previous', on: { click: () => jump(-1) } }, ic('skip-back')),
    h('button.btn.btn-ghost', { type: 'button', 'aria-label': 'Next', on: { click: () => jump(1) } }, ic('skip-forward')), status);
  window.addEventListener('hashchange', () => synth.cancel(), { once: true });
  show();
  return h('div.audio-player', ctl, now);
}
