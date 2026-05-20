export function renderRegister() {
  const container = document.createElement('div');
  container.className = 'page auth-container';

  container.innerHTML = `
    <div class="glass-panel auth-card">
      <h2 style="text-align: center; margin-bottom: 24px;">Register Device</h2>
      <form id="register-form">
        <div class="form-group">
          <label class="form-label">Activation Code</label>
          <input type="text" class="form-control" id="code" required placeholder="NP-XXXX-XXXX">
        </div>
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-control" id="name" required placeholder="John Doe">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="email" required placeholder="user@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" id="password" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
          Register
        </button>
      </form>
      <div style="text-align: center; margin-top: 20px; color: var(--text-muted); font-size: 0.9rem;">
        Already have an account? <a href="#login" style="color: var(--primary); text-decoration: none;">Login</a>
      </div>
    </div>
  `;

  container.querySelector('#register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Mock register
    alert('Registration successful! Please login.');
    window.location.hash = '#login';
  });

  return container;
}
