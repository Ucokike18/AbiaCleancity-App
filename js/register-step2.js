/* GET STEP 1 DATA FROM LOCAL STORAGE */

const step1Data = JSON.parse(localStorage.getItem("step1Data"));

/* CHECK IF STEP 1 EXISTS */

if (!step1Data) {
  alert("Please complete Step 1 registration first");

  window.location.href = "register.html";
}

/* DISPLAY STEP 1 DATA */

document.getElementById("displayName").value = step1Data.name;

document.getElementById("displayEmail").value = step1Data.email;

document.getElementById("displayPhone").value = step1Data.phone;

/* HANDLE STEP 2 FORM SUBMISSION */

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  /* GET STEP 2 VALUES */

  const address = document.getElementById("address").value;

  const buildingType = document.getElementById("buildingType").value;

  const userType = document.getElementById("userType").value;

  const password = document.getElementById("password").value;

  const confirmPassword = document.getElementById("confirmPassword").value;

  /* VALIDATE PASSWORDS */

  if (password !== confirmPassword) {
    alert("Passwords do not match");

    return;
  }

  /* COMBINE STEP 1 + STEP 2 DATA */

  const userData = {
    name: step1Data.name,

    email: step1Data.email,

    phone: step1Data.phone,

    address,

    buildingType,

    userType,

    password,
  };

  try {
    /* SEND DATA TO BACKEND */

    const response = await fetch("http://localhost:5000/api/users/register", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(userData),
    });

    const data = await response.json();

    /* SUCCESS */

    if (response.ok) {
      /* SAVE TOKEN */

      localStorage.setItem("token", data.token);

      /* SAVE USER */

      localStorage.setItem("user", JSON.stringify(data.user));

      /* CLEAR STEP 1 STORAGE */

      localStorage.removeItem("step1Data");

      /* REDIRECT TO DASHBOARD */

      window.location.href = "../dashboard/user-dashboard.html";
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.log(error);

    alert("Registration failed");
  }
});
