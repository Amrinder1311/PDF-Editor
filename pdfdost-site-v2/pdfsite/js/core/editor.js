// ─────────────────────────────────────────────────────────────
//  PageEditor — touch-friendly editor used by Edit, Sign, Redact,
//  Links, Forms, Stamps, Crop, QR… Objects are stored in page
//  fractions (0–1, top-left origin of the page as it is displayed).
// ─────────────────────────────────────────────────────────────
import { h, ic, esc, modal, toast, store } from './ui.js';
import { renderPage, PL, hexRgb, getFont, canEncode, textPng, visualToUser, visualSize, CSS_FONT } from './pdf.js';

let uid = 0;
const today = () => new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

export const TOOLDEFS = {
  select: { label: 'Select', icon: 'mouse-pointer-2' },
  text: { label: 'Text', icon: 'type', mode: 'click', make: () => ({ type: 'text', text: 'Type here', size: 16, color: '#111111', font: 'Helvetica' }) },
  image: { label: 'Image', icon: 'image-plus', mode: 'image' },
  signature: { label: 'Signature', icon: 'signature', mode: 'signature' },
  initials: { label: 'Initials', icon: 'pen-line', mode: 'signature', initials: true },
  date: { label: 'Date', icon: 'calendar', mode: 'click', make: () => ({ type: 'text', text: today(), size: 12, color: '#111111', font: 'Helvetica' }) },
  rect: { label: 'Box', icon: 'square', mode: 'box', make: () => ({ type: 'rect', stroke: '#e11d48', fill: '', width: 2 }) },
  ellipse: { label: 'Circle', icon: 'circle', mode: 'box', make: () => ({ type: 'ellipse', stroke: '#2563eb', fill: '', width: 2 }) },
  line: { label: 'Line', icon: 'minus', mode: 'line', make: () => ({ type: 'line', stroke: '#111111', width: 2 }) },
  arrow: { label: 'Arrow', icon: 'move-up-right', mode: 'line', make: () => ({ type: 'arrow', stroke: '#e11d48', width: 2.5 }) },
  highlight: { label: 'Highlight', icon: 'highlighter', mode: 'box', make: () => ({ type: 'highlight', color: '#fde047', opacity: 0.45 }) },
  draw: { label: 'Draw', icon: 'brush', mode: 'draw', make: () => ({ type: 'draw', stroke: '#1d4ed8', width: 2.5 }) },
  whiteout: { label: 'Whiteout', icon: 'eraser', mode: 'box', make: () => ({ type: 'whiteout' }) },
  redact: { label: 'Redact', icon: 'square', mode: 'box', make: () => ({ type: 'redact' }) },
  link: { label: 'Link', icon: 'link', mode: 'box', make: () => ({ type: 'link', url: 'https://', target: 'url', page: 1 }) },
  note: { label: 'Note', icon: 'sticky-note', mode: 'click', make: () => ({ type: 'note', text: 'Comment', w: 0.045, hRatio: 1 }) },
  'field-text': { label: 'Text field', icon: 'text-cursor-input', mode: 'box', make: () => ({ type: 'field', kind: 'text', name: '' }) },
  'field-check': { label: 'Checkbox', icon: 'square-check', mode: 'click', make: () => ({ type: 'field', kind: 'check', name: '', w: 0.035, hRatio: 1 }) },
  'field-select': { label: 'Dropdown', icon: 'list', mode: 'box', make: () => ({ type: 'field', kind: 'select', name: '', options: 'Option 1, Option 2, Option 3' }) },
  'field-sign': { label: 'Sign field', icon: 'signature', mode: 'box', make: () => ({ type: 'field', kind: 'sign', name: '' }) },
  stamp: { label: 'Stamp', icon: 'stamp', mode: 'click', make: () => ({ type: 'stamp', text: 'APPROVED', color: '#16a34a', w: 0.3, hRatio: 0.28 }) },
  crop: { label: 'Crop', icon: 'crop', mode: 'none' },
};
const BOX_DEFAULT = { rect: [0.25, 0.08], ellipse: [0.2, 0.1], highlight: [0.3, 0.025], whiteout: [0.25, 0.04], redact: [0.25, 0.03], link: [0.25, 0.03], field: [0.35, 0.035] };
const STAMPS = ['APPROVED', 'PAID', 'RECEIVED', 'DRAFT', 'CONFIDENTIAL', 'REJECTED', 'VOID', 'COPY', 'URGENT', 'FINAL', 'VERIFIED', 'FOR REVIEW'];

export class PageEditor {
  constructor({ pdf, tools, defaultTool = 'select', providers = {}, objects = [], onChange, hint }) {
    this.pdf = pdf; this.tools = ['select', ...tools.filter(t => t !== 'select')]; this.tool = defaultTool;
    this.providers = providers; this.objects = objects; this.onChange = onChange || (() => {});
    this.page = 0; this.sel = null; this.history = []; this.hint = hint;
    this.build();
  }

