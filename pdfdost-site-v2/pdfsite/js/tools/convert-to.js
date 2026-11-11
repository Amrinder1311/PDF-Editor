// Convert TO PDF: images, HEIC, TIFF, camera scans, text, markdown, CSV, HTML, JSON/XML, code
import { PL, saveDoc, loadDoc, imageForPdf, loadImage, canvasBytes, PAGE_SIZES, embedImage } from '../core/pdf.js';
import { lib } from '../core/lib.js';
import { h, ic, esc, baseName, nextFrame, toast } from '../core/ui.js';
import { htmlToPdf, textLayout, escapeHtml, parseCSV } from '../core/htmlpdf.js';
import { outName } from './common.js';

// ── Images ────────────────────────────────────────────────────
const imageOptions = (extra = []) => [
  { type: 'info', html: 'Drag images to reorder them. Each image becomes one page.' },
  ...extra,
  { key: 'size', type: 'select', label: 'Page size', default: 'A4', options: [['fit', 'Same as image'], ['A4', 'A4'], ['Letter', 'US Letter'], ['Legal', 'Legal'], ['A5', 'A5']] },
  { key: 'orient', type: 'seg', label: 'Orientation', default: 'auto', options: [['auto', 'Auto'], ['portrait', 'Portrait'], ['landscape', 'Landscape']], show: v => v.size !== 'fit' },
  { key: 'margin', type: 'seg', label: 'Margin', default: '0', options: [['0', 'None'], ['18', 'Small'], ['42', 'Large']] },
  { key: 'fit', type: 'seg', label: 'Image fit', default: 'contain', options: [['contain', 'Fit whole image'], ['cover', 'Fill page']], show: v => v.size !== 'fit' },
  { key: 'quality', type: 'select', label: 'Image quality', default: 'balanced', options: [['original', 'Original (largest file)'], ['balanced', 'Balanced (recommended)'], ['small', 'Small file']] },
  { key: 'separate', type: 'check', label: 'Create a separate PDF for each image' },
];

async function decodeImages(entry, filter) {
  const f = entry.file; const name = f.name.toLowerCase();
  if (/\.(heic|heif)$/.test(name) || /hei[cf]/.test(f.type)) {
    const heic2any = await lib('heic2any');
    const out = await heic2any({ blob: f, toType: 'image/jpeg', quality: 0.92, multiple: true });
    return (Array.isArray(out) ? out : [out]).map(b => new File([b], f.name + '.jpg', { type: 'image/jpeg' }));
  }
  if (/\.tiff?$/.test(name) || /tiff/.test(f.type)) {
    const UTIF = await lib('utif');
    const buf = await f.arrayBuffer(); const ifds = UTIF.decode(buf); const res = [];
    for (const ifd of ifds) {
      UTIF.decodeImage(buf, ifd); if (!ifd.width) continue;
      const rgba = UTIF.toRGBA8(ifd); const c = document.createElement('canvas'); c.width = ifd.width; c.height = ifd.height;
      c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer), ifd.width, ifd.height), 0, 0);
      res.push(new File([await canvasBytes(c, 'image/png')], 'page.png', { type: 'image/png' }));
    }
    return res;
  }
  return [f];
}

async function exifRotated(file) {
  if (file.type !== 'image/jpeg') return false;
  const v = new DataView(await file.slice(0, 65536).arrayBuffer());
  if (v.getUint16(0) !== 0xFFD8) return false;
  let o = 2;
  while (o < v.byteLength - 4) {
    const m = v.getUint16(o); const len = v.getUint16(o + 2);
    if (m === 0xFFE1 && v.getUint32(o + 4) === 0x45786966) {
      const t = o + 10; const le = v.getUint16(t) === 0x4949; const ifd = t + v.getUint32(t + 4, le); const n = v.getUint16(ifd, le);
      for (let i = 0; i < n; i++) { const e = ifd + 2 + i * 12; if (v.getUint16(e, le) === 0x0112) return v.getUint16(e + 8, le) !== 1; }
      return false;
    }
    if ((m & 0xFF00) !== 0xFF00) break; o += 2 + len;
  }
  return false;
}

