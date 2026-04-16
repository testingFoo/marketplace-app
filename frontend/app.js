const API = "https://marketplace-app-m8ac.onrender.com";

// =====================
// STATE (SINGLE SOURCE OF TRUTH)
// =====================
let mode = "rider";
let driverOnline = false;

let pickup = null;
let drop = null;

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

// =====================
// INIT MAP
// =====================
function initMap() {
  map = L.map("map").setView([52.2297, 21.0122], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
  }).addTo(map);

  map.on("click", (e) => {
    const { lat, lng } = e.latlng;

    if (!pickup) {
      pickup = { lat, lng };
      document.getElementById("pickup").value =
        `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      log("📍 Pickup set from map");
    } else {
      drop = { lat, lng };
      document.getElementById("destination").value =
        `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      log("📍 Drop set from map");
    }
  });

  log("🗺️ Map ready");
}

// =====================
// SOCKET
// =====================
let socket;

function initSocket() {
  socket = io(API);

  socket.on("connect", () => {
    log("🟢 Socket connected");
  });

  socket.on("ride:new", (payload) => {
    // FIX: backend sends { ride, route }
    log("🚕 Ride received");

    if (payload?.route) {
      log("🗺️ Route available");
    }

    loadRides();
  });

  socket.on("ride:update", () => loadRides());
}

// =====================
// SEARCH (NOMINATIM)
// =====================
async function searchAddress(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
  );
  return await res.json();
}

// =====================
// SEARCH HANDLERS
// =====================
async function handlePickupSearch() {
  const q = document.getElementById("pickup").value;
  const results = await searchAddress(q);

  if (results.length) {
    const r = results[0];
    pickup = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    document.getElementById("pickup").value = r.display_name;
    log("📍 Pickup set from search");
  }
}

async function handleDropSearch() {
  const q = document.getElementById("destination").value;
  const results = await searchAddress(q);

  if (results.length) {
    const r = results[0];
    drop = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    document.getElementById("destination").value = r.display_name;
    log("📍 Drop set from search");
  }
}

// =====================
// CREATE RIDE
// =====================
function createRide() {
  if (!pickup || !drop) {
    log("❌ Missing pickup or drop");
    return;
  }

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pickup: document.getElementById("pickup").value,
      destination: document.getElementById("destination").value,
      pickupCoords: pickup,
      dropCoords: drop,
      userId
    })
  })
    .then(res => res.json())
    .then(data => {
      log("🚗 Ride created");
      loadRides();
    })
    .catch(err => log("❌ Create ride error " + err));
}

// =====================
// MODE
// =====================
function setMode(m) {
  mode = m;
  updateModeLabel();
  loadRides();
}

function updateModeLabel() {
  const el = document.getElementById("modeLabel");
  if (el) el.innerText = "Current: " + mode.toUpperCase();
}

// =====================
// DRIVER
// =====================
function toggleDriver() {
  driverOnline = !driverOnline;

  if (socket) {
    socket.emit(driverOnline ? "driver:online" : "driver:offline", driverId);
  }

  const btn = document.getElementById("driverToggle");
  if (btn) btn.innerText = driverOnline ? "Go OFFLINE" : "Go ONLINE";
}

// =====================
// LOAD RIDES (🔥 FIXED DRIVER VISIBILITY)
// =====================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(data => {
      const box = document.getElementById("rides");
      box.innerHTML = "";

      let filtered = data;

      // 🔥 FIX 1: DRIVER must see assigned + available rides
      if (mode === "driver") {
        filtered = data.filter(r =>
          r.status === "REQUESTED" ||
          r.driverId === driverId ||
          r.status === "ACCEPTED"
        );
      }

      // rider sees only own rides
      if (mode === "rider") {
        filtered = data.filter(r => r.userId === userId);
      }

      filtered.forEach(r => {
        const div = document.createElement("div");
        div.className = "ride";

        div.innerHTML = `
          <b>${r.pickup} → ${r.destination}</b><br/>
          Status: ${r.status}<br/>
          Driver: ${r.driverId || "none"}
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
// GLOBAL EXPORTS
// =====================
window.setMode = setMode;
window.toggleDriver = toggleDriver;
window.createRide = createRide;
window.checkBackend = checkBackend;
window.loadRides = loadRides;
window.handlePickupSearch = handlePickupSearch;
window.handleDropSearch = handleDropSearch;
