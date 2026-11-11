// ─────────────────────────────────────────────────────────────
//  tools.js — single source of truth for every tool on the site.
//  The homepage grid, search, category filters, smart drop-zone
//  suggestions and every tool page are generated from this list.
//
//  status: 'live'   → runs 100% in the browser (no server)
//          'server' → full UI ready; needs the backend (Phase 2).
//                     Flip to 'live' once your API handles it.
//  module: which file in /js/tools/ implements the tool.
// ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'all',          label: 'All Tools',        color: '#6366f1', icon: 'layout-grid' },
  { id: 'convert-to',   label: 'Convert to PDF',   color: '#0ea5e9', icon: 'file-input' },
  { id: 'convert-from', label: 'Convert from PDF', color: '#0891b2', icon: 'file-output' },
  { id: 'organize',     label: 'Organize',         color: '#8b5cf6', icon: 'layers' },
  { id: 'optimize',     label: 'Optimize',         color: '#d97706', icon: 'gauge' },
  { id: 'edit',         label: 'Edit',             color: '#059669', icon: 'pen-line' },
  { id: 'security',     label: 'Security',         color: '#dc2626', icon: 'shield' },
  { id: 'sign',         label: 'Sign & Forms',     color: '#db2777', icon: 'signature' },
  { id: 'extract',      label: 'Extract & View',   color: '#0d9488', icon: 'scan-search' },
  { id: 'ocr',          label: 'OCR & Scan',       color: '#ea580c', icon: 'scan-text' },
  { id: 'compare',      label: 'Compare & Review', color: '#65a30d', icon: 'git-compare' },
  { id: 'ai',           label: 'AI Tools',         color: '#9333ea', icon: 'sparkles' },
  { id: 'advanced',     label: 'Advanced',         color: '#475569', icon: 'settings-2' },
];

const L = 'live', S = 'server';
// t(slug, name, icon, description, keywords, status)
function group(category, module, rows) {
  return rows.map(([slug, name, icon, description, keywords, status = L]) => ({
    id: slug, slug, name, icon, description, category, module,
    keywords: keywords.split(',').map(k => k.trim()).filter(Boolean), status,
  }));
}

