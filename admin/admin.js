
/* =========================================================
   ADMIN AUTHENTICATION AND API CONFIGURATION
========================================================= */

const ADMIN_TOKEN_KEY = "abiaCleanCityToken";
const ADMIN_USER_KEY = "abiaCleanCityCurrentUser";

const API_ROOT = API_BASE_URL.replace(/\/users$/, "");


/* =========================================================
   SHARED ADMIN API REQUEST HELPER
========================================================= */

async function adminApiRequest(endpoint, options = {}) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    const response = await fetch(`${API_ROOT}${endpoint}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            ...(token
                ? { Authorization: `Bearer ${token}` }
                : {})
        }
    });

    const contentType =
        response.headers.get("content-type") || "";

    let data = {};

    if (contentType.includes("application/json")) {
        try {
            data = await response.json();
        } catch {
            throw new Error("The server returned invalid JSON.");
        }
    } else {
        const message = await response.text();
        data = { message };
    }

    if (!data || typeof data !== "object") {
        data = { message: String(data) };
    }

    if (!response.ok || data.success === false) {
        const error = new Error(
            data.message || `Request failed (${response.status}).`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}


/* =========================================================
   HTML ESCAPING HELPER
========================================================= */

function escapeAdminHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


/* =========================================================
   ADMIN AUTHENTICATION GUARD
========================================================= */

async function verifyAdminSession() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const storedUser = localStorage.getItem(ADMIN_USER_KEY);

    if (!token || !storedUser) {
        window.location.href = "login.html";
        return false;
    }

    let cachedUser;

    try {
        cachedUser = JSON.parse(storedUser);
    } catch {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
        window.location.href = "login.html";
        return false;
    }

    // Reject an account that is already known not to be an admin.
    if (
        !cachedUser ||
        String(cachedUser.userType).trim().toLowerCase() !== "admin"
    ) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
        window.location.href = "login.html";
        return false;
    }

    try {
        const response = await getUserProfile(token);

        if (!response || !response.user) {
            throw new Error("Invalid session response.");
        }

        const userType =
            String(response.user.userType || "")
                .trim()
                .toLowerCase();

        if (userType !== "admin") {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_USER_KEY);
            window.location.href = "login.html";
            return false;
        }

        // Refresh the cached user with the verified server data.
        localStorage.setItem(
            ADMIN_USER_KEY,
            JSON.stringify(response.user)
        );

        return true;

    } catch (error) {
        console.error("Admin session verification failed:", error);

        // Clear the session only when the server rejects authentication.
        if (error.status === 401 || error.status === 403) {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_USER_KEY);
            window.location.href = "login.html";
        }

        // Network/server errors must not automatically erase a valid session.
        return false;
    }
}


/* =========================================================
   LOAD ADMIN USERS
========================================================= */

async function loadAdminUsers() {
    const usersTableBody =
        document.getElementById("usersTableBody");

    const totalUsers =
        document.getElementById("totalUsers");

    if (!usersTableBody) {
        return;
    }

    try {
        const data = await adminApiRequest("/users/admin/users");

        if (!Array.isArray(data.users)) {
            throw new Error(
                "The server returned an invalid users response."
            );
        }

        const users = data.users;

        if (totalUsers) {
            totalUsers.textContent = users.length;
        }

        if (users.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7">No users found.</td>
                </tr>
            `;
            return;
        }

        usersTableBody.innerHTML = users.map(user => `
            <tr>
                <td>${escapeAdminHTML(user.name || "-")}</td>
                <td>${escapeAdminHTML(user.email || "-")}</td>
                <td>${escapeAdminHTML(user.phone || "-")}</td>
                <td>${escapeAdminHTML(user.address || "-")}</td>
                <td>${escapeAdminHTML(user.buildingType || "-")}</td>
                <td>${escapeAdminHTML(user.userType || "-")}</td>
                <td>${escapeAdminHTML(user.paymentStatus || "Not Paid")}</td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Admin users error:", error);

        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7">Unable to load users. Please try again.</td>
            </tr>
        `;
    }
}


/* =========================================================
   LOAD ADMIN PAYMENTS
========================================================= */

