// ====================================================
// 🏦 ৩. BANK STATEMENT SEARCH LOGIC
// ====================================================
const BANK_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9W-pIujf18EgJ1bpsX3DnKPFJhRKtUK49KG3UpvvGY3h_vauwIIof9m5g3gMVOPAVgm6I00dXQ8C6/pub?gid=643565073&single=true&output=csv&_cb=" + new Date().getTime();
const PAY_ALOTED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9W-pIujf18EgJ1bpsX3DnKPFJhRKtUK49KG3UpvvGY3h_vauwIIof9m5g3gMVOPAVgm6I00dXQ8C6/pub?gid=616652862&single=true&output=csv&_cb=" + new Date().getTime();

let cachedBankData = null;
let cachedPayData = null;

document.addEventListener("DOMContentLoaded", function() {
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "report.html") {
        const urlParams = new URLSearchParams(window.location.search);
        const section = urlParams.get('section') || 'mlot';
        switchReportTab(section);
        preloadBankData();
    }
});

function preloadBankData() {
    fetch(BANK_SHEET_URL, { cache: "no-store" })
        .then(res => res.text())
        .then(csv => { cachedBankData = csv.split(/\r?\n/); })
        .catch(e => console.log("Preload Error Bank"));
        
    fetch(PAY_ALOTED_URL, { cache: "no-store" })
        .then(res => res.text())
        .then(csv => { cachedPayData = csv.split(/\r?\n/); })
        .catch(e => console.log("Preload Error Pay"));
}

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

    if (cachedBankData && cachedPayData) {
        processBankSearch(cachedBankData, cachedPayData, inputId, loading, noResult, tableBody);
    } else {
        Promise.all([ 
            fetch(BANK_SHEET_URL, { cache: "no-store" }).then(res => res.text()), 
            fetch(PAY_ALOTED_URL, { cache: "no-store" }).then(res => res.text()) 
        ])
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