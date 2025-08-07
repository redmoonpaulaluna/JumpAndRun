const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}
resize();
window.addEventListener('resize', resize);

let distance = 1;
let coins = 0;
let speed = 4;
let gameOver = false;

const gravity = 0.6;
const groundY = height - 150;

let player;
let obstacles = [];
let coinsOnField = [];

const hudDistance = document.getElementById('distance');
const hudCoins = document.getElementById('coins');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScore = document.getElementById('finalScore');

class Player {
  constructor() {
    this.width = 60;
    this.height = 80;
    this.x = 100;
    this.y = groundY - this.height;
    this.dy = 0;
    this.jumping = false;
    this.sliding = false;
    this.slideHeight = 50;
    this.jumpPressed = false;   // Taste gedrückt für springen
    this.slidePressed = false;  // Taste gedrückt für slide
  }

  draw() {
    ctx.fillStyle = 'yellow';
    if (this.sliding) {
      // Ganzkörper schrumpft auf slideHeight (bleibt unten)
      ctx.fillRect(this.x, this.y + this.height - this.slideHeight, this.width, this.slideHeight);

      // Ohren (dunkler) wie Pikachu-Style
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(this.x + 10, this.y + this.height - this.slideHeight);
      ctx.lineTo(this.x + 20, this.y + this.height - this.slideHeight - 15);
      ctx.lineTo(this.x + 30, this.y + this.height - this.slideHeight);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(this.x + this.width - 10, this.y + this.height - this.slideHeight);
      ctx.lineTo(this.x + this.width - 20, this.y + this.height - this.slideHeight - 15);
      ctx.lineTo(this.x + this.width - 30, this.y + this.height - this.slideHeight);
      ctx.fill();
    } else {
      // Normale Höhe
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Ohren
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(this.x + 10, this.y);
      ctx.lineTo(this.x + 20, this.y - 20);
      ctx.lineTo(this.x + 30, this.y);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(this.x + this.width - 10, this.y);
      ctx.lineTo(this.x + this.width - 20, this.y - 20);
      ctx.lineTo(this.x + this.width - 30, this.y);
      ctx.fill();
    }
  }

  update() {
    if (this.jumping && this.jumpPressed) {
      // Solange springen gedrückt, langsamer fallen
      this.dy += gravity * 0.15; // leichteres Fallen
    } else {
      this.dy += gravity;
    }
    this.y += this.dy;

    if (this.sliding) {
      this.y = groundY - this.slideHeight;
      this.dy = 0;
      this.jumping = false;
    } else {
      if (this.y > groundY - this.height) {
        this.y = groundY - this.height;
        this.dy = 0;
        this.jumping = false;
      }
    }
  }

  jumpStart() {
    if (!this.jumping && !this.sliding) {
      this.dy = -15;
      this.jumping = true;
    }
    this.jumpPressed = true;
  }

  jumpEnd() {
    this.jumpPressed = false;
  }

  slideStart() {
    if (!this.jumping && !this.sliding) {
      this.sliding = true;
    }
    this.slidePressed = true;
  }

  slideEnd() {
    this.slidePressed = false;
    if (this.sliding) {
      this.sliding = false;
    }
  }

  getHitbox() {
    if (this.sliding) {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.slideHeight
      };
    }
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

class Obstacle {
  constructor() {
    this.width = 40 + Math.random() * 30;
    this.height = 40 + Math.random() * 50;
    this.x = width + 50;
    // Obstacle oben oder unten zufällig
    this.isUpper = Math.random() < 0.5;

    if (this.isUpper) {
      // Rote Kugeln etwas tiefer als vorher
      this.y = groundY - (this.height / 2) - 10; 
    } else {
      // Wolken höher in der Luft (kleine Wolken)
      this.y = groundY - this.height - 100 - Math.random() * 50;
      if (this.y > groundY - 60) this.y = groundY - 120;
    }
  }

