import Chart from 'chart.js/auto';

export function renderDashboard() {
  const container = document.createElement('div');
  container.className = 'page container';

  container.innerHTML = `
    <header style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1>Live Dashboard</h1>
        <p style="color: var(--text-muted);">Real-time vital signs monitoring</p>
      </div>
      <div class="glass-panel" style="padding: 10px 20px; display: flex; align-items: center; gap: 10px;">
        <div id="status-indicator" style="width: 12px; height: 12px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 10px #22c55e;"></div>
        <span id="status-text" style="font-weight: 500;">Connected</span>
      </div>
    </header>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
      
      <!-- SpO2 Card -->
      <div class="glass-panel" style="display: flex; flex-direction: column; align-items: center; text-align: center;">
        <h3 style="color: var(--text-muted); margin-bottom: 20px;">Blood Oxygen (SpO2)</h3>
        <div class="gauge-container" style="position: relative; width: 200px; height: 100px; overflow: hidden;">
          <div class="gauge-bg" style="position: absolute; top: 0; left: 0; width: 200px; height: 200px; border-radius: 50%; border: 20px solid var(--surface-border); box-sizing: border-box;"></div>
          <div id="spo2-gauge" style="position: absolute; top: 0; left: 0; width: 200px; height: 200px; border-radius: 50%; border: 20px solid var(--vital-spo2); box-sizing: border-box; border-bottom-color: transparent; border-right-color: transparent; transform: rotate(-45deg); transition: transform 0.5s ease-out;"></div>
        </div>
        <div style="margin-top: -20px; font-size: 3rem; font-weight: 700; color: var(--text-main); text-shadow: 0 0 20px var(--vital-spo2-glow);">
          <span id="spo2-val">--</span><span style="font-size: 1.5rem; color: var(--text-muted);">%</span>
        </div>
      </div>

      <!-- Temp Card -->
      <div class="glass-panel" style="display: flex; flex-direction: column; align-items: center; text-align: center;">
        <h3 style="color: var(--text-muted); margin-bottom: 20px;">Est. Body Temp</h3>
        <div class="gauge-container" style="position: relative; width: 200px; height: 100px; overflow: hidden;">
          <div class="gauge-bg" style="position: absolute; top: 0; left: 0; width: 200px; height: 200px; border-radius: 50%; border: 20px solid var(--surface-border); box-sizing: border-box;"></div>
          <div id="temp-gauge" style="position: absolute; top: 0; left: 0; width: 200px; height: 200px; border-radius: 50%; border: 20px solid var(--vital-temp); box-sizing: border-box; border-bottom-color: transparent; border-right-color: transparent; transform: rotate(-45deg); transition: transform 0.5s ease-out;"></div>
        </div>
        <div style="margin-top: -20px; font-size: 3rem; font-weight: 700; color: var(--text-main); text-shadow: 0 0 20px var(--vital-temp-glow);">
          <span id="temp-val">--</span><span style="font-size: 1.5rem; color: var(--text-muted);">°C</span>
        </div>
      </div>

      <!-- BPM Card -->
      <div class="glass-panel" style="display: flex; flex-direction: column; justify-content: space-between; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <h3 style="color: var(--text-muted);">Heart Rate</h3>
          <i class='bx bxs-heart' id="heart-icon" style="color: var(--vital-hr); font-size: 2rem;"></i>
        </div>
        
        <div style="font-size: 3.5rem; font-weight: 700; color: var(--text-main); margin: 5px 0;">
          <span id="bpm-val">--</span><span style="font-size: 1.5rem; color: var(--text-muted); font-weight: 400; margin-left: 5px;">bpm</span>
        </div>

        <div style="width: 100%; height: 60px; position: relative;">
          <canvas id="bpm-sparkline"></canvas>
        </div>
      </div>

    </div>
    
    <div class="glass-panel" style="margin-top: 24px; display: flex; justify-content: center;">
      <h2 id="finger-warning" style="color: var(--vital-temp); display: none; animation: pulse 2s infinite;">
        <i class='bx bx-error-circle'></i> PLEASE PLACE FINGER ON SENSOR
      </h2>
    </div>
  `;

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    @keyframes heartbeat {
      0% { transform: scale(1); }
      14% { transform: scale(1.3); }
      28% { transform: scale(1); }
      42% { transform: scale(1.3); }
      70% { transform: scale(1); }
      100% { transform: scale(1); }
    }
    .beating {
      animation: heartbeat 1s infinite;
    }
  `;
  container.appendChild(style);

  let isUnmounted = false;
  let bpmChart = null;
  const bpmHistory = Array(20).fill(null);

  setTimeout(() => {
    if (isUnmounted) return;
    const ctx = document.getElementById('bpm-sparkline');
    if (!ctx) return;
    
    bpmChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(20).fill(''),
        datasets: [{
          data: bpmHistory,
          borderColor: '#fb7185', // var(--vital-hr)
          backgroundColor: 'rgba(251, 113, 133, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, min: 40, max: 150 }
        },
        animation: { duration: 0 }
      }
    });
  }, 50);
  
  const updateGauges = () => {
    if (isUnmounted) return;
    
    const noFinger = Math.random() < 0.2;
    
    const statusText = container.querySelector('#status-text');
    const warningText = container.querySelector('#finger-warning');
    const heartIcon = container.querySelector('#heart-icon');
    
    if (noFinger) {
      container.querySelector('#bpm-val').textContent = '--';
      container.querySelector('#spo2-val').textContent = '--';
      container.querySelector('#temp-val').textContent = '--';
      
      container.querySelector('#spo2-gauge').style.transform = 'rotate(-45deg)';
      container.querySelector('#temp-gauge').style.transform = 'rotate(-45deg)';
      
      statusText.textContent = 'No Finger';
      statusText.style.color = 'var(--text-muted)';
      container.querySelector('#status-indicator').style.background = 'gray';
      container.querySelector('#status-indicator').style.boxShadow = 'none';
      warningText.style.display = 'block';
      heartIcon.classList.remove('beating');
      
      if (bpmChart) {
        bpmHistory.push(null);
        bpmHistory.shift();
        bpmChart.update();
      }
    } else {
      const bpm = Math.floor(Math.random() * (100 - 60) + 60);
      const spo2 = Math.floor(Math.random() * (100 - 95) + 95);
      const temp = (Math.random() * (37.5 - 36.5) + 36.5).toFixed(1);
      
      container.querySelector('#bpm-val').textContent = bpm;
      container.querySelector('#spo2-val').textContent = spo2;
      container.querySelector('#temp-val').textContent = temp;
      
      const spo2Rot = -45 + (spo2 / 100) * 180;
      const tempRot = -45 + (temp / 50) * 180;
      
      container.querySelector('#spo2-gauge').style.transform = 'rotate(' + spo2Rot + 'deg)';
      container.querySelector('#temp-gauge').style.transform = 'rotate(' + tempRot + 'deg)';
      
      statusText.textContent = 'Reading Live Data';
      statusText.style.color = '#22c55e';
      container.querySelector('#status-indicator').style.background = '#22c55e';
      container.querySelector('#status-indicator').style.boxShadow = '0 0 10px #22c55e';
      warningText.style.display = 'none';
      
      if (!heartIcon.classList.contains('beating')) {
        heartIcon.classList.add('beating');
      }
      // Adjust animation speed based on BPM
      heartIcon.style.animationDuration = (60 / bpm) + 's';
      
      if (bpmChart) {
        bpmHistory.push(bpm);
        bpmHistory.shift();
        bpmChart.update();
      }
    }
    
    setTimeout(updateGauges, 2000);
  };
  
  setTimeout(updateGauges, 500);
  
  const cleanup = () => { isUnmounted = true; };
  container.addEventListener('DOMNodeRemovedFromDocument', cleanup);

  return container;
}
