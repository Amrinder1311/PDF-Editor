# Phase 2 — connecting a backend

Every tool marked `status: 'server'` in `js/data/tools.js` already has its page,
upload area and options (`js/tools/server.js`). To make them work:

1. Build an API (Node/Express, Python/FastAPI… anything).
2. Set `API_BASE` in `js/config.js`, e.g. `'https://api.pdfdost.com'`.
3. Change the tool's `status` from `'server'` to `'live'` is **not** needed —
   server tools stay `'server'`; they just start working once `API_BASE` is set.

## Request (sent by the site)

```
POST {API_BASE}/api/tools/{slug}
Content-Type: multipart/form-data

files    = the uploaded file(s)   (field repeated for several files)
options  = JSON string of the options the user chose, e.g. {"pdfa":true,"orient":"auto"}
```

## Response (what your server returns)

- **A file**: return the file bytes with `Content-Type` and
  `Content-Disposition: attachment; filename="result.pdf"`. The site shows a Download button.
- **Text/HTML** (AI answers, reports): return JSON
  `{ "message": "short line", "text": "plain text" }` or `{ "html": "<p>…</p>" }`.
- **Errors**: any non-200 status; the response body text is shown to the user.

Allow CORS from your site's domain.

## Suggested engines

| Tools | Engine |
|---|---|
| Word / Excel / PowerPoint / ODT / RTF → PDF | LibreOffice (`soffice --headless --convert-to pdf`) or Gotenberg (Docker) |
| PDF → Word / Excel / PPT | pdf2docx (Python), or a paid API (ConvertAPI, CloudConvert, Adobe PDF Services) |
| Webpage → PDF | Gotenberg / Puppeteer (headless Chrome) |
| EPUB / MOBI | Calibre `ebook-convert` |
| PDF/A, PDF/X, linearize, deep compress, RGB→CMYK, versions | Ghostscript, qpdf; validate with veraPDF |
| Digital signatures (PFX) | pyHanko (Python) or node-signpdf |
| OCR Pro | OCRmyPDF (Tesseract) |
| AI tools | An LLM API (e.g. Claude) — keep the API key on the server only |

Delete uploaded files right after processing (or within 1 hour) to match the privacy promise on the site.