  build() {
    this.toolbar = h('div.ed-tools', { role: 'toolbar', 'aria-label': 'Editing tools' });
    this.nav = h('div.ed-nav');
    this.stage = h('div.ed-stage');
    this.stageWrap = h('div.ed-stage-wrap', this.stage);
    this.props = h('div.ed-props', { hidden: true });
    this.hintEl = h('div.ed-hint');
    this.el = h('div.editor', this.toolbar, this.nav, this.hintEl, this.stageWrap, this.props);
    this.drawToolbar();
    this.stage.addEventListener('pointerdown', e => this.onStageDown(e));
    let rt; this._onResize = () => { clearTimeout(rt); rt = setTimeout(() => this.el.isConnected && this.renderPage(), 200); };
    window.addEventListener('resize', this._onResize);
    this._onKey = e => {
      if (!this.el.isConnected) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.sel && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); this.remove(this.sel); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this.undo(); }
    };
    document.addEventListener('keydown', this._onKey);
  }
  destroy() { window.removeEventListener('resize', this._onResize); document.removeEventListener('keydown', this._onKey); }

  drawToolbar() {
    this.toolbar.innerHTML = '';
    for (const t of this.tools) {
      const d = this.providers[t] || TOOLDEFS[t]; if (!d) continue;
      this.toolbar.appendChild(h('button.ed-tool', { type: 'button', class: this.tool === t ? 'on' : '', 'aria-pressed': String(this.tool === t), on: { click: () => this.setTool(t) } }, ic(d.icon), h('span', { text: d.label })));
    }
    this.toolbar.appendChild(h('button.ed-tool', { type: 'button', on: { click: () => this.undo() }, title: 'Undo' }, ic('undo-2'), h('span', { text: 'Undo' })));
    this.updateHint();
  }
  updateHint() {
    const d = this.providers[this.tool] || TOOLDEFS[this.tool] || {};
    const msg = this.hint?.(this.tool) || {
      select: 'Tap an item to select it. Drag to move, use the round handle to resize.',
      box: 'Drag on the page to draw. Tap once for a default size.',
      line: 'Drag on the page from start to end.', draw: 'Draw on the page with your finger, pen or mouse.',
      click: 'Tap on the page where you want to place it.', image: 'Tap on the page where the image should go.', signature: 'Tap on the page where you want to sign.', provider: 'Tap on the page where it should go.',
    }[d.mode || (this.providers[this.tool] ? 'provider' : 'select')] || '';
    this.hintEl.textContent = msg;
  }

  async setTool(t) {
    this.tool = t; this.select(null); this.drawToolbar();
    this.stage.classList.toggle('placing', t !== 'select');
  }

  snapshot() { this.history.push(JSON.stringify(this.objects)); if (this.history.length > 60) this.history.shift(); }
  undo() {
    const s = this.history.pop(); if (!s) return toast('Nothing to undo');
    this.objects.splice(0, this.objects.length, ...JSON.parse(s)); this.sel = null; this.drawObjects(); this.onChange();
  }
  changed() { this.drawObjects(); this.onChange(); }

  async goto(i) { this.page = Math.max(0, Math.min(this.pdf.numPages - 1, i)); this.select(null); await this.renderPage(); }

  async renderPage() {
    const n = this.pdf.numPages;
    this.nav.innerHTML = '';
    this.nav.append(
      h('button.mini-btn.icon-only', { type: 'button', 'aria-label': 'Previous page', disabled: this.page === 0, on: { click: () => this.goto(this.page - 1) } }, ic('chevron-left')),
      h('span', { text: `Page ${this.page + 1} of ${n}` }),
      h('button.mini-btn.icon-only', { type: 'button', 'aria-label': 'Next page', disabled: this.page >= n - 1, on: { click: () => this.goto(this.page + 1) } }, ic('chevron-right')),
    );
    const page = await this.pdf.getPage(this.page + 1);
    const vp1 = page.getViewport({ scale: 1 });
    this.pw = vp1.width; this.ph = vp1.height;
    const avail = Math.max(240, Math.min(980, (this.stageWrap.clientWidth || 800) - 24));
    const scale = avail / vp1.width;
    this.dispW = avail; this.dispH = vp1.height * scale;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const canvas = await renderPage(this.pdf, page, { scale: scale * dpr });
    this.stage.innerHTML = '';
    this.stage.style.width = this.dispW + 'px'; this.stage.style.height = this.dispH + 'px';
    this.stage.appendChild(canvas);
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('class', 'ed-svg'); this.svg.setAttribute('viewBox', `0 0 ${this.pw} ${this.ph}`); this.svg.setAttribute('preserveAspectRatio', 'none');
    this.stage.appendChild(this.svg);
    this.layer = h('div', { style: { position: 'absolute', inset: '0' } });
    this.stage.appendChild(this.layer);
    this.drawObjects();
  }

  pt2px(pt) { return pt * this.dispW / this.pw; }
  frac(e) { const r = this.stage.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; }

  drawObjects() {
    if (!this.layer) return;
    this.layer.innerHTML = ''; this.svg.innerHTML = '';
    for (const o of this.objects.filter(o => o.page === this.page)) {
      if (o.type === 'line' || o.type === 'arrow' || o.type === 'draw') this.drawSvgObj(o);
      else this.drawBoxObj(o);
    }
    this.drawProps();
  }

  drawSvgObj(o) {
    const NS = 'http://www.w3.org/2000/svg'; const W = this.pw, H = this.ph;
    const g = document.createElementNS(NS, 'g'); g.style.cursor = 'move';
    let d;
    if (o.type === 'draw') d = o.points.map((p, i) => `${i ? 'L' : 'M'}${p[0] * W} ${p[1] * H}`).join(' ');
    else { d = `M${o.x1 * W} ${o.y1 * H} L${o.x2 * W} ${o.y2 * H}`; if (o.type === 'arrow') d += ' ' + arrowHead(o.x1 * W, o.y1 * H, o.x2 * W, o.y2 * H, o.width).svg; }
    const mk = (stroke, width, extra = {}) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', stroke); p.setAttribute('stroke-width', width); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round'); for (const k in extra) p.setAttribute(k, extra[k]); return p; };
    const hit = mk('transparent', Math.max(14, o.width * 4) * this.pw / this.dispW, { 'pointer-events': 'stroke' });
    if (this.sel === o.id) g.appendChild(mk('#6366f1', o.width + 4 * this.pw / this.dispW, { opacity: '.35' }));
    g.appendChild(mk(o.stroke, o.width)); g.appendChild(hit);
    g.addEventListener('pointerdown', e => this.onObjDown(e, o, 'move'));
    this.svg.appendChild(g);
  }

  drawBoxObj(o) {
    const el = h(`div.ed-obj.t-${o.type}`, { class: this.sel === o.id ? 'sel' : '' });
    el.style.left = o.x * 100 + '%'; el.style.top = o.y * 100 + '%';
    if (o.type === 'text') {
      const f = CSS_FONT[o.font] || CSS_FONT.Helvetica; const bold = f.startsWith('bold ');
      el.appendChild(h('div.txt', { text: o.text, style: { fontSize: this.pt2px(o.size) + 'px', color: o.color, fontFamily: f.replace('bold ', ''), fontWeight: bold ? '700' : '400' } }));
    } else {
      const hh = o.hRatio ? o.w * this.dispW * o.hRatio : o.h * this.dispH;
      el.style.width = o.w * 100 + '%'; el.style.height = hh + 'px';
      if (o.type === 'image') { el.appendChild(h('img', { src: o.src, alt: '' })); el.style.opacity = o.opacity ?? 1; }
      if (o.type === 'rect' || o.type === 'ellipse') Object.assign(el.style, { border: `${Math.max(1, this.pt2px(o.width))}px solid ${o.stroke}`, background: o.fill || 'transparent', borderRadius: o.type === 'ellipse' ? '50%' : '0' });
      if (o.type === 'highlight') Object.assign(el.style, { background: o.color, opacity: o.opacity });
      if (o.type === 'note') el.innerHTML = ic('message-square');
      if (o.type === 'field') el.textContent = o.kind === 'check' ? '☐' : `${{ text: 'Text', select: 'Dropdown', sign: 'Signature' }[o.kind]}: ${o.name || '(unnamed)'}`;
      if (o.type === 'stamp') Object.assign(el.style, { color: o.color, borderColor: o.color, borderWidth: Math.max(2, this.pt2px(3)) + 'px', fontSize: hh * 0.5 + 'px' }), (el.textContent = o.text);
      if (o.type === 'link') el.title = o.target === 'page' ? `Go to page ${o.page}` : o.url;
    }
    el.appendChild(h('span.h', { on: { pointerdown: e => this.onObjDown(e, o, 'resize') } }));
    el.addEventListener('pointerdown', e => this.onObjDown(e, o, 'move'));
    this.layer.appendChild(el);
    if (o.type === 'text') { requestAnimationFrame(() => { o.w = el.offsetWidth / this.dispW; o.h = el.offsetHeight / this.dispH; }); }
  }

  select(id) { this.sel = id; if (this.layer) this.drawObjects(); }
  get selected() { return this.objects.find(o => o.id === this.sel); }
  remove(id) { this.snapshot(); const i = this.objects.findIndex(o => o.id === id); if (i >= 0) this.objects.splice(i, 1); this.sel = null; this.changed(); }
  add(o, keepTool) {
    this.snapshot(); o.id = ++uid; o.page ??= this.page; this.objects.push(o); this.sel = o.id;
    const d = TOOLDEFS[this.tool];
    if (!keepTool && !(d && ['box', 'line', 'draw'].includes(d.mode))) { this.tool = 'select'; this.stage.classList.remove('placing'); this.drawToolbar(); }
    this.changed();
    return o;
  }

  // ── pointer handling ──
  onObjDown(e, o, mode) {
    if (this.tool === 'draw') return; // let drawing continue over objects
    e.stopPropagation(); e.preventDefault();
    if (this.sel !== o.id) this.select(o.id);
    const start = this.frac(e); const orig = JSON.parse(JSON.stringify(o)); let moved = false;
    const target = e.currentTarget; target.setPointerCapture?.(e.pointerId);
    const move = ev => {
      const [fx, fy] = this.frac(ev); const dx = fx - start[0], dy = fy - start[1];
      if (!moved && Math.abs(dx) + Math.abs(dy) < 0.003) return;
      if (!moved) { this.snapshot(); moved = true; }
      if (mode === 'move') {
        if (o.points) o.points = orig.points.map(p => [p[0] + dx, p[1] + dy]);
        else if ('x1' in o) Object.assign(o, { x1: orig.x1 + dx, y1: orig.y1 + dy, x2: orig.x2 + dx, y2: orig.y2 + dy });
        else { o.x = clamp(orig.x + dx, -0.05, 0.98); o.y = clamp(orig.y + dy, -0.05, 0.98); }
      } else {
        if (o.type === 'text') o.size = Math.max(4, orig.size * (1 + dy * this.ph / Math.max(8, orig.size * 1.2)));
        else if (o.hRatio || o.type === 'image') { o.w = Math.max(0.02, orig.w + dx); if (o.type === 'image') o.h = o.w * this.dispW / this.dispH / o.aspect; }
        else { o.w = Math.max(0.01, orig.w + dx); o.h = Math.max(0.006, orig.h + dy); }
      }
      this.drawObjects();
    };
    const up = () => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', up); target.removeEventListener('pointercancel', up); if (moved) this.onChange(); };
    target.addEventListener('pointermove', move); target.addEventListener('pointerup', up); target.addEventListener('pointercancel', up);
  }

  async onStageDown(e) {
    if (e.button > 0) return;
    const prov = this.providers[this.tool]; const d = prov || TOOLDEFS[this.tool];
    if (this.tool === 'select' || !d) { this.select(null); return; }
    const [fx, fy] = this.frac(e);
    if (prov) {
      e.preventDefault();
      const img = await prov.provide(); if (!img) return;
      return this.placeImage(img, fx, fy);
    }
    if (d.mode === 'click') {
      e.preventDefault();
      const o = d.make(); Object.assign(o, { x: fx, y: fy });
      if (o.hRatio) { o.x -= o.w / 2; o.y -= (o.w * o.hRatio * this.dispW / this.dispH) / 2; }
      else if (o.type === 'text') o.y -= this.pt2px(o.size) * 0.6 / this.dispH;
      this.add(o);
      if (o.type === 'text' || o.type === 'note') setTimeout(() => this.props.querySelector('textarea')?.select(), 50);
      return;
    }
    if (d.mode === 'image') { e.preventDefault(); const img = await pickImage(); if (img) this.placeImage(img, fx, fy); return; }
    if (d.mode === 'signature') { e.preventDefault(); const img = await signatureDialog(d.initials); if (img) this.placeImage(img, fx, fy, d.initials ? 0.1 : 0.22); return; }
    if (d.mode === 'box' || d.mode === 'line' || d.mode === 'draw') {
      e.preventDefault(); this.stage.setPointerCapture?.(e.pointerId);
      const o = d.make(); o.page = this.page;
      if (d.mode === 'box') Object.assign(o, { x: fx, y: fy, w: 0, h: 0 });
      if (d.mode === 'line') Object.assign(o, { x1: fx, y1: fy, x2: fx, y2: fy });
      if (d.mode === 'draw') o.points = [[fx, fy]];
      this.snapshot(); o.id = ++uid; this.objects.push(o);
      const move = ev => {
        const [x, y] = this.frac(ev);
        if (d.mode === 'box') Object.assign(o, { x: Math.min(fx, x), y: Math.min(fy, y), w: Math.abs(x - fx), h: Math.abs(y - fy) });
        if (d.mode === 'line') Object.assign(o, { x2: x, y2: y });
        if (d.mode === 'draw') { const ps = ev.getCoalescedEvents?.() || [ev]; for (const p of ps) o.points.push(this.frac(p)); }
        this.drawObjects();
      };
      const up = () => {
        this.stage.removeEventListener('pointermove', move); this.stage.removeEventListener('pointerup', up); this.stage.removeEventListener('pointercancel', up);
        if (d.mode === 'box' && (o.w < 0.01 || o.h < 0.006)) { const [dw, dh] = BOX_DEFAULT[o.type] || [0.25, 0.05]; Object.assign(o, { x: Math.min(fx, 1 - dw), y: Math.min(fy, 1 - dh), w: dw, h: dh }); }
        if (d.mode === 'line' && Math.hypot(o.x2 - o.x1, o.y2 - o.y1) < 0.01) Object.assign(o, { x2: Math.min(1, o.x1 + 0.2) });
        if (d.mode === 'draw' && o.points.length < 2) { this.objects.pop(); this.history.pop(); }
        if (d.mode === 'draw') o.points = simplify(o.points, 0.0008);
        if (o.type === 'field' && !o.name) o.name = `${o.kind}_${this.objects.filter(x => x.type === 'field').length}`;
        this.sel = d.mode === 'draw' ? null : o.id; this.changed();
      };
      this.stage.addEventListener('pointermove', move); this.stage.addEventListener('pointerup', up); this.stage.addEventListener('pointercancel', up);
    }
  }

  placeImage(img, fx, fy, wFrac = 0.3) {
    const aspect = img.w / img.h;
    const w = Math.min(wFrac, 0.9); const hh = w * this.dispW / this.dispH / aspect;
    return this.add({ type: 'image', src: img.src, aspect, x: clamp(fx - w / 2, 0, 1 - w), y: clamp(fy - hh / 2, 0, 1 - hh), w, h: hh, opacity: 1 });
  }

  drawProps() {
    const o = this.selected; const p = this.props; p.innerHTML = '';
    if (!o) { p.hidden = true; return; }
    p.hidden = false;
    const upd = (k, cast = v => v) => e => { o[k] = cast(e.target.type === 'checkbox' ? e.target.checked : e.target.value); this.drawObjectsKeepFocus(); this.onChange(); };
    const color = (k, label = 'Colour') => h('label', label, h('input', { type: 'color', value: o[k] || '#000000', on: { input: upd(k) } }));
    const num = (k, label, min, max, step = 1) => h('label', label, h('input', { type: 'number', min, max, step, value: Math.round(o[k] * 10) / 10, on: { input: upd(k, Number) } }));
    if (o.type === 'text') {
      p.append(h('textarea', { rows: 2, 'aria-label': 'Text', on: { input: upd('text') } }, esc(o.text)), num('size', 'Size', 4, 200), color('color'),
        h('select', { 'aria-label': 'Font', style: { flex: '0 1 150px' }, on: { change: upd('font') } }, Object.keys(CSS_FONT).map(f => h('option', { value: f, selected: f === o.font }, f.replace('Roman', '').replace('Bold', ' Bold')))));
    }
    if (o.type === 'note') p.append(h('textarea', { rows: 2, 'aria-label': 'Comment', on: { input: upd('text') } }, esc(o.text)));
    if (['rect', 'ellipse', 'line', 'arrow', 'draw'].includes(o.type)) { p.append(color('stroke', 'Line'), num('width', 'Width', 0.5, 20, 0.5)); }
    if (o.type === 'rect' || o.type === 'ellipse') p.append(h('label', 'Fill', h('input', { type: 'checkbox', checked: !!o.fill, on: { change: e => { o.fill = e.target.checked ? '#fde68a' : ''; this.drawObjects(); this.onChange(); } } })), o.fill ? color('fill', 'Fill colour') : '');
    if (o.type === 'highlight') p.append(color('color'), h('label', 'Opacity', h('input', { type: 'range', min: 0.15, max: 0.8, step: 0.05, value: o.opacity, on: { input: upd('opacity', Number) } })));
    if (o.type === 'image') p.append(h('label', 'Opacity', h('input', { type: 'range', min: 0.1, max: 1, step: 0.05, value: o.opacity ?? 1, on: { input: upd('opacity', Number) } })));
    if (o.type === 'stamp') p.append(h('select', { 'aria-label': 'Stamp text', on: { change: upd('text') } }, [...new Set([o.text, ...STAMPS])].map(s => h('option', { selected: s === o.text }, s))), h('input', { type: 'text', 'aria-label': 'Custom stamp text', placeholder: 'Custom text', on: { input: upd('text', v => v.toUpperCase()) } }), color('color'));
    if (o.type === 'link') {
      p.append(h('select', { style: { flex: '0 1 140px' }, 'aria-label': 'Link type', on: { change: e => { o.target = e.target.value; this.drawObjects(); } } }, h('option', { value: 'url', selected: o.target === 'url' }, 'Website'), h('option', { value: 'page', selected: o.target === 'page' }, 'Page')));
      p.append(o.target === 'url' ? h('input', { type: 'text', value: o.url, placeholder: 'https://example.com', 'aria-label': 'URL', inputmode: 'url', on: { input: upd('url') } }) : num('page', 'Page no.', 1, this.pdf.numPages));
    }
    if (o.type === 'field') {
      p.append(h('input', { type: 'text', value: o.name, placeholder: 'Field name', 'aria-label': 'Field name', on: { input: upd('name') } }));
      if (o.kind === 'select') p.append(h('input', { type: 'text', value: o.options, placeholder: 'Options, comma separated', 'aria-label': 'Options', on: { input: upd('options') } }));
      if (o.kind === 'text') p.append(h('label', 'Multi-line', h('input', { type: 'checkbox', checked: !!o.multiline, on: { change: upd('multiline') } })), h('label', 'Required', h('input', { type: 'checkbox', checked: !!o.required, on: { change: upd('required') } })));
    }
    const btns = h('div', { style: { display: 'flex', gap: '.4rem', marginLeft: 'auto', flexWrap: 'wrap' } });
    if (['image', 'text', 'stamp'].includes(o.type) && this.pdf.numPages > 1) btns.append(h('button.mini-btn', { type: 'button', on: { click: () => this.copyToAll(o) } }, ic('copy'), 'All pages'));
    btns.append(h('button.mini-btn', { type: 'button', style: { color: 'var(--red)' }, on: { click: () => this.remove(o.id) } }, ic('trash-2'), 'Delete'));
    p.append(btns);
  }
  drawObjectsKeepFocus() {
    // redraw only the object layer (keeps the input in the props panel focused)
    const keep = this.props; this.props = h('div'); this.drawObjects(); this.props = keep;
  }
  copyToAll(o) {
    this.snapshot();
    for (let i = 0; i < this.pdf.numPages; i++) if (i !== o.page) this.objects.push({ ...JSON.parse(JSON.stringify(o)), id: ++uid, page: i });
    toast(`Copied to all ${this.pdf.numPages} pages`, 'success'); this.onChange();
  }
}

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function simplify(pts, tol) { const out = [pts[0]]; for (const p of pts.slice(1)) { const q = out[out.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) > tol) out.push(p); } if (out.length < 2) out.push(pts[pts.length - 1]); return out; }
export function arrowHead(x1, y1, x2, y2, w) {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 6 + w * 3, s = 0.45;
  const p1 = [x2 - L * Math.cos(a - s), y2 - L * Math.sin(a - s)], p2 = [x2 - L * Math.cos(a + s), y2 - L * Math.sin(a + s)];
  return { svg: `M${p1[0]} ${p1[1]} L${x2} ${y2} L${p2[0]} ${p2[1]}`, p1, p2 };
}

