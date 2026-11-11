// Compare & Review: compare PDFs, side-by-side viewer, export comments, accessibility checker
import { loadDoc, saveDoc, PL, openPdf, renderPage, canvasBytes, pageText, toLines } from '../core/pdf.js';
import { h, ic, esc, nextFrame } from '../core/ui.js';
import { toCSV } from '../core/htmlpdf.js';
import { walkFonts } from './extract.js';

function diffWords(a, b) {
  const n = a.length, m = b.length;
  if (n * m > 6e6) return [{ t: 'del', w: a.join(' ') }, { t: 'ins', w: b.join(' ') }];
  let s = 0; while (s < n && s < m && a[s] === b[s]) s++;
  let e = 0; while (e < n - s && e < m - s && a[n - 1 - e] === b[m - 1 - e]) e++;
  const A = a.slice(s, n - e), B = b.slice(s, m - e); const N = A.length, M = B.length;
  const dp = Array.from({ length: N + 1 }, () => new Uint16Array(M + 1));
  for (let i = N - 1; i >= 0; i--) for (let j = M - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = a.slice(0, s).map(w => ({ t: 'eq', w })); let i = 0, j = 0;
  while (i < N && j < M) { if (A[i] === B[j]) { out.push({ t: 'eq', w: A[i] }); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ t: 'del', w: A[i++] }); else out.push({ t: 'ins', w: B[j++] }); }
  while (i < N) out.push({ t: 'del', w: A[i++] }); while (j < M) out.push({ t: 'ins', w: B[j++] });
  a.slice(n - e).forEach(w => out.push({ t: 'eq', w }));
  return out;
}
const words = async (pdf, i) => i <= pdf.numPages ? toLines((await pageText(pdf, i)).items).map(l => l.text).join(' ').split(/\s+/).filter(Boolean) : [];

