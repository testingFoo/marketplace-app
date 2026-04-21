const API = "https://marketplace-app-m8ac.onrender.com";
const socket = io(API);

let driverMongoId = localStorage.getItem("driverMongoId");

window.onload = () => {
  initMap();
  loadJobs();
};

socket.on("ride:update", loadJobs);

function initMap() {
  L.map("map").setView([50.06, 19.94], 13);
}

async function loadJobs() {
  const res = await fetch(`${API}/api/rides`);
  const rides = await res.json();

  const jobs = document.getElementById("jobs");
  jobs.innerHTML = "";

  rides.forEach(r => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <b>${r.type}</b><br/>
      Status: ${r.status}<br/>
      Fare: ${r.fare}<br/>
    `;

    // ACCEPT
    if (r.status === "REQUESTED") {
      div.innerHTML += `<button onclick="accept('${r._id}')">ACCEPT</button>`;
    }

    // ARRIVED
    if (r.status === "ACCEPTED" && r.driverId === driverMongoId) {
      div.innerHTML += `<button onclick="arrived('${r._id}')">ARRIVED</button>`;
    }

    // START
    if (r.status === "DRIVER_ARRIVED") {
      div.innerHTML += `<button onclick="start('${r._id}')">START TRIP</button>`;
    }

    // COMPLETE
    if (r.status === "IN_PROGRESS") {
      div.innerHTML += `<button onclick="complete('${r._id}')">COMPLETE</button>`;
    }

    jobs.appendChild(div);
  });
}

async function accept(id) {
  await fetch(`${API}/api/rides/${id}/accept`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId: driverMongoId })
  });
}

async function arrived(id) {
  await fetch(`${API}/api/rides/${id}/arrived`, { method: "PATCH" });
}

async function start(id) {
  await fetch(`${API}/api/rides/${id}/start`, { method: "PATCH" });
}

async function complete(id) {
  await fetch(`${API}/api/rides/${id}/complete`, { method: "PATCH" });
}

window.accept = accept;
window.arrived = arrived;
window.start = start;
window.complete = complete;
