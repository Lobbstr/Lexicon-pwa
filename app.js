const form     = document.getElementById('chatForm');
const logEl    = document.getElementById('log');
const promptEl = document.getElementById('prompt');
const speakBtn = document.getElementById('speakBtn');
const clearBtn = document.getElementById('clearBtn');
const preview  = document.getElementById('preview');
const previewImg = preview.querySelector('img');

// prove JS loaded
respond('🔧 Lexicon client ready (v2). Type, tap Send, or use 🎙️.');

function respond(text) {
  const html = text.replace(/\b([A-Z][A-Za-z' -]{1,30})\b/g, m =>
    `<span class="card-inline" data-card="${m}">${m}</span>`
  );
  const p = document.createElement('p');
  p.innerHTML = html;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

function handleUser(text) {
  if (!text) return;
  respond(`You said: ${text}`);
  respond(`Try this package: Counterspell, Mystic Sanctuary, Narset's Reversal, Dig Through Time.`);
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

clearBtn.onclick = () => { logEl.innerHTML = ''; };

// Hover/tap previews
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
  setTimeout(() => {
    const hide = () => { preview.style.display = 'none'; document.removeEventListener('click', hide); };
    document.addEventListener('click', hide);
  }, 0);
});

async function showPreviewFor(el) {
  const cardName = el.dataset.card;
  try {
    const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
    if (!res.ok) return;
    const data = await res.json();
    const img = data.image_uris?.normal
             || data.image_uris?.large
             || data.image_uris?.png
             || (data.card_faces && data.card_faces[0]?.image_uris?.normal);
    if (!img) return;
    previewImg.src = img;
    const rect = el.getBoundingClientRect();
    preview.style.left = `${rect.left + window.scrollX}px`;
    preview.style.top  = `${rect.bottom + 8 + window.scrollY}px`;
    preview.style.display = 'block';
  } catch {}
}  recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onresult = (e) => {
    const said = Array.from(e.results).map(r => r[0].transcript).join(' ');
    promptEl.value = '';
    handleUser(said);
  };
  recognition.onend = () => { recognizing = false; speakBtn.textContent = '🎙️ Speak'; };
}
speakBtn.onclick = () => {
  if (!recognition) { alert('Voice input not supported in this browser.'); return; }
  if (!recognizing) { recognition.start(); recognizing = true; speakBtn.textContent = '🛑 Stop'; }
  else { recognition.stop(); }
};

// --- Clear log ---
clearBtn.onclick = () => { logEl.innerHTML = ''; };

// --- Scryfall hover preview (desktop) ---
let hoverTimeout;
document.addEventListener('mouseover', async (e) => {
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

// --- Tap preview (mobile) ---
document.addEventListener('click', async (e) => {
  const el = e.target.closest('.card-inline');
  if (!el) return;
  await showPreviewFor(el);
  // tap elsewhere to hide
  setTimeout(() => {
    const hide = () => { preview.style.display = 'none'; document.removeEventListener('click', hide); };
    document.addEventListener('click', hide);
  }, 0);
});

// --- Helper: fetch & position preview ---
async function showPreviewFor(el) {
  const cardName = el.dataset.card;
  try {
    const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
    if (!res.ok) return;
    const data = await res.json();
    const img = data.image_uris?.normal
             || data.image_uris?.large
             || data.image_uris?.png
             || (data.card_faces && data.card_faces[0]?.image_uris?.normal);
    if (!img) return;
    previewImg.src = img;
    const rect = el.getBoundingClientRect();
    preview.style.left = `${rect.left + window.scrollX}px`;
    preview.style.top  = `${rect.bottom + 8 + window.scrollY}px`;
    preview.style.display = 'block';
  } catch {}
}  };
  recognition.onend = () => { recognizing = false; speakBtn.textContent = '🎙️ Speak'; };
}

speakBtn.onclick = () => {
  if (!recognition) { alert('Voice input not supported in this browser.'); return; }
  if (!recognizing) { recognition.start(); recognizing = true; speakBtn.textContent = '🛑 Stop'; }
  else { recognition.stop(); }
};

clearBtn.onclick = () => { logEl.innerHTML = ''; };

promptEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && promptEl.value.trim()) {
    const v = promptEl.value.trim();
    promptEl.value = '';
    handleUser(v);
  }
});

