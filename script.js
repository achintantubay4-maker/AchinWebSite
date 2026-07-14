// ====================================================
// 🔑 ১. লগইন ইউজার লিস্ট (User ID & Password Control)
// ====================================================
const ALLOWED_USERS = {
    "admin": "12345",      // User ID: admin , Password: pass123
    "dilip": "cricket77",    // User ID: dilip , Password: cricket77
    "sourav": "123456",
    "subir": "123456",    // User ID: akasa , Password: survey2026
};

// পেজ লোড হবার সাথে সাথে লগইন স্ট্যাটাস চেক করবে
document.addEventListener("DOMContentLoaded", function() {
    checkLoginStatus();
});

function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
        showDashboard();
    } else {
        showLoginScreen();
    }
}

function handleLogin() {
    const uName = document.getElementById("username").value.trim();
    const pWord = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("login-error");

    // ইউজারনেম এবং পাসওয়ার্ড ম্যাচিং লজিক
    if (ALLOWED_USERS[uName] && ALLOWED_USERS[uName] === pWord) {
        if (errorMsg) errorMsg.style.display = "none";
        sessionStorage.setItem("isLoggedIn", "true");
        showDashboard();
    } else {
        if (errorMsg) errorMsg.style.display = "block";
    }
}

function handleLogout() {
    sessionStorage.removeItem("isLoggedIn");
    
    // ইনপুট ফিল্ড ক্লিয়ার করা
    const uInput = document.getElementById("username");
    const pInput = document.getElementById("password");
    if (uInput) uInput.value = "";
    if (pInput) pInput.value = "";
    
    showLoginScreen();
}

function showLoginScreen() {
    const loginScreen = document.getElementById("login-screen");
    const mainDashboard = document.getElementById("main-dashboard");
    
    if (loginScreen) loginScreen.style.display = "flex";
    if (mainDashboard) mainDashboard.style.display = "none";
    
    stopSnakeGame();
}

function showDashboard() {
    const loginScreen = document.getElementById("login-screen");
    const mainDashboard = document.getElementById("main-dashboard");
    
    if (loginScreen) loginScreen.style.display = "none";
    if (mainDashboard) mainDashboard.style.display = "block";
    
    // ড্যাশবোর্ড চালু হলেই সরাসরি গেম স্ক্রিনটি ওপেন হবে
    showHomeGame();
}


// ====================================================
// 🌐 ২. কনস্ট্যান্ট ও ইউআরএল (URLs) কনফিগারেশন
// ====================================================
const webAppUrl = "https://script.google.com/macros/s/AKfycbz8yymkZYDsI5_x1kqyAPyV3I_h3hXsGHWohSZw4bI1dcASKb0Fri-bF78FFMhsfE8/exec";
const BANK_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9W-pIujf18EgJ1bpsX3DnKPFJhRKtUK49KG3UpvvGY3h_vauwIIof9m5g3gMVOPAVgm6I00dXQ8C6/pub?gid=643565073&single=true&output=csv";
const PAY_ALOTED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9W-pIujf18EgJ1bpsX3DnKPFJhRKtUK49KG3UpvvGY3h_vauwIIof9m5g3gMVOPAVgm6I00dXQ8C6/pub?gid=616652862&single=true&output=csv";


// ====================================================
// 🎛️ ৩. সেকশন কন্ট্রোল করার ফাংশনসমূহ
// ====================================================
function hideAll() {
    const mlotSec = document.getElementById("mlot-search-section");
    const bankSec = document.getElementById("bank-search-section");
    const gameSec = document.getElementById("snake-game-section");
    
    if (mlotSec) mlotSec.style.display = "none";
    if (bankSec) bankSec.style.display = "none";
    if (gameSec) gameSec.style.display = "none";
    
    stopSnakeGame(); // অন্য ট্যাবে গেলে যেন গেম নিজে থেকেই বন্ধ হয়ে যায়
}

