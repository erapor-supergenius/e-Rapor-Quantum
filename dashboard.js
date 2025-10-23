/****************************************************
 * dashboard.js — e-Rapor Quantum
 * Versi Premium Final (sinkron dengan dashboard.html)
 * Dikembangkan oleh: Dedi Agus Mustofa, S.Pd.SD © 2025
 ****************************************************/

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

/* =========================================================
   🔹 Element DOM
========================================================= */
const sidebar = document.getElementById("sidebar");
const mainWrap = document.getElementById("mainWrap");
const logoutBtn = document.getElementById("logoutBtn");

/* =========================================================
   🔹 Logout
========================================================= */
logoutBtn?.addEventListener("click", async () => {
  const token = localStorage.getItem("token_sesi");
  try {
    await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "logout", token_sesi: token })
    });
  } catch (e) {
    console.warn("Logout tanpa koneksi:", e);
  }

  Swal.fire({
    icon: "success",
    title: "Logout Berhasil",
    text: "Anda telah keluar dari sistem.",
    timer: 1000,
    showConfirmButton: false
  });

  localStorage.clear();
  setTimeout(() => (location.href = "index.html"), 1000);
});

/* =========================================================
   🔹 Navigasi sementara
========================================================= */
function goto(page) {
  if (page === "pengembang") {
    showDeveloperInfo();
  } else {
    Swal.fire("Fitur Belum Aktif", "Menu " + page + " akan tersedia di versi berikutnya.", "info");
  }
}

/* =========================================================
   🔹 Saat halaman dimuat
========================================================= */
window.addEventListener("load", async () => {
  await new Promise((r) => setTimeout(r, 300));

  const username = localStorage.getItem("username");
  const nama = localStorage.getItem("nama");
  const tokenSesi = localStorage.getItem("token_sesi");
  const tokenUnik = localStorage.getItem("token_unik");
  const expire = Number(localStorage.getItem("login_expire") || 0);

  // Cek login
  if (!username || !tokenSesi) {
    localStorage.clear();
    return (location.href = "index.html");
  }

  if (expire && Date.now() > expire) {
    Swal.fire("Sesi Habis", "Silakan login kembali.", "info");
    localStorage.clear();
    setTimeout(() => (location.href = "index.html"), 1300);
    return;
  }

  // Tampilkan nama user
  document.getElementById("namaUser").innerText = nama || username;
  document.getElementById("usernameUser").innerText = username;

  // Ambil data
  await loadProfilSekolah(tokenUnik || tokenSesi);
  await loadDashboardData(tokenUnik || tokenSesi);
  await loadProgressMapel(tokenUnik || tokenSesi);
});

/* =========================================================
   🔹 Ambil Profil Sekolah
========================================================= */
async function loadProfilSekolah(token) {
  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getProfilSekolah", token_sekolah: token })
    });
    const data = await res.json();

    if (data && data.success) {
      const profil = data.profil || {};
      document.getElementById("schoolNameTop").innerText = profil.nama_sekolah || "Sekolah Anda";
      document.getElementById("schoolName").innerText = profil.nama_sekolah || "Sekolah Anda";

      const img = document.getElementById("logoSekolah");
      if (profil.logo_url) img.src = profil.logo_url;

      const info = document.getElementById("infoSchool");
      info.innerHTML = `
        <strong>${profil.nama_sekolah || "Sekolah Anda"}</strong><br/>
        NPSN: ${profil.npsn || "-"}<br/>
        Alamat: ${profil.alamat_sekolah || "-"}
      `;
    } else {
      document.getElementById("infoSchool").innerText = "Profil sekolah tidak ditemukan.";
    }
  } catch (err) {
    console.error("Gagal memuat profil sekolah:", err);
    document.getElementById("infoSchool").innerText = "Gagal memuat profil sekolah.";
  }
}

/* =========================================================
   🔹 Ambil Data Dashboard
========================================================= */
async function loadDashboardData(token) {
  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getDashboardData", token_sekolah: token })
    });
    const data = await res.json();

    if (!data.success) throw new Error("Data dashboard gagal dimuat");

    // Update card
    setText("totalGuru", data.total_guru);
    setText("totalSiswa", data.total_siswa);
    setText("totalMapel", data.total_mapel);
    setText("totalKelas", data.total_kelas);
    setText("totalBimbingan", data.total_bimbingan);

    // Chart
    initChart(data.statistik);

    // Progress global
    animateProgressBar("progressSiswa", data.progres_siswa);
    animateProgressBar("progressGuru", data.progres_guru);
  } catch (err) {
    console.error(err);
    Swal.fire("Kesalahan", "Tidak dapat memuat data dashboard.", "error");
  }
}

/* =========================================================
   🔹 Ambil Progress per Mapel
========================================================= */
async function loadProgressMapel(token) {
  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getProgressMapel", token_sekolah: token })
    });
    const data = await res.json();

    if (!data.success) throw new Error("Progress tidak tersedia");

    const container = document.getElementById("progressMapelContainer");
    if (!container) return;

    container.innerHTML = "";
    data.progress.forEach((p) => {
      const row = document.createElement("div");
      row.className = "progress-row";
      row.innerHTML = `
        <div class="mapel-label">${p.mapel}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${p.persen}%;"></div></div>
        <div class="percent">${p.persen}%</div>
      `;
      container.appendChild(row);
    });
  } catch (err) {
    console.error("Gagal memuat progress mapel:", err);
  }
}

/* =========================================================
   🔹 Utility Functions
========================================================= */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val ?? "-";
}

function animateProgressBar(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = "0%";
  setTimeout(() => (el.style.width = (val || 0) + "%"), 100);
}

/* =========================================================
   🔹 Chart Nilai
========================================================= */
function initChart(statistik = {}) {
  const ctx = document.getElementById("chartOverview");
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: statistik.labels || [],
      datasets: [
        {
          label: "Rata-rata Nilai",
          data: statistik.values || [],
          backgroundColor: "#3B82F6",
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

/* =========================================================
   🔹 Tentang Pengembang
========================================================= */
function showDeveloperInfo() {
  Swal.fire({
    title: "Tentang eRapor Quantum",
    html: `
      <p><strong>eRapor Quantum</strong> adalah e-Rapor modern berbasis cloud
      yang dikembangkan oleh <strong>Dedi Agus Mustofa, S.Pd.SD</strong>.</p>
      <ul style="text-align:left;margin-top:10px;">
        <li>⚡ Terintegrasi penuh dengan Google Workspace</li>
        <li>🔒 Keamanan tinggi dengan token sekolah & login terenkripsi</li>
        <li>📊 Dashboard premium dengan data real-time</li>
        <li>🧠 Sistem cerdas otomatisasi deskripsi dan rekap nilai</li>
      </ul>
      <p style="margin-top:10px;">Versi 2025 — <strong>e-Rapor Quantum</strong></p>
    `,
    icon: "info",
    confirmButtonText: "Tutup"
  });
}
