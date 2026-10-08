/* =========================================================
   ADMIN AUTHENTICATION GUARD
========================================================= */

const ADMIN_TOKEN_KEY = "abiaCleanCityToken";
const ADMIN_USER_KEY = "abiaCleanCityCurrentUser";

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

// Logout Button
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);

        window.location.href = "login.html";
    });
}

// Charts

// Reports Chart
const reportsCtx = document.getElementById("reportsChart");

if (reportsCtx) {
  new Chart(reportsCtx, {
    type: "bar",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      datasets: [
        {
          label: "Reports",
          data: [5, 10, 8, 12, 6],
        },
      ],
    },
  });
}

// Payments Chart
const paymentsCtx = document.getElementById("paymentsChart");

if (paymentsCtx) {
  new Chart(paymentsCtx, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [
        {
          label: "Payments (₦)",
          data: [50000, 80000, 60000, 90000, 70000],
        },
      ],
    },
  });
}

// USER SEARCH
const userSearch = document.getElementById("userSearch");

if (userSearch) {
  userSearch.addEventListener("keyup", function () {
    let filter = userSearch.value.toLowerCase();
    let rows = document.querySelectorAll("#usersTable tbody tr");

    rows.forEach((row) => {
      let text = row.innerText.toLowerCase();

      row.style.display = text.includes(filter) ? "" : "none";
    });
  });
}

// PAYMENT FILTER
const paymentFilter = document.getElementById("paymentFilter");

if (paymentFilter) {
  paymentFilter.addEventListener("change", function () {
    let value = paymentFilter.value;
    let rows = document.querySelectorAll("#paymentsTable tbody tr");

    rows.forEach((row) => {
      let status = row.cells[2].innerText;

      if (value === "" || status === value) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });
}