async function loadAdminPayments() {
    const paymentsTableBody =
        document.getElementById("paymentsTableBody");

    if (!paymentsTableBody) {
        return;
    }

    try {
        const data = await adminApiRequest("/payments/admin");

        if (!Array.isArray(data.payments)) {
            throw new Error(
                "The server returned an invalid payments response."
            );
        }

        const payments = data.payments;

        if (payments.length === 0) {
            paymentsTableBody.innerHTML = `
                <tr>
                    <td colspan="3">No payment records available.</td>
                </tr>
            `;
            return;
        }

        paymentsTableBody.innerHTML = payments.map(payment => {
            const userName =
                escapeAdminHTML(payment.user?.name || "Unknown user");

            const amount = Number(payment.amount);

            const formattedAmount = Number.isFinite(amount)
                ? amount.toLocaleString("en-NG")
                : "—";

            const status =
                escapeAdminHTML(payment.status || "Pending");

            return `
                <tr>
                    <td>${userName}</td>
                    <td>₦${formattedAmount}</td>
                    <td>${status}</td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Admin payments error:", error);

        paymentsTableBody.innerHTML = `
            <tr>
                <td colspan="3">Unable to load payment records. Please try again.</td>
            </tr>
        `;
    }
}


/* =========================================================
   LOAD ADMIN WASTE REPORTS
========================================================= */

async function loadAdminReports() {
    const reportsTableBody =
        document.getElementById("reportsTableBody");

    const totalReports =
        document.getElementById("totalReports");

    if (!reportsTableBody) {
        return;
    }

    try {
        const data = await adminApiRequest("/reports/admin");

        if (!Array.isArray(data.reports)) {
            throw new Error(
                "The server returned an invalid waste reports response."
            );
        }

        const reports = data.reports;

        if (totalReports) {
            totalReports.textContent = reports.length;
        }

        if (reports.length === 0) {
            reportsTableBody.innerHTML = `
                <tr>
                    <td colspan="2">No waste reports available.</td>
                </tr>
            `;

            updateReportsChart([]);
            return;
        }

        reportsTableBody.innerHTML = reports.map(report => {
            const issue = escapeAdminHTML(report.issue || "-");

            const parsedDate = report.createdAt
                ? new Date(report.createdAt)
                : null;

            const date =
                parsedDate && !Number.isNaN(parsedDate.getTime())
                    ? parsedDate.toLocaleDateString()
                    : "-";

            return `
                <tr>
                    <td>${issue}</td>
                    <td>${escapeAdminHTML(date)}</td>
                </tr>
            `;
        }).join("");

        updateReportsChart(reports);

    } catch (error) {
        console.error("Admin waste reports error:", error);

        reportsTableBody.innerHTML = `
            <tr>
                <td colspan="2">Unable to load waste reports. Please try again.</td>
            </tr>
        `;

        // Keep the last known count and chart when loading fails.
    }
}


/* =========================================================
   WASTE REPORTS CHART
========================================================= */

let reportsChart;

function updateReportsChart(reports) {
    const chartCanvas =
        document.getElementById("reportsChart");

    if (!chartCanvas || typeof Chart === "undefined") {
        return;
    }

    const statuses = ["Pending", "In Progress", "Resolved"];

    const statusCounts = statuses.map(status =>
        reports.filter(report => report.status === status).length
    );

    if (reportsChart) {
        reportsChart.destroy();
    }

    reportsChart = new Chart(chartCanvas, {
        type: "doughnut",

        data: {
            labels: statuses,

            datasets: [{
                data: statusCounts
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


/* =========================================================
   LOAD PAYMENT SUMMARY
========================================================= */

async function loadPaymentSummary() {
    const totalPayments =
        document.getElementById("totalPayments");

    try {
        const data = await adminApiRequest("/payments/admin/summary");

        if (!data.summary || typeof data.summary !== "object") {
            throw new Error(
                "The server returned an invalid payment summary."
            );
        }

        const summary = data.summary;
        const totalAmount = Number(summary.totalAmount);

        if (!Number.isFinite(totalAmount)) {
            throw new Error(
                "The server returned an invalid total payment amount."
            );
        }

        if (totalPayments) {
            totalPayments.textContent =
                `₦${totalAmount.toLocaleString("en-NG")}`;
        }

        updatePaymentsChart(summary);

    } catch (error) {
        console.error("Payment summary error:", error);

        // Do not display a false zero when the request fails.
        if (totalPayments) {
            totalPayments.textContent = "Unable to load";
        }

        // Preserve the existing chart if the request fails.
    }
}


/* =========================================================
   PAYMENTS CHART
========================================================= */

let paymentsChart;

function updatePaymentsChart(summary) {
    const chartCanvas =
        document.getElementById("paymentsChart");

    if (!chartCanvas || typeof Chart === "undefined") {
        return;
    }

    const paidCount = Number(summary.paidCount || 0);
    const pendingCount = Number(summary.pendingCount || 0);
    const failedCount = Number(summary.failedCount || 0);

    if (paymentsChart) {
        paymentsChart.destroy();
    }

    paymentsChart = new Chart(chartCanvas, {
        type: "doughnut",

        data: {
            labels: [
                "Paid",
                "Pending",
                "Failed"
            ],

            datasets: [{
                data: [
                    paidCount,
                    pendingCount,
                    failedCount
                ]
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


/* =========================================================
   INITIALIZE ADMIN DASHBOARD
========================================================= */

async function initializeAdminDashboard() {
    const authenticated = await verifyAdminSession();

    if (!authenticated) {
        return;
    }

    // Start dashboard requests only after authentication succeeds.
    await Promise.all([
        loadAdminUsers(),
        loadAdminPayments(),
        loadAdminReports(),
        loadPaymentSummary()
    ]);
}

initializeAdminDashboard();


/* =========================================================
   LOGOUT BUTTON
========================================================= */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);

        window.location.href = "login.html";
    });
}


/* =========================================================
   USER SEARCH
========================================================= */

const userSearch = document.getElementById("userSearch");

if (userSearch) {
    userSearch.addEventListener("keyup", function () {
        const filter = userSearch.value.toLowerCase();

        const rows = document.querySelectorAll(
            "#usersTable tbody tr"
        );

        rows.forEach(row => {
            const text = row.innerText.toLowerCase();

            row.style.display =
                text.includes(filter) ? "" : "none";
        });
    });
}


/* =========================================================
   PAYMENT FILTER
========================================================= */

const paymentFilter =
    document.getElementById("paymentFilter");

if (paymentFilter) {
    paymentFilter.addEventListener("change", function () {
        const value = paymentFilter.value;

        const rows = document.querySelectorAll(
            "#paymentsTable tbody tr"
        );

        rows.forEach(row => {
            const statusCell = row.cells[2];

            if (!statusCell) {
                row.style.display = "";
                return;
            }

            const status = statusCell.innerText.trim();

            row.style.display =
                value === "" || status === value ? "" : "none";
        });
    });
}