async function prepImage(file, quality, filter) {
  const q = { original: [8000, 0.95], balanced: [2400, 0.85], small: [1500, 0.68] }[quality] || [2400, 0.85];
  const rotated = await exifRotated(file);
  if (filter && filter !== 'none') {
    const img = await loadImage(file);
    const s = Math.min(1, q[0] / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
    applyScanFilter(c, filter);
    return { bytes: await canvasBytes(c, 'image/jpeg', q[1]), type: 'jpg', w: c.width, h: c.height };
  }
  return imageForPdf(file, { maxDim: q[0], quality: q[1], forceJpeg: (quality !== 'original' && file.type !== 'image/png') || rotated });
}

export function applyScanFilter(c, filter) {
  const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height); const p = d.data;
  if (filter === 'enhance') { for (let i = 0; i < p.length; i += 4) for (let k = 0; k < 3; k++) p[i + k] = clamp((p[i + k] - 128) * 1.25 + 140); }
  else {
    const hist = new Uint32Array(256);
    for (let i = 0; i < p.length; i += 4) { const l = (p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114) | 0; p[i] = l; hist[l]++; }
    const total = p.length / 4; const pct = q => { let s = 0; for (let i = 0; i < 256; i++) { s += hist[i]; if (s >= total * q) return i; } return 255; };
    let lo = pct(0.02), hi = pct(filter === 'doc' ? 0.6 : 0.98); if (hi - lo < 30) { lo = 0; hi = 255; }
    const t = otsu(hist, total);
    for (let i = 0; i < p.length; i += 4) {
      let l = p[i];
      if (filter === 'doc') l = clamp((l - lo) * 255 / (hi - lo));
      if (filter === 'bw') l = l > t ? 255 : 0;
      p[i] = p[i + 1] = p[i + 2] = l;
    }
  }
  x.putImageData(d, 0, 0);
}
const clamp = v => v < 0 ? 0 : v > 255 ? 255 : v;
function otsu(hist, total) { let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i]; let sB = 0, wB = 0, max = 0, t = 128; for (let i = 0; i < 256; i++) { wB += hist[i]; if (!wB) continue; const wF = total - wB; if (!wF) break; sB += i * hist[i]; const mB = sB / wB, mF = (sum - sB) / wF; const v = wB * wF * (mB - mF) ** 2; if (v > max) { max = v; t = i; } } return t; }

function placeImage(page, img, im, v) {
  const W = page.getWidth(), H = page.getHeight(); const m = +v.margin || 0;
  const bw = W - 2 * m, bh = H - 2 * m;
  const s = v.size === 'fit' ? bw / im.w : (v.fit === 'cover' ? Math.max(bw / im.w, bh / im.h) : Math.min(bw / im.w, bh / im.h));
  const w = im.w * s, hh = im.h * s;
  page.drawImage(img, { x: m + (bw - w) / 2, y: m + (bh - hh) / 2, width: w, height: hh });
}
function pageFor(doc, im, v) {
  if (v.size === 'fit') { const k = 842 / Math.max(im.w, im.h); const m = +v.margin || 0; return doc.addPage([im.w * k + 2 * m, im.h * k + 2 * m]); }
  let [w, hh] = PAGE_SIZES[v.size];
  const land = v.orient === 'landscape' || (v.orient === 'auto' && im.w > im.h);
  if (land) [w, hh] = [hh, w];
  return doc.addPage([w, hh]);
}

