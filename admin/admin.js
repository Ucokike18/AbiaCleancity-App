/* =========================================================
   ADMIN AUTHENTICATION AND API CONFIGURATION
========================================================= */

const ADMIN_TOKEN_KEY = "abiaCleanCityToken";
const ADMIN_USER_KEY = "abiaCleanCityCurrentUser";

const API_ROOT = API_BASE_URL.replace(/\/users\/?$/, "");


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
        data = {
            message: await response.text()
        };
    }

    if (!data || typeof data !== "object") {
        data = {
            message: String(data)
        };
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

    if (
        !cachedUser ||
        String(cachedUser.userType || "")
            .trim()
            .toLowerCase() !== "admin"
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

        const userType = String(response.user.userType || "")
            .trim()
            .toLowerCase();

        if (userType !== "admin") {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_USER_KEY);
            window.location.href = "login.html";
            return false;
        }

        localStorage.setItem(
            ADMIN_USER_KEY,
            JSON.stringify(response.user)
        );

        return true;

    } catch (error) {
        console.error(
            "Admin session verification failed:",
            error
        );

        if (error.status === 401 || error.status === 403) {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_USER_KEY);
            window.location.href = "login.html";
        }

        return false;
    }
}


/* =========================================================
   USER SEARCH AND FILTER HELPERS
========================================================= */

function applyUserSearch() {
    const userSearch = document.getElementById("userSearch");
    const usersTableBody =
        document.getElementById("usersTableBody");

    if (!userSearch || !usersTableBody) {
        return;
    }

    const filter = userSearch.value.trim().toLowerCase();

    const rows = usersTableBody.querySelectorAll("tr");

    rows.forEach(row => {
        const text = (row.textContent || "").toLowerCase();

        row.style.display =
            text.includes(filter) ? "" : "none";
    });
}