// ── Image picker & signature dialog ──
export function pickImage() {
  return new Promise(resolve => {
    const inp = h('input', { type: 'file', accept: 'image/*' });
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return resolve(null); resolve(await fileToImg(f)); };
    inp.click();
  });
}
export async function fileToImg(f) {
  const src = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
  const im = await new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src; });
  if (!/png|jpe?g/.test(f.type)) { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return { src: c.toDataURL('image/png'), w: im.width, h: im.height }; }
  return { src, w: im.width, h: im.height };
}

const SIG_FONTS = ['Dancing Script', 'Great Vibes', 'Caveat', 'Sacramento', 'Homemade Apple'];
function loadSigFonts() {
  if (document.getElementById('sig-fonts')) return;
  document.head.appendChild(h('link', { id: 'sig-fonts', rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Dancing+Script:wght@600&family=Great+Vibes&family=Homemade+Apple&family=Sacramento&display=swap' }));
}

export async function signatureDialog(initials = false) {
  loadSigFonts();
  const key = initials ? 'saved-initials' : 'saved-signature';
  const saved = store.get(key);
  let mode = saved ? 'saved' : 'draw', color = '#0f172a', typedFont = SIG_FONTS[0], uploaded = null;
  const body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '1rem' } });
  const tabs = h('div.seg');
  const area = h('div');
  const colors = h('div.color-row', ['#0f172a', '#1d4ed8', '#b91c1c'].map(c => h('button', { type: 'button', style: { background: c }, 'aria-label': c, class: c === color ? 'on' : '', on: { click: e => { color = c; colors.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === e.currentTarget)); redrawTyped(); pad.recolor(c); } } })));
  const remember = h('label.switch', h('span', { text: 'Remember on this device' }), h('input', { type: 'checkbox', checked: true }));
  // draw pad
  const canvas = h('canvas.sig-canvas');
  const pad = makePad(canvas, () => color);
  const typedInput = h('input.option-input', { type: 'text', placeholder: initials ? 'Your initials' : 'Type your name', maxlength: 40, on: { input: () => redrawTyped() } });
  const typedList = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '.5rem' } });
  function redrawTyped() {
    typedList.innerHTML = '';
    for (const f of SIG_FONTS) typedList.appendChild(h('div.sig-typed', { class: f === typedFont ? 'on' : '', style: { fontFamily: `'${f}', cursive`, color }, on: { click: () => { typedFont = f; redrawTyped(); } } }, esc(typedInput.value || (initials ? 'AB' : 'Your Name'))));
  }
  const upInput = h('input', { type: 'file', accept: 'image/*' });
  const upPreview = h('img', { alt: '', style: { maxHeight: '140px', margin: '0 auto', display: 'none' } });
  const removeBg = h('label.switch', h('span', { text: 'Remove white background' }), h('input', { type: 'checkbox', checked: true }));
  upInput.onchange = async () => { const f = upInput.files[0]; if (!f) return; uploaded = await fileToImg(f); upPreview.src = uploaded.src; upPreview.style.display = 'block'; };

  const draw = () => {
    tabs.innerHTML = '';
    const opts = [...(saved ? [['saved', 'Saved', 'history']] : []), ['draw', 'Draw', 'pen-line'], ['type', 'Type', 'type'], ['upload', 'Upload', 'upload']];
    for (const [m, l, i] of opts) tabs.appendChild(h('button', { type: 'button', class: mode === m ? 'on' : '', on: { click: () => { mode = m; draw(); } } }, ic(i), l));
    area.innerHTML = '';
    if (mode === 'saved') area.append(h('div', { style: { background: '#fff', borderRadius: '12px', padding: '1rem', border: '2px solid var(--border)' } }, h('img', { src: saved.src, alt: 'Saved signature', style: { maxHeight: '120px', margin: '0 auto' } })), h('button.mini-btn', { type: 'button', style: { marginTop: '.6rem' }, on: { click: () => { store.set(key, null); mode = 'draw'; draw(); } } }, ic('trash-2'), 'Forget saved'));
    if (mode === 'draw') { area.append(canvas, h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: '.5rem', alignItems: 'center' } }, colors, h('button.mini-btn', { type: 'button', on: { click: () => pad.clear() } }, ic('eraser'), 'Clear'))); requestAnimationFrame(() => pad.resize()); }
    if (mode === 'type') { area.append(typedInput, h('div', { style: { height: '.6rem' } }), typedList, h('div', { style: { marginTop: '.6rem' } }, colors)); redrawTyped(); setTimeout(() => typedInput.focus(), 30); }
    if (mode === 'upload') area.append(h('div.file-opt', ic('upload'), h('span', 'Choose a photo of your signature'), upInput), h('div', { style: { height: '.6rem' } }), upPreview, removeBg);
  };
  body.append(tabs, area, remember);
  draw();
  const result = await modal({
    title: initials ? 'Your initials' : 'Your signature', body,
    actions: [{ label: 'Cancel', value: null }, { label: 'Use it', primary: true, value: async () => {
      let img = null;
      if (mode === 'saved') img = saved;
      if (mode === 'draw') { if (pad.empty()) { toast('Please draw your signature first', 'error'); return undefined; } img = trimCanvas(pad.canvas); }
      if (mode === 'type') { await document.fonts?.load?.(`64px '${typedFont}'`); img = typedToImg(typedInput.value || (initials ? 'AB' : 'Your Name'), typedFont, color); }
      if (mode === 'upload') { if (!uploaded) { toast('Choose an image first', 'error'); return undefined; } img = removeBg.querySelector('input').checked ? await knockOutWhite(uploaded) : uploaded; }
      if (img && remember.querySelector('input').checked && mode !== 'saved') store.set(key, img);
      return img;
    } }],
  });
  return result;
}