async function imagesRun(ctx, filterKey) {
  const { PDFDocument } = await PL(); const v = ctx.values;
  const files = []; let doc = await PDFDocument.create(); let count = 0;
  for (let i = 0; i < ctx.files.length; i++) {
    ctx.progress(i / ctx.files.length, `Adding ${ctx.files[i].name}`);
    let parts;
    try { parts = await decodeImages(ctx.files[i]); } catch (e) { throw new Error(`Couldn’t read ${ctx.files[i].name}. ${e.message || ''}`); }
    for (const part of parts) {
      const im = await prepImage(part, v.quality, filterKey ? v[filterKey] : null);
      const img = await embedImage(doc, im); placeImage(pageFor(doc, im, v), img, im, v); count++;
      if (v.separate) { files.push({ name: `${baseName(ctx.files[i].name)}${parts.length > 1 ? '-' + count : ''}.pdf`, blob: await saveDoc(doc) }); doc = await PDFDocument.create(); }
    }
    await nextFrame();
  }
  if (!v.separate) files.push({ name: ctx.files.length === 1 ? outName(ctx, '') : (filterKey ? 'scan.pdf' : 'images.pdf'), blob: await saveDoc(doc) });
  return { files, message: `${count} image${count > 1 ? 's' : ''} converted to PDF.` };
}

const imageTool = (title, extra = {}) => ({ accept: 'image', multiple: true, view: 'files', action: 'Convert to PDF', actionIcon: 'file-down', uploadTitle: title, options: imageOptions(), run: ctx => imagesRun(ctx), ...extra });

// ── Text-type sources (shared editor view) ────────────────────
function textSource({ accept, placeholder, sample = '' }) {
  return {
    noFile: true, accept, viewTitle: 'Your content',
    async init(ctx) {
      ctx.state.text ??= sample;
      if (ctx.files[0]?.file) ctx.state.text = await ctx.files[0].file.text();
    },
    renderView(body, ctx, bar) {
      const ta = h('textarea.out-text', { placeholder, spellcheck: false, 'aria-label': 'Content', style: { minHeight: '52vh', maxHeight: 'none', resize: 'vertical' }, on: { input: e => { ctx.state.text = e.target.value; } } }, esc(ctx.state.text || ''));
      const input = h('input', { type: 'file', accept, style: { display: 'none' }, on: { change: async e => { const f = e.target.files[0]; if (!f) return; ctx.state.text = await f.text(); ctx.state.fileName = f.name; ta.value = ctx.state.text; toast(`Loaded ${f.name}`, 'success'); } } });
      bar.append(h('div.sel-tools.extra', input, h('button.mini-btn', { type: 'button', on: { click: () => input.click() } }, ic('folder-open'), 'Open file'), h('button.mini-btn', { type: 'button', on: { click: () => { ta.value = ''; ctx.state.text = ''; ta.focus(); } } }, ic('eraser'), 'Clear')));
      body.appendChild(ta);
    },
  };
}
const nameFor = (ctx, fallback) => `${baseName(ctx.state.fileName || ctx.files[0]?.name || fallback)}.pdf`;
const pageOpts = [
  { key: 'size', type: 'select', label: 'Page size', default: 'A4', options: Object.keys(PAGE_SIZES).map(k => [k, k]) },
  { key: 'orient', type: 'seg', label: 'Orientation', default: 'portrait', options: [['portrait', 'Portrait'], ['landscape', 'Landscape']] },
  { key: 'margin', type: 'seg', label: 'Margins', default: '50', options: [['20', 'Narrow'], ['50', 'Normal'], ['72', 'Wide']] },
];
const pageSize = v => { const s = PAGE_SIZES[v.size || 'A4']; return v.orient === 'landscape' ? [s[1], s[0]] : s; };
const need = ctx => !String(ctx.state.text || '').trim() ? 'Type, paste or open some content first' : null;

