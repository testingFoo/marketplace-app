const API = "https://marketplace-app-m8ac.onrender.com";

let socket;
let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

let pickup = null;
let drop = null;
let map;
let routeLine;

// ================= INIT =================
window.onload = () => {
  socket = io(API);

  initMap();

  socket.on("ride:update", loadRides);

  socket.on("ride:request", (ride) => {
    showDriverRequest(ride);
  });

  loadRides();
};

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.0647, 19.945], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    .addTo(map);

  map.on("click", (e) => {
    if (!pickup) {
      pickup = e.latlng;
      document.getElementById("pickup").value =
        `${pickup.lat}, ${pickup.lng}`;
    } else {
      drop = e.latlng;
      document.getElementById("destination").value =
        `${drop.lat}, ${drop.lng}`;
    }
  });
}

// ================= CREATE =================
function createRide() {
  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      pickup: document.getElementById("pickup").value,
      destination: document.getElementById("destination").value,
      pickupCoords: pickup,
      dropCoords: drop,
      userId
    })
  });
}

// ================= DRIVER REQUEST =================
function showDriverRequest(r) {
  const box = document.getElementById("driverRides");

  box.innerHTML = `
    <div class="ride">
      🚨 NEW REQUEST<br/>
      ${r.pickup} → ${r.destination}<br/>
      Fare: ${r.fare} PLN<br/>
      <button onclick="acceptRide('${r._id}')">Accept</button>
    </div>
  `;
}

// ================= ACCEPT =================
function acceptRide(id) {
  fetch(`${API}/api/ride/${id}/accept`, {
    method: "PATCH",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ driverId })
  });
}

// ================= LOAD =================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(rides => {
      renderRider(rides);
      renderDriver(rides);
    });
}

// ================= RIDER =================
function renderRider(rides) {
  const box = document.getElementById("riderRides");
  box.innerHTML = "";

  rides.filter(r => r.userId === userId)
    .forEach(r => {
      box.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          Status: ${r.status}<br/>
          Fare: ${r.fare} PLN
        </div>
      `;

      if (r.route) drawRoute(r.route.coords);
    });
}

// ================= DRIVER =================
function renderDriver(rides) {
  const box = document.getElementById("driverRides");

  rides.forEach(r => {
    if (r.driverId === driverId) {
      box.innerHTML = `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          Status: ${r.status}<br/>

          ${r.status === "ACCEPTED"
            ? `<button onclick="updateStatus('${r._id}','IN_PROGRESS')">Start</button>`
            : ""}

          ${r.status === "IN_PROGRESS"
            ? `<button onclick="updateStatus('${r._id}','COMPLETED')">Complete</button>`
            : ""}
        </div>
      `;
    }
  });
}

// ================= STATUS =================
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ status })
  });
}

// ================= ROUTE =================
function drawRoute(coords) {
  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline(
    coords.map(c => [c[1], c[0]])
  ).addTo(map);
}

// ================= DRIVER ONLINE =================
function toggleDriver() {
  socket.emit("driver:online", driverId);

  setInterval(() => {
    socket.emit("driver:location", {
      driverId,
      lat: 50.06 + Math.random() * 0.01,
      lng: 19.94 + Math.random() * 0.01
    });
  }, 2000);
}

window.createRide = createRide;
window.acceptRide = acceptRide;
window.updateStatus = updateStatus;
window.toggleDriver = toggleDriver;
