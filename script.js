// Apnar Google Apps Script Web App URL ti ekhane bosaun
const webAppUrl = "https://script.google.com/macros/s/AKfycbwG0h-P9WHxdg3xb_FWiXWPEJ0KNfRDsV-vI0YCwLEeVc3xJayvK7xiUfV7OqDhBCjd/exec";

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

        // --- কম্বাইন্ড হেডার লজিক (তারিখ + কলাম একসাথে এক লাইনে) ---
        let headerHtml = "<tr style='background-color: #343a40; color: white;'>";

        for (let index = 0; index < data.mainHeader.length; index++) {
            let colName = data.mainHeader[index] || "-";
            let dateVal = data.dateHeader[index] !== undefined && data.dateHeader[index] !== "" ? data.dateHeader[index] : "";
            
            // প্রথম ৬টি সাধারণ কলামের জন্য
            if (index < 6) {
                headerHtml += `<th style='text-align: center; vertical-align: middle;'>${colName}</th>`;
            } 
            // শেষ কলামের আগের কলাম পর্যন্ত (Despatch / Unsold কলামের সাথে তারিখ জোড়া দেওয়া হচ্ছে)
            else if (index < data.mainHeader.length - 1) {
                if (dateVal !== "") {
                    // যদি তারিখ থাকে, তবে দেখাবে: "1.06 (Despatch)" অথবা "1.06 (Unsold)"
                    headerHtml += `<th style='text-align: center; min-width: 100px;'>${dateVal}<br><span style='font-size: 11px; color: #ffeb3b;'>${colName}</span></th>`;
                } else {
                    // যদি কোনো কারণে তারিখের ঘর ফাঁকা থাকে, তবে আগের কলামের তারিখটিই ট্র্যাক করবে (জোড়ার ২য় কলাম বা Unsold এর জন্য)
                    let previousDate = data.dateHeader[index - 1] !== undefined ? data.dateHeader[index - 1] : "";
                    headerHtml += `<th style='text-align: center; min-width: 100px;'>${previousDate}<br><span style='font-size: 11px; color: #ffeb3b;'>${colName}</span></th>`;
                }
            } 
            // একদম শেষের CreateDt কলাম
            else {
                headerHtml += `<th style='text-align: center; vertical-align: middle;'>${colName}</th>`;
            }
        }
        headerHtml += "</tr>";
        tableHeader.innerHTML = headerHtml;

        // --- ক্যালকুলেশন লজিক ---
        let colSums = new Array(data.mainHeader.length).fill(0);
        let grandTotalDespatchGt1000 = 0;
        let lastCreateDate = "-"; 

        let createDtIndex = data.mainHeader.findIndex(col => String(col).toLowerCase().trim() === "createdt");

        // এখানে আমরা আসল ডেটা রো (data.rows) থেকে লুপ চালাচ্ছি, তাই কাউন্ট একদম নিখুঁত আসবে
        for (let i = 0; i < data.rows.length; i++) {
            if (createDtIndex !== -1 && data.rows[i][createDtIndex] !== undefined && data.rows[i][createDtIndex] !== "") {
                lastCreateDate = String(data.rows[i][createDtIndex]);
            }

            for (let j = 0; j < data.rows[i].length; j++) {
                if (j >= 6) { 
                    let colName = String(data.mainHeader[j]).toLowerCase().trim();
                    
                    if (colName !== "createdt" && colName !== "scname") {
                        let num = parseFloat(data.rows[i][j]);
                        if (!isNaN(num)) {
                            colSums[j] += num;
                        }
                    }

                    // কলামের নাম 'despatch' হলে এবং ডেটা ১০০০ এর বেশি হলেই কেবল কাউন্ট ১ বাড়বে
                    let numVal = parseFloat(data.rows[i][j]);
                    if (colName.includes("despatch") && !isNaN(numVal) && numVal > 1000) {
                        grandTotalDespatchGt1000++;
                    }
                }
            }
        }

        // ওপরের ব্যাজে টোটাল কাউন্ট ও ডেট আপডেট
        let formattedDisplayDate = formatDateToDMY(lastCreateDate);
        if (totalCounter) {
            totalCounter.innerHTML = `
                <span style='background-color: #ff9800; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold; margin-left: 10px;'>
                    Total Despatch >1000: ${grandTotalDespatchGt1000} বার
                </span>
                <span style='background-color: #009688; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold; margin-left: 10px;'>
                    Date: ${formattedDisplayDate}
                </span>
            `;
        }

        // FILTERED SUM রো তৈরি
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
        
        // আসল ডেটা রো তৈরি
        let rowsHtml = "";
        for (let i = 0; i < data.rows.length; i++) {
            rowsHtml += "<tr>";
            data.rows[i].forEach((cellValue, cellIndex) => {
                let displayValue = (cellValue !== undefined && cellValue !== "") ? cellValue : "-";
                
                if (cellIndex === createDtIndex) {
                    displayValue = formatDateToDMY(String(displayValue));
                }
                
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
// আপনার script.js ফাইলের একদম শেষ লাইনে এই ফাংশনটি নিখুঁতভাবে বসিয়ে দিন
function showSearchSection() {
    const searchSection = document.getElementById("mlot-search-section");
    if (searchSection) {
        // প্রথমে লুকিয়ে থাকা সেকশনটিকে স্ক্রিনে নিয়ে আসবে
        searchSection.style.display = "block";
        
        // তারপর স্মুথলি স্ক্রল করে সার্চ বক্সের সামনে নিয়ে যাবে
        searchSection.scrollIntoView({ behavior: 'smooth' });
    }
}