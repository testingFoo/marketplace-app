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
// Status UI
// =====================
function setStatus(msg) {
  statusBox.innerText = msg;
}

// =====================
// Check backend
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

      log("✅ Health:");
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
  const pickup = prompt("Pickup location:");
  const destination = prompt("Destination:");

  if (!pickup || !destination) {
    log("⚠️ Missing data");
    return;
  }

  log("➡️ Creating ride...");

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickup, destination })
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
// Update Ride Status
// =====================
function updateStatus(id, status) {
  log(`➡️ Updating ride ${id} → ${status}`);

  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  })
    .then(res => res.json())
    .then(data => {
      log("✅ Status updated:");
      log(JSON.stringify(data, null, 2));
      loadRides();
    })
    .catch(err => log("❌ Status update error: " + err));
}

// =====================
// Load rides (UI version)
// =====================
function loadRides() {
  log("➡️ Loading rides...");

  fetch(`${API}/api/rides`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("rides");

      if (!Array.isArray(data)) {
        log("❌ Invalid response");
        return;
      }

      container.innerHTML = "";

      data.forEach(r => {
        const div = document.createElement("div");

        div.style.border = "1px solid #ccc";
        div.style.padding = "10px";
        div.style.margin = "10px 0";

        div.innerHTML = `
          <b>🚗 ${r.pickup} → ${r.destination}</b><br/>
          <b>Status:</b> ${r.status}<br/><br/>

          <button onclick="updateStatus('${r._id}', 'ACCEPTED')">Accept</button>
          <button onclick="updateStatus('${r._id}', 'ARRIVING')">Arriving</button>
          <button onclick="updateStatus('${r._id}', 'COMPLETED')">Complete</button>
        `;

        container.appendChild(div);
      });

      log(`📦 Rides loaded: ${data.length}`);
    })
    .catch(err => log("❌ Load error: " + err));
}

// =====================
// Init
// =====================
checkBackend();
loadRides();
