const API = "https://marketplace-app-m8ac.onrender.com";

let socket;
let map;
let routeLine;
let driverMarker;

let pickup = null;
let drop = null;

let userId = localStorage.getItem("userId") || ("user_"+Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_"+Date.now());

// ================= INIT =================
window.onload = () => {
  initMap();
  initSocket();
  loadRides();
};

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.0647,19.9450], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  map.on("click", (e) => {
    if (!pickup) {
      pickup = e.latlng;
      document.getElementById("pickup").value = "Selected";
    } else {
      drop = e.latlng;
      document.getElementById("destination").value = "Selected";
    }
  });
}

// ================= SOCKET =================
function initSocket() {
  socket = io(API);

  socket.on("ride:new", loadRides);
  socket.on("ride:update", loadRides);

  socket.on("driver:move", (data) => {
    if (!driverMarker) {
      driverMarker = L.marker([data.lat, data.lng]).addTo(map);
    } else {
      driverMarker.setLatLng([data.lat, data.lng]);
    }
  });
}

// ================= CREATE =================
function createRide() {
  fetch(`${API}/api/ride`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      pickup:"Pickup",
      destination:"Drop",
      pickupCoords: pickup,
      dropCoords: drop,
      userId
    })
  });
}

// ================= LOAD =================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r=>r.json())
    .then(data=>{
      renderRider(data);
      renderDriver(data);

      if (data[0]?.route) drawRoute(data[0].route);
    });
}

// ================= ROUTE DRAW =================
function drawRoute(coords) {
  if (routeLine) map.removeLayer(routeLine);

  const latlngs = coords.map(c => [c[1], c[0]]);

  routeLine = L.polyline(latlngs).addTo(map);
}

// ================= RIDER =================
function renderRider(rides) {
  const box = document.getElementById("riderRides");
  box.innerHTML = "";

  rides.filter(r=>r.userId===userId).forEach(r=>{
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

  rides.forEach(r=>{
    if (r.status==="REQUESTED") {
      box.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          ${r.fare} PLN<br/>
          <button onclick="acceptRide('${r._id}')">Accept</button>
        </div>
      `;
    }

    if (r.driverId===driverId) {
      box.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          Status: ${r.status}<br/>
          <button onclick="updateStatus('${r._id}','ARRIVING')">Arriving</button>
          <button onclick="updateStatus('${r._id}','IN_PROGRESS')">Start</button>
          <button onclick="updateStatus('${r._id}','COMPLETED')">Complete</button>
        </div>
      `;
    }
  });
}

// ================= ACTIONS =================
function acceptRide(id) {
  fetch(`${API}/api/ride/${id}/accept`, {
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({driverId})
  });
}

function updateStatus(id,status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({status})
  });
}
