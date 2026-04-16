const API = "https://marketplace-app-m8ac.onrender.com";

const logBox = document.getElementById("log");
const statusBox = document.getElementById("status");

// =====================
// GLOBAL MODE
// =====================
let mode = "rider";

// =====================
// Logger
// =====================
function log(msg) {
  logBox.innerText += msg + "\n";
}

// =====================
// Set Status UI
// =====================
function setStatus(msg) {
  statusBox.innerText = msg;
}

// =====================
// Switch Mode (Rider / Driver)
// =====================
function setMode(newMode) {
  mode = newMode;

  document.getElementById("modeLabel").innerText =
    "Current: " + mode.toUpperCase();

  log("🔄 Mode switched to: " + mode);

  loadRides();
}

// =====================
// Check backend + DB
// =====================
function checkBackend() {
  log("➡️ Checking backend...");

  fetch(`${API}/api/health`)
    .then(res => res.json())
    .then(data => {

      const backendStatus =
        data.status === "ok" ? "🟢 Backend OK" : "🔴 Backend Error";

      const dbStatus =
        data.db === "connected"
          ? "🟢 DB Connected"
          : "🔴 DB Disconnected";

      setStatus(`${backendStatus} | ${dbStatus}`);

      log("✅ Health response:");
      log(JSON.stringify(data, null, 2));
    })
    .catch(err => {
      setStatus("🔴 Backend Failed");
      log("❌ ERROR: " + err);
    });
}

// =====================
// Create Ride
// =====================
function createRide() {
  log("➡️ Creating ride...");

  const pickup = prompt("Enter pickup location:");
  const destination = prompt("Enter destination:");

  if (!pickup || !destination) {
    log("⚠️ Missing pickup or destination");
    return;
  }

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pickup, destination })
  })
    .then(res => res.json())
    .then(data => {
      log("✅ Ride created:");
      log(JSON.stringify(data, null, 2));

      loadRides();
    })
    .catch(err => {
      log("❌ Create ride error: " + err);
    });
}

// =====================
// Update Ride Status (Driver only action)
// =====================
function updateStatus(id, status) {
  log(`➡️ Updating ride ${id} → ${status}`);

  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  })
    .then(res => res.json())
    .then(data => {
      log("✅ Status updated:");
      log(JSON.stringify(data, null, 2));

      loadRides();
    })
    .catch(err => {
      log("❌ Status update error: " + err);
    });
}

// =====================
// Load Rides (Role-based UI)
// =====================
function loadRides() {
  log("➡️ Loading rides...");

  fetch(`${API}/api/rides`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("rides");
      container.innerHTML = "";

      if (!Array.isArray(data)) {
        log("❌ Invalid response");
        return;
      }

      data.forEach(r => {
        const div = document.createElement("div");
        div.className = "ride";

        let buttons = "";

        // 🚗 DRIVER VIEW (can control status)
        if (mode === "driver") {
          buttons = `
            <button onclick="updateStatus('${r._id}', 'ACCEPTED')">Accept</button>
            <button onclick="updateStatus('${r._id}', 'ARRIVING')">Arriving</button>
            <button onclick="updateStatus('${r._id}', 'COMPLETED')">Complete</button>
          `;
        }

        // 👤 RIDER VIEW (read-only)
        if (mode === "rider") {
          buttons = `<small>👤 Waiting for driver...</small>`;
        }

        div.innerHTML = `
          <b>🚗 ${r.pickup} → ${r.destination}</b><br/>
          <b>Status:</b> ${r.status}<br/><br/>
          ${buttons}
        `;

        container.appendChild(div);
      });

      log(`📦 Rides loaded: ${data.length}`);
    })
    .catch(err => {
      log("❌ Load error: " + err);
    });
}

// =====================
// Auto start
// =====================
checkBackend();
loadRides();