export const TOOLS = [
  ...group('convert-to', 'convert-to', [
    ['jpg-to-pdf', 'JPG to PDF', 'image', 'Turn JPG photos into a PDF. Reorder, set page size and margins.', 'jpg,jpeg,photo,picture,image to pdf'],
    ['png-to-pdf', 'PNG to PDF', 'image', 'Convert PNG images, screenshots and graphics into PDF.', 'png,screenshot,image,picture'],
    ['image-to-pdf', 'Image to PDF', 'images', 'Convert WEBP, GIF, BMP, SVG and any other image to PDF.', 'webp,gif,bmp,svg,ico,avif,image,photo'],
    ['heic-to-pdf', 'HEIC to PDF', 'smartphone', 'Convert iPhone HEIC/HEIF photos into a PDF.', 'heic,heif,iphone,apple,ios'],
    ['tiff-to-pdf', 'TIFF to PDF', 'file-image', 'Convert single or multi-page TIFF scans to PDF.', 'tiff,tif,fax,scan,multipage'],
    ['scan-to-pdf', 'Scan to PDF', 'camera', 'Use your phone camera to scan documents into a clean PDF.', 'scan,camera,capture,document,phone,cam scanner'],
    ['text-to-pdf', 'Text to PDF', 'file-type', 'Convert TXT files or typed text into a neat PDF.', 'txt,text,plain,notepad,type'],
    ['markdown-to-pdf', 'Markdown to PDF', 'hash', 'Render Markdown (README, notes) into a styled PDF.', 'md,markdown,readme,github,notes'],
    ['csv-to-pdf', 'CSV to PDF', 'sheet', 'Turn CSV data into a formatted PDF table.', 'csv,table,data,spreadsheet,excel'],
    ['html-to-pdf', 'HTML to PDF', 'code-xml', 'Convert an HTML file or pasted HTML code to PDF.', 'html,web page,code,website'],
    ['json-to-pdf', 'JSON / XML to PDF', 'braces', 'Pretty-print JSON or XML data into a readable PDF.', 'json,xml,data,api'],
    ['code-to-pdf', 'Code to PDF', 'file-code', 'Print source code to PDF with line numbers.', 'code,source,programming,js,python,java,c'],
    ['combine-files', 'Combine Files to PDF', 'files', 'Mix PDFs and images into one single PDF.', 'combine,mix,merge images and pdf,join'],
    ['word-to-pdf', 'Word to PDF', 'file-text', 'Convert Word DOC/DOCX documents to PDF.', 'word,docx,doc,microsoft,office', S],
    ['excel-to-pdf', 'Excel to PDF', 'sheet', 'Convert Excel XLS/XLSX spreadsheets to PDF.', 'excel,xlsx,xls,spreadsheet', S],
    ['ppt-to-pdf', 'PowerPoint to PDF', 'presentation', 'Convert PowerPoint PPT/PPTX slides to PDF.', 'ppt,pptx,powerpoint,slides', S],
    ['odt-to-pdf', 'OpenOffice to PDF', 'file-text', 'Convert ODT, ODS and ODP files to PDF.', 'odt,ods,odp,libreoffice,openoffice', S],
    ['rtf-to-pdf', 'RTF to PDF', 'file-text', 'Convert Rich Text Format documents to PDF.', 'rtf,rich text,wordpad', S],
    ['epub-to-pdf', 'EPUB to PDF', 'book-open', 'Convert EPUB e-books to PDF.', 'epub,ebook,book', S],
    ['mobi-to-pdf', 'MOBI to PDF', 'book', 'Convert Kindle MOBI/AZW3 books to PDF.', 'mobi,azw3,kindle,ebook', S],
    ['url-to-pdf', 'Webpage to PDF', 'globe', 'Save any website URL as a PDF.', 'url,website,webpage,link,save page', S],
    ['email-to-pdf', 'Email to PDF', 'mail', 'Convert EML and MSG email files to PDF.', 'eml,msg,email,outlook,gmail', S],
    ['cad-to-pdf', 'CAD to PDF', 'drafting-compass', 'Convert DWG and DXF drawings to PDF.', 'dwg,dxf,autocad,cad,drawing', S],
    ['ps-to-pdf', 'PostScript to PDF', 'printer', 'Convert PS and EPS files to PDF.', 'ps,eps,postscript', S],
    ['xps-to-pdf', 'XPS to PDF', 'file', 'Convert XPS/OXPS documents to PDF.', 'xps,oxps', S],
    ['iwork-to-pdf', 'Pages / Numbers / Keynote to PDF', 'apple', 'Convert Apple iWork files to PDF.', 'pages,numbers,keynote,apple,mac', S],
  ]),

  ...group('convert-from', 'convert-from', [
    ['pdf-to-jpg', 'PDF to JPG', 'image', 'Convert every PDF page into a high-quality JPG.', 'pdf to image,jpg,jpeg,photo,export'],
    ['pdf-to-png', 'PDF to PNG', 'image', 'Convert PDF pages into crisp PNG images.', 'png,image,screenshot'],
    ['pdf-to-webp', 'PDF to WEBP', 'image', 'Convert PDF pages into small WEBP images for the web.', 'webp,web image,small'],
    ['pdf-to-bmp', 'PDF to BMP', 'image', 'Convert PDF pages into BMP bitmap images.', 'bmp,bitmap,windows'],
    ['pdf-to-tiff', 'PDF to TIFF', 'file-image', 'Convert PDF into a multi-page TIFF file.', 'tiff,tif,fax,print'],
    ['pdf-to-svg', 'PDF to SVG', 'pen-tool', 'Convert PDF pages into scalable SVG vector files.', 'svg,vector,scalable,illustrator'],
    ['pdf-to-text', 'PDF to Text', 'file-type', 'Extract all text from a PDF into a TXT file.', 'txt,text,copy,plain'],
    ['pdf-to-html', 'PDF to HTML', 'code-xml', 'Convert PDF content into an HTML web page.', 'html,web,webpage'],
    ['pdf-to-markdown', 'PDF to Markdown', 'hash', 'Convert PDF text into Markdown with headings.', 'markdown,md,notes,obsidian,notion'],
    ['pdf-to-csv', 'PDF to CSV', 'sheet', 'Pull tables out of a PDF into CSV for Excel.', 'csv,table,excel,data'],
    ['pdf-to-json', 'PDF to JSON', 'braces', 'Export PDF text, positions and info as JSON.', 'json,data,api,developer'],
    ['pdf-to-xml', 'PDF to XML', 'code', 'Export PDF text and structure as XML.', 'xml,data,structured'],
    ['pdf-to-grayscale', 'PDF to Grayscale', 'contrast', 'Convert a color PDF to black & white to save ink.', 'grayscale,black and white,gray,bw,save ink'],
    ['pdf-to-audio', 'PDF to Audio', 'volume-2', 'Listen to your PDF read aloud.', 'audio,speech,read aloud,tts,listen,voice'],
    ['pdf-to-word', 'PDF to Word', 'file-text', 'Convert PDF into an editable Word document.', 'word,docx,doc,editable', S],
    ['pdf-to-excel', 'PDF to Excel', 'sheet', 'Convert PDF tables into an Excel spreadsheet.', 'excel,xlsx,spreadsheet', S],
    ['pdf-to-ppt', 'PDF to PowerPoint', 'presentation', 'Turn PDF pages into PowerPoint slides.', 'powerpoint,pptx,slides', S],
    ['pdf-to-epub', 'PDF to EPUB', 'book-open', 'Convert PDF into an EPUB e-book.', 'epub,ebook,kindle', S],
    ['pdf-to-rtf', 'PDF to RTF', 'file-text', 'Convert PDF into a Rich Text document.', 'rtf,rich text', S],
    ['pdf-to-odt', 'PDF to ODT', 'file-text', 'Convert PDF into an OpenDocument text file.', 'odt,libreoffice', S],
    ['pdf-to-pdfa', 'PDF to PDF/A', 'archive', 'Convert to PDF/A for long-term archiving.', 'pdfa,pdf/a,archive,iso', S],
    ['pdf-to-pdfx', 'PDF to PDF/X', 'printer', 'Convert to PDF/X for professional printing.', 'pdfx,pdf/x,print,press', S],
  ]),

  ...group('organize', 'organize', [
    ['merge-pdf', 'Merge PDF', 'combine', 'Combine multiple PDFs into one file in any order.', 'merge,combine,join,append,together'],
    ['split-pdf', 'Split PDF', 'scissors', 'Split a PDF by page ranges, every N pages or by size.', 'split,divide,separate,cut,break'],
    ['extract-pages', 'Extract Pages', 'file-output', 'Pick the pages you want and save them as a new PDF.', 'extract,select,pick,save pages'],
    ['delete-pages', 'Delete Pages', 'trash-2', 'Remove unwanted pages from a PDF.', 'delete,remove,drop pages'],
    ['rearrange-pages', 'Rearrange Pages', 'move', 'Drag and drop pages into a new order.', 'reorder,arrange,sort,move pages,organize'],
    ['rotate-pdf', 'Rotate PDF', 'rotate-cw', 'Rotate all pages or just the ones you choose.', 'rotate,turn,landscape,portrait,orientation'],
    ['insert-pages', 'Insert Pages', 'file-plus-2', 'Insert pages from another PDF at any position.', 'insert,add pages,append,prepend'],
    ['insert-blank', 'Insert Blank Page', 'file-plus', 'Add blank pages anywhere in a PDF.', 'blank,empty page,add page'],
    ['duplicate-pages', 'Duplicate Pages', 'copy', 'Make copies of selected pages.', 'duplicate,copy,clone,repeat'],
    ['reverse-pdf', 'Reverse Page Order', 'arrow-down-up', 'Flip the page order from last to first.', 'reverse,backwards,flip order'],
    ['alternate-mix', 'Alternate & Mix', 'shuffle', 'Interleave pages of two PDFs (great for odd/even scans).', 'alternate,interleave,odd even,duplex,mix'],
    ['n-up', 'N-up (Pages per Sheet)', 'layout-grid', 'Put 2, 4, 6, 8 or 9 pages on one sheet.', 'n-up,2 up,4 up,pages per sheet,handout'],
    ['booklet-maker', 'Booklet Maker', 'book-open', 'Arrange pages to print and fold as a booklet.', 'booklet,saddle stitch,fold,print,zine'],
    ['split-half', 'Split Pages in Half', 'columns-2', 'Split double-page scans into single pages.', 'split half,two pages,book scan,spread'],
  ]),

  ...group('optimize', 'optimize', [
    ['compress-pdf', 'Compress PDF', 'shrink', 'Make your PDF smaller while keeping good quality.', 'compress,reduce size,shrink,smaller,optimize,kb,mb'],
    ['reduce-size', 'Reduce PDF to Size', 'target', 'Shrink a PDF to a target size like 100 KB or 1 MB.', 'reduce to 100kb,200kb,500kb,1mb,target size,upload limit,form'],
    ['optimize-images', 'Optimize PDF Images', 'image-down', 'Recompress and downscale images inside a PDF.', 'images,photos,recompress,downscale,dpi'],
    ['flatten-pdf', 'Flatten PDF', 'layers-2', 'Flatten forms and annotations so they can’t be changed.', 'flatten,lock,annotations,forms,print'],
    ['remove-objects', 'Clean Up PDF', 'sparkle', 'Remove unused objects, thumbnails and junk data.', 'clean,unused objects,garbage,slim'],
    ['repair-pdf', 'Repair PDF', 'wrench', 'Try to fix a damaged or corrupted PDF.', 'repair,fix,corrupt,broken,recover,damaged'],
    ['linearize-pdf', 'Fast Web View', 'zap', 'Linearize a PDF so it opens instantly online.', 'linearize,fast web view,web optimize', S],
    ['deep-compress', 'Deep Compress (Pro)', 'archive', 'Maximum server-side compression for very large files.', 'large file,deep compress,ghostscript', S],
  ]),

  ...group('edit', 'edit', [
    ['edit-pdf', 'Edit PDF', 'file-pen-line', 'Add text, images, shapes, highlights and drawings.', 'edit,editor,annotate,write on pdf,modify'],
    ['add-text', 'Add Text to PDF', 'type', 'Type text anywhere on a PDF page.', 'add text,type on pdf,write,typewriter'],
    ['add-image', 'Add Image to PDF', 'image-plus', 'Place a photo or logo on any page.', 'add image,logo,picture,photo,insert image'],
    ['add-shapes', 'Add Shapes & Arrows', 'shapes', 'Draw rectangles, circles, lines and arrows.', 'shapes,arrow,rectangle,circle,line'],
    ['highlight-pdf', 'Highlight PDF', 'highlighter', 'Highlight important parts of a PDF.', 'highlight,marker,yellow,mark'],
    ['draw-pdf', 'Draw on PDF', 'brush', 'Draw freehand with your finger, pen or mouse.', 'draw,freehand,pen,sketch,scribble'],
    ['annotate-pdf', 'Comments & Notes', 'sticky-note', 'Add sticky-note comments to a PDF.', 'comment,note,sticky,review,annotation'],
    ['whiteout-pdf', 'Whiteout PDF', 'eraser', 'Cover up content with white boxes.', 'whiteout,erase,hide,cover,correction'],
    ['crop-pdf', 'Crop PDF', 'crop', 'Crop pages to a selected area.', 'crop,trim,cut margins,area'],
    ['resize-pages', 'Resize Pages', 'scaling', 'Change page size to A4, Letter, Legal and more.', 'resize,a4,letter,legal,page size,scale'],
    ['change-margins', 'Add Margins', 'square-dashed', 'Add white margins around every page.', 'margins,border,padding,binding,gutter'],
    ['page-numbers', 'Add Page Numbers', 'list-ordered', 'Number your pages with custom style and position.', 'page numbers,numbering,paginate,footer'],
    ['header-footer', 'Header & Footer', 'panel-top', 'Add headers and footers with date, page and file name.', 'header,footer,running title,date'],
    ['watermark', 'Add Watermark', 'stamp', 'Stamp text or a logo over your PDF.', 'watermark,confidential,draft,logo,stamp'],
    ['remove-watermark', 'Remove Watermark', 'eraser', 'Remove watermark annotations and watermark artifacts.', 'remove watermark,delete watermark,clean'],
    ['background-color', 'Page Background', 'paint-bucket', 'Add a background color or image behind pages.', 'background,color,paper,tint'],
    ['bates-numbering', 'Bates Numbering', 'gavel', 'Add Bates numbers for legal documents.', 'bates,legal,court,exhibit,numbering'],
    ['add-hyperlinks', 'Add Links', 'link', 'Make areas clickable — links to websites or pages.', 'link,hyperlink,url,clickable'],
    ['bookmarks', 'Edit Bookmarks', 'bookmark', 'Add or edit the bookmarks (outline) of a PDF.', 'bookmarks,outline,navigation,chapters'],
    ['table-of-contents', 'Table of Contents', 'list-tree', 'Create a clickable table of contents page.', 'toc,table of contents,index,chapters'],
    ['edit-metadata', 'Edit Metadata', 'info', 'Change title, author, subject and keywords.', 'metadata,properties,title,author,keywords'],
    ['dark-mode-pdf', 'Dark Mode PDF', 'moon', 'Invert colors for comfortable night reading.', 'dark mode,invert,night,black background'],
    ['find-replace', 'Find & Replace Text', 'replace', 'Find words and replace them visually.', 'find,replace,change text,search replace'],
    ['full-text-edit', 'Edit Existing Text (Pro)', 'text-cursor-input', 'Edit the original text of a PDF like a Word file.', 'edit text,change words,modify text', S],
    ['change-fonts', 'Change / Embed Fonts', 'case-sensitive', 'Replace or embed fonts in a PDF.', 'fonts,embed fonts,font replace', S],
  ]),

  ...group('security', 'security', [
    ['protect-pdf', 'Protect PDF', 'lock', 'Add a password with strong AES-256 encryption.', 'password,protect,encrypt,lock,secure'],
    ['unlock-pdf', 'Unlock PDF', 'lock-open', 'Remove the password from a PDF you can open.', 'unlock,remove password,decrypt'],
    ['pdf-permissions', 'Set Permissions', 'shield-check', 'Block printing, copying or editing.', 'permissions,restrict,no print,no copy'],
    ['redact-pdf', 'Redact PDF', 'square', 'Permanently black out sensitive information.', 'redact,black out,censor,hide,private'],
    ['auto-redact', 'Auto Redact', 'scan-eye', 'Find and redact emails, phone, Aadhaar, PAN and card numbers.', 'auto redact,aadhaar,pan,phone,email,credit card,gdpr'],
    ['remove-metadata', 'Sanitize PDF', 'shield-off', 'Remove metadata, hidden data, scripts and attachments.', 'remove metadata,sanitize,privacy,hidden data,clean'],
    ['digital-sign', 'Digital Certificate Signature', 'badge-check', 'Sign with a certificate (PFX/P12) for legal validity.', 'digital signature,certificate,dsc,pfx,p12', S],
    ['verify-sign', 'Verify Signature', 'shield-check', 'Check whether a PDF signature is valid.', 'verify,validate signature,check', S],
  ]),

  ...group('sign', 'sign', [
    ['sign-pdf', 'Sign PDF', 'signature', 'Draw, type or upload your signature and place it.', 'sign,signature,esign,autograph,initials'],
    ['fill-forms', 'Fill PDF Forms', 'clipboard-pen-line', 'Fill in PDF form fields and save.', 'fill,form,fields,application'],
    ['create-form', 'Create Fillable Form', 'text-cursor-input', 'Add text boxes, checkboxes and dropdowns.', 'create form,fillable,fields,checkbox,dropdown'],
    ['flatten-forms', 'Flatten Form', 'square-check', 'Lock filled form fields into the page.', 'flatten form,lock form,finalize'],
    ['extract-form-data', 'Export Form Data', 'table-properties', 'Export form field values to CSV or JSON.', 'form data,export,csv,json'],
    ['date-stamp', 'Date & Initials', 'calendar-check', 'Add today’s date and your initials to pages.', 'date,initials,stamp,today'],
    ['stamps', 'Add Stamp', 'stamp', 'Stamp APPROVED, PAID, DRAFT, CONFIDENTIAL and more.', 'stamp,approved,paid,draft,confidential,rejected'],
    ['request-signatures', 'Request Signatures', 'send', 'Send a PDF to others to sign, with reminders.', 'request signature,send for signing,esign workflow', S],
  ]),

  ...group('extract', 'extract', [
    ['pdf-viewer', 'PDF Viewer', 'book-open-text', 'Open and read any PDF with zoom and search.', 'view,open,read,viewer,reader'],
    ['extract-text', 'Extract Text', 'text', 'Copy all text out of a PDF.', 'extract text,copy,text'],
    ['extract-images', 'Extract Images', 'images', 'Save all images embedded in a PDF.', 'extract images,save pictures,photos'],
    ['extract-tables', 'Extract Tables', 'table', 'Detect tables and export them to CSV.', 'tables,extract table,csv,data'],
    ['extract-links', 'Extract Links', 'link-2', 'List every link and URL in a PDF.', 'links,urls,hyperlinks,extract'],
    ['extract-fonts', 'List Fonts', 'case-sensitive', 'See all fonts used and whether they are embedded.', 'fonts,font list,embedded'],
    ['extract-attachments', 'Extract Attachments', 'paperclip', 'Download files attached inside a PDF.', 'attachments,embedded files'],
    ['extract-metadata', 'View Metadata', 'info', 'See title, author, dates and XMP metadata.', 'metadata,properties,info'],
    ['word-counter', 'Page & Word Counter', 'calculator', 'Count pages, words and characters.', 'word count,page count,characters,count'],
    ['pdf-inspector', 'PDF Inspector', 'search-code', 'See version, page sizes, fonts, encryption and more.', 'inspect,info,analyze,details,version'],
  ]),

  ...group('ocr', 'ocr', [
    ['ocr-pdf', 'OCR PDF', 'scan-text', 'Make scanned PDFs searchable (English, Hindi, Punjabi, +).', 'ocr,searchable,scanned,recognize text,hindi,punjabi'],
    ['ocr-image', 'Image to Text', 'scan-text', 'Pull text out of photos and screenshots.', 'ocr,image to text,photo text,extract text from image'],
    ['deskew-pdf', 'Straighten Scans', 'ruler', 'Auto-straighten tilted scanned pages.', 'deskew,straighten,tilt,crooked'],
    ['clean-scan', 'Clean Up Scan', 'sparkles', 'Remove noise, whiten background, boost contrast.', 'clean,noise,whiten,enhance scan,contrast'],
    ['auto-crop', 'Auto Crop', 'crop', 'Trim empty borders around page content.', 'auto crop,trim borders,whitespace'],
    ['remove-blank-pages', 'Remove Blank Pages', 'file-x', 'Find and delete empty pages automatically.', 'blank pages,empty,remove'],
    ['ocr-pro', 'OCR Pro (Fast & Large)', 'scan-line', 'Server OCR for huge scans with higher accuracy.', 'ocr pro,large,accurate', S],
  ]),

  ...group('compare', 'compare', [
    ['compare-pdf', 'Compare PDFs', 'git-compare', 'Highlight text and visual differences between two PDFs.', 'compare,diff,difference,changes,versions'],
    ['side-by-side', 'Side-by-Side Viewer', 'columns-2', 'View two PDFs next to each other with synced scroll.', 'side by side,two pdf,parallel'],
    ['export-comments', 'Export Comments', 'message-square-text', 'Export all comments and highlights to CSV/TXT.', 'comments,annotations,export,review'],
    ['accessibility-check', 'Accessibility Checker', 'accessibility', 'Check a PDF for common accessibility problems.', 'accessibility,a11y,pdf/ua,screen reader,wcag'],
    ['accessibility-tagging', 'Make PDF Accessible', 'accessibility', 'Auto-tag a PDF for screen readers.', 'tagging,pdf/ua,accessible', S],
  ]),

  ...group('ai', 'ai', [
    ['ai-chat', 'Chat with PDF', 'message-circle', 'Ask questions and get answers from your PDF.', 'chat,ask,question,ai,gpt,claude', S],
    ['ai-summarize', 'Summarize PDF', 'sparkles', 'Get a short summary of any PDF.', 'summary,summarize,tldr,ai', S],
    ['ai-translate', 'Translate PDF', 'languages', 'Translate a PDF into Hindi, Punjabi and 100+ languages.', 'translate,hindi,punjabi,language', S],
    ['ai-quiz', 'PDF to Quiz', 'circle-help', 'Make quizzes and flashcards from study material.', 'quiz,flashcards,mcq,study,exam', S],
    ['ai-keypoints', 'Key Points & Notes', 'list-checks', 'Pull out key points and notes.', 'key points,notes,highlights,ai', S],
    ['ai-rewrite', 'Rewrite / Paraphrase', 'refresh-cw', 'Rewrite PDF text in simpler words.', 'rewrite,paraphrase,simplify', S],
    ['ai-resume', 'Resume Parser', 'contact', 'Extract details from resumes/CVs.', 'resume,cv,parse,hr', S],
    ['ai-invoice', 'Invoice Data Extractor', 'receipt-text', 'Pull invoice numbers, totals and GST.', 'invoice,bill,gst,extract,accounting', S],
    ['ai-generate', 'Generate PDF with AI', 'wand-sparkles', 'Describe a document and get a PDF.', 'generate,create,ai,write', S],
  ]),

  ...group('advanced', 'advanced', [
    ['batch-process', 'Batch Processing', 'boxes', 'Apply a tool to many PDFs at once.', 'batch,bulk,many files,multiple'],
    ['workflow-builder', 'Workflow Builder', 'workflow', 'Chain tools: e.g. Merge → Number → Compress → Protect.', 'workflow,chain,automation,pipeline'],
    ['attach-files', 'Attach Files to PDF', 'paperclip', 'Embed any files inside a PDF.', 'attach,embed file,attachment'],
    ['remove-attachments', 'Remove Attachments', 'paperclip', 'Delete embedded files from a PDF.', 'remove attachments,delete embedded'],
    ['manage-layers', 'Manage Layers', 'layers', 'Show or hide PDF layers (OCG).', 'layers,ocg,optional content,cad'],
    ['add-qr-code', 'Add QR Code / Barcode', 'qr-code', 'Generate a QR code or barcode and place it on pages.', 'qr code,barcode,generate,code128,upi'],
    ['read-qr-code', 'Read QR Code / Barcode', 'scan-qr-code', 'Find and decode QR codes and barcodes in a PDF.', 'scan qr,read barcode,decode'],
    ['create-blank-pdf', 'Create Blank PDF', 'file-plus', 'Make blank, lined, grid or dotted paper PDFs.', 'blank pdf,lined paper,grid,dotted,notebook'],
    ['pdf-templates', 'PDF Templates', 'layout-template', 'Create an invoice, certificate, resume or letter.', 'template,invoice,certificate,resume,letter,bill'],
    ['pdfa-validate', 'PDF/A Validator', 'badge-check', 'Validate PDF/A compliance.', 'pdfa,validate,compliance', S],
    ['print-preflight', 'Print Preflight', 'printer-check', 'Check bleed, fonts and colors before printing.', 'preflight,print,bleed,cmyk', S],
    ['rgb-to-cmyk', 'RGB to CMYK', 'palette', 'Convert colors to CMYK for print.', 'cmyk,rgb,print,color', S],
    ['pdf-version', 'Change PDF Version', 'git-branch', 'Convert to PDF 1.4, 1.7 or 2.0.', 'version,1.4,1.7,2.0,compatibility', S],
  ]),
];

