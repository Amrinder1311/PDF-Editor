// Lazy library loader — heavy libraries load only on the tool pages that need them.
// vendor/ sits next to index.html (works for file:// and http:// alike)
const VENDOR = new URL('vendor/', document.baseURI).href;

const LIBS = {
  pdflib: ['pdf-lib.min.js', 'PDFLib'],
  pdfjs: ['pdfjs/pdf.min.js', 'pdfjsLib'],
  jszip: ['jszip.min.js', 'JSZip'],
  marked: ['marked.min.js', 'marked'],
  html2canvas: ['html2canvas.min.js', 'html2canvas'],
  qrcode: ['qrcode.js', 'qrcode'],
  jsbarcode: ['JsBarcode.all.min.js', 'JsBarcode'],
  jsqr: ['jsQR.js', 'jsQR'],
  heic2any: ['heic2any.min.js', 'heic2any'],
  utif: ['UTIF.js', 'UTIF'],
  sortable: ['Sortable.min.js', 'Sortable'],
  tesseract: ['tesseract/tesseract.min.js', 'Tesseract'],
};

const loading = {};
export function lib(name) {
  if (loading[name]) return loading[name];
  const [file, global] = LIBS[name];
  if (window[global]) return (loading[name] = Promise.resolve(window[global]));
  loading[name] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = VENDOR + file;
    s.async = true;
    s.onload = () => {
      const g = window[global];
      if (name === 'pdfjs') g.GlobalWorkerOptions.workerSrc = VENDOR + 'pdfjs/pdf.worker.min.js';
      resolve(g);
    };
    s.onerror = () => { delete loading[name]; reject(new Error(`Could not load ${name}. Check your internet connection.`)); };
    document.head.appendChild(s);
  });
  return loading[name];
}

export const libs = (...names) => Promise.all(names.map(lib));
export const vendorUrl = p => VENDOR + p;
