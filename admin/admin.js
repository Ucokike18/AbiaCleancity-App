/* =========================================================
   ADMIN AUTHENTICATION GUARD
========================================================= */

const ADMIN_TOKEN_KEY = "abiaCleanCityToken";
const ADMIN_USER_KEY = "abiaCleanCityCurrentUser";

const API_ROOT = API_BASE_URL.replace(/\/users$/, "");


async function verifyAdminSession() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const storedUser = localStorage.getItem(ADMIN_USER_KEY);

    if (!token || !storedUser) {
        window.location.href = "login.html";
        return false;
    }

    try {
        const response = await getUserProfile(token);

        if (!response || !response.user) {
            throw new Error("Invalid session.");
        }

        const userType =
            String(response.user.userType)
                .trim()
                .toLowerCase();

        if (userType !== "admin") {
            throw new Error("Admin access required.");
        }

        return true;

    } catch (error) {
        console.error("Admin session verification failed:", error);

        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);

        window.location.href = "login.html";
        return false;
    }
}

verifyAdminSession();


/* =========================
   LOAD ADMIN USERS
========================= */

async function loadAdminUsers() {

    const usersTableBody = document.getElementById("usersTableBody");
    const totalUsers = document.getElementById("totalUsers");

    if (!usersTableBody) {
        return;
    }

    try {

        const token = localStorage.getItem(ADMIN_TOKEN_KEY);

        const response = await fetch(
            `${API_BASE_URL}/admin/users`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to retrieve users."
            );
        }

        const users = data.users || [];

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
                <td>${user.name || "-"}</td>
                <td>${user.email || "-"}</td>
                <td>${user.phone || "-"}</td>
                <td>${user.address || "-"}</td>
                <td>${user.buildingType || "-"}</td>
                <td>${user.userType || "-"}</td>
                <td>${user.paymentStatus || "Not Paid"}</td>
            </tr>
        `).join("");

    } catch (error) {

        console.error("Admin users error:", error);

        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7">Unable to load users.</td>
            </tr>
        `;
    }
}

loadAdminUsers();


/* =========================
   LOAD ADMIN PAYMENTS
========================= */

async function loadAdminPayments() {

    const paymentsTableBody =
        document.getElementById("paymentsTableBody");

    if (!paymentsTableBody) {
        return;
    }

    try {

        const token = localStorage.getItem(ADMIN_TOKEN_KEY);

        const response = await fetch(
            `${API_ROOT}/payments/admin`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to retrieve payments."
            );
        }

        const payments = data.payments || [];

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
                payment.user?.name || "Unknown user";

            const amount =
                Number(payment.amount || 0);

            const status =
                payment.status || "Pending";

            return `
                <tr>
                    <td>${userName}</td>
                    <td>₦${amount.toLocaleString()}</td>
                    <td>${status}</td>
                </tr>
            `;

        }).join("");

    } catch (error) {

        console.error("Admin payments error:", error);

        paymentsTableBody.innerHTML = `
            <tr>
                <td colspan="3">Unable to load payment records.</td>
            </tr>
        `;
    }
}

loadAdminPayments();


/* =========================
   LOAD PAYMENT SUMMARY
========================= */

async function loadPaymentSummary() {

    const totalPayments =
        document.getElementById("totalPayments");

    try {

        const token = localStorage.getItem(ADMIN_TOKEN_KEY);

        const response = await fetch(
            `${API_ROOT}/payments/admin/summary`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to retrieve payment summary."
            );
        }

        const summary = data.summary || {};

        const totalAmount =
            Number(summary.totalAmount || 0);

        if (totalPayments) {
            totalPayments.textContent =
                `₦${totalAmount.toLocaleString()}`;
        }

        updatePaymentsChart(summary);

    } catch (error) {

        console.error("Payment summary error:", error);

        if (totalPayments) {
            totalPayments.textContent = "₦0";
        }

        updatePaymentsChart({
            paidCount: 0,
            pendingCount: 0,
            failedCount: 0
        });
    }
}

loadPaymentSummary();


/* =========================
   PAYMENTS CHART
========================= */

let paymentsChart;

function updatePaymentsChart(summary) {

    const chartCanvas =
        document.getElementById("paymentsChart");

    if (!chartCanvas || typeof Chart === "undefined") {
        return;
    }

    const paidCount =
        Number(summary.paidCount || 0);

    const pendingCount =
        Number(summary.pendingCount || 0);

    const failedCount =
        Number(summary.failedCount || 0);

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

            datasets: [
                {
                    data: [
                        paidCount,
                        pendingCount,
                        failedCount
                    ]
                }
            ]
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


// Logout Button

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);

        window.location.href = "login.html";
    });
}


// USER SEARCH

const userSearch = document.getElementById("userSearch");

if (userSearch) {
    userSearch.addEventListener("keyup", function () {

        let filter =
            userSearch.value.toLowerCase();

        let rows =
            document.querySelectorAll(
                "#usersTable tbody tr"
            );

        rows.forEach((row) => {

            let text =
                row.innerText.toLowerCase();

            row.style.display =
                text.includes(filter) ? "" : "none";
        });
    });
}


// PAYMENT FILTER

const paymentFilter =
    document.getElementById("paymentFilter");

if (paymentFilter) {

    paymentFilter.addEventListener("change", function () {

        let value =
            paymentFilter.value;

        let rows =
            document.querySelectorAll(
                "#paymentsTable tbody tr"
            );

        rows.forEach((row) => {

            const statusCell =
                row.cells[2];

            if (!statusCell) {
                row.style.display = "";
                return;
            }

            let status =
                statusCell.innerText;

            if (value === "" || status === value) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    });
}
