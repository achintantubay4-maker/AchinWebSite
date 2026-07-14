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