const loginForm = document.getElementById("adminLoginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email =
            document.getElementById("adminEmail").value.trim();

        const password =
            document.getElementById("adminPassword").value.trim();

        try {
            const response = await loginUser(email, password);

            if (!response || !response.token || !response.user) {
                throw new Error("Invalid login response.");
            }

            if (
                String(response.user.userType).trim().toLowerCase() !==
                "admin"
            ) {
                throw new Error(
                    "Access denied. Admin account required."
                );
            }

            localStorage.setItem(
                "abiaCleanCityToken",
                response.token
            );

            localStorage.setItem(
                "abiaCleanCityCurrentUser",
                JSON.stringify(response.user)
            );

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Admin login failed:", error);

            alert(
                error.message ||
                "Unable to sign in. Please try again."
            );
        }
    });
}
