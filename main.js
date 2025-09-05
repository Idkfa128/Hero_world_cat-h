const API = {
  createGame: (difficulty) => fetch('/api/game/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ difficulty }) }).then(r => r.json()),
  collect: (sessionId, word) => fetch(`/api/game/${sessionId}/collect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word }) }).then(r => r.json()),
  submitQuestion: (sessionId) => fetch(`/api/game/${sessionId}/submit-question`, { method: 'POST' }).then(r => r.json()),
  submitAnswer: (sessionId, answer) => fetch(`/api/game/${sessionId}/submit-answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer }) }).then(r => r.json()),
  state: (sessionId) => fetch(`/api/game/${sessionId}/state`).then(r => r.json()),
  update: (sessionId, dt) => fetch(`/api/game/${sessionId}/update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delta_time: dt }) }).then(r => r.json()),
  randomPrompt: () => fetch('/api/random-prompt').then(r => r.json()),
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
  submitWords: document.getElementById('submitWords'),
  answerInput: document.getElementById('answerInput'),
  submitAnswer: document.getElementById('submitAnswer'),
  finalScore: document.getElementById('finalScore'),
  randomPrompt: document.getElementById('randomPrompt'),
  backToMenu: document.getElementById('backToMenu'),
};

let ctx = els.canvas.getContext('2d');
let sessionId = null;
let running = false;
let localTimer = 60; // seconds total session
let words = [];
let collected = new Set();

function show(screen) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function rand(min, max) { return Math.random() * (max - min) + min; }

function spawnFromState(state) {
  words = state.flying_words.map(w => ({
    word: w.word,
    x: w.x,
    y: w.y,
    vx: rand(-1.5, 1.5),
    vy: rand(-1.5, 1.5),
    collected: w.collected,
  }));
}

function speedMultiplier() {
  const diff = els.difficulty.value;
  if (diff === 'easy') return 0.8;
  if (diff === 'hard') return 1.5;
  return 1.0;
}

function update(dt) {
  // move words
  const spd = speedMultiplier();
  for (const w of words) {
    if (w.collected) continue;
    w.x += w.vx * spd;
    w.y += w.vy * spd;
    if (w.x <= 0 || w.x >= els.canvas.width) w.vx *= -1;
    if (w.y <= 0 || w.y >= els.canvas.height) w.vy *= -1;
  }
}

function draw(state) {
  ctx.fillStyle = '#061012';
  ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
  // draw collected area box
  ctx.strokeStyle = '#00ff9c';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, els.canvas.height - 80, els.canvas.width - 40, 60);
  ctx.fillStyle = '#6be36b';
  ctx.font = '14px "Press Start 2P"';
  ctx.textBaseline = 'top';
  // draw words
  for (const w of words) {
    if (w.collected) continue;
    ctx.fillText(w.word, Math.floor(w.x), Math.floor(w.y));
  }
  // draw collected preview
  const preview = Array.from(collected).join(' ');
  ctx.fillStyle = '#d0ffd0';
  ctx.fillText(preview, 30, els.canvas.height - 70);
}

async function syncState() {
  if (!sessionId) return null;
  const state = await API.state(sessionId);
  els.score.textContent = state.score;
  els.lives.textContent = state.lives;
  els.questionText.textContent = state.current_question || '';
  if (words.length === 0) spawnFromState(state);
  return state;
}

function pointInText(px, py, tx, ty, text) {
  // rough bounding box for click detection
  const width = text.length * 8; // approximate width per character
  const height = 14;
  return px >= tx && px <= tx + width && py >= ty && py <= ty + height;
}

els.canvas.addEventListener('click', async (e) => {
  if (!running) return;
  const rect = els.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  for (const w of words) {
    if (!w.collected && pointInText(x, y, w.x, w.y, w.word)) {
      const res = await API.collect(sessionId, w.word);
      if (res.success) {
        w.collected = true;
        collected.add(w.word);
      }
      break;
    }
  }
});

els.submitWords.addEventListener('click', async () => {
  if (!sessionId) return;
  const res = await API.submitQuestion(sessionId);
  if (res.success && res.question_text) {
    // switch to answer mode visually by highlighting input
    els.answerInput.focus();
  } else if (res.game_over) {
    endGame();
  }
});

els.submitAnswer.addEventListener('click', async () => {
  if (!sessionId) return;
  const ans = els.answerInput.value || '';
  const res = await API.submitAnswer(sessionId, ans);
  if (res.success) {
    els.answerInput.value = '';
    collected.clear();
    words = []; // will respawn from next state
    const st = await syncState();
    if (st && st.state === 'completed') endGame();
  } else if (res.game_over) {
    endGame();
  }
});

let rafId = null;
let lastTs = 0;
async function loop(ts) {
  if (!running) return;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;
  localTimer -= dt;
  if (localTimer <= 0) {
    endGame();
    return;
  }
  els.timer.textContent = Math.max(0, Math.floor(localTimer));

  update(dt);
  const state = await syncState();
  if (state && (state.state === 'game_over' || state.lives <= 0)) {
    endGame();
    return;
  }
  draw(state || {});
  // also ping backend to update internal timers and movement
  if (sessionId) API.update(sessionId, dt).catch(() => {});
  rafId = requestAnimationFrame(loop);
}

function enterFullscreenIfNeeded() {
  if (els.screenMode.value !== 'fullscreen') return;
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen();
}

async function startGame() {
  show(screens.game);
  enterFullscreenIfNeeded();
  const diff = els.difficulty.value;
  const res = await API.createGame(diff);
  if (!res.success) {
    alert('Ошибка запуска игры');
    show(screens.menu);
    return;
  }
  sessionId = res.session_id;
  localTimer = 60;
  collected.clear();
  words = [];
  running = true;
  lastTs = performance.now();
  requestAnimationFrame((ts) => { lastTs = ts; loop(ts); });
}

async function endGame() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  const st = sessionId ? await API.state(sessionId) : { score: 0 };
  els.finalScore.textContent = st && typeof st.score === 'number' ? st.score : 0;
  const p = await API.randomPrompt().catch(() => ({ success: false }));
  if (p && p.success) {
    els.randomPrompt.textContent = p.text;
  } else {
    els.randomPrompt.textContent = 'Сделайте короткий вдох/выдох и продолжите. :)';
  }
  show(screens.end);
  // auto return to menu shortly after showing prompt
  setTimeout(() => { show(screens.menu); }, 5000);
}

els.startBtn.addEventListener('click', startGame);
els.backToMenu.addEventListener('click', () => {
  show(screens.menu);
});


