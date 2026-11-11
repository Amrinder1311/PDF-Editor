// ─────────────────────────────────────────────────────────────
//  Site configuration — change these values to rebrand the site
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  SITE_NAME: 'PDFDost',
  TAGLINE: 'Every PDF tool you need. Free, fast and private.',

  // Phase 2: set this to your backend URL (e.g. 'https://api.yoursite.com').
  // While it is empty, tools marked status:'server' show their full UI but
  // display a "launching soon" notice instead of processing.
  // See BACKEND.md for the request/response format every server tool uses.
  API_BASE: '',

  // Maximum file size (MB) before a warning is shown on phones
  MOBILE_WARN_MB: 100,

  // Tesseract (OCR) downloads its engine + language data from these URLs.
  // You can self-host them later for speed.
  TESSERACT_CORE: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0',
  TESSERACT_LANG: 'https://tessdata.projectnaptha.com/4.0.0',
};
