const API = "https://marketplace-app-m8ac.onrender.com";

// =====================
// STATE
// =====================
let mode = "rider";

// =====================
// DOM SAFETY (prevents crashes)
// =====================
const logBox = document.getElementById("log") || { innerText: "" };
const statusBox = document.getElementById("status") || { innerText: "" };

// =====================
// USER IDS
// =====================
const userId =
  localStorage.getItem("userId") ||
  Math.random().toString(36).substring(2, 10);

localStorage.setItem("userId", userId);

const driverId =
  localStorage.getItem("driverId") ||
  Math.random().toString(36).substring(2, 10);

localStorage.setItem("driverId", driverId);

// =====================
// LOGGING
// =====================
function log(msg) {
  logBox.innerText += msg + "\n";
}

function setStatus(msg) {
  statusBox.innerText = msg;
}

// =====================
// MODE SWITCH
// =====================
function setMode(newMode) {
  mode = newMode;

  const label = document.getElementById("modeLabel");
  if (label) {
    label.innerText = "Current: " + newMode.toUpperCase();
  }

  log("🔁 Mode switched to: " + newMode);
  loadRides();
}

// =====================
// BACKEND CHECK
// =====================
function checkBackend() {
  log("➡️ Checking backend...");

  fetch(`${API}/api/health`)
    .then(res => res.json())
    .then(data => {
      setStatus(`${data.status} | DB: ${data.db}`);

      log("📡 Health response:");
      log(JSON.stringify(data, null, 2));
    })
    .catch(err => {
      setStatus("❌ Backend error");
      log("❌ ERROR: " + err);
    });
}

// =====================
// CREATE RIDE
// =====================
function createRide() {
  const pickup = document.getElementById("pickup")?.value;
  const destination = document.getElementById("destination")?.value;

  if (!pickup || !destination) {
    log("❌ Missing pickup or destination");
    return;
  }

  log("🚗 Creating ride...");

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickup, destination, userId })
  })
    .then(res => res.json())
    .then(data => {
      log("✅ Ride created:");
      log(JSON.stringify(data, null, 2));

      loadRides();
    })
    .catch(err => {
      log("❌ Create error: " + err);
    });
}

// =====================
// UPDATE STATUS
// =====================
function updateStatus(id, status) {
  log(`🔄 Updating ride ${id} → ${status}`);

  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      driverId
    })
  })
    .then(res => res.json())
    .then(data => {
      log("✅ Updated:");
      log(JSON.stringify(data, null, 2));

      loadRides();
    })
    .catch(err => {
      log("❌ Update error: " + err);
    });
}

// =====================
// LOAD RIDES
// =====================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("rides");

      if (!container) return;

      container.innerHTML = "";

      let filtered = data;

      if (mode === "driver") {
        filtered = data.filter(r => r.status === "REQUESTED");
      }

      if (mode === "rider") {
        filtered = data.filter(r => r.userId === userId);
      }

      filtered.forEach(r => {
        const div = document.createElement("div");
        div.className = "ride";

        div.innerHTML = `
          <b>${r.pickup} → ${r.destination}</b><br/>
          Status: ${r.status}<br/>
          Driver: ${r.driverId || "none"}<br/><br/>

          <button onclick="updateStatus('${r._id}', 'ACCEPTED')">Accept</button>
          <button onclick="updateStatus('${r._id}', 'ARRIVING')">Arriving</button>
          <button onclick="updateStatus('${r._id}', 'IN_PROGRESS')">Start</button>
          <button onclick="updateStatus('${r._id}', 'COMPLETED')">Complete</button>
        `;

        container.appendChild(div);
      });
    })
    .catch(err => {
      log("❌ Load error: " + err);
    });
}

// =====================
// INIT
// =====================
checkBackend();
loadRides();

// =====================
// EXPOSE GLOBALS (🔥 IMPORTANT FIX)
// =====================
window.createRide = createRide;
window.updateStatus = updateStatus;
window.checkBackend = checkBackend;
window.loadRides = loadRides;
window.setMode = setMode;
