export function renderProfile() {
  const container = document.createElement('div');
  container.className = 'page container';

  container.innerHTML = `
    <div style="margin-bottom: 30px;">
      <h1>Your Profile</h1>
      <p style="color: var(--text-muted);">Manage your personal information and device</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      
      <div class="glass-panel">
        <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
          <i class='bx bx-user' style="color: var(--primary);"></i> User Details
        </h3>
        
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-control" value="John Doe" readonly>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" value="user@example.com" readonly>
        </div>
        
        <button class="btn btn-primary" style="margin-top: 10px;">
          Update Profile
        </button>
      </div>

      <div class="glass-panel">
        <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
          <i class='bx bx-devices' style="color: var(--primary);"></i> Assigned Device
        </h3>
        
        <div style="background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 8px; border: 1px solid var(--surface-border);">
          <p style="color: var(--text-muted); margin-bottom: 8px;">Device UID</p>
          <p style="font-size: 1.2rem; font-family: monospace; color: var(--text-main);">NP-A1B2-C3D4</p>
          
          <div style="margin-top: 20px; display: flex; align-items: center; gap: 8px; color: #22c55e;">
            <i class='bx bxs-check-circle'></i> Status: Active
          </div>
        </div>
      </div>

    </div>
  `;

  return container;
}
