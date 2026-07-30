// BAWASA Login System

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("errorMessage");

    loginForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Demo Admin Account
        const adminUsername = "admin";
        const adminPassword = "admin123";

        if (
            username === adminUsername &&
            password === adminPassword
        ) {

            // Hide error message
            errorMessage.classList.add("hidden");

            // Save login session
            localStorage.setItem("isLoggedIn", "true");

            // Redirect to dashboard
            window.location.href = "dashboard.html";

        } else {

            // Show error
            errorMessage.classList.remove("hidden");

            // Clear password
            passwordInput.value = "";

            // Focus password field
            passwordInput.focus();
        }

    });

});