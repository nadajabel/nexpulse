import Chart from 'chart.js/auto';

export function renderHistory() {
  const container = document.createElement('div');
  container.className = 'page container';

  container.innerHTML = `
    <div style="margin-bottom: 30px;">
      <h1>Measurement History</h1>
      <p style="color: var(--text-muted);">View your past vital signs data</p>
    </div>

    <div class="glass-panel" style="margin-bottom: 24px; position: relative; height: 400px; width: 100%;">
      <canvas id="history-chart"></canvas>
    </div>

    <div class="glass-panel">
      <h3>Recent Records</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr style="border-bottom: 1px solid var(--surface-border); text-align: left;">
            <th style="padding: 12px; color: var(--text-muted);">Time</th>
            <th style="padding: 12px; color: var(--text-muted);">Heart Rate</th>
            <th style="padding: 12px; color: var(--text-muted);">SpO2</th>
            <th style="padding: 12px; color: var(--text-muted);">Temp</th>
          </tr>
        </thead>
        <tbody id="history-table-body">
          <!-- Populated by JS -->
        </tbody>
      </table>
    </div>
  `;

  // Render chart after DOM insertion
  setTimeout(() => {
    const ctx = document.getElementById('history-chart');
    if (!ctx) return;

    // Generate mock historical data
    const labels = [];
    const bpmData = [];
    const spo2Data = [];
    
    const now = new Date();
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000);
      labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      bpmData.push(Math.floor(Math.random() * (90 - 65) + 65));
      spo2Data.push(Math.floor(Math.random() * (100 - 95) + 95));
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Heart Rate (bpm)',
            data: bpmData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'SpO2 (%)',
            data: spo2Data,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#f8fafc' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          y: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        }
      }
    });

    // Populate Table
    const tbody = document.getElementById('history-table-body');
    for (let i = 0; i < 5; i++) {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.02)';
      tr.innerHTML = `
        <td style="padding: 12px;">${labels[20 - i]}</td>
        <td style="padding: 12px; color: var(--vital-hr); font-weight: bold;">${bpmData[20 - i]} bpm</td>
        <td style="padding: 12px; color: var(--vital-spo2); font-weight: bold;">${spo2Data[20 - i]}%</td>
        <td style="padding: 12px; color: var(--vital-temp); font-weight: bold;">36.${Math.floor(Math.random() * 9)} °C</td>
      `;
      tbody.appendChild(tr);
    }
  }, 100);

  return container;
}
