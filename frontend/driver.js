const API = "https://marketplace-app-m8ac.onrender.com";
const socket = io(API);

let driverId = localStorage.getItem("driverId");
let driverMongoId = localStorage.getItem("driverMongoId");

let map;

// INIT
window.onload = async () => {
  initMap();
  await ensureDriverExists();
  loadJobs();
};

// MAP
function initMap() {
  map = L.map("map").setView([50.06, 19.94], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OSM"
  }).addTo(map);
}

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
      name: "Driver " + driverId
    })
  });

  const data = await res.json();

  driverMongoId = data._id;
  localStorage.setItem("driverMongoId", driverMongoId);
}

// LOAD JOBS
async function loadJobs() {
  const res = await fetch(`${API}/api/rides`);
  const rides = await res.json();

  const jobsDiv = document.getElementById("jobs");
  jobsDiv.innerHTML = "";

  rides.forEach(r => {
    const div = document.createElement("div");
    div.className = "card";

    let actions = "";

    if (r.status === "REQUESTED") {
      actions = `<button onclick="acceptRide('${r._id}')">ACCEPT</button>`;
    }

    if (r.status === "DRIVER_ASSIGNED") {
      actions = `<button onclick="startToPickup('${r._id}')">GO TO PICKUP</button>`;
    }

    if (r.status === "EN_ROUTE_TO_PICKUP") {
      actions = `<button onclick="arrived('${r._id}')">ARRIVED</button>`;
    }

    if (r.status === "AT_PICKUP") {
      actions = `<button onclick="startTrip('${r._id}')">START TRIP</button>`;
    }

    div.innerHTML = `
      <b>${r.type}</b><br/>
      Status: ${r.status}<br/>
      ${actions}
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

  loadJobs();
}

async function startToPickup(id) {
  await fetch(`${API}/api/rides/${id}/start-to-pickup`, {
    method: "PATCH"
  });

  loadJobs();
}

async function arrived(id) {
  await fetch(`${API}/api/rides/${id}/arrived`, {
    method: "PATCH"
  });

  loadJobs();
}

async function startTrip(id) {
  await fetch(`${API}/api/rides/${id}/start-trip`, {
    method: "PATCH"
  });

  loadJobs();
}