async function htmlResult(ctx, html, css, name) {
  const doc = await htmlToPdf(html, { pageSize: pageSize(ctx.values), margin: +ctx.values.margin, css, onProgress: ctx.progress });
  return { files: [{ name, blob: await saveDoc(doc) }] };
}
const DOC_CSS = `body{font-size:15px;line-height:1.65;color:#1f2937} h1,h2,h3,h4{line-height:1.25;color:#0f172a;margin:1.2em 0 .5em} h1{font-size:2em;border-bottom:1px solid #e5e7eb;padding-bottom:.3em} h2{font-size:1.5em;border-bottom:1px solid #eef0f3;padding-bottom:.25em}
  code{background:#f3f4f6;padding:.1em .35em;border-radius:4px;font:13px ui-monospace,Menlo,Consolas,monospace} pre{background:#f6f8fa;padding:12px 14px;border-radius:8px;overflow:hidden} pre code{background:none;padding:0}
  blockquote{border-left:4px solid #c7d2fe;margin:1em 0;padding:.2em 1em;color:#4b5563;background:#f8fafc} table{border-collapse:collapse;margin:1em 0} th,td{border:1px solid #d1d5db;padding:6px 10px;text-align:left} th{background:#f3f4f6} a{color:#4f46e5} img{max-width:100%} hr{border:0;border-top:1px solid #e5e7eb;margin:1.5em 0} li{margin:.25em 0}`;

