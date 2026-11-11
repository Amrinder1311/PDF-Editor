// UI helpers: element builder, icons, toasts, modals, downloads
import { ICONS } from './icons.js';

export function ic(name, cls = '') {
  const body = ICONS[name] || ICONS['file'];
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// h('div.cls#id', {attrs, on:{click}}, ...children)  — children: string(html) | Node | array
export function h(sel, props, ...kids) {
  if (props instanceof Node || typeof props === 'string' || Array.isArray(props)) { kids.unshift(props); props = {}; }
  props = props || {};
  const m = sel.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement(m[1] || 'div');
  (m[2].match(/[.#][\w-]+/g) || []).forEach(p => p[0] === '.' ? el.classList.add(p.slice(1)) : (el.id = p.slice(1)));
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'class') String(v).split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c));
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = k => {
    if (k == null || k === false) return;
    if (Array.isArray(k)) return k.forEach(add);
    if (k instanceof Node) el.appendChild(k);
    else el.insertAdjacentHTML('beforeend', String(k));
  };
  kids.forEach(add);
  return el;
}

export function fmtBytes(n) {
  if (n == null) return '';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
}

let toastTimer;
export function toast(msg, type = 'info') {
  let t = document.querySelector('.toast');
  if (!t) { t = h('div.toast', { role: 'status', 'aria-live': 'polite' }); document.body.appendChild(t); }
  const icon = { success: 'circle-check', error: 'circle-alert', info: 'info' }[type];
  t.className = `toast toast-${type}`;
  t.innerHTML = `${ic(icon)}<span>${esc(msg)}</span>`;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), type === 'error' ? 6000 : 3500);
}

// modal({title, body: Node|html, actions:[{label, primary, value}]}) → Promise<value|null>
export function modal({ title, body, actions = [{ label: 'OK', primary: true, value: true }], onOpen }) {
  return new Promise(resolve => {
    const prevFocus = document.activeElement;
    const close = v => { back.remove(); document.body.classList.remove('no-scroll'); document.removeEventListener('keydown', onKey); prevFocus?.focus?.(); resolve(v); };
    const onKey = e => { if (e.key === 'Escape') close(null); };
    const foot = h('div.modal-foot', actions.map(a => h(`button.btn.${a.primary ? 'btn-primary' : 'btn-ghost'}`, {
      type: 'button', on: { click: async () => { const v = typeof a.value === 'function' ? await a.value() : a.value; if (v !== undefined) close(v); } },
    }, a.label)));
    const box = h('div.modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div.modal-head', h('h3', { text: title }), h('button.icon-btn', { type: 'button', 'aria-label': 'Close', on: { click: () => close(null) } }, ic('x'))),
      h('div.modal-body', body), foot);
    const back = h('div.modal-back', { on: { mousedown: e => { if (e.target === back) close(null); } } }, box);
    document.body.appendChild(back);
    document.body.classList.add('no-scroll');
    document.addEventListener('keydown', onKey);
    onOpen?.(box, close);
    setTimeout(() => (box.querySelector('input,textarea,select') || foot.querySelector('.btn-primary'))?.focus(), 30);
  });
}

export async function askPassword(fileName, wrong = false) {
  const input = h('input.option-input', { type: 'password', placeholder: 'Enter PDF password', autocomplete: 'off' });
  const body = h('div', h('p', { html: `${wrong ? '<b style="color:var(--red)">Wrong password.</b> ' : ''}<b>${esc(fileName)}</b> is password protected. Enter its password to open it — it is only used on your device.` }), input);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') body.closest('.modal').querySelector('.btn-primary').click(); });
  return modal({ title: 'Password required', body, actions: [{ label: 'Cancel', value: null }, { label: 'Open', primary: true, value: () => input.value }] });
}

export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name, style: { display: 'none' } });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function baseName(name) { return name.replace(/\.[^.]+$/, ''); }

export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

export const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
