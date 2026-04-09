document.getElementById("adminLogin").addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === "admin" && password === "1234") {
    window.location.href = "admin.html";
  } else {
    alert("Invalid login");
  }
});