function makePad(canvas, getColor) {
  let strokes = [], cur = null, ctx;
  const api = {
    canvas,
    resize() { const r = canvas.getBoundingClientRect(); const d = Math.min(3, window.devicePixelRatio || 1) * 1.5; canvas.width = Math.max(10, r.width * d); canvas.height = Math.max(10, r.height * d); ctx = canvas.getContext('2d'); ctx.scale(d, d); redraw(); },
    clear() { strokes = []; redraw(); }, empty: () => !strokes.length,
    recolor(c) { strokes.forEach(s => (s.c = c)); redraw(); },
  };
  function redraw() {
    if (!ctx) return; ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of strokes) { ctx.strokeStyle = s.c; ctx.lineWidth = 2.6; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); s.p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (s.p.length === 1) ctx.lineTo(s.p[0][0] + 0.1, s.p[0][1]); ctx.stroke(); }
  }
  const pos = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); cur = { c: getColor(), p: [pos(e)] }; strokes.push(cur); redraw(); });
  canvas.addEventListener('pointermove', e => { if (!cur) return; for (const ev of e.getCoalescedEvents?.() || [e]) cur.p.push(pos(ev)); redraw(); });
  const end = () => { cur = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  return api;
}
function trimCanvas(c) {
  const ctx = c.getContext('2d'); const { width: w, height: hh } = c; const d = ctx.getImageData(0, 0, w, hh).data;
  let x0 = w, y0 = hh, x1 = 0, y1 = 0;
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const pad = 6; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w, x1 + pad); y1 = Math.min(hh, y1 + pad);
  const o = document.createElement('canvas'); o.width = Math.max(1, x1 - x0); o.height = Math.max(1, y1 - y0);
  o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return { src: o.toDataURL('image/png'), w: o.width, h: o.height };
}
function typedToImg(text, font, color) {
  const c = document.createElement('canvas'); const x = c.getContext('2d'); const size = 120;
  x.font = `${size}px '${font}'`; const w = x.measureText(text).width;
  c.width = Math.ceil(w + 40); c.height = Math.ceil(size * 1.6);
  x.font = `${size}px '${font}'`; x.fillStyle = color; x.textBaseline = 'middle'; x.fillText(text, 20, c.height / 2);
  return trimCanvas(c);
}
async function knockOutWhite(img) {
  const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = img.src; });
  const c = document.createElement('canvas'); const s = Math.min(1, 1600 / Math.max(im.width, im.height));
  c.width = im.width * s; c.height = im.height * s; const x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height);
  const d = x.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) { const l = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3; if (l > 200) d.data[i + 3] = 0; else if (l > 140) d.data[i + 3] = Math.round(255 * (200 - l) / 60); }
  x.putImageData(d, 0, 0);
  return trimCanvas(c);
}