// Scryfall hover preview
let hoverTimeout;
document.addEventListener('mouseover', async (e) => {
  const el = e.target.closest('.card-inline');
  if (!el) return;
  clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(async () => {
    const cardName = el.dataset.card;
    try {
      const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
      if (!res.ok) return;
      const data = await res.json();
      const img = data.image_uris?.normal
              || data.image_uris?.large
              || data.image_uris?.png
              || (data.card_faces && data.card_faces[0]?.image_uris?.normal);
      if (!img) return;
      previewImg.src = img;
      const rect = el.getBoundingClientRect();
      preview.style.left = `${rect.left + window.scrollX}px`;
      preview.style.top = `${rect.bottom + 8 + window.scrollY}px`;
      preview.style.display = 'block';
    } catch {}
  }, 200);
});

document.addEventListener('mouseout', (e) => {
  if (e.target.closest('.card-inline')) {
    clearTimeout(hoverTimeout);
    preview.style.display = 'none';
  }
});

// Mobile tap for preview
document.addEventListener('click', async (e) => {
  const el = e.target.closest('.card-inline');
  if (!el) return;
  const cardName = el.dataset.card;
  try {
    const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
    if (!res.ok) return;
    const data = await res.json();
    const img = data.image_uris?.normal
            || data.image_uris?.large
            || data.image_uris?.png
            || (data.card_faces && data.card_faces[0]?.image_uris?.normal);
    if (!img) return;
    previewImg.src = img;
    const rect = el.getBoundingClientRect();
    preview.style.left = `${rect.left + window.scrollX}px`;
    preview.style.top = `${rect.bottom + 8 + window.scrollY}px`;
    preview.style.display = 'block';
    // tap anywhere to hide
    setTimeout(() => {
      const hide = () => { preview.style.display = 'none'; document.removeEventListener('click', hide); };
      document.addEventListener('click', hide);
    }, 0);
  } catch {}
});  };
  recognition.onend = () => { recognizing = false; speakBtn.textContent = '🎙️ Speak'; };
}

speakBtn.onclick = () => {
  if (!recognition) { alert('Voice input not supported in this browser.'); return; }
  if (!recognizing) { recognition.start(); recognizing = true; speakBtn.textContent = '🛑 Stop'; }
  else { recognition.stop(); }
};

clearBtn.onclick = () => { logEl.innerHTML = ''; };

promptEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && promptEl.value.trim()) {
    const v = promptEl.value.trim();
    promptEl.value = '';
    handleUser(v);
  }
});

// Scryfall hover preview
let hoverTimeout;
document.addEventListener('mouseover', async (e) => {
  const el = e.target.closest('.card-inline');
  if (!el) return;
  clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(async () => {
    const cardName = el.dataset.card;
    try {
      const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
      if (!res.ok) return;
      const data = await res.json();
      const img = data.image_uris?.normal
              || data.image_uris?.large
              || data.image_uris?.png
              || (data.card_faces && data.card_faces[0]?.image_uris?.normal);
      if (!img) return;
      previewImg.src = img;
      const rect = el.getBoundingClientRect();
      preview.style.left = `${rect.left + window.scrollX}px`;
      preview.style.top = `${rect.bottom + 8 + window.scrollY}px`;
      preview.style.display = 'block';
    } catch {}
  }, 200);
});

document.addEventListener('mouseout', (e) => {
  if (e.target.closest('.card-inline')) {
    clearTimeout(hoverTimeout);
    preview.style.display = 'none';
  }
});

// Mobile tap for preview
document.addEventListener('click', async (e) => {
  const el = e.target.closest('.card-inline');
  if (!el) return;
  const cardName = el.dataset.card;
  try {
    const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
    if (!res.ok) return;
    const data = await res.json();
    const img = data.image_uris?.normal
            || data.image_uris?.large
            || data.image_uris?.png
            || (data.card_faces && data.card_faces[0]?.image_uris?.normal);
    if (!img) return;
    previewImg.src = img;
    const rect = el.getBoundingClientRect();
    preview.style.left = `${rect.left + window.scrollX}px`;
    preview.style.top = `${rect.bottom + 8 + window.scrollY}px`;
    preview.style.display = 'block';
    setTimeout(() => {
      const hide = () => { preview.style.display = 'none'; document.removeEventListener('click', hide); };
      document.addEventListener('click', hide);
    }, 0);
  } catch {}
}); 
