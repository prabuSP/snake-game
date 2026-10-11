const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const restartBtn = document.getElementById("restart");

const CELL = 24;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;
const START_TICK = 140;

const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

let snake;
let dir;
let pendingDir;
let food;
let score;
let best = Number(localStorage.getItem("snake-best") || 0);
let running;
let paused;
let waiting;
let tickMs;
let timer;

bestEl.textContent = String(best);

function cellEquals(a, b) {
  return a.x === b.x && a.y === b.y;
}

function randomFood() {
  while (true) {
    const next = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
    if (!snake.some((part) => cellEquals(part, next))) {
      return next;
    }
  }
}

function reset() {
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
  dir = { x: 1, y: 0 };
  pendingDir = dir;
  score = 0;
  tickMs = START_TICK;
  running = true;
  paused = false;
  waiting = true;
  food = randomFood();
  scoreEl.textContent = "0";
  clearInterval(timer);
  draw();
  showOverlay("Ready", "Press an arrow key or WASD to start", false);
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function showOverlay(title, text, showRestart) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  restartBtn.classList.toggle("hidden", !showRestart);
  overlay.classList.remove("hidden");
}

function opposite(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

function step() {
  if (!running || paused || waiting) {
    return;
  }

  if (!opposite(pendingDir, dir)) {
    dir = pendingDir;
  }

  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
  const hitSelf = snake.some((part) => cellEquals(part, head));

  if (hitWall || hitSelf) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (cellEquals(head, food)) {
    score += 1;
    scoreEl.textContent = String(score);
    if (score > best) {
      best = score;
      bestEl.textContent = String(best);
      localStorage.setItem("snake-best", String(best));
    }
    tickMs = Math.max(70, START_TICK - score * 4);
    food = randomFood();
    loop();
  } else {
    snake.pop();
  }

  draw();
}

function gameOver() {
  running = false;
  clearInterval(timer);
  draw();
  showOverlay("Game over", `Score ${score} · press Enter to try again`, true);
}

function loop() {
  clearInterval(timer);
  timer = setInterval(step, tickMs);
}

function drawCell(x, y, color, inset = 2) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + inset, y * CELL + inset, CELL - inset * 2, CELL - inset * 2);
}

function draw() {
  ctx.fillStyle = "#1e2a24";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  for (let x = 0; x <= COLS; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(canvas.width, y * CELL);
    ctx.stroke();
  }

  drawCell(food.x, food.y, "#ff6b6b", 5);

  snake.forEach((part, index) => {
    drawCell(part.x, part.y, index === 0 ? "#c8ffd9" : "#7dffa3", index === 0 ? 3 : 4);
  });
}

function togglePause() {
  if (!running || waiting) {
    return;
  }
  paused = !paused;
  if (paused) {
    showOverlay("Paused", "Press Space to continue", false);
  } else {
    hideOverlay();
  }
}

document.addEventListener("keydown", (event) => {
  const next = DIRS[event.key] || DIRS[event.key.toLowerCase()];
  if (next) {
    event.preventDefault();
    pendingDir = next;
    if (waiting) {
      waiting = false;
      hideOverlay();
      loop();
    }
    return;
  }

  if (event.key === " " || event.code === "Space") {
    event.preventDefault();
    togglePause();
  }

  if (event.key === "Enter" && !running) {
    reset();
  }
});

restartBtn.addEventListener("click", reset);

reset();
