// Renders a tool's options panel from a simple schema.
import { h, ic, esc } from './ui.js';

const SWATCHES = ['#000000', '#ffffff', '#e11d48', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed', '#6b7280'];

export function initValues(schema, values = {}) {
  for (const it of schema) if (it.key && values[it.key] === undefined) values[it.key] = typeof it.default === 'function' ? it.default() : (it.default ?? (it.type === 'list' ? [] : it.type === 'check' ? false : ''));
  return values;
}

export function renderOptions(schema, values, onChange = () => {}) {
  initValues(schema, values);
  const root = h('div.opts', { style: { display: 'flex', flexDirection: 'column', gap: '1rem' } });
  const rows = [];
  const set = (k, v, rerender) => { values[k] = v; refresh(); onChange(k, v); if (rerender) rerender(); };
  const refresh = () => rows.forEach(([it, el]) => { el.hidden = it.show ? !it.show(values) : false; });

  for (const it of schema) {
    const el = field(it, values, set);
    if (!el) continue;
    rows.push([it, el]); root.appendChild(el);
  }
  refresh();
  root.refresh = refresh;
  return root;
}

function wrap(it, control, extra) {
  const id = 'o_' + it.key;
  const label = it.label ? h('label.option-label', { for: id }, h('span', { text: it.label }), extra || '') : '';
  return h('div.option-group', label, control, it.hint ? h('div.option-hint', { html: it.hint }) : '');
}

function field(it, values, set) {
  const id = 'o_' + it.key; const v = values[it.key];
  switch (it.type) {
    case 'heading': return h('div.option-heading', { text: it.label });
    case 'info': return h(`div.option-info${it.warn ? '.warn' : ''}`, { html: typeof it.html === 'function' ? it.html(values) : it.html });
    case 'select': {
      const s = h('select.option-select', { id, on: { change: e => set(it.key, e.target.value) } },
        it.options.map(([val, lab]) => h('option', { value: val, selected: String(val) === String(v) }, esc(lab))));
      return wrap(it, s);
    }
    case 'seg': case 'cards': {
      const box = h(`div.seg${it.type === 'cards' ? '.cards' : ''}`, { role: 'radiogroup', 'aria-label': it.label || it.key });
      const draw = () => {
        box.innerHTML = '';
        for (const [val, lab, extra] of it.options) {
          const on = String(values[it.key]) === String(val);
          const icon = it.type === 'seg' && extra ? ic(extra) : '';
          const sub = it.type === 'cards' && extra ? `<small>${esc(extra)}</small>` : '';
          box.appendChild(h('button', { type: 'button', class: on ? 'on' : '', role: 'radio', 'aria-checked': String(on), on: { click: () => set(it.key, val, draw) } }, icon + `<span>${esc(lab)}</span>` + sub));
        }
      };
      draw();
      return wrap(it, box);
    }
    case 'range': {
      const out = h('output', { text: fmt(it, v) });
      const r = h('input', { id, type: 'range', min: it.min ?? 0, max: it.max ?? 100, step: it.step ?? 1, value: v, on: { input: e => { out.textContent = fmt(it, +e.target.value); set(it.key, +e.target.value); } } });
      return wrap(it, h('div.range-row', r), out);
    }
    case 'number':
      return wrap(it, h('input.option-input', { id, type: 'number', inputmode: 'decimal', min: it.min, max: it.max, step: it.step ?? 1, value: v, placeholder: it.placeholder || '', on: { input: e => set(it.key, e.target.value === '' ? '' : +e.target.value) } }));
    case 'text': case 'password': case 'email': case 'url': case 'date': case 'pages':
      return wrap(it, h('input.option-input', {
        id, type: it.type === 'pages' ? 'text' : it.type, value: v ?? '', placeholder: it.placeholder || (it.type === 'pages' ? 'e.g. 1-3, 5, 8-10' : ''),
        autocomplete: it.type === 'password' ? 'new-password' : 'off', inputmode: it.type === 'pages' ? 'text' : undefined,
        on: { input: e => set(it.key, e.target.value) },
      }));
    case 'textarea':
      return wrap(it, h('textarea.option-input', { id, rows: it.rows || 5, placeholder: it.placeholder || '', spellcheck: it.spellcheck ?? false, on: { input: e => set(it.key, e.target.value) } }, esc(v ?? '')));
    case 'check':
      return h('div.option-group', h('label.switch', h('span', { text: it.label }), h('input', { type: 'checkbox', checked: !!v, on: { change: e => set(it.key, e.target.checked) } })), it.hint ? h('div.option-hint', { html: it.hint }) : '');
    case 'color': {
      const row = h('div.color-row');
      const draw = () => {
        row.innerHTML = '';
        for (const c of it.swatches || SWATCHES) row.appendChild(h('button', { type: 'button', class: values[it.key] === c ? 'on' : '', style: { background: c }, 'aria-label': c, on: { click: () => set(it.key, c, draw) } }));
        row.appendChild(h('input', { type: 'color', value: values[it.key] || '#000000', 'aria-label': 'Custom colour', on: { input: e => { values[it.key] = e.target.value; row.querySelectorAll('button').forEach(b => b.classList.remove('on')); set(it.key, e.target.value); } } }));
      };
      draw();
      return wrap(it, row);
    }
    case 'position': {
      const grid = h('div.pos-grid', { role: 'radiogroup', 'aria-label': it.label || 'Position' });
      const all = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'];
      const names = { t: 'Top', m: 'Middle', b: 'Bottom', l: 'left', c: 'centre', r: 'right' };
      const draw = () => {
        grid.innerHTML = '';
        for (const p of all) {
          const allowed = !it.allowed || it.allowed.includes(p);
          grid.appendChild(h('button', { type: 'button', class: values[it.key] === p ? 'on' : '', disabled: !allowed, style: allowed ? {} : { visibility: 'hidden' }, 'aria-label': `${names[p[0]]} ${names[p[1]]}`, on: { click: () => set(it.key, p, draw) } }));
        }
      };
      draw();
      return wrap(it, grid);
    }
    case 'image': case 'file': {
      const isImg = it.type === 'image';
      const label = h('span', { text: v?.name || it.placeholder || (isImg ? 'Choose an image (PNG, JPG)' : 'Choose file(s)') });
      const preview = h('img', { alt: '', hidden: !(isImg && v?.url), src: v?.url || '' });
      const inp = h('input', {
        type: 'file', accept: it.accept || (isImg ? 'image/*' : ''), multiple: !!it.multiple,
        on: { change: e => {
          const files = [...e.target.files]; if (!files.length) return;
          if (isImg) { const f = files[0]; const val = { file: f, name: f.name, url: URL.createObjectURL(f) }; preview.src = val.url; preview.hidden = false; label.textContent = f.name; set(it.key, val); }
          else { label.textContent = files.length === 1 ? files[0].name : `${files.length} files selected`; set(it.key, it.multiple ? files : files[0]); }
        } },
      });
      return wrap(it, h('div.file-opt', ic(isImg ? 'image-plus' : 'paperclip'), preview, label, inp));
    }
    case 'list': return wrap(it, listEditor(it, values, set));
    case 'custom': { const box = h('div'); it.render(box, values, (k, val) => set(k, val)); return it.label ? wrap(it, box) : box; }
  }
  return null;
}

function fmt(it, v) { return it.format ? it.format(v) : `${v}${it.unit || ''}`; }

function listEditor(it, values, set) {
  const box = h('div.list-editor');
  const draw = () => {
    box.innerHTML = '';
    const rows = values[it.key];
    rows.forEach((row, i) => {
      const r = h('div.list-row');
      for (const f of it.fields) {
        r.appendChild(h(`input.option-input${f.type === 'number' ? '.w-num' : ''}`, {
          type: f.type || 'text', value: row[f.key] ?? '', placeholder: f.placeholder || '', 'aria-label': f.placeholder || f.key,
          style: f.width ? { width: f.width, flex: '0 0 auto' } : { flex: '1' },
          on: { input: e => { row[f.key] = f.type === 'number' ? (e.target.value === '' ? '' : +e.target.value) : e.target.value; set(it.key, rows); } },
        }));
      }
      r.appendChild(h('button.mini-btn.icon-only', { type: 'button', 'aria-label': 'Remove row', on: { click: () => { rows.splice(i, 1); set(it.key, rows, draw); } } }, ic('x')));
      box.appendChild(r);
    });
    box.appendChild(h('button.mini-btn', { type: 'button', style: { alignSelf: 'flex-start' }, on: { click: () => { rows.push(Object.fromEntries(it.fields.map(f => [f.key, f.default ?? '']))); set(it.key, rows, draw); } } }, ic('plus'), it.addLabel || 'Add row'));
  };
  box.redraw = draw; it._redraw = draw;
  draw();
  return box;
}
