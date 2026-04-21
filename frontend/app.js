const API = "https://marketplace-app-m8ac.onrender.com";
const MAPBOX_TOKEN = "pk.eyJ1IjoibWFwZnVycWFuIiwiYSI6ImNtbzRoMGdnbjEzZXkydnF3MWFhN2t5aWcifQ.A7GlM3WDlLWHBl6lQCHKEA";

let socket;
let map;

let origin = null;
let destination = null;
let driverMarker = null;
let routeLine = null;

let activeTab = "passenger";

// ================= SOCKET =================
function initSocket() {
  socket = io(API);

  socket.on("connect", () => {
    console.log("Connected to server");
  });

  socket.on("ride:new", loadRides);

  // ✅ UPDATED
  socket.on("ride:update", (ride) => {
    loadRides();

    if (ride.routeCoords) {
      drawRoute(ride.routeCoords);
    }
  });

  socket.on("driver-location-update", (data) => {
    const { location, etaSeconds } = data;

    if (!location) return;

    if (!driverMarker) {
      driverMarker = L.marker([location.lat, location.lng]).addTo(map);
    } else {
      driverMarker.setLatLng([location.lat, location.lng]);
    }

    updateETA(Math.round((etaSeconds || 0) / 60));
  });

  socket.on("ride-completed", () => {
    alert("Ride completed ✅");

    if (driverMarker) {
      map.removeLayer(driverMarker);
      driverMarker = null;
    }

    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }
  });
}

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.06, 19.94], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OSM"
  }).addTo(map);
}

// ================= DRAW ROUTE =================
function drawRoute(coords) {
  if (!coords || coords.length === 0) return;

  if (routeLine) {
    map.removeLayer(routeLine);
  }

  routeLine = L.polyline(
    coords.map(c => [c[1], c[0]]),
    {
      color: "blue",
      weight: 4
    }
  ).addTo(map);

  map.fitBounds(routeLine.getBounds());
}

// ================= TAB =================
function setTab(t) {
  activeTab = t;

  document.querySelectorAll(".section").forEach(el => {
    el.classList.remove("active");
  });

  const active = document.getElementById(t);
  if (active) active.classList.add("active");
}

// ================= MAPBOX SEARCH =================
async function search(q) {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}`
    );

    const data = await res.json();
    return data.features || [];
  } catch (err) {
    console.log("Mapbox error:", err);
    return [];
  }
}

// ================= AUTOCOMPLETE =================
function setupSearch(id) {
  const input = document.getElementById(id);
  const box = document.getElementById(id + "List");

  if (!input || !box) return;

  let timeout;

  input.addEventListener("input", () => {
    clearTimeout(timeout);

    timeout = setTimeout(async () => {
      if (input.value.length < 3) {
        box.innerHTML = "";
        return;
      }

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

// ================= SUBMIT RIDE =================
function submitRide() {
  if (!origin || !destination) {
    alert("Select origin and destination");
    return;
  }

  fetch(`${API}/api/rides`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "demo-user",

      type:
        activeTab === "passenger"
          ? "UBERX"
          : activeTab === "parcel"
            ? "VAN"
            : "FREIGHT",

      originCoords: origin,
      destinationCoords: destination
    })
  })
    .then(async (res) => {
      const data = await res.json();

      if (!res.ok) {
        console.log("❌ Backend error:", data);
        alert(data.error || "Server error");
        return;
      }

      console.log("✅ Ride created:", data);
      loadRides();
    })
    .catch(err => console.log("Submit error:", err));
}

window.submitRide = submitRide;
window.setTab = setTab;

// ================= LOAD RIDES =================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(data => {
      if (!Array.isArray(data)) return;
      render(data);
    })
    .catch(err => console.log("Load rides error:", err));
}

// ================= RENDER =================
function render(rides) {
  const list = document.getElementById("rides");
  if (!list) return;

  list.innerHTML = "";

  rides.forEach(r => {
    list.innerHTML += `
      <div class="card">
        <b>${r.type || "UNKNOWN"}</b><br/>
        Status: ${r.status || "-"}<br/>
        Driver: ${r.driverId || "OPEN"}<br/>
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
    el.style.background = "black";
    el.style.color = "white";
    el.style.padding = "10px";
    el.style.zIndex = "9999";
    document.body.appendChild(el);
  }

  el.innerText = `Driver arriving in ${mins} min`;
}

// ================= INIT =================
window.onload = () => {
  initMap();
  initSocket();
  setupSearch("origin");
  setupSearch("destination");
  loadRides();
};
