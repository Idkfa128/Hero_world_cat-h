const API_BASE = (location.protocol === 'file:' ? 'http://127.0.0.1:5000' : '');
const safeFetch = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('Fetch error:', url, e);
    throw e;
  }
};
const API = {
  createGame: (difficulty) => safeFetch(`${API_BASE}/api/game/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ difficulty }) }),
  collect: (sessionId, word) => safeFetch(`${API_BASE}/api/game/${sessionId}/collect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word }) }),
  state: (sessionId) => safeFetch(`${API_BASE}/api/game/${sessionId}/state`),
  update: (sessionId, dt) => safeFetch(`${API_BASE}/api/game/${sessionId}/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delta_time: dt }) }),
  submitAnswer: (sessionId, answer) => safeFetch(`${API_BASE}/api/game/${sessionId}/submit-answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer }) }),
  randomPrompt: () => safeFetch(`${API_BASE}/api/random-prompt`),
  health: () => safeFetch(`${API_BASE}/api/health`).catch(()=>({ ok:false }))
};

const screens = {
  menu: document.getElementById('menu'),
  game: document.getElementById('game'),
  end: document.getElementById('end'),
};

const els = {
  startBtn: document.getElementById('startBtn'),
  difficulty: document.getElementById('difficulty'),
  screenMode: document.getElementById('screenMode'),
  score: document.getElementById('score'),
  lives: document.getElementById('lives'),
  timer: document.getElementById('timer'),
  questionText: document.getElementById('questionText'),
  canvas: document.getElementById('gameCanvas'),
  finalScore: document.getElementById('finalScore'),
  randomPrompt: document.getElementById('randomPrompt'),
  backToMenu: document.getElementById('backToMenu'),
};

let ctx = els.canvas.getContext('2d');
let sessionId = null;
let running = false;
let localTimer = 60;
let words = [];
let dragged = null;
let assembled = [];

function show(screen) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function rand(min, max) { return Math.random() * (max - min) + min; }

function speedMultiplier() {
  const diff = els.difficulty.value;
  if (diff === 'easy') return 0.8;
  if (diff === 'hard') return 1.6;
  return 1.0;
}

function spawnFromState(state) {
  words = state.flying_words.map(w => ({
    word: w.word,
    x: w.x,
    y: w.y,
    vx: rand(-1.2, 1.2),
    vy: rand(-1.2, 1.2),
    collected: false,
  }));
}

function update(dt) {
  const spd = speedMultiplier();
  for (const w of words) {
    if (w.collected) continue;
    w.x += w.vx * spd;
    w.y += w.vy * spd;
    if (w.x < 0) w.x = els.canvas.width;
    else if (w.x > els.canvas.width) w.x = 0;
    if (w.y < 0) w.y = els.canvas.height;
    else if (w.y > els.canvas.height) w.y = 0;
  }
}

function draw(state) {
  ctx.fillStyle = '#071012';
  ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
  ctx.strokeStyle = '#00ffaa';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, els.canvas.height - 80, els.canvas.width - 40, 60);
  ctx.fillStyle = '#7dfaa7';
  ctx.font = '16px "Share Tech Mono"';
  ctx.textBaseline = 'top';
  for (const w of words) {
    if (w.collected) continue;
    ctx.fillText(w.word, Math.floor(w.x), Math.floor(w.y));
  }
  // assembled preview
  ctx.fillStyle = '#d0ffd0';
  ctx.fillText(assembled.join(' '), 30, els.canvas.height - 70);
}

function pointInText(px, py, tx, ty, text) {
  const width = text.length * 9;
  const height = 16;
  return px >= tx && px <= tx + width && py >= ty && py <= ty + height;
}

els.canvas.addEventListener('mousedown', (e) => {
  if (!running) return;
  const rect = els.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  for (const w of words) {
    if (!w.collected && pointInText(x, y, w.x, w.y, w.word)) {
      dragged = w;
      break;
    }
  }
});

