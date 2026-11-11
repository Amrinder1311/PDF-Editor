// Extract & View: viewer, text, images, tables, links, fonts, attachments, metadata, counter, inspector
import { loadDoc, PL, renderPage, canvasBlob, pageText, toLines, parsePages } from '../core/pdf.js';
import { lib } from '../core/lib.js';
import { h, ic, esc, fmtBytes, toast, nextFrame } from '../core/ui.js';
import { toCSV } from '../core/htmlpdf.js';
import { outName } from './common.js';
import convertFrom, { tablesRun, textResultView } from './convert-from.js';

const table = (head, rows) => h('div.report-wrap', h('table.report', h('thead', h('tr', head.map(c => h('th', esc(c))))), h('tbody', rows.map(r => h('tr', r.map(c => h('td', c instanceof Node ? c : esc(String(c ?? '')))))))));
const csvFile = (name, head, rows) => ({ name, blob: new Blob(['\uFEFF' + toCSV([head, ...rows.map(r => r.map(String))])], { type: 'text/csv;charset=utf-8' }) });

export async function walkFonts(doc) {
  const P = await PL(); const N = n => P.PDFName.of(n); const ctx = doc.context; const fonts = new Map(); const seenRes = new Set();
  const visitRes = (res, page) => {
    res = ctx.lookup(res); if (!(res instanceof P.PDFDict)) return;
    const fd = ctx.lookup(res.get(N('Font')));
    if (fd instanceof P.PDFDict) for (const [, ref] of fd.entries()) {
      const key = ref instanceof P.PDFRef ? ref.tag : Math.random(); const f = ctx.lookup(ref); if (!(f instanceof P.PDFDict)) continue;
      if (!fonts.has(key)) {
        let base = String(f.get(N('BaseFont')) || '').replace(/^\//, ''); const sub = String(f.get(N('Subtype')) || '').replace(/^\//, '');
        let desc = ctx.lookup(f.get(N('FontDescriptor')));
        if (!desc && sub === 'Type0') { const df = ctx.lookup(ctx.lookup(f.get(N('DescendantFonts')))?.get?.(0)); desc = ctx.lookup(df?.get?.(N('FontDescriptor'))); }
        const embedded = !!(desc && (desc.get(N('FontFile')) || desc.get(N('FontFile2')) || desc.get(N('FontFile3'))));
        const enc = f.get(N('Encoding')); fonts.set(key, { name: base.replace(/^[A-Z]{6}\+/, '') || '(unnamed)', subset: /^[A-Z]{6}\+/.test(base), type: sub, embedded: sub === 'Type3' || embedded, encoding: enc instanceof P.PDFName ? String(enc).slice(1) : enc ? 'Custom' : 'Built-in', pages: new Set() });
      }
      fonts.get(key).pages.add(page);
    }
    const xo = ctx.lookup(res.get(N('XObject')));
    if (xo instanceof P.PDFDict) for (const [, ref] of xo.entries()) { if (ref instanceof P.PDFRef && seenRes.has(ref.tag)) continue; if (ref instanceof P.PDFRef) seenRes.add(ref.tag); const x = ctx.lookup(ref); if (String(x?.dict?.get(N('Subtype'))) === '/Form') visitRes(x.dict.get(N('Resources')), page); }
  };
  doc.getPages().forEach((p, i) => visitRes(p.node.Resources(), i + 1));
  return [...fonts.values()];
}

async function pageImages(pdf, i, minSize) {
  const pdfjs = await lib('pdfjs'); const page = await pdf.getPage(i); const ops = await page.getOperatorList(); const out = [];
  const want = new Set([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintImageXObjectRepeat, pdfjs.OPS.paintJpegXObject].filter(Boolean));
  for (let k = 0; k < ops.fnArray.length; k++) {
    if (!want.has(ops.fnArray[k])) continue;
    const name = ops.argsArray[k][0]; const store = String(name).startsWith('g_') ? page.commonObjs : page.objs;
    const img = await new Promise(r => { try { store.get(name, r); } catch { r(null); } setTimeout(() => r(null), 5000); });
    if (!img || (img.width < minSize && img.height < minSize)) continue;
    out.push({ name, img });
  }
  return out;
}
function imgToCanvas(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d');
  if (img.bitmap) { x.drawImage(img.bitmap, 0, 0); return c; }
  if (img instanceof HTMLImageElement || img instanceof ImageBitmap) { x.drawImage(img, 0, 0); return c; }
  const id = x.createImageData(img.width, img.height); const d = img.data; const n = img.width * img.height;
  if (img.kind === 3 || d.length === n * 4) id.data.set(d.subarray(0, n * 4));
  else if (img.kind === 2 || d.length === n * 3) for (let i = 0, j = 0; i < n; i++) { id.data[j++] = d[i * 3]; id.data[j++] = d[i * 3 + 1]; id.data[j++] = d[i * 3 + 2]; id.data[j++] = 255; }
  else { const rowBytes = Math.ceil(img.width / 8); for (let y = 0; y < img.height; y++) for (let x2 = 0; x2 < img.width; x2++) { const bit = (d[y * rowBytes + (x2 >> 3)] >> (7 - (x2 & 7))) & 1; const v = bit ? 255 : 0; const o = (y * img.width + x2) * 4; id.data[o] = id.data[o + 1] = id.data[o + 2] = v; id.data[o + 3] = 255; } }
  x.putImageData(id, 0, 0); return c;
}

export default {
  'pdf-viewer': {
    accept: 'pdf', view: 'custom', action: 'Open in new tab', actionIcon: 'external-link', noOptionsText: 'Use the toolbar above the pages to zoom and search. Press the button below to open the PDF in your browser’s own viewer for printing.',
    options: [],
    renderView(body, ctx, bar) {
      let zoom = 1; let pdf;
      const wrap = h('div.viewer-pages'); const info = h('span', { style: { fontSize: '.8rem', color: 'var(--text-3)' } });
      const search = h('input.option-input', { type: 'search', placeholder: 'Search in PDF…', style: { minHeight: '34px', width: '160px', padding: '.3rem .6rem' }, 'aria-label': 'Search text' });
      const draw = async () => {
        wrap.innerHTML = ''; pdf ||= await ctx.pdf(); const w = Math.min(1100, body.clientWidth - 30) * zoom;
        for (let i = 1; i <= pdf.numPages; i++) {
          const slot = h('div', { 'data-p': i, style: { width: w + 'px', maxWidth: '100%', minHeight: '200px', position: 'relative' } }); wrap.appendChild(slot);
          slot._load = async () => { const c = await renderPage(pdf, i, { width: w * Math.min(2, devicePixelRatio || 1) }); c.style.width = '100%'; slot.innerHTML = ''; slot.style.minHeight = ''; slot.appendChild(c); slot.appendChild(h('div', { style: { textAlign: 'center', fontSize: '.75rem', color: 'var(--text-3)', marginTop: '.3rem' } }, `${i} / ${pdf.numPages}`)); };
          io.observe(slot);
        }
      };
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); e.target._load(); } }), { root: body, rootMargin: '600px' });
      const doSearch = async () => {
        const q = search.value.trim(); if (!q) return; pdf ||= await ctx.pdf();
        for (let i = 1; i <= pdf.numPages; i++) { const { items } = await pageText(pdf, i); if (items.some(it => it.str.toLowerCase().includes(q.toLowerCase()))) { wrap.querySelector(`[data-p="${i}"]`)?.scrollIntoView({ behavior: 'smooth' }); info.textContent = `Found on page ${i}`; return; } }
        info.textContent = 'Not found';
      };
      search.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
      bar.append(h('div.sel-tools.extra', search, h('button.mini-btn.icon-only', { type: 'button', 'aria-label': 'Zoom out', on: { click: () => { zoom = Math.max(0.4, zoom - 0.2); draw(); } } }, ic('zoom-out')), h('button.mini-btn.icon-only', { type: 'button', 'aria-label': 'Zoom in', on: { click: () => { zoom = Math.min(3, zoom + 0.2); draw(); } } }, ic('zoom-in')), info));
      body.style.maxHeight = '80vh'; body.appendChild(wrap); draw();
    },
    async run(ctx) { const url = URL.createObjectURL(new Blob([ctx.files[0].bytes], { type: 'application/pdf' })); window.open(url, '_blank', 'noopener'); return null; },
  },

  'extract-text': { ...convertFrom['pdf-to-text'] },
  'extract-tables': { ...convertFrom['pdf-to-csv'], action: 'Find tables', run: ctx => tablesRun(ctx) },

  'extract-images': {
    accept: 'pdf', view: 'thumbs', action: 'Extract images', actionIcon: 'images',
    options: [{ key: 'format', type: 'seg', label: 'Save as', default: 'png', options: [['png', 'PNG (lossless)'], ['jpg', 'JPG (smaller)']] }, { key: 'min', type: 'select', label: 'Skip small images (icons, lines)', default: '64', options: [['0', 'Keep all'], ['64', 'Smaller than 64 px'], ['200', 'Smaller than 200 px']] }, { key: 'pages', type: 'pages', label: 'Pages (optional)' }],
    async run(ctx) {
      const pdf = await ctx.pdf(); const files = []; const seen = new Set(); const idx = parsePages(ctx.values.pages, pdf.numPages);
      for (const i of idx) {
        ctx.progress(files.length ? i / pdf.numPages : i / pdf.numPages, `Scanning page ${i + 1}`);
        for (const { name, img } of await pageImages(pdf, i + 1, +ctx.values.min)) {
          const key = String(name).startsWith('g_') ? name : `${i}-${name}`; if (seen.has(key)) continue; seen.add(key);
          const c = imgToCanvas(img); const ext = ctx.values.format;
          files.push({ name: outName(ctx, `p${i + 1}-img${files.length + 1}`, ext), blob: await canvasBlob(c, ext === 'jpg' ? 'image/jpeg' : 'image/png', 0.92) });
        }
        await nextFrame();
      }
      if (!files.length) throw new Error('No images were found in this PDF.');
      const gal = h('div.gallery', files.slice(0, 30).map(f => { const u = URL.createObjectURL(f.blob); return h('a', { href: u, download: f.name }, h('img', { src: u, alt: '', loading: 'lazy' }), esc(f.name)); }));
      return { files, zipName: outName(ctx, 'images', 'zip'), message: `${files.length} image${files.length > 1 ? 's' : ''} found.`, html: gal };
    },
  },

  'extract-links': {
    accept: 'pdf', view: 'thumbs', action: 'Find links', actionIcon: 'link-2', options: [{ key: 'text', type: 'check', label: 'Also find web addresses written in the text', default: true }],
    async run(ctx) {
      const pdf = await ctx.pdf(); const rows = []; const seen = new Set();
      for (let i = 1; i <= pdf.numPages; i++) {
        ctx.progress(i / pdf.numPages, `Reading page ${i}`); const page = await pdf.getPage(i);
        for (const a of await page.getAnnotations()) if (a.subtype === 'Link') { const t = a.url || a.unsafeUrl || (a.dest ? 'Internal: jump to page' : a.action || ''); if (t) { rows.push([i, 'Link', t]); seen.add(i + t); } }
        if (ctx.values.text) { const { items } = await pageText(pdf, i); const txt = toLines(items).map(l => l.text).join('\n'); for (const m of txt.matchAll(/\b(?:https?:\/\/|www\.)[^\s<>"')\]]+|[\w.+-]+@[\w-]+\.[\w.]+/gi)) { const u = m[0].replace(/[.,;:]$/, ''); if (!seen.has(i + u)) { rows.push([i, u.includes('@') && !u.startsWith('http') ? 'Email (text)' : 'URL (text)', u]); seen.add(i + u); } } }
      }
      if (!rows.length) throw new Error('No links were found.');
      return { files: [csvFile(outName(ctx, 'links', 'csv'), ['Page', 'Type', 'Link'], rows)], message: `${rows.length} link${rows.length > 1 ? 's' : ''} found.`, html: table(['Page', 'Type', 'Link'], rows.slice(0, 400).map(r => [r[0], r[1], /^(https?:|www\.)/.test(r[2]) ? h('a', { href: /^www\./.test(r[2]) ? 'https://' + r[2] : r[2], target: '_blank', rel: 'noopener noreferrer' }, esc(r[2])) : r[2]])) };
    },
  },

  'extract-fonts': {
    accept: 'pdf', view: 'none', action: 'List fonts', actionIcon: 'case-sensitive', options: [],
    async run(ctx) {
      const fonts = await walkFonts(await loadDoc(ctx.files[0].bytes)); if (!fonts.length) throw new Error('No fonts found — this PDF may be scanned images only.');
      const rows = fonts.map(f => [f.name, f.type, f.embedded ? (f.subset ? 'Embedded subset' : 'Embedded') : 'Not embedded', f.encoding, [...f.pages].slice(0, 12).join(', ') + (f.pages.size > 12 ? '…' : '')]);
      const missing = fonts.filter(f => !f.embedded).length;
      return { files: [csvFile(outName(ctx, 'fonts', 'csv'), ['Font', 'Type', 'Embedding', 'Encoding', 'Pages'], rows)], message: `${fonts.length} font${fonts.length > 1 ? 's' : ''}${missing ? ` · ${missing} not embedded (may look different on other devices)` : ' · all embedded'}.`, html: table(['Font', 'Type', 'Embedding', 'Encoding', 'Pages'], rows) };
    },
  },

  'extract-attachments': {
    accept: 'pdf', view: 'none', action: 'Extract attachments', actionIcon: 'paperclip', options: [],
    async run(ctx) {
      const pdf = await ctx.pdf(); const files = []; const att = await pdf.getAttachments() || {};
      for (const a of Object.values(att)) files.push({ name: a.filename || 'attachment', blob: new Blob([a.content]) });
      for (let i = 1; i <= pdf.numPages; i++) for (const a of await (await pdf.getPage(i)).getAnnotations()) if (a.subtype === 'FileAttachment' && a.file) files.push({ name: a.file.filename || `attachment-p${i}`, blob: new Blob([a.file.content]) });
      if (!files.length) throw new Error('This PDF has no attachments.');
      return { files, zipName: outName(ctx, 'attachments', 'zip'), html: table(['File', 'Size'], files.map(f => [f.name, fmtBytes(f.blob.size)])) };
    },
  },

  'extract-metadata': {
    accept: 'pdf', view: 'none', action: 'Show metadata', actionIcon: 'info', options: [],
    async run(ctx) {
      const pdf = await ctx.pdf(); const { info = {}, metadata } = await pdf.getMetadata().catch(() => ({}));
      const fmt = v => typeof v === 'string' && /^D:\d{8}/.test(v) ? `${v.slice(2, 6)}-${v.slice(6, 8)}-${v.slice(8, 10)} ${v.slice(10, 12)}:${v.slice(12, 14)}` : typeof v === 'object' ? JSON.stringify(v) : String(v);
      const rows = Object.entries(info).filter(([k]) => k !== 'Custom').map(([k, v]) => [k, fmt(v)]);
      Object.entries(info.Custom || {}).forEach(([k, v]) => rows.push([`Custom: ${k}`, fmt(v)]));
      const xmp = metadata?.getAll?.() || {}; Object.entries(xmp).forEach(([k, v]) => rows.push([`XMP ${k}`, fmt(v)]));
      return { files: [{ name: outName(ctx, 'metadata', 'json'), blob: new Blob([JSON.stringify({ info, xmp }, null, 2)], { type: 'application/json' }) }], message: 'Want to change it? Use Edit Metadata or Sanitize PDF.', html: table(['Property', 'Value'], rows) };
    },
  },

  'word-counter': {
    accept: 'pdf', view: 'none', action: 'Count', actionIcon: 'calculator', options: [],
    async run(ctx) {
      const pdf = await ctx.pdf(); const per = []; let words = 0, chars = 0, charsNs = 0;
      for (let i = 1; i <= pdf.numPages; i++) { ctx.progress(i / pdf.numPages, `Counting page ${i}`); const t = toLines((await pageText(pdf, i)).items).map(l => l.text).join('\n'); const w = (t.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’-]*/gu) || []).length; words += w; chars += t.length; charsNs += t.replace(/\s/g, '').length; per.push([i, w, t.length]); }
      const stats = [['Pages', pdf.numPages], ['Words', words.toLocaleString()], ['Characters', chars.toLocaleString()], ['Characters (no spaces)', charsNs.toLocaleString()], ['Reading time', `${Math.max(1, Math.round(words / 220))} min`], ['Speaking time', `${Math.max(1, Math.round(words / 130))} min`], ['Average words per page', Math.round(words / pdf.numPages)]];
      return { title: `${words.toLocaleString()} words`, message: words ? `${pdf.numPages} pages` : 'No text found — this looks like a scanned PDF (use OCR PDF first).', files: [csvFile(outName(ctx, 'word-count', 'csv'), ['Page', 'Words', 'Characters'], per)], html: h('div', table(['Statistic', 'Value'], stats), h('h4', { style: { margin: '1.25rem 0 .5rem' } }, 'Per page'), table(['Page', 'Words', 'Characters'], per)) };
    },
  },

  'pdf-inspector': {
    accept: 'pdf', view: 'none', action: 'Inspect', actionIcon: 'search-code', options: [],
    async run(ctx) {
      const P = await PL(); const N = n => P.PDFName.of(n); const f = ctx.files[0]; const pdf = await ctx.pdf(); const doc = await loadDoc(f.bytes);
      const head = new TextDecoder('latin1').decode(f.bytes.slice(0, 1024)); const version = (head.match(/%PDF-(\d\.\d)/) || [])[1] || '?';
      const sizes = {}; doc.getPages().forEach(p => { const { width: w, height: hh } = p.getSize(); const k = `${Math.round(w * 25.4 / 72)} × ${Math.round(hh * 25.4 / 72)} mm${namedSize(w, hh)}`; sizes[k] = (sizes[k] || 0) + 1; });
      let annots = 0, links = 0; doc.getPages().forEach(p => { const a = p.node.lookup(N('Annots')); if (a instanceof P.PDFArray) { annots += a.size(); a.asArray().forEach(r => { if (String(doc.context.lookup(r)?.get?.(N('Subtype'))) === '/Link') links++; }); } });
      let fields = 0; try { fields = doc.getForm().getFields().length; } catch { }
      const images = doc.context.enumerateIndirectObjects().filter(([, o]) => String(o?.dict?.get?.(N('Subtype'))) === '/Image').length;
      const fonts = await walkFonts(doc); const att = Object.keys(await pdf.getAttachments() || {}).length; const outline = (await pdf.getOutline().catch(() => null))?.length || 0;
      const names = doc.catalog.lookup(N('Names')); const js = !!(names instanceof P.PDFDict && names.get(N('JavaScript'))) || !!doc.catalog.get(N('OpenAction'));
      const tagged = String(doc.catalog.lookup(N('MarkInfo'))?.get?.(N('Marked'))) === 'true' || !!doc.catalog.get(N('StructTreeRoot'));
      const meta = await pdf.getMetadata().catch(() => ({})); const xmp = meta.metadata?.getAll?.() || {}; const pdfa = xmp['pdfaid:part'] ? `PDF/A-${xmp['pdfaid:part']}${(xmp['pdfaid:conformance'] || '').toLowerCase()}` : 'No';
      let textPages = 0; for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) if ((await pageText(pdf, i)).items.length) textPages++;
      const rows = [
        ['File size', fmtBytes(f.size)], ['PDF version', version], ['Pages', pdf.numPages], ['Page sizes', Object.entries(sizes).map(([k, v]) => `${k} (${v})`).join('; ')],
        ['Password / encryption', f.encrypted ? 'Yes (unlocked for inspection)' : 'No'], ['Title', meta.info?.Title || '—'], ['Author', meta.info?.Author || '—'], ['Created with', [meta.info?.Creator, meta.info?.Producer].filter(Boolean).join(' / ') || '—'],
        ['Contains text', textPages ? 'Yes' : 'No — looks scanned (use OCR)'], ['Fonts', `${fonts.length} (${fonts.filter(x => !x.embedded).length} not embedded)`], ['Images', images], ['Form fields', fields], ['Annotations', `${annots} (${links} links)`],
        ['Bookmarks', outline ? 'Yes' : 'No'], ['Attachments', att], ['JavaScript', js ? 'Yes ⚠️' : 'No'], ['Tagged (accessible)', tagged ? 'Yes' : 'No'], ['PDF/A', pdfa], ['Fast web view', /\/Linearized/.test(head) ? 'Yes' : 'No'], ['Layers', (await pdf.getOptionalContentConfig().catch(() => null))?.getGroups?.() ? 'Yes' : 'No'],
      ];
      return { title: 'Inspection report', message: f.name, files: [{ name: outName(ctx, 'report', 'json'), blob: new Blob([JSON.stringify(Object.fromEntries(rows), null, 2)], { type: 'application/json' }) }], html: table(['Property', 'Value'], rows) };
    },
  },
};

function namedSize(w, hh) {
  const s = [[595, 842, 'A4'], [612, 792, 'Letter'], [612, 1008, 'Legal'], [420, 595, 'A5'], [842, 1191, 'A3']];
  for (const [a, b, n] of s) if ((Math.abs(w - a) < 4 && Math.abs(hh - b) < 4) || (Math.abs(w - b) < 4 && Math.abs(hh - a) < 4)) return ` · ${n}${w > hh ? ' landscape' : ''}`;
  return '';
}
