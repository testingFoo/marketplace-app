const API = "https://marketplace-app-m8ac.onrender.com";

let socket;
let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

let pickup = null;
let drop = null;

let map;
let driverMarker = null;
let routeLine = null;

let driverOnline = false;
let currentRoute = [];
let routeIndex = 0;

// ================= INIT =================
window.onload = () => {
  initMap();

  socket = io(API);

  socket.on("ride:new", (data) => {
    if (data.route) {
      drawRoute(data.route.coords);
    }
    loadRides();
  });

  socket.on("ride:update", loadRides);

  socket.on("driver:move", updateDriverMarker);

  loadRides();
};

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.0647, 19.9450], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
  }).addTo(map);

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

// ================= DRAW ROUTE =================
function drawRoute(coords) {
  if (!coords || coords.length === 0) return;

  // convert [lng, lat] → [lat, lng]
  const latlngs = coords.map(c => [c[1], c[0]]);

  if (routeLine) {
    map.removeLayer(routeLine);
  }

  routeLine = L.polyline(latlngs).addTo(map);

  map.fitBounds(routeLine.getBounds());

  // store for driver movement
  currentRoute = latlngs;
  routeIndex = 0;
}

// ================= DRIVER TOGGLE =================
function toggleDriver() {
  driverOnline = !driverOnline;

  document.getElementById("driverStatus").innerText =
    driverOnline ? "🟢 ONLINE" : "🔴 OFFLINE";

  if (driverOnline) {
    socket.emit("driver:online", driverId);
    startRouteDriving();
  } else {
    socket.emit("driver:offline", driverId);
  }
}

// ================= DRIVER ROUTE MOVEMENT =================
function startRouteDriving() {
  setInterval(() => {
    if (!driverOnline || currentRoute.length === 0) return;

    if (routeIndex >= currentRoute.length) return;

    const [lat, lng] = currentRoute[routeIndex];

    socket.emit("driver:location", {
      driverId,
      lat,
      lng
    });

    routeIndex++;
  }, 1000); // smooth movement
}

// ================= DRIVER MARKER =================
function updateDriverMarker(data) {
  const { lat, lng } = data;

  if (!driverMarker) {
    driverMarker = L.marker([lat, lng]).addTo(map);
  } else {
    driverMarker.setLatLng([lat, lng]);
  }
}

// ================= CREATE RIDE =================
function createRide() {
  if (!pickup || !drop) {
    alert("Select pickup/drop");
    return;
  }

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

// ================= DRIVER ACTIONS =================
function acceptRide(id) {
  fetch(`${API}/api/ride/${id}/accept`, {
    method: "PATCH",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ driverId })
  });
}

function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ status })
  });
}

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
          ${r.pickup} → ${r.destination}<br/>
          Status: ${r.status}<br/>
          Fare: ${r.fare} PLN<br/>
          Driver: ${r.driverId || "Searching..."}<br/>

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
          ${r.pickup} → ${r.destination}<br/>
          Fare: ${r.fare} PLN<br/>
          <button onclick="acceptRide('${r._id}')">Accept</button>
        </div>
      `;
    }

    if (r.driverId === driverId) {
      box.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
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

// ================= EXPORT =================
window.createRide = createRide;
window.acceptRide = acceptRide;
window.updateStatus = updateStatus;
window.cancelRide = cancelRide;
window.toggleDriver = toggleDriver;
