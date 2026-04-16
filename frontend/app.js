const API = "https://marketplace-app-m8ac.onrender.com";

// ================= STATE =================
let socket;
let map;

let userId = localStorage.getItem("userId") || ("user_" + Date.now());
localStorage.setItem("userId", userId);

let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());
localStorage.setItem("driverId", driverId);

let driverOnline = false;

// ================= INIT =================
window.onload = () => {
  initSocket();
  initMap();
  loadRides();
};

// ================= SOCKET =================
function initSocket() {
  socket = io(API);

  socket.on("ride:new", () => loadRides());
  socket.on("ride:update", () => loadRides());
}

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([52.2297, 21.0122], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OSM"
  }).addTo(map);
}

// ================= CREATE RIDE =================
function createRide() {
  const pickup = document.getElementById("pickup").value;
  const destination = document.getElementById("destination").value;

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickup, destination, userId })
  }).then(loadRides);
}

// ================= DRIVER TOGGLE =================
function toggleDriver() {
  driverOnline = !driverOnline;

  socket.emit(driverOnline ? "driver:online" : "driver:offline", driverId);

  document.getElementById("driverStatus").innerText =
    driverOnline ? "Online" : "Offline";
}

// ================= LOAD RIDES =================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(rides => {

      renderRider(rides);
      renderDriver(rides);
    });
}

// ================= RIDER VIEW =================
function renderRider(rides) {
  const box = document.getElementById("riderRides");
  box.innerHTML = "";

  rides
    .filter(r => r.userId === userId)
    .forEach(r => {
      const div = document.createElement("div");
      div.className = "ride";

      div.innerHTML = `
        <b>${r.pickup} → ${r.destination}</b><br/>
        Status: ${r.status}<br/>
        Driver: ${r.driverId || "NONE"}<br/>
      `;

      box.appendChild(div);
    });
}

// ================= DRIVER VIEW =================
function renderDriver(rides) {
  const box = document.getElementById("driverRides");
  box.innerHTML = "";

  const driverRides = rides.filter(r =>
    r.status === "REQUESTED" ||
    r.driverId === driverId
  );

  driverRides.forEach(r => {
    const div = document.createElement("div");
    div.className = "ride";

    div.innerHTML = `
      <b>${r.pickup} → ${r.destination}</b><br/>
      Status: ${r.status}<br/>
      User: ${r.userId}<br/>
      Driver: ${r.driverId || "UNASSIGNED"}<br/>

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
}

// ================= STATUS UPDATE =================
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  }).then(loadRides);
}

// ================= GLOBALS =================
window.createRide = createRide;
window.toggleDriver = toggleDriver;
window.updateStatus = updateStatus;
