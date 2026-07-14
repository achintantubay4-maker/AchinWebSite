// ====================================================
// 🐍 RETRO SNAKE GAME LOGIC (WALL PASS, 10 PTS & HYBRID CONTROLS)
// ====================================================
const canvas = document.getElementById("gameCanvas");
let ctx = null;
if (canvas) {
    ctx = canvas.getContext("2d");
}

const box = 20;
let snake = [];
let food = {};
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let d = null;
let gameInterval = null;
let isGameRunning = false;

// হাইস্কোর রেন্ডার করা
if (document.getElementById("highScore")) {
    document.getElementById("highScore").innerText = highScore;
}

// ১. কম্পিউটার কিবোর্ডের জন্য লিসেনার এবং স্ক্রিন কাঁপানো স্ক্রলিং ব্লক করা
document.addEventListener("keydown", direction);

function direction(event) {
    if (!isGameRunning) return;

    // Arrow Keys (37-40) এবং Spacebar (32) এ ব্রাউজারের স্ক্রলিং বন্ধ করা
    if ([32, 37, 38, 39, 40].includes(event.keyCode)) {
        event.preventDefault();
    }

    if (event.keyCode == 37 && d != "RIGHT") d = "LEFT";
    else if (event.keyCode == 38 && d != "DOWN") d = "UP";
    else if (event.keyCode == 39 && d != "LEFT") d = "RIGHT";
    else if (event.keyCode == 40 && d != "UP") d = "DOWN";
}

// 📱 ২. মোবাইলের অন-স্ক্রিন টাচ কন্ট্রোল ফাংশন
function setMobileDirection(newDir) {
    if (!isGameRunning) return;
    
    if (newDir === "LEFT" && d !== "RIGHT") d = "LEFT";
    else if (newDir === "UP" && d !== "DOWN") d = "UP";
    else if (newDir === "RIGHT" && d !== "LEFT") d = "RIGHT";
    else if (newDir === "DOWN" && d !== "UP") d = "DOWN";
}

function resetGame() {
    snake = [{ x: 9 * box, y: 10 * box }];
    score = 0;
    d = "RIGHT"; // স্টার্ট করার পর ডানে যাবে
    if (document.getElementById("currentScore")) {
        document.getElementById("currentScore").innerText = score;
    }
    generateFood();
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * 19 + 1) * box,
        y: Math.floor(Math.random() * 19 + 1) * box
    };
}

function toggleGame() {
    const btn = document.getElementById("startResetBtn");
    if (isGameRunning) {
        clearInterval(gameInterval);
        isGameRunning = false;
        if (btn) btn.innerText = "Start Game";
    } else {
        resetGame();
        isGameRunning = true;
        if (btn) btn.innerText = "Reset Game";
        gameInterval = setInterval(draw, 120);
    }
}

function draw() {
    if (!ctx) return;

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // সাপ আঁকা
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i == 0 ? "#4CAF50" : "#81C784"; 
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeStyle = "#111";
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }

    // খাবার আঁকা
    ctx.fillStyle = "#FF5722"; 
    ctx.fillRect(food.x, food.y, box, box);

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d == "LEFT") snakeX -= box;
    if (d == "UP") snakeY -= box;
    if (d == "RIGHT") snakeX += box;
    if (d == "DOWN") snakeY += box;

    // 🔄 দেয়াল পারাপারের লজিক (Wall wrap-around)
    if (snakeX < 0) snakeX = canvas.width - box;
    else if (snakeX >= canvas.width) snakeX = 0;
    
    if (snakeY < 0) snakeY = canvas.height - box;
    else if (snakeY >= canvas.height) snakeY = 0;

    let newHead = { x: snakeX, y: snakeY };

    // খাবার খেলে স্কোর আপডেট
    if (snakeX == food.x && snakeY == food.y) {
        score += 10; 
        if (document.getElementById("currentScore")) {
            document.getElementById("currentScore").innerText = score;
        }
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("snakeHighScore", highScore);
            if (document.getElementById("highScore")) {
                document.getElementById("highScore").innerText = highScore;
            }
        }
        generateFood();
    } else {
        snake.pop();
    }

    // নিজের শরীরে কামড় লাগলে গেম ওভার
    if (collision(newHead, snake)) {
        clearInterval(gameInterval);
        isGameRunning = false;
        alert("Game Over! Your Final Score: " + score);
        const btn = document.getElementById("startResetBtn");
        if (btn) btn.innerText = "Start Game";
        return;
    }

    snake.unshift(newHead);
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x == array[i].x && head.y == array[i].y) return true;
    }
    return false;
}