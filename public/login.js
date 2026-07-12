// Simple session-based "login" — no password, no backend account.
// Good enough for a class demo: just labels the health report with a name.

document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!firstName || !lastName || !email) return;

  sessionStorage.setItem(
    "vitals_user",
    JSON.stringify({ firstName, lastName, email })
  );

  window.location.href = "dashboard.html";
});