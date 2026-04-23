
const API = "https://marketplace-app-m8ac.onrender.com";


// ================= AUTH =================
// ================= REGISTER =================
async function register() {
  const payload = {
    email: document.getElementById("email")?.value,
    password: document.getElementById("password")?.value,

    // 👤 optional fields (safe)
    firstName: document.getElementById("firstName")?.value,
    surname: document.getElementById("surname")?.value,
    sex: document.getElementById("sex")?.value,
    dob: document.getElementById("dob")?.value,

    // 🌍 location
    city: document.getElementById("city")?.value,
    country: document.getElementById("country")?.value,

    // 📞 contact
    phone: document.getElementById("phone")?.value,

    // 💼 professional
    profession: document.getElementById("profession")?.value,
    industry: document.getElementById("industry")?.value,

    // 🏢 business
    isBusinessOwner: document.getElementById("isBusinessOwner")?.checked,
    businessName: document.getElementById("businessName")?.value,
    website: document.getElementById("website")?.value,
    businessEmail: document.getElementById("businessEmail")?.value,

    // 💰 preferences
    currency: document.getElementById("currency")?.value
  };

  // 🧹 REMOVE EMPTY FIELDS (VERY IMPORTANT)
  Object.keys(payload).forEach(key => {
    if (
      payload[key] === undefined ||
      payload[key] === null ||
      payload[key] === ""
    ) {
      delete payload[key];
    }
  });

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log(data);

    if (res.ok) {
      alert("Registered! Now login.");
    } else {
      alert(data.error || "Register failed");
    }

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    alert("Network error");
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
