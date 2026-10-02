const BASE_URL = API_BASE_URL;

/* =========================
   API REQUEST HELPER
========================= */

async function apiRequest(endpoint, options = {}) {

    try {

        const response = await fetch(
            `${BASE_URL}${endpoint}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                },
                ...options
            }
        );

        const contentType =
            response.headers.get("content-type") || "";

        let data = {};

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();

            if (text) {
                data = {
                    message: text
                };
            }
        }

        if (!response.ok) {

            const error = new Error(
                data.message || "Something went wrong."
            );

            error.status = response.status;
            error.data = data;

            throw error;
        }

        return data;

    } catch (error) {

        if (error instanceof TypeError) {

            console.error("Network error:", error);

            throw new Error(
                "Unable to connect to the server. Please try again."
            );
        }

        console.error("API request error:", error);

        throw error;
    }
}

/* =========================
   REGISTER USER
========================= */

async function registerUser(userData) {

    return apiRequest("/register", {

        method: "POST",

        body: JSON.stringify(userData)

    });

}


/* =========================
   LOGIN USER
========================= */

async function loginUser(email, password) {

    return apiRequest("/login", {

        method: "POST",

        body: JSON.stringify({
            email,
            password
        })

    });

}


/* =========================
   GET USER PROFILE
========================= */

async function getUserProfile(token) {

    return apiRequest("/profile", {

        method: "GET",

        headers: {
            Authorization: `Bearer ${token}`
        }

    });

}