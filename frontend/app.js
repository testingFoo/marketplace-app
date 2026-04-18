const API = "https://marketplace-app-m8ac.onrender.com";

let socket;
let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

let pickup = null;
let drop = null;

let map;
let routeLine;
let driverMarker;

// ================= INIT =================
window.onload = () => {
  initMap();

  socket = io(API);

  socket.on("ride:new", (data) => {
    console.log("🚕 NEW RIDE:", data);
    if (data.route) drawRoute(data.route);
    loadRides();
  });

  socket.on("ride:update", (ride) => {
    console.log("🔄 UPDATE:", ride);
    loadRides();
  });

  loadRides();
};

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.0647, 19.9450], 13); // Krakow

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
function drawRoute(route) {
  if (!route || !route.coords) return;

  if (routeLine) map.removeLayer(routeLine);

  const latlngs = route.coords.map(c => [c[1], c[0]]);

  routeLine = L.polyline(latlngs, { color: "blue" }).addTo(map);

  map.fitBounds(routeLine.getBounds());

  animateDriver(latlngs);
}

// ================= DRIVER ANIMATION =================
function animateDriver(coords) {
  if (!coords || coords.length < 2) return;

  let i = 0;

  if (driverMarker) map.removeLayer(driverMarker);

  driverMarker = L.marker(coords[0]).addTo(map);

  const interval = setInterval(() => {
    if (i >= coords.length) {
      clearInterval(interval);
      return;
    }

    driverMarker.setLatLng(coords[i]);
    i++;
  }, 120);
}

// ================= CREATE =================
function createRide() {
  if (!pickup || !drop) {
    alert("Select pickup & drop");
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

  rides
    .filter(r => r.userId === userId)
    .forEach(r => {
      box.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          Status: <b>${r.status}</b><br/>
          Fare: ${r.fare} PLN<br/>
          Driver: ${r.driverId || "Searching..."}<br/>

          ${r.status === "ACCEPTED" ? "🚗 Driver on the way" : ""}
          ${r.status === "ARRIVING" ? "📍 Driver arrived" : ""}
          ${r.status === "IN_PROGRESS" ? "🟢 Trip started" : ""}
          ${r.status === "COMPLETED" ? "✅ Trip completed" : ""}

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

    // 🔥 SHOW REQUESTED RIDES (FIXED BUG)
    if (r.status === "REQUESTED") {
      box.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          Fare: ${r.fare} PLN<br/>
          <button onclick="acceptRide('${r._id}')">Accept</button>
        </div>
      `;
    }

    // DRIVER ACTIVE RIDE
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

// ================= GLOBAL =================
window.createRide = createRide;
window.acceptRide = acceptRide;
window.updateStatus = updateStatus;
window.cancelRide = cancelRide;
