const app = document.getElementById("app");

app.innerHTML = `
  <h1>Bri Gregory Photos 📸</h1>
  <p>Photography portfolio coming soon.</p>

  <button id="helloBtn">Click Me</button>
`;

document.getElementById("helloBtn").addEventListener("click", () => {
  alert("Welcome to Bri Gregory Photos!");
});
