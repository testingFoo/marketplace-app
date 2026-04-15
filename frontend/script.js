// IMPORTANT: replace with your Render URL
const API_URL = "https://YOUR-RENDER-APP.onrender.com";

async function bookRide() {
  const pickup = document.getElementById("pickup").value;
  const destination = document.getElementById("destination").value;

  const res = await fetch(`${API_URL}/api/ride`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pickup, destination })
  });

  const data = await res.json();

  document.getElementById("status").innerText =
    `Ride #${data.id} → ${data.status}`;
}
