const API = "https://marketplace-app-m8ac.onrender.com";

// =====================
// STATE
// =====================
let mode = "rider";
let driverOnline = false;

// =====================
// IDS
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
// SOCKET
// =====================
let socket = null;

function initSocket() {
  try {
    socket = io(API);

    socket.on("connect", () => {
      log("🟢 Socket connected");
    });

    socket.on("disconnect", () => {
      log("🔴 Socket disconnected");
    });

    socket.on("connect_error", (err) => {
      log("⚠️ Socket error");
      console.log(err);
    });

    socket.on("ride:new", () => loadRides());
    socket.on("ride:update", () => loadRides());

  } catch (err) {
    console.log("Socket init failed:", err);
  }
}

// =====================
// DOM SAFE INIT
// =====================
let logBox;
let statusBox;
let ridesBox;

// =====================
// LOGGING
// =====================
function log(msg) {
  if (logBox) logBox.innerText += msg + "\n";
  console.log(msg);
}

function setStatus(msg) {
  if (statusBox) statusBox.innerText = msg;
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
      log("📡 Health OK");
    })
    .catch(err => {
      setStatus("❌ Backend failed");
      log("❌ Health error: " + err);
    });
}

// =====================
// MODE SWITCH
// =====================
function setMode(newMode) {
  mode = newMode;
  log("🔁 Mode: " + newMode);
  loadRides();
}

// =====================
// DRIVER TOGGLE
// =====================
function toggleDriver() {
  driverOnline = !driverOnline;

  if (socket) {
    if (driverOnline) {
      socket.emit("driver:online", driverId);
      log("🟢 Driver ONLINE");
    } else {
      socket.emit("driver:offline", driverId);
      log("🔴 Driver OFFLINE");
    }
  }

  const btn = document.getElementById("driverToggle");
  if (btn) {
    btn.innerText = driverOnline ? "Go OFFLINE" : "Go ONLINE";
  }
}

// =====================
// CREATE RIDE
// =====================
function createRide() {
  const pickup = document.getElementById("pickup")?.value;
  const destination = document.getElementById("destination")?.value;

  if (!pickup || !destination) {
    log("❌ Missing input");
    return;
  }

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickup, destination, userId })
  })
    .then(res => res.json())
    .then(data => {
      log("🚗 Ride created: " + data._id);
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
    body: JSON.stringify({ status, driverId })
  })
    .then(res => res.json())
    .then(() => loadRides())
    .catch(err => log("❌ Update error: " + err));
}

// =====================
// LOAD RIDES
// =====================
function loadRides() {
  if (!ridesBox) return;

  fetch(`${API}/api/rides`)
    .then(res => res.json())
    .then(data => {
      ridesBox.innerHTML = "";

      let filtered = data;

      if (mode === "driver") {
        filtered = data.filter(
          r => r.driverId === driverId || r.status === "REQUESTED"
        );
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

          ${r.status === "ACCEPTED" ? `<button onclick="updateStatus('${r._id}', 'ARRIVING')">Arriving</button>` : ""}
          ${r.status === "ARRIVING" ? `<button onclick="updateStatus('${r._id}', 'IN_PROGRESS')">Start</button>` : ""}
          ${r.status === "IN_PROGRESS" ? `<button onclick="updateStatus('${r._id}', 'COMPLETED')">Complete</button>` : ""}
        `;

        ridesBox.appendChild(div);
      });
    })
    .catch(err => log("❌ Load error: " + err));
}

// =====================
// INIT (IMPORTANT FIX)
// =====================
window.onload = () => {
  logBox = document.getElementById("log");
  statusBox = document.getElementById("status");
  ridesBox = document.getElementById("rides");

  if (!logBox || !statusBox || !ridesBox) {
    console.log("❌ Missing DOM elements");
    return;
  }

  log("🟢 App initialized");

  initSocket();
  checkBackend();
  loadRides();
};

// =====================
// GLOBAL EXPORTS
// =====================
window.createRide = createRide;
window.updateStatus = updateStatus;
window.setMode = setMode;
window.toggleDriver = toggleDriver;
window.checkBackend = checkBackend;
window.loadRides = loadRides;
