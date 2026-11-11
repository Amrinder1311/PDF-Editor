// Sign & Forms: sign, fill, create, flatten, export data, date/initials, stamps
import { loadDoc, saveDoc, PL } from '../core/pdf.js';
import { applyObjects } from '../core/editor.js';
import { h, esc } from '../core/ui.js';
import { toCSV } from '../core/htmlpdf.js';
import { outName } from './common.js';
import optimize from './optimize.js';

function editorTool(tools, def, suffix, extra = {}) {
  return {
    accept: 'pdf', view: 'editor', editorTools: tools, editorDefault: def, action: 'Save PDF', actionIcon: 'save',
    validate: ctx => !ctx.state.objects?.length ? 'Place something on the page first' : null,
    async run(ctx) {
      const doc = await loadDoc(ctx.files[0].bytes); await applyObjects(doc, ctx.state.objects);
      if (ctx.values.flatten) { try { doc.getForm().flatten(); } catch { } }
      return { files: [{ name: outName(ctx, suffix), blob: await saveDoc(doc) }] };
    },
    ...extra,
  };
}

async function readFields(bytes) {
  const P = await PL(); const doc = await loadDoc(bytes); let fields = [];
  try { fields = doc.getForm().getFields(); } catch { }
  return fields.map((f, i) => {
    const name = f.getName(); let type = 'text', value = '', options = [];
    if (f instanceof P.PDFTextField) value = f.getText() || '';
    else if (f instanceof P.PDFCheckBox) { type = 'check'; value = f.isChecked(); }
    else if (f instanceof P.PDFDropdown) { type = 'select'; options = f.getOptions(); value = f.getSelected()[0] || ''; }
    else if (f instanceof P.PDFOptionList) { type = 'select'; options = f.getOptions(); value = f.getSelected()[0] || ''; }
    else if (f instanceof P.PDFRadioGroup) { type = 'select'; options = f.getOptions(); value = f.getSelected() || ''; }
    else if (f instanceof P.PDFSignature) type = 'signature';
    else type = 'other';
    return { i, name, type, value, options, readOnly: f.isReadOnly?.() };
  });
}