function showMlotSection() {
    hideAll();
    const searchSection = document.getElementById("mlot-search-section");
    if (searchSection) {
        searchSection.style.display = "block";
        searchSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function showSearchSection() {
    showMlotSection();
}

function showBankSection() {
    hideAll();
    const bankSection = document.getElementById("bank-search-section");
    if (bankSection) {
        bankSection.style.display = "block";
        bankSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function showHomeGame() {
    hideAll();
    const gameSection = document.getElementById("snake-game-section");
    if (gameSection) {
        gameSection.style.display = "flex";
    }
    resetGameEngine(); // সাপের পজিশন ও স্কোর ফ্রেশ করবে
}


// ====================================================
// 📊 ৪. MLOT SEARCH ফাংশন
// ====================================================
function searchCID() {
    const searchId = document.getElementById("inputId").value.trim();
    const tableHeader = document.getElementById("tableHeader");
    const tableBody = document.getElementById("tableBody");
    const loading = document.getElementById("loading");
    const noResult = document.getElementById("noResult");
    let totalCounter = document.getElementById("totalCounter");

    if (searchId === "") {
        alert("Daya kore prothome ekti ID likhun!");
        return;
    }

    loading.style.display = "block";
    noResult.style.display = "none";
    tableBody.innerHTML = "";
    tableHeader.innerHTML = "";
    if (totalCounter) { totalCounter.innerHTML = ""; }

    const oldScript = document.getElementById("jsonpScript");
    if (oldScript) { oldScript.remove(); }

    function formatDateToDMY(rawDateStr) {
        if (!rawDateStr || rawDateStr === "-") return "-";
        let cleanDate = rawDateStr;
        if (rawDateStr.includes("T")) {
            cleanDate = rawDateStr.split("T")[0];
        }
        let parts = cleanDate.split("-");
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return cleanDate;
    }

    window.handleGoogleSheetData = function(data) {
        loading.style.display = "none";
        if (data.error) {
            tableBody.innerHTML = `<tr><td style='color:red; text-align:center;'>${data.error}</td></tr>`;
            return;
        }
        if (!data.rows || data.rows.length === 0) {
            tableBody.innerHTML = "<tr><td style='text-align:center; color:red;'>Ei ID-r kono data paowa jayni!</td></tr>";
            noResult.style.display = "block";
            return;
        }

        let headerHtml = "<tr style='background-color: #343a40; color: white;'>";
        for (let index = 0; index < data.mainHeader.length; index++) {
            let colName = data.mainHeader[index] || "-";
            let dateVal = data.dateHeader[index] !== undefined && data.dateHeader[index] !== "" ? data.dateHeader[index] : "";
            if (index < 6) {
                headerHtml += `<th style='text-align: center; vertical-align: middle;'>${colName}</th>`;
            } else if (index < data.mainHeader.length - 1) {
                if (dateVal !== "") {
                    headerHtml += `<th style='text-align: center; min-width: 100px;'>${dateVal}<br><span style='font-size: 11px; color: #ffeb3b;'>${colName}</span></th>`;
                } else {
                    let previousDate = data.dateHeader[index - 1] !== undefined ? data.dateHeader[index - 1] : "";
                    headerHtml += `<th style='text-align: center; min-width: 100px;'>${previousDate}<br><span style='font-size: 11px; color: #ffeb3b;'>${colName}</span></th>`;
                }
            } else {
                headerHtml += `<th style='text-align: center; vertical-align: middle;'>${colName}</th>`;
            }
        }
        headerHtml += "</tr>";
        tableHeader.innerHTML = headerHtml;

        let colSums = new Array(data.mainHeader.length).fill(0);
        let grandTotalDespatchGt1000 = 0;
        let lastCreateDate = "-"; 
        let createDtIndex = data.mainHeader.findIndex(col => String(col).toLowerCase().trim() === "createdt");

        for (let i = 0; i < data.rows.length; i++) {
            if (createDtIndex !== -1 && data.rows[i][createDtIndex] !== undefined && data.rows[i][createDtIndex] !== "") {
                lastCreateDate = String(data.rows[i][createDtIndex]);
            }
            for (let j = 0; j < data.rows[i].length; j++) {
                if (j >= 6) { 
                    let colName = String(data.mainHeader[j]).toLowerCase().trim();
                    if (colName !== "createdt" && colName !== "scname") {
                        let num = parseFloat(data.rows[i][j]);
                        if (!isNaN(num)) { colSums[j] += num; }
                    }
                    let numVal = parseFloat(data.rows[i][j]);
                    if (colName.includes("despatch") && !isNaN(numVal) && numVal > 1000) {
                        grandTotalDespatchGt1000++;
                    }
                }
            }
        }

        let formattedDisplayDate = formatDateToDMY(lastCreateDate);
        if (totalCounter) {
            totalCounter.innerHTML = `
                <span style='background-color: #ff9800; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold; margin-left: 10px;'>Total Despatch >1000: ${grandTotalDespatchGt1000} বার</span>
                <span style='background-color: #009688; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold; margin-left: 10px;'>Date: ${formattedDisplayDate}</span>
            `;
        }

        let sumHtml = "<tr style='background-color: #ccffcc; font-weight: bold; color: #000;'>";
        for (let j = 0; j < data.mainHeader.length; j++) {
            let colName = String(data.mainHeader[j]).toLowerCase().trim();
            if (j === 3) {
                sumHtml += "<td>FILTERED SUM:</td>";
            } else if (j < 3 || j === 4 || j === 5 || colName === "createdt" || colName === "scname") {
                sumHtml += "<td>-</td>"; 
            } else {
                let currentSum = colSums[j];
                sumHtml += `<td>${Number.isInteger(currentSum) ? currentSum : currentSum.toFixed(2)}</td>`;
            }
        }
        sumHtml += "</tr>";
        
        let rowsHtml = "";
        for (let i = 0; i < data.rows.length; i++) {
            rowsHtml += "<tr>";
            data.rows[i].forEach((cellValue, cellIndex) => {
                let displayValue = (cellValue !== undefined && cellValue !== "") ? cellValue : "-";
                if (cellIndex === createDtIndex) { displayValue = formatDateToDMY(String(displayValue)); }
                rowsHtml += `<td>${displayValue}</td>`;
            });
            rowsHtml += "</tr>";
        }
        tableBody.innerHTML = sumHtml + rowsHtml;
    };

    const script = document.createElement("script");
    script.id = "jsonpScript";
    script.src = `${webAppUrl}?id=${encodeURIComponent(searchId)}&callback=handleGoogleSheetData`;
    script.onerror = function() {
        loading.style.display = "none";
        tableBody.innerHTML = `<tr><td style='color:red; text-align:center;'>Google Sheet-er sathe connect kora jachhe na।</td></tr>`;
    };
    document.body.appendChild(script);
}


// ====================================================
// 🏦 ৫. BANK SEARCH ফাংশন
// ====================================================
function parseCSVLine(line) {
    return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(item => item.replace(/^"|"$/g, '').trim());
}

function searchBankData() {
    const inputId = document.getElementById("inputBankCID").value.trim();
    const tableBody = document.getElementById("bankTableBody");
    const loading = document.getElementById("bankLoading");
    const noResult = document.getElementById("bankNoResult");

    const infoBox = document.getElementById("bankInfoBox");
    const metaBox = document.getElementById("bankMetaDetails");
    
    const infoAgencyName = document.getElementById("infoAgencyName"); 
    const infoReceivable = document.getElementById("infoReceivable");
    const infoReceived = document.getElementById("infoReceived");
    const infoPending = document.getElementById("infoPending");
    const infoServer = document.getElementById("infoServer");
    const infoAlotedName = document.getElementById("infoAlotedName");

    if (!inputId) {
        alert("দয়া করে একটি CID নম্বর লিখুন!");
        return;
    }

    tableBody.innerHTML = "";
    if (loading) loading.style.display = "block";
    if (noResult) noResult.style.display = "none";
    if (infoBox) infoBox.style.display = "none";
    if (metaBox) metaBox.style.display = "none";

    Promise.all([
        fetch(BANK_SHEET_URL).then(res => res.text()),
        fetch(PAY_ALOTED_URL).then(res => res.text())
    ])
    .then(([bankCsv, payAlotedCsv]) => {
        if (loading) loading.style.display = "none";

        const payLines = payAlotedCsv.split(/\r?\n/);
        let agencyName = "-";       
        let totalReceivableValue = 0;
        let serverName = "-";
        let alotedTo = "-";
        let hasPayData = false;

        for (let i = 1; i < payLines.length; i++) {
            const line = payLines[i];
            if (!line || !line.includes(inputId)) continue; 
            
            const columns = parseCSVLine(line);
            if (columns[1] === inputId) { 
                hasPayData = true;
                agencyName = columns[2] || "-";      
                let recVal = parseFloat(columns[6]);
                totalReceivableValue = isNaN(recVal) ? 0 : recVal; 
                serverName = columns[9] || "-";      
                alotedTo = columns[10] || "-";       
                break;
            }
        }

        const bankLines = bankCsv.split(/\r?\n/);
        let serialNumber = 1;
        let hasBankData = false;
        let htmlContent = "";
        let mobileReceivedSum = 0;

        for (let i = 1; i < bankLines.length; i++) {
            const line = bankLines[i];
            if (!line || !line.includes(inputId)) continue; 
            
            const columns = parseCSVLine(line);
            if (columns[1] === inputId) {
                hasBankData = true;
                let utr = columns[2] || "-";       
                let amountStr = columns[3] || "0";    
                let ordDate = columns[7] || "-";   
                let eligible = columns[12] || "-"; 

                let amountVal = parseFloat(amountStr);
                if (isNaN(amountVal)) amountVal = 0;

                let isMobile = String(eligible).toUpperCase().trim() === "MOBILE";
                
                if (isMobile) {
                    mobileReceivedSum += amountVal;
                }

                let rowStyle = isMobile ? 'style="background-color: #fff3cd;"' : '';

                htmlContent += `
                    <tr class="bank-data-tr" ${rowStyle}>
                        <td>${serialNumber++}</td>
                        <td>${utr}</td>
                        <td class="bank-amount-color">${amountStr}</td>
                        <td>${ordDate}</td>
                        <td>${eligible}</td>
                    </tr>
                `;
            }
        }

        let pendingBalance = totalReceivableValue - mobileReceivedSum;

        if (hasPayData || hasBankData) {
            if (infoBox) {
                if (infoAgencyName) infoAgencyName.innerText = agencyName; 
                if (infoReceivable) infoReceivable.innerText = totalReceivableValue;
                if (infoReceived) infoReceived.innerText = mobileReceivedSum;
                if (infoPending) infoPending.innerText = pendingBalance;
                
                if (infoServer) infoServer.innerText = serverName;
                if (infoAlotedName) infoAlotedName.innerText = alotedTo;

                infoBox.style.display = "grid"; 
                if (metaBox) metaBox.style.display = "flex"; 
            }

            for (let k = 0; k < 10; k++) {
                htmlContent += `<tr class="bank-empty-tr"><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`;
            }
            tableBody.innerHTML = htmlContent;
        } else {
            if (noResult) noResult.style.display = "block";
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red; font-weight: bold; padding: 20px;">No records found for this CID!</td></tr>`;
        }
    })
    .catch(error => {
        if (loading) loading.style.display = "none";
        alert("ডেটা লোড করতে ব্যর্থ হয়েছে!");
    });
}


// ====================================================
// 🐍 ৬. SNAKE GAME ENGINE
// ====================================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = { x: 0, y: 0 };
let dx = gridSize;
let dy = 0;
let score = 0;
let topScore = localStorage.getItem("snakeHighScore") || 0;
let gameInterval = null;
let isGameRunning = false;

document.getElementById("highScore").innerText = topScore;
document.addEventListener("keydown", changeDirection);

function resetGameEngine() {
    stopSnakeGame();
    snake = [
        { x: gridSize * 5, y: gridSize * 10 },
        { x: gridSize * 4, y: gridSize * 10 },
        { x: gridSize * 3, y: gridSize * 10 }
    ];
    dx = gridSize;
    dy = 0;
    score = 0;
    
    const currScoreEl = document.getElementById("currentScore");
    const startBtn = document.getElementById("startResetBtn");
    
    if (currScoreEl) currScoreEl.innerText = score;
    if (startBtn) startBtn.innerText = "Start Game";
    
    createFood();
    drawGameInit();
}

function toggleGame() {
    const startBtn = document.getElementById("startResetBtn");
    if (isGameRunning) {
        stopSnakeGame();
        if (startBtn) startBtn.innerText = "Resume Game";
    } else {
        isGameRunning = true;
        if (startBtn) startBtn.innerText = "Pause Game";
        gameInterval = setInterval(updateGameFrame, 100);
    }
}

function stopSnakeGame() {
    isGameRunning = false;
    clearInterval(gameInterval);
}

function createFood() {
    food.x = Math.floor(Math.random() * tileCount) * gridSize;
    food.y = Math.floor(Math.random() * tileCount) * gridSize;
    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) { createFood(); }
    });
}

function drawGameInit() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? "#4CAF50" : "#81C784";
        ctx.fillRect(part.x, part.y, gridSize - 2, gridSize - 2);
    });
    
    ctx.fillStyle = "#ff5722";
    ctx.fillRect(food.x, food.y, gridSize - 2, gridSize - 2);
}

