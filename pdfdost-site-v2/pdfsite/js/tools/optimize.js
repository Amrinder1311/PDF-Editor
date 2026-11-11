// Optimize tools: compress, reduce to size, optimize images, flatten, clean up, repair
import { loadDoc, saveDoc, PL, openPdf, rasterizeToPdf, canvasBytes } from '../core/pdf.js';
import { fmtBytes, nextFrame } from '../core/ui.js';
import { outName } from './common.js';

// ── Image recompression (keeps text & vectors intact) ─────────
export async function recompressImages(doc, { quality = 0.7, maxDim = 1600, gray = false, progress } = {}) {
  const P = await PL(); const N = n => P.PDFName.of(n); const ctx = doc.context;
  const imgs = ctx.enumerateIndirectObjects().filter(([, o]) => o instanceof P.PDFRawStream && String(o.dict.get(N('Subtype'))) === '/Image');
  let done = 0, saved = 0;
  for (const [ref, s] of imgs) {
    progress?.(done++ / imgs.length * 0.9, `Optimizing image ${done} of ${imgs.length}`);
    try {
      const d = s.dict; const w = num(d.get(N('Width'))), hgt = num(d.get(N('Height')));
      if (!w || !hgt || w * hgt < 40000) continue;
      if (String(d.get(N('ImageMask'))) === 'true' || num(d.get(N('BitsPerComponent'))) !== 8) continue;
      let filters = d.get(N('Filter')); filters = filters instanceof P.PDFArray ? filters.asArray().map(String) : filters ? [String(filters)] : [];
      const comps = colorComps(ctx, d.get(N('ColorSpace')), P); if (comps !== 1 && comps !== 3) continue;
      if (d.get(N('Decode')) && filters.join() !== '/FlateDecode') continue;
      let source;
      if (filters.length === 1 && filters[0] === '/DCTDecode') source = await createImageBitmap(new Blob([s.contents], { type: 'image/jpeg' }));
      else if (filters.every(f => f === '/FlateDecode')) {
        const parms = d.get(N('DecodeParms')); if (parms && num(ctx.lookup(parms)?.get?.(N('Predictor'))) > 1) continue;
        const raw = filters.length ? P.decodePDFRawStream(s).decode() : s.contents;
        if (raw.length < w * hgt * comps) continue;
        const id = new ImageData(w, hgt); const px = id.data;
        for (let i = 0, j = 0; i < w * hgt; i++) { if (comps === 3) { px[j++] = raw[i * 3]; px[j++] = raw[i * 3 + 1]; px[j++] = raw[i * 3 + 2]; } else { px[j++] = px[j++] = px[j++] = raw[i]; } px[j++] = 255; }
        source = await createImageBitmap(id);
      } else continue;
      const k = Math.min(1, maxDim / Math.max(w, hgt));
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(hgt * k));
      const x = c.getContext('2d'); x.drawImage(source, 0, 0, c.width, c.height); source.close?.();
      if (gray) { const id = x.getImageData(0, 0, c.width, c.height); const p = id.data; for (let i = 0; i < p.length; i += 4) p[i] = p[i + 1] = p[i + 2] = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114; x.putImageData(id, 0, 0); }
      const bytes = await canvasBytes(c, 'image/jpeg', quality);
      if (bytes.length >= s.contents.length * 0.92) continue;
      const nd = ctx.obj({ Type: 'XObject', Subtype: 'Image', Width: c.width, Height: c.height, ColorSpace: 'DeviceRGB', BitsPerComponent: 8, Filter: 'DCTDecode', Length: bytes.length });
      for (const key of ['SMask', 'Interpolate', 'Intent', 'OC', 'Metadata']) { const v = d.get(N(key)); if (v) nd.set(N(key), v); }
      saved += s.contents.length - bytes.length;
      ctx.assign(ref, P.PDFRawStream.of(nd, bytes));
      if (done % 4 === 0) await nextFrame();
    } catch (e) { console.warn('image skipped', e); }
  }
  return saved;
}
function num(v) { return v && typeof v.asNumber === 'function' ? v.asNumber() : v ? Number(String(v)) : 0; }
function colorComps(ctx, cs, P) {
  cs = ctx.lookup(cs); if (!cs) return 0; const s = String(cs);
  if (s === '/DeviceRGB' || s === '/CalRGB') return 3; if (s === '/DeviceGray' || s === '/CalGray') return 1;
  if (cs instanceof P.PDFArray && String(cs.get(0)) === '/ICCBased') { const st = ctx.lookup(cs.get(1)); return num(st?.dict?.get(P.PDFName.of('N'))); }
  return 0;
}

