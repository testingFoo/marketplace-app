const API = "https://marketplace-app-m8ac.onrender.com";

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
function log(msg) {
  const el = document.getElementById("log");
  if (el) el.innerText += msg + "\n";
}

function setStatus(msg) {
  document.getElementById("status").innerText = msg;
}

// =====================
// MAP
// =====================
let map;

function initMap() {
  map = L.map("map").setView([52.2297, 21.0122], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  map.on("click", (e) => {
    const { lat, lng } = e.latlng;

    if (!pickup) {
      pickup = { lat, lng };
      document.getElementById("pickup").value = `${lat},${lng}`;
    } else {
      drop = { lat, lng };
      document.getElementById("destination").value = `${lat},${lng}`;
    }
  });
}

// =====================
// SOCKET
// =====================
let socket;

function initSocket() {
  socket = io(API);

  socket.on("ride:new", () => loadRides());
  socket.on("ride:update", () => loadRides());
}

// =====================
// CREATE RIDE
// =====================
function createRide() {
  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      pickup: document.getElementById("pickup").value,
      drop: document.getElementById("destination").value,
      pickupCoords: pickup,
      dropCoords: drop
    })
  }).then(loadRides);
}

// =====================
// DRIVER MODE
// =====================
function toggleDriver() {
  driverOnline = !driverOnline;

  socket.emit(driverOnline ? "driver:online" : "driver:offline", driverId);

  document.getElementById("driverToggle").innerText =
    driverOnline ? "Go OFFLINE" : "Go ONLINE";
}

// =====================
// MODE
// =====================
function setMode(m) {
  mode = m;
  document.getElementById("modeLabel").innerText = "Current: " + m.toUpperCase();
  loadRides();
}

// =====================
// STATUS UPDATE
// =====================
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  }).then(loadRides);
}

// =====================
// LOAD RIDES (CRITICAL FIX)
// =====================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(data => {
      const box = document.getElementById("rides");
      box.innerHTML = "";

      let filtered = data;

      if (mode === "driver") {
        filtered = data.filter(r =>
          r.status === "ACCEPTED" ||
          r.status === "ARRIVING" ||
          r.status === "IN_PROGRESS"
        );
      }

      if (mode === "rider") {
        filtered = data.filter(r => r.userId === userId);
      }

      filtered.forEach(r => {
        const div = document.createElement("div");
        div.className = "ride";

        div.innerHTML = `
          <b>${r.pickupText || r.pickup} → ${r.dropText || r.drop}</b><br/>
          Status: ${r.status}<br/>

          ${r.status === "ACCEPTED"
            ? `<button onclick="updateStatus('${r._id}','ARRIVING')">Start Arriving</button>`
            : ""}

          ${r.status === "ARRIVING"
            ? `<button onclick="updateStatus('${r._id}','IN_PROGRESS')">Start Ride</button>`
            : ""}

          ${r.status === "IN_PROGRESS"
            ? `<button onclick="updateStatus('${r._id}','COMPLETED')">Complete</button>`
            : ""}
        `;

        box.appendChild(div);
      });
    });
}

// =====================
// INIT
// =====================
window.onload = () => {
  initMap();
  initSocket();
  loadRides();
};

// GLOBALS
window.setMode = setMode;
window.toggleDriver = toggleDriver;
window.createRide = createRide;
window.updateStatus = updateStatus;
window.loadRides = loadRides;