export default {
  'compare-pdf': {
    accept: 'pdf', multiple: true, min: 2, minMsg: 'Add the 2 PDFs you want to compare', view: 'files', action: 'Compare', actionIcon: 'git-compare', uploadTitle: 'Select 2 PDF versions',
    options: [{ key: 'mode', type: 'cards', label: 'Compare', default: 'text', options: [['text', 'Text changes', 'words added / removed'], ['visual', 'Visual changes', 'highlight pixel differences']] }, { type: 'info', html: 'The first file is the <b>original</b>, the second is the <b>new version</b>. Drag to swap.' }],
    async run(ctx) {
      const A = await ctx.pdf(0), B = await ctx.pdf(1); const pages = Math.max(A.numPages, B.numPages);
      if (ctx.values.mode === 'visual') {
        const { PDFDocument, rgb } = await PL(); const out = await PDFDocument.create(); let changedPages = 0; const thumbs = [];
        for (let i = 1; i <= pages; i++) {
          ctx.progress(i / pages, `Comparing page ${i}`);
          const ca = i <= A.numPages ? await renderPage(A, i, { dpi: 100 }) : null, cb = i <= B.numPages ? await renderPage(B, i, { dpi: 100 }) : null;
          const W = Math.max(ca?.width || 0, cb?.width || 0), H = Math.max(ca?.height || 0, cb?.height || 0);
          const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
          const da = ca?.getContext('2d').getImageData(0, 0, W, H).data, db = cb?.getContext('2d').getImageData(0, 0, W, H).data; const id = x.createImageData(W, H); let diff = 0;
          for (let k = 0; k < W * H * 4; k += 4) {
            const la = da ? (da[k] + da[k + 1] + da[k + 2]) / 3 : 255, lb = db ? (db[k] + db[k + 1] + db[k + 2]) / 3 : 255;
            if (Math.abs(la - lb) > 40) { diff++; if (lb < la) { id.data[k] = 22; id.data[k + 1] = 163; id.data[k + 2] = 74; } else { id.data[k] = 220; id.data[k + 1] = 38; id.data[k + 2] = 38; } id.data[k + 3] = 255; }
            else { const g = 255 - (255 - Math.min(la, lb)) * 0.25; id.data[k] = id.data[k + 1] = id.data[k + 2] = g; id.data[k + 3] = 255; }
          }
          x.putImageData(id, 0, 0); if (diff > 20) changedPages++;
          const img = await out.embedJpg(await canvasBytes(c, 'image/jpeg', 0.8)); const pw = W * 0.72, ph = H * 0.72; const p = out.addPage([pw, ph + 30]);
          p.drawImage(img, { x: 0, y: 0, width: pw, height: ph }); p.drawText(`Page ${i} — ${diff > 20 ? 'changed' : 'no visible change'}   (green = added, red = removed)`, { x: 10, y: ph + 10, size: 10, color: rgb(0.2, 0.2, 0.2) });
          if (thumbs.length < 12 && diff > 20) thumbs.push(c.toDataURL('image/jpeg', 0.7));
          await nextFrame();
        }
        return { title: changedPages ? `${changedPages} page${changedPages > 1 ? 's' : ''} changed` : 'No visible differences', files: [{ name: 'comparison-report.pdf', blob: await saveDoc(out) }], html: h('div.gallery', thumbs.map(u => h('a', { href: u, target: '_blank' }, h('img', { src: u, alt: 'Difference' })))) };
      }
      let ins = 0, del = 0; const sections = [];
      for (let i = 1; i <= pages; i++) {
        ctx.progress(i / pages, `Comparing page ${i}`);
        const d = diffWords(await words(A, i), await words(B, i)); const ci = d.filter(x => x.t === 'ins').length, cd = d.filter(x => x.t === 'del').length; ins += ci; del += cd;
        if (ci || cd) sections.push(`<h4 style="margin:1rem 0 .4rem">Page ${i} <small style="color:#16a34a">+${ci}</small> <small style="color:#dc2626">−${cd}</small></h4><div class="diff-txt">${d.map(x => x.t === 'eq' ? esc(x.w) : `<${x.t}>${esc(x.w)}</${x.t}>`).join(' ')}</div>`);
      }
      const html = sections.join('') || '<p>The text of both PDFs is identical.</p>';
      const report = `<!doctype html><meta charset="utf-8"><title>PDF comparison</title><style>body{font:15px/1.7 system-ui;max-width:900px;margin:2rem auto;padding:0 1rem}ins{background:#bbf7d0;text-decoration:none}del{background:#fecaca}</style><h2>${esc(ctx.files[0].name)} → ${esc(ctx.files[1].name)}</h2><p>${ins} words added, ${del} words removed.</p>${html}`;
      return { title: ins || del ? `${ins} added · ${del} removed` : 'No text differences', message: 'Green = added in the new version, red = removed.', files: [{ name: 'comparison.html', blob: new Blob([report], { type: 'text/html' }) }], html: h('div', { html, style: { maxHeight: '70vh', overflow: 'auto' } }) };
    },
  },

  'side-by-side': {
    accept: 'pdf', multiple: true, min: 2, minMsg: 'Add 2 PDFs to view side by side', view: 'custom', action: 'Swap sides', actionIcon: 'arrow-left-right', uploadTitle: 'Select 2 PDFs',
    options: [{ key: 'sync', type: 'check', label: 'Scroll both together', default: true }],
    async renderView(body, ctx) {
      body.style.maxHeight = 'none'; const panes = [h('div'), h('div')]; body.appendChild(h('div.sbs', panes));
      if (ctx.files.length < 2) { panes[1].innerHTML = '<p style="padding:1rem;color:var(--text-3)">Add a second PDF using “Start over”.</p>'; }
      for (let k = 0; k < Math.min(2, ctx.files.length); k++) {
        const f = ctx.files[k]; const pdf = await ctx.pdf(k); panes[k].appendChild(h('div', { style: { fontSize: '.8rem', fontWeight: 700, marginBottom: '.5rem' } }, esc(f.name)));
        const list = h('div.viewer-pages'); panes[k].appendChild(list);
        for (let i = 1; i <= Math.min(pdf.numPages, 200); i++) { const slot = h('div', { style: { width: '100%', minHeight: '120px' } }); list.appendChild(slot); renderPage(pdf, i, { width: 700 }).then(c => { c.style.width = '100%'; slot.replaceChildren(c); }); }
      }
      let lock = false;
      panes.forEach((p, k) => p.addEventListener('scroll', () => { if (!ctx.values.sync || lock) return; lock = true; const o = panes[1 - k]; o.scrollTop = p.scrollTop / Math.max(1, p.scrollHeight - p.clientHeight) * (o.scrollHeight - o.clientHeight); requestAnimationFrame(() => (lock = false)); }));
    },
    async run(ctx) { ctx.files.reverse(); await ctx.refreshView(); return null; },
  },

  'export-comments': {
    accept: 'pdf', view: 'thumbs', action: 'Export comments', actionIcon: 'message-square-text',
    options: [{ key: 'format', type: 'seg', label: 'Format', default: 'csv', options: [['csv', 'CSV (Excel)'], ['txt', 'Text summary']] }],
    async run(ctx) {
      const pdf = await ctx.pdf(); const rows = []; const skip = new Set(['Link', 'Widget', 'Popup']);
      for (let i = 1; i <= pdf.numPages; i++) {
        ctx.progress(i / pdf.numPages, `Reading page ${i}`); const page = await pdf.getPage(i); const annots = (await page.getAnnotations()).filter(a => !skip.has(a.subtype)); if (!annots.length) continue;
        const { items } = await pageText(pdf, i); const vp = page.getViewport({ scale: 1 });
        for (const a of annots) {
          let marked = '';
          if (a.quadPoints?.length || ['Highlight', 'Underline', 'StrikeOut', 'Squiggly'].includes(a.subtype)) {
            const [x1, y1] = vp.convertToViewportPoint(a.rect[0], a.rect[3]), [x2, y2] = vp.convertToViewportPoint(a.rect[2], a.rect[1]);
            marked = items.filter(it => it.x + it.w / 2 >= Math.min(x1, x2) - 2 && it.x + it.w / 2 <= Math.max(x1, x2) + 2 && it.y - it.size / 2 >= Math.min(y1, y2) - 2 && it.y - it.size / 2 <= Math.max(y1, y2) + 2).map(it => it.str).join(' ').trim();
          }
          const date = a.modificationDate ? String(a.modificationDate).replace(/^D:(\d{4})(\d\d)(\d\d)(\d\d)?(\d\d)?.*/, '$1-$2-$3 $4:$5').replace(/ :$/, '') : '';
          rows.push([i, a.subtype, a.titleObj?.str || a.title || '', date, a.contentsObj?.str || a.contents || '', marked]);
        }
      }
      if (!rows.length) throw new Error('This PDF has no comments or highlights.');
      const head = ['Page', 'Type', 'Author', 'Date', 'Comment', 'Marked text'];
      const blob = ctx.values.format === 'csv' ? new Blob(['﻿' + toCSV([head, ...rows.map(r => r.map(String))])], { type: 'text/csv;charset=utf-8' }) : new Blob([rows.map(r => `Page ${r[0]} · ${r[1]}${r[2] ? ' · ' + r[2] : ''}${r[3] ? ' · ' + r[3] : ''}\n${r[5] ? `“${r[5]}”\n` : ''}${r[4] ? r[4] + '\n' : ''}`).join('\n')], { type: 'text/plain;charset=utf-8' });
      return { files: [{ name: `comments.${ctx.values.format}`, blob }], message: `${rows.length} comment${rows.length > 1 ? 's' : ''} exported.`, html: h('div.report-wrap', h('table.report', h('thead', h('tr', head.map(x => h('th', x)))), h('tbody', rows.slice(0, 200).map(r => h('tr', r.map(c => h('td', esc(String(c))))))))) };
    },
  },

  'accessibility-check': {
    accept: 'pdf', view: 'none', action: 'Check accessibility', actionIcon: 'accessibility', options: [],
    async run(ctx) {
      const P = await PL(); const N = n => P.PDFName.of(n); const doc = await loadDoc(ctx.files[0].bytes); const pdf = await ctx.pdf(); const checks = [];
      const add = (status, title, detail) => checks.push({ status, title, detail });
      const tagged = String(doc.catalog.lookup(N('MarkInfo'))?.get?.(N('Marked'))) === 'true'; const struct = !!doc.catalog.get(N('StructTreeRoot'));
      add(tagged && struct ? 'ok' : 'bad', 'Tagged PDF', tagged && struct ? 'The document has a structure tree for screen readers.' : 'Not tagged — screen readers can’t follow headings, lists and reading order.');
      const title = doc.getTitle(); add(title ? 'ok' : 'bad', 'Document title', title ? `“${title}”` : 'No title set. Use Edit Metadata to add one.');
      const dt = String(doc.catalog.lookup(N('ViewerPreferences'))?.get?.(N('DisplayDocTitle'))) === 'true'; add(dt ? 'ok' : 'warn', 'Show title in window', dt ? 'Viewers show the title instead of the file name.' : 'Turn on “Show title instead of file name” in Edit Metadata.');
      const lang = doc.catalog.get(N('Lang')); add(lang ? 'ok' : 'bad', 'Language', lang ? `Language set to ${String(lang).replace(/[()]/g, '')}.` : 'No document language. Screen readers may mispronounce text.');
      let textPages = 0; const sample = Math.min(pdf.numPages, 15); for (let i = 1; i <= sample; i++) if ((await pageText(pdf, i)).items.length) textPages++;
      add(textPages === sample ? 'ok' : textPages ? 'warn' : 'bad', 'Real text (not scanned)', textPages === sample ? 'All checked pages contain real text.' : `${sample - textPages} of ${sample} checked pages have no text — run OCR PDF.`);
      const fonts = await walkFonts(doc); const notEmb = fonts.filter(f => !f.embedded); add(notEmb.length ? 'warn' : 'ok', 'Fonts embedded', notEmb.length ? `${notEmb.length} font(s) not embedded: ${notEmb.slice(0, 5).map(f => f.name).join(', ')}` : 'All fonts are embedded.');
      let fields = []; try { fields = doc.getForm().getFields(); } catch { } const noTip = fields.filter(f => !f.acroField.dict.get(N('TU'))).length;
      if (fields.length) add(noTip ? 'warn' : 'ok', 'Form field descriptions', noTip ? `${noTip} of ${fields.length} fields have no tooltip/description.` : 'All form fields have descriptions.');
      const outline = (await pdf.getOutline().catch(() => null))?.length; add(outline || pdf.numPages < 10 ? 'ok' : 'warn', 'Bookmarks', outline ? 'Has bookmarks for navigation.' : pdf.numPages < 10 ? 'Short document — bookmarks optional.' : 'Long document without bookmarks. Add them with Edit Bookmarks.');
      const restricted = ctx.files[0].encrypted; add(restricted ? 'warn' : 'ok', 'Security', restricted ? 'The file was encrypted — make sure “content accessibility” is allowed.' : 'No restrictions blocking assistive technology.');
      const score = Math.round(checks.filter(c => c.status === 'ok').length / checks.length * 100);
      const icon = { ok: 'circle-check', warn: 'triangle-alert', bad: 'circle-x' };
      const report = h('div', checks.map(c => h(`div.chk.${c.status}`, ic(icon[c.status]), h('div', h('b', c.title), h('small', esc(c.detail))))));
      const txt = checks.map(c => `[${c.status.toUpperCase()}] ${c.title}: ${c.detail}`).join('\n');
      return { title: `Accessibility score: ${score}%`, message: 'Basic automated check. Full PDF/UA tagging is coming in “Make PDF Accessible”.', icon: score > 70 ? 'circle-check' : 'triangle-alert', files: [{ name: 'accessibility-report.txt', blob: new Blob([txt], { type: 'text/plain' }) }], html: report };
    },
  },
};