  draw() {
    if (!this.isUpper) {
      // Wolken unten (weiß, retro)
      ctx.fillStyle = 'white';
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      ctx.beginPath();
      ctx.arc(cx - 15, cy, 15, 0, Math.PI * 2);
      ctx.arc(cx, cy - 10, 20, 0, Math.PI * 2);
      ctx.arc(cx + 15, cy, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Rote Kugeln halb rot halb weiß (oben liegen sie tiefer)
      const radius = this.height / 2;
      const centerX = this.x + this.width / 2;
      const centerY = this.y + radius; // y ist schon angepasst auf Bodenhöhe

      const grad = ctx.createLinearGradient(centerX, centerY - radius, centerX, centerY + radius);
      grad.addColorStop(0, 'red');
      grad.addColorStop(0.5, 'red');
      grad.addColorStop(0.5, 'white');
      grad.addColorStop(1, 'white');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius, radius, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'darkred';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  update() {
    this.x -= speed;
  }
}

class Coin {
  constructor() {
    this.radius = 15;
    this.x = width + 50;
    this.y = groundY - 100 - Math.random() * 150;
  }

  draw() {
    const cx = this.x;
    const cy = this.y;
    const r = this.radius;

    const grad = ctx.createRadialGradient(cx, cy, r / 4, cx, cy, r);
    grad.addColorStop(0, '#fff38e');
    grad.addColorStop(1, '#ffcc00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#cc9900';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    for (let i = -r / 2; i <= r / 2; i += 4) {
      ctx.beginPath();
      ctx.moveTo(cx + i, cy - r);
      ctx.lineTo(cx + i, cy + r);
      ctx.stroke();
    }
  }

  update() {
    this.x -= speed;
  }

  getHitbox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }
}

function isColliding(rect1, rect2) {
  return !(rect1.x > rect2.x + rect2.width ||
           rect1.x + rect1.width < rect2.x ||
           rect1.y > rect2.y + rect2.height ||
           rect1.y + rect1.height < rect2.y);
}

function updateHUD() {
  hudDistance.textContent = 'Distance: ' + distance.toFixed(0);
  hudCoins.textContent = 'Coins: ' + coins;
}

function spawnObstacle() {
  if (!gameOver && Math.random() < 0.02) {
    obstacles.push(new Obstacle());
  }
}

function spawnCoin() {
  if (!gameOver && Math.random() < 0.03) {
    coinsOnField.push(new Coin());
  }
}

function handleCollisions() {
  const playerHitbox = player.getHitbox();

  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (isColliding(playerHitbox, obstacles[i])) {
      gameOver = true;
      showGameOver();
      break;
    }
  }

  for (let i = coinsOnField.length - 1; i >= 0; i--) {
    if (isColliding(playerHitbox, coinsOnField[i].getHitbox())) {
      coins++;
      coinsOnField.splice(i, 1);
    }
  }
}

function showGameOver() {
  finalScore.textContent = `Distance: ${distance.toFixed(0)} | Coins: ${coins}`;
  gameOverScreen.style.display = 'block';
}

function animate() {
  if (gameOver) return;

  ctx.clearRect(0, 0, width, height);

  player.update();
  player.draw();

  obstacles.forEach((ob) => {
    ob.update();
    ob.draw();
  });

  coinsOnField.forEach((coin) => {
    coin.update();
    coin.draw();
  });

  obstacles = obstacles.filter(ob => ob.x + ob.width > 0);
  coinsOnField = coinsOnField.filter(c => c.x + c.radius > 0);

  spawnObstacle();
  spawnCoin();

  handleCollisions();

  distance += speed * 0.1;
  speed += 0.0005;

  updateHUD();

  requestAnimationFrame(animate);
}

function startGame() {
  distance = 1;
  coins = 0;
  speed = 4;
  gameOver = false;
  obstacles = [];
  coinsOnField = [];
  player = new Player();
  gameOverScreen.style.display = 'none';
  animate();
}

// Steuerung Tastatur
window.addEventListener('keydown', (e) => {
  if (gameOver) return;

  if (e.code === 'Space' || e.code === 'ArrowUp') {
    player.jumpStart();
  }
  if (e.code === 'ArrowDown') {
    player.slideStart();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    player.jumpEnd();
  }
  if (e.code === 'ArrowDown') {
    player.slideEnd();
  }
});

// Steuerung Touch (Touch halten für Slide oder Springen)
let touchStartY = null;
let slidingTouchActive = false;
let jumpingTouchActive = false;

canvas.addEventListener('touchstart', (e) => {
  if (gameOver) return;
  touchStartY = e.changedTouches[0].clientY;
  if (touchStartY > height / 2) {
    // Unten berührt -> Slide starten
    slidingTouchActive = true;
    player.slideStart();
  } else {
    // Oben berührt -> Springen starten
    jumpingTouchActive = true;
    player.jumpStart();
  }
});

canvas.addEventListener('touchend', (e) => {
  if (slidingTouchActive) {
    slidingTouchActive = false;
    player.slideEnd();
  }
  if (jumpingTouchActive) {
    jumpingTouchActive = false;
    player.jumpEnd();
  }
});

canvas.addEventListener('touchcancel', (e) => {
  if (slidingTouchActive) {
    slidingTouchActive = false;
    player.slideEnd();
  }
  if (jumpingTouchActive) {
    jumpingTouchActive = false;
    player.jumpEnd();
  }
});

startGame();
