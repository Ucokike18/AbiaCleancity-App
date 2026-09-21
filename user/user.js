// LOAD CURRENT USER
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")); // last registered

if (!currentUser) {
  window.location.href = "../login.html";
}

// DISPLAY USER INFO
document.getElementById("name").innerText = currentUser.name;
document.getElementById("email").innerText = currentUser.email;
document.getElementById("phone").innerText = currentUser.phone;
document.getElementById("address").innerText = currentUser.address;
document.getElementById("building").innerText = currentUser.buildingType;
document.getElementById("userType").innerText = currentUser.userType;

// PAYMENT STATUS
document.getElementById("paymentStatus").innerText =
  currentUser.paymentStatus || "Not Paid";

// SWITCH SECTIONS
function showSection(id) {
  document
    .querySelectorAll(".section")
    .forEach((sec) => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// MAKE PAYMENT
function makePayment() {

  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  let users = JSON.parse(localStorage.getItem("users")) || [];

  // Update this specific user
  let updatedUsers = users.map(u => {
    if (u.email === currentUser.email) {
      u.paymentStatus = "Paid";
      return u;
    }
    return u;
  });

  localStorage.setItem("users", JSON.stringify(updatedUsers));

  // Save payment record
  let payments = JSON.parse(localStorage.getItem("payments")) || [];
  let myPayments = payments.filter(p => p.email === currentUser.email);

  payments.push({
    email: currentUser.email,
    amount: "₦5,000",
    status: "Paid",
    date: new Date().toLocaleDateString()
  });

  localStorage.setItem("payments", JSON.stringify(payments));

  document.getElementById("paymentStatus").innerText = "Paid";
}

// REPORT ISSUE
function submitIssue() {

  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  let issue = document.getElementById("issue").value;

  let reports = JSON.parse(localStorage.getItem("reports")) || [];

  reports.push({
    email: currentUser.email,
    issue,
    date: new Date().toLocaleDateString()
  });

  localStorage.setItem("reports", JSON.stringify(reports));
}

// SELL RECYCLABLE
function sellItem() {
  let item = document.getElementById("item").value;
  let quantity = document.getElementById("quantity").value;

  let recyclables = JSON.parse(localStorage.getItem("recyclables")) || [];
  recyclables.push({ item, quantity });
 
  localStorage.setItem("recyclables", JSON.stringify(recyclables));

  alert("Item submitted!");
}

// LOGOUT
function logout() {
  localStorage.removeItem("currentUser"); //clear session
  window.location.href = "../login.html";
}

function openPaymentModal() {
  document.getElementById("paymentModal").style.display = "block";
}

function closeModal() {
  document.getElementById("paymentModal").style.display = "none";
}

function confirmPayment() {
  closeModal();
  makePayment();
}
