// ─────────────────────────────────────────────────────────────
//  App shell: header, footer, router, homepage, search, smart drop zone
// ─────────────────────────────────────────────────────────────
import { CONFIG } from './config.js';
import { TOOLS, CATEGORIES, POPULAR, catById, toolBySlug, searchTools, suggestForFile } from './data/tools.js';
import { STR, LANGS } from './data/i18n.js';
import { h, ic, esc, store, toast } from './core/ui.js';
import { dragDrop } from './core/toolpage.js';

let lang = store.get('lang', 'en');
const t = k => STR[lang]?.[k] ?? STR.en[k] ?? k;
const app = document.getElementById('app');
let cleanup = null;

// ── Theme ──
function applyTheme() {
  const pref = store.get('theme', null);
  if (pref) document.documentElement.setAttribute('data-theme', pref);
  const attr = document.documentElement.getAttribute('data-theme');
  const dark = attr ? attr === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#111827' : '#ffffff');
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
function toggleTheme() { store.set('theme', document.documentElement.classList.contains('dark') ? 'light' : 'dark'); applyTheme(); }

// ── Header ──
function header() {
  const navCats = [['convert-to', 'nav_convert'], ['organize', 'nav_organize'], ['edit', 'nav_edit'], ['sign', 'nav_sign'], ['security', 'nav_security']];
  const mega = h('div.mega', { id: 'mega' }, CATEGORIES.filter(c => c.id !== 'all').map(c => h('div', { style: { '--cat-color': c.color } },
    h('h6', { style: { color: c.color } }, ic(c.icon), esc(c.label)),
    TOOLS.filter(x => x.category === c.id).map(x => h('a', { href: `#/${x.slug}`, class: x.status === 'server' ? 'srv' : '' }, esc(x.name))))));
  const allBtn = h('a', { href: '#/all', 'aria-haspopup': 'true', 'aria-expanded': 'false', on: { click: e => { if (matchMedia('(min-width: 961px)').matches) { e.preventDefault(); const open = !mega.classList.contains('open'); mega.classList.toggle('open', open); allBtn.setAttribute('aria-expanded', String(open)); } } } }, t('nav_all'), ' ', ic('chevron-down'));
  document.addEventListener('click', e => { if (!e.target.closest('.nav-tools')) mega.classList.remove('open'); });
  const nav = h('nav.main-nav', { 'aria-label': 'Main' }, h('div.nav-tools', allBtn, mega), navCats.map(([id, k]) => h('a', { href: `#/category/${id}` }, t(k))));

  const hs = searchBox({ compact: true });
  const langDrop = h('div.lang-dropdown', Object.entries(LANGS).map(([k, v]) => h('a', { href: '#', on: { click: e => { e.preventDefault(); store.set('lang', k); lang = k; document.documentElement.lang = k; render(true); } } }, v)));
  const langBtn = h('button.lang-btn', { type: 'button', 'aria-label': 'Change language', on: { click: e => { e.stopPropagation(); langDrop.classList.toggle('open'); } } }, ic('languages'), lang.toUpperCase());
  document.addEventListener('click', () => langDrop.classList.remove('open'));
  const burger = h('button.hamburger', { type: 'button', 'aria-label': 'Open menu', 'aria-expanded': 'false', on: { click: () => toggleDrawer() } }, h('span'), h('span'), h('span'));
  const themeBtn = h('button.icon-btn.theme-btn', { type: 'button', 'aria-label': 'Toggle dark mode', on: { click: toggleTheme } }, ic('moon', 'moon'), ic('sun', 'sun'));

  const el = h('header.site-header', h('div.container.header-inner',
    h('a.logo', { href: '#/', 'aria-label': `${CONFIG.SITE_NAME} home` }, h('span.logo-mark', ic('file-text')), h('span.logo-text', esc(CONFIG.SITE_NAME.replace(/^PDF/, '')), h('strong', 'PDF'))),
    nav, hs.el, h('div.header-right', h('div.lang-picker', langBtn, langDrop), themeBtn, burger)));
  // put "PDF" first for names like PDFDost
  if (/^PDF/.test(CONFIG.SITE_NAME)) { const lt = el.querySelector('.logo-text'); lt.innerHTML = `<strong>PDF</strong>${esc(CONFIG.SITE_NAME.slice(3))}`; }

  const drawerSearch = searchBox({ compact: true, inDrawer: true });
  const drawer = h('div.mobile-drawer', { id: 'drawer', 'aria-hidden': 'true' },
    drawerSearch.el,
    h('nav', { 'aria-label': 'Categories', style: { marginTop: '1rem' } }, CATEGORIES.map(c => h('a', { href: c.id === 'all' ? '#/all' : `#/category/${c.id}`, style: { display: 'flex', alignItems: 'center', gap: '.6rem' }, on: { click: () => toggleDrawer(false) } }, h('span', { style: { color: c.color, display: 'flex' } }, ic(c.icon)), esc(c.label)))),
    h('div.mobile-drawer-footer', h('button.btn.btn-ghost', { type: 'button', on: { click: toggleTheme } }, ic('moon'), 'Theme'), h('select.option-select', { 'aria-label': 'Language', style: { width: 'auto' }, on: { change: e => { store.set('lang', e.target.value); lang = e.target.value; toggleDrawer(false); render(true); } } }, Object.entries(LANGS).map(([k, v]) => h('option', { value: k, selected: k === lang }, v)))));
  drawerSearch.el.style.display = 'block'; drawerSearch.el.style.maxWidth = 'none'; drawerSearch.el.style.margin = '0';
  function toggleDrawer(force) {
    const open = force ?? !drawer.classList.contains('open');
    drawer.classList.toggle('open', open); burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open)); drawer.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('no-scroll', open);
  }
  window.addEventListener('hashchange', () => toggleDrawer(false));
  return [el, drawer];
}

