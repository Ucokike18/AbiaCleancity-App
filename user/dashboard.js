/* ==========================================================
ABIACLEAN CITY
RESIDENT DASHBOARD
========================================================== */

/* ==========================================================
STORAGE KEYS
========================================================== */

const USER_DATA_KEY = "abiaCleanCityUser";
const CURRENT_USER_KEY = "abiaCleanCityCurrentUser";

/* ==========================================================
CHECK LOGIN SESSION
========================================================== */

const currentUserData =
  localStorage.getItem(CURRENT_USER_KEY);

const storedUserData =
  localStorage.getItem(USER_DATA_KEY);

/* ----------------------------------------------------------
REDIRECT IF NO SESSION
---------------------------------------------------------- */

if (!currentUserData || !storedUserData) {


window.location.href = "../login.html";

}

/* ==========================================================
LOAD USER DATA
========================================================== */

let currentUser;
let user;

try {

currentUser = JSON.parse(currentUserData);
user = JSON.parse(storedUserData);


} catch (error) {

console.error(
    "Unable to read user session:",
    error
);

localStorage.removeItem(CURRENT_USER_KEY);

window.location.href = "../login.html";

}

/* ==========================================================
DISPLAY USER INFORMATION
========================================================== */

function displayUserInformation() {


if (!user) {
    return;
}


/* ------------------------------------------------------
   WELCOME MESSAGE
------------------------------------------------------ */

const welcomeName =
    document.getElementById("welcomeName");

if (welcomeName) {

    welcomeName.textContent =
        user.name || "Resident";

}


/* ------------------------------------------------------
   PROFILE
------------------------------------------------------ */

const userName =
    document.getElementById("userName");

const email =
    document.getElementById("email");

const phone =
    document.getElementById("phone");

const userAddress =
    document.getElementById("userAddress");

const building =
    document.getElementById("building");

const userType =
    document.getElementById("userType");


if (userName) {
    userName.textContent =
        user.name || "-";
}


if (email) {
    email.textContent =
        user.email || "-";
}


if (phone) {
    phone.textContent =
        user.phone || "-";
}


if (userAddress) {
    userAddress.textContent =
        user.address || "-";
}


if (building) {
    building.textContent =
        formatValue(user.buildingType);
}


if (userType) {
    userType.textContent =
        formatValue(user.userType);
}


/* ------------------------------------------------------
   PAYMENT STATUS
------------------------------------------------------ */

const paymentStatus =
    document.getElementById("paymentStatus");

if (paymentStatus) {

    paymentStatus.textContent =
        formatValue(
            user.paymentStatus || "Pending"
        );

}


/* ------------------------------------------------------
   DISABLE PAYMENT BUTTON IF ALREADY PAID
------------------------------------------------------ */

const payNowBtn =
    document.getElementById("payNowBtn");

if (
    payNowBtn &&
    user.paymentStatus &&
    user.paymentStatus.toLowerCase() === "paid"
) {

    payNowBtn.disabled = true;
    payNowBtn.textContent = "Payment Complete";

}


}

/* ==========================================================
FORMAT STORED VALUES
========================================================== */

function formatValue(value) {

if (!value) {
    return "-";
}

return String(value)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, function (character) {
        return character.toUpperCase();
    });


}

/* ==========================================================
SECTION NAVIGATION
========================================================== */

function showSection(sectionId, clickedButton) {

const sections =
    document.querySelectorAll(".section");

const navItems =
    document.querySelectorAll(".nav-item");


/* ------------------------------------------------------
   HIDE ALL SECTIONS
------------------------------------------------------ */

sections.forEach(function (section) {

    section.classList.remove("active");

});


/* ------------------------------------------------------
   REMOVE ACTIVE NAV STATE
------------------------------------------------------ */

navItems.forEach(function (item) {

    item.classList.remove("active");

});


/* ------------------------------------------------------
   SHOW SELECTED SECTION
------------------------------------------------------ */

const selectedSection =
    document.getElementById(sectionId);

if (selectedSection) {

    selectedSection.classList.add("active");

}


/* ------------------------------------------------------
   ACTIVATE NAV ITEM
------------------------------------------------------ */

if (clickedButton) {

    clickedButton.classList.add("active");

}


}

/* ==========================================================
PAYMENT MODAL
========================================================== */

function openPaymentModal() {

const modal =
    document.getElementById("paymentModal");

if (modal) {

    modal.style.display = "flex";

}

}

function closeModal() {

const modal =
    document.getElementById("paymentModal");

if (modal) {

    modal.style.display = "none";

}

}

/* ==========================================================
CONFIRM PAYMENT
========================================================== */

function confirmPayment() {

const cardNumber =
    document.getElementById("cardNumber").value.trim();

const expiryDate =
    document.getElementById("expiryDate").value.trim();

const cvv =
    document.getElementById("cvv").value.trim();


if (!cardNumber || !expiryDate || !cvv) {

    alert("Please complete all payment fields.");

    return;

}


/*
   DEMO PAYMENT

   This project currently uses localStorage,
   so this simulates a successful payment.
*/

user.paymentStatus = "Paid";


localStorage.setItem(
    USER_DATA_KEY,
    JSON.stringify(user)
);


const paymentStatus =
    document.getElementById("paymentStatus");

if (paymentStatus) {

    paymentStatus.textContent = "Paid";

}


const payNowBtn =
    document.getElementById("payNowBtn");

if (payNowBtn) {

    payNowBtn.disabled = true;
    payNowBtn.textContent = "Payment Complete";

}


closeModal();

alert(
    "Payment recorded successfully."
);


}

/* ==========================================================
REPORT WASTE ISSUE
========================================================== */

function submitIssue() {

const issueInput =
    document.getElementById("issue");

if (!issueInput) {
    return;
}


const issue =
    issueInput.value.trim();


if (!issue) {

    alert(
        "Please describe the waste issue before submitting."
    );

    return;

}


if (!user.reports) {

    user.reports = [];

}


user.reports.push({

    id: Date.now(),

    issue,

    status: "Pending",

    createdAt:
        new Date().toISOString()

});


localStorage.setItem(
    USER_DATA_KEY,
    JSON.stringify(user)
);


issueInput.value = "";


alert(
    "Your waste report has been submitted successfully."
);

}

/* ==========================================================
SELL RECYCLABLES
========================================================== */

function sellItem() {

const itemInput =
    document.getElementById("item");

const quantityInput =
    document.getElementById("quantity");


if (!itemInput || !quantityInput) {
    return;
}


const item =
    itemInput.value.trim();

const quantity =
    quantityInput.value.trim();


if (!item || !quantity) {

    alert(
        "Please enter the recyclable item and quantity."
    );

    return;

}


if (Number(quantity) <= 0) {

    alert(
        "Quantity must be greater than zero."
    );

    return;

}


alert(
    `Your recycling request for ${ quantity } unit(s) of ${ item } has been submitted.`
);


itemInput.value = "";
quantityInput.value = "";

}

/* ==========================================================
LOGOUT
========================================================== */

function logout() {

const confirmed =
    confirm(
        "Are you sure you want to logout?"
    );


if (!confirmed) {
    return;
}


/*
   Remove only the active session.

   The registered account remains in localStorage
   so the user can log in again.
*/

localStorage.removeItem(
    CURRENT_USER_KEY
);


window.location.href =
    "../login.html";

}

/* ==========================================================
CLOSE MODAL WHEN CLICKING OUTSIDE
========================================================== */

window.addEventListener(
  "click",
  function (event) {

    const modal =
        document.getElementById("paymentModal");

    if (
        modal &&
        event.target === modal
    ) {

        closeModal();

    }

}

);

/* ==========================================================
INITIALIZE DASHBOARD
========================================================== */

displayUserInformation();