export const POPULAR = ['merge-pdf', 'compress-pdf', 'split-pdf', 'jpg-to-pdf', 'pdf-to-jpg', 'sign-pdf', 'edit-pdf', 'protect-pdf'];

export const catById = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
export const toolBySlug = Object.fromEntries(TOOLS.map(t => [t.slug, t]));

export function searchTools(query, limit = 12) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  const words = q.split(/\s+/);
  const scored = [];
  for (const t of TOOLS) {
    const name = t.name.toLowerCase();
    const hay = `${name} ${t.description.toLowerCase()} ${t.keywords.join(' ')} ${catById[t.category].label.toLowerCase()}`;
    if (!words.every(w => hay.includes(w))) continue;
    let s = 0;
    if (name === q) s += 100;
    if (name.startsWith(q)) s += 50;
    if (name.includes(q)) s += 25;
    if (t.keywords.some(k => k.startsWith(q))) s += 15;
    if (t.status === 'live') s += 5;
    scored.push([s, t]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map(x => x[1]);
}

// Smart drop-zone: which tools fit a given file extension
const FILE_MAP = {
  pdf: ['compress-pdf', 'merge-pdf', 'split-pdf', 'edit-pdf', 'sign-pdf', 'pdf-to-jpg', 'rotate-pdf', 'delete-pages', 'page-numbers', 'watermark', 'protect-pdf', 'unlock-pdf', 'ocr-pdf', 'pdf-to-text', 'pdf-to-word', 'reduce-size', 'ai-summarize'],
  jpg: ['jpg-to-pdf', 'ocr-image', 'combine-files'], jpeg: ['jpg-to-pdf', 'ocr-image', 'combine-files'],
  png: ['png-to-pdf', 'ocr-image', 'combine-files'], webp: ['image-to-pdf', 'ocr-image'], gif: ['image-to-pdf'],
  bmp: ['image-to-pdf', 'ocr-image'], svg: ['image-to-pdf'], avif: ['image-to-pdf'],
  heic: ['heic-to-pdf'], heif: ['heic-to-pdf'], tif: ['tiff-to-pdf'], tiff: ['tiff-to-pdf'],
  txt: ['text-to-pdf'], md: ['markdown-to-pdf'], markdown: ['markdown-to-pdf'], csv: ['csv-to-pdf'],
  html: ['html-to-pdf'], htm: ['html-to-pdf'], json: ['json-to-pdf'], xml: ['json-to-pdf'],
  js: ['code-to-pdf'], ts: ['code-to-pdf'], py: ['code-to-pdf'], java: ['code-to-pdf'], c: ['code-to-pdf'], cpp: ['code-to-pdf'], css: ['code-to-pdf'], php: ['code-to-pdf'],
  doc: ['word-to-pdf'], docx: ['word-to-pdf'], xls: ['excel-to-pdf'], xlsx: ['excel-to-pdf'],
  ppt: ['ppt-to-pdf'], pptx: ['ppt-to-pdf'], odt: ['odt-to-pdf'], ods: ['odt-to-pdf'], odp: ['odt-to-pdf'],
  rtf: ['rtf-to-pdf'], epub: ['epub-to-pdf'], mobi: ['mobi-to-pdf'], azw3: ['mobi-to-pdf'],
  eml: ['email-to-pdf'], msg: ['email-to-pdf'], dwg: ['cad-to-pdf'], dxf: ['cad-to-pdf'],
  ps: ['ps-to-pdf'], eps: ['ps-to-pdf'], xps: ['xps-to-pdf'], oxps: ['xps-to-pdf'],
  pages: ['iwork-to-pdf'], numbers: ['iwork-to-pdf'], key: ['iwork-to-pdf'],
};
export function suggestForFile(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  return (FILE_MAP[ext] || []).map(s => toolBySlug[s]).filter(Boolean);
}

// "Continue with" suggestions after a tool finishes
export function nextTools(slug) {
  const common = ['compress-pdf', 'merge-pdf', 'sign-pdf', 'protect-pdf', 'page-numbers', 'watermark', 'split-pdf', 'edit-pdf'];
  return common.filter(s => s !== slug).slice(0, 6).map(s => toolBySlug[s]);
}
