import { HomePage } from "../pages/home.js";

export let currentPage = "home";

export function navigate(page) {
  currentPage = page;
  render();
}

export function render() {
  const app = document.getElementById("app");

  switch (currentPage) {
    case "home":
      app.innerHTML = HomePage();
      break;

    case "uber":
      app.innerHTML = "<h2>🚗 Uber Module (coming next)</h2>";
      break;

    case "wallet":
      app.innerHTML = "<h2>💳 Wallet Module</h2>";
      break;

    case "business":
      app.innerHTML = "<h2>🏢 Business Module</h2>";
      break;

    default:
      app.innerHTML = "<h2>Module not found</h2>";
  }
}
