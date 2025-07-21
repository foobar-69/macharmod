// --- DOM Element Selection ---
const gameContainer = document.getElementById('game-container');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const scoreBoard = document.getElementById('score-board');
const healthBar = document.getElementById('health-bar');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');

const easyBtn = document.getElementById('easy-btn');
const mediumBtn = document.getElementById('medium-btn');
const hardBtn = document.getElementById('hard-btn');
const restartBtn = document.getElementById('restart-btn');

// --- Game Configuration ---
let canvasWidth, canvasHeight;
let player, mosquitoes;
let score, health;
let gameLoopId;
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let bloodParticles = []; // Array to hold blood effect particles

const difficultySettings = {
    easy: { mosquitoCount: 10, speedMultiplier: 0.8 },
    medium: { mosquitoCount: 20, speedMultiplier: 1.2 },
    hard: { mosquitoCount: 35, speedMultiplier: 1.8 }
};
let currentDifficulty;

// --- SVG Assets ---

// Normal Player character SVG
const playerSVG = new Image();
playerSVG.src = `data:image/svg+xml;base64,${btoa(`
<svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Head -->
  <circle cx="50" cy="25" r="20" fill="#ffcc99"/>
  <!-- Eyes -->
  <circle cx="42" cy="22" r="3" fill="black"/>
  <circle cx="58" cy="22" r="3" fill="black"/>
  <!-- Smile -->
  <path d="M 40 32 Q 50 40 60 32" stroke="black" fill="transparent" stroke-width="2"/>
  <!-- Body -->
  <rect x="35" y="45" width="30" height="50" rx="15" fill="#4682b4"/>
  <!-- Legs -->
  <rect x="38" y="95" width="10" height="20" fill="#333"/>
  <rect x="52" y="95" width="10" height="20" fill="#333"/>
  <!-- Arms up in defense -->
  <path d="M 35 60 Q 15 50 20 30" stroke="#ffcc99" fill="transparent" stroke-width="10" stroke-linecap="round"/>
  <path d="M 65 60 Q 85 50 80 30" stroke="#ffcc99" fill="transparent" stroke-width="10" stroke-linecap="round"/>
</svg>
`)}`;

// --- NEW: Depressed Player character SVG ---
const depressedPlayerSVG = new Image();
depressedPlayerSVG.src = `data:image/svg+xml;base64,${btoa(`
<svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
  <!-- Head -->
  <circle cx="50" cy="25" r="20" fill="#c2b280"/> <!-- Muted color -->
  <!-- Eyes -->
  <path d="M 40 25 Q 42.5 22 45 25" stroke="black" fill="transparent" stroke-width="2"/>
  <path d="M 55 25 Q 57.5 22 60 25" stroke="black" fill="transparent" stroke-width="2"/>
  <!-- Frown -->
  <path d="M 40 35 Q 50 30 60 35" stroke="black" fill="transparent" stroke-width="2"/>
  <!-- Body -->
  <rect x="35" y="45" width="30" height="50" rx="15" fill="#5a6978"/> <!-- Darker, sadder blue -->
  <!-- Legs -->
  <rect x="38" y="95" width="10" height="20" fill="#333"/>
  <rect x="52" y="95" width="10" height="20" fill="#333"/>
  <!-- Droopy Arms -->
  <path d="M 35 55 Q 25 75 30 90" stroke="#c2b280" fill="transparent" stroke-width="10" stroke-linecap="round"/>
  <path d="M 65 55 Q 75 75 70 90" stroke="#c2b280" fill="transparent" stroke-width="10" stroke-linecap="round"/>
</svg>
`)}`;

// Mosquito SVG
const mosquitoSVG = new Image();
mosquitoSVG.src = `data:image/svg+xml;base64,${btoa(`
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <path d="M 20 15 C 5 5, 5 25, 20 15" fill="rgba(220, 220, 220, 0.8)"/><path d="M 20 15 C 35 5, 35 25, 20 15" fill="rgba(220, 220, 220, 0.8)"/><ellipse cx="20" cy="20" rx="6" ry="12" fill="#6B4F3A" transform="rotate(20 20 20)"/><circle cx="15" cy="12" r="5" fill="#3A2D27"/><circle cx="13" cy="11" r="1.5" fill="red"/><line x1="12" y1="8" x2="5" y2="2" stroke="black" stroke-width="1.5"/><path d="M 18 25 C 10 35, 20 38, 22 30" stroke="#3A2D27" fill="none" stroke-width="1"/><path d="M 22 25 C 30 35, 20 38, 18 30" stroke="#3A2D27" fill="none" stroke-width="1"/>
</svg>
`)}`;


// --- Game Setup and Initialization ---

function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

function initGame(difficulty) {
    currentDifficulty = difficulty;
    score = 0;
    health = 100;
    bloodParticles = [];
    player = { width: 80, height: 96, x: (canvasWidth / 2) - 40, y: canvasHeight - 110 };
    mosquitoes = [];
    for (let i = 0; i < currentDifficulty.mosquitoCount; i++) {
        spawnMosquito();
    }
    updateUI();
}

/**
 * Spawns a new mosquito at a random edge of the screen, excluding the bottom.
 */
function spawnMosquito() {
    const size = 40;
    let x, y;
    // --- UPDATED: Only spawn from top, right, or left ---
    const edge = Math.floor(Math.random() * 3); // 0: top, 1: right, 2: left

    switch (edge) {
        case 0: x = Math.random() * canvasWidth; y = -size; break;
        case 1: x = canvasWidth + size; y = Math.random() * canvasHeight; break;
        case 2: x = -size; y = Math.random() * canvasHeight; break;
    }

    const speed = (Math.random() * 1 + 0.5) * currentDifficulty.speedMultiplier;
    mosquitoes.push({ x, y, size, speed, isAlive: true });
}

