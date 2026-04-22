
const API = "https://marketplace-app-m8ac.onrender.com/api";

const App = {
  openRide() {
    window.location.href = "/rider.html";
  },

  openDriver() {
    window.location.href = "/driver.html";
  }
};


// ================= AUTH =================

async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    console.log("REGISTER ERROR:", data);
    alert(data.error || "Register failed");
    return;
  }

  console.log("REGISTER OK:", data);
  alert("Registered successfully");
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    console.log("LOGIN ERROR:", data);
    alert(data.error || "Login failed");
    return;
  }

  document.getElementById("userBox").innerText =
    "Logged in: " + data.user.email;

  console.log("LOGIN OK:", data);
}
