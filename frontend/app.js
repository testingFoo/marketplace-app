const API = "https://marketplace-app-m8ac.onrender.com";
const MAPBOX_TOKEN = "pk.eyJ1IjoibWFwZnVycWFuIiwiYSI6ImNtbzRoMGdnbjEzZXkydnF3MWFhN2t5aWcifQ.A7GlM3WDlLWHBl6lQCHKEA";

let socket;
let map;
let routeLine;

let pickup = null;
let drop = null;

let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

let driverMarkers = {};
let simInterval;

// ================= INIT =================
window.onload = () => {
  initMap();
  initSocket();
  setupAutocomplete("pickup");
  setupAutocomplete("destination");
  loadRides();
};

// ================= SOCKET =================
function initSocket() {
  socket = io(API);

  socket.on("ride:new", loadRides);
  socket.on("ride:update", loadRides);

  socket.on("driver:location:update", (data) => {
    const { driverId, lat, lng } = data;

    if (!driverMarkers[driverId]) {
      driverMarkers[driverId] = L.marker([lat, lng]).addTo(map);
    } else {
      driverMarkers[driverId].setLatLng([lat, lng]);
    }
  });
}

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.0647, 19.9450], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
}

// ================= MAPBOX =================
async function searchAddress(q) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`
  );
  const data = await res.json();
  return data.features || [];
}

// ================= AUTOCOMPLETE =================
function setupAutocomplete(id) {
  const input = document.getElementById(id);
  const list = document.createElement("div");
  list.className = "suggestions";
  input.parentElement.appendChild(list);

  let timer;

  input.addEventListener("input", () => {
    clearTimeout(timer);

    if (input.value.length < 3) return;

    timer = setTimeout(async () => {
      const results = await searchAddress(input.value);
      list.innerHTML = "";

      results.forEach(r => {
        const div = document.createElement("div");
        div.innerText = r.place_name;

        div.onclick = () => {
          input.value = r.place_name;

          const coords = {
            lng: r.center[0],
            lat: r.center[1]
          };

          if (id === "pickup") pickup = coords;
          if (id === "destination") drop = coords;

          list.innerHTML = "";

          L.marker([coords.lat, coords.lng]).addTo(map);

          if (pickup && drop) drawRoute();
        };

        list.appendChild(div);
      });
    }, 300);
  });
}

// ================= ROUTE =================
async function drawRoute() {
  const res = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
  );

  const data = await res.json();
  const coords = data.routes[0].geometry.coordinates;

  const path = coords.map(c => [c[1], c[0]]);

  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline(path, { color: "blue" }).addTo(map);
  map.fitBounds(routeLine.getBounds());
}

// ================= CREATE RIDE =================
function createRide() {
  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pickup: "A",
      destination: "B",
      pickupCoords: pickup,
      dropCoords: drop,
      userId
    })
  });
}

// ================= DRIVER FLOW =================
function acceptRide(id) {
  fetch(`${API}/api/ride/${id}/accept`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId })
  });

  startDriverSimulation();
}

// ================= LIVE DRIVER SIM =================
function startDriverSimulation() {
  let lat = 50.0647;
  let lng = 19.9450;

  if (simInterval) clearInterval(simInterval);

  simInterval = setInterval(() => {
    lat += (Math.random() - 0.5) * 0.002;
    lng += (Math.random() - 0.5) * 0.002;

    socket.emit("driver:location", {
      driverId,
      lat,
      lng
    });
  }, 2000);
}

// ================= STATUS FLOW =================
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

// ================= LOAD =================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(render);
}

// ================= RENDER =================
function render(rides) {
  const rider = document.getElementById("riderRides");
  const driver = document.getElementById("driverRides");

  rider.innerHTML = "";
  driver.innerHTML = "";

  rides.forEach(r => {

    if (r.userId === userId) {
      rider.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          ${r.status}
        </div>
      `;
    }

    if (r.status === "REQUESTED") {
      driver.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          <button onclick="acceptRide('${r._id}')">Accept</button>
        </div>
      `;
    }

    if (r.driverId === driverId) {
      driver.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          ${r.status}<br/>

          ${r.status === "ACCEPTED" ? `<button onclick="updateStatus('${r._id}','ARRIVING')">Arriving</button>` : ""}
          ${r.status === "ARRIVING" ? `<button onclick="updateStatus('${r._id}','IN_PROGRESS')">Start</button>` : ""}
          ${r.status === "IN_PROGRESS" ? `<button onclick="updateStatus('${r._id}','COMPLETED')">Finish</button>` : ""}
        </div>
      `;
    }
  });
}

// ================= GLOBAL =================
window.createRide = createRide;
window.acceptRide = acceptRide;
window.updateStatus = updateStatus;
