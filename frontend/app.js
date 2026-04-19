const API = "https://marketplace-app-m8ac.onrender.com";
const MAPBOX_TOKEN = "pk.eyJ1IjoibWFwZnVycWFuIiwiYSI6ImNtbzRoMGdnbjEzZXkydnF3MWFhN2t5aWcifQ.A7GlM3WDlLWHBl6lQCHKEA";

let socket;
let map;

let origin = null;
let destination = null;
let driverMarker = null;

let activeTab = "passenger";
let driverId = "D-" + Math.floor(Math.random() * 99999);

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

  socket.emit("driver:online", driverId);

  socket.on("ride:new", loadRides);
  socket.on("ride:update", loadRides);

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
}

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.06, 19.94], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OSM"
  }).addTo(map);
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
      type: activeTab.toUpperCase(),
      origin: document.getElementById("origin").value,
      destination: document.getElementById("destination").value,
      originCoords: origin,
      destinationCoords: destination
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Ride created:", data);
    loadRides();
  })
  .catch(err => console.log("Submit error:", err));
}

// expose for inline HTML onclick
window.submitRide = submitRide;
window.setTab = setTab;

// ================= LOAD RIDES =================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(data => {
      if (!Array.isArray(data)) {
        console.log("Invalid rides response:", data);
        return;
      }
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
        ${r.origin || "-"} → ${r.destination || "-"}<br/>
        Status: ${r.status || "-"}<br/>
        Driver: ${r.driverId || "OPEN"}<br/>
      </div>
    `;
  });
}

async function loadDebug() {
  const panel = document.getElementById("debugPanel");

  try {
    const [db, server] = await Promise.all([
      fetch(`${API}/api/debug/db`).then(r => r.json()).catch(e => ({ error: e.message })),
      fetch(`${API}/api/debug`).then(r => r.json()).catch(e => ({ error: e.message }))
    ]);

    panel.innerHTML = `
      🟢 Server: ${server.server || "down"}<br/>
      🔌 Socket Clients: ${server.socketClients || 0}<br/><br/>

      🟡 MongoDB: ${db.status || "unknown"}<br/>
      ${db.name ? "DB: " + db.name + "<br/>" : ""}
      ${db.error ? "Error: " + db.error : ""}
    `;
  } catch (err) {
    panel.innerHTML = "❌ Backend unreachable";
  }
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


window.onload = () => {
  initMap();
  initSocket();
  setupSearch("origin");
  setupSearch("destination");
  loadRides();
  loadDebug(); // 🔥 ADD THIS
};
