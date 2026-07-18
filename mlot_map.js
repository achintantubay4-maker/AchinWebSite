const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1kQRHPM7TYFhK9LTgkVmkZZukfV8C1ykLi1zm03-FivE/gviz/tq?tqx=out:json&gid=40934765';

const map = L.map('map').setView([22.9868, 87.8550], 8);
L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { attribution: '© Google Maps' }).addTo(map);

let markerGroup = L.layerGroup().addTo(map);
let myLocationMarker = null;
let allMlotData = [];
let userCoords = null;

// ইউজার লোকেশন ট্র্যাকিং
navigator.geolocation.watchPosition(pos => {
    userCoords = [pos.coords.latitude, pos.coords.longitude];
    if (!myLocationMarker) {
        myLocationMarker = L.circleMarker(userCoords, { radius: 8, color: 'white', fillColor: '#007bff', fillOpacity: 1, weight: 2 }).addTo(map).bindPopup("Your Location");
    } else {
        myLocationMarker.setLatLng(userCoords);
    }
});

// তারিখ ফরম্যাট করার ফাংশন
function formatDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return "N/A";
    const match = dateStr.match(/\d+/g);
    if (match && match.length >= 3) {
        return `${match[0]}-${(parseInt(match[1]) + 1).toString().padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    }
    return dateStr;
}

// শুধুমাত্র ডেটা ফেচ করে ভেরিয়েবলে রাখবে, ম্যাপে পিন করবে না
async function fetchAndCacheData() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        allMlotData = json.table.rows;
        document.getElementById('mapLoading').style.display = 'none';
        console.log("Data loaded successfully!");
    } catch (error) { 
        console.error(error); 
        document.getElementById('mapLoading').innerText = "Failed to load data!";
    }
}

function plotMarkers(rows) {
    markerGroup.clearLayers();
    rows.forEach(row => {
        const data = row.c;
        const lat = data[7]?.v, lon = data[8]?.v;
        if (lat && lon) {
            const popupHtml = `
                <div style="font-family: sans-serif; font-size:13px; line-height:1.5; min-width: 220px; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #880505; color: white; padding: 8px; font-weight: bold;">ID: ${data[1]?.v || "N/A"}</div>
                    <div style="padding: 10px;">
                        <div><b>👤 Name:</b> ${data[2]?.v || "N/A"}</div>
                        <div><b>📞 Mobile:</b> <a href="tel:${data[6]?.v}">${data[6]?.v || "N/A"}</a></div>
                        <hr style="margin: 8px 0;">
                        <div><b>PID:</b> ${data[9]?.v || "N/A"}</div>
                        <div><b>PID Name:</b> ${data[10]?.v || "N/A"}</div>
                        <div><b>Date:</b> ${formatDate(data[12]?.v)}</div>
                        <div style="margin-top: 5px;"><b>☂️ Umbrella:</b> ${data[14]?.v || "N/A"} (${formatDate(data[15]?.v)})</div>
                        <div><b>🛡️ Board:</b> ${data[16]?.v || "N/A"} (${formatDate(data[17]?.v)})</div>
                        ${data[18]?.v === 'Yes' ? `<div style="margin-top:8px; padding:5px; background:#ffebee; color:#c62828; text-align:center; font-weight:bold; border-radius:5px;">⚠️ FAKE: ${data[20]?.v || "Yes"}</div>` : ''}
                    </div>
                </div>`;
            L.marker([lat, lon]).addTo(markerGroup).bindPopup(popupHtml);
        }
    });
}

function searchById() {
    const id = document.getElementById('inputMlotId').value.trim();
    if(id) plotMarkers(allMlotData.filter(r => String(r.c[1]?.v) === id));
}

function searchNearby() {
    if (!userCoords) return alert("Enable GPS!");
    const km = parseFloat(document.getElementById('inputKm').value);
    plotMarkers(allMlotData.filter(r => calculateDistance(userCoords[0], userCoords[1], r.c[7]?.v, r.c[8]?.v) <= km));
    map.setView(userCoords, 12);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// পেজ লোড হওয়ার সময় শুধুমাত্র ডেটা লোড হবে, পিন দেখাবে না
fetchAndCacheData();