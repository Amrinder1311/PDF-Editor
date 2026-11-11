// Advanced: batch, workflow builder, attachments, layers, QR/barcode, blank PDF, templates
import { loadDoc, saveDoc, PL, renderPage, openPdf, getFont, canEncode, hexRgb, PAGE_SIZES, MM } from '../core/pdf.js';
import { lib } from '../core/lib.js';
import { h, ic, esc, toast, store, baseName, nextFrame } from '../core/ui.js';
import { renderOptions, initValues } from '../core/options.js';
import { applyObjects } from '../core/editor.js';
import { toolBySlug } from '../data/tools.js';
import { outName } from './common.js';
import organize from './organize.js';
import optimize from './optimize.js';
import edit, { stampText, measure } from './edit.js';
import security from './security.js';
import convertFrom from './convert-from.js';

// Tools that can run on a single PDF without any page interaction
const REG = { ...pick(optimize, ['compress-pdf', 'optimize-images', 'flatten-pdf', 'remove-objects']), ...pick(organize, ['rotate-pdf', 'insert-blank', 'reverse-pdf', 'n-up', 'booklet-maker', 'split-half']), ...pick(edit, ['page-numbers', 'header-footer', 'watermark', 'background-color', 'resize-pages', 'change-margins']), ...pick(security, ['protect-pdf', 'pdf-permissions', 'remove-metadata']), ...pick(convertFrom, ['pdf-to-grayscale']) };
function pick(o, keys) { return Object.fromEntries(keys.map(k => [k, o[k]])); }
const staticOpts = slug => (typeof REG[slug].options === 'function' ? [] : REG[slug].options || []).filter(o => o.type !== 'pages' || true);
const toolChoices = Object.keys(REG).map(s => [s, toolBySlug[s].name]);

async function runChain(bytes, steps, progress, name) {
  let cur = bytes;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]; const impl = REG[s.tool]; const vals = initValues(staticOpts(s.tool), { ...s.values });
    const err = impl.validate?.({ values: vals, files: [{ name }], state: {}, sel: new Set() }); if (err) throw new Error(`${toolBySlug[s.tool].name}: ${err}`);
    const doc = await impl.apply(cur, vals, f => progress?.((i + (f || 0)) / steps.length, `${toolBySlug[s.tool].name}…`), { files: [{ name }], rot: {} });
    cur = await doc.save({ useObjectStreams: true });
  }
  return new Blob([cur], { type: 'application/pdf' });
}

function stepEditor(ctx, box) {
  const draw = () => {
    box.innerHTML = '';
    ctx.state.steps.forEach((s, i) => {
      const sel = h('select.option-select', { 'aria-label': `Step ${i + 1} tool`, on: { change: e => { s.tool = e.target.value; s.values = {}; draw(); } } }, toolChoices.map(([v, l]) => h('option', { value: v, selected: v === s.tool }, l)));
      const opts = renderOptions(staticOpts(s.tool).filter(o => !['heading'].includes(o.type)), s.values);
      const card = h('div.wf-step', h('div.wf-step-head', h('span.pill', `${i + 1}`), sel,
        h('button.mini-btn.icon-only', { type: 'button', 'aria-label': 'Move up', disabled: i === 0, on: { click: () => { ctx.state.steps.splice(i - 1, 0, ctx.state.steps.splice(i, 1)[0]); draw(); } } }, ic('chevron-up')),
        h('button.mini-btn.icon-only', { type: 'button', 'aria-label': 'Remove step', on: { click: () => { ctx.state.steps.splice(i, 1); draw(); } } }, ic('x'))), h('details', h('summary', { style: { cursor: 'pointer', fontSize: '.82rem', color: 'var(--text-2)' } }, 'Settings'), h('div', { style: { marginTop: '.75rem' } }, opts)));
      box.appendChild(card);
    });
    box.appendChild(h('div', { style: { display: 'flex', gap: '.4rem', flexWrap: 'wrap' } },
      h('button.btn.btn-ghost', { type: 'button', on: { click: () => { ctx.state.steps.push({ tool: 'compress-pdf', values: {} }); draw(); } } }, ic('plus'), 'Add step'),
      h('button.btn.btn-ghost', { type: 'button', on: { click: () => { store.set('workflow', ctx.state.steps); toast('Workflow saved on this device', 'success'); } } }, ic('save'), 'Save workflow')));
  };
  draw();
}

const PRESETS = {
  share: ['Ready to share', [{ tool: 'remove-metadata', values: {} }, { tool: 'compress-pdf', values: { level: 'medium' } }]],
  office: ['Office document', [{ tool: 'page-numbers', values: { format: 'Page {n} of {total}' } }, { tool: 'header-footer', values: { fc: '', hr: '{date}' } }, { tool: 'compress-pdf', values: { level: 'low' } }]],
  secure: ['Confidential', [{ tool: 'watermark', values: { text: 'CONFIDENTIAL' } }, { tool: 'protect-pdf', values: {} }]],
  print: ['Print booklet', [{ tool: 'insert-blank', values: { where: 'odd' } }, { tool: 'booklet-maker', values: {} }]],
};

