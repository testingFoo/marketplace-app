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

  socket.on("ride:update", () => loadRides());

  // 🔥 AUTOCOMPLETE LISTENERS
  document.getElementById("pickup").addEventListener("input", handlePickupInput);
  document.getElementById("destination").addEventListener("input", handleDropInput);

  loadRides();
};

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.0647, 19.9450], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
    .addTo(map);
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

// ================= AUTOCOMPLETE =================
async function searchPlaces(query) {
  if (!query || query.length < 3) return [];

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
  );

  return await res.json();
}

function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ================= PICKUP INPUT =================
const handlePickupInput = debounce(async () => {
  const input = document.getElementById("pickup").value;

  const results = await searchPlaces(input);

  renderSuggestions(results, "pickup");
});

// ================= DROP INPUT =================
const handleDropInput = debounce(async () => {
  const input = document.getElementById("destination").value;

  const results = await searchPlaces(input);

  renderSuggestions(results, "drop");
});

// ================= RENDER DROPDOWN =================
function renderSuggestions(list, type) {
  const box = document.getElementById(type + "Suggestions");
  box.innerHTML = "";

  list.slice(0, 5).forEach(place => {
    const div = document.createElement("div");
    div.className = "suggestion";
    div.innerText = place.display_name;

    div.onclick = () => {
      if (type === "pickup") {
        document.getElementById("pickup").value = place.display_name;
        pickup = {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        };
      } else {
        document.getElementById("destination").value = place.display_name;
        drop = {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        };
      }

      box.innerHTML = "";
    };

    box.appendChild(div);
  });
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

// ================= DRIVER =================
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

// ================= GLOBAL =================
window.createRide = createRide;
window.acceptRide = acceptRide;
window.updateStatus = updateStatus;
window.cancelRide = cancelRide;
