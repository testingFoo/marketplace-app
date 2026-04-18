const API = "https://marketplace-app-m8ac.onrender.com";
const MAPBOX_TOKEN = "pk.eyJ1IjoibWFwZnVycWFuIiwiYSI6ImNtbzRoMGdnbjEzZXkydnF3MWFhN2t5aWcifQ.A7GlM3WDlLWHBl6lQCHKEA";

let socket;
let map;
let routeLine;

let pickup = null;
let drop = null;

let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

window.onload = () => {
  initMap();
  initSocket();

  setupAutocomplete("pickup", "pickup");
  setupAutocomplete("destination", "drop");

  loadRides();
};

// ================= SOCKET =================
function initSocket() {
  socket = io(API, {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000
  });

  socket.on("ride:new", loadRides);
  socket.on("ride:update", loadRides);
}

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.0647, 19.9450], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OSM"
  }).addTo(map);
}

// ================= MAPBOX SEARCH =================
async function searchAddress(query) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`
  );
  const data = await res.json();
  return data.features;
}

// ================= AUTOCOMPLETE =================
function setupAutocomplete(inputId, type) {
  const input = document.getElementById(inputId);
  const wrapper = input.parentElement;

  const list = document.createElement("div");
  list.className = "suggestions";
  wrapper.appendChild(list);

  let timer;

  input.addEventListener("input", () => {
    clearTimeout(timer);

    const q = input.value;
    if (q.length < 3) {
      list.innerHTML = "";
      return;
    }

    timer = setTimeout(async () => {
      const results = await searchAddress(q);
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

          if (type === "pickup") pickup = coords;
          if (type === "drop") drop = coords;

          list.innerHTML = "";

          L.marker([coords.lat, coords.lng]).addTo(map);

          if (pickup && drop) drawRoute();
        };

        list.appendChild(div);
      });
    }, 300);
  });
}

// ================= MAPBOX ROUTE =================
async function drawRoute() {
  if (!pickup || !drop) return;

  const res = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
  );

  const data = await res.json();
  const coords = data.routes[0].geometry.coordinates;

  const latlngs = coords.map(c => [c[1], c[0]]);

  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline(latlngs, {
    color: "blue",
    weight: 5
  }).addTo(map);

  map.fitBounds(routeLine.getBounds());
}

// ================= CREATE RIDE =================
async function createRide() {
  if (!pickup || !drop) {
    alert("Select pickup and destination");
    return;
  }

  await fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pickup: document.getElementById("pickup").value,
      destination: document.getElementById("destination").value,
      pickupCoords: pickup,
      dropCoords: drop,
      userId
    })
  });

  loadRides();
}

// ================= LOAD =================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(render);
}

// ================= RENDER =================
function render(rides) {
  renderRider(rides);
  renderDriver(rides);
}

// ================= RIDER =================
function renderRider(rides) {
  const box = document.getElementById("riderRides");
  box.innerHTML = "";

  rides.filter(r => r.userId === userId).forEach(r => {
    box.innerHTML += `
      <div class="ride">
        ${r.pickup} → ${r.destination}<br/>
        Status: ${r.status}<br/>
        Fare: ${r.fare || "—"} PLN
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
          ${r.status}
        </div>
      `;
    }
  });
}

// ================= ACTIONS =================
function acceptRide(id) {
  fetch(`${API}/api/ride/${id}/accept`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId })
  });
}

window.createRide = createRide;
window.acceptRide = acceptRide;
