const API = "https://marketplace-app-m8ac.onrender.com";

let mode = "rider";
let driverOnline = false;

// =====================
// DOM
// =====================
const logBox = document.getElementById("log") || { innerText: "" };
const statusBox = document.getElementById("status") || { innerText: "" };

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
// LOG
// =====================
function log(msg) {
  logBox.innerText += msg + "\n";
}

function setStatus(msg) {
  statusBox.innerText = msg;
}

// =====================
// SOCKET
// =====================
let socket = null;

try {
  socket = io(API);

  socket.on("connect", () => {
    log("🟢 Socket connected");
  });

} catch (err) {
  console.log("Socket disabled");
}

// =====================
// DRIVER TOGGLE
// =====================
function toggleDriver() {
  driverOnline = !driverOnline;

  if (!socket) return;

  if (driverOnline) {
    socket.emit("driver:online", driverId);
    log("🟢 Driver ONLINE");
  } else {
    socket.emit("driver:offline", driverId);
    log("🔴 Driver OFFLINE");
  }

  const btn = document.getElementById("driverToggle");
  if (btn) {
    btn.innerText = driverOnline ? "Go OFFLINE" : "Go ONLINE";
  }
}

// =====================
// MODE
// =====================
function setMode(newMode) {
  mode = newMode;
  loadRides();
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
  }).then(loadRides);
}

// =====================
// UPDATE STATUS
// =====================
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, driverId })
  }).then(loadRides);
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
        filtered = data.filter(
          r => r.driverId === driverId
        );
      }

      if (mode === "rider") {
        filtered = data.filter(r => r.userId === userId);
      }

      filtered.forEach(r => {
        const div = document.createElement("div");

        div.innerHTML = `
          <b>${r.pickup} → ${r.destination}</b><br/>
          Status: ${r.status}<br/><br/>

          ${r.status === "ACCEPTED" ? `<button onclick="updateStatus('${r._id}', 'ARRIVING')">Arriving</button>` : ""}
          ${r.status === "ARRIVING" ? `<button onclick="updateStatus('${r._id}', 'IN_PROGRESS')">Start</button>` : ""}
          ${r.status === "IN_PROGRESS" ? `<button onclick="updateStatus('${r._id}', 'COMPLETED')">Complete</button>` : ""}
        `;

        container.appendChild(div);
      });
    });
}

// =====================
// REALTIME
// =====================
if (socket) {
  socket.on("ride:new", loadRides);
  socket.on("ride:update", loadRides);
}

// =====================
// INIT
// =====================
loadRides();

// =====================
// GLOBAL
// =====================
window.createRide = createRide;
window.updateStatus = updateStatus;
window.setMode = setMode;
window.toggleDriver = toggleDriver;
