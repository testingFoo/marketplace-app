const API = "https://marketplace-app-m8ac.onrender.com/api";

// ================= LOAD PROFILE =================
window.onload = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/";
    return;
  }

  const res = await fetch(`${API}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!data.user) {
    localStorage.clear();
    window.location.href = "/";
    return;
  }

  renderProfile(data.user);
};

// ================= RENDER =================
function renderProfile(user) {
  document.getElementById("profile").innerHTML = `
    <div class="card">
      <h2>${user.name || "No name"}</h2>
      <p><b>Email:</b> ${user.email}</p>

      <p><b>DOB:</b> ${user.dob || "-"}</p>
      <p><b>Sex:</b> ${user.sex || "-"}</p>
      <p><b>Education:</b> ${user.education || "-"}</p>

      <p><b>Current City:</b> ${user.currentCity || "-"}</p>
      <p><b>Born City:</b> ${user.bornCity || "-"}</p>

      <hr/>

      <p><b>Wallet:</b> $${user.walletBalance}</p>
      <p><b>Currency:</b> ${user.currency}</p>

      <hr/>

      <p><b>Business:</b> ${user.business?.name || "No business"}</p>
    </div>
  `;
}

// ================= LOGOUT =================
function logout() {
  localStorage.clear();
  window.location.href = "/";
}