// ── Search ──
function searchBox({ compact = false, inDrawer = false } = {}) {
  const input = h('input', { type: 'search', class: compact ? '' : 'search-bar', placeholder: compact ? 'Search tools…' : t('search'), 'aria-label': 'Search tools', autocomplete: 'off', role: 'combobox', 'aria-expanded': 'false', 'aria-autocomplete': 'list' });
  const dd = h('div.search-dropdown', { role: 'listbox' });
  let results = [], focus = -1;
  const draw = () => {
    results = searchTools(input.value, 10); focus = results.length ? 0 : -1;
    dd.innerHTML = '';
    if (!input.value.trim()) { dd.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); return; }
    if (!results.length) dd.appendChild(h('div.search-empty', `No tools found for “${esc(input.value)}”`));
    results.forEach((x, i) => dd.appendChild(h('a.search-result-item', { href: `#/${x.slug}`, role: 'option', class: i === focus ? 'focused' : '', style: { '--cat-color': catById[x.category].color } },
      h('div.search-result-icon', ic(x.icon)),
      h('div.search-result-text', h('div.search-result-name', esc(x.name), h(`span.search-result-badge.${x.status === 'live' ? 'badge-live' : 'badge-soon'}`, x.status === 'live' ? 'Free' : t('soon'))), h('div.search-result-desc', esc(x.description))))));
    dd.classList.add('open'); input.setAttribute('aria-expanded', 'true');
  };
  const move = d => { if (!results.length) return; focus = (focus + d + results.length) % results.length; dd.querySelectorAll('.search-result-item').forEach((el, i) => el.classList.toggle('focused', i === focus)); dd.querySelectorAll('.search-result-item')[focus]?.scrollIntoView({ block: 'nearest' }); };
  input.addEventListener('input', draw);
  input.addEventListener('focus', draw);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter' && results[focus]) { e.preventDefault(); location.hash = `#/${results[focus].slug}`; input.value = ''; dd.classList.remove('open'); input.blur(); }
    else if (e.key === 'Escape') { dd.classList.remove('open'); input.blur(); }
  });
  dd.addEventListener('click', () => { input.value = ''; dd.classList.remove('open'); });
  document.addEventListener('click', e => { if (!el.contains(e.target)) dd.classList.remove('open'); });
  const el = compact ? h('div.header-search', ic('search'), input, dd) : h('div.search-wrap', h('span.search-icon', ic('search')), input, h('kbd.search-kbd', '/'), dd);
  el.input = input;
  return { el, input };
}
document.addEventListener('keydown', e => {
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { const s = document.querySelector('.search-bar') || document.querySelector('.header-search input'); if (s) { e.preventDefault(); s.focus(); } }
});

