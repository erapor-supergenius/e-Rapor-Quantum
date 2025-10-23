/****************************************************
 * eRapor Quantum Super Genius — Dashboard
 * Versi Final Premium (Full Integrated)
 * Dibangun oleh DTV (c) 2025
 ****************************************************/

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

/* ===================================================
   🔹 ELEMENT UTAMA
=================================================== */
const sidebar = document.getElementById("sidebar");
const mainWrap = document.getElementById("mainWrap");
const menuBtn = document.getElementById("menuBtn");
const logoutBtn = document.getElementById("logoutBtn");

/* ===================================================
   🔹 SIDEBAR TOGGLE (Responsive)
=================================================== */
menuBtn?.addEventListener("click", () => {
  sidebar.classList.toggle("show");
});

/* ===================================================
   🔹 LOGOUT HANDLER
=================================================== */
logoutBtn?.addEventListener("click", async () => {
  const token = localStorage.getItem("token_sesi");
  try {
    await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "logout", token_sesi: token }),
    });
  } catch (e) {
    console.warn("Logout tanpa koneksi:", e);
  }

  Swal.fire({
    icon: "success",
    title: "Logout",
    text: "Anda telah keluar dari sistem.",
    timer: 900,
    showConfirmButton: false,
  });

  localStorage.clear();
  setTimeout(() => (location.href = "index.html"), 900);
});

/* ===================================================
   🔹 MENU SEMENTARA (Untuk fitur yang belum aktif)
=================================================== */
function goto(page) {
  Swal.fire("Fitur", "Menu " + page + " akan tersedia pada modul berikutnya.", "info");
}

/* ===================================================
   🔹 ON LOAD — VALIDASI SESI + PROFIL SEKOLAH + DASHBOARD
=================================================== */
window.addEventListener("load", async () => {
  await new Promise((r) => setTimeout(r, 300)); // beri waktu untuk localStorage terisi

  const username = localStorage.getItem("username");
  const nama = localStorage.getItem("nama");
  const tokenSesi = localStorage.getItem("token_sesi");
  const tokenUnik = localStorage.getItem("token_unik");
  const expire = Number(localStorage.getItem("login_expire") || 0);

  // Validasi sesi login
  if (!username || !tokenSesi) {
    localStorage.clear();
    return (location.href = "index.html");
  }

  if (expire && Date.now() > expire) {
    Swal.fire("Sesi Habis", "Sesi Anda telah kadaluarsa. Silakan login kembali.", "info");
    localStorage.clear();
    setTimeout(() => (location.href = "index.html"), 1300);
    return;
  }

  // Tampilkan nama user di header
  document.getElementById("namaUser").innerText = nama || username;
  document.getElementById("usernameUser").innerText = username;

  // Ambil profil sekolah dari backend
  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getProfilSekolah", token_sekolah: tokenUnik || tokenSesi }),
    });
    const data = await res.json();

    if (data && data.success) {
      const namaSekolah = data.profil?.nama_sekolah || data.nama_sekolah || "Sekolah Anda";
      document.getElementById("schoolName").innerText = namaSekolah;

      if (data.profil?.logo_url) {
        document.getElementById("logoSekolah").src = data.profil.logo_url;
      }

      document.getElementById("infoSchool").innerHTML = `
        <strong>${namaSekolah}</strong><br/>
        NPSN: ${data.profil?.npsn || "-"}<br/>
        Alamat: ${data.profil?.alamat_sekolah || "-"}
      `;
    } else {
      document.getElementById("infoSchool").innerText = "Profil sekolah tidak tersedia.";
    }
  } catch (err) {
    document.getElementById("infoSchool").innerText = "Gagal memuat profil sekolah.";
    console.error(err);
  }

  // Responsive behavior (auto-collapse sidebar)
  if (window.innerWidth <= 900) {
    sidebar.classList.remove("show");
    mainWrap.classList.add("full");
  } else {
    mainWrap.classList.remove("full");
  }

  // Ambil dan tampilkan data dashboard
  loadDashboardData();
});

/* ===================================================
   🔹 LOAD DATA DASHBOARD
=================================================== */
async function loadDashboardData() {
  try {
    const tokenUnik = localStorage.getItem("token_unik");
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getDashboardData", token_sekolah: tokenUnik }),
    });

    const data = await res.json();
    if (!data.success) throw new Error("Gagal memuat data dashboard.");

    // Update card angka statistik
    updateCard("totalSiswa", data.total_siswa);
    updateCard("totalGuru", data.total_guru);
    updateCard("totalMapel", data.total_mapel);
    updateCard("totalKelas", data.total_kelas);

    // Tampilkan grafik
    initChart(data.statistik);

    // Update progress bar animasi
    animateProgress("progressSiswa", data.progres_siswa);
    animateProgress("progressGuru", data.progres_guru);
  } catch (e) {
    console.error(e);
    Swal.fire("Gagal", "Tidak dapat memuat data dashboard.", "error");
  }
}

/* ===================================================
   🔹 FUNGSI TAMBAHAN: CARD, PROGRESS, CHART
=================================================== */

// Update isi card
function updateCard(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value ?? "-";
}

// Animasi progress bar
function animateProgress(id, percent) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = "0%";
  setTimeout(() => {
    el.style.width = (percent || 0) + "%";
  }, 100);
}

// Chart.js - grafik utama dashboard
function initChart(statistik = {}) {
  const ctx = document.getElementById("chartOverview");
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: statistik.labels || ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          label: "Nilai Rata-rata",
          data: statistik.values || [70, 75, 80, 85],
          backgroundColor: "#4CAF50",
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, max: 100 },
      },
    },
  });
}

/* ===================================================
   🔹 MODAL INFORMASI DEVELOPER (About)
=================================================== */
function showDeveloperInfo() {
  Swal.fire({
    title: "Tentang e-Rapor Quantum",
    html: `
      <p><strong>e-Rapor Quantum</strong> adalah sistem e-Rapor generasi baru yang dikembangkan oleh <strong>Dedi Agus Mustofa, S.Pd.SD</strong> untuk memberikan pengalaman pengelolaan nilai yang cepat, cerdas, dan aman.</p>
      <ul style="text-align:left; margin-top:10px;">
        <li>⚡ Terintegrasi penuh dengan Google Workspace (Apps Script & Sheet)</li>
        <li>🔒 Keamanan tinggi dengan token & sesi login</li>
        <li>📊 Tampilan dashboard premium dan data real-time</li>
        <li>🧠 Sistem cerdas otomatisasi deskripsi dan penilaian</li>
      </ul>
      <p style="margin-top:10px;">Versi 2025 — <strong>e-Rapor Quantum</strong>.<br>Developed by: Dedi Agus Mustofa, S.Pd.SD © All Rights Reserved.</p>
    `,
    icon: "info",
    confirmButtonText: "Tutup",
  });
}
