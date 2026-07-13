// ====================================================
// 🟢 ১. কনস্ট্যান্ট ও ইউআরএল (URLs) কনফিগারেশন
// ====================================================
const webAppUrl = "https://script.google.com/macros/s/AKfycbz8yymkZYDsI5_x1kqyAPyV3I_h3hXsGHWohSZw4bI1dcASKb0Fri-bF78FFMhsfE8/exec";

const BANK_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9W-pIujf18EgJ1bpsX3DnKPFJhRKtUK49KG3UpvvGY3h_vauwIIof9m5g3gMVOPAVgm6I00dXQ8C6/pub?gid=643565073&single=true&output=csv";
const PAY_ALOTED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT9W-pIujf18EgJ1bpsX3DnKPFJhRKtUK49KG3UpvvGY3h_vauwIIof9m5g3gMVOPAVgm6I00dXQ8C6/pub?gid=616652862&single=true&output=csv";


// ====================================================
// 🟢 ২. মেনুবার এবং সেকশন কন্ট্রোল করার ফাংশনসমূহ
// ====================================================
function hideAll() {
    document.getElementById("mlot-search-section").style.display = "none";
    document.getElementById("bank-search-section").style.display = "none";
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


// ====================================================
// 🟢 ৩. MLOT SEARCH ফাংশন (পুরোপুরি অক্ষত)
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
// 🟢 ৪. ব্যাংক ডেটা সার্চ মডিউল (হাই-স্পিড লোকাল ফিল্টার + মোবাইল হাইলাইট)
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
    const infoReceivable = document.getElementById("infoReceivable");
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

    Promise.all([
        fetch(BANK_SHEET_URL).then(res => res.text()),
        fetch(PAY_ALOTED_URL).then(res => res.text())
    ])
    .then(([bankCsv, payAlotedCsv]) => {
        if (loading) loading.style.display = "none";

        // ১. 'Pay Aloted' সার্চ ফিল্টার
        const payLines = payAlotedCsv.split(/\r?\n/);
        let totalReceivable = "-";
        let serverName = "-";
        let alotedTo = "-";
        let hasPayData = false;

        for (let i = 1; i < payLines.length; i++) {
            const line = payLines[i];
            if (!line || !line.includes(inputId)) continue; 
            
            const columns = parseCSVLine(line);
            if (columns[1] === inputId) {
                hasPayData = true;
                totalReceivable = columns[6] || "-";
                serverName = columns[9] || "-";
                alotedTo = columns[10] || "-";
                break;
            }
        }

        // ২. 'Bank' শিট সার্চ ফিল্টার
        const bankLines = bankCsv.split(/\r?\n/);
        let serialNumber = 1;
        let hasBankData = false;
        let htmlContent = "";

        for (let i = 1; i < bankLines.length; i++) {
            const line = bankLines[i];
            if (!line || !line.includes(inputId)) continue; 
            
            const columns = parseCSVLine(line);
            if (columns[1] === inputId) {
                hasBankData = true;
                let utr = columns[2] || "-";       
                let amount = columns[3] || "-";    
                let ordDate = columns[7] || "-";   
                let eligible = columns[12] || "-"; 

                // ⚡ Eligible কলামে 'MOBILE' থাকলে ব্যাকগ্রাউন্ড হালকা হলুদ রঙে হাইলাইট হবে
                let isMobile = String(eligible).toUpperCase().trim() === "MOBILE";
                let rowStyle = isMobile ? 'style="background-color: #fff3cd;"' : '';

                htmlContent += `
                    <tr class="bank-data-tr" ${rowStyle}>
                        <td>${serialNumber++}</td>
                        <td>${utr}</td>
                        <td class="bank-amount-color">${amount}</td>
                        <td>${ordDate}</td>
                        <td>${eligible}</td>
                    </tr>
                `;
            }
        }

        // ৩. রেজাল্ট রেন্ডারিং
        if (hasPayData || hasBankData) {
            if (infoBox) {
                infoReceivable.innerText = totalReceivable;
                infoServer.innerText = serverName;
                infoAlotedName.innerText = alotedTo;
                infoBox.style.display = "block";
            }

            // ১০টি খালি রো যোগ করা
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
        console.error(error);
    });
}