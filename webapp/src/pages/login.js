export function renderLogin() {
  const container = document.createElement('div');
  container.className = 'page auth-container';

  container.innerHTML = `
    <div class="glass-panel auth-card">
      <h2 style="text-align: center; margin-bottom: 24px;">
        <i class='bx bx-pulse' style="color: var(--primary); font-size: 28px; vertical-align: middle;"></i>
        NexPulse Login
      </h2>
      <form id="login-form">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" id="email" required placeholder="user@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" id="password" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
          Login
        </button>
      </form>
      <div style="text-align: center; margin-top: 20px; color: var(--text-muted); font-size: 0.9rem;">
        Don't have an account? <a href="#register" style="color: var(--primary); text-decoration: none;">Register with Activation Code</a>
      </div>
    </div>
  `;

  container.querySelector('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Mock login
    localStorage.setItem('nexpulse_token', 'mock_jwt_token');
    window.location.hash = '#dashboard';
  });

  return container;
}
