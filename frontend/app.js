const API = "https://marketplace-app-m8ac.onrender.com";

// Check backend
function checkBackend() {
  fetch(`${API}/api/health`)
    .then(res => res.json())
    .then(() => {
      document.getElementById("status").innerText =
        "🟢 Connected to backend";
    })
    .catch(() => {
      document.getElementById("status").innerText =
        "🔴 Backend not connected";
    });
}

// Create ride
function createRide() {
  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pickup: "Location A",
      destination: "Location B"
    })
  })
  .then(res => res.json())
  .then(() => loadRides());
}

// Load rides
function loadRides() {
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
    });
}

// Update ride status
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  })
  .then(res => res.json())
  .then(() => loadRides());
}

// Init
checkBackend();
loadRides();
