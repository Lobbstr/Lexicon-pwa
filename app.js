// Lexicon app (Markdown rendering + card hover), wired to your Worker

const form = document.getElementById('chatForm');
const logEl = document.getElementById('log');
const promptEl = document.getElementById('prompt');
const speakBtn = document.getElementById('speakBtn');
const clearBtn = document.getElementById('clearBtn');
const preview = document.getElementById('preview');
const previewImg = preview.querySelector('img');

// Your Worker URL:
const PROXY = "https://lexicon-proxy-holy-band-319a.biznuslobbstr.workers.dev";

// Render helper: we let the model speak Markdown, then we convert to HTML.
function renderMessage(markdownText) {
  // 1) Convert Markdown → HTML
  const html = marked.parse(markdownText);

  // 2) Wrap probable card names with spans for hover preview.
  //    (We do it on the HTML string—simple but effective for most names.)
  const cardWrapped = html.replace(/\b([A-Z][A-Za-z' -]{1,30})\b/g, (m) => {
    // Avoid wrapping common English small words
    const bad = ['The','And','Of','To','In','For','On','At','By','Or','As','If','Be','It','Is','Are','You','Your','A','An'];
    if (bad.includes(m)) return m;
    return `<span class="card-inline" data-card="${m}">${m}</span>`;
  });

  const div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = cardWrapped;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

renderMessage('**🧠 Lexicon ready.** Type and press **Send**.');

// Ask the proxy (simple CORS: text/plain first, GET fallback)
async function askAI(prompt) {
  try {
    const r = await fetch(`${PROXY}/chat`, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: prompt
    });
    const data = await r.json();
    if (data.text) return data.text;
    return `⚠️ Proxy error: ${data.error || "unknown"}`;
  } catch (e) {
    try {
      const r2 = await fetch(`${PROXY}/chat?prompt=${encodeURIComponent(prompt)}`);
      const data2 = await r2.json();
      if (data2.text) return data2.text;
      return `⚠️ Proxy error: ${data2.error || "unknown"}`;
    } catch (e2) {
      return `❌ Network error: ${e2.message}`;
    }
  }
}

async function handleUser(text) {
  if (!text) return;
  renderMessage(`*You said:* ${text}`);
  const reply = await askAI(text);
  renderMessage(reply);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = promptEl.value.trim();
  promptEl.value = '';
  handleUser(v);
});

// Voice input (Chrome/Edge Android)
let recognition, recognizing = false;
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onresult = (e) => {
    const said = Array.from(e.results).map(r => r[0].transcript).join(' ');
    handleUser(said);
  };
  recognition.onend = () => { recognizing = false; speakBtn.textContent = '🎙️ Speak'; };
}
speakBtn.onclick = () => {
  if (!recognition) { alert('Voice input not supported in this browser.'); return; }
  if (!recognizing) { recognition.start(); recognizing = true; speakBtn.textContent = '🛑 Stop'; }
  else { recognition.stop(); }
};

// Clear
clearBtn.onclick = () => { logEl.innerHTML = ''; };

// --- Card hover/tap preview ---
let hoverTimeout;
document.addEventListener('mouseover', (e) => {
  const el = e.target.closest('.card-inline'); if (!el) return;
  clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(() => showPreviewFor(el), 200);
});
document.addEventListener('mouseout', (e) => {
  if (e.target.closest('.card-inline')) {
    clearTimeout(hoverTimeout); preview.style.display = 'none';
  }
});
document.addEventListener('click', async (e) => {
  const el = e.target.closest('.card-inline'); if (!el) return;
  await showPreviewFor(el);
  setTimeout(() => { preview.style.display = 'none'; }, 5000);
});

async function showPreviewFor(el) {
  const name = el.dataset.card;
  try {
    const r = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
    if (!r.ok) return;
    const data = await r.json();
    const img = data.image_uris?.normal || data.image_uris?.large || data.image_uris?.png
             || data.card_faces?.[0]?.image_uris?.normal;
    if (!img) return;
    previewImg.src = img;
    const rect = el.getBoundingClientRect();
    preview.style.left = `${rect.left + window.scrollX}px`;
    preview.style.top  = `${rect.bottom + 8 + window.scrollY}px`;
    preview.style.display = 'block';
  } catch {}
}