// ── Cards ──
const card = x => h(`a.tool-card${x.status === 'server' ? '.coming-soon' : ''}`, { href: `#/${x.slug}`, style: { '--cat-color': catById[x.category].color }, 'data-cat': x.category },
  h('div.tool-card-icon', ic(x.icon)), h('div.tool-card-body', h('div.tool-card-name', esc(x.name)), h('div.tool-card-desc', esc(x.description))));
const popCard = x => h('a.popular-card', { href: `#/${x.slug}`, style: { '--cat-color': catById[x.category].color } },
  h('div.popular-card-icon', ic(x.icon)), h('div', h('div.popular-card-name', esc(x.name)), h('div.popular-card-desc', esc(x.description))), h('div.popular-card-arrow', ic('arrow-right')));

// ── Home ──
function home(initialCat = 'all') {
  document.title = `${CONFIG.SITE_NAME} — ${CONFIG.TAGLINE}`;
  const live = TOOLS.filter(x => x.status === 'live').length;
  const main = h('div');

  // Hero
  const s = searchBox();
  const fileInput = h('input', { type: 'file', multiple: true, 'aria-label': t('choose') });
  const smart = h('div.smart-panel', { 'aria-live': 'polite' });
  const dz = h('div.dropzone', { tabindex: 0, role: 'button', 'aria-label': t('drop') },
    h('div.dropzone-icon', ic('upload')), h('h3', t('drop')), h('p', t('dropSub')),
    h('span.btn.btn-primary', ic('folder-open'), t('choose')), h('p.dropzone-formats', 'PDF · JPG · PNG · HEIC · TXT · DOCX · XLSX · PPTX and more'), fileInput);
  dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  const onFiles = files => {
    if (!files.length) return;
    const f = files[0];
    let list = suggestForFile(f.name);
    if (files.length > 1 && files.every(x => /\.pdf$/i.test(x.name))) list = [toolBySlug['merge-pdf'], ...list.filter(x => x.slug !== 'merge-pdf')];
    else if (files.length > 1 && files.every(x => /^image\//.test(x.type))) list = [toolBySlug['jpg-to-pdf'], toolBySlug['combine-files'], ...list.filter(x => !['jpg-to-pdf', 'combine-files'].includes(x.slug))];
    smart.innerHTML = '';
    smart.append(
      h('div.smart-panel-header', h('h4', `${t('suggested')} ${files.length > 1 ? `${files.length} files` : 'this file'}`), h('button', { type: 'button', 'aria-label': 'Close', on: { click: () => smart.classList.remove('show') } }, ic('x'))),
      h('p.smart-panel-file', { text: files.map(x => x.name).join(', ') }),
      list.length ? h('div.smart-tools-grid', list.map(x => h(`a.smart-tool-chip${x.status === 'server' ? '.coming-soon' : ''}`, { href: `#/${x.slug}`, on: { click: () => { window.__handoff = files; } } }, ic(x.icon), esc(x.name), x.status === 'server' ? ` · ${t('soon')}` : '')))
        : h('p', { style: { fontSize: '.9rem', color: 'var(--text-2)' } }, 'We don’t have a tool for this file type yet. Try searching above.'));
    smart.classList.add('show');
    smart.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    fileInput.value = '';
  };
  fileInput.addEventListener('change', () => onFiles([...fileInput.files]));
  dragDrop(dz, onFiles);

  main.appendChild(h('section.hero', h('div.container.hero-inner',
    h('span.hero-eyebrow', ic('sparkles'), t('eyebrow')),
    h('h1', esc(t('h1a')), h('br'), h('span', esc(t('h1b')))),
    h('p.hero-sub', { html: t('sub') }),
    s.el, h('div.hero-or', t('or')), dz, smart,
    h('div.trust-row', [['shield-check', 'trust1'], ['zap', 'trust2'], ['heart', 'trust3']].map(([i, k]) => h('span.trust-badge', ic(i), t(k)))),
    h('div.stats-row', h('div.stat', h('b', `${TOOLS.length}`), h('span', 'PDF tools')), h('div.stat', h('b', `${live}`), h('span', 'work offline in browser')), h('div.stat', h('b', '0'), h('span', 'files uploaded')), h('div.stat', h('b', '₹0'), h('span', 'cost'))))));

  // Recent
  const recent = store.get('recent-tools', []).map(x => toolBySlug[x]).filter(Boolean);
  if (recent.length) main.appendChild(h('section.recent-section.show', h('div.container', h('h2', { style: { fontSize: '.85rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem' } }, t('recent')),
    h('div.recent-scroll', recent.map(x => h('a.recent-chip', { href: `#/${x.slug}` }, ic(x.icon), esc(x.name)))))));

  // Popular
  main.appendChild(h('section.section', { style: { paddingTop: recent.length ? '2rem' : undefined } }, h('div.container',
    h('div.section-header', h('span.section-tag', 'Popular'), h('h2.section-title', t('popular')), h('p.section-sub', t('popularSub'))),
    h('div.popular-grid', POPULAR.map(x => popCard(toolBySlug[x]))))));

  // All tools
  let cur = initialCat, showSoon = store.get('show-soon', true);
  const chips = h('div.cat-chips', { role: 'tablist', 'aria-label': 'Tool categories' });
  const gridBox = h('div');
  const drawChips = () => {
    chips.innerHTML = '';
    for (const c of CATEGORIES) {
      const n = c.id === 'all' ? TOOLS.length : TOOLS.filter(x => x.category === c.id).length;
      chips.appendChild(h('button.cat-chip', { type: 'button', role: 'tab', 'aria-selected': String(cur === c.id), class: cur === c.id ? 'active' : '', on: { click: () => { cur = c.id; drawChips(); drawGrid(); } } }, esc(c.label), h('span.count', `${n}`)));
    }
  };
  const drawGrid = () => {
    gridBox.innerHTML = '';
    const vis = x => showSoon || x.status === 'live';
    const cats = cur === 'all' ? CATEGORIES.filter(c => c.id !== 'all') : [catById[cur]];
    for (const c of cats) {
      const items = TOOLS.filter(x => x.category === c.id && vis(x));
      if (!items.length) continue;
      if (cur === 'all') gridBox.appendChild(h('h3.cat-section-title', { style: { '--cat-color': c.color } }, h('span.dot'), esc(c.label), h('small', `${items.length} tools`)));
      gridBox.appendChild(h('div.tools-grid', items.map(card)));
    }
  };
  drawChips(); drawGrid();
  const soonToggle = h('label.switch', { style: { maxWidth: '260px', margin: '0 0 1rem auto' } }, h('span', { style: { fontSize: '.85rem', color: 'var(--text-2)' } }, t('showSoon')), h('input', { type: 'checkbox', checked: showSoon, on: { change: e => { showSoon = e.target.checked; store.set('show-soon', showSoon); drawGrid(); } } }));
  main.appendChild(h('section.section.section-alt', { id: 'all-tools' }, h('div.container',
    h('div.section-header', h('span.section-tag', `${TOOLS.length} tools`), h('h2.section-title', t('all')), h('p.section-sub', t('allSub'))),
    h('div.chip-scroll-fade', chips), soonToggle, gridBox)));

  // Features
  main.appendChild(h('section.section', h('div.container', h('div.features',
    [['shield-check', 'Private by design', 'Most tools run entirely in your browser. Your documents are never uploaded.'],
      ['smartphone', 'Made for phones', 'Big buttons, camera scanning and touch editing that feel like an app.'],
      ['zap', 'Fast, even offline', 'No waiting for uploads or downloads — processing starts instantly.'],
      ['badge-indian-rupee', 'Free forever', 'No sign-up, no watermarks, no daily limits on browser tools.']]
      .map(([i, a, b]) => h('div.feature', ic(i), h('h3', a), h('p', b)))))));

  // How it works
  main.appendChild(h('section.section.section-alt', h('div.container',
    h('div.section-header', h('h2.section-title', t('how'))),
    h('div.steps-grid', [1, 2, 3].map(n => h('div.step-card', h('div.step-num', `${n}`), h('h3', t(`step${n}`)), h('p', t(`step${n}d`))))))));

  // FAQ
  const faqs = [
    ['Is it really free?', `Yes. All ${live} browser tools are completely free with no sign-up, no watermark and no limits. A few advanced server tools (like Word conversion and AI) are launching soon.`],
    ['Are my files safe?', 'For browser tools, your file is processed on your own device and is never uploaded. You can even turn off your internet after the page loads and the tools keep working.'],
    ['Does it work on my phone?', 'Yes — the site is built mobile-first. You can pick files from your gallery or file manager, scan with the camera, and sign or edit with your finger.'],
    ['Is there a file size limit?', 'There is no fixed limit. Very large files (over 100 MB) may be slow on older phones because your device does the work.'],
    ['Can I open password-protected PDFs?', 'Yes. You’ll be asked for the password, and it is only used on your device. Use “Unlock PDF” to save a copy without the password.'],
    ['Which languages are supported?', 'The site is available in English, हिंदी and ਪੰਜਾਬੀ. OCR can read English, Hindi, Punjabi and many other languages.'],
  ];
  main.appendChild(h('section.section', h('div.container',
    h('div.section-header', h('h2.section-title', t('faq'))),
    h('div.faq-list', faqs.map(([q, a]) => {
      const item = h('div.faq-item');
      const btn = h('button.faq-q', { type: 'button', 'aria-expanded': 'false', on: { click: () => { const o = item.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); } } }, esc(q), h('span.faq-icon', ic('chevron-down')));
      item.append(btn, h('div.faq-a', h('div.faq-a-inner', esc(a))));
      return item;
    })))));
  // FAQ schema for SEO
  document.getElementById('ld-faq')?.remove();
  document.head.appendChild(h('script', { type: 'application/ld+json', id: 'ld-faq', text: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }) }));

  app.innerHTML = ''; app.appendChild(main);
  if (initialCat !== 'all') document.getElementById('all-tools')?.scrollIntoView();
}

