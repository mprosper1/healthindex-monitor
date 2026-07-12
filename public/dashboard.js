// Guards the dashboard behind a "logged in" session, greets the user,
// and handles logout. Same pattern reused on vitals.html and report.html.

const user = JSON.parse(sessionStorage.getItem("vitals_user") || "null");

if (!user) {
  // No session found — send back to login.
  window.location.href = "index.html";
} else {
  const nameEl = document.getElementById("welcome-name");
  const sidebarNameEl = document.getElementById("sidebar-user-name");
  if (nameEl) nameEl.textContent = user.firstName;
  if (sidebarNameEl)
    sidebarNameEl.textContent = `${user.firstName} ${user.lastName}`;
}

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
  });
}

// ---------------------------------------------------------------------------
// Mobile drawer: hamburger toggle, backdrop tap-to-close, auto-close on
// selecting a nav link.
// ---------------------------------------------------------------------------
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");

function closeDrawer() {
  if (sidebar) sidebar.classList.remove("is-open");
}

if (sidebar && sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("is-open");
  });
}

if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener("click", closeDrawer);
}

document.querySelectorAll(".sidebar__link").forEach((link) => {
  link.addEventListener("click", closeDrawer);
});

// ---------------------------------------------------------------------------
// Collapsible vitals panel (mobile only — desktop always shows it expanded
// via CSS, this toggle button is hidden there).
// ---------------------------------------------------------------------------
const vitalsPanel = document.getElementById("vitals-panel");
const vitalsToggle = document.getElementById("vitals-toggle");

if (vitalsPanel && vitalsToggle) {
  vitalsToggle.addEventListener("click", () => {
    const isOpen = vitalsPanel.classList.toggle("is-open");
    vitalsToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}
