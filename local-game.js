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
let running = false;
let localTimer = 60;
let words = [];
let dragged = null;
let assembled = [];
let gameState = null;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let lives = 3;
let combo = 0;
let streak = 0;

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

function extractWords(text) {
  const words = text.match(/\b[\w-]+\b/g) || [];
  const stopWords = new Set(['что', 'как', 'где', 'когда', 'почему', 'зачем', 'кто', 
    'чтобы', 'если', 'то', 'и', 'в', 'на', 'с', 'по', 'о', 'об',
    'из', 'от', 'до', 'для', 'у', 'о', 'об', 'не', 'но', 'а',
    'же', 'ли', 'бы', 'вот', 'это', 'тот', 'такой', 'какой',
    'весь', 'все', 'всё', 'он', 'она', 'оно', 'они', 'я', 'ты',
    'вы', 'мы', 'свой', 'твой', 'ваш', 'наш', 'его', 'её', 'их']);
  
  return words.filter(word => word.length > 2 && !stopWords.has(word.toLowerCase()));
}

function cleanText(text) {
  return text.replace(/[^\w\s]/g, '').toLowerCase().trim();
}

function checkSimilarity(userText, correctText, threshold = 0.8) {
  const userWords = new Set(userText.split(/\s+/));
  const correctWords = new Set(correctText.split(/\s+/));
  if (correctWords.size === 0) return false;
  const common = new Set([...userWords].filter(x => correctWords.has(x)));
  return common.size / correctWords.size >= threshold;
}

async function loadQuestions() {
  try {
    const response = await fetch('reflections.csv');
    const csvText = await response.text();
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    questions = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',');
      if (values.length < 8) continue;
      
      const privacyOk = values[7]?.toLowerCase().trim();
      if (privacyOk !== 'true') continue;
      
      const reflectionId = values[0];
      const promptText = values[3];
      const answerText = values[4];
      const insightTags = values[5] ? values[5].split(',').map(t => t.trim()) : [];
      
      const requiredWords = extractWords(answerText);
      if (requiredWords.length < 3) continue;
      
      questions.push({
        reflection_id: reflectionId,
        prompt_text: promptText,
        answer_text: answerText,
        insight_tags: insightTags,
        required_words: requiredWords.slice(0, 5)
      });
    }
    
    console.log(`Loaded ${questions.length} questions`);
    return questions;
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
}

function getQuestionsByDifficulty(difficulty, count = 5) {
  let filtered = questions.filter(q => {
    const wordCount = q.required_words.length;
    if (difficulty === 'easy') return wordCount <= 3;
    if (difficulty === 'medium') return wordCount >= 3 && wordCount <= 4;
    return wordCount >= 4;
  });
  
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function generateFlyingWords() {
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return;
  
  const requiredWords = currentQuestion.required_words;
  const distractionWords = currentQuestion.insight_tags || [];
  const commonDistractions = ["сегодня", "завтра", "потом", "сейчас", "очень", 
    "быстро", "медленно", "иногда", "часто", "редко"];
  
  const allWords = [...requiredWords, ...distractionWords, ...commonDistractions];
  const shuffled = allWords.sort(() => Math.random() - 0.5);
  
  words = shuffled.map(word => ({
    word: word,
    x: rand(50, 750),
    y: rand(50, 400),
    vx: rand(-1.2, 1.2),
    vy: rand(-1.2, 1.2),
    collected: false,
  }));
}

function spawnFromState() {
  generateFlyingWords();
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

function draw() {
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

els.canvas.addEventListener('mouseup', (e) => {
  if (!dragged) return;
  const rect = els.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const dropZone = { x: 20, y: els.canvas.height - 80, w: els.canvas.width - 40, h: 60 };
  const inDrop = x >= dropZone.x && x <= dropZone.x + dropZone.w && y >= dropZone.y && y <= dropZone.y + dropZone.h;
  if (inDrop) {
    dragged.collected = true;
    assembled.push(dragged.word);
    autoValidate();
  }
  dragged = null;
});

function syncState() {
  els.score.textContent = score;
  els.lives.textContent = lives;
  const currentQuestion = questions[currentQuestionIndex];
  els.questionText.textContent = currentQuestion ? currentQuestion.prompt_text : '';
  if (words.length === 0) spawnFromState();
}

function autoValidate() {
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return;
  
  const userAnswer = cleanText(assembled.join(' '));
  const correctAnswer = cleanText(currentQuestion.answer_text);
  
  const isCorrect = checkSimilarity(userAnswer, correctAnswer, 0.8);
  
  if (isCorrect) {
    const points = calculatePoints(currentQuestion);
    score += points;
    combo += 1;
    streak += 1;
    
    if (streak >= 3) {
      const streakBonus = streak * 10;
      score += streakBonus;
    }
    
    currentQuestionIndex += 1;
    assembled = [];
    words = [];
    
    if (currentQuestionIndex >= questions.length) {
      endGame();
      return;
    }
    
    localTimer = 30;
    generateFlyingWords();
  } else {
    lives -= 1;
    combo = 0;
    streak = 0;
    assembled = [];
    words = [];
    
    if (lives <= 0) {
      endGame();
      return;
    }
    
    localTimer = 30;
    generateFlyingWords();
  }
}

function calculatePoints(question) {
  const basePoints = question.required_words.length * 20;
  const timeBonus = Math.floor(localTimer * 3);
  const difficultyBonus = {
    "easy": 10,
    "medium": 20,
    "hard": 30
  }[els.difficulty.value] || 10;
  
  return basePoints + timeBonus + difficultyBonus;
}

let rafId = null;
let lastTs = 0;
async function loop(ts) {
  if (!running) return;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;
  localTimer -= dt;
  if (localTimer <= 0) { 
    lives -= 1;
    if (lives <= 0) {
      endGame(); 
      return;
    }
    localTimer = 30;
    assembled = [];
    words = [];
    generateFlyingWords();
  }
  els.timer.textContent = Math.max(0, Math.floor(localTimer));
  update(dt);
  syncState();
  draw();
  rafId = requestAnimationFrame(loop);
}

function enterFullscreenIfNeeded() {
  if (els.screenMode.value !== 'fullscreen') return;
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen();
}

async function startGame() {
  try {
    show(screens.game);
    enterFullscreenIfNeeded();
    
    const gameQuestions = getQuestionsByDifficulty(els.difficulty.value, 5);
    if (gameQuestions.length === 0) {
      alert('Не удалось загрузить вопросы. Проверьте файл reflections.csv');
      show(screens.menu);
      return;
    }
    
    questions = gameQuestions;
    currentQuestionIndex = 0;
    score = 0;
    lives = 3;
    combo = 0;
    streak = 0;
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
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  els.finalScore.textContent = score;
  
  try {
    const response = await fetch('prompts.csv');
    const csvText = await response.text();
    const lines = csvText.split('\n');
    const prompts = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',');
      if (values.length >= 2) {
        prompts.push(values[1]);
      }
    }
    if (prompts.length > 0) {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      els.randomPrompt.textContent = randomPrompt;
    } else {
      els.randomPrompt.textContent = 'Сделайте короткий вдох/выдох и продолжите. :)';
    }
  } catch (error) {
    console.error('Error loading prompts:', error);
    els.randomPrompt.textContent = 'Сделайте короткий вдох/выдох и продолжите. :)';
  }
  
  show(screens.end);
  setTimeout(()=>show(screens.menu), 5000);
}

els.startBtn.addEventListener('click', startGame);
els.backToMenu.addEventListener('click', ()=> show(screens.menu));

loadQuestions().then(() => {
  console.log('Questions loaded, game ready');
});