function updateGameFrame() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height || checkCollision(head)) {
        gameOver();
        return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        const currScoreEl = document.getElementById("currentScore");
        if (currScoreEl) currScoreEl.innerText = score;
        
        if (score > topScore) {
            topScore = score;
            localStorage.setItem("snakeHighScore", topScore);
            const highEl = document.getElementById("highScore");
            if (highEl) highEl.innerText = topScore;
        }
        createFood();
    } else {
        snake.pop();
    }
    drawGameInit();
}

function checkCollision(head) {
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) { return true; }
    }
    return false;
}

function changeDirection(event) {
    if (!isGameRunning) return;
    const LEFT_KEY = 37; const UP_KEY = 38; const RIGHT_KEY = 39; const DOWN_KEY = 40;
    const keyPressed = event.keyCode;
    if (keyPressed === LEFT_KEY && dx !== gridSize) { dx = -gridSize; dy = 0; event.preventDefault(); }
    if (keyPressed === UP_KEY && dy !== gridSize) { dx = 0; dy = -gridSize; event.preventDefault(); }
    if (keyPressed === RIGHT_KEY && dx !== -gridSize) { dx = gridSize; dy = 0; event.preventDefault(); }
    if (keyPressed === DOWN_KEY && dy !== -gridSize) { dx = 0; dy = gridSize; event.preventDefault(); }
}

function gameOver() {
    stopSnakeGame();
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff3333";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
    
    const startBtn = document.getElementById("startResetBtn");
    if (startBtn) startBtn.innerText = "Restart Game";
}