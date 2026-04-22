
const API = "https://marketplace-app-m8ac.onrender.com/";

const App = {
  openRide() {
    window.location.href = "/rider.html";
  },

  openDriver() {
    window.location.href = "/driver.html";
  }
};


// ================= AUTH =================
// ================= REGISTER =================
async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  console.log(data);

  if (res.ok) {
    alert("Registered! Now login.");
  } else {
    alert(data.error || "Register failed");
  }
}

// ================= LOGIN =================
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Login failed");
    return;
  }

  // 🔥 SAVE TOKEN + USER
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  // 🔥 REDIRECT TO PROFILE
  window.location.href = "/profile.html";
}
