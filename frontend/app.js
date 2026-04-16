const API = "https://marketplace-app-m8ac.onrender.com";

const logBox = document.getElementById("log");
const statusBox = document.getElementById("status");

let mode = "rider";

// =====================
// IDs
// =====================
const userId =
  localStorage.getItem("userId") ||
  Math.random().toString(36).substring(2, 10);

localStorage.setItem("userId", userId);

const driverId =
  localStorage.getItem("driverId") ||
  Math.random().toString(36).substring(2, 10);

localStorage.setItem("driverId", driverId);

logBox.innerText += "👤 User: " + userId + "\n";
logBox.innerText += "🚗 Driver: " + driverId + "\n";

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
  document.getElementById("modeLabel").innerText =
    "Current: " + mode.toUpperCase();

  log("🔄 Mode: " + mode);

  loadRides();
}

// =====================
// BACKEND CHECK
// =====================
function checkBackend() {
  fetch(`${API}/api/health`)
    .then(res => res.json())
    .then(data => {
      setStatus(
        `${data.status === "ok" ? "🟢 Backend OK" : "🔴 Backend"} | ` +
        `${data.db === "connected" ? "🟢 DB" : "🔴 DB"}`
      );

      log("📡 Health:");
      log(JSON.stringify(data));
    })
    .catch(err => log("❌ Backend error: " + err));
}

// =====================
// CREATE RIDE (INPUTS)
// =====================
function createRide() {
  const pickup = document.getElementById("pickup").value;
  const destination = document.getElementById("destination").value;

  if (!pickup || !destination) {
    log("⚠️ Missing input");
    return;
  }

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickup, destination, userId })
  })
    .then(res => res.json())
    .then(data => {
      log("✅ Ride created");
      log(JSON.stringify(data));
      loadRides();
    })
    .catch(err => log("❌ Create error: " + err));
}

// =====================
// UPDATE STATUS
// =====================
function updateStatus(id, status) {
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
      log("🔄 Updated ride");
      loadRides();
    })
    .catch(err => log("❌ Update error: " + err));
}

// =====================
// LOAD RIDES (LIVE)
// =====================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("rides");
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

        let buttons = "";

        if (mode === "driver") {
          buttons = `
            <button onclick="updateStatus('${r._id}', 'ACCEPTED')">Accept</button>
            <button onclick="updateStatus('${r._id}', 'ARRIVING')">Arriving</button>
            <button onclick="updateStatus('${r._id}', 'COMPLETED')">Complete</button>
          `;
        }

        if (mode === "rider") {
          buttons = `<small>Tracking...</small>`;
        }

        div.innerHTML = `
          <b>${r.pickup} → ${r.destination}</b><br/>
          Status: ${r.status}<br/>
          Driver: ${r.driverId || "none"}<br/><br/>
          ${buttons}
        `;

        container.appendChild(div);
      });
    });
}

// =====================
// 🔥 LIVE AUTO REFRESH (STEP 5)
// =====================
setInterval(() => {
  loadRides();
}, 3000);

// =====================
// INIT
// =====================
checkBackend();
loadRides();
