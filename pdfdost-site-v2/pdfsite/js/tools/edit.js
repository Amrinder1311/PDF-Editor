// Edit tools: editor variants, crop, resize, margins, numbers, header/footer, watermark,
// background, Bates, links, bookmarks, TOC, metadata, dark mode, find & replace
import { loadDoc, saveDoc, PL, openPdf, getFont, canEncode, textPng, hexRgb, visualToUser, visualSize, anchorXY, parsePages, PAGE_SIZES, MM, rasterizeToPdf, pageText, findInItems, toLines, embedImage, imageForPdf } from '../core/pdf.js';
import { applyObjects, addAnnot, normalizeUrl } from '../core/editor.js';
import { h, ic, esc, toast, baseName } from '../core/ui.js';
import { outName, single } from './common.js';
import { drawRotated, setOutline } from './organize.js';

// ── Shared drawing helpers (work on rotated pages too) ───────
export async function stampText(doc, page, text, { vx, vy, size = 12, font = 'Helvetica', color = '#000000', opacity = 1, rotate = 0 }) {
  const P = await PL(); const f = await getFont(doc, font);
  const p = visualToUser(page, vx, vy);
  if (canEncode(f, text)) { page.drawText(text, { x: p.x, y: p.y, size, font: f, color: hexRgb(color), opacity, rotate: P.degrees(p.r + rotate) }); return; }
  const t = await textPng(text, size, color, font); const img = await doc.embedPng(t.bytes);
  const a = rotate * Math.PI / 180; const off = -(t.h - size * 0.95);
  const q = visualToUser(page, vx - off * Math.sin(a), vy + off * Math.cos(a));
  page.drawImage(img, { x: q.x, y: q.y, width: t.w, height: t.h, opacity, rotate: P.degrees(q.r + rotate) });
}
export async function measure(doc, text, size, font = 'Helvetica') {
  const f = await getFont(doc, font);
  if (canEncode(f, text)) return f.widthOfTextAtSize(text, size);
  return (await textPng(text, size, '#000', font)).w;
}
// Move the most recently drawn content stream behind the original page content
export function sendBehind(page) {
  const P = window.PDFLib; const c = page.node.Contents();
  if (c instanceof P.PDFArray && c.size() > 1) { const last = c.get(c.size() - 1); c.remove(c.size() - 1); c.insert(0, last); }
}
const fontOpt = { key: 'font', type: 'select', label: 'Font', default: 'Helvetica', options: [['Helvetica', 'Helvetica'], ['HelveticaBold', 'Helvetica Bold'], ['TimesRoman', 'Times'], ['TimesRomanBold', 'Times Bold'], ['Courier', 'Courier']] };
const pagesOpt = { key: 'pages', type: 'pages', label: 'Pages (optional)', hint: 'Leave empty for all pages.' };
const fill = (tpl, map) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));

// ── Editor-based tools ──
function editorTool(tools, def = 'select', extra = {}) {
  return {
    accept: 'pdf', view: 'editor', editorTools: tools, editorDefault: def, action: 'Save PDF', actionIcon: 'save',
    options: extra.options || [{ type: 'info', html: 'Pick a tool from the bar above the page, then tap on the page. Use the arrows to move between pages.' }],
    validate: ctx => !ctx.state.objects?.length ? 'Add something to the page first' : null,
    async run(ctx) {
      const doc = await loadDoc(ctx.files[0].bytes);
      await applyObjects(doc, ctx.state.objects);
      return { files: [{ name: outName(ctx, extra.suffix || 'edited'), blob: await saveDoc(doc) }], message: `${ctx.state.objects.length} change${ctx.state.objects.length > 1 ? 's' : ''} saved.` };
    },
    ...extra,
  };
}
const ALL_TOOLS = ['text', 'image', 'signature', 'rect', 'ellipse', 'line', 'arrow', 'highlight', 'draw', 'whiteout', 'note', 'link', 'date'];

const pos9 = (allowed, def = 'bc') => ({ key: 'pos', type: 'position', label: 'Position', default: def, allowed });

