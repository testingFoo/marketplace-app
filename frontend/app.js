const API = "https://marketplace-app-m8ac.onrender.com";

// =====================
// STATE
// =====================
let mode = "rider";
let driverOnline = false;

// =====================
// IDS (stable)
// =====================
let userId = localStorage.getItem("userId");

if (!userId) {
  userId = "user_" + Date.now();
  localStorage.setItem("userId", userId);
}

let driverId = localStorage.getItem("driverId");

if (!driverId) {
  driverId = "driver_" + Date.now();
  localStorage.setItem("driverId", driverId);
}

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

    socket.on("ride:new", loadRides);
    socket.on("ride:update", loadRides);

  } catch (err) {
    console.log("Socket error:", err);
  }
}

// =====================
// DOM
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
// MODE LABEL FIX
// =====================
function updateModeLabel() {
  const label = document.getElementById("modeLabel");
  if (label) {
    label.innerText = "Current: " + mode.toUpperCase();
  }
}

// =====================
// BACKEND CHECK
// =====================
function checkBackend() {
  fetch(`${API}/api/health`)
    .then(res => res.json())
    .then(data => {
      setStatus(`${data.status} | DB: ${data.db}`);
      log("📡 Backend OK");
    })
    .catch(err => {
      setStatus("❌ Backend failed");
      log("❌ Health error: " + err);
    });
}

// =====================
// MODE SWITCH (FIXED)
// =====================
function setMode(newMode) {
  mode = newMode;

  setStatus("Mode: " + mode);
  updateModeLabel();

  setTimeout(() => loadRides(), 0);
}

// =====================
// DRIVER ONLINE/OFFLINE
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
  if (btn) btn.innerText = driverOnline ? "Go OFFLINE" : "Go ONLINE";
}

// =====================
// CREATE RIDE
// =====================
function createRide() {
  const pickup = document.getElementById("pickup")?.value;
  const destination = document.getElementById("destination")?.value;

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickup, destination, userId })
  })
    .then(res => res.json())
    .then(() => loadRides());
}

// =====================
// UPDATE STATUS
// =====================
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, driverId })
  }).then(() => loadRides());
}

// =====================
// LOAD RIDES (FIXED DRIVER VISIBILITY)
// =====================
function loadRides() {
  if (!ridesBox) return;

  fetch(`${API}/api/rides`)
    .then(res => res.json())
    .then(data => {

      console.log("MODE:", mode);
      console.log("RIDES:", data);

      ridesBox.innerHTML = "";

      // DEBUG HEADER
      const debug = document.createElement("div");
      debug.style.padding = "8px";
      debug.style.background = "#eee";
      debug.innerText = `MODE: ${mode} | TOTAL: ${data.length}`;
      ridesBox.appendChild(debug);

      let filtered = data;

      if (mode === "driver") {
        filtered = data.filter(r =>
          r.status === "REQUESTED" ||
          r.status === "ACCEPTED" ||
          r.driverId === driverId
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

          ${r.status === "ACCEPTED"
            ? `<button onclick="updateStatus('${r._id}', 'ARRIVING')">Arriving</button>`
            : ""}

          ${r.status === "ARRIVING"
            ? `<button onclick="updateStatus('${r._id}', 'IN_PROGRESS')">Start</button>`
            : ""}

          ${r.status === "IN_PROGRESS"
            ? `<button onclick="updateStatus('${r._id}', 'COMPLETED')">Complete</button>`
            : ""}
        `;

        ridesBox.appendChild(div);
      });
    });
}

// =====================
// INIT
// =====================
window.onload = () => {
  logBox = document.getElementById("log");
  statusBox = document.getElementById("status");
  ridesBox = document.getElementById("rides");

  log("🟢 App initialized");

  initSocket();
  checkBackend();
  loadRides();
};

// =====================
// GLOBALS
// =====================
window.createRide = createRide;
window.updateStatus = updateStatus;
window.setMode = setMode;
window.toggleDriver = toggleDriver;
window.checkBackend = checkBackend;
window.loadRides = loadRides;
