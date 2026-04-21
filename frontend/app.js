const API = "https://marketplace-app-m8ac.onrender.com";
const MAPBOX_TOKEN = "pk.eyJ1IjoibWFwZnVycWFuIiwiYSI6ImNtbzRoMGdnbjEzZXkydnF3MWFhN2t5aWcifQ.A7GlM3WDlLWHBl6lQCHKEA";

let socket;
let map;

let origin = null;
let destination = null;

let driverMarker = null;
let routeLine = null;

let pickupMarker = null;
let dropMarker = null;

let activeRide = null;

// ================= INIT =================
window.onload = () => {
  initMap();
  initSocket();
  setupSearch("origin");
  setupSearch("destination");
  loadRides();
};

// ================= SOCKET =================
function initSocket() {
  socket = io(API);

  socket.on("connect", () => {
    console.log("Connected");
  });

  socket.on("ride:new", loadRides);
  socket.on("ride:update", (ride) => {
    loadRides();
    activeRide = ride;

    if (ride.routeCoords) drawRoute(ride.routeCoords);
    drawTripMarkers(ride);
  });

  socket.on("driver-location-update", (data) => {
    const { location, etaSeconds } = data;

    if (!location) return;

    const latlng = [location.lat, location.lng];

    if (!driverMarker) {
      driverMarker = L.marker(latlng, { icon: carIcon() }).addTo(map);
    } else {
      driverMarker.setLatLng(latlng);
    }

    map.panTo(latlng, { animate: true, duration: 0.5 });

    updateETA(Math.round((etaSeconds || 0) / 60));
    updateUberUI("EN_ROUTE", etaSeconds);
  });

  socket.on("ride-completed", () => {
    alert("Ride completed");

    if (driverMarker) map.removeLayer(driverMarker);
    driverMarker = null;

    if (routeLine) map.removeLayer(routeLine);
    routeLine = null;

    clearTripMarkers();
    updateUberUI("COMPLETED", 0);
  });
}

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.06, 19.94], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OSM"
  }).addTo(map);
}

// ================= CAR ICON =================
function carIcon() {
  return L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
    iconSize: [35, 35],
    iconAnchor: [17, 17]
  });
}

// ================= ROUTE =================
function drawRoute(coords) {
  if (!coords) return;

  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline(
    coords.map(c => [c[1], c[0]]),
    { color: "blue", weight: 4 }
  ).addTo(map);

  map.fitBounds(routeLine.getBounds());
}

// ================= MARKERS =================
function drawTripMarkers(ride) {
  if (!ride) return;

  clearTripMarkers();

  if (ride.originCoords) {
    pickupMarker = L.marker(
      [ride.originCoords.lat, ride.originCoords.lng]
    ).addTo(map).bindPopup("📍 Pickup");
  }

  if (ride.destinationCoords) {
    dropMarker = L.marker(
      [ride.destinationCoords.lat, ride.destinationCoords.lng]
    ).addTo(map).bindPopup("🏁 Dropoff");
  }
}

function clearTripMarkers() {
  if (pickupMarker) map.removeLayer(pickupMarker);
  if (dropMarker) map.removeLayer(dropMarker);

  pickupMarker = null;
  dropMarker = null;
}

// ================= SEARCH =================
async function search(q) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}`
  );

  const data = await res.json();
  return data.features || [];
}

function setupSearch(id) {
  const input = document.getElementById(id);
  const box = document.getElementById(id + "List");

  let timeout;

  input.addEventListener("input", () => {
    clearTimeout(timeout);

    timeout = setTimeout(async () => {
      if (input.value.length < 3) return;

      const res = await search(input.value);
      box.innerHTML = "";

      res.forEach(r => {
        const div = document.createElement("div");
        div.innerText = r.place_name;

        div.onclick = () => {
          input.value = r.place_name;

          const c = {
            lng: r.center[0],
            lat: r.center[1]
          };

          if (id === "origin") origin = c;
          else destination = c;

          box.innerHTML = "";
          L.marker([c.lat, c.lng]).addTo(map);
        };

        box.appendChild(div);
      });

    }, 300);
  });
}

// ================= SUBMIT =================
function submitRide() {
  if (!origin || !destination) {
    alert("Select origin & destination");
    return;
  }

  fetch(`${API}/api/rides`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "UBERX",
      originCoords: origin,
      destinationCoords: destination
    })
  })
  .then(r => r.json())
  .then(data => {
    console.log("Ride:", data);
    loadRides();
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
  const list = document.getElementById("rides");
  list.innerHTML = "";

  rides.forEach(r => {
    list.innerHTML += `
      <div class="card">
        <b>${r.type}</b><br/>
        ${r.origin || "-"} → ${r.destination || "-"}<br/>
        Status: ${r.status}<br/>
        Fare: $${r.fare || 0}
      </div>
    `;
  });
}

// ================= ETA =================
function updateETA(mins) {
  let el = document.getElementById("eta");

  if (!el) {
    el = document.createElement("div");
    el.id = "eta";
    el.style.position = "fixed";
    el.style.bottom = "10px";
    el.style.right = "10px";
    el.style.background = "#000";
    el.style.color = "#0f0";
    el.style.padding = "10px";
    el.style.zIndex = 9999;
    document.body.appendChild(el);
  }

  el.innerText = `ETA: ${mins} min`;
}

// ================= UBER UI =================
function updateUberUI(status, eta) {
  let ui = document.getElementById("uberUI");

  if (!ui) {
    ui = document.createElement("div");
    ui.id = "uberUI";
    ui.style.position = "fixed";
    ui.style.bottom = "0";
    ui.style.left = "0";
    ui.style.width = "100%";
    ui.style.background = "#111";
    ui.style.color = "white";
    ui.style.padding = "15px";
    ui.style.zIndex = 9999;
    document.body.appendChild(ui);
  }

  let text = "";

  if (status === "EN_ROUTE") {
    text = `🚗 Driver arriving in ${Math.round((eta || 0) / 60)} min`;
  } else if (status === "COMPLETED") {
    text = "✅ Ride completed";
  } else {
    text = "🟡 Waiting for driver...";
  }

  ui.innerHTML = `
    <div style="font-size:16px;font-weight:bold">${text}</div>
    <div style="height:6px;background:#333;margin-top:10px">
      <div style="height:6px;background:lime;width:${Math.min(100, (eta || 0) / 3)}%"></div>
    </div>
  `;
}
