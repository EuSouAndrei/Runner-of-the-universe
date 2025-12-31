// ================= CANVAS =================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ================= CONSTANTES =================
const GRAVITY = 0.6;
const WORLD_WIDTH = 3000;

// ================= PLAYER =================
let player;
function resetPlayer() {
  player = {
    x: 100, y: 200,
    vx: 0, vy: 0,
    w: 20, h: 34,
    speed: 0.5,
    maxSpeed: 4,
    jumps: 2,
    life: 5,
    attack: 0
  };
}
resetPlayer();

// ================= CAMERA =================
let camX = 0;

// ================= INPUT =================
const keys = {};
let joyX = 0;

addEventListener("keydown", e => keys[e.key] = true);
addEventListener("keyup", e => keys[e.key] = false);

// Mobile joystick
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

joystick.ontouchmove = e => {
  const r = joystick.getBoundingClientRect();
  joyX = (e.touches[0].clientX - (r.left + r.width / 2)) / 40;
  joyX = Math.max(-1, Math.min(1, joyX));
  stick.style.left = 35 + joyX * 25 + "px";
};
joystick.ontouchend = () => {
  joyX = 0;
  stick.style.left = "35px";
};

// Attack
document.getElementById("attack").onclick = () => {
  if (player.attack <= 0) player.attack = 15;
};

// Restart
document.getElementById("restart").onclick = () => resetPlayer();

// ================= MAP =================
const platforms = [];
for (let i = 0; i < 20; i++) {
  platforms.push({
    x: i * 160,
    y: 320 + Math.sin(i) * 40,
    w: 120,
    h: 16
  });
}

// ================= ENEMIES =================
const enemies = [];
for (let i = 0; i < 6; i++) {
  enemies.push({
    x: 600 + i * 300,
    y: 290,
    w: 18,
    h: 26,
    life: 3
  });
}

// ================= UPDATE =================
function update() {
  // Movimento
  if (keys["a"] || joyX < -0.2) player.vx -= player.speed;
  if (keys["d"] || joyX > 0.2) player.vx += player.speed;

  if ((keys[" "] || keys["w"]) && player.jumps > 0) {
    player.vy = -11;
    player.jumps--;
  }

  player.vx *= 0.85;
  player.vx = Math.max(-player.maxSpeed, Math.min(player.vx, player.maxSpeed));

  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  // Colisão com plataformas
  platforms.forEach(p => {
    if (
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      player.y + player.h > p.y &&
      player.y + player.h < p.y + 16 &&
      player.vy > 0
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.jumps = 2;
    }
  });

  // Ataque
  if (player.attack > 0) player.attack--;

  enemies.forEach(e => {
    if (
      player.attack > 0 &&
      player.x + 30 > e.x &&
      player.x < e.x + e.w
    ) {
      e.life--;
    }
  });

  // Câmera
  camX = Math.max(0, Math.min(player.x - canvas.width / 2, WORLD_WIDTH - canvas.width));

  document.getElementById("life").innerText = "❤️".repeat(player.life);
}

// ================= DRAW =================
function draw() {
  ctx.fillStyle = "#05070d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Fundo
  ctx.fillStyle = "#0b1020";
  for (let i = 0; i < 10; i++) {
    ctx.fillRect((i * 400 - camX * 0.3) % canvas.width, 150, 200, 300);
  }

  // Plataformas
  ctx.fillStyle = "#1c3d3a";
  platforms.forEach(p =>
    ctx.fillRect(p.x - camX, p.y, p.w, p.h)
  );

  // Inimigos
  ctx.fillStyle = "#ff5577";
  enemies.forEach(e => {
    if (e.life > 0)
      ctx.fillRect(e.x - camX, e.y, e.w, e.h);
  });

  // Player (pixel art simples)
  ctx.fillStyle = "#e8f7ff";
  ctx.fillRect(player.x - camX, player.y, player.w, player.h);

  if (player.attack > 0) {
    ctx.strokeStyle = "#6fffe9";
    ctx.beginPath();
    ctx.arc(player.x - camX + 30, player.y + 18, 15, -0.5, 0.5);
    ctx.stroke();
  }
}

// ================= LOOP =================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();