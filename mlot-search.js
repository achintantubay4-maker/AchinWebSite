// ====================================================
// 📊 ২. MLOT SEARCH LOGIC (CORRECTED SUM-BASED COUNT)
// ====================================================
const webAppUrl = "https://script.google.com/macros/s/AKfycbz8yymkZYDsI5_x1kqyAPyV3I_h3hXsGHWohSZw4bI1dcASKb0Fri-bF78FFMhsfE8/exec";

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

    const oldScript = document.getElementById("jsonpScript");
    if (oldScript) oldScript.remove();

    window.handleGoogleSheetData = function(data) {
        loading.style.display = "none";
        if (data.error) { tableBody.innerHTML = `<tr><td style='color:red;'>${data.error}</td></tr>`; return; }
        if (!data.rows || data.rows.length === 0) { noResult.style.display = "block"; return; }

        // ১. হেডার তৈরি করা
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

        // ২. ফিল্টার সাম (Filtered Sum) এবং অন্যান্য হিসাব
        let colSums = new Array(data.mainHeader.length).fill(0);
        let lastCreateDate = "-";
        let createDtIndex = data.mainHeader.findIndex(col => String(col).toLowerCase().trim() === "createdt");

        // প্রতিটি রো এর ডেটা যোগ করা (Sum calculation)
        data.rows.forEach(row => {
            if (createDtIndex !== -1 && row[createDtIndex]) {
                lastCreateDate = String(row[createDtIndex]);
            }
            row.forEach((cell, j) => {
                if (j >= 6) {
                    let colName = String(data.mainHeader[j]).toLowerCase().trim();
                    if (colName !== "createdt" && colName !== "scname") {
                        let num = parseFloat(cell); if (!isNaN(num)) colSums[j] += num;
                    }
                }
            });
        });

        // 🎯 সংশোধন লজিক: ফিল্টার সাম (colSums) থেকে বের করা হচ্ছে কোন কোন কলামের যোগফল ১০০০ বা তার বেশি
        let grandTotalDespatchGt1000 = 0;
        data.mainHeader.forEach((col, j) => {
            if (j >= 6) {
                let colName = String(col).toLowerCase().trim();
                // "createdt" এবং "scname" বাদ দিয়ে কলামের ফাইনাল যোগফল চেক করা হচ্ছে
                if (colName !== "createdt" && colName !== "scname" && colName.includes("despatch")) {
                    if (colSums[j] >= 1000) {
                        grandTotalDespatchGt1000++; // যোগফল >= ১০০০ হলে তবেই কাউন্ট বাড়ছে
                    }
                }
            }
        });

        // ৩. টপ কাউন্টার আপডেট করা (হলুদ ব্যাজ)
        if (totalCounter) {
            totalCounter.innerHTML = `
                <span class="badge-orange">Total Despatch >=1000: ${grandTotalDespatchGt1000} বার</span>
                <span class="badge-green">Date: ${formatDateToDMY(lastCreateDate)}</span>
            `;
        }

        // ৪. ফিল্টার সাম রো তৈরি
        let sumHtml = "<tr style='background-color: #ccffcc; font-weight: bold;'>";
        data.mainHeader.forEach((col, j) => {
            let colName = String(col).toLowerCase().trim();
            if (j === 3) sumHtml += "<td>FILTERED SUM:</td>";
            else if (j < 3 || j === 4 || j === 5 || colName === "createdt" || colName === "scname") sumHtml += "<td>-</td>";
            else sumHtml += `<td>${Number.isInteger(colSums[j]) ? colSums[j] : colSums[j].toFixed(2)}</td>`;
        });

        // ৫. মূল ডেটা রো গুলো তৈরি
        let rowsHtml = "";
        data.rows.forEach(row => {
            rowsHtml += "<tr>";
            row.forEach((cell, cellIndex) => { 
                let displayValue = (cell !== undefined && cell !== "") ? cell : "-";
                if (cellIndex === createDtIndex) {
                    displayValue = formatDateToDMY(String(displayValue));
                }
                rowsHtml += `<td>${displayValue}</td>`; 
            });
            rowsHtml += "</tr>";
        });
        
        tableBody.innerHTML = sumHtml + "</tr>" + rowsHtml;
        
        if (document.getElementById("jsonpScript")) {
            document.getElementById("jsonpScript").remove();
        }
    };

    const script = document.createElement("script");
    script.id = "jsonpScript";
    script.src = `${webAppUrl}?id=${encodeURIComponent(searchId)}&callback=handleGoogleSheetData`;
    document.body.appendChild(script);
}