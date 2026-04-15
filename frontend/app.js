const API = "https://marketplace-app-m8ac.onrender.com";

function log(msg) {
  const el = document.getElementById("log");
  el.innerText += "\n" + msg;
  console.log(msg);
}

function setStatus(msg) {
  document.getElementById("status").innerText = msg;
}

// Check backend
function checkBackend() {
  log("➡️ Checking backend...");

  fetch(`${API}/api/health`)
    .then(res => res.json())
    .then(data => {
      const backendStatus = data.status === "ok" ? "🟢 Backend OK" : "🔴 Backend Error";
      const dbStatus = data.db === "connected" ? "🟢 DB Connected" : "🔴 DB Disconnected";

      setStatus(`${backendStatus} | ${dbStatus}`);

      log("✅ Health response:");
      log(JSON.stringify(data, null, 2));
    })
    .catch(err => {
      setStatus("🔴 Backend Failed");
      log("❌ ERROR: " + err);
    });
}

// Create ride
function createRide() {
  log("➡️ Creating ride...");

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pickup: "Debug Location A",
      destination: "Debug Location B"
    })
  })
  .then(res => res.json())
  .then(data => {
    log("✅ Ride created: " + JSON.stringify(data));
    loadRides();
  })
  .catch(err => log("❌ Ride error: " + err));
}

// Load rides
function loadRides() {
  log("➡️ Loading rides...");

  fetch(`${API}/api/rides`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("rides");
      container.innerHTML = "";

      data.forEach(ride => {
        const div = document.createElement("div");
        div.className = "ride";

        div.innerHTML = `
          <b>ID:</b> ${ride._id}<br>
          <b>From:</b> ${ride.pickup}<br>
          <b>To:</b> ${ride.destination}<br>
          <b>Status:</b> ${ride.status}<br>

          <button onclick="updateStatus('${ride._id}', 'ACCEPTED')">Accept</button>
          <button onclick="updateStatus('${ride._id}', 'ARRIVING')">Arriving</button>
          <button onclick="updateStatus('${ride._id}', 'IN_PROGRESS')">Start</button>
          <button onclick="updateStatus('${ride._id}', 'COMPLETED')">Complete</button>
        `;

        container.appendChild(div);
      });

      log(`✅ Loaded ${data.length} rides`);
    })
    .catch(err => log("❌ Load error: " + err));
}

// Update ride status
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
    log("✅ Updated: " + JSON.stringify(data));
    loadRides();
  })
  .catch(err => log("❌ Update error: " + err));
}

// Init
checkBackend();
loadRides();
