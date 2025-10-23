/****************************************************
 * dashboard.js — eRapor Quantum Super Genius
 * Struktur: JS di root (dipanggil oleh dashboard.html)
 * Pastikan WEBAPP_URL sesuai deployment Apps Script Anda
 ****************************************************/

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

/* ----------------- Helpers DOM ----------------- */
const $ = id => document.getElementById(id);

/* ----------------- Navigation ----------------- */
function navigateTo(page) {
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token_sesi");
  if (!username || !token) {
    Swal.fire("Sesi Habis", "Silakan login kembali.", "info");
    localStorage.clear();
    setTimeout(() => location.href = "index.html", 900);
    return;
  }
  window.location.href = page;
}

/* ----------------- Logout ----------------- */
const logoutBtn = $("logoutBtn");
logoutBtn?.addEventListener("click", async () => {
  const token = localStorage.getItem("token_sesi");
  try {
    await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:"logout", token_sesi: token }) });
  } catch(e){}
  Swal.fire({ icon:'success', title:'Logout', text:'Anda telah keluar.', timer:900, showConfirmButton:false });
  localStorage.clear();
  setTimeout(()=> location.href = "index.html", 900);
});

/* ----------------- On load ----------------- */
window.addEventListener("load", async () => {
  // beri sedikit delay agar localStorage tersedia
  await new Promise(r => setTimeout(r, 200));

  const username = localStorage.getItem("username");
  const nama = localStorage.getItem("nama");
  const tokenSesi = localStorage.getItem("token_sesi");
  const tokenUnik = localStorage.getItem("token_unik");
  const expire = Number(localStorage.getItem("login_expire") || 0);

  if (!username || !tokenSesi) {
    localStorage.clear();
    return location.href = "index.html";
  }
  if (expire && Date.now() > expire) {
    Swal.fire("Sesi Habis","Sesi Anda telah kadaluarsa. Silakan login kembali.","info");
    localStorage.clear();
    setTimeout(()=> location.href = "index.html", 1200);
    return;
  }

  $("namaUser").innerText = nama || username;
  $("usernameUser").innerText = username;
  // header school name (sidebar brand)
  // will be updated in loadProfilSekolah
  await loadProfilSekolah(tokenUnik || tokenSesi);
  await loadDashboardData(tokenUnik || tokenSesi);
  await loadProgressMapel(tokenUnik || tokenSesi);
});

/* ----------------- Load Profil Sekolah ----------------- */
async function loadProfilSekolah(token) {
  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'getProfilSekolah', token_sekolah: token }) });
    const data = await res.json();
    if (data && data.success) {
      const p = data.profil || {};
      // sidebar top name
      const top = $("schoolNameTop");
      if (top) top.innerText = p.nama_sekolah || "Sekolah Anda";
      // main header name/logo
      const ln = $("logoSekolah");
      if (p.logo_url) ln.src = p.logo_url;
      // infoSchool
      const info = $("infoSchool");
      info.innerHTML = `<strong>${p.nama_sekolah || "-"}</strong><br/>NPSN: ${p.npsn || '-'}<br/>Alamat: ${p.alamat_sekolah || '-'}`;
    } else {
      $("infoSchool").innerText = "Profil sekolah tidak tersedia.";
    }
  } catch (err) {
    console.error("loadProfilSekolah:", err);
    $("infoSchool").innerText = "Gagal memuat profil sekolah.";
  }
}

/* ----------------- Load Dashboard Data ----------------- */
async function loadDashboardData(token) {
  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'getDashboardData', token_sekolah: token }) });
    const data = await res.json();
    if (!data || !data.success) throw new Error('Tidak ada data');

    // cards
    setText('totalSiswa', data.total_siswa);
    setText('totalGuru', data.total_guru);
    setText('totalMapel', data.total_mapel);
    setText('totalKelas', data.total_kelas);
    setText('totalBimbingan', data.total_bimbingan);

    // chart
    initChart(data.statistik || { labels:[], values:[] });

  } catch (err) {
    console.error("loadDashboardData:", err);
    Swal.fire("Gagal", "Tidak dapat memuat data dashboard.", "error");
  }
}

/* ----------------- Load Progress per Mapel ----------------- */
async function loadProgressMapel(token) {
  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'getProgressMapel', token_sekolah: token }) });
    const data = await res.json();
    const container = $("progressMapelContainer");
    if (!container) return;
    container.innerHTML = '';

    if (!data || !data.success || !Array.isArray(data.progress) || data.progress.length === 0) {
      container.innerHTML = '<div style="color:#64748b">Belum ada data progress untuk mapel.</div>';
      return;
    }

    data.progress.forEach(item => {
      const row = document.createElement('div');
      row.className = 'mapel-row';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '12px';
      row.innerHTML = `
        <div class="mapel-label">${escapeHtml(item.mapel)}</div>
        <div class="mapel-bar"><span style="width:0%"></span></div>
        <div class="mapel-percent">${item.persen}%</div>
      `;
      container.appendChild(row);

      // animate width
      setTimeout(()=> {
        const span = row.querySelector('.mapel-bar span');
        if (span) span.style.width = (item.persen || 0) + '%';
      }, 80);
    });

  } catch (err) {
    console.error("loadProgressMapel:", err);
    const container = $("progressMapelContainer");
    if (container) container.innerHTML = '<div style="color:#ef4444">Gagal memuat progress mapel.</div>';
  }
}

/* ----------------- Chart (Chart.js) ----------------- */
let chartInstance = null;
function initChart(stat) {
  const ctx = document.getElementById('chartOverview');
  if (!ctx) return;
  const labels = stat.labels || [];
  const values = stat.values || [];

  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = values;
    chartInstance.update();
    return;
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Rata-rata Nilai',
        data: values,
        backgroundColor: '#3B82F6',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display:false } },
      scales: { y: { beginAtZero:true, max:100 } }
    }
  });
}

/* ----------------- Utilities ----------------- */
function setText(id, val) { const el = $(id); if (el) el.innerText = (val !== undefined && val !== null) ? val : '-'; }
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, (m)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ----------------- About / Developer Info (Popup) ----------------- */
function showDeveloperInfo(){
  Swal.fire({
    title: 'Tentang eRapor Quantum',
    html: `<p><strong>eRapor Quantum Super Genius</strong> — Sistem e-Rapor generasi baru yang dirancang untuk kenyamanan guru dan administrasi sekolah.</p>
           <ul style="text-align:left">
             <li>Integrasi Google Sheets & Apps Script</li>
             <li>Keamanan berbasis token sekolah & sesi</li>
             <li>Dashboard real-time & progress per mapel</li>
           </ul>
           <p style="margin-top:8px">Developed by: <strong>Dedi Agus Mustofa, S.Pd.SD</strong></p>`,
    icon: 'info',
    confirmButtonText: 'Tutup'
  });
}
