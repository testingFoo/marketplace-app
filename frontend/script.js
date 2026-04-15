// IMPORTANT: replace with your Render URL
const API = "https://marketplace-app-m8ac.onrender.com";

// 1. Check backend connection
function checkBackend() {
  fetch(`${API}/api/health`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("status").innerText =
        "🟢 Connected to Render backend";
      console.log("Health:", data);
    })
    .catch(err => {
      document.getElementById("status").innerText =
        "🔴 Backend NOT connected";
      console.error(err);
    });
}

// 2. Create ride test
function createRide() {
  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pickup: "Vercel Frontend",
      destination: "Render Backend"
    })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("output").innerText =
        JSON.stringify(data, null, 2);
    })
    .catch(err => {
      document.getElementById("output").innerText =
        "Error creating ride";
      console.error(err);
    });
}

// Run check on page load
checkBackend();
