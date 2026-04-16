const API = "https://marketplace-app-m8ac.onrender.com";

let mode = "rider";
let driverOnline = false;

let pickup = null;
let drop = null;

let map;
let routeLine;

let userId = localStorage.getItem("userId") || ("user_" + Date.now());
localStorage.setItem("userId", userId);

let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());
localStorage.setItem("driverId", driverId);

// =====================
function log(msg) {
  const el = document.getElementById("log");
  if (el) el.innerText += msg + "\n";
}

// =====================
function initMap() {
  map = L.map("map").setView([52.2297, 21.0122], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OSM"
  }).addTo(map);
}

// =====================
let socket;

function initSocket() {
  socket = io(API);

  socket.on("ride:new", (data) => {
    log("🚕 new ride");

    if (data.route) drawRoute(data.route.coords);

    loadRides();
  });

  socket.on("ride:update", loadRides);
}

// =====================
function drawRoute(coords) {
  if (routeLine) routeLine.remove();

  routeLine = L.polyline(
    coords.map(c => [c[1], c[0]]),
    { color: "blue" }
  ).addTo(map);
}

// =====================
function setMode(m) {
  mode = m;
  document.getElementById("modeLabel").innerText =
    "Current: " + mode.toUpperCase();
  loadRides();
}

// =====================
function toggleDriver() {
  driverOnline = !driverOnline;
  socket.emit(driverOnline ? "driver:online" : "driver:offline", driverId);
}

// =====================
function acceptRide(id) {
  fetch(`${API}/api/ride/${id}/accept`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId })
  }).then(loadRides);
}

// =====================
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  }).then(loadRides);
}

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
  }).then(loadRides);
}

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
          r.status === "REQUESTED" ||
          r.driverId === driverId
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
          Driver: ${r.driverId || "none"}<br/>

          ${mode === "driver" && r.status === "REQUESTED"
            ? `<button onclick="acceptRide('${r._id}')">ACCEPT</button>`
            : ""}

          ${r.status === "ACCEPTED" && r.driverId === driverId
            ? `<button onclick="updateStatus('${r._id}','ARRIVING')">ARRIVING</button>`
            : ""}

          ${r.status === "ARRIVING" && r.driverId === driverId
            ? `<button onclick="updateStatus('${r._id}','IN_PROGRESS')">START</button>`
            : ""}

          ${r.status === "IN_PROGRESS" && r.driverId === driverId
            ? `<button onclick="updateStatus('${r._id}','COMPLETED')">COMPLETE</button>`
            : ""}
        `;

        box.appendChild(div);
      });
    });
}

// =====================
window.onload = () => {
  initMap();
  initSocket();
  loadRides();
};

// =====================
// GLOBAL EXPORTS
// =====================
window.setMode = setMode;
window.toggleDriver = toggleDriver;
window.updateStatus = updateStatus;
window.acceptRide = acceptRide;
window.createRide = createRide;
window.checkBackend = checkBackend;
window.loadRides = loadRides;
window.handlePickupSearch = handlePickupSearch;
window.handleDropSearch = handleDropSearch;
