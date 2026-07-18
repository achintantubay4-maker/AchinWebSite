// ====================================================
// 🗺️ FINAL MERGED MAP SEARCH LOGIC (WITH COUNT FEATURE)
// ====================================================
const CUSTOMER_SHEET_URL = "https://docs.google.com/spreadsheets/d/1kQRHPM7TYFhK9LTgkVmkZZukfV8C1ykLi1zm03-FivE/export?format=csv&gid=2053250837&_cb=" + new Date().getTime();

window.mymap = null;
let markerGroup = null;

function initMap() {
    const mapDiv = document.getElementById("map");
    if(mapDiv) mapDiv.style.display = "block";
    
    if (!window.mymap) {
        window.mymap = L.map('map').setView([22.9868, 87.8550], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(window.mymap);
        markerGroup = L.layerGroup().addTo(window.mymap);
    } else {
        markerGroup.clearLayers();
    }
}

function parseCSVLine(line) {
    if (!line) return [];
    return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(item => item.replace(/^"|"$/g, '').trim());
}

function searchMapData() {
    const cidInput = document.getElementById("inputMapCID").value.trim();
    if (!cidInput) { alert("দয়া করে একটি নির্দিষ্ট CID নম্বর লিখুন!"); return; }
    fetchAndPlotMap(cidInput);
}

function searchAllMapData() {
    fetchAndPlotMap("ALL");
}

function fetchAndPlotMap(targetCID) {
    const loading = document.getElementById("mapLoading");
    const noResult = document.getElementById("mapNoResult");
    const countSpan = document.getElementById("pinCount");
    
    if(loading) loading.style.display = "block";
    if(noResult) noResult.style.display = "none";
    
    // কাউন্ট রিসেট
    let currentCount = 0;
    if(countSpan) countSpan.textContent = "Count: 0";
    
    initMap(); 
    
    fetch(CUSTOMER_SHEET_URL, { cache: "no-store" })
        .then(res => res.text())
        .then(csvText => {
            const lines = csvText.split(/\r?\n/);
            if(lines.length <= 2) { throw new Error("No Data Found"); }

            const headers = parseCSVLine(lines[1]).map(h => h.toUpperCase().trim());
            const cIdx = headers.indexOf("CID") !== -1 ? headers.indexOf("CID") : 1;
            const nIdx = headers.indexOf("PROPREITOR NAME") !== -1 ? headers.indexOf("PROPREITOR NAME") : 5;
            const gIdx = headers.indexOf("CITY") !== -1 ? headers.indexOf("CITY") : 6;
            const hIdx = headers.indexOf("SHOPE ER FULL ADDRESS") !== -1 ? headers.indexOf("SHOPE ER FULL ADDRESS") : 7;
            const jIdx = headers.indexOf("DISTRIC") !== -1 ? headers.indexOf("DISTRIC") : 9;
            const mIdx = headers.indexOf("PIN CODE") !== -1 ? headers.indexOf("PIN CODE") : 12;
            const iconIdx = headers.indexOf("CONTACT 1") !== -1 ? headers.indexOf("CONTACT 1") : 13;

            let matchRows = [];
            for (let i = 2; i < lines.length; i++) {
                const cols = parseCSVLine(lines[i]);
                if (cols.length < 3) continue;
                let currentCID = String(cols[cIdx]).trim();
                
                if (targetCID === "ALL" || currentCID === targetCID) {
                    matchRows.push({
                        cid: currentCID,
                        name: cols[nIdx] || "Unknown",
                        shopAddress: cols[hIdx] || "No Address",
                        contact: cols[iconIdx] || "N/A",
                        searchAddress: `${cols[hIdx] || ''}, ${cols[gIdx] || ''}, ${cols[jIdx] || ''}, West Bengal, ${cols[mIdx] || ''}`,
                        backupAddress: `${cols[gIdx] || ''}, ${cols[jIdx] || ''}, West Bengal, ${cols[mIdx] || ''}`
                    });
                }
            }

            if (matchRows.length === 0) {
                if(loading) loading.style.display = "none";
                if(noResult) noResult.style.display = "block";
                return;
            }
            
            let promises = matchRows.map((row, index) => {
                let geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(row.searchAddress)}&limit=1`;
                
                return new Promise(resolve => setTimeout(resolve, index * 300))
                    .then(() => fetch(geocodeUrl, { headers: { 'User-Agent': 'CID-Map-App-v3' } }))
                    .then(r => r.json())
                    .then(geoResult => {
                        if (geoResult && geoResult.length > 0) return geoResult;
                        let backupUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(row.backupAddress)}&limit=1`;
                        return fetch(backupUrl, { headers: { 'User-Agent': 'CID-Map-App-v3' } }).then(r => r.json());
                    })
                    .then(finalResult => {
                        if (finalResult && finalResult.length > 0) {
                            // কাউন্ট বাড়ানো এবং আপডেট করা
                            currentCount++;
                            if(countSpan) countSpan.textContent = "Count: " + currentCount;
                            
                            let lat = parseFloat(finalResult[0].lat);
                            let lon = parseFloat(finalResult[0].lon);
                            
                            let marker = L.marker([lat, lon]).addTo(markerGroup);
                            marker.bindPopup(`
                                <div style="font-family: Arial; font-size:13px; line-height:1.5; color:#333;">
                                    <b style="color:#880505; font-size:14px;">CID: ${row.cid}</b><br>
                                    <b>Owner:</b> ${row.name}<br>
                                    <b>Shop Address:</b> ${row.shopAddress}<br>
                                    <b>Contact:</b> ${row.contact}
                                </div>
                            `);
                            return [lat, lon];
                        }
                        return null;
                    }).catch(() => null);
            });

            Promise.all(promises).then(coords => {
                if(loading) loading.style.display = "none";
                let validCoords = coords.filter(c => c !== null);
                if (validCoords.length > 0) {
                    window.mymap.fitBounds(L.latLngBounds(validCoords), { padding: [50, 50] });
                } else {
                    alert("দুঃখিত, ম্যাপে এই ঠিকানার পিন পয়েন্ট খুঁজে পাওয়া যায়নি।");
                }
            });
        })
        .catch(err => {
            if(loading) loading.style.display = "none";
            console.error(err);
            alert("গুগল শিট কানেকশন এরর!");
        });
}

function handleLogout() { 
    sessionStorage.clear();
    window.location.href = "index.html"; 
}

window.onload = initMap;