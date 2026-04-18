const API = "https://marketplace-app-m8ac.onrender.com";

let socket;
let map;
let routeLine;

let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

let pickup = null;
let drop = null;

// ================= INIT =================
window.onload = () => {
  initMap();
  initSocket();

  setupAutocomplete("pickup", "pickup");
  setupAutocomplete("destination", "drop");

  loadRides();
};

// ================= SOCKET =================
function initSocket() {
  socket = io(API);

  socket.on("connect", () => {
    console.log("🟢 Socket connected");
  });

  socket.on("ride:new", (data) => {
    console.log("🚗 ride:new", data);

    if (data.route && data.route.coords) {
      drawRoute(data.route.coords);
    }

    loadRides();
  });

  socket.on("ride:update", loadRides);
}

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.0647, 19.9450], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OSM"
  }).addTo(map);

  console.log("🗺️ Map ready");
}

// ================= DRAW ROUTE =================
function drawRoute(coords) {
  if (!coords || coords.length === 0) return;

  const latlngs = coords.map(c => [c[1], c[0]]);

  if (routeLine) {
    map.removeLayer(routeLine);
  }

  routeLine = L.polyline(latlngs, {
    weight: 5,
    color: "blue"
  }).addTo(map);

  map.fitBounds(routeLine.getBounds());

  console.log("✅ Route drawn");
}

// ================= AUTOCOMPLETE =================
async function searchAddress(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
  );
  return await res.json();
}

function setupAutocomplete(inputId, type) {
  const input = document.getElementById(inputId);

  const wrapper = input.parentElement;

  const list = document.createElement("div");
  list.style.position = "absolute";
  list.style.background = "white";
  list.style.border = "1px solid #ccc";
  list.style.zIndex = "9999";
  list.style.width = "100%";

  wrapper.appendChild(list);

  input.addEventListener("input", async () => {
    const q = input.value;

    if (q.length < 3) {
      list.innerHTML = "";
      return;
    }

    try {
      const results = await searchAddress(q);

      list.innerHTML = "";

      results.slice(0, 5).forEach(r => {
        const item = document.createElement("div");

        item.innerText = r.display_name;
        item.style.padding = "6px";
        item.style.cursor = "pointer";

        item.onclick = () => {
          input.value = r.display_name;

          const coords = {
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon)
          };

          if (type === "pickup") pickup = coords;
          if (type === "drop") drop = coords;

          list.innerHTML = "";

          L.marker([coords.lat, coords.lng]).addTo(map);

          console.log("📍 Selected", coords);
        };

        list.appendChild(item);
      });

    } catch (err) {
      console.log("❌ Autocomplete error", err);
    }
  });
}

// ================= CREATE RIDE =================
function createRide() {
  if (!pickup || !drop) {
    alert("Select pickup and destination");
    return;
  }

  fetch(`${API}/api/ride`, {
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
          ETA: ${Math.round(r.duration / 60)} min<br/>
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
          ${r.fare} PLN<br/>
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

// ================= ACTIONS =================
function acceptRide(id) {
  fetch(`${API}/api/ride/${id}/accept`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId })
  });
}

function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

// ================= GLOBAL =================
window.createRide = createRide;
window.acceptRide = acceptRide;
window.updateStatus = updateStatus;
