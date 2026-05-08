const app = document.getElementById("app");

app.innerHTML = `
  <nav>
    <div class="logo">Bri Gregory Photos</div>
    <div class="nav-links">
      <a href="#portfolio">Portfolio</a>
      <a href="#about">About</a>
      <a href="#login">Client Login</a>
      <a href="#contact">Contact</a>
    </div>
  </nav>

  <main>
    <section class="hero">
      <div class="hero-content">
        <h1>Photography that feels warm, honest, and timeless.</h1>
        <p>Welcome to Bri Gregory Photos — a personal photography space for portraits, memories, and meaningful moments.</p>
        <button onclick="scrollToPortfolio()">View Portfolio</button>
      </div>
    </section>

    <section id="portfolio">
      <h2>Portfolio</h2>
      <div class="gallery-grid">
        <div class="photo-card">Photo 1 coming soon</div>
        <div class="photo-card">Photo 2 coming soon</div>
        <div class="photo-card">Photo 3 coming soon</div>
        <div class="photo-card">Photo 4 coming soon</div>
      </div>
    </section>

    <section id="about">
      <h2>About Bri</h2>
      <p>I’m building a photography portfolio focused on capturing real, peaceful, beautiful moments.</p>
    </section>

    <section id="login">
      <h2>Client Login</h2>
      <div class="login-box">
        <input type="email" placeholder="Email address" />
        <input type="password" placeholder="Password" />
        <button onclick="loginMessage()">Login</button>
        <p id="login-status"></p>
      </div>
    </section>

    <section id="contact">
      <h2>Contact</h2>
      <p>Email: hello@brigregoryphotos.com</p>
    </section>
  </main>

  <footer>
    <p>© 2026 Bri Gregory Photos</p>
  </footer>
`;

function scrollToPortfolio() {
  document.getElementById("portfolio").scrollIntoView({ behavior: "smooth" });
}

function loginMessage() {
  document.getElementById("login-status").textContent =
    "Login system coming soon — this will connect to Firebase later.";
}
