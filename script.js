// ===============================
// BAWASA Management System
// script.js
// ===============================

document.addEventListener("DOMContentLoaded", function () {

    // ===============================
    // LOGIN PAGE
    // ===============================

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        const username = document.getElementById("username");
        const password = document.getElementById("password");
        const errorMessage = document.getElementById("errorMessage");

        // Demo Admin Account
        const ADMIN_USERNAME = "admin";
        const ADMIN_PASSWORD = "admin123";

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const user = username.value.trim();
            const pass = password.value.trim();

            // Hide previous error
            errorMessage.classList.add("hidden");

            // Check empty fields
            if (user === "" || pass === "") {
                errorMessage.textContent = "Please enter your username and password.";
                errorMessage.classList.remove("hidden");
                return;
            }

            // Validate login
            if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {

                // Save login session
                localStorage.setItem("loggedIn", "true");
                localStorage.setItem("adminName", "Administrator");

                alert("Login Successful!");

                // Redirect to dashboard
                window.location.href = "dashboard.html";

            } else {

                errorMessage.textContent = "Invalid username or password.";
                errorMessage.classList.remove("hidden");

                password.value = "";
                password.focus();

            }

        });

    }

    // ===============================
    // DASHBOARD PAGE
    // ===============================

    if (window.location.pathname.includes("dashboard.html")) {

        // Check login session
        if (localStorage.getItem("loggedIn") !== "true") {
            window.location.href = "index.html";
            return;
        }

        // Display admin name
        const adminName = document.getElementById("adminName");

        if (adminName) {
            adminName.textContent =
                localStorage.getItem("adminName") || "Administrator";
        }

        // Logout Button
        const logoutBtn = document.getElementById("logoutBtn");

        if (logoutBtn) {

            logoutBtn.addEventListener("click", function () {

                const confirmLogout = confirm("Are you sure you want to logout?");

                if (confirmLogout) {

                    localStorage.removeItem("loggedIn");
                    localStorage.removeItem("adminName");

                    alert("Logged out successfully.");

                    window.location.href = "index.html";

                }

            });

        }

    }

});