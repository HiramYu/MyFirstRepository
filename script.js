const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status');
const scoreText = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

const TILE = 32;
const levelRows = [
  '####################',
  '#.....#.....#....M.#',
  '#.###.#.###.#.###..#',
  '#.#...#...#.#...#..#',
  '#.#.#####.#.###.#.##',
  '#...#P....#...#....#',
  '###.#.######.#.###.#',
  '#...#......#.#.....#',
  '#.#######..#.#####.#',
  '#.......#..#.....#.#',
  '#.#####.#..#####.#.#',
  '#.....#....M......##',
  '####################'
];

let walls = [];
let shards = [];
let monsters = [];
let player = { x: 0, y: 0, speed: 2.2, r: 10 };
let keys = new Set();
let gameState = 'running';
let totalShards = 0;
let collected = 0;

function resetGame() {
  walls = [];
  shards = [];
  monsters = [];
  collected = 0;
  gameState = 'running';

  levelRows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const px = x * TILE;
      const py = y * TILE;

      if (cell === '#') {
        walls.push({ x: px, y: py, w: TILE, h: TILE });
      } else {
        if (cell === 'P') {
          player.x = px + TILE / 2;
          player.y = py + TILE / 2;
        }
        if (cell === 'M') {
          monsters.push({
            x: px + TILE / 2,
            y: py + TILE / 2,
            r: 10,
            vx: Math.random() > 0.5 ? 1.6 : -1.6,
            vy: Math.random() > 0.5 ? 1.6 : -1.6
          });
        }
        if (cell === '.') {
          shards.push({ x: px + TILE / 2, y: py + TILE / 2, r: 4, taken: false });
        }
      }
    });
  });

  totalShards = shards.length;
  updateHud();
}

function updateHud() {
  scoreText.textContent = `Shards: ${collected} / ${totalShards}`;
  if (gameState === 'won') {
    statusText.textContent = 'You escaped the darkness!';
    statusText.style.color = '#6dffb8';
  } else if (gameState === 'lost') {
    statusText.textContent = 'Caught by a shadow monster!';
    statusText.style.color = '#ff4d6d';
  } else {
    statusText.textContent = 'Collect all shards!';
    statusText.style.color = '#6dffb8';
  }
}

function circleRectCollision(cx, cy, r, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

function movePlayer() {
  if (gameState !== 'running') return;

  let dx = 0;
  let dy = 0;
  if (keys.has('arrowup') || keys.has('w')) dy -= player.speed;
  if (keys.has('arrowdown') || keys.has('s')) dy += player.speed;
  if (keys.has('arrowleft') || keys.has('a')) dx -= player.speed;
  if (keys.has('arrowright') || keys.has('d')) dx += player.speed;

  tryMove(player, dx, 0);
  tryMove(player, 0, dy);
}

function tryMove(entity, dx, dy) {
  if (!dx && !dy) return;
  const nextX = entity.x + dx;
  const nextY = entity.y + dy;

  const blocked = walls.some((w) => circleRectCollision(nextX, nextY, entity.r, w));
  if (!blocked) {
    entity.x = nextX;
    entity.y = nextY;
  }
}

function moveMonsters() {
  if (gameState !== 'running') return;

  monsters.forEach((m) => {
    const hitX = walls.some((w) => circleRectCollision(m.x + m.vx, m.y, m.r, w));
    const hitY = walls.some((w) => circleRectCollision(m.x, m.y + m.vy, m.r, w));

    if (hitX) m.vx *= -1;
    if (hitY) m.vy *= -1;

    if (!hitX) m.x += m.vx;
    if (!hitY) m.y += m.vy;

    if (Math.random() < 0.01) {
      m.vx *= Math.random() > 0.5 ? -1 : 1;
      m.vy *= Math.random() > 0.5 ? -1 : 1;
    }
  });
}

function checkShardCollection() {
  shards.forEach((s) => {
    if (s.taken) return;
    const dx = player.x - s.x;
    const dy = player.y - s.y;
    if (dx * dx + dy * dy < (player.r + s.r) ** 2) {
      s.taken = true;
      collected += 1;
      if (collected >= totalShards) {
        gameState = 'won';
      }
      updateHud();
    }
  });
}

function checkMonsterHit() {
  monsters.forEach((m) => {
    const dx = player.x - m.x;
    const dy = player.y - m.y;
    if (dx * dx + dy * dy < (player.r + m.r) ** 2) {
      gameState = 'lost';
      updateHud();
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  walls.forEach((w) => {
    ctx.fillStyle = '#202039';
    ctx.fillRect(w.x, w.y, w.w, w.h);
  });

  shards.forEach((s) => {
    if (s.taken) return;
    ctx.fillStyle = '#a0f7ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  monsters.forEach((m) => {
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#9b59ff';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  if (gameState !== 'running') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    const msg = gameState === 'won' ? 'YOU WIN' : 'GAME OVER';
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
  }
}

function gameLoop() {
  movePlayer();
  moveMonsters();
  checkShardCollection();
  checkMonsterHit();
  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => keys.add(e.key.toLowerCase()));
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
restartBtn.addEventListener('click', resetGame);

resetGame();
gameLoop();
