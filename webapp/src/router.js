import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderHistory } from './pages/history.js';
import { renderProfile } from './pages/profile.js';

// Simple Hash Router
export function setupRouter() {
  const appElement = document.getElementById('app');
  
  const routes = {
    '': renderDashboard,
    '#dashboard': renderDashboard,
    '#login': renderLogin,
    '#register': renderRegister,
    '#history': renderHistory,
    '#profile': renderProfile
  };

  const router = () => {
    // Basic Auth Guard (Mock)
    const isAuthenticated = localStorage.getItem('nexpulse_token');
    let hash = window.location.hash;
    
    // Redirect unauthenticated users
    if (!isAuthenticated && hash !== '#login' && hash !== '#register') {
      window.location.hash = '#login';
      return;
    }
    
    // Redirect authenticated users from auth pages
    if (isAuthenticated && (hash === '#login' || hash === '#register')) {
      window.location.hash = '#dashboard';
      return;
    }

    const route = routes[hash] || renderDashboard;
    
    // Clear current content
    appElement.innerHTML = '';
    
    // Add Navbar if authenticated
    if (isAuthenticated) {
      appElement.appendChild(createNavbar());
    }
    
    // Render the page
    appElement.appendChild(route());
  };

  window.addEventListener('hashchange', router);
  router(); // Run on initial load
}

function createNavbar() {
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  
  const currentHash = window.location.hash || '#dashboard';

  nav.innerHTML = `
    <a href="#dashboard" class="navbar-brand">
      <i class='bx bx-pulse'></i> NexPulse
    </a>
    <div class="nav-links">
      <a href="#dashboard" class="nav-link ${currentHash === '#dashboard' ? 'active' : ''}">
        <i class='bx bxs-dashboard'></i> Dashboard
      </a>
      <a href="#history" class="nav-link ${currentHash === '#history' ? 'active' : ''}">
        <i class='bx bx-line-chart'></i> History
      </a>
      <a href="#profile" class="nav-link ${currentHash === '#profile' ? 'active' : ''}">
        <i class='bx bxs-user'></i> Profile
      </a>
      <a href="#" id="logout-btn" class="nav-link">
        <i class='bx bx-log-out'></i> Logout
      </a>
    </div>
  `;

  nav.querySelector('#logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('nexpulse_token');
    window.location.hash = '#login';
  });

  return nav;
}
