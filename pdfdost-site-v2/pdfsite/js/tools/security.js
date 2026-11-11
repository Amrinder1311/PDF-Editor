// Security tools: protect, unlock, permissions, redact, auto-redact, sanitize
import { loadDoc, saveDoc, PL, renderPage, canvasBytes, pageText, findInItems } from '../core/pdf.js';
import { h, ic, esc, toast } from '../core/ui.js';
import { outName, single } from './common.js';
import { garbageCollect } from './optimize.js';

const permOpts = [
  { key: 'print', type: 'select', label: 'Printing', default: 'high', options: [['high', 'Allowed'], ['low', 'Low quality only'], ['none', 'Not allowed']] },
  { key: 'copy', type: 'check', label: 'Allow copying text & images', default: true },
  { key: 'modify', type: 'check', label: 'Allow editing', default: false },
  { key: 'annotate', type: 'check', label: 'Allow comments', default: true },
  { key: 'forms', type: 'check', label: 'Allow filling forms', default: true },
  { key: 'assemble', type: 'check', label: 'Allow adding / removing pages', default: false },
];
const perms = v => ({ printing: v.print === 'none' ? false : v.print === 'low' ? 'lowResolution' : 'highResolution', copying: !!v.copy, modifying: !!v.modify, annotating: !!v.annotate, fillingForms: !!v.forms, documentAssembly: !!v.assemble, contentAccessibility: true });
const randomPw = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), b => b.toString(36).padStart(2, '0')).join('');

export async function redactPages(doc, pdf, boxesByPage, { dpi = 200, color = '#000000', onProgress } = {}) {
  const { PDFDocument } = await PL(); const out = await PDFDocument.create(); const n = doc.getPageCount();
  for (let i = 0; i < n; i++) {
    const boxes = boxesByPage[i];
    if (!boxes?.length) { out.addPage((await out.copyPages(doc, [i]))[0]); continue; }
    onProgress?.(i / n, `Redacting page ${i + 1}`);
    const c = await renderPage(pdf, i + 1, { dpi, annotations: true }); const x = c.getContext('2d'); x.fillStyle = color;
    for (const b of boxes) x.fillRect(b.x * c.width - 1, b.y * c.height - 1, b.w * c.width + 2, b.h * c.height + 2);
    const img = await out.embedJpg(await canvasBytes(c, 'image/jpeg', 0.9));
    const p = out.addPage([c.pdfSize.w, c.pdfSize.h]); p.drawImage(img, { x: 0, y: 0, width: c.pdfSize.w, height: c.pdfSize.h });
  }
  return out;
}

export const PATTERNS = {
  email: ['Email addresses', /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g],
  phone: ['Phone numbers', /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,5}\b/g],
  aadhaar: ['Aadhaar numbers', /\b\d{4}\s?\d{4}\s?\d{4}\b/g],
  pan: ['PAN numbers', /\b[A-Z]{5}\d{4}[A-Z]\b/g],
  card: ['Card numbers', /\b(?:\d[ -]?){13,19}\b/g],
  ifsc: ['IFSC / bank codes', /\b[A-Z]{4}0[A-Z0-9]{6}\b/g],
  date: ['Dates', /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g],
  url: ['Web links', /\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+/g],
};

async function findBoxes(pdf, regexes, onProgress) {
  const byPage = {}; const found = [];
  for (let i = 0; i < pdf.numPages; i++) {
    onProgress?.(i / pdf.numPages * 0.5, `Scanning page ${i + 1}`);
    const { items, width, height } = await pageText(pdf, i + 1);
    // join items of the same line so numbers split across items are still found
    for (const [label, re] of regexes) for (const r of findInItems(items, re)) {
      (byPage[i] ||= []).push({ x: r.x / width, y: r.y / height, w: r.w / width, h: r.h / height });
      found.push({ page: i + 1, type: label, text: r.text });
    }
  }
  return { byPage, found };
}