export default {
  'jpg-to-pdf': imageTool('Select JPG images'),
  'png-to-pdf': imageTool('Select PNG images'),
  'image-to-pdf': imageTool('Select images'),
  'heic-to-pdf': imageTool('Select HEIC photos', { about: 'HEIC is the default photo format on iPhones. We convert it right in your browser.' }),
  'tiff-to-pdf': imageTool('Select TIFF files', { about: 'Multi-page TIFF files become multi-page PDFs.' }),

  'scan-to-pdf': {
    accept: 'image', multiple: true, camera: true, view: 'files', action: 'Create PDF', actionIcon: 'file-down', uploadTitle: 'Scan or choose photos of documents', uploadIcon: 'camera',
    uploadHint: 'Take a photo of each page, or pick existing photos',
    options: imageOptions([{ key: 'filter', type: 'cards', label: 'Scan look', default: 'doc', options: [['doc', 'Document', 'clean & bright'], ['bw', 'Black & White', 'sharp text'], ['gray', 'Grayscale', 'soft'], ['enhance', 'Colour+', 'vivid'], ['none', 'Original', 'as taken']] }]),
    run: ctx => imagesRun(ctx, 'filter'),
  },

  'combine-files': {
    accept: 'pdfimage', multiple: true, view: 'files', action: 'Combine to PDF', actionIcon: 'files', uploadTitle: 'Select PDFs and images',
    options: [{ type: 'info', html: 'Mix PDFs and images in any order. Images are placed on their own pages.' }, ...imageOptions().slice(1, 6)],
    async run(ctx) {
      const { PDFDocument } = await PL(); const doc = await PDFDocument.create(); const v = ctx.values;
      for (let i = 0; i < ctx.files.length; i++) {
        const f = ctx.files[i]; ctx.progress(i / ctx.files.length, `Adding ${f.name}`);
        if (f.isPdf) { const src = await loadDoc(f.bytes); (await doc.copyPages(src, src.getPageIndices())).forEach(p => doc.addPage(p)); }
        else for (const part of await decodeImages(f)) { const im = await prepImage(part, v.quality); placeImage(pageFor(doc, im, v), await embedImage(doc, im), im, v); }
      }
      return { files: [{ name: 'combined.pdf', blob: await saveDoc(doc) }], message: `${ctx.files.length} files combined into ${doc.getPageCount()} pages.` };
    },
  },

  'text-to-pdf': {
    ...textSource({ accept: '.txt,.text,.log,text/plain', placeholder: 'Type or paste your text here, or open a .txt file…' }),
    action: 'Create PDF', actionIcon: 'file-down', validate: need,
    options: [
      { key: 'font', type: 'select', label: 'Font', default: 'Helvetica', options: [['Helvetica', 'Sans (Helvetica)'], ['TimesRoman', 'Serif (Times)'], ['Courier', 'Monospace (Courier)']] },
      { key: 'fontSize', type: 'range', label: 'Font size', default: 11, min: 7, max: 24, unit: ' pt' },
      ...pageOpts,
      { type: 'info', html: 'Hindi, Punjabi and other scripts are fully supported.' },
    ],
    async run(ctx) {
      const v = ctx.values;
      let doc = await textLayout(ctx.state.text, { font: v.font, size: +v.fontSize, pageSize: pageSize(v), margin: +v.margin });
      if (!doc) doc = await htmlToPdf(`<pre style="font:${v.fontSize * 1.333}px/1.45 ${v.font === 'Courier' ? 'ui-monospace,monospace' : v.font === 'TimesRoman' ? 'serif' : 'inherit'};white-space:pre-wrap;margin:0">${escapeHtml(ctx.state.text)}</pre>`, { pageSize: pageSize(v), margin: +v.margin, onProgress: ctx.progress });
      return { files: [{ name: nameFor(ctx, 'text'), blob: await saveDoc(doc) }] };
    },
  },

  'markdown-to-pdf': {
    ...textSource({ accept: '.md,.markdown,.txt,text/markdown', placeholder: '# Title\n\nWrite **Markdown** here…', sample: '# My document\n\nWrite **Markdown** here — headings, lists, tables and code all work.\n\n- Point one\n- Point two\n\n| Item | Price |\n|---|---|\n| Tea | ₹20 |\n' }),
    action: 'Create PDF', actionIcon: 'file-down', validate: need,
    options: [...pageOpts, { key: 'theme', type: 'seg', label: 'Style', default: 'github', options: [['github', 'Clean'], ['serif', 'Book'], ['compact', 'Compact']] }],
    async run(ctx) {
      const marked = await lib('marked');
      const html = (marked.parse || marked)(ctx.state.text, { gfm: true, breaks: false });
      const extra = { serif: 'body{font-family:Georgia,"Times New Roman",serif;font-size:16px}', compact: 'body{font-size:12.5px;line-height:1.45} h1{font-size:1.6em}' }[ctx.values.theme] || '';
      return htmlResult(ctx, sanitize(html), DOC_CSS + extra, nameFor(ctx, 'markdown'));
    },
  },

  'csv-to-pdf': {
    ...textSource({ accept: '.csv,.tsv,text/csv', placeholder: 'Name,Class,Marks\nAman,10,92\nPriya,10,95' }),
    action: 'Create PDF', actionIcon: 'file-down', validate: need,
    options: [
      { key: 'header', type: 'check', label: 'First row is a header', default: true },
      { key: 'stripes', type: 'check', label: 'Striped rows', default: true },
      { key: 'fontSize', type: 'range', label: 'Font size', default: 11, min: 6, max: 16, unit: ' px' },
      { ...pageOpts[0] }, { ...pageOpts[1], default: 'landscape' }, { ...pageOpts[2], default: '20' },
    ],
    async run(ctx) {
      const rows = parseCSV(ctx.state.text); if (!rows.length) throw new Error('No rows found in the CSV.');
      const v = ctx.values; const [head, ...body] = v.header ? rows : [null, ...rows];
      const html = `<table>${head ? `<thead><tr>${head.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>` : ''}<tbody>${body.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      const css = `table{width:100%;border-collapse:collapse;font-size:${v.fontSize}px} th{background:#4f46e5;color:#fff;text-align:left} th,td{padding:5px 7px;border:1px solid #d1d5db} ${v.stripes ? 'tbody tr:nth-child(even){background:#f3f4f6}' : ''}`;
      return htmlResult(ctx, html, css, nameFor(ctx, 'table'));
    },
  },

  'html-to-pdf': {
    ...textSource({ accept: '.html,.htm,text/html', placeholder: '<h1>Hello</h1>\n<p>Paste HTML code or open an .html file…</p>' }),
    action: 'Create PDF', actionIcon: 'file-down', validate: need,
    options: [...pageOpts, { type: 'info', html: 'Scripts are not run. Images must be online (https) or embedded. To save a live website, use <a href="#/url-to-pdf">Webpage to PDF</a>.' }],
    run: ctx => htmlResult(ctx, sanitize(ctx.state.text), '', nameFor(ctx, 'page')),
  },

  'json-to-pdf': {
    ...textSource({ accept: '.json,.xml,application/json,text/xml,application/xml', placeholder: '{ "paste": "JSON or XML here" }' }),
    action: 'Create PDF', actionIcon: 'file-down', validate: need,
    options: [{ key: 'pretty', type: 'check', label: 'Format nicely (pretty print)', default: true }, { key: 'lineNumbers', type: 'check', label: 'Line numbers', default: true }, { key: 'fontSize', type: 'range', label: 'Font size', default: 9, min: 6, max: 14, unit: ' pt' }, ...pageOpts],
    async run(ctx) {
      let t = ctx.state.text.trim();
      if (ctx.values.pretty) { if (/^[[{]/.test(t)) { try { t = JSON.stringify(JSON.parse(t), null, 2); } catch (e) { throw new Error('This is not valid JSON: ' + e.message); } } else if (t.startsWith('<')) t = prettyXml(t); }
      return codeResult(ctx, t, nameFor(ctx, 'data'));
    },
  },

  'code-to-pdf': {
    ...textSource({ accept: '.js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.cs,.go,.rs,.rb,.php,.swift,.kt,.css,.scss,.html,.sql,.sh,.yml,.yaml,.json,.xml,.txt,.md', placeholder: '// paste or open source code…' }),
    action: 'Create PDF', actionIcon: 'file-down', validate: need,
    options: [{ key: 'lineNumbers', type: 'check', label: 'Line numbers', default: true }, { key: 'fontSize', type: 'range', label: 'Font size', default: 9, min: 6, max: 14, unit: ' pt' }, { key: 'header', type: 'check', label: 'File name in page header', default: true }, ...pageOpts],
    run: ctx => codeResult(ctx, ctx.state.text, nameFor(ctx, 'code')),
  },
};

async function codeResult(ctx, text, name) {
  const v = ctx.values;
  let doc = await textLayout(text, { font: 'Courier', size: +v.fontSize, pageSize: pageSize(v), margin: +v.margin * 0.7, lineNumbers: v.lineNumbers, lineHeight: 1.3, header: v.header ? (ctx.state.fileName || '') : '' });
  if (!doc) doc = await htmlToPdf(`<pre style="font:${v.fontSize * 1.333}px/1.4 ui-monospace,Menlo,Consolas,monospace;margin:0">${escapeHtml(text).split('\n').map((l, i) => v.lineNumbers ? `<span style="color:#999;user-select:none">${String(i + 1).padStart(4)}  </span>${l}` : l).join('\n')}</pre>`, { pageSize: pageSize(v), margin: +v.margin * 0.7, onProgress: ctx.progress });
  return { files: [{ name, blob: await saveDoc(doc) }] };
}
function prettyXml(xml) {
  let depth = 0; return xml.replace(/>\s*</g, '><').replace(/</g, '\n<').trim().split('\n').map(line => {
    if (/^<\//.test(line)) depth = Math.max(0, depth - 1);
    const out = '  '.repeat(depth) + line;
    if (/^<[^!?/][^>]*[^/]>$/.test(line) && !/<\/[^>]+>$/.test(line)) depth++;
    return out;
  }).join('\n');
}
// Remove scripts / event handlers from user HTML before rendering
function sanitize(html) {
  const d = new DOMParser().parseFromString(html, 'text/html');
  d.querySelectorAll('script,iframe,object,embed,link[rel=import]').forEach(e => e.remove());
  d.querySelectorAll('*').forEach(el => [...el.attributes].forEach(a => { if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name); }));
  return (d.head.querySelector('style') ? [...d.head.querySelectorAll('style')].map(s => s.outerHTML).join('') : '') + d.body.innerHTML;
}
