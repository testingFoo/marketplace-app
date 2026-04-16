const API = "https://marketplace-app-m8ac.onrender.com";

const logBox = document.getElementById("log");
const statusBox = document.getElementById("status");

// =====================
// MODE SYSTEM
// =====================
let mode = "rider";

// fake user identity (STEP 3 CORE)
const userId =
  localStorage.getItem("userId") ||
  Math.random().toString(36).substring(2, 10);

localStorage.setItem("userId", userId);

logBox.innerText += "👤 User ID: " + userId + "\n";

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
// SWITCH MODE
// =====================
function setMode(newMode) {
  mode = newMode;

  document.getElementById("modeLabel").innerText =
    "Current: " + mode.toUpperCase();

  log("🔄 Mode switched → " + mode);

  loadRides();
}

// =====================
// CHECK BACKEND
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
// CREATE RIDE (STEP 3)
// =====================
function createRide() {
  log("➡️ Creating ride...");

  const pickup = prompt("Enter pickup location:");
  const destination = prompt("Enter destination:");

  if (!pickup || !destination) {
    log("⚠️ Missing pickup/destination");
    return;
  }

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pickup,
      destination,
      userId
    })
  })
    .then(res => res.json())
    .then(data => {
      log("✅ Ride created:");
      log(JSON.stringify(data, null, 2));

      loadRides();
    })
    .catch(err => log("❌ Create error: " + err));
}

// =====================
// UPDATE STATUS (Driver)
// =====================
function updateStatus(id, status) {
  log(`➡️ Updating ${id} → ${status}`);

  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  })
    .then(res => res.json())
    .then(data => {
      log("✅ Updated:");
      log(JSON.stringify(data, null, 2));

      loadRides();
    })
    .catch(err => log("❌ Update error: " + err));
}

// =====================
// LOAD RIDES (STEP 3 LOGIC)
// =====================
function loadRides() {
  log("➡️ Loading rides...");

  fetch(`${API}/api/rides`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("rides");
      container.innerHTML = "";

      if (!Array.isArray(data)) {
        log("❌ Invalid server response");
        return;
      }

      let filtered = data;

      // 🚗 DRIVER VIEW
      if (mode === "driver") {
        filtered = data.filter(r => r.status === "REQUESTED");
      }

      // 👤 RIDER VIEW (ONLY THEIR RIDES)
      if (mode === "rider") {
        filtered = data.filter(r => r.userId === userId);
      }

      if (filtered.length === 0) {
        container.innerHTML = "<p>No rides found</p>";
        log("📭 Empty view for mode: " + mode);
        return;
      }

      filtered.forEach(r => {
        const div = document.createElement("div");
        div.className = "ride";

        let buttons = "";

        if (mode === "driver") {
          buttons = `
            <button onclick="updateStatus('${r._id}', 'ACCEPTED')">Accept</button>
            <button onclick="updateStatus('${r._id}', 'ARRIVING')">Arriving</button>
            <button onclick="updateStatus('${r._id}', 'COMPLETED')">Complete</button>
          `;
        }

        if (mode === "rider") {
          buttons = `<small>👤 Your ride status</small>`;
        }

        div.innerHTML = `
          <b>🚗 ${r.pickup} → ${r.destination}</b><br/>
          <b>Status:</b> ${r.status}<br/>
          <small>User: ${r.userId}</small><br/><br/>
          ${buttons}
        `;

        container.appendChild(div);
      });

      log(`📦 Loaded ${filtered.length} rides`);
    })
    .catch(err => log("❌ Load error: " + err));
}

// =====================
// INIT
// =====================
checkBackend();
loadRides();
