const step1Form = document.getElementById("step1Form");

step1Form.addEventListener("submit", (e) => {
  e.preventDefault();

  /* COLLECT STEP 1 DATA */

  const step1Data = {
    name: document.getElementById("name").value,

    email: document.getElementById("email").value,

    phone: document.getElementById("phone").value,
  };

  /* SAVE TO LOCAL STORAGE */

  localStorage.setItem("step1Data", JSON.stringify(step1Data));

  /* GO TO STEP 2 */

  window.location.href = "register-step2.html";
});
 