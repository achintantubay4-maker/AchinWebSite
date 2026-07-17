// ====================================================
// 🔑 ১. গুগল শিট থেকে ইউজার লোড এবং সেশন কন্ট্রোল
// ====================================================

// আপনার গুগল অ্যাপস স্ক্রিপ্ট থেকে পাওয়া Web App URL এখানে একবার বসিয়ে সেভ করুন
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyfPOLwn7gB26r-KdS8M9UzAcPpw9ajRTh30aedjEIOFuNX89L3LZO7aTOlAbnNiQmGtg/exec"; 
let ALLOWED_USERS = {};

// শিট থেকে ডেটা আনার জন্য এই ফাংশনটি স্বয়ংক্রিয় কাজ করবে
async function fetchUsers() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.json();
        ALLOWED_USERS = data;
    } catch (err) {
        console.error("User loading error");
    }
}

// পেজ লোড হওয়ার সাথে সাথে ডেটা লোড শুরু হবে
fetchUsers();

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

async function handleLogin() {
    // লগইনের সময় লেটেস্ট ডেটা চেক করা
    await fetchUsers();

    const uName = document.getElementById("username").value.trim();
    const pWord = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("login-error");

    // শিটের ইউজার এবং পাসওয়ার্ড ভেরিফিকেশন
    if (ALLOWED_USERS[uName] && String(ALLOWED_USERS[uName]) === String(pWord)) {
        if (errorMsg) errorMsg.style.display = "none";
        sessionStorage.setItem("isLoggedIn", "true");
        showDashboard();
    } else {
        if (errorMsg) errorMsg.style.display = "block";
    }
}

function handleLogout() {
    sessionStorage.clear();
    // এখানে login.html এর বদলে index.html দেওয়া হয়েছে যাতে লগআউট করলে মেইন পেজে ফিরে আসে
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
// 📊 ২. রিপোর্ট পেজের ট্যাব সুইচার ফাংশন
// ====================================================
function switchReportTab(tabName) {
    const mlotSec = document.getElementById("mlot-search-section");
    const bankSec = document.getElementById("bank-search-section");
    const mapSec = document.getElementById("map-search-section");
    
    if (mlotSec) mlotSec.style.display = "none";
    if (bankSec) bankSec.style.display = "none";
    if (mapSec) mapSec.style.display = "none";

    if (tabName === 'mlot' && mlotSec) {
        mlotSec.style.display = "block";
    } else if (tabName === 'bank' && bankSec) {
        bankSec.style.display = "block";
    } else if (tabName === 'map' && mapSec) {
        mapSec.style.display = "block";
        setTimeout(() => { 
            if(window.mymap) window.mymap.invalidateSize(); 
        }, 200);
    }
}

// ====================================================
// 📅 ৩. গ্লোবাল ডেট ফরম্যাট হেল্পার ফাংশন
// ====================================================
function formatDateToDMY(rawDateStr) {
    if (!rawDateStr || rawDateStr === "-") return "-";
    let cleanDate = rawDateStr.includes("T") ? rawDateStr.split("T")[0] : rawDateStr;
    let parts = cleanDate.split("-");
    return (parts.length === 3 && parts[0].length === 4) ? `${parts[2]}-${parts[1]}-${parts[0]}` : cleanDate;
}