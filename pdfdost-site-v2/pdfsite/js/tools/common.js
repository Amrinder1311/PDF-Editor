// Shared helpers for tool implementations
import { loadDoc, saveDoc, PL, openPdf } from '../core/pdf.js';
import { baseName } from '../core/ui.js';

export const outName = (ctx, suffix, ext = 'pdf', i = 0) => `${baseName(ctx.files[i]?.name || 'document')}${suffix ? '-' + suffix : ''}.${ext}`;
export const docOf = (ctx, i = 0) => loadDoc(ctx.files[i].bytes);

export async function pdfResult(ctx, doc, suffix, extra = {}) {
  const blob = doc instanceof Blob ? doc : await saveDoc(doc);
  return { files: [{ name: extra.name || outName(ctx, suffix), blob }], ...extra };
}

// Wrap a single-file transform (bytes → pdf-lib doc) so it can be reused by
// the tool page, Batch Processing and the Workflow Builder.
export function single(def) {
  return {
    accept: 'pdf',
    ...def,
    async run(ctx) {
      const doc = await def.apply(ctx.files[0].bytes, ctx.values, ctx.progress, ctx);
      const blob = doc instanceof Blob ? doc : await saveDoc(doc);
      return { files: [{ name: outName(ctx, def.suffix), blob }], ...(def.showStats ? { stats: { before: ctx.files[0].size, after: blob.size } } : {}) };
    },
  };
}

export { loadDoc, saveDoc, PL, openPdf };