export default {
  'sign-pdf': editorTool(['signature', 'initials', 'date', 'text', 'image'], 'signature', 'signed', {
    action: 'Sign & save', actionIcon: 'signature',
    options: [
      { type: 'info', html: '<b>1.</b> Tap <b>Signature</b>, draw / type / upload it.<br><b>2.</b> Tap on the page where it goes.<br><b>3.</b> Drag to move, use the round handle to resize. “All pages” copies it to every page.' },
      { key: 'flatten', type: 'check', label: 'Lock form fields after signing' },
    ],
    about: 'Your signature can be saved on this device so you can sign the next document in one tap. For a certificate-based digital signature (DSC), see Digital Certificate Signature.',
  }),

  'fill-forms': {
    accept: 'pdf', view: 'thumbs', action: 'Save filled form', actionIcon: 'save',
    async init(ctx) { ctx.state.fields = await readFields(ctx.files[0].bytes); ctx.state.fields.forEach(f => { ctx.values['f' + f.i] = f.value; }); },
    options: ctx => {
      const fs = ctx.state.fields.filter(f => ['text', 'check', 'select'].includes(f.type));
      if (!fs.length) return [{ type: 'info', warn: true, html: 'This PDF has no fillable fields. Use <a href="#/add-text">Add Text</a> to type on it, or <a href="#/create-form">Create Fillable Form</a> to add fields.' }];
      return [
        { type: 'info', html: `${fs.length} field${fs.length > 1 ? 's' : ''} found. Fill them in below.` },
        ...fs.map(f => f.type === 'check' ? { key: 'f' + f.i, type: 'check', label: f.name } : f.type === 'select' ? { key: 'f' + f.i, type: 'select', label: f.name, options: [['', '— choose —'], ...f.options.map(o => [o, o])] } : { key: 'f' + f.i, type: 'text', label: f.name }),
        { key: 'flatten', type: 'check', label: 'Lock answers (flatten) so they can’t be changed' },
      ];
    },
    async run(ctx) {
      const P = await PL(); const doc = await loadDoc(ctx.files[0].bytes); const form = doc.getForm(); const fields = form.getFields();
      for (const f of ctx.state.fields) {
        const fld = fields[f.i]; const v = ctx.values['f' + f.i]; if (!fld || f.readOnly) continue;
        try {
          if (fld instanceof P.PDFTextField) fld.setText(String(v ?? ''));
          else if (fld instanceof P.PDFCheckBox) v ? fld.check() : fld.uncheck();
          else if ((fld instanceof P.PDFDropdown || fld instanceof P.PDFOptionList) && v) fld.select(v);
          else if (fld instanceof P.PDFRadioGroup && v) fld.select(v);
        } catch (e) { throw new Error(`Couldn’t fill “${f.name}”: ${/WinAnsi/.test(e.message) ? 'this form’s font can’t show some of the characters you typed (e.g. Hindi). Use Add Text instead.' : e.message}`); }
      }
      try { form.updateFieldAppearances(); } catch { }
      if (ctx.values.flatten) form.flatten();
      return { files: [{ name: outName(ctx, 'filled'), blob: await saveDoc(doc) }] };
    },
  },

  'create-form': editorTool(['field-text', 'field-check', 'field-select', 'field-sign', 'text'], 'field-text', 'form', {
    action: 'Create form', actionIcon: 'text-cursor-input',
    options: [{ type: 'info', html: 'Draw boxes where people should type. Give each field a name below the page. Checkboxes and dropdowns work in every PDF reader.' }],
  }),

  'flatten-forms': { ...optimize['flatten-pdf'], action: 'Flatten form', options: [{ type: 'info', html: 'Filled answers become part of the page and can no longer be edited.' }], async run(ctx) { const doc = await optimize['flatten-pdf'].apply(ctx.files[0].bytes, { mode: 'forms' }); return { files: [{ name: outName(ctx, 'flattened'), blob: await saveDoc(doc) }] }; } },

  'extract-form-data': {
    accept: 'pdf', multiple: true, view: 'files', action: 'Export data', actionIcon: 'table-properties',
    options: [{ key: 'format', type: 'seg', label: 'Format', default: 'csv', options: [['csv', 'CSV (Excel)'], ['json', 'JSON']] }, { type: 'info', html: 'Add many filled copies of the same form to get one row per file.' }],
    async run(ctx) {
      const rows = []; const names = new Set();
      for (const f of ctx.files) { const fields = await readFields(f.bytes); const row = { file: f.name }; fields.forEach(x => { names.add(x.name); row[x.name] = typeof x.value === 'boolean' ? (x.value ? 'Yes' : 'No') : x.value; }); rows.push(row); }
      if (!names.size) throw new Error('No form fields were found.');
      const cols = ['file', ...names];
      const out = ctx.values.format === 'json' ? new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }) : new Blob(['﻿' + toCSV([cols, ...rows.map(r => cols.map(c => String(r[c] ?? '')))])], { type: 'text/csv;charset=utf-8' });
      const table = h('div.report-wrap', h('table.report', h('thead', h('tr', cols.map(c => h('th', esc(c))))), h('tbody', rows.slice(0, 50).map(r => h('tr', cols.map(c => h('td', esc(String(r[c] ?? '')))))))));
      return { files: [{ name: `form-data.${ctx.values.format}`, blob: out }], message: `${names.size} fields from ${rows.length} file${rows.length > 1 ? 's' : ''}.`, html: table };
    },
  },

  'date-stamp': editorTool(['date', 'initials', 'text'], 'date', 'dated', { options: [{ type: 'info', html: 'Tap <b>Date</b> and then the page. Tap the date to change its text or format. <b>Initials</b> lets you draw or type them once and reuse.' }] }),
  'stamps': editorTool(['stamp', 'date', 'text'], 'stamp', 'stamped', { options: [{ type: 'info', html: 'Tap on the page to place a stamp, then choose APPROVED, PAID, DRAFT… or type your own text. Change the colour below the page.' }] }),
};
