// ====================================================
// 🌐 ১. কনফিগারেশন ইউআরএল
// ====================================================
const webAppUrl = "https://script.google.com/macros/s/AKfycbz8yymkZYDsI5_x1kqyAPyV3I_h3hXsGHWohSZw4bI1dcASKb0Fri-bF78FFMhsfE8/exec";
const BANK_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9W-pIujf18EgJ1bpsX3DnKPFJhRKtUK49KG3UpvvGY3h_vauwIIof9m5g3gMVOPAVgm6I00dXQ8C6/pub?gid=643565073&single=true&output=csv";
const PAY_ALOTED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9W-pIujf18EgJ1bpsX3DnKPFJhRKtUK49KG3UpvvGY3h_vauwIIof9m5g3gMVOPAVgm6I00dXQ8C6/pub?gid=616652862&single=true&output=csv";

// গ্লোবাল মেমোরি ক্যাশ (স্পিড বুস্ট করার জন্য)
let cachedBankData = null;
let cachedPayData = null;

document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') || 'mlot';
    switchReportTab(section);
    
    // ব্যাকগ্রাউন্ডে আগে থেকেই ব্যাংক ডেটা লোড করে রাখা (যাতে সার্চে সময় না লাগে)
    preloadBankData();
});

function switchReportTab(tabName) {
    const mlotSec = document.getElementById("mlot-search-section");
    const bankSec = document.getElementById("bank-search-section");
    if (tabName === 'mlot' && mlotSec) {
        mlotSec.style.display = "block"; if(bankSec) bankSec.style.display = "none";
    } else if (tabName === 'bank' && bankSec) {
        bankSec.style.display = "block"; if(mlotSec) mlotSec.style.display = "none";
    }
}

function preloadBankData() {
    fetch(BANK_SHEET_URL).then(res => res.text()).then(csv => { cachedBankData = csv.split(/\r?\n/); }).catch(e => console.log("Preload Error"));
    fetch(PAY_ALOTED_URL).then(res => res.text()).then(csv => { cachedPayData = csv.split(/\r?\n/); }).catch(e => console.log("Preload Error"));
}

// ডেট ফরম্যাট করার হেল্পার ফাংশন (YYYY-MM-DD থেকে DD-MM-YYYY)
function formatDateToDMY(rawDateStr) {
    if (!rawDateStr || rawDateStr === "-") return "-";
    let cleanDate = rawDateStr.includes("T") ? rawDateStr.split("T")[0] : rawDateStr;
    let parts = cleanDate.split("-");
    return (parts.length === 3 && parts[0].length === 4) ? `${parts[2]}-${parts[1]}-${parts[0]}` : cleanDate;
}

