const API = "https://marketplace-app-m8ac.onrender.com";

// =====================
// STATE
// =====================
let socket;

let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

let pickup = null;
let drop = null;

let map;
let routeLine;
let driverMarker;

// =====================
// INIT
// =====================
window.onload = () => {
  initMap();
  initSocket();
  loadRides();
  setupAutocomplete();
};

// =====================
// SOCKET
// =====================
function initSocket() {
  socket = io(API);

  socket.on("ride:new", (data) => {
    if (data.route) drawRoute(data.route.coords);
    loadRides();
  });

  socket.on("ride:update", (ride) => {
    loadRides();
  });

  socket.on("driver:move", (data) => {
    moveDriverMarker(data.lat, data.lng);
  });
}

// =====================
// MAP
// =====================
function initMap() {
  map = L.map("map").setView([50.0647, 19.9450], 13); // Krakow

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
  }).addTo(map);
}

// =====================
// ROUTE DRAW
// =====================
function drawRoute(coords) {
  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline(
    coords.map(c => [c[1], c[0]]),
    { color: "blue", weight: 4 }
  ).addTo(map);

  map.fitBounds(routeLine.getBounds());

  animateDriver(coords);
}

// =====================
// DRIVER ANIMATION (REAL FIX)
// =====================
function animateDriver(coords) {
  if (driverMarker) map.removeLayer(driverMarker);

  let i = 0;

  driverMarker = L.marker([coords[0][1], coords[0][0]]).addTo(map);

  function move() {
    if (i >= coords.length) return;

    const [lng, lat] = coords[i];
    driverMarker.setLatLng([lat, lng]);

    if (socket) {
      socket.emit("driver:location", {
        driverId,
        lat,
        lng
      });
    }

    i++;
    setTimeout(move, 200); // smooth motion
  }

  move();
}

// =====================
// DRIVER MARKER UPDATE
// =====================
function moveDriverMarker(lat, lng) {
  if (!driverMarker) {
    driverMarker = L.marker([lat, lng]).addTo(map);
  } else {
    driverMarker.setLatLng([lat, lng]);
  }
}

// =====================
// AUTOCOMPLETE (FREE)
// =====================
function setupAutocomplete() {
  setupInput("pickup", (coords, label) => {
    pickup = coords;
  });

  setupInput("destination", (coords, label) => {
    drop = coords;
  });
}

function setupInput(id, callback) {
  const input = document.getElementById(id);

  const dropdown = document.createElement("div");
  dropdown.style.border = "1px solid #ccc";
  dropdown.style.background = "white";
  dropdown.style.position = "absolute";
  dropdown.style.zIndex = "1000";
  dropdown.style.width = "250px";

  input.parentNode.appendChild(dropdown);

  input.addEventListener("input", async () => {
    const q = input.value;
    if (q.length < 3) {
      dropdown.innerHTML = "";
      return;
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${q}`
    );
    const data = await res.json();

    dropdown.innerHTML = "";

    data.slice(0, 5).forEach(place => {
      const item = document.createElement("div");
      item.innerText = place.display_name;
      item.style.padding = "5px";
      item.style.cursor = "pointer";

      item.onclick = () => {
        input.value = place.display_name;
        dropdown.innerHTML = "";

        callback(
          {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon)
          },
          place.display_name
        );

        map.setView([place.lat, place.lon], 15);
      };

      dropdown.appendChild(item);
    });
  });
}

// =====================
// CREATE RIDE
// =====================
function createRide() {
  if (!pickup || !drop) {
    alert("Select pickup & destination");
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

// =====================
// DRIVER ACTIONS
// =====================
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

// =====================
// LOAD RIDES
// =====================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(data => {
      renderRider(data);
      renderDriver(data);
    });
}

// =====================
// RIDER UI
// =====================
function renderRider(rides) {
  const box = document.getElementById("riderRides");
  if (!box) return;

  box.innerHTML = "";

  rides
    .filter(r => r.userId === userId)
    .forEach(r => {
      box.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          Status: ${r.status}<br/>
          Fare: ${r.fare || 0} PLN<br/>
          ETA: ${r.duration ? Math.round(r.duration/60) : "-"} min<br/>
          Driver: ${r.driverId || "Searching..."}<br/>

          ${r.status !== "COMPLETED" && r.status !== "CANCELLED"
            ? `<button onclick="cancelRide('${r._id}')">Cancel</button>`
            : ""}
        </div>
      `;
    });
}

// =====================
// DRIVER UI
// =====================
function renderDriver(rides) {
  const box = document.getElementById("driverRides");
  if (!box) return;

  box.innerHTML = "";

  rides.forEach(r => {

    // NEW RIDES
    if (r.status === "REQUESTED") {
      box.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          💰 ${r.fare || 0} PLN<br/>
          <button onclick="acceptRide('${r._id}')">Accept</button>
        </div>
      `;
    }

    // MY RIDES
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

// =====================
// EXPORT GLOBALS
// =====================
window.createRide = createRide;
window.acceptRide = acceptRide;
window.updateStatus = updateStatus;
window.cancelRide = cancelRide;