// Remove objects that nothing points to (left-over images, fonts, old revisions)
export function garbageCollect(doc) {
  const P = window.PDFLib; const ctx = doc.context; const seen = new Set();
  const stack = [ctx.trailerInfo.Root, ctx.trailerInfo.Info].filter(Boolean);
  while (stack.length) {
    const o = stack.pop();
    if (o instanceof P.PDFRef) { if (seen.has(o.tag)) continue; seen.add(o.tag); const v = ctx.lookup(o); if (v) stack.push(v); }
    else if (o instanceof P.PDFDict) for (const [, v] of o.entries()) stack.push(v);
    else if (o instanceof P.PDFArray) for (const v of o.asArray()) stack.push(v);
    else if (o?.dict instanceof P.PDFDict) stack.push(o.dict);
  }
  let removed = 0;
  for (const [ref] of ctx.enumerateIndirectObjects()) if (!seen.has(ref.tag)) { ctx.delete(ref); removed++; }
  return removed;
}

export async function cleanup(doc, { thumbs = true, pieceInfo = true, metadata = false } = {}) {
  const P = await PL(); const N = n => P.PDFName.of(n);
  for (const p of doc.getPages()) { if (thumbs) p.node.delete(N('Thumb')); if (pieceInfo) p.node.delete(N('PieceInfo')); }
  if (pieceInfo) doc.catalog.delete(N('PieceInfo'));
  if (metadata) doc.catalog.delete(N('Metadata'));
  return garbageCollect(doc);
}

const LEVELS = {
  low: { quality: 0.85, maxDim: 2600 },
  medium: { quality: 0.72, maxDim: 1700 },
  high: { quality: 0.55, maxDim: 1150 },
};

export async function compressBytes(bytes, v, progress) {
  if (v.level === 'extreme') {
    const pdf = await openPdf(bytes);
    return rasterizeToPdf(pdf, { dpi: 96, quality: 0.5, onProgress: progress, transform: v.gray ? grayCanvas : null });
  }
  const doc = await loadDoc(bytes);
  await recompressImages(doc, { ...LEVELS[v.level || 'medium'], gray: !!v.gray, progress });
  await cleanup(doc, { metadata: false });
  return doc;
}
function grayCanvas(c) { const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height); const p = d.data; for (let i = 0; i < p.length; i += 4) p[i] = p[i + 1] = p[i + 2] = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114; x.putImageData(d, 0, 0); return c; }

async function finishSize(ctx, doc, suffix) {
  let blob = doc instanceof Blob ? doc : await saveDoc(doc); const before = ctx.files[0].size;
  let message;
  if (blob.size >= before) { blob = new Blob([ctx.files[0].bytes], { type: 'application/pdf' }); message = 'This PDF is already well optimised — we couldn’t make it smaller without losing quality. Try a stronger level.'; }
  return { files: [{ name: outName(ctx, suffix), blob }], stats: { before, after: blob.size }, message };
}