export default {
  'edit-pdf': editorTool(ALL_TOOLS, 'text', { about: 'Add text, images, signatures, shapes, highlights, freehand drawings, links and comments. Whiteout covers content with a white box (the original stays underneath — use Redact to remove it for good).' }),
  'add-text': editorTool(['text', 'date'], 'text', { suffix: 'text-added' }),
  'add-image': editorTool(['image'], 'image', { suffix: 'image-added' }),
  'add-shapes': editorTool(['rect', 'ellipse', 'line', 'arrow'], 'rect', { suffix: 'shapes' }),
  'highlight-pdf': editorTool(['highlight', 'note'], 'highlight', { suffix: 'highlighted' }),
  'draw-pdf': editorTool(['draw', 'highlight'], 'draw', { suffix: 'drawn' }),
  'annotate-pdf': editorTool(['note', 'highlight', 'text', 'arrow'], 'note', { suffix: 'commented', about: 'Notes are real PDF comments that show up in Adobe Reader, Chrome and phone PDF apps.' }),
  'whiteout-pdf': editorTool(['whiteout', 'text'], 'whiteout', { suffix: 'whiteout', about: 'Whiteout hides content visually. To remove sensitive data permanently, use Redact PDF.' }),

  'crop-pdf': {
    accept: 'pdf', view: 'editor', editorTools: [], action: 'Crop PDF', actionIcon: 'crop',
    editorHint: () => 'Drag the box to move it. Drag the round handle to resize. Everything outside will be cut off.',
    init(ctx) { ctx.state.objects = [{ id: 1, type: 'crop', page: 0, x: 0.06, y: 0.06, w: 0.88, h: 0.88 }]; },
    afterEditor(ctx) { const ed = ctx.editor; const orig = ed.goto.bind(ed); ed.goto = async i => { ctx.state.objects[0].page = i; await orig(i); }; },
    options: [{ key: 'apply', type: 'seg', label: 'Apply crop to', default: 'all', options: [['all', 'All pages'], ['this', 'This page only'], ['odd', 'Odd'], ['even', 'Even']] }],
    async run(ctx) {
      const doc = await loadDoc(ctx.files[0].bytes); const c = ctx.state.objects[0]; const cur = ctx.editor?.page || 0;
      doc.getPages().forEach((p, i) => {
        const ok = { all: true, this: i === cur, odd: i % 2 === 0, even: i % 2 === 1 }[ctx.values.apply]; if (!ok) return;
        const { w: W, h: H } = visualSize(p);
        const a = visualToUser(p, c.x * W, H - c.y * H), b = visualToUser(p, (c.x + c.w) * W, H - (c.y + c.h) * H);
        const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), w = Math.abs(a.x - b.x), hh = Math.abs(a.y - b.y);
        p.setCropBox(x, y, w, hh); p.setMediaBox(x, y, w, hh);
      });
      return { files: [{ name: outName(ctx, 'cropped'), blob: await saveDoc(doc) }] };
    },
  },

  'resize-pages': single({
    view: 'thumbs', action: 'Resize pages', actionIcon: 'scaling', suffix: 'resized',
    options: [
      { key: 'size', type: 'select', label: 'New page size', default: 'A4', options: [...Object.keys(PAGE_SIZES).map(k => [k, k]), ['custom', 'Custom (mm)']] },
      { key: 'cw', type: 'number', label: 'Width (mm)', default: 210, show: v => v.size === 'custom' }, { key: 'ch', type: 'number', label: 'Height (mm)', default: 297, show: v => v.size === 'custom' },
      { key: 'orient', type: 'seg', label: 'Orientation', default: 'auto', options: [['auto', 'Match page'], ['portrait', 'Portrait'], ['landscape', 'Landscape']] },
      { key: 'fit', type: 'seg', label: 'Content', default: 'fit', options: [['fit', 'Scale to fit'], ['stretch', 'Stretch'], ['none', 'Don’t scale']] },
    ],
    async apply(bytes, v) {
      const { PDFDocument } = await PL(); const src = await loadDoc(bytes); const out = await PDFDocument.create();
      const emb = await out.embedPages(src.getPages());
      emb.forEach((e, i) => {
        const rot = src.getPage(i).getRotation().angle % 360; const ew = rot % 180 ? e.height : e.width, eh = rot % 180 ? e.width : e.height;
        let [W, H] = v.size === 'custom' ? [v.cw * MM, v.ch * MM] : PAGE_SIZES[v.size];
        const land = v.orient === 'landscape' || (v.orient === 'auto' && ew > eh); if (land !== W > H) [W, H] = [H, W];
        const p = out.addPage([W, H]);
        if (v.fit === 'stretch') { const sx = W / ew, sy = H / eh; if (!rot) p.drawPage(e, { x: 0, y: 0, xScale: sx, yScale: sy }); else drawRotated(p, e, 0, 0, Math.min(sx, sy), rot); return; }
        const s = v.fit === 'none' ? 1 : Math.min(W / ew, H / eh);
        drawRotated(p, e, (W - ew * s) / 2, (H - eh * s) / 2, s, rot);
      });
      return out;
    },
  }),

  'change-margins': single({
    view: 'thumbs', action: 'Add margins', actionIcon: 'square-dashed', suffix: 'margins',
    options: [
      { key: 'all', type: 'range', label: 'Margin on all sides', default: 15, min: 0, max: 60, unit: ' mm' },
      { key: 'extraLeft', type: 'range', label: 'Extra binding margin (left)', default: 0, min: 0, max: 40, unit: ' mm' },
      { key: 'keep', type: 'seg', label: 'Page size', default: 'grow', options: [['grow', 'Make page bigger'], ['keep', 'Keep size, shrink content']] },
      { key: 'mirror', type: 'check', label: 'Mirror binding margin on even pages (for double-sided)' },
    ],
    async apply(bytes, v) {
      const { PDFDocument } = await PL(); const src = await loadDoc(bytes); const out = await PDFDocument.create();
      const emb = await out.embedPages(src.getPages());
      emb.forEach((e, i) => {
        const rot = src.getPage(i).getRotation().angle % 360; const ew = rot % 180 ? e.height : e.width, eh = rot % 180 ? e.width : e.height;
        const m = v.all * MM, b = v.extraLeft * MM; const left = v.mirror && i % 2 ? m : m + b, right = v.mirror && i % 2 ? m + b : m;
        if (v.keep === 'keep') { const s = Math.min((ew - left - right) / ew, (eh - 2 * m) / eh); const p = out.addPage([ew, eh]); drawRotated(p, e, left + (ew - left - right - ew * s) / 2, (eh - eh * s) / 2, s, rot); }
        else { const p = out.addPage([ew + left + right, eh + 2 * m]); drawRotated(p, e, left, m, 1, rot); }
      });
      return out;
    },
  }),

  'page-numbers': single({
    view: 'thumbs', action: 'Add page numbers', actionIcon: 'list-ordered', suffix: 'numbered',
    options: [
      pos9(['tl', 'tc', 'tr', 'bl', 'bc', 'br'], 'bc'),
      { key: 'format', type: 'select', label: 'Format', default: '{n}', options: [['{n}', '1'], ['Page {n}', 'Page 1'], ['Page {n} of {total}', 'Page 1 of 10'], ['{n} / {total}', '1 / 10'], ['- {n} -', '- 1 -'], ['custom', 'Custom…']] },
      { key: 'custom', type: 'text', label: 'Custom format', default: 'पृष्ठ {n}', hint: 'Use {n} for the number and {total} for the page count.', show: v => v.format === 'custom' },
      { key: 'start', type: 'number', label: 'Start numbering at', default: 1, min: 0 },
      { key: 'skipFirst', type: 'check', label: 'Don’t number the first page (cover)' },
      pagesOpt,
      { key: 'size', type: 'range', label: 'Font size', default: 11, min: 6, max: 30, unit: ' pt' },
      { key: 'color', type: 'color', label: 'Colour', default: '#000000' }, fontOpt,
      { key: 'margin', type: 'range', label: 'Distance from edge', default: 10, min: 3, max: 40, unit: ' mm' },
      { key: 'mirror', type: 'check', label: 'Mirror left/right on even pages (books)' },
    ],
    async apply(bytes, v) {
      const doc = await loadDoc(bytes); const pages = doc.getPages(); const n = pages.length;
      const list = new Set(parsePages(v.pages, n)); if (v.skipFirst) list.delete(0);
      const fmt = v.format === 'custom' ? v.custom : v.format; let num = +v.start || 1; const total = list.size + (+v.start || 1) - 1;
      for (let i = 0; i < n; i++) {
        if (!list.has(i)) continue;
        const p = pages[i]; const { w: W, h: H } = visualSize(p); const text = fill(fmt, { n: num++, total });
        const tw = await measure(doc, text, v.size, v.font); let pos = v.pos;
        if (v.mirror && i % 2 === 1 && pos[1] !== 'c') pos = pos[0] + (pos[1] === 'l' ? 'r' : 'l');
        const { x, y } = anchorXY(pos, W, H, tw, v.size, v.margin * MM);
        await stampText(doc, p, text, { vx: x, vy: y + v.size * 0.2, size: v.size, font: v.font, color: v.color });
      }
      return doc;
    },
  }),

  'header-footer': single({
    view: 'thumbs', action: 'Add header & footer', actionIcon: 'panel-top', suffix: 'header-footer',
    options: [
      { type: 'info', html: 'Use <b>{page}</b>, <b>{total}</b>, <b>{date}</b> and <b>{file}</b> anywhere in the text.' },
      { type: 'heading', label: 'Header' },
      { key: 'hl', type: 'text', label: 'Left', placeholder: 'e.g. Company name' }, { key: 'hc', type: 'text', label: 'Centre' }, { key: 'hr', type: 'text', label: 'Right', placeholder: 'e.g. {date}' },
      { type: 'heading', label: 'Footer' },
      { key: 'fl', type: 'text', label: 'Left', placeholder: 'e.g. {file}' }, { key: 'fc', type: 'text', label: 'Centre', default: 'Page {page} of {total}' }, { key: 'fr', type: 'text', label: 'Right', placeholder: 'e.g. Confidential' },
      { type: 'heading', label: 'Style' },
      { key: 'size', type: 'range', label: 'Font size', default: 9, min: 6, max: 20, unit: ' pt' }, { key: 'color', type: 'color', label: 'Colour', default: '#6b7280' }, fontOpt,
      { key: 'margin', type: 'range', label: 'Distance from edge', default: 10, min: 3, max: 30, unit: ' mm' },
      { key: 'line', type: 'check', label: 'Draw a thin line under the header / above the footer' },
      pagesOpt,
    ],
    async apply(bytes, v, progress, ctx) {
      const P = await PL(); const doc = await loadDoc(bytes); const pages = doc.getPages(); const list = new Set(parsePages(v.pages, pages.length));
      const date = new Date().toLocaleDateString(); const file = baseName(ctx?.files?.[0]?.name || '');
      for (let i = 0; i < pages.length; i++) {
        if (!list.has(i)) continue; const p = pages[i]; const { w: W, h: H } = visualSize(p); const m = v.margin * MM;
        const map = { page: i + 1, total: pages.length, date, file };
        for (const [key, pos] of [['hl', 'tl'], ['hc', 'tc'], ['hr', 'tr'], ['fl', 'bl'], ['fc', 'bc'], ['fr', 'br']]) {
          const tpl = (v[key] || '').trim(); if (!tpl) continue; const text = fill(tpl, map);
          const tw = await measure(doc, text, v.size, v.font); const { x, y } = anchorXY(pos, W, H, tw, v.size, m);
          await stampText(doc, p, text, { vx: x, vy: y + v.size * 0.2, size: v.size, font: v.font, color: v.color });
        }
        if (v.line) for (const [has, yy] of [[v.hl || v.hc || v.hr, H - m - v.size * 1.6], [v.fl || v.fc || v.fr, m + v.size * 1.9]]) {
          if (!has) continue; const a = visualToUser(p, m, yy), b = visualToUser(p, W - m, yy);
          p.drawLine({ start: { x: a.x, y: a.y }, end: { x: b.x, y: b.y }, thickness: 0.5, color: hexRgb(v.color) });
        }
      }
      return doc;
    },
  }),

  'watermark': single({
    view: 'thumbs', action: 'Add watermark', actionIcon: 'stamp', suffix: 'watermarked',
    options: [
      { key: 'kind', type: 'seg', label: 'Watermark type', default: 'text', options: [['text', 'Text', 'type'], ['image', 'Image / logo', 'image']] },
      { key: 'text', type: 'text', label: 'Text', default: 'CONFIDENTIAL', show: v => v.kind === 'text' },
      { key: 'image', type: 'image', label: 'Image', show: v => v.kind === 'image' },
      { key: 'size', type: 'range', label: 'Text size', default: 60, min: 10, max: 160, unit: ' pt', show: v => v.kind === 'text' },
      { key: 'scale', type: 'range', label: 'Image size', default: 40, min: 5, max: 100, unit: '% of page', show: v => v.kind === 'image' },
      { key: 'color', type: 'color', label: 'Colour', default: '#e11d48', show: v => v.kind === 'text' },
      { ...fontOpt, default: 'HelveticaBold', show: v => v.kind === 'text' },
      { key: 'opacity', type: 'range', label: 'Transparency', default: 25, min: 5, max: 100, unit: '%' },
      { key: 'rotate', type: 'seg', label: 'Rotation', default: '45', options: [['0', '0°'], ['45', '45°'], ['-45', '-45°'], ['90', '90°']] },
      { key: 'layout', type: 'seg', label: 'Layout', default: 'single', options: [['single', 'Single'], ['tile', 'Tiled (repeat)']] },
      { ...pos9(null, 'mc'), show: v => v.layout === 'single' },
      { key: 'behind', type: 'check', label: 'Place behind page content' },
      pagesOpt,
    ],
    async apply(bytes, v) {
      const P = await PL(); const doc = await loadDoc(bytes); const pages = doc.getPages(); const list = new Set(parsePages(v.pages, pages.length));
      if (v.kind === 'image' && !v.image) throw new Error('Choose an image for the watermark');
      if (v.kind === 'text' && !String(v.text).trim()) throw new Error('Enter the watermark text');
      const img = v.kind === 'image' ? await embedImage(doc, await imageForPdf(v.image.file, { maxDim: 2000 })) : null;
      const rot = +v.rotate; const a = rot * Math.PI / 180; const op = v.opacity / 100;
      for (let i = 0; i < pages.length; i++) {
        if (!list.has(i)) continue; const p = pages[i]; const { w: W, h: H } = visualSize(p);
        let bw, bh; if (img) { bw = W * v.scale / 100; bh = bw * img.height / img.width; } else { bw = await measure(doc, v.text, v.size, v.font); bh = v.size; }
        const centers = [];
        if (v.layout === 'tile') { const sx = bw * 1.35 + 40, sy = bh * 3.2 + 40; for (let y = sy / 2; y < H + sy; y += sy) for (let x = (Math.round(y / sy) % 2 ? sx / 2 : 0); x < W + sx; x += sx) centers.push([x, y]); }
        else { const { x, y } = anchorXY(v.pos, W, H, Math.abs(bw * Math.cos(a)) + Math.abs(bh * Math.sin(a)), Math.abs(bw * Math.sin(a)) + Math.abs(bh * Math.cos(a)), 24); centers.push([x + (Math.abs(bw * Math.cos(a)) + Math.abs(bh * Math.sin(a))) / 2, y + (Math.abs(bw * Math.sin(a)) + Math.abs(bh * Math.cos(a))) / 2]); }
        for (const [cx, cy] of centers) {
          const ox = -bw / 2, oy = img ? -bh / 2 : -bh * 0.35;
          const vx = cx + ox * Math.cos(a) - oy * Math.sin(a), vy = cy + ox * Math.sin(a) + oy * Math.cos(a);
          if (img) { const q = visualToUser(p, vx, vy); p.drawImage(img, { x: q.x, y: q.y, width: bw, height: bh, opacity: op, rotate: P.degrees(q.r + rot) }); }
          else await stampText(doc, p, v.text, { vx, vy, size: v.size, font: v.font, color: v.color, opacity: op, rotate: rot });
        }
        if (v.behind) sendBehind(p);
      }
      return doc;
    },
  }),

  'remove-watermark': {
    accept: 'pdf', view: 'thumbs', action: 'Remove watermark', actionIcon: 'eraser',
    options: [
      { type: 'info', html: 'Removes watermarks added by Acrobat, Word and most PDF tools (marked as watermark artifacts or annotations). Watermarks that are part of a scanned image can’t be removed automatically — use <a href="#/whiteout-pdf">Whiteout</a> instead.' },
      { key: 'text', type: 'text', label: 'Also remove text that matches (optional)', placeholder: 'e.g. SAMPLE', hint: 'Removes text drawing commands containing exactly this text.' },
      { key: 'images', type: 'check', label: 'Also remove semi-transparent overlay images' },
    ],
    async run(ctx) {
      const P = await PL(); const doc = await loadDoc(ctx.files[0].bytes); const N = n => P.PDFName.of(n); let removed = 0;
      for (const page of doc.getPages()) {
        const annots = page.node.lookup(N('Annots'));
        if (annots instanceof P.PDFArray) for (let i = annots.size() - 1; i >= 0; i--) { const a = annots.lookup(i); if (String(a?.get?.(N('Subtype'))) === '/Watermark') { annots.remove(i); removed++; } }
        const streams = contentStreams(page, P); if (!streams.length) continue;
        let src = streams.map(s => latin1(s)).join('\n');
        const before = src.length;
        src = stripWatermarkBlocks(src);
        if (ctx.values.text) src = stripTextOps(src, ctx.values.text);
        if (ctx.values.images) src = stripTransparentImages(src, page, P);
        if (src.length !== before) { removed++; page.node.set(N('Contents'), doc.context.register(doc.context.flateStream(toBytes(src)))); }
      }
      if (!removed) throw new Error('No removable watermark was found in this PDF.');
      return { files: [{ name: outName(ctx, 'no-watermark'), blob: await saveDoc(doc) }], message: 'Watermark removed. Please check the result.' };
    },
  },

  'background-color': single({
    view: 'thumbs', action: 'Apply background', actionIcon: 'paint-bucket', suffix: 'background',
    options: [
      { key: 'kind', type: 'seg', label: 'Background', default: 'color', options: [['color', 'Colour'], ['image', 'Image']] },
      { key: 'color', type: 'color', label: 'Colour', default: '#fef9c3', swatches: ['#fef9c3', '#fde68a', '#dcfce7', '#dbeafe', '#fce7f3', '#f5f5f4', '#e0e7ff', '#fff7ed'], show: v => v.kind === 'color' },
      { key: 'image', type: 'image', label: 'Image', show: v => v.kind === 'image' },
      { key: 'opacity', type: 'range', label: 'Strength', default: 100, min: 10, max: 100, unit: '%' },
      { type: 'info', html: 'Scanned pages have their own white background, so the colour may only show around the edges.' },
      pagesOpt,
    ],
    async apply(bytes, v) {
      const doc = await loadDoc(bytes); const pages = doc.getPages(); const list = new Set(parsePages(v.pages, pages.length));
      const img = v.kind === 'image' ? (v.image ? await embedImage(doc, await imageForPdf(v.image.file, { maxDim: 2400 })) : null) : null;
      if (v.kind === 'image' && !img) throw new Error('Choose a background image');
      pages.forEach((p, i) => {
        if (!list.has(i)) return; const b = p.getCropBox();
        if (img) { const s = Math.max(b.width / img.width, b.height / img.height); p.drawImage(img, { x: b.x + (b.width - img.width * s) / 2, y: b.y + (b.height - img.height * s) / 2, width: img.width * s, height: img.height * s, opacity: v.opacity / 100 }); }
        else p.drawRectangle({ x: b.x, y: b.y, width: b.width, height: b.height, color: hexRgb(v.color), opacity: v.opacity / 100 });
        sendBehind(p);
      });
      return doc;
    },
  }),

  'bates-numbering': {
    accept: 'pdf', multiple: true, view: 'files', action: 'Add Bates numbers', actionIcon: 'gavel',
    options: [
      { key: 'prefix', type: 'text', label: 'Prefix', default: 'ABC' }, { key: 'start', type: 'number', label: 'Start number', default: 1, min: 0 },
      { key: 'digits', type: 'number', label: 'Digits', default: 6, min: 1, max: 12 }, { key: 'suffix', type: 'text', label: 'Suffix' },
      pos9(['tl', 'tc', 'tr', 'bl', 'bc', 'br'], 'br'),
      { key: 'size', type: 'range', label: 'Font size', default: 10, min: 6, max: 20, unit: ' pt' }, { key: 'color', type: 'color', label: 'Colour', default: '#000000' },
      { key: 'box', type: 'check', label: 'White box behind number', default: true },
      { type: 'info', html: 'With several files, numbering continues from one file to the next.' },
    ],
    async run(ctx) {
      const P = await PL(); const v = ctx.values; let n = +v.start || 0; const files = [];
      for (const f of ctx.files) {
        const doc = await loadDoc(f.bytes); const first = n;
        for (const p of doc.getPages()) {
          const text = `${v.prefix || ''}${String(n++).padStart(+v.digits || 6, '0')}${v.suffix || ''}`;
          const { w: W, h: H } = visualSize(p); const tw = await measure(doc, text, v.size, 'Courier'); const { x, y } = anchorXY(v.pos, W, H, tw, v.size, 18);
          if (v.box) { const q = visualToUser(p, x - 3, y - 3); p.drawRectangle({ x: q.x, y: q.y, width: tw + 6, height: v.size + 4, color: P.rgb(1, 1, 1), rotate: P.degrees(q.r) }); }
          await stampText(doc, p, text, { vx: x, vy: y + v.size * 0.15, size: v.size, font: 'CourierBold', color: v.color });
        }
        files.push({ name: `${baseName(f.name)}_${v.prefix || ''}${String(first).padStart(+v.digits, '0')}-${String(n - 1).padStart(+v.digits, '0')}.pdf`, blob: await saveDoc(doc) });
      }
      return { files, message: `Numbered ${n - (+v.start || 0)} pages.` };
    },
  },

  'add-hyperlinks': {
    ...editorTool(['link'], 'link', { suffix: 'linked' }),
    validate: ctx => !ctx.state.objects?.length && !ctx.values.auto ? 'Draw a link area on the page, or turn on automatic links' : null,
    options: [{ type: 'info', html: 'Draw a box over text or an image, then type the website address (or choose a page number) below the page.' }, { key: 'auto', type: 'check', label: 'Also link every web address and email found in the text', default: true }],
    async run(ctx) {
      const P = await PL(); const doc = await loadDoc(ctx.files[0].bytes); await applyObjects(doc, ctx.state.objects || []); let auto = 0;
      if (ctx.values.auto) {
        const pdf = await ctx.pdf(); const re = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+|[\w.+-]+@[\w-]+\.[\w.]+/gi;
        for (let i = 0; i < pdf.numPages; i++) {
          const { items } = await pageText(pdf, i + 1); const page = doc.getPage(i); const { h: H } = visualSize(page);
          for (const r of findInItems(items, re)) {
            const a = visualToUser(page, r.x, H - r.y), b = visualToUser(page, r.x + r.w, H - r.y - r.h);
            addAnnot(doc, page, doc.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y)], Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: P.PDFString.of(normalizeUrl(r.text.replace(/[.,;:]$/, ''))) } })); auto++;
          }
        }
      }
      return { files: [{ name: outName(ctx, 'linked'), blob: await saveDoc(doc) }], message: `${(ctx.state.objects || []).length + auto} link${(ctx.state.objects || []).length + auto === 1 ? '' : 's'} added.` };
    },
  },

  'bookmarks': {
    accept: 'pdf', view: 'thumbs', action: 'Save bookmarks', actionIcon: 'bookmark',
    async init(ctx) { ctx.values.items = await readOutline(await ctx.pdf()); if (!ctx.values.items.length) ctx.values.items = [{ title: 'Introduction', page: 1 }]; },
    options: [
      { type: 'info', html: 'Each bookmark jumps to a page. Existing bookmarks are loaded below — edit, remove or add more.' },
      { key: 'items', type: 'list', label: 'Bookmarks', addLabel: 'Add bookmark', fields: [{ key: 'title', placeholder: 'Title' }, { key: 'page', type: 'number', placeholder: 'Page', default: 1 }] },
      { key: 'open', type: 'check', label: 'Show bookmarks panel when opened', default: true },
    ],
    async run(ctx) {
      const P = await PL(); const doc = await loadDoc(ctx.files[0].bytes); const n = doc.getPageCount();
      const items = ctx.values.items.filter(i => String(i.title).trim()).map(i => ({ title: i.title, page: Math.min(n, Math.max(1, +i.page || 1)) - 1 }));
      setOutline(doc, items); if (!ctx.values.open) doc.catalog.delete(P.PDFName.of('PageMode'));
      return { files: [{ name: outName(ctx, 'bookmarked'), blob: await saveDoc(doc) }], message: `${items.length} bookmark${items.length === 1 ? '' : 's'} saved.` };
    },
  },

  'table-of-contents': {
    accept: 'pdf', view: 'thumbs', action: 'Add table of contents', actionIcon: 'list-tree',
    async init(ctx) {
      const pdf = await ctx.pdf(); let items = await readOutline(pdf);
      if (!items.length) items = await detectHeadings(pdf);
      ctx.values.items = items.length ? items : [{ title: 'Chapter 1', page: 1 }];
    },
    options: [
      { key: 'heading', type: 'text', label: 'Title', default: 'Table of Contents' },
      { type: 'info', html: 'Entries were filled in from bookmarks or detected headings. Edit them as you like. Page numbers refer to the original document.' },
      { key: 'items', type: 'list', label: 'Entries', addLabel: 'Add entry', fields: [{ key: 'title', placeholder: 'Title' }, { key: 'page', type: 'number', placeholder: 'Page', default: 1 }] },
      { key: 'bookmarks', type: 'check', label: 'Also add these as bookmarks', default: true },
    ],
    async run(ctx) {
      const P = await PL(); const doc = await loadDoc(ctx.files[0].bytes); const items = ctx.values.items.filter(i => String(i.title).trim());
      if (!items.length) throw new Error('Add at least one entry');
      const first = doc.getPage(0); const W = first.getWidth(), H = first.getHeight(); const m = 60, lh = 22, perPage = Math.floor((H - 2 * m - 60) / lh);
      const tocPages = Math.ceil(items.length / perPage); const font = await getFont(doc, 'Helvetica'), bold = await getFont(doc, 'HelveticaBold');
      const created = [];
      for (let t = 0; t < tocPages; t++) created.push(doc.insertPage(t, [W, H]));
      for (let t = 0; t < tocPages; t++) {
        const p = created[t]; let y = H - m;
        if (t === 0) { await stampText(doc, p, ctx.values.heading || 'Contents', { vx: m, vy: y - 24, size: 24, font: 'HelveticaBold', color: '#111827' }); y -= 60; }
        for (const it of items.slice(t * perPage, (t + 1) * perPage)) {
          const pg = String((+it.page || 1) + tocPages); const pw = bold.widthOfTextAtSize(pg, 12); let title = String(it.title);
          const tw = await measure(doc, title, 12); const maxT = W - 2 * m - pw - 30;
          if (tw > maxT && canEncode(font, title)) { while (title.length > 3 && font.widthOfTextAtSize(title + '…', 12) > maxT) title = title.slice(0, -1); title += '…'; }
          await stampText(doc, p, title, { vx: m, vy: y, size: 12 });
          const tEnd = m + Math.min(tw, maxT) + 6; const dots = '.'.repeat(Math.max(0, Math.floor((W - m - pw - 6 - tEnd) / font.widthOfTextAtSize('.', 12))));
          p.drawText(dots, { x: tEnd, y, size: 12, font, color: P.rgb(0.6, 0.6, 0.6) });
          p.drawText(pg, { x: W - m - pw, y, size: 12, font: bold });
          const target = doc.getPage(Math.min(doc.getPageCount() - 1, (+it.page || 1) - 1 + tocPages));
          addAnnot(doc, p, doc.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [m, y - 5, W - m, y + 14], Border: [0, 0, 0], Dest: [target.ref, 'Fit'] }));
          y -= lh;
        }
      }
      if (ctx.values.bookmarks) setOutline(doc, [{ title: ctx.values.heading || 'Contents', page: 0 }, ...items.map(i => ({ title: i.title, page: (+i.page || 1) - 1 + tocPages }))]);
      return { files: [{ name: outName(ctx, 'with-toc'), blob: await saveDoc(doc) }], message: `Added ${tocPages} contents page${tocPages > 1 ? 's' : ''} with ${items.length} clickable entries.` };
    },
  },

  'edit-metadata': {
    accept: 'pdf', view: 'none', action: 'Save metadata', actionIcon: 'save',
    async init(ctx) {
      const doc = await loadDoc(ctx.files[0].bytes, { updateMetadata: false });
      Object.assign(ctx.values, { title: doc.getTitle() || '', author: doc.getAuthor() || '', subject: doc.getSubject() || '', keywords: doc.getKeywords() || '', creator: doc.getCreator() || '', producer: doc.getProducer() || '', lang: String(doc.catalog.get(window.PDFLib.PDFName.of('Lang')) || '').replace(/^\(|\)$/g, '') });
    },
    options: [
      { key: 'title', type: 'text', label: 'Title' }, { key: 'author', type: 'text', label: 'Author' }, { key: 'subject', type: 'text', label: 'Subject' },
      { key: 'keywords', type: 'text', label: 'Keywords', hint: 'Separate with commas.' }, { key: 'creator', type: 'text', label: 'Creator (app)' }, { key: 'producer', type: 'text', label: 'Producer' },
      { key: 'lang', type: 'text', label: 'Language', placeholder: 'e.g. en-IN, hi-IN' },
      { key: 'showTitle', type: 'check', label: 'Show title instead of file name in viewers', default: true },
    ],
    async run(ctx) {
      const P = await PL(); const v = ctx.values; const doc = await loadDoc(ctx.files[0].bytes, { updateMetadata: false });
      doc.setTitle(v.title || '', { showInWindowTitleBar: !!v.showTitle }); doc.setAuthor(v.author || ''); doc.setSubject(v.subject || '');
      doc.setKeywords(String(v.keywords || '').split(',').map(s => s.trim()).filter(Boolean)); doc.setCreator(v.creator || ''); doc.setProducer(v.producer || ''); doc.setModificationDate(new Date());
      if (v.lang) doc.setLanguage(v.lang);
      return { files: [{ name: outName(ctx, ''), blob: await saveDoc(doc) }], message: 'Metadata updated.' };
    },
  },

  'dark-mode-pdf': {
    accept: 'pdf', view: 'thumbs', action: 'Convert', actionIcon: 'moon',
    options: [
      { key: 'theme', type: 'cards', label: 'Theme', default: 'dark', options: [['dark', 'Dark', 'black background'], ['dim', 'Dim', 'dark grey, softer'], ['sepia', 'Sepia', 'warm paper'], ['night', 'Night', 'amber text']] },
      { key: 'dpi', type: 'select', label: 'Quality', default: '150', options: [['110', 'Smaller file'], ['150', 'Good'], ['220', 'High']] },
      { type: 'info', html: 'Photos keep their natural colours. Pages become images, so text isn’t selectable afterwards.' },
    ],
    async run(ctx) {
      const pdf = await ctx.pdf();
      const doc = await rasterizeToPdf(pdf, { dpi: +ctx.values.dpi, quality: 0.82, onProgress: ctx.progress, transform: c => themeCanvas(c, ctx.values.theme) });
      return { files: [{ name: outName(ctx, ctx.values.theme), blob: await saveDoc(doc) }] };
    },
  },

  'find-replace': {
    accept: 'pdf', view: 'thumbs', action: 'Replace text', actionIcon: 'replace',
    options: [
      { key: 'find', type: 'text', label: 'Find', placeholder: 'Text to find' }, { key: 'replace', type: 'text', label: 'Replace with', placeholder: 'New text (leave empty to erase)' },
      { key: 'case', type: 'check', label: 'Match case' }, { key: 'word', type: 'check', label: 'Whole words only' },
      { key: 'color', type: 'color', label: 'New text colour', default: '#000000' },
      { type: 'info', html: 'The old text is covered with a white box and the new text is written on top. For true editing of original text, use <a href="#/full-text-edit">Edit Existing Text</a>.' },
    ],
    validate: ctx => !String(ctx.values.find || '').trim() ? 'Enter the text to find' : null,
    async run(ctx) {
      const P = await PL(); const pdf = await ctx.pdf(); const doc = await loadDoc(ctx.files[0].bytes); const v = ctx.values;
      const esc_ = v.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const re = new RegExp(v.word ? `\\b${esc_}\\b` : esc_, v.case ? 'g' : 'gi');
      let count = 0;
      for (let i = 0; i < pdf.numPages; i++) {
        ctx.progress(i / pdf.numPages, `Searching page ${i + 1}`);
        const { items } = await pageText(pdf, i + 1); const page = doc.getPage(i); const { h: H } = visualSize(page);
        for (const r of findInItems(items, re)) {
          const q = visualToUser(page, r.x - 0.5, H - r.y - r.h);
          page.drawRectangle({ x: q.x, y: q.y, width: r.w + 1, height: r.h, color: P.rgb(1, 1, 1), rotate: P.degrees(q.r) });
          if (v.replace) await stampText(doc, page, v.replace, { vx: r.x, vy: H - (r.y + r.size * 0.95), size: r.size * 0.95, color: v.color });
          count++;
        }
      }
      if (!count) throw new Error(`“${v.find}” was not found in this PDF.`);
      return { files: [{ name: outName(ctx, 'replaced'), blob: await saveDoc(doc) }], message: `Replaced ${count} match${count > 1 ? 'es' : ''}.` };
    },
  },
};

