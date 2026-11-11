// Organize tools: merge, split, extract, delete, reorder, rotate, insert, n-up, booklet…
import { loadDoc, saveDoc, PL, parseRangeGroups, parsePages, PAGE_SIZES, MM, prepareFile } from '../core/pdf.js';
import { nextFrame } from '../core/ui.js';
import { outName, pdfResult, single } from './common.js';

const sizeOpts = [['same', 'Same as original'], ...Object.keys(PAGE_SIZES).map(k => [k, k])];

export default {
  'merge-pdf': {
    accept: 'pdf', multiple: true, min: 2, minMsg: 'Add at least 2 PDFs to merge', view: 'files', action: 'Merge PDF', actionIcon: 'combine',
    uploadTitle: 'Select PDF files to merge', about: 'Drag the files into the order you want before merging.',
    options: [
      { type: 'info', html: 'Drag files to change their order. Tap ✕ to remove one.' },
      { key: 'blank', type: 'check', label: 'Add a blank page between files' },
      { key: 'outline', type: 'check', label: 'Add a bookmark for each file', default: true },
      { key: 'name', type: 'text', label: 'Output file name', placeholder: 'merged.pdf' },
    ],
    async run(ctx) {
      const { PDFDocument } = await PL();
      const out = await PDFDocument.create();
      const marks = [];
      for (let i = 0; i < ctx.files.length; i++) {
        ctx.progress(i / ctx.files.length, `Adding ${ctx.files[i].name}`);
        const src = await loadDoc(ctx.files[i].bytes);
        const pages = await out.copyPages(src, src.getPageIndices());
        marks.push([ctx.files[i].name.replace(/\.pdf$/i, ''), out.getPageCount()]);
        pages.forEach(p => out.addPage(p));
        if (ctx.values.blank && i < ctx.files.length - 1) { const last = pages[pages.length - 1]; out.addPage([last.getWidth(), last.getHeight()]); }
        await nextFrame();
      }
      if (ctx.values.outline) setOutline(out, marks.map(([title, page]) => ({ title, page })));
      let name = (ctx.values.name || '').trim() || 'merged.pdf'; if (!/\.pdf$/i.test(name)) name += '.pdf';
      return { files: [{ name, blob: await saveDoc(out) }], message: `${ctx.files.length} files merged into one PDF with ${out.getPageCount()} pages.` };
    },
  },

  'split-pdf': {
    accept: 'pdf', view: 'thumbs', action: 'Split PDF', actionIcon: 'scissors',
    options: ctx => [
      { key: 'mode', type: 'cards', label: 'How to split', default: 'ranges', options: [['ranges', 'Custom ranges', 'e.g. 1-3, 4-8'], ['every', 'Every N pages', 'equal parts'], ['each', 'Every page', 'one file each'], ['size', 'By file size', 'max MB per file']] },
      { key: 'ranges', type: 'pages', label: 'Page ranges', placeholder: `e.g. 1-3, 4-${Math.max(4, ctx.files[0].pageCount)}`, hint: 'Each range becomes its own PDF. Use “odd” or “even” too.', show: v => v.mode === 'ranges' },
      { key: 'mergeRanges', type: 'check', label: 'Merge all ranges into one PDF', show: v => v.mode === 'ranges' },
      { key: 'n', type: 'number', label: 'Pages per file', default: 2, min: 1, show: v => v.mode === 'every' },
      { key: 'mb', type: 'number', label: 'Maximum size per file (MB)', default: 5, min: 0.1, step: 0.1, show: v => v.mode === 'size' },
      { type: 'info', html: `This PDF has <b>${ctx.files[0].pageCount}</b> pages.` },
    ],
    validate: ctx => ctx.values.mode === 'ranges' && !String(ctx.values.ranges).trim() ? 'Enter the page ranges, e.g. 1-3, 5' : null,
    async run(ctx) {
      const { PDFDocument } = await PL();
      const src = await loadDoc(ctx.files[0].bytes); const n = src.getPageCount(); const v = ctx.values;
      let groups;
      if (v.mode === 'ranges') groups = parseRangeGroups(v.ranges, n);
      else if (v.mode === 'every') { const k = Math.max(1, +v.n || 1); groups = []; for (let i = 0; i < n; i += k) groups.push([...Array(Math.min(k, n - i)).keys()].map(j => i + j)); }
      else if (v.mode === 'each') groups = [...Array(n).keys()].map(i => [i]);
      else groups = await groupBySize(src, n, (+v.mb || 5) * 1048576, ctx.progress);
      if (!groups.length) throw new Error('No pages matched those ranges.');
      if (v.mode === 'ranges' && v.mergeRanges) groups = [groups.flat()];
      const files = [];
      for (let g = 0; g < groups.length; g++) {
        ctx.progress(g / groups.length, `Creating part ${g + 1} of ${groups.length}`);
        const d = await PDFDocument.create();
        (await d.copyPages(src, groups[g])).forEach(p => d.addPage(p));
        const label = groups[g].length === 1 ? `page-${groups[g][0] + 1}` : `pages-${groups[g][0] + 1}-${groups[g][groups[g].length - 1] + 1}`;
        files.push({ name: outName(ctx, groups.length === 1 ? 'split' : label), blob: await saveDoc(d) });
        if (g % 5 === 4) await nextFrame();
      }
      return { files, message: `Split into ${files.length} PDF file${files.length > 1 ? 's' : ''}.` };
    },
  },

  'extract-pages': {
    accept: 'pdf', view: 'select', action: 'Extract pages', actionIcon: 'file-output',
    options: [
      { type: 'info', html: 'Tap the pages you want to keep, or type them below.' },
      { key: 'pages', type: 'pages', label: 'Or enter pages', hint: 'Used when no pages are tapped.' },
      { key: 'separate', type: 'check', label: 'Save each page as a separate PDF' },
    ],
    validate: ctx => !ctx.sel.size && !String(ctx.values.pages).trim() ? 'Tap the pages to extract, or type page numbers' : null,
    async run(ctx) {
      const { PDFDocument } = await PL();
      const src = await loadDoc(ctx.files[0].bytes);
      const idx = ctx.sel.size ? [...ctx.sel].sort((a, b) => a - b) : parsePages(ctx.values.pages, src.getPageCount(), false);
      if (!idx.length) throw new Error('No pages selected.');
      if (ctx.values.separate) {
        const files = [];
        for (const i of idx) { const d = await PDFDocument.create(); d.addPage((await d.copyPages(src, [i]))[0]); files.push({ name: outName(ctx, `page-${i + 1}`), blob: await saveDoc(d) }); }
        return { files };
      }
      const d = await PDFDocument.create(); (await d.copyPages(src, idx)).forEach(p => d.addPage(p));
      return pdfResult(ctx, d, 'extracted', { message: `${idx.length} page${idx.length > 1 ? 's' : ''} extracted.` });
    },
  },

  'delete-pages': {
    accept: 'pdf', view: 'select', selectStyle: 'delete', action: 'Delete pages', actionIcon: 'trash-2',
    options: [
      { type: 'info', html: 'Tap the pages you want to <b>remove</b>, or type them below.' },
      { key: 'pages', type: 'pages', label: 'Or enter pages to delete' },
    ],
    validate: ctx => !ctx.sel.size && !String(ctx.values.pages).trim() ? 'Tap the pages you want to delete' : null,
    async run(ctx) {
      const src = await loadDoc(ctx.files[0].bytes); const n = src.getPageCount();
      const del = ctx.sel.size ? [...ctx.sel] : parsePages(ctx.values.pages, n, false);
      if (del.length >= n) throw new Error('You can’t delete every page.');
      [...del].sort((a, b) => b - a).forEach(i => src.removePage(i));
      return pdfResult(ctx, src, 'edited', { message: `${del.length} page${del.length > 1 ? 's' : ''} deleted. ${src.getPageCount()} pages left.` });
    },
  },

  'rearrange-pages': {
    accept: 'pdf', view: 'reorder', action: 'Save new order', actionIcon: 'check',
    options: [{ type: 'info', html: 'Drag pages into the order you want. On a phone, press and hold a page, then drag. The bin icon removes a page.' }],
    async run(ctx) {
      const { PDFDocument } = await PL();
      const src = await loadDoc(ctx.files[0].bytes);
      const d = await PDFDocument.create(); (await d.copyPages(src, ctx.order)).forEach(p => d.addPage(p));
      return pdfResult(ctx, d, 'reordered');
    },
  },

  'rotate-pdf': single({
    view: 'rotate', action: 'Rotate PDF', actionIcon: 'rotate-cw', suffix: 'rotated',
    options: [
      { type: 'info', html: 'Use the buttons under each page, or rotate pages in bulk below.' },
      { key: 'angle', type: 'seg', label: 'Rotate in bulk', default: '0', options: [['0', 'None'], ['90', '90° right', 'rotate-cw'], ['180', '180°'], ['270', '90° left', 'rotate-ccw']] },
      { key: 'which', type: 'select', label: 'Apply bulk rotation to', default: 'all', options: [['all', 'All pages'], ['odd', 'Odd pages'], ['even', 'Even pages'], ['land', 'Landscape pages only'], ['port', 'Portrait pages only']], show: v => v.angle !== '0' },
    ],
    async apply(bytes, v, progress, ctx) {
      const { degrees } = await PL();
      const doc = await loadDoc(bytes);
      doc.getPages().forEach((p, i) => {
        const w = p.getWidth(), hh = p.getHeight(); const r0 = p.getRotation().angle;
        let add = ctx?.rot?.[i] || 0;
        const bulk = +v.angle || 0;
        const match = { all: true, odd: i % 2 === 0, even: i % 2 === 1, land: (r0 % 180 ? hh > w : w > hh), port: (r0 % 180 ? w >= hh : hh >= w) }[v.which || 'all'];
        if (bulk && match) add += bulk;
        if (add % 360) p.setRotation(degrees((r0 + add) % 360));
      });
      return doc;
    },
  }),

  'insert-pages': {
    accept: 'pdf', view: 'thumbs', action: 'Insert pages', actionIcon: 'file-plus-2',
    options: ctx => [
      { key: 'other', type: 'file', label: 'PDF to insert', accept: '.pdf,application/pdf', placeholder: 'Choose the PDF to insert' },
      { key: 'otherPages', type: 'pages', label: 'Pages from that PDF (optional)', hint: 'Leave empty to insert all pages.' },
      { key: 'where', type: 'seg', label: 'Insert', default: 'end', options: [['start', 'At start'], ['after', 'After page'], ['end', 'At end']] },
      { key: 'after', type: 'number', label: 'After page number', default: 1, min: 1, max: ctx.files[0].pageCount, show: v => v.where === 'after' },
    ],
    validate: ctx => !ctx.values.other ? 'Choose the PDF you want to insert' : null,
    async run(ctx) {
      const doc = await loadDoc(ctx.files[0].bytes);
      const other = await prepareFile(ctx.values.other); const src = await loadDoc(other.bytes);
      const idx = parsePages(ctx.values.otherPages, src.getPageCount());
      const pages = await doc.copyPages(src, idx);
      let at = { start: 0, end: doc.getPageCount(), after: Math.min(doc.getPageCount(), Math.max(0, +ctx.values.after || 0)) }[ctx.values.where];
      for (const p of pages) doc.insertPage(at++, p);
      return pdfResult(ctx, doc, 'inserted', { message: `${pages.length} page${pages.length > 1 ? 's' : ''} inserted.` });
    },
  },

  'insert-blank': single({
    view: 'thumbs', action: 'Insert blank pages', actionIcon: 'file-plus', suffix: 'blank-added',
    options: [
      { key: 'where', type: 'select', label: 'Where', default: 'end', options: [['start', 'At the start'], ['end', 'At the end'], ['after', 'After specific pages'], ['every', 'After every page'], ['odd', 'To make page count even (for printing)']] },
      { key: 'after', type: 'pages', label: 'After these pages', placeholder: 'e.g. 2, 5', show: v => v.where === 'after' },
      { key: 'count', type: 'number', label: 'How many blank pages each time', default: 1, min: 1, max: 50, show: v => v.where !== 'odd' },
      { key: 'size', type: 'select', label: 'Blank page size', default: 'same', options: sizeOpts },
    ],
    async apply(bytes, v) {
      const doc = await loadDoc(bytes); const n = doc.getPageCount(); const cnt = Math.max(1, +v.count || 1);
      const sz = i => { if (v.size !== 'same') return PAGE_SIZES[v.size]; const p = doc.getPage(Math.min(i, doc.getPageCount() - 1)); return [p.getWidth(), p.getHeight()]; };
      const ins = (at, ref) => { for (let k = 0; k < cnt; k++) doc.insertPage(at, sz(ref)); };
      if (v.where === 'start') ins(0, 0);
      else if (v.where === 'end') ins(n, n - 1);
      else if (v.where === 'odd') { if (n % 2) doc.insertPage(n, sz(n - 1)); }
      else {
        const after = v.where === 'every' ? [...Array(n).keys()] : parsePages(v.after, n, false);
        if (!after.length) throw new Error('Enter the page numbers to add blank pages after.');
        [...after].sort((a, b) => b - a).forEach(i => ins(i + 1, i));
      }
      return doc;
    },
  }),

  'duplicate-pages': {
    accept: 'pdf', view: 'select', action: 'Duplicate pages', actionIcon: 'copy',
    options: [
      { type: 'info', html: 'Tap the pages to duplicate (or leave all un-tapped to duplicate every page).' },
      { key: 'copies', type: 'number', label: 'Number of copies', default: 1, min: 1, max: 100 },
      { key: 'place', type: 'seg', label: 'Put copies', default: 'after', options: [['after', 'Right after each page'], ['end', 'At the end']] },
    ],
    async run(ctx) {
      const doc = await loadDoc(ctx.files[0].bytes); const n = doc.getPageCount();
      const sel = ctx.sel.size ? [...ctx.sel].sort((a, b) => a - b) : [...Array(n).keys()];
      const copies = Math.max(1, +ctx.values.copies || 1);
      if (ctx.values.place === 'end') { for (let c = 0; c < copies; c++) (await doc.copyPages(doc, sel)).forEach(p => doc.addPage(p)); }
      else { for (const i of [...sel].reverse()) { const pages = await doc.copyPages(doc, Array(copies).fill(i)); pages.forEach((p, k) => doc.insertPage(i + 1 + k, p)); } }
      return pdfResult(ctx, doc, 'duplicated', { message: `Now ${doc.getPageCount()} pages.` });
    },
  },

  'reverse-pdf': single({
    view: 'thumbs', action: 'Reverse pages', actionIcon: 'arrow-down-up', suffix: 'reversed',
    options: [{ key: 'range', type: 'pages', label: 'Only reverse these pages (optional)', hint: 'Leave empty to reverse the whole document.' }],
    async apply(bytes, v) {
      const { PDFDocument } = await PL();
      const src = await loadDoc(bytes); const n = src.getPageCount();
      const sub = parsePages(v.range, n); const rev = [...sub].reverse();
      const order = [...Array(n).keys()].map(i => { const k = sub.indexOf(i); return k >= 0 ? rev[k] : i; });
      const d = await PDFDocument.create(); (await d.copyPages(src, order)).forEach(p => d.addPage(p));
      return d;
    },
  }),

  'alternate-mix': {
    accept: 'pdf', multiple: true, min: 2, minMsg: 'Add 2 PDFs — e.g. the front sides and the back sides', view: 'files', action: 'Mix pages', actionIcon: 'shuffle',
    uploadTitle: 'Select 2 PDFs (front & back pages)',
    options: [
      { type: 'info', html: 'Pages are taken one at a time from each file: A1, B1, A2, B2… Perfect for double-sided scans made on a single-sided scanner.' },
      { key: 'reverseB', type: 'check', label: 'Second file is in reverse order', default: true, hint: 'Usually true when you flip the paper stack to scan the back sides.' },
      { key: 'reverseA', type: 'check', label: 'First file is in reverse order' },
      { key: 'chunk', type: 'number', label: 'Pages to take at a time', default: 1, min: 1 },
    ],
    async run(ctx) {
      const { PDFDocument } = await PL();
      const docs = await Promise.all(ctx.files.map(f => loadDoc(f.bytes)));
      const out = await PDFDocument.create();
      const lists = await Promise.all(docs.map(async (d, k) => { let idx = d.getPageIndices(); if ((k === 0 && ctx.values.reverseA) || (k === 1 && ctx.values.reverseB)) idx = idx.reverse(); return out.copyPages(d, idx); }));
      const c = Math.max(1, +ctx.values.chunk || 1); const max = Math.max(...lists.map(l => l.length));
      for (let i = 0; i < max; i += c) for (const l of lists) l.slice(i, i + c).forEach(p => out.addPage(p));
      return { files: [{ name: outName(ctx, 'mixed'), blob: await saveDoc(out) }], message: `${out.getPageCount()} pages interleaved.` };
    },
  },

  'n-up': single({
    view: 'thumbs', action: 'Create N-up PDF', actionIcon: 'layout-grid', suffix: 'n-up',
    options: [
      { key: 'n', type: 'seg', label: 'Pages per sheet', default: '4', options: [['2', '2'], ['4', '4'], ['6', '6'], ['8', '8'], ['9', '9'], ['16', '16']] },
      { key: 'sheet', type: 'select', label: 'Sheet size', default: 'A4', options: Object.keys(PAGE_SIZES).map(k => [k, k]) },
      { key: 'orient', type: 'seg', label: 'Orientation', default: 'auto', options: [['auto', 'Auto'], ['portrait', 'Portrait'], ['landscape', 'Landscape']] },
      { key: 'order', type: 'seg', label: 'Page order', default: 'row', options: [['row', 'Across → down'], ['col', 'Down → across']] },
      { key: 'gap', type: 'range', label: 'Spacing', default: 8, min: 0, max: 40, unit: ' pt' },
      { key: 'border', type: 'check', label: 'Draw a border around each page' },
    ],
    async apply(bytes, v, progress) {
      const { PDFDocument, rgb } = await PL();
      const src = await loadDoc(bytes); const out = await PDFDocument.create();
      const N = +v.n; const grids = { 2: [2, 1], 4: [2, 2], 6: [3, 2], 8: [4, 2], 9: [3, 3], 16: [4, 4] };
      let [W, H] = PAGE_SIZES[v.sheet];
      const land = v.orient === 'landscape' || (v.orient === 'auto' && [2, 6, 8].includes(N));
      if (land) [W, H] = [Math.max(W, H), Math.min(W, H)];
      let [cols, rows] = grids[N]; if (!land && cols !== rows) [cols, rows] = [rows, cols];
      const emb = await out.embedPages(src.getPages());
      const g = +v.gap; const cw = (W - g * (cols + 1)) / cols, ch = (H - g * (rows + 1)) / rows;
      for (let i = 0; i < emb.length; i += N) {
        const page = out.addPage([W, H]);
        for (let k = 0; k < N && i + k < emb.length; k++) {
          const e = emb[i + k]; const srcPage = src.getPage(i + k); const rot = srcPage.getRotation().angle % 360;
          const ew = rot % 180 ? e.height : e.width, eh = rot % 180 ? e.width : e.height;
          const s = Math.min(cw / ew, ch / eh);
          const c = v.order === 'col' ? Math.floor(k / rows) : k % cols, r = v.order === 'col' ? k % rows : Math.floor(k / cols);
          const x = g + c * (cw + g) + (cw - ew * s) / 2, y = H - (g + r * (ch + g)) - ch + (ch - eh * s) / 2;
          drawRotated(page, e, x, y, s, rot);
          if (v.border) page.drawRectangle({ x, y, width: ew * s, height: eh * s, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.6 });
        }
        progress?.(i / emb.length, 'Placing pages');
      }
      return out;
    },
  }),

  'booklet-maker': single({
    view: 'thumbs', action: 'Make booklet', actionIcon: 'book-open', suffix: 'booklet',
    options: [
      { type: 'info', html: 'Print the result double-sided (flip on short edge), fold in the middle and staple — your pages will be in the right order.' },
      { key: 'sheet', type: 'select', label: 'Paper size', default: 'A4', options: [['auto', 'Fit two pages exactly'], ...Object.keys(PAGE_SIZES).map(k => [k, k])] },
      { key: 'rtl', type: 'check', label: 'Right-to-left binding (Urdu, Arabic)' },
    ],
    async apply(bytes, v) {
      const { PDFDocument } = await PL();
      const src = await loadDoc(bytes); const out = await PDFDocument.create();
      const emb = await out.embedPages(src.getPages());
      const n = Math.ceil(emb.length / 4) * 4;
      const p0 = src.getPage(0); const pw = p0.getWidth(), ph = p0.getHeight();
      let W, H; if (v.sheet === 'auto') { W = pw * 2; H = ph; } else { const s = PAGE_SIZES[v.sheet]; W = Math.max(...s); H = Math.min(...s); }
      const slot = (page, i, side) => {
        const e = emb[i]; if (!e) return;
        const s = Math.min((W / 2) / e.width, H / e.height);
        const x = (side ? W / 2 : 0) + (W / 2 - e.width * s) / 2, y = (H - e.height * s) / 2;
        page.drawPage(e, { x, y, xScale: s, yScale: s });
      };
      for (let i = 0; i < n / 2; i += 2) {
        let [l1, r1] = [n - 1 - i, i], [l2, r2] = [i + 1, n - 2 - i];
        if (v.rtl) { [l1, r1] = [r1, l1]; [l2, r2] = [r2, l2]; }
        const f = out.addPage([W, H]); slot(f, l1, 0); slot(f, r1, 1);
        const b = out.addPage([W, H]); slot(b, l2, 0); slot(b, r2, 1);
      }
      return out;
    },
  }),

  'split-half': single({
    view: 'thumbs', action: 'Split pages', actionIcon: 'columns-2', suffix: 'split-half',
    options: [
      { key: 'dir', type: 'seg', label: 'Split', default: 'v', options: [['v', 'Left | Right', 'columns-2'], ['h', 'Top / Bottom', 'rows-2']] },
      { key: 'skip', type: 'pages', label: 'Don’t split these pages (e.g. covers)', placeholder: 'e.g. 1, last' },
      { key: 'rtl', type: 'check', label: 'Right page first (right-to-left books)' },
    ],
    async apply(bytes, v) {
      const { PDFDocument } = await PL();
      const src = await loadDoc(bytes); const n = src.getPageCount(); const out = await PDFDocument.create();
      const skip = new Set(String(v.skip || '').trim() ? parsePages(v.skip, n, false) : []);
      for (let i = 0; i < n; i++) {
        if (skip.has(i)) { out.addPage((await out.copyPages(src, [i]))[0]); continue; }
        const [a, b] = await out.copyPages(src, [i, i]);
        const box = a.getCropBox(); const rot = a.getRotation().angle % 180;
        const vertical = (v.dir === 'v') !== !!rot; // visual split direction in user space
        const halves = vertical
          ? [[box.x, box.y, box.width / 2, box.height], [box.x + box.width / 2, box.y, box.width / 2, box.height]]
          : [[box.x, box.y + box.height / 2, box.width, box.height / 2], [box.x, box.y, box.width, box.height / 2]];
        let order = [[a, halves[0]], [b, halves[1]]];
        const rotAngle = a.getRotation().angle % 360; if (rotAngle === 90 || rotAngle === 180) order.reverse();
        if (v.rtl) order.reverse();
        for (const [p, hb] of order) { p.setCropBox(...hb); p.setMediaBox(...hb); out.addPage(p); }
      }
      return out;
    },
  }),
};

