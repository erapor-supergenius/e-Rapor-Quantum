// ===== Dashboard JS =====

// Base URL backend (Apps Script Web App)
const BASE_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0";

// Elements
const totalSiswaEl = document.getElementById('totalSiswa');
const progressBars = document.querySelectorAll('.progress-bar');

// Fetch dashboard data
async function fetchDashboard() {
    try {
        const res = await fetch(`${BASE_URL}?action=getDashboard`);
        const data = await res.json();

        // Update total siswa
        totalSiswaEl.textContent = data.totalSiswa || 0;

        // Update progress bars
        progressBars.forEach(bar => {
            const key = bar.dataset.key; // misal: "nilaiTuntas"
            if(data[key] !== undefined) {
                bar.style.width = `${data[key]}%`;
                bar.textContent = `${data[key]}%`;
            }
        });

        // Render chart
        renderChart(data.chartData);

    } catch (err) {
        console.error("Error fetching dashboard:", err);
    }
}

// Chart.js initialization
let chartInstance = null;
function renderChart(chartData) {
    const ctx = document.getElementById('chart').getContext('2d');
    if(chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Nilai Rata-rata',
                data: chartData.data,
                backgroundColor: '#4e73df'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', fetchDashboard);