els.canvas.addEventListener('mousemove', (e) => {
  if (!dragged) return;
  const rect = els.canvas.getBoundingClientRect();
  dragged.x = e.clientX - rect.left;
  dragged.y = e.clientY - rect.top;
});

els.canvas.addEventListener('mouseup', async (e) => {
  if (!dragged) return;
  const rect = els.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const dropZone = { x: 20, y: els.canvas.height - 80, w: els.canvas.width - 40, h: 60 };
  const inDrop = x >= dropZone.x && x <= dropZone.x + dropZone.w && y >= dropZone.y && y <= dropZone.y + dropZone.h;
  if (inDrop) {
    try {
      const res = await API.collect(sessionId, dragged.word);
      if (res.success) {
        dragged.collected = true;
        assembled.push(dragged.word);
        autoValidate();
      } else {
        console.error('Failed to collect word:', res.message);
      }
    } catch (error) {
      console.error('Error collecting word:', error);
    }
  }
  dragged = null;
});

async function syncState() {
  if (!sessionId) return null;
  try {
    const state = await API.state(sessionId);
    els.score.textContent = state.score;
    els.lives.textContent = state.lives;
    els.questionText.textContent = state.current_question || '';
    if (words.length === 0) spawnFromState(state);
    return state;
  } catch (error) {
    console.error('Error syncing state:', error);
    return null;
  }
}

async function autoValidate() {
  try {
    const ans = assembled.join(' ');
    const res = await API.submitAnswer(sessionId, ans);
    if (res && res.success) {
      assembled = [];
      words = [];
      if (res.next_question) {
        localTimer = 30;
      }
    } else if (res && res.game_over) {
      endGame();
    }
  } catch (error) {
    console.error('Error validating answer:', error);
  }
}

let rafId = null;
let lastTs = 0;
async function loop(ts) {
  if (!running) return;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;
  localTimer -= dt;
  if (localTimer <= 0) { endGame(); return; }
  els.timer.textContent = Math.max(0, Math.floor(localTimer));
  update(dt);
  const state = await syncState();
  if (state && (state.state === 'game_over' || state.lives <= 0)) { endGame(); return; }
  draw(state || {});
  if (sessionId) API.update(sessionId, dt).catch(()=>{});
  rafId = requestAnimationFrame(loop);
}

function enterFullscreenIfNeeded() {
  if (els.screenMode.value !== 'fullscreen') return;
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen();
}

async function startGame() {
  try {
    // quick preflight: ensure backend is reachable when opened via file://
    if (location.protocol === 'file:') {
      const h = await API.health();
      if (!h || h.ok === false) {
        alert('Сервер не запущен. Запустите app.py (http://127.0.0.1:5000)');
        show(screens.menu);
        return;
      }
    }
    show(screens.game);
    enterFullscreenIfNeeded();
    const diff = els.difficulty.value;
    const res = await API.createGame(diff);
    if (!res.success) { 
      alert('Ошибка запуска игры: ' + (res.error || 'Неизвестная ошибка')); 
      show(screens.menu); 
      return; 
    }
    sessionId = res.session_id;
    localTimer = 60;
    words = [];
    assembled = [];
    running = true;
    lastTs = performance.now();
    requestAnimationFrame((ts)=>{ lastTs = ts; loop(ts); });
  } catch (error) {
    console.error('Error starting game:', error);
    alert('Ошибка запуска игры: ' + error.message);
    show(screens.menu);
  }
}

async function endGame() {
  try {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    const st = sessionId ? await API.state(sessionId) : { score: 0 };
    els.finalScore.textContent = st && typeof st.score === 'number' ? st.score : 0;
    const p = await API.randomPrompt().catch(()=>({success:false}));
    els.randomPrompt.textContent = (p && p.success) ? p.text : 'Сделайте короткий вдох/выдох и продолжите. :)';
    show(screens.end);
    setTimeout(()=>show(screens.menu), 5000);
  } catch (error) {
    console.error('Error ending game:', error);
    show(screens.menu);
  }
}

els.startBtn.addEventListener('click', startGame);
els.backToMenu.addEventListener('click', ()=> show(screens.menu));


