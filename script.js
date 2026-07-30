// Wait until the page is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const errorMessage = document.getElementById("errorMessage");

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        // Hide previous error
        errorMessage.classList.add("hidden");

        // Admin credentials
        const ADMIN_USERNAME = "admin";
        const ADMIN_PASSWORD = "admin123";

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            alert("Access Granted! Redirecting to Admin Dashboard...");

            // Redirect to dashboard
            window.location.href = "dashboard.html";
        } else {
            errorMessage.textContent = "Invalid username or password.";
            errorMessage.classList.remove("hidden");
        }
    });
});