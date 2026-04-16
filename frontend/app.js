const API = "https://marketplace-app-m8ac.onrender.com";

// const socket = io(API); // 🔥 CONNECT SOCKET

const logBox = document.getElementById("log");
const statusBox = document.getElementById("status");

let mode = "rider";

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

/* 
// SOCKET EVENTS (🔥 REAL TIME)
// =====================
socket.on("ride:new", (ride) => {
  log("🆕 New ride received (live):");
  log(JSON.stringify(ride));

  loadRides();
});

socket.on("ride:update", (ride) => {
  log("🔄 Ride updated (live):");
  log(JSON.stringify(ride));

  loadRides();
});
*/

// =====================
// BACKEND CHECK
// =====================
function checkBackend() {
  fetch(`${API}/api/health`)
    .then(res => res.json())
    .then(data => {
      setStatus(
        `${data.status} | DB: ${data.db}`
      );

      log("📡 Health:");
      log(JSON.stringify(data));
    });
}

// =====================
// CREATE RIDE
// =====================
function createRide() {
  const pickup = document.getElementById("pickup").value;
  const destination = document.getElementById("destination").value;

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickup, destination, userId })
  });
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
    });
}

// =====================
// INIT
// =====================
checkBackend();
loadRides();
