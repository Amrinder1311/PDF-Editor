// ─────────────────────────────────────────────────────────────
//  Tool page engine: upload → preview/edit → options → process → result
//  Every tool on the site uses this one template.
// ─────────────────────────────────────────────────────────────
import { h, ic, esc, toast, fmtBytes, download, baseName, nextFrame, store } from './ui.js';
import { prepareFile, openPdf, renderPage } from './pdf.js';
import { renderOptions, initValues } from './options.js';
import { PageEditor } from './editor.js';
import { lib } from './lib.js';
import { CONFIG } from '../config.js';
import { catById, nextTools, toolBySlug } from '../data/tools.js';

const ACCEPT = {
  pdf: '.pdf,application/pdf',
  image: 'image/*,.heic,.heif,.tif,.tiff,.avif',
  pdfimage: '.pdf,application/pdf,image/*,.heic,.heif',
};
const isMobile = () => matchMedia('(max-width: 960px)').matches;

export async function renderToolPage(root, tool, impl, handoff = []) {
  const cat = catById[tool.category];
  const server = tool.status === 'server';
  const page = h('div.tool-page', { style: { '--cat-color': cat.color } });
  const container = h('div.container');
  page.appendChild(container);
  root.innerHTML = ''; root.appendChild(page);
  document.title = `${tool.name} — Free Online | ${CONFIG.SITE_NAME}`;
  setMeta(`${tool.name}: ${tool.description} Free, no sign-up${server ? '' : ', files stay on your device'}.`);
  rememberRecent(tool.slug);

  container.append(
    h('nav.breadcrumb', { 'aria-label': 'Breadcrumb' }, h('a', { href: '#/' }, 'Home'), ic('chevron-right'), h('a', { href: `#/category/${cat.id}` }, esc(cat.label)), ic('chevron-right'), h('span', { text: tool.name })),
    h('header.tp-head', h('div.tp-icon', ic(tool.icon)), h('div',
      h('h1', { text: tool.name }), h('p', { text: tool.description }),
      h('div.tp-badges', server
        ? [h('span.pill.amber', ic('server'), 'Runs on server'), h('span.pill', ic('clock'), 'Launching soon')]
        : [h('span.pill.green', ic('shield-check'), 'Files never leave your device'), h('span.pill', ic('badge-indian-rupee'), 'Free'), h('span.pill', ic('user-x'), 'No sign-up')]))),
  );

  if (server && !CONFIG.API_BASE) container.appendChild(serverBanner(tool));

  const stageBox = h('div');
  container.appendChild(stageBox);
  container.appendChild(seoSection(tool, impl));

  const ctx = {
    tool, impl, files: [], values: {}, sel: new Set(), rot: {}, order: [], state: {}, root: stageBox,
    async pdf(i = 0) { const f = ctx.files.filter(f => f.isPdf)[i]; if (!f) return null; return (f.pdf ||= await openPdf(f.bytes)); },
    progress: () => {},
    refreshOptions: () => {}, refreshView: () => {},
  };

  const accept = ACCEPT[impl.accept] || impl.accept || ACCEPT.pdf;

  // ── Upload stage ──
  function showUpload() {
    document.body.classList.remove('has-bar');
    stageBox.innerHTML = '';
    if (impl.noFile) return showWorkspace();
    const input = h('input', { type: 'file', accept, multiple: !!impl.multiple, 'aria-label': 'Choose files', on: { change: e => addFiles([...e.target.files]) } });
    const kind = impl.accept === 'image' ? 'images' : impl.accept === 'pdf' || !impl.accept ? (impl.multiple ? 'PDF files' : 'PDF file') : 'files';
    const area = h('div.upload-area', { tabindex: 0, role: 'button', 'aria-label': `Choose ${kind}` },
      h('div.upload-icon', ic(impl.uploadIcon || 'upload')),
      h('h3', { text: impl.uploadTitle || `Select ${kind}` }),
      h('p', { text: impl.uploadHint || (isMobile() ? 'Tap to choose from your phone' : 'or drag and drop here') }),
      h('span.btn.btn-primary.btn-lg', ic('folder-open'), `Choose ${kind}`),
      input,
      h('p.upload-privacy', ic('lock'), server ? 'Processed securely on our server and deleted after 1 hour.' : 'Processed in your browser — nothing is uploaded.'),
    );
    if (impl.camera) {
      const cam = h('input', { type: 'file', accept: 'image/*', capture: 'environment', multiple: true, style: { display: 'none' }, on: { change: e => addFiles([...e.target.files]) } });
      stageBox.append(area, h('div.upload-sub', cam, h('button.btn.btn-outline', { type: 'button', on: { click: () => cam.click() } }, ic('camera'), 'Use camera')));
    } else stageBox.append(area);
    area.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    dragDrop(area, files => addFiles(files));
  }

  async function addFiles(list) {
    if (!list.length) return;
    if (!impl.multiple && ctx.files.length) ctx.files = [];
    const busy = showBusy('Opening files…');
    try {
      for (const f of (impl.multiple ? list : list.slice(0, 1))) {
        if (isMobile() && f.size > CONFIG.MOBILE_WARN_MB * 1048576) toast(`${f.name} is large (${fmtBytes(f.size)}). Processing on a phone may be slow.`, 'info');
        if (impl.accept === 'pdf' || !impl.accept) {
          if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { toast(`${f.name} is not a PDF file`, 'error'); continue; }
        }
        if (impl.accept === 'image' && !(/^image\//.test(f.type) || /\.(heic|heif|tiff?|avif)$/i.test(f.name))) { toast(`${f.name} is not an image`, 'error'); continue; }
        busy.label(`Opening ${f.name}…`);
        const entry = (impl.accept === 'pdf' || !impl.accept || (impl.accept === 'pdfimage' && /pdf$/i.test(f.type || f.name)))
          ? await prepareFile(f) : { file: f, name: f.name, size: f.size, bytes: null, isPdf: false };
        if (entry.encrypted) toast(`Unlocked ${f.name}`, 'success');
        ctx.files.push(entry);
      }
    } catch (e) { console.error(e); toast(e.message || String(e), 'error'); }
    busy.close();
    if (!ctx.files.length) return;
    if (impl.min && ctx.files.length < impl.min && !ctx.workspace) toast(impl.minMsg || `Add at least ${impl.min} files`, 'info');
    showWorkspace();
  }
  ctx.addFiles = addFiles;

  // ── Workspace ──
  let optsEl, mainBody, mainTitle;
  async function showWorkspace() {
    ctx.workspace = true;
    stageBox.innerHTML = '';
    const busy = showBusy('Preparing…');
    try {
      ctx.sel = new Set(); ctx.rot = {}; ctx.state = ctx.state || {};
      const pdf = await ctx.pdf(0);
      ctx.order = pdf ? [...Array(pdf.numPages).keys()] : [];
      if (impl.init) await impl.init(ctx);
    } catch (e) { busy.close(); console.error(e); toast(e.message, 'error'); ctx.files = []; ctx.workspace = false; return showUpload(); }
    busy.close();

    const actionLabel = server && !CONFIG.API_BASE ? 'Launching soon' : (impl.action || tool.name);
    const runBtn = () => h('button.btn.btn-primary.btn-lg', { type: 'button', disabled: server && !CONFIG.API_BASE, on: { click: run } }, ic(impl.actionIcon || 'arrow-right'), actionLabel);
    mainTitle = h('div.title');
    const bar = h('div.ws-bar', mainTitle);
    mainBody = h('div.ws-body');
    const main = h('section.ws-main', { 'aria-label': 'Preview' }, bar, mainBody);
    optsEl = h('div.panel-body');
    const side = h('aside.ws-side', h('div.panel', h('div.panel-head', ic('sliders-horizontal'), 'Options'), optsEl, h('div.panel-actions', h('div', { class: 'main-action-wrap' }, runBtn()), !impl.noFile && h('button.btn.btn-ghost', { type: 'button', on: { click: reset } }, ic('rotate-ccw'), 'Start over'))));
    side.querySelector('.panel-actions .btn-primary').classList.add('main-action');
    const ws = h('div.workspace', main, side);
    const actionBar = h('div.action-bar', !impl.noFile && h('button.btn.btn-ghost', { type: 'button', 'aria-label': 'Start over', on: { click: reset } }, ic('rotate-ccw')), runBtn());
    stageBox.append(ws, actionBar);
    document.body.classList.add('has-bar');

    ctx.refreshOptions = () => {
      const schema = typeof impl.options === 'function' ? impl.options(ctx) : (impl.options || []);
      initValues(schema, ctx.values);
      optsEl.innerHTML = '';
      if (!schema.length) optsEl.appendChild(h('div.option-info', { html: impl.noOptionsText || 'No settings needed — just press the button.' }));
      else optsEl.appendChild(renderOptions(schema, ctx.values, (k, v) => { impl.onOption?.(ctx, k, v); }));
    };
    ctx.refreshView = () => renderView(ctx, mainBody, mainTitle, bar, addFiles, accept);
    ctx.refreshOptions();
    await ctx.refreshView();
  }

  async function run() {
    if (impl.min && ctx.files.length < impl.min) return toast(impl.minMsg || `Please add at least ${impl.min} files`, 'error');
    if (impl.validate) { const err = impl.validate(ctx); if (err) return toast(err, 'error'); }
    const busy = showBusy(impl.busyText || 'Working on it…');
    ctx.progress = (f, label) => busy.progress(f, label);
    await nextFrame();
    try {
      const res = server ? await serverRun(ctx) : await impl.run(ctx);
      busy.close();
      if (res) showResult(res);
    } catch (e) {
      busy.close(); console.error(e);
      toast(friendlyError(e), 'error');
    }
  }

  function showResult(res) {
    document.body.classList.remove('has-bar');
    const files = res.files || [];
    const wrap = h('section.result', { 'aria-live': 'polite' });
    wrap.append(h('div.result-icon', ic(res.icon || 'circle-check')), h('h2', { text: res.title || 'Done!' }), h('p', { text: res.message || (files.length ? `Your file${files.length > 1 ? 's are' : ' is'} ready.` : '') }));
    if (res.stats) {
      const { before, after } = res.stats; const pct = Math.round((1 - after / before) * 100);
      wrap.appendChild(h('div.savings', h('div', h('b', fmtBytes(before)), h('small', 'Before')), h('div', h('b', fmtBytes(after)), h('small', 'After')), h('div', h('b', pct > 0 ? `−${pct}%` : '0%'), h('small', 'Saved'))));
    }
    const actions = h('div.result-actions');
    if (files.length === 1) actions.appendChild(h('button.btn.btn-green.btn-xl', { type: 'button', on: { click: () => download(files[0].blob, files[0].name) } }, ic('download'), 'Download'));
    if (files.length > 1) {
      actions.appendChild(h('button.btn.btn-green.btn-xl', { type: 'button', on: { click: async () => { const b = showBusy('Creating ZIP…'); try { const zip = await zipFiles(files); download(zip, res.zipName || `${baseName(ctx.files[0]?.name || tool.slug)}-${tool.slug}.zip`); } finally { b.close(); } } } }, ic('download'), `Download all (${files.length}) as ZIP`));
      const list = h('div.result-files');
      files.slice(0, 200).forEach(f => list.appendChild(h('div.result-file', ic(/pdf$/i.test(f.name) ? 'file-text' : 'file'), h('span.nm', { text: f.name }), h('span.sz', { text: fmtBytes(f.blob.size) }), h('button.mini-btn.icon-only', { type: 'button', 'aria-label': `Download ${f.name}`, on: { click: () => download(f.blob, f.name) } }, ic('download')))));
      wrap.appendChild(list);
    }
    if (!impl.noFile) actions.appendChild(h('button.btn.btn-ghost.btn-lg', { type: 'button', on: { click: () => { showWorkspace(); } } }, ic('arrow-left'), 'Back'));
    actions.appendChild(h('button.btn.btn-ghost.btn-lg', { type: 'button', on: { click: reset } }, ic('rotate-ccw'), impl.noFile ? 'Start over' : 'New file'));
    wrap.appendChild(actions);
    if (res.html) wrap.appendChild(h('div.result-extra', res.html));
    const pdfOut = files.filter(f => /\.pdf$/i.test(f.name));
    if (pdfOut.length) {
      wrap.appendChild(h('div.suggestions', h('h4', 'Continue with this file'), h('div.suggestions-row', nextTools(tool.slug).map(t => h('a.suggestion-chip', { href: `#/${t.slug}`, on: { click: () => { window.__handoff = pdfOut.slice(0, 1).map(f => new File([f.blob], f.name, { type: 'application/pdf' })); } } }, ic(t.icon), t.name)))));
    }
    stageBox.innerHTML = ''; stageBox.appendChild(wrap);
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    res.onShow?.(wrap);
  }

  function reset() {
    ctx.editor?.destroy?.();
    ctx.files.forEach(f => f.pdf?.destroy?.());
    Object.assign(ctx, { files: [], values: {}, state: {}, sel: new Set(), rot: {}, order: [], workspace: false, editor: null });
    showUpload();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ctx.reset = reset;
  if (handoff.length) addFiles(handoff); else showUpload();
  return () => { document.body.classList.remove('has-bar'); ctx.editor?.destroy?.(); };
}

// ── Main preview area ─────────────────────────────────────────
async function renderView(ctx, body, title, bar, addFiles, accept) {
  const { impl } = ctx;
  body.innerHTML = ''; bar.querySelectorAll('.extra').forEach(e => e.remove());
  const view = impl.view || (ctx.files[0]?.isPdf ? 'thumbs' : 'files');
  const f0 = ctx.files[0];
  title.textContent = impl.noFile ? (impl.viewTitle || 'Preview') : ctx.files.length > 1 ? `${ctx.files.length} files` : `${f0?.name || ''}${f0?.pageCount ? ` · ${f0.pageCount} page${f0.pageCount > 1 ? 's' : ''}` : ''} · ${fmtBytes(f0?.size)}`;

  if (view === 'custom') return impl.renderView(body, ctx, bar);
  if (view === 'editor') {
    ctx.editor?.destroy?.();
    const pdf = await ctx.pdf(0);
    const ed = new PageEditor({ pdf, tools: impl.editorTools || ['text'], defaultTool: impl.editorDefault || 'select', providers: impl.editorProviders?.(ctx) || {}, objects: ctx.state.objects || (ctx.state.objects = []), hint: impl.editorHint, onChange: () => impl.onEditorChange?.(ctx) });
    ctx.editor = ed;
    body.style.padding = '0'; body.style.maxHeight = 'none';
    body.appendChild(ed.el);
    await ed.renderPage();
    impl.afterEditor?.(ctx);
    return;
  }
  body.style.padding = ''; body.style.maxHeight = '';
  if (view === 'files') return renderFileList(ctx, body, addFiles, accept);
  if (view === 'none') { body.appendChild(h('div.option-info', { html: `${ic('file-check')} <b>${esc(f0.name)}</b> loaded (${fmtBytes(f0.size)}${f0.pageCount ? `, ${f0.pageCount} pages` : ''}).` })); return; }

  // thumbnails: thumbs | select | rotate | reorder
  const pdf = await ctx.pdf(0);
  const n = pdf.numPages;
  if (view === 'select') {
    const st = impl.selectStyle === 'delete' ? 'marked-del' : 'selected';
    const tools = h('div.sel-tools.extra');
    const setAll = fn => { ctx.sel = new Set([...Array(n).keys()].filter(fn)); grid.querySelectorAll('.thumb').forEach(t => t.classList.toggle(st, ctx.sel.has(+t.dataset.i))); impl.onSelect?.(ctx); };
    tools.append(h('button.mini-btn', { type: 'button', on: { click: () => setAll(() => true) } }, 'All'), h('button.mini-btn', { type: 'button', on: { click: () => setAll(() => false) } }, 'None'), h('button.mini-btn', { type: 'button', on: { click: () => setAll(i => i % 2 === 0) } }, 'Odd'), h('button.mini-btn', { type: 'button', on: { click: () => setAll(i => i % 2 === 1) } }, 'Even'));
    bar.appendChild(tools);
  }
  if (view === 'rotate') {
    bar.appendChild(h('div.sel-tools.extra', h('button.mini-btn', { type: 'button', on: { click: () => { for (let i = 0; i < n; i++) ctx.rot[i] = ((ctx.rot[i] || 0) + 270) % 360; applyRot(); } } }, ic('rotate-ccw'), 'All left'), h('button.mini-btn', { type: 'button', on: { click: () => { for (let i = 0; i < n; i++) ctx.rot[i] = ((ctx.rot[i] || 0) + 90) % 360; applyRot(); } } }, ic('rotate-cw'), 'All right')));
  }
  const grid = h('div.thumbs');
  body.appendChild(grid);
  const applyRot = () => grid.querySelectorAll('.thumb').forEach(t => { const r = ctx.rot[+t.dataset.i] || 0; const c = t.querySelector('canvas'); if (c) c.style.transform = `rotate(${r}deg) scale(${r % 180 ? 0.75 : 1})`; });
  const order = view === 'reorder' ? ctx.order : [...Array(n).keys()];
  const flags = impl.thumbFlag ? await impl.thumbFlag(ctx) : null;
  for (const i of order) {
    const t = h('div.thumb', { 'data-i': i, class: view === 'select' ? 'clickable' : view === 'reorder' ? 'drag' : '' });
    const imgBox = h('div.thumb-img');
    t.append(imgBox, h('span.thumb-label', { text: `${i + 1}` }));
    if (flags?.[i]) t.appendChild(h('span.flag', { text: flags[i] }));
    if (view === 'select') {
      t.prepend(h('span.check', ic(impl.selectStyle === 'delete' ? 'x' : 'check')));
      if (ctx.sel.has(i)) t.classList.add(impl.selectStyle === 'delete' ? 'marked-del' : 'selected');
      t.setAttribute('role', 'checkbox'); t.tabIndex = 0;
      const toggle = () => { ctx.sel.has(i) ? ctx.sel.delete(i) : ctx.sel.add(i); t.classList.toggle(impl.selectStyle === 'delete' ? 'marked-del' : 'selected', ctx.sel.has(i)); t.setAttribute('aria-checked', String(ctx.sel.has(i))); impl.onSelect?.(ctx); };
      t.addEventListener('click', toggle); t.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
    }
    if (view === 'rotate') {
      t.appendChild(h('div.thumb-tools',
        h('button', { type: 'button', 'aria-label': `Rotate page ${i + 1} left`, on: { click: () => { ctx.rot[i] = ((ctx.rot[i] || 0) + 270) % 360; applyRot(); } } }, ic('rotate-ccw')),
        h('button', { type: 'button', 'aria-label': `Rotate page ${i + 1} right`, on: { click: () => { ctx.rot[i] = ((ctx.rot[i] || 0) + 90) % 360; applyRot(); } } }, ic('rotate-cw'))));
    }
    if (view === 'reorder') t.appendChild(h('div.thumb-tools', h('button', { type: 'button', 'aria-label': `Remove page ${i + 1}`, on: { click: e => { e.stopPropagation(); ctx.order.splice(ctx.order.indexOf(i), 1); t.remove(); } } }, ic('trash-2'))));
    grid.appendChild(t);
    lazyThumb(imgBox, () => renderPage(pdf, i + 1, { width: 150 * Math.min(2, devicePixelRatio || 1) }), applyRot);
  }
  if (view === 'reorder') {
    const Sortable = await lib('sortable');
    Sortable.create(grid, { animation: 160, delay: 120, delayOnTouchOnly: true, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen', onEnd: () => { ctx.order = [...grid.children].map(c => +c.dataset.i); grid.querySelectorAll('.thumb').forEach((c, k) => (c.querySelector('.thumb-label').textContent = `${+c.dataset.i + 1} → ${k + 1}`)); } });
    bar.appendChild(h('div.sel-tools.extra', h('button.mini-btn', { type: 'button', on: { click: () => { ctx.order = [...Array(n).keys()]; ctx.refreshView(); } } }, ic('rotate-ccw'), 'Reset'), h('button.mini-btn', { type: 'button', on: { click: () => { ctx.order.reverse(); ctx.refreshView(); } } }, ic('arrow-down-up'), 'Reverse')));
  }
}

const thumbObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { thumbObserver.unobserve(e.target); e.target._load?.(); }
}, { rootMargin: '300px' }) : null;
let thumbQueue = Promise.resolve();
function lazyThumb(box, make, after) {
  box.innerHTML = '<div class="spinner" style="width:22px;height:22px;border-width:3px;margin:0"></div>';
  box._load = () => { thumbQueue = thumbQueue.then(async () => { try { const c = await make(); box.innerHTML = ''; box.appendChild(c); after?.(); } catch { box.innerHTML = ic('file-x'); } }); };
  if (thumbObserver) thumbObserver.observe(box); else box._load();
}

async function renderFileList(ctx, body, addFiles, accept) {
  const list = h('div.file-list');
  body.appendChild(list);
  const draw = () => {
    list.innerHTML = '';
    ctx.files.forEach((f, idx) => {
      const imgBox = h('div.thumb-img');
      const item = h('div.file-item', { 'data-i': idx },
        h('span.num', { text: idx + 1 }),
        h('button.rm', { type: 'button', 'aria-label': `Remove ${f.name}`, on: { click: e => { e.stopPropagation(); ctx.files.splice(idx, 1); if (!ctx.files.length) return ctx.reset(); draw(); ctx.impl.onFilesChange?.(ctx); } } }, ic('x')),
        imgBox, h('span.name', { text: f.name }), h('span.meta', { text: `${fmtBytes(f.size)}${f.pageCount ? ` · ${f.pageCount} pages` : ''}` }));
      list.appendChild(item);
      lazyThumb(imgBox, async () => {
        if (f.isPdf) { f.pdf ||= await openPdf(f.bytes); return renderPage(f.pdf, 1, { width: 180 }); }
        if (/^image\/(jpeg|png|gif|webp|bmp|svg|avif)/.test(f.file.type)) { const img = h('img', { alt: '', src: (f.url ||= URL.createObjectURL(f.file)) }); return img; }
        return h('div', { html: ic('file', ''), style: { fontSize: '2.2rem', color: 'var(--text-3)' } });
      });
    });
    if (ctx.impl.multiple) list.appendChild(h('label.add-tile', ic('plus'), 'Add more', h('input', { type: 'file', multiple: true, accept, 'aria-label': 'Add more files', on: { change: e => addFiles([...e.target.files]) } })));
  };
  draw();
  if (ctx.files.length > 1) {
    const Sortable = await lib('sortable');
    Sortable.create(list, { animation: 160, delay: 120, delayOnTouchOnly: true, filter: '.add-tile,.rm', preventOnFilter: false, draggable: '.file-item', ghostClass: 'sortable-ghost', onEnd: () => { const order = [...list.querySelectorAll('.file-item')].map(c => +c.dataset.i); ctx.files = order.map(i => ctx.files[i]); draw(); ctx.impl.onFilesChange?.(ctx); } });
  }
  dragDrop(body, files => addFiles(files));
}

// ── Helpers ───────────────────────────────────────────────────
export function dragDrop(el, onFiles) {
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('drag-over'); const files = [...(e.dataTransfer?.files || [])]; if (files.length) onFiles(files); });
}

export function showBusy(text) {
  const label = h('div.progress-label', { text: '' });
  const fill = h('div.progress-bar-fill');
  const track = h('div.progress-bar-track', { hidden: true }, fill);
  const title = h('h4', { text });
  const el = h('div.busy', { role: 'alertdialog', 'aria-live': 'assertive', 'aria-label': text }, h('div.busy-card', h('div.spinner'), title, track, label));
  const timer = setTimeout(() => document.body.appendChild(el), 120);
  return {
    label: t => { title.textContent = t; },
    progress(f, l) { track.hidden = false; fill.style.width = `${Math.round(Math.min(1, Math.max(0, f)) * 100)}%`; if (l) label.textContent = l; if (!el.isConnected) document.body.appendChild(el); },
    close() { clearTimeout(timer); el.remove(); },
  };
}

export async function zipFiles(files) {
  const JSZip = await lib('jszip');
  const zip = new JSZip(); const seen = {};
  for (const f of files) { let n = f.name; if (seen[n]) { n = n.replace(/(\.[^.]+)?$/, `-${seen[n]}$1`); } seen[f.name] = (seen[f.name] || 1) + 1; zip.file(n, f.blob); }
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

function friendlyError(e) {
  const m = e?.message || String(e);
  if (/password/i.test(m)) return 'This PDF is password protected. Use Unlock PDF first, or enter the right password.';
  if (/Invalid PDF|No PDF header|Failed to parse/i.test(m)) return 'This PDF seems damaged. Try “Repair PDF” first.';
  if (/memory|allocation/i.test(m)) return 'This file is too large for your device’s memory. Try fewer pages or a lower quality setting.';
  return m;
}

function rememberRecent(slug) { const r = store.get('recent-tools', []).filter(s => s !== slug); r.unshift(slug); store.set('recent-tools', r.slice(0, 8)); }
function setMeta(desc) { let m = document.querySelector('meta[name=description]'); if (!m) { m = h('meta', { name: 'description' }); document.head.appendChild(m); } m.content = desc; }

function serverBanner(tool) {
  const input = h('input.option-input', { type: 'email', placeholder: 'your@email.com', autocomplete: 'email', 'aria-label': 'Email for launch notification' });
  return h('div.server-banner', ic('server-cog'), h('div',
    h('b', `${tool.name} is launching soon`),
    h('p', 'This tool needs our secure server for top-quality results. You can explore the options now — leave your email and we’ll tell you the moment it goes live.'),
    h('div.notify-row', input, h('button.btn.btn-primary', { type: 'button', on: { click: () => {
      if (!/^\S+@\S+\.\S+$/.test(input.value)) return toast('Please enter a valid email', 'error');
      const list = store.get('notify-list', []); list.push({ email: input.value, tool: tool.slug, at: Date.now() }); store.set('notify-list', list);
      input.value = ''; toast('Thanks! We’ll let you know.', 'success');
    } } }, 'Notify me'))));
}

// Generic server call — every server tool POSTs files + options to API_BASE/api/tools/<slug>
async function serverRun(ctx) {
  if (!CONFIG.API_BASE) throw new Error('This tool is launching soon.');
  const fd = new FormData();
  ctx.files.forEach(f => fd.append('files', f.file, f.name));
  fd.append('options', JSON.stringify(Object.fromEntries(Object.entries(ctx.values).filter(([, v]) => !(v instanceof Blob)))));
  ctx.progress(0.1, 'Uploading…');
  const res = await fetch(`${CONFIG.API_BASE}/api/tools/${ctx.tool.slug}`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `Server error (${res.status})`);
  ctx.progress(0.9, 'Downloading result…');
  const type = res.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    const data = await res.json();
    return { title: 'Done!', message: data.message || '', html: data.html ? h('div', { html: data.html }) : data.text ? h('pre.out-text', { text: data.text }) : null, files: [] };
  }
  const disp = res.headers.get('content-disposition') || '';
  const name = (disp.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i)?.[1]) || `${baseName(ctx.files[0]?.name || 'result')}-${ctx.tool.slug}`;
  return { files: [{ name: decodeURIComponent(name), blob: await res.blob() }] };
}

