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
let routeLine = null;

// =====================
// SOCKET
// =====================
let socket;

function initSocket() {
  socket = io(API);

  socket.on("connect", () => log("🟢 Socket connected"));

  socket.on("ride:new", (data) => {
    log("🚕 New ride received");
    if (data.route) drawRoute(data.route.coords);
    loadRides();
  });

  socket.on("ride:update", () => loadRides());

  socket.on("driver:move", (data) => {
    const { driverId: id, lat, lng } = data;

    if (!map) return;

    if (!markers[id]) {
      markers[id] = L.marker([lat, lng]).addTo(map);
    } else {
      markers[id].setLatLng([lat, lng]);
    }
  });
}

// =====================
// MAP INIT
// =====================
function initMap() {
  map = L.map("map").setView([52.2297, 21.0122], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
  }).addTo(map);

  log("🗺️ Map ready");
}

// =====================
// ROUTE DRAWING
// =====================
function drawRoute(coords) {
  if (!map || !coords) return;

  if (routeLine) {
    map.removeLayer(routeLine);
  }

  const latlngs = coords.map(c => [c[1], c[0]]);

  routeLine = L.polyline(latlngs, {
    color: "blue",
    weight: 4
  }).addTo(map);

  map.fitBounds(routeLine.getBounds());

  log("🧭 Route drawn");
}

// =====================
// DRIVER MOVEMENT (UNCHANGED)
// =====================
function startDriverMovement() {
  if (!driverOnline) return;

  let lat = 52.2297;
  let lng = 21.0122;

  setInterval(() => {
    lat += (Math.random() - 0.5) * 0.002;
    lng += (Math.random() - 0.5) * 0.002;

    socket.emit("driver:location", {
      driverId,
      lat,
      lng
    });
  }, 2000);
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
// BACKEND CHECK
// =====================
function checkBackend() {
  fetch(`${API}/api/health`)
    .then(r => r.json())
    .then(d => {
      setStatus(`${d.status} | DB: ${d.db}`);
      log("📡 Backend OK");
    })
    .catch(e => log("❌ " + e));
}

// =====================
// DRIVER TOGGLE
// =====================
function toggleDriver() {
  driverOnline = !driverOnline;

  if (driverOnline) {
    socket.emit("driver:online", driverId);
    startDriverMovement();
    log("🟢 Driver ONLINE");
  } else {
    socket.emit("driver:offline", driverId);
    log("🔴 Driver OFFLINE");
  }
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
// CREATE RIDE
// =====================
function createRide() {
  const pickup = document.getElementById("pickup")?.value;
  const destination = document.getElementById("destination")?.value;

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickup, destination, userId })
  }).then(loadRides);
}

// =====================
// INIT
// =====================
window.onload = () => {
  log("🟢 App loaded");
  initMap();
  initSocket();
  updateModeLabel();
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
