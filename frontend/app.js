const API = "https://marketplace-app-m8ac.onrender.com";

let mode = "rider";
let driverOnline = false;

let userId = localStorage.getItem("userId") || ("user_" + Date.now());
localStorage.setItem("userId", userId);

let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());
localStorage.setItem("driverId", driverId);

// =====================
// SOCKET
// =====================
let socket = io(API);

// =====================
// MAP
// =====================
let map;
let markers = {};

// =====================
// INIT MAP
// =====================
function initMap() {
  map = L.map("map").setView([52.2297, 21.0122], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
  }).addTo(map);
}

// =====================
// DRIVER MOVEMENT (SIMULATION)
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
// SOCKET EVENTS
// =====================
socket.on("driver:move", (data) => {
  const { driverId: id, lat, lng } = data;

  if (!map) return;

  if (!markers[id]) {
    markers[id] = L.marker([lat, lng]).addTo(map);
  } else {
    markers[id].setLatLng([lat, lng]);
  }
});

socket.on("ride:new", loadRides);
socket.on("ride:update", loadRides);

// =====================
// MODE
// =====================
function setMode(m) {
  mode = m;
  updateModeLabel();
  loadRides();
}

// =====================
// MODE LABEL
// =====================
function updateModeLabel() {
  const el = document.getElementById("modeLabel");
  if (el) el.innerText = "Current: " + mode.toUpperCase();
}

// =====================
// DRIVER TOGGLE
// =====================
function toggleDriver() {
  driverOnline = !driverOnline;

  if (driverOnline) {
    socket.emit("driver:online", driverId);
    startDriverMovement();
  } else {
    socket.emit("driver:offline", driverId);
  }

  document.getElementById("driverToggle").innerText =
    driverOnline ? "Go OFFLINE" : "Go ONLINE";
}

// =====================
// CREATE RIDE
// =====================
function createRide() {
  const pickup = document.getElementById("pickup").value;
  const destination = document.getElementById("destination").value;

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickup, destination, userId })
  }).then(loadRides);
}

// =====================
// UPDATE STATUS
// =====================
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  }).then(loadRides);
}

// =====================
// LOAD RIDES
// =====================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(res => res.json())
    .then(data => {
      const box = document.getElementById("rides");
      box.innerHTML = "";

      let filtered = data;

      if (mode === "driver") {
        filtered = data.filter(r =>
          r.status === "REQUESTED" || r.driverId === driverId
        );
      }

      if (mode === "rider") {
        filtered = data.filter(r => r.userId === userId);
      }

      filtered.forEach(r => {
        const div = document.createElement("div");
        div.className = "ride";

        div.innerHTML = `
          <b>${r.pickup} → ${r.destination}</b><br/>
          Status: ${r.status}<br/>

          ${r.status === "ACCEPTED"
            ? `<button onclick="updateStatus('${r._id}', 'ARRIVING')">Arriving</button>`
            : ""}

          ${r.status === "ARRIVING"
            ? `<button onclick="updateStatus('${r._id}', 'IN_PROGRESS')">Start</button>`
            : ""}

          ${r.status === "IN_PROGRESS"
            ? `<button onclick="updateStatus('${r._id}', 'COMPLETED')">Complete</button>`
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
  updateModeLabel();
  loadRides();
};

// =====================
// GLOBALS
// =====================
window.setMode = setMode;
window.toggleDriver = toggleDriver;
window.createRide = createRide;
window.updateStatus = updateStatus;
window.checkBackend = checkBackend;
window.createRide = createRide;
window.loadRides = loadRides;

