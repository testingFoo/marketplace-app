const API = "https://marketplace-app-m8ac.onrender.com";

let socket;
let map;

let pickup = null;
let drop = null;

let pickupTimer;
let dropTimer;

let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

window.onload = () => {
  initMap();
  initSocket();

  setupAutocomplete("pickup", "pickupList", "pickup");
  setupAutocomplete("destination", "dropList", "drop");

  loadRides();
};

// ================= SOCKET =================
function initSocket() {
  socket = io(API);

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

// ================= DEBOUNCED SEARCH =================
function setupAutocomplete(inputId, listId, type) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);

  input.addEventListener("input", () => {
    clearTimeout(type === "pickup" ? pickupTimer : dropTimer);

    const query = input.value;
    if (query.length < 3) {
      list.innerHTML = "";
      return;
    }

    const timer = setTimeout(async () => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
      );

      const data = await res.json();
      list.innerHTML = "";

      data.slice(0, 5).forEach(item => {
        const div = document.createElement("div");
        div.innerText = item.display_name;

        div.onclick = () => {
          input.value = item.display_name;

          const coords = {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          };

          if (type === "pickup") pickup = coords;
          if (type === "drop") drop = coords;

          list.innerHTML = "";

          L.marker([coords.lat, coords.lng]).addTo(map);
        };

        list.appendChild(div);
      });
    }, 400);

    if (type === "pickup") pickupTimer = timer;
    if (type === "drop") dropTimer = timer;
  });
}

// ================= CREATE RIDE (FIXED) =================
async function createRide() {
  const pickupText = document.getElementById("pickup").value;
  const dropText = document.getElementById("destination").value;

  if (!pickupText || !dropText) {
    alert("Enter addresses first");
    return;
  }

  if (!pickup || !drop) {
    alert("Select suggestions (don’t type only)");
    return;
  }

  const res = await fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pickup: pickupText,
      destination: dropText,
      pickupCoords: pickup,
      dropCoords: drop,
      userId
    })
  });

  if (!res.ok) {
    alert("Failed to create ride");
  } else {
    console.log("Ride created");
    loadRides();
  }
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
        ${r.status}<br/>
        ${r.fare} PLN
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
