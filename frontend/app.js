const API = "https://marketplace-app-m8ac.onrender.com";

let socket;
let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

let pickup = null;
let drop = null;
let driverOnline = false;
let driverInterval = null;

let map;
let routeLine = null;

// ================= INIT =================
window.onload = () => {
  socket = io(API);

  socket.on("ride:new", (data) => {
    if (data.route && data.route.geometry) {
      drawRoute(data.route.geometry.coordinates);
    }
    loadRides();
  });

  socket.on("ride:update", loadRides);

  initMap();
  loadRides();
};

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.061, 19.938], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    .addTo(map);

  map.on("click", (e) => {
    const { lat, lng } = e.latlng;

    if (!pickup) {
      pickup = { lat, lng };
      document.getElementById("pickup").value =
        `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } else {
      drop = { lat, lng };
      document.getElementById("destination").value =
        `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  });
}

// ================= ROUTE =================
function drawRoute(coords) {
  if (!map || !coords) return;

  if (routeLine) map.removeLayer(routeLine);

  const latlngs = coords.map(c => [c[1], c[0]]);
  routeLine = L.polyline(latlngs).addTo(map);
}

// ================= CREATE =================
function createRide() {
  if (!pickup || !drop) return alert("Select pickup & drop");

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

// ================= DRIVER =================
function toggleDriver() {
  driverOnline = !driverOnline;

  if (!socket) return;

  if (driverOnline) {
    socket.emit("driver:online", driverId);

    let lat = 50.061;
    let lng = 19.938;

    driverInterval = setInterval(() => {
      lat += (Math.random() - 0.5) * 0.001;
      lng += (Math.random() - 0.5) * 0.001;

      socket.emit("driver:location", { driverId, lat, lng });
    }, 2000);

  } else {
    socket.emit("driver:offline", driverId);
    clearInterval(driverInterval);
  }
}

// ================= ACCEPT =================
function acceptRide(id) {
  fetch(`${API}/api/ride/${id}/accept`, {
    method: "PATCH",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ driverId })
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

// ================= CANCEL =================
function cancelRide(id) {
  fetch(`${API}/api/ride/${id}/cancel`, {
    method: "PATCH"
  });
}

// ================= LOAD =================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(data => {
      renderRider(data);
      renderDriver(data);
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
          <b>${r.pickup} → ${r.destination}</b><br/>
          Status: ${r.status}<br/>
          💰 ${r.fare} PLN<br/>
          ⏱ ${Math.round(r.duration/60)} min<br/>

          ${r.status !== "COMPLETED" && r.status !== "CANCELLED"
            ? `<button onclick="cancelRide('${r._id}')">Cancel</button>`
            : ""}
        </div>
      `;
    });
}

// ================= DRIVER =================
function renderDriver(rides) {
  const box = document.getElementById("driverRides");
  box.innerHTML = "";

  rides.forEach(r => {

    if (r.status === "REQUESTED") {
      box.innerHTML += `
        <div class="ride">
          <b>${r.pickup} → ${r.destination}</b><br/>
          💰 ${r.fare} PLN<br/>
          <button onclick="acceptRide('${r._id}')">Accept</button>
        </div>
      `;
    }

    if (r.driverId === driverId) {
      box.innerHTML += `
        <div class="ride">
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
        </div>
      `;
    }

  });
}

// ================= GLOBAL =================
window.createRide = createRide;
window.acceptRide = acceptRide;
window.updateStatus = updateStatus;
window.cancelRide = cancelRide;
window.toggleDriver = toggleDriver;
