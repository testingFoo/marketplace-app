const API = "https://marketplace-app-m8ac.onrender.com/api";
const socket = io(API);

let driverId = localStorage.getItem("driverId");
let driverMongoId = localStorage.getItem("driverMongoId");

let online = false;
let map;

// INIT
window.onload = async () => {
  initMap();
  await ensureDriverExists();
  updateProfile();
  loadJobs();
};

// SOCKET
socket.on("ride:new", loadJobs);
socket.on("ride:update", loadJobs);

// CREATE DRIVER
async function ensureDriverExists() {
  if (!driverId) {
    driverId = "D-" + Math.floor(Math.random() * 99999);
    localStorage.setItem("driverId", driverId);
  }

  const res = await fetch(`${API}/api/driver/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: driverId,
      name: "Driver " + driverId,
      vehicleType: "UBERX"
    })
  });

  const data = await res.json();
  driverMongoId = data._id;
  localStorage.setItem("driverMongoId", driverMongoId);
}

// PROFILE
function updateProfile() {
  document.getElementById("profile").innerHTML = `
    <b>Driver ID:</b> ${driverId}<br/>
    <b>Status:</b> ${online ? "Online 🟢" : "Offline 🔴"}
  `;
}

// MAP
function initMap() {
  map = L.map("map").setView([50.06, 19.94], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
}

// LOAD JOBS
async function loadJobs() {
  const res = await fetch(`${API}/api/rides`);
  const rides = await res.json();

  const jobsDiv = document.getElementById("jobs");
  jobsDiv.innerHTML = "";

  rides
    .filter(r =>
      r.status === "REQUESTED" ||
      r.driverId === driverMongoId
    )
    .forEach(r => {
      let buttons = "";

      if (r.status === "REQUESTED") {
        buttons = `<button onclick="acceptRide('${r._id}')">ACCEPT</button>`;
      }

      if (r.status === "DRIVER_ARRIVING") {
        buttons = `<button onclick="arrived('${r._id}')">ARRIVED</button>`;
      }

      if (r.status === "WAITING_START") {
        buttons = `<button onclick="startTrip('${r._id}')">START TRIP</button>`;
      }

      if (r.status === "IN_PROGRESS") {
        buttons = `<button onclick="completeRide('${r._id}')">COMPLETE</button>`;
      }

      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <b>${r.type}</b><br/>
        Status: ${r.status}<br/>
        ${buttons}
      `;

      jobsDiv.appendChild(div);
    });
}

// ACTIONS
async function acceptRide(id) {
  await fetch(`${API}/api/rides/${id}/accept`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId: driverMongoId })
  });
}

async function arrived(id) {
  await fetch(`${API}/api/rides/${id}/arrived`, { method: "PATCH" });
}

async function startTrip(id) {
  await fetch(`${API}/api/rides/${id}/start`, { method: "PATCH" });
}

async function completeRide(id) {
  await fetch(`${API}/api/rides/${id}/complete`, { method: "PATCH" });
}

// TOGGLE
function toggleOnline() {
  online = !online;
  updateProfile();
}

window.toggleOnline = toggleOnline;
window.acceptRide = acceptRide;
window.arrived = arrived;
window.startTrip = startTrip;
window.completeRide = completeRide;
