const API = "https://marketplace-app-m8ac.onrender.com";

let mode = "rider";
let driverOnline = false;

let pickup = null;
let drop = null;

// =====================
// MAP
// =====================
let map;
let driverMarkers = {};

function initMap() {
  map = L.map("map").setView([52.2297, 21.0122], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
}

// =====================
// SOCKET
// =====================
let socket;

function initSocket() {
  socket = io(API);

  socket.on("driver:move", (d) => {
    if (!driverMarkers[d.driverId]) {
      driverMarkers[d.driverId] = L.marker([d.lat, d.lng]).addTo(map);
    } else {
      driverMarkers[d.driverId].setLatLng([d.lat, d.lng]);
    }
  });

  socket.on("ride:new", loadRides);
  socket.on("ride:update", loadRides);
}

// =====================
// SEARCH (FREE Nominatim)
// =====================
async function search(q) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${q}`
  );
  return r.json();
}

// =====================
// PICKUP / DROP
// =====================
async function setPickup() {
  const q = document.getElementById("pickup").value;
  const r = await search(q);
  if (r.length) pickup = { lat: +r[0].lat, lng: +r[0].lon };
}

async function setDrop() {
  const q = document.getElementById("destination").value;
  const r = await search(q);
  if (r.length) drop = { lat: +r[0].lat, lng: +r[0].lon };
}

// =====================
// CREATE RIDE
// =====================
function createRide() {
  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "u1",
      pickup: document.getElementById("pickup").value,
      drop: document.getElementById("destination").value,
      pickupCoords: pickup,
      dropCoords: drop,
      type: "X"
    })
  });
}

// =====================
// DRIVER
// =====================
function toggleDriver() {
  driverOnline = !driverOnline;
  socket.emit(driverOnline ? "driver:online" : "driver:offline", "d1");

  document.getElementById("driverToggle").innerText =
    driverOnline ? "OFFLINE" : "ONLINE";
}

// =====================
// STATUS UPDATE
// =====================
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

// =====================
// CANCEL
// =====================
function cancelRide(id) {
  fetch(`${API}/api/ride/${id}/cancel`, { method: "PATCH" });
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

      let filtered = data;

      if (mode === "driver") {
        filtered = data.filter(r =>
          r.status === "ACCEPTED" ||
          r.status === "ARRIVING" ||
          r.status === "IN_PROGRESS"
        );
      }

      filtered.forEach(r => {
        const div = document.createElement("div");

        div.innerHTML = `
          <b>${r.pickupText || r.pickup} → ${r.dropText || r.drop}</b><br/>
          Status: ${r.status}<br/>
          Fare: ${r.fare || 0} PLN<br/>

          ${r.status === "ACCEPTED"
            ? `<button onclick="updateStatus('${r._id}','ARRIVING')">Start</button>`
            : ""}

          ${r.status === "ARRIVING"
            ? `<button onclick="updateStatus('${r._id}','IN_PROGRESS')">Drive</button>`
            : ""}

          ${r.status === "IN_PROGRESS"
            ? `<button onclick="updateStatus('${r._id}','COMPLETED')">Finish</button>`
            : ""}

          <button onclick="cancelRide('${r._id}')">Cancel</button>
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

// expose
window.createRide = createRide;
window.toggleDriver = toggleDriver;
window.updateStatus = updateStatus;
window.cancelRide = cancelRide;
window.loadRides = loadRides;
