const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // simple login simulation
    window.location.href = "dashboard.html";
  });
}

// Logout Button
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    alert("Logged out successfully");
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

// LOAD USERS INTO ADMIN TABLE
const usersTableBody = document.getElementById("usersTableBody");

if(usersTableBody){

let users = JSON.parse(localStorage.getItem("users")) || [];

usersTableBody.innerHTML = "";

users.forEach(user => {

let row = `
<tr>
<td>${user.name}</td>
<td>${user.email}</td>
<td>${user.phone}</td>
<td>${user.address}</td>
<td>${user.buildingType}</td>
<td>${user.userType}</td>
</tr>
`;

usersTableBody.innerHTML += row;

});

}

// LOAD PAYMENTS
const paymentsTableBody = document.getElementById("paymentsTableBody");

if (paymentsTableBody) {

  let payments = JSON.parse(localStorage.getItem("payments")) || [];

  paymentsTableBody.innerHTML = "";

  payments.forEach(pay => {

    let row = `
    <tr>
      <td>${pay.name}</td>
      <td>${pay.email}</td>
      <td>${pay.amount}</td>
      <td>${pay.status}</td>
      <td>${pay.date}</td>
    </tr>
    `;
    paymentsTableBody.innerHTML += row;
  });
}

// LOAD PAYMENTS
const paymentsTableBody = document.getElementById("paymentsTableBody");

if (paymentsTableBody) {

  let payments = JSON.parse(localStorage.getItem("payments")) || [];

  paymentsTableBody.innerHTML = "";

  payments.forEach(pay => {

    let row = `
    <tr>
      <td>${pay.name}</td>
      <td>${pay.email}</td>
      <td>${pay.amount}</td>
      <td>${pay.status}</td>
      <td>${pay.date}</td>
    </tr>
    `;

    paymentsTableBody.innerHTML += row;
  });
}

fetch("/api/payments")