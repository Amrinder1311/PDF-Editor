# PDFDost — every PDF tool in one site

A complete, mobile-first PDF tools website with **155 tools**:
**112 work fully in the browser** (no server, files never leave the device) and
**43 server tools** whose pages, upload and options are already built — they
switch on as soon as you connect a backend (see `BACKEND.md`).

## Run it on your computer

**Option A — just double-click `index.html`.** It works offline, no installs.
(When opened this way it runs the bundled copy `dist/app.bundle.js`.)

**Option B — edit the code and see changes live (recommended while working):**

1. Open the `pdfsite` folder in **VS Code**.
2. Install the extension **Live Server** (by Ritwick Dey).
3. Right-click `index.html` → **Open with Live Server**.
4. Edit any file in `js/` or `css/` — the browser refreshes by itself.

### After editing files in `js/`

CSS changes show up everywhere straight away. JS changes show up straight away in
Live Server, but the **double-click version** uses `dist/app.bundle.js`, so rebuild it:

- Windows: double-click **`build-offline.bat`** (needs Node.js from nodejs.org, one time install)
- Mac/Linux: run `./build-offline.sh` (or `npm run build`)

> Offline note: OCR (Tesseract) downloads its language data from the internet the
> first time, and its worker can’t start from a double-clicked file — use Live Server
> or the hosted site for the two OCR tools. Everything else works fully offline.

## Put it online (free)

It is a static site — upload the whole folder to any of these:

- **Netlify**: drag the folder onto app.netlify.com/drop
- **Vercel / Cloudflare Pages / GitHub Pages**: deploy the folder as a static site (no build step)

## Change the name, colours or text

| What | Where |
|---|---|
| Site name, backend URL | `js/config.js` |
| Tool list, names, descriptions, categories, which are live/server | `js/data/tools.js` |
| Hindi / Punjabi interface text | `js/data/i18n.js` |
| Colours, fonts, spacing (light + dark) | `css/main.css` (top `:root` block) |
| Extra components (editor, options, mobile bar) | `css/app.css` |

## How it is organised

```
index.html            app shell (loads js/ on a server, dist/ when double-clicked)
dist/app.bundle.js    bundled copy of js/ for offline double-click use
build-offline.bat     rebuilds dist/ after you edit js/ (Windows)
css/main.css          design system (your original file, with system dark mode added)
css/app.css           tool workspace, editor, options, modals, mobile action bar
js/app.js             header, homepage, search, smart drop-zone, router
js/config.js          site name + API_BASE for Phase 2
js/data/tools.js      ALL tools (single source of truth)
js/core/toolpage.js   the one page template every tool uses
js/core/editor.js     touch-friendly page editor (sign, edit, redact, links, forms, crop, QR)
js/core/options.js    builds the options panel from a small schema
js/core/pdf.js        shared PDF helpers (pdf-lib + pdf.js)
js/tools/*.js         tool implementations, grouped by category
js/tools/server.js    options for the server tools (Phase 2)
vendor/               pdf-lib, pdf.js, JSZip, Tesseract, etc. (self-hosted, no CDN needed)
scripts/build-icons.mjs  rebuilds js/core/icons.js if you add icons
```

### Add a new tool

1. Add a row to the right group in `js/data/tools.js`.
2. Add its implementation to the matching file in `js/tools/` — an object with
   `accept`, `options`, and `run(ctx)` that returns `{ files: [{ name, blob }] }`.
   Copy any existing tool as a starting point.

## Notes

- **OCR** downloads its engine and language data (~10–20 MB) from the internet the
  first time, then caches it. Change the URLs in `js/config.js` to self-host.
- **SEO**: tool pages use `#/slug` URLs. For best Google ranking, a later step is
  to pre-render one HTML file per tool (e.g. `/merge-pdf/index.html`) with its own
  title and description.
- Libraries are open source (pdf-lib MIT, pdf.js Apache-2.0, Tesseract.js Apache-2.0,
  Lucide icons ISC, JSZip MIT/GPLv3, html2canvas MIT, heic2any MIT, UTIF MIT, jsQR Apache-2.0, JsBarcode MIT, SortableJS MIT, marked MIT).
