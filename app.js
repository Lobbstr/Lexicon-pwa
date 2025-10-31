// Lexicon vLite UI — Markdown, hover previews, voice, history, settings, legality/budget check (no paid exports)

const form = document.getElementById('chatForm');
const logEl = document.getElementById('log');
const promptEl = document.getElementById('prompt');
const speakBtn = document.getElementById('speakBtn');
const clearBtn = document.getElementById('clearBtn');
const checkBtn = document.getElementById('checkBtn');
const settingsBtn = document.getElementById('settingsBtn');
const feedbackBtn = document.getElementById('feedbackBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');

const preview = document.getElementById('preview');
const previewImg = preview.querySelector('img');

// Worker URL:
const PROXY = "https://lexicon-proxy-holy-band-319a.biznuslobbstr.workers.dev";

// Settings + history
const STORE_KEY = "lexicon_history_v1";
const SETTINGS_KEY = "lexicon_settings_v1";
let history = [];
let settings = { format: "commander", budgetUsd: 0, priceSource: "usd" };

try { const raw = localStorage.getItem(STORE_KEY); if (raw) history = JSON.parse(raw); } catch {}
try { const raw = localStorage.getItem(SETTINGS_KEY); if (raw) settings = { ...settings, ...JSON.parse(raw) }; } catch {}

function saveHistory() { try { localStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-20))); } catch {} }
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {} }

