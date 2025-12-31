  // ================= CANVAS & CONFIG =================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
const restart = document.getElementById("restart");
const controlsBtn = document.getElementById("controlsBtn");
const controlsScreen = document.getElementById("controlsScreen");
const closeControls = document.getElementById("closeControls");

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

// ================= WORLD DATA =================
const WORLD_WIDTH = 3200;
let cameraX = 0;
const gravity = 0.6;
let fragments = 0, stageIndex = 0;
const stages = ["Root Directory", "Memory Heap", "Cache Overflow", "System32 Ruins", "Recycle Bin Abyss"];

// ================= PLAYER OBJECT =================
const player = {
    x: 50, y: 100, vx: 0, vy: 0,
    speed: 5, jumps: 2, facing: 1,
    dashCD: 0, attackTimer: 0,
    anim: 0, state: "idle"
};

// ================= PIXEL ART DATA =================
const runnerFrames = {
    idle: [
        ["001100", "011110", "111111", "101101", "111111", "011110"],
        ["001100", "011110", "111111", "101101", "111111", "010010"]
    ],
    run: [
        ["001100", "011110", "111111", "101101", "111111", "110010"],
        ["001100", "011110", "111111", "101101", "111111", "010011"]
    ],
    jump: [
        ["001100", "011110", "111111", "101101", "010010", "010010"]
    ],
    attack: [
        ["001100", "011110", "111111", "101101", "111111", "001111"]
    ]
};

function drawRunner() {
    const frames = runnerFrames[player.state];
    const frame = frames[Math.floor(player.anim) % frames.length];
    ctx.fillStyle = "#00ffcc";
    frame.forEach((r, ry) => [...r].forEach((p, rx) => {
        if (p === "1")
            ctx.fillRect(player.x - cameraX + rx * 4, player.y + ry * 4, 4, 4);
    }));

    if (player.state === "attack") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
            player.x - cameraX + (player.facing > 0 ? 24 : -8),
            player.y + 12, 12, 4
        );
    }
}

// ================= BACKGROUND =================
function drawBackground() {
    for (let i = 0; i < 120; i++) {
        ctx.fillStyle = "rgba(0,255,204,0.08)";
        ctx.fillRect((i * 120 - cameraX * 0.2) % canvas.width, 80, 40, 2);
    }
}

// ================= ENEMY CLASS =================
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 2;
        this.anim = 0;
    }
    update() {
        this.x += Math.sign(player.x - this.x) * 1.2;
        this.anim += 0.1;
    }
    draw() {
        ctx.fillStyle = this.anim % 1 < 0.5 ? "#ff3355" : "#ff6677";
        ctx.fillRect(this.x - cameraX, this.y, 20, 20);
    }
}

// ================= MAP & LEVEL LOADING =================
let platforms = [], enemies = [];
function loadStage() {
    document.getElementById("stage").innerText = stages[stageIndex];
    document.getElementById("info").innerText = "Fragmentos: " + fragments;

    platforms = [
        { x: 0, y: canvas.height - 40, w: WORLD_WIDTH, h: 40 },
        { x: 300, y: canvas.height - 160, w: 180, h: 20 },
        { x: 700, y: canvas.height - 240, w: 160, h: 20 },
        { x: 1200, y: canvas.height - 200, w: 180, h: 20 },
        { x: 1700, y: canvas.height - 300, w: 200, h: 20 },
        { x: 2300, y: canvas.height - 220, w: 160, h: 20 }
    ];

    enemies = [];
    for (let i = 0; i < 8; i++)
        enemies.push(new Enemy(600 + i * 300, canvas.height - 60));

    player.x = 50;
    player.y = canvas.height - 120;
}

// ================= INPUTS (TOUCH) =================
let joyX = 0;
joystick.ontouchstart = joystick.ontouchmove = e => {
    const r = joystick.getBoundingClientRect();
    const t = e.touches[0];
    joyX = Math.max(-1, Math.min(1, (t.clientX - (r.left + 60)) / 40));
    stick.style.left = 35 + joyX * 30 + "px";
};
joystick.ontouchend = () => {
    joyX = 0;
    stick.style.left = "35px"
};

const jumpBtn = document.getElementById("jump");
const dashBtn = document.getElementById("dash");
const attackBtn = document.getElementById("attack");

jumpBtn.ontouchstart = () => { if (player.jumps > 0) { player.vy = -12; player.jumps-- } };
dashBtn.ontouchstart = () => { if (player.dashCD <= 0) { player.vx = 14 * player.facing; player.dashCD = 30 } };
attackBtn.ontouchstart = () => { if (player.attackTimer <= 0) { player.attackTimer = 15 } };

// ================= INPUTS (KEYBOARD) =================
document.addEventListener("keydown", e => {
    if (e.key === "a" || e.key === "ArrowLeft") joyX = -1;
    if (e.key === "d" || e.key === "ArrowRight") joyX = 1;
    if (["w", "ArrowUp", " "].includes(e.key) && player.jumps > 0) {
        player.vy = -12; player.jumps--;
    }
    if (e.key === "Shift" && player.dashCD <= 0) {
        player.vx = 14 * player.facing; player.dashCD = 30;
    }
    if (e.key === "j" && player.attackTimer <= 0) player.attackTimer = 15;
    if (e.key === "r") restart.onclick();
});
document.addEventListener("keyup", e => {
    if (["a", "ArrowLeft", "d", "ArrowRight"].includes(e.key)) joyX = 0;
});

// ================= UI EVENTS =================
restart.onclick = () => { fragments = 0; stageIndex = 0; loadStage() };
controlsBtn.onclick = () => controlsScreen.style.display = "block";
closeControls.onclick = () => controlsScreen.style.display = "none";

// ================= GAME LOOP =================
function update() {
    player.vx = joyX * player.speed;
    if (joyX) player.facing = Math.sign(joyX);
    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;
    player.dashCD--;
    player.attackTimer--;
    player.anim += 0.15;

    player.state =
        player.attackTimer > 0 ? "attack" :
            player.vy != 0 ? "jump" :
                Math.abs(player.vx) > 1 ? "run" : "idle";

    // Colisão com plataformas
    platforms.forEach(p => {
        if (player.x < p.x + p.w && player.x + 24 > p.x &&
            player.y < p.y + p.h && player.y + 24 > p.y && player.vy > 0) {
            player.y = p.y - 24; player.vy = 0; player.jumps = 2;
        }
    });

    // Inimigos e Ataque
    enemies.forEach((e, i) => {
        e.update();
        if (player.attackTimer > 0 && Math.abs(player.x - e.x) < 30) {
            e.hp--; if (e.hp <= 0) enemies.splice(i, 1);
        }
    });

    // Câmera
    cameraX = Math.max(0, Math.min(player.x - canvas.width / 2, WORLD_WIDTH - canvas.width));

    // Mudança de fase
    if (player.x > WORLD_WIDTH - 40) {
        fragments++; stageIndex++;
        if (stageIndex >= stages.length) {
            alert("SISTEMA RESTAURADO");
            stageIndex = 0; fragments = 0;
        }
        loadStage();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    ctx.fillStyle = "#007766";
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.y, p.w, p.h));
    enemies.forEach(e => e.draw());
    drawRunner();
}

loadStage();
(function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
})();
