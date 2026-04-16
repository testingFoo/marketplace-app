const API = "https://marketplace-app-m8ac.onrender.com";

// =====================
// STATE
// =====================

let mode = "rider";

// =====================
// DOM SAFETY
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
// SAFE SOCKET
// =====================
let socket = null;

try {
  socket = io(API);

  socket.on("connect", () => {
    log("🟢 Socket connected");
  });

  socket.on("connect_error", (err) => {
    log("⚠️ Socket failed");
    console.log(err);
  });

} catch (err) {
  console.log("Socket disabled:", err);
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

  log("🔁 Mode: " + newMode);
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
      log("📡 Health:");
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
    log("❌ Missing pickup/destination");
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
      log("✅ Ride created");
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
  log(`🔄 ${status}`);

  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      driverId
    })
  })
    .then(res => res.json())
    .then(() => {
      loadRides();
    })
    .catch(err => {
      log("❌ Update error: " + err);
    });
}

// =====================
// LOAD RIDES (🔥 STEP A UI)
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
        filtered = data.filter(
          r => r.status === "REQUESTED" || r.driverId === driverId
        );
      }

      if (mode === "rider") {
        filtered = data.filter(r => r.userId === userId);
      }

      filtered.forEach(r => {
        const div = document.createElement("div");
        div.className = "ride";

        // 🧠 PROGRESS
        const stages = ["REQUESTED", "ACCEPTED", "ARRIVING", "IN_PROGRESS", "COMPLETED"];
        const currentIndex = stages.indexOf(r.status);

        const progress = stages
          .map((s, i) => {
            if (i < currentIndex) return "✅ " + s;
            if (i === currentIndex) return "🟡 " + s;
            return "⬜ " + s;
          })
          .join(" → ");

        // 🧠 BUTTONS
        let buttons = "";

        if (mode === "driver") {
          if (r.status === "REQUESTED") {
            buttons += `<button onclick="updateStatus('${r._id}', 'ACCEPTED')">Accept</button>`;
          }
          if (r.status === "ACCEPTED") {
            buttons += `<button onclick="updateStatus('${r._id}', 'ARRIVING')">Arriving</button>`;
          }
          if (r.status === "ARRIVING") {
            buttons += `<button onclick="updateStatus('${r._id}', 'IN_PROGRESS')">Start</button>`;
          }
          if (r.status === "IN_PROGRESS") {
            buttons += `<button onclick="updateStatus('${r._id}', 'COMPLETED')">Complete</button>`;
          }
        }

        div.innerHTML = `
          <b>${r.pickup} → ${r.destination}</b><br/>
          Driver: ${r.driverId || "none"}<br/><br/>

          <div style="margin-bottom:10px;">
            ${progress}
          </div>

          ${buttons}
        `;

        container.appendChild(div);
      });
    })
    .catch(err => {
      log("❌ Load error: " + err);
    });
}

// =====================
// REAL-TIME EVENTS
// =====================
if (socket) {
  socket.on("ride:new", () => {
    log("🆕 New ride");
    loadRides();
  });

  socket.on("ride:update", () => {
    log("🔄 Live update");
    loadRides();
  });
}

// =====================
// INIT
// =====================
checkBackend();
loadRides();

// =====================
// GLOBALS (🔥 REQUIRED)
// =====================
window.createRide = createRide;
window.updateStatus = updateStatus;
window.checkBackend = checkBackend;
window.loadRides = loadRides;
window.setMode = setMode;
