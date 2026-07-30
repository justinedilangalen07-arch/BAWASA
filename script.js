document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");
  const logoutBtn = document.getElementById("logoutBtn");

  // Handle Login Event (if on index.html)
  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      errorMessage.classList.add("hidden");

      const ADMIN_USERNAME = "admin";
      const ADMIN_PASSWORD = "admin123";

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Save simple session state
        sessionStorage.setItem("isLoggedIn", "true");
        window.location.href = "dashboard.html";
      } else {
        errorMessage.textContent = "Invalid username or password.";
        errorMessage.classList.remove("hidden");
      }
    });
  }

  // Handle Logout Event (if on dashboard.html)
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("isLoggedIn");
      window.location.href = "index.html";
    });
  }
});