export default {
  'compress-pdf': {
    accept: 'pdf', view: 'thumbs', action: 'Compress PDF', actionIcon: 'shrink', suffix: 'compressed',
    options: [
      { key: 'level', type: 'cards', label: 'Compression level', default: 'medium', options: [['low', 'Light', 'best quality'], ['medium', 'Recommended', 'good quality, small'], ['high', 'Strong', 'smaller, lower quality'], ['extreme', 'Extreme', 'smallest · text becomes image']] },
      { key: 'gray', type: 'check', label: 'Also convert images to grayscale' },
      { type: 'info', html: 'Text and vector graphics stay sharp — only images are recompressed (except “Extreme”).' },
    ],
    apply: (bytes, v, p) => compressBytes(bytes, v, p),
    async run(ctx) { return finishSize(ctx, await compressBytes(ctx.files[0].bytes, ctx.values, ctx.progress), 'compressed'); },
  },

  'reduce-size': {
    accept: 'pdf', view: 'thumbs', action: 'Reduce size', actionIcon: 'target',
    options: ctx => [
      { type: 'info', html: `Current size: <b>${fmtBytes(ctx.files[0].size)}</b>` },
      { key: 'preset', type: 'seg', label: 'Target size', default: '200', options: [['100', '100 KB'], ['200', '200 KB'], ['500', '500 KB'], ['1024', '1 MB'], ['2048', '2 MB'], ['custom', 'Custom']] },
      { key: 'kb', type: 'number', label: 'Target size (KB)', default: 300, min: 10, show: v => v.preset === 'custom' },
      { key: 'allowRaster', type: 'check', label: 'Allow turning pages into images if needed', default: true, hint: 'Needed for very small targets. Text won’t be selectable afterwards.' },
    ],
    async run(ctx) {
      const target = (ctx.values.preset === 'custom' ? +ctx.values.kb : +ctx.values.preset) * 1024;
      const bytes = ctx.files[0].bytes;
      if (bytes.length <= target) return { files: [{ name: outName(ctx, 'reduced'), blob: new Blob([bytes], { type: 'application/pdf' }) }], message: 'Your PDF is already under the target size.', stats: { before: bytes.length, after: bytes.length } };
      let best = null;
      for (const lvl of ['medium', 'high']) {
        ctx.progress(lvl === 'medium' ? 0.05 : 0.25, `Trying ${lvl} compression…`);
        const doc = await loadDoc(bytes); await recompressImages(doc, LEVELS[lvl]); await cleanup(doc);
        const b = await saveDoc(doc); if (!best || b.size < best.size) best = b; if (b.size <= target) break;
      }
      if (best.size > target && ctx.values.allowRaster) {
        const pdf = await openPdf(bytes);
        let lo = 40, hi = 150, found = null;
        for (let k = 0; k < 6 && lo <= hi; k++) {
          const dpi = Math.round((lo + hi) / 2); const q = Math.max(0.35, Math.min(0.8, dpi / 190));
          ctx.progress(0.4 + k * 0.1, `Trying ${dpi} DPI…`);
          const b = await saveDoc(await rasterizeToPdf(pdf, { dpi, quality: q }));
          if (b.size <= target) { found = b; lo = dpi + 1; } else hi = dpi - 1;
          if (b.size < best.size) best = b;
        }
        if (found) best = found;
      }
      const ok = best.size <= target;
      return { files: [{ name: outName(ctx, 'reduced'), blob: best }], stats: { before: bytes.length, after: best.size }, title: ok ? 'Done!' : 'Smallest possible', message: ok ? `Reduced to ${fmtBytes(best.size)} — under your ${fmtBytes(target)} target.` : `We got it down to ${fmtBytes(best.size)}, which is the smallest possible for this file. Try splitting it into parts.` };
    },
  },

  'optimize-images': {
    accept: 'pdf', view: 'thumbs', action: 'Optimize images', actionIcon: 'image-down',
    options: [
      { key: 'quality', type: 'range', label: 'JPEG quality', default: 70, min: 20, max: 95, unit: '%' },
      { key: 'maxDim', type: 'select', label: 'Max image size', default: '1700', options: [['4000', 'Keep size (no downscale)'], ['2600', 'Large (2600 px)'], ['1700', 'Medium (1700 px)'], ['1100', 'Small (1100 px)'], ['700', 'Tiny (700 px)']] },
      { key: 'gray', type: 'check', label: 'Convert images to grayscale' },
    ],
    async apply(bytes, v, progress) { const doc = await loadDoc(bytes); await recompressImages(doc, { quality: v.quality / 100, maxDim: +v.maxDim, gray: v.gray, progress }); await cleanup(doc); return doc; },
    async run(ctx) { return finishSize(ctx, await this.apply(ctx.files[0].bytes, ctx.values, ctx.progress), 'optimized'); },
  },

  'flatten-pdf': {
    accept: 'pdf', view: 'thumbs', action: 'Flatten PDF', actionIcon: 'layers-2', suffix: 'flattened',
    options: [
      { key: 'mode', type: 'cards', label: 'What to flatten', default: 'forms', options: [['forms', 'Form fields', 'keeps text sharp'], ['all', 'Everything', 'forms, comments, stamps — as images']] },
      { key: 'dpi', type: 'select', label: 'Image quality', default: '200', options: [['150', 'Good'], ['200', 'High'], ['300', 'Print']], show: v => v.mode === 'all' },
    ],
    async apply(bytes, v, progress) {
      if (v.mode === 'all') { const pdf = await openPdf(bytes); return rasterizeToPdf(pdf, { dpi: +v.dpi || 200, quality: 0.85, onProgress: progress }); }
      const doc = await loadDoc(bytes);
      try { const form = doc.getForm(); form.getFields().forEach(f => { try { f.enableReadOnly(); } catch { } }); form.flatten({ updateFieldAppearances: true }); } catch (e) { console.warn(e); }
      return doc;
    },
    async run(ctx) { const doc = await this.apply(ctx.files[0].bytes, ctx.values, ctx.progress); return { files: [{ name: outName(ctx, 'flattened'), blob: await saveDoc(doc) }] }; },
  },

  'remove-objects': {
    accept: 'pdf', view: 'thumbs', action: 'Clean up PDF', actionIcon: 'sparkle',
    options: [
      { key: 'thumbs', type: 'check', label: 'Remove embedded page thumbnails', default: true },
      { key: 'pieceInfo', type: 'check', label: 'Remove private app data (Illustrator, Photoshop)', default: true },
      { key: 'metadata', type: 'check', label: 'Remove XMP metadata' },
      { key: 'js', type: 'check', label: 'Remove JavaScript', default: true },
    ],
    async apply(bytes, v) {
      const P = await PL(); const doc = await loadDoc(bytes);
      if (v.js) { const names = doc.catalog.lookup(P.PDFName.of('Names')); names?.delete?.(P.PDFName.of('JavaScript')); doc.catalog.delete(P.PDFName.of('OpenAction')); }
      await cleanup(doc, v); return doc;
    },
    async run(ctx) { return finishSize(ctx, await this.apply(ctx.files[0].bytes, ctx.values), 'clean'); },
  },

  'repair-pdf': {
    accept: 'pdf', view: 'none', action: 'Repair PDF', actionIcon: 'wrench',
    options: [{ key: 'mode', type: 'cards', label: 'Repair method', default: 'rebuild', options: [['rebuild', 'Rebuild structure', 'keeps text & quality'], ['render', 'Re-draw pages', 'for badly broken files']] }],
    async run(ctx) {
      const f = ctx.files[0];
      if (ctx.values.mode === 'rebuild' && !f.broken) {
        try {
          const { PDFDocument } = await PL(); const src = await loadDoc(f.bytes); const out = await PDFDocument.create();
          (await out.copyPages(src, src.getPageIndices())).forEach(p => out.addPage(p));
          return { files: [{ name: outName(ctx, 'repaired'), blob: await saveDoc(out) }], message: `Rebuilt ${out.getPageCount()} pages with a fresh file structure.` };
        } catch (e) { console.warn('rebuild failed, rendering instead', e); }
      }
      const pdf = await openPdf(f.bytes);
      const doc = await rasterizeToPdf(pdf, { dpi: 170, quality: 0.85, onProgress: ctx.progress });
      return { files: [{ name: outName(ctx, 'repaired'), blob: await saveDoc(doc) }], message: `Recovered ${doc.getPageCount()} pages by re-drawing them. Run OCR PDF to make the text searchable again.` };
    },
  },
};
