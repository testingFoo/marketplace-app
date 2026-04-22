const API = "https://marketplace-app-m8ac.onrender.com";

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
  console.log(data);
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

  document.getElementById("userBox").innerText =
    data.user ? "Logged in: " + data.user.email : "Login failed";
}
