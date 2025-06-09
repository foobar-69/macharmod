// Game canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let score = 0;
let gameOver = false;
let difficulty = '';
let mosquitoes = [];
let lastMosquitoTime = 0;
let mosquitoInterval = 2000;
let keys = {};
let hitEffect = { active: false, x: 0, y: 0, timer: 0 };

// Avatar
const avatar = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 25,
    speed: 6,
    health: 100,
    
    draw: function() {
        // Draw avatar body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#3F51B5';
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#3F51B5';
        ctx.closePath();
        
        // Draw eyes
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 5, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 10, this.y - 5, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
        
        // Draw pupils
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 5, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 10, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.closePath();
        
        // Draw mouth (smile or frown based on health)
        ctx.beginPath();
        if (this.health > 30) {
            ctx.arc(this.x, this.y + 5, 10, 0, Math.PI);
        } else {
            ctx.arc(this.x, this.y + 15, 10, Math.PI, 0, true);
        }
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        
        // Health bar
        ctx.beginPath();
        ctx.rect(this.x - 30, this.y - 45, 60, 8);
        ctx.fillStyle = '#f44336';
        ctx.fill();
        ctx.fillStyle = '#4CAF50';
        ctx.rect(this.x - 30, this.y - 45, 60 * (this.health / 100), 8);
        ctx.fill();
        ctx.closePath();
        
        ctx.shadowBlur = 0;
    },
    
    move: function() {
        if (keys['ArrowLeft'] || keys['a']) {
            this.x = Math.max(this.radius, this.x - this.speed);
        }
        if (keys['ArrowRight'] || keys['d']) {
            this.x = Math.min(canvas.width - this.radius, this.x + this.speed);
        }
        if (keys['ArrowUp'] || keys['w']) {
            this.y = Math.max(this.radius, this.y - this.speed);
        }
        if (keys['ArrowDown'] || keys['s']) {
            this.y = Math.min(canvas.height - this.radius, this.y + this.speed);
        }
    }
};

// Mosquito class
class Mosquito {
    constructor(difficulty) {
        this.radius = 10;
        this.difficulty = difficulty;
        this.health = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
        this.healthDrain = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 5;
        
        // Movement properties
        this.speed = difficulty === 'easy' ? 1.5 + Math.random() : 
                    difficulty === 'medium' ? 2 + Math.random() : 3 + Math.random();
        
        this.angle = Math.random() * Math.PI * 2;
        this.wingFlapSpeed = 0.1 + Math.random() * 0.1;
        this.wingAngle = 0;
        
        // Start position
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { // top
            this.x = Math.random() * canvas.width;
            this.y = -this.radius;
        } else if (edge === 1) { // right
            this.x = canvas.width + this.radius;
            this.y = Math.random() * canvas.height;
        } else if (edge === 2) { // bottom
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + this.radius;
        } else { // left
            this.x = -this.radius;
            this.y = Math.random() * canvas.height;
        }
        
        // Initial movement vector
        this.updateMovement();
    }
    
    updateMovement() {
        // Change angle occasionally for more natural movement
        if (Math.random() < 0.05) {
            const targetAngle = Math.atan2(avatar.y - this.y, avatar.x - this.x);
            const angleVariation = this.difficulty === 'hard' ? 0.8 : 
                                 this.difficulty === 'medium' ? 0.4 : 0.2;
            this.angle = targetAngle + (Math.random() - 0.5) * angleVariation;
        }
        
        this.dx = Math.cos(this.angle) * this.speed;
        this.dy = Math.sin(this.angle) * this.speed;
    }
    
    draw() {
        // Body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        ctx.closePath();
        
        // Wings
        this.wingAngle += this.wingFlapSpeed;
        const wingSize = this.radius * 1.5;
        const wingOffset = Math.sin(this.wingAngle) * wingSize * 0.3;
        
        // Left wing
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(
            this.x - wingSize, this.y - wingSize + wingOffset,
            this.x - wingSize * 0.3, this.y - wingSize * 0.7
        );
        ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
        ctx.fill();
        ctx.closePath();
        
        // Right wing
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(
            this.x + wingSize, this.y - wingSize + wingOffset,
            this.x + wingSize * 0.3, this.y - wingSize * 0.7
        );
        ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
        ctx.fill();
        ctx.closePath();
        
        // Health indicator for mosquitoes with health > 1
        if (this.health > 1) {
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.radius - 5, 3, 0, Math.PI * 2);
            ctx.fillStyle = this.health > 2 ? '#f44336' : '#ff9800';
            ctx.fill();
            ctx.closePath();
        }
    }
    
    update() {
        this.updateMovement();
        this.x += this.dx;
        this.y += this.dy;
        
        // Check collision with avatar
        const dist = Math.sqrt((this.x - avatar.x) ** 2 + (this.y - avatar.y) ** 2);
        if (dist < this.radius + avatar.radius) {
            avatar.health -= this.healthDrain;
            this.health = 0;
            
            // Show ouch effect
            hitEffect.active = true;
            hitEffect.x = avatar.x;
            hitEffect.y = avatar.y;
            hitEffect.timer = 30;
            
            if (avatar.health <= 0) {
                gameOver = true;
                document.getElementById('finalScore').textContent = `Score: ${score}`;
                document.getElementById('gameOver').style.display = 'block';
            }
        }
    }
}

