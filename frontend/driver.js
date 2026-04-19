const API = "https://marketplace-app-m8ac.onrender.com";
const socket = io(API);

let driverId = localStorage.getItem("driverId");

if (!driverId) {
  driverId = "D-" + Math.floor(Math.random() * 99999);
  localStorage.setItem("driverId", driverId);
}

let online = false;

// ================= INIT =================
window.onload = () => {
  document.getElementById("profile").innerHTML = `
    <b>Driver ID:</b> ${driverId}<br/>
    <b>Status:</b> ${online ? "Online" : "Offline"}
  `;

  loadJobs();
};

// ================= SOCKET =================
socket.on("connect", () => {
  console.log("Driver connected:", socket.id);
});

socket.on("ride:new", () => {
  loadJobs();
});

socket.on("ride:update", () => {
  loadJobs();
});

// ================= LOAD JOBS =================
async function loadJobs() {
  try {
    const res = await fetch(`${API}/api/rides`);
    const rides = await res.json();

    const jobsDiv = document.getElementById("jobs");
    jobsDiv.innerHTML = "";

    rides
      .filter(r => r.status === "REQUESTED" || r.status === "ACCEPTED")
      .forEach(r => {
        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
          <b>${r.type}</b><br/>
          ${r.origin} → ${r.destination}<br/>
          Status: ${r.status}<br/>
          Fare: $${r.fare || 0}<br/>

          ${r.status === "REQUESTED" ? `
            <button onclick="acceptRide('${r._id}')">ACCEPT</button>
          ` : ""}
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
    const res = await fetch(`${API}/api/rides/${id}/accept`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId })
    });

    const data = await res.json();
    console.log("Accepted ride:", data);

    loadJobs();

  } catch (err) {
    console.log("Accept error:", err);
  }
}

// ================= TOGGLE ONLINE =================
function toggleOnline() {
  online = !online;

  document.getElementById("profile").innerHTML = `
    <b>Driver ID:</b> ${driverId}<br/>
    <b>Status:</b> ${online ? "Online 🟢" : "Offline 🔴"}
  `;

  socket.emit("driver:status", {
    driverId,
    online
  });
}

// expose to HTML buttons
window.toggleOnline = toggleOnline;
window.acceptRide = acceptRide;