// ====================================================
// 📊 ২. MLOT SEARCH (FIXED DATE & FAST)
// ====================================================
function searchCID() {
    const searchId = document.getElementById("inputId").value.trim();
    const tableHeader = document.getElementById("tableHeader");
    const tableBody = document.getElementById("tableBody");
    const loading = document.getElementById("loading");
    const noResult = document.getElementById("noResult");
    let totalCounter = document.getElementById("totalCounter");

    if (searchId === "") { alert("Daya kore prothome ekti ID likhun!"); return; }

    loading.style.display = "block"; noResult.style.display = "none";
    tableBody.innerHTML = ""; tableHeader.innerHTML = "";
    if (totalCounter) totalCounter.innerHTML = "";

    // পুরানো স্ক্রিপ্ট ট্যাগ ডিলিট করে মেমোরি ফ্রী করা
    const oldScript = document.getElementById("jsonpScript");
    if (oldScript) oldScript.remove();

    window.handleGoogleSheetData = function(data) {
        loading.style.display = "none";
        if (data.error) { tableBody.innerHTML = `<tr><td style='color:red;'>${data.error}</td></tr>`; return; }
        if (!data.rows || data.rows.length === 0) { noResult.style.display = "block"; return; }

        let headerHtml = "<tr style='background-color: #343a40; color: white;'>";
        data.mainHeader.forEach((colName, index) => {
            let dateVal = data.dateHeader[index] || "";
            if (index < 6 || index === data.mainHeader.length - 1) {
                headerHtml += `<th>${colName}</th>`;
            } else {
                let dShow = dateVal !== "" ? dateVal : (data.dateHeader[index - 1] || "");
                headerHtml += `<th>${dShow}<br><span style='font-size: 11px; color: #ffeb3b;'>${colName}</span></th>`;
            }
        });
        tableHeader.innerHTML = headerHtml + "</tr>";

        let colSums = new Array(data.mainHeader.length).fill(0);
        let grandTotalDespatchGt1000 = 0;
        let lastCreateDate = "-";
        
        // "CreateDt" কলামের ইনডেক্স খুঁজে বের করা
        let createDtIndex = data.mainHeader.findIndex(col => String(col).toLowerCase().trim() === "createdt");

        data.rows.forEach(row => {
            // ডেট সংরক্ষন করা
            if (createDtIndex !== -1 && row[createDtIndex]) {
                lastCreateDate = String(row[createDtIndex]);
            }
            row.forEach((cell, j) => {
                if (j >= 6) {
                    let colName = String(data.mainHeader[j]).toLowerCase().trim();
                    if (colName !== "createdt" && colName !== "scname") {
                        let num = parseFloat(cell); if (!isNaN(num)) colSums[j] += num;
                    }
                    if (colName.includes("despatch") && parseFloat(cell) > 1000) grandTotalDespatchGt1000++;
                }
            });
        });

        // 🛠️ এখানে সবুজ ডেট ব্যাজ ফিরিয়ে আনা হয়েছে
        if (totalCounter) {
            totalCounter.innerHTML = `
                <span class="badge-orange">Total Despatch >1000: ${grandTotalDespatchGt1000} বার</span>
                <span class="badge-green">Date: ${formatDateToDMY(lastCreateDate)}</span>
            `;
        }

        let sumHtml = "<tr style='background-color: #ccffcc; font-weight: bold;'>";
        data.mainHeader.forEach((col, j) => {
            let colName = String(col).toLowerCase().trim();
            if (j === 3) sumHtml += "<td>FILTERED SUM:</td>";
            else if (j < 3 || j === 4 || j === 5 || colName === "createdt" || colName === "scname") sumHtml += "<td>-</td>";
            else sumHtml += `<td>${Number.isInteger(colSums[j]) ? colSums[j] : colSums[j].toFixed(2)}</td>`;
        });

        let rowsHtml = "";
        data.rows.forEach(row => {
            rowsHtml += "<tr>";
            row.forEach((cell, cellIndex) => { 
                let displayValue = (cell !== undefined && cell !== "") ? cell : "-";
                // টেবিলের ভেতরের CreateDt কলামকেও সুন্দর ফরম্যাটে দেখানো
                if (cellIndex === createDtIndex) {
                    displayValue = formatDateToDMY(String(displayValue));
                }
                rowsHtml += `<td>${displayValue}</td>`; 
            });
            rowsHtml += "</tr>";
        });
        
        // একবারে DOM ইনজেক্ট করা (ফাস্ট রেন্ডারিং)
        tableBody.innerHTML = sumHtml + "</tr>" + rowsHtml;
        
        // ক্লিনআপ
        if (document.getElementById("jsonpScript")) {
            document.getElementById("jsonpScript").remove();
        }
    };

    const script = document.createElement("script");
    script.id = "jsonpScript";
    script.src = `${webAppUrl}?id=${encodeURIComponent(searchId)}&callback=handleGoogleSheetData`;
    document.body.appendChild(script);
}

// ====================================================
// 🏦 ৩. BANK SEARCH (LIGHTWEIGHT & INSTANT CACHE)
// ====================================================
function parseCSVLine(line) {
    if (!line) return [];
    return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(item => item.replace(/^"|"$/g, '').trim());
}

