const API = "https://marketplace-app-m8ac.onrender.com";

// ================= REGISTER =================
async function register() {

    const firstName = document.getElementById("firstName")?.value?.trim()
    const surName = document.getElementById("surname")?.value?.trim()
    const email = document.getElementById("email")?.value?.trim()
    const password = document.getElementById("password")?.value

    
  console.log("EMAIL:", email);
  console.log("PASSWORD:", password);
    console.log("FIrst Name", firstName);
    console.log("Surname", surName);
    
    const payload = { firstName, surName, email, password};

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.log("REGISTER ERROR:", data);
      alert(data.error || "Register failed");
      return;
    }

    alert("Registered successfully! Now login.");
    console.log("REGISTER SUCCESS:", data);

  } catch (err) {
    console.log("REGISTER NETWORK ERROR:", err);
    alert("Network error");
  }
}

// ================= LOGIN =================
async function login() {
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  try {
    const res = await fetch(`${API}/api/auth/login`, {
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

    // save auth
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    console.log("LOGIN SUCCESS:", data);

    // redirect to profile
    window.location.href = "/profile.html";

  } catch (err) {
    console.log("LOGIN NETWORK ERROR:", err);
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
