// ====================================================
// 🗺️ 8. CID WISE MAP SEARCH LOGIC (WITH SMART BACKUP SEARCH)
// ====================================================
const CUSTOMER_SHEET_URL = "https://docs.google.com/spreadsheets/d/1kQRHPM7TYFhK9LTgkVmkZZukfV8C1ykLi1zm03-FivE/export?format=csv&gid=2053250837&_cb=" + new Date().getTime();

window.mymap = null;
let markerGroup = null;

function initMap() {
    const mapDiv = document.getElementById("map");
    mapDiv.style.display = "block";
    
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
    if (!cidInput) { alert("দয়া করে একটি নির্দিষ্ট CID নম্বর লিখুন অথবা 'Show All CIDs on Map' বাটনে চাপুন!"); return; }
    fetchAndPlotMap(cidInput);
}

function searchAllMapData() {
    fetchAndPlotMap("ALL");
}

function fetchAndPlotMap(targetCID) {
    const loading = document.getElementById("mapLoading");
    const noResult = document.getElementById("mapNoResult");
    
    loading.style.display = "block";
    noResult.style.display = "none";
    
    fetch(CUSTOMER_SHEET_URL, { cache: "no-store" })
        .then(res => res.text())
        .then(csvText => {
            const lines = csvText.split(/\r?\n/);
            if(lines.length <= 2) { throw new Error("No Data Found"); }

            const headers = parseCSVLine(lines[1]).map(h => h.toUpperCase().trim());
            
            const idxCID = headers.indexOf("CID");
            const idxName = headers.indexOf("PROPREITOR NAME");
            const idxCity = headers.indexOf("CITY");
            const idxAddress = headers.indexOf("SHOPE ER FULL ADDRESS");
            const idxDist = headers.indexOf("DISTRIC");
            const idxPin = headers.indexOf("PIN CODE");
            const idxContact = headers.indexOf("CONTACT 1");

            const cIdx = idxCID !== -1 ? idxCID : 1;
            const nIdx = idxName !== -1 ? idxName : 5;
            const gIdx = idxCity !== -1 ? idxCity : 6;
            const hIdx = idxAddress !== -1 ? idxAddress : 7;
            const jIdx = idxDist !== -1 ? idxDist : 9;
            const mIdx = idxPin !== -1 ? idxPin : 12;
            const iconIdx = idxContact !== -1 ? idxContact : 13;

            let matchRows = [];

            for (let i = 2; i < lines.length; i++) {
                const cols = parseCSVLine(lines[i]);
                if (cols.length < 3) continue;

                let currentCID = String(cols[cIdx]).trim();
                
                if (targetCID === "ALL" || currentCID === targetCID) {
                    // ১. প্রাইমারি অ্যাড্রেস (ডিটেইলড)
                    let primaryAddr = `${cols[hIdx] || ''}, ${cols[gIdx] || ''}, ${cols[jIdx] || ''}, West Bengal, ${cols[mIdx] || ''}`;
                    // ২. ব্যাকআপ অ্যাড্রেস (যদি ফুল অ্যাড্রেস ম্যাপ চিনতে না পারে)
                    let backupAddr = `${cols[gIdx] || ''}, ${cols[jIdx] || ''}, West Bengal, ${cols[mIdx] || ''}`;
                    
                    matchRows.push({
                        cid: currentCID,
                        name: cols[nIdx] || "Unknown",
                        shopAddress: cols[hIdx] || "No Address",
                        contact: cols[iconIdx] || "N/A",
                        searchAddress: primaryAddr,
                        backupAddress: backupAddr
                    });
                }
            }

            if (matchRows.length === 0) {
                loading.style.display = "none";
                noResult.style.display = "block";
                return;
            }

            initMap();
            
            // ম্যাপ লোকেশন খোঁজার মূল লুপ
            let promises = matchRows.map((row, index) => {
                let geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(row.searchAddress)}&limit=1`;
                
                return new Promise(resolve => setTimeout(resolve, index * 300))
                    .then(() => fetch(geocodeUrl, { headers: { 'User-Agent': 'CID-Map-App-v3' } }))
                    .then(r => r.json())
                    .then(geoResult => {
                        // যদি প্রথমবার ফুল অ্যাড্রেস পেয়ে যায়
                        if (geoResult && geoResult.length > 0) {
                            return geoResult;
                        } else {
                            // 🔄 ব্যাকআপ স্ট্র্যাটেজি: ফুল অ্যাড্রেস না পেলে শুধু City, District ও Pin Code দিয়ে খোঁজা হবে
                            let backupUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(row.backupAddress)}&limit=1`;
                            return fetch(backupUrl, { headers: { 'User-Agent': 'CID-Map-App-v3' } }).then(r => r.json());
                        }
                    })
                    .then(finalResult => {
                        if (finalResult && finalResult.length > 0) {
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
                loading.style.display = "none";
                let validCoords = coords.filter(c => c !== null);
                
                if (validCoords.length > 0) {
                    if (validCoords.length === 1) {
                        window.mymap.setView(validCoords[0], 14);
                        markerGroup.eachLayer(layer => layer.openPopup());
                    } else {
                        let bounds = L.latLngBounds(validCoords);
                        window.mymap.fitBounds(bounds, { padding: [50, 50] });
                    }
                } else {
                    // যদি ব্যাকআপ অ্যাড্রেসও ফেইল করে
                    alert("দুঃখিত, এই ঠিকানার পিনকোড বা সিটি ম্যাপে খুঁজে পাওয়া যায়নি। দয়া করে স্প্রেডশিটের তথ্য চেক করুন!");
                }
            });
        })
        .catch(err => {
            loading.style.display = "none";
            console.error(err);
            alert("গুগল শিট কানেকশন এরর!");
        });
}