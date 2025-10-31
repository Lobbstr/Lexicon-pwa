// Lexicon MTG Pocket Companion (v3) — Full Script
// Connected to Cloudflare Worker Proxy

const form = document.getElementById('chatForm');
const logEl = document.getElementById('log');
const promptEl = document.getElementById('prompt');
const speakBtn = document.getElementById('speakBtn');
const clearBtn = document.getElementById('clearBtn');
const preview = document.getElementById('preview');
const previewImg = preview.querySelector('img');

// ✅ Set your Cloudflare Worker endpoint here
const PROXY = "https://lexicon-proxy-holy-band-319a.biznuslobbstr.workers.dev";

// Helper: append text to chat log
function respond(text) {
  const html = text.replace(
    /\b([A-Z][A-Za-z'-]{1,30})\b/g,
    `<span class="card-inline" data-card="$1">$1</span>`
  );
  const p = document.createElement('p');
  p.innerHTML = html;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

respond('🧠 Lexicon client ready (v3). Type and press Send.');

// Handle user prompt
async function handleUser(text) {
  if (!text) return;
  respond(`You said: ${text}`);

  try {
    const r = await fetch(`${PROXY}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text })
    });

    const data = await r.json();
    if (data.error) {
      respond(`⚠️ Error: ${data.error}`);
    } else {
      respond(data.text);
    }
  } catch (err) {
    respond(`❌ Network error: ${err.message}`);
  }
}

// Submit via button or Enter
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
    const said = Array.from(e.results).map(r => r[0].transcript).join('');
    handleUser(said);
  };

  recognition.onend = () => {
    recognizing = false;
    speakBtn.textContent = '🎙️ Speak';
  };
}

speakBtn.onclick = () => {
  if (!recognition) {
    alert('Voice input not supported in this browser.');
    return;
  }
  if (!recognizing) {
    recognition.start();
    recognizing = true;
    speakBtn.textContent = '🛑 Stop';
  } else {
    recognition.stop();
    recognizing = false;
    speakBtn.textContent = '🎙️ Speak';
  }
};

// Clear chat
clearBtn.onclick = () => (logEl.innerHTML = '');

// Hover/tap for card preview
let hoverTimeout;
document.addEventListener('mouseover', (e) => {
  const el = e.target.closest('.card-inline');
  if (!el) return;
  clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(() => showPreviewFor(el), 200);
});

document.addEventListener('mouseout', (e) => {
  if (e.target.closest('.card-inline')) {
    clearTimeout(hoverTimeout);
    preview.style.display = 'none';
  }
});

document.addEventListener('click', async (e) => {
  const el = e.target.closest('.card-inline');
  if (!el) return;
  await showPreviewFor(el);
  setTimeout(() => (preview.style.display = 'none'), 5000);
});

async function showPreviewFor(el) {
  const name = el.dataset.card;
  try {
    const r = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
    if (!r.ok) return;
    const data = await r.json();
    previewImg.src = data.image_uris?.normal || data.image_uris?.large || '';
    preview.style.display = 'block';
  } catch (_) {}
}
