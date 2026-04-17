const API = "https://marketplace-app-m8ac.onrender.com";

let socket;
let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

let pickup = null;
let drop = null;

let map, routeLine;

// ================= INIT =================
window.onload = () => {
  socket = io(API);

  socket.on("ride:new", (data) => {
    if (data.route) drawRoute(data.route.geometry.coordinates);
    loadRides();
  });

  socket.on("ride:update", loadRides);

  initMap();
  loadRides();
};

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.0647, 19.9450], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    .addTo(map);

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

// ================= ROUTE =================
function drawRoute(coords) {
  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline(
    coords.map(c => [c[1], c[0]])
  ).addTo(map);
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
            ? `<button onclick="updateStatus('${r._id}','ARRIVING')">Arriving</button>` : ""}

          ${r.status === "ARRIVING"
            ? `<button onclick="updateStatus('${r._id}','IN_PROGRESS')">Start</button>` : ""}

          ${r.status === "IN_PROGRESS"
            ? `<button onclick="updateStatus('${r._id}','COMPLETED')">Complete</button>` : ""}
        </div>
      `;
    }

  });
}

// ================= DRIVER ONLINE =================
function toggleDriver() {
  if (!socket) return;

  socket.emit("driver:online", driverId);
  alert("Driver ONLINE");
}

window.createRide = createRide;
window.acceptRide = acceptRide;
window.updateStatus = updateStatus;
window.toggleDriver = toggleDriver;