function startGame(difficulty) {
    gameState = 'playing';
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    resizeCanvas();
    initGame(difficulty);
    if(gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoop();
}

// --- Game Loop and Drawing ---

function gameLoop() {
    if (gameState !== 'playing') return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // --- UPDATED: Choose avatar based on health ---
    const currentAvatar = health <= 50 ? depressedPlayerSVG : playerSVG;
    ctx.drawImage(currentAvatar, player.x, player.y, player.width, player.height);

    updateMosquitoes();
    updateAndDrawParticles();

    gameLoopId = requestAnimationFrame(gameLoop);
}

function updateMosquitoes() {
    mosquitoes.forEach((mosquito, index) => {
        if (mosquito.isAlive) {
            const targetX = player.x + player.width / 2;
            const targetY = player.y + player.height / 2;
            const angle = Math.atan2(targetY - mosquito.y, targetX - mosquito.x);

            mosquito.x += Math.cos(angle) * mosquito.speed;
            mosquito.y += Math.sin(angle) * mosquito.speed;

            ctx.save();
            ctx.translate(mosquito.x + mosquito.size / 2, mosquito.y + mosquito.size / 2);
            ctx.rotate(angle + Math.PI / 2);
            ctx.drawImage(mosquitoSVG, -mosquito.size / 2, -mosquito.size / 2, mosquito.size, mosquito.size);
            ctx.restore();

            if (
                mosquito.x < player.x + player.width &&
                mosquito.x + mosquito.size > player.x &&
                mosquito.y < player.y + player.height &&
                mosquito.y + mosquito.size > player.y
            ) {
                createBloodEffect(mosquito.x + mosquito.size / 2, mosquito.y + mosquito.size / 2);
                handleDamage(10);
                respawnMosquito(index);
            }
        }
    });
}

function respawnMosquito(index) {
    mosquitoes.splice(index, 1);
    spawnMosquito();
}

// --- Particle Effects ---

function createBloodEffect(x, y) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        bloodParticles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 1, alpha: 1, life: Math.random() * 30 + 20
        });
    }
}

function updateAndDrawParticles() {
    for (let i = bloodParticles.length - 1; i >= 0; i--) {
        const p = bloodParticles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.1; p.life--;
        p.alpha = p.life / 50;

        if (p.life <= 0) {
            bloodParticles.splice(i, 1);
        } else {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#c00';
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.globalAlpha = 1;
        }
    }
}

// --- UI and Player Interaction ---

function updateUI() {
    scoreBoard.textContent = `Score: ${score}`;
    healthBar.style.width = `${health}%`;
    if (health > 60) healthBar.style.backgroundColor = '#4caf50';
    else if (health > 30) healthBar.style.backgroundColor = '#ffc107';
    else healthBar.style.backgroundColor = '#f44336';
}

function handleDamage(amount) {
    health -= amount;
    if (health <= 0) {
        health = 0;
        endGame();
    }
    updateUI();
}

function endGame() {
    gameState = 'gameOver';
    cancelAnimationFrame(gameLoopId);
    finalScoreEl.textContent = `Your final score: ${score}`;
    gameOverScreen.style.display = 'flex';
}

/**
 * Kills a mosquito at a specific index.
 * @param {number} index - The index of the mosquito in the array.
 */
function killMosquito(index) {
    const m = mosquitoes[index];
    if (m && m.isAlive) {
        m.isAlive = false;
        score += 10;
        updateUI();
        createBloodEffect(m.x + m.size / 2, m.y + m.size / 2);
        setTimeout(() => respawnMosquito(index), 200); // Use setTimeout to avoid array modification issues
    }
}

// --- NEW: Event Handlers for Mouse Hover and Touch ---

function handleMouseMove(event) {
    if (gameState !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let i = mosquitoes.length - 1; i >= 0; i--) {
        const m = mosquitoes[i];
        if (m.isAlive && x > m.x && x < m.x + m.size && y > m.y && y < m.y + m.size) {
            killMosquito(i);
            break; 
        }
    }
}

function handleTouchMove(event) {
    if (gameState !== 'playing') return;
    event.preventDefault(); // Prevent screen from scrolling on touch devices

    const rect = canvas.getBoundingClientRect();
    // Handle all active touches
    for (let j = 0; j < event.touches.length; j++) {
        const touch = event.touches[j];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        for (let i = mosquitoes.length - 1; i >= 0; i--) {
            const m = mosquitoes[i];
            if (m.isAlive && x > m.x && x < m.x + m.size && y > m.y && y < m.y + m.size) {
                killMosquito(i);
                break; 
            }
        }
    }
}

// --- Event Listeners ---
window.addEventListener('resize', () => {
    resizeCanvas();
    if (gameState === 'playing') {
        player.x = (canvasWidth / 2) - (player.width / 2);
        player.y = canvasHeight - player.height - 10;
    }
});

easyBtn.addEventListener('click', () => startGame(difficultySettings.easy));
mediumBtn.addEventListener('click', () => startGame(difficultySettings.medium));
hardBtn.addEventListener('click', () => startGame(difficultySettings.hard));
restartBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    gameState = 'start';
});

// --- UPDATED: Listen for mouse movement and touch movement ---
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });


// --- Initial Setup ---
resizeCanvas();
// In script.js

function updateUI() {
    scoreBoard.textContent = `Score: ${score}`;
    healthBar.style.width = `${health}%`;
    
    // --- UPDATED: New color values to match CSS ---
    if (health > 60) {
        healthBar.style.backgroundColor = '#28a745'; // Green
    } else if (health > 30) {
        healthBar.style.backgroundColor = '#ffc107'; // Yellow
    } else {
        healthBar.style.backgroundColor = '#dc3545'; // Red
    }
}
