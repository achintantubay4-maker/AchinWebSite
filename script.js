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

// রিপোর্ট পেজের ট্যাব সুইচার ফাংশন
function switchReportTab(tabName) {
    const mlotSec = document.getElementById("mlot-search-section");
    const bankSec = document.getElementById("bank-search-section");
    if (tabName === 'mlot' && mlotSec) {
        mlotSec.style.display = "block"; if(bankSec) bankSec.style.display = "none";
    } else if (tabName === 'bank' && bankSec) {
        bankSec.style.display = "block"; if(mlotSec) mlotSec.style.display = "none";
    }
}

// গ্লোবাল ডেট ফরম্যাট হেল্পার ফাংশন
function formatDateToDMY(rawDateStr) {
    if (!rawDateStr || rawDateStr === "-") return "-";
    let cleanDate = rawDateStr.includes("T") ? rawDateStr.split("T")[0] : rawDateStr;
    let parts = cleanDate.split("-");
    return (parts.length === 3 && parts[0].length === 4) ? `${parts[2]}-${parts[1]}-${parts[0]}` : cleanDate;
}