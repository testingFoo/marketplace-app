const API = "https://marketplace-app-m8ac.onrender.com";

// =====================
// STATE
// =====================
let mode = "rider";
let driverOnline = false;

let userId = localStorage.getItem("userId") || ("user_" + Date.now());
localStorage.setItem("userId", userId);

let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());
localStorage.setItem("driverId", driverId);

// =====================
// DEBUG
// =====================
function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.innerText = msg;
  console.log("[STATUS]", msg);
}

function log(msg) {
  const el = document.getElementById("log");
  if (el) el.innerText += msg + "\n";
  console.log("[LOG]", msg);
}

// =====================
// MAP
// =====================
let map;
let markers = {};
let selectedPickup = null;
let selectedDrop = null;

// =====================
// SOCKET
// =====================
let socket;

function initSocket() {
  socket = io(API);

  socket.on("connect", () => log("🟢 Socket connected"));

  socket.on("ride:new", (data) => {
    if (data.route) drawRoute(data.route.coords);
    loadRides();
  });

  socket.on("ride:update", loadRides);
}

// =====================
// MAP INIT
// =====================
function initMap() {
  map = L.map("map").setView([52.2297, 21.0122], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
  }).addTo(map);

  map.on("click", async (e) => {
    const { lat, lng } = e.latlng;

    if (!selectedPickup) {
      selectedPickup = { lat, lng };
      log("📍 Pickup selected");
      addMarker(lat, lng, "Pickup");
    } else {
      selectedDrop = { lat, lng };
      log("📍 Drop selected");
      addMarker(lat, lng, "Drop");
    }
  });

  log("🗺️ Map ready");
}

// =====================
// MARKERS
// =====================
function addMarker(lat, lng, label) {
  const m = L.marker([lat, lng]).addTo(map).bindPopup(label);
  markers[label] = m;
}

// =====================
// ADDRESS SEARCH (NOMINATIM)
// =====================
async function searchAddress(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
  );

  const data = await res.json();
  return data;
}

// =====================
// UI SEARCH HANDLERS
// =====================
async function handlePickupSearch() {
  const q = document.getElementById("pickup").value;

  const results = await searchAddress(q);

  if (results.length > 0) {
    const r = results[0];
    selectedPickup = { lat: r.lat, lng: r.lon };
    log("📍 Pickup set from search");
  }
}

async function handleDropSearch() {
  const q = document.getElementById("destination").value;

  const results = await searchAddress(q);

  if (results.length > 0) {
    const r = results[0];
    selectedDrop = { lat: r.lat, lng: r.lon };
    log("📍 Drop set from search");
  }
}

// =====================
// CREATE RIDE (REAL COORDS)
// =====================
function createRide() {
  if (!selectedPickup || !selectedDrop) {
    log("❌ Select pickup & drop first");
    return;
  }

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pickup: "Selected Location",
      destination: "Selected Location",
      userId
    })
  }).then(loadRides);
}

function setMode(m) {
  mode = m;
  updateModeLabel();
  loadRides();
}

function toggleDriver() {
  driverOnline = !driverOnline;

  if (socket) {
    if (driverOnline) {
      socket.emit("driver:online", driverId);
    } else {
      socket.emit("driver:offline", driverId);
    }
  }

  const btn = document.getElementById("driverToggle");
  if (btn) btn.innerText = driverOnline ? "Go OFFLINE" : "Go ONLINE";
}

// =====================
// LOAD RIDES
// =====================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(data => {
      const box = document.getElementById("rides");
      box.innerHTML = "";

      data.forEach(r => {
        const div = document.createElement("div");
        div.className = "ride";

        div.innerHTML = `
          <b>${r.pickup} → ${r.destination}</b><br/>
          Status: ${r.status}
        `;

        box.appendChild(div);
      });
    });
}

// =====================
// BACKEND CHECK
// =====================
function checkBackend() {
  fetch(`${API}/api/health`)
    .then(r => r.json())
    .then(d => {
      setStatus(`${d.status} | DB: ${d.db}`);
      log("📡 Backend OK");
    });
}

// =====================
// INIT
// =====================
window.onload = () => {
  log("🟢 App loaded");

  initMap();
  initSocket();
  loadRides();
};

// =====================
// GLOBALS
// =====================
window.setMode = setMode;
window.toggleDriver = toggleDriver;
window.createRide = createRide;
window.checkBackend = checkBackend;
window.loadRides = loadRides;
window.updateStatus = updateStatus
// expose search functions
window.handlePickupSearch = handlePickupSearch;
window.handleDropSearch = handleDropSearch;