function qrPng(text, ec = 'M', fg = '#000000') {
  const qrcode = window.qrcode; qrcode.stringToBytes = s => Array.from(new TextEncoder().encode(s));
  const q = qrcode(0, ec); q.addData(text, 'Byte'); q.make(); const n = q.getModuleCount(); const cell = 10, m = 4;
  const c = document.createElement('canvas'); c.width = c.height = (n + 2 * m) * cell; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = fg;
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + m) * cell, (r + m) * cell, cell, cell);
  return { src: c.toDataURL('image/png'), w: c.width, h: c.height };
}
function qrText(v) {
  switch (v.kind) {
    case 'upi': return `upi://pay?pa=${encodeURIComponent(v.upi || '')}&pn=${encodeURIComponent(v.payee || '')}${v.amount ? `&am=${encodeURIComponent(v.amount)}` : ''}&cu=INR`;
    case 'phone': return `tel:${v.text}`; case 'email': return `mailto:${v.text}`;
    case 'wifi': return `WIFI:T:WPA;S:${v.ssid || ''};P:${v.wpass || ''};;`;
    default: return v.text || '';
  }
}

async function wrapLines(doc, text, size, maxW, font = 'Helvetica') {
  const f = await getFont(doc, font); const enc = canEncode(f, text.replace(/\n/g, ''));
  const ctx2 = document.createElement('canvas').getContext('2d'); ctx2.font = `${size}px sans-serif`;
  const w = s => enc ? f.widthOfTextAtSize(s, size) : ctx2.measureText(s).width;
  const out = [];
  for (const para of String(text).split('\n')) { let line = ''; for (const word of para.split(' ')) { const t = line ? line + ' ' + word : word; if (w(t) > maxW && line) { out.push(line); line = word; } else line = t; } out.push(line); }
  return out;
}
async function para(doc, page, text, x, y, maxW, size = 10.5, opts = {}) {
  const lines = await wrapLines(doc, text, size, maxW, opts.font); for (const l of lines) { if (l) await stampText(doc, page, l, { vx: x, vy: y, size, ...opts }); y -= size * (opts.lh || 1.45); } return y;
}

