/* =====================================================================
 * e-Rapor Quantum — DASHBOARD.JS (Super Genius Final)
 * Sinkron dengan KODE.GS Super Genius + Dashboard.html versi final
 * ===================================================================== */

// URL WebApp (ubah sesuai milikmu)
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzSNseVpWuNseMTG0ilYHXb8y8xndFDe4DjS7BLFB36OsC3WHZ6YSYv6n4fjkhYTfesrA/exec";

/* =============================
   HELPER & UTILITAS
============================= */
function getSession() {
  try {
    return JSON.parse(localStorage.getItem("erapor_session")) || {};
  } catch (e) {
    return {};
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text ?? "";
}

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe.replace(/[&<>"']/g, function (m) {
    return (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] ||
      m
    );
  });
}

/* =============================
   INISIALISASI DASHBOARD
============================= */
document.addEventListener("DOMContentLoaded", () => {
  const session = getSession();
  if (!session || !session.token_unik_sekolah) {
    Swal.fire({
      icon: "warning",
      title: "Sesi Habis",
      text: "Silakan login kembali.",
      confirmButtonColor: "#2563eb",
    }).then(() => {
      window.location.href = "index.html";
    });
    return;
  }

  // Isi nama dan username di header
  setText("namaUser", session.nama_lengkap || "User");
  setText("usernameUser", session.username || "");

  // Load semua data dashboard
  loadDashboardData(session.token_unik_sekolah);
  loadProfilSekolah(session.token_unik_sekolah);
  loadDataGuru(session.token_unik_sekolah);

  // Tombol logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    Swal.fire({
      title: "Keluar?",
      text: "Apakah Anda yakin ingin logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Logout",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem("erapor_session");
        window.location.href = "index.html";
      }
    });
  });

  // Modal tambah guru
  const modal = document.getElementById("modalGuru");
  const closeModal = document.getElementById("closeModalGuru");
  const btnTambah = document.getElementById("btnTambahGuru");
  const btnSave = document.getElementById("saveGuruBtn");

  btnTambah.addEventListener("click", () => {
    document.getElementById("modalTitle").textContent = "Tambah Guru";
    document.getElementById("guruId").value = "";
    document.getElementById("guruNama").value = "";
    document.getElementById("guruUsername").value = "";
    document.getElementById("guruPassword").value = "";
    document.getElementById("guruLevel").value = "guru";
    modal.style.display = "flex";
  });

  closeModal.addEventListener("click", () => (modal.style.display = "none"));

  btnSave.addEventListener("click", async () => {
    await saveGuru(session.token_unik_sekolah);
    modal.style.display = "none";
  });
});

/* =============================
   DASHBOARD DATA (versi Super Genius)
============================= */
async function loadDashboardData(token, retry = 0) {
  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getDashboardData",
        payload: { token },
      }),
    });

    // Cek status koneksi
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Respon tidak valid dari server.");

    // Isi data ke kartu dashboard
    setText("totalSiswa", data.total_siswa ?? 0);
    setText("totalGuru", data.total_guru ?? 0);
    setText("totalMapel", data.total_mapel ?? 0);
    setText("totalKelas", data.total_kelas ?? 0);
    setText("totalBimbingan", data.total_bimbingan ?? 0);

    // Tampilkan grafik & progres mapel (termasuk muatan lokal)
    renderChart(data.statistik || {});
    renderProgress(data.statistik || {});

  } catch (err) {
    console.error("loadDashboardData Error:", err);

    // Coba ulang sekali jika gagal pertama kali
    if (retry < 1) {
      console.warn("Mengulang permintaan getDashboardData...");
      setTimeout(() => loadDashboardData(token, retry + 1), 2000);
      return;
    }

    // Jika tetap gagal setelah retry
    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Dashboard",
      text: err.message.includes("Failed to fetch")
        ? "Koneksi ke server gagal. Pastikan internet stabil atau periksa URL WebApp."
        : err.message,
      confirmButtonColor: "#2563eb",
    });
  }
}

/* =============================
   PROFIL SEKOLAH
============================= */
async function loadProfilSekolah(token) {
  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getProfilSekolah", payload: { token } }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const profil = data.profil || {};
    document.getElementById("schoolNameTop").textContent =
      profil.nama_sekolah || "Sekolah";
    document.getElementById("infoSchool").innerHTML = `
      <div><strong>Nama Sekolah:</strong> ${escapeHtml(profil.nama_sekolah || "-")}</div>
      <div><strong>NPSN:</strong> ${escapeHtml(profil.npsn || "-")}</div>
      <div><strong>Status:</strong> ${escapeHtml(profil.status_sekolah || "-")}</div>
      <div><strong>Alamat:</strong> ${escapeHtml(profil.alamat_sekolah || "-")}</div>
      <div><strong>Kecamatan:</strong> ${escapeHtml(profil.kecamatan || "-")}</div>
      <div><strong>Kabupaten/Kota:</strong> ${escapeHtml(profil.kabupaten_kota || "-")}</div>
      <div><strong>Provinsi:</strong> ${escapeHtml(profil.provinsi || "-")}</div>
      <div><strong>Telepon:</strong> ${escapeHtml(profil.telepon || "-")}</div>
    `;

    // Logo sekolah
    const logoEl = document.getElementById("logoSekolah");
    if (profil.url_logo && profil.url_logo.trim() !== "")
      logoEl.src = profil.url_logo;
  } catch (err) {
    console.warn("Profil sekolah tidak tersedia:", err.message);
  }
}

