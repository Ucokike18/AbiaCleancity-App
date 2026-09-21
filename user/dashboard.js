/* CHECK IF USER IS LOGGED IN */

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../login/login.html";
}

/* GET USER DATA */

const user = JSON.parse(localStorage.getItem("user"));

/* DISPLAY USER INFO */

document.getElementById("userName").innerText = user.name;

document.getElementById("userAddress").innerText = user.address;

document.getElementById("paymentStatus").innerText = user.paymentStatus;

/* LOGOUT */

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");

  localStorage.removeItem("user");

  window.location.href = "../login/login.html";
});
