const API = "https://marketplace-app-m8ac.onrender.com";

let mode = "rider";
let driverOnline = false;

let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

localStorage.setItem("userId", userId);
localStorage.setItem("driverId", driverId);

// =====================
// STATE
// =====================
let map;
let socket;
let currentRide = null;
let routeLine = null;

// =====================
// LOG
// =====================
function log(msg) {
  const el = document.getElementById("log");
  if (el) el.innerText += msg + "\n";
}

// =====================
// MAP
// =====================
function initMap() {
  map = L.map("map").setView([52.2297, 21.0122], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
  }).addTo(map);
}

// =====================
// DRAW ROUTE
// =====================
function drawRoute(coords) {
  if (!map || !coords) return;

  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline(
    coords.map(c => [c[1], c[0]]),
    { color: "blue" }
  ).addTo(map);
}

// =====================
// SOCKET
// =====================
function initSocket() {
  socket = io(API);

  socket.on("ride:new", ({ ride, route }) => {
    currentRide = ride;
    if (route) drawRoute(route.coords);
    loadRides();
  });

  socket.on("ride:update", (ride) => {
    if (currentRide && currentRide._id === ride._id) {
      currentRide = ride;
    }
    loadRides();
  });
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
// DRIVER
// =====================
function toggleDriver() {
  driverOnline = !driverOnline;

  socket.emit(driverOnline ? "driver:online" : "driver:offline", driverId);

  document.getElementById("driverToggle").innerText =
    driverOnline ? "Go OFFLINE" : "Go ONLINE";
}

// =====================
// CREATE RIDE
// =====================
function createRide() {
  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pickup: document.getElementById("pickup").value,
      destination: document.getElementById("destination").value,
      userId
    })
  });
}

// =====================
// STATUS FLOW FIX
// =====================
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

// =====================
// LOAD RIDES (FIX DRIVER VIEW)
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
          r.driverId === driverId || r.status === "ACCEPTED"
        );
      }

      if (mode === "rider") {
        filtered = data.filter(r => r.userId === userId);
      }

      filtered.forEach(r => {
        const div = document.createElement("div");

        div.innerHTML = `
          <b>${r.pickup} → ${r.destination}</b><br/>
          Status: ${r.status}<br/>

          ${r.driverId === driverId && r.status === "ACCEPTED"
            ? `<button onclick="updateStatus('${r._id}','ARRIVING')">Arriving</button>`
            : ""}

          ${r.driverId === driverId && r.status === "ARRIVING"
            ? `<button onclick="updateStatus('${r._id}','IN_PROGRESS')">Start</button>`
            : ""}

          ${r.driverId === driverId && r.status === "IN_PROGRESS"
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

// =====================
// EXPORTS
// =====================
window.setMode = setMode;
window.toggleDriver = toggleDriver;
window.createRide = createRide;
window.updateStatus = updateStatus;
