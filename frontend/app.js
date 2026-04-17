const API = "https://marketplace-app-m8ac.onrender.com";

let socket;
let userId = localStorage.getItem("userId") || ("user_" + Date.now());
let driverId = localStorage.getItem("driverId") || ("driver_" + Date.now());

let driverOnline = false;

// ================= INIT =================
window.onload = () => {
  socket = io(API);

  socket.on("connect", () => console.log("🟢 socket"));

  socket.on("ride:new", loadRides);
  socket.on("ride:update", loadRides);

  initMap();
  loadRides();
};

// ================= MAP =================
let map;

function initMap() {
  setTimeout(() => {
    map = L.map("map").setView([52.2297, 21.0122], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OSM"
    }).addTo(map);

    map.invalidateSize();
  }, 300);
}

// ================= CREATE =================
function createRide() {
  const pickup = document.getElementById("pickup").value;
  const destination = document.getElementById("destination").value;

  if (!pickup || !destination) {
    alert("Enter pickup & destination");
    return;
  }

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      pickup,
      destination,
      userId
    })
  });
}

// ================= DRIVER =================
function toggleDriver() {
  driverOnline = !driverOnline;

  if (driverOnline) {
    socket.emit("driver:online", driverId);
    document.getElementById("driverStatus").innerText = "Online";
  } else {
    socket.emit("driver:offline", driverId);
    document.getElementById("driverStatus").innerText = "Offline";
  }
}

// ================= ACCEPT =================
function acceptRide(id) {
  fetch(`${API}/api/ride/${id}/accept`, {
    method: "PATCH",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ driverId })
  });
}

// ================= STATUS =================
function updateStatus(id, status) {
  fetch(`${API}/api/ride/${id}/status`, {
    method: "PATCH",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ status })
  });
}

// ================= CANCEL =================
function cancelRide(id) {
  fetch(`${API}/api/ride/${id}/cancel`, {
    method: "PATCH"
  });
}

// ================= LOAD =================
function loadRides() {
  fetch(`${API}/api/rides`)
    .then(r => r.json())
    .then(data => {
      renderRider(data);
      renderDriver(data);
    });
}

// ================= RIDER =================
function renderRider(rides) {
  const box = document.getElementById("riderRides");
  box.innerHTML = "";

  rides
    .filter(r => r.userId === userId)
    .forEach(r => {
      box.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          Status: ${r.status}<br/>
          Fare: ${r.fare || 0} PLN<br/>
          Driver: ${r.driverId || "Searching..."}<br/>

          ${r.status !== "COMPLETED" && r.status !== "CANCELLED"
            ? `<button onclick="cancelRide('${r._id}')">Cancel</button>`
            : ""}
        </div>
      `;
    });
}

// ================= DRIVER =================
function renderDriver(rides) {
  const box = document.getElementById("driverRides");
  box.innerHTML = "";

  rides.forEach(r => {

    if (r.status === "REQUESTED") {
      box.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          Fare: ${r.fare || 0} PLN<br/>
          <button onclick="acceptRide('${r._id}')">Accept</button>
        </div>
      `;
    }

    if (r.driverId === driverId) {
      box.innerHTML += `
        <div class="ride">
          ${r.pickup} → ${r.destination}<br/>
          Status: ${r.status}<br/>

          ${r.status === "ACCEPTED"
            ? `<button onclick="updateStatus('${r._id}', 'ARRIVING')">Arriving</button>`
            : ""}

          ${r.status === "ARRIVING"
            ? `<button onclick="updateStatus('${r._id}', 'IN_PROGRESS')">Start</button>`
            : ""}

          ${r.status === "IN_PROGRESS"
            ? `<button onclick="updateStatus('${r._id}', 'COMPLETED')">Complete</button>`
            : ""}
        </div>
      `;
    }

  });
}

// ================= GLOBAL =================
window.createRide = createRide;
window.toggleDriver = toggleDriver;
window.acceptRide = acceptRide;
window.updateStatus = updateStatus;
window.cancelRide = cancelRide;