function seoSection(tool, impl) {
  const cat = catById[tool.category];
  const server = tool.status === 'server';
  const related = (toolBySlug && Object.values(toolBySlug)).filter(t => t.category === tool.category && t.slug !== tool.slug).slice(0, 8);
  const steps = impl.howTo || [
    impl.noFile ? 'Choose your settings on the right.' : `Choose your ${impl.accept === 'image' ? 'images' : impl.accept && impl.accept !== 'pdf' ? 'file' : 'PDF'} — tap the button or drag it in.`,
    'Adjust the options to get exactly what you need.',
    `Press “${impl.action || tool.name}” and download your result.`,
  ];
  return h('section.seo-section', h('div.seo-wrap',
    h('h2', `How to use ${tool.name}`),
    h('ol.seo-steps', steps.map(s => h('li', { text: s }))),
    h('h2', `About ${tool.name}`),
    h('p', { text: `${tool.description} ${impl.about || ''}` }),
    h('ul',
      h('li', { text: server ? 'Files are sent over an encrypted connection and deleted automatically after processing.' : 'Private by design: your files are processed inside your browser and never uploaded to any server.' }),
      h('li', { text: 'Works on Android, iPhone, Windows, Mac and Linux — no app or sign-up needed.' }),
      h('li', { text: 'Free to use with no watermarks added to your files.' })),
    related.length ? h('h3', `More ${cat.label} tools`) : '',
    related.length ? h('div.related', related.map(t => h('a.suggestion-chip', { href: `#/${t.slug}` }, ic(t.icon), t.name))) : ''));
}