function categoryPage(id) {
  const c = catById[id]; if (!c) return notFound();
  document.title = `${c.label} Tools — ${CONFIG.SITE_NAME}`;
  const items = TOOLS.filter(x => x.category === id);
  app.innerHTML = '';
  app.appendChild(h('section.section', { style: { paddingTop: '2rem' } }, h('div.container',
    h('nav.breadcrumb', h('a', { href: '#/' }, 'Home'), ic('chevron-right'), h('span', esc(c.label))),
    h('div.tp-head', { style: { '--cat-color': c.color } }, h('div.tp-icon', ic(c.icon)), h('div', h('h1', `${esc(c.label)} tools`), h('p', `${items.filter(x => x.status === 'live').length} free browser tools${items.some(x => x.status === 'server') ? ` + ${items.filter(x => x.status === 'server').length} coming soon` : ''}.`))),
    h('div.tools-grid', items.map(card)),
    h('div.cat-chips', { style: { marginTop: '2.5rem', flexWrap: 'wrap' } }, CATEGORIES.filter(x => x.id !== 'all' && x.id !== id).map(x => h('a.cat-chip', { href: `#/category/${x.id}` }, esc(x.label)))))));
}

function allPage() { home('all'); setTimeout(() => document.getElementById('all-tools')?.scrollIntoView(), 0); }