// Draw an embedded page at (x,y) honouring the source page's /Rotate
export function drawRotated(page, e, x, y, s, rot) {
  const P = window.PDFLib;
  if (!rot) return page.drawPage(e, { x, y, xScale: s, yScale: s });
  if (rot === 90) return page.drawPage(e, { x, y: y + e.width * s, xScale: s, yScale: s, rotate: P.degrees(-90) });
  if (rot === 180) return page.drawPage(e, { x: x + e.width * s, y: y + e.height * s, xScale: s, yScale: s, rotate: P.degrees(180) });
  if (rot === 270) return page.drawPage(e, { x: x + e.height * s, y, xScale: s, yScale: s, rotate: P.degrees(90) });
}

// Flat outline (bookmarks) — [{title, page(0-based)}]
export function setOutline(doc, items) {
  const P = window.PDFLib; const ctx = doc.context; const pages = doc.getPages();
  if (!items.length) { doc.catalog.delete(P.PDFName.of('Outlines')); return; }
  const outlineRef = ctx.nextRef(); const refs = items.map(() => ctx.nextRef());
  items.forEach((it, i) => {
    const page = pages[Math.max(0, Math.min(pages.length - 1, it.page))];
    const d = { Title: P.PDFHexString.fromText(String(it.title || `Page ${it.page + 1}`)), Parent: outlineRef, Dest: [page.ref, 'XYZ', null, null, null] };
    if (i > 0) d.Prev = refs[i - 1]; if (i < items.length - 1) d.Next = refs[i + 1];
    ctx.assign(refs[i], ctx.obj(d));
  });
  ctx.assign(outlineRef, ctx.obj({ Type: 'Outlines', First: refs[0], Last: refs[refs.length - 1], Count: items.length }));
  doc.catalog.set(P.PDFName.of('Outlines'), outlineRef);
  doc.catalog.set(P.PDFName.of('PageMode'), P.PDFName.of('UseOutlines'));
}

async function groupBySize(src, n, max, progress) {
  const { PDFDocument } = await PL();
  const sizes = [];
  for (let i = 0; i < n; i++) {
    progress(i / n * 0.5, `Measuring page ${i + 1}`);
    const d = await PDFDocument.create(); d.addPage((await d.copyPages(src, [i]))[0]);
    sizes.push((await d.save({ useObjectStreams: true })).length);
  }
  const groups = []; let cur = [], sum = 0;
  sizes.forEach((s, i) => { if (cur.length && sum + s > max) { groups.push(cur); cur = []; sum = 0; } cur.push(i); sum += s; });
  if (cur.length) groups.push(cur);
  return groups;
}