// UI helpers
function renderMessage(markdownText) {
  const htmlRaw = marked.parse(markdownText, { gfm: true, breaks: true });
  const html = htmlRaw.replace(/\b([A-Z][A-Za-z' -]{1,30})\b/g, (m) => {
    const common = new Set(['The','And','Of','To','In','For','On','At','By','Or','As','If','Be','It','Is','Are','You','Your','A','An','With','From','This','That','These','Those']);
    if (common.has(m)) return m;
    return `<span class="card-inline" data-card="${m}">${m}</span>`;
  });
  const div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = html;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}
function looksLikeDeck(text) {
  const lines = text.split(/\r?\n/); let hits = 0;
  for (const ln of lines) { if (/^\s*\d+\s+[\w'´`-]/.test(ln)) hits++; if (hits >= 5) return true; }
  return false;
}
function parseDecklist(text) {
  const lines = text.split(/\r?\n/);
  const main = [];
  for (const ln of lines) {
    const m = ln.match(/^\s*(\d+)\s+(.+?)\s*$/);
    if (m) {
      const count = Math.max(1, parseInt(m[1], 10));
      const name = m[2].replace(/\s*\(.*?\)\s*$/, '').trim();
      if (name) main.push({ name, count });
    }
  }
  const titleMatch = text.match(/^\s*#{1,6}\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Lexicon Deck';
  return { title, mainboard: main };
}

// Render past convo
if (history.length) {
  for (const m of history) {
    const prefix = m.role === 'user' ? '*You said:* ' : '';
    renderMessage(prefix + m.content);
  }
} else {
  renderMessage('**🧠 Lexicon ready.** Type and press **Send**.');
}

// Settings modal init
document.getElementById('formatSel').value = settings.format;
document.getElementById('budgetUsd').value = settings.budgetUsd || 0;
document.getElementById('priceSource').value = settings.priceSource;
settingsBtn.onclick = () => settingsModal.style.display = 'grid';
closeSettings.onclick = () => settingsModal.style.display = 'none';
saveSettings.onclick = () => {
  settings.format = document.getElementById('formatSel').value;
  settings.budgetUsd = parseInt(document.getElementById('budgetUsd').value || "0", 10) || 0;
  settings.priceSource = document.getElementById('priceSource').value;
  saveSettings(); settingsModal.style.display = 'none';
};

// Chat
async function askAI(prompt) {
  const prefs = `Format=${settings.format}; Budget=${settings.budgetUsd||0}; Price=${settings.priceSource}`;
  const payload = { prompt: `[PREFERENCES] ${prefs}\n${prompt}`, history };
  const r = await fetch(`${PROXY}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await r.json();
  return data.text || `⚠️ Proxy error: ${data.error || "unknown"}`;
}
async function handleUser(text) {
  if (!text) return;
  history.push({ role: 'user', content: text }); saveHistory();
  renderMessage(`*You said:* ${text}`);

  const reply = await askAI(text);
  history.push({ role: 'assistant', content: reply }); saveHistory();
  renderMessage(reply);

  checkBtn.classList.toggle('hidden', !looksLikeDeck(reply));
}
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = promptEl.value.trim(); promptEl.value = ''; handleUser(v);
});

// Voice
let recognition, recognizing = false;
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition(); recognition.lang = 'en-US'; recognition.interimResults = false;
  recognition.onresult = (e) => { const said = Array.from(e.results).map(r => r[0].transcript).join(' '); handleUser(said); };
  recognition.onend = () => { recognizing = false; speakBtn.textContent = '🎙️ Speak'; };
}
speakBtn.onclick = () => {
  if (!recognition) { alert('Voice input not supported in this browser.'); return; }
  if (!recognizing) { recognition.start(); recognizing = true; speakBtn.textContent = '🛑 Stop'; }
  else { recognition.stop(); }
};

// Clear
clearBtn.onclick = () => {
  history = []; saveHistory(); logEl.innerHTML = '';
  renderMessage('**🧠 Lexicon ready.** Type and press **Send**.');
  checkBtn.classList.add('hidden');
};

// Hover/tap previews
let hoverTimeout;
document.addEventListener('mouseover', (e) => {
  const el = e.target.closest('.card-inline'); if (!el) return;
  clearTimeout(hoverTimeout); hoverTimeout = setTimeout(() => showPreviewFor(el), 200);
});
document.addEventListener('mouseout', (e) => { if (e.target.closest('.card-inline')) { clearTimeout(hoverTimeout); preview.style.display = 'none'; } });
document.addEventListener('click', async (e) => {
  const el = e.target.closest('.card-inline'); if (!el) return;
  await showPreviewFor(el); setTimeout(() => { preview.style.display = 'none'; }, 5000);
});
async function showPreviewFor(el) {
  const name = el.dataset.card;
  try {
    const r = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
    if (!r.ok) return; const data = await r.json();
    const img = data.image_uris?.normal || data.image_uris?.large || data.image_uris?.png || data.card_faces?.[0]?.image_uris?.normal;
    if (!img) return; previewImg.src = img;
    const rect = el.getBoundingClientRect(); preview.style.left = `${rect.left + window.scrollX}px`; preview.style.top = `${rect.bottom + 8 + window.scrollY}px`; preview.style.display = 'block';
  } catch {}
}

// Legality & budget check (free Scryfall)
checkBtn.onclick = async () => {
  const lastAssist = [...history].reverse().find(m => m.role === 'assistant'); if (!lastAssist) return;
  const parsed = parseDecklist(lastAssist.content); if (!parsed.mainboard.length) return alert('No decklist detected.');
  const names = parsed.mainboard.map(x => x.name);

  const chunks = []; for (let i = 0; i < names.length; i += 70) chunks.push(names.slice(i, i+70));
  const results = [];
  for (const chunk of chunks) {
    const r = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: chunk.map(n => ({ name: n })) })
    });
    const data = await r.json(); if (data?.data) results.push(...data.data);
  }

  const formatMap = { commander: 'commander', modern:'modern', pioneer:'pioneer', standard:'standard' };
  const fmt = formatMap[settings.format] || 'commander';
  let illegal = [], total = 0;
  const priceKey = settings.priceSource || 'usd';

  for (const row of results) {
    const legal = row.legalities?.[fmt] || 'not_legal';
    if (!(legal === 'legal' || legal === 'restricted')) illegal.push(row.name);
    const raw = row.prices?.[priceKey]; const p = raw ? parseFloat(raw) : 0;
    const entry = parsed.mainboard.find(x => x.name.toLowerCase() === row.name.toLowerCase());
    const count = entry ? entry.count : 1;
    total += p * count;
  }

  const overBudget = (settings.budgetUsd && total > settings.budgetUsd);
  let out = `### Legality & Budget Check\n- **Format:** ${settings.format}\n- **Cards:** ${parsed.mainboard.length}\n- **Estimated Total (${priceKey}):** $${total.toFixed(2)} ${overBudget ? '❌ over cap' : '✅ within cap'}`;
  if (illegal.length) out += `\n- **Not legal in ${settings.format}:** ${illegal.slice(0,20).join(', ')}${illegal.length>20?` (+${illegal.length-20} more)`:''}`;
  renderMessage(out);
};

// Feedback (optional, free)
feedbackBtn.onclick = async () => {
  const note = prompt("Any feedback for the developer? (Bug, feature, UX note)");
  if (!note) return;
  try {
    const r = await fetch(`${PROXY}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note, ua: navigator.userAgent, ts: Date.now() }) });
    const data = await r.json();
    alert(data.ok ? "Thanks! Feedback sent." : `Feedback failed: ${data.error || 'unknown'}`);
  } catch (e) {
    alert(`Network error sending feedback: ${e.message}`);
  }
};

// PWA SW
if ('serviceWorker' in navigator) {
  try { navigator.serviceWorker.register('./sw.js'); } catch {}
}
