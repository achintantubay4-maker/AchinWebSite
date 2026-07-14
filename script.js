// ====================================================
// 🔑 ১. লগইন ইউজার লিস্ট এবং সেশন কন্ট্রোল
// ====================================================
const ALLOWED_USERS = {
    "admin": "12345",      
    "dilip": "cricket77",    
    "sourav": "123456",
    "subir": "123456",
    "Achin": "achin12345"
};

(function checkSecurity() {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage === "report.html" && isLoggedIn !== "true") {
        window.location.href = "index.html";
        return;
    }
    
    if (currentPage === "index.html" || currentPage === "") {
        document.addEventListener("DOMContentLoaded", function() {
            if (isLoggedIn === "true") { showDashboard(); } 
            else { showLoginScreen(); }
        });
    }
})();

function handleLogin() {
    const uName = document.getElementById("username").value.trim();
    const pWord = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("login-error");

    if (ALLOWED_USERS[uName] && ALLOWED_USERS[uName] === pWord) {
        if (errorMsg) errorMsg.style.display = "none";
        sessionStorage.setItem("isLoggedIn", "true");
        showDashboard();
    } else {
        if (errorMsg) errorMsg.style.display = "block";
    }
}

function handleLogout() {
    sessionStorage.clear();
    window.location.href = "index.html";
}

function showLoginScreen() {
    if(document.getElementById("login-screen")) document.getElementById("login-screen").style.display = "flex";
    if(document.getElementById("main-dashboard")) document.getElementById("main-dashboard").style.display = "none";
}

function showDashboard() {
    if(document.getElementById("login-screen")) document.getElementById("login-screen").style.display = "none";
    if(document.getElementById("main-dashboard")) document.getElementById("main-dashboard").style.display = "block";
}
// ====================================================
// 🐍 RETRO SNAKE GAME LOGIC (WALL PASS, 10 PTS & NO SCREEN SHAKE)
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

// হাইস্কোর স্ক্রিনে দেখানো
if (document.getElementById("highScore")) {
    document.getElementById("highScore").innerText = highScore;
}

// কিবোর্ড কন্ট্রোল লিসেনার এবং স্ক্রিন কাঁপা (Scrolling) বন্ধ করার লজিক
document.addEventListener("keydown", direction);

function direction(event) {
    if (!isGameRunning) return;

    // Arrow Keys (37, 38, 39, 40) এবং Spacebar (32) টিপলে স্ক্রিন স্ক্রল হওয়া বন্ধ করবে
    if ([32, 37, 38, 39, 40].includes(event.keyCode)) {
        event.preventDefault();
    }

    if (event.keyCode == 37 && d != "RIGHT") d = "LEFT";
    else if (event.keyCode == 38 && d != "DOWN") d = "UP";
    else if (event.keyCode == 39 && d != "LEFT") d = "RIGHT";
    else if (event.keyCode == 40 && d != "UP") d = "DOWN";
}

function resetGame() {
    snake = [{ x: 9 * box, y: 10 * box }];
    score = 0;
    d = "RIGHT"; // ডিফোল্ট ডিরেকশন
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
        gameInterval = setInterval(draw, 120); // গতি সামান্য বাড়ানো হয়েছে স্মুথনেসের জন্য
    }
}

function draw() {
    if (!ctx) return;

    // ক্যানভাস ব্যাকগ্রাউন্ড পরিষ্কার করা
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // সাপ ড্র করা
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i == 0 ? "#4CAF50" : "#81C784"; 
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeStyle = "#111";
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }

    // খাবার ড্র করা
    ctx.fillStyle = "#FF5722"; 
    ctx.fillRect(food.x, food.y, box, box);

    // সাপের পুরানো মাথার পজিশন
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    // ডিরেকশন অনুযায়ী মাথা চালানো
    if (d == "LEFT") snakeX -= box;
    if (d == "UP") snakeY -= box;
    if (d == "RIGHT") snakeX += box;
    if (d == "DOWN") snakeY += box;

    // 🔄 দেয়াল পারাপারের লজিক (Wall Wrap-around)
    if (snakeX < 0) snakeX = canvas.width - box;
    else if (snakeX >= canvas.width) snakeX = 0;
    
    if (snakeY < 0) snakeY = canvas.height - box;
    else if (snakeY >= canvas.height) snakeY = 0;

    // নতুন মাথা নির্ধারণ
    let newHead = { x: snakeX, y: snakeY };

    // সাপ যদি খাবার খায়
    if (snakeX == food.x && snakeY == food.y) {
        score += 10; // 🎯 প্রতিটি পয়েন্টে ১০ করে প্লাস হবে
        if (document.getElementById("currentScore")) {
            document.getElementById("currentScore").innerText = score;
        }
        
        // হাইস্কোর আপডেট
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("snakeHighScore", highScore);
            if (document.getElementById("highScore")) {
                document.getElementById("highScore").innerText = highScore;
            }
        }
        generateFood();
    } else {
        snake.pop(); // খাবার না খেলে লেজ কেটে যাবে স্বাভাবিক নিয়মেই
    }

    // 💥 শুধুমাত্র নিজের শরীরে কামড় দিলে গেম ওভার হবে
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