function staticPage(title, html) {
  document.title = `${title} — ${CONFIG.SITE_NAME}`;
  app.innerHTML = '';
  app.appendChild(h('section.section', { style: { paddingTop: '2rem' } }, h('div.container.seo-section', { style: { border: 0 } }, h('div.seo-wrap', h('h1', { style: { fontSize: '2rem', marginBottom: '1rem' } }, esc(title)), h('div', { html })))));
}

function notFound() {
  staticPage('Page not found', '<p>That page doesn’t exist. Try the search at the top, or <a href="#/">go to the homepage</a>.</p>');
}

async function toolPage(slug) {
  const tool = toolBySlug[slug]; if (!tool) return notFound();
  app.innerHTML = '<div class="container" style="padding:4rem 0;text-align:center"><div class="spinner"></div></div>';
  let impl;
  try {
    const mod = await import(`./tools/${tool.status === 'server' ? 'server' : tool.module}.js`);
    impl = mod.default[slug] || mod.default.__default;
  } catch (e) { console.error(e); toast('This tool failed to load. Please refresh the page.', 'error'); return; }
  if (!impl) return notFound();
  const handoff = window.__handoff || []; window.__handoff = null;
  const { renderToolPage } = await import('./core/toolpage.js');
  cleanup = await renderToolPage(app, tool, impl, handoff);
}