/* =============================
   DATA GURU
============================= */
async function loadDataGuru(token) {
  const container = document.getElementById("guruTableContainer");
  container.innerHTML = "Memuat data guru...";
  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getDataGuru", payload: { token } }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const guru = data.guru || [];
    if (guru.length === 0) {
      container.innerHTML = `<div style="color:#64748b">Belum ada data guru.</div>`;
      return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#e2e8f0;text-align:left">
        <th style="padding:8px;border-bottom:2px solid #cbd5e1">Nama</th>
        <th style="padding:8px;border-bottom:2px solid #cbd5e1">Username</th>
        <th style="padding:8px;border-bottom:2px solid #cbd5e1">Level</th>
        <th style="padding:8px;border-bottom:2px solid #cbd5e1;text-align:center">Aksi</th>
      </tr></thead><tbody>`;

    guru.forEach((g) => {
      html += `<tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(g.nama_guru)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(g.id_guru)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(g.level)}</td>
        <td style="padding:8px;text-align:center;border-bottom:1px solid #e2e8f0">
          <button onclick="deleteGuru('${g.id_guru}')" style="background:#ef4444;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer">Hapus</button>
        </td></tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="color:red">${escapeHtml(err.message)}</div>`;
  }
}

async function saveGuru(token) {
  try {
    const nama = document.getElementById("guruNama").value.trim();
    const username = document.getElementById("guruUsername").value.trim();
    const password = document.getElementById("guruPassword").value.trim();
    const level = document.getElementById("guruLevel").value.trim();

    if (!nama || !username || !password) {
      Swal.fire("Lengkapi Data", "Semua kolom wajib diisi.", "warning");
      return;
    }

    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveDataGuru",
        payload: { token, nama_guru: nama, id_guru: username, nip: password, level },
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    Swal.fire({
      icon: "success",
      title: "Data Guru Tersimpan",
      timer: 1500,
      showConfirmButton: false,
    });
    loadDataGuru(token);
  } catch (err) {
    Swal.fire("Gagal Menyimpan", err.message, "error");
  }
}

async function deleteGuru(username) {
  const session = getSession();
  if (!session.token_unik_sekolah) return;

  const conf = await Swal.fire({
    title: "Hapus Guru?",
    text: "Data guru akan dihapus permanen.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Ya, Hapus",
  });

  if (!conf.isConfirmed) return;

  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deleteGuru",
        payload: { token: session.token_unik_sekolah, username },
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    Swal.fire("Berhasil", "Data guru dihapus.", "success");
    loadDataGuru(session.token_unik_sekolah);
  } catch (err) {
    Swal.fire("Gagal", err.message, "error");
  }
}

/* =============================
   CHART & PROGRESS
============================= */
function renderChart(stat) {
  const ctx = document.getElementById("chartOverview");
  if (!ctx) return;
  const labels = stat.labels || [];
  const values = stat.values || [];

  // Pastikan muatan lokal tampil
  if (!labels.some((l) => l.toLowerCase().includes("muatan lokal"))) {
    labels.push("Muatan Lokal");
    values.push(0);
  }

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Nilai Rata-rata",
          data: values,
          borderWidth: 1,
          backgroundColor: "#3b82f6",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 100 } },
      plugins: { legend: { display: false } },
    },
  });
}

function renderProgress(stat) {
  const container = document.getElementById("progressMapelContainer");
  container.innerHTML = "";
  const labels = stat.labels || [];
  const values = stat.values || [];

  // Pastikan muatan lokal tampil
  if (!labels.some((l) => l.toLowerCase().includes("muatan lokal"))) {
    labels.push("Muatan Lokal");
    values.push(0);
  }

  labels.forEach((nama, i) => {
    const val = Math.min(Math.max(values[i] || 0, 0), 100);
    const row = document.createElement("div");
    row.className = "mapel-row";
    row.innerHTML = `
      <div class="mapel-label">${escapeHtml(nama)}</div>
      <div class="mapel-bar"><span style="width:${val}%;"></span></div>
      <div class="mapel-percent">${val}%</div>
    `;
    container.appendChild(row);
  });
}

/* =============================
   NAVIGASI
============================= */
function navigateTo(page) {
  window.location.href = page;
}