const TEMPLATES = {
  async invoice(doc, v) {
    const P = await PL(); const p = doc.addPage(PAGE_SIZES.A4); const W = 595.28, m = 48; const acc = v.accent || '#4f46e5'; let y = 790;
    p.drawRectangle({ x: 0, y: 812, width: W, height: 30, color: hexRgb(acc) });
    await stampText(doc, p, v.business || 'Your Business', { vx: m, vy: y - 10, size: 20, font: 'HelveticaBold' });
    await stampText(doc, p, 'INVOICE', { vx: W - m - await measure(doc, 'INVOICE', 24, 'HelveticaBold'), vy: y - 10, size: 24, font: 'HelveticaBold', color: acc });
    y = await para(doc, p, [v.address, v.gstin ? `GSTIN: ${v.gstin}` : ''].filter(Boolean).join('\n'), m, y - 30, 260, 9.5, { color: '#4b5563' });
    const meta = [['Invoice no.', v.number || '001'], ['Date', v.date || new Date().toLocaleDateString('en-IN')], ['Due', v.due || '—']];
    let my = 750; for (const [k, val] of meta) { await stampText(doc, p, k, { vx: 380, vy: my, size: 9.5, color: '#6b7280' }); await stampText(doc, p, val, { vx: 460, vy: my, size: 9.5, font: 'HelveticaBold' }); my -= 15; }
    y = Math.min(y, my) - 20;
    await stampText(doc, p, 'BILL TO', { vx: m, vy: y, size: 8.5, font: 'HelveticaBold', color: acc }); y -= 15;
    await stampText(doc, p, v.client || 'Client name', { vx: m, vy: y, size: 11, font: 'HelveticaBold' }); y = await para(doc, p, v.clientAddr || '', m, y - 14, 300, 9.5, { color: '#4b5563' }); y -= 16;
    p.drawRectangle({ x: m, y: y - 6, width: W - 2 * m, height: 22, color: hexRgb('#f3f4f6') });
    const cols = [m + 8, 350, 410, 480]; for (const [t, x] of [['Description', cols[0]], ['Qty', cols[1]], ['Rate', cols[2]], ['Amount', cols[3]]]) await stampText(doc, p, t, { vx: x, vy: y, size: 9, font: 'HelveticaBold' });
    y -= 24; let sub = 0; const cur = v.currency || '₹';
    for (const it of (v.items || []).filter(i => i.desc)) { const amt = (+it.qty || 0) * (+it.rate || 0); sub += amt; await stampText(doc, p, String(it.desc), { vx: cols[0], vy: y, size: 10 }); await stampText(doc, p, String(it.qty || 0), { vx: cols[1], vy: y, size: 10 }); await stampText(doc, p, money(it.rate, cur), { vx: cols[2], vy: y, size: 10 }); await stampText(doc, p, money(amt, cur), { vx: cols[3], vy: y, size: 10 }); y -= 18; p.drawLine({ start: { x: m, y: y + 10 }, end: { x: W - m, y: y + 10 }, thickness: 0.4, color: hexRgb('#e5e7eb') }); }
    const tax = sub * (+v.tax || 0) / 100; y -= 8;
    for (const [k, val, b] of [['Subtotal', sub], [`Tax (${+v.tax || 0}%)`, tax], ['Total', sub + tax, true]]) { await stampText(doc, p, k, { vx: 380, vy: y, size: b ? 12 : 10, font: b ? 'HelveticaBold' : 'Helvetica' }); await stampText(doc, p, money(val, cur), { vx: 480, vy: y, size: b ? 12 : 10, font: b ? 'HelveticaBold' : 'Helvetica', color: b ? acc : '#111111' }); y -= b ? 22 : 16; }
    if (v.notes) { await stampText(doc, p, 'Notes', { vx: m, vy: y - 10, size: 9, font: 'HelveticaBold' }); await para(doc, p, v.notes, m, y - 26, W - 2 * m, 9.5, { color: '#4b5563' }); }
    await stampText(doc, p, 'Thank you for your business!', { vx: m, vy: 40, size: 9, color: '#9ca3af' });
  },
  async certificate(doc, v) {
    const [H, W] = PAGE_SIZES.A4; const p = doc.addPage([W, H]); const acc = v.accent || '#b45309';
    p.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: hexRgb(acc), borderWidth: 6 });
    p.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: hexRgb(acc), borderWidth: 1.2 });
    const center = async (t, y, size, font = 'TimesRoman', color = '#111111') => stampText(doc, p, t, { vx: (W - await measure(doc, t, size, font)) / 2, vy: y, size, font, color });
    await center((v.ctitle || 'Certificate of Achievement').toUpperCase(), H - 130, 30, 'TimesRomanBold', acc);
    await center('This certificate is proudly presented to', H - 185, 14, 'TimesRoman', '#4b5563');
    await center(v.recipient || 'Recipient Name', H - 250, 40, 'TimesRomanBold');
    p.drawLine({ start: { x: W / 2 - 180, y: H - 265 }, end: { x: W / 2 + 180, y: H - 265 }, thickness: 1, color: hexRgb(acc) });
    const lines = await wrapLines(doc, v.reason || 'for outstanding performance', 15, 520, 'TimesRoman'); let y = H - 305; for (const l of lines) { await center(l, y, 15, 'TimesRoman', '#374151'); y -= 22; }
    for (const [x, top, bottom] of [[150, v.cdate || new Date().toLocaleDateString('en-IN'), 'Date'], [W - 150, v.signer || 'Signature', v.signerTitle || 'Director']]) {
      p.drawLine({ start: { x: x - 90, y: 110 }, end: { x: x + 90, y: 110 }, thickness: 0.8, color: hexRgb('#6b7280') });
      await stampText(doc, p, top, { vx: x - (await measure(doc, top, 13, 'TimesRomanBold')) / 2, vy: 118, size: 13, font: 'TimesRomanBold' });
      await stampText(doc, p, bottom, { vx: x - (await measure(doc, bottom, 11)) / 2, vy: 94, size: 11, color: '#6b7280' });
    }
  },
  async resume(doc, v) {
    const p = doc.addPage(PAGE_SIZES.A4); const W = 595.28, m = 50; const acc = v.accent || '#0f766e'; let y = 780;
    await stampText(doc, p, v.rname || 'Your Name', { vx: m, vy: y, size: 26, font: 'HelveticaBold' }); y -= 22;
    if (v.rtitle) { await stampText(doc, p, v.rtitle, { vx: m, vy: y, size: 13, color: acc }); y -= 18; }
    const contact = [v.email, v.phone, v.city].filter(Boolean).join('  ·  '); if (contact) { await stampText(doc, p, contact, { vx: m, vy: y, size: 9.5, color: '#4b5563' }); y -= 14; }
    p.drawLine({ start: { x: m, y: y - 2 }, end: { x: W - m, y: y - 2 }, thickness: 1.5, color: hexRgb(acc) }); y -= 24;
    const sec = async t => { await stampText(doc, p, t.toUpperCase(), { vx: m, vy: y, size: 10, font: 'HelveticaBold', color: acc }); y -= 16; };
    if (v.summary) { await sec('Profile'); y = await para(doc, p, v.summary, m, y, W - 2 * m, 10) - 10; }
    const exp = (v.experience || []).filter(e => e.role); if (exp.length) { await sec('Experience'); for (const e of exp) { await stampText(doc, p, `${e.role}${e.org ? ' — ' + e.org : ''}`, { vx: m, vy: y, size: 11, font: 'HelveticaBold' }); if (e.years) await stampText(doc, p, e.years, { vx: W - m - await measure(doc, e.years, 9.5), vy: y, size: 9.5, color: '#6b7280' }); y -= 14; if (e.what) y = await para(doc, p, e.what, m, y, W - 2 * m, 9.5, { color: '#374151' }); y -= 8; } }
    const edu = (v.education || []).filter(e => e.degree); if (edu.length) { await sec('Education'); for (const e of edu) { await stampText(doc, p, `${e.degree}${e.school ? ' — ' + e.school : ''}`, { vx: m, vy: y, size: 10.5, font: 'HelveticaBold' }); if (e.year) await stampText(doc, p, e.year, { vx: W - m - await measure(doc, e.year, 9.5), vy: y, size: 9.5, color: '#6b7280' }); y -= 18; } y -= 4; }
    if (v.skills) { await sec('Skills'); y = await para(doc, p, v.skills.split(',').map(s => s.trim()).filter(Boolean).join('  •  '), m, y, W - 2 * m, 10); }
  },
  async letter(doc, v) {
    const p = doc.addPage(PAGE_SIZES.A4); const W = 595.28, m = 64; let y = 780;
    y = await para(doc, p, v.from || 'Your name\nYour address', m, y, 300, 10.5) - 14;
    await stampText(doc, p, v.ldate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), { vx: m, vy: y, size: 10.5 }); y -= 26;
    y = await para(doc, p, v.to || 'To,\nRecipient name\nAddress', m, y, 300, 10.5) - 16;
    if (v.subject) { await stampText(doc, p, `Subject: ${v.subject}`, { vx: m, vy: y, size: 11, font: 'HelveticaBold' }); y -= 24; }
    y = await para(doc, p, v.body || 'Dear Sir/Madam,\n\nWrite your letter here.', m, y, W - 2 * m, 11, { lh: 1.55 }) - 20;
    y = await para(doc, p, `${v.closing || 'Yours sincerely,'}\n\n\n${v.signname || 'Your name'}`, m, y, 300, 11);
  },
};
const money = (n, cur) => `${cur}${(+n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default {
  'batch-process': {
    accept: 'pdf', multiple: true, view: 'files', action: 'Process all files', actionIcon: 'boxes', uploadTitle: 'Select PDF files',
    options: ctx => [{ key: 'tool', type: 'select', label: 'Tool to apply to every file', default: 'compress-pdf', options: toolChoices }, { type: 'heading', label: `${toolBySlug[ctx.values.tool || 'compress-pdf'].name} settings` }, ...staticOpts(ctx.values.tool || 'compress-pdf')],
    onOption(ctx, k) { if (k === 'tool') { const t = ctx.values.tool; ctx.values = { tool: t }; ctx.refreshOptions(); } },
    async run(ctx) {
      const files = []; const slug = ctx.values.tool; const steps = [{ tool: slug, values: ctx.values }];
      for (let i = 0; i < ctx.files.length; i++) {
        const f = ctx.files[i]; ctx.progress(i / ctx.files.length, `${f.name} (${i + 1}/${ctx.files.length})`);
        files.push({ name: `${baseName(f.name)}-${slug.replace('-pdf', '')}.pdf`, blob: await runChain(f.bytes, steps, null, f.name) }); await nextFrame();
      }
      return { files, zipName: `batch-${slug}.zip`, message: `${files.length} files processed with ${toolBySlug[slug].name}.` };
    },
  },

  'workflow-builder': {
    accept: 'pdf', multiple: true, view: 'files', action: 'Run workflow', actionIcon: 'workflow',
    init(ctx) { ctx.state.steps ||= store.get('workflow') || JSON.parse(JSON.stringify(PRESETS.share[1])); },
    options: ctx => [
      { type: 'info', html: 'Steps run in order. Several files are merged first, then every step is applied.' },
      { type: 'custom', label: 'Start from a preset', render(box) { box.appendChild(h('div.seg', Object.entries(PRESETS).map(([k, [label, steps]]) => h('button', { type: 'button', on: { click: () => { ctx.state.steps = JSON.parse(JSON.stringify(steps)); ctx.refreshOptions(); } } }, label)))); } },
      { type: 'custom', label: 'Steps', render: box => stepEditor(ctx, box) },
    ],
    validate: ctx => !ctx.state.steps.length ? 'Add at least one step' : null,
    async run(ctx) {
      let bytes = ctx.files[0].bytes;
      if (ctx.files.length > 1) { ctx.progress(0, 'Merging files…'); const { PDFDocument } = await PL(); const out = await PDFDocument.create(); for (const f of ctx.files) { const s = await loadDoc(f.bytes); (await out.copyPages(s, s.getPageIndices())).forEach(p => out.addPage(p)); } bytes = await out.save(); }
      const blob = await runChain(bytes, ctx.state.steps, ctx.progress, ctx.files[0].name);
      return { files: [{ name: outName(ctx, 'workflow'), blob }], message: `Ran ${ctx.state.steps.length} step${ctx.state.steps.length > 1 ? 's' : ''}: ${ctx.state.steps.map(s => toolBySlug[s.tool].name).join(' → ')}.` };
    },
  },

  'attach-files': {
    accept: 'pdf', view: 'none', action: 'Attach files', actionIcon: 'paperclip',
    options: [{ key: 'files', type: 'file', label: 'Files to attach', multiple: true, placeholder: 'Choose any files (Excel, images, ZIP…)' }, { key: 'desc', type: 'text', label: 'Description (optional)' }, { type: 'info', html: 'Attachments open from the paperclip panel in Adobe Reader and most desktop PDF apps.' }],
    validate: ctx => !ctx.values.files?.length ? 'Choose the files to attach' : null,
    async run(ctx) {
      const doc = await loadDoc(ctx.files[0].bytes);
      for (const f of ctx.values.files) await doc.attach(new Uint8Array(await f.arrayBuffer()), f.name, { mimeType: f.type || 'application/octet-stream', description: ctx.values.desc || f.name, creationDate: new Date(f.lastModified || Date.now()), modificationDate: new Date() });
      return { files: [{ name: outName(ctx, 'with-attachments'), blob: await saveDoc(doc) }], message: `${ctx.values.files.length} file${ctx.values.files.length > 1 ? 's' : ''} attached.` };
    },
  },

  'remove-attachments': {
    accept: 'pdf', view: 'none', action: 'Remove attachments', actionIcon: 'paperclip', options: [],
    async run(ctx) { const doc = await loadDoc(ctx.files[0].bytes); const { sanitize } = await import('./security.js'); await sanitize(doc, { files: true }); return { files: [{ name: outName(ctx, 'no-attachments'), blob: await saveDoc(doc) }] }; },
  },

  'manage-layers': {
    accept: 'pdf', view: 'thumbs', action: 'Save layer settings', actionIcon: 'layers',
    async init(ctx) {
      const P = await PL(); const N = n => P.PDFName.of(n); const doc = await loadDoc(ctx.files[0].bytes); const ocp = doc.catalog.lookup(N('OCProperties'));
      ctx.state.layers = [];
      if (ocp instanceof P.PDFDict) {
        const ocgs = ocp.lookup(N('OCGs')); const d = ocp.lookup(N('D')); const off = new Set((d?.lookup(N('OFF'))?.asArray?.() || []).map(r => r.tag));
        (ocgs?.asArray?.() || []).forEach((ref, i) => { const g = doc.context.lookup(ref); const nm = g?.lookup(N('Name')); ctx.state.layers.push({ i, tag: ref.tag, name: nm?.decodeText ? nm.decodeText() : String(nm || `Layer ${i + 1}`) }); ctx.values['L' + i] = !off.has(ref.tag); });
      }
    },
    options: ctx => ctx.state.layers.length ? [{ type: 'info', html: 'Choose which layers are visible when the PDF opens. Most viewers also let readers toggle them.' }, ...ctx.state.layers.map(l => ({ key: 'L' + l.i, type: 'check', label: l.name })), { key: 'lock', type: 'check', label: 'Hide the layers panel (readers can’t switch)' }] : [{ type: 'info', warn: true, html: 'This PDF has no layers (optional content groups).' }],
    validate: ctx => !ctx.state.layers.length ? 'This PDF has no layers' : null,
    async run(ctx) {
      const P = await PL(); const N = n => P.PDFName.of(n); const doc = await loadDoc(ctx.files[0].bytes); const ocp = doc.catalog.lookup(N('OCProperties')); const refs = ocp.lookup(N('OCGs')).asArray();
      let d = ocp.lookup(N('D')); if (!(d instanceof P.PDFDict)) { d = doc.context.obj({}); ocp.set(N('D'), d); }
      const on = refs.filter((r, i) => ctx.values['L' + i]), off = refs.filter((r, i) => !ctx.values['L' + i]);
      d.set(N('ON'), doc.context.obj(on)); d.set(N('OFF'), doc.context.obj(off)); d.set(N('BaseState'), N('ON'));
      if (ctx.values.lock) { d.set(N('Locked'), doc.context.obj(refs)); doc.catalog.set(N('PageMode'), N('UseNone')); }
      return { files: [{ name: outName(ctx, 'layers'), blob: await saveDoc(doc) }], message: `${on.length} visible · ${off.length} hidden.` };
    },
  },

  'add-qr-code': {
    accept: 'pdf', view: 'editor', editorTools: ['qr', 'barcode', 'image'], editorDefault: 'qr', action: 'Save PDF', actionIcon: 'qr-code',
    editorProviders: ctx => ({
      qr: { label: 'QR code', icon: 'qr-code', provide: async () => { await lib('qrcode'); const t = qrText(ctx.values); if (!t || t === 'upi://pay?pa=&pn=&cu=INR') { toast('Fill in the QR content in the options first', 'error'); return null; } return qrPng(t, ctx.values.ec, ctx.values.fg); } },
      barcode: { label: 'Barcode', icon: 'barcode', provide: async () => { const JsBarcode = await lib('jsbarcode'); const c = document.createElement('canvas'); try { JsBarcode(c, ctx.values.code || '123456789', { format: ctx.values.format || 'CODE128', displayValue: true, margin: 10, height: 80 }); } catch (e) { toast(`Invalid value for ${ctx.values.format}`, 'error'); return null; } return { src: c.toDataURL('image/png'), w: c.width, h: c.height }; } },
    }),
    editorHint: t => t === 'qr' || t === 'barcode' ? 'Fill in the content on the right, then tap on the page to place it. Resize with the round handle.' : null,
    options: [
      { type: 'heading', label: 'QR code' },
      { key: 'kind', type: 'select', label: 'QR contains', default: 'url', options: [['url', 'Website link'], ['text', 'Text'], ['upi', 'UPI payment'], ['phone', 'Phone number'], ['email', 'Email'], ['wifi', 'Wi-Fi login']] },
      { key: 'text', type: 'text', label: 'Content', placeholder: 'https://…', show: v => ['url', 'text', 'phone', 'email'].includes(v.kind) },
      { key: 'upi', type: 'text', label: 'UPI ID', placeholder: 'name@bank', show: v => v.kind === 'upi' }, { key: 'payee', type: 'text', label: 'Payee name', show: v => v.kind === 'upi' }, { key: 'amount', type: 'number', label: 'Amount (₹, optional)', show: v => v.kind === 'upi' },
      { key: 'ssid', type: 'text', label: 'Wi-Fi name', show: v => v.kind === 'wifi' }, { key: 'wpass', type: 'text', label: 'Wi-Fi password', show: v => v.kind === 'wifi' },
      { key: 'fg', type: 'color', label: 'Colour', default: '#000000', swatches: ['#000000', '#1e3a8a', '#7c2d12', '#14532d', '#4c1d95'] },
      { key: 'ec', type: 'seg', label: 'Error correction', default: 'M', options: [['L', 'Low'], ['M', 'Medium'], ['H', 'High']] },
      { type: 'heading', label: 'Barcode' },
      { key: 'format', type: 'select', label: 'Barcode type', default: 'CODE128', options: [['CODE128', 'Code 128 (any text)'], ['EAN13', 'EAN-13 (products)'], ['UPC', 'UPC-A'], ['CODE39', 'Code 39'], ['ITF14', 'ITF-14']] },
      { key: 'code', type: 'text', label: 'Barcode value', default: '123456789012' },
    ],
    validate: ctx => !ctx.state.objects?.length ? 'Tap “QR code” or “Barcode”, then tap on the page' : null,
    async run(ctx) { const doc = await loadDoc(ctx.files[0].bytes); await applyObjects(doc, ctx.state.objects); return { files: [{ name: outName(ctx, 'qr'), blob: await saveDoc(doc) }] }; },
  },

  'read-qr-code': {
    accept: 'pdf', view: 'thumbs', action: 'Scan for codes', actionIcon: 'scan-qr-code', options: [{ type: 'info', html: 'Finds QR codes on every page. Barcodes (EAN, Code 128…) are also detected on Chrome / Android.' }],
    async run(ctx) {
      const pdf = await ctx.pdf(); const rows = []; const det = 'BarcodeDetector' in window ? new window.BarcodeDetector() : null; const jsQR = det ? null : await lib('jsqr');
      for (let i = 1; i <= pdf.numPages; i++) {
        ctx.progress(i / pdf.numPages, `Scanning page ${i}`); const c = await renderPage(pdf, i, { dpi: 200 });
        if (det) { try { for (const b of await det.detect(c)) rows.push([i, b.format, b.rawValue]); continue; } catch { } }
        const jq = jsQR || await lib('jsqr'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height); const r = jq(d.data, c.width, c.height); if (r) rows.push([i, 'qr_code', r.data]);
      }
      if (!rows.length) throw new Error('No QR codes or barcodes were found.');
      return { files: [{ name: outName(ctx, 'codes', 'csv'), blob: new Blob(['﻿Page,Type,Value\n' + rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' }) }], message: `${rows.length} code${rows.length > 1 ? 's' : ''} found.`, html: h('div.report-wrap', h('table.report', h('thead', h('tr', h('th', 'Page'), h('th', 'Type'), h('th', 'Value'))), h('tbody', rows.map(r => h('tr', h('td', `${r[0]}`), h('td', esc(r[1])), h('td', /^https?:/.test(r[2]) ? h('a', { href: r[2], target: '_blank', rel: 'noopener noreferrer' }, esc(r[2])) : esc(r[2]))))))) };
    },
  },

  'create-blank-pdf': {
    noFile: true, view: 'custom', viewTitle: 'Preview', action: 'Create PDF', actionIcon: 'file-plus',
    options: [
      { key: 'style', type: 'cards', label: 'Paper', default: 'lined', options: [['blank', 'Blank'], ['lined', 'Lined'], ['grid', 'Grid'], ['dots', 'Dotted'], ['cornell', 'Cornell notes'], ['music', 'Music staff']] },
      { key: 'size', type: 'select', label: 'Page size', default: 'A4', options: Object.keys(PAGE_SIZES).map(k => [k, k]) },
      { key: 'orient', type: 'seg', label: 'Orientation', default: 'portrait', options: [['portrait', 'Portrait'], ['landscape', 'Landscape']] },
      { key: 'pages', type: 'number', label: 'Number of pages', default: 10, min: 1, max: 500 },
      { key: 'spacing', type: 'range', label: 'Line spacing', default: 8, min: 4, max: 15, unit: ' mm', show: v => v.style !== 'blank' },
      { key: 'color', type: 'color', label: 'Line colour', default: '#93c5fd', swatches: ['#93c5fd', '#a5b4fc', '#d1d5db', '#fca5a5', '#86efac', '#000000'], show: v => v.style !== 'blank' },
      { key: 'paper', type: 'color', label: 'Paper colour', default: '#ffffff', swatches: ['#ffffff', '#fffbeb', '#fef9c3', '#f0fdf4', '#f1f5f9'] },
      { key: 'margin', type: 'check', label: 'Red margin line', default: true, show: v => v.style === 'lined' },
    ],
    onOption: ctx => ctx.refreshView(),
    async renderView(body, ctx) {
      const doc = await this.make({ ...ctx.values, pages: 1 }); const pdf = await openPdf(await doc.save());
      const c = await renderPage(pdf, 1, { width: Math.min(560, body.clientWidth - 30) * 2 }); c.style.width = Math.min(560, body.clientWidth - 30) + 'px'; c.style.boxShadow = 'var(--shadow)';
      body.replaceChildren(h('div', { style: { display: 'flex', justifyContent: 'center' } }, c));
    },
    async make(v) {
      const { PDFDocument, rgb } = await PL(); const doc = await PDFDocument.create(); let [W, H] = PAGE_SIZES[v.size || 'A4']; if (v.orient === 'landscape') [W, H] = [H, W];
      const sp = (+v.spacing || 8) * MM; const col = hexRgb(v.color || '#93c5fd');
      for (let i = 0; i < Math.max(1, Math.min(500, +v.pages || 1)); i++) {
        const p = doc.addPage([W, H]); if ((v.paper || '#ffffff').toLowerCase() !== '#ffffff') p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: hexRgb(v.paper) });
        const top = H - 22 * MM;
        if (v.style === 'lined' || v.style === 'cornell') { for (let y = top; y > 15 * MM; y -= sp) p.drawLine({ start: { x: 12 * MM, y }, end: { x: W - 12 * MM, y }, thickness: 0.5, color: col }); if (v.margin || v.style === 'cornell') p.drawLine({ start: { x: (v.style === 'cornell' ? 62 : 28) * MM, y: H }, end: { x: (v.style === 'cornell' ? 62 : 28) * MM, y: v.style === 'cornell' ? 50 * MM : 0 }, thickness: 0.8, color: v.style === 'cornell' ? col : rgb(0.94, 0.45, 0.45) }); if (v.style === 'cornell') p.drawRectangle({ x: 12 * MM, y: 12 * MM, width: W - 24 * MM, height: 38 * MM, color: hexRgb(v.paper || '#ffffff'), borderColor: col, borderWidth: 0.8 }); }
        if (v.style === 'grid') { for (let x = 10 * MM; x < W - 10 * MM + 1; x += sp) p.drawLine({ start: { x, y: 10 * MM }, end: { x, y: H - 10 * MM }, thickness: 0.35, color: col }); for (let y = 10 * MM; y < H - 10 * MM + 1; y += sp) p.drawLine({ start: { x: 10 * MM, y }, end: { x: W - 10 * MM, y }, thickness: 0.35, color: col }); }
        if (v.style === 'dots') for (let x = 10 * MM; x < W - 10 * MM; x += sp) for (let y = 10 * MM; y < H - 10 * MM; y += sp) p.drawCircle({ x, y, size: 0.6, color: col });
        if (v.style === 'music') { let y = top; while (y > 25 * MM) { for (let k = 0; k < 5; k++) p.drawLine({ start: { x: 15 * MM, y: y - k * 2 * MM }, end: { x: W - 15 * MM, y: y - k * 2 * MM }, thickness: 0.6, color: col }); y -= 8 * 2 * MM + sp * 1.5; } }
      }
      return doc;
    },
    async run(ctx) { const doc = await this.make(ctx.values); return { files: [{ name: `${ctx.values.style}-paper-${ctx.values.size}.pdf`, blob: await saveDoc(doc) }] }; },
  },

  'pdf-templates': {
    noFile: true, view: 'custom', viewTitle: 'Preview', action: 'Create PDF', actionIcon: 'layout-template',
    options: [
      { key: 'tpl', type: 'cards', label: 'Template', default: 'invoice', options: [['invoice', 'Invoice / Bill', 'with GST'], ['certificate', 'Certificate'], ['resume', 'Resume / CV'], ['letter', 'Letter']] },
      { key: 'accent', type: 'color', label: 'Accent colour', default: '#4f46e5', swatches: ['#4f46e5', '#0f766e', '#b45309', '#be123c', '#1d4ed8', '#111827'] },
      // invoice
      ...[['business', 'Your business name', 'Sharma Traders'], ['address', 'Your address', ''], ['gstin', 'GSTIN (optional)', ''], ['number', 'Invoice number', 'INV-001'], ['date', 'Invoice date', ''], ['due', 'Due date', ''], ['client', 'Bill to (client)', ''], ['clientAddr', 'Client address', '']].map(([key, label, ph]) => ({ key, type: key.includes('ddr') || key === 'address' ? 'textarea' : 'text', rows: 2, label, placeholder: ph, show: v => v.tpl === 'invoice' })),
      { key: 'items', type: 'list', label: 'Items', addLabel: 'Add item', default: () => [{ desc: 'Item 1', qty: 1, rate: 1000 }], fields: [{ key: 'desc', placeholder: 'Description' }, { key: 'qty', type: 'number', placeholder: 'Qty', width: '64px', default: 1 }, { key: 'rate', type: 'number', placeholder: 'Rate', width: '84px', default: 0 }], show: v => v.tpl === 'invoice' },
      { key: 'currency', type: 'seg', label: 'Currency', default: '₹', options: [['₹', '₹'], ['Rs. ', 'Rs.'], ['$', '$'], ['€', '€']], show: v => v.tpl === 'invoice' },
      { key: 'tax', type: 'number', label: 'GST / Tax %', default: 18, show: v => v.tpl === 'invoice' },
      { key: 'notes', type: 'textarea', rows: 2, label: 'Notes / bank details', show: v => v.tpl === 'invoice' },
      // certificate
      ...[['ctitle', 'Certificate title', 'Certificate of Achievement'], ['recipient', 'Recipient name', ''], ['reason', 'Awarded for', 'for outstanding performance in the Annual Science Fair 2026'], ['cdate', 'Date', ''], ['signer', 'Signed by', ''], ['signerTitle', 'Signer’s title', 'Principal']].map(([key, label, d]) => ({ key, type: 'text', label, default: d, show: v => v.tpl === 'certificate' })),
      // resume
      ...[['rname', 'Full name'], ['rtitle', 'Job title'], ['email', 'Email'], ['phone', 'Phone'], ['city', 'City']].map(([key, label]) => ({ key, type: 'text', label, show: v => v.tpl === 'resume' })),
      { key: 'summary', type: 'textarea', rows: 3, label: 'Profile summary', show: v => v.tpl === 'resume' },
      { key: 'experience', type: 'list', label: 'Experience', addLabel: 'Add job', default: () => [{ role: '', org: '', years: '', what: '' }], fields: [{ key: 'role', placeholder: 'Role' }, { key: 'org', placeholder: 'Company' }, { key: 'years', placeholder: 'Years', width: '80px' }], show: v => v.tpl === 'resume' },
      { key: 'education', type: 'list', label: 'Education', addLabel: 'Add education', default: () => [{ degree: '', school: '', year: '' }], fields: [{ key: 'degree', placeholder: 'Degree' }, { key: 'school', placeholder: 'School / College' }, { key: 'year', placeholder: 'Year', width: '70px' }], show: v => v.tpl === 'resume' },
      { key: 'skills', type: 'text', label: 'Skills (comma separated)', show: v => v.tpl === 'resume' },
      // letter
      { key: 'from', type: 'textarea', rows: 2, label: 'From (your name & address)', show: v => v.tpl === 'letter' }, { key: 'to', type: 'textarea', rows: 3, label: 'To', show: v => v.tpl === 'letter' },
      { key: 'ldate', type: 'text', label: 'Date', show: v => v.tpl === 'letter' }, { key: 'subject', type: 'text', label: 'Subject', show: v => v.tpl === 'letter' },
      { key: 'body', type: 'textarea', rows: 8, label: 'Letter', show: v => v.tpl === 'letter' }, { key: 'closing', type: 'text', label: 'Closing', default: 'Yours sincerely,', show: v => v.tpl === 'letter' }, { key: 'signname', type: 'text', label: 'Your name', show: v => v.tpl === 'letter' },
    ],
    onOption(ctx, k) { clearTimeout(ctx.state.t); ctx.state.t = setTimeout(() => ctx.refreshView(), k === 'tpl' ? 0 : 600); if (k === 'tpl') { ctx.values.accent = { invoice: '#4f46e5', certificate: '#b45309', resume: '#0f766e', letter: '#111827' }[ctx.values.tpl]; ctx.refreshOptions(); } },
    async renderView(body, ctx) {
      const { PDFDocument } = await PL(); const doc = await PDFDocument.create(); await TEMPLATES[ctx.values.tpl || 'invoice'](doc, ctx.values);
      const pdf = await openPdf(await doc.save()); const w = Math.min(620, body.clientWidth - 30); const c = await renderPage(pdf, 1, { width: w * 2 }); c.style.width = w + 'px'; c.style.boxShadow = 'var(--shadow)';
      body.replaceChildren(h('div', { style: { display: 'flex', justifyContent: 'center' } }, c));
    },
    async run(ctx) { const { PDFDocument } = await PL(); const doc = await PDFDocument.create(); doc.setTitle(ctx.values.tpl); await TEMPLATES[ctx.values.tpl](doc, ctx.values); return { files: [{ name: `${ctx.values.tpl}${ctx.values.number ? '-' + ctx.values.number : ''}.pdf`, blob: await saveDoc(doc) }] }; },
  },
};