function searchBankData() {
    const inputId = document.getElementById("inputBankCID").value.trim();
    const tableBody = document.getElementById("bankTableBody");
    const loading = document.getElementById("bankLoading");
    const noResult = document.getElementById("bankNoResult");

    if (!inputId) { alert("দয়া করে একটি CID নম্বর লিখুন!"); return; }

    tableBody.innerHTML = "";
    loading.style.display = "block"; noResult.style.display = "none";
    document.getElementById("bankInfoBox").style.display = "none";
    document.getElementById("bankMetaDetails").style.display = "none";

    // যদি ডেটা আগে থেকে ক্যাশ না হয়ে থাকে, তবে নরমাল ফেচ করবে
    if (cachedBankData && cachedPayData) {
        processBankSearch(cachedBankData, cachedPayData, inputId, loading, noResult, tableBody);
    } else {
        Promise.all([ fetch(BANK_SHEET_URL).then(res => res.text()), fetch(PAY_ALOTED_URL).then(res => res.text()) ])
        .then(([bankCsv, payAlotedCsv]) => {
            cachedBankData = bankCsv.split(/\r?\n/);
            cachedPayData = payAlotedCsv.split(/\r?\n/);
            processBankSearch(cachedBankData, cachedPayData, inputId, loading, noResult, tableBody);
        })
        .catch(() => { loading.style.display = "none"; alert("ডেটা লোড করতে ব্যর্থ হয়েছে!"); });
    }
}

function processBankSearch(bankLines, payLines, inputId, loading, noResult, tableBody) {
    loading.style.display = "none";
    let agencyName = "-", totalReceivableValue = 0, serverName = "-", alotedTo = "-", hasPayData = false;

    for (let i = 1; i < payLines.length; i++) {
        const columns = parseCSVLine(payLines[i]);
        if (columns[1] === inputId) {
            hasPayData = true; agencyName = columns[2] || "-";
            totalReceivableValue = isNaN(parseFloat(columns[6])) ? 0 : parseFloat(columns[6]);
            serverName = columns[9] || "-"; alotedTo = columns[10] || "-"; break;
        }
    }

    let serialNumber = 1, hasBankData = false, htmlContent = "", mobileReceivedSum = 0;

    for (let i = 1; i < bankLines.length; i++) {
        const columns = parseCSVLine(bankLines[i]);
        if (columns[1] === inputId) {
            hasBankData = true;
            let utr = columns[2] || "-", amountStr = columns[3] || "0", ordDate = columns[7] || "-", eligible = columns[12] || "-";
            let amountVal = isNaN(parseFloat(amountStr)) ? 0 : parseFloat(amountStr);
            let isMobile = String(eligible).toUpperCase().trim() === "MOBILE";
            
            if (isMobile) mobileReceivedSum += amountVal;
            let rowStyle = isMobile ? 'style="background-color: #fff3cd;"' : '';

            htmlContent += `
                <tr class="bank-data-tr" ${rowStyle}>
                    <td>${serialNumber++}</td>
                    <td style="text-align: left; padding-left: 10px;">${utr}</td>
                    <td class="bank-amount-color">${amountStr}</td>
                    <td>${ordDate}</td>
                    <td>${eligible}</td>
                </tr>`;
        }
    }

    if (hasPayData || hasBankData) {
        document.getElementById("infoAgencyName").innerText = agencyName;
        document.getElementById("infoReceivable").innerText = totalReceivableValue;
        document.getElementById("infoReceived").innerText = mobileReceivedSum;
        document.getElementById("infoPending").innerText = totalReceivableValue - mobileReceivedSum;
        document.getElementById("infoServer").innerText = serverName;
        document.getElementById("infoAlotedName").innerText = alotedTo;

        document.getElementById("bankInfoBox").style.display = "grid";
        document.getElementById("bankMetaDetails").style.display = "flex";
        tableBody.innerHTML = htmlContent;
    } else {
        noResult.style.display = "block";
    }
}