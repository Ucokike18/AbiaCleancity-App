const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    let users = JSON.parse(localStorage.getItem("users")) || [];

    console.log("Users:", users); // DEBUG
    console.log("Entered:", email, password); // DEBUG

    let user = users.find(u => 
      u.email.trim() === email && u.password === password
    );

    if (!user) {
      alert("Invalid email or password");
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(user));

    window.location.href = "user/dashboard.html";
  });
}