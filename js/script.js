const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Store data
    localStorage.setItem("name", document.getElementById("name").value);
    localStorage.setItem("email", document.getElementById("email").value);
    localStorage.setItem("phone", document.getElementById("phone").value);

    // Go to step 2
    window.location.href = "register2.html";
  });
}

const registerStep2 = document.getElementById("registerStep2");

if (registerStep2) {
  registerStep2.addEventListener("submit", function (e) {
    e.preventDefault();

    // Get step 2 data
    const address = document.querySelector("#registerStep2 input").value;
    const buildingType = document.getElementById("buildingType").value;
    const userType = document.getElementById("userType").value;

    // Combine with step 1 data
    const userData = {
      name: localStorage.getItem("name"),
      email: localStorage.getItem("email"),
      address,
      buildingType,
      userType,
    };

    console.log(userData);

    // Simulate success
    alert("Registration Complete!");

    // Clear temp storage
    localStorage.clear();

    // Redirect
    window.location.href = "dashboard.html";
  });
}

// PREFILL STEP 2 FORM WITH STEP 1 DATA
const previewName = document.getElementById("previewName");
const previewEmail = document.getElementById("previewEmail");
const previewPhone = document.getElementById("previewPhone");

if(previewName){
  previewName.value = localStorage.getItem("name") || "";
  previewEmail.value = localStorage.getItem("email") || "";
  previewPhone.value = localStorage.getItem("phone") || "";
}

// STEP 2 FORM LOGIC
const registerStep2 = document.getElementById("registerStep2");

if (registerStep2) {
  registerStep2.addEventListener("submit", function (e) {
    e.preventDefault();

    const address = document.getElementById("address").value;
    const buildingType = document.getElementById("buildingType").value;
    const userType = document.getElementById("userType").value;

    const errorMsg = document.getElementById("errorMsg");

    // VALIDATION
    if (address === "" || buildingType === "" || userType === "") {
      errorMsg.innerText = "Please fill all fields correctly.";
      return;
    }

    // Combine data
    const userData = {
      name: localStorage.getItem("name"),
      email: localStorage.getItem("email"),
      phone: localStorage.getItem("phone"),
      address,
      buildingType,
      userType,
    };

    console.log(userData);

    // Clear storage
    localStorage.clear();

    // Redirect
    window.location.href = "dashboard.html";
  });
}

const registerStep2 = document.getElementById("registerStep2");

if(registerStep2){
  registerStep2.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("previewName").value;
    const email = document.getElementById("previewEmail").value;
    const phone = document.getElementById("previewPhone").value;

    const address = document.getElementById("address").value;
    const buildingType = document.getElementById("buildingType").value;
    const userType = document.getElementById("userType").value;

    const errorMsg = document.getElementById("errorMsg");

    // VALIDATION
    if (!name || !email || !phone || !address || !buildingType || !userType) {
      errorMsg.innerText = "Please fill all fields correctly.";
      return;
    }

    const userData = {
      name,
      email,
      phone,
      address,
      buildingType,
      userType,
    };

    console.log(userData);

    localStorage.clear();

    window.location.href = "dashboard.html";
  });
}