// Event listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    avatar.x = canvas.width / 2;
    avatar.y = canvas.height / 2;
});

// Button event listeners
document.getElementById('easyBtn').addEventListener('click', () => {
    startGame('easy');
});

document.getElementById('mediumBtn').addEventListener('click', () => {
    startGame('medium');
});

document.getElementById('hardBtn').addEventListener('click', () => {
    startGame('hard');
});

document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
});

// Mouse click for swatting mosquitoes
canvas.addEventListener('click', (e) => {
    if (gameOver || difficulty === '') return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if any mosquito was clicked
    let hit = false;
    for (let i = mosquitoes.length - 1; i >= 0; i--) {
        const mosquito = mosquitoes[i];
        const dist = Math.sqrt((mouseX - mosquito.x) ** 2 + (mouseY - mosquito.y) ** 2);
        
        if (dist < mosquito.radius * 1.5) { // Slightly larger hit area
            mosquito.health--;
            hit = true;
            
            // Show hit effect
            hitEffect.active = true;
            hitEffect.x = mosquito.x;
            hitEffect.y = mosquito.y;
            hitEffect.timer = 20;
            
            if (mosquito.health <= 0) {
                mosquitoes.splice(i, 1);
                score += 10 * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3);
                document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
                
                // Show splat effect
                ctx.beginPath();
                ctx.arc(mosquito.x, mosquito.y, mosquito.radius * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(150, 0, 0, 0.5)';
                ctx.fill();
                ctx.closePath();
            }
        }
    }
    
    // Show click effect even if no mosquito was hit
    if (!hit) {
        hitEffect.active = true;
        hitEffect.x = mouseX;
        hitEffect.y = mouseY;
        hitEffect.timer = 10;
    }
});

// Start game function
function startGame(level) {
    difficulty = level;
    score = 0;
    gameOver = false;
    mosquitoes = [];
    avatar.health = 100;
    avatar.x = canvas.width / 2;
    avatar.y = canvas.height / 2;
    
    // Set mosquito spawn interval based on difficulty
    mosquitoInterval = difficulty === 'easy' ? 2000 : 
                     difficulty === 'medium' ? 1200 : 800;
    
    document.getElementById('menu').style.display = 'none';
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('healthDisplay').textContent = `❤️ ${avatar.health}%`;
    document.getElementById('difficultyDisplay').textContent = 
        `Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
    
    // Start game loop
    gameLoop();
}

// Draw hit effect
function drawHitEffect() {
    if (hitEffect.active) {
        ctx.beginPath();
        ctx.arc(hitEffect.x, hitEffect.y, hitEffect.timer, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 0, 0, ${hitEffect.timer / 30})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        
        hitEffect.timer--;
        if (hitEffect.timer <= 0) {
            hitEffect.active = false;
        }
    }
}

// Game loop
function gameLoop() {
    if (gameOver) return;
    
    // Clear canvas with slight fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw avatar
    avatar.move();
    avatar.draw();
    
    // Spawn new mosquitoes
    const currentTime = Date.now();
    if (currentTime - lastMosquitoTime > mosquitoInterval) {
        mosquitoes.push(new Mosquito(difficulty));
        lastMosquitoTime = currentTime;
    }
    
    // Update and draw mosquitoes
    for (let i = mosquitoes.length - 1; i >= 0; i--) {
        mosquitoes[i].update();
        mosquitoes[i].draw();
        
        // Remove mosquitoes that are out of bounds
        if (mosquitoes[i].x < -50 || mosquitoes[i].x > canvas.width + 50 || 
            mosquitoes[i].y < -50 || mosquitoes[i].y > canvas.height + 50 ||
            mosquitoes[i].health <= 0) {
            mosquitoes.splice(i, 1);
        }
    }
    
    // Draw hit effect
    drawHitEffect();
    
    // Update UI
    document.getElementById('healthDisplay').textContent = `❤️ ${Math.max(0, avatar.health)}%`;
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}