// ─────────────────────────────────────────────────────────────
//  Apply editor objects to a pdf-lib document
// ─────────────────────────────────────────────────────────────
export async function applyObjects(doc, objects, { skip = [] } = {}) {
  const P = await PL();
  const pages = doc.getPages();
  const imgCache = new Map();
  const form = objects.some(o => o.type === 'field') ? doc.getForm() : null;
  for (const o of objects) {
    if (skip.includes(o.type)) continue;
    const page = pages[o.page]; if (!page) continue;
    const { w: W, h: H } = visualSize(page);
    const V = (fx, fy) => visualToUser(page, fx * W, H - fy * H); // fraction → user space
    const hh = o.hRatio ? o.w * W * o.hRatio : o.h * H;
    const box = () => { const bl = V(o.x, o.y + hh / H); return { x: bl.x, y: bl.y, w: o.w * W, h: hh, r: bl.r }; };
    const rectUser = () => { const a = V(o.x, o.y), b = V(o.x + o.w, o.y + hh / H); return [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y)]; };
    switch (o.type) {
      case 'text': {
        const lines = o.text.split('\n'); const font = await getFont(doc, o.font);
        if (canEncode(font, o.text)) {
          lines.forEach((ln, i) => { const p = V(o.x, o.y + (o.size * (0.95 + i * 1.2)) / H); page.drawText(ln, { x: p.x, y: p.y, size: o.size, font, color: hexRgb(o.color), rotate: P.degrees(p.r) }); });
        } else {
          const t = await textPng(o.text, o.size, o.color, o.font); const img = await doc.embedPng(t.bytes);
          const p = V(o.x, o.y + t.h / H); page.drawImage(img, { x: p.x, y: p.y, width: t.w, height: t.h, rotate: P.degrees(p.r) });
        }
        break;
      }
      case 'image': {
        let img = imgCache.get(o.src);
        if (!img) { const bytes = dataUrlBytes(o.src); img = o.src.startsWith('data:image/png') ? await doc.embedPng(bytes) : await doc.embedJpg(bytes); imgCache.set(o.src, img); }
        const b = box(); page.drawImage(img, { x: b.x, y: b.y, width: b.w, height: b.h, opacity: o.opacity ?? 1, rotate: P.degrees(b.r) });
        break;
      }
      case 'rect': case 'whiteout': case 'redact': case 'highlight': {
        const b = box();
        const opt = { x: b.x, y: b.y, width: b.w, height: b.h, rotate: P.degrees(b.r) };
        if (o.type === 'rect') Object.assign(opt, { borderColor: hexRgb(o.stroke), borderWidth: o.width, ...(o.fill ? { color: hexRgb(o.fill) } : {}) });
        if (o.type === 'whiteout') opt.color = P.rgb(1, 1, 1);
        if (o.type === 'redact') opt.color = P.rgb(0, 0, 0);
        if (o.type === 'highlight') Object.assign(opt, { color: hexRgb(o.color), opacity: o.opacity, blendMode: P.BlendMode.Multiply });
        page.drawRectangle(opt);
        break;
      }
      case 'ellipse': {
        const b = box(); const c = V(o.x + o.w / 2, o.y + hh / H / 2);
        const sw = b.r % 180 ? [b.h / 2, b.w / 2] : [b.w / 2, b.h / 2];
        page.drawEllipse({ x: c.x, y: c.y, xScale: sw[0], yScale: sw[1], borderColor: hexRgb(o.stroke), borderWidth: o.width, ...(o.fill ? { color: hexRgb(o.fill) } : {}) });
        break;
      }
      case 'line': case 'arrow': {
        const a = V(o.x1, o.y1), b = V(o.x2, o.y2); const col = hexRgb(o.stroke);
        page.drawLine({ start: { x: a.x, y: a.y }, end: { x: b.x, y: b.y }, thickness: o.width, color: col, lineCap: P.LineCapStyle.Round });
        if (o.type === 'arrow') { const ah = arrowHead(a.x, a.y, b.x, b.y, o.width); for (const q of [ah.p1, ah.p2]) page.drawLine({ start: { x: q[0], y: q[1] }, end: { x: b.x, y: b.y }, thickness: o.width, color: col, lineCap: P.LineCapStyle.Round }); }
        break;
      }
      case 'draw': {
        const pts = o.points.map(([fx, fy]) => V(fx, fy));
        const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${(-p.y).toFixed(2)}`).join(' ');
        page.drawSvgPath(path, { x: 0, y: 0, borderColor: hexRgb(o.stroke), borderWidth: o.width, borderLineCap: P.LineCapStyle.Round });
        break;
      }
      case 'stamp': {
        const b = box(); const col = hexRgb(o.color); const font = await getFont(doc, 'HelveticaBold');
        page.drawRectangle({ x: b.x, y: b.y, width: b.w, height: b.h, borderColor: col, borderWidth: Math.max(2, b.h * 0.07), opacity: 0, borderOpacity: 0.9, rotate: P.degrees(b.r) });
        let size = b.h * 0.5; const tw = () => font.widthOfTextAtSize(o.text, size); while (tw() > b.w * 0.88 && size > 4) size -= 0.5;
        const vx = o.x * W + (b.w - tw()) / 2, vy = H - (o.y * H + b.h / 2 + size * 0.35);
        const p = visualToUser(page, vx, vy);
        if (canEncode(font, o.text)) page.drawText(o.text, { x: p.x, y: p.y, size, font, color: col, opacity: 0.9, rotate: P.degrees(p.r) });
        break;
      }
      case 'link': {
        const [x1, y1, x2, y2] = rectUser();
        const dict = { Type: 'Annot', Subtype: 'Link', Rect: [x1, y1, x2, y2], Border: [0, 0, 0] };
        if (o.target === 'page') { const tp = pages[Math.max(0, Math.min(pages.length - 1, (o.page || 1) - 1))]; dict.Dest = [tp.ref, 'Fit']; }
        else dict.A = { Type: 'Action', S: 'URI', URI: P.PDFString.of(normalizeUrl(o.url)) };
        addAnnot(doc, page, doc.context.obj(dict));
        break;
      }
      case 'note': {
        const [x1, , , y2] = rectUser();
        addAnnot(doc, page, doc.context.obj({ Type: 'Annot', Subtype: 'Text', Rect: [x1, y2 - 20, x1 + 20, y2], Contents: P.PDFHexString.fromText(o.text || ''), Name: 'Comment', C: [1, 0.85, 0.2], T: P.PDFHexString.fromText('Comment'), M: P.PDFString.fromDate(new Date()), F: 4 }));
        break;
      }
      case 'field': {
        const [x1, y1, x2, y2] = rectUser(); const pos = { x: x1, y: y1, width: x2 - x1, height: y2 - y1, borderWidth: 1, borderColor: P.rgb(0.6, 0.6, 0.7) };
        let name = (o.name || `field_${o.id}`).replace(/[.]/g, '_'); let n = 1; while (form.getFieldMaybe?.(name)) name = `${o.name}_${++n}`;
        if (o.kind === 'text' || o.kind === 'sign') { const f = form.createTextField(name); if (o.multiline) f.enableMultiline(); if (o.required) f.enableRequired(); f.addToPage(page, pos); }
        if (o.kind === 'check') form.createCheckBox(name).addToPage(page, pos);
        if (o.kind === 'select') { const f = form.createDropdown(name); f.addOptions(String(o.options || '').split(',').map(s => s.trim()).filter(Boolean)); f.addToPage(page, pos); }
        break;
      }
    }
  }
  return doc;
}
export function addAnnot(doc, page, annotDict) {
  const P = window.PDFLib; const ref = doc.context.register(annotDict);
  const annots = page.node.lookup(P.PDFName.of('Annots'));
  if (annots instanceof P.PDFArray) annots.push(ref); else page.node.set(P.PDFName.of('Annots'), doc.context.obj([ref]));
}
export function normalizeUrl(u) { u = String(u || '').trim(); if (!u) return 'https://'; if (/^(https?:|mailto:|tel:)/i.test(u)) return u; if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(u)) return 'mailto:' + u; return 'https://' + u; }
export function dataUrlBytes(src) { const b = atob(src.split(',')[1]); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
