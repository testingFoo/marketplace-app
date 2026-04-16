const API = "https://marketplace-app-m8ac.onrender.com";

const logBox = document.getElementById("log");
const statusBox = document.getElementById("status");

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
// Check backend + DB (DEBUG READY)
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
// Create Ride (DEBUG SAFE)
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
// Load Rides (DEBUG SAFE)
// =====================
function loadRides() {
  log("➡️ Loading rides...");

  fetch(`${API}/api/rides`)
    .then(res => res.json())
    .then(data => {

      if (!Array.isArray(data)) {
        log("❌ ERROR: Invalid response");
        log(JSON.stringify(data, null, 2));
        return;
      }

      log(`📦 Total rides: ${data.length}`);

      data.forEach(r => {
        log(`🚗 ${r.pickup} → ${r.destination} | ${r.status}`);
      });
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
