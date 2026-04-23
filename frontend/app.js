
const API = "https://marketplace-app-m8ac.onrender.com";

// ================= REGISTER =================
async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("REGISTER INPUT:", { email, password });

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log("REGISTER RESPONSE:", data);

    if (!res.ok) {
      alert(data.error || "Register failed");
      return;
    }

    alert("Registered successfully!");

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    alert("Network error");
  }
}

// ================= LOGIN =================
async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  console.log("LOGIN INPUT:", { email, password });

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log("LOGIN RESPONSE:", data);

    if (!res.ok) {
      alert(data.error || "Login failed");
      return;
    }

    localStorage.setItem("token", data.token);
    alert("Logged in!");

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    alert("Network error");
  }
}
// ================= OPTIONAL HELPERS =================

// get logged user safely
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

// logout helper
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}
