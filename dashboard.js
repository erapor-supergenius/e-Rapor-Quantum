/****************************************************
 * dashboard.js — eRapor Quantum Super Genius
 * Versi Final Premium (Responsive + Dynamic Data)
 * Dikembangkan oleh: Dedi Agus Mustofa, S.Pd.SD (c) 2025
 ****************************************************/

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

/* ========== Elemen utama ========== */
const sidebar = document.getElementById("sidebar");
const mainWrap = document.getElementById("mainWrap");
const menuBtn = document.getElementById("menuBtn");
const logoutBtn = document.getElementById("logoutBtn");

/* ========== Sidebar toggle ========== */
menuBtn?.addEventListener("click", () => {
  sidebar.classList.toggle("show");
});

/* ========== Logout ========== */
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
    title: "Logout",
    text: "Anda telah keluar dari sistem.",
    timer: 1000,
    showConfirmButton: false
  });

  localStorage.clear();
  setTimeout(() => (location.href = "index.html"), 1000);
});

/* ========== Navigasi (sementara) ========== */
function goto(page) {
  Swal.fire("Fitur", "Menu " + page + " akan tersedia di modul berikutnya.", "info");
}

/* ======================================================
   🔹 Saat halaman dimuat: validasi sesi & ambil data awal
====================================================== */
window.addEventListener("load", async () => {
  await new Promise((r) => setTimeout(r, 300)); // tunggu data login

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
    Swal.fire("Sesi Habis", "Silakan login kembali.", "info");
    localStorage.clear();
    setTimeout(() => (location.href = "index.html"), 1300);
    return;
  }

  // Tampilkan identitas user
  document.getElementById("namaUser").innerText = nama || username;
  document.getElementById("usernameUser").innerText = username;

  // Ambil profil sekolah
  await loadProfilSekolah(tokenUnik || tokenSesi);

  // Ambil data dashboard
  await loadDashboardData(tokenUnik || tokenSesi);

  // Ambil progres tiap mapel
  await loadProgressMapel(tokenUnik || tokenSesi);

  // Responsif
  if (window.innerWidth <= 900) {
    sidebar.classList.remove("show");
    mainWrap.classList.add("full");
  }
});

/* ======================================================
   🔹 Fungsi: Ambil Profil Sekolah
====================================================== */
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
      document.getElementById("infoSchool").innerText = "Profil sekolah tidak tersedia.";
    }
  } catch (err) {
    console.error("Gagal memuat profil sekolah:", err);
    document.getElementById("infoSchool").innerText = "Terjadi kesalahan memuat profil sekolah.";
  }
}

/* ======================================================
   🔹 Fungsi: Ambil Data Dashboard
====================================================== */
async function loadDashboardData(token) {
  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getDashboardData", token_sekolah: token })
    });
    const data = await res.json();

    if (!data.success) throw new Error("Gagal memuat data dashboard");

    // Isi angka-angka dashboard
    setText("totalGuru", data.total_guru);
    setText("totalSiswa", data.total_siswa);
    setText("totalMapel", data.total_mapel);
    setText("totalKelas", data.total_kelas);
    setText("totalBimbingan", data.total_bimbingan);

    // Chart nilai rata-rata
    initChart(data.statistik);

    // Progress total siswa & guru
    animateProgress("progressSiswa", data.progres_siswa);
    animateProgress("progressGuru", data.progres_guru);
  } catch (e) {
    console.error(e);
    Swal.fire("Kesalahan", "Tidak dapat memuat data dashboard.", "error");
  }
}

/* ======================================================
   🔹 Fungsi: Ambil Progress Tiap Mapel
====================================================== */
async function loadProgressMapel(token) {
  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getProgressMapel", token_sekolah: token })
    });
    const data = await res.json();

    if (!data.success) throw new Error("Data progres tidak tersedia");

    const container = document.getElementById("progressMapelContainer");
    if (!container) return;

    container.innerHTML = "";
    data.progress.forEach((p) => {
      const row = document.createElement("div");
      row.className = "mapel-progress-row";
      row.innerHTML = `
        <div class="mapel-label">${p.mapel}</div>
        <div class="mapel-bar">
          <div class="mapel-fill" style="width:${p.persen}%;"></div>
        </div>
        <div class="mapel-percent">${p.persen}%</div>
      `;
      container.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

/* ======================================================
   🔹 Fungsi Tambahan Utility
====================================================== */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val ?? "-";
}

function animateProgress(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = "0%";
  setTimeout(() => (el.style.width = (val || 0) + "%"), 100);
}

/* ======================================================
   🔹 Fungsi: Inisialisasi Chart Nilai
====================================================== */
function initChart(statistik = {}) {
  const ctx = document.getElementById("chartOverview");
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: statistik.labels || ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          label: "Rata-rata Nilai",
          data: statistik.values || [70, 75, 80, 85],
          backgroundColor: "#3B82F6",
          borderRadius: 8
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

/* ======================================================
   🔹 Tentang Pengembang
====================================================== */
function showDeveloperInfo() {
  Swal.fire({
    title: "Tentang e-Rapor Quantum",
    html: `
      <p><strong>e-Rapor Quantum</strong> adalah e-Rapor modern berbasis cloud
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