// ── helpers ──
export async function readOutline(pdf) {
  const out = []; const ol = await pdf.getOutline().catch(() => null); if (!ol) return out;
  const walk = async (items, depth) => { for (const it of items) { let page = 1; try { let dest = it.dest; if (typeof dest === 'string') dest = await pdf.getDestination(dest); if (dest?.[0]) page = (typeof dest[0] === 'object' ? await pdf.getPageIndex(dest[0]) : dest[0]) + 1; } catch { } out.push({ title: (depth ? '  '.repeat(depth) : '') + it.title, page }); if (it.items?.length) await walk(it.items, depth + 1); } };
  await walk(ol, 0); return out;
}
async function detectHeadings(pdf) {
  const all = []; const sizes = {};
  for (let i = 1; i <= Math.min(pdf.numPages, 300); i++) { const lines = toLines((await pageText(pdf, i)).items); lines.forEach(l => { sizes[Math.round(l.size)] = (sizes[Math.round(l.size)] || 0) + l.text.length; all.push({ ...l, page: i }); }); }
  const body = +Object.entries(sizes).sort((a, b) => b[1] - a[1])[0]?.[0] || 11;
  return all.filter(l => l.size >= body * 1.25 && l.text.trim().length > 2 && l.text.length < 90).slice(0, 60).map(l => ({ title: l.text.trim(), page: l.page }));
}
function themeCanvas(c, theme) {
  const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height); const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    let r = p[i], g = p[i + 1], b = p[i + 2];
    if (theme === 'sepia') { const L = 0.299 * r + 0.587 * g + 0.114 * b; p[i] = Math.min(255, L * 0.95 + 40); p[i + 1] = Math.min(255, L * 0.85 + 28); p[i + 2] = Math.min(255, L * 0.65 + 12); continue; }
    const L = 0.299 * r + 0.587 * g + 0.114 * b; const nl = 255 - L; const sh = nl - L;
    r += sh; g += sh; b += sh; // invert lightness, keep hue
    if (theme === 'dim') { r = 28 + r * 0.82; g = 30 + g * 0.82; b = 34 + b * 0.82; }
    if (theme === 'night') { const l2 = 0.299 * r + 0.587 * g + 0.114 * b; r = l2; g = l2 * 0.78; b = l2 * 0.45; }
    p[i] = r; p[i + 1] = g; p[i + 2] = b;
  }
  x.putImageData(d, 0, 0); return c;
}
function contentStreams(page, P) {
  const c = page.node.Contents(); if (!c) return [];
  const arr = c instanceof P.PDFArray ? c.asArray().map(r => page.doc.context.lookup(r)) : [c];
  return arr.filter(Boolean).map(s => s instanceof P.PDFRawStream ? P.decodePDFRawStream(s).decode() : s.getContents ? s.getContents() : new Uint8Array());
}
const latin1 = b => { let s = ''; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); return s; };
const toBytes = s => { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255; return b; };
function stripWatermarkBlocks(src) {
  const re = /(\/\w+)\s*(<<(?:[^<>]|<<(?:[^<>]|<<[^<>]*>>)*>>)*>>|\/\w+)\s*BDC|(\/\w+)\s*BMC|\bEMC\b/g;
  let out = '', last = 0, depth = 0, skipStart = -1, skipDepth = 0, m;
  while ((m = re.exec(src))) {
    if (m[0].endsWith('EMC')) {
      if (skipStart >= 0 && depth === skipDepth) { out += src.slice(last, skipStart); last = m.index + m[0].length; skipStart = -1; }
      depth = Math.max(0, depth - 1);
    } else {
      depth++;
      if (skipStart < 0 && m[1] === '/Artifact' && /\/Watermark/.test(m[2] || '')) { skipStart = m.index; skipDepth = depth; }
    }
  }
  return out + src.slice(last);
}
function stripTextOps(src, text) {
  const e = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return src.replace(new RegExp(`\\((?:[^()\\\\]|\\\\.)*${e}(?:[^()\\\\]|\\\\.)*\\)\\s*Tj`, 'g'), '() Tj').replace(new RegExp(`\\[[^\\]]*${e}[^\\]]*\\]\\s*TJ`, 'g'), '[] TJ');
}
function stripTransparentImages(src, page, P) {
  const res = page.node.Resources(); const gs = res?.lookup(P.PDFName.of('ExtGState'));
  if (!(gs instanceof P.PDFDict)) return src; const transparent = new Set();
  for (const [k, v] of gs.entries()) { const d = page.doc.context.lookup(v); const ca = d?.get?.(P.PDFName.of('ca')); if (ca && +String(ca) < 0.95) transparent.add(String(k)); }
  if (!transparent.size) return src;
  return src.replace(/q\s+(\/\w+)\s+gs[\s\S]*?\/\w+\s+Do\s+Q/g, (m, g) => transparent.has(g) ? '' : m);
}
