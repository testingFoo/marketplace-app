const API = "https://marketplace-app-m8ac.onrender.com/api";

// ================= LOAD PROFILE =================
window.onload = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/";
    return;
  }

  try {
    // ✅ FIXED (removed double /api)
    const res = await fetch(`${API}/auth/me`, {
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

  } catch (err) {
    console.log("PROFILE LOAD ERROR:", err);
    window.location.href = "/";
  }
};

// ================= RENDER =================
function renderProfile(user) {
  document.getElementById("profile").innerHTML = `
    <div class="card">

      <h2>${user.name || "No name"}</h2>
      <p><b>Email:</b> ${user.email}</p>
      <p><b>Phone:</b> ${user.phone || "-"}</p>

      <hr/>

      <p><b>DOB:</b> ${user.dob ? new Date(user.dob).toLocaleDateString() : "-"}</p>
      <p><b>Sex:</b> ${user.sex || "-"}</p>

      <hr/>

      <p><b>Profession:</b> ${user.profession || "-"}</p>
      <p><b>Industry:</b> ${user.industry || "-"}</p>

      <hr/>

      <p><b>City:</b> ${user.currentCity || "-"}</p>
      <p><b>Country:</b> ${user.country || "-"}</p>

      <hr/>

      <p><b>Wallet:</b> ${user.walletBalance} ${user.currency}</p>

      <hr/>

      <p><b>Business:</b> ${
        user.roles?.business?.isBusinessOwner
          ? user.roles.business.name || "Unnamed business"
          : "No business"
      }</p>

      ${
        user.roles?.business?.isBusinessOwner
          ? `
          <p><b>Website:</b> ${user.roles.business.website || "-"}</p>
          <p><b>Business Email:</b> ${user.roles.business.email || "-"}</p>
        `
          : ""
      }

      <hr/>

      <p><b>Commodities:</b></p>
      <ul>
        ${
          user.commodities && user.commodities.length > 0
            ? user.commodities.map(c => `
                <li>${c.type || "-"}: ${c.name || "-"} (${c.amount || 0})</li>
              `).join("")
            : "<li>None</li>"
        }
      </ul>

      <hr/>

      <button onclick="logout()">Logout</button>
    </div>
  `;
}

// ================= LOGOUT =================
function logout() {
  localStorage.clear();
  window.location.href = "/";
}
