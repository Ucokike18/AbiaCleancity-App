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

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Something went wrong."
            );
        }

        return data;

    } catch (error) {

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