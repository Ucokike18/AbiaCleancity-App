/* ==========================================================
   ABIACLEAN CITY
   REGISTRATION SYSTEM
========================================================== */


/* ==========================================================
   STORAGE KEY
========================================================== */

const USER_DATA_KEY = "abiaCleanCityUser";


/* ==========================================================
   ELEMENTS
========================================================== */

const registerForm = document.getElementById("registerForm");

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");

const continueBtn = document.getElementById("continueBtn");
const backButton = document.getElementById("backButton");

const progressStep1 = document.getElementById("progressStep1");
const progressStep2 = document.getElementById("progressStep2");
const progressLine = document.getElementById("progressLine");

const errorMsg = document.getElementById("errorMsg");


/* ==========================================================
   HELPER FUNCTIONS
========================================================== */

function showError(message) {
    if (errorMsg) {
        errorMsg.textContent = message;
    }
}


function clearError() {
    if (errorMsg) {
        errorMsg.textContent = "";
    }
}


/* ==========================================================
   SHOW STEP 1
========================================================== */

function showStep1() {

    step1.classList.add("active");
    step2.classList.remove("active");

    progressStep1.classList.add("active");
    progressStep1.classList.remove("completed");

    progressStep2.classList.remove("active");

    progressLine.classList.remove("active");

    clearError();
}


/* ==========================================================
   SHOW STEP 2
========================================================== */

function showStep2() {

    step1.classList.remove("active");
    step2.classList.add("active");

    progressStep1.classList.remove("active");
    progressStep1.classList.add("completed");

    progressStep2.classList.add("active");

    progressLine.classList.add("active");

    clearError();
}


/* ==========================================================
   STEP 1 VALIDATION
========================================================== */

function validateStep1() {

    const name = document
        .getElementById("name")
        .value
        .trim();

    const email = document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    const phone = document
        .getElementById("phone")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    const confirmPassword = document
        .getElementById("confirmPassword")
        .value;


    /* ------------------------------------------------------
       REQUIRED FIELDS
    ------------------------------------------------------ */

    if (
        !name ||
        !email ||
        !phone ||
        !password ||
        !confirmPassword
    ) {
        showError("Please complete all fields.");
        return false;
    }


    /* ------------------------------------------------------
       NAME
    ------------------------------------------------------ */

    if (name.length < 3) {

        showError("Please enter your full name.");

        return false;
    }


    /* ------------------------------------------------------
       EMAIL
    ------------------------------------------------------ */

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        showError("Please enter a valid email address.");

        return false;
    }


    /* ------------------------------------------------------
       PHONE
    ------------------------------------------------------ */

    const phonePattern =
        /^[0-9+\s()-]{7,20}$/;

    if (!phonePattern.test(phone)) {

        showError("Please enter a valid phone number.");

        return false;
    }


    /* ------------------------------------------------------
       PASSWORD
    ------------------------------------------------------ */

    if (password.length < 8) {

        showError(
            "Password must contain at least 8 characters."
        );

        return false;
    }


    /* ------------------------------------------------------
       PASSWORD MATCH
    ------------------------------------------------------ */

    if (password !== confirmPassword) {

        showError("Passwords do not match.");

        return false;
    }


    return true;
}


/* ==========================================================
   DISPLAY ACCOUNT SUMMARY
========================================================== */

function displayAccountSummary() {

    const name = document
        .getElementById("name")
        .value
        .trim();

    const email = document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    const phone = document
        .getElementById("phone")
        .value
        .trim();


    document.getElementById("previewName")
        .textContent = name;

    document.getElementById("previewEmail")
        .textContent = email;

    document.getElementById("previewPhone")
        .textContent = phone;
}


/* ==========================================================
   STEP 1 → STEP 2
========================================================== */

if (continueBtn) {

    continueBtn.addEventListener("click", function () {

        clearError();


        /* --------------------------------------------------
           VALIDATE STEP 1
        -------------------------------------------------- */

        if (!validateStep1()) {
            return;
        }


        /* --------------------------------------------------
           DISPLAY ACCOUNT DATA
        -------------------------------------------------- */

        displayAccountSummary();


        /* --------------------------------------------------
           MOVE TO STEP 2
        -------------------------------------------------- */

        showStep2();

    });
}


/* ==========================================================
   STEP 2 → STEP 1
========================================================== */

if (backButton) {

    backButton.addEventListener("click", function () {

        showStep1();

    });
}


/* ==========================================================
   COMPLETE REGISTRATION
========================================================== */

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        clearError();


        /* --------------------------------------------------
           GET STEP 2 DATA
        -------------------------------------------------- */

        const address = document
            .getElementById("address")
            .value
            .trim();

        const buildingType = document
            .getElementById("buildingType")
            .value;

        const userType = document
            .getElementById("userType")
            .value;


        /* --------------------------------------------------
           VALIDATE STEP 2
        -------------------------------------------------- */

        if (!address || !buildingType || !userType) {

            showError(
                "Please complete all the required fields."
            );

            return;
        }


        if (address.length < 5) {

            showError(
                "Please enter a valid residential address."
            );

            return;
        }


        /* --------------------------------------------------
           GET STEP 1 DATA
        -------------------------------------------------- */

        const name = document
            .getElementById("name")
            .value
            .trim();

        const email = document
            .getElementById("email")
            .value
            .trim()
            .toLowerCase();

        const phone = document
            .getElementById("phone")
            .value
            .trim();

        const password = document
            .getElementById("password")
            .value;


        /* --------------------------------------------------
           PREPARE REGISTRATION DATA
        -------------------------------------------------- */

        const userData = {

            name,
            email,
            phone,
            address,
            buildingType,
            userType,
            password

        };


        /* --------------------------------------------------
           DISABLE SUBMIT BUTTON
        -------------------------------------------------- */

        const submitButton =
            registerForm.querySelector(
                'button[type="submit"]'
            );

        if (submitButton) {

            submitButton.disabled = true;

            submitButton.textContent =
                "Creating Account...";

        }


        /* --------------------------------------------------
           REGISTER WITH BACKEND
        -------------------------------------------------- */

        try {

            const response =
                await registerUser(userData);


            /* ----------------------------------------------
               SAVE AUTHENTICATION TOKEN
            ---------------------------------------------- */

            localStorage.setItem(
                "abiaCleanCityToken",
                response.token
            );


            /* ----------------------------------------------
               SAVE SAFE USER DATA
            ---------------------------------------------- */

            localStorage.setItem(
                "abiaCleanCityCurrentUser",
                JSON.stringify(response.user)
            );


            /* ----------------------------------------------
               SUCCESS
            ---------------------------------------------- */

            alert(
                "Your AbiaCleanCity account has been created successfully."
            );


            /* ----------------------------------------------
               REDIRECT
            ---------------------------------------------- */

            window.location.href =
                "../user/dashboard.html";


        } catch (error) {

            console.error(
                "Registration failed:",
                error
            );

            showError(
                error.message ||
                "Unable to create your account. Please try again."
            );


        } finally {

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.textContent =
                    "Create Account";

            }

        }

    });

}
