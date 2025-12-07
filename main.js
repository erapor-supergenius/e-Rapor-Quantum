/* ==========================================================
   KONFIGURASI BACKEND
   Pastikan URL ini adalah URL Web App Apps Script terbaru
========================================================== */
const API_URL = "https://script.google.com/macros/s/AKfycbxechuZ-DqZpE-Jhji8rI8tfH9alGb2oEun47RUKnAkFZZ-gMOg15sL_Jywx86tgHxQdg/exec";

/* ==========================================================
   HELPER : API REQUEST HANDLER
========================================================== */
async function apiRequest(action, data = {}) {
  const payload = { action, ...data };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`HTTP Error Status: ${res.status}`);
      alert(`Gagal terhubung ke server! (Status: ${res.status})`);
      return null;
    }

    const result = await res.json();
    return result;
  } catch (err) {
    console.error("API Error:", err);
    alert("Gagal terhubung ke server! (Cek koneksi atau URL backend Apps Script)");
    return null;
  }
}

/* ==========================================================
   LOGIN USER / GURU
========================================================== */
async function login() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!username || !password) {
    alert("Username dan Password wajib diisi!");
    return;
  }

  const response = await apiRequest("loginUser", { username, password });

  if (!response || !response.success) {
    alert(response?.message || "Login gagal!");
    return;
  }

  // Simpan sesi
  const data = response.data || {};
  localStorage.setItem("username", data.username || username);
  localStorage.setItem("token_unik", data.token_unik || "");
  localStorage.setItem("spreadsheet_id", data.spreadsheet_id || "");

  window.location.href = "dashboard.html";
}

/* ==========================================================
   CEK TOKEN SEKOLAH (VALIDATE TOKEN)
========================================================== */
async function checkToken() {
  const token = document.getElementById("schoolToken")?.value.trim();

  if (!token) {
    alert("Token sekolah wajib diisi!");
    return;
  }

  const response = await apiRequest("validateToken", { token_unik: token });

  if (!response || !response.success) {
    alert(response?.message || "Token tidak valid!");
    return;
  }

  // Simpan token di localStorage
  localStorage.setItem("token_unik", token);

  alert("Token valid! Silakan isi form registrasi.");
  window.location.href = "register.html";
}

/* ==========================================================
   REGISTRASI USER (ADMIN)
========================================================== */
async function registerUser() {
  const token = localStorage.getItem("token_unik");
  if (!token) {
    alert("Token tidak ditemukan! Silakan ulangi dari awal.");
    window.location.href = "index.html";
    return;
  }

  const fullname = document.getElementById("fullname")?.value.trim();
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!fullname || !username || !password) {
    alert("Semua field wajib diisi!");
    return;
  }

  const response = await apiRequest("registerUser", {
    token_unik: token,
    nama_lengkap: fullname,
    username,
    password,
  });

  if (!response || !response.success) {
    alert(response?.message || "Registrasi gagal");
    return;
  }

  // Simpan data registrasi
  localStorage.setItem("username", username);
  localStorage.setItem("token_unik", token);
  localStorage.setItem("spreadsheet_id", response.spreadsheet_id || "");

  alert("Registrasi berhasil! Anda otomatis menjadi ADMIN.");
  window.location.href = "dashboard.html";
}

/* ==========================================================
   LOAD DASHBOARD
========================================================== */
function loadDashboard() {
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token_unik");

  if (!username || !token) {
    alert("Anda belum login!");
    window.location.href = "index.html";
    return;
  }

  // Tampilkan username di dashboard
  const usernameEl = document.getElementById("username");
  if (usernameEl) usernameEl.innerText = username;

  // Muat nama sekolah
  loadSchoolName();
}

/* ==========================================================
   AMBIL NAMA SEKOLAH (DARI VALIDATE TOKEN)
========================================================== */
async function loadSchoolName() {
  const token = localStorage.getItem("token_unik");
  if (!token) return;

  const response = await apiRequest("validateToken", { token_unik: token });

  if (response && response.success && response.data) {
    const schoolNameEl = document.getElementById("schoolName");
    if (schoolNameEl) {
      schoolNameEl.innerText =
        response.data.nama_sekolah || "Sekolah Tidak Dikenal";
    }
  }
}

/* ==========================================================
   LOGOUT
========================================================== */
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}
