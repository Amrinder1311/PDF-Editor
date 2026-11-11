(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __glob = (map) => (path) => {
    var fn = map[path];
    if (fn) return fn();
    throw new Error("Module not found in bundle: " + path);
  };
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // js/config.js
  var CONFIG;
  var init_config = __esm({
    "js/config.js"() {
      CONFIG = {
        SITE_NAME: "PDFDost",
        TAGLINE: "Every PDF tool you need. Free, fast and private.",
        // Phase 2: set this to your backend URL (e.g. 'https://api.yoursite.com').
        // While it is empty, tools marked status:'server' show their full UI but
        // display a "launching soon" notice instead of processing.
        // See BACKEND.md for the request/response format every server tool uses.
        API_BASE: "",
        // Maximum file size (MB) before a warning is shown on phones
        MOBILE_WARN_MB: 100,
        // Tesseract (OCR) downloads its engine + language data from these URLs.
        // You can self-host them later for speed.
        TESSERACT_CORE: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0",
        TESSERACT_LANG: "https://tessdata.projectnaptha.com/4.0.0"
      };
    }
  });

  // js/data/tools.js
  function group(category, module, rows) {
    return rows.map(([slug, name, icon, description, keywords, status = L]) => ({
      id: slug,
      slug,
      name,
      icon,
      description,
      category,
      module,
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      status
    }));
  }
  function searchTools(query, limit2 = 12) {
    const q = (query || "").toLowerCase().trim();
    if (!q) return [];
    const words2 = q.split(/\s+/);
    const scored = [];
    for (const t2 of TOOLS) {
      const name = t2.name.toLowerCase();
      const hay = `${name} ${t2.description.toLowerCase()} ${t2.keywords.join(" ")} ${catById[t2.category].label.toLowerCase()}`;
      if (!words2.every((w) => hay.includes(w))) continue;
      let s = 0;
      if (name === q) s += 100;
      if (name.startsWith(q)) s += 50;
      if (name.includes(q)) s += 25;
      if (t2.keywords.some((k) => k.startsWith(q))) s += 15;
      if (t2.status === "live") s += 5;
      scored.push([s, t2]);
    }
    return scored.sort((a, b) => b[0] - a[0]).slice(0, limit2).map((x) => x[1]);
  }
  function suggestForFile(name) {
    const ext = (name.split(".").pop() || "").toLowerCase();
    return (FILE_MAP[ext] || []).map((s) => toolBySlug[s]).filter(Boolean);
  }
  function nextTools(slug) {
    const common = ["compress-pdf", "merge-pdf", "sign-pdf", "protect-pdf", "page-numbers", "watermark", "split-pdf", "edit-pdf"];
    return common.filter((s) => s !== slug).slice(0, 6).map((s) => toolBySlug[s]);
  }
  var CATEGORIES, L, S, TOOLS, POPULAR, catById, toolBySlug, FILE_MAP;
  var init_tools = __esm({
    "js/data/tools.js"() {
      CATEGORIES = [
        { id: "all", label: "All Tools", color: "#6366f1", icon: "layout-grid" },
        { id: "convert-to", label: "Convert to PDF", color: "#0ea5e9", icon: "file-input" },
        { id: "convert-from", label: "Convert from PDF", color: "#0891b2", icon: "file-output" },
        { id: "organize", label: "Organize", color: "#8b5cf6", icon: "layers" },
        { id: "optimize", label: "Optimize", color: "#d97706", icon: "gauge" },
        { id: "edit", label: "Edit", color: "#059669", icon: "pen-line" },
        { id: "security", label: "Security", color: "#dc2626", icon: "shield" },
        { id: "sign", label: "Sign & Forms", color: "#db2777", icon: "signature" },
        { id: "extract", label: "Extract & View", color: "#0d9488", icon: "scan-search" },
        { id: "ocr", label: "OCR & Scan", color: "#ea580c", icon: "scan-text" },
        { id: "compare", label: "Compare & Review", color: "#65a30d", icon: "git-compare" },
        { id: "ai", label: "AI Tools", color: "#9333ea", icon: "sparkles" },
        { id: "advanced", label: "Advanced", color: "#475569", icon: "settings-2" }
      ];
      L = "live";
      S = "server";
      TOOLS = [
        ...group("convert-to", "convert-to", [
          ["jpg-to-pdf", "JPG to PDF", "image", "Turn JPG photos into a PDF. Reorder, set page size and margins.", "jpg,jpeg,photo,picture,image to pdf"],
          ["png-to-pdf", "PNG to PDF", "image", "Convert PNG images, screenshots and graphics into PDF.", "png,screenshot,image,picture"],
          ["image-to-pdf", "Image to PDF", "images", "Convert WEBP, GIF, BMP, SVG and any other image to PDF.", "webp,gif,bmp,svg,ico,avif,image,photo"],
          ["heic-to-pdf", "HEIC to PDF", "smartphone", "Convert iPhone HEIC/HEIF photos into a PDF.", "heic,heif,iphone,apple,ios"],
          ["tiff-to-pdf", "TIFF to PDF", "file-image", "Convert single or multi-page TIFF scans to PDF.", "tiff,tif,fax,scan,multipage"],
          ["scan-to-pdf", "Scan to PDF", "camera", "Use your phone camera to scan documents into a clean PDF.", "scan,camera,capture,document,phone,cam scanner"],
          ["text-to-pdf", "Text to PDF", "file-type", "Convert TXT files or typed text into a neat PDF.", "txt,text,plain,notepad,type"],
          ["markdown-to-pdf", "Markdown to PDF", "hash", "Render Markdown (README, notes) into a styled PDF.", "md,markdown,readme,github,notes"],
          ["csv-to-pdf", "CSV to PDF", "sheet", "Turn CSV data into a formatted PDF table.", "csv,table,data,spreadsheet,excel"],
          ["html-to-pdf", "HTML to PDF", "code-xml", "Convert an HTML file or pasted HTML code to PDF.", "html,web page,code,website"],
          ["json-to-pdf", "JSON / XML to PDF", "braces", "Pretty-print JSON or XML data into a readable PDF.", "json,xml,data,api"],
          ["code-to-pdf", "Code to PDF", "file-code", "Print source code to PDF with line numbers.", "code,source,programming,js,python,java,c"],
          ["combine-files", "Combine Files to PDF", "files", "Mix PDFs and images into one single PDF.", "combine,mix,merge images and pdf,join"],
          ["word-to-pdf", "Word to PDF", "file-text", "Convert Word DOC/DOCX documents to PDF.", "word,docx,doc,microsoft,office", S],
          ["excel-to-pdf", "Excel to PDF", "sheet", "Convert Excel XLS/XLSX spreadsheets to PDF.", "excel,xlsx,xls,spreadsheet", S],
          ["ppt-to-pdf", "PowerPoint to PDF", "presentation", "Convert PowerPoint PPT/PPTX slides to PDF.", "ppt,pptx,powerpoint,slides", S],
          ["odt-to-pdf", "OpenOffice to PDF", "file-text", "Convert ODT, ODS and ODP files to PDF.", "odt,ods,odp,libreoffice,openoffice", S],
          ["rtf-to-pdf", "RTF to PDF", "file-text", "Convert Rich Text Format documents to PDF.", "rtf,rich text,wordpad", S],
          ["epub-to-pdf", "EPUB to PDF", "book-open", "Convert EPUB e-books to PDF.", "epub,ebook,book", S],
          ["mobi-to-pdf", "MOBI to PDF", "book", "Convert Kindle MOBI/AZW3 books to PDF.", "mobi,azw3,kindle,ebook", S],
          ["url-to-pdf", "Webpage to PDF", "globe", "Save any website URL as a PDF.", "url,website,webpage,link,save page", S],
          ["email-to-pdf", "Email to PDF", "mail", "Convert EML and MSG email files to PDF.", "eml,msg,email,outlook,gmail", S],
          ["cad-to-pdf", "CAD to PDF", "drafting-compass", "Convert DWG and DXF drawings to PDF.", "dwg,dxf,autocad,cad,drawing", S],
          ["ps-to-pdf", "PostScript to PDF", "printer", "Convert PS and EPS files to PDF.", "ps,eps,postscript", S],
          ["xps-to-pdf", "XPS to PDF", "file", "Convert XPS/OXPS documents to PDF.", "xps,oxps", S],
          ["iwork-to-pdf", "Pages / Numbers / Keynote to PDF", "apple", "Convert Apple iWork files to PDF.", "pages,numbers,keynote,apple,mac", S]
        ]),
        ...group("convert-from", "convert-from", [
          ["pdf-to-jpg", "PDF to JPG", "image", "Convert every PDF page into a high-quality JPG.", "pdf to image,jpg,jpeg,photo,export"],
          ["pdf-to-png", "PDF to PNG", "image", "Convert PDF pages into crisp PNG images.", "png,image,screenshot"],
          ["pdf-to-webp", "PDF to WEBP", "image", "Convert PDF pages into small WEBP images for the web.", "webp,web image,small"],
          ["pdf-to-bmp", "PDF to BMP", "image", "Convert PDF pages into BMP bitmap images.", "bmp,bitmap,windows"],
          ["pdf-to-tiff", "PDF to TIFF", "file-image", "Convert PDF into a multi-page TIFF file.", "tiff,tif,fax,print"],
          ["pdf-to-svg", "PDF to SVG", "pen-tool", "Convert PDF pages into scalable SVG vector files.", "svg,vector,scalable,illustrator"],
          ["pdf-to-text", "PDF to Text", "file-type", "Extract all text from a PDF into a TXT file.", "txt,text,copy,plain"],
          ["pdf-to-html", "PDF to HTML", "code-xml", "Convert PDF content into an HTML web page.", "html,web,webpage"],
          ["pdf-to-markdown", "PDF to Markdown", "hash", "Convert PDF text into Markdown with headings.", "markdown,md,notes,obsidian,notion"],
          ["pdf-to-csv", "PDF to CSV", "sheet", "Pull tables out of a PDF into CSV for Excel.", "csv,table,excel,data"],
          ["pdf-to-json", "PDF to JSON", "braces", "Export PDF text, positions and info as JSON.", "json,data,api,developer"],
          ["pdf-to-xml", "PDF to XML", "code", "Export PDF text and structure as XML.", "xml,data,structured"],
          ["pdf-to-grayscale", "PDF to Grayscale", "contrast", "Convert a color PDF to black & white to save ink.", "grayscale,black and white,gray,bw,save ink"],
          ["pdf-to-audio", "PDF to Audio", "volume-2", "Listen to your PDF read aloud.", "audio,speech,read aloud,tts,listen,voice"],
          ["pdf-to-word", "PDF to Word", "file-text", "Convert PDF into an editable Word document.", "word,docx,doc,editable", S],
          ["pdf-to-excel", "PDF to Excel", "sheet", "Convert PDF tables into an Excel spreadsheet.", "excel,xlsx,spreadsheet", S],
          ["pdf-to-ppt", "PDF to PowerPoint", "presentation", "Turn PDF pages into PowerPoint slides.", "powerpoint,pptx,slides", S],
          ["pdf-to-epub", "PDF to EPUB", "book-open", "Convert PDF into an EPUB e-book.", "epub,ebook,kindle", S],
          ["pdf-to-rtf", "PDF to RTF", "file-text", "Convert PDF into a Rich Text document.", "rtf,rich text", S],
          ["pdf-to-odt", "PDF to ODT", "file-text", "Convert PDF into an OpenDocument text file.", "odt,libreoffice", S],
          ["pdf-to-pdfa", "PDF to PDF/A", "archive", "Convert to PDF/A for long-term archiving.", "pdfa,pdf/a,archive,iso", S],
          ["pdf-to-pdfx", "PDF to PDF/X", "printer", "Convert to PDF/X for professional printing.", "pdfx,pdf/x,print,press", S]
        ]),
        ...group("organize", "organize", [
          ["merge-pdf", "Merge PDF", "combine", "Combine multiple PDFs into one file in any order.", "merge,combine,join,append,together"],
          ["split-pdf", "Split PDF", "scissors", "Split a PDF by page ranges, every N pages or by size.", "split,divide,separate,cut,break"],
          ["extract-pages", "Extract Pages", "file-output", "Pick the pages you want and save them as a new PDF.", "extract,select,pick,save pages"],
          ["delete-pages", "Delete Pages", "trash-2", "Remove unwanted pages from a PDF.", "delete,remove,drop pages"],
          ["rearrange-pages", "Rearrange Pages", "move", "Drag and drop pages into a new order.", "reorder,arrange,sort,move pages,organize"],
          ["rotate-pdf", "Rotate PDF", "rotate-cw", "Rotate all pages or just the ones you choose.", "rotate,turn,landscape,portrait,orientation"],
          ["insert-pages", "Insert Pages", "file-plus-2", "Insert pages from another PDF at any position.", "insert,add pages,append,prepend"],
          ["insert-blank", "Insert Blank Page", "file-plus", "Add blank pages anywhere in a PDF.", "blank,empty page,add page"],
          ["duplicate-pages", "Duplicate Pages", "copy", "Make copies of selected pages.", "duplicate,copy,clone,repeat"],
          ["reverse-pdf", "Reverse Page Order", "arrow-down-up", "Flip the page order from last to first.", "reverse,backwards,flip order"],
          ["alternate-mix", "Alternate & Mix", "shuffle", "Interleave pages of two PDFs (great for odd/even scans).", "alternate,interleave,odd even,duplex,mix"],
          ["n-up", "N-up (Pages per Sheet)", "layout-grid", "Put 2, 4, 6, 8 or 9 pages on one sheet.", "n-up,2 up,4 up,pages per sheet,handout"],
          ["booklet-maker", "Booklet Maker", "book-open", "Arrange pages to print and fold as a booklet.", "booklet,saddle stitch,fold,print,zine"],
          ["split-half", "Split Pages in Half", "columns-2", "Split double-page scans into single pages.", "split half,two pages,book scan,spread"]
        ]),
        ...group("optimize", "optimize", [
          ["compress-pdf", "Compress PDF", "shrink", "Make your PDF smaller while keeping good quality.", "compress,reduce size,shrink,smaller,optimize,kb,mb"],
          ["reduce-size", "Reduce PDF to Size", "target", "Shrink a PDF to a target size like 100 KB or 1 MB.", "reduce to 100kb,200kb,500kb,1mb,target size,upload limit,form"],
          ["optimize-images", "Optimize PDF Images", "image-down", "Recompress and downscale images inside a PDF.", "images,photos,recompress,downscale,dpi"],
          ["flatten-pdf", "Flatten PDF", "layers-2", "Flatten forms and annotations so they can\u2019t be changed.", "flatten,lock,annotations,forms,print"],
          ["remove-objects", "Clean Up PDF", "sparkle", "Remove unused objects, thumbnails and junk data.", "clean,unused objects,garbage,slim"],
          ["repair-pdf", "Repair PDF", "wrench", "Try to fix a damaged or corrupted PDF.", "repair,fix,corrupt,broken,recover,damaged"],
          ["linearize-pdf", "Fast Web View", "zap", "Linearize a PDF so it opens instantly online.", "linearize,fast web view,web optimize", S],
          ["deep-compress", "Deep Compress (Pro)", "archive", "Maximum server-side compression for very large files.", "large file,deep compress,ghostscript", S]
        ]),
        ...group("edit", "edit", [
          ["edit-pdf", "Edit PDF", "file-pen-line", "Add text, images, shapes, highlights and drawings.", "edit,editor,annotate,write on pdf,modify"],
          ["add-text", "Add Text to PDF", "type", "Type text anywhere on a PDF page.", "add text,type on pdf,write,typewriter"],
          ["add-image", "Add Image to PDF", "image-plus", "Place a photo or logo on any page.", "add image,logo,picture,photo,insert image"],
          ["add-shapes", "Add Shapes & Arrows", "shapes", "Draw rectangles, circles, lines and arrows.", "shapes,arrow,rectangle,circle,line"],
          ["highlight-pdf", "Highlight PDF", "highlighter", "Highlight important parts of a PDF.", "highlight,marker,yellow,mark"],
          ["draw-pdf", "Draw on PDF", "brush", "Draw freehand with your finger, pen or mouse.", "draw,freehand,pen,sketch,scribble"],
          ["annotate-pdf", "Comments & Notes", "sticky-note", "Add sticky-note comments to a PDF.", "comment,note,sticky,review,annotation"],
          ["whiteout-pdf", "Whiteout PDF", "eraser", "Cover up content with white boxes.", "whiteout,erase,hide,cover,correction"],
          ["crop-pdf", "Crop PDF", "crop", "Crop pages to a selected area.", "crop,trim,cut margins,area"],
          ["resize-pages", "Resize Pages", "scaling", "Change page size to A4, Letter, Legal and more.", "resize,a4,letter,legal,page size,scale"],
          ["change-margins", "Add Margins", "square-dashed", "Add white margins around every page.", "margins,border,padding,binding,gutter"],
          ["page-numbers", "Add Page Numbers", "list-ordered", "Number your pages with custom style and position.", "page numbers,numbering,paginate,footer"],
          ["header-footer", "Header & Footer", "panel-top", "Add headers and footers with date, page and file name.", "header,footer,running title,date"],
          ["watermark", "Add Watermark", "stamp", "Stamp text or a logo over your PDF.", "watermark,confidential,draft,logo,stamp"],
          ["remove-watermark", "Remove Watermark", "eraser", "Remove watermark annotations and watermark artifacts.", "remove watermark,delete watermark,clean"],
          ["background-color", "Page Background", "paint-bucket", "Add a background color or image behind pages.", "background,color,paper,tint"],
          ["bates-numbering", "Bates Numbering", "gavel", "Add Bates numbers for legal documents.", "bates,legal,court,exhibit,numbering"],
          ["add-hyperlinks", "Add Links", "link", "Make areas clickable \u2014 links to websites or pages.", "link,hyperlink,url,clickable"],
          ["bookmarks", "Edit Bookmarks", "bookmark", "Add or edit the bookmarks (outline) of a PDF.", "bookmarks,outline,navigation,chapters"],
          ["table-of-contents", "Table of Contents", "list-tree", "Create a clickable table of contents page.", "toc,table of contents,index,chapters"],
          ["edit-metadata", "Edit Metadata", "info", "Change title, author, subject and keywords.", "metadata,properties,title,author,keywords"],
          ["dark-mode-pdf", "Dark Mode PDF", "moon", "Invert colors for comfortable night reading.", "dark mode,invert,night,black background"],
          ["find-replace", "Find & Replace Text", "replace", "Find words and replace them visually.", "find,replace,change text,search replace"],
          ["full-text-edit", "Edit Existing Text (Pro)", "text-cursor-input", "Edit the original text of a PDF like a Word file.", "edit text,change words,modify text", S],
          ["change-fonts", "Change / Embed Fonts", "case-sensitive", "Replace or embed fonts in a PDF.", "fonts,embed fonts,font replace", S]
        ]),
        ...group("security", "security", [
          ["protect-pdf", "Protect PDF", "lock", "Add a password with strong AES-256 encryption.", "password,protect,encrypt,lock,secure"],
          ["unlock-pdf", "Unlock PDF", "lock-open", "Remove the password from a PDF you can open.", "unlock,remove password,decrypt"],
          ["pdf-permissions", "Set Permissions", "shield-check", "Block printing, copying or editing.", "permissions,restrict,no print,no copy"],
          ["redact-pdf", "Redact PDF", "square", "Permanently black out sensitive information.", "redact,black out,censor,hide,private"],
          ["auto-redact", "Auto Redact", "scan-eye", "Find and redact emails, phone, Aadhaar, PAN and card numbers.", "auto redact,aadhaar,pan,phone,email,credit card,gdpr"],
          ["remove-metadata", "Sanitize PDF", "shield-off", "Remove metadata, hidden data, scripts and attachments.", "remove metadata,sanitize,privacy,hidden data,clean"],
          ["digital-sign", "Digital Certificate Signature", "badge-check", "Sign with a certificate (PFX/P12) for legal validity.", "digital signature,certificate,dsc,pfx,p12", S],
          ["verify-sign", "Verify Signature", "shield-check", "Check whether a PDF signature is valid.", "verify,validate signature,check", S]
        ]),
        ...group("sign", "sign", [
          ["sign-pdf", "Sign PDF", "signature", "Draw, type or upload your signature and place it.", "sign,signature,esign,autograph,initials"],
          ["fill-forms", "Fill PDF Forms", "clipboard-pen-line", "Fill in PDF form fields and save.", "fill,form,fields,application"],
          ["create-form", "Create Fillable Form", "text-cursor-input", "Add text boxes, checkboxes and dropdowns.", "create form,fillable,fields,checkbox,dropdown"],
          ["flatten-forms", "Flatten Form", "square-check", "Lock filled form fields into the page.", "flatten form,lock form,finalize"],
          ["extract-form-data", "Export Form Data", "table-properties", "Export form field values to CSV or JSON.", "form data,export,csv,json"],
          ["date-stamp", "Date & Initials", "calendar-check", "Add today\u2019s date and your initials to pages.", "date,initials,stamp,today"],
          ["stamps", "Add Stamp", "stamp", "Stamp APPROVED, PAID, DRAFT, CONFIDENTIAL and more.", "stamp,approved,paid,draft,confidential,rejected"],
          ["request-signatures", "Request Signatures", "send", "Send a PDF to others to sign, with reminders.", "request signature,send for signing,esign workflow", S]
        ]),
        ...group("extract", "extract", [
          ["pdf-viewer", "PDF Viewer", "book-open-text", "Open and read any PDF with zoom and search.", "view,open,read,viewer,reader"],
          ["extract-text", "Extract Text", "text", "Copy all text out of a PDF.", "extract text,copy,text"],
          ["extract-images", "Extract Images", "images", "Save all images embedded in a PDF.", "extract images,save pictures,photos"],
          ["extract-tables", "Extract Tables", "table", "Detect tables and export them to CSV.", "tables,extract table,csv,data"],
          ["extract-links", "Extract Links", "link-2", "List every link and URL in a PDF.", "links,urls,hyperlinks,extract"],
          ["extract-fonts", "List Fonts", "case-sensitive", "See all fonts used and whether they are embedded.", "fonts,font list,embedded"],
          ["extract-attachments", "Extract Attachments", "paperclip", "Download files attached inside a PDF.", "attachments,embedded files"],
          ["extract-metadata", "View Metadata", "info", "See title, author, dates and XMP metadata.", "metadata,properties,info"],
          ["word-counter", "Page & Word Counter", "calculator", "Count pages, words and characters.", "word count,page count,characters,count"],
          ["pdf-inspector", "PDF Inspector", "search-code", "See version, page sizes, fonts, encryption and more.", "inspect,info,analyze,details,version"]
        ]),
        ...group("ocr", "ocr", [
          ["ocr-pdf", "OCR PDF", "scan-text", "Make scanned PDFs searchable (English, Hindi, Punjabi, +).", "ocr,searchable,scanned,recognize text,hindi,punjabi"],
          ["ocr-image", "Image to Text", "scan-text", "Pull text out of photos and screenshots.", "ocr,image to text,photo text,extract text from image"],
          ["deskew-pdf", "Straighten Scans", "ruler", "Auto-straighten tilted scanned pages.", "deskew,straighten,tilt,crooked"],
          ["clean-scan", "Clean Up Scan", "sparkles", "Remove noise, whiten background, boost contrast.", "clean,noise,whiten,enhance scan,contrast"],
          ["auto-crop", "Auto Crop", "crop", "Trim empty borders around page content.", "auto crop,trim borders,whitespace"],
          ["remove-blank-pages", "Remove Blank Pages", "file-x", "Find and delete empty pages automatically.", "blank pages,empty,remove"],
          ["ocr-pro", "OCR Pro (Fast & Large)", "scan-line", "Server OCR for huge scans with higher accuracy.", "ocr pro,large,accurate", S]
        ]),
        ...group("compare", "compare", [
          ["compare-pdf", "Compare PDFs", "git-compare", "Highlight text and visual differences between two PDFs.", "compare,diff,difference,changes,versions"],
          ["side-by-side", "Side-by-Side Viewer", "columns-2", "View two PDFs next to each other with synced scroll.", "side by side,two pdf,parallel"],
          ["export-comments", "Export Comments", "message-square-text", "Export all comments and highlights to CSV/TXT.", "comments,annotations,export,review"],
          ["accessibility-check", "Accessibility Checker", "accessibility", "Check a PDF for common accessibility problems.", "accessibility,a11y,pdf/ua,screen reader,wcag"],
          ["accessibility-tagging", "Make PDF Accessible", "accessibility", "Auto-tag a PDF for screen readers.", "tagging,pdf/ua,accessible", S]
        ]),
        ...group("ai", "ai", [
          ["ai-chat", "Chat with PDF", "message-circle", "Ask questions and get answers from your PDF.", "chat,ask,question,ai,gpt,claude", S],
          ["ai-summarize", "Summarize PDF", "sparkles", "Get a short summary of any PDF.", "summary,summarize,tldr,ai", S],
          ["ai-translate", "Translate PDF", "languages", "Translate a PDF into Hindi, Punjabi and 100+ languages.", "translate,hindi,punjabi,language", S],
          ["ai-quiz", "PDF to Quiz", "circle-help", "Make quizzes and flashcards from study material.", "quiz,flashcards,mcq,study,exam", S],
          ["ai-keypoints", "Key Points & Notes", "list-checks", "Pull out key points and notes.", "key points,notes,highlights,ai", S],
          ["ai-rewrite", "Rewrite / Paraphrase", "refresh-cw", "Rewrite PDF text in simpler words.", "rewrite,paraphrase,simplify", S],
          ["ai-resume", "Resume Parser", "contact", "Extract details from resumes/CVs.", "resume,cv,parse,hr", S],
          ["ai-invoice", "Invoice Data Extractor", "receipt-text", "Pull invoice numbers, totals and GST.", "invoice,bill,gst,extract,accounting", S],
          ["ai-generate", "Generate PDF with AI", "wand-sparkles", "Describe a document and get a PDF.", "generate,create,ai,write", S]
        ]),
        ...group("advanced", "advanced", [
          ["batch-process", "Batch Processing", "boxes", "Apply a tool to many PDFs at once.", "batch,bulk,many files,multiple"],
          ["workflow-builder", "Workflow Builder", "workflow", "Chain tools: e.g. Merge \u2192 Number \u2192 Compress \u2192 Protect.", "workflow,chain,automation,pipeline"],
          ["attach-files", "Attach Files to PDF", "paperclip", "Embed any files inside a PDF.", "attach,embed file,attachment"],
          ["remove-attachments", "Remove Attachments", "paperclip", "Delete embedded files from a PDF.", "remove attachments,delete embedded"],
          ["manage-layers", "Manage Layers", "layers", "Show or hide PDF layers (OCG).", "layers,ocg,optional content,cad"],
          ["add-qr-code", "Add QR Code / Barcode", "qr-code", "Generate a QR code or barcode and place it on pages.", "qr code,barcode,generate,code128,upi"],
          ["read-qr-code", "Read QR Code / Barcode", "scan-qr-code", "Find and decode QR codes and barcodes in a PDF.", "scan qr,read barcode,decode"],
          ["create-blank-pdf", "Create Blank PDF", "file-plus", "Make blank, lined, grid or dotted paper PDFs.", "blank pdf,lined paper,grid,dotted,notebook"],
          ["pdf-templates", "PDF Templates", "layout-template", "Create an invoice, certificate, resume or letter.", "template,invoice,certificate,resume,letter,bill"],
          ["pdfa-validate", "PDF/A Validator", "badge-check", "Validate PDF/A compliance.", "pdfa,validate,compliance", S],
          ["print-preflight", "Print Preflight", "printer-check", "Check bleed, fonts and colors before printing.", "preflight,print,bleed,cmyk", S],
          ["rgb-to-cmyk", "RGB to CMYK", "palette", "Convert colors to CMYK for print.", "cmyk,rgb,print,color", S],
          ["pdf-version", "Change PDF Version", "git-branch", "Convert to PDF 1.4, 1.7 or 2.0.", "version,1.4,1.7,2.0,compatibility", S]
        ])
      ];
      POPULAR = ["merge-pdf", "compress-pdf", "split-pdf", "jpg-to-pdf", "pdf-to-jpg", "sign-pdf", "edit-pdf", "protect-pdf"];
      catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
      toolBySlug = Object.fromEntries(TOOLS.map((t2) => [t2.slug, t2]));
      FILE_MAP = {
        pdf: ["compress-pdf", "merge-pdf", "split-pdf", "edit-pdf", "sign-pdf", "pdf-to-jpg", "rotate-pdf", "delete-pages", "page-numbers", "watermark", "protect-pdf", "unlock-pdf", "ocr-pdf", "pdf-to-text", "pdf-to-word", "reduce-size", "ai-summarize"],
        jpg: ["jpg-to-pdf", "ocr-image", "combine-files"],
        jpeg: ["jpg-to-pdf", "ocr-image", "combine-files"],
        png: ["png-to-pdf", "ocr-image", "combine-files"],
        webp: ["image-to-pdf", "ocr-image"],
        gif: ["image-to-pdf"],
        bmp: ["image-to-pdf", "ocr-image"],
        svg: ["image-to-pdf"],
        avif: ["image-to-pdf"],
        heic: ["heic-to-pdf"],
        heif: ["heic-to-pdf"],
        tif: ["tiff-to-pdf"],
        tiff: ["tiff-to-pdf"],
        txt: ["text-to-pdf"],
        md: ["markdown-to-pdf"],
        markdown: ["markdown-to-pdf"],
        csv: ["csv-to-pdf"],
        html: ["html-to-pdf"],
        htm: ["html-to-pdf"],
        json: ["json-to-pdf"],
        xml: ["json-to-pdf"],
        js: ["code-to-pdf"],
        ts: ["code-to-pdf"],
        py: ["code-to-pdf"],
        java: ["code-to-pdf"],
        c: ["code-to-pdf"],
        cpp: ["code-to-pdf"],
        css: ["code-to-pdf"],
        php: ["code-to-pdf"],
        doc: ["word-to-pdf"],
        docx: ["word-to-pdf"],
        xls: ["excel-to-pdf"],
        xlsx: ["excel-to-pdf"],
        ppt: ["ppt-to-pdf"],
        pptx: ["ppt-to-pdf"],
        odt: ["odt-to-pdf"],
        ods: ["odt-to-pdf"],
        odp: ["odt-to-pdf"],
        rtf: ["rtf-to-pdf"],
        epub: ["epub-to-pdf"],
        mobi: ["mobi-to-pdf"],
        azw3: ["mobi-to-pdf"],
        eml: ["email-to-pdf"],
        msg: ["email-to-pdf"],
        dwg: ["cad-to-pdf"],
        dxf: ["cad-to-pdf"],
        ps: ["ps-to-pdf"],
        eps: ["ps-to-pdf"],
        xps: ["xps-to-pdf"],
        oxps: ["xps-to-pdf"],
        pages: ["iwork-to-pdf"],
        numbers: ["iwork-to-pdf"],
        key: ["iwork-to-pdf"]
      };
    }
  });

  // js/core/icons.js
  var ICONS;
  var init_icons = __esm({
    "js/core/icons.js"() {
      ICONS = { "accessibility": '<circle cx="16" cy="4" r="1" /><path d="m18 19 1-7-6 1" /><path d="m5 8 3-3 5.5 3-2.36 3.5" /><path d="M4.24 14.5a5 5 0 0 0 6.88 6" /><path d="M13.76 17.5a5 5 0 0 0-6.88-6" />', "apple": '<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" /><path d="M10 2c1 .5 2 2 2 5" />', "archive": '<rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" />', "arrow-down-up": '<path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" />', "arrow-left": '<path d="m12 19-7-7 7-7" /><path d="M19 12H5" />', "arrow-left-right": '<path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />', "arrow-right": '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />', "badge-check": '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" />', "badge-indian-rupee": '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="M8 8h8" /><path d="M8 12h8" /><path d="m13 17-5-1h1a4 4 0 0 0 0-8" />', "barcode": '<path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" /><path d="M17 5v14" /><path d="M21 5v14" />', "book": '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />', "book-open": '<path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />', "book-open-text": '<path d="M12 7v14" /><path d="M16 12h2" /><path d="M16 8h2" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /><path d="M6 12h2" /><path d="M6 8h2" />', "bookmark": '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />', "box": '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />', "boxes": '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" /><path d="m7 16.5-4.74-2.85" /><path d="m7 16.5 5-3" /><path d="M7 16.5v5.17" /><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" /><path d="m17 16.5-5-3" /><path d="m17 16.5 4.74-2.85" /><path d="M17 16.5v5.17" /><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" /><path d="M12 8 7.26 5.15" /><path d="m12 8 4.74-2.85" /><path d="M12 13.5V8" />', "braces": '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" /><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />', "brush": '<path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" /><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />', "calculator": '<rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" />', "calendar": '<path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />', "calendar-check": '<path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" />', "camera": '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />', "case-sensitive": '<path d="m3 15 4-8 4 8" /><path d="M4 13h6" /><circle cx="18" cy="12" r="3" /><path d="M21 9v6" />', "check": '<path d="M20 6 9 17l-5-5" />', "chevron-down": '<path d="m6 9 6 6 6-6" />', "chevron-left": '<path d="m15 18-6-6 6-6" />', "chevron-right": '<path d="m9 18 6-6-6-6" />', "chevron-up": '<path d="m18 15-6-6-6 6" />', "circle": '<circle cx="12" cy="12" r="10" />', "circle-alert": '<circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />', "circle-check": '<circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />', "circle-help": '<circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />', "circle-x": '<circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />', "clipboard-pen-line": '<rect width="8" height="4" x="8" y="2" rx="1" /><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.5" /><path d="M16 4h2a2 2 0 0 1 1.73 1" /><path d="M8 18h1" /><path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />', "clock": '<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />', "code": '<polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />', "code-xml": '<path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" />', "columns-2": '<rect width="18" height="18" x="3" y="3" rx="2" /><path d="M12 3v18" />', "combine": '<path d="M10 18H5a3 3 0 0 1-3-3v-1" /><path d="M14 2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2" /><path d="M20 2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2" /><path d="m7 21 3-3-3-3" /><rect x="14" y="14" width="8" height="8" rx="2" /><rect x="2" y="2" width="8" height="8" rx="2" />', "contact": '<path d="M16 2v2" /><path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" /><path d="M8 2v2" /><circle cx="12" cy="11" r="3" /><rect x="3" y="4" width="18" height="18" rx="2" />', "container": '<path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z" /><path d="M10 21.9V14L2.1 9.1" /><path d="m10 14 11.9-6.9" /><path d="M14 19.8v-8.1" /><path d="M18 17.5V9.4" />', "contrast": '<circle cx="12" cy="12" r="10" /><path d="M12 18a6 6 0 0 0 0-12v12z" />', "copy": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />', "crop": '<path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" />', "currency": '<circle cx="12" cy="12" r="8" /><line x1="3" x2="6" y1="3" y2="6" /><line x1="21" x2="18" y1="3" y2="6" /><line x1="3" x2="6" y1="21" y2="18" /><line x1="21" x2="18" y1="21" y2="18" />', "delete": '<path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" /><path d="m12 9 6 6" /><path d="m18 9-6 6" />', "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />', "drafting-compass": '<path d="m12.99 6.74 1.93 3.44" /><path d="M19.136 12a10 10 0 0 1-14.271 0" /><path d="m21 21-2.16-3.84" /><path d="m3 21 8.02-14.26" /><circle cx="12" cy="5" r="2" />', "eraser": '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" />', "external-link": '<path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />', "file": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" />', "file-check": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="m9 15 2 2 4-4" />', "file-code": '<path d="M10 12.5 8 15l2 2.5" /><path d="m14 12.5 2 2.5-2 2.5" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />', "file-down": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" />', "file-image": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><circle cx="10" cy="12" r="2" /><path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22" />', "file-input": '<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M2 15h10" /><path d="m9 18 3-3-3-3" />', "file-output": '<path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M4 7V4a2 2 0 0 1 2-2 2 2 0 0 0-2 2" /><path d="M4.063 20.999a2 2 0 0 0 2 1L18 22a2 2 0 0 0 2-2V7l-5-5H6" /><path d="m5 11-3 3" /><path d="m5 17-3-3h10" />', "file-pen-line": '<path d="m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" /><path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /><path d="M8 18h1" />', "file-plus": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M9 15h6" /><path d="M12 18v-6" />', "file-plus-2": '<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M3 15h6" /><path d="M6 12v6" />', "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />', "file-type": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M9 13v-1h6v1" /><path d="M12 12v6" /><path d="M11 18h2" />', "file-x": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="m14.5 12.5-5 5" /><path d="m9.5 12.5 5 5" />', "files": '<path d="M20 7h-3a2 2 0 0 1-2-2V2" /><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" /><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" />', "filter": '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />', "focus": '<circle cx="12" cy="12" r="3" /><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />', "folder-open": '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />', "gauge": '<path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" />', "gavel": '<path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8" /><path d="m16 16 6-6" /><path d="m8 8 6-6" /><path d="m9 7 8 8" /><path d="m21 11-8-8" />', "git-branch": '<line x1="6" x2="6" y1="3" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />', "git-compare": '<circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="M11 18H8a2 2 0 0 1-2-2V9" />', "github": '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" />', "globe": '<circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />', "hash": '<line x1="4" x2="20" y1="9" y2="9" /><line x1="4" x2="20" y1="15" y2="15" /><line x1="10" x2="8" y1="3" y2="21" /><line x1="16" x2="14" y1="3" y2="21" />', "heading": '<path d="M6 12h12" /><path d="M6 20V4" /><path d="M18 20V4" />', "heart": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />', "highlighter": '<path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />', "history": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />', "image": '<rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />', "image-down": '<path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21" /><path d="m14 19 3 3v-5.5" /><path d="m17 22 3-3" /><circle cx="9" cy="9" r="2" />', "image-plus": '<path d="M16 5h6" /><path d="M19 2v6" /><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /><circle cx="9" cy="9" r="2" />', "images": '<path d="M18 22H4a2 2 0 0 1-2-2V6" /><path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" /><circle cx="12" cy="8" r="2" /><rect width="16" height="16" x="6" y="2" rx="2" />', "info": '<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />', "languages": '<path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" />', "layers": '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />', "layers-2": '<path d="m16.02 12 5.48 3.13a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74L7.98 12" /><path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74Z" />', "layout-grid": '<rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />', "layout-template": '<rect width="18" height="7" x="3" y="3" rx="1" /><rect width="9" height="7" x="3" y="14" rx="1" /><rect width="5" height="7" x="16" y="14" rx="1" />', "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />', "link-2": '<path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /><line x1="8" x2="16" y1="12" y2="12" />', "list": '<path d="M3 12h.01" /><path d="M3 18h.01" /><path d="M3 6h.01" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M8 6h13" />', "list-checks": '<path d="m3 17 2 2 4-4" /><path d="m3 7 2 2 4-4" /><path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" />', "list-ordered": '<path d="M10 12h11" /><path d="M10 18h11" /><path d="M10 6h11" /><path d="M4 10h2" /><path d="M4 6h1v4" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />', "list-tree": '<path d="M21 12h-8" /><path d="M21 6H8" /><path d="M21 18h-8" /><path d="M3 6v4c0 1.1.9 2 2 2h3" /><path d="M3 10v6c0 1.1.9 2 2 2h3" />', "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />', "lock-open": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />', "mail": '<rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />', "message-circle": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />', "message-square": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />', "message-square-text": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M13 8H7" /><path d="M17 12H7" />', "minus": '<path d="M5 12h14" />', "moon": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />', "mouse-pointer-2": '<path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />', "move": '<path d="M12 2v20" /><path d="m15 19-3 3-3-3" /><path d="m19 9 3 3-3 3" /><path d="M2 12h20" /><path d="m5 9-3 3 3 3" /><path d="m9 5 3-3 3 3" />', "move-up-right": '<path d="M13 5H19V11" /><path d="M19 5L5 19" />', "music": '<path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />', "option": '<path d="M3 3h6l6 18h6" /><path d="M14 3h7" />', "paint-bucket": '<path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" /><path d="m5 2 5 5" /><path d="M2 13h15" /><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />', "palette": '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />', "panel-top": '<rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" />', "paperclip": '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />', "pause": '<rect x="14" y="4" width="4" height="16" rx="1" /><rect x="6" y="4" width="4" height="16" rx="1" />', "pen-line": '<path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />', "pen-tool": '<path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z" /><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18" /><path d="m2.3 2.3 7.286 7.286" /><circle cx="11" cy="11" r="2" />', "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />', "play": '<polygon points="6 3 20 12 6 21 6 3" />', "plus": '<path d="M5 12h14" /><path d="M12 5v14" />', "pointer": '<path d="M22 14a8 8 0 0 1-8 8" /><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" /><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" /><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" /><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />', "presentation": '<path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 21 5-5 5 5" />', "printer": '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" /><rect x="6" y="14" width="12" height="8" rx="1" />', "printer-check": '<path d="M13.5 22H7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v.5" /><path d="m16 19 2 2 4-4" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" /><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />', "qr-code": '<rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />', "radio": '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />', "receipt-text": '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M14 8H8" /><path d="M16 12H8" /><path d="M13 16H8" />', "refresh-cw": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />', "regex": '<path d="M17 3v10" /><path d="m12.67 5.5 8.66 5" /><path d="m12.67 10.5 8.66-5" /><path d="M9 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2z" />', "replace": '<path d="M14 4a2 2 0 0 1 2-2" /><path d="M16 10a2 2 0 0 1-2-2" /><path d="M20 2a2 2 0 0 1 2 2" /><path d="M22 8a2 2 0 0 1-2 2" /><path d="m3 7 3 3 3-3" /><path d="M6 10V5a3 3 0 0 1 3-3h1" /><rect x="2" y="14" width="8" height="8" rx="2" />', "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />', "rotate-cw": '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />', "rows-2": '<rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 12h18" />', "ruler": '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" /><path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" />', "save": '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" /><path d="M7 3v4a1 1 0 0 0 1 1h7" />', "scale": '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />', "scaling": '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M14 15H9v-5" /><path d="M16 3h5v5" /><path d="M21 3 9 15" />', "scan-eye": '<path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="1" /><path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0" />', "scan-line": '<path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" />', "scan-qr-code": '<path d="M17 12v4a1 1 0 0 1-1 1h-4" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M17 8V7" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M7 17h.01" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="7" y="7" width="5" height="5" rx="1" />', "scan-search": '<path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="3" /><path d="m16 16-1.9-1.9" />', "scan-text": '<path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 8h8" /><path d="M7 12h10" /><path d="M7 16h6" />', "school": '<path d="M14 22v-4a2 2 0 1 0-4 0v4" /><path d="m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10" /><path d="M18 5v17" /><path d="m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6" /><path d="M6 5v17" /><circle cx="12" cy="9" r="2" />', "scissors": '<circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" />', "scroll": '<path d="M19 17V5a2 2 0 0 0-2-2H4" /><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />', "search": '<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />', "search-code": '<path d="m13 13.5 2-2.5-2-2.5" /><path d="m21 21-4.3-4.3" /><path d="M9 8.5 7 11l2 2.5" /><circle cx="11" cy="11" r="8" />', "send": '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" />', "server": '<rect width="20" height="8" x="2" y="2" rx="2" ry="2" /><rect width="20" height="8" x="2" y="14" rx="2" ry="2" /><line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" />', "server-cog": '<circle cx="12" cy="12" r="3" /><path d="M4.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5" /><path d="M4.5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5" /><path d="M6 6h.01" /><path d="M6 18h.01" /><path d="m15.7 13.4-.9-.3" /><path d="m9.2 10.9-.9-.3" /><path d="m10.6 15.7.3-.9" /><path d="m13.6 15.7-.4-1" /><path d="m10.8 9.3-.4-1" /><path d="m8.3 13.6 1-.4" /><path d="m14.7 10.8 1-.4" /><path d="m13.4 8.3-.3.9" />', "settings-2": '<path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" />', "shapes": '<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" /><rect x="3" y="14" width="7" height="7" rx="1" /><circle cx="17.5" cy="17.5" r="3.5" />', "sheet": '<rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="3" x2="21" y1="15" y2="15" /><line x1="9" x2="9" y1="9" y2="21" /><line x1="15" x2="15" y1="9" y2="21" />', "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />', "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />', "shield-off": '<path d="m2 2 20 20" /><path d="M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71" /><path d="M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264" />', "shrink": '<path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8" /><path d="M9 19.8V15m0 0H4.2M9 15l-6 6" /><path d="M15 4.2V9m0 0h4.8M15 9l6-6" /><path d="M9 4.2V9m0 0H4.2M9 9 3 3" />', "shuffle": '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" /><path d="m18 2 4 4-4 4" /><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" /><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" /><path d="m18 14 4 4-4 4" />', "signature": '<path d="m21 17-2.156-1.868A.5.5 0 0 0 18 15.5v.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1c0-2.545-3.991-3.97-8.5-4a1 1 0 0 0 0 5c4.153 0 4.745-11.295 5.708-13.5a2.5 2.5 0 1 1 3.31 3.284" /><path d="M3 21h18" />', "skip-back": '<polygon points="19 20 9 12 19 4 19 20" /><line x1="5" x2="5" y1="19" y2="5" />', "skip-forward": '<polygon points="5 4 15 12 5 20 5 4" /><line x1="19" x2="19" y1="5" y2="19" />', "sliders-horizontal": '<line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" /><line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" /><line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" /><line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="16" x2="16" y1="18" y2="22" />', "smartphone": '<rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" />', "sparkle": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />', "sparkles": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" />', "split": '<path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" />', "square": '<rect width="18" height="18" x="3" y="3" rx="2" />', "square-check": '<rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 12 2 2 4-4" />', "square-dashed": '<path d="M5 3a2 2 0 0 0-2 2" /><path d="M19 3a2 2 0 0 1 2 2" /><path d="M21 19a2 2 0 0 1-2 2" /><path d="M5 21a2 2 0 0 1-2-2" /><path d="M9 3h1" /><path d="M9 21h1" /><path d="M14 3h1" /><path d="M14 21h1" /><path d="M3 9v1" /><path d="M21 9v1" /><path d="M3 14v1" /><path d="M21 14v1" />', "stamp": '<path d="M5 22h14" /><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z" /><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-3-3c-1.66 0-3 1-3 3s1 2 1 3.5V13" />', "sticky-note": '<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" /><path d="M15 3v4a2 2 0 0 0 2 2h4" />', "sun": '<circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />', "table": '<path d="M12 3v18" /><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" />', "table-of-contents": '<path d="M16 12H3" /><path d="M16 18H3" /><path d="M16 6H3" /><path d="M21 12h.01" /><path d="M21 18h.01" /><path d="M21 6h.01" />', "table-properties": '<path d="M15 3v18" /><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M21 9H3" /><path d="M21 15H3" />', "target": '<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />', "text": '<path d="M17 6.1H3" /><path d="M21 12.1H3" /><path d="M15.1 18H3" />', "text-cursor-input": '<path d="M5 4h1a3 3 0 0 1 3 3 3 3 0 0 1 3-3h1" /><path d="M13 20h-1a3 3 0 0 1-3-3 3 3 0 0 1-3 3H5" /><path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" /><path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7" /><path d="M9 7v10" />', "trash-2": '<path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />', "triangle-alert": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />', "type": '<polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line x1="12" x2="12" y1="4" y2="20" />', "undo-2": '<path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />', "upload": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />', "user-x": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" x2="22" y1="8" y2="13" /><line x1="22" x2="17" y1="8" y2="13" />', "volume-2": '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M19.364 18.364a9 9 0 0 0 0-12.728" />', "wand-sparkles": '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" /><path d="m14 7 3 3" /><path d="M5 6v4" /><path d="M19 14v4" /><path d="M10 2v2" /><path d="M7 8H3" /><path d="M21 16h-4" /><path d="M11 3H9" />', "wifi": '<path d="M12 20h.01" /><path d="M2 8.82a15 15 0 0 1 20 0" /><path d="M5 12.859a10 10 0 0 1 14 0" /><path d="M8.5 16.429a5 5 0 0 1 7 0" />', "workflow": '<rect width="8" height="8" x="3" y="3" rx="2" /><path d="M7 11v4a2 2 0 0 0 2 2h4" /><rect width="8" height="8" x="13" y="13" rx="2" />', "wrench": '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />', "x": '<path d="M18 6 6 18" /><path d="m6 6 12 12" />', "zap": '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />', "zoom-in": '<circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /><line x1="11" x2="11" y1="8" y2="14" /><line x1="8" x2="14" y1="11" y2="11" />', "zoom-out": '<circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /><line x1="8" x2="14" y1="11" y2="11" />' };
    }
  });

  // js/core/ui.js
  function ic(name, cls = "") {
    const body = ICONS[name] || ICONS["file"];
    return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  }
  function h(sel, props, ...kids) {
    if (props instanceof Node || typeof props === "string" || Array.isArray(props)) {
      kids.unshift(props);
      props = {};
    }
    props = props || {};
    const m = sel.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i);
    const el = document.createElement(m[1] || "div");
    (m[2].match(/[.#][\w-]+/g) || []).forEach((p) => p[0] === "." ? el.classList.add(p.slice(1)) : el.id = p.slice(1));
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "on") for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
      else if (k === "html") el.innerHTML = v;
      else if (k === "class") String(v).split(/\s+/).filter(Boolean).forEach((c) => el.classList.add(c));
      else if (k === "text") el.textContent = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k in el && typeof v !== "string") el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    const add = (k) => {
      if (k == null || k === false) return;
      if (Array.isArray(k)) return k.forEach(add);
      if (k instanceof Node) el.appendChild(k);
      else el.insertAdjacentHTML("beforeend", String(k));
    };
    kids.forEach(add);
    return el;
  }
  function fmtBytes(n) {
    if (n == null) return "";
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(2) + " MB";
  }
  function toast(msg, type = "info") {
    let t2 = document.querySelector(".toast");
    if (!t2) {
      t2 = h("div.toast", { role: "status", "aria-live": "polite" });
      document.body.appendChild(t2);
    }
    const icon = { success: "circle-check", error: "circle-alert", info: "info" }[type];
    t2.className = `toast toast-${type}`;
    t2.innerHTML = `${ic(icon)}<span>${esc(msg)}</span>`;
    requestAnimationFrame(() => t2.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t2.classList.remove("show"), type === "error" ? 6e3 : 3500);
  }
  function modal({ title, body, actions = [{ label: "OK", primary: true, value: true }], onOpen }) {
    return new Promise((resolve) => {
      const prevFocus = document.activeElement;
      const close = (v) => {
        back.remove();
        document.body.classList.remove("no-scroll");
        document.removeEventListener("keydown", onKey);
        prevFocus?.focus?.();
        resolve(v);
      };
      const onKey = (e) => {
        if (e.key === "Escape") close(null);
      };
      const foot = h("div.modal-foot", actions.map((a) => h(`button.btn.${a.primary ? "btn-primary" : "btn-ghost"}`, {
        type: "button",
        on: { click: async () => {
          const v = typeof a.value === "function" ? await a.value() : a.value;
          if (v !== void 0) close(v);
        } }
      }, a.label)));
      const box = h(
        "div.modal",
        { role: "dialog", "aria-modal": "true", "aria-label": title },
        h("div.modal-head", h("h3", { text: title }), h("button.icon-btn", { type: "button", "aria-label": "Close", on: { click: () => close(null) } }, ic("x"))),
        h("div.modal-body", body),
        foot
      );
      const back = h("div.modal-back", { on: { mousedown: (e) => {
        if (e.target === back) close(null);
      } } }, box);
      document.body.appendChild(back);
      document.body.classList.add("no-scroll");
      document.addEventListener("keydown", onKey);
      onOpen?.(box, close);
      setTimeout(() => (box.querySelector("input,textarea,select") || foot.querySelector(".btn-primary"))?.focus(), 30);
    });
  }
  async function askPassword(fileName, wrong = false) {
    const input = h("input.option-input", { type: "password", placeholder: "Enter PDF password", autocomplete: "off" });
    const body = h("div", h("p", { html: `${wrong ? '<b style="color:var(--red)">Wrong password.</b> ' : ""}<b>${esc(fileName)}</b> is password protected. Enter its password to open it \u2014 it is only used on your device.` }), input);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") body.closest(".modal").querySelector(".btn-primary").click();
    });
    return modal({ title: "Password required", body, actions: [{ label: "Cancel", value: null }, { label: "Open", primary: true, value: () => input.value }] });
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = h("a", { href: url, download: name, style: { display: "none" } });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 6e4);
  }
  function baseName(name) {
    return name.replace(/\.[^.]+$/, "");
  }
  var esc, toastTimer, nextFrame, store;
  var init_ui = __esm({
    "js/core/ui.js"() {
      init_icons();
      esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      store = {
        get(k, d = null) {
          try {
            const v = localStorage.getItem(k);
            return v == null ? d : JSON.parse(v);
          } catch {
            return d;
          }
        },
        set(k, v) {
          try {
            localStorage.setItem(k, JSON.stringify(v));
          } catch {
          }
        }
      };
    }
  });

  // js/core/lib.js
  function lib(name) {
    if (loading[name]) return loading[name];
    const [file, global] = LIBS[name];
    if (window[global]) return loading[name] = Promise.resolve(window[global]);
    loading[name] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = VENDOR + file;
      s.async = true;
      s.onload = () => {
        const g = window[global];
        if (name === "pdfjs") g.GlobalWorkerOptions.workerSrc = VENDOR + "pdfjs/pdf.worker.min.js";
        resolve(g);
      };
      s.onerror = () => {
        delete loading[name];
        reject(new Error(`Could not load ${name}. Check your internet connection.`));
      };
      document.head.appendChild(s);
    });
    return loading[name];
  }
  var VENDOR, LIBS, loading, vendorUrl;
  var init_lib = __esm({
    "js/core/lib.js"() {
      VENDOR = new URL("vendor/", document.baseURI).href;
      LIBS = {
        pdflib: ["pdf-lib.min.js", "PDFLib"],
        pdfjs: ["pdfjs/pdf.min.js", "pdfjsLib"],
        jszip: ["jszip.min.js", "JSZip"],
        marked: ["marked.min.js", "marked"],
        html2canvas: ["html2canvas.min.js", "html2canvas"],
        qrcode: ["qrcode.js", "qrcode"],
        jsbarcode: ["JsBarcode.all.min.js", "JsBarcode"],
        jsqr: ["jsQR.js", "jsQR"],
        heic2any: ["heic2any.min.js", "heic2any"],
        utif: ["UTIF.js", "UTIF"],
        sortable: ["Sortable.min.js", "Sortable"],
        tesseract: ["tesseract/tesseract.min.js", "Tesseract"]
      };
      loading = {};
      vendorUrl = (p) => VENDOR + p;
    }
  });

  // js/core/pdf.js
  async function openPdf(bytes) {
    const pdfjs = await lib("pdfjs");
    return pdfjs.getDocument({
      data: bytes.slice(0),
      // pdf.js transfers the buffer, so give it a copy
      cMapUrl: vendorUrl("pdfjs/cmaps/"),
      cMapPacked: true,
      standardFontDataUrl: vendorUrl("pdfjs/standard_fonts/"),
      isEvalSupported: false,
      enableXfa: false
    }).promise;
  }
  async function loadDoc(bytes, extra = {}) {
    const { PDFDocument } = await PL();
    const doc = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: false, ...extra });
    stripSecurity(doc, PDFDocument);
    return doc;
  }
  function stripSecurity(doc) {
    const P = window.PDFLib;
    doc.context.security = void 0;
    delete doc.context.trailerInfo.Encrypt;
    for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
      const d = obj instanceof P.PDFDict ? obj : obj?.dict;
      if (!d || !(d instanceof P.PDFDict)) continue;
      const f = d.get(P.PDFName.of("Filter"));
      if (f && f.toString() === "/Standard" && d.has(P.PDFName.of("O")) && d.has(P.PDFName.of("U"))) doc.context.delete(ref);
    }
  }
  async function prepareFile(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name) || isPdfBytes(bytes);
    const entry = { file, name: file.name, size: file.size, bytes, isPdf, encrypted: false };
    if (!isPdf) return entry;
    const { PDFDocument } = await PL();
    let d;
    try {
      d = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false });
    } catch (e) {
      try {
        const pdf = await openPdf(bytes);
        entry.pageCount = pdf.numPages;
        entry.broken = true;
        return entry;
      } catch (e2) {
        throw new Error(`\u201C${file.name}\u201D is not a valid PDF or is badly damaged.`);
      }
    }
    entry.pageCount = d.getPageCount();
    if (!d.isEncrypted) return entry;
    entry.encrypted = true;
    let pw = "", tries = 0;
    for (; ; ) {
      try {
        const d2 = await PDFDocument.load(bytes, { password: pw, updateMetadata: false, throwOnInvalidObject: false });
        stripSecurity(d2);
        entry.bytes = await d2.save({ useObjectStreams: true });
        entry.password = pw;
        entry.pageCount = d2.getPageCount();
        return entry;
      } catch (e) {
        pw = await askPassword(file.name, tries++ > 0);
        if (pw == null) throw new Error(`\u201C${file.name}\u201D needs a password to open.`);
      }
    }
  }
  function isPdfBytes(b) {
    return b[0] === 37 && b[1] === 80 && b[2] === 68 && b[3] === 70;
  }
  async function saveDoc(doc, opts = {}) {
    const bytes = await doc.save({ useObjectStreams: true, ...opts });
    return new Blob([bytes], { type: "application/pdf" });
  }
  function parseRangeGroups(str, total) {
    const groups = [];
    for (let part of String(str || "").split(/[,;]+/)) {
      part = part.trim().toLowerCase();
      if (!part) continue;
      let a, b;
      if (part === "odd" || part === "even") {
        const g2 = [];
        for (let i = part === "odd" ? 0 : 1; i < total; i += 2) g2.push(i);
        groups.push(g2);
        continue;
      }
      const m = part.match(/^(\d*|last)\s*(?:-|to|–)\s*(\d*|last)$/);
      if (m) {
        a = m[1] === "last" ? total : m[1] ? +m[1] : 1;
        b = m[2] === "last" ? total : m[2] ? +m[2] : total;
      } else if (/^(\d+|last)$/.test(part)) a = b = part === "last" ? total : +part;
      else throw new Error(`\u201C${part}\u201D is not a valid page range. Use e.g. 1-3, 5, 8-10`);
      a = Math.max(1, a);
      b = Math.min(total, b);
      const g = [];
      if (a <= b) for (let i = a; i <= b; i++) g.push(i - 1);
      else for (let i = a; i >= b; i--) g.push(i - 1);
      if (g.length) groups.push(g);
    }
    return groups;
  }
  function parsePages(str, total, fallbackAll = true) {
    if (!String(str || "").trim()) return fallbackAll ? [...Array(total).keys()] : [];
    return [...new Set(parseRangeGroups(str, total).flat())].sort((x, y) => x - y);
  }
  async function renderPage(pdf, num2, { scale, width, dpi, maxPixels = 16e6, bg = "#ffffff", intent = "display", annotations = true } = {}) {
    const page = typeof num2 === "object" ? num2 : await pdf.getPage(num2);
    const base = page.getViewport({ scale: 1 });
    let s = scale ?? (width ? width / base.width : dpi ? dpi / 72 : 1);
    if (base.width * base.height * s * s > maxPixels) s = Math.sqrt(maxPixels / (base.width * base.height));
    const vp = page.getViewport({ scale: s });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(vp.width));
    canvas.height = Math.max(1, Math.floor(vp.height));
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    await page.render({ canvasContext: ctx, viewport: vp, intent, annotationMode: annotations ? 1 : 0 }).promise;
    canvas.pdfSize = { w: base.width, h: base.height };
    return canvas;
  }
  function canvasBlob(canvas, type = "image/jpeg", quality = 0.9) {
    return new Promise((res, rej) => canvas.toBlob((b) => b ? res(b) : rej(new Error("Image encoding failed")), type, quality));
  }
  async function canvasBytes(canvas, type, quality) {
    return new Uint8Array(await (await canvasBlob(canvas, type, quality)).arrayBuffer());
  }
  async function rasterizeToPdf(pdf, { dpi = 150, quality = 0.82, format = "jpg", pages, transform, onProgress, keepPages } = {}) {
    const { PDFDocument } = await PL();
    const out = await PDFDocument.create();
    const list = pages || [...Array(pdf.numPages).keys()];
    for (let k = 0; k < list.length; k++) {
      const i = list[k];
      onProgress?.(k / list.length, `Rendering page ${i + 1} of ${pdf.numPages}`);
      let canvas = await renderPage(pdf, i + 1, { dpi });
      if (transform) canvas = await transform(canvas, i) || canvas;
      const bytes = await canvasBytes(canvas, format === "png" ? "image/png" : "image/jpeg", quality);
      const img = format === "png" ? await out.embedPng(bytes) : await out.embedJpg(bytes);
      const { w, h: h2 } = canvas.pdfSize;
      const p = out.addPage([w, h2]);
      p.drawImage(img, { x: 0, y: 0, width: w, height: h2 });
      await nextFrame();
    }
    return out;
  }
  async function pageText(pdf, num2) {
    const page = await pdf.getPage(num2);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items = [];
    for (const it of tc.items) {
      if (!it.str) continue;
      const [a, b, c, d, e, f] = it.transform;
      const [x, y] = vp.convertToViewportPoint(e, f);
      const size = Math.hypot(c, d) || Math.hypot(a, b) || 10;
      const vertical = Math.abs(b) > Math.abs(a);
      items.push({ str: it.str, x, y, w: it.width, h: size, size, font: it.fontName, eol: it.hasEOL, vertical });
    }
    return { items, width: vp.width, height: vp.height, page, vp };
  }
  function toLines(items) {
    const sorted = items.filter((i) => i.str.trim() || i.str === " ").sort((p, q) => Math.abs(p.y - q.y) < Math.min(p.size, q.size) * 0.45 ? p.x - q.x : p.y - q.y);
    const lines = [];
    for (const it of sorted) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.y - it.y) < Math.min(last.size, it.size) * 0.45) last.items.push(it);
      else lines.push({ y: it.y, size: it.size, items: [it] });
    }
    for (const ln of lines) {
      ln.items.sort((p, q) => p.x - q.x);
      let s = "", end = null;
      for (const it of ln.items) {
        if (end != null && it.x - end > it.size * 0.2 && !s.endsWith(" ") && !it.str.startsWith(" ")) s += it.x - end > it.size * 2 ? "	" : " ";
        s += it.str;
        end = it.x + it.w;
      }
      ln.text = s.replace(/\s+$/, "");
      ln.x = ln.items[0].x;
      ln.size = Math.max(...ln.items.map((i) => i.size));
    }
    return lines;
  }
  function measureStr(t2) {
    _mctx || (_mctx = document.createElement("canvas").getContext("2d"));
    _mctx.font = "100px Arial, Helvetica, sans-serif";
    return _mctx.measureText(t2).width;
  }
  function findInItems(items, matcher) {
    const rects = [];
    for (const it of items) {
      const s = it.str;
      if (!s) continue;
      const re = matcher instanceof RegExp ? new RegExp(matcher.source, matcher.flags.includes("g") ? matcher.flags : matcher.flags + "g") : null;
      const hits = [];
      if (re) {
        let m;
        while (m = re.exec(s)) {
          if (!m[0]) {
            re.lastIndex++;
            continue;
          }
          hits.push([m.index, m[0].length, m[0]]);
        }
      } else {
        const q = matcher.toLowerCase();
        let i = s.toLowerCase().indexOf(q);
        while (q && i >= 0) {
          hits.push([i, q.length, s.substr(i, q.length)]);
          i = s.toLowerCase().indexOf(q, i + q.length);
        }
      }
      if (!hits.length) continue;
      const full = measureStr(s) || 1, k = it.w / full;
      for (const [i, len, text] of hits) {
        const x0 = measureStr(s.slice(0, i)) * k, x1 = measureStr(s.slice(0, i + len)) * k;
        rects.push({ x: it.x + x0, y: it.y - it.size * 0.95, w: Math.max(1, x1 - x0), h: it.size * 1.25, text, size: it.size });
      }
    }
    return rects;
  }
  function hexRgb(hex) {
    const P = window.PDFLib;
    const n = parseInt(String(hex || "#000").replace("#", "").padEnd(6, "0").slice(0, 6), 16);
    return P.rgb((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255);
  }
  async function getFont(doc, name = "Helvetica") {
    const P = window.PDFLib;
    let m = fontCache.get(doc);
    if (!m) fontCache.set(doc, m = {});
    return m[name] || (m[name] = await doc.embedFont(P.StandardFonts[name] || P.StandardFonts.Helvetica));
  }
  function canEncode(font, text) {
    const enc = font.embedder?.encoding;
    if (enc?.canEncodeUnicodeCodePoint) {
      for (const ch of String(text)) {
        if (ch === "\n" || ch === "\r") continue;
        if (!enc.canEncodeUnicodeCodePoint(ch.codePointAt(0))) return false;
      }
      return true;
    }
    try {
      font.encodeText(text);
      return true;
    } catch {
      return false;
    }
  }
  async function textPng(text, sizePt, color = "#000", fontName = "Helvetica") {
    const k = 4;
    const lines = String(text).split("\n");
    const famRaw = CSS_FONT[fontName] || CSS_FONT.Helvetica;
    const bold = famRaw.startsWith("bold ");
    const fam = famRaw.replace("bold ", "");
    const font = `${bold ? "bold " : ""}${sizePt * k}px ${fam}, "Noto Sans", "Nirmala UI", "Mangal", sans-serif`;
    const c = document.createElement("canvas");
    const x = c.getContext("2d");
    x.font = font;
    const w = Math.ceil(Math.max(...lines.map((l) => x.measureText(l).width), 1)) + 2;
    const lh = sizePt * 1.2 * k;
    c.width = w;
    c.height = Math.ceil(lh * lines.length);
    x.font = font;
    x.fillStyle = color;
    x.textBaseline = "alphabetic";
    lines.forEach((l, i) => x.fillText(l, 1, lh * i + sizePt * k * 0.95));
    return { bytes: await canvasBytes(c, "image/png"), w: c.width / k, h: c.height / k };
  }
  function anchorXY(pos, pw, ph, w, h2, margin) {
    const col = pos[1], row = pos[0];
    const x = col === "l" ? margin : col === "r" ? pw - w - margin : (pw - w) / 2;
    const y = row === "t" ? ph - h2 - margin : row === "b" ? margin : (ph - h2) / 2;
    return { x, y };
  }
  function pageBox(page) {
    const b = page.getCropBox ? page.getCropBox() : page.getMediaBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height, rot: (page.getRotation().angle % 360 + 360) % 360 };
  }
  function visualToUser(page, vx, vy) {
    const { x, y, w, h: h2, rot } = pageBox(page);
    switch (rot) {
      case 90:
        return { x: x + w - vy, y: y + vx, r: 90 };
      case 180:
        return { x: x + w - vx, y: y + h2 - vy, r: 180 };
      case 270:
        return { x: x + vy, y: y + h2 - vx, r: 270 };
      default:
        return { x: x + vx, y: y + vy, r: 0 };
    }
  }
  function visualSize(page) {
    const { w, h: h2, rot } = pageBox(page);
    return rot % 180 ? { w: h2, h: w } : { w, h: h2 };
  }
  async function imageForPdf(src, { maxDim = 4e3, quality = 0.9, forceJpeg = false } = {}) {
    const blob = src instanceof Blob ? src : new Blob([src]);
    const t2 = blob.type;
    if (!forceJpeg && (t2 === "image/jpeg" || t2 === "image/png")) {
      const bmp = await createImageBitmap(blob).catch(() => null);
      if (bmp && Math.max(bmp.width, bmp.height) <= maxDim) {
        const r = { bytes: new Uint8Array(await blob.arrayBuffer()), type: t2 === "image/png" ? "png" : "jpg", w: bmp.width, h: bmp.height };
        bmp.close?.();
        return r;
      }
    }
    const img = await loadImage(blob);
    const s = Math.min(1, maxDim / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    const x = c.getContext("2d");
    const hasAlpha = /png|gif|webp|svg|avif/.test(t2) && !forceJpeg;
    if (!hasAlpha) {
      x.fillStyle = "#fff";
      x.fillRect(0, 0, c.width, c.height);
    }
    x.drawImage(img, 0, 0, c.width, c.height);
    return { bytes: await canvasBytes(c, hasAlpha ? "image/png" : "image/jpeg", quality), type: hasAlpha ? "png" : "jpg", w: c.width, h: c.height };
  }
  function loadImage(blob) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        res(img);
        setTimeout(() => URL.revokeObjectURL(url), 1e3);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        rej(new Error("This image could not be read. Try JPG or PNG."));
      };
      img.src = url;
    });
  }
  async function embedImage(doc, im) {
    return im.type === "png" ? doc.embedPng(im.bytes) : doc.embedJpg(im.bytes);
  }
  var PL, _mctx, fontCache, CSS_FONT, PAGE_SIZES, MM;
  var init_pdf = __esm({
    "js/core/pdf.js"() {
      init_lib();
      init_ui();
      PL = () => lib("pdflib");
      fontCache = /* @__PURE__ */ new WeakMap();
      CSS_FONT = { Helvetica: "Helvetica, Arial, sans-serif", HelveticaBold: "bold Helvetica, Arial, sans-serif", TimesRoman: '"Times New Roman", Times, serif', TimesRomanBold: 'bold "Times New Roman", serif', Courier: '"Courier New", monospace', CourierBold: 'bold "Courier New", monospace' };
      PAGE_SIZES = { A3: [841.89, 1190.55], A4: [595.28, 841.89], A5: [419.53, 595.28], Letter: [612, 792], Legal: [612, 1008], Tabloid: [792, 1224], B5: [498.9, 708.66] };
      MM = 72 / 25.4;
    }
  });

  // js/core/options.js
  function initValues(schema, values = {}) {
    for (const it of schema) if (it.key && values[it.key] === void 0) values[it.key] = typeof it.default === "function" ? it.default() : it.default ?? (it.type === "list" ? [] : it.type === "check" ? false : "");
    return values;
  }
  function renderOptions(schema, values, onChange = () => {
  }) {
    initValues(schema, values);
    const root = h("div.opts", { style: { display: "flex", flexDirection: "column", gap: "1rem" } });
    const rows = [];
    const set = (k, v, rerender) => {
      values[k] = v;
      refresh();
      onChange(k, v);
      if (rerender) rerender();
    };
    const refresh = () => rows.forEach(([it, el]) => {
      el.hidden = it.show ? !it.show(values) : false;
    });
    for (const it of schema) {
      const el = field(it, values, set);
      if (!el) continue;
      rows.push([it, el]);
      root.appendChild(el);
    }
    refresh();
    root.refresh = refresh;
    return root;
  }
  function wrap(it, control, extra) {
    const id = "o_" + it.key;
    const label = it.label ? h("label.option-label", { for: id }, h("span", { text: it.label }), extra || "") : "";
    return h("div.option-group", label, control, it.hint ? h("div.option-hint", { html: it.hint }) : "");
  }
  function field(it, values, set) {
    const id = "o_" + it.key;
    const v = values[it.key];
    switch (it.type) {
      case "heading":
        return h("div.option-heading", { text: it.label });
      case "info":
        return h(`div.option-info${it.warn ? ".warn" : ""}`, { html: typeof it.html === "function" ? it.html(values) : it.html });
      case "select": {
        const s = h(
          "select.option-select",
          { id, on: { change: (e) => set(it.key, e.target.value) } },
          it.options.map(([val, lab]) => h("option", { value: val, selected: String(val) === String(v) }, esc(lab)))
        );
        return wrap(it, s);
      }
      case "seg":
      case "cards": {
        const box = h(`div.seg${it.type === "cards" ? ".cards" : ""}`, { role: "radiogroup", "aria-label": it.label || it.key });
        const draw = () => {
          box.innerHTML = "";
          for (const [val, lab, extra] of it.options) {
            const on = String(values[it.key]) === String(val);
            const icon = it.type === "seg" && extra ? ic(extra) : "";
            const sub = it.type === "cards" && extra ? `<small>${esc(extra)}</small>` : "";
            box.appendChild(h("button", { type: "button", class: on ? "on" : "", role: "radio", "aria-checked": String(on), on: { click: () => set(it.key, val, draw) } }, icon + `<span>${esc(lab)}</span>` + sub));
          }
        };
        draw();
        return wrap(it, box);
      }
      case "range": {
        const out = h("output", { text: fmt(it, v) });
        const r = h("input", { id, type: "range", min: it.min ?? 0, max: it.max ?? 100, step: it.step ?? 1, value: v, on: { input: (e) => {
          out.textContent = fmt(it, +e.target.value);
          set(it.key, +e.target.value);
        } } });
        return wrap(it, h("div.range-row", r), out);
      }
      case "number":
        return wrap(it, h("input.option-input", { id, type: "number", inputmode: "decimal", min: it.min, max: it.max, step: it.step ?? 1, value: v, placeholder: it.placeholder || "", on: { input: (e) => set(it.key, e.target.value === "" ? "" : +e.target.value) } }));
      case "text":
      case "password":
      case "email":
      case "url":
      case "date":
      case "pages":
        return wrap(it, h("input.option-input", {
          id,
          type: it.type === "pages" ? "text" : it.type,
          value: v ?? "",
          placeholder: it.placeholder || (it.type === "pages" ? "e.g. 1-3, 5, 8-10" : ""),
          autocomplete: it.type === "password" ? "new-password" : "off",
          inputmode: it.type === "pages" ? "text" : void 0,
          on: { input: (e) => set(it.key, e.target.value) }
        }));
      case "textarea":
        return wrap(it, h("textarea.option-input", { id, rows: it.rows || 5, placeholder: it.placeholder || "", spellcheck: it.spellcheck ?? false, on: { input: (e) => set(it.key, e.target.value) } }, esc(v ?? "")));
      case "check":
        return h("div.option-group", h("label.switch", h("span", { text: it.label }), h("input", { type: "checkbox", checked: !!v, on: { change: (e) => set(it.key, e.target.checked) } })), it.hint ? h("div.option-hint", { html: it.hint }) : "");
      case "color": {
        const row = h("div.color-row");
        const draw = () => {
          row.innerHTML = "";
          for (const c of it.swatches || SWATCHES) row.appendChild(h("button", { type: "button", class: values[it.key] === c ? "on" : "", style: { background: c }, "aria-label": c, on: { click: () => set(it.key, c, draw) } }));
          row.appendChild(h("input", { type: "color", value: values[it.key] || "#000000", "aria-label": "Custom colour", on: { input: (e) => {
            values[it.key] = e.target.value;
            row.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
            set(it.key, e.target.value);
          } } }));
        };
        draw();
        return wrap(it, row);
      }
      case "position": {
        const grid = h("div.pos-grid", { role: "radiogroup", "aria-label": it.label || "Position" });
        const all = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];
        const names = { t: "Top", m: "Middle", b: "Bottom", l: "left", c: "centre", r: "right" };
        const draw = () => {
          grid.innerHTML = "";
          for (const p of all) {
            const allowed = !it.allowed || it.allowed.includes(p);
            grid.appendChild(h("button", { type: "button", class: values[it.key] === p ? "on" : "", disabled: !allowed, style: allowed ? {} : { visibility: "hidden" }, "aria-label": `${names[p[0]]} ${names[p[1]]}`, on: { click: () => set(it.key, p, draw) } }));
          }
        };
        draw();
        return wrap(it, grid);
      }
      case "image":
      case "file": {
        const isImg = it.type === "image";
        const label = h("span", { text: v?.name || it.placeholder || (isImg ? "Choose an image (PNG, JPG)" : "Choose file(s)") });
        const preview = h("img", { alt: "", hidden: !(isImg && v?.url), src: v?.url || "" });
        const inp = h("input", {
          type: "file",
          accept: it.accept || (isImg ? "image/*" : ""),
          multiple: !!it.multiple,
          on: { change: (e) => {
            const files = [...e.target.files];
            if (!files.length) return;
            if (isImg) {
              const f = files[0];
              const val = { file: f, name: f.name, url: URL.createObjectURL(f) };
              preview.src = val.url;
              preview.hidden = false;
              label.textContent = f.name;
              set(it.key, val);
            } else {
              label.textContent = files.length === 1 ? files[0].name : `${files.length} files selected`;
              set(it.key, it.multiple ? files : files[0]);
            }
          } }
        });
        return wrap(it, h("div.file-opt", ic(isImg ? "image-plus" : "paperclip"), preview, label, inp));
      }
      case "list":
        return wrap(it, listEditor(it, values, set));
      case "custom": {
        const box = h("div");
        it.render(box, values, (k, val) => set(k, val));
        return it.label ? wrap(it, box) : box;
      }
    }
    return null;
  }
  function fmt(it, v) {
    return it.format ? it.format(v) : `${v}${it.unit || ""}`;
  }
  function listEditor(it, values, set) {
    const box = h("div.list-editor");
    const draw = () => {
      box.innerHTML = "";
      const rows = values[it.key];
      rows.forEach((row, i) => {
        const r = h("div.list-row");
        for (const f of it.fields) {
          r.appendChild(h(`input.option-input${f.type === "number" ? ".w-num" : ""}`, {
            type: f.type || "text",
            value: row[f.key] ?? "",
            placeholder: f.placeholder || "",
            "aria-label": f.placeholder || f.key,
            style: f.width ? { width: f.width, flex: "0 0 auto" } : { flex: "1" },
            on: { input: (e) => {
              row[f.key] = f.type === "number" ? e.target.value === "" ? "" : +e.target.value : e.target.value;
              set(it.key, rows);
            } }
          }));
        }
        r.appendChild(h("button.mini-btn.icon-only", { type: "button", "aria-label": "Remove row", on: { click: () => {
          rows.splice(i, 1);
          set(it.key, rows, draw);
        } } }, ic("x")));
        box.appendChild(r);
      });
      box.appendChild(h("button.mini-btn", { type: "button", style: { alignSelf: "flex-start" }, on: { click: () => {
        rows.push(Object.fromEntries(it.fields.map((f) => [f.key, f.default ?? ""])));
        set(it.key, rows, draw);
      } } }, ic("plus"), it.addLabel || "Add row"));
    };
    box.redraw = draw;
    it._redraw = draw;
    draw();
    return box;
  }
  var SWATCHES;
  var init_options = __esm({
    "js/core/options.js"() {
      init_ui();
      SWATCHES = ["#000000", "#ffffff", "#e11d48", "#ea580c", "#ca8a04", "#16a34a", "#2563eb", "#7c3aed", "#6b7280"];
    }
  });

  // js/core/editor.js
  function clamp(v, a, b) {
    return Math.min(b, Math.max(a, v));
  }
  function simplify(pts, tol) {
    const out = [pts[0]];
    for (const p of pts.slice(1)) {
      const q = out[out.length - 1];
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) > tol) out.push(p);
    }
    if (out.length < 2) out.push(pts[pts.length - 1]);
    return out;
  }
  function arrowHead(x1, y1, x2, y2, w) {
    const a = Math.atan2(y2 - y1, x2 - x1), L2 = 6 + w * 3, s = 0.45;
    const p1 = [x2 - L2 * Math.cos(a - s), y2 - L2 * Math.sin(a - s)], p2 = [x2 - L2 * Math.cos(a + s), y2 - L2 * Math.sin(a + s)];
    return { svg: `M${p1[0]} ${p1[1]} L${x2} ${y2} L${p2[0]} ${p2[1]}`, p1, p2 };
  }
  function pickImage() {
    return new Promise((resolve) => {
      const inp = h("input", { type: "file", accept: "image/*" });
      inp.onchange = async () => {
        const f = inp.files[0];
        if (!f) return resolve(null);
        resolve(await fileToImg(f));
      };
      inp.click();
    });
  }
  async function fileToImg(f) {
    const src = await new Promise((r) => {
      const fr = new FileReader();
      fr.onload = () => r(fr.result);
      fr.readAsDataURL(f);
    });
    const im = await new Promise((r, j) => {
      const i = new Image();
      i.onload = () => r(i);
      i.onerror = j;
      i.src = src;
    });
    if (!/png|jpe?g/.test(f.type)) {
      const c = document.createElement("canvas");
      c.width = im.width;
      c.height = im.height;
      c.getContext("2d").drawImage(im, 0, 0);
      return { src: c.toDataURL("image/png"), w: im.width, h: im.height };
    }
    return { src, w: im.width, h: im.height };
  }
  function loadSigFonts() {
    if (document.getElementById("sig-fonts")) return;
    document.head.appendChild(h("link", { id: "sig-fonts", rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Dancing+Script:wght@600&family=Great+Vibes&family=Homemade+Apple&family=Sacramento&display=swap" }));
  }
  async function signatureDialog(initials = false) {
    loadSigFonts();
    const key = initials ? "saved-initials" : "saved-signature";
    const saved = store.get(key);
    let mode = saved ? "saved" : "draw", color = "#0f172a", typedFont = SIG_FONTS[0], uploaded = null;
    const body = h("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } });
    const tabs = h("div.seg");
    const area = h("div");
    const colors = h("div.color-row", ["#0f172a", "#1d4ed8", "#b91c1c"].map((c) => h("button", { type: "button", style: { background: c }, "aria-label": c, class: c === color ? "on" : "", on: { click: (e) => {
      color = c;
      colors.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === e.currentTarget));
      redrawTyped();
      pad.recolor(c);
    } } })));
    const remember = h("label.switch", h("span", { text: "Remember on this device" }), h("input", { type: "checkbox", checked: true }));
    const canvas = h("canvas.sig-canvas");
    const pad = makePad(canvas, () => color);
    const typedInput = h("input.option-input", { type: "text", placeholder: initials ? "Your initials" : "Type your name", maxlength: 40, on: { input: () => redrawTyped() } });
    const typedList = h("div", { style: { display: "flex", flexDirection: "column", gap: ".5rem" } });
    function redrawTyped() {
      typedList.innerHTML = "";
      for (const f of SIG_FONTS) typedList.appendChild(h("div.sig-typed", { class: f === typedFont ? "on" : "", style: { fontFamily: `'${f}', cursive`, color }, on: { click: () => {
        typedFont = f;
        redrawTyped();
      } } }, esc(typedInput.value || (initials ? "AB" : "Your Name"))));
    }
    const upInput = h("input", { type: "file", accept: "image/*" });
    const upPreview = h("img", { alt: "", style: { maxHeight: "140px", margin: "0 auto", display: "none" } });
    const removeBg = h("label.switch", h("span", { text: "Remove white background" }), h("input", { type: "checkbox", checked: true }));
    upInput.onchange = async () => {
      const f = upInput.files[0];
      if (!f) return;
      uploaded = await fileToImg(f);
      upPreview.src = uploaded.src;
      upPreview.style.display = "block";
    };
    const draw = () => {
      tabs.innerHTML = "";
      const opts = [...saved ? [["saved", "Saved", "history"]] : [], ["draw", "Draw", "pen-line"], ["type", "Type", "type"], ["upload", "Upload", "upload"]];
      for (const [m, l, i] of opts) tabs.appendChild(h("button", { type: "button", class: mode === m ? "on" : "", on: { click: () => {
        mode = m;
        draw();
      } } }, ic(i), l));
      area.innerHTML = "";
      if (mode === "saved") area.append(h("div", { style: { background: "#fff", borderRadius: "12px", padding: "1rem", border: "2px solid var(--border)" } }, h("img", { src: saved.src, alt: "Saved signature", style: { maxHeight: "120px", margin: "0 auto" } })), h("button.mini-btn", { type: "button", style: { marginTop: ".6rem" }, on: { click: () => {
        store.set(key, null);
        mode = "draw";
        draw();
      } } }, ic("trash-2"), "Forget saved"));
      if (mode === "draw") {
        area.append(canvas, h("div", { style: { display: "flex", justifyContent: "space-between", marginTop: ".5rem", alignItems: "center" } }, colors, h("button.mini-btn", { type: "button", on: { click: () => pad.clear() } }, ic("eraser"), "Clear")));
        requestAnimationFrame(() => pad.resize());
      }
      if (mode === "type") {
        area.append(typedInput, h("div", { style: { height: ".6rem" } }), typedList, h("div", { style: { marginTop: ".6rem" } }, colors));
        redrawTyped();
        setTimeout(() => typedInput.focus(), 30);
      }
      if (mode === "upload") area.append(h("div.file-opt", ic("upload"), h("span", "Choose a photo of your signature"), upInput), h("div", { style: { height: ".6rem" } }), upPreview, removeBg);
    };
    body.append(tabs, area, remember);
    draw();
    const result = await modal({
      title: initials ? "Your initials" : "Your signature",
      body,
      actions: [{ label: "Cancel", value: null }, { label: "Use it", primary: true, value: async () => {
        let img = null;
        if (mode === "saved") img = saved;
        if (mode === "draw") {
          if (pad.empty()) {
            toast("Please draw your signature first", "error");
            return void 0;
          }
          img = trimCanvas(pad.canvas);
        }
        if (mode === "type") {
          await document.fonts?.load?.(`64px '${typedFont}'`);
          img = typedToImg(typedInput.value || (initials ? "AB" : "Your Name"), typedFont, color);
        }
        if (mode === "upload") {
          if (!uploaded) {
            toast("Choose an image first", "error");
            return void 0;
          }
          img = removeBg.querySelector("input").checked ? await knockOutWhite(uploaded) : uploaded;
        }
        if (img && remember.querySelector("input").checked && mode !== "saved") store.set(key, img);
        return img;
      } }]
    });
    return result;
  }
  function makePad(canvas, getColor) {
    let strokes = [], cur = null, ctx;
    const api = {
      canvas,
      resize() {
        const r = canvas.getBoundingClientRect();
        const d = Math.min(3, window.devicePixelRatio || 1) * 1.5;
        canvas.width = Math.max(10, r.width * d);
        canvas.height = Math.max(10, r.height * d);
        ctx = canvas.getContext("2d");
        ctx.scale(d, d);
        redraw();
      },
      clear() {
        strokes = [];
        redraw();
      },
      empty: () => !strokes.length,
      recolor(c) {
        strokes.forEach((s) => s.c = c);
        redraw();
      }
    };
    function redraw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of strokes) {
        ctx.strokeStyle = s.c;
        ctx.lineWidth = 2.6;
        ctx.lineCap = ctx.lineJoin = "round";
        ctx.beginPath();
        s.p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        if (s.p.length === 1) ctx.lineTo(s.p[0][0] + 0.1, s.p[0][1]);
        ctx.stroke();
      }
    }
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      cur = { c: getColor(), p: [pos(e)] };
      strokes.push(cur);
      redraw();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!cur) return;
      for (const ev of e.getCoalescedEvents?.() || [e]) cur.p.push(pos(ev));
      redraw();
    });
    const end = () => {
      cur = null;
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    return api;
  }
  function trimCanvas(c) {
    const ctx = c.getContext("2d");
    const { width: w, height: hh } = c;
    const d = ctx.getImageData(0, 0, w, hh).data;
    let x0 = w, y0 = hh, x1 = 0, y1 = 0;
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 10) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    const pad = 6;
    x0 = Math.max(0, x0 - pad);
    y0 = Math.max(0, y0 - pad);
    x1 = Math.min(w, x1 + pad);
    y1 = Math.min(hh, y1 + pad);
    const o = document.createElement("canvas");
    o.width = Math.max(1, x1 - x0);
    o.height = Math.max(1, y1 - y0);
    o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
    return { src: o.toDataURL("image/png"), w: o.width, h: o.height };
  }
  function typedToImg(text, font, color) {
    const c = document.createElement("canvas");
    const x = c.getContext("2d");
    const size = 120;
    x.font = `${size}px '${font}'`;
    const w = x.measureText(text).width;
    c.width = Math.ceil(w + 40);
    c.height = Math.ceil(size * 1.6);
    x.font = `${size}px '${font}'`;
    x.fillStyle = color;
    x.textBaseline = "middle";
    x.fillText(text, 20, c.height / 2);
    return trimCanvas(c);
  }
  async function knockOutWhite(img) {
    const im = await new Promise((r) => {
      const i = new Image();
      i.onload = () => r(i);
      i.src = img.src;
    });
    const c = document.createElement("canvas");
    const s = Math.min(1, 1600 / Math.max(im.width, im.height));
    c.width = im.width * s;
    c.height = im.height * s;
    const x = c.getContext("2d");
    x.drawImage(im, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) {
      const l = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3;
      if (l > 200) d.data[i + 3] = 0;
      else if (l > 140) d.data[i + 3] = Math.round(255 * (200 - l) / 60);
    }
    x.putImageData(d, 0, 0);
    return trimCanvas(c);
  }
  async function applyObjects(doc, objects, { skip = [] } = {}) {
    const P = await PL();
    const pages = doc.getPages();
    const imgCache = /* @__PURE__ */ new Map();
    const form = objects.some((o) => o.type === "field") ? doc.getForm() : null;
    for (const o of objects) {
      if (skip.includes(o.type)) continue;
      const page = pages[o.page];
      if (!page) continue;
      const { w: W, h: H } = visualSize(page);
      const V = (fx, fy) => visualToUser(page, fx * W, H - fy * H);
      const hh = o.hRatio ? o.w * W * o.hRatio : o.h * H;
      const box = () => {
        const bl = V(o.x, o.y + hh / H);
        return { x: bl.x, y: bl.y, w: o.w * W, h: hh, r: bl.r };
      };
      const rectUser = () => {
        const a = V(o.x, o.y), b = V(o.x + o.w, o.y + hh / H);
        return [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y)];
      };
      switch (o.type) {
        case "text": {
          const lines = o.text.split("\n");
          const font = await getFont(doc, o.font);
          if (canEncode(font, o.text)) {
            lines.forEach((ln, i) => {
              const p = V(o.x, o.y + o.size * (0.95 + i * 1.2) / H);
              page.drawText(ln, { x: p.x, y: p.y, size: o.size, font, color: hexRgb(o.color), rotate: P.degrees(p.r) });
            });
          } else {
            const t2 = await textPng(o.text, o.size, o.color, o.font);
            const img = await doc.embedPng(t2.bytes);
            const p = V(o.x, o.y + t2.h / H);
            page.drawImage(img, { x: p.x, y: p.y, width: t2.w, height: t2.h, rotate: P.degrees(p.r) });
          }
          break;
        }
        case "image": {
          let img = imgCache.get(o.src);
          if (!img) {
            const bytes = dataUrlBytes(o.src);
            img = o.src.startsWith("data:image/png") ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
            imgCache.set(o.src, img);
          }
          const b = box();
          page.drawImage(img, { x: b.x, y: b.y, width: b.w, height: b.h, opacity: o.opacity ?? 1, rotate: P.degrees(b.r) });
          break;
        }
        case "rect":
        case "whiteout":
        case "redact":
        case "highlight": {
          const b = box();
          const opt = { x: b.x, y: b.y, width: b.w, height: b.h, rotate: P.degrees(b.r) };
          if (o.type === "rect") Object.assign(opt, { borderColor: hexRgb(o.stroke), borderWidth: o.width, ...o.fill ? { color: hexRgb(o.fill) } : {} });
          if (o.type === "whiteout") opt.color = P.rgb(1, 1, 1);
          if (o.type === "redact") opt.color = P.rgb(0, 0, 0);
          if (o.type === "highlight") Object.assign(opt, { color: hexRgb(o.color), opacity: o.opacity, blendMode: P.BlendMode.Multiply });
          page.drawRectangle(opt);
          break;
        }
        case "ellipse": {
          const b = box();
          const c = V(o.x + o.w / 2, o.y + hh / H / 2);
          const sw = b.r % 180 ? [b.h / 2, b.w / 2] : [b.w / 2, b.h / 2];
          page.drawEllipse({ x: c.x, y: c.y, xScale: sw[0], yScale: sw[1], borderColor: hexRgb(o.stroke), borderWidth: o.width, ...o.fill ? { color: hexRgb(o.fill) } : {} });
          break;
        }
        case "line":
        case "arrow": {
          const a = V(o.x1, o.y1), b = V(o.x2, o.y2);
          const col = hexRgb(o.stroke);
          page.drawLine({ start: { x: a.x, y: a.y }, end: { x: b.x, y: b.y }, thickness: o.width, color: col, lineCap: P.LineCapStyle.Round });
          if (o.type === "arrow") {
            const ah = arrowHead(a.x, a.y, b.x, b.y, o.width);
            for (const q of [ah.p1, ah.p2]) page.drawLine({ start: { x: q[0], y: q[1] }, end: { x: b.x, y: b.y }, thickness: o.width, color: col, lineCap: P.LineCapStyle.Round });
          }
          break;
        }
        case "draw": {
          const pts = o.points.map(([fx, fy]) => V(fx, fy));
          const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${(-p.y).toFixed(2)}`).join(" ");
          page.drawSvgPath(path, { x: 0, y: 0, borderColor: hexRgb(o.stroke), borderWidth: o.width, borderLineCap: P.LineCapStyle.Round });
          break;
        }
        case "stamp": {
          const b = box();
          const col = hexRgb(o.color);
          const font = await getFont(doc, "HelveticaBold");
          page.drawRectangle({ x: b.x, y: b.y, width: b.w, height: b.h, borderColor: col, borderWidth: Math.max(2, b.h * 0.07), opacity: 0, borderOpacity: 0.9, rotate: P.degrees(b.r) });
          let size = b.h * 0.5;
          const tw = () => font.widthOfTextAtSize(o.text, size);
          while (tw() > b.w * 0.88 && size > 4) size -= 0.5;
          const vx = o.x * W + (b.w - tw()) / 2, vy = H - (o.y * H + b.h / 2 + size * 0.35);
          const p = visualToUser(page, vx, vy);
          if (canEncode(font, o.text)) page.drawText(o.text, { x: p.x, y: p.y, size, font, color: col, opacity: 0.9, rotate: P.degrees(p.r) });
          break;
        }
        case "link": {
          const [x1, y1, x2, y2] = rectUser();
          const dict = { Type: "Annot", Subtype: "Link", Rect: [x1, y1, x2, y2], Border: [0, 0, 0] };
          if (o.target === "page") {
            const tp = pages[Math.max(0, Math.min(pages.length - 1, (o.page || 1) - 1))];
            dict.Dest = [tp.ref, "Fit"];
          } else dict.A = { Type: "Action", S: "URI", URI: P.PDFString.of(normalizeUrl(o.url)) };
          addAnnot(doc, page, doc.context.obj(dict));
          break;
        }
        case "note": {
          const [x1, , , y2] = rectUser();
          addAnnot(doc, page, doc.context.obj({ Type: "Annot", Subtype: "Text", Rect: [x1, y2 - 20, x1 + 20, y2], Contents: P.PDFHexString.fromText(o.text || ""), Name: "Comment", C: [1, 0.85, 0.2], T: P.PDFHexString.fromText("Comment"), M: P.PDFString.fromDate(/* @__PURE__ */ new Date()), F: 4 }));
          break;
        }
        case "field": {
          const [x1, y1, x2, y2] = rectUser();
          const pos = { x: x1, y: y1, width: x2 - x1, height: y2 - y1, borderWidth: 1, borderColor: P.rgb(0.6, 0.6, 0.7) };
          let name = (o.name || `field_${o.id}`).replace(/[.]/g, "_");
          let n = 1;
          while (form.getFieldMaybe?.(name)) name = `${o.name}_${++n}`;
          if (o.kind === "text" || o.kind === "sign") {
            const f = form.createTextField(name);
            if (o.multiline) f.enableMultiline();
            if (o.required) f.enableRequired();
            f.addToPage(page, pos);
          }
          if (o.kind === "check") form.createCheckBox(name).addToPage(page, pos);
          if (o.kind === "select") {
            const f = form.createDropdown(name);
            f.addOptions(String(o.options || "").split(",").map((s) => s.trim()).filter(Boolean));
            f.addToPage(page, pos);
          }
          break;
        }
      }
    }
    return doc;
  }
  function addAnnot(doc, page, annotDict) {
    const P = window.PDFLib;
    const ref = doc.context.register(annotDict);
    const annots = page.node.lookup(P.PDFName.of("Annots"));
    if (annots instanceof P.PDFArray) annots.push(ref);
    else page.node.set(P.PDFName.of("Annots"), doc.context.obj([ref]));
  }
  function normalizeUrl(u) {
    u = String(u || "").trim();
    if (!u) return "https://";
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(u)) return "mailto:" + u;
    return "https://" + u;
  }
  function dataUrlBytes(src) {
    const b = atob(src.split(",")[1]);
    const a = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return a;
  }
  var uid, today, TOOLDEFS, BOX_DEFAULT, STAMPS, PageEditor, SIG_FONTS;
  var init_editor = __esm({
    "js/core/editor.js"() {
      init_ui();
      init_pdf();
      uid = 0;
      today = () => (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, { day: "2-digit", month: "short", year: "numeric" });
      TOOLDEFS = {
        select: { label: "Select", icon: "mouse-pointer-2" },
        text: { label: "Text", icon: "type", mode: "click", make: () => ({ type: "text", text: "Type here", size: 16, color: "#111111", font: "Helvetica" }) },
        image: { label: "Image", icon: "image-plus", mode: "image" },
        signature: { label: "Signature", icon: "signature", mode: "signature" },
        initials: { label: "Initials", icon: "pen-line", mode: "signature", initials: true },
        date: { label: "Date", icon: "calendar", mode: "click", make: () => ({ type: "text", text: today(), size: 12, color: "#111111", font: "Helvetica" }) },
        rect: { label: "Box", icon: "square", mode: "box", make: () => ({ type: "rect", stroke: "#e11d48", fill: "", width: 2 }) },
        ellipse: { label: "Circle", icon: "circle", mode: "box", make: () => ({ type: "ellipse", stroke: "#2563eb", fill: "", width: 2 }) },
        line: { label: "Line", icon: "minus", mode: "line", make: () => ({ type: "line", stroke: "#111111", width: 2 }) },
        arrow: { label: "Arrow", icon: "move-up-right", mode: "line", make: () => ({ type: "arrow", stroke: "#e11d48", width: 2.5 }) },
        highlight: { label: "Highlight", icon: "highlighter", mode: "box", make: () => ({ type: "highlight", color: "#fde047", opacity: 0.45 }) },
        draw: { label: "Draw", icon: "brush", mode: "draw", make: () => ({ type: "draw", stroke: "#1d4ed8", width: 2.5 }) },
        whiteout: { label: "Whiteout", icon: "eraser", mode: "box", make: () => ({ type: "whiteout" }) },
        redact: { label: "Redact", icon: "square", mode: "box", make: () => ({ type: "redact" }) },
        link: { label: "Link", icon: "link", mode: "box", make: () => ({ type: "link", url: "https://", target: "url", page: 1 }) },
        note: { label: "Note", icon: "sticky-note", mode: "click", make: () => ({ type: "note", text: "Comment", w: 0.045, hRatio: 1 }) },
        "field-text": { label: "Text field", icon: "text-cursor-input", mode: "box", make: () => ({ type: "field", kind: "text", name: "" }) },
        "field-check": { label: "Checkbox", icon: "square-check", mode: "click", make: () => ({ type: "field", kind: "check", name: "", w: 0.035, hRatio: 1 }) },
        "field-select": { label: "Dropdown", icon: "list", mode: "box", make: () => ({ type: "field", kind: "select", name: "", options: "Option 1, Option 2, Option 3" }) },
        "field-sign": { label: "Sign field", icon: "signature", mode: "box", make: () => ({ type: "field", kind: "sign", name: "" }) },
        stamp: { label: "Stamp", icon: "stamp", mode: "click", make: () => ({ type: "stamp", text: "APPROVED", color: "#16a34a", w: 0.3, hRatio: 0.28 }) },
        crop: { label: "Crop", icon: "crop", mode: "none" }
      };
      BOX_DEFAULT = { rect: [0.25, 0.08], ellipse: [0.2, 0.1], highlight: [0.3, 0.025], whiteout: [0.25, 0.04], redact: [0.25, 0.03], link: [0.25, 0.03], field: [0.35, 0.035] };
      STAMPS = ["APPROVED", "PAID", "RECEIVED", "DRAFT", "CONFIDENTIAL", "REJECTED", "VOID", "COPY", "URGENT", "FINAL", "VERIFIED", "FOR REVIEW"];
      PageEditor = class {
        constructor({ pdf, tools, defaultTool = "select", providers = {}, objects = [], onChange, hint }) {
          this.pdf = pdf;
          this.tools = ["select", ...tools.filter((t2) => t2 !== "select")];
          this.tool = defaultTool;
          this.providers = providers;
          this.objects = objects;
          this.onChange = onChange || (() => {
          });
          this.page = 0;
          this.sel = null;
          this.history = [];
          this.hint = hint;
          this.build();
        }
        build() {
          this.toolbar = h("div.ed-tools", { role: "toolbar", "aria-label": "Editing tools" });
          this.nav = h("div.ed-nav");
          this.stage = h("div.ed-stage");
          this.stageWrap = h("div.ed-stage-wrap", this.stage);
          this.props = h("div.ed-props", { hidden: true });
          this.hintEl = h("div.ed-hint");
          this.el = h("div.editor", this.toolbar, this.nav, this.hintEl, this.stageWrap, this.props);
          this.drawToolbar();
          this.stage.addEventListener("pointerdown", (e) => this.onStageDown(e));
          let rt;
          this._onResize = () => {
            clearTimeout(rt);
            rt = setTimeout(() => this.el.isConnected && this.renderPage(), 200);
          };
          window.addEventListener("resize", this._onResize);
          this._onKey = (e) => {
            if (!this.el.isConnected) return;
            if ((e.key === "Delete" || e.key === "Backspace") && this.sel && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) {
              e.preventDefault();
              this.remove(this.sel);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
              e.preventDefault();
              this.undo();
            }
          };
          document.addEventListener("keydown", this._onKey);
        }
        destroy() {
          window.removeEventListener("resize", this._onResize);
          document.removeEventListener("keydown", this._onKey);
        }
        drawToolbar() {
          this.toolbar.innerHTML = "";
          for (const t2 of this.tools) {
            const d = this.providers[t2] || TOOLDEFS[t2];
            if (!d) continue;
            this.toolbar.appendChild(h("button.ed-tool", { type: "button", class: this.tool === t2 ? "on" : "", "aria-pressed": String(this.tool === t2), on: { click: () => this.setTool(t2) } }, ic(d.icon), h("span", { text: d.label })));
          }
          this.toolbar.appendChild(h("button.ed-tool", { type: "button", on: { click: () => this.undo() }, title: "Undo" }, ic("undo-2"), h("span", { text: "Undo" })));
          this.updateHint();
        }
        updateHint() {
          const d = this.providers[this.tool] || TOOLDEFS[this.tool] || {};
          const msg = this.hint?.(this.tool) || {
            select: "Tap an item to select it. Drag to move, use the round handle to resize.",
            box: "Drag on the page to draw. Tap once for a default size.",
            line: "Drag on the page from start to end.",
            draw: "Draw on the page with your finger, pen or mouse.",
            click: "Tap on the page where you want to place it.",
            image: "Tap on the page where the image should go.",
            signature: "Tap on the page where you want to sign.",
            provider: "Tap on the page where it should go."
          }[d.mode || (this.providers[this.tool] ? "provider" : "select")] || "";
          this.hintEl.textContent = msg;
        }
        async setTool(t2) {
          this.tool = t2;
          this.select(null);
          this.drawToolbar();
          this.stage.classList.toggle("placing", t2 !== "select");
        }
        snapshot() {
          this.history.push(JSON.stringify(this.objects));
          if (this.history.length > 60) this.history.shift();
        }
        undo() {
          const s = this.history.pop();
          if (!s) return toast("Nothing to undo");
          this.objects.splice(0, this.objects.length, ...JSON.parse(s));
          this.sel = null;
          this.drawObjects();
          this.onChange();
        }
        changed() {
          this.drawObjects();
          this.onChange();
        }
        async goto(i) {
          this.page = Math.max(0, Math.min(this.pdf.numPages - 1, i));
          this.select(null);
          await this.renderPage();
        }
        async renderPage() {
          const n = this.pdf.numPages;
          this.nav.innerHTML = "";
          this.nav.append(
            h("button.mini-btn.icon-only", { type: "button", "aria-label": "Previous page", disabled: this.page === 0, on: { click: () => this.goto(this.page - 1) } }, ic("chevron-left")),
            h("span", { text: `Page ${this.page + 1} of ${n}` }),
            h("button.mini-btn.icon-only", { type: "button", "aria-label": "Next page", disabled: this.page >= n - 1, on: { click: () => this.goto(this.page + 1) } }, ic("chevron-right"))
          );
          const page = await this.pdf.getPage(this.page + 1);
          const vp1 = page.getViewport({ scale: 1 });
          this.pw = vp1.width;
          this.ph = vp1.height;
          const avail = Math.max(240, Math.min(980, (this.stageWrap.clientWidth || 800) - 24));
          const scale = avail / vp1.width;
          this.dispW = avail;
          this.dispH = vp1.height * scale;
          const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
          const canvas = await renderPage(this.pdf, page, { scale: scale * dpr });
          this.stage.innerHTML = "";
          this.stage.style.width = this.dispW + "px";
          this.stage.style.height = this.dispH + "px";
          this.stage.appendChild(canvas);
          this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          this.svg.setAttribute("class", "ed-svg");
          this.svg.setAttribute("viewBox", `0 0 ${this.pw} ${this.ph}`);
          this.svg.setAttribute("preserveAspectRatio", "none");
          this.stage.appendChild(this.svg);
          this.layer = h("div", { style: { position: "absolute", inset: "0" } });
          this.stage.appendChild(this.layer);
          this.drawObjects();
        }
        pt2px(pt) {
          return pt * this.dispW / this.pw;
        }
        frac(e) {
          const r = this.stage.getBoundingClientRect();
          return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
        }
        drawObjects() {
          if (!this.layer) return;
          this.layer.innerHTML = "";
          this.svg.innerHTML = "";
          for (const o of this.objects.filter((o2) => o2.page === this.page)) {
            if (o.type === "line" || o.type === "arrow" || o.type === "draw") this.drawSvgObj(o);
            else this.drawBoxObj(o);
          }
          this.drawProps();
        }
        drawSvgObj(o) {
          const NS = "http://www.w3.org/2000/svg";
          const W = this.pw, H = this.ph;
          const g = document.createElementNS(NS, "g");
          g.style.cursor = "move";
          let d;
          if (o.type === "draw") d = o.points.map((p, i) => `${i ? "L" : "M"}${p[0] * W} ${p[1] * H}`).join(" ");
          else {
            d = `M${o.x1 * W} ${o.y1 * H} L${o.x2 * W} ${o.y2 * H}`;
            if (o.type === "arrow") d += " " + arrowHead(o.x1 * W, o.y1 * H, o.x2 * W, o.y2 * H, o.width).svg;
          }
          const mk = (stroke, width, extra = {}) => {
            const p = document.createElementNS(NS, "path");
            p.setAttribute("d", d);
            p.setAttribute("fill", "none");
            p.setAttribute("stroke", stroke);
            p.setAttribute("stroke-width", width);
            p.setAttribute("stroke-linecap", "round");
            p.setAttribute("stroke-linejoin", "round");
            for (const k in extra) p.setAttribute(k, extra[k]);
            return p;
          };
          const hit = mk("transparent", Math.max(14, o.width * 4) * this.pw / this.dispW, { "pointer-events": "stroke" });
          if (this.sel === o.id) g.appendChild(mk("#6366f1", o.width + 4 * this.pw / this.dispW, { opacity: ".35" }));
          g.appendChild(mk(o.stroke, o.width));
          g.appendChild(hit);
          g.addEventListener("pointerdown", (e) => this.onObjDown(e, o, "move"));
          this.svg.appendChild(g);
        }
        drawBoxObj(o) {
          const el = h(`div.ed-obj.t-${o.type}`, { class: this.sel === o.id ? "sel" : "" });
          el.style.left = o.x * 100 + "%";
          el.style.top = o.y * 100 + "%";
          if (o.type === "text") {
            const f = CSS_FONT[o.font] || CSS_FONT.Helvetica;
            const bold = f.startsWith("bold ");
            el.appendChild(h("div.txt", { text: o.text, style: { fontSize: this.pt2px(o.size) + "px", color: o.color, fontFamily: f.replace("bold ", ""), fontWeight: bold ? "700" : "400" } }));
          } else {
            const hh = o.hRatio ? o.w * this.dispW * o.hRatio : o.h * this.dispH;
            el.style.width = o.w * 100 + "%";
            el.style.height = hh + "px";
            if (o.type === "image") {
              el.appendChild(h("img", { src: o.src, alt: "" }));
              el.style.opacity = o.opacity ?? 1;
            }
            if (o.type === "rect" || o.type === "ellipse") Object.assign(el.style, { border: `${Math.max(1, this.pt2px(o.width))}px solid ${o.stroke}`, background: o.fill || "transparent", borderRadius: o.type === "ellipse" ? "50%" : "0" });
            if (o.type === "highlight") Object.assign(el.style, { background: o.color, opacity: o.opacity });
            if (o.type === "note") el.innerHTML = ic("message-square");
            if (o.type === "field") el.textContent = o.kind === "check" ? "\u2610" : `${{ text: "Text", select: "Dropdown", sign: "Signature" }[o.kind]}: ${o.name || "(unnamed)"}`;
            if (o.type === "stamp") Object.assign(el.style, { color: o.color, borderColor: o.color, borderWidth: Math.max(2, this.pt2px(3)) + "px", fontSize: hh * 0.5 + "px" }), el.textContent = o.text;
            if (o.type === "link") el.title = o.target === "page" ? `Go to page ${o.page}` : o.url;
          }
          el.appendChild(h("span.h", { on: { pointerdown: (e) => this.onObjDown(e, o, "resize") } }));
          el.addEventListener("pointerdown", (e) => this.onObjDown(e, o, "move"));
          this.layer.appendChild(el);
          if (o.type === "text") {
            requestAnimationFrame(() => {
              o.w = el.offsetWidth / this.dispW;
              o.h = el.offsetHeight / this.dispH;
            });
          }
        }
        select(id) {
          this.sel = id;
          if (this.layer) this.drawObjects();
        }
        get selected() {
          return this.objects.find((o) => o.id === this.sel);
        }
        remove(id) {
          this.snapshot();
          const i = this.objects.findIndex((o) => o.id === id);
          if (i >= 0) this.objects.splice(i, 1);
          this.sel = null;
          this.changed();
        }
        add(o, keepTool) {
          this.snapshot();
          o.id = ++uid;
          o.page ?? (o.page = this.page);
          this.objects.push(o);
          this.sel = o.id;
          const d = TOOLDEFS[this.tool];
          if (!keepTool && !(d && ["box", "line", "draw"].includes(d.mode))) {
            this.tool = "select";
            this.stage.classList.remove("placing");
            this.drawToolbar();
          }
          this.changed();
          return o;
        }
        // ── pointer handling ──
        onObjDown(e, o, mode) {
          if (this.tool === "draw") return;
          e.stopPropagation();
          e.preventDefault();
          if (this.sel !== o.id) this.select(o.id);
          const start = this.frac(e);
          const orig = JSON.parse(JSON.stringify(o));
          let moved = false;
          const target = e.currentTarget;
          target.setPointerCapture?.(e.pointerId);
          const move = (ev) => {
            const [fx, fy] = this.frac(ev);
            const dx = fx - start[0], dy = fy - start[1];
            if (!moved && Math.abs(dx) + Math.abs(dy) < 3e-3) return;
            if (!moved) {
              this.snapshot();
              moved = true;
            }
            if (mode === "move") {
              if (o.points) o.points = orig.points.map((p) => [p[0] + dx, p[1] + dy]);
              else if ("x1" in o) Object.assign(o, { x1: orig.x1 + dx, y1: orig.y1 + dy, x2: orig.x2 + dx, y2: orig.y2 + dy });
              else {
                o.x = clamp(orig.x + dx, -0.05, 0.98);
                o.y = clamp(orig.y + dy, -0.05, 0.98);
              }
            } else {
              if (o.type === "text") o.size = Math.max(4, orig.size * (1 + dy * this.ph / Math.max(8, orig.size * 1.2)));
              else if (o.hRatio || o.type === "image") {
                o.w = Math.max(0.02, orig.w + dx);
                if (o.type === "image") o.h = o.w * this.dispW / this.dispH / o.aspect;
              } else {
                o.w = Math.max(0.01, orig.w + dx);
                o.h = Math.max(6e-3, orig.h + dy);
              }
            }
            this.drawObjects();
          };
          const up = () => {
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerup", up);
            target.removeEventListener("pointercancel", up);
            if (moved) this.onChange();
          };
          target.addEventListener("pointermove", move);
          target.addEventListener("pointerup", up);
          target.addEventListener("pointercancel", up);
        }
        async onStageDown(e) {
          if (e.button > 0) return;
          const prov = this.providers[this.tool];
          const d = prov || TOOLDEFS[this.tool];
          if (this.tool === "select" || !d) {
            this.select(null);
            return;
          }
          const [fx, fy] = this.frac(e);
          if (prov) {
            e.preventDefault();
            const img = await prov.provide();
            if (!img) return;
            return this.placeImage(img, fx, fy);
          }
          if (d.mode === "click") {
            e.preventDefault();
            const o = d.make();
            Object.assign(o, { x: fx, y: fy });
            if (o.hRatio) {
              o.x -= o.w / 2;
              o.y -= o.w * o.hRatio * this.dispW / this.dispH / 2;
            } else if (o.type === "text") o.y -= this.pt2px(o.size) * 0.6 / this.dispH;
            this.add(o);
            if (o.type === "text" || o.type === "note") setTimeout(() => this.props.querySelector("textarea")?.select(), 50);
            return;
          }
          if (d.mode === "image") {
            e.preventDefault();
            const img = await pickImage();
            if (img) this.placeImage(img, fx, fy);
            return;
          }
          if (d.mode === "signature") {
            e.preventDefault();
            const img = await signatureDialog(d.initials);
            if (img) this.placeImage(img, fx, fy, d.initials ? 0.1 : 0.22);
            return;
          }
          if (d.mode === "box" || d.mode === "line" || d.mode === "draw") {
            e.preventDefault();
            this.stage.setPointerCapture?.(e.pointerId);
            const o = d.make();
            o.page = this.page;
            if (d.mode === "box") Object.assign(o, { x: fx, y: fy, w: 0, h: 0 });
            if (d.mode === "line") Object.assign(o, { x1: fx, y1: fy, x2: fx, y2: fy });
            if (d.mode === "draw") o.points = [[fx, fy]];
            this.snapshot();
            o.id = ++uid;
            this.objects.push(o);
            const move = (ev) => {
              const [x, y] = this.frac(ev);
              if (d.mode === "box") Object.assign(o, { x: Math.min(fx, x), y: Math.min(fy, y), w: Math.abs(x - fx), h: Math.abs(y - fy) });
              if (d.mode === "line") Object.assign(o, { x2: x, y2: y });
              if (d.mode === "draw") {
                const ps = ev.getCoalescedEvents?.() || [ev];
                for (const p of ps) o.points.push(this.frac(p));
              }
              this.drawObjects();
            };
            const up = () => {
              this.stage.removeEventListener("pointermove", move);
              this.stage.removeEventListener("pointerup", up);
              this.stage.removeEventListener("pointercancel", up);
              if (d.mode === "box" && (o.w < 0.01 || o.h < 6e-3)) {
                const [dw, dh] = BOX_DEFAULT[o.type] || [0.25, 0.05];
                Object.assign(o, { x: Math.min(fx, 1 - dw), y: Math.min(fy, 1 - dh), w: dw, h: dh });
              }
              if (d.mode === "line" && Math.hypot(o.x2 - o.x1, o.y2 - o.y1) < 0.01) Object.assign(o, { x2: Math.min(1, o.x1 + 0.2) });
              if (d.mode === "draw" && o.points.length < 2) {
                this.objects.pop();
                this.history.pop();
              }
              if (d.mode === "draw") o.points = simplify(o.points, 8e-4);
              if (o.type === "field" && !o.name) o.name = `${o.kind}_${this.objects.filter((x) => x.type === "field").length}`;
              this.sel = d.mode === "draw" ? null : o.id;
              this.changed();
            };
            this.stage.addEventListener("pointermove", move);
            this.stage.addEventListener("pointerup", up);
            this.stage.addEventListener("pointercancel", up);
          }
        }
        placeImage(img, fx, fy, wFrac = 0.3) {
          const aspect = img.w / img.h;
          const w = Math.min(wFrac, 0.9);
          const hh = w * this.dispW / this.dispH / aspect;
          return this.add({ type: "image", src: img.src, aspect, x: clamp(fx - w / 2, 0, 1 - w), y: clamp(fy - hh / 2, 0, 1 - hh), w, h: hh, opacity: 1 });
        }
        drawProps() {
          const o = this.selected;
          const p = this.props;
          p.innerHTML = "";
          if (!o) {
            p.hidden = true;
            return;
          }
          p.hidden = false;
          const upd = (k, cast = (v) => v) => (e) => {
            o[k] = cast(e.target.type === "checkbox" ? e.target.checked : e.target.value);
            this.drawObjectsKeepFocus();
            this.onChange();
          };
          const color = (k, label = "Colour") => h("label", label, h("input", { type: "color", value: o[k] || "#000000", on: { input: upd(k) } }));
          const num2 = (k, label, min, max, step = 1) => h("label", label, h("input", { type: "number", min, max, step, value: Math.round(o[k] * 10) / 10, on: { input: upd(k, Number) } }));
          if (o.type === "text") {
            p.append(
              h("textarea", { rows: 2, "aria-label": "Text", on: { input: upd("text") } }, esc(o.text)),
              num2("size", "Size", 4, 200),
              color("color"),
              h("select", { "aria-label": "Font", style: { flex: "0 1 150px" }, on: { change: upd("font") } }, Object.keys(CSS_FONT).map((f) => h("option", { value: f, selected: f === o.font }, f.replace("Roman", "").replace("Bold", " Bold"))))
            );
          }
          if (o.type === "note") p.append(h("textarea", { rows: 2, "aria-label": "Comment", on: { input: upd("text") } }, esc(o.text)));
          if (["rect", "ellipse", "line", "arrow", "draw"].includes(o.type)) {
            p.append(color("stroke", "Line"), num2("width", "Width", 0.5, 20, 0.5));
          }
          if (o.type === "rect" || o.type === "ellipse") p.append(h("label", "Fill", h("input", { type: "checkbox", checked: !!o.fill, on: { change: (e) => {
            o.fill = e.target.checked ? "#fde68a" : "";
            this.drawObjects();
            this.onChange();
          } } })), o.fill ? color("fill", "Fill colour") : "");
          if (o.type === "highlight") p.append(color("color"), h("label", "Opacity", h("input", { type: "range", min: 0.15, max: 0.8, step: 0.05, value: o.opacity, on: { input: upd("opacity", Number) } })));
          if (o.type === "image") p.append(h("label", "Opacity", h("input", { type: "range", min: 0.1, max: 1, step: 0.05, value: o.opacity ?? 1, on: { input: upd("opacity", Number) } })));
          if (o.type === "stamp") p.append(h("select", { "aria-label": "Stamp text", on: { change: upd("text") } }, [.../* @__PURE__ */ new Set([o.text, ...STAMPS])].map((s) => h("option", { selected: s === o.text }, s))), h("input", { type: "text", "aria-label": "Custom stamp text", placeholder: "Custom text", on: { input: upd("text", (v) => v.toUpperCase()) } }), color("color"));
          if (o.type === "link") {
            p.append(h("select", { style: { flex: "0 1 140px" }, "aria-label": "Link type", on: { change: (e) => {
              o.target = e.target.value;
              this.drawObjects();
            } } }, h("option", { value: "url", selected: o.target === "url" }, "Website"), h("option", { value: "page", selected: o.target === "page" }, "Page")));
            p.append(o.target === "url" ? h("input", { type: "text", value: o.url, placeholder: "https://example.com", "aria-label": "URL", inputmode: "url", on: { input: upd("url") } }) : num2("page", "Page no.", 1, this.pdf.numPages));
          }
          if (o.type === "field") {
            p.append(h("input", { type: "text", value: o.name, placeholder: "Field name", "aria-label": "Field name", on: { input: upd("name") } }));
            if (o.kind === "select") p.append(h("input", { type: "text", value: o.options, placeholder: "Options, comma separated", "aria-label": "Options", on: { input: upd("options") } }));
            if (o.kind === "text") p.append(h("label", "Multi-line", h("input", { type: "checkbox", checked: !!o.multiline, on: { change: upd("multiline") } })), h("label", "Required", h("input", { type: "checkbox", checked: !!o.required, on: { change: upd("required") } })));
          }
          const btns = h("div", { style: { display: "flex", gap: ".4rem", marginLeft: "auto", flexWrap: "wrap" } });
          if (["image", "text", "stamp"].includes(o.type) && this.pdf.numPages > 1) btns.append(h("button.mini-btn", { type: "button", on: { click: () => this.copyToAll(o) } }, ic("copy"), "All pages"));
          btns.append(h("button.mini-btn", { type: "button", style: { color: "var(--red)" }, on: { click: () => this.remove(o.id) } }, ic("trash-2"), "Delete"));
          p.append(btns);
        }
        drawObjectsKeepFocus() {
          const keep = this.props;
          this.props = h("div");
          this.drawObjects();
          this.props = keep;
        }
        copyToAll(o) {
          this.snapshot();
          for (let i = 0; i < this.pdf.numPages; i++) if (i !== o.page) this.objects.push({ ...JSON.parse(JSON.stringify(o)), id: ++uid, page: i });
          toast(`Copied to all ${this.pdf.numPages} pages`, "success");
          this.onChange();
        }
      };
      SIG_FONTS = ["Dancing Script", "Great Vibes", "Caveat", "Sacramento", "Homemade Apple"];
    }
  });

  // js/core/toolpage.js
  var toolpage_exports = {};
  __export(toolpage_exports, {
    dragDrop: () => dragDrop,
    renderToolPage: () => renderToolPage,
    showBusy: () => showBusy,
    zipFiles: () => zipFiles
  });
  async function renderToolPage(root, tool, impl, handoff = []) {
    const cat = catById[tool.category];
    const server = tool.status === "server";
    const page = h("div.tool-page", { style: { "--cat-color": cat.color } });
    const container = h("div.container");
    page.appendChild(container);
    root.innerHTML = "";
    root.appendChild(page);
    document.title = `${tool.name} \u2014 Free Online | ${CONFIG.SITE_NAME}`;
    setMeta(`${tool.name}: ${tool.description} Free, no sign-up${server ? "" : ", files stay on your device"}.`);
    rememberRecent(tool.slug);
    container.append(
      h("nav.breadcrumb", { "aria-label": "Breadcrumb" }, h("a", { href: "#/" }, "Home"), ic("chevron-right"), h("a", { href: `#/category/${cat.id}` }, esc(cat.label)), ic("chevron-right"), h("span", { text: tool.name })),
      h("header.tp-head", h("div.tp-icon", ic(tool.icon)), h(
        "div",
        h("h1", { text: tool.name }),
        h("p", { text: tool.description }),
        h("div.tp-badges", server ? [h("span.pill.amber", ic("server"), "Runs on server"), h("span.pill", ic("clock"), "Launching soon")] : [h("span.pill.green", ic("shield-check"), "Files never leave your device"), h("span.pill", ic("badge-indian-rupee"), "Free"), h("span.pill", ic("user-x"), "No sign-up")])
      ))
    );
    if (server && !CONFIG.API_BASE) container.appendChild(serverBanner(tool));
    const stageBox = h("div");
    container.appendChild(stageBox);
    container.appendChild(seoSection(tool, impl));
    const ctx = {
      tool,
      impl,
      files: [],
      values: {},
      sel: /* @__PURE__ */ new Set(),
      rot: {},
      order: [],
      state: {},
      root: stageBox,
      async pdf(i = 0) {
        const f = ctx.files.filter((f2) => f2.isPdf)[i];
        if (!f) return null;
        return f.pdf || (f.pdf = await openPdf(f.bytes));
      },
      progress: () => {
      },
      refreshOptions: () => {
      },
      refreshView: () => {
      }
    };
    const accept = ACCEPT[impl.accept] || impl.accept || ACCEPT.pdf;
    function showUpload() {
      document.body.classList.remove("has-bar");
      stageBox.innerHTML = "";
      if (impl.noFile) return showWorkspace();
      const input = h("input", { type: "file", accept, multiple: !!impl.multiple, "aria-label": "Choose files", on: { change: (e) => addFiles([...e.target.files]) } });
      const kind = impl.accept === "image" ? "images" : impl.accept === "pdf" || !impl.accept ? impl.multiple ? "PDF files" : "PDF file" : "files";
      const area = h(
        "div.upload-area",
        { tabindex: 0, role: "button", "aria-label": `Choose ${kind}` },
        h("div.upload-icon", ic(impl.uploadIcon || "upload")),
        h("h3", { text: impl.uploadTitle || `Select ${kind}` }),
        h("p", { text: impl.uploadHint || (isMobile() ? "Tap to choose from your phone" : "or drag and drop here") }),
        h("span.btn.btn-primary.btn-lg", ic("folder-open"), `Choose ${kind}`),
        input,
        h("p.upload-privacy", ic("lock"), server ? "Processed securely on our server and deleted after 1 hour." : "Processed in your browser \u2014 nothing is uploaded.")
      );
      if (impl.camera) {
        const cam = h("input", { type: "file", accept: "image/*", capture: "environment", multiple: true, style: { display: "none" }, on: { change: (e) => addFiles([...e.target.files]) } });
        stageBox.append(area, h("div.upload-sub", cam, h("button.btn.btn-outline", { type: "button", on: { click: () => cam.click() } }, ic("camera"), "Use camera")));
      } else stageBox.append(area);
      area.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          input.click();
        }
      });
      dragDrop(area, (files) => addFiles(files));
    }
    async function addFiles(list) {
      if (!list.length) return;
      if (!impl.multiple && ctx.files.length) ctx.files = [];
      const busy = showBusy("Opening files\u2026");
      try {
        for (const f of impl.multiple ? list : list.slice(0, 1)) {
          if (isMobile() && f.size > CONFIG.MOBILE_WARN_MB * 1048576) toast(`${f.name} is large (${fmtBytes(f.size)}). Processing on a phone may be slow.`, "info");
          if (impl.accept === "pdf" || !impl.accept) {
            if (!/\.pdf$/i.test(f.name) && f.type !== "application/pdf") {
              toast(`${f.name} is not a PDF file`, "error");
              continue;
            }
          }
          if (impl.accept === "image" && !(/^image\//.test(f.type) || /\.(heic|heif|tiff?|avif)$/i.test(f.name))) {
            toast(`${f.name} is not an image`, "error");
            continue;
          }
          busy.label(`Opening ${f.name}\u2026`);
          const entry = impl.accept === "pdf" || !impl.accept || impl.accept === "pdfimage" && /pdf$/i.test(f.type || f.name) ? await prepareFile(f) : { file: f, name: f.name, size: f.size, bytes: null, isPdf: false };
          if (entry.encrypted) toast(`Unlocked ${f.name}`, "success");
          ctx.files.push(entry);
        }
      } catch (e) {
        console.error(e);
        toast(e.message || String(e), "error");
      }
      busy.close();
      if (!ctx.files.length) return;
      if (impl.min && ctx.files.length < impl.min && !ctx.workspace) toast(impl.minMsg || `Add at least ${impl.min} files`, "info");
      showWorkspace();
    }
    ctx.addFiles = addFiles;
    let optsEl, mainBody, mainTitle;
    async function showWorkspace() {
      ctx.workspace = true;
      stageBox.innerHTML = "";
      const busy = showBusy("Preparing\u2026");
      try {
        ctx.sel = /* @__PURE__ */ new Set();
        ctx.rot = {};
        ctx.state = ctx.state || {};
        const pdf = await ctx.pdf(0);
        ctx.order = pdf ? [...Array(pdf.numPages).keys()] : [];
        if (impl.init) await impl.init(ctx);
      } catch (e) {
        busy.close();
        console.error(e);
        toast(e.message, "error");
        ctx.files = [];
        ctx.workspace = false;
        return showUpload();
      }
      busy.close();
      const actionLabel = server && !CONFIG.API_BASE ? "Launching soon" : impl.action || tool.name;
      const runBtn = () => h("button.btn.btn-primary.btn-lg", { type: "button", disabled: server && !CONFIG.API_BASE, on: { click: run } }, ic(impl.actionIcon || "arrow-right"), actionLabel);
      mainTitle = h("div.title");
      const bar = h("div.ws-bar", mainTitle);
      mainBody = h("div.ws-body");
      const main = h("section.ws-main", { "aria-label": "Preview" }, bar, mainBody);
      optsEl = h("div.panel-body");
      const side = h("aside.ws-side", h("div.panel", h("div.panel-head", ic("sliders-horizontal"), "Options"), optsEl, h("div.panel-actions", h("div", { class: "main-action-wrap" }, runBtn()), !impl.noFile && h("button.btn.btn-ghost", { type: "button", on: { click: reset } }, ic("rotate-ccw"), "Start over"))));
      side.querySelector(".panel-actions .btn-primary").classList.add("main-action");
      const ws = h("div.workspace", main, side);
      const actionBar = h("div.action-bar", !impl.noFile && h("button.btn.btn-ghost", { type: "button", "aria-label": "Start over", on: { click: reset } }, ic("rotate-ccw")), runBtn());
      stageBox.append(ws, actionBar);
      document.body.classList.add("has-bar");
      ctx.refreshOptions = () => {
        const schema = typeof impl.options === "function" ? impl.options(ctx) : impl.options || [];
        initValues(schema, ctx.values);
        optsEl.innerHTML = "";
        if (!schema.length) optsEl.appendChild(h("div.option-info", { html: impl.noOptionsText || "No settings needed \u2014 just press the button." }));
        else optsEl.appendChild(renderOptions(schema, ctx.values, (k, v) => {
          impl.onOption?.(ctx, k, v);
        }));
      };
      ctx.refreshView = () => renderView(ctx, mainBody, mainTitle, bar, addFiles, accept);
      ctx.refreshOptions();
      await ctx.refreshView();
    }
    async function run() {
      if (impl.min && ctx.files.length < impl.min) return toast(impl.minMsg || `Please add at least ${impl.min} files`, "error");
      if (impl.validate) {
        const err = impl.validate(ctx);
        if (err) return toast(err, "error");
      }
      const busy = showBusy(impl.busyText || "Working on it\u2026");
      ctx.progress = (f, label) => busy.progress(f, label);
      await nextFrame();
      try {
        const res = server ? await serverRun(ctx) : await impl.run(ctx);
        busy.close();
        if (res) showResult(res);
      } catch (e) {
        busy.close();
        console.error(e);
        toast(friendlyError(e), "error");
      }
    }
    function showResult(res) {
      document.body.classList.remove("has-bar");
      const files = res.files || [];
      const wrap2 = h("section.result", { "aria-live": "polite" });
      wrap2.append(h("div.result-icon", ic(res.icon || "circle-check")), h("h2", { text: res.title || "Done!" }), h("p", { text: res.message || (files.length ? `Your file${files.length > 1 ? "s are" : " is"} ready.` : "") }));
      if (res.stats) {
        const { before, after } = res.stats;
        const pct = Math.round((1 - after / before) * 100);
        wrap2.appendChild(h("div.savings", h("div", h("b", fmtBytes(before)), h("small", "Before")), h("div", h("b", fmtBytes(after)), h("small", "After")), h("div", h("b", pct > 0 ? `\u2212${pct}%` : "0%"), h("small", "Saved"))));
      }
      const actions = h("div.result-actions");
      if (files.length === 1) actions.appendChild(h("button.btn.btn-green.btn-xl", { type: "button", on: { click: () => download(files[0].blob, files[0].name) } }, ic("download"), "Download"));
      if (files.length > 1) {
        actions.appendChild(h("button.btn.btn-green.btn-xl", { type: "button", on: { click: async () => {
          const b = showBusy("Creating ZIP\u2026");
          try {
            const zip = await zipFiles(files);
            download(zip, res.zipName || `${baseName(ctx.files[0]?.name || tool.slug)}-${tool.slug}.zip`);
          } finally {
            b.close();
          }
        } } }, ic("download"), `Download all (${files.length}) as ZIP`));
        const list = h("div.result-files");
        files.slice(0, 200).forEach((f) => list.appendChild(h("div.result-file", ic(/pdf$/i.test(f.name) ? "file-text" : "file"), h("span.nm", { text: f.name }), h("span.sz", { text: fmtBytes(f.blob.size) }), h("button.mini-btn.icon-only", { type: "button", "aria-label": `Download ${f.name}`, on: { click: () => download(f.blob, f.name) } }, ic("download")))));
        wrap2.appendChild(list);
      }
      if (!impl.noFile) actions.appendChild(h("button.btn.btn-ghost.btn-lg", { type: "button", on: { click: () => {
        showWorkspace();
      } } }, ic("arrow-left"), "Back"));
      actions.appendChild(h("button.btn.btn-ghost.btn-lg", { type: "button", on: { click: reset } }, ic("rotate-ccw"), impl.noFile ? "Start over" : "New file"));
      wrap2.appendChild(actions);
      if (res.html) wrap2.appendChild(h("div.result-extra", res.html));
      const pdfOut = files.filter((f) => /\.pdf$/i.test(f.name));
      if (pdfOut.length) {
        wrap2.appendChild(h("div.suggestions", h("h4", "Continue with this file"), h("div.suggestions-row", nextTools(tool.slug).map((t2) => h("a.suggestion-chip", { href: `#/${t2.slug}`, on: { click: () => {
          window.__handoff = pdfOut.slice(0, 1).map((f) => new File([f.blob], f.name, { type: "application/pdf" }));
        } } }, ic(t2.icon), t2.name)))));
      }
      stageBox.innerHTML = "";
      stageBox.appendChild(wrap2);
      wrap2.scrollIntoView({ behavior: "smooth", block: "start" });
      res.onShow?.(wrap2);
    }
    function reset() {
      ctx.editor?.destroy?.();
      ctx.files.forEach((f) => f.pdf?.destroy?.());
      Object.assign(ctx, { files: [], values: {}, state: {}, sel: /* @__PURE__ */ new Set(), rot: {}, order: [], workspace: false, editor: null });
      showUpload();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    ctx.reset = reset;
    if (handoff.length) addFiles(handoff);
    else showUpload();
    return () => {
      document.body.classList.remove("has-bar");
      ctx.editor?.destroy?.();
    };
  }
  async function renderView(ctx, body, title, bar, addFiles, accept) {
    const { impl } = ctx;
    body.innerHTML = "";
    bar.querySelectorAll(".extra").forEach((e) => e.remove());
    const view = impl.view || (ctx.files[0]?.isPdf ? "thumbs" : "files");
    const f0 = ctx.files[0];
    title.textContent = impl.noFile ? impl.viewTitle || "Preview" : ctx.files.length > 1 ? `${ctx.files.length} files` : `${f0?.name || ""}${f0?.pageCount ? ` \xB7 ${f0.pageCount} page${f0.pageCount > 1 ? "s" : ""}` : ""} \xB7 ${fmtBytes(f0?.size)}`;
    if (view === "custom") return impl.renderView(body, ctx, bar);
    if (view === "editor") {
      ctx.editor?.destroy?.();
      const pdf2 = await ctx.pdf(0);
      const ed = new PageEditor({ pdf: pdf2, tools: impl.editorTools || ["text"], defaultTool: impl.editorDefault || "select", providers: impl.editorProviders?.(ctx) || {}, objects: ctx.state.objects || (ctx.state.objects = []), hint: impl.editorHint, onChange: () => impl.onEditorChange?.(ctx) });
      ctx.editor = ed;
      body.style.padding = "0";
      body.style.maxHeight = "none";
      body.appendChild(ed.el);
      await ed.renderPage();
      impl.afterEditor?.(ctx);
      return;
    }
    body.style.padding = "";
    body.style.maxHeight = "";
    if (view === "files") return renderFileList(ctx, body, addFiles, accept);
    if (view === "none") {
      body.appendChild(h("div.option-info", { html: `${ic("file-check")} <b>${esc(f0.name)}</b> loaded (${fmtBytes(f0.size)}${f0.pageCount ? `, ${f0.pageCount} pages` : ""}).` }));
      return;
    }
    const pdf = await ctx.pdf(0);
    const n = pdf.numPages;
    if (view === "select") {
      const st = impl.selectStyle === "delete" ? "marked-del" : "selected";
      const tools = h("div.sel-tools.extra");
      const setAll = (fn) => {
        ctx.sel = new Set([...Array(n).keys()].filter(fn));
        grid.querySelectorAll(".thumb").forEach((t2) => t2.classList.toggle(st, ctx.sel.has(+t2.dataset.i)));
        impl.onSelect?.(ctx);
      };
      tools.append(h("button.mini-btn", { type: "button", on: { click: () => setAll(() => true) } }, "All"), h("button.mini-btn", { type: "button", on: { click: () => setAll(() => false) } }, "None"), h("button.mini-btn", { type: "button", on: { click: () => setAll((i) => i % 2 === 0) } }, "Odd"), h("button.mini-btn", { type: "button", on: { click: () => setAll((i) => i % 2 === 1) } }, "Even"));
      bar.appendChild(tools);
    }
    if (view === "rotate") {
      bar.appendChild(h("div.sel-tools.extra", h("button.mini-btn", { type: "button", on: { click: () => {
        for (let i = 0; i < n; i++) ctx.rot[i] = ((ctx.rot[i] || 0) + 270) % 360;
        applyRot();
      } } }, ic("rotate-ccw"), "All left"), h("button.mini-btn", { type: "button", on: { click: () => {
        for (let i = 0; i < n; i++) ctx.rot[i] = ((ctx.rot[i] || 0) + 90) % 360;
        applyRot();
      } } }, ic("rotate-cw"), "All right")));
    }
    const grid = h("div.thumbs");
    body.appendChild(grid);
    const applyRot = () => grid.querySelectorAll(".thumb").forEach((t2) => {
      const r = ctx.rot[+t2.dataset.i] || 0;
      const c = t2.querySelector("canvas");
      if (c) c.style.transform = `rotate(${r}deg) scale(${r % 180 ? 0.75 : 1})`;
    });
    const order = view === "reorder" ? ctx.order : [...Array(n).keys()];
    const flags = impl.thumbFlag ? await impl.thumbFlag(ctx) : null;
    for (const i of order) {
      const t2 = h("div.thumb", { "data-i": i, class: view === "select" ? "clickable" : view === "reorder" ? "drag" : "" });
      const imgBox = h("div.thumb-img");
      t2.append(imgBox, h("span.thumb-label", { text: `${i + 1}` }));
      if (flags?.[i]) t2.appendChild(h("span.flag", { text: flags[i] }));
      if (view === "select") {
        t2.prepend(h("span.check", ic(impl.selectStyle === "delete" ? "x" : "check")));
        if (ctx.sel.has(i)) t2.classList.add(impl.selectStyle === "delete" ? "marked-del" : "selected");
        t2.setAttribute("role", "checkbox");
        t2.tabIndex = 0;
        const toggle = () => {
          ctx.sel.has(i) ? ctx.sel.delete(i) : ctx.sel.add(i);
          t2.classList.toggle(impl.selectStyle === "delete" ? "marked-del" : "selected", ctx.sel.has(i));
          t2.setAttribute("aria-checked", String(ctx.sel.has(i)));
          impl.onSelect?.(ctx);
        };
        t2.addEventListener("click", toggle);
        t2.addEventListener("keydown", (e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            toggle();
          }
        });
      }
      if (view === "rotate") {
        t2.appendChild(h(
          "div.thumb-tools",
          h("button", { type: "button", "aria-label": `Rotate page ${i + 1} left`, on: { click: () => {
            ctx.rot[i] = ((ctx.rot[i] || 0) + 270) % 360;
            applyRot();
          } } }, ic("rotate-ccw")),
          h("button", { type: "button", "aria-label": `Rotate page ${i + 1} right`, on: { click: () => {
            ctx.rot[i] = ((ctx.rot[i] || 0) + 90) % 360;
            applyRot();
          } } }, ic("rotate-cw"))
        ));
      }
      if (view === "reorder") t2.appendChild(h("div.thumb-tools", h("button", { type: "button", "aria-label": `Remove page ${i + 1}`, on: { click: (e) => {
        e.stopPropagation();
        ctx.order.splice(ctx.order.indexOf(i), 1);
        t2.remove();
      } } }, ic("trash-2"))));
      grid.appendChild(t2);
      lazyThumb(imgBox, () => renderPage(pdf, i + 1, { width: 150 * Math.min(2, devicePixelRatio || 1) }), applyRot);
    }
    if (view === "reorder") {
      const Sortable = await lib("sortable");
      Sortable.create(grid, { animation: 160, delay: 120, delayOnTouchOnly: true, ghostClass: "sortable-ghost", chosenClass: "sortable-chosen", onEnd: () => {
        ctx.order = [...grid.children].map((c) => +c.dataset.i);
        grid.querySelectorAll(".thumb").forEach((c, k) => c.querySelector(".thumb-label").textContent = `${+c.dataset.i + 1} \u2192 ${k + 1}`);
      } });
      bar.appendChild(h("div.sel-tools.extra", h("button.mini-btn", { type: "button", on: { click: () => {
        ctx.order = [...Array(n).keys()];
        ctx.refreshView();
      } } }, ic("rotate-ccw"), "Reset"), h("button.mini-btn", { type: "button", on: { click: () => {
        ctx.order.reverse();
        ctx.refreshView();
      } } }, ic("arrow-down-up"), "Reverse")));
    }
  }
  function lazyThumb(box, make, after) {
    box.innerHTML = '<div class="spinner" style="width:22px;height:22px;border-width:3px;margin:0"></div>';
    box._load = () => {
      thumbQueue = thumbQueue.then(async () => {
        try {
          const c = await make();
          box.innerHTML = "";
          box.appendChild(c);
          after?.();
        } catch {
          box.innerHTML = ic("file-x");
        }
      });
    };
    if (thumbObserver) thumbObserver.observe(box);
    else box._load();
  }
  async function renderFileList(ctx, body, addFiles, accept) {
    const list = h("div.file-list");
    body.appendChild(list);
    const draw = () => {
      list.innerHTML = "";
      ctx.files.forEach((f, idx) => {
        const imgBox = h("div.thumb-img");
        const item = h(
          "div.file-item",
          { "data-i": idx },
          h("span.num", { text: idx + 1 }),
          h("button.rm", { type: "button", "aria-label": `Remove ${f.name}`, on: { click: (e) => {
            e.stopPropagation();
            ctx.files.splice(idx, 1);
            if (!ctx.files.length) return ctx.reset();
            draw();
            ctx.impl.onFilesChange?.(ctx);
          } } }, ic("x")),
          imgBox,
          h("span.name", { text: f.name }),
          h("span.meta", { text: `${fmtBytes(f.size)}${f.pageCount ? ` \xB7 ${f.pageCount} pages` : ""}` })
        );
        list.appendChild(item);
        lazyThumb(imgBox, async () => {
          if (f.isPdf) {
            f.pdf || (f.pdf = await openPdf(f.bytes));
            return renderPage(f.pdf, 1, { width: 180 });
          }
          if (/^image\/(jpeg|png|gif|webp|bmp|svg|avif)/.test(f.file.type)) {
            const img = h("img", { alt: "", src: f.url || (f.url = URL.createObjectURL(f.file)) });
            return img;
          }
          return h("div", { html: ic("file", ""), style: { fontSize: "2.2rem", color: "var(--text-3)" } });
        });
      });
      if (ctx.impl.multiple) list.appendChild(h("label.add-tile", ic("plus"), "Add more", h("input", { type: "file", multiple: true, accept, "aria-label": "Add more files", on: { change: (e) => addFiles([...e.target.files]) } })));
    };
    draw();
    if (ctx.files.length > 1) {
      const Sortable = await lib("sortable");
      Sortable.create(list, { animation: 160, delay: 120, delayOnTouchOnly: true, filter: ".add-tile,.rm", preventOnFilter: false, draggable: ".file-item", ghostClass: "sortable-ghost", onEnd: () => {
        const order = [...list.querySelectorAll(".file-item")].map((c) => +c.dataset.i);
        ctx.files = order.map((i) => ctx.files[i]);
        draw();
        ctx.impl.onFilesChange?.(ctx);
      } });
    }
    dragDrop(body, (files) => addFiles(files));
  }
  function dragDrop(el, onFiles) {
    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      el.classList.add("drag-over");
    });
    el.addEventListener("dragleave", () => el.classList.remove("drag-over"));
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      el.classList.remove("drag-over");
      const files = [...e.dataTransfer?.files || []];
      if (files.length) onFiles(files);
    });
  }
  function showBusy(text) {
    const label = h("div.progress-label", { text: "" });
    const fill2 = h("div.progress-bar-fill");
    const track = h("div.progress-bar-track", { hidden: true }, fill2);
    const title = h("h4", { text });
    const el = h("div.busy", { role: "alertdialog", "aria-live": "assertive", "aria-label": text }, h("div.busy-card", h("div.spinner"), title, track, label));
    const timer = setTimeout(() => document.body.appendChild(el), 120);
    return {
      label: (t2) => {
        title.textContent = t2;
      },
      progress(f, l) {
        track.hidden = false;
        fill2.style.width = `${Math.round(Math.min(1, Math.max(0, f)) * 100)}%`;
        if (l) label.textContent = l;
        if (!el.isConnected) document.body.appendChild(el);
      },
      close() {
        clearTimeout(timer);
        el.remove();
      }
    };
  }
  async function zipFiles(files) {
    const JSZip = await lib("jszip");
    const zip = new JSZip();
    const seen = {};
    for (const f of files) {
      let n = f.name;
      if (seen[n]) {
        n = n.replace(/(\.[^.]+)?$/, `-${seen[n]}$1`);
      }
      seen[f.name] = (seen[f.name] || 1) + 1;
      zip.file(n, f.blob);
    }
    return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  }
  function friendlyError(e) {
    const m = e?.message || String(e);
    if (/password/i.test(m)) return "This PDF is password protected. Use Unlock PDF first, or enter the right password.";
    if (/Invalid PDF|No PDF header|Failed to parse/i.test(m)) return "This PDF seems damaged. Try \u201CRepair PDF\u201D first.";
    if (/memory|allocation/i.test(m)) return "This file is too large for your device\u2019s memory. Try fewer pages or a lower quality setting.";
    return m;
  }
  function rememberRecent(slug) {
    const r = store.get("recent-tools", []).filter((s) => s !== slug);
    r.unshift(slug);
    store.set("recent-tools", r.slice(0, 8));
  }
  function setMeta(desc) {
    let m = document.querySelector("meta[name=description]");
    if (!m) {
      m = h("meta", { name: "description" });
      document.head.appendChild(m);
    }
    m.content = desc;
  }
  function serverBanner(tool) {
    const input = h("input.option-input", { type: "email", placeholder: "your@email.com", autocomplete: "email", "aria-label": "Email for launch notification" });
    return h("div.server-banner", ic("server-cog"), h(
      "div",
      h("b", `${tool.name} is launching soon`),
      h("p", "This tool needs our secure server for top-quality results. You can explore the options now \u2014 leave your email and we\u2019ll tell you the moment it goes live."),
      h("div.notify-row", input, h("button.btn.btn-primary", { type: "button", on: { click: () => {
        if (!/^\S+@\S+\.\S+$/.test(input.value)) return toast("Please enter a valid email", "error");
        const list = store.get("notify-list", []);
        list.push({ email: input.value, tool: tool.slug, at: Date.now() });
        store.set("notify-list", list);
        input.value = "";
        toast("Thanks! We\u2019ll let you know.", "success");
      } } }, "Notify me"))
    ));
  }
  async function serverRun(ctx) {
    if (!CONFIG.API_BASE) throw new Error("This tool is launching soon.");
    const fd = new FormData();
    ctx.files.forEach((f) => fd.append("files", f.file, f.name));
    fd.append("options", JSON.stringify(Object.fromEntries(Object.entries(ctx.values).filter(([, v]) => !(v instanceof Blob)))));
    ctx.progress(0.1, "Uploading\u2026");
    const res = await fetch(`${CONFIG.API_BASE}/api/tools/${ctx.tool.slug}`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(await res.text().catch(() => "") || `Server error (${res.status})`);
    ctx.progress(0.9, "Downloading result\u2026");
    const type = res.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      const data = await res.json();
      return { title: "Done!", message: data.message || "", html: data.html ? h("div", { html: data.html }) : data.text ? h("pre.out-text", { text: data.text }) : null, files: [] };
    }
    const disp = res.headers.get("content-disposition") || "";
    const name = disp.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i)?.[1] || `${baseName(ctx.files[0]?.name || "result")}-${ctx.tool.slug}`;
    return { files: [{ name: decodeURIComponent(name), blob: await res.blob() }] };
  }
  function seoSection(tool, impl) {
    const cat = catById[tool.category];
    const server = tool.status === "server";
    const related = (toolBySlug && Object.values(toolBySlug)).filter((t2) => t2.category === tool.category && t2.slug !== tool.slug).slice(0, 8);
    const steps = impl.howTo || [
      impl.noFile ? "Choose your settings on the right." : `Choose your ${impl.accept === "image" ? "images" : impl.accept && impl.accept !== "pdf" ? "file" : "PDF"} \u2014 tap the button or drag it in.`,
      "Adjust the options to get exactly what you need.",
      `Press \u201C${impl.action || tool.name}\u201D and download your result.`
    ];
    return h("section.seo-section", h(
      "div.seo-wrap",
      h("h2", `How to use ${tool.name}`),
      h("ol.seo-steps", steps.map((s) => h("li", { text: s }))),
      h("h2", `About ${tool.name}`),
      h("p", { text: `${tool.description} ${impl.about || ""}` }),
      h(
        "ul",
        h("li", { text: server ? "Files are sent over an encrypted connection and deleted automatically after processing." : "Private by design: your files are processed inside your browser and never uploaded to any server." }),
        h("li", { text: "Works on Android, iPhone, Windows, Mac and Linux \u2014 no app or sign-up needed." }),
        h("li", { text: "Free to use with no watermarks added to your files." })
      ),
      related.length ? h("h3", `More ${cat.label} tools`) : "",
      related.length ? h("div.related", related.map((t2) => h("a.suggestion-chip", { href: `#/${t2.slug}` }, ic(t2.icon), t2.name))) : ""
    ));
  }
  var ACCEPT, isMobile, thumbObserver, thumbQueue;
  var init_toolpage = __esm({
    "js/core/toolpage.js"() {
      init_ui();
      init_pdf();
      init_options();
      init_editor();
      init_lib();
      init_config();
      init_tools();
      ACCEPT = {
        pdf: ".pdf,application/pdf",
        image: "image/*,.heic,.heif,.tif,.tiff,.avif",
        pdfimage: ".pdf,application/pdf,image/*,.heic,.heif"
      };
      isMobile = () => matchMedia("(max-width: 960px)").matches;
      thumbObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) {
          thumbObserver.unobserve(e.target);
          e.target._load?.();
        }
      }, { rootMargin: "300px" }) : null;
      thumbQueue = Promise.resolve();
    }
  });

  // js/tools/common.js
  var common_exports = {};
  __export(common_exports, {
    PL: () => PL,
    docOf: () => docOf,
    loadDoc: () => loadDoc,
    openPdf: () => openPdf,
    outName: () => outName,
    pdfResult: () => pdfResult,
    saveDoc: () => saveDoc,
    single: () => single
  });
  async function pdfResult(ctx, doc, suffix, extra = {}) {
    const blob = doc instanceof Blob ? doc : await saveDoc(doc);
    return { files: [{ name: extra.name || outName(ctx, suffix), blob }], ...extra };
  }
  function single(def) {
    return {
      accept: "pdf",
      ...def,
      async run(ctx) {
        const doc = await def.apply(ctx.files[0].bytes, ctx.values, ctx.progress, ctx);
        const blob = doc instanceof Blob ? doc : await saveDoc(doc);
        return { files: [{ name: outName(ctx, def.suffix), blob }], ...def.showStats ? { stats: { before: ctx.files[0].size, after: blob.size } } : {} };
      }
    };
  }
  var outName, docOf;
  var init_common = __esm({
    "js/tools/common.js"() {
      init_pdf();
      init_ui();
      outName = (ctx, suffix, ext = "pdf", i = 0) => `${baseName(ctx.files[i]?.name || "document")}${suffix ? "-" + suffix : ""}.${ext}`;
      docOf = (ctx, i = 0) => loadDoc(ctx.files[i].bytes);
    }
  });

  // js/tools/organize.js
  var organize_exports = {};
  __export(organize_exports, {
    default: () => organize_default,
    drawRotated: () => drawRotated,
    setOutline: () => setOutline
  });
  function drawRotated(page, e, x, y, s, rot) {
    const P = window.PDFLib;
    if (!rot) return page.drawPage(e, { x, y, xScale: s, yScale: s });
    if (rot === 90) return page.drawPage(e, { x, y: y + e.width * s, xScale: s, yScale: s, rotate: P.degrees(-90) });
    if (rot === 180) return page.drawPage(e, { x: x + e.width * s, y: y + e.height * s, xScale: s, yScale: s, rotate: P.degrees(180) });
    if (rot === 270) return page.drawPage(e, { x: x + e.height * s, y, xScale: s, yScale: s, rotate: P.degrees(90) });
  }
  function setOutline(doc, items) {
    const P = window.PDFLib;
    const ctx = doc.context;
    const pages = doc.getPages();
    if (!items.length) {
      doc.catalog.delete(P.PDFName.of("Outlines"));
      return;
    }
    const outlineRef = ctx.nextRef();
    const refs = items.map(() => ctx.nextRef());
    items.forEach((it, i) => {
      const page = pages[Math.max(0, Math.min(pages.length - 1, it.page))];
      const d = { Title: P.PDFHexString.fromText(String(it.title || `Page ${it.page + 1}`)), Parent: outlineRef, Dest: [page.ref, "XYZ", null, null, null] };
      if (i > 0) d.Prev = refs[i - 1];
      if (i < items.length - 1) d.Next = refs[i + 1];
      ctx.assign(refs[i], ctx.obj(d));
    });
    ctx.assign(outlineRef, ctx.obj({ Type: "Outlines", First: refs[0], Last: refs[refs.length - 1], Count: items.length }));
    doc.catalog.set(P.PDFName.of("Outlines"), outlineRef);
    doc.catalog.set(P.PDFName.of("PageMode"), P.PDFName.of("UseOutlines"));
  }
  async function groupBySize(src, n, max, progress) {
    const { PDFDocument } = await PL();
    const sizes = [];
    for (let i = 0; i < n; i++) {
      progress(i / n * 0.5, `Measuring page ${i + 1}`);
      const d = await PDFDocument.create();
      d.addPage((await d.copyPages(src, [i]))[0]);
      sizes.push((await d.save({ useObjectStreams: true })).length);
    }
    const groups = [];
    let cur = [], sum = 0;
    sizes.forEach((s, i) => {
      if (cur.length && sum + s > max) {
        groups.push(cur);
        cur = [];
        sum = 0;
      }
      cur.push(i);
      sum += s;
    });
    if (cur.length) groups.push(cur);
    return groups;
  }
  var sizeOpts, organize_default;
  var init_organize = __esm({
    "js/tools/organize.js"() {
      init_pdf();
      init_ui();
      init_common();
      sizeOpts = [["same", "Same as original"], ...Object.keys(PAGE_SIZES).map((k) => [k, k])];
      organize_default = {
        "merge-pdf": {
          accept: "pdf",
          multiple: true,
          min: 2,
          minMsg: "Add at least 2 PDFs to merge",
          view: "files",
          action: "Merge PDF",
          actionIcon: "combine",
          uploadTitle: "Select PDF files to merge",
          about: "Drag the files into the order you want before merging.",
          options: [
            { type: "info", html: "Drag files to change their order. Tap \u2715 to remove one." },
            { key: "blank", type: "check", label: "Add a blank page between files" },
            { key: "outline", type: "check", label: "Add a bookmark for each file", default: true },
            { key: "name", type: "text", label: "Output file name", placeholder: "merged.pdf" }
          ],
          async run(ctx) {
            const { PDFDocument } = await PL();
            const out = await PDFDocument.create();
            const marks = [];
            for (let i = 0; i < ctx.files.length; i++) {
              ctx.progress(i / ctx.files.length, `Adding ${ctx.files[i].name}`);
              const src = await loadDoc(ctx.files[i].bytes);
              const pages = await out.copyPages(src, src.getPageIndices());
              marks.push([ctx.files[i].name.replace(/\.pdf$/i, ""), out.getPageCount()]);
              pages.forEach((p) => out.addPage(p));
              if (ctx.values.blank && i < ctx.files.length - 1) {
                const last = pages[pages.length - 1];
                out.addPage([last.getWidth(), last.getHeight()]);
              }
              await nextFrame();
            }
            if (ctx.values.outline) setOutline(out, marks.map(([title, page]) => ({ title, page })));
            let name = (ctx.values.name || "").trim() || "merged.pdf";
            if (!/\.pdf$/i.test(name)) name += ".pdf";
            return { files: [{ name, blob: await saveDoc(out) }], message: `${ctx.files.length} files merged into one PDF with ${out.getPageCount()} pages.` };
          }
        },
        "split-pdf": {
          accept: "pdf",
          view: "thumbs",
          action: "Split PDF",
          actionIcon: "scissors",
          options: (ctx) => [
            { key: "mode", type: "cards", label: "How to split", default: "ranges", options: [["ranges", "Custom ranges", "e.g. 1-3, 4-8"], ["every", "Every N pages", "equal parts"], ["each", "Every page", "one file each"], ["size", "By file size", "max MB per file"]] },
            { key: "ranges", type: "pages", label: "Page ranges", placeholder: `e.g. 1-3, 4-${Math.max(4, ctx.files[0].pageCount)}`, hint: "Each range becomes its own PDF. Use \u201Codd\u201D or \u201Ceven\u201D too.", show: (v) => v.mode === "ranges" },
            { key: "mergeRanges", type: "check", label: "Merge all ranges into one PDF", show: (v) => v.mode === "ranges" },
            { key: "n", type: "number", label: "Pages per file", default: 2, min: 1, show: (v) => v.mode === "every" },
            { key: "mb", type: "number", label: "Maximum size per file (MB)", default: 5, min: 0.1, step: 0.1, show: (v) => v.mode === "size" },
            { type: "info", html: `This PDF has <b>${ctx.files[0].pageCount}</b> pages.` }
          ],
          validate: (ctx) => ctx.values.mode === "ranges" && !String(ctx.values.ranges).trim() ? "Enter the page ranges, e.g. 1-3, 5" : null,
          async run(ctx) {
            const { PDFDocument } = await PL();
            const src = await loadDoc(ctx.files[0].bytes);
            const n = src.getPageCount();
            const v = ctx.values;
            let groups;
            if (v.mode === "ranges") groups = parseRangeGroups(v.ranges, n);
            else if (v.mode === "every") {
              const k = Math.max(1, +v.n || 1);
              groups = [];
              for (let i = 0; i < n; i += k) groups.push([...Array(Math.min(k, n - i)).keys()].map((j) => i + j));
            } else if (v.mode === "each") groups = [...Array(n).keys()].map((i) => [i]);
            else groups = await groupBySize(src, n, (+v.mb || 5) * 1048576, ctx.progress);
            if (!groups.length) throw new Error("No pages matched those ranges.");
            if (v.mode === "ranges" && v.mergeRanges) groups = [groups.flat()];
            const files = [];
            for (let g = 0; g < groups.length; g++) {
              ctx.progress(g / groups.length, `Creating part ${g + 1} of ${groups.length}`);
              const d = await PDFDocument.create();
              (await d.copyPages(src, groups[g])).forEach((p) => d.addPage(p));
              const label = groups[g].length === 1 ? `page-${groups[g][0] + 1}` : `pages-${groups[g][0] + 1}-${groups[g][groups[g].length - 1] + 1}`;
              files.push({ name: outName(ctx, groups.length === 1 ? "split" : label), blob: await saveDoc(d) });
              if (g % 5 === 4) await nextFrame();
            }
            return { files, message: `Split into ${files.length} PDF file${files.length > 1 ? "s" : ""}.` };
          }
        },
        "extract-pages": {
          accept: "pdf",
          view: "select",
          action: "Extract pages",
          actionIcon: "file-output",
          options: [
            { type: "info", html: "Tap the pages you want to keep, or type them below." },
            { key: "pages", type: "pages", label: "Or enter pages", hint: "Used when no pages are tapped." },
            { key: "separate", type: "check", label: "Save each page as a separate PDF" }
          ],
          validate: (ctx) => !ctx.sel.size && !String(ctx.values.pages).trim() ? "Tap the pages to extract, or type page numbers" : null,
          async run(ctx) {
            const { PDFDocument } = await PL();
            const src = await loadDoc(ctx.files[0].bytes);
            const idx = ctx.sel.size ? [...ctx.sel].sort((a, b) => a - b) : parsePages(ctx.values.pages, src.getPageCount(), false);
            if (!idx.length) throw new Error("No pages selected.");
            if (ctx.values.separate) {
              const files = [];
              for (const i of idx) {
                const d2 = await PDFDocument.create();
                d2.addPage((await d2.copyPages(src, [i]))[0]);
                files.push({ name: outName(ctx, `page-${i + 1}`), blob: await saveDoc(d2) });
              }
              return { files };
            }
            const d = await PDFDocument.create();
            (await d.copyPages(src, idx)).forEach((p) => d.addPage(p));
            return pdfResult(ctx, d, "extracted", { message: `${idx.length} page${idx.length > 1 ? "s" : ""} extracted.` });
          }
        },
        "delete-pages": {
          accept: "pdf",
          view: "select",
          selectStyle: "delete",
          action: "Delete pages",
          actionIcon: "trash-2",
          options: [
            { type: "info", html: "Tap the pages you want to <b>remove</b>, or type them below." },
            { key: "pages", type: "pages", label: "Or enter pages to delete" }
          ],
          validate: (ctx) => !ctx.sel.size && !String(ctx.values.pages).trim() ? "Tap the pages you want to delete" : null,
          async run(ctx) {
            const src = await loadDoc(ctx.files[0].bytes);
            const n = src.getPageCount();
            const del = ctx.sel.size ? [...ctx.sel] : parsePages(ctx.values.pages, n, false);
            if (del.length >= n) throw new Error("You can\u2019t delete every page.");
            [...del].sort((a, b) => b - a).forEach((i) => src.removePage(i));
            return pdfResult(ctx, src, "edited", { message: `${del.length} page${del.length > 1 ? "s" : ""} deleted. ${src.getPageCount()} pages left.` });
          }
        },
        "rearrange-pages": {
          accept: "pdf",
          view: "reorder",
          action: "Save new order",
          actionIcon: "check",
          options: [{ type: "info", html: "Drag pages into the order you want. On a phone, press and hold a page, then drag. The bin icon removes a page." }],
          async run(ctx) {
            const { PDFDocument } = await PL();
            const src = await loadDoc(ctx.files[0].bytes);
            const d = await PDFDocument.create();
            (await d.copyPages(src, ctx.order)).forEach((p) => d.addPage(p));
            return pdfResult(ctx, d, "reordered");
          }
        },
        "rotate-pdf": single({
          view: "rotate",
          action: "Rotate PDF",
          actionIcon: "rotate-cw",
          suffix: "rotated",
          options: [
            { type: "info", html: "Use the buttons under each page, or rotate pages in bulk below." },
            { key: "angle", type: "seg", label: "Rotate in bulk", default: "0", options: [["0", "None"], ["90", "90\xB0 right", "rotate-cw"], ["180", "180\xB0"], ["270", "90\xB0 left", "rotate-ccw"]] },
            { key: "which", type: "select", label: "Apply bulk rotation to", default: "all", options: [["all", "All pages"], ["odd", "Odd pages"], ["even", "Even pages"], ["land", "Landscape pages only"], ["port", "Portrait pages only"]], show: (v) => v.angle !== "0" }
          ],
          async apply(bytes, v, progress, ctx) {
            const { degrees } = await PL();
            const doc = await loadDoc(bytes);
            doc.getPages().forEach((p, i) => {
              const w = p.getWidth(), hh = p.getHeight();
              const r0 = p.getRotation().angle;
              let add = ctx?.rot?.[i] || 0;
              const bulk = +v.angle || 0;
              const match = { all: true, odd: i % 2 === 0, even: i % 2 === 1, land: r0 % 180 ? hh > w : w > hh, port: r0 % 180 ? w >= hh : hh >= w }[v.which || "all"];
              if (bulk && match) add += bulk;
              if (add % 360) p.setRotation(degrees((r0 + add) % 360));
            });
            return doc;
          }
        }),
        "insert-pages": {
          accept: "pdf",
          view: "thumbs",
          action: "Insert pages",
          actionIcon: "file-plus-2",
          options: (ctx) => [
            { key: "other", type: "file", label: "PDF to insert", accept: ".pdf,application/pdf", placeholder: "Choose the PDF to insert" },
            { key: "otherPages", type: "pages", label: "Pages from that PDF (optional)", hint: "Leave empty to insert all pages." },
            { key: "where", type: "seg", label: "Insert", default: "end", options: [["start", "At start"], ["after", "After page"], ["end", "At end"]] },
            { key: "after", type: "number", label: "After page number", default: 1, min: 1, max: ctx.files[0].pageCount, show: (v) => v.where === "after" }
          ],
          validate: (ctx) => !ctx.values.other ? "Choose the PDF you want to insert" : null,
          async run(ctx) {
            const doc = await loadDoc(ctx.files[0].bytes);
            const other = await prepareFile(ctx.values.other);
            const src = await loadDoc(other.bytes);
            const idx = parsePages(ctx.values.otherPages, src.getPageCount());
            const pages = await doc.copyPages(src, idx);
            let at = { start: 0, end: doc.getPageCount(), after: Math.min(doc.getPageCount(), Math.max(0, +ctx.values.after || 0)) }[ctx.values.where];
            for (const p of pages) doc.insertPage(at++, p);
            return pdfResult(ctx, doc, "inserted", { message: `${pages.length} page${pages.length > 1 ? "s" : ""} inserted.` });
          }
        },
        "insert-blank": single({
          view: "thumbs",
          action: "Insert blank pages",
          actionIcon: "file-plus",
          suffix: "blank-added",
          options: [
            { key: "where", type: "select", label: "Where", default: "end", options: [["start", "At the start"], ["end", "At the end"], ["after", "After specific pages"], ["every", "After every page"], ["odd", "To make page count even (for printing)"]] },
            { key: "after", type: "pages", label: "After these pages", placeholder: "e.g. 2, 5", show: (v) => v.where === "after" },
            { key: "count", type: "number", label: "How many blank pages each time", default: 1, min: 1, max: 50, show: (v) => v.where !== "odd" },
            { key: "size", type: "select", label: "Blank page size", default: "same", options: sizeOpts }
          ],
          async apply(bytes, v) {
            const doc = await loadDoc(bytes);
            const n = doc.getPageCount();
            const cnt = Math.max(1, +v.count || 1);
            const sz = (i) => {
              if (v.size !== "same") return PAGE_SIZES[v.size];
              const p = doc.getPage(Math.min(i, doc.getPageCount() - 1));
              return [p.getWidth(), p.getHeight()];
            };
            const ins = (at, ref) => {
              for (let k = 0; k < cnt; k++) doc.insertPage(at, sz(ref));
            };
            if (v.where === "start") ins(0, 0);
            else if (v.where === "end") ins(n, n - 1);
            else if (v.where === "odd") {
              if (n % 2) doc.insertPage(n, sz(n - 1));
            } else {
              const after = v.where === "every" ? [...Array(n).keys()] : parsePages(v.after, n, false);
              if (!after.length) throw new Error("Enter the page numbers to add blank pages after.");
              [...after].sort((a, b) => b - a).forEach((i) => ins(i + 1, i));
            }
            return doc;
          }
        }),
        "duplicate-pages": {
          accept: "pdf",
          view: "select",
          action: "Duplicate pages",
          actionIcon: "copy",
          options: [
            { type: "info", html: "Tap the pages to duplicate (or leave all un-tapped to duplicate every page)." },
            { key: "copies", type: "number", label: "Number of copies", default: 1, min: 1, max: 100 },
            { key: "place", type: "seg", label: "Put copies", default: "after", options: [["after", "Right after each page"], ["end", "At the end"]] }
          ],
          async run(ctx) {
            const doc = await loadDoc(ctx.files[0].bytes);
            const n = doc.getPageCount();
            const sel = ctx.sel.size ? [...ctx.sel].sort((a, b) => a - b) : [...Array(n).keys()];
            const copies = Math.max(1, +ctx.values.copies || 1);
            if (ctx.values.place === "end") {
              for (let c = 0; c < copies; c++) (await doc.copyPages(doc, sel)).forEach((p) => doc.addPage(p));
            } else {
              for (const i of [...sel].reverse()) {
                const pages = await doc.copyPages(doc, Array(copies).fill(i));
                pages.forEach((p, k) => doc.insertPage(i + 1 + k, p));
              }
            }
            return pdfResult(ctx, doc, "duplicated", { message: `Now ${doc.getPageCount()} pages.` });
          }
        },
        "reverse-pdf": single({
          view: "thumbs",
          action: "Reverse pages",
          actionIcon: "arrow-down-up",
          suffix: "reversed",
          options: [{ key: "range", type: "pages", label: "Only reverse these pages (optional)", hint: "Leave empty to reverse the whole document." }],
          async apply(bytes, v) {
            const { PDFDocument } = await PL();
            const src = await loadDoc(bytes);
            const n = src.getPageCount();
            const sub = parsePages(v.range, n);
            const rev = [...sub].reverse();
            const order = [...Array(n).keys()].map((i) => {
              const k = sub.indexOf(i);
              return k >= 0 ? rev[k] : i;
            });
            const d = await PDFDocument.create();
            (await d.copyPages(src, order)).forEach((p) => d.addPage(p));
            return d;
          }
        }),
        "alternate-mix": {
          accept: "pdf",
          multiple: true,
          min: 2,
          minMsg: "Add 2 PDFs \u2014 e.g. the front sides and the back sides",
          view: "files",
          action: "Mix pages",
          actionIcon: "shuffle",
          uploadTitle: "Select 2 PDFs (front & back pages)",
          options: [
            { type: "info", html: "Pages are taken one at a time from each file: A1, B1, A2, B2\u2026 Perfect for double-sided scans made on a single-sided scanner." },
            { key: "reverseB", type: "check", label: "Second file is in reverse order", default: true, hint: "Usually true when you flip the paper stack to scan the back sides." },
            { key: "reverseA", type: "check", label: "First file is in reverse order" },
            { key: "chunk", type: "number", label: "Pages to take at a time", default: 1, min: 1 }
          ],
          async run(ctx) {
            const { PDFDocument } = await PL();
            const docs = await Promise.all(ctx.files.map((f) => loadDoc(f.bytes)));
            const out = await PDFDocument.create();
            const lists = await Promise.all(docs.map(async (d, k) => {
              let idx = d.getPageIndices();
              if (k === 0 && ctx.values.reverseA || k === 1 && ctx.values.reverseB) idx = idx.reverse();
              return out.copyPages(d, idx);
            }));
            const c = Math.max(1, +ctx.values.chunk || 1);
            const max = Math.max(...lists.map((l) => l.length));
            for (let i = 0; i < max; i += c) for (const l of lists) l.slice(i, i + c).forEach((p) => out.addPage(p));
            return { files: [{ name: outName(ctx, "mixed"), blob: await saveDoc(out) }], message: `${out.getPageCount()} pages interleaved.` };
          }
        },
        "n-up": single({
          view: "thumbs",
          action: "Create N-up PDF",
          actionIcon: "layout-grid",
          suffix: "n-up",
          options: [
            { key: "n", type: "seg", label: "Pages per sheet", default: "4", options: [["2", "2"], ["4", "4"], ["6", "6"], ["8", "8"], ["9", "9"], ["16", "16"]] },
            { key: "sheet", type: "select", label: "Sheet size", default: "A4", options: Object.keys(PAGE_SIZES).map((k) => [k, k]) },
            { key: "orient", type: "seg", label: "Orientation", default: "auto", options: [["auto", "Auto"], ["portrait", "Portrait"], ["landscape", "Landscape"]] },
            { key: "order", type: "seg", label: "Page order", default: "row", options: [["row", "Across \u2192 down"], ["col", "Down \u2192 across"]] },
            { key: "gap", type: "range", label: "Spacing", default: 8, min: 0, max: 40, unit: " pt" },
            { key: "border", type: "check", label: "Draw a border around each page" }
          ],
          async apply(bytes, v, progress) {
            const { PDFDocument, rgb } = await PL();
            const src = await loadDoc(bytes);
            const out = await PDFDocument.create();
            const N = +v.n;
            const grids = { 2: [2, 1], 4: [2, 2], 6: [3, 2], 8: [4, 2], 9: [3, 3], 16: [4, 4] };
            let [W, H] = PAGE_SIZES[v.sheet];
            const land = v.orient === "landscape" || v.orient === "auto" && [2, 6, 8].includes(N);
            if (land) [W, H] = [Math.max(W, H), Math.min(W, H)];
            let [cols, rows] = grids[N];
            if (!land && cols !== rows) [cols, rows] = [rows, cols];
            const emb = await out.embedPages(src.getPages());
            const g = +v.gap;
            const cw = (W - g * (cols + 1)) / cols, ch = (H - g * (rows + 1)) / rows;
            for (let i = 0; i < emb.length; i += N) {
              const page = out.addPage([W, H]);
              for (let k = 0; k < N && i + k < emb.length; k++) {
                const e = emb[i + k];
                const srcPage = src.getPage(i + k);
                const rot = srcPage.getRotation().angle % 360;
                const ew = rot % 180 ? e.height : e.width, eh = rot % 180 ? e.width : e.height;
                const s = Math.min(cw / ew, ch / eh);
                const c = v.order === "col" ? Math.floor(k / rows) : k % cols, r = v.order === "col" ? k % rows : Math.floor(k / cols);
                const x = g + c * (cw + g) + (cw - ew * s) / 2, y = H - (g + r * (ch + g)) - ch + (ch - eh * s) / 2;
                drawRotated(page, e, x, y, s, rot);
                if (v.border) page.drawRectangle({ x, y, width: ew * s, height: eh * s, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.6 });
              }
              progress?.(i / emb.length, "Placing pages");
            }
            return out;
          }
        }),
        "booklet-maker": single({
          view: "thumbs",
          action: "Make booklet",
          actionIcon: "book-open",
          suffix: "booklet",
          options: [
            { type: "info", html: "Print the result double-sided (flip on short edge), fold in the middle and staple \u2014 your pages will be in the right order." },
            { key: "sheet", type: "select", label: "Paper size", default: "A4", options: [["auto", "Fit two pages exactly"], ...Object.keys(PAGE_SIZES).map((k) => [k, k])] },
            { key: "rtl", type: "check", label: "Right-to-left binding (Urdu, Arabic)" }
          ],
          async apply(bytes, v) {
            const { PDFDocument } = await PL();
            const src = await loadDoc(bytes);
            const out = await PDFDocument.create();
            const emb = await out.embedPages(src.getPages());
            const n = Math.ceil(emb.length / 4) * 4;
            const p0 = src.getPage(0);
            const pw = p0.getWidth(), ph = p0.getHeight();
            let W, H;
            if (v.sheet === "auto") {
              W = pw * 2;
              H = ph;
            } else {
              const s = PAGE_SIZES[v.sheet];
              W = Math.max(...s);
              H = Math.min(...s);
            }
            const slot = (page, i, side) => {
              const e = emb[i];
              if (!e) return;
              const s = Math.min(W / 2 / e.width, H / e.height);
              const x = (side ? W / 2 : 0) + (W / 2 - e.width * s) / 2, y = (H - e.height * s) / 2;
              page.drawPage(e, { x, y, xScale: s, yScale: s });
            };
            for (let i = 0; i < n / 2; i += 2) {
              let [l1, r1] = [n - 1 - i, i], [l2, r2] = [i + 1, n - 2 - i];
              if (v.rtl) {
                [l1, r1] = [r1, l1];
                [l2, r2] = [r2, l2];
              }
              const f = out.addPage([W, H]);
              slot(f, l1, 0);
              slot(f, r1, 1);
              const b = out.addPage([W, H]);
              slot(b, l2, 0);
              slot(b, r2, 1);
            }
            return out;
          }
        }),
        "split-half": single({
          view: "thumbs",
          action: "Split pages",
          actionIcon: "columns-2",
          suffix: "split-half",
          options: [
            { key: "dir", type: "seg", label: "Split", default: "v", options: [["v", "Left | Right", "columns-2"], ["h", "Top / Bottom", "rows-2"]] },
            { key: "skip", type: "pages", label: "Don\u2019t split these pages (e.g. covers)", placeholder: "e.g. 1, last" },
            { key: "rtl", type: "check", label: "Right page first (right-to-left books)" }
          ],
          async apply(bytes, v) {
            const { PDFDocument } = await PL();
            const src = await loadDoc(bytes);
            const n = src.getPageCount();
            const out = await PDFDocument.create();
            const skip = new Set(String(v.skip || "").trim() ? parsePages(v.skip, n, false) : []);
            for (let i = 0; i < n; i++) {
              if (skip.has(i)) {
                out.addPage((await out.copyPages(src, [i]))[0]);
                continue;
              }
              const [a, b] = await out.copyPages(src, [i, i]);
              const box = a.getCropBox();
              const rot = a.getRotation().angle % 180;
              const vertical = v.dir === "v" !== !!rot;
              const halves = vertical ? [[box.x, box.y, box.width / 2, box.height], [box.x + box.width / 2, box.y, box.width / 2, box.height]] : [[box.x, box.y + box.height / 2, box.width, box.height / 2], [box.x, box.y, box.width, box.height / 2]];
              let order = [[a, halves[0]], [b, halves[1]]];
              const rotAngle = a.getRotation().angle % 360;
              if (rotAngle === 90 || rotAngle === 180) order.reverse();
              if (v.rtl) order.reverse();
              for (const [p, hb] of order) {
                p.setCropBox(...hb);
                p.setMediaBox(...hb);
                out.addPage(p);
              }
            }
            return out;
          }
        })
      };
    }
  });

  // js/tools/optimize.js
  var optimize_exports = {};
  __export(optimize_exports, {
    cleanup: () => cleanup,
    compressBytes: () => compressBytes,
    default: () => optimize_default,
    garbageCollect: () => garbageCollect,
    recompressImages: () => recompressImages
  });
  async function recompressImages(doc, { quality = 0.7, maxDim = 1600, gray = false, progress } = {}) {
    const P = await PL();
    const N = (n) => P.PDFName.of(n);
    const ctx = doc.context;
    const imgs = ctx.enumerateIndirectObjects().filter(([, o]) => o instanceof P.PDFRawStream && String(o.dict.get(N("Subtype"))) === "/Image");
    let done = 0, saved = 0;
    for (const [ref, s] of imgs) {
      progress?.(done++ / imgs.length * 0.9, `Optimizing image ${done} of ${imgs.length}`);
      try {
        const d = s.dict;
        const w = num(d.get(N("Width"))), hgt = num(d.get(N("Height")));
        if (!w || !hgt || w * hgt < 4e4) continue;
        if (String(d.get(N("ImageMask"))) === "true" || num(d.get(N("BitsPerComponent"))) !== 8) continue;
        let filters = d.get(N("Filter"));
        filters = filters instanceof P.PDFArray ? filters.asArray().map(String) : filters ? [String(filters)] : [];
        const comps = colorComps(ctx, d.get(N("ColorSpace")), P);
        if (comps !== 1 && comps !== 3) continue;
        if (d.get(N("Decode")) && filters.join() !== "/FlateDecode") continue;
        let source;
        if (filters.length === 1 && filters[0] === "/DCTDecode") source = await createImageBitmap(new Blob([s.contents], { type: "image/jpeg" }));
        else if (filters.every((f) => f === "/FlateDecode")) {
          const parms = d.get(N("DecodeParms"));
          if (parms && num(ctx.lookup(parms)?.get?.(N("Predictor"))) > 1) continue;
          const raw = filters.length ? P.decodePDFRawStream(s).decode() : s.contents;
          if (raw.length < w * hgt * comps) continue;
          const id = new ImageData(w, hgt);
          const px = id.data;
          for (let i = 0, j = 0; i < w * hgt; i++) {
            if (comps === 3) {
              px[j++] = raw[i * 3];
              px[j++] = raw[i * 3 + 1];
              px[j++] = raw[i * 3 + 2];
            } else {
              px[j++] = px[j++] = px[j++] = raw[i];
            }
            px[j++] = 255;
          }
          source = await createImageBitmap(id);
        } else continue;
        const k = Math.min(1, maxDim / Math.max(w, hgt));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * k));
        c.height = Math.max(1, Math.round(hgt * k));
        const x = c.getContext("2d");
        x.drawImage(source, 0, 0, c.width, c.height);
        source.close?.();
        if (gray) {
          const id = x.getImageData(0, 0, c.width, c.height);
          const p = id.data;
          for (let i = 0; i < p.length; i += 4) p[i] = p[i + 1] = p[i + 2] = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114;
          x.putImageData(id, 0, 0);
        }
        const bytes = await canvasBytes(c, "image/jpeg", quality);
        if (bytes.length >= s.contents.length * 0.92) continue;
        const nd = ctx.obj({ Type: "XObject", Subtype: "Image", Width: c.width, Height: c.height, ColorSpace: "DeviceRGB", BitsPerComponent: 8, Filter: "DCTDecode", Length: bytes.length });
        for (const key of ["SMask", "Interpolate", "Intent", "OC", "Metadata"]) {
          const v = d.get(N(key));
          if (v) nd.set(N(key), v);
        }
        saved += s.contents.length - bytes.length;
        ctx.assign(ref, P.PDFRawStream.of(nd, bytes));
        if (done % 4 === 0) await nextFrame();
      } catch (e) {
        console.warn("image skipped", e);
      }
    }
    return saved;
  }
  function num(v) {
    return v && typeof v.asNumber === "function" ? v.asNumber() : v ? Number(String(v)) : 0;
  }
  function colorComps(ctx, cs, P) {
    cs = ctx.lookup(cs);
    if (!cs) return 0;
    const s = String(cs);
    if (s === "/DeviceRGB" || s === "/CalRGB") return 3;
    if (s === "/DeviceGray" || s === "/CalGray") return 1;
    if (cs instanceof P.PDFArray && String(cs.get(0)) === "/ICCBased") {
      const st = ctx.lookup(cs.get(1));
      return num(st?.dict?.get(P.PDFName.of("N")));
    }
    return 0;
  }
  function garbageCollect(doc) {
    const P = window.PDFLib;
    const ctx = doc.context;
    const seen = /* @__PURE__ */ new Set();
    const stack = [ctx.trailerInfo.Root, ctx.trailerInfo.Info].filter(Boolean);
    while (stack.length) {
      const o = stack.pop();
      if (o instanceof P.PDFRef) {
        if (seen.has(o.tag)) continue;
        seen.add(o.tag);
        const v = ctx.lookup(o);
        if (v) stack.push(v);
      } else if (o instanceof P.PDFDict) for (const [, v] of o.entries()) stack.push(v);
      else if (o instanceof P.PDFArray) for (const v of o.asArray()) stack.push(v);
      else if (o?.dict instanceof P.PDFDict) stack.push(o.dict);
    }
    let removed = 0;
    for (const [ref] of ctx.enumerateIndirectObjects()) if (!seen.has(ref.tag)) {
      ctx.delete(ref);
      removed++;
    }
    return removed;
  }
  async function cleanup(doc, { thumbs = true, pieceInfo = true, metadata = false } = {}) {
    const P = await PL();
    const N = (n) => P.PDFName.of(n);
    for (const p of doc.getPages()) {
      if (thumbs) p.node.delete(N("Thumb"));
      if (pieceInfo) p.node.delete(N("PieceInfo"));
    }
    if (pieceInfo) doc.catalog.delete(N("PieceInfo"));
    if (metadata) doc.catalog.delete(N("Metadata"));
    return garbageCollect(doc);
  }
  async function compressBytes(bytes, v, progress) {
    if (v.level === "extreme") {
      const pdf = await openPdf(bytes);
      return rasterizeToPdf(pdf, { dpi: 96, quality: 0.5, onProgress: progress, transform: v.gray ? grayCanvas : null });
    }
    const doc = await loadDoc(bytes);
    await recompressImages(doc, { ...LEVELS[v.level || "medium"], gray: !!v.gray, progress });
    await cleanup(doc, { metadata: false });
    return doc;
  }
  function grayCanvas(c) {
    const x = c.getContext("2d");
    const d = x.getImageData(0, 0, c.width, c.height);
    const p = d.data;
    for (let i = 0; i < p.length; i += 4) p[i] = p[i + 1] = p[i + 2] = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114;
    x.putImageData(d, 0, 0);
    return c;
  }
  async function finishSize(ctx, doc, suffix) {
    let blob = doc instanceof Blob ? doc : await saveDoc(doc);
    const before = ctx.files[0].size;
    let message;
    if (blob.size >= before) {
      blob = new Blob([ctx.files[0].bytes], { type: "application/pdf" });
      message = "This PDF is already well optimised \u2014 we couldn\u2019t make it smaller without losing quality. Try a stronger level.";
    }
    return { files: [{ name: outName(ctx, suffix), blob }], stats: { before, after: blob.size }, message };
  }
  var LEVELS, optimize_default;
  var init_optimize = __esm({
    "js/tools/optimize.js"() {
      init_pdf();
      init_ui();
      init_common();
      LEVELS = {
        low: { quality: 0.85, maxDim: 2600 },
        medium: { quality: 0.72, maxDim: 1700 },
        high: { quality: 0.55, maxDim: 1150 }
      };
      optimize_default = {
        "compress-pdf": {
          accept: "pdf",
          view: "thumbs",
          action: "Compress PDF",
          actionIcon: "shrink",
          suffix: "compressed",
          options: [
            { key: "level", type: "cards", label: "Compression level", default: "medium", options: [["low", "Light", "best quality"], ["medium", "Recommended", "good quality, small"], ["high", "Strong", "smaller, lower quality"], ["extreme", "Extreme", "smallest \xB7 text becomes image"]] },
            { key: "gray", type: "check", label: "Also convert images to grayscale" },
            { type: "info", html: "Text and vector graphics stay sharp \u2014 only images are recompressed (except \u201CExtreme\u201D)." }
          ],
          apply: (bytes, v, p) => compressBytes(bytes, v, p),
          async run(ctx) {
            return finishSize(ctx, await compressBytes(ctx.files[0].bytes, ctx.values, ctx.progress), "compressed");
          }
        },
        "reduce-size": {
          accept: "pdf",
          view: "thumbs",
          action: "Reduce size",
          actionIcon: "target",
          options: (ctx) => [
            { type: "info", html: `Current size: <b>${fmtBytes(ctx.files[0].size)}</b>` },
            { key: "preset", type: "seg", label: "Target size", default: "200", options: [["100", "100 KB"], ["200", "200 KB"], ["500", "500 KB"], ["1024", "1 MB"], ["2048", "2 MB"], ["custom", "Custom"]] },
            { key: "kb", type: "number", label: "Target size (KB)", default: 300, min: 10, show: (v) => v.preset === "custom" },
            { key: "allowRaster", type: "check", label: "Allow turning pages into images if needed", default: true, hint: "Needed for very small targets. Text won\u2019t be selectable afterwards." }
          ],
          async run(ctx) {
            const target = (ctx.values.preset === "custom" ? +ctx.values.kb : +ctx.values.preset) * 1024;
            const bytes = ctx.files[0].bytes;
            if (bytes.length <= target) return { files: [{ name: outName(ctx, "reduced"), blob: new Blob([bytes], { type: "application/pdf" }) }], message: "Your PDF is already under the target size.", stats: { before: bytes.length, after: bytes.length } };
            let best = null;
            for (const lvl of ["medium", "high"]) {
              ctx.progress(lvl === "medium" ? 0.05 : 0.25, `Trying ${lvl} compression\u2026`);
              const doc = await loadDoc(bytes);
              await recompressImages(doc, LEVELS[lvl]);
              await cleanup(doc);
              const b = await saveDoc(doc);
              if (!best || b.size < best.size) best = b;
              if (b.size <= target) break;
            }
            if (best.size > target && ctx.values.allowRaster) {
              const pdf = await openPdf(bytes);
              let lo = 40, hi = 150, found = null;
              for (let k = 0; k < 6 && lo <= hi; k++) {
                const dpi = Math.round((lo + hi) / 2);
                const q = Math.max(0.35, Math.min(0.8, dpi / 190));
                ctx.progress(0.4 + k * 0.1, `Trying ${dpi} DPI\u2026`);
                const b = await saveDoc(await rasterizeToPdf(pdf, { dpi, quality: q }));
                if (b.size <= target) {
                  found = b;
                  lo = dpi + 1;
                } else hi = dpi - 1;
                if (b.size < best.size) best = b;
              }
              if (found) best = found;
            }
            const ok = best.size <= target;
            return { files: [{ name: outName(ctx, "reduced"), blob: best }], stats: { before: bytes.length, after: best.size }, title: ok ? "Done!" : "Smallest possible", message: ok ? `Reduced to ${fmtBytes(best.size)} \u2014 under your ${fmtBytes(target)} target.` : `We got it down to ${fmtBytes(best.size)}, which is the smallest possible for this file. Try splitting it into parts.` };
          }
        },
        "optimize-images": {
          accept: "pdf",
          view: "thumbs",
          action: "Optimize images",
          actionIcon: "image-down",
          options: [
            { key: "quality", type: "range", label: "JPEG quality", default: 70, min: 20, max: 95, unit: "%" },
            { key: "maxDim", type: "select", label: "Max image size", default: "1700", options: [["4000", "Keep size (no downscale)"], ["2600", "Large (2600 px)"], ["1700", "Medium (1700 px)"], ["1100", "Small (1100 px)"], ["700", "Tiny (700 px)"]] },
            { key: "gray", type: "check", label: "Convert images to grayscale" }
          ],
          async apply(bytes, v, progress) {
            const doc = await loadDoc(bytes);
            await recompressImages(doc, { quality: v.quality / 100, maxDim: +v.maxDim, gray: v.gray, progress });
            await cleanup(doc);
            return doc;
          },
          async run(ctx) {
            return finishSize(ctx, await this.apply(ctx.files[0].bytes, ctx.values, ctx.progress), "optimized");
          }
        },
        "flatten-pdf": {
          accept: "pdf",
          view: "thumbs",
          action: "Flatten PDF",
          actionIcon: "layers-2",
          suffix: "flattened",
          options: [
            { key: "mode", type: "cards", label: "What to flatten", default: "forms", options: [["forms", "Form fields", "keeps text sharp"], ["all", "Everything", "forms, comments, stamps \u2014 as images"]] },
            { key: "dpi", type: "select", label: "Image quality", default: "200", options: [["150", "Good"], ["200", "High"], ["300", "Print"]], show: (v) => v.mode === "all" }
          ],
          async apply(bytes, v, progress) {
            if (v.mode === "all") {
              const pdf = await openPdf(bytes);
              return rasterizeToPdf(pdf, { dpi: +v.dpi || 200, quality: 0.85, onProgress: progress });
            }
            const doc = await loadDoc(bytes);
            try {
              const form = doc.getForm();
              form.getFields().forEach((f) => {
                try {
                  f.enableReadOnly();
                } catch {
                }
              });
              form.flatten({ updateFieldAppearances: true });
            } catch (e) {
              console.warn(e);
            }
            return doc;
          },
          async run(ctx) {
            const doc = await this.apply(ctx.files[0].bytes, ctx.values, ctx.progress);
            return { files: [{ name: outName(ctx, "flattened"), blob: await saveDoc(doc) }] };
          }
        },
        "remove-objects": {
          accept: "pdf",
          view: "thumbs",
          action: "Clean up PDF",
          actionIcon: "sparkle",
          options: [
            { key: "thumbs", type: "check", label: "Remove embedded page thumbnails", default: true },
            { key: "pieceInfo", type: "check", label: "Remove private app data (Illustrator, Photoshop)", default: true },
            { key: "metadata", type: "check", label: "Remove XMP metadata" },
            { key: "js", type: "check", label: "Remove JavaScript", default: true }
          ],
          async apply(bytes, v) {
            const P = await PL();
            const doc = await loadDoc(bytes);
            if (v.js) {
              const names = doc.catalog.lookup(P.PDFName.of("Names"));
              names?.delete?.(P.PDFName.of("JavaScript"));
              doc.catalog.delete(P.PDFName.of("OpenAction"));
            }
            await cleanup(doc, v);
            return doc;
          },
          async run(ctx) {
            return finishSize(ctx, await this.apply(ctx.files[0].bytes, ctx.values), "clean");
          }
        },
        "repair-pdf": {
          accept: "pdf",
          view: "none",
          action: "Repair PDF",
          actionIcon: "wrench",
          options: [{ key: "mode", type: "cards", label: "Repair method", default: "rebuild", options: [["rebuild", "Rebuild structure", "keeps text & quality"], ["render", "Re-draw pages", "for badly broken files"]] }],
          async run(ctx) {
            const f = ctx.files[0];
            if (ctx.values.mode === "rebuild" && !f.broken) {
              try {
                const { PDFDocument } = await PL();
                const src = await loadDoc(f.bytes);
                const out = await PDFDocument.create();
                (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
                return { files: [{ name: outName(ctx, "repaired"), blob: await saveDoc(out) }], message: `Rebuilt ${out.getPageCount()} pages with a fresh file structure.` };
              } catch (e) {
                console.warn("rebuild failed, rendering instead", e);
              }
            }
            const pdf = await openPdf(f.bytes);
            const doc = await rasterizeToPdf(pdf, { dpi: 170, quality: 0.85, onProgress: ctx.progress });
            return { files: [{ name: outName(ctx, "repaired"), blob: await saveDoc(doc) }], message: `Recovered ${doc.getPageCount()} pages by re-drawing them. Run OCR PDF to make the text searchable again.` };
          }
        }
      };
    }
  });

  // js/tools/edit.js
  var edit_exports = {};
  __export(edit_exports, {
    default: () => edit_default,
    measure: () => measure,
    readOutline: () => readOutline,
    sendBehind: () => sendBehind,
    stampText: () => stampText
  });
  async function stampText(doc, page, text, { vx, vy, size = 12, font = "Helvetica", color = "#000000", opacity = 1, rotate = 0 }) {
    const P = await PL();
    const f = await getFont(doc, font);
    const p = visualToUser(page, vx, vy);
    if (canEncode(f, text)) {
      page.drawText(text, { x: p.x, y: p.y, size, font: f, color: hexRgb(color), opacity, rotate: P.degrees(p.r + rotate) });
      return;
    }
    const t2 = await textPng(text, size, color, font);
    const img = await doc.embedPng(t2.bytes);
    const a = rotate * Math.PI / 180;
    const off = -(t2.h - size * 0.95);
    const q = visualToUser(page, vx - off * Math.sin(a), vy + off * Math.cos(a));
    page.drawImage(img, { x: q.x, y: q.y, width: t2.w, height: t2.h, opacity, rotate: P.degrees(q.r + rotate) });
  }
  async function measure(doc, text, size, font = "Helvetica") {
    const f = await getFont(doc, font);
    if (canEncode(f, text)) return f.widthOfTextAtSize(text, size);
    return (await textPng(text, size, "#000", font)).w;
  }
  function sendBehind(page) {
    const P = window.PDFLib;
    const c = page.node.Contents();
    if (c instanceof P.PDFArray && c.size() > 1) {
      const last = c.get(c.size() - 1);
      c.remove(c.size() - 1);
      c.insert(0, last);
    }
  }
  function editorTool(tools, def = "select", extra = {}) {
    return {
      accept: "pdf",
      view: "editor",
      editorTools: tools,
      editorDefault: def,
      action: "Save PDF",
      actionIcon: "save",
      options: extra.options || [{ type: "info", html: "Pick a tool from the bar above the page, then tap on the page. Use the arrows to move between pages." }],
      validate: (ctx) => !ctx.state.objects?.length ? "Add something to the page first" : null,
      async run(ctx) {
        const doc = await loadDoc(ctx.files[0].bytes);
        await applyObjects(doc, ctx.state.objects);
        return { files: [{ name: outName(ctx, extra.suffix || "edited"), blob: await saveDoc(doc) }], message: `${ctx.state.objects.length} change${ctx.state.objects.length > 1 ? "s" : ""} saved.` };
      },
      ...extra
    };
  }
  async function readOutline(pdf) {
    const out = [];
    const ol = await pdf.getOutline().catch(() => null);
    if (!ol) return out;
    const walk = async (items, depth) => {
      for (const it of items) {
        let page = 1;
        try {
          let dest = it.dest;
          if (typeof dest === "string") dest = await pdf.getDestination(dest);
          if (dest?.[0]) page = (typeof dest[0] === "object" ? await pdf.getPageIndex(dest[0]) : dest[0]) + 1;
        } catch {
        }
        out.push({ title: (depth ? "  ".repeat(depth) : "") + it.title, page });
        if (it.items?.length) await walk(it.items, depth + 1);
      }
    };
    await walk(ol, 0);
    return out;
  }
  async function detectHeadings(pdf) {
    const all = [];
    const sizes = {};
    for (let i = 1; i <= Math.min(pdf.numPages, 300); i++) {
      const lines = toLines((await pageText(pdf, i)).items);
      lines.forEach((l) => {
        sizes[Math.round(l.size)] = (sizes[Math.round(l.size)] || 0) + l.text.length;
        all.push({ ...l, page: i });
      });
    }
    const body = +Object.entries(sizes).sort((a, b) => b[1] - a[1])[0]?.[0] || 11;
    return all.filter((l) => l.size >= body * 1.25 && l.text.trim().length > 2 && l.text.length < 90).slice(0, 60).map((l) => ({ title: l.text.trim(), page: l.page }));
  }
  function themeCanvas(c, theme) {
    const x = c.getContext("2d");
    const d = x.getImageData(0, 0, c.width, c.height);
    const p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      let r = p[i], g = p[i + 1], b = p[i + 2];
      if (theme === "sepia") {
        const L3 = 0.299 * r + 0.587 * g + 0.114 * b;
        p[i] = Math.min(255, L3 * 0.95 + 40);
        p[i + 1] = Math.min(255, L3 * 0.85 + 28);
        p[i + 2] = Math.min(255, L3 * 0.65 + 12);
        continue;
      }
      const L2 = 0.299 * r + 0.587 * g + 0.114 * b;
      const nl = 255 - L2;
      const sh = nl - L2;
      r += sh;
      g += sh;
      b += sh;
      if (theme === "dim") {
        r = 28 + r * 0.82;
        g = 30 + g * 0.82;
        b = 34 + b * 0.82;
      }
      if (theme === "night") {
        const l2 = 0.299 * r + 0.587 * g + 0.114 * b;
        r = l2;
        g = l2 * 0.78;
        b = l2 * 0.45;
      }
      p[i] = r;
      p[i + 1] = g;
      p[i + 2] = b;
    }
    x.putImageData(d, 0, 0);
    return c;
  }
  function contentStreams(page, P) {
    const c = page.node.Contents();
    if (!c) return [];
    const arr = c instanceof P.PDFArray ? c.asArray().map((r) => page.doc.context.lookup(r)) : [c];
    return arr.filter(Boolean).map((s) => s instanceof P.PDFRawStream ? P.decodePDFRawStream(s).decode() : s.getContents ? s.getContents() : new Uint8Array());
  }
  function stripWatermarkBlocks(src) {
    const re = /(\/\w+)\s*(<<(?:[^<>]|<<(?:[^<>]|<<[^<>]*>>)*>>)*>>|\/\w+)\s*BDC|(\/\w+)\s*BMC|\bEMC\b/g;
    let out = "", last = 0, depth = 0, skipStart = -1, skipDepth = 0, m;
    while (m = re.exec(src)) {
      if (m[0].endsWith("EMC")) {
        if (skipStart >= 0 && depth === skipDepth) {
          out += src.slice(last, skipStart);
          last = m.index + m[0].length;
          skipStart = -1;
        }
        depth = Math.max(0, depth - 1);
      } else {
        depth++;
        if (skipStart < 0 && m[1] === "/Artifact" && /\/Watermark/.test(m[2] || "")) {
          skipStart = m.index;
          skipDepth = depth;
        }
      }
    }
    return out + src.slice(last);
  }
  function stripTextOps(src, text) {
    const e = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return src.replace(new RegExp(`\\((?:[^()\\\\]|\\\\.)*${e}(?:[^()\\\\]|\\\\.)*\\)\\s*Tj`, "g"), "() Tj").replace(new RegExp(`\\[[^\\]]*${e}[^\\]]*\\]\\s*TJ`, "g"), "[] TJ");
  }
  function stripTransparentImages(src, page, P) {
    const res = page.node.Resources();
    const gs = res?.lookup(P.PDFName.of("ExtGState"));
    if (!(gs instanceof P.PDFDict)) return src;
    const transparent = /* @__PURE__ */ new Set();
    for (const [k, v] of gs.entries()) {
      const d = page.doc.context.lookup(v);
      const ca = d?.get?.(P.PDFName.of("ca"));
      if (ca && +String(ca) < 0.95) transparent.add(String(k));
    }
    if (!transparent.size) return src;
    return src.replace(/q\s+(\/\w+)\s+gs[\s\S]*?\/\w+\s+Do\s+Q/g, (m, g) => transparent.has(g) ? "" : m);
  }
  var fontOpt, pagesOpt, fill, ALL_TOOLS, pos9, edit_default, latin1, toBytes;
  var init_edit = __esm({
    "js/tools/edit.js"() {
      init_pdf();
      init_editor();
      init_ui();
      init_common();
      init_organize();
      fontOpt = { key: "font", type: "select", label: "Font", default: "Helvetica", options: [["Helvetica", "Helvetica"], ["HelveticaBold", "Helvetica Bold"], ["TimesRoman", "Times"], ["TimesRomanBold", "Times Bold"], ["Courier", "Courier"]] };
      pagesOpt = { key: "pages", type: "pages", label: "Pages (optional)", hint: "Leave empty for all pages." };
      fill = (tpl, map) => tpl.replace(/\{(\w+)\}/g, (m, k) => k in map ? map[k] : m);
      ALL_TOOLS = ["text", "image", "signature", "rect", "ellipse", "line", "arrow", "highlight", "draw", "whiteout", "note", "link", "date"];
      pos9 = (allowed, def = "bc") => ({ key: "pos", type: "position", label: "Position", default: def, allowed });
      edit_default = {
        "edit-pdf": editorTool(ALL_TOOLS, "text", { about: "Add text, images, signatures, shapes, highlights, freehand drawings, links and comments. Whiteout covers content with a white box (the original stays underneath \u2014 use Redact to remove it for good)." }),
        "add-text": editorTool(["text", "date"], "text", { suffix: "text-added" }),
        "add-image": editorTool(["image"], "image", { suffix: "image-added" }),
        "add-shapes": editorTool(["rect", "ellipse", "line", "arrow"], "rect", { suffix: "shapes" }),
        "highlight-pdf": editorTool(["highlight", "note"], "highlight", { suffix: "highlighted" }),
        "draw-pdf": editorTool(["draw", "highlight"], "draw", { suffix: "drawn" }),
        "annotate-pdf": editorTool(["note", "highlight", "text", "arrow"], "note", { suffix: "commented", about: "Notes are real PDF comments that show up in Adobe Reader, Chrome and phone PDF apps." }),
        "whiteout-pdf": editorTool(["whiteout", "text"], "whiteout", { suffix: "whiteout", about: "Whiteout hides content visually. To remove sensitive data permanently, use Redact PDF." }),
        "crop-pdf": {
          accept: "pdf",
          view: "editor",
          editorTools: [],
          action: "Crop PDF",
          actionIcon: "crop",
          editorHint: () => "Drag the box to move it. Drag the round handle to resize. Everything outside will be cut off.",
          init(ctx) {
            ctx.state.objects = [{ id: 1, type: "crop", page: 0, x: 0.06, y: 0.06, w: 0.88, h: 0.88 }];
          },
          afterEditor(ctx) {
            const ed = ctx.editor;
            const orig = ed.goto.bind(ed);
            ed.goto = async (i) => {
              ctx.state.objects[0].page = i;
              await orig(i);
            };
          },
          options: [{ key: "apply", type: "seg", label: "Apply crop to", default: "all", options: [["all", "All pages"], ["this", "This page only"], ["odd", "Odd"], ["even", "Even"]] }],
          async run(ctx) {
            const doc = await loadDoc(ctx.files[0].bytes);
            const c = ctx.state.objects[0];
            const cur = ctx.editor?.page || 0;
            doc.getPages().forEach((p, i) => {
              const ok = { all: true, this: i === cur, odd: i % 2 === 0, even: i % 2 === 1 }[ctx.values.apply];
              if (!ok) return;
              const { w: W, h: H } = visualSize(p);
              const a = visualToUser(p, c.x * W, H - c.y * H), b = visualToUser(p, (c.x + c.w) * W, H - (c.y + c.h) * H);
              const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), w = Math.abs(a.x - b.x), hh = Math.abs(a.y - b.y);
              p.setCropBox(x, y, w, hh);
              p.setMediaBox(x, y, w, hh);
            });
            return { files: [{ name: outName(ctx, "cropped"), blob: await saveDoc(doc) }] };
          }
        },
        "resize-pages": single({
          view: "thumbs",
          action: "Resize pages",
          actionIcon: "scaling",
          suffix: "resized",
          options: [
            { key: "size", type: "select", label: "New page size", default: "A4", options: [...Object.keys(PAGE_SIZES).map((k) => [k, k]), ["custom", "Custom (mm)"]] },
            { key: "cw", type: "number", label: "Width (mm)", default: 210, show: (v) => v.size === "custom" },
            { key: "ch", type: "number", label: "Height (mm)", default: 297, show: (v) => v.size === "custom" },
            { key: "orient", type: "seg", label: "Orientation", default: "auto", options: [["auto", "Match page"], ["portrait", "Portrait"], ["landscape", "Landscape"]] },
            { key: "fit", type: "seg", label: "Content", default: "fit", options: [["fit", "Scale to fit"], ["stretch", "Stretch"], ["none", "Don\u2019t scale"]] }
          ],
          async apply(bytes, v) {
            const { PDFDocument } = await PL();
            const src = await loadDoc(bytes);
            const out = await PDFDocument.create();
            const emb = await out.embedPages(src.getPages());
            emb.forEach((e, i) => {
              const rot = src.getPage(i).getRotation().angle % 360;
              const ew = rot % 180 ? e.height : e.width, eh = rot % 180 ? e.width : e.height;
              let [W, H] = v.size === "custom" ? [v.cw * MM, v.ch * MM] : PAGE_SIZES[v.size];
              const land = v.orient === "landscape" || v.orient === "auto" && ew > eh;
              if (land !== W > H) [W, H] = [H, W];
              const p = out.addPage([W, H]);
              if (v.fit === "stretch") {
                const sx = W / ew, sy = H / eh;
                if (!rot) p.drawPage(e, { x: 0, y: 0, xScale: sx, yScale: sy });
                else drawRotated(p, e, 0, 0, Math.min(sx, sy), rot);
                return;
              }
              const s = v.fit === "none" ? 1 : Math.min(W / ew, H / eh);
              drawRotated(p, e, (W - ew * s) / 2, (H - eh * s) / 2, s, rot);
            });
            return out;
          }
        }),
        "change-margins": single({
          view: "thumbs",
          action: "Add margins",
          actionIcon: "square-dashed",
          suffix: "margins",
          options: [
            { key: "all", type: "range", label: "Margin on all sides", default: 15, min: 0, max: 60, unit: " mm" },
            { key: "extraLeft", type: "range", label: "Extra binding margin (left)", default: 0, min: 0, max: 40, unit: " mm" },
            { key: "keep", type: "seg", label: "Page size", default: "grow", options: [["grow", "Make page bigger"], ["keep", "Keep size, shrink content"]] },
            { key: "mirror", type: "check", label: "Mirror binding margin on even pages (for double-sided)" }
          ],
          async apply(bytes, v) {
            const { PDFDocument } = await PL();
            const src = await loadDoc(bytes);
            const out = await PDFDocument.create();
            const emb = await out.embedPages(src.getPages());
            emb.forEach((e, i) => {
              const rot = src.getPage(i).getRotation().angle % 360;
              const ew = rot % 180 ? e.height : e.width, eh = rot % 180 ? e.width : e.height;
              const m = v.all * MM, b = v.extraLeft * MM;
              const left = v.mirror && i % 2 ? m : m + b, right = v.mirror && i % 2 ? m + b : m;
              if (v.keep === "keep") {
                const s = Math.min((ew - left - right) / ew, (eh - 2 * m) / eh);
                const p = out.addPage([ew, eh]);
                drawRotated(p, e, left + (ew - left - right - ew * s) / 2, (eh - eh * s) / 2, s, rot);
              } else {
                const p = out.addPage([ew + left + right, eh + 2 * m]);
                drawRotated(p, e, left, m, 1, rot);
              }
            });
            return out;
          }
        }),
        "page-numbers": single({
          view: "thumbs",
          action: "Add page numbers",
          actionIcon: "list-ordered",
          suffix: "numbered",
          options: [
            pos9(["tl", "tc", "tr", "bl", "bc", "br"], "bc"),
            { key: "format", type: "select", label: "Format", default: "{n}", options: [["{n}", "1"], ["Page {n}", "Page 1"], ["Page {n} of {total}", "Page 1 of 10"], ["{n} / {total}", "1 / 10"], ["- {n} -", "- 1 -"], ["custom", "Custom\u2026"]] },
            { key: "custom", type: "text", label: "Custom format", default: "\u092A\u0943\u0937\u094D\u0920 {n}", hint: "Use {n} for the number and {total} for the page count.", show: (v) => v.format === "custom" },
            { key: "start", type: "number", label: "Start numbering at", default: 1, min: 0 },
            { key: "skipFirst", type: "check", label: "Don\u2019t number the first page (cover)" },
            pagesOpt,
            { key: "size", type: "range", label: "Font size", default: 11, min: 6, max: 30, unit: " pt" },
            { key: "color", type: "color", label: "Colour", default: "#000000" },
            fontOpt,
            { key: "margin", type: "range", label: "Distance from edge", default: 10, min: 3, max: 40, unit: " mm" },
            { key: "mirror", type: "check", label: "Mirror left/right on even pages (books)" }
          ],
          async apply(bytes, v) {
            const doc = await loadDoc(bytes);
            const pages = doc.getPages();
            const n = pages.length;
            const list = new Set(parsePages(v.pages, n));
            if (v.skipFirst) list.delete(0);
            const fmt2 = v.format === "custom" ? v.custom : v.format;
            let num2 = +v.start || 1;
            const total = list.size + (+v.start || 1) - 1;
            for (let i = 0; i < n; i++) {
              if (!list.has(i)) continue;
              const p = pages[i];
              const { w: W, h: H } = visualSize(p);
              const text = fill(fmt2, { n: num2++, total });
              const tw = await measure(doc, text, v.size, v.font);
              let pos = v.pos;
              if (v.mirror && i % 2 === 1 && pos[1] !== "c") pos = pos[0] + (pos[1] === "l" ? "r" : "l");
              const { x, y } = anchorXY(pos, W, H, tw, v.size, v.margin * MM);
              await stampText(doc, p, text, { vx: x, vy: y + v.size * 0.2, size: v.size, font: v.font, color: v.color });
            }
            return doc;
          }
        }),
        "header-footer": single({
          view: "thumbs",
          action: "Add header & footer",
          actionIcon: "panel-top",
          suffix: "header-footer",
          options: [
            { type: "info", html: "Use <b>{page}</b>, <b>{total}</b>, <b>{date}</b> and <b>{file}</b> anywhere in the text." },
            { type: "heading", label: "Header" },
            { key: "hl", type: "text", label: "Left", placeholder: "e.g. Company name" },
            { key: "hc", type: "text", label: "Centre" },
            { key: "hr", type: "text", label: "Right", placeholder: "e.g. {date}" },
            { type: "heading", label: "Footer" },
            { key: "fl", type: "text", label: "Left", placeholder: "e.g. {file}" },
            { key: "fc", type: "text", label: "Centre", default: "Page {page} of {total}" },
            { key: "fr", type: "text", label: "Right", placeholder: "e.g. Confidential" },
            { type: "heading", label: "Style" },
            { key: "size", type: "range", label: "Font size", default: 9, min: 6, max: 20, unit: " pt" },
            { key: "color", type: "color", label: "Colour", default: "#6b7280" },
            fontOpt,
            { key: "margin", type: "range", label: "Distance from edge", default: 10, min: 3, max: 30, unit: " mm" },
            { key: "line", type: "check", label: "Draw a thin line under the header / above the footer" },
            pagesOpt
          ],
          async apply(bytes, v, progress, ctx) {
            const P = await PL();
            const doc = await loadDoc(bytes);
            const pages = doc.getPages();
            const list = new Set(parsePages(v.pages, pages.length));
            const date = (/* @__PURE__ */ new Date()).toLocaleDateString();
            const file = baseName(ctx?.files?.[0]?.name || "");
            for (let i = 0; i < pages.length; i++) {
              if (!list.has(i)) continue;
              const p = pages[i];
              const { w: W, h: H } = visualSize(p);
              const m = v.margin * MM;
              const map = { page: i + 1, total: pages.length, date, file };
              for (const [key, pos] of [["hl", "tl"], ["hc", "tc"], ["hr", "tr"], ["fl", "bl"], ["fc", "bc"], ["fr", "br"]]) {
                const tpl = (v[key] || "").trim();
                if (!tpl) continue;
                const text = fill(tpl, map);
                const tw = await measure(doc, text, v.size, v.font);
                const { x, y } = anchorXY(pos, W, H, tw, v.size, m);
                await stampText(doc, p, text, { vx: x, vy: y + v.size * 0.2, size: v.size, font: v.font, color: v.color });
              }
              if (v.line) for (const [has, yy] of [[v.hl || v.hc || v.hr, H - m - v.size * 1.6], [v.fl || v.fc || v.fr, m + v.size * 1.9]]) {
                if (!has) continue;
                const a = visualToUser(p, m, yy), b = visualToUser(p, W - m, yy);
                p.drawLine({ start: { x: a.x, y: a.y }, end: { x: b.x, y: b.y }, thickness: 0.5, color: hexRgb(v.color) });
              }
            }
            return doc;
          }
        }),
        "watermark": single({
          view: "thumbs",
          action: "Add watermark",
          actionIcon: "stamp",
          suffix: "watermarked",
          options: [
            { key: "kind", type: "seg", label: "Watermark type", default: "text", options: [["text", "Text", "type"], ["image", "Image / logo", "image"]] },
            { key: "text", type: "text", label: "Text", default: "CONFIDENTIAL", show: (v) => v.kind === "text" },
            { key: "image", type: "image", label: "Image", show: (v) => v.kind === "image" },
            { key: "size", type: "range", label: "Text size", default: 60, min: 10, max: 160, unit: " pt", show: (v) => v.kind === "text" },
            { key: "scale", type: "range", label: "Image size", default: 40, min: 5, max: 100, unit: "% of page", show: (v) => v.kind === "image" },
            { key: "color", type: "color", label: "Colour", default: "#e11d48", show: (v) => v.kind === "text" },
            { ...fontOpt, default: "HelveticaBold", show: (v) => v.kind === "text" },
            { key: "opacity", type: "range", label: "Transparency", default: 25, min: 5, max: 100, unit: "%" },
            { key: "rotate", type: "seg", label: "Rotation", default: "45", options: [["0", "0\xB0"], ["45", "45\xB0"], ["-45", "-45\xB0"], ["90", "90\xB0"]] },
            { key: "layout", type: "seg", label: "Layout", default: "single", options: [["single", "Single"], ["tile", "Tiled (repeat)"]] },
            { ...pos9(null, "mc"), show: (v) => v.layout === "single" },
            { key: "behind", type: "check", label: "Place behind page content" },
            pagesOpt
          ],
          async apply(bytes, v) {
            const P = await PL();
            const doc = await loadDoc(bytes);
            const pages = doc.getPages();
            const list = new Set(parsePages(v.pages, pages.length));
            if (v.kind === "image" && !v.image) throw new Error("Choose an image for the watermark");
            if (v.kind === "text" && !String(v.text).trim()) throw new Error("Enter the watermark text");
            const img = v.kind === "image" ? await embedImage(doc, await imageForPdf(v.image.file, { maxDim: 2e3 })) : null;
            const rot = +v.rotate;
            const a = rot * Math.PI / 180;
            const op = v.opacity / 100;
            for (let i = 0; i < pages.length; i++) {
              if (!list.has(i)) continue;
              const p = pages[i];
              const { w: W, h: H } = visualSize(p);
              let bw, bh;
              if (img) {
                bw = W * v.scale / 100;
                bh = bw * img.height / img.width;
              } else {
                bw = await measure(doc, v.text, v.size, v.font);
                bh = v.size;
              }
              const centers = [];
              if (v.layout === "tile") {
                const sx = bw * 1.35 + 40, sy = bh * 3.2 + 40;
                for (let y = sy / 2; y < H + sy; y += sy) for (let x = Math.round(y / sy) % 2 ? sx / 2 : 0; x < W + sx; x += sx) centers.push([x, y]);
              } else {
                const { x, y } = anchorXY(v.pos, W, H, Math.abs(bw * Math.cos(a)) + Math.abs(bh * Math.sin(a)), Math.abs(bw * Math.sin(a)) + Math.abs(bh * Math.cos(a)), 24);
                centers.push([x + (Math.abs(bw * Math.cos(a)) + Math.abs(bh * Math.sin(a))) / 2, y + (Math.abs(bw * Math.sin(a)) + Math.abs(bh * Math.cos(a))) / 2]);
              }
              for (const [cx, cy] of centers) {
                const ox = -bw / 2, oy = img ? -bh / 2 : -bh * 0.35;
                const vx = cx + ox * Math.cos(a) - oy * Math.sin(a), vy = cy + ox * Math.sin(a) + oy * Math.cos(a);
                if (img) {
                  const q = visualToUser(p, vx, vy);
                  p.drawImage(img, { x: q.x, y: q.y, width: bw, height: bh, opacity: op, rotate: P.degrees(q.r + rot) });
                } else await stampText(doc, p, v.text, { vx, vy, size: v.size, font: v.font, color: v.color, opacity: op, rotate: rot });
              }
              if (v.behind) sendBehind(p);
            }
            return doc;
          }
        }),
        "remove-watermark": {
          accept: "pdf",
          view: "thumbs",
          action: "Remove watermark",
          actionIcon: "eraser",
          options: [
            { type: "info", html: 'Removes watermarks added by Acrobat, Word and most PDF tools (marked as watermark artifacts or annotations). Watermarks that are part of a scanned image can\u2019t be removed automatically \u2014 use <a href="#/whiteout-pdf">Whiteout</a> instead.' },
            { key: "text", type: "text", label: "Also remove text that matches (optional)", placeholder: "e.g. SAMPLE", hint: "Removes text drawing commands containing exactly this text." },
            { key: "images", type: "check", label: "Also remove semi-transparent overlay images" }
          ],
          async run(ctx) {
            const P = await PL();
            const doc = await loadDoc(ctx.files[0].bytes);
            const N = (n) => P.PDFName.of(n);
            let removed = 0;
            for (const page of doc.getPages()) {
              const annots = page.node.lookup(N("Annots"));
              if (annots instanceof P.PDFArray) for (let i = annots.size() - 1; i >= 0; i--) {
                const a = annots.lookup(i);
                if (String(a?.get?.(N("Subtype"))) === "/Watermark") {
                  annots.remove(i);
                  removed++;
                }
              }
              const streams = contentStreams(page, P);
              if (!streams.length) continue;
              let src = streams.map((s) => latin1(s)).join("\n");
              const before = src.length;
              src = stripWatermarkBlocks(src);
              if (ctx.values.text) src = stripTextOps(src, ctx.values.text);
              if (ctx.values.images) src = stripTransparentImages(src, page, P);
              if (src.length !== before) {
                removed++;
                page.node.set(N("Contents"), doc.context.register(doc.context.flateStream(toBytes(src))));
              }
            }
            if (!removed) throw new Error("No removable watermark was found in this PDF.");
            return { files: [{ name: outName(ctx, "no-watermark"), blob: await saveDoc(doc) }], message: "Watermark removed. Please check the result." };
          }
        },
        "background-color": single({
          view: "thumbs",
          action: "Apply background",
          actionIcon: "paint-bucket",
          suffix: "background",
          options: [
            { key: "kind", type: "seg", label: "Background", default: "color", options: [["color", "Colour"], ["image", "Image"]] },
            { key: "color", type: "color", label: "Colour", default: "#fef9c3", swatches: ["#fef9c3", "#fde68a", "#dcfce7", "#dbeafe", "#fce7f3", "#f5f5f4", "#e0e7ff", "#fff7ed"], show: (v) => v.kind === "color" },
            { key: "image", type: "image", label: "Image", show: (v) => v.kind === "image" },
            { key: "opacity", type: "range", label: "Strength", default: 100, min: 10, max: 100, unit: "%" },
            { type: "info", html: "Scanned pages have their own white background, so the colour may only show around the edges." },
            pagesOpt
          ],
          async apply(bytes, v) {
            const doc = await loadDoc(bytes);
            const pages = doc.getPages();
            const list = new Set(parsePages(v.pages, pages.length));
            const img = v.kind === "image" ? v.image ? await embedImage(doc, await imageForPdf(v.image.file, { maxDim: 2400 })) : null : null;
            if (v.kind === "image" && !img) throw new Error("Choose a background image");
            pages.forEach((p, i) => {
              if (!list.has(i)) return;
              const b = p.getCropBox();
              if (img) {
                const s = Math.max(b.width / img.width, b.height / img.height);
                p.drawImage(img, { x: b.x + (b.width - img.width * s) / 2, y: b.y + (b.height - img.height * s) / 2, width: img.width * s, height: img.height * s, opacity: v.opacity / 100 });
              } else p.drawRectangle({ x: b.x, y: b.y, width: b.width, height: b.height, color: hexRgb(v.color), opacity: v.opacity / 100 });
              sendBehind(p);
            });
            return doc;
          }
        }),
        "bates-numbering": {
          accept: "pdf",
          multiple: true,
          view: "files",
          action: "Add Bates numbers",
          actionIcon: "gavel",
          options: [
            { key: "prefix", type: "text", label: "Prefix", default: "ABC" },
            { key: "start", type: "number", label: "Start number", default: 1, min: 0 },
            { key: "digits", type: "number", label: "Digits", default: 6, min: 1, max: 12 },
            { key: "suffix", type: "text", label: "Suffix" },
            pos9(["tl", "tc", "tr", "bl", "bc", "br"], "br"),
            { key: "size", type: "range", label: "Font size", default: 10, min: 6, max: 20, unit: " pt" },
            { key: "color", type: "color", label: "Colour", default: "#000000" },
            { key: "box", type: "check", label: "White box behind number", default: true },
            { type: "info", html: "With several files, numbering continues from one file to the next." }
          ],
          async run(ctx) {
            const P = await PL();
            const v = ctx.values;
            let n = +v.start || 0;
            const files = [];
            for (const f of ctx.files) {
              const doc = await loadDoc(f.bytes);
              const first = n;
              for (const p of doc.getPages()) {
                const text = `${v.prefix || ""}${String(n++).padStart(+v.digits || 6, "0")}${v.suffix || ""}`;
                const { w: W, h: H } = visualSize(p);
                const tw = await measure(doc, text, v.size, "Courier");
                const { x, y } = anchorXY(v.pos, W, H, tw, v.size, 18);
                if (v.box) {
                  const q = visualToUser(p, x - 3, y - 3);
                  p.drawRectangle({ x: q.x, y: q.y, width: tw + 6, height: v.size + 4, color: P.rgb(1, 1, 1), rotate: P.degrees(q.r) });
                }
                await stampText(doc, p, text, { vx: x, vy: y + v.size * 0.15, size: v.size, font: "CourierBold", color: v.color });
              }
              files.push({ name: `${baseName(f.name)}_${v.prefix || ""}${String(first).padStart(+v.digits, "0")}-${String(n - 1).padStart(+v.digits, "0")}.pdf`, blob: await saveDoc(doc) });
            }
            return { files, message: `Numbered ${n - (+v.start || 0)} pages.` };
          }
        },
        "add-hyperlinks": {
          ...editorTool(["link"], "link", { suffix: "linked" }),
          validate: (ctx) => !ctx.state.objects?.length && !ctx.values.auto ? "Draw a link area on the page, or turn on automatic links" : null,
          options: [{ type: "info", html: "Draw a box over text or an image, then type the website address (or choose a page number) below the page." }, { key: "auto", type: "check", label: "Also link every web address and email found in the text", default: true }],
          async run(ctx) {
            const P = await PL();
            const doc = await loadDoc(ctx.files[0].bytes);
            await applyObjects(doc, ctx.state.objects || []);
            let auto = 0;
            if (ctx.values.auto) {
              const pdf = await ctx.pdf();
              const re = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+|[\w.+-]+@[\w-]+\.[\w.]+/gi;
              for (let i = 0; i < pdf.numPages; i++) {
                const { items } = await pageText(pdf, i + 1);
                const page = doc.getPage(i);
                const { h: H } = visualSize(page);
                for (const r of findInItems(items, re)) {
                  const a = visualToUser(page, r.x, H - r.y), b = visualToUser(page, r.x + r.w, H - r.y - r.h);
                  addAnnot(doc, page, doc.context.obj({ Type: "Annot", Subtype: "Link", Rect: [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(a.x, b.x), Math.max(a.y, b.y)], Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: P.PDFString.of(normalizeUrl(r.text.replace(/[.,;:]$/, ""))) } }));
                  auto++;
                }
              }
            }
            return { files: [{ name: outName(ctx, "linked"), blob: await saveDoc(doc) }], message: `${(ctx.state.objects || []).length + auto} link${(ctx.state.objects || []).length + auto === 1 ? "" : "s"} added.` };
          }
        },
        "bookmarks": {
          accept: "pdf",
          view: "thumbs",
          action: "Save bookmarks",
          actionIcon: "bookmark",
          async init(ctx) {
            ctx.values.items = await readOutline(await ctx.pdf());
            if (!ctx.values.items.length) ctx.values.items = [{ title: "Introduction", page: 1 }];
          },
          options: [
            { type: "info", html: "Each bookmark jumps to a page. Existing bookmarks are loaded below \u2014 edit, remove or add more." },
            { key: "items", type: "list", label: "Bookmarks", addLabel: "Add bookmark", fields: [{ key: "title", placeholder: "Title" }, { key: "page", type: "number", placeholder: "Page", default: 1 }] },
            { key: "open", type: "check", label: "Show bookmarks panel when opened", default: true }
          ],
          async run(ctx) {
            const P = await PL();
            const doc = await loadDoc(ctx.files[0].bytes);
            const n = doc.getPageCount();
            const items = ctx.values.items.filter((i) => String(i.title).trim()).map((i) => ({ title: i.title, page: Math.min(n, Math.max(1, +i.page || 1)) - 1 }));
            setOutline(doc, items);
            if (!ctx.values.open) doc.catalog.delete(P.PDFName.of("PageMode"));
            return { files: [{ name: outName(ctx, "bookmarked"), blob: await saveDoc(doc) }], message: `${items.length} bookmark${items.length === 1 ? "" : "s"} saved.` };
          }
        },
        "table-of-contents": {
          accept: "pdf",
          view: "thumbs",
          action: "Add table of contents",
          actionIcon: "list-tree",
          async init(ctx) {
            const pdf = await ctx.pdf();
            let items = await readOutline(pdf);
            if (!items.length) items = await detectHeadings(pdf);
            ctx.values.items = items.length ? items : [{ title: "Chapter 1", page: 1 }];
          },
          options: [
            { key: "heading", type: "text", label: "Title", default: "Table of Contents" },
            { type: "info", html: "Entries were filled in from bookmarks or detected headings. Edit them as you like. Page numbers refer to the original document." },
            { key: "items", type: "list", label: "Entries", addLabel: "Add entry", fields: [{ key: "title", placeholder: "Title" }, { key: "page", type: "number", placeholder: "Page", default: 1 }] },
            { key: "bookmarks", type: "check", label: "Also add these as bookmarks", default: true }
          ],
          async run(ctx) {
            const P = await PL();
            const doc = await loadDoc(ctx.files[0].bytes);
            const items = ctx.values.items.filter((i) => String(i.title).trim());
            if (!items.length) throw new Error("Add at least one entry");
            const first = doc.getPage(0);
            const W = first.getWidth(), H = first.getHeight();
            const m = 60, lh = 22, perPage = Math.floor((H - 2 * m - 60) / lh);
            const tocPages = Math.ceil(items.length / perPage);
            const font = await getFont(doc, "Helvetica"), bold = await getFont(doc, "HelveticaBold");
            const created = [];
            for (let t2 = 0; t2 < tocPages; t2++) created.push(doc.insertPage(t2, [W, H]));
            for (let t2 = 0; t2 < tocPages; t2++) {
              const p = created[t2];
              let y = H - m;
              if (t2 === 0) {
                await stampText(doc, p, ctx.values.heading || "Contents", { vx: m, vy: y - 24, size: 24, font: "HelveticaBold", color: "#111827" });
                y -= 60;
              }
              for (const it of items.slice(t2 * perPage, (t2 + 1) * perPage)) {
                const pg = String((+it.page || 1) + tocPages);
                const pw = bold.widthOfTextAtSize(pg, 12);
                let title = String(it.title);
                const tw = await measure(doc, title, 12);
                const maxT = W - 2 * m - pw - 30;
                if (tw > maxT && canEncode(font, title)) {
                  while (title.length > 3 && font.widthOfTextAtSize(title + "\u2026", 12) > maxT) title = title.slice(0, -1);
                  title += "\u2026";
                }
                await stampText(doc, p, title, { vx: m, vy: y, size: 12 });
                const tEnd = m + Math.min(tw, maxT) + 6;
                const dots = ".".repeat(Math.max(0, Math.floor((W - m - pw - 6 - tEnd) / font.widthOfTextAtSize(".", 12))));
                p.drawText(dots, { x: tEnd, y, size: 12, font, color: P.rgb(0.6, 0.6, 0.6) });
                p.drawText(pg, { x: W - m - pw, y, size: 12, font: bold });
                const target = doc.getPage(Math.min(doc.getPageCount() - 1, (+it.page || 1) - 1 + tocPages));
                addAnnot(doc, p, doc.context.obj({ Type: "Annot", Subtype: "Link", Rect: [m, y - 5, W - m, y + 14], Border: [0, 0, 0], Dest: [target.ref, "Fit"] }));
                y -= lh;
              }
            }
            if (ctx.values.bookmarks) setOutline(doc, [{ title: ctx.values.heading || "Contents", page: 0 }, ...items.map((i) => ({ title: i.title, page: (+i.page || 1) - 1 + tocPages }))]);
            return { files: [{ name: outName(ctx, "with-toc"), blob: await saveDoc(doc) }], message: `Added ${tocPages} contents page${tocPages > 1 ? "s" : ""} with ${items.length} clickable entries.` };
          }
        },
        "edit-metadata": {
          accept: "pdf",
          view: "none",
          action: "Save metadata",
          actionIcon: "save",
          async init(ctx) {
            const doc = await loadDoc(ctx.files[0].bytes, { updateMetadata: false });
            Object.assign(ctx.values, { title: doc.getTitle() || "", author: doc.getAuthor() || "", subject: doc.getSubject() || "", keywords: doc.getKeywords() || "", creator: doc.getCreator() || "", producer: doc.getProducer() || "", lang: String(doc.catalog.get(window.PDFLib.PDFName.of("Lang")) || "").replace(/^\(|\)$/g, "") });
          },
          options: [
            { key: "title", type: "text", label: "Title" },
            { key: "author", type: "text", label: "Author" },
            { key: "subject", type: "text", label: "Subject" },
            { key: "keywords", type: "text", label: "Keywords", hint: "Separate with commas." },
            { key: "creator", type: "text", label: "Creator (app)" },
            { key: "producer", type: "text", label: "Producer" },
            { key: "lang", type: "text", label: "Language", placeholder: "e.g. en-IN, hi-IN" },
            { key: "showTitle", type: "check", label: "Show title instead of file name in viewers", default: true }
          ],
          async run(ctx) {
            const P = await PL();
            const v = ctx.values;
            const doc = await loadDoc(ctx.files[0].bytes, { updateMetadata: false });
            doc.setTitle(v.title || "", { showInWindowTitleBar: !!v.showTitle });
            doc.setAuthor(v.author || "");
            doc.setSubject(v.subject || "");
            doc.setKeywords(String(v.keywords || "").split(",").map((s) => s.trim()).filter(Boolean));
            doc.setCreator(v.creator || "");
            doc.setProducer(v.producer || "");
            doc.setModificationDate(/* @__PURE__ */ new Date());
            if (v.lang) doc.setLanguage(v.lang);
            return { files: [{ name: outName(ctx, ""), blob: await saveDoc(doc) }], message: "Metadata updated." };
          }
        },
        "dark-mode-pdf": {
          accept: "pdf",
          view: "thumbs",
          action: "Convert",
          actionIcon: "moon",
          options: [
            { key: "theme", type: "cards", label: "Theme", default: "dark", options: [["dark", "Dark", "black background"], ["dim", "Dim", "dark grey, softer"], ["sepia", "Sepia", "warm paper"], ["night", "Night", "amber text"]] },
            { key: "dpi", type: "select", label: "Quality", default: "150", options: [["110", "Smaller file"], ["150", "Good"], ["220", "High"]] },
            { type: "info", html: "Photos keep their natural colours. Pages become images, so text isn\u2019t selectable afterwards." }
          ],
          async run(ctx) {
            const pdf = await ctx.pdf();
            const doc = await rasterizeToPdf(pdf, { dpi: +ctx.values.dpi, quality: 0.82, onProgress: ctx.progress, transform: (c) => themeCanvas(c, ctx.values.theme) });
            return { files: [{ name: outName(ctx, ctx.values.theme), blob: await saveDoc(doc) }] };
          }
        },
        "find-replace": {
          accept: "pdf",
          view: "thumbs",
          action: "Replace text",
          actionIcon: "replace",
          options: [
            { key: "find", type: "text", label: "Find", placeholder: "Text to find" },
            { key: "replace", type: "text", label: "Replace with", placeholder: "New text (leave empty to erase)" },
            { key: "case", type: "check", label: "Match case" },
            { key: "word", type: "check", label: "Whole words only" },
            { key: "color", type: "color", label: "New text colour", default: "#000000" },
            { type: "info", html: 'The old text is covered with a white box and the new text is written on top. For true editing of original text, use <a href="#/full-text-edit">Edit Existing Text</a>.' }
          ],
          validate: (ctx) => !String(ctx.values.find || "").trim() ? "Enter the text to find" : null,
          async run(ctx) {
            const P = await PL();
            const pdf = await ctx.pdf();
            const doc = await loadDoc(ctx.files[0].bytes);
            const v = ctx.values;
            const esc_ = v.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const re = new RegExp(v.word ? `\\b${esc_}\\b` : esc_, v.case ? "g" : "gi");
            let count = 0;
            for (let i = 0; i < pdf.numPages; i++) {
              ctx.progress(i / pdf.numPages, `Searching page ${i + 1}`);
              const { items } = await pageText(pdf, i + 1);
              const page = doc.getPage(i);
              const { h: H } = visualSize(page);
              for (const r of findInItems(items, re)) {
                const q = visualToUser(page, r.x - 0.5, H - r.y - r.h);
                page.drawRectangle({ x: q.x, y: q.y, width: r.w + 1, height: r.h, color: P.rgb(1, 1, 1), rotate: P.degrees(q.r) });
                if (v.replace) await stampText(doc, page, v.replace, { vx: r.x, vy: H - (r.y + r.size * 0.95), size: r.size * 0.95, color: v.color });
                count++;
              }
            }
            if (!count) throw new Error(`\u201C${v.find}\u201D was not found in this PDF.`);
            return { files: [{ name: outName(ctx, "replaced"), blob: await saveDoc(doc) }], message: `Replaced ${count} match${count > 1 ? "es" : ""}.` };
          }
        }
      };
      latin1 = (b) => {
        let s = "";
        for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
        return s;
      };
      toBytes = (s) => {
        const b = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255;
        return b;
      };
    }
  });

  // js/tools/security.js
  var security_exports = {};
  __export(security_exports, {
    PATTERNS: () => PATTERNS,
    default: () => security_default,
    redactPages: () => redactPages,
    sanitize: () => sanitize
  });
  async function redactPages(doc, pdf, boxesByPage, { dpi = 200, color = "#000000", onProgress } = {}) {
    const { PDFDocument } = await PL();
    const out = await PDFDocument.create();
    const n = doc.getPageCount();
    for (let i = 0; i < n; i++) {
      const boxes = boxesByPage[i];
      if (!boxes?.length) {
        out.addPage((await out.copyPages(doc, [i]))[0]);
        continue;
      }
      onProgress?.(i / n, `Redacting page ${i + 1}`);
      const c = await renderPage(pdf, i + 1, { dpi, annotations: true });
      const x = c.getContext("2d");
      x.fillStyle = color;
      for (const b of boxes) x.fillRect(b.x * c.width - 1, b.y * c.height - 1, b.w * c.width + 2, b.h * c.height + 2);
      const img = await out.embedJpg(await canvasBytes(c, "image/jpeg", 0.9));
      const p = out.addPage([c.pdfSize.w, c.pdfSize.h]);
      p.drawImage(img, { x: 0, y: 0, width: c.pdfSize.w, height: c.pdfSize.h });
    }
    return out;
  }
  async function findBoxes(pdf, regexes, onProgress) {
    const byPage = {};
    const found = [];
    for (let i = 0; i < pdf.numPages; i++) {
      onProgress?.(i / pdf.numPages * 0.5, `Scanning page ${i + 1}`);
      const { items, width, height } = await pageText(pdf, i + 1);
      for (const [label, re] of regexes) for (const r of findInItems(items, re)) {
        (byPage[i] || (byPage[i] = [])).push({ x: r.x / width, y: r.y / height, w: r.w / width, h: r.h / height });
        found.push({ page: i + 1, type: label, text: r.text });
      }
    }
    return { byPage, found };
  }
  async function sanitize(doc, v) {
    const P = await PL();
    const N = (n) => P.PDFName.of(n);
    const ctx = doc.context;
    if (v.forms) {
      try {
        doc.getForm().flatten();
      } catch {
      }
    }
    if (v.info) {
      ctx.trailerInfo.Info = void 0;
    }
    if (v.xmp) doc.catalog.delete(N("Metadata"));
    if (v.js) {
      doc.catalog.delete(N("OpenAction"));
      doc.catalog.delete(N("AA"));
      const names = doc.catalog.lookup(N("Names"));
      if (names instanceof P.PDFDict) names.delete(N("JavaScript"));
    }
    if (v.files) {
      const names = doc.catalog.lookup(N("Names"));
      if (names instanceof P.PDFDict) names.delete(N("EmbeddedFiles"));
      doc.catalog.delete(N("AF"));
    }
    for (const p of doc.getPages()) {
      if (v.js) p.node.delete(N("AA"));
      if (v.thumbs) {
        p.node.delete(N("Thumb"));
        p.node.delete(N("PieceInfo"));
      }
      const annots = p.node.lookup(N("Annots"));
      if (annots instanceof P.PDFArray) {
        for (let i = annots.size() - 1; i >= 0; i--) {
          const a = annots.lookup(i);
          const st = String(a?.get?.(N("Subtype")));
          if (v.annots && st !== "/Link" && st !== "/Widget" || v.files && st === "/FileAttachment") annots.remove(i);
          else if (v.js && a?.get?.(N("A"))) {
            const act = a.lookup(N("A"));
            if (String(act?.get?.(N("S"))) === "/JavaScript") a.delete(N("A"));
          }
        }
      }
    }
    if (v.thumbs) doc.catalog.delete(N("PieceInfo"));
    garbageCollect(doc);
    return doc;
  }
  var permOpts, perms, randomPw, PATTERNS, security_default;
  var init_security = __esm({
    "js/tools/security.js"() {
      init_pdf();
      init_ui();
      init_common();
      init_optimize();
      permOpts = [
        { key: "print", type: "select", label: "Printing", default: "high", options: [["high", "Allowed"], ["low", "Low quality only"], ["none", "Not allowed"]] },
        { key: "copy", type: "check", label: "Allow copying text & images", default: true },
        { key: "modify", type: "check", label: "Allow editing", default: false },
        { key: "annotate", type: "check", label: "Allow comments", default: true },
        { key: "forms", type: "check", label: "Allow filling forms", default: true },
        { key: "assemble", type: "check", label: "Allow adding / removing pages", default: false }
      ];
      perms = (v) => ({ printing: v.print === "none" ? false : v.print === "low" ? "lowResolution" : "highResolution", copying: !!v.copy, modifying: !!v.modify, annotating: !!v.annotate, fillingForms: !!v.forms, documentAssembly: !!v.assemble, contentAccessibility: true });
      randomPw = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(36).padStart(2, "0")).join("");
      PATTERNS = {
        email: ["Email addresses", /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g],
        phone: ["Phone numbers", /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,5}\b/g],
        aadhaar: ["Aadhaar numbers", /\b\d{4}\s?\d{4}\s?\d{4}\b/g],
        pan: ["PAN numbers", /\b[A-Z]{5}\d{4}[A-Z]\b/g],
        card: ["Card numbers", /\b(?:\d[ -]?){13,19}\b/g],
        ifsc: ["IFSC / bank codes", /\b[A-Z]{4}0[A-Z0-9]{6}\b/g],
        date: ["Dates", /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g],
        url: ["Web links", /\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+/g]
      };
      security_default = {
        "protect-pdf": single({
          view: "none",
          action: "Protect PDF",
          actionIcon: "lock",
          suffix: "protected",
          options: [
            { key: "pw", type: "password", label: "Password" },
            { key: "pw2", type: "password", label: "Repeat password" },
            { key: "adv", type: "check", label: "Advanced: restrict printing / copying" },
            ...permOpts.map((o) => ({ ...o, show: (v) => v.adv })),
            { key: "algo", type: "select", label: "Encryption", default: "AES-256", options: [["AES-256", "AES-256 (strongest, recommended)"], ["AES-128", "AES-128 (older readers)"]], show: (v) => v.adv },
            { type: "info", html: "Keep your password safe \u2014 nobody (including us) can recover it." }
          ],
          validate: (ctx) => !ctx.values.pw ? "Enter a password" : ctx.values.pw !== ctx.values.pw2 ? "Passwords don\u2019t match" : null,
          async apply(bytes, v) {
            if (!v.pw) throw new Error("Enter a password");
            const doc = await loadDoc(bytes);
            doc.encrypt({ userPassword: v.pw, ownerPassword: v.adv ? randomPw() : v.pw, permissions: v.adv ? perms(v) : perms({ print: "high", copy: true, modify: true, annotate: true, forms: true, assemble: true }), algorithm: v.algo || "AES-256" });
            return doc;
          }
        }),
        "unlock-pdf": {
          accept: "pdf",
          view: "none",
          action: "Unlock PDF",
          actionIcon: "lock-open",
          options: [{ type: "info", html: "If the PDF needs a password to open, you were asked for it when you chose the file. Printing, copying and editing restrictions are removed too. Only unlock files you own or are allowed to use." }],
          async run(ctx) {
            const f = ctx.files[0];
            if (!f.encrypted) toast("This PDF wasn\u2019t password protected \u2014 saved a clean copy anyway.", "info");
            const doc = await loadDoc(f.bytes);
            return { files: [{ name: outName(ctx, "unlocked"), blob: await saveDoc(doc) }], message: f.encrypted ? "Password and restrictions removed." : "No password was found." };
          }
        },
        "pdf-permissions": single({
          view: "none",
          action: "Apply permissions",
          actionIcon: "shield-check",
          suffix: "restricted",
          options: [
            { type: "info", html: "Anyone can open the file, but only the actions you allow will work in readers that respect permissions (Adobe, Chrome, Edge\u2026)." },
            ...permOpts,
            { key: "owner", type: "password", label: "Permissions password", hint: "Needed to change these settings later. Leave empty for a random one." }
          ],
          async apply(bytes, v) {
            const doc = await loadDoc(bytes);
            doc.encrypt({ userPassword: "", ownerPassword: v.owner || randomPw(), permissions: perms(v) });
            return doc;
          }
        }),
        "redact-pdf": {
          accept: "pdf",
          view: "editor",
          editorTools: ["redact"],
          editorDefault: "redact",
          action: "Redact & save",
          actionIcon: "square",
          editorHint: (t2) => t2 === "redact" ? "Drag over anything you want to black out. Tap once for a default box." : null,
          options: (ctx) => [
            { type: "custom", label: "Find & mark text", render(box) {
              const input = h("input.option-input", { type: "text", placeholder: "e.g. a name or account number" });
              const go = async () => {
                const q = input.value.trim();
                if (!q) return;
                const pdf = await ctx.pdf();
                let n = 0;
                for (let i = 0; i < pdf.numPages; i++) {
                  const { items, width, height } = await pageText(pdf, i + 1);
                  for (const r of findInItems(items, q)) {
                    ctx.state.objects.push({ id: Date.now() + n, type: "redact", page: i, x: r.x / width, y: r.y / height, w: r.w / width, h: r.h / height });
                    n++;
                  }
                }
                ctx.editor?.changed();
                toast(n ? `Marked ${n} match${n > 1 ? "es" : ""}` : "No matches found", n ? "success" : "info");
              };
              input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") go();
              });
              box.append(h("div", { style: { display: "flex", gap: ".4rem" } }, input, h("button.btn.btn-ghost", { type: "button", on: { click: go } }, ic("search"), "Mark")));
            } },
            { key: "color", type: "seg", label: "Box colour", default: "#000000", options: [["#000000", "Black"], ["#ffffff", "White"]] },
            { key: "meta", type: "check", label: "Also remove metadata & hidden data", default: true },
            { type: "info", html: "Redacted pages are flattened into images, so the hidden text is <b>permanently removed</b> \u2014 not just covered." }
          ],
          validate: (ctx) => !ctx.state.objects?.length ? "Mark at least one area to redact" : null,
          async run(ctx) {
            var _a;
            const doc = await loadDoc(ctx.files[0].bytes);
            const pdf = await ctx.pdf();
            const byPage = {};
            for (const o of ctx.state.objects) (byPage[_a = o.page] || (byPage[_a] = [])).push({ x: o.x, y: o.y, w: o.w, h: o.h });
            const out = await redactPages(doc, pdf, byPage, { color: ctx.values.color, onProgress: ctx.progress });
            if (ctx.values.meta) await sanitize(out, { info: true, xmp: true });
            return { files: [{ name: outName(ctx, "redacted"), blob: await saveDoc(out) }], message: `${ctx.state.objects.length} area${ctx.state.objects.length > 1 ? "s" : ""} permanently redacted on ${Object.keys(byPage).length} page${Object.keys(byPage).length > 1 ? "s" : ""}.` };
          }
        },
        "auto-redact": {
          accept: "pdf",
          view: "thumbs",
          action: "Find & redact",
          actionIcon: "scan-eye",
          options: [
            { type: "heading", label: "What to redact" },
            ...Object.entries(PATTERNS).map(([k, [label]]) => ({ key: "p_" + k, type: "check", label, default: ["email", "phone", "aadhaar", "pan", "card"].includes(k) })),
            { key: "words", type: "text", label: "Also these words or names", placeholder: "e.g. Rahul Sharma, Account 1234", hint: "Separate with commas." },
            { key: "regex", type: "text", label: "Custom pattern (regex, advanced)", placeholder: "e.g. INV-\\d+" },
            { key: "color", type: "seg", label: "Box colour", default: "#000000", options: [["#000000", "Black"], ["#ffffff", "White"]] }
          ],
          async run(ctx) {
            const v = ctx.values;
            const regexes = Object.entries(PATTERNS).filter(([k]) => v["p_" + k]).map(([, [l, re]]) => [l, re]);
            String(v.words || "").split(",").map((s) => s.trim()).filter(Boolean).forEach((w) => regexes.push(["Custom word", new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")]));
            if (v.regex) {
              try {
                regexes.push(["Custom pattern", new RegExp(v.regex, "g")]);
              } catch {
                throw new Error("The custom pattern is not a valid regular expression.");
              }
            }
            if (!regexes.length) throw new Error("Choose at least one thing to redact");
            const pdf = await ctx.pdf();
            const { byPage, found } = await findBoxes(pdf, regexes, ctx.progress);
            if (!found.length) throw new Error("Nothing matching was found. (Scanned PDFs need OCR first.)");
            const doc = await loadDoc(ctx.files[0].bytes);
            const out = await redactPages(doc, pdf, byPage, { color: v.color, onProgress: (p) => ctx.progress(0.5 + p / 2, "Redacting\u2026") });
            await sanitize(out, { info: true, xmp: true });
            const table2 = h("div.report-wrap", h("table.report", h("thead", h("tr", h("th", "Page"), h("th", "Type"), h("th", "Redacted text"))), h("tbody", found.slice(0, 300).map((f) => h("tr", h("td", `${f.page}`), h("td", esc(f.type)), h("td", esc(f.text.length > 4 ? f.text.slice(0, 2) + "\u2022\u2022\u2022" + f.text.slice(-2) : "\u2022\u2022\u2022")))))));
            return { files: [{ name: outName(ctx, "redacted"), blob: await saveDoc(out) }], message: `${found.length} item${found.length > 1 ? "s" : ""} redacted on ${Object.keys(byPage).length} page${Object.keys(byPage).length > 1 ? "s" : ""}. Please review the result.`, html: table2 };
          }
        },
        "remove-metadata": single({
          view: "none",
          action: "Sanitize PDF",
          actionIcon: "shield-off",
          suffix: "sanitized",
          options: [
            { key: "info", type: "check", label: "Document info (title, author, dates, software)", default: true },
            { key: "xmp", type: "check", label: "XMP metadata", default: true },
            { key: "js", type: "check", label: "JavaScript & auto-actions", default: true },
            { key: "files", type: "check", label: "Embedded files / attachments", default: true },
            { key: "annots", type: "check", label: "Comments & annotations" },
            { key: "forms", type: "check", label: "Form fields (flatten them)" },
            { key: "thumbs", type: "check", label: "Page thumbnails & private app data", default: true }
          ],
          async apply(bytes, v) {
            const doc = await loadDoc(bytes);
            await sanitize(doc, v);
            return doc;
          }
        })
      };
    }
  });

  // js/core/htmlpdf.js
  async function htmlToPdf(html, { pageSize: pageSize2 = [595.28, 841.89], margin = 40, css = "", onProgress, quality = 0.92, scale = 2 } = {}) {
    const html2canvas = await lib("html2canvas");
    const { PDFDocument } = await PL();
    const [W, H] = pageSize2;
    const pxW = Math.round((W - 2 * margin) * PX), pxH = Math.floor((H - 2 * margin) * PX);
    const frame = h("iframe", { sandbox: "allow-same-origin", "aria-hidden": "true", style: { position: "fixed", left: "-12000px", top: "0", width: pxW + "px", height: "200px", border: "0", background: "#fff" } });
    document.body.appendChild(frame);
    try {
      const d = frame.contentDocument;
      d.open();
      d.write(`<!doctype html><html><head><meta charset="utf-8"><style>
      html,body{margin:0;padding:0;background:#fff;color:#111;font:14px/1.55 -apple-system,"Segoe UI",Roboto,"Noto Sans","Noto Sans Devanagari","Noto Sans Gurmukhi","Nirmala UI",Arial,sans-serif;word-wrap:break-word;overflow-wrap:anywhere}
      img,svg,video{max-width:100%;height:auto} pre{white-space:pre-wrap} table{border-collapse:collapse;max-width:100%}
      ${css}</style></head><body>${html}</body></html>`);
      d.close();
      await Promise.race([Promise.all([...d.images].map((i) => i.complete ? 0 : new Promise((r) => {
        i.onload = i.onerror = r;
      }))), new Promise((r) => setTimeout(r, 4e3))]);
      await d.fonts?.ready;
      await nextFrame();
      const total = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight, 1);
      frame.style.height = total + "px";
      await nextFrame();
      const tops = [], bottoms = [];
      const walker = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
      const range = d.createRange();
      for (let n; n = walker.nextNode(); ) {
        if (!n.textContent.trim()) continue;
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
          tops.push(r.top);
          bottoms.push(r.bottom);
        }
      }
      d.querySelectorAll("img,svg,tr,hr,li,canvas").forEach((e) => {
        const r = e.getBoundingClientRect();
        tops.push(r.top);
        bottoms.push(r.bottom);
      });
      const cands = [...new Set(bottoms.map((b) => Math.ceil(b)))].sort((a, b) => a - b);
      const cuts = (y2) => tops.some((t2, i) => t2 < y2 - 1 && bottoms[i] > y2 + 1);
      const breaks = [0];
      let y = 0;
      while (y + pxH < total) {
        const limit2 = y + pxH;
        let best = 0;
        for (const c of cands) {
          if (c > limit2) break;
          if (c > y + pxH * 0.5 && !cuts(c)) best = c;
        }
        y = best || limit2;
        breaks.push(y);
      }
      breaks.push(total);
      const out = await PDFDocument.create();
      const pages = breaks.length - 1;
      for (let i = 0; i < pages; i++) {
        onProgress?.(i / pages, `Rendering page ${i + 1} of ${pages}`);
        const top = breaks[i], hgt = Math.max(1, breaks[i + 1] - top);
        const canvas = await html2canvas(d.body, { scale, backgroundColor: "#ffffff", logging: false, useCORS: true, x: 0, y: top, width: pxW, height: hgt, windowWidth: pxW, windowHeight: Math.min(total, 2e4), scrollX: 0, scrollY: 0 });
        const img = await out.embedJpg(await canvasBytes(canvas, "image/jpeg", quality));
        const p = out.addPage([W, H]);
        p.drawImage(img, { x: margin, y: H - margin - hgt / PX, width: pxW / PX, height: hgt / PX });
      }
      return out;
    } finally {
      frame.remove();
    }
  }
  async function textLayout(text, { font = "Helvetica", size = 11, pageSize: pageSize2 = [595.28, 841.89], margin = 50, lineNumbers = false, lineHeight = 1.35, color = "#111111", header: header2 = "" } = {}) {
    const { PDFDocument, rgb } = await PL();
    const doc = await PDFDocument.create();
    const f = await getFont(doc, font);
    text = String(text).replace(/\r\n?/g, "\n").replace(/\t/g, "    ");
    if (!canEncode(f, text.replace(/\n/g, ""))) return null;
    const [W, H] = pageSize2;
    const lh = size * lineHeight;
    const srcLines = text.split("\n");
    const numW = lineNumbers ? f.widthOfTextAtSize(String(srcLines.length), size * 0.85) + 12 : 0;
    const maxW = W - 2 * margin - numW;
    const wrapLine = (ln) => {
      if (!ln) return [""];
      const out = [];
      let cur = "";
      for (let tok of ln.split(/(\s+)/).filter(Boolean)) {
        if (f.widthOfTextAtSize(cur + tok, size) <= maxW) {
          cur += tok;
          continue;
        }
        if (/^\s+$/.test(tok)) {
          out.push(cur);
          cur = "";
          continue;
        }
        if (cur) {
          out.push(cur.replace(/\s+$/, ""));
          cur = "";
        }
        while (f.widthOfTextAtSize(tok, size) > maxW) {
          let k = tok.length;
          while (k > 1 && f.widthOfTextAtSize(tok.slice(0, k), size) > maxW) k--;
          out.push(tok.slice(0, k));
          tok = tok.slice(k);
        }
        cur = tok;
      }
      out.push(cur);
      return out;
    };
    let page, y;
    const col = hexRgb(color);
    const newPage = () => {
      page = doc.addPage([W, H]);
      y = H - margin - size;
      if (header2) {
        page.drawText(header2, { x: margin, y: H - margin / 2 - 4, size: 8, font: f, color: rgb(0.45, 0.45, 0.45) });
      }
    };
    newPage();
    srcLines.forEach((ln, i) => {
      wrapLine(ln).forEach((part, k) => {
        if (y < margin) newPage();
        if (lineNumbers && k === 0) page.drawText(String(i + 1).padStart(String(srcLines.length).length, " "), { x: margin, y, size: size * 0.85, font: f, color: rgb(0.6, 0.6, 0.6) });
        if (part) page.drawText(part, { x: margin + numW, y, size, font: f, color: col });
        y -= lh;
      });
    });
    const n = doc.getPageCount();
    if (n > 1) doc.getPages().forEach((p, i) => {
      const s = `${i + 1} / ${n}`;
      p.drawText(s, { x: W - margin - f.widthOfTextAtSize(s, 8), y: margin / 2, size: 8, font: f, color: rgb(0.55, 0.55, 0.55) });
    });
    return doc;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  }
  function parseCSV(text, delim) {
    text = text.replace(/^﻿/, "");
    if (!delim) {
      const first = text.split("\n")[0];
      delim = [",", ";", "	", "|"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    }
    const rows = [];
    let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            cell += '"';
            i++;
          } else q = false;
        } else cell += c;
        continue;
      }
      if (c === '"') q = true;
      else if (c === delim) {
        row.push(cell);
        cell = "";
      } else if (c === "\n") {
        row.push(cell.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        cell = "";
      } else cell += c;
    }
    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c.trim()));
  }
  function toCSV(rows) {
    return rows.map((r) => r.map((c) => /[",\n;]/.test(c) ? `"${String(c).replace(/"/g, '""')}"` : c).join(",")).join("\n");
  }
  var PX;
  var init_htmlpdf = __esm({
    "js/core/htmlpdf.js"() {
      init_lib();
      init_pdf();
      init_ui();
      PX = 96 / 72;
    }
  });

  // js/tools/convert-from.js
  var convert_from_exports = {};
  __export(convert_from_exports, {
    bodySize: () => bodySize,
    default: () => convert_from_default,
    grayscale: () => grayscale,
    paragraphs: () => paragraphs,
    tableHtml: () => tableHtml,
    tablesFromLines: () => tablesFromLines,
    tablesRun: () => tablesRun,
    textResultView: () => textResultView
  });
  function imageTool(fmt2, mime, ext, { quality = true, multiTiff = false } = {}) {
    return {
      accept: "pdf",
      view: "thumbs",
      action: `Convert to ${fmt2}`,
      actionIcon: "image-down",
      options: [
        dpiOpt,
        ...quality ? [{ key: "quality", type: "range", label: "Image quality", default: 85, min: 40, max: 100, unit: "%" }] : [],
        rangeOpt,
        ...multiTiff ? [{ key: "multi", type: "check", label: "One multi-page TIFF file", default: true }] : [],
        { key: "bg", type: "check", label: "Transparent background", show: () => ext === "png" || ext === "webp" }
      ],
      async run(ctx) {
        const pdf = await ctx.pdf();
        const v = ctx.values;
        const pages = parsePages(v.pages, pdf.numPages);
        const files = [];
        const tiffPages = [];
        for (let k = 0; k < pages.length; k++) {
          const i = pages[k];
          ctx.progress(k / pages.length, `Converting page ${i + 1}`);
          const c = await renderPage(pdf, i + 1, { dpi: +v.dpi, bg: v.bg ? null : "#ffffff" });
          let blob;
          if (ext === "bmp") blob = encodeBMP(c);
          else if (ext === "tif") {
            if (v.multi) {
              tiffPages.push(rgbOf(c));
              continue;
            }
            blob = await encodeTIFF([rgbOf(c)]);
          } else blob = await canvasBlob(c, mime, (+v.quality || 90) / 100);
          files.push({ name: outName(ctx, `page-${String(i + 1).padStart(String(pdf.numPages).length, "0")}`, ext), blob });
          c.width = c.height = 0;
          await nextFrame();
        }
        if (tiffPages.length) files.push({ name: outName(ctx, "", "tif"), blob: await encodeTIFF(tiffPages) });
        return { files, zipName: outName(ctx, ext, "zip"), message: `${pages.length} page${pages.length > 1 ? "s" : ""} converted to ${fmt2}.`, html: gallery(files) };
      }
    };
  }
  function gallery(files) {
    const imgs = files.filter((f) => /^image\/(jpeg|png|webp)/.test(f.blob.type)).slice(0, 24);
    if (!imgs.length) return null;
    return h("div.gallery", imgs.map((f) => {
      const u = URL.createObjectURL(f.blob);
      return h("a", { href: u, download: f.name }, h("img", { src: u, alt: f.name, loading: "lazy" }), esc(f.name));
    }));
  }
  function rgbOf(c) {
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    const rgb = new Uint8Array(c.width * c.height * 3);
    for (let i = 0, j = 0; i < d.length; i += 4) {
      rgb[j++] = d[i];
      rgb[j++] = d[i + 1];
      rgb[j++] = d[i + 2];
    }
    return { rgb, w: c.width, h: c.height };
  }
  async function encodeTIFF(pages) {
    const UTIF = await lib("utif");
    const ifd = (p, off2) => ({ t256: [p.w], t257: [p.h], t258: [8, 8, 8], t259: [1], t262: [2], t273: [off2], t277: [3], t278: [p.h], t279: [p.rgb.length], t282: [150], t283: [150], t284: [1], t296: [2] });
    const head = new Uint8Array(UTIF.encode(pages.map((p) => ifd(p, 0))));
    let off = head.length;
    const ifds = pages.map((p) => {
      const d = ifd(p, off);
      off += p.rgb.length;
      return d;
    });
    const prefix = new Uint8Array(UTIF.encode(ifds));
    return new Blob([prefix, ...pages.map((p) => p.rgb)], { type: "image/tiff" });
  }
  function encodeBMP(c) {
    const w = c.width, hh = c.height, d = c.getContext("2d").getImageData(0, 0, w, hh).data;
    const row = Math.ceil(w * 3 / 4) * 4, size = 54 + row * hh;
    const b = new ArrayBuffer(size);
    const v = new DataView(b);
    v.setUint16(0, 16973);
    v.setUint32(2, size, true);
    v.setUint32(10, 54, true);
    v.setUint32(14, 40, true);
    v.setInt32(18, w, true);
    v.setInt32(22, hh, true);
    v.setUint16(26, 1, true);
    v.setUint16(28, 24, true);
    v.setUint32(34, row * hh, true);
    v.setInt32(38, 3780, true);
    v.setInt32(42, 3780, true);
    const u = new Uint8Array(b);
    for (let y = 0; y < hh; y++) {
      let o = 54 + (hh - 1 - y) * row;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        u[o++] = d[i + 2];
        u[o++] = d[i + 1];
        u[o++] = d[i];
      }
    }
    return new Blob([b], { type: "image/bmp" });
  }
  function bodySize(pages) {
    const count = {};
    for (const p of pages) for (const l of p.lines) {
      const s = Math.round(l.size);
      count[s] = (count[s] || 0) + l.text.length;
    }
    return +Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 11;
  }
  function paragraphs(lines, body) {
    const out = [];
    let cur = null;
    for (const l of lines) {
      const big = l.size >= body * 1.12;
      const bullet = /^\s*([•●▪◦‣∙·\-*–]|\d{1,2}[.)])\s+/.test(l.text);
      if (cur && !big && !cur.big && !bullet && l.y - cur.lastY < l.size * 1.75 && Math.abs(l.size - cur.size) < 1) {
        cur.text += (cur.text.endsWith("-") ? "" : " ") + l.text.trim();
        cur.text = cur.text.replace(/-\s(?=[a-z])/g, "");
        cur.lastY = l.y;
        continue;
      }
      cur = { text: l.text.trim(), size: l.size, big, bullet, lastY: l.y };
      out.push(cur);
    }
    return out.filter((p) => p.text);
  }
  function headingLevel(size, body) {
    return size >= body * 1.6 ? 1 : size >= body * 1.3 ? 2 : size >= body * 1.12 ? 3 : 0;
  }
  function tablesFromLines(lines) {
    const cellsOf = (l) => {
      const cells = [];
      let cur = null;
      for (const it of l.items) {
        if (!it.str.trim()) continue;
        if (cur && it.x - cur.x2 < it.size * 0.9) {
          cur.text += (it.x - cur.x2 > it.size * 0.15 ? " " : "") + it.str;
          cur.x2 = it.x + it.w;
        } else {
          cur = { x: it.x, x2: it.x + it.w, text: it.str };
          cells.push(cur);
        }
      }
      return cells.map((c) => ({ ...c, text: c.text.trim() }));
    };
    const tables = [];
    let block = [];
    const flush = () => {
      if (block.length >= 2) tables.push(block);
      block = [];
    };
    for (const l of lines) {
      const c = cellsOf(l);
      if (c.length >= 2) block.push(c);
      else flush();
    }
    flush();
    return tables.map((rows) => {
      const xs = rows.flat().map((c) => c.x).sort((a, b) => a - b);
      const anchors = [];
      for (const x of xs) if (!anchors.length || x - anchors[anchors.length - 1] > 14) anchors.push(x);
      return rows.map((cells) => {
        const r = Array(anchors.length).fill("");
        for (const c of cells) {
          let k = 0;
          for (let j = 0; j < anchors.length; j++) if (anchors[j] <= c.x + 14) k = j;
          r[k] = r[k] ? r[k] + " " + c.text : c.text;
        }
        return r;
      });
    });
  }
  function tableHtml(rows) {
    return `<table class="report"><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }
  function textResultView(text, rows = 16) {
    const ta = h("textarea.out-text", { readonly: true, rows, "aria-label": "Result" }, esc(text));
    return h("div", h("div", { style: { display: "flex", gap: ".5rem", marginBottom: ".5rem", justifyContent: "flex-end" } }, h("button.mini-btn", { type: "button", on: { click: async () => {
      try {
        await navigator.clipboard.writeText(text);
        toast("Copied to clipboard", "success");
      } catch {
        ta.select();
        document.execCommand("copy");
        toast("Copied", "success");
      }
    } } }, ic("copy"), "Copy all")), ta);
  }
  async function readPages(ctx) {
    const pdf = await ctx.pdf();
    const idx = parsePages(ctx.values.pages, pdf.numPages);
    const all = [];
    for (const i of idx) {
      ctx.progress(all.length / idx.length, `Reading page ${i + 1}`);
      const t2 = await pageText(pdf, i + 1);
      const lines = toLines(t2.items);
      all.push({ num: i + 1, width: t2.width, height: t2.height, lines, text: lines.map((l) => l.text).join("\n") });
    }
    return all;
  }
  function grayscale(c, bw) {
    const x = c.getContext("2d");
    const d = x.getImageData(0, 0, c.width, c.height);
    const p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      let l = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114;
      if (bw) l = l > 160 ? 255 : 0;
      p[i] = p[i + 1] = p[i + 2] = l;
    }
    x.putImageData(d, 0, 0);
    return c;
  }
  function htmlFile(ctx, title, body, css) {
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body>
${body}
</body></html>`;
    return { files: [{ name: outName(ctx, "", "html"), blob: new Blob([html], { type: "text/html;charset=utf-8" }) }] };
  }
  async function tablesRun(ctx, asResultOnly) {
    const pages = await readPages(ctx);
    if (noText(pages)) throw new Error(scannedMsg);
    const tables = [];
    pages.forEach((p) => tablesFromLines(p.lines).forEach((t2) => tables.push({ page: p.num, rows: t2 })));
    if (!tables.length) throw new Error("No tables were detected in this PDF.");
    const files = ctx.values.split === "each" ? tables.map((t2, i) => ({ name: outName(ctx, `table-${i + 1}-p${t2.page}`, "csv"), blob: new Blob(["\uFEFF" + toCSV(t2.rows)], { type: "text/csv;charset=utf-8" }) })) : [{ name: outName(ctx, "tables", "csv"), blob: new Blob(["\uFEFF" + tables.map((t2) => toCSV(t2.rows)).join("\n\n")], { type: "text/csv;charset=utf-8" }) }];
    const preview = h("div", tables.slice(0, 5).map((t2, i) => h("div", { style: { marginBottom: "1rem" } }, h("h4", { style: { fontSize: ".9rem", margin: ".5rem 0" } }, `Table ${i + 1} \xB7 page ${t2.page} \xB7 ${t2.rows.length} rows`), h("div.report-wrap", { html: tableHtml(t2.rows.slice(0, 30)) }))));
    return { files, message: `${tables.length} table${tables.length > 1 ? "s" : ""} found. Open the CSV in Excel or Google Sheets.`, html: preview };
  }
  async function structRun(ctx, kind) {
    const pdf = await ctx.pdf();
    const pages = await readPages(ctx);
    const meta = await pdf.getMetadata().catch(() => ({}));
    const data = { file: ctx.files[0].name, pageCount: pdf.numPages, info: meta.info || {}, pages: pages.map((p) => ({ number: p.num, width: +p.width.toFixed(2), height: +p.height.toFixed(2), text: p.text, lines: p.lines.map((l) => ({ text: l.text, x: +l.x.toFixed(1), y: +l.y.toFixed(1), size: +l.size.toFixed(1), ...ctx.values.detail ? { words: l.items.map((i) => ({ t: i.str, x: +i.x.toFixed(1), w: +i.w.toFixed(1) })) } : {} })) })) };
    let out;
    if (kind === "json") out = JSON.stringify(data, null, 2);
    else {
      const x = (s) => escapeHtml(String(s)).replace(/"/g, "&quot;");
      out = `<?xml version="1.0" encoding="UTF-8"?>
<document file="${x(data.file)}" pages="${data.pageCount}">
  <info>${Object.entries(data.info).filter(([, v]) => typeof v !== "object").map(([k, v]) => `<${k.replace(/[^\w]/g, "")}>${x(v)}</${k.replace(/[^\w]/g, "")}>`).join("")}</info>
` + data.pages.map((p) => `  <page number="${p.number}" width="${p.width}" height="${p.height}">
${p.lines.map((l) => `    <line x="${l.x}" y="${l.y}" size="${l.size}">${x(l.text)}</line>`).join("\n")}
  </page>`).join("\n") + "\n</document>";
    }
    return { files: [{ name: outName(ctx, "", kind), blob: new Blob([out], { type: kind === "json" ? "application/json" : "application/xml" }) }], html: textResultView(out.slice(0, 2e5)) };
  }
  function audioPlayer(paras, v) {
    const synth = window.speechSynthesis;
    let i = 0, playing = false;
    const now = h("div.audio-now");
    const status = h("span", { style: { fontSize: ".85rem", color: "var(--text-3)" } });
    const show = () => {
      now.innerHTML = paras.slice(Math.max(0, i - 1), i + 3).map((p, k) => k === (i > 0 ? 1 : 0) ? `<mark>${esc(p)}</mark>` : esc(p)).join("<br><br>");
      status.textContent = `Paragraph ${i + 1} of ${paras.length}`;
    };
    const speak = () => {
      if (i >= paras.length) {
        playing = false;
        btn.innerHTML = ic("play") + "Play";
        i = 0;
        show();
        return;
      }
      const u = new SpeechSynthesisUtterance(paras[i]);
      const voice = synth.getVoices().find((x) => x.name === v.voice);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      u.rate = +v.rate || 1;
      u.onend = () => {
        if (playing) {
          i++;
          show();
          speak();
        }
      };
      synth.speak(u);
    };
    const jump = (d) => {
      const was = playing;
      playing = false;
      synth.cancel();
      i = Math.max(0, Math.min(paras.length - 1, i + d));
      show();
      if (was) setTimeout(() => {
        playing = true;
        speak();
      }, 60);
    };
    const btn = h("button.btn.btn-primary.btn-lg", { type: "button", on: { click: () => {
      if (playing) {
        playing = false;
        synth.cancel();
        btn.innerHTML = ic("play") + "Play";
      } else {
        playing = true;
        synth.cancel();
        speak();
        btn.innerHTML = ic("pause") + "Pause";
      }
    } } }, ic("play"), "Play");
    const ctl = h(
      "div",
      { style: { display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" } },
      btn,
      h("button.btn.btn-ghost", { type: "button", "aria-label": "Previous", on: { click: () => jump(-1) } }, ic("skip-back")),
      h("button.btn.btn-ghost", { type: "button", "aria-label": "Next", on: { click: () => jump(1) } }, ic("skip-forward")),
      status
    );
    window.addEventListener("hashchange", () => synth.cancel(), { once: true });
    show();
    return h("div.audio-player", ctl, now);
  }
  var rangeOpt, dpiOpt, noText, scannedMsg, convert_from_default;
  var init_convert_from = __esm({
    "js/tools/convert-from.js"() {
      init_pdf();
      init_lib();
      init_ui();
      init_htmlpdf();
      init_common();
      rangeOpt = { key: "pages", type: "pages", label: "Pages (optional)", hint: "Leave empty for all pages." };
      dpiOpt = { key: "dpi", type: "cards", label: "Resolution", default: "150", options: [["72", "Low", "72 DPI \xB7 web"], ["150", "Medium", "150 DPI"], ["220", "High", "220 DPI"], ["300", "Print", "300 DPI"]] };
      noText = (pages) => !pages.some((p) => p.text.trim());
      scannedMsg = "No text found \u2014 this looks like a scanned PDF. Run it through OCR PDF first.";
      convert_from_default = {
        "pdf-to-jpg": imageTool("JPG", "image/jpeg", "jpg"),
        "pdf-to-png": imageTool("PNG", "image/png", "png", { quality: false }),
        "pdf-to-webp": imageTool("WEBP", "image/webp", "webp"),
        "pdf-to-bmp": imageTool("BMP", "image/bmp", "bmp", { quality: false }),
        "pdf-to-tiff": imageTool("TIFF", "image/tiff", "tif", { quality: false, multiTiff: true }),
        "pdf-to-svg": {
          accept: "pdf",
          view: "thumbs",
          action: "Convert to SVG",
          actionIcon: "pen-tool",
          options: [rangeOpt, { key: "fonts", type: "check", label: "Embed fonts (larger, more accurate)", default: true }],
          async run(ctx) {
            const pdfjs = await lib("pdfjs");
            const pdf = await ctx.pdf();
            const idx = parsePages(ctx.values.pages, pdf.numPages);
            const files = [];
            for (const i of idx) {
              ctx.progress(files.length / idx.length, `Converting page ${i + 1}`);
              const page = await pdf.getPage(i + 1);
              const vp = page.getViewport({ scale: 1 });
              let svgText;
              try {
                const ops = await page.getOperatorList();
                const g = new pdfjs.SVGGraphics(page.commonObjs, page.objs);
                g.embedFonts = !!ctx.values.fonts;
                const svg = await g.getSVG(ops, vp);
                svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                svgText = new XMLSerializer().serializeToString(svg);
              } catch (e) {
                const c = await renderPage(pdf, i + 1, { dpi: 200 });
                const url = c.toDataURL("image/png");
                svgText = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${vp.width}" height="${vp.height}" viewBox="0 0 ${vp.width} ${vp.height}"><image width="${vp.width}" height="${vp.height}" xlink:href="${url}"/></svg>`;
              }
              files.push({ name: outName(ctx, `page-${i + 1}`, "svg"), blob: new Blob([svgText], { type: "image/svg+xml" }) });
            }
            return { files, zipName: outName(ctx, "svg", "zip") };
          }
        },
        "pdf-to-text": {
          accept: "pdf",
          view: "thumbs",
          action: "Extract text",
          actionIcon: "file-type",
          options: [rangeOpt, { key: "mode", type: "seg", label: "Layout", default: "para", options: [["para", "Paragraphs"], ["lines", "Keep lines"]] }, { key: "sep", type: "check", label: "Mark page breaks", default: true }],
          async run(ctx) {
            const pages = await readPages(ctx);
            if (noText(pages)) throw new Error(scannedMsg);
            const body = bodySize(pages);
            const text = pages.map((p) => (ctx.values.sep ? `----- Page ${p.num} -----
` : "") + (ctx.values.mode === "lines" ? p.text : paragraphs(p.lines, body).map((x) => x.text).join("\n\n"))).join("\n\n");
            return { files: [{ name: outName(ctx, "", "txt"), blob: new Blob([text], { type: "text/plain;charset=utf-8" }) }], html: textResultView(text) };
          }
        },
        "pdf-to-html": {
          accept: "pdf",
          view: "thumbs",
          action: "Convert to HTML",
          actionIcon: "code-xml",
          options: [{ key: "mode", type: "cards", label: "Style", default: "flow", options: [["flow", "Reflowable", "clean text, mobile friendly"], ["exact", "Exact look", "page images + selectable text"]] }, rangeOpt],
          async run(ctx) {
            const pages = await readPages(ctx);
            const title = escapeHtml(baseName(ctx.files[0].name));
            let bodyHtml;
            if (ctx.values.mode === "exact") {
              const pdf = await ctx.pdf();
              const parts = [];
              for (const p of pages) {
                ctx.progress(p.num / pages.length, `Rendering page ${p.num}`);
                const url = (await renderPage(pdf, p.num, { dpi: 110 })).toDataURL("image/jpeg", 0.8);
                const spans = p.lines.flatMap((l) => l.items).map((it) => `<span style="left:${(it.x / p.width * 100).toFixed(2)}%;top:${((it.y - it.size * 0.85) / p.height * 100).toFixed(2)}%;font-size:${(it.size / p.width * 100).toFixed(3)}cqw">${escapeHtml(it.str)}</span>`).join("");
                parts.push(`<div class="pg" style="aspect-ratio:${p.width}/${p.height}"><img src="${url}" alt="Page ${p.num}">${spans}</div>`);
              }
              bodyHtml = parts.join("\n");
              return htmlFile(ctx, title, bodyHtml, `.pg{position:relative;max-width:900px;margin:16px auto;box-shadow:0 2px 12px #0002;container-type:inline-size;background:#fff}.pg img{width:100%;display:block}.pg span{position:absolute;color:transparent;white-space:pre;line-height:1}.pg span::selection{background:#4f46e555}`);
            }
            if (noText(pages)) throw new Error(scannedMsg);
            const body = bodySize(pages);
            bodyHtml = pages.map((p) => `<section id="page-${p.num}">
${paragraphs(p.lines, body).map((x) => {
              const lv = headingLevel(x.size, body);
              return lv ? `<h${lv}>${escapeHtml(x.text)}</h${lv}>` : x.bullet ? `<li>${escapeHtml(x.text.replace(/^\s*([•●▪◦‣∙·\-*–]|\d{1,2}[.)])\s+/, ""))}</li>` : `<p>${escapeHtml(x.text)}</p>`;
            }).join("\n")}
</section>`).join("\n<hr>\n");
            return htmlFile(ctx, title, bodyHtml, "body{max-width:760px;margin:2rem auto;padding:0 1rem;font:17px/1.7 system-ui,sans-serif;color:#1f2937}h1,h2,h3{line-height:1.25}hr{border:0;border-top:1px solid #e5e7eb;margin:2rem 0}");
          }
        },
        "pdf-to-markdown": {
          accept: "pdf",
          view: "thumbs",
          action: "Convert to Markdown",
          actionIcon: "hash",
          options: [rangeOpt, { key: "sep", type: "check", label: "Add a divider between pages" }],
          async run(ctx) {
            const pages = await readPages(ctx);
            if (noText(pages)) throw new Error(scannedMsg);
            const body = bodySize(pages);
            const md = pages.map((p) => paragraphs(p.lines, body).map((x) => {
              const lv = headingLevel(x.size, body);
              return lv ? `${"#".repeat(lv)} ${x.text}` : x.bullet ? x.text.replace(/^\s*[•●▪◦‣∙·*–]\s+/, "- ") : x.text;
            }).join("\n\n")).join(ctx.values.sep ? "\n\n---\n\n" : "\n\n");
            return { files: [{ name: outName(ctx, "", "md"), blob: new Blob([md], { type: "text/markdown;charset=utf-8" }) }], html: textResultView(md) };
          }
        },
        "pdf-to-csv": {
          accept: "pdf",
          view: "thumbs",
          action: "Extract tables to CSV",
          actionIcon: "sheet",
          options: [rangeOpt, { key: "split", type: "seg", label: "Output", default: "one", options: [["one", "One CSV file"], ["each", "One file per table"]] }],
          run: (ctx) => tablesRun(ctx)
        },
        "pdf-to-json": { accept: "pdf", view: "thumbs", action: "Export JSON", actionIcon: "braces", options: [rangeOpt, { key: "detail", type: "check", label: "Include word positions", default: false }], run: (ctx) => structRun(ctx, "json") },
        "pdf-to-xml": { accept: "pdf", view: "thumbs", action: "Export XML", actionIcon: "code", options: [rangeOpt, { key: "detail", type: "check", label: "Include word positions", default: false }], run: (ctx) => structRun(ctx, "xml") },
        "pdf-to-grayscale": {
          accept: "pdf",
          view: "thumbs",
          action: "Convert to grayscale",
          actionIcon: "contrast",
          suffix: "grayscale",
          options: [{ key: "mode", type: "seg", label: "Colour", default: "gray", options: [["gray", "Grayscale"], ["bw", "Pure black & white"]] }, { key: "dpi", type: "select", label: "Quality", default: "150", options: [["110", "Smaller file"], ["150", "Good"], ["220", "High"], ["300", "Print"]] }, { type: "info", html: "Pages are re-drawn as images, so text won\u2019t be selectable afterwards. Run OCR PDF if you need searchable text." }],
          async apply(bytes, v, progress) {
            const pdf = await openPdf(bytes);
            return rasterizeToPdf(pdf, { dpi: +v.dpi || 150, quality: 0.8, onProgress: progress, transform: (c) => grayscale(c, v.mode === "bw") });
          },
          async run(ctx) {
            const doc = await this.apply(ctx.files[0].bytes, ctx.values, ctx.progress);
            const blob = await saveDoc(doc);
            return { files: [{ name: outName(ctx, "grayscale"), blob }], stats: { before: ctx.files[0].size, after: blob.size } };
          }
        },
        "pdf-to-audio": {
          accept: "pdf",
          view: "thumbs",
          action: "Read aloud",
          actionIcon: "volume-2",
          options: () => {
            const voices = window.speechSynthesis?.getVoices() || [];
            const pref = voices.filter((v) => /^(en|hi|pa)/i.test(v.lang));
            return [
              { key: "voice", type: "select", label: "Voice", default: (pref[0] || voices[0])?.name || "", options: (voices.length ? [...pref, ...voices.filter((v) => !pref.includes(v))] : [{ name: "", lang: "" }]).map((v) => [v.name, v.name ? `${v.name} (${v.lang})` : "Default voice"]) },
              { key: "rate", type: "range", label: "Speed", default: 1, min: 0.5, max: 2, step: 0.1, format: (x) => `${x}\xD7` },
              rangeOpt,
              { type: "info", html: "Uses your device\u2019s built-in voices. MP3 download is coming with our server version." }
            ];
          },
          async init(ctx) {
            if (!("speechSynthesis" in window)) throw new Error("Your browser does not support text-to-speech.");
            if (!speechSynthesis.getVoices().length) await new Promise((r) => {
              speechSynthesis.onvoiceschanged = r;
              setTimeout(r, 1200);
            });
          },
          async run(ctx) {
            const pages = await readPages(ctx);
            if (noText(pages)) throw new Error(scannedMsg);
            const body = bodySize(pages);
            const paras = pages.flatMap((p) => paragraphs(p.lines, body).map((x) => x.text));
            return { title: "Ready to listen", message: `${paras.length} paragraphs from ${pages.length} pages.`, html: audioPlayer(paras, ctx.values), files: [] };
          }
        }
      };
    }
  });

  // js/tools/advanced.js
  var advanced_exports = {};
  __export(advanced_exports, {
    default: () => advanced_default
  });
  function pick(o, keys) {
    return Object.fromEntries(keys.map((k) => [k, o[k]]));
  }
  async function runChain(bytes, steps, progress, name) {
    let cur = bytes;
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const impl = REG[s.tool];
      const vals = initValues(staticOpts(s.tool), { ...s.values });
      const err = impl.validate?.({ values: vals, files: [{ name }], state: {}, sel: /* @__PURE__ */ new Set() });
      if (err) throw new Error(`${toolBySlug[s.tool].name}: ${err}`);
      const doc = await impl.apply(cur, vals, (f) => progress?.((i + (f || 0)) / steps.length, `${toolBySlug[s.tool].name}\u2026`), { files: [{ name }], rot: {} });
      cur = await doc.save({ useObjectStreams: true });
    }
    return new Blob([cur], { type: "application/pdf" });
  }
  function stepEditor(ctx, box) {
    const draw = () => {
      box.innerHTML = "";
      ctx.state.steps.forEach((s, i) => {
        const sel = h("select.option-select", { "aria-label": `Step ${i + 1} tool`, on: { change: (e) => {
          s.tool = e.target.value;
          s.values = {};
          draw();
        } } }, toolChoices.map(([v, l]) => h("option", { value: v, selected: v === s.tool }, l)));
        const opts = renderOptions(staticOpts(s.tool).filter((o) => !["heading"].includes(o.type)), s.values);
        const card2 = h("div.wf-step", h(
          "div.wf-step-head",
          h("span.pill", `${i + 1}`),
          sel,
          h("button.mini-btn.icon-only", { type: "button", "aria-label": "Move up", disabled: i === 0, on: { click: () => {
            ctx.state.steps.splice(i - 1, 0, ctx.state.steps.splice(i, 1)[0]);
            draw();
          } } }, ic("chevron-up")),
          h("button.mini-btn.icon-only", { type: "button", "aria-label": "Remove step", on: { click: () => {
            ctx.state.steps.splice(i, 1);
            draw();
          } } }, ic("x"))
        ), h("details", h("summary", { style: { cursor: "pointer", fontSize: ".82rem", color: "var(--text-2)" } }, "Settings"), h("div", { style: { marginTop: ".75rem" } }, opts)));
        box.appendChild(card2);
      });
      box.appendChild(h(
        "div",
        { style: { display: "flex", gap: ".4rem", flexWrap: "wrap" } },
        h("button.btn.btn-ghost", { type: "button", on: { click: () => {
          ctx.state.steps.push({ tool: "compress-pdf", values: {} });
          draw();
        } } }, ic("plus"), "Add step"),
        h("button.btn.btn-ghost", { type: "button", on: { click: () => {
          store.set("workflow", ctx.state.steps);
          toast("Workflow saved on this device", "success");
        } } }, ic("save"), "Save workflow")
      ));
    };
    draw();
  }
  function qrPng(text, ec = "M", fg = "#000000") {
    const qrcode = window.qrcode;
    qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s));
    const q = qrcode(0, ec);
    q.addData(text, "Byte");
    q.make();
    const n = q.getModuleCount();
    const cell = 10, m = 4;
    const c = document.createElement("canvas");
    c.width = c.height = (n + 2 * m) * cell;
    const x = c.getContext("2d");
    x.fillStyle = "#fff";
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = fg;
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + m) * cell, (r + m) * cell, cell, cell);
    return { src: c.toDataURL("image/png"), w: c.width, h: c.height };
  }
  function qrText(v) {
    switch (v.kind) {
      case "upi":
        return `upi://pay?pa=${encodeURIComponent(v.upi || "")}&pn=${encodeURIComponent(v.payee || "")}${v.amount ? `&am=${encodeURIComponent(v.amount)}` : ""}&cu=INR`;
      case "phone":
        return `tel:${v.text}`;
      case "email":
        return `mailto:${v.text}`;
      case "wifi":
        return `WIFI:T:WPA;S:${v.ssid || ""};P:${v.wpass || ""};;`;
      default:
        return v.text || "";
    }
  }
  async function wrapLines(doc, text, size, maxW, font = "Helvetica") {
    const f = await getFont(doc, font);
    const enc = canEncode(f, text.replace(/\n/g, ""));
    const ctx2 = document.createElement("canvas").getContext("2d");
    ctx2.font = `${size}px sans-serif`;
    const w = (s) => enc ? f.widthOfTextAtSize(s, size) : ctx2.measureText(s).width;
    const out = [];
    for (const para2 of String(text).split("\n")) {
      let line = "";
      for (const word of para2.split(" ")) {
        const t2 = line ? line + " " + word : word;
        if (w(t2) > maxW && line) {
          out.push(line);
          line = word;
        } else line = t2;
      }
      out.push(line);
    }
    return out;
  }
  async function para(doc, page, text, x, y, maxW, size = 10.5, opts = {}) {
    const lines = await wrapLines(doc, text, size, maxW, opts.font);
    for (const l of lines) {
      if (l) await stampText(doc, page, l, { vx: x, vy: y, size, ...opts });
      y -= size * (opts.lh || 1.45);
    }
    return y;
  }
  var REG, staticOpts, toolChoices, PRESETS, TEMPLATES, money, advanced_default;
  var init_advanced = __esm({
    "js/tools/advanced.js"() {
      init_pdf();
      init_lib();
      init_ui();
      init_options();
      init_editor();
      init_tools();
      init_common();
      init_organize();
      init_optimize();
      init_edit();
      init_security();
      init_convert_from();
      REG = { ...pick(optimize_default, ["compress-pdf", "optimize-images", "flatten-pdf", "remove-objects"]), ...pick(organize_default, ["rotate-pdf", "insert-blank", "reverse-pdf", "n-up", "booklet-maker", "split-half"]), ...pick(edit_default, ["page-numbers", "header-footer", "watermark", "background-color", "resize-pages", "change-margins"]), ...pick(security_default, ["protect-pdf", "pdf-permissions", "remove-metadata"]), ...pick(convert_from_default, ["pdf-to-grayscale"]) };
      staticOpts = (slug) => (typeof REG[slug].options === "function" ? [] : REG[slug].options || []).filter((o) => o.type !== "pages" || true);
      toolChoices = Object.keys(REG).map((s) => [s, toolBySlug[s].name]);
      PRESETS = {
        share: ["Ready to share", [{ tool: "remove-metadata", values: {} }, { tool: "compress-pdf", values: { level: "medium" } }]],
        office: ["Office document", [{ tool: "page-numbers", values: { format: "Page {n} of {total}" } }, { tool: "header-footer", values: { fc: "", hr: "{date}" } }, { tool: "compress-pdf", values: { level: "low" } }]],
        secure: ["Confidential", [{ tool: "watermark", values: { text: "CONFIDENTIAL" } }, { tool: "protect-pdf", values: {} }]],
        print: ["Print booklet", [{ tool: "insert-blank", values: { where: "odd" } }, { tool: "booklet-maker", values: {} }]]
      };
      TEMPLATES = {
        async invoice(doc, v) {
          const P = await PL();
          const p = doc.addPage(PAGE_SIZES.A4);
          const W = 595.28, m = 48;
          const acc = v.accent || "#4f46e5";
          let y = 790;
          p.drawRectangle({ x: 0, y: 812, width: W, height: 30, color: hexRgb(acc) });
          await stampText(doc, p, v.business || "Your Business", { vx: m, vy: y - 10, size: 20, font: "HelveticaBold" });
          await stampText(doc, p, "INVOICE", { vx: W - m - await measure(doc, "INVOICE", 24, "HelveticaBold"), vy: y - 10, size: 24, font: "HelveticaBold", color: acc });
          y = await para(doc, p, [v.address, v.gstin ? `GSTIN: ${v.gstin}` : ""].filter(Boolean).join("\n"), m, y - 30, 260, 9.5, { color: "#4b5563" });
          const meta = [["Invoice no.", v.number || "001"], ["Date", v.date || (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN")], ["Due", v.due || "\u2014"]];
          let my = 750;
          for (const [k, val] of meta) {
            await stampText(doc, p, k, { vx: 380, vy: my, size: 9.5, color: "#6b7280" });
            await stampText(doc, p, val, { vx: 460, vy: my, size: 9.5, font: "HelveticaBold" });
            my -= 15;
          }
          y = Math.min(y, my) - 20;
          await stampText(doc, p, "BILL TO", { vx: m, vy: y, size: 8.5, font: "HelveticaBold", color: acc });
          y -= 15;
          await stampText(doc, p, v.client || "Client name", { vx: m, vy: y, size: 11, font: "HelveticaBold" });
          y = await para(doc, p, v.clientAddr || "", m, y - 14, 300, 9.5, { color: "#4b5563" });
          y -= 16;
          p.drawRectangle({ x: m, y: y - 6, width: W - 2 * m, height: 22, color: hexRgb("#f3f4f6") });
          const cols = [m + 8, 350, 410, 480];
          for (const [t2, x] of [["Description", cols[0]], ["Qty", cols[1]], ["Rate", cols[2]], ["Amount", cols[3]]]) await stampText(doc, p, t2, { vx: x, vy: y, size: 9, font: "HelveticaBold" });
          y -= 24;
          let sub = 0;
          const cur = v.currency || "\u20B9";
          for (const it of (v.items || []).filter((i) => i.desc)) {
            const amt = (+it.qty || 0) * (+it.rate || 0);
            sub += amt;
            await stampText(doc, p, String(it.desc), { vx: cols[0], vy: y, size: 10 });
            await stampText(doc, p, String(it.qty || 0), { vx: cols[1], vy: y, size: 10 });
            await stampText(doc, p, money(it.rate, cur), { vx: cols[2], vy: y, size: 10 });
            await stampText(doc, p, money(amt, cur), { vx: cols[3], vy: y, size: 10 });
            y -= 18;
            p.drawLine({ start: { x: m, y: y + 10 }, end: { x: W - m, y: y + 10 }, thickness: 0.4, color: hexRgb("#e5e7eb") });
          }
          const tax = sub * (+v.tax || 0) / 100;
          y -= 8;
          for (const [k, val, b] of [["Subtotal", sub], [`Tax (${+v.tax || 0}%)`, tax], ["Total", sub + tax, true]]) {
            await stampText(doc, p, k, { vx: 380, vy: y, size: b ? 12 : 10, font: b ? "HelveticaBold" : "Helvetica" });
            await stampText(doc, p, money(val, cur), { vx: 480, vy: y, size: b ? 12 : 10, font: b ? "HelveticaBold" : "Helvetica", color: b ? acc : "#111111" });
            y -= b ? 22 : 16;
          }
          if (v.notes) {
            await stampText(doc, p, "Notes", { vx: m, vy: y - 10, size: 9, font: "HelveticaBold" });
            await para(doc, p, v.notes, m, y - 26, W - 2 * m, 9.5, { color: "#4b5563" });
          }
          await stampText(doc, p, "Thank you for your business!", { vx: m, vy: 40, size: 9, color: "#9ca3af" });
        },
        async certificate(doc, v) {
          const [H, W] = PAGE_SIZES.A4;
          const p = doc.addPage([W, H]);
          const acc = v.accent || "#b45309";
          p.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: hexRgb(acc), borderWidth: 6 });
          p.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: hexRgb(acc), borderWidth: 1.2 });
          const center = async (t2, y2, size, font = "TimesRoman", color = "#111111") => stampText(doc, p, t2, { vx: (W - await measure(doc, t2, size, font)) / 2, vy: y2, size, font, color });
          await center((v.ctitle || "Certificate of Achievement").toUpperCase(), H - 130, 30, "TimesRomanBold", acc);
          await center("This certificate is proudly presented to", H - 185, 14, "TimesRoman", "#4b5563");
          await center(v.recipient || "Recipient Name", H - 250, 40, "TimesRomanBold");
          p.drawLine({ start: { x: W / 2 - 180, y: H - 265 }, end: { x: W / 2 + 180, y: H - 265 }, thickness: 1, color: hexRgb(acc) });
          const lines = await wrapLines(doc, v.reason || "for outstanding performance", 15, 520, "TimesRoman");
          let y = H - 305;
          for (const l of lines) {
            await center(l, y, 15, "TimesRoman", "#374151");
            y -= 22;
          }
          for (const [x, top, bottom] of [[150, v.cdate || (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN"), "Date"], [W - 150, v.signer || "Signature", v.signerTitle || "Director"]]) {
            p.drawLine({ start: { x: x - 90, y: 110 }, end: { x: x + 90, y: 110 }, thickness: 0.8, color: hexRgb("#6b7280") });
            await stampText(doc, p, top, { vx: x - await measure(doc, top, 13, "TimesRomanBold") / 2, vy: 118, size: 13, font: "TimesRomanBold" });
            await stampText(doc, p, bottom, { vx: x - await measure(doc, bottom, 11) / 2, vy: 94, size: 11, color: "#6b7280" });
          }
        },
        async resume(doc, v) {
          const p = doc.addPage(PAGE_SIZES.A4);
          const W = 595.28, m = 50;
          const acc = v.accent || "#0f766e";
          let y = 780;
          await stampText(doc, p, v.rname || "Your Name", { vx: m, vy: y, size: 26, font: "HelveticaBold" });
          y -= 22;
          if (v.rtitle) {
            await stampText(doc, p, v.rtitle, { vx: m, vy: y, size: 13, color: acc });
            y -= 18;
          }
          const contact = [v.email, v.phone, v.city].filter(Boolean).join("  \xB7  ");
          if (contact) {
            await stampText(doc, p, contact, { vx: m, vy: y, size: 9.5, color: "#4b5563" });
            y -= 14;
          }
          p.drawLine({ start: { x: m, y: y - 2 }, end: { x: W - m, y: y - 2 }, thickness: 1.5, color: hexRgb(acc) });
          y -= 24;
          const sec = async (t2) => {
            await stampText(doc, p, t2.toUpperCase(), { vx: m, vy: y, size: 10, font: "HelveticaBold", color: acc });
            y -= 16;
          };
          if (v.summary) {
            await sec("Profile");
            y = await para(doc, p, v.summary, m, y, W - 2 * m, 10) - 10;
          }
          const exp = (v.experience || []).filter((e) => e.role);
          if (exp.length) {
            await sec("Experience");
            for (const e of exp) {
              await stampText(doc, p, `${e.role}${e.org ? " \u2014 " + e.org : ""}`, { vx: m, vy: y, size: 11, font: "HelveticaBold" });
              if (e.years) await stampText(doc, p, e.years, { vx: W - m - await measure(doc, e.years, 9.5), vy: y, size: 9.5, color: "#6b7280" });
              y -= 14;
              if (e.what) y = await para(doc, p, e.what, m, y, W - 2 * m, 9.5, { color: "#374151" });
              y -= 8;
            }
          }
          const edu = (v.education || []).filter((e) => e.degree);
          if (edu.length) {
            await sec("Education");
            for (const e of edu) {
              await stampText(doc, p, `${e.degree}${e.school ? " \u2014 " + e.school : ""}`, { vx: m, vy: y, size: 10.5, font: "HelveticaBold" });
              if (e.year) await stampText(doc, p, e.year, { vx: W - m - await measure(doc, e.year, 9.5), vy: y, size: 9.5, color: "#6b7280" });
              y -= 18;
            }
            y -= 4;
          }
          if (v.skills) {
            await sec("Skills");
            y = await para(doc, p, v.skills.split(",").map((s) => s.trim()).filter(Boolean).join("  \u2022  "), m, y, W - 2 * m, 10);
          }
        },
        async letter(doc, v) {
          const p = doc.addPage(PAGE_SIZES.A4);
          const W = 595.28, m = 64;
          let y = 780;
          y = await para(doc, p, v.from || "Your name\nYour address", m, y, 300, 10.5) - 14;
          await stampText(doc, p, v.ldate || (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), { vx: m, vy: y, size: 10.5 });
          y -= 26;
          y = await para(doc, p, v.to || "To,\nRecipient name\nAddress", m, y, 300, 10.5) - 16;
          if (v.subject) {
            await stampText(doc, p, `Subject: ${v.subject}`, { vx: m, vy: y, size: 11, font: "HelveticaBold" });
            y -= 24;
          }
          y = await para(doc, p, v.body || "Dear Sir/Madam,\n\nWrite your letter here.", m, y, W - 2 * m, 11, { lh: 1.55 }) - 20;
          y = await para(doc, p, `${v.closing || "Yours sincerely,"}


${v.signname || "Your name"}`, m, y, 300, 11);
        }
      };
      money = (n, cur) => `${cur}${(+n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      advanced_default = {
        "batch-process": {
          accept: "pdf",
          multiple: true,
          view: "files",
          action: "Process all files",
          actionIcon: "boxes",
          uploadTitle: "Select PDF files",
          options: (ctx) => [{ key: "tool", type: "select", label: "Tool to apply to every file", default: "compress-pdf", options: toolChoices }, { type: "heading", label: `${toolBySlug[ctx.values.tool || "compress-pdf"].name} settings` }, ...staticOpts(ctx.values.tool || "compress-pdf")],
          onOption(ctx, k) {
            if (k === "tool") {
              const t2 = ctx.values.tool;
              ctx.values = { tool: t2 };
              ctx.refreshOptions();
            }
          },
          async run(ctx) {
            const files = [];
            const slug = ctx.values.tool;
            const steps = [{ tool: slug, values: ctx.values }];
            for (let i = 0; i < ctx.files.length; i++) {
              const f = ctx.files[i];
              ctx.progress(i / ctx.files.length, `${f.name} (${i + 1}/${ctx.files.length})`);
              files.push({ name: `${baseName(f.name)}-${slug.replace("-pdf", "")}.pdf`, blob: await runChain(f.bytes, steps, null, f.name) });
              await nextFrame();
            }
            return { files, zipName: `batch-${slug}.zip`, message: `${files.length} files processed with ${toolBySlug[slug].name}.` };
          }
        },
        "workflow-builder": {
          accept: "pdf",
          multiple: true,
          view: "files",
          action: "Run workflow",
          actionIcon: "workflow",
          init(ctx) {
            var _a;
            (_a = ctx.state).steps || (_a.steps = store.get("workflow") || JSON.parse(JSON.stringify(PRESETS.share[1])));
          },
          options: (ctx) => [
            { type: "info", html: "Steps run in order. Several files are merged first, then every step is applied." },
            { type: "custom", label: "Start from a preset", render(box) {
              box.appendChild(h("div.seg", Object.entries(PRESETS).map(([k, [label, steps]]) => h("button", { type: "button", on: { click: () => {
                ctx.state.steps = JSON.parse(JSON.stringify(steps));
                ctx.refreshOptions();
              } } }, label))));
            } },
            { type: "custom", label: "Steps", render: (box) => stepEditor(ctx, box) }
          ],
          validate: (ctx) => !ctx.state.steps.length ? "Add at least one step" : null,
          async run(ctx) {
            let bytes = ctx.files[0].bytes;
            if (ctx.files.length > 1) {
              ctx.progress(0, "Merging files\u2026");
              const { PDFDocument } = await PL();
              const out = await PDFDocument.create();
              for (const f of ctx.files) {
                const s = await loadDoc(f.bytes);
                (await out.copyPages(s, s.getPageIndices())).forEach((p) => out.addPage(p));
              }
              bytes = await out.save();
            }
            const blob = await runChain(bytes, ctx.state.steps, ctx.progress, ctx.files[0].name);
            return { files: [{ name: outName(ctx, "workflow"), blob }], message: `Ran ${ctx.state.steps.length} step${ctx.state.steps.length > 1 ? "s" : ""}: ${ctx.state.steps.map((s) => toolBySlug[s.tool].name).join(" \u2192 ")}.` };
          }
        },
        "attach-files": {
          accept: "pdf",
          view: "none",
          action: "Attach files",
          actionIcon: "paperclip",
          options: [{ key: "files", type: "file", label: "Files to attach", multiple: true, placeholder: "Choose any files (Excel, images, ZIP\u2026)" }, { key: "desc", type: "text", label: "Description (optional)" }, { type: "info", html: "Attachments open from the paperclip panel in Adobe Reader and most desktop PDF apps." }],
          validate: (ctx) => !ctx.values.files?.length ? "Choose the files to attach" : null,
          async run(ctx) {
            const doc = await loadDoc(ctx.files[0].bytes);
            for (const f of ctx.values.files) await doc.attach(new Uint8Array(await f.arrayBuffer()), f.name, { mimeType: f.type || "application/octet-stream", description: ctx.values.desc || f.name, creationDate: new Date(f.lastModified || Date.now()), modificationDate: /* @__PURE__ */ new Date() });
            return { files: [{ name: outName(ctx, "with-attachments"), blob: await saveDoc(doc) }], message: `${ctx.values.files.length} file${ctx.values.files.length > 1 ? "s" : ""} attached.` };
          }
        },
        "remove-attachments": {
          accept: "pdf",
          view: "none",
          action: "Remove attachments",
          actionIcon: "paperclip",
          options: [],
          async run(ctx) {
            const doc = await loadDoc(ctx.files[0].bytes);
            const { sanitize: sanitize3 } = await Promise.resolve().then(() => (init_security(), security_exports));
            await sanitize3(doc, { files: true });
            return { files: [{ name: outName(ctx, "no-attachments"), blob: await saveDoc(doc) }] };
          }
        },
        "manage-layers": {
          accept: "pdf",
          view: "thumbs",
          action: "Save layer settings",
          actionIcon: "layers",
          async init(ctx) {
            const P = await PL();
            const N = (n) => P.PDFName.of(n);
            const doc = await loadDoc(ctx.files[0].bytes);
            const ocp = doc.catalog.lookup(N("OCProperties"));
            ctx.state.layers = [];
            if (ocp instanceof P.PDFDict) {
              const ocgs = ocp.lookup(N("OCGs"));
              const d = ocp.lookup(N("D"));
              const off = new Set((d?.lookup(N("OFF"))?.asArray?.() || []).map((r) => r.tag));
              (ocgs?.asArray?.() || []).forEach((ref, i) => {
                const g = doc.context.lookup(ref);
                const nm = g?.lookup(N("Name"));
                ctx.state.layers.push({ i, tag: ref.tag, name: nm?.decodeText ? nm.decodeText() : String(nm || `Layer ${i + 1}`) });
                ctx.values["L" + i] = !off.has(ref.tag);
              });
            }
          },
          options: (ctx) => ctx.state.layers.length ? [{ type: "info", html: "Choose which layers are visible when the PDF opens. Most viewers also let readers toggle them." }, ...ctx.state.layers.map((l) => ({ key: "L" + l.i, type: "check", label: l.name })), { key: "lock", type: "check", label: "Hide the layers panel (readers can\u2019t switch)" }] : [{ type: "info", warn: true, html: "This PDF has no layers (optional content groups)." }],
          validate: (ctx) => !ctx.state.layers.length ? "This PDF has no layers" : null,
          async run(ctx) {
            const P = await PL();
            const N = (n) => P.PDFName.of(n);
            const doc = await loadDoc(ctx.files[0].bytes);
            const ocp = doc.catalog.lookup(N("OCProperties"));
            const refs = ocp.lookup(N("OCGs")).asArray();
            let d = ocp.lookup(N("D"));
            if (!(d instanceof P.PDFDict)) {
              d = doc.context.obj({});
              ocp.set(N("D"), d);
            }
            const on = refs.filter((r, i) => ctx.values["L" + i]), off = refs.filter((r, i) => !ctx.values["L" + i]);
            d.set(N("ON"), doc.context.obj(on));
            d.set(N("OFF"), doc.context.obj(off));
            d.set(N("BaseState"), N("ON"));
            if (ctx.values.lock) {
              d.set(N("Locked"), doc.context.obj(refs));
              doc.catalog.set(N("PageMode"), N("UseNone"));
            }
            return { files: [{ name: outName(ctx, "layers"), blob: await saveDoc(doc) }], message: `${on.length} visible \xB7 ${off.length} hidden.` };
          }
        },
        "add-qr-code": {
          accept: "pdf",
          view: "editor",
          editorTools: ["qr", "barcode", "image"],
          editorDefault: "qr",
          action: "Save PDF",
          actionIcon: "qr-code",
          editorProviders: (ctx) => ({
            qr: { label: "QR code", icon: "qr-code", provide: async () => {
              await lib("qrcode");
              const t2 = qrText(ctx.values);
              if (!t2 || t2 === "upi://pay?pa=&pn=&cu=INR") {
                toast("Fill in the QR content in the options first", "error");
                return null;
              }
              return qrPng(t2, ctx.values.ec, ctx.values.fg);
            } },
            barcode: { label: "Barcode", icon: "barcode", provide: async () => {
              const JsBarcode = await lib("jsbarcode");
              const c = document.createElement("canvas");
              try {
                JsBarcode(c, ctx.values.code || "123456789", { format: ctx.values.format || "CODE128", displayValue: true, margin: 10, height: 80 });
              } catch (e) {
                toast(`Invalid value for ${ctx.values.format}`, "error");
                return null;
              }
              return { src: c.toDataURL("image/png"), w: c.width, h: c.height };
            } }
          }),
          editorHint: (t2) => t2 === "qr" || t2 === "barcode" ? "Fill in the content on the right, then tap on the page to place it. Resize with the round handle." : null,
          options: [
            { type: "heading", label: "QR code" },
            { key: "kind", type: "select", label: "QR contains", default: "url", options: [["url", "Website link"], ["text", "Text"], ["upi", "UPI payment"], ["phone", "Phone number"], ["email", "Email"], ["wifi", "Wi-Fi login"]] },
            { key: "text", type: "text", label: "Content", placeholder: "https://\u2026", show: (v) => ["url", "text", "phone", "email"].includes(v.kind) },
            { key: "upi", type: "text", label: "UPI ID", placeholder: "name@bank", show: (v) => v.kind === "upi" },
            { key: "payee", type: "text", label: "Payee name", show: (v) => v.kind === "upi" },
            { key: "amount", type: "number", label: "Amount (\u20B9, optional)", show: (v) => v.kind === "upi" },
            { key: "ssid", type: "text", label: "Wi-Fi name", show: (v) => v.kind === "wifi" },
            { key: "wpass", type: "text", label: "Wi-Fi password", show: (v) => v.kind === "wifi" },
            { key: "fg", type: "color", label: "Colour", default: "#000000", swatches: ["#000000", "#1e3a8a", "#7c2d12", "#14532d", "#4c1d95"] },
            { key: "ec", type: "seg", label: "Error correction", default: "M", options: [["L", "Low"], ["M", "Medium"], ["H", "High"]] },
            { type: "heading", label: "Barcode" },
            { key: "format", type: "select", label: "Barcode type", default: "CODE128", options: [["CODE128", "Code 128 (any text)"], ["EAN13", "EAN-13 (products)"], ["UPC", "UPC-A"], ["CODE39", "Code 39"], ["ITF14", "ITF-14"]] },
            { key: "code", type: "text", label: "Barcode value", default: "123456789012" }
          ],
          validate: (ctx) => !ctx.state.objects?.length ? "Tap \u201CQR code\u201D or \u201CBarcode\u201D, then tap on the page" : null,
          async run(ctx) {
            const doc = await loadDoc(ctx.files[0].bytes);
            await applyObjects(doc, ctx.state.objects);
            return { files: [{ name: outName(ctx, "qr"), blob: await saveDoc(doc) }] };
          }
        },
        "read-qr-code": {
          accept: "pdf",
          view: "thumbs",
          action: "Scan for codes",
          actionIcon: "scan-qr-code",
          options: [{ type: "info", html: "Finds QR codes on every page. Barcodes (EAN, Code 128\u2026) are also detected on Chrome / Android." }],
          async run(ctx) {
            const pdf = await ctx.pdf();
            const rows = [];
            const det = "BarcodeDetector" in window ? new window.BarcodeDetector() : null;
            const jsQR = det ? null : await lib("jsqr");
            for (let i = 1; i <= pdf.numPages; i++) {
              ctx.progress(i / pdf.numPages, `Scanning page ${i}`);
              const c = await renderPage(pdf, i, { dpi: 200 });
              if (det) {
                try {
                  for (const b of await det.detect(c)) rows.push([i, b.format, b.rawValue]);
                  continue;
                } catch {
                }
              }
              const jq = jsQR || await lib("jsqr");
              const d = c.getContext("2d").getImageData(0, 0, c.width, c.height);
              const r = jq(d.data, c.width, c.height);
              if (r) rows.push([i, "qr_code", r.data]);
            }
            if (!rows.length) throw new Error("No QR codes or barcodes were found.");
            return { files: [{ name: outName(ctx, "codes", "csv"), blob: new Blob(["\uFEFFPage,Type,Value\n" + rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }) }], message: `${rows.length} code${rows.length > 1 ? "s" : ""} found.`, html: h("div.report-wrap", h("table.report", h("thead", h("tr", h("th", "Page"), h("th", "Type"), h("th", "Value"))), h("tbody", rows.map((r) => h("tr", h("td", `${r[0]}`), h("td", esc(r[1])), h("td", /^https?:/.test(r[2]) ? h("a", { href: r[2], target: "_blank", rel: "noopener noreferrer" }, esc(r[2])) : esc(r[2]))))))) };
          }
        },
        "create-blank-pdf": {
          noFile: true,
          view: "custom",
          viewTitle: "Preview",
          action: "Create PDF",
          actionIcon: "file-plus",
          options: [
            { key: "style", type: "cards", label: "Paper", default: "lined", options: [["blank", "Blank"], ["lined", "Lined"], ["grid", "Grid"], ["dots", "Dotted"], ["cornell", "Cornell notes"], ["music", "Music staff"]] },
            { key: "size", type: "select", label: "Page size", default: "A4", options: Object.keys(PAGE_SIZES).map((k) => [k, k]) },
            { key: "orient", type: "seg", label: "Orientation", default: "portrait", options: [["portrait", "Portrait"], ["landscape", "Landscape"]] },
            { key: "pages", type: "number", label: "Number of pages", default: 10, min: 1, max: 500 },
            { key: "spacing", type: "range", label: "Line spacing", default: 8, min: 4, max: 15, unit: " mm", show: (v) => v.style !== "blank" },
            { key: "color", type: "color", label: "Line colour", default: "#93c5fd", swatches: ["#93c5fd", "#a5b4fc", "#d1d5db", "#fca5a5", "#86efac", "#000000"], show: (v) => v.style !== "blank" },
            { key: "paper", type: "color", label: "Paper colour", default: "#ffffff", swatches: ["#ffffff", "#fffbeb", "#fef9c3", "#f0fdf4", "#f1f5f9"] },
            { key: "margin", type: "check", label: "Red margin line", default: true, show: (v) => v.style === "lined" }
          ],
          onOption: (ctx) => ctx.refreshView(),
          async renderView(body, ctx) {
            const doc = await this.make({ ...ctx.values, pages: 1 });
            const pdf = await openPdf(await doc.save());
            const c = await renderPage(pdf, 1, { width: Math.min(560, body.clientWidth - 30) * 2 });
            c.style.width = Math.min(560, body.clientWidth - 30) + "px";
            c.style.boxShadow = "var(--shadow)";
            body.replaceChildren(h("div", { style: { display: "flex", justifyContent: "center" } }, c));
          },
          async make(v) {
            const { PDFDocument, rgb } = await PL();
            const doc = await PDFDocument.create();
            let [W, H] = PAGE_SIZES[v.size || "A4"];
            if (v.orient === "landscape") [W, H] = [H, W];
            const sp = (+v.spacing || 8) * MM;
            const col = hexRgb(v.color || "#93c5fd");
            for (let i = 0; i < Math.max(1, Math.min(500, +v.pages || 1)); i++) {
              const p = doc.addPage([W, H]);
              if ((v.paper || "#ffffff").toLowerCase() !== "#ffffff") p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: hexRgb(v.paper) });
              const top = H - 22 * MM;
              if (v.style === "lined" || v.style === "cornell") {
                for (let y = top; y > 15 * MM; y -= sp) p.drawLine({ start: { x: 12 * MM, y }, end: { x: W - 12 * MM, y }, thickness: 0.5, color: col });
                if (v.margin || v.style === "cornell") p.drawLine({ start: { x: (v.style === "cornell" ? 62 : 28) * MM, y: H }, end: { x: (v.style === "cornell" ? 62 : 28) * MM, y: v.style === "cornell" ? 50 * MM : 0 }, thickness: 0.8, color: v.style === "cornell" ? col : rgb(0.94, 0.45, 0.45) });
                if (v.style === "cornell") p.drawRectangle({ x: 12 * MM, y: 12 * MM, width: W - 24 * MM, height: 38 * MM, color: hexRgb(v.paper || "#ffffff"), borderColor: col, borderWidth: 0.8 });
              }
              if (v.style === "grid") {
                for (let x = 10 * MM; x < W - 10 * MM + 1; x += sp) p.drawLine({ start: { x, y: 10 * MM }, end: { x, y: H - 10 * MM }, thickness: 0.35, color: col });
                for (let y = 10 * MM; y < H - 10 * MM + 1; y += sp) p.drawLine({ start: { x: 10 * MM, y }, end: { x: W - 10 * MM, y }, thickness: 0.35, color: col });
              }
              if (v.style === "dots") for (let x = 10 * MM; x < W - 10 * MM; x += sp) for (let y = 10 * MM; y < H - 10 * MM; y += sp) p.drawCircle({ x, y, size: 0.6, color: col });
              if (v.style === "music") {
                let y = top;
                while (y > 25 * MM) {
                  for (let k = 0; k < 5; k++) p.drawLine({ start: { x: 15 * MM, y: y - k * 2 * MM }, end: { x: W - 15 * MM, y: y - k * 2 * MM }, thickness: 0.6, color: col });
                  y -= 8 * 2 * MM + sp * 1.5;
                }
              }
            }
            return doc;
          },
          async run(ctx) {
            const doc = await this.make(ctx.values);
            return { files: [{ name: `${ctx.values.style}-paper-${ctx.values.size}.pdf`, blob: await saveDoc(doc) }] };
          }
        },
        "pdf-templates": {
          noFile: true,
          view: "custom",
          viewTitle: "Preview",
          action: "Create PDF",
          actionIcon: "layout-template",
          options: [
            { key: "tpl", type: "cards", label: "Template", default: "invoice", options: [["invoice", "Invoice / Bill", "with GST"], ["certificate", "Certificate"], ["resume", "Resume / CV"], ["letter", "Letter"]] },
            { key: "accent", type: "color", label: "Accent colour", default: "#4f46e5", swatches: ["#4f46e5", "#0f766e", "#b45309", "#be123c", "#1d4ed8", "#111827"] },
            // invoice
            ...[["business", "Your business name", "Sharma Traders"], ["address", "Your address", ""], ["gstin", "GSTIN (optional)", ""], ["number", "Invoice number", "INV-001"], ["date", "Invoice date", ""], ["due", "Due date", ""], ["client", "Bill to (client)", ""], ["clientAddr", "Client address", ""]].map(([key, label, ph]) => ({ key, type: key.includes("ddr") || key === "address" ? "textarea" : "text", rows: 2, label, placeholder: ph, show: (v) => v.tpl === "invoice" })),
            { key: "items", type: "list", label: "Items", addLabel: "Add item", default: () => [{ desc: "Item 1", qty: 1, rate: 1e3 }], fields: [{ key: "desc", placeholder: "Description" }, { key: "qty", type: "number", placeholder: "Qty", width: "64px", default: 1 }, { key: "rate", type: "number", placeholder: "Rate", width: "84px", default: 0 }], show: (v) => v.tpl === "invoice" },
            { key: "currency", type: "seg", label: "Currency", default: "\u20B9", options: [["\u20B9", "\u20B9"], ["Rs. ", "Rs."], ["$", "$"], ["\u20AC", "\u20AC"]], show: (v) => v.tpl === "invoice" },
            { key: "tax", type: "number", label: "GST / Tax %", default: 18, show: (v) => v.tpl === "invoice" },
            { key: "notes", type: "textarea", rows: 2, label: "Notes / bank details", show: (v) => v.tpl === "invoice" },
            // certificate
            ...[["ctitle", "Certificate title", "Certificate of Achievement"], ["recipient", "Recipient name", ""], ["reason", "Awarded for", "for outstanding performance in the Annual Science Fair 2026"], ["cdate", "Date", ""], ["signer", "Signed by", ""], ["signerTitle", "Signer\u2019s title", "Principal"]].map(([key, label, d]) => ({ key, type: "text", label, default: d, show: (v) => v.tpl === "certificate" })),
            // resume
            ...[["rname", "Full name"], ["rtitle", "Job title"], ["email", "Email"], ["phone", "Phone"], ["city", "City"]].map(([key, label]) => ({ key, type: "text", label, show: (v) => v.tpl === "resume" })),
            { key: "summary", type: "textarea", rows: 3, label: "Profile summary", show: (v) => v.tpl === "resume" },
            { key: "experience", type: "list", label: "Experience", addLabel: "Add job", default: () => [{ role: "", org: "", years: "", what: "" }], fields: [{ key: "role", placeholder: "Role" }, { key: "org", placeholder: "Company" }, { key: "years", placeholder: "Years", width: "80px" }], show: (v) => v.tpl === "resume" },
            { key: "education", type: "list", label: "Education", addLabel: "Add education", default: () => [{ degree: "", school: "", year: "" }], fields: [{ key: "degree", placeholder: "Degree" }, { key: "school", placeholder: "School / College" }, { key: "year", placeholder: "Year", width: "70px" }], show: (v) => v.tpl === "resume" },
            { key: "skills", type: "text", label: "Skills (comma separated)", show: (v) => v.tpl === "resume" },
            // letter
            { key: "from", type: "textarea", rows: 2, label: "From (your name & address)", show: (v) => v.tpl === "letter" },
            { key: "to", type: "textarea", rows: 3, label: "To", show: (v) => v.tpl === "letter" },
            { key: "ldate", type: "text", label: "Date", show: (v) => v.tpl === "letter" },
            { key: "subject", type: "text", label: "Subject", show: (v) => v.tpl === "letter" },
            { key: "body", type: "textarea", rows: 8, label: "Letter", show: (v) => v.tpl === "letter" },
            { key: "closing", type: "text", label: "Closing", default: "Yours sincerely,", show: (v) => v.tpl === "letter" },
            { key: "signname", type: "text", label: "Your name", show: (v) => v.tpl === "letter" }
          ],
          onOption(ctx, k) {
            clearTimeout(ctx.state.t);
            ctx.state.t = setTimeout(() => ctx.refreshView(), k === "tpl" ? 0 : 600);
            if (k === "tpl") {
              ctx.values.accent = { invoice: "#4f46e5", certificate: "#b45309", resume: "#0f766e", letter: "#111827" }[ctx.values.tpl];
              ctx.refreshOptions();
            }
          },
          async renderView(body, ctx) {
            const { PDFDocument } = await PL();
            const doc = await PDFDocument.create();
            await TEMPLATES[ctx.values.tpl || "invoice"](doc, ctx.values);
            const pdf = await openPdf(await doc.save());
            const w = Math.min(620, body.clientWidth - 30);
            const c = await renderPage(pdf, 1, { width: w * 2 });
            c.style.width = w + "px";
            c.style.boxShadow = "var(--shadow)";
            body.replaceChildren(h("div", { style: { display: "flex", justifyContent: "center" } }, c));
          },
          async run(ctx) {
            const { PDFDocument } = await PL();
            const doc = await PDFDocument.create();
            doc.setTitle(ctx.values.tpl);
            await TEMPLATES[ctx.values.tpl](doc, ctx.values);
            return { files: [{ name: `${ctx.values.tpl}${ctx.values.number ? "-" + ctx.values.number : ""}.pdf`, blob: await saveDoc(doc) }] };
          }
        }
      };
    }
  });

  // js/tools/extract.js
  var extract_exports = {};
  __export(extract_exports, {
    default: () => extract_default,
    walkFonts: () => walkFonts
  });
  async function walkFonts(doc) {
    const P = await PL();
    const N = (n) => P.PDFName.of(n);
    const ctx = doc.context;
    const fonts = /* @__PURE__ */ new Map();
    const seenRes = /* @__PURE__ */ new Set();
    const visitRes = (res, page) => {
      res = ctx.lookup(res);
      if (!(res instanceof P.PDFDict)) return;
      const fd = ctx.lookup(res.get(N("Font")));
      if (fd instanceof P.PDFDict) for (const [, ref] of fd.entries()) {
        const key = ref instanceof P.PDFRef ? ref.tag : Math.random();
        const f = ctx.lookup(ref);
        if (!(f instanceof P.PDFDict)) continue;
        if (!fonts.has(key)) {
          let base = String(f.get(N("BaseFont")) || "").replace(/^\//, "");
          const sub = String(f.get(N("Subtype")) || "").replace(/^\//, "");
          let desc = ctx.lookup(f.get(N("FontDescriptor")));
          if (!desc && sub === "Type0") {
            const df = ctx.lookup(ctx.lookup(f.get(N("DescendantFonts")))?.get?.(0));
            desc = ctx.lookup(df?.get?.(N("FontDescriptor")));
          }
          const embedded = !!(desc && (desc.get(N("FontFile")) || desc.get(N("FontFile2")) || desc.get(N("FontFile3"))));
          const enc = f.get(N("Encoding"));
          fonts.set(key, { name: base.replace(/^[A-Z]{6}\+/, "") || "(unnamed)", subset: /^[A-Z]{6}\+/.test(base), type: sub, embedded: sub === "Type3" || embedded, encoding: enc instanceof P.PDFName ? String(enc).slice(1) : enc ? "Custom" : "Built-in", pages: /* @__PURE__ */ new Set() });
        }
        fonts.get(key).pages.add(page);
      }
      const xo = ctx.lookup(res.get(N("XObject")));
      if (xo instanceof P.PDFDict) for (const [, ref] of xo.entries()) {
        if (ref instanceof P.PDFRef && seenRes.has(ref.tag)) continue;
        if (ref instanceof P.PDFRef) seenRes.add(ref.tag);
        const x = ctx.lookup(ref);
        if (String(x?.dict?.get(N("Subtype"))) === "/Form") visitRes(x.dict.get(N("Resources")), page);
      }
    };
    doc.getPages().forEach((p, i) => visitRes(p.node.Resources(), i + 1));
    return [...fonts.values()];
  }
  async function pageImages(pdf, i, minSize) {
    const pdfjs = await lib("pdfjs");
    const page = await pdf.getPage(i);
    const ops = await page.getOperatorList();
    const out = [];
    const want = new Set([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintImageXObjectRepeat, pdfjs.OPS.paintJpegXObject].filter(Boolean));
    for (let k = 0; k < ops.fnArray.length; k++) {
      if (!want.has(ops.fnArray[k])) continue;
      const name = ops.argsArray[k][0];
      const store2 = String(name).startsWith("g_") ? page.commonObjs : page.objs;
      const img = await new Promise((r) => {
        try {
          store2.get(name, r);
        } catch {
          r(null);
        }
        setTimeout(() => r(null), 5e3);
      });
      if (!img || img.width < minSize && img.height < minSize) continue;
      out.push({ name, img });
    }
    return out;
  }
  function imgToCanvas(img) {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const x = c.getContext("2d");
    if (img.bitmap) {
      x.drawImage(img.bitmap, 0, 0);
      return c;
    }
    if (img instanceof HTMLImageElement || img instanceof ImageBitmap) {
      x.drawImage(img, 0, 0);
      return c;
    }
    const id = x.createImageData(img.width, img.height);
    const d = img.data;
    const n = img.width * img.height;
    if (img.kind === 3 || d.length === n * 4) id.data.set(d.subarray(0, n * 4));
    else if (img.kind === 2 || d.length === n * 3) for (let i = 0, j = 0; i < n; i++) {
      id.data[j++] = d[i * 3];
      id.data[j++] = d[i * 3 + 1];
      id.data[j++] = d[i * 3 + 2];
      id.data[j++] = 255;
    }
    else {
      const rowBytes = Math.ceil(img.width / 8);
      for (let y = 0; y < img.height; y++) for (let x2 = 0; x2 < img.width; x2++) {
        const bit = d[y * rowBytes + (x2 >> 3)] >> 7 - (x2 & 7) & 1;
        const v = bit ? 255 : 0;
        const o = (y * img.width + x2) * 4;
        id.data[o] = id.data[o + 1] = id.data[o + 2] = v;
        id.data[o + 3] = 255;
      }
    }
    x.putImageData(id, 0, 0);
    return c;
  }
  function namedSize(w, hh) {
    const s = [[595, 842, "A4"], [612, 792, "Letter"], [612, 1008, "Legal"], [420, 595, "A5"], [842, 1191, "A3"]];
    for (const [a, b, n] of s) if (Math.abs(w - a) < 4 && Math.abs(hh - b) < 4 || Math.abs(w - b) < 4 && Math.abs(hh - a) < 4) return ` \xB7 ${n}${w > hh ? " landscape" : ""}`;
    return "";
  }
  var table, csvFile, extract_default;
  var init_extract = __esm({
    "js/tools/extract.js"() {
      init_pdf();
      init_lib();
      init_ui();
      init_htmlpdf();
      init_common();
      init_convert_from();
      table = (head, rows) => h("div.report-wrap", h("table.report", h("thead", h("tr", head.map((c) => h("th", esc(c))))), h("tbody", rows.map((r) => h("tr", r.map((c) => h("td", c instanceof Node ? c : esc(String(c ?? "")))))))));
      csvFile = (name, head, rows) => ({ name, blob: new Blob(["\uFEFF" + toCSV([head, ...rows.map((r) => r.map(String))])], { type: "text/csv;charset=utf-8" }) });
      extract_default = {
        "pdf-viewer": {
          accept: "pdf",
          view: "custom",
          action: "Open in new tab",
          actionIcon: "external-link",
          noOptionsText: "Use the toolbar above the pages to zoom and search. Press the button below to open the PDF in your browser\u2019s own viewer for printing.",
          options: [],
          renderView(body, ctx, bar) {
            let zoom = 1;
            let pdf;
            const wrap2 = h("div.viewer-pages");
            const info = h("span", { style: { fontSize: ".8rem", color: "var(--text-3)" } });
            const search = h("input.option-input", { type: "search", placeholder: "Search in PDF\u2026", style: { minHeight: "34px", width: "160px", padding: ".3rem .6rem" }, "aria-label": "Search text" });
            const draw = async () => {
              wrap2.innerHTML = "";
              pdf || (pdf = await ctx.pdf());
              const w = Math.min(1100, body.clientWidth - 30) * zoom;
              for (let i = 1; i <= pdf.numPages; i++) {
                const slot = h("div", { "data-p": i, style: { width: w + "px", maxWidth: "100%", minHeight: "200px", position: "relative" } });
                wrap2.appendChild(slot);
                slot._load = async () => {
                  const c = await renderPage(pdf, i, { width: w * Math.min(2, devicePixelRatio || 1) });
                  c.style.width = "100%";
                  slot.innerHTML = "";
                  slot.style.minHeight = "";
                  slot.appendChild(c);
                  slot.appendChild(h("div", { style: { textAlign: "center", fontSize: ".75rem", color: "var(--text-3)", marginTop: ".3rem" } }, `${i} / ${pdf.numPages}`));
                };
                io.observe(slot);
              }
            };
            const io = new IntersectionObserver((es) => es.forEach((e) => {
              if (e.isIntersecting) {
                io.unobserve(e.target);
                e.target._load();
              }
            }), { root: body, rootMargin: "600px" });
            const doSearch = async () => {
              const q = search.value.trim();
              if (!q) return;
              pdf || (pdf = await ctx.pdf());
              for (let i = 1; i <= pdf.numPages; i++) {
                const { items } = await pageText(pdf, i);
                if (items.some((it) => it.str.toLowerCase().includes(q.toLowerCase()))) {
                  wrap2.querySelector(`[data-p="${i}"]`)?.scrollIntoView({ behavior: "smooth" });
                  info.textContent = `Found on page ${i}`;
                  return;
                }
              }
              info.textContent = "Not found";
            };
            search.addEventListener("keydown", (e) => {
              if (e.key === "Enter") doSearch();
            });
            bar.append(h("div.sel-tools.extra", search, h("button.mini-btn.icon-only", { type: "button", "aria-label": "Zoom out", on: { click: () => {
              zoom = Math.max(0.4, zoom - 0.2);
              draw();
            } } }, ic("zoom-out")), h("button.mini-btn.icon-only", { type: "button", "aria-label": "Zoom in", on: { click: () => {
              zoom = Math.min(3, zoom + 0.2);
              draw();
            } } }, ic("zoom-in")), info));
            body.style.maxHeight = "80vh";
            body.appendChild(wrap2);
            draw();
          },
          async run(ctx) {
            const url = URL.createObjectURL(new Blob([ctx.files[0].bytes], { type: "application/pdf" }));
            window.open(url, "_blank", "noopener");
            return null;
          }
        },
        "extract-text": { ...convert_from_default["pdf-to-text"] },
        "extract-tables": { ...convert_from_default["pdf-to-csv"], action: "Find tables", run: (ctx) => tablesRun(ctx) },
        "extract-images": {
          accept: "pdf",
          view: "thumbs",
          action: "Extract images",
          actionIcon: "images",
          options: [{ key: "format", type: "seg", label: "Save as", default: "png", options: [["png", "PNG (lossless)"], ["jpg", "JPG (smaller)"]] }, { key: "min", type: "select", label: "Skip small images (icons, lines)", default: "64", options: [["0", "Keep all"], ["64", "Smaller than 64 px"], ["200", "Smaller than 200 px"]] }, { key: "pages", type: "pages", label: "Pages (optional)" }],
          async run(ctx) {
            const pdf = await ctx.pdf();
            const files = [];
            const seen = /* @__PURE__ */ new Set();
            const idx = parsePages(ctx.values.pages, pdf.numPages);
            for (const i of idx) {
              ctx.progress(files.length ? i / pdf.numPages : i / pdf.numPages, `Scanning page ${i + 1}`);
              for (const { name, img } of await pageImages(pdf, i + 1, +ctx.values.min)) {
                const key = String(name).startsWith("g_") ? name : `${i}-${name}`;
                if (seen.has(key)) continue;
                seen.add(key);
                const c = imgToCanvas(img);
                const ext = ctx.values.format;
                files.push({ name: outName(ctx, `p${i + 1}-img${files.length + 1}`, ext), blob: await canvasBlob(c, ext === "jpg" ? "image/jpeg" : "image/png", 0.92) });
              }
              await nextFrame();
            }
            if (!files.length) throw new Error("No images were found in this PDF.");
            const gal = h("div.gallery", files.slice(0, 30).map((f) => {
              const u = URL.createObjectURL(f.blob);
              return h("a", { href: u, download: f.name }, h("img", { src: u, alt: "", loading: "lazy" }), esc(f.name));
            }));
            return { files, zipName: outName(ctx, "images", "zip"), message: `${files.length} image${files.length > 1 ? "s" : ""} found.`, html: gal };
          }
        },
        "extract-links": {
          accept: "pdf",
          view: "thumbs",
          action: "Find links",
          actionIcon: "link-2",
          options: [{ key: "text", type: "check", label: "Also find web addresses written in the text", default: true }],
          async run(ctx) {
            const pdf = await ctx.pdf();
            const rows = [];
            const seen = /* @__PURE__ */ new Set();
            for (let i = 1; i <= pdf.numPages; i++) {
              ctx.progress(i / pdf.numPages, `Reading page ${i}`);
              const page = await pdf.getPage(i);
              for (const a of await page.getAnnotations()) if (a.subtype === "Link") {
                const t2 = a.url || a.unsafeUrl || (a.dest ? "Internal: jump to page" : a.action || "");
                if (t2) {
                  rows.push([i, "Link", t2]);
                  seen.add(i + t2);
                }
              }
              if (ctx.values.text) {
                const { items } = await pageText(pdf, i);
                const txt = toLines(items).map((l) => l.text).join("\n");
                for (const m of txt.matchAll(/\b(?:https?:\/\/|www\.)[^\s<>"')\]]+|[\w.+-]+@[\w-]+\.[\w.]+/gi)) {
                  const u = m[0].replace(/[.,;:]$/, "");
                  if (!seen.has(i + u)) {
                    rows.push([i, u.includes("@") && !u.startsWith("http") ? "Email (text)" : "URL (text)", u]);
                    seen.add(i + u);
                  }
                }
              }
            }
            if (!rows.length) throw new Error("No links were found.");
            return { files: [csvFile(outName(ctx, "links", "csv"), ["Page", "Type", "Link"], rows)], message: `${rows.length} link${rows.length > 1 ? "s" : ""} found.`, html: table(["Page", "Type", "Link"], rows.slice(0, 400).map((r) => [r[0], r[1], /^(https?:|www\.)/.test(r[2]) ? h("a", { href: /^www\./.test(r[2]) ? "https://" + r[2] : r[2], target: "_blank", rel: "noopener noreferrer" }, esc(r[2])) : r[2]])) };
          }
        },
        "extract-fonts": {
          accept: "pdf",
          view: "none",
          action: "List fonts",
          actionIcon: "case-sensitive",
          options: [],
          async run(ctx) {
            const fonts = await walkFonts(await loadDoc(ctx.files[0].bytes));
            if (!fonts.length) throw new Error("No fonts found \u2014 this PDF may be scanned images only.");
            const rows = fonts.map((f) => [f.name, f.type, f.embedded ? f.subset ? "Embedded subset" : "Embedded" : "Not embedded", f.encoding, [...f.pages].slice(0, 12).join(", ") + (f.pages.size > 12 ? "\u2026" : "")]);
            const missing = fonts.filter((f) => !f.embedded).length;
            return { files: [csvFile(outName(ctx, "fonts", "csv"), ["Font", "Type", "Embedding", "Encoding", "Pages"], rows)], message: `${fonts.length} font${fonts.length > 1 ? "s" : ""}${missing ? ` \xB7 ${missing} not embedded (may look different on other devices)` : " \xB7 all embedded"}.`, html: table(["Font", "Type", "Embedding", "Encoding", "Pages"], rows) };
          }
        },
        "extract-attachments": {
          accept: "pdf",
          view: "none",
          action: "Extract attachments",
          actionIcon: "paperclip",
          options: [],
          async run(ctx) {
            const pdf = await ctx.pdf();
            const files = [];
            const att = await pdf.getAttachments() || {};
            for (const a of Object.values(att)) files.push({ name: a.filename || "attachment", blob: new Blob([a.content]) });
            for (let i = 1; i <= pdf.numPages; i++) for (const a of await (await pdf.getPage(i)).getAnnotations()) if (a.subtype === "FileAttachment" && a.file) files.push({ name: a.file.filename || `attachment-p${i}`, blob: new Blob([a.file.content]) });
            if (!files.length) throw new Error("This PDF has no attachments.");
            return { files, zipName: outName(ctx, "attachments", "zip"), html: table(["File", "Size"], files.map((f) => [f.name, fmtBytes(f.blob.size)])) };
          }
        },
        "extract-metadata": {
          accept: "pdf",
          view: "none",
          action: "Show metadata",
          actionIcon: "info",
          options: [],
          async run(ctx) {
            const pdf = await ctx.pdf();
            const { info = {}, metadata } = await pdf.getMetadata().catch(() => ({}));
            const fmt2 = (v) => typeof v === "string" && /^D:\d{8}/.test(v) ? `${v.slice(2, 6)}-${v.slice(6, 8)}-${v.slice(8, 10)} ${v.slice(10, 12)}:${v.slice(12, 14)}` : typeof v === "object" ? JSON.stringify(v) : String(v);
            const rows = Object.entries(info).filter(([k]) => k !== "Custom").map(([k, v]) => [k, fmt2(v)]);
            Object.entries(info.Custom || {}).forEach(([k, v]) => rows.push([`Custom: ${k}`, fmt2(v)]));
            const xmp = metadata?.getAll?.() || {};
            Object.entries(xmp).forEach(([k, v]) => rows.push([`XMP ${k}`, fmt2(v)]));
            return { files: [{ name: outName(ctx, "metadata", "json"), blob: new Blob([JSON.stringify({ info, xmp }, null, 2)], { type: "application/json" }) }], message: "Want to change it? Use Edit Metadata or Sanitize PDF.", html: table(["Property", "Value"], rows) };
          }
        },
        "word-counter": {
          accept: "pdf",
          view: "none",
          action: "Count",
          actionIcon: "calculator",
          options: [],
          async run(ctx) {
            const pdf = await ctx.pdf();
            const per = [];
            let words2 = 0, chars = 0, charsNs = 0;
            for (let i = 1; i <= pdf.numPages; i++) {
              ctx.progress(i / pdf.numPages, `Counting page ${i}`);
              const t2 = toLines((await pageText(pdf, i)).items).map((l) => l.text).join("\n");
              const w = (t2.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’-]*/gu) || []).length;
              words2 += w;
              chars += t2.length;
              charsNs += t2.replace(/\s/g, "").length;
              per.push([i, w, t2.length]);
            }
            const stats = [["Pages", pdf.numPages], ["Words", words2.toLocaleString()], ["Characters", chars.toLocaleString()], ["Characters (no spaces)", charsNs.toLocaleString()], ["Reading time", `${Math.max(1, Math.round(words2 / 220))} min`], ["Speaking time", `${Math.max(1, Math.round(words2 / 130))} min`], ["Average words per page", Math.round(words2 / pdf.numPages)]];
            return { title: `${words2.toLocaleString()} words`, message: words2 ? `${pdf.numPages} pages` : "No text found \u2014 this looks like a scanned PDF (use OCR PDF first).", files: [csvFile(outName(ctx, "word-count", "csv"), ["Page", "Words", "Characters"], per)], html: h("div", table(["Statistic", "Value"], stats), h("h4", { style: { margin: "1.25rem 0 .5rem" } }, "Per page"), table(["Page", "Words", "Characters"], per)) };
          }
        },
        "pdf-inspector": {
          accept: "pdf",
          view: "none",
          action: "Inspect",
          actionIcon: "search-code",
          options: [],
          async run(ctx) {
            const P = await PL();
            const N = (n) => P.PDFName.of(n);
            const f = ctx.files[0];
            const pdf = await ctx.pdf();
            const doc = await loadDoc(f.bytes);
            const head = new TextDecoder("latin1").decode(f.bytes.slice(0, 1024));
            const version = (head.match(/%PDF-(\d\.\d)/) || [])[1] || "?";
            const sizes = {};
            doc.getPages().forEach((p) => {
              const { width: w, height: hh } = p.getSize();
              const k = `${Math.round(w * 25.4 / 72)} \xD7 ${Math.round(hh * 25.4 / 72)} mm${namedSize(w, hh)}`;
              sizes[k] = (sizes[k] || 0) + 1;
            });
            let annots = 0, links = 0;
            doc.getPages().forEach((p) => {
              const a = p.node.lookup(N("Annots"));
              if (a instanceof P.PDFArray) {
                annots += a.size();
                a.asArray().forEach((r) => {
                  if (String(doc.context.lookup(r)?.get?.(N("Subtype"))) === "/Link") links++;
                });
              }
            });
            let fields = 0;
            try {
              fields = doc.getForm().getFields().length;
            } catch {
            }
            const images = doc.context.enumerateIndirectObjects().filter(([, o]) => String(o?.dict?.get?.(N("Subtype"))) === "/Image").length;
            const fonts = await walkFonts(doc);
            const att = Object.keys(await pdf.getAttachments() || {}).length;
            const outline = (await pdf.getOutline().catch(() => null))?.length || 0;
            const names = doc.catalog.lookup(N("Names"));
            const js = !!(names instanceof P.PDFDict && names.get(N("JavaScript"))) || !!doc.catalog.get(N("OpenAction"));
            const tagged = String(doc.catalog.lookup(N("MarkInfo"))?.get?.(N("Marked"))) === "true" || !!doc.catalog.get(N("StructTreeRoot"));
            const meta = await pdf.getMetadata().catch(() => ({}));
            const xmp = meta.metadata?.getAll?.() || {};
            const pdfa = xmp["pdfaid:part"] ? `PDF/A-${xmp["pdfaid:part"]}${(xmp["pdfaid:conformance"] || "").toLowerCase()}` : "No";
            let textPages = 0;
            for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) if ((await pageText(pdf, i)).items.length) textPages++;
            const rows = [
              ["File size", fmtBytes(f.size)],
              ["PDF version", version],
              ["Pages", pdf.numPages],
              ["Page sizes", Object.entries(sizes).map(([k, v]) => `${k} (${v})`).join("; ")],
              ["Password / encryption", f.encrypted ? "Yes (unlocked for inspection)" : "No"],
              ["Title", meta.info?.Title || "\u2014"],
              ["Author", meta.info?.Author || "\u2014"],
              ["Created with", [meta.info?.Creator, meta.info?.Producer].filter(Boolean).join(" / ") || "\u2014"],
              ["Contains text", textPages ? "Yes" : "No \u2014 looks scanned (use OCR)"],
              ["Fonts", `${fonts.length} (${fonts.filter((x) => !x.embedded).length} not embedded)`],
              ["Images", images],
              ["Form fields", fields],
              ["Annotations", `${annots} (${links} links)`],
              ["Bookmarks", outline ? "Yes" : "No"],
              ["Attachments", att],
              ["JavaScript", js ? "Yes \u26A0\uFE0F" : "No"],
              ["Tagged (accessible)", tagged ? "Yes" : "No"],
              ["PDF/A", pdfa],
              ["Fast web view", /\/Linearized/.test(head) ? "Yes" : "No"],
              ["Layers", (await pdf.getOptionalContentConfig().catch(() => null))?.getGroups?.() ? "Yes" : "No"]
            ];
            return { title: "Inspection report", message: f.name, files: [{ name: outName(ctx, "report", "json"), blob: new Blob([JSON.stringify(Object.fromEntries(rows), null, 2)], { type: "application/json" }) }], html: table(["Property", "Value"], rows) };
          }
        }
      };
    }
  });

  // js/tools/compare.js
  var compare_exports = {};
  __export(compare_exports, {
    default: () => compare_default
  });
  function diffWords(a, b) {
    const n = a.length, m = b.length;
    if (n * m > 6e6) return [{ t: "del", w: a.join(" ") }, { t: "ins", w: b.join(" ") }];
    let s = 0;
    while (s < n && s < m && a[s] === b[s]) s++;
    let e = 0;
    while (e < n - s && e < m - s && a[n - 1 - e] === b[m - 1 - e]) e++;
    const A = a.slice(s, n - e), B = b.slice(s, m - e);
    const N = A.length, M = B.length;
    const dp = Array.from({ length: N + 1 }, () => new Uint16Array(M + 1));
    for (let i2 = N - 1; i2 >= 0; i2--) for (let j2 = M - 1; j2 >= 0; j2--) dp[i2][j2] = A[i2] === B[j2] ? dp[i2 + 1][j2 + 1] + 1 : Math.max(dp[i2 + 1][j2], dp[i2][j2 + 1]);
    const out = a.slice(0, s).map((w) => ({ t: "eq", w }));
    let i = 0, j = 0;
    while (i < N && j < M) {
      if (A[i] === B[j]) {
        out.push({ t: "eq", w: A[i] });
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ t: "del", w: A[i++] });
      else out.push({ t: "ins", w: B[j++] });
    }
    while (i < N) out.push({ t: "del", w: A[i++] });
    while (j < M) out.push({ t: "ins", w: B[j++] });
    a.slice(n - e).forEach((w) => out.push({ t: "eq", w }));
    return out;
  }
  var words, compare_default;
  var init_compare = __esm({
    "js/tools/compare.js"() {
      init_pdf();
      init_ui();
      init_htmlpdf();
      init_extract();
      words = async (pdf, i) => i <= pdf.numPages ? toLines((await pageText(pdf, i)).items).map((l) => l.text).join(" ").split(/\s+/).filter(Boolean) : [];
      compare_default = {
        "compare-pdf": {
          accept: "pdf",
          multiple: true,
          min: 2,
          minMsg: "Add the 2 PDFs you want to compare",
          view: "files",
          action: "Compare",
          actionIcon: "git-compare",
          uploadTitle: "Select 2 PDF versions",
          options: [{ key: "mode", type: "cards", label: "Compare", default: "text", options: [["text", "Text changes", "words added / removed"], ["visual", "Visual changes", "highlight pixel differences"]] }, { type: "info", html: "The first file is the <b>original</b>, the second is the <b>new version</b>. Drag to swap." }],
          async run(ctx) {
            const A = await ctx.pdf(0), B = await ctx.pdf(1);
            const pages = Math.max(A.numPages, B.numPages);
            if (ctx.values.mode === "visual") {
              const { PDFDocument, rgb } = await PL();
              const out = await PDFDocument.create();
              let changedPages = 0;
              const thumbs = [];
              for (let i = 1; i <= pages; i++) {
                ctx.progress(i / pages, `Comparing page ${i}`);
                const ca = i <= A.numPages ? await renderPage(A, i, { dpi: 100 }) : null, cb = i <= B.numPages ? await renderPage(B, i, { dpi: 100 }) : null;
                const W = Math.max(ca?.width || 0, cb?.width || 0), H = Math.max(ca?.height || 0, cb?.height || 0);
                const c = document.createElement("canvas");
                c.width = W;
                c.height = H;
                const x = c.getContext("2d");
                x.fillStyle = "#fff";
                x.fillRect(0, 0, W, H);
                const da = ca?.getContext("2d").getImageData(0, 0, W, H).data, db = cb?.getContext("2d").getImageData(0, 0, W, H).data;
                const id = x.createImageData(W, H);
                let diff = 0;
                for (let k = 0; k < W * H * 4; k += 4) {
                  const la = da ? (da[k] + da[k + 1] + da[k + 2]) / 3 : 255, lb = db ? (db[k] + db[k + 1] + db[k + 2]) / 3 : 255;
                  if (Math.abs(la - lb) > 40) {
                    diff++;
                    if (lb < la) {
                      id.data[k] = 22;
                      id.data[k + 1] = 163;
                      id.data[k + 2] = 74;
                    } else {
                      id.data[k] = 220;
                      id.data[k + 1] = 38;
                      id.data[k + 2] = 38;
                    }
                    id.data[k + 3] = 255;
                  } else {
                    const g = 255 - (255 - Math.min(la, lb)) * 0.25;
                    id.data[k] = id.data[k + 1] = id.data[k + 2] = g;
                    id.data[k + 3] = 255;
                  }
                }
                x.putImageData(id, 0, 0);
                if (diff > 20) changedPages++;
                const img = await out.embedJpg(await canvasBytes(c, "image/jpeg", 0.8));
                const pw = W * 0.72, ph = H * 0.72;
                const p = out.addPage([pw, ph + 30]);
                p.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
                p.drawText(`Page ${i} \u2014 ${diff > 20 ? "changed" : "no visible change"}   (green = added, red = removed)`, { x: 10, y: ph + 10, size: 10, color: rgb(0.2, 0.2, 0.2) });
                if (thumbs.length < 12 && diff > 20) thumbs.push(c.toDataURL("image/jpeg", 0.7));
                await nextFrame();
              }
              return { title: changedPages ? `${changedPages} page${changedPages > 1 ? "s" : ""} changed` : "No visible differences", files: [{ name: "comparison-report.pdf", blob: await saveDoc(out) }], html: h("div.gallery", thumbs.map((u) => h("a", { href: u, target: "_blank" }, h("img", { src: u, alt: "Difference" })))) };
            }
            let ins = 0, del = 0;
            const sections = [];
            for (let i = 1; i <= pages; i++) {
              ctx.progress(i / pages, `Comparing page ${i}`);
              const d = diffWords(await words(A, i), await words(B, i));
              const ci = d.filter((x) => x.t === "ins").length, cd = d.filter((x) => x.t === "del").length;
              ins += ci;
              del += cd;
              if (ci || cd) sections.push(`<h4 style="margin:1rem 0 .4rem">Page ${i} <small style="color:#16a34a">+${ci}</small> <small style="color:#dc2626">\u2212${cd}</small></h4><div class="diff-txt">${d.map((x) => x.t === "eq" ? esc(x.w) : `<${x.t}>${esc(x.w)}</${x.t}>`).join(" ")}</div>`);
            }
            const html = sections.join("") || "<p>The text of both PDFs is identical.</p>";
            const report = `<!doctype html><meta charset="utf-8"><title>PDF comparison</title><style>body{font:15px/1.7 system-ui;max-width:900px;margin:2rem auto;padding:0 1rem}ins{background:#bbf7d0;text-decoration:none}del{background:#fecaca}</style><h2>${esc(ctx.files[0].name)} \u2192 ${esc(ctx.files[1].name)}</h2><p>${ins} words added, ${del} words removed.</p>${html}`;
            return { title: ins || del ? `${ins} added \xB7 ${del} removed` : "No text differences", message: "Green = added in the new version, red = removed.", files: [{ name: "comparison.html", blob: new Blob([report], { type: "text/html" }) }], html: h("div", { html, style: { maxHeight: "70vh", overflow: "auto" } }) };
          }
        },
        "side-by-side": {
          accept: "pdf",
          multiple: true,
          min: 2,
          minMsg: "Add 2 PDFs to view side by side",
          view: "custom",
          action: "Swap sides",
          actionIcon: "arrow-left-right",
          uploadTitle: "Select 2 PDFs",
          options: [{ key: "sync", type: "check", label: "Scroll both together", default: true }],
          async renderView(body, ctx) {
            body.style.maxHeight = "none";
            const panes = [h("div"), h("div")];
            body.appendChild(h("div.sbs", panes));
            if (ctx.files.length < 2) {
              panes[1].innerHTML = '<p style="padding:1rem;color:var(--text-3)">Add a second PDF using \u201CStart over\u201D.</p>';
            }
            for (let k = 0; k < Math.min(2, ctx.files.length); k++) {
              const f = ctx.files[k];
              const pdf = await ctx.pdf(k);
              panes[k].appendChild(h("div", { style: { fontSize: ".8rem", fontWeight: 700, marginBottom: ".5rem" } }, esc(f.name)));
              const list = h("div.viewer-pages");
              panes[k].appendChild(list);
              for (let i = 1; i <= Math.min(pdf.numPages, 200); i++) {
                const slot = h("div", { style: { width: "100%", minHeight: "120px" } });
                list.appendChild(slot);
                renderPage(pdf, i, { width: 700 }).then((c) => {
                  c.style.width = "100%";
                  slot.replaceChildren(c);
                });
              }
            }
            let lock = false;
            panes.forEach((p, k) => p.addEventListener("scroll", () => {
              if (!ctx.values.sync || lock) return;
              lock = true;
              const o = panes[1 - k];
              o.scrollTop = p.scrollTop / Math.max(1, p.scrollHeight - p.clientHeight) * (o.scrollHeight - o.clientHeight);
              requestAnimationFrame(() => lock = false);
            }));
          },
          async run(ctx) {
            ctx.files.reverse();
            await ctx.refreshView();
            return null;
          }
        },
        "export-comments": {
          accept: "pdf",
          view: "thumbs",
          action: "Export comments",
          actionIcon: "message-square-text",
          options: [{ key: "format", type: "seg", label: "Format", default: "csv", options: [["csv", "CSV (Excel)"], ["txt", "Text summary"]] }],
          async run(ctx) {
            const pdf = await ctx.pdf();
            const rows = [];
            const skip = /* @__PURE__ */ new Set(["Link", "Widget", "Popup"]);
            for (let i = 1; i <= pdf.numPages; i++) {
              ctx.progress(i / pdf.numPages, `Reading page ${i}`);
              const page = await pdf.getPage(i);
              const annots = (await page.getAnnotations()).filter((a) => !skip.has(a.subtype));
              if (!annots.length) continue;
              const { items } = await pageText(pdf, i);
              const vp = page.getViewport({ scale: 1 });
              for (const a of annots) {
                let marked = "";
                if (a.quadPoints?.length || ["Highlight", "Underline", "StrikeOut", "Squiggly"].includes(a.subtype)) {
                  const [x1, y1] = vp.convertToViewportPoint(a.rect[0], a.rect[3]), [x2, y2] = vp.convertToViewportPoint(a.rect[2], a.rect[1]);
                  marked = items.filter((it) => it.x + it.w / 2 >= Math.min(x1, x2) - 2 && it.x + it.w / 2 <= Math.max(x1, x2) + 2 && it.y - it.size / 2 >= Math.min(y1, y2) - 2 && it.y - it.size / 2 <= Math.max(y1, y2) + 2).map((it) => it.str).join(" ").trim();
                }
                const date = a.modificationDate ? String(a.modificationDate).replace(/^D:(\d{4})(\d\d)(\d\d)(\d\d)?(\d\d)?.*/, "$1-$2-$3 $4:$5").replace(/ :$/, "") : "";
                rows.push([i, a.subtype, a.titleObj?.str || a.title || "", date, a.contentsObj?.str || a.contents || "", marked]);
              }
            }
            if (!rows.length) throw new Error("This PDF has no comments or highlights.");
            const head = ["Page", "Type", "Author", "Date", "Comment", "Marked text"];
            const blob = ctx.values.format === "csv" ? new Blob(["\uFEFF" + toCSV([head, ...rows.map((r) => r.map(String))])], { type: "text/csv;charset=utf-8" }) : new Blob([rows.map((r) => `Page ${r[0]} \xB7 ${r[1]}${r[2] ? " \xB7 " + r[2] : ""}${r[3] ? " \xB7 " + r[3] : ""}
${r[5] ? `\u201C${r[5]}\u201D
` : ""}${r[4] ? r[4] + "\n" : ""}`).join("\n")], { type: "text/plain;charset=utf-8" });
            return { files: [{ name: `comments.${ctx.values.format}`, blob }], message: `${rows.length} comment${rows.length > 1 ? "s" : ""} exported.`, html: h("div.report-wrap", h("table.report", h("thead", h("tr", head.map((x) => h("th", x)))), h("tbody", rows.slice(0, 200).map((r) => h("tr", r.map((c) => h("td", esc(String(c))))))))) };
          }
        },
        "accessibility-check": {
          accept: "pdf",
          view: "none",
          action: "Check accessibility",
          actionIcon: "accessibility",
          options: [],
          async run(ctx) {
            const P = await PL();
            const N = (n) => P.PDFName.of(n);
            const doc = await loadDoc(ctx.files[0].bytes);
            const pdf = await ctx.pdf();
            const checks = [];
            const add = (status, title2, detail) => checks.push({ status, title: title2, detail });
            const tagged = String(doc.catalog.lookup(N("MarkInfo"))?.get?.(N("Marked"))) === "true";
            const struct = !!doc.catalog.get(N("StructTreeRoot"));
            add(tagged && struct ? "ok" : "bad", "Tagged PDF", tagged && struct ? "The document has a structure tree for screen readers." : "Not tagged \u2014 screen readers can\u2019t follow headings, lists and reading order.");
            const title = doc.getTitle();
            add(title ? "ok" : "bad", "Document title", title ? `\u201C${title}\u201D` : "No title set. Use Edit Metadata to add one.");
            const dt = String(doc.catalog.lookup(N("ViewerPreferences"))?.get?.(N("DisplayDocTitle"))) === "true";
            add(dt ? "ok" : "warn", "Show title in window", dt ? "Viewers show the title instead of the file name." : "Turn on \u201CShow title instead of file name\u201D in Edit Metadata.");
            const lang2 = doc.catalog.get(N("Lang"));
            add(lang2 ? "ok" : "bad", "Language", lang2 ? `Language set to ${String(lang2).replace(/[()]/g, "")}.` : "No document language. Screen readers may mispronounce text.");
            let textPages = 0;
            const sample = Math.min(pdf.numPages, 15);
            for (let i = 1; i <= sample; i++) if ((await pageText(pdf, i)).items.length) textPages++;
            add(textPages === sample ? "ok" : textPages ? "warn" : "bad", "Real text (not scanned)", textPages === sample ? "All checked pages contain real text." : `${sample - textPages} of ${sample} checked pages have no text \u2014 run OCR PDF.`);
            const fonts = await walkFonts(doc);
            const notEmb = fonts.filter((f) => !f.embedded);
            add(notEmb.length ? "warn" : "ok", "Fonts embedded", notEmb.length ? `${notEmb.length} font(s) not embedded: ${notEmb.slice(0, 5).map((f) => f.name).join(", ")}` : "All fonts are embedded.");
            let fields = [];
            try {
              fields = doc.getForm().getFields();
            } catch {
            }
            const noTip = fields.filter((f) => !f.acroField.dict.get(N("TU"))).length;
            if (fields.length) add(noTip ? "warn" : "ok", "Form field descriptions", noTip ? `${noTip} of ${fields.length} fields have no tooltip/description.` : "All form fields have descriptions.");
            const outline = (await pdf.getOutline().catch(() => null))?.length;
            add(outline || pdf.numPages < 10 ? "ok" : "warn", "Bookmarks", outline ? "Has bookmarks for navigation." : pdf.numPages < 10 ? "Short document \u2014 bookmarks optional." : "Long document without bookmarks. Add them with Edit Bookmarks.");
            const restricted = ctx.files[0].encrypted;
            add(restricted ? "warn" : "ok", "Security", restricted ? "The file was encrypted \u2014 make sure \u201Ccontent accessibility\u201D is allowed." : "No restrictions blocking assistive technology.");
            const score = Math.round(checks.filter((c) => c.status === "ok").length / checks.length * 100);
            const icon = { ok: "circle-check", warn: "triangle-alert", bad: "circle-x" };
            const report = h("div", checks.map((c) => h(`div.chk.${c.status}`, ic(icon[c.status]), h("div", h("b", c.title), h("small", esc(c.detail))))));
            const txt = checks.map((c) => `[${c.status.toUpperCase()}] ${c.title}: ${c.detail}`).join("\n");
            return { title: `Accessibility score: ${score}%`, message: "Basic automated check. Full PDF/UA tagging is coming in \u201CMake PDF Accessible\u201D.", icon: score > 70 ? "circle-check" : "triangle-alert", files: [{ name: "accessibility-report.txt", blob: new Blob([txt], { type: "text/plain" }) }], html: report };
          }
        }
      };
    }
  });

  // js/tools/convert-to.js
  var convert_to_exports = {};
  __export(convert_to_exports, {
    applyScanFilter: () => applyScanFilter,
    default: () => convert_to_default
  });
  async function decodeImages(entry, filter) {
    const f = entry.file;
    const name = f.name.toLowerCase();
    if (/\.(heic|heif)$/.test(name) || /hei[cf]/.test(f.type)) {
      const heic2any = await lib("heic2any");
      const out = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.92, multiple: true });
      return (Array.isArray(out) ? out : [out]).map((b) => new File([b], f.name + ".jpg", { type: "image/jpeg" }));
    }
    if (/\.tiff?$/.test(name) || /tiff/.test(f.type)) {
      const UTIF = await lib("utif");
      const buf = await f.arrayBuffer();
      const ifds = UTIF.decode(buf);
      const res = [];
      for (const ifd of ifds) {
        UTIF.decodeImage(buf, ifd);
        if (!ifd.width) continue;
        const rgba = UTIF.toRGBA8(ifd);
        const c = document.createElement("canvas");
        c.width = ifd.width;
        c.height = ifd.height;
        c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer), ifd.width, ifd.height), 0, 0);
        res.push(new File([await canvasBytes(c, "image/png")], "page.png", { type: "image/png" }));
      }
      return res;
    }
    return [f];
  }
  async function exifRotated(file) {
    if (file.type !== "image/jpeg") return false;
    const v = new DataView(await file.slice(0, 65536).arrayBuffer());
    if (v.getUint16(0) !== 65496) return false;
    let o = 2;
    while (o < v.byteLength - 4) {
      const m = v.getUint16(o);
      const len = v.getUint16(o + 2);
      if (m === 65505 && v.getUint32(o + 4) === 1165519206) {
        const t2 = o + 10;
        const le = v.getUint16(t2) === 18761;
        const ifd = t2 + v.getUint32(t2 + 4, le);
        const n = v.getUint16(ifd, le);
        for (let i = 0; i < n; i++) {
          const e = ifd + 2 + i * 12;
          if (v.getUint16(e, le) === 274) return v.getUint16(e + 8, le) !== 1;
        }
        return false;
      }
      if ((m & 65280) !== 65280) break;
      o += 2 + len;
    }
    return false;
  }
  async function prepImage(file, quality, filter) {
    const q = { original: [8e3, 0.95], balanced: [2400, 0.85], small: [1500, 0.68] }[quality] || [2400, 0.85];
    const rotated = await exifRotated(file);
    if (filter && filter !== "none") {
      const img = await loadImage(file);
      const s = Math.min(1, q[0] / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0, c.width, c.height);
      applyScanFilter(c, filter);
      return { bytes: await canvasBytes(c, "image/jpeg", q[1]), type: "jpg", w: c.width, h: c.height };
    }
    return imageForPdf(file, { maxDim: q[0], quality: q[1], forceJpeg: quality !== "original" && file.type !== "image/png" || rotated });
  }
  function applyScanFilter(c, filter) {
    const x = c.getContext("2d");
    const d = x.getImageData(0, 0, c.width, c.height);
    const p = d.data;
    if (filter === "enhance") {
      for (let i = 0; i < p.length; i += 4) for (let k = 0; k < 3; k++) p[i + k] = clamp2((p[i + k] - 128) * 1.25 + 140);
    } else {
      const hist = new Uint32Array(256);
      for (let i = 0; i < p.length; i += 4) {
        const l = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114 | 0;
        p[i] = l;
        hist[l]++;
      }
      const total = p.length / 4;
      const pct = (q) => {
        let s = 0;
        for (let i = 0; i < 256; i++) {
          s += hist[i];
          if (s >= total * q) return i;
        }
        return 255;
      };
      let lo = pct(0.02), hi = pct(filter === "doc" ? 0.6 : 0.98);
      if (hi - lo < 30) {
        lo = 0;
        hi = 255;
      }
      const t2 = otsu(hist, total);
      for (let i = 0; i < p.length; i += 4) {
        let l = p[i];
        if (filter === "doc") l = clamp2((l - lo) * 255 / (hi - lo));
        if (filter === "bw") l = l > t2 ? 255 : 0;
        p[i] = p[i + 1] = p[i + 2] = l;
      }
    }
    x.putImageData(d, 0, 0);
  }
  function otsu(hist, total) {
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sB = 0, wB = 0, max = 0, t2 = 128;
    for (let i = 0; i < 256; i++) {
      wB += hist[i];
      if (!wB) continue;
      const wF = total - wB;
      if (!wF) break;
      sB += i * hist[i];
      const mB = sB / wB, mF = (sum - sB) / wF;
      const v = wB * wF * (mB - mF) ** 2;
      if (v > max) {
        max = v;
        t2 = i;
      }
    }
    return t2;
  }
  function placeImage(page, img, im, v) {
    const W = page.getWidth(), H = page.getHeight();
    const m = +v.margin || 0;
    const bw = W - 2 * m, bh = H - 2 * m;
    const s = v.size === "fit" ? bw / im.w : v.fit === "cover" ? Math.max(bw / im.w, bh / im.h) : Math.min(bw / im.w, bh / im.h);
    const w = im.w * s, hh = im.h * s;
    page.drawImage(img, { x: m + (bw - w) / 2, y: m + (bh - hh) / 2, width: w, height: hh });
  }
  function pageFor(doc, im, v) {
    if (v.size === "fit") {
      const k = 842 / Math.max(im.w, im.h);
      const m = +v.margin || 0;
      return doc.addPage([im.w * k + 2 * m, im.h * k + 2 * m]);
    }
    let [w, hh] = PAGE_SIZES[v.size];
    const land = v.orient === "landscape" || v.orient === "auto" && im.w > im.h;
    if (land) [w, hh] = [hh, w];
    return doc.addPage([w, hh]);
  }
  async function imagesRun(ctx, filterKey) {
    const { PDFDocument } = await PL();
    const v = ctx.values;
    const files = [];
    let doc = await PDFDocument.create();
    let count = 0;
    for (let i = 0; i < ctx.files.length; i++) {
      ctx.progress(i / ctx.files.length, `Adding ${ctx.files[i].name}`);
      let parts;
      try {
        parts = await decodeImages(ctx.files[i]);
      } catch (e) {
        throw new Error(`Couldn\u2019t read ${ctx.files[i].name}. ${e.message || ""}`);
      }
      for (const part of parts) {
        const im = await prepImage(part, v.quality, filterKey ? v[filterKey] : null);
        const img = await embedImage(doc, im);
        placeImage(pageFor(doc, im, v), img, im, v);
        count++;
        if (v.separate) {
          files.push({ name: `${baseName(ctx.files[i].name)}${parts.length > 1 ? "-" + count : ""}.pdf`, blob: await saveDoc(doc) });
          doc = await PDFDocument.create();
        }
      }
      await nextFrame();
    }
    if (!v.separate) files.push({ name: ctx.files.length === 1 ? outName(ctx, "") : filterKey ? "scan.pdf" : "images.pdf", blob: await saveDoc(doc) });
    return { files, message: `${count} image${count > 1 ? "s" : ""} converted to PDF.` };
  }
  function textSource({ accept, placeholder, sample = "" }) {
    return {
      noFile: true,
      accept,
      viewTitle: "Your content",
      async init(ctx) {
        var _a;
        (_a = ctx.state).text ?? (_a.text = sample);
        if (ctx.files[0]?.file) ctx.state.text = await ctx.files[0].file.text();
      },
      renderView(body, ctx, bar) {
        const ta = h("textarea.out-text", { placeholder, spellcheck: false, "aria-label": "Content", style: { minHeight: "52vh", maxHeight: "none", resize: "vertical" }, on: { input: (e) => {
          ctx.state.text = e.target.value;
        } } }, esc(ctx.state.text || ""));
        const input = h("input", { type: "file", accept, style: { display: "none" }, on: { change: async (e) => {
          const f = e.target.files[0];
          if (!f) return;
          ctx.state.text = await f.text();
          ctx.state.fileName = f.name;
          ta.value = ctx.state.text;
          toast(`Loaded ${f.name}`, "success");
        } } });
        bar.append(h("div.sel-tools.extra", input, h("button.mini-btn", { type: "button", on: { click: () => input.click() } }, ic("folder-open"), "Open file"), h("button.mini-btn", { type: "button", on: { click: () => {
          ta.value = "";
          ctx.state.text = "";
          ta.focus();
        } } }, ic("eraser"), "Clear")));
        body.appendChild(ta);
      }
    };
  }
  async function htmlResult(ctx, html, css, name) {
    const doc = await htmlToPdf(html, { pageSize: pageSize(ctx.values), margin: +ctx.values.margin, css, onProgress: ctx.progress });
    return { files: [{ name, blob: await saveDoc(doc) }] };
  }
  async function codeResult(ctx, text, name) {
    const v = ctx.values;
    let doc = await textLayout(text, { font: "Courier", size: +v.fontSize, pageSize: pageSize(v), margin: +v.margin * 0.7, lineNumbers: v.lineNumbers, lineHeight: 1.3, header: v.header ? ctx.state.fileName || "" : "" });
    if (!doc) doc = await htmlToPdf(`<pre style="font:${v.fontSize * 1.333}px/1.4 ui-monospace,Menlo,Consolas,monospace;margin:0">${escapeHtml(text).split("\n").map((l, i) => v.lineNumbers ? `<span style="color:#999;user-select:none">${String(i + 1).padStart(4)}  </span>${l}` : l).join("\n")}</pre>`, { pageSize: pageSize(v), margin: +v.margin * 0.7, onProgress: ctx.progress });
    return { files: [{ name, blob: await saveDoc(doc) }] };
  }
  function prettyXml(xml) {
    let depth = 0;
    return xml.replace(/>\s*</g, "><").replace(/</g, "\n<").trim().split("\n").map((line) => {
      if (/^<\//.test(line)) depth = Math.max(0, depth - 1);
      const out = "  ".repeat(depth) + line;
      if (/^<[^!?/][^>]*[^/]>$/.test(line) && !/<\/[^>]+>$/.test(line)) depth++;
      return out;
    }).join("\n");
  }
  function sanitize2(html) {
    const d = new DOMParser().parseFromString(html, "text/html");
    d.querySelectorAll("script,iframe,object,embed,link[rel=import]").forEach((e) => e.remove());
    d.querySelectorAll("*").forEach((el) => [...el.attributes].forEach((a) => {
      if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
    }));
    return (d.head.querySelector("style") ? [...d.head.querySelectorAll("style")].map((s) => s.outerHTML).join("") : "") + d.body.innerHTML;
  }
  var imageOptions, clamp2, imageTool2, nameFor, pageOpts, pageSize, need, DOC_CSS, convert_to_default;
  var init_convert_to = __esm({
    "js/tools/convert-to.js"() {
      init_pdf();
      init_lib();
      init_ui();
      init_htmlpdf();
      init_common();
      imageOptions = (extra = []) => [
        { type: "info", html: "Drag images to reorder them. Each image becomes one page." },
        ...extra,
        { key: "size", type: "select", label: "Page size", default: "A4", options: [["fit", "Same as image"], ["A4", "A4"], ["Letter", "US Letter"], ["Legal", "Legal"], ["A5", "A5"]] },
        { key: "orient", type: "seg", label: "Orientation", default: "auto", options: [["auto", "Auto"], ["portrait", "Portrait"], ["landscape", "Landscape"]], show: (v) => v.size !== "fit" },
        { key: "margin", type: "seg", label: "Margin", default: "0", options: [["0", "None"], ["18", "Small"], ["42", "Large"]] },
        { key: "fit", type: "seg", label: "Image fit", default: "contain", options: [["contain", "Fit whole image"], ["cover", "Fill page"]], show: (v) => v.size !== "fit" },
        { key: "quality", type: "select", label: "Image quality", default: "balanced", options: [["original", "Original (largest file)"], ["balanced", "Balanced (recommended)"], ["small", "Small file"]] },
        { key: "separate", type: "check", label: "Create a separate PDF for each image" }
      ];
      clamp2 = (v) => v < 0 ? 0 : v > 255 ? 255 : v;
      imageTool2 = (title, extra = {}) => ({ accept: "image", multiple: true, view: "files", action: "Convert to PDF", actionIcon: "file-down", uploadTitle: title, options: imageOptions(), run: (ctx) => imagesRun(ctx), ...extra });
      nameFor = (ctx, fallback) => `${baseName(ctx.state.fileName || ctx.files[0]?.name || fallback)}.pdf`;
      pageOpts = [
        { key: "size", type: "select", label: "Page size", default: "A4", options: Object.keys(PAGE_SIZES).map((k) => [k, k]) },
        { key: "orient", type: "seg", label: "Orientation", default: "portrait", options: [["portrait", "Portrait"], ["landscape", "Landscape"]] },
        { key: "margin", type: "seg", label: "Margins", default: "50", options: [["20", "Narrow"], ["50", "Normal"], ["72", "Wide"]] }
      ];
      pageSize = (v) => {
        const s = PAGE_SIZES[v.size || "A4"];
        return v.orient === "landscape" ? [s[1], s[0]] : s;
      };
      need = (ctx) => !String(ctx.state.text || "").trim() ? "Type, paste or open some content first" : null;
      DOC_CSS = `body{font-size:15px;line-height:1.65;color:#1f2937} h1,h2,h3,h4{line-height:1.25;color:#0f172a;margin:1.2em 0 .5em} h1{font-size:2em;border-bottom:1px solid #e5e7eb;padding-bottom:.3em} h2{font-size:1.5em;border-bottom:1px solid #eef0f3;padding-bottom:.25em}
  code{background:#f3f4f6;padding:.1em .35em;border-radius:4px;font:13px ui-monospace,Menlo,Consolas,monospace} pre{background:#f6f8fa;padding:12px 14px;border-radius:8px;overflow:hidden} pre code{background:none;padding:0}
  blockquote{border-left:4px solid #c7d2fe;margin:1em 0;padding:.2em 1em;color:#4b5563;background:#f8fafc} table{border-collapse:collapse;margin:1em 0} th,td{border:1px solid #d1d5db;padding:6px 10px;text-align:left} th{background:#f3f4f6} a{color:#4f46e5} img{max-width:100%} hr{border:0;border-top:1px solid #e5e7eb;margin:1.5em 0} li{margin:.25em 0}`;
      convert_to_default = {
        "jpg-to-pdf": imageTool2("Select JPG images"),
        "png-to-pdf": imageTool2("Select PNG images"),
        "image-to-pdf": imageTool2("Select images"),
        "heic-to-pdf": imageTool2("Select HEIC photos", { about: "HEIC is the default photo format on iPhones. We convert it right in your browser." }),
        "tiff-to-pdf": imageTool2("Select TIFF files", { about: "Multi-page TIFF files become multi-page PDFs." }),
        "scan-to-pdf": {
          accept: "image",
          multiple: true,
          camera: true,
          view: "files",
          action: "Create PDF",
          actionIcon: "file-down",
          uploadTitle: "Scan or choose photos of documents",
          uploadIcon: "camera",
          uploadHint: "Take a photo of each page, or pick existing photos",
          options: imageOptions([{ key: "filter", type: "cards", label: "Scan look", default: "doc", options: [["doc", "Document", "clean & bright"], ["bw", "Black & White", "sharp text"], ["gray", "Grayscale", "soft"], ["enhance", "Colour+", "vivid"], ["none", "Original", "as taken"]] }]),
          run: (ctx) => imagesRun(ctx, "filter")
        },
        "combine-files": {
          accept: "pdfimage",
          multiple: true,
          view: "files",
          action: "Combine to PDF",
          actionIcon: "files",
          uploadTitle: "Select PDFs and images",
          options: [{ type: "info", html: "Mix PDFs and images in any order. Images are placed on their own pages." }, ...imageOptions().slice(1, 6)],
          async run(ctx) {
            const { PDFDocument } = await PL();
            const doc = await PDFDocument.create();
            const v = ctx.values;
            for (let i = 0; i < ctx.files.length; i++) {
              const f = ctx.files[i];
              ctx.progress(i / ctx.files.length, `Adding ${f.name}`);
              if (f.isPdf) {
                const src = await loadDoc(f.bytes);
                (await doc.copyPages(src, src.getPageIndices())).forEach((p) => doc.addPage(p));
              } else for (const part of await decodeImages(f)) {
                const im = await prepImage(part, v.quality);
                placeImage(pageFor(doc, im, v), await embedImage(doc, im), im, v);
              }
            }
            return { files: [{ name: "combined.pdf", blob: await saveDoc(doc) }], message: `${ctx.files.length} files combined into ${doc.getPageCount()} pages.` };
          }
        },
        "text-to-pdf": {
          ...textSource({ accept: ".txt,.text,.log,text/plain", placeholder: "Type or paste your text here, or open a .txt file\u2026" }),
          action: "Create PDF",
          actionIcon: "file-down",
          validate: need,
          options: [
            { key: "font", type: "select", label: "Font", default: "Helvetica", options: [["Helvetica", "Sans (Helvetica)"], ["TimesRoman", "Serif (Times)"], ["Courier", "Monospace (Courier)"]] },
            { key: "fontSize", type: "range", label: "Font size", default: 11, min: 7, max: 24, unit: " pt" },
            ...pageOpts,
            { type: "info", html: "Hindi, Punjabi and other scripts are fully supported." }
          ],
          async run(ctx) {
            const v = ctx.values;
            let doc = await textLayout(ctx.state.text, { font: v.font, size: +v.fontSize, pageSize: pageSize(v), margin: +v.margin });
            if (!doc) doc = await htmlToPdf(`<pre style="font:${v.fontSize * 1.333}px/1.45 ${v.font === "Courier" ? "ui-monospace,monospace" : v.font === "TimesRoman" ? "serif" : "inherit"};white-space:pre-wrap;margin:0">${escapeHtml(ctx.state.text)}</pre>`, { pageSize: pageSize(v), margin: +v.margin, onProgress: ctx.progress });
            return { files: [{ name: nameFor(ctx, "text"), blob: await saveDoc(doc) }] };
          }
        },
        "markdown-to-pdf": {
          ...textSource({ accept: ".md,.markdown,.txt,text/markdown", placeholder: "# Title\n\nWrite **Markdown** here\u2026", sample: "# My document\n\nWrite **Markdown** here \u2014 headings, lists, tables and code all work.\n\n- Point one\n- Point two\n\n| Item | Price |\n|---|---|\n| Tea | \u20B920 |\n" }),
          action: "Create PDF",
          actionIcon: "file-down",
          validate: need,
          options: [...pageOpts, { key: "theme", type: "seg", label: "Style", default: "github", options: [["github", "Clean"], ["serif", "Book"], ["compact", "Compact"]] }],
          async run(ctx) {
            const marked = await lib("marked");
            const html = (marked.parse || marked)(ctx.state.text, { gfm: true, breaks: false });
            const extra = { serif: 'body{font-family:Georgia,"Times New Roman",serif;font-size:16px}', compact: "body{font-size:12.5px;line-height:1.45} h1{font-size:1.6em}" }[ctx.values.theme] || "";
            return htmlResult(ctx, sanitize2(html), DOC_CSS + extra, nameFor(ctx, "markdown"));
          }
        },
        "csv-to-pdf": {
          ...textSource({ accept: ".csv,.tsv,text/csv", placeholder: "Name,Class,Marks\nAman,10,92\nPriya,10,95" }),
          action: "Create PDF",
          actionIcon: "file-down",
          validate: need,
          options: [
            { key: "header", type: "check", label: "First row is a header", default: true },
            { key: "stripes", type: "check", label: "Striped rows", default: true },
            { key: "fontSize", type: "range", label: "Font size", default: 11, min: 6, max: 16, unit: " px" },
            { ...pageOpts[0] },
            { ...pageOpts[1], default: "landscape" },
            { ...pageOpts[2], default: "20" }
          ],
          async run(ctx) {
            const rows = parseCSV(ctx.state.text);
            if (!rows.length) throw new Error("No rows found in the CSV.");
            const v = ctx.values;
            const [head, ...body] = v.header ? rows : [null, ...rows];
            const html = `<table>${head ? `<thead><tr>${head.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>` : ""}<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
            const css = `table{width:100%;border-collapse:collapse;font-size:${v.fontSize}px} th{background:#4f46e5;color:#fff;text-align:left} th,td{padding:5px 7px;border:1px solid #d1d5db} ${v.stripes ? "tbody tr:nth-child(even){background:#f3f4f6}" : ""}`;
            return htmlResult(ctx, html, css, nameFor(ctx, "table"));
          }
        },
        "html-to-pdf": {
          ...textSource({ accept: ".html,.htm,text/html", placeholder: "<h1>Hello</h1>\n<p>Paste HTML code or open an .html file\u2026</p>" }),
          action: "Create PDF",
          actionIcon: "file-down",
          validate: need,
          options: [...pageOpts, { type: "info", html: 'Scripts are not run. Images must be online (https) or embedded. To save a live website, use <a href="#/url-to-pdf">Webpage to PDF</a>.' }],
          run: (ctx) => htmlResult(ctx, sanitize2(ctx.state.text), "", nameFor(ctx, "page"))
        },
        "json-to-pdf": {
          ...textSource({ accept: ".json,.xml,application/json,text/xml,application/xml", placeholder: '{ "paste": "JSON or XML here" }' }),
          action: "Create PDF",
          actionIcon: "file-down",
          validate: need,
          options: [{ key: "pretty", type: "check", label: "Format nicely (pretty print)", default: true }, { key: "lineNumbers", type: "check", label: "Line numbers", default: true }, { key: "fontSize", type: "range", label: "Font size", default: 9, min: 6, max: 14, unit: " pt" }, ...pageOpts],
          async run(ctx) {
            let t2 = ctx.state.text.trim();
            if (ctx.values.pretty) {
              if (/^[[{]/.test(t2)) {
                try {
                  t2 = JSON.stringify(JSON.parse(t2), null, 2);
                } catch (e) {
                  throw new Error("This is not valid JSON: " + e.message);
                }
              } else if (t2.startsWith("<")) t2 = prettyXml(t2);
            }
            return codeResult(ctx, t2, nameFor(ctx, "data"));
          }
        },
        "code-to-pdf": {
          ...textSource({ accept: ".js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.cs,.go,.rs,.rb,.php,.swift,.kt,.css,.scss,.html,.sql,.sh,.yml,.yaml,.json,.xml,.txt,.md", placeholder: "// paste or open source code\u2026" }),
          action: "Create PDF",
          actionIcon: "file-down",
          validate: need,
          options: [{ key: "lineNumbers", type: "check", label: "Line numbers", default: true }, { key: "fontSize", type: "range", label: "Font size", default: 9, min: 6, max: 14, unit: " pt" }, { key: "header", type: "check", label: "File name in page header", default: true }, ...pageOpts],
          run: (ctx) => codeResult(ctx, ctx.state.text, nameFor(ctx, "code"))
        }
      };
    }
  });

  // js/tools/ocr.js
  var ocr_exports = {};
  __export(ocr_exports, {
    default: () => ocr_default,
    detectSkew: () => detectSkew
  });
  async function ocrWorker(langs, progress) {
    const T = await lib("tesseract");
    progress?.(0.02, "Downloading OCR engine & language data (first time only)\u2026");
    try {
      return await T.createWorker(langs, 1, { workerPath: vendorUrl("tesseract/worker.min.js"), corePath: CONFIG.TESSERACT_CORE, langPath: CONFIG.TESSERACT_LANG, workerBlobURL: false });
    } catch (e) {
      throw new Error("Could not load the OCR engine. Please check your internet connection (language data is downloaded once).");
    }
  }
  function detectSkew(canvas) {
    const W = 500, s = W / canvas.width, hh = Math.round(canvas.height * s);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = hh;
    const x = c.getContext("2d");
    x.drawImage(canvas, 0, 0, W, hh);
    const d = x.getImageData(0, 0, W, hh).data;
    const pts = [];
    for (let y = 0; y < hh; y += 1) for (let i = 0; i < W; i += 1) {
      const k = (y * W + i) * 4;
      if (d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11 < 128) pts.push(i, y);
    }
    if (pts.length < 200) return 0;
    let best = 0, bestScore = -1;
    for (let a = -6; a <= 6.001; a += 0.2) {
      const t2 = Math.tan(a * Math.PI / 180);
      const rows = new Float64Array(hh * 2 + 10);
      for (let k = 0; k < pts.length; k += 2) {
        const r = Math.round(pts[k + 1] - pts[k] * t2) + hh;
        if (r >= 0 && r < rows.length) rows[r]++;
      }
      let score = 0;
      for (let r = 1; r < rows.length; r++) score += (rows[r] - rows[r - 1]) ** 2;
      if (score > bestScore) {
        bestScore = score;
        best = a;
      }
    }
    return best;
  }
  function rotateCanvas(src, deg) {
    const a = deg * Math.PI / 180;
    const c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    const x = c.getContext("2d");
    x.fillStyle = "#fff";
    x.fillRect(0, 0, c.width, c.height);
    x.translate(c.width / 2, c.height / 2);
    x.rotate(a);
    x.drawImage(src, -src.width / 2, -src.height / 2);
    return c;
  }
  function inkBox(canvas, thresh = 235) {
    const x = canvas.getContext("2d");
    const { width: W, height: H } = canvas;
    const d = x.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = -1, y1 = -1, ink = 0;
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
      const k = (y * W + i) * 4;
      if (d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11 < thresh) {
        ink++;
        if (i < x0) x0 = i;
        if (i > x1) x1 = i;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    return { x0, y0, x1, y1, ink: ink / (W * H), W, H };
  }
  async function rebuild(ctx, pages, process, dpi) {
    const { PDFDocument } = await PL();
    const src = await loadDoc(ctx.files[0].bytes);
    const pdf = await ctx.pdf();
    const out = await PDFDocument.create();
    let changed = 0;
    for (let i = 0; i < pdf.numPages; i++) {
      ctx.progress(i / pdf.numPages, `Processing page ${i + 1} of ${pdf.numPages}`);
      if (!pages.has(i)) {
        out.addPage((await out.copyPages(src, [i]))[0]);
        continue;
      }
      const c = await renderPage(pdf, i + 1, { dpi });
      const r = await process(c, i);
      if (!r) {
        out.addPage((await out.copyPages(src, [i]))[0]);
        continue;
      }
      changed++;
      const img = await out.embedJpg(await canvasBytes(r, "image/jpeg", 0.85));
      const p = out.addPage([c.pdfSize.w, c.pdfSize.h]);
      p.drawImage(img, { x: 0, y: 0, width: c.pdfSize.w, height: c.pdfSize.h });
      await nextFrame();
    }
    return { out, changed };
  }
  function despeckle(c) {
    const x = c.getContext("2d");
    const { width: W, height: H } = c;
    const id = x.getImageData(0, 0, W, H);
    const p = id.data;
    const dark = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) dark[i] = p[i * 4] < 140 ? 1 : 0;
    for (let y = 1; y < H - 1; y++) for (let i = 1; i < W - 1; i++) {
      const k = y * W + i;
      if (!dark[k]) continue;
      const n = dark[k - 1] + dark[k + 1] + dark[k - W] + dark[k + W] + dark[k - W - 1] + dark[k - W + 1] + dark[k + W - 1] + dark[k + W + 1];
      if (n <= 1) {
        p[k * 4] = p[k * 4 + 1] = p[k * 4 + 2] = 255;
      }
    }
    x.putImageData(id, 0, 0);
  }
  var LANGS2, LATIN, langOpts, langStr, ocr_default, limit;
  var init_ocr = __esm({
    "js/tools/ocr.js"() {
      init_pdf();
      init_lib();
      init_ui();
      init_config();
      init_common();
      init_convert_from();
      init_convert_to();
      LANGS2 = [["eng", "English"], ["hin", "Hindi (\u0939\u093F\u0902\u0926\u0940)"], ["pan", "Punjabi (\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40)"], ["ben", "Bengali"], ["guj", "Gujarati"], ["mar", "Marathi"], ["tam", "Tamil"], ["tel", "Telugu"], ["kan", "Kannada"], ["mal", "Malayalam"], ["urd", "Urdu"], ["san", "Sanskrit"], ["fra", "French"], ["deu", "German"], ["spa", "Spanish"], ["ara", "Arabic"], ["chi_sim", "Chinese (Simplified)"], ["jpn", "Japanese"], ["rus", "Russian"]];
      LATIN = /* @__PURE__ */ new Set(["eng", "fra", "deu", "spa", "ita", "por", "nld"]);
      langOpts = [
        { key: "lang", type: "select", label: "Document language", default: "eng", options: LANGS2 },
        { key: "lang2", type: "select", label: "Second language (optional)", default: "", options: [["", "None"], ...LANGS2] }
      ];
      langStr = (v) => [v.lang, v.lang2].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join("+");
      ocr_default = {
        "ocr-pdf": {
          accept: "pdf",
          view: "thumbs",
          action: "Run OCR",
          actionIcon: "scan-text",
          busyText: "Reading your document\u2026",
          options: [
            ...langOpts,
            { key: "output", type: "cards", label: "Output", default: "pdf", options: [["pdf", "Searchable PDF", "select & search text"], ["txt", "Text file", ".txt"]] },
            { key: "dpi", type: "select", label: "Accuracy", default: "250", options: [["200", "Fast"], ["250", "Balanced"], ["300", "Best (slower)"]] },
            { key: "pages", type: "pages", label: "Pages (optional)" },
            { type: "info", html: "Runs on your device. The OCR engine and language (\u224810\u201320 MB) download once, then work offline. Big documents can take a few minutes on phones." }
          ],
          async run(ctx) {
            const v = ctx.values;
            const pdf = await ctx.pdf();
            const idx = new Set(parsePages(v.pages, pdf.numPages));
            const langs = langStr(v);
            const worker = await ocrWorker(langs, ctx.progress);
            const latin = langs.split("+").every((l) => LATIN.has(l));
            const { PDFDocument } = await PL();
            const src = await loadDoc(ctx.files[0].bytes);
            const out = await PDFDocument.create();
            const font = await getFont(out, "Helvetica");
            let text = "";
            try {
              for (let i = 0; i < pdf.numPages; i++) {
                if (!idx.has(i)) {
                  if (v.output === "pdf") out.addPage((await out.copyPages(src, [i]))[0]);
                  continue;
                }
                ctx.progress(0.05 + 0.95 * i / pdf.numPages, `Recognising page ${i + 1} of ${pdf.numPages}\u2026`);
                const c = await renderPage(pdf, i + 1, { dpi: +v.dpi, annotations: false });
                const wantPdf = v.output === "pdf" && !latin;
                const { data } = await worker.recognize(c, {}, { text: true, blocks: true, pdf: wantPdf });
                text += `----- Page ${i + 1} -----
${data.text}
`;
                if (v.output !== "pdf") continue;
                if (wantPdf && data.pdf) {
                  const pd = await PDFDocument.load(new Uint8Array(data.pdf));
                  const [pg2] = await out.copyPages(pd, [0]);
                  pg2.scale(c.pdfSize.w / pg2.getWidth(), c.pdfSize.h / pg2.getHeight());
                  out.addPage(pg2);
                  continue;
                }
                const [pg] = await out.copyPages(src, [i]);
                out.addPage(pg);
                const k = 72 / +v.dpi;
                const { h: H } = visualSize(pg);
                const words2 = data.words || (data.blocks || []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words)));
                for (const w of words2) {
                  const t2 = (w.text || "").trim();
                  if (!t2 || w.confidence < 30) continue;
                  if (!canEncode(font, t2)) continue;
                  const bw = (w.bbox.x1 - w.bbox.x0) * k, bh = (w.bbox.y1 - w.bbox.y0) * k;
                  const size = Math.max(2, Math.min(bh * 1.15, bw / Math.max(0.01, font.widthOfTextAtSize(t2, 1))));
                  const q = visualToUser(pg, w.bbox.x0 * k, H - w.bbox.y1 * k + bh * 0.15);
                  pg.drawText(t2, { x: q.x, y: q.y, size, font, opacity: 0, rotate: window.PDFLib.degrees(q.r) });
                }
                c.width = c.height = 0;
              }
            } finally {
              await worker.terminate();
            }
            if (v.output === "txt") return { files: [{ name: outName(ctx, "ocr", "txt"), blob: new Blob([text], { type: "text/plain;charset=utf-8" }) }], html: textResultView(text) };
            return { files: [{ name: outName(ctx, "searchable"), blob: await saveDoc(out) }], message: "Your PDF is now searchable \u2014 try Ctrl+F / Find in your PDF reader.", html: textResultView(text, 10) };
          }
        },
        "ocr-image": {
          accept: "image",
          multiple: true,
          camera: true,
          view: "files",
          action: "Extract text",
          actionIcon: "scan-text",
          options: [...langOpts, { type: "info", html: "Works best with clear, straight photos. The language data downloads once." }],
          async run(ctx) {
            const worker = await ocrWorker(langStr(ctx.values), ctx.progress);
            let text = "";
            try {
              for (let i = 0; i < ctx.files.length; i++) {
                ctx.progress(0.1 + 0.9 * i / ctx.files.length, `Reading ${ctx.files[i].name}\u2026`);
                const { data } = await worker.recognize(ctx.files[i].file);
                text += (ctx.files.length > 1 ? `----- ${ctx.files[i].name} -----
` : "") + data.text + "\n";
              }
            } finally {
              await worker.terminate();
            }
            if (!text.trim()) throw new Error("No text could be recognised. Try a clearer photo.");
            return { files: [{ name: ctx.files.length > 1 ? "ocr-text.txt" : outName(ctx, "text", "txt"), blob: new Blob([text], { type: "text/plain;charset=utf-8" }) }], html: textResultView(text) };
          }
        },
        "deskew-pdf": {
          accept: "pdf",
          view: "thumbs",
          action: "Straighten pages",
          actionIcon: "ruler",
          options: [{ key: "dpi", type: "select", label: "Output quality", default: "200", options: [["150", "Good"], ["200", "High"], ["300", "Print"]] }, { key: "pages", type: "pages", label: "Pages (optional)" }, { type: "info", html: "Detects tilted scans (up to \xB16\xB0) and rotates them straight. Pages that are already straight are left untouched." }],
          async run(ctx) {
            const pdf = await ctx.pdf();
            const angles = {};
            const { out, changed } = await rebuild(ctx, new Set(parsePages(ctx.values.pages, pdf.numPages)), (c, i) => {
              const a = detectSkew(c);
              angles[i] = a;
              return Math.abs(a) >= 0.2 ? rotateCanvas(c, -a) : null;
            }, +ctx.values.dpi);
            if (!changed) throw new Error("All pages already look straight.");
            return { files: [{ name: outName(ctx, "straightened"), blob: await saveDoc(out) }], message: `${changed} page${changed > 1 ? "s" : ""} straightened (${Object.entries(angles).filter(([, a]) => Math.abs(a) >= 0.2).map(([i, a]) => `p${+i + 1}: ${a.toFixed(1)}\xB0`).slice(0, 8).join(", ")}).` };
          }
        },
        "clean-scan": {
          accept: "pdf",
          view: "thumbs",
          action: "Clean up",
          actionIcon: "sparkles",
          options: [
            { key: "mode", type: "cards", label: "Look", default: "doc", options: [["doc", "Whiten", "grey paper \u2192 white"], ["bw", "Black & White", "crisp text"], ["gray", "Grayscale", "soft"], ["enhance", "Colour boost", "vivid"]] },
            { key: "despeckle", type: "check", label: "Remove dust & specks", default: true },
            { key: "deskew", type: "check", label: "Also straighten tilted pages", default: true },
            { key: "dpi", type: "select", label: "Output quality", default: "200", options: [["150", "Good"], ["200", "High"], ["300", "Print"]] }
          ],
          async run(ctx) {
            const v = ctx.values;
            const pdf = await ctx.pdf();
            const { out } = await rebuild(ctx, /* @__PURE__ */ new Set([...Array(pdf.numPages).keys()]), (c) => {
              if (v.deskew) {
                const a = detectSkew(c);
                if (Math.abs(a) >= 0.2) c = rotateCanvas(c, -a);
              }
              applyScanFilter(c, v.mode);
              if (v.despeckle) despeckle(c);
              return c;
            }, +v.dpi);
            return { files: [{ name: outName(ctx, "clean"), blob: await saveDoc(out) }] };
          }
        },
        "auto-crop": {
          accept: "pdf",
          view: "thumbs",
          action: "Auto crop",
          actionIcon: "crop",
          options: [{ key: "pad", type: "range", label: "Keep a margin of", default: 5, min: 0, max: 30, unit: " mm" }, { key: "same", type: "seg", label: "Crop", default: "each", options: [["each", "Each page separately"], ["same", "All pages the same"]] }],
          async run(ctx) {
            const pdf = await ctx.pdf();
            const doc = await loadDoc(ctx.files[0].bytes);
            const boxes = [];
            for (let i = 0; i < pdf.numPages; i++) {
              ctx.progress(i / pdf.numPages, `Measuring page ${i + 1}`);
              boxes.push(inkBox(await renderPage(pdf, i + 1, { dpi: 60, annotations: false })));
            }
            let union = null;
            if (ctx.values.same === "same") {
              union = boxes.filter((b) => b.x1 >= 0).reduce((u, b) => ({ x0: Math.min(u.x0, b.x0 / b.W), y0: Math.min(u.y0, b.y0 / b.H), x1: Math.max(u.x1, b.x1 / b.W), y1: Math.max(u.y1, b.y1 / b.H) }), { x0: 1, y0: 1, x1: 0, y1: 0 });
            }
            let n = 0;
            doc.getPages().forEach((p, i) => {
              const b = boxes[i];
              if (b.x1 < 0) return;
              const f = union || { x0: b.x0 / b.W, y0: b.y0 / b.H, x1: (b.x1 + 1) / b.W, y1: (b.y1 + 1) / b.H };
              const { w: W, h: H } = visualSize(p);
              const pad = ctx.values.pad * 72 / 25.4;
              const vx0 = Math.max(0, f.x0 * W - pad), vx1 = Math.min(W, f.x1 * W + pad), vyTop = Math.min(H, H - f.y0 * H + pad), vyBot = Math.max(0, H - f.y1 * H - pad);
              if (vx1 - vx0 > W * 0.98 && vyTop - vyBot > H * 0.98) return;
              const a = visualToUser(p, vx0, vyBot), c = visualToUser(p, vx1, vyTop);
              const x = Math.min(a.x, c.x), y = Math.min(a.y, c.y), w = Math.abs(a.x - c.x), hh = Math.abs(a.y - c.y);
              p.setCropBox(x, y, w, hh);
              p.setMediaBox(x, y, w, hh);
              n++;
            });
            if (!n) throw new Error("No empty borders were found to trim.");
            return { files: [{ name: outName(ctx, "cropped"), blob: await saveDoc(doc) }], message: `${n} page${n > 1 ? "s" : ""} trimmed. Text and graphics stay sharp.` };
          }
        },
        "remove-blank-pages": {
          accept: "pdf",
          view: "thumbs",
          action: "Remove blank pages",
          actionIcon: "file-x",
          options: [{ key: "sens", type: "seg", label: "Sensitivity", default: "normal", options: [["strict", "Only totally blank"], ["normal", "Normal"], ["loose", "Also nearly blank (scans)"]] }],
          async init(ctx) {
            const pdf = await ctx.pdf();
            ctx.state.ink = [];
            for (let i = 0; i < Math.min(pdf.numPages, 400); i++) ctx.state.ink.push(inkBox(await renderPage(pdf, i + 1, { dpi: 30, annotations: false }), 225).ink);
          },
          onOption(ctx, k) {
            if (k === "sens") ctx.refreshView();
          },
          thumbFlag: (ctx) => ctx.state.ink.map((x) => x <= limit(ctx.values.sens) ? "BLANK" : ""),
          async run(ctx) {
            const doc = await loadDoc(ctx.files[0].bytes);
            const blank = ctx.state.ink.map((x, i) => x <= limit(ctx.values.sens) ? i : -1).filter((i) => i >= 0);
            if (!blank.length) throw new Error("No blank pages were found. Try a looser sensitivity.");
            if (blank.length >= doc.getPageCount()) throw new Error("Every page looks blank \u2014 nothing was removed.");
            [...blank].reverse().forEach((i) => doc.removePage(i));
            return { files: [{ name: outName(ctx, "no-blanks"), blob: await saveDoc(doc) }], message: `Removed ${blank.length} blank page${blank.length > 1 ? "s" : ""} (${blank.map((i) => i + 1).slice(0, 20).join(", ")}).` };
          }
        }
      };
      limit = (s) => ({ strict: 5e-4, normal: 3e-3, loose: 0.012 })[s] || 3e-3;
    }
  });

  // js/tools/server.js
  var server_exports = {};
  __export(server_exports, {
    default: () => server_default
  });
  var LANGS3, office, fromPdf, ai, server_default;
  var init_server = __esm({
    "js/tools/server.js"() {
      LANGS3 = [["hi", "Hindi"], ["pa", "Punjabi"], ["en", "English"], ["bn", "Bengali"], ["gu", "Gujarati"], ["mr", "Marathi"], ["ta", "Tamil"], ["te", "Telugu"], ["kn", "Kannada"], ["ml", "Malayalam"], ["ur", "Urdu"], ["es", "Spanish"], ["fr", "French"], ["de", "German"], ["ar", "Arabic"], ["zh", "Chinese"], ["ja", "Japanese"]];
      office = (accept, title, extra = []) => ({ accept, multiple: true, view: "files", uploadTitle: title, action: "Convert to PDF", options: [{ key: "pdfa", type: "check", label: "Save as PDF/A (archive)" }, ...extra] });
      fromPdf = (fmt2, extra = []) => ({ accept: "pdf", view: "thumbs", action: `Convert to ${fmt2}`, options: [{ key: "ocr", type: "check", label: "Use OCR for scanned pages", default: true }, { key: "pages", type: "pages", label: "Pages (optional)" }, ...extra] });
      ai = (action, options) => ({ accept: "pdf", view: "thumbs", action, actionIcon: "sparkles", options: [...options, { type: "info", html: "AI tools read your PDF on our secure server. Files are deleted after processing." }] });
      server_default = {
        "word-to-pdf": office(".doc,.docx,.dot,.dotx", "Select Word documents", [{ key: "bookmarks", type: "check", label: "Create bookmarks from headings", default: true }]),
        "excel-to-pdf": office(".xls,.xlsx,.xlsm,.ods,.csv", "Select Excel files", [{ key: "fit", type: "seg", label: "Fit", default: "width", options: [["none", "Actual size"], ["width", "Fit columns to page"], ["page", "Fit sheet to page"]] }, { key: "orient", type: "seg", label: "Orientation", default: "auto", options: [["auto", "Auto"], ["portrait", "Portrait"], ["landscape", "Landscape"]] }, { key: "sheets", type: "seg", label: "Sheets", default: "all", options: [["all", "All sheets"], ["active", "Active sheet"]] }]),
        "ppt-to-pdf": office(".ppt,.pptx,.pps,.ppsx,.odp", "Select PowerPoint files", [{ key: "notes", type: "check", label: "Include speaker notes" }, { key: "handout", type: "select", label: "Slides per page", default: "1", options: [["1", "1"], ["2", "2"], ["4", "4"], ["6", "6"]] }]),
        "odt-to-pdf": office(".odt,.ods,.odp,.odg", "Select OpenDocument files"),
        "rtf-to-pdf": office(".rtf", "Select RTF files"),
        "epub-to-pdf": office(".epub", "Select EPUB books", [{ key: "size", type: "select", label: "Page size", default: "A5", options: [["A5", "A5 (book)"], ["A4", "A4"], ["Letter", "Letter"]] }, { key: "font", type: "range", label: "Font size", default: 12, min: 8, max: 20, unit: " pt" }]),
        "mobi-to-pdf": office(".mobi,.azw,.azw3", "Select Kindle books", [{ key: "size", type: "select", label: "Page size", default: "A5", options: [["A5", "A5"], ["A4", "A4"]] }]),
        "url-to-pdf": { noFile: true, view: "custom", viewTitle: "Website", renderView(b) {
          b.innerHTML = '<div class="option-info">Enter a web address on the right. We open it in a real browser on our server and save it as a PDF.</div>';
        }, action: "Convert to PDF", options: [{ key: "url", type: "url", label: "Website address", placeholder: "https://example.com" }, { key: "device", type: "seg", label: "Layout", default: "desktop", options: [["desktop", "Desktop"], ["mobile", "Mobile"]] }, { key: "single", type: "check", label: "One long page (no page breaks)" }, { key: "noads", type: "check", label: "Hide cookie banners & ads", default: true }] },
        "email-to-pdf": office(".eml,.msg", "Select email files", [{ key: "attachments", type: "check", label: "Include attachments", default: true }]),
        "cad-to-pdf": office(".dwg,.dxf", "Select CAD drawings", [{ key: "layout", type: "seg", label: "Export", default: "model", options: [["model", "Model space"], ["layouts", "All layouts"]] }, { key: "mono", type: "check", label: "Black & white" }]),
        "ps-to-pdf": office(".ps,.eps", "Select PostScript files"),
        "xps-to-pdf": office(".xps,.oxps", "Select XPS files"),
        "iwork-to-pdf": office(".pages,.numbers,.key", "Select Pages, Numbers or Keynote files"),
        "pdf-to-word": fromPdf("Word", [{ key: "mode", type: "cards", label: "Layout", default: "flow", options: [["flow", "Easy to edit", "flowing text"], ["exact", "Exact layout", "looks identical"]] }]),
        "pdf-to-excel": fromPdf("Excel", [{ key: "sheets", type: "seg", label: "Sheets", default: "page", options: [["page", "One per page"], ["table", "One per table"], ["one", "All in one"]] }]),
        "pdf-to-ppt": fromPdf("PowerPoint", [{ key: "editable", type: "check", label: "Editable text boxes", default: true }]),
        "pdf-to-epub": fromPdf("EPUB"),
        "pdf-to-rtf": fromPdf("RTF"),
        "pdf-to-odt": fromPdf("ODT"),
        "pdf-to-pdfa": { accept: "pdf", view: "thumbs", action: "Convert to PDF/A", options: [{ key: "level", type: "select", label: "Conformance", default: "2b", options: [["1b", "PDF/A-1b"], ["2b", "PDF/A-2b (recommended)"], ["2u", "PDF/A-2u"], ["3b", "PDF/A-3b"]] }] },
        "pdf-to-pdfx": { accept: "pdf", view: "thumbs", action: "Convert to PDF/X", options: [{ key: "level", type: "select", label: "Standard", default: "x4", options: [["x1a", "PDF/X-1a"], ["x3", "PDF/X-3"], ["x4", "PDF/X-4"]] }, { key: "profile", type: "select", label: "Colour profile", default: "fogra39", options: [["fogra39", "Coated FOGRA39"], ["swop", "US Web Coated SWOP"], ["gracol", "GRACoL 2013"]] }] },
        "linearize-pdf": { accept: "pdf", view: "thumbs", action: "Optimize for web", options: [] },
        "deep-compress": { accept: "pdf", view: "thumbs", action: "Compress", options: [{ key: "dpi", type: "select", label: "Image resolution", default: "150", options: [["72", "72 DPI (screen)"], ["150", "150 DPI (ebook)"], ["300", "300 DPI (print)"]] }, { key: "fonts", type: "check", label: "Subset fonts", default: true }] },
        "full-text-edit": { accept: "pdf", view: "thumbs", action: "Open editor", options: [{ type: "info", html: "Click any line of text to change it, with the original font and layout." }] },
        "change-fonts": { accept: "pdf", view: "thumbs", action: "Apply fonts", options: [{ key: "embed", type: "check", label: "Embed all missing fonts", default: true }, { key: "replace", type: "select", label: "Replace fonts with", default: "", options: [["", "Keep original"], ["NotoSans", "Noto Sans"], ["Roboto", "Roboto"], ["Merriweather", "Merriweather"]] }] },
        "digital-sign": { accept: "pdf", view: "thumbs", action: "Sign digitally", options: [{ key: "cert", type: "file", label: "Certificate (.pfx / .p12)", accept: ".pfx,.p12" }, { key: "certpw", type: "password", label: "Certificate password" }, { key: "reason", type: "text", label: "Reason", default: "I approve this document" }, { key: "location", type: "text", label: "Location" }, { key: "visible", type: "check", label: "Show a visible signature box", default: true }, { key: "tsa", type: "check", label: "Add trusted timestamp", default: true }] },
        "verify-sign": { accept: "pdf", view: "none", action: "Verify", options: [] },
        "request-signatures": { accept: "pdf", view: "thumbs", action: "Send for signing", options: [{ key: "signers", type: "list", label: "Signers", addLabel: "Add signer", default: () => [{ name: "", email: "" }], fields: [{ key: "name", placeholder: "Name" }, { key: "email", placeholder: "Email" }] }, { key: "order", type: "check", label: "Sign in this order" }, { key: "msg", type: "textarea", rows: 3, label: "Message", placeholder: "Please review and sign." }, { key: "remind", type: "select", label: "Reminders", default: "2", options: [["0", "None"], ["1", "Every day"], ["2", "Every 2 days"], ["7", "Weekly"]] }] },
        "ocr-pro": { accept: "pdf", multiple: true, view: "files", action: "Run OCR", options: [{ key: "langs", type: "text", label: "Languages", default: "eng+hin+pan" }, { key: "deskew", type: "check", label: "Straighten pages", default: true }, { key: "output", type: "seg", label: "Output", default: "pdf", options: [["pdf", "Searchable PDF"], ["docx", "Word"], ["txt", "Text"]] }] },
        "accessibility-tagging": { accept: "pdf", view: "thumbs", action: "Make accessible", options: [{ key: "lang", type: "select", label: "Document language", default: "en", options: LANGS3 }, { key: "alt", type: "check", label: "Generate image descriptions (alt text) with AI", default: true }] },
        "pdfa-validate": { accept: "pdf", view: "none", action: "Validate", options: [{ key: "level", type: "select", label: "Check against", default: "auto", options: [["auto", "Detect automatically"], ["1b", "PDF/A-1b"], ["2b", "PDF/A-2b"], ["3b", "PDF/A-3b"]] }] },
        "print-preflight": { accept: "pdf", view: "thumbs", action: "Run preflight", options: [{ key: "bleed", type: "number", label: "Required bleed (mm)", default: 3 }, { key: "dpi", type: "number", label: "Minimum image DPI", default: 300 }, { key: "cmyk", type: "check", label: "Require CMYK colours", default: true }] },
        "rgb-to-cmyk": { accept: "pdf", view: "thumbs", action: "Convert to CMYK", options: [{ key: "profile", type: "select", label: "Profile", default: "fogra39", options: [["fogra39", "Coated FOGRA39 (Europe/India)"], ["swop", "US Web Coated SWOP"], ["gracol", "GRACoL 2013"]] }, { key: "black", type: "check", label: "Keep pure black text as 100% K", default: true }] },
        "pdf-version": { accept: "pdf", view: "none", action: "Convert", options: [{ key: "version", type: "seg", label: "PDF version", default: "1.7", options: [["1.4", "1.4"], ["1.5", "1.5"], ["1.6", "1.6"], ["1.7", "1.7"], ["2.0", "2.0"]] }] },
        "ai-chat": ai("Start chat", [{ key: "question", type: "textarea", rows: 3, label: "Your question", placeholder: "e.g. What is the refund policy in this contract?" }, { key: "lang", type: "select", label: "Answer in", default: "en", options: LANGS3 }]),
        "ai-summarize": ai("Summarize", [{ key: "length", type: "seg", label: "Length", default: "medium", options: [["short", "Short"], ["medium", "Medium"], ["long", "Detailed"]] }, { key: "style", type: "seg", label: "Style", default: "bullets", options: [["bullets", "Bullet points"], ["para", "Paragraph"]] }, { key: "lang", type: "select", label: "Language", default: "en", options: LANGS3 }]),
        "ai-translate": ai("Translate", [{ key: "to", type: "select", label: "Translate to", default: "hi", options: LANGS3 }, { key: "layout", type: "check", label: "Keep original layout", default: true }]),
        "ai-quiz": ai("Create quiz", [{ key: "count", type: "number", label: "Number of questions", default: 10, min: 3, max: 50 }, { key: "type", type: "seg", label: "Type", default: "mcq", options: [["mcq", "Multiple choice"], ["tf", "True / False"], ["cards", "Flashcards"]] }, { key: "level", type: "seg", label: "Difficulty", default: "medium", options: [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]] }]),
        "ai-keypoints": ai("Extract key points", [{ key: "count", type: "number", label: "How many points", default: 10 }]),
        "ai-rewrite": ai("Rewrite", [{ key: "tone", type: "seg", label: "Tone", default: "simple", options: [["simple", "Simpler"], ["formal", "Formal"], ["friendly", "Friendly"], ["short", "Shorter"]] }]),
        "ai-resume": { ...ai("Parse resumes", [{ key: "format", type: "seg", label: "Export", default: "xlsx", options: [["xlsx", "Excel"], ["json", "JSON"]] }]), multiple: true, view: "files" },
        "ai-invoice": { ...ai("Extract invoice data", [{ key: "format", type: "seg", label: "Export", default: "xlsx", options: [["xlsx", "Excel"], ["csv", "CSV"], ["json", "JSON"]] }, { key: "gst", type: "check", label: "Split GST (CGST / SGST / IGST)", default: true }]), multiple: true, view: "files" },
        "ai-generate": { noFile: true, view: "custom", viewTitle: "Describe your document", renderView(b) {
          b.innerHTML = '<div class="option-info">Describe the document you need on the right \u2014 e.g. \u201CA rent agreement for a 2BHK flat in Ludhiana, 11 months\u201D.</div>';
        }, action: "Generate PDF", actionIcon: "wand-sparkles", options: [{ key: "prompt", type: "textarea", rows: 6, label: "What should the document say?" }, { key: "lang", type: "select", label: "Language", default: "en", options: LANGS3 }, { key: "style", type: "seg", label: "Style", default: "formal", options: [["formal", "Formal"], ["simple", "Simple"], ["creative", "Creative"]] }] },
        __default: { accept: "pdf", view: "thumbs", options: [] }
      };
    }
  });

  // js/tools/sign.js
  var sign_exports = {};
  __export(sign_exports, {
    default: () => sign_default
  });
  function editorTool2(tools, def, suffix, extra = {}) {
    return {
      accept: "pdf",
      view: "editor",
      editorTools: tools,
      editorDefault: def,
      action: "Save PDF",
      actionIcon: "save",
      validate: (ctx) => !ctx.state.objects?.length ? "Place something on the page first" : null,
      async run(ctx) {
        const doc = await loadDoc(ctx.files[0].bytes);
        await applyObjects(doc, ctx.state.objects);
        if (ctx.values.flatten) {
          try {
            doc.getForm().flatten();
          } catch {
          }
        }
        return { files: [{ name: outName(ctx, suffix), blob: await saveDoc(doc) }] };
      },
      ...extra
    };
  }
  async function readFields(bytes) {
    const P = await PL();
    const doc = await loadDoc(bytes);
    let fields = [];
    try {
      fields = doc.getForm().getFields();
    } catch {
    }
    return fields.map((f, i) => {
      const name = f.getName();
      let type = "text", value = "", options = [];
      if (f instanceof P.PDFTextField) value = f.getText() || "";
      else if (f instanceof P.PDFCheckBox) {
        type = "check";
        value = f.isChecked();
      } else if (f instanceof P.PDFDropdown) {
        type = "select";
        options = f.getOptions();
        value = f.getSelected()[0] || "";
      } else if (f instanceof P.PDFOptionList) {
        type = "select";
        options = f.getOptions();
        value = f.getSelected()[0] || "";
      } else if (f instanceof P.PDFRadioGroup) {
        type = "select";
        options = f.getOptions();
        value = f.getSelected() || "";
      } else if (f instanceof P.PDFSignature) type = "signature";
      else type = "other";
      return { i, name, type, value, options, readOnly: f.isReadOnly?.() };
    });
  }
  var sign_default;
  var init_sign = __esm({
    "js/tools/sign.js"() {
      init_pdf();
      init_editor();
      init_ui();
      init_htmlpdf();
      init_common();
      init_optimize();
      sign_default = {
        "sign-pdf": editorTool2(["signature", "initials", "date", "text", "image"], "signature", "signed", {
          action: "Sign & save",
          actionIcon: "signature",
          options: [
            { type: "info", html: "<b>1.</b> Tap <b>Signature</b>, draw / type / upload it.<br><b>2.</b> Tap on the page where it goes.<br><b>3.</b> Drag to move, use the round handle to resize. \u201CAll pages\u201D copies it to every page." },
            { key: "flatten", type: "check", label: "Lock form fields after signing" }
          ],
          about: "Your signature can be saved on this device so you can sign the next document in one tap. For a certificate-based digital signature (DSC), see Digital Certificate Signature."
        }),
        "fill-forms": {
          accept: "pdf",
          view: "thumbs",
          action: "Save filled form",
          actionIcon: "save",
          async init(ctx) {
            ctx.state.fields = await readFields(ctx.files[0].bytes);
            ctx.state.fields.forEach((f) => {
              ctx.values["f" + f.i] = f.value;
            });
          },
          options: (ctx) => {
            const fs = ctx.state.fields.filter((f) => ["text", "check", "select"].includes(f.type));
            if (!fs.length) return [{ type: "info", warn: true, html: 'This PDF has no fillable fields. Use <a href="#/add-text">Add Text</a> to type on it, or <a href="#/create-form">Create Fillable Form</a> to add fields.' }];
            return [
              { type: "info", html: `${fs.length} field${fs.length > 1 ? "s" : ""} found. Fill them in below.` },
              ...fs.map((f) => f.type === "check" ? { key: "f" + f.i, type: "check", label: f.name } : f.type === "select" ? { key: "f" + f.i, type: "select", label: f.name, options: [["", "\u2014 choose \u2014"], ...f.options.map((o) => [o, o])] } : { key: "f" + f.i, type: "text", label: f.name }),
              { key: "flatten", type: "check", label: "Lock answers (flatten) so they can\u2019t be changed" }
            ];
          },
          async run(ctx) {
            const P = await PL();
            const doc = await loadDoc(ctx.files[0].bytes);
            const form = doc.getForm();
            const fields = form.getFields();
            for (const f of ctx.state.fields) {
              const fld = fields[f.i];
              const v = ctx.values["f" + f.i];
              if (!fld || f.readOnly) continue;
              try {
                if (fld instanceof P.PDFTextField) fld.setText(String(v ?? ""));
                else if (fld instanceof P.PDFCheckBox) v ? fld.check() : fld.uncheck();
                else if ((fld instanceof P.PDFDropdown || fld instanceof P.PDFOptionList) && v) fld.select(v);
                else if (fld instanceof P.PDFRadioGroup && v) fld.select(v);
              } catch (e) {
                throw new Error(`Couldn\u2019t fill \u201C${f.name}\u201D: ${/WinAnsi/.test(e.message) ? "this form\u2019s font can\u2019t show some of the characters you typed (e.g. Hindi). Use Add Text instead." : e.message}`);
              }
            }
            try {
              form.updateFieldAppearances();
            } catch {
            }
            if (ctx.values.flatten) form.flatten();
            return { files: [{ name: outName(ctx, "filled"), blob: await saveDoc(doc) }] };
          }
        },
        "create-form": editorTool2(["field-text", "field-check", "field-select", "field-sign", "text"], "field-text", "form", {
          action: "Create form",
          actionIcon: "text-cursor-input",
          options: [{ type: "info", html: "Draw boxes where people should type. Give each field a name below the page. Checkboxes and dropdowns work in every PDF reader." }]
        }),
        "flatten-forms": { ...optimize_default["flatten-pdf"], action: "Flatten form", options: [{ type: "info", html: "Filled answers become part of the page and can no longer be edited." }], async run(ctx) {
          const doc = await optimize_default["flatten-pdf"].apply(ctx.files[0].bytes, { mode: "forms" });
          return { files: [{ name: outName(ctx, "flattened"), blob: await saveDoc(doc) }] };
        } },
        "extract-form-data": {
          accept: "pdf",
          multiple: true,
          view: "files",
          action: "Export data",
          actionIcon: "table-properties",
          options: [{ key: "format", type: "seg", label: "Format", default: "csv", options: [["csv", "CSV (Excel)"], ["json", "JSON"]] }, { type: "info", html: "Add many filled copies of the same form to get one row per file." }],
          async run(ctx) {
            const rows = [];
            const names = /* @__PURE__ */ new Set();
            for (const f of ctx.files) {
              const fields = await readFields(f.bytes);
              const row = { file: f.name };
              fields.forEach((x) => {
                names.add(x.name);
                row[x.name] = typeof x.value === "boolean" ? x.value ? "Yes" : "No" : x.value;
              });
              rows.push(row);
            }
            if (!names.size) throw new Error("No form fields were found.");
            const cols = ["file", ...names];
            const out = ctx.values.format === "json" ? new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }) : new Blob(["\uFEFF" + toCSV([cols, ...rows.map((r) => cols.map((c) => String(r[c] ?? "")))])], { type: "text/csv;charset=utf-8" });
            const table2 = h("div.report-wrap", h("table.report", h("thead", h("tr", cols.map((c) => h("th", esc(c))))), h("tbody", rows.slice(0, 50).map((r) => h("tr", cols.map((c) => h("td", esc(String(r[c] ?? "")))))))));
            return { files: [{ name: `form-data.${ctx.values.format}`, blob: out }], message: `${names.size} fields from ${rows.length} file${rows.length > 1 ? "s" : ""}.`, html: table2 };
          }
        },
        "date-stamp": editorTool2(["date", "initials", "text"], "date", "dated", { options: [{ type: "info", html: "Tap <b>Date</b> and then the page. Tap the date to change its text or format. <b>Initials</b> lets you draw or type them once and reuse." }] }),
        "stamps": editorTool2(["stamp", "date", "text"], "stamp", "stamped", { options: [{ type: "info", html: "Tap on the page to place a stamp, then choose APPROVED, PAID, DRAFT\u2026 or type your own text. Change the colour below the page." }] })
      };
    }
  });

  // js/app.js
  init_config();
  init_tools();

  // js/data/i18n.js
  var LANGS = { en: "English", hi: "\u0939\u093F\u0902\u0926\u0940", pa: "\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40" };
  var STR = {
    en: {
      eyebrow: "100+ free PDF tools \xB7 No sign-up",
      h1a: "Every PDF tool you need.",
      h1b: "Free, fast and private.",
      sub: "Merge, compress, convert, edit and sign PDFs right in your browser. <strong>Your files never leave your device.</strong>",
      search: "What do you want to do with your PDF?",
      or: "or",
      drop: "Drop any file here",
      dropSub: "We\u2019ll suggest the right tools for it",
      choose: "Choose file",
      trust1: "Files stay on your device",
      trust2: "Instant processing",
      trust3: "Free, no sign-up",
      recent: "Recently used",
      popular: "Most popular tools",
      popularSub: "The tools people use every day.",
      all: "All PDF tools",
      allSub: "Everything you can do with a PDF, in one place.",
      how: "How it works",
      step1: "Choose your file",
      step1d: "Tap \u201CChoose file\u201D or drag it in. Works with your phone gallery, files and camera.",
      step2: "Pick options",
      step2d: "Set page ranges, quality, passwords and more \u2014 everything is optional.",
      step3: "Download",
      step3d: "Your new file is ready in seconds. Nothing was uploaded anywhere.",
      faq: "Frequently asked questions",
      suggested: "Suggested tools for",
      soon: "Soon",
      showSoon: "Show upcoming tools",
      nav_all: "All tools",
      nav_convert: "Convert",
      nav_organize: "Organize",
      nav_edit: "Edit",
      nav_sign: "Sign",
      nav_security: "Security"
    },
    hi: {
      eyebrow: "100+ \u092E\u0941\u092B\u093C\u094D\u0924 PDF \u091F\u0942\u0932 \xB7 \u092C\u093F\u0928\u093E \u0938\u093E\u0907\u0928-\u0905\u092A",
      h1a: "PDF \u0915\u093E \u0939\u0930 \u091F\u0942\u0932, \u090F\u0915 \u0939\u0940 \u091C\u0917\u0939\u0964",
      h1b: "\u092E\u0941\u092B\u093C\u094D\u0924, \u0924\u0947\u091C\u093C \u0914\u0930 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924\u0964",
      sub: "PDF \u0915\u094B \u091C\u094B\u0921\u093C\u0947\u0902, \u091B\u094B\u091F\u093E \u0915\u0930\u0947\u0902, \u092C\u0926\u0932\u0947\u0902, \u090F\u0921\u093F\u091F \u0915\u0930\u0947\u0902 \u0914\u0930 \u0938\u093E\u0907\u0928 \u0915\u0930\u0947\u0902 \u2014 \u0938\u0940\u0927\u0947 \u0905\u092A\u0928\u0947 \u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930 \u092E\u0947\u0902\u0964 <strong>\u0906\u092A\u0915\u0940 \u092B\u093C\u093E\u0907\u0932\u0947\u0902 \u0906\u092A\u0915\u0947 \u0921\u093F\u0935\u093E\u0907\u0938 \u0938\u0947 \u092C\u093E\u0939\u0930 \u0928\u0939\u0940\u0902 \u091C\u093E\u0924\u0940\u0902\u0964</strong>",
      search: "\u0906\u092A \u0905\u092A\u0928\u0940 PDF \u0915\u0947 \u0938\u093E\u0925 \u0915\u094D\u092F\u093E \u0915\u0930\u0928\u093E \u091A\u093E\u0939\u0924\u0947 \u0939\u0948\u0902?",
      or: "\u092F\u093E",
      drop: "\u0915\u094B\u0908 \u092D\u0940 \u092B\u093C\u093E\u0907\u0932 \u092F\u0939\u093E\u0901 \u0921\u093E\u0932\u0947\u0902",
      dropSub: "\u0939\u092E \u0909\u0938\u0915\u0947 \u0932\u093F\u090F \u0938\u0939\u0940 \u091F\u0942\u0932 \u0938\u0941\u091D\u093E\u090F\u0901\u0917\u0947",
      choose: "\u092B\u093C\u093E\u0907\u0932 \u091A\u0941\u0928\u0947\u0902",
      trust1: "\u092B\u093C\u093E\u0907\u0932\u0947\u0902 \u0906\u092A\u0915\u0947 \u0921\u093F\u0935\u093E\u0907\u0938 \u092A\u0930 \u0939\u0940 \u0930\u0939\u0924\u0940 \u0939\u0948\u0902",
      trust2: "\u0924\u0941\u0930\u0902\u0924 \u092A\u094D\u0930\u094B\u0938\u0947\u0938\u093F\u0902\u0917",
      trust3: "\u092E\u0941\u092B\u093C\u094D\u0924, \u092C\u093F\u0928\u093E \u0938\u093E\u0907\u0928-\u0905\u092A",
      recent: "\u0939\u093E\u0932 \u0939\u0940 \u092E\u0947\u0902 \u0907\u0938\u094D\u0924\u0947\u092E\u093E\u0932 \u0915\u093F\u090F",
      popular: "\u0938\u092C\u0938\u0947 \u0932\u094B\u0915\u092A\u094D\u0930\u093F\u092F \u091F\u0942\u0932",
      popularSub: "\u091C\u094B \u091F\u0942\u0932 \u0932\u094B\u0917 \u0930\u094B\u091C\u093C \u0907\u0938\u094D\u0924\u0947\u092E\u093E\u0932 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964",
      all: "\u0938\u092D\u0940 PDF \u091F\u0942\u0932",
      allSub: "PDF \u0915\u0947 \u0938\u093E\u0925 \u091C\u094B \u0915\u0941\u091B \u092D\u0940 \u0915\u0930\u0928\u093E \u0939\u094B, \u0938\u092C \u090F\u0915 \u091C\u0917\u0939\u0964",
      how: "\u092F\u0939 \u0915\u0948\u0938\u0947 \u0915\u093E\u092E \u0915\u0930\u0924\u093E \u0939\u0948",
      step1: "\u092B\u093C\u093E\u0907\u0932 \u091A\u0941\u0928\u0947\u0902",
      step1d: "\u201C\u092B\u093C\u093E\u0907\u0932 \u091A\u0941\u0928\u0947\u0902\u201D \u0926\u092C\u093E\u090F\u0901 \u092F\u093E \u092B\u093C\u093E\u0907\u0932 \u092F\u0939\u093E\u0901 \u0916\u0940\u0902\u091A\u0947\u0902\u0964 \u092B\u093C\u094B\u0928 \u0917\u0948\u0932\u0930\u0940 \u0914\u0930 \u0915\u0948\u092E\u0930\u093E \u092D\u0940 \u091A\u0932\u0924\u0947 \u0939\u0948\u0902\u0964",
      step2: "\u0935\u093F\u0915\u0932\u094D\u092A \u091A\u0941\u0928\u0947\u0902",
      step2d: "\u092A\u0947\u091C \u0930\u0947\u0902\u091C, \u0915\u094D\u0935\u093E\u0932\u093F\u091F\u0940, \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0935\u0917\u0948\u0930\u0939 \u0938\u0947\u091F \u0915\u0930\u0947\u0902 \u2014 \u0938\u092C \u0935\u0948\u0915\u0932\u094D\u092A\u093F\u0915 \u0939\u0948\u0964",
      step3: "\u0921\u093E\u0909\u0928\u0932\u094B\u0921 \u0915\u0930\u0947\u0902",
      step3d: "\u0906\u092A\u0915\u0940 \u0928\u0908 \u092B\u093C\u093E\u0907\u0932 \u0915\u0941\u091B \u0939\u0940 \u0938\u0947\u0915\u0902\u0921 \u092E\u0947\u0902 \u0924\u0948\u092F\u093E\u0930\u0964 \u0915\u0941\u091B \u092D\u0940 \u0905\u092A\u0932\u094B\u0921 \u0928\u0939\u0940\u0902 \u0939\u0941\u0906\u0964",
      faq: "\u0905\u0915\u094D\u0938\u0930 \u092A\u0942\u091B\u0947 \u091C\u093E\u0928\u0947 \u0935\u093E\u0932\u0947 \u0938\u0935\u093E\u0932",
      suggested: "\u0907\u0938\u0915\u0947 \u0932\u093F\u090F \u0938\u0941\u091D\u093E\u090F \u0917\u090F \u091F\u0942\u0932",
      soon: "\u091C\u0932\u094D\u0926",
      showSoon: "\u0906\u0928\u0947 \u0935\u093E\u0932\u0947 \u091F\u0942\u0932 \u0926\u093F\u0916\u093E\u090F\u0901",
      nav_all: "\u0938\u092D\u0940 \u091F\u0942\u0932",
      nav_convert: "\u092C\u0926\u0932\u0947\u0902",
      nav_organize: "\u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093F\u0924 \u0915\u0930\u0947\u0902",
      nav_edit: "\u090F\u0921\u093F\u091F",
      nav_sign: "\u0938\u093E\u0907\u0928",
      nav_security: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E"
    },
    pa: {
      eyebrow: "100+ \u0A2E\u0A41\u0A2B\u0A3C\u0A24 PDF \u0A1F\u0A42\u0A32 \xB7 \u0A2C\u0A3F\u0A28\u0A3E\u0A02 \u0A38\u0A3E\u0A08\u0A28-\u0A05\u0A71\u0A2A",
      h1a: "PDF \u0A26\u0A3E \u0A39\u0A30 \u0A1F\u0A42\u0A32, \u0A07\u0A71\u0A15\u0A4B \u0A25\u0A3E\u0A02\u0964",
      h1b: "\u0A2E\u0A41\u0A2B\u0A3C\u0A24, \u0A24\u0A47\u0A1C\u0A3C \u0A05\u0A24\u0A47 \u0A38\u0A41\u0A30\u0A71\u0A16\u0A3F\u0A05\u0A24\u0964",
      sub: "PDF \u0A28\u0A42\u0A70 \u0A1C\u0A4B\u0A5C\u0A4B, \u0A1B\u0A4B\u0A1F\u0A3E \u0A15\u0A30\u0A4B, \u0A2C\u0A26\u0A32\u0A4B, \u0A10\u0A21\u0A3F\u0A1F \u0A15\u0A30\u0A4B \u0A05\u0A24\u0A47 \u0A38\u0A3E\u0A08\u0A28 \u0A15\u0A30\u0A4B \u2014 \u0A38\u0A3F\u0A71\u0A27\u0A47 \u0A06\u0A2A\u0A23\u0A47 \u0A2C\u0A4D\u0A30\u0A3E\u0A0A\u0A1C\u0A3C\u0A30 \u0A35\u0A3F\u0A71\u0A1A\u0964 <strong>\u0A24\u0A41\u0A39\u0A3E\u0A21\u0A40\u0A06\u0A02 \u0A2B\u0A3C\u0A3E\u0A08\u0A32\u0A3E\u0A02 \u0A24\u0A41\u0A39\u0A3E\u0A21\u0A47 \u0A21\u0A3F\u0A35\u0A3E\u0A08\u0A38 \u0A24\u0A4B\u0A02 \u0A2C\u0A3E\u0A39\u0A30 \u0A28\u0A39\u0A40\u0A02 \u0A1C\u0A3E\u0A02\u0A26\u0A40\u0A06\u0A02\u0964</strong>",
      search: "\u0A24\u0A41\u0A38\u0A40\u0A02 \u0A06\u0A2A\u0A23\u0A40 PDF \u0A28\u0A3E\u0A32 \u0A15\u0A40 \u0A15\u0A30\u0A28\u0A3E \u0A1A\u0A3E\u0A39\u0A41\u0A70\u0A26\u0A47 \u0A39\u0A4B?",
      or: "\u0A1C\u0A3E\u0A02",
      drop: "\u0A15\u0A4B\u0A08 \u0A35\u0A40 \u0A2B\u0A3C\u0A3E\u0A08\u0A32 \u0A07\u0A71\u0A25\u0A47 \u0A2A\u0A3E\u0A13",
      dropSub: "\u0A05\u0A38\u0A40\u0A02 \u0A09\u0A38 \u0A32\u0A08 \u0A38\u0A39\u0A40 \u0A1F\u0A42\u0A32 \u0A38\u0A41\u0A1D\u0A3E\u0A35\u0A3E\u0A02\u0A17\u0A47",
      choose: "\u0A2B\u0A3C\u0A3E\u0A08\u0A32 \u0A1A\u0A41\u0A23\u0A4B",
      trust1: "\u0A2B\u0A3C\u0A3E\u0A08\u0A32\u0A3E\u0A02 \u0A24\u0A41\u0A39\u0A3E\u0A21\u0A47 \u0A21\u0A3F\u0A35\u0A3E\u0A08\u0A38 \u2019\u0A24\u0A47 \u0A39\u0A40 \u0A30\u0A39\u0A3F\u0A70\u0A26\u0A40\u0A06\u0A02 \u0A39\u0A28",
      trust2: "\u0A24\u0A41\u0A30\u0A70\u0A24 \u0A2A\u0A4D\u0A30\u0A4B\u0A38\u0A48\u0A38\u0A3F\u0A70\u0A17",
      trust3: "\u0A2E\u0A41\u0A2B\u0A3C\u0A24, \u0A2C\u0A3F\u0A28\u0A3E\u0A02 \u0A38\u0A3E\u0A08\u0A28-\u0A05\u0A71\u0A2A",
      recent: "\u0A39\u0A3E\u0A32 \u0A39\u0A40 \u0A35\u0A3F\u0A71\u0A1A \u0A35\u0A30\u0A24\u0A47",
      popular: "\u0A38\u0A2D \u0A24\u0A4B\u0A02 \u0A2E\u0A38\u0A3C\u0A39\u0A42\u0A30 \u0A1F\u0A42\u0A32",
      popularSub: "\u0A1C\u0A4B \u0A1F\u0A42\u0A32 \u0A32\u0A4B\u0A15 \u0A39\u0A30 \u0A30\u0A4B\u0A1C\u0A3C \u0A35\u0A30\u0A24\u0A26\u0A47 \u0A39\u0A28\u0964",
      all: "\u0A38\u0A3E\u0A30\u0A47 PDF \u0A1F\u0A42\u0A32",
      allSub: "PDF \u0A28\u0A3E\u0A32 \u0A1C\u0A4B \u0A35\u0A40 \u0A15\u0A30\u0A28\u0A3E \u0A39\u0A4B\u0A35\u0A47, \u0A38\u0A2D \u0A07\u0A71\u0A15 \u0A25\u0A3E\u0A02\u0964",
      how: "\u0A07\u0A39 \u0A15\u0A3F\u0A35\u0A47\u0A02 \u0A15\u0A70\u0A2E \u0A15\u0A30\u0A26\u0A3E \u0A39\u0A48",
      step1: "\u0A2B\u0A3C\u0A3E\u0A08\u0A32 \u0A1A\u0A41\u0A23\u0A4B",
      step1d: "\u201C\u0A2B\u0A3C\u0A3E\u0A08\u0A32 \u0A1A\u0A41\u0A23\u0A4B\u201D \u0A26\u0A2C\u0A3E\u0A13 \u0A1C\u0A3E\u0A02 \u0A2B\u0A3C\u0A3E\u0A08\u0A32 \u0A07\u0A71\u0A25\u0A47 \u0A16\u0A3F\u0A71\u0A1A\u0A4B\u0964 \u0A2B\u0A3C\u0A4B\u0A28 \u0A17\u0A48\u0A32\u0A30\u0A40 \u0A05\u0A24\u0A47 \u0A15\u0A48\u0A2E\u0A30\u0A3E \u0A35\u0A40 \u0A1A\u0A71\u0A32\u0A26\u0A47 \u0A39\u0A28\u0964",
      step2: "\u0A35\u0A3F\u0A15\u0A32\u0A2A \u0A1A\u0A41\u0A23\u0A4B",
      step2d: "\u0A2A\u0A70\u0A28\u0A3E \u0A30\u0A47\u0A02\u0A1C, \u0A15\u0A41\u0A06\u0A32\u0A3F\u0A1F\u0A40, \u0A2A\u0A3E\u0A38\u0A35\u0A30\u0A21 \u0A06\u0A26\u0A3F \u0A38\u0A48\u0A71\u0A1F \u0A15\u0A30\u0A4B \u2014 \u0A38\u0A2D \u0A35\u0A3F\u0A15\u0A32\u0A2A\u0A3F\u0A15 \u0A39\u0A48\u0964",
      step3: "\u0A21\u0A3E\u0A0A\u0A28\u0A32\u0A4B\u0A21 \u0A15\u0A30\u0A4B",
      step3d: "\u0A24\u0A41\u0A39\u0A3E\u0A21\u0A40 \u0A28\u0A35\u0A40\u0A02 \u0A2B\u0A3C\u0A3E\u0A08\u0A32 \u0A15\u0A41\u0A1D \u0A38\u0A15\u0A3F\u0A70\u0A1F\u0A3E\u0A02 \u0A35\u0A3F\u0A71\u0A1A \u0A24\u0A3F\u0A06\u0A30\u0964 \u0A15\u0A41\u0A1D \u0A35\u0A40 \u0A05\u0A71\u0A2A\u0A32\u0A4B\u0A21 \u0A28\u0A39\u0A40\u0A02 \u0A39\u0A4B\u0A07\u0A06\u0964",
      faq: "\u0A05\u0A15\u0A38\u0A30 \u0A2A\u0A41\u0A71\u0A1B\u0A47 \u0A1C\u0A3E\u0A02\u0A26\u0A47 \u0A38\u0A35\u0A3E\u0A32",
      suggested: "\u0A07\u0A38 \u0A32\u0A08 \u0A38\u0A41\u0A1D\u0A3E\u0A0F \u0A1F\u0A42\u0A32",
      soon: "\u0A1C\u0A32\u0A26\u0A40",
      showSoon: "\u0A06\u0A09\u0A23 \u0A35\u0A3E\u0A32\u0A47 \u0A1F\u0A42\u0A32 \u0A26\u0A3F\u0A16\u0A3E\u0A13",
      nav_all: "\u0A38\u0A3E\u0A30\u0A47 \u0A1F\u0A42\u0A32",
      nav_convert: "\u0A2C\u0A26\u0A32\u0A4B",
      nav_organize: "\u0A24\u0A30\u0A24\u0A40\u0A2C",
      nav_edit: "\u0A10\u0A21\u0A3F\u0A1F",
      nav_sign: "\u0A38\u0A3E\u0A08\u0A28",
      nav_security: "\u0A38\u0A41\u0A30\u0A71\u0A16\u0A3F\u0A06"
    }
  };

  // js/app.js
  init_ui();
  init_toolpage();

  // import("./tools/**/*.js") in js/app.js
  var globImport_tools_js = __glob({
    "./tools/advanced.js": () => Promise.resolve().then(() => (init_advanced(), advanced_exports)),
    "./tools/common.js": () => Promise.resolve().then(() => (init_common(), common_exports)),
    "./tools/compare.js": () => Promise.resolve().then(() => (init_compare(), compare_exports)),
    "./tools/convert-from.js": () => Promise.resolve().then(() => (init_convert_from(), convert_from_exports)),
    "./tools/convert-to.js": () => Promise.resolve().then(() => (init_convert_to(), convert_to_exports)),
    "./tools/edit.js": () => Promise.resolve().then(() => (init_edit(), edit_exports)),
    "./tools/extract.js": () => Promise.resolve().then(() => (init_extract(), extract_exports)),
    "./tools/ocr.js": () => Promise.resolve().then(() => (init_ocr(), ocr_exports)),
    "./tools/optimize.js": () => Promise.resolve().then(() => (init_optimize(), optimize_exports)),
    "./tools/organize.js": () => Promise.resolve().then(() => (init_organize(), organize_exports)),
    "./tools/security.js": () => Promise.resolve().then(() => (init_security(), security_exports)),
    "./tools/server.js": () => Promise.resolve().then(() => (init_server(), server_exports)),
    "./tools/sign.js": () => Promise.resolve().then(() => (init_sign(), sign_exports))
  });

  // js/app.js
  var lang = store.get("lang", "en");
  var t = (k) => STR[lang]?.[k] ?? STR.en[k] ?? k;
  var app = document.getElementById("app");
  var cleanup2 = null;
  function applyTheme() {
    const pref = store.get("theme", null);
    if (pref) document.documentElement.setAttribute("data-theme", pref);
    const attr = document.documentElement.getAttribute("data-theme");
    const dark = attr ? attr === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
    document.querySelector("meta[name=theme-color]")?.setAttribute("content", dark ? "#111827" : "#ffffff");
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);
  function toggleTheme() {
    store.set("theme", document.documentElement.classList.contains("dark") ? "light" : "dark");
    applyTheme();
  }
  function header() {
    const navCats = [["convert-to", "nav_convert"], ["organize", "nav_organize"], ["edit", "nav_edit"], ["sign", "nav_sign"], ["security", "nav_security"]];
    const mega = h("div.mega", { id: "mega" }, CATEGORIES.filter((c) => c.id !== "all").map((c) => h(
      "div",
      { style: { "--cat-color": c.color } },
      h("h6", { style: { color: c.color } }, ic(c.icon), esc(c.label)),
      TOOLS.filter((x) => x.category === c.id).map((x) => h("a", { href: `#/${x.slug}`, class: x.status === "server" ? "srv" : "" }, esc(x.name)))
    )));
    const allBtn = h("a", { href: "#/all", "aria-haspopup": "true", "aria-expanded": "false", on: { click: (e) => {
      if (matchMedia("(min-width: 961px)").matches) {
        e.preventDefault();
        const open = !mega.classList.contains("open");
        mega.classList.toggle("open", open);
        allBtn.setAttribute("aria-expanded", String(open));
      }
    } } }, t("nav_all"), " ", ic("chevron-down"));
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav-tools")) mega.classList.remove("open");
    });
    const nav = h("nav.main-nav", { "aria-label": "Main" }, h("div.nav-tools", allBtn, mega), navCats.map(([id, k]) => h("a", { href: `#/category/${id}` }, t(k))));
    const hs = searchBox({ compact: true });
    const langDrop = h("div.lang-dropdown", Object.entries(LANGS).map(([k, v]) => h("a", { href: "#", on: { click: (e) => {
      e.preventDefault();
      store.set("lang", k);
      lang = k;
      document.documentElement.lang = k;
      render(true);
    } } }, v)));
    const langBtn = h("button.lang-btn", { type: "button", "aria-label": "Change language", on: { click: (e) => {
      e.stopPropagation();
      langDrop.classList.toggle("open");
    } } }, ic("languages"), lang.toUpperCase());
    document.addEventListener("click", () => langDrop.classList.remove("open"));
    const burger = h("button.hamburger", { type: "button", "aria-label": "Open menu", "aria-expanded": "false", on: { click: () => toggleDrawer() } }, h("span"), h("span"), h("span"));
    const themeBtn = h("button.icon-btn.theme-btn", { type: "button", "aria-label": "Toggle dark mode", on: { click: toggleTheme } }, ic("moon", "moon"), ic("sun", "sun"));
    const el = h("header.site-header", h(
      "div.container.header-inner",
      h("a.logo", { href: "#/", "aria-label": `${CONFIG.SITE_NAME} home` }, h("span.logo-mark", ic("file-text")), h("span.logo-text", esc(CONFIG.SITE_NAME.replace(/^PDF/, "")), h("strong", "PDF"))),
      nav,
      hs.el,
      h("div.header-right", h("div.lang-picker", langBtn, langDrop), themeBtn, burger)
    ));
    if (/^PDF/.test(CONFIG.SITE_NAME)) {
      const lt = el.querySelector(".logo-text");
      lt.innerHTML = `<strong>PDF</strong>${esc(CONFIG.SITE_NAME.slice(3))}`;
    }
    const drawerSearch = searchBox({ compact: true, inDrawer: true });
    const drawer = h(
      "div.mobile-drawer",
      { id: "drawer", "aria-hidden": "true" },
      drawerSearch.el,
      h("nav", { "aria-label": "Categories", style: { marginTop: "1rem" } }, CATEGORIES.map((c) => h("a", { href: c.id === "all" ? "#/all" : `#/category/${c.id}`, style: { display: "flex", alignItems: "center", gap: ".6rem" }, on: { click: () => toggleDrawer(false) } }, h("span", { style: { color: c.color, display: "flex" } }, ic(c.icon)), esc(c.label)))),
      h("div.mobile-drawer-footer", h("button.btn.btn-ghost", { type: "button", on: { click: toggleTheme } }, ic("moon"), "Theme"), h("select.option-select", { "aria-label": "Language", style: { width: "auto" }, on: { change: (e) => {
        store.set("lang", e.target.value);
        lang = e.target.value;
        toggleDrawer(false);
        render(true);
      } } }, Object.entries(LANGS).map(([k, v]) => h("option", { value: k, selected: k === lang }, v))))
    );
    drawerSearch.el.style.display = "block";
    drawerSearch.el.style.maxWidth = "none";
    drawerSearch.el.style.margin = "0";
    function toggleDrawer(force) {
      const open = force ?? !drawer.classList.contains("open");
      drawer.classList.toggle("open", open);
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      drawer.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("no-scroll", open);
    }
    window.addEventListener("hashchange", () => toggleDrawer(false));
    return [el, drawer];
  }
  function searchBox({ compact = false, inDrawer = false } = {}) {
    const input = h("input", { type: "search", class: compact ? "" : "search-bar", placeholder: compact ? "Search tools\u2026" : t("search"), "aria-label": "Search tools", autocomplete: "off", role: "combobox", "aria-expanded": "false", "aria-autocomplete": "list" });
    const dd = h("div.search-dropdown", { role: "listbox" });
    let results = [], focus = -1;
    const draw = () => {
      results = searchTools(input.value, 10);
      focus = results.length ? 0 : -1;
      dd.innerHTML = "";
      if (!input.value.trim()) {
        dd.classList.remove("open");
        input.setAttribute("aria-expanded", "false");
        return;
      }
      if (!results.length) dd.appendChild(h("div.search-empty", `No tools found for \u201C${esc(input.value)}\u201D`));
      results.forEach((x, i) => dd.appendChild(h(
        "a.search-result-item",
        { href: `#/${x.slug}`, role: "option", class: i === focus ? "focused" : "", style: { "--cat-color": catById[x.category].color } },
        h("div.search-result-icon", ic(x.icon)),
        h("div.search-result-text", h("div.search-result-name", esc(x.name), h(`span.search-result-badge.${x.status === "live" ? "badge-live" : "badge-soon"}`, x.status === "live" ? "Free" : t("soon"))), h("div.search-result-desc", esc(x.description)))
      )));
      dd.classList.add("open");
      input.setAttribute("aria-expanded", "true");
    };
    const move = (d) => {
      if (!results.length) return;
      focus = (focus + d + results.length) % results.length;
      dd.querySelectorAll(".search-result-item").forEach((el2, i) => el2.classList.toggle("focused", i === focus));
      dd.querySelectorAll(".search-result-item")[focus]?.scrollIntoView({ block: "nearest" });
    };
    input.addEventListener("input", draw);
    input.addEventListener("focus", draw);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        move(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        move(-1);
      } else if (e.key === "Enter" && results[focus]) {
        e.preventDefault();
        location.hash = `#/${results[focus].slug}`;
        input.value = "";
        dd.classList.remove("open");
        input.blur();
      } else if (e.key === "Escape") {
        dd.classList.remove("open");
        input.blur();
      }
    });
    dd.addEventListener("click", () => {
      input.value = "";
      dd.classList.remove("open");
    });
    document.addEventListener("click", (e) => {
      if (!el.contains(e.target)) dd.classList.remove("open");
    });
    const el = compact ? h("div.header-search", ic("search"), input, dd) : h("div.search-wrap", h("span.search-icon", ic("search")), input, h("kbd.search-kbd", "/"), dd);
    el.input = input;
    return { el, input };
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) {
      const s = document.querySelector(".search-bar") || document.querySelector(".header-search input");
      if (s) {
        e.preventDefault();
        s.focus();
      }
    }
  });
  var card = (x) => h(
    `a.tool-card${x.status === "server" ? ".coming-soon" : ""}`,
    { href: `#/${x.slug}`, style: { "--cat-color": catById[x.category].color }, "data-cat": x.category },
    h("div.tool-card-icon", ic(x.icon)),
    h("div.tool-card-body", h("div.tool-card-name", esc(x.name)), h("div.tool-card-desc", esc(x.description)))
  );
  var popCard = (x) => h(
    "a.popular-card",
    { href: `#/${x.slug}`, style: { "--cat-color": catById[x.category].color } },
    h("div.popular-card-icon", ic(x.icon)),
    h("div", h("div.popular-card-name", esc(x.name)), h("div.popular-card-desc", esc(x.description))),
    h("div.popular-card-arrow", ic("arrow-right"))
  );
  function home(initialCat = "all") {
    document.title = `${CONFIG.SITE_NAME} \u2014 ${CONFIG.TAGLINE}`;
    const live = TOOLS.filter((x) => x.status === "live").length;
    const main = h("div");
    const s = searchBox();
    const fileInput = h("input", { type: "file", multiple: true, "aria-label": t("choose") });
    const smart = h("div.smart-panel", { "aria-live": "polite" });
    const dz = h(
      "div.dropzone",
      { tabindex: 0, role: "button", "aria-label": t("drop") },
      h("div.dropzone-icon", ic("upload")),
      h("h3", t("drop")),
      h("p", t("dropSub")),
      h("span.btn.btn-primary", ic("folder-open"), t("choose")),
      h("p.dropzone-formats", "PDF \xB7 JPG \xB7 PNG \xB7 HEIC \xB7 TXT \xB7 DOCX \xB7 XLSX \xB7 PPTX and more"),
      fileInput
    );
    dz.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInput.click();
      }
    });
    const onFiles = (files) => {
      if (!files.length) return;
      const f = files[0];
      let list = suggestForFile(f.name);
      if (files.length > 1 && files.every((x) => /\.pdf$/i.test(x.name))) list = [toolBySlug["merge-pdf"], ...list.filter((x) => x.slug !== "merge-pdf")];
      else if (files.length > 1 && files.every((x) => /^image\//.test(x.type))) list = [toolBySlug["jpg-to-pdf"], toolBySlug["combine-files"], ...list.filter((x) => !["jpg-to-pdf", "combine-files"].includes(x.slug))];
      smart.innerHTML = "";
      smart.append(
        h("div.smart-panel-header", h("h4", `${t("suggested")} ${files.length > 1 ? `${files.length} files` : "this file"}`), h("button", { type: "button", "aria-label": "Close", on: { click: () => smart.classList.remove("show") } }, ic("x"))),
        h("p.smart-panel-file", { text: files.map((x) => x.name).join(", ") }),
        list.length ? h("div.smart-tools-grid", list.map((x) => h(`a.smart-tool-chip${x.status === "server" ? ".coming-soon" : ""}`, { href: `#/${x.slug}`, on: { click: () => {
          window.__handoff = files;
        } } }, ic(x.icon), esc(x.name), x.status === "server" ? ` \xB7 ${t("soon")}` : ""))) : h("p", { style: { fontSize: ".9rem", color: "var(--text-2)" } }, "We don\u2019t have a tool for this file type yet. Try searching above.")
      );
      smart.classList.add("show");
      smart.scrollIntoView({ behavior: "smooth", block: "nearest" });
      fileInput.value = "";
    };
    fileInput.addEventListener("change", () => onFiles([...fileInput.files]));
    dragDrop(dz, onFiles);
    main.appendChild(h("section.hero", h(
      "div.container.hero-inner",
      h("span.hero-eyebrow", ic("sparkles"), t("eyebrow")),
      h("h1", esc(t("h1a")), h("br"), h("span", esc(t("h1b")))),
      h("p.hero-sub", { html: t("sub") }),
      s.el,
      h("div.hero-or", t("or")),
      dz,
      smart,
      h("div.trust-row", [["shield-check", "trust1"], ["zap", "trust2"], ["heart", "trust3"]].map(([i, k]) => h("span.trust-badge", ic(i), t(k)))),
      h("div.stats-row", h("div.stat", h("b", `${TOOLS.length}`), h("span", "PDF tools")), h("div.stat", h("b", `${live}`), h("span", "work offline in browser")), h("div.stat", h("b", "0"), h("span", "files uploaded")), h("div.stat", h("b", "\u20B90"), h("span", "cost")))
    )));
    const recent = store.get("recent-tools", []).map((x) => toolBySlug[x]).filter(Boolean);
    if (recent.length) main.appendChild(h("section.recent-section.show", h(
      "div.container",
      h("h2", { style: { fontSize: ".85rem", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".75rem" } }, t("recent")),
      h("div.recent-scroll", recent.map((x) => h("a.recent-chip", { href: `#/${x.slug}` }, ic(x.icon), esc(x.name))))
    )));
    main.appendChild(h("section.section", { style: { paddingTop: recent.length ? "2rem" : void 0 } }, h(
      "div.container",
      h("div.section-header", h("span.section-tag", "Popular"), h("h2.section-title", t("popular")), h("p.section-sub", t("popularSub"))),
      h("div.popular-grid", POPULAR.map((x) => popCard(toolBySlug[x])))
    )));
    let cur = initialCat, showSoon = store.get("show-soon", true);
    const chips = h("div.cat-chips", { role: "tablist", "aria-label": "Tool categories" });
    const gridBox = h("div");
    const drawChips = () => {
      chips.innerHTML = "";
      for (const c of CATEGORIES) {
        const n = c.id === "all" ? TOOLS.length : TOOLS.filter((x) => x.category === c.id).length;
        chips.appendChild(h("button.cat-chip", { type: "button", role: "tab", "aria-selected": String(cur === c.id), class: cur === c.id ? "active" : "", on: { click: () => {
          cur = c.id;
          drawChips();
          drawGrid();
        } } }, esc(c.label), h("span.count", `${n}`)));
      }
    };
    const drawGrid = () => {
      gridBox.innerHTML = "";
      const vis = (x) => showSoon || x.status === "live";
      const cats = cur === "all" ? CATEGORIES.filter((c) => c.id !== "all") : [catById[cur]];
      for (const c of cats) {
        const items = TOOLS.filter((x) => x.category === c.id && vis(x));
        if (!items.length) continue;
        if (cur === "all") gridBox.appendChild(h("h3.cat-section-title", { style: { "--cat-color": c.color } }, h("span.dot"), esc(c.label), h("small", `${items.length} tools`)));
        gridBox.appendChild(h("div.tools-grid", items.map(card)));
      }
    };
    drawChips();
    drawGrid();
    const soonToggle = h("label.switch", { style: { maxWidth: "260px", margin: "0 0 1rem auto" } }, h("span", { style: { fontSize: ".85rem", color: "var(--text-2)" } }, t("showSoon")), h("input", { type: "checkbox", checked: showSoon, on: { change: (e) => {
      showSoon = e.target.checked;
      store.set("show-soon", showSoon);
      drawGrid();
    } } }));
    main.appendChild(h("section.section.section-alt", { id: "all-tools" }, h(
      "div.container",
      h("div.section-header", h("span.section-tag", `${TOOLS.length} tools`), h("h2.section-title", t("all")), h("p.section-sub", t("allSub"))),
      h("div.chip-scroll-fade", chips),
      soonToggle,
      gridBox
    )));
    main.appendChild(h("section.section", h("div.container", h(
      "div.features",
      [
        ["shield-check", "Private by design", "Most tools run entirely in your browser. Your documents are never uploaded."],
        ["smartphone", "Made for phones", "Big buttons, camera scanning and touch editing that feel like an app."],
        ["zap", "Fast, even offline", "No waiting for uploads or downloads \u2014 processing starts instantly."],
        ["badge-indian-rupee", "Free forever", "No sign-up, no watermarks, no daily limits on browser tools."]
      ].map(([i, a, b]) => h("div.feature", ic(i), h("h3", a), h("p", b)))
    ))));
    main.appendChild(h("section.section.section-alt", h(
      "div.container",
      h("div.section-header", h("h2.section-title", t("how"))),
      h("div.steps-grid", [1, 2, 3].map((n) => h("div.step-card", h("div.step-num", `${n}`), h("h3", t(`step${n}`)), h("p", t(`step${n}d`)))))
    )));
    const faqs = [
      ["Is it really free?", `Yes. All ${live} browser tools are completely free with no sign-up, no watermark and no limits. A few advanced server tools (like Word conversion and AI) are launching soon.`],
      ["Are my files safe?", "For browser tools, your file is processed on your own device and is never uploaded. You can even turn off your internet after the page loads and the tools keep working."],
      ["Does it work on my phone?", "Yes \u2014 the site is built mobile-first. You can pick files from your gallery or file manager, scan with the camera, and sign or edit with your finger."],
      ["Is there a file size limit?", "There is no fixed limit. Very large files (over 100 MB) may be slow on older phones because your device does the work."],
      ["Can I open password-protected PDFs?", "Yes. You\u2019ll be asked for the password, and it is only used on your device. Use \u201CUnlock PDF\u201D to save a copy without the password."],
      ["Which languages are supported?", "The site is available in English, \u0939\u093F\u0902\u0926\u0940 and \u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40. OCR can read English, Hindi, Punjabi and many other languages."]
    ];
    main.appendChild(h("section.section", h(
      "div.container",
      h("div.section-header", h("h2.section-title", t("faq"))),
      h("div.faq-list", faqs.map(([q, a]) => {
        const item = h("div.faq-item");
        const btn = h("button.faq-q", { type: "button", "aria-expanded": "false", on: { click: () => {
          const o = item.classList.toggle("open");
          btn.setAttribute("aria-expanded", String(o));
        } } }, esc(q), h("span.faq-icon", ic("chevron-down")));
        item.append(btn, h("div.faq-a", h("div.faq-a-inner", esc(a))));
        return item;
      }))
    )));
    document.getElementById("ld-faq")?.remove();
    document.head.appendChild(h("script", { type: "application/ld+json", id: "ld-faq", text: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }) }));
    app.innerHTML = "";
    app.appendChild(main);
    if (initialCat !== "all") document.getElementById("all-tools")?.scrollIntoView();
  }
  function categoryPage(id) {
    const c = catById[id];
    if (!c) return notFound();
    document.title = `${c.label} Tools \u2014 ${CONFIG.SITE_NAME}`;
    const items = TOOLS.filter((x) => x.category === id);
    app.innerHTML = "";
    app.appendChild(h("section.section", { style: { paddingTop: "2rem" } }, h(
      "div.container",
      h("nav.breadcrumb", h("a", { href: "#/" }, "Home"), ic("chevron-right"), h("span", esc(c.label))),
      h("div.tp-head", { style: { "--cat-color": c.color } }, h("div.tp-icon", ic(c.icon)), h("div", h("h1", `${esc(c.label)} tools`), h("p", `${items.filter((x) => x.status === "live").length} free browser tools${items.some((x) => x.status === "server") ? ` + ${items.filter((x) => x.status === "server").length} coming soon` : ""}.`))),
      h("div.tools-grid", items.map(card)),
      h("div.cat-chips", { style: { marginTop: "2.5rem", flexWrap: "wrap" } }, CATEGORIES.filter((x) => x.id !== "all" && x.id !== id).map((x) => h("a.cat-chip", { href: `#/category/${x.id}` }, esc(x.label))))
    )));
  }
  function allPage() {
    home("all");
    setTimeout(() => document.getElementById("all-tools")?.scrollIntoView(), 0);
  }
  function staticPage(title, html) {
    document.title = `${title} \u2014 ${CONFIG.SITE_NAME}`;
    app.innerHTML = "";
    app.appendChild(h("section.section", { style: { paddingTop: "2rem" } }, h("div.container.seo-section", { style: { border: 0 } }, h("div.seo-wrap", h("h1", { style: { fontSize: "2rem", marginBottom: "1rem" } }, esc(title)), h("div", { html })))));
  }
  function notFound() {
    staticPage("Page not found", '<p>That page doesn\u2019t exist. Try the search at the top, or <a href="#/">go to the homepage</a>.</p>');
  }
  async function toolPage(slug) {
    const tool = toolBySlug[slug];
    if (!tool) return notFound();
    app.innerHTML = '<div class="container" style="padding:4rem 0;text-align:center"><div class="spinner"></div></div>';
    let impl;
    try {
      const mod = await globImport_tools_js(`./tools/${tool.status === "server" ? "server" : tool.module}.js`);
      impl = mod.default[slug] || mod.default.__default;
    } catch (e) {
      console.error(e);
      toast("This tool failed to load. Please refresh the page.", "error");
      return;
    }
    if (!impl) return notFound();
    const handoff = window.__handoff || [];
    window.__handoff = null;
    const { renderToolPage: renderToolPage2 } = await Promise.resolve().then(() => (init_toolpage(), toolpage_exports));
    cleanup2 = await renderToolPage2(app, tool, impl, handoff);
  }
  var lastRoute = null;
  async function route(force = false) {
    const path = (location.hash.replace(/^#\/?/, "") || "").split("?")[0];
    if (!force && path === lastRoute) return;
    lastRoute = path;
    cleanup2?.();
    cleanup2 = null;
    document.body.classList.remove("has-bar", "no-scroll");
    if (!path) home();
    else if (path === "all") allPage();
    else if (path.startsWith("category/")) categoryPage(path.split("/")[1]);
    else if (path === "about") staticPage("About", `<p>${CONFIG.SITE_NAME} brings every PDF tool together in one fast, private, mobile-friendly site. Most tools run 100% in your browser using open-source engines (pdf.js, pdf-lib, Tesseract), so your documents never leave your device.</p>`);
    else if (path === "privacy") staticPage("Privacy Policy", `<p>Browser tools process your files locally on your device. We do not upload, store or see them. We may use privacy-friendly analytics to count page views.</p><p>Server tools (marked \u201CRuns on server\u201D) upload files over an encrypted connection; files are deleted automatically within 1 hour.</p><p>Preferences such as theme, language and a saved signature are stored only in your browser\u2019s local storage, and you can clear them any time.</p>`);
    else if (path === "terms") staticPage("Terms of Use", `<p>${CONFIG.SITE_NAME} is provided \u201Cas is\u201D. Only process documents you have the right to use. Do not use the tools to remove protection from documents you are not authorised to open.</p>`);
    else await toolPage(path);
    if (!path.startsWith("category/") && path !== "all") window.scrollTo(0, 0);
    document.querySelectorAll(".main-nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#/${path}`));
  }
  function footer() {
    const col = (title, ids) => h("div.footer-col", h("h5", title), h("ul", ids.map((s) => h("li", h("a", { href: `#/${s}` }, esc(toolBySlug[s].name))))));
    return h("footer.site-footer", h(
      "div.container",
      h(
        "div.footer-grid",
        h("div.footer-about", h("a.logo", { href: "#/" }, h("span.logo-mark", ic("file-text")), h("span.logo-text", { html: /^PDF/.test(CONFIG.SITE_NAME) ? `<strong>PDF</strong>${esc(CONFIG.SITE_NAME.slice(3))}` : esc(CONFIG.SITE_NAME) })), h("p", `${TOOLS.length} PDF tools in one place. Private, free and made for phones and laptops.`)),
        col("Popular", ["merge-pdf", "compress-pdf", "split-pdf", "pdf-to-jpg", "jpg-to-pdf"]),
        col("Edit & Sign", ["edit-pdf", "sign-pdf", "watermark", "page-numbers", "protect-pdf"]),
        h("div.footer-col", h("h5", "Company"), h("ul", [["about", "About"], ["privacy", "Privacy"], ["terms", "Terms"], ["all", "All tools"]].map(([p, l]) => h("li", h("a", { href: `#/${p}` }, l)))))
      ),
      h("div.footer-bottom", h("p", `\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} ${esc(CONFIG.SITE_NAME)}. Made with \u2764 in India.`), h("p", "Your files never leave your device."))
    ));
  }
  function render(rerender = false) {
    document.documentElement.lang = lang;
    document.querySelectorAll(".site-header,.mobile-drawer,.site-footer").forEach((e) => e.remove());
    const [hdr, drawer] = header();
    document.body.prepend(hdr, drawer);
    app.after(footer());
    if (rerender) route(true);
  }
  applyTheme();
  render();
  window.addEventListener("hashchange", () => route());
  route(true);
})();
