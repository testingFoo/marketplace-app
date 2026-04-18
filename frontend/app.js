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
    drawRoute(data.route);
    animateDriver(data.route);
    loadRides();
  });

  socket.on("ride:update", loadRides);

  loadRides();
};

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.0647, 19.9450], 13); // Krakow

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
  }).addTo(map);

  map.on("click", async (e) => {
    const { lat, lng } = e.latlng;

    const address = await reverseGeocode(lat, lng);

    if (!pickup) {
      pickup = { lat, lng };
      document.getElementById("pickup").value = address;
    } else {
      drop = { lat, lng };
      document.getElementById("destination").value = address;
    }
  });
}

// ================= REVERSE GEOCODE =================
async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );

  const data = await res.json();
  return data.display_name || `${lat}, ${lng}`;
}

// ================= SEARCH =================
async function searchAddress(inputId) {
  const q = document.getElementById(inputId).value;

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${q}`
  );

  const data = await res.json();

  if (data.length === 0) return;

  const r = data[0];

  const coords = {
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon)
  };

  map.setView([coords.lat, coords.lng], 14);

  if (inputId === "pickup") pickup = coords;
  if (inputId === "destination") drop = coords;

  document.getElementById(inputId).value = r.display_name;
}

// ================= CREATE =================
function createRide() {
  if (!pickup || !drop) return alert("Select pickup/drop");

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

// ================= ROUTE DRAW =================
function drawRoute(route) {
  if (!route) return;

  if (routeLine) map.removeLayer(routeLine);

  const latlngs = route.coords.map(c => [c[1], c[0]]);

  routeLine = L.polyline(latlngs).addTo(map);

  map.fitBounds(routeLine.getBounds());
}

// ================= DRIVER ANIMATION =================
function animateDriver(route) {
  if (!route) return;

  const coords = route.coords;

  let i = 0;

  if (driverMarker) map.removeLayer(driverMarker);

  driverMarker = L.marker([coords[0][1], coords[0][0]]).addTo(map);

  const interval = setInterval(() => {
    if (i >= coords.length) {
      clearInterval(interval);
      return;
    }

    const [lng, lat] = coords[i];
    driverMarker.setLatLng([lat, lng]);

    i++;
  }, 200); // smooth speed
}

// ================= DRIVER =================
function toggleDriver() {
  fetch(`${API}/api/driver/toggle`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ driverId })
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
          ETA: ${Math.round(r.duration/60)} min<br/>
          Driver: ${r.driverId || "Searching..."}<br/>
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

// ================= ACTIONS =================
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

// ================= GLOBAL =================
window.createRide = createRide;
window.acceptRide = acceptRide;
window.updateStatus = updateStatus;
window.toggleDriver = toggleDriver;
window.searchPickup = () => searchAddress("pickup");
window.searchDrop = () => searchAddress("destination");