export default {
  'protect-pdf': single({
    view: 'none', action: 'Protect PDF', actionIcon: 'lock', suffix: 'protected',
    options: [
      { key: 'pw', type: 'password', label: 'Password' }, { key: 'pw2', type: 'password', label: 'Repeat password' },
      { key: 'adv', type: 'check', label: 'Advanced: restrict printing / copying' },
      ...permOpts.map(o => ({ ...o, show: v => v.adv })),
      { key: 'algo', type: 'select', label: 'Encryption', default: 'AES-256', options: [['AES-256', 'AES-256 (strongest, recommended)'], ['AES-128', 'AES-128 (older readers)']], show: v => v.adv },
      { type: 'info', html: 'Keep your password safe — nobody (including us) can recover it.' },
    ],
    validate: ctx => !ctx.values.pw ? 'Enter a password' : ctx.values.pw !== ctx.values.pw2 ? 'Passwords don’t match' : null,
    async apply(bytes, v) {
      if (!v.pw) throw new Error('Enter a password');
      const doc = await loadDoc(bytes);
      doc.encrypt({ userPassword: v.pw, ownerPassword: v.adv ? randomPw() : v.pw, permissions: v.adv ? perms(v) : perms({ print: 'high', copy: true, modify: true, annotate: true, forms: true, assemble: true }), algorithm: v.algo || 'AES-256' });
      return doc;
    },
  }),

  'unlock-pdf': {
    accept: 'pdf', view: 'none', action: 'Unlock PDF', actionIcon: 'lock-open',
    options: [{ type: 'info', html: 'If the PDF needs a password to open, you were asked for it when you chose the file. Printing, copying and editing restrictions are removed too. Only unlock files you own or are allowed to use.' }],
    async run(ctx) {
      const f = ctx.files[0];
      if (!f.encrypted) toast('This PDF wasn’t password protected — saved a clean copy anyway.', 'info');
      const doc = await loadDoc(f.bytes);
      return { files: [{ name: outName(ctx, 'unlocked'), blob: await saveDoc(doc) }], message: f.encrypted ? 'Password and restrictions removed.' : 'No password was found.' };
    },
  },

  'pdf-permissions': single({
    view: 'none', action: 'Apply permissions', actionIcon: 'shield-check', suffix: 'restricted',
    options: [
      { type: 'info', html: 'Anyone can open the file, but only the actions you allow will work in readers that respect permissions (Adobe, Chrome, Edge…).' },
      ...permOpts,
      { key: 'owner', type: 'password', label: 'Permissions password', hint: 'Needed to change these settings later. Leave empty for a random one.' },
    ],
    async apply(bytes, v) { const doc = await loadDoc(bytes); doc.encrypt({ userPassword: '', ownerPassword: v.owner || randomPw(), permissions: perms(v) }); return doc; },
  }),

  'redact-pdf': {
    accept: 'pdf', view: 'editor', editorTools: ['redact'], editorDefault: 'redact', action: 'Redact & save', actionIcon: 'square',
    editorHint: t => t === 'redact' ? 'Drag over anything you want to black out. Tap once for a default box.' : null,
    options: ctx => [
      { type: 'custom', label: 'Find & mark text', render(box) {
        const input = h('input.option-input', { type: 'text', placeholder: 'e.g. a name or account number' });
        const go = async () => {
          const q = input.value.trim(); if (!q) return;
          const pdf = await ctx.pdf(); let n = 0;
          for (let i = 0; i < pdf.numPages; i++) { const { items, width, height } = await pageText(pdf, i + 1); for (const r of findInItems(items, q)) { ctx.state.objects.push({ id: Date.now() + n, type: 'redact', page: i, x: r.x / width, y: r.y / height, w: r.w / width, h: r.h / height }); n++; } }
          ctx.editor?.changed(); toast(n ? `Marked ${n} match${n > 1 ? 'es' : ''}` : 'No matches found', n ? 'success' : 'info');
        };
        input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        box.append(h('div', { style: { display: 'flex', gap: '.4rem' } }, input, h('button.btn.btn-ghost', { type: 'button', on: { click: go } }, ic('search'), 'Mark')));
      } },
      { key: 'color', type: 'seg', label: 'Box colour', default: '#000000', options: [['#000000', 'Black'], ['#ffffff', 'White']] },
      { key: 'meta', type: 'check', label: 'Also remove metadata & hidden data', default: true },
      { type: 'info', html: 'Redacted pages are flattened into images, so the hidden text is <b>permanently removed</b> — not just covered.' },
    ],
    validate: ctx => !ctx.state.objects?.length ? 'Mark at least one area to redact' : null,
    async run(ctx) {
      const doc = await loadDoc(ctx.files[0].bytes); const pdf = await ctx.pdf(); const byPage = {};
      for (const o of ctx.state.objects) (byPage[o.page] ||= []).push({ x: o.x, y: o.y, w: o.w, h: o.h });
      const out = await redactPages(doc, pdf, byPage, { color: ctx.values.color, onProgress: ctx.progress });
      if (ctx.values.meta) await sanitize(out, { info: true, xmp: true });
      return { files: [{ name: outName(ctx, 'redacted'), blob: await saveDoc(out) }], message: `${ctx.state.objects.length} area${ctx.state.objects.length > 1 ? 's' : ''} permanently redacted on ${Object.keys(byPage).length} page${Object.keys(byPage).length > 1 ? 's' : ''}.` };
    },
  },

  'auto-redact': {
    accept: 'pdf', view: 'thumbs', action: 'Find & redact', actionIcon: 'scan-eye',
    options: [
      { type: 'heading', label: 'What to redact' },
      ...Object.entries(PATTERNS).map(([k, [label]]) => ({ key: 'p_' + k, type: 'check', label, default: ['email', 'phone', 'aadhaar', 'pan', 'card'].includes(k) })),
      { key: 'words', type: 'text', label: 'Also these words or names', placeholder: 'e.g. Rahul Sharma, Account 1234', hint: 'Separate with commas.' },
      { key: 'regex', type: 'text', label: 'Custom pattern (regex, advanced)', placeholder: 'e.g. INV-\\d+' },
      { key: 'color', type: 'seg', label: 'Box colour', default: '#000000', options: [['#000000', 'Black'], ['#ffffff', 'White']] },
    ],
    async run(ctx) {
      const v = ctx.values; const regexes = Object.entries(PATTERNS).filter(([k]) => v['p_' + k]).map(([, [l, re]]) => [l, re]);
      String(v.words || '').split(',').map(s => s.trim()).filter(Boolean).forEach(w => regexes.push(['Custom word', new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')]));
      if (v.regex) { try { regexes.push(['Custom pattern', new RegExp(v.regex, 'g')]); } catch { throw new Error('The custom pattern is not a valid regular expression.'); } }
      if (!regexes.length) throw new Error('Choose at least one thing to redact');
      const pdf = await ctx.pdf(); const { byPage, found } = await findBoxes(pdf, regexes, ctx.progress);
      if (!found.length) throw new Error('Nothing matching was found. (Scanned PDFs need OCR first.)');
      const doc = await loadDoc(ctx.files[0].bytes);
      const out = await redactPages(doc, pdf, byPage, { color: v.color, onProgress: p => ctx.progress(0.5 + p / 2, 'Redacting…') });
      await sanitize(out, { info: true, xmp: true });
      const table = h('div.report-wrap', h('table.report', h('thead', h('tr', h('th', 'Page'), h('th', 'Type'), h('th', 'Redacted text'))), h('tbody', found.slice(0, 300).map(f => h('tr', h('td', `${f.page}`), h('td', esc(f.type)), h('td', esc(f.text.length > 4 ? f.text.slice(0, 2) + '•••' + f.text.slice(-2) : '•••')))))));
      return { files: [{ name: outName(ctx, 'redacted'), blob: await saveDoc(out) }], message: `${found.length} item${found.length > 1 ? 's' : ''} redacted on ${Object.keys(byPage).length} page${Object.keys(byPage).length > 1 ? 's' : ''}. Please review the result.`, html: table };
    },
  },

  'remove-metadata': single({
    view: 'none', action: 'Sanitize PDF', actionIcon: 'shield-off', suffix: 'sanitized',
    options: [
      { key: 'info', type: 'check', label: 'Document info (title, author, dates, software)', default: true },
      { key: 'xmp', type: 'check', label: 'XMP metadata', default: true },
      { key: 'js', type: 'check', label: 'JavaScript & auto-actions', default: true },
      { key: 'files', type: 'check', label: 'Embedded files / attachments', default: true },
      { key: 'annots', type: 'check', label: 'Comments & annotations' },
      { key: 'forms', type: 'check', label: 'Form fields (flatten them)' },
      { key: 'thumbs', type: 'check', label: 'Page thumbnails & private app data', default: true },
    ],
    async apply(bytes, v) { const doc = await loadDoc(bytes); await sanitize(doc, v); return doc; },
  }),
};

export async function sanitize(doc, v) {
  const P = await PL(); const N = n => P.PDFName.of(n); const ctx = doc.context;
  if (v.forms) { try { doc.getForm().flatten(); } catch { } }
  if (v.info) { ctx.trailerInfo.Info = undefined; }
  if (v.xmp) doc.catalog.delete(N('Metadata'));
  if (v.js) { doc.catalog.delete(N('OpenAction')); doc.catalog.delete(N('AA')); const names = doc.catalog.lookup(N('Names')); if (names instanceof P.PDFDict) names.delete(N('JavaScript')); }
  if (v.files) { const names = doc.catalog.lookup(N('Names')); if (names instanceof P.PDFDict) names.delete(N('EmbeddedFiles')); doc.catalog.delete(N('AF')); }
  for (const p of doc.getPages()) {
    if (v.js) p.node.delete(N('AA'));
    if (v.thumbs) { p.node.delete(N('Thumb')); p.node.delete(N('PieceInfo')); }
    const annots = p.node.lookup(N('Annots'));
    if (annots instanceof P.PDFArray) {
      for (let i = annots.size() - 1; i >= 0; i--) {
        const a = annots.lookup(i); const st = String(a?.get?.(N('Subtype')));
        if ((v.annots && st !== '/Link' && st !== '/Widget') || (v.files && st === '/FileAttachment')) annots.remove(i);
        else if (v.js && a?.get?.(N('A'))) { const act = a.lookup(N('A')); if (String(act?.get?.(N('S'))) === '/JavaScript') a.delete(N('A')); }
      }
    }
  }
  if (v.thumbs) doc.catalog.delete(N('PieceInfo'));
  garbageCollect(doc);
  return doc;
}
