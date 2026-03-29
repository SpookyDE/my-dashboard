let appData = {};
let selectedWidgetType = 'iframe';

// ─── INIT ───
async function init() {
  const res = await fetch('/api/data');
  appData = await res.json();
  applyAccent(appData.settings?.accent || '#00d4aa');
  renderLinks();
  renderWidgets();
  startClock();
  fetchIP();
  document.getElementById('greeting-text').textContent = appData.settings?.greeting || 'Willkommen!';
}

function applyAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
}

// ─── CLOCK ───
function startClock() {
  function tick() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('de-DE', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    document.getElementById('clock').textContent = timeStr;

    // Update clock widgets
    document.querySelectorAll('.big-clock').forEach(el => el.textContent = timeStr);
    document.querySelectorAll('.big-date').forEach(el => {
      el.textContent = now.toLocaleDateString('de-DE', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
    });
  }
  tick();
  setInterval(tick, 1000);
}

// ─── IP ───
function fetchIP() {
  fetch('/api/ip')
    .then(r => r.json())
    .then(d => { document.getElementById('ip-display').textContent = d.ip || 'N/A'; })
    .catch(() => { document.getElementById('ip-display').textContent = 'N/A'; });
}

function renderLinks() {
  const grid = document.getElementById('links-grid');
  grid.innerHTML = '';
  (appData.links || []).forEach((link, i) => {
    const favicon = getFaviconUrl(link.url);
    const iconHTML = favicon
      ? `<img src="${favicon}" alt="" class="link-favicon" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
      : '';
    const fallback = `<div class="link-icon" ${favicon ? 'style="display:none"' : ''}>${link.icon || '🌐'}</div>`;

    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'link-card';
    a.style.cssText = `--card-color:${link.color || 'var(--accent)'};animation-delay:${i*40}ms`;
    a.innerHTML = `${iconHTML}${fallback}<div class="link-title">${link.title}</div>`;
    grid.appendChild(a);
  });
  // Add-Card
  const add = document.createElement('div');
  add.className = 'link-card add-card';
  add.onclick = () => openAddLink();
  add.innerHTML = `<div class="link-icon">+</div><div class="link-title">Hinzufügen</div>`;
  grid.appendChild(add);
}

// ─── FAVICON URL ───
function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

// ─── RENDER WIDGETS ───
function renderWidgets() {
  const grid = document.getElementById('widgets-grid');
  grid.innerHTML = '';
  (appData.widgets || []).forEach((w, i) => {
    const card = document.createElement('div');
    card.className = 'widget-card';
    card.style.animationDelay = `${i*80}ms`;

    let bodyHTML = '';
    if (w.type === 'clock') {
      bodyHTML = `<div class="widget-body clock-widget">
        <div class="big-clock">00:00:00</div>
        <div class="big-date">Lade…</div>
      </div>`;
    } else if (w.type === 'iframe' && w.embed_url) {
      bodyHTML = `<div class="widget-body"><iframe src="${w.embed_url}" allowfullscreen loading="lazy"></iframe></div>`;
    } else {
      bodyHTML = `<div class="widget-body"><div class="widget-empty"><div class="icon">🔗</div><p>Keine URL konfiguriert</p></div></div>`;
    }

    card.innerHTML = `
      <div class="widget-header">
        <span class="widget-title">${w.title}</span>
        <div class="widget-actions">
          <button class="widget-btn" onclick="deleteWidget('${w.id}')" title="Löschen">✕</button>
        </div>
      </div>
      ${bodyHTML}`;
    grid.appendChild(card);
  });

  // Add widget card
  const add = document.createElement('div');
  add.className = 'widget-card add-widget';
  add.onclick = openAddWidget;
  add.innerHTML = `<div class="add-widget-inner"><span>+</span><p>Widget hinzufügen</p></div>`;
  grid.appendChild(add);
}

// ─── SETTINGS ───
function openSettings() {
  switchTab('links');
  renderLinkList();
  renderWidgetList();
  document.getElementById('g-greeting').value = appData.settings?.greeting || '';
  const accent = appData.settings?.accent || '#00d4aa';
  document.getElementById('g-color-picker').value = accent;
  document.getElementById('g-color-text').value = accent;
  openModal('settings-modal');
}

function closeSettings() { closeModal('settings-modal'); }

function saveSettings() {
  if (!appData.settings) appData.settings = {};
  appData.settings.greeting = document.getElementById('g-greeting').value;
  appData.settings.accent = document.getElementById('g-color-text').value || document.getElementById('g-color-picker').value;
  applyAccent(appData.settings.accent);
  document.getElementById('greeting-text').textContent = appData.settings.greeting;
  persistData();
  closeSettings();
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t,i) => {
    const names = ['links','widgets','general'];
    t.classList.toggle('active', names[i] === name);
  });
  document.getElementById('tab-links').style.display = name === 'links' ? '' : 'none';
  document.getElementById('tab-widgets').style.display = name === 'widgets' ? '' : 'none';
  document.getElementById('tab-general').style.display = name === 'general' ? '' : 'none';
}

function renderLinkList() {
  const list = document.getElementById('link-list');
  list.innerHTML = '';
  (appData.links || []).forEach((link, i) => {
    const item = document.createElement('div');
    item.className = 'link-item';
    item.innerHTML = `
      <span style="font-size:20px">${link.icon || '🌐'}</span>
      <div class="link-info">
        <div class="link-name">${link.title}</div>
        <div class="link-url">${link.url}</div>
      </div>
      <button class="btn-delete" onclick="deleteLink(${i})">🗑</button>`;
    list.appendChild(item);
  });
}

function renderWidgetList() {
  const list = document.getElementById('widget-list');
  list.innerHTML = '';
  (appData.widgets || []).forEach((w, i) => {
    const item = document.createElement('div');
    item.className = 'link-item';
    item.innerHTML = `
      <span style="font-size:20px">📦</span>
      <div class="link-info">
        <div class="link-name">${w.title}</div>
        <div class="link-url">${w.type} ${w.embed_url ? '— '+w.embed_url : ''}</div>
      </div>
      <button class="btn-delete" onclick="deleteWidgetFromList(${i})">🗑</button>`;
    list.appendChild(item);
  });
}

// ─── LINK CRUD ───
function openAddLink() {
  document.getElementById('l-title').value = '';
  document.getElementById('l-url').value = '';
  document.getElementById('l-icon').value = '';
  document.getElementById('l-color-picker').value = '#00d4aa';
  document.getElementById('l-color-text').value = '#00d4aa';
  openModal('add-link-modal');
}

function saveLink() {
  const title = document.getElementById('l-title').value.trim();
  const url = document.getElementById('l-url').value.trim();
  if (!title || !url) return;
  if (!appData.links) appData.links = [];
  appData.links.push({
    title, url,
    icon: document.getElementById('l-icon').value || '🌐',
    color: document.getElementById('l-color-text').value || '#00d4aa'
  });
  persistData();
  renderLinks();
  renderLinkList();
  closeModal('add-link-modal');
}

function deleteLink(i) {
  appData.links.splice(i, 1);
  persistData(); renderLinks(); renderLinkList();
}

// ─── WIDGET CRUD ───
function openAddWidget() {
  document.getElementById('w-title').value = '';
  document.getElementById('w-url').value = '';
  selectedWidgetType = 'iframe';
  document.querySelectorAll('.type-chips .chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.type-chips .chip')[0].classList.add('active');
  document.getElementById('w-url-group').style.display = '';
  openModal('add-widget-modal');
}

function selectType(type, el) {
  selectedWidgetType = type;
  document.querySelectorAll('.type-chips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('w-url-group').style.display = type === 'iframe' ? '' : 'none';
}

function saveWidget() {
  const title = document.getElementById('w-title').value.trim();
  if (!title) return;
  if (!appData.widgets) appData.widgets = [];
  const w = {
    id: 'w' + Date.now(),
    title,
    type: selectedWidgetType,
    embed_url: selectedWidgetType === 'iframe' ? document.getElementById('w-url').value.trim() : ''
  };
  appData.widgets.push(w);
  persistData(); renderWidgets(); renderWidgetList();
  closeModal('add-widget-modal');
}

function deleteWidget(id) {
  appData.widgets = (appData.widgets || []).filter(w => w.id !== id);
  persistData(); renderWidgets();
}
function deleteWidgetFromList(i) {
  appData.widgets.splice(i, 1);
  persistData(); renderWidgets(); renderWidgetList();
}

// ─── HELPERS ───
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Color picker sync
document.querySelectorAll('input[type=color]').forEach(picker => {
  const textId = picker.id.replace('-picker', '-text');
  picker.addEventListener('input', () => { document.getElementById(textId).value = picker.value; });
  document.getElementById(textId)?.addEventListener('input', e => { if(/^#[0-9a-fA-F]{6}$/.test(e.target.value)) picker.value = e.target.value; });
});

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.classList.remove('open'); });
});

// Persist to server
function persistData() {
  fetch('/api/data', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(appData)
  });
}

document.addEventListener('DOMContentLoaded', () => init());