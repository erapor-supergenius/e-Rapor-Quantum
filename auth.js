// =======================================================================
// e-Rapor Quantum — AUTH SYSTEM (Final Terhubung Tanpa Proxy + Fitur Ekstra)
// ✅ Sinkron dengan index.html, KODE.GS terakhir, & Notifikasi SweetAlert2
// ✅ Versi sinkron form reset password bawaan halaman (batal & sukses → kembali ke form registrasi)
// =======================================================================

// Ganti dengan URL WebApp kamu (Deploy as: Me, access: Anyone)
const WEBAPP_URL =
"https://script.google.com/macros/s/AKfycbzci8gIoSbG_Jq_hOftnouTjizyk14CPuEtL3QDsJRjpVA-T-EHCRVe6mf05EFvXBVtGw/exec";

/* ---------- UI helpers ---------- */
function _showSection(id) {
// "resetSection" dihapus karena kita menggunakan modal (resetPasswordModal)
const sections = ["tokenSection", "registerSection", "loginSection"];
sections.forEach((s) => {
const el = document.getElementById(s);
if (!el) return;
if (s === id) {
el.style.display = "block";
el.classList.add("fade");
setTimeout(() => el.classList.add("show"), 30);
} else {
el.classList.remove("show");
setTimeout(() => {
el.style.display = "none";
}, 250);
}
});

const title = document.getElementById("title");
if (!title) return;
if (id === "registerSection") title.innerText = "Registrasi Pengguna Baru";
else if (id === "loginSection") title.innerText = "Login Pengguna";
// Referensi 'resetSection' dihapus
else title.innerText = "Masuk ke e-Rapor Quantum";
}

/* ---------- VALIDASI TOKEN ---------- */
async function validateToken() {
const el = document.getElementById("tokenInput") || document.getElementById("token");
if (!el) return Swal.fire("Error", "Kolom token tidak ditemukan di halaman.", "error");

const token = el.value.trim();
if (!token) return Swal.fire("Perhatian", "Masukkan token sekolah!", "warning");

try {
Swal.fire({
title: "Memeriksa Token...",
text: "Mohon tunggu, sistem sedang memverifikasi token sekolah Anda.",
allowOutsideClick: false,
didOpen: () => Swal.showLoading(),
});

// PERBAIKAN: Tanda ``` telah dihapus
const resp = await fetch(WEBAPP_URL, {
  method: "POST",
  body: JSON.stringify({ action: "validateToken", token_unik: token }),
});
const data = await resp.json();

Swal.close();

if (data.success) {
  localStorage.setItem("token_unik", token);
  Swal.fire({
    icon: "success",
    title: "Token Diterima!",
    text: data.needsRegister
      ? "Silakan lanjut ke halaman registrasi."
      : "Sekolah sudah terdaftar. Silakan login.",
    confirmButtonText: data.needsRegister ? "Registrasi" : "Login",
    confirmButtonColor: "#1d4ed8",
  }).then(() => {
    if (data.needsRegister) _showSection("registerSection");
    else _showSection("loginSection");
  });
} else {
  Swal.fire("Gagal", data.error || "Token tidak valid", "error");
}

} catch (err) {
Swal.close();
Swal.fire("Error", err.message || "Gagal terhubung ke server.", "error");
}
}

/* ---------- REGISTRASI ---------- */
async function registerUser() {
const token = localStorage.getItem("token_unik") || "";
const nama = (document.getElementById("nama") || {}).value?.trim();
const username = (document.getElementById("usernameReg") || {}).value?.trim();
const password = (document.getElementById("passwordReg") || {}).value?.trim();

if (!token) return Swal.fire("Gagal", "Token sekolah tidak ditemukan.", "error");
if (!nama || !username || !password)
return Swal.fire("Perhatian", "Lengkapi semua kolom.", "warning");

try {
Swal.fire({
title: "Menyimpan Data...",
text: "Mohon tunggu, sedang memproses pendaftaran.",
allowOutsideClick: false,
didOpen: () => Swal.showLoading(),
});

// PERBAIKAN: Tanda ``` telah dihapus
const resp = await fetch(WEBAPP_URL, {
  method: "POST",
  body: JSON.stringify({
    action: "register",
    token_unik: token,
    nama_lengkap: nama,
    username,
    password,
  }),
});
const data = await resp.json();

Swal.close();

if (data.success) {
  localStorage.setItem("username", username);
  localStorage.setItem("password", password);
  Swal.fire({
    icon: "success",
    title: "Registrasi Berhasil",
    text: "Masuk ke dashboard...",
    showConfirmButton: false,
    timer: 1200,
    timerProgressBar: true,
  });
  setTimeout(() => loginUser(username, password), 1200);
} else {
  Swal.fire("Gagal", data.error || "Registrasi gagal", "error");
}

} catch (err) {
Swal.close();
Swal.fire("Error", err.message || "Gagal terhubung ke server.", "error");
}
}

/* ---------- LOGIN ---------- */
async function loginUser(forceUsername, forcePassword) {
const username = forceUsername || (document.getElementById("usernameLogin") || {}).value?.trim();
const password = forcePassword || (document.getElementById("passwordLogin") || {}).value?.trim();

if (!username || !password)
return Swal.fire("Perhatian", "Masukkan username & password.", "warning");

try {
Swal.fire({
title: "Memproses Login...",
text: "Mohon tunggu, menyiapkan dashboard Anda.",
allowOutsideClick: false,
didOpen: () => Swal.showLoading(),
});

// PERBAIKAN: Tanda ``` telah dihapus
const resp = await fetch(WEBAPP_URL, {
  method: "POST",
  body: JSON.stringify({ action: "login", username, password }),
});
const data = await resp.json();

Swal.close();

if (data.success) {
  localStorage.setItem("token_sesi", data.token_sesi);
  localStorage.setItem("username", data.username);
  localStorage.setItem("nama", data.nama_lengkap);
  localStorage.setItem("token_unik", data.token_unik_sekolah || "");
  localStorage.setItem("spreadsheet_id", data.spreadsheet_id_sekolah || "");
  localStorage.setItem("login_expire", String(Date.now() + 3600000));
  Swal.fire({
    icon: "success",
    title: "Login Berhasil",
    text: "Mengalihkan ke dashboard...",
    showConfirmButton: false,
    timer: 1200,
    timerProgressBar: true,
  });
  setTimeout(() => (window.location.href = "dashboard.html"), 1200);
} else {
  Swal.fire("Gagal", data.error || "Login gagal", "error");
}

} catch (err) {
Swal.close();
Swal.fire("Error", err.message || "Gagal terhubung ke server.", "error");
}
}

/* ---------- Navigasi manual ---------- */
// Ini dipanggil oleh link "Belum punya akun?"
function showRegister() {
_showSection("registerSection");
}
// Ini dipanggil oleh link "Sudah punya akun?"
function showLogin() {
_showSection("loginSection");
}

/* PERBAIKAN: 
  Fungsi 'resetPasswordUser' dan 'batalResetPassword' dihapus dari auth.js 
  karena logikanya sudah ditangani langsung di dalam <script> di index.html 
  untuk mengontrol modal 'resetPasswordModal'. 
  Ini mencegah konflik dan error duplikat.
*/
