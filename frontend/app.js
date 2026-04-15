const API = "https://marketplace-app-m8ac.onrender.com";

function log(msg) {
  const el = document.getElementById("log");
  el.innerText += "\n" + msg;
  console.log(msg);
}

function setStatus(msg) {
  document.getElementById("status").innerText = msg;
}

function checkBackend() {
  log("➡️ Checking backend...");

  const start = Date.now();

  fetch(`${API}/api/health`)
    .then(async (res) => {
      const data = await res.json();
      const time = Date.now() - start;

      setStatus("🟢 Backend Connected");
      log("✅ Response received in " + time + "ms");
      log("📦 Data: " + JSON.stringify(data, null, 2));
    })
    .catch((err) => {
      setStatus("🔴 Backend Failed");
      log("❌ ERROR:");
      log(err);
    });
}

function createRide() {
  log("➡️ Creating ride...");

  fetch(`${API}/api/ride`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pickup: "Frontend Debug",
      destination: "Render Backend"
    })
  })
    .then(async (res) => {
      const data = await res.json();

      log("✅ Ride created:");
      log(JSON.stringify(data, null, 2));
    })
    .catch((err) => {
      log("❌ Ride error:");
      log(err);
    });
}

// Auto-run on load
checkBackend();