function applyPaymentFilter() {
    const paymentFilter =
        document.getElementById("paymentFilter");

    const paymentsTableBody =
        document.getElementById("paymentsTableBody");

    if (!paymentFilter || !paymentsTableBody) {
        return;
    }

    const selectedStatus = paymentFilter.value
        .trim()
        .toLowerCase();

    const rows = paymentsTableBody.querySelectorAll("tr");

    rows.forEach(row => {
        const statusCell = row.cells[2];

        // Keep empty-state and error messages visible.
        if (!statusCell) {
            row.style.display = "";
            return;
        }

        const status = statusCell.textContent
            .trim()
            .toLowerCase();

        row.style.display =
            !selectedStatus || status === selectedStatus
                ? ""
                : "none";
    });
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

        // Reapply the search after the table is refreshed.
        applyUserSearch();

    } catch (error) {
        console.error("Admin users error:", error);

        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load users. Please try again.
                </td>
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
                    <td colspan="3">
                        No payment records available.
                    </td>
                </tr>
            `;

            return;
        }

        paymentsTableBody.innerHTML = payments.map(payment => {
            const userName = escapeAdminHTML(
                payment.user?.name || "Unknown user"
            );

            const amount = Number(payment.amount);

            const formattedAmount = Number.isFinite(amount)
                ? amount.toLocaleString("en-NG")
                : "—";

            const status = escapeAdminHTML(
                payment.status || "Pending"
            );

            return `
                <tr>
                    <td>${userName}</td>
                    <td>₦${formattedAmount}</td>
                    <td>${status}</td>
                </tr>
            `;
        }).join("");

        // Reapply the selected filter after loading payments.
        applyPaymentFilter();

    } catch (error) {
        console.error("Admin payments error:", error);

        paymentsTableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    Unable to load payment records. Please try again.
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   LOAD ADMIN WASTE REPORTS
========================================================= */


let currentAdminReportsPage = 1;

let isLoadingAdminReports = false;

async function loadAdminReports(page = currentAdminReportsPage) {
    const reportsTableBody =
        document.getElementById("reportsTableBody");

    const totalReports =
        document.getElementById("totalReports");

    const prevButton =
        document.getElementById("prevReportsPage");

    const nextButton =
        document.getElementById("nextReportsPage");

    const pageInfo =
        document.getElementById("reportsPageInfo");
    if (!reportsTableBody || isLoadingAdminReports) {
        return;
    }

    isLoadingAdminReports = true;

    try {
        const data = await adminApiRequest(
            `/reports/admin?page=${page}`
        );

        if (
            !Array.isArray(data.reports) ||
            !data.pagination ||
            !data.statusCounts
        ) {
            throw new Error(
                "The server returned an invalid paginated reports response."
            );
        }

        const reports = data.reports;
        const pagination = data.pagination;

        currentAdminReportsPage = pagination.currentPage;

        if (totalReports) {
            totalReports.textContent = pagination.totalReports;
        }

        if (pageInfo) {
            pageInfo.textContent =
                `Page ${pagination.currentPage} of ${Math.max(
                    pagination.totalPages,
                    1
                )}`;
        }

        if (prevButton) {
            prevButton.disabled = !pagination.hasPreviousPage;
        }

        if (nextButton) {
            nextButton.disabled = !pagination.hasNextPage;
        }

        if (reports.length === 0) {
            reportsTableBody.innerHTML = `
                <tr>
                    <td colspan="2">No waste reports available.</td>
                </tr>
            `;
        } else {
            reportsTableBody.innerHTML = reports.map(report => {
                const issue = escapeAdminHTML(
                    report.issue || "-"
                );

                const parsedDate = report.createdAt
                    ? new Date(report.createdAt)
                    : null;

                const date =
                    parsedDate &&
                        !Number.isNaN(parsedDate.getTime())
                        ? parsedDate.toLocaleDateString()
                        : "-";

                return `
                    <tr>
                        <td>${issue}</td>
                        <td>${escapeAdminHTML(date)}</td>
                    </tr>
                `;
            }).join("");
        }

        updateReportsChart(data.statusCounts);

    } catch (error) {
        console.error("Admin waste reports error:", error);

        reportsTableBody.innerHTML = `
            <tr>
                <td colspan="2">
                    Unable to load waste reports. Please try again.
                </td>
            </tr>
        `;
    } finally {
        isLoadingAdminReports = false;
    }
}

const prevReportsPageButton =
    document.getElementById("prevReportsPage");

const nextReportsPageButton =
    document.getElementById("nextReportsPage");

if (prevReportsPageButton) {
    prevReportsPageButton.addEventListener("click", () => {
        if (currentAdminReportsPage > 1) {
            loadAdminReports(currentAdminReportsPage - 1);
        }
    });
}

if (nextReportsPageButton) {
    nextReportsPageButton.addEventListener("click", () => {
        loadAdminReports(currentAdminReportsPage + 1);
    });
}

/* =========================================================
   WASTE REPORTS CHART
========================================================= */

let reportsChart;

function updateReportsChart(statusCounts) {
    const chartCanvas =
        document.getElementById("reportsChart");

    if (!chartCanvas || typeof Chart === "undefined") {
        return;
    }

    const statuses = [
        "Pending",
        "In Progress",
        "Resolved"
    ];

    const chartData = [
        Number(statusCounts.pending) || 0,
        Number(statusCounts.inProgress) || 0,
        Number(statusCounts.resolved) || 0
    ];

    if (reportsChart) {
        reportsChart.destroy();
    }

    reportsChart = new Chart(chartCanvas, {
        type: "doughnut",

        data: {
            labels: statuses,

            datasets: [{
                data: chartData
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
        const data = await adminApiRequest(
            "/payments/admin/summary"
        );

        if (
            !data.summary ||
            typeof data.summary !== "object"
        ) {
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

        if (totalPayments) {
            totalPayments.textContent = "Unable to load";
        }
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

    await Promise.all([
        loadAdminUsers(),
        loadAdminPayments(),
        loadAdminReports(),
        loadPaymentSummary()
    ]);
}


/* =========================================================
   LOGOUT BUTTON
========================================================= */

const logoutBtn =
    document.getElementById("logoutBtn");

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

const userSearch =
    document.getElementById("userSearch");

if (userSearch) {
    userSearch.addEventListener("input", applyUserSearch);
}


/* =========================================================
   PAYMENT FILTER
========================================================= */

const paymentFilter =
    document.getElementById("paymentFilter");

if (paymentFilter) {
    paymentFilter.addEventListener(
        "change",
        applyPaymentFilter
    );
}


/* =========================================================
   START DASHBOARD
========================================================= */

initializeAdminDashboard();
