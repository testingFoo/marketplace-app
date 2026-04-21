const API = "https://marketplace-app-m8ac.onrender.com";
const socket = io(API);

let driverId = localStorage.getItem("driverId");
let driverMongoId = localStorage.getItem("driverMongoId");

let online = false;
let map;

// ================= INIT =================
window.onload = async () => {
  initMap();
  await ensureDriverExists();
  updateProfile();
  loadJobs();
};

// ================= SOCKET =================
socket.on("connect", () => {
  console.log("Driver connected:", socket.id);
});

socket.on("ride:new", loadJobs);
socket.on("ride:update", loadJobs);

// ================= DRIVER INIT =================
async function ensureDriverExists() {
  try {
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

    console.log("Driver ready:", data);

  } catch (err) {
    console.log("Driver init error:", err);
  }
}

// ================= PROFILE =================
function updateProfile() {
  document.getElementById("profile").innerHTML = `
    <b>Driver ID:</b> ${driverId}<br/>
    <b>Status:</b> ${online ? "Online 🟢" : "Offline 🔴"}
  `;
}

// ================= MAP =================
function initMap() {
  map = L.map("map").setView([50.06, 19.94], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OSM"
  }).addTo(map);
}

// ================= LOAD JOBS =================
async function loadJobs() {
  try {
    const res = await fetch(`${API}/api/rides`);
    const rides = await res.json();

    const jobsDiv = document.getElementById("jobs");
    jobsDiv.innerHTML = "";

    rides
      .filter(r => {
        // 🔥 FINAL CLEAN LOGIC

        // show new rides
        if (r.status === "REQUESTED") return true;

        // show rides already assigned to this driver
        if (r.driverId && driverMongoId && r.driverId === driverMongoId) return true;

        return false;
      })
      .forEach(r => {
        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
          <b>${r.type}</b><br/>
          Status: ${r.status}<br/>
          Fare: $${r.fare || 0}<br/>

          ${
            r.status === "REQUESTED"
              ? `<button onclick="acceptRide('${r._id}')">ACCEPT</button>`
              : `<b>YOUR RIDE</b>`
          }
        `;

        jobsDiv.appendChild(div);
      });

  } catch (err) {
    console.log("Load jobs error:", err);
  }
}

// ================= ACCEPT RIDE =================
async function acceptRide(id) {
  try {
    if (!driverMongoId) {
      alert("Driver not ready yet");
      return;
    }

    const res = await fetch(`${API}/api/rides/${id}/accept`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverId: driverMongoId
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.log("❌ Accept failed:", data);
      alert(data.error || "Accept failed");
      return;
    }

    console.log("✅ Accepted ride:", data);

    loadJobs();

  } catch (err) {
    console.log("Accept error:", err);
  }
}

// ================= ONLINE TOGGLE =================
function toggleOnline() {
  online = !online;

  updateProfile();

  socket.emit("driver:status", {
    driverId,
    status: online ? "IDLE" : "OFFLINE"
  });
}

// expose
window.toggleOnline = toggleOnline;
window.acceptRide = acceptRide;