// ── Router ──
let lastRoute = null;
async function route(force = false) {
  const path = (location.hash.replace(/^#\/?/, '') || '').split('?')[0];
  if (!force && path === lastRoute) return;
  lastRoute = path;
  cleanup?.(); cleanup = null;
  document.body.classList.remove('has-bar', 'no-scroll');
  if (!path) home();
  else if (path === 'all') allPage();
  else if (path.startsWith('category/')) categoryPage(path.split('/')[1]);
  else if (path === 'about') staticPage('About', `<p>${CONFIG.SITE_NAME} brings every PDF tool together in one fast, private, mobile-friendly site. Most tools run 100% in your browser using open-source engines (pdf.js, pdf-lib, Tesseract), so your documents never leave your device.</p>`);
  else if (path === 'privacy') staticPage('Privacy Policy', `<p>Browser tools process your files locally on your device. We do not upload, store or see them. We may use privacy-friendly analytics to count page views.</p><p>Server tools (marked “Runs on server”) upload files over an encrypted connection; files are deleted automatically within 1 hour.</p><p>Preferences such as theme, language and a saved signature are stored only in your browser’s local storage, and you can clear them any time.</p>`);
  else if (path === 'terms') staticPage('Terms of Use', `<p>${CONFIG.SITE_NAME} is provided “as is”. Only process documents you have the right to use. Do not use the tools to remove protection from documents you are not authorised to open.</p>`);
  else await toolPage(path);
  if (!path.startsWith('category/') && path !== 'all') window.scrollTo(0, 0);
  document.querySelectorAll('.main-nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#/${path}`));
}

function footer() {
  const col = (title, ids) => h('div.footer-col', h('h5', title), h('ul', ids.map(s => h('li', h('a', { href: `#/${s}` }, esc(toolBySlug[s].name))))));
  return h('footer.site-footer', h('div.container',
    h('div.footer-grid',
      h('div.footer-about', h('a.logo', { href: '#/' }, h('span.logo-mark', ic('file-text')), h('span.logo-text', { html: /^PDF/.test(CONFIG.SITE_NAME) ? `<strong>PDF</strong>${esc(CONFIG.SITE_NAME.slice(3))}` : esc(CONFIG.SITE_NAME) })), h('p', `${TOOLS.length} PDF tools in one place. Private, free and made for phones and laptops.`)),
      col('Popular', ['merge-pdf', 'compress-pdf', 'split-pdf', 'pdf-to-jpg', 'jpg-to-pdf']),
      col('Edit & Sign', ['edit-pdf', 'sign-pdf', 'watermark', 'page-numbers', 'protect-pdf']),
      h('div.footer-col', h('h5', 'Company'), h('ul', [['about', 'About'], ['privacy', 'Privacy'], ['terms', 'Terms'], ['all', 'All tools']].map(([p, l]) => h('li', h('a', { href: `#/${p}` }, l)))))),
    h('div.footer-bottom', h('p', `© ${new Date().getFullYear()} ${esc(CONFIG.SITE_NAME)}. Made with ❤ in India.`), h('p', 'Your files never leave your device.'))));
}

function render(rerender = false) {
  document.documentElement.lang = lang;
  document.querySelectorAll('.site-header,.mobile-drawer,.site-footer').forEach(e => e.remove());
  const [hdr, drawer] = header();
  document.body.prepend(hdr, drawer);
  app.after(footer());
  if (rerender) route(true);
}

applyTheme();
render();
window.addEventListener('hashchange', () => route());
route(true);
