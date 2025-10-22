// ======================================
// e-Rapor Quantum — Auth System Premium
// ======================================
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec"; // Ganti dengan URL Web App kamu

// Efek transisi lembut antar form
function showSection(showId) {
  const sections = ["tokenSection", "registerSection", "loginSection"];
  sections.forEach(id => {
    const el = document.getElementById(id);
    el.classList.add("hidden");
    el.classList.remove("fade", "show");
  });
  const target = document.getElementById(showId);
  target.classList.remove("hidden");
  target.classList.add("fade");
  setTimeout(() => target.classList.add("show"), 50);
}

// Token → Registrasi
async function validateToken() {
  const token = document.getElementById("token").value.trim();
  if (!token) return Swal.fire("Perhatian", "Masukkan token sekolah!", "warning");

  try {
    Swal.fire({
      title: "Memeriksa Token...",
      text: "Mohon tunggu, sistem sedang memverifikasi token sekolah Anda.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "validateToken", token_unik: token }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token_unik", token);
      Swal.fire({
        icon: "success",
        title: "Token Diterima!",
        text: "Sedang mengarahkan ke form registrasi...",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });
      setTimeout(() => {
        showSection("registerSection");
        document.getElementById("title").textContent = "Registrasi Pengguna Baru";
      }, 1800);
    } else Swal.fire("Gagal", data.error || data.message, "error");
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}

// Registrasi → Login otomatis
async function registerUser() {
  const token = localStorage.getItem("token_unik");
  const nama = document.getElementById("nama").value.trim();
  const username = document.getElementById("usernameReg").value.trim();
  const password = document.getElementById("passwordReg").value.trim();

  if (!nama || !username || !password)
    return Swal.fire("Perhatian", "Lengkapi semua kolom.", "warning");

  Swal.fire({
    title: "Menyimpan Data...",
    text: "Sistem sedang memproses pendaftaran Anda.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "register",
        token_unik: token,
        nama_lengkap: nama,
        username,
        password,
      }),
    });
    const data = await res.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Registrasi Berhasil!",
        text: "Sedang mengarahkan ke dashboard...",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });
      setTimeout(() => loginUser(username, password), 1800);
    } else Swal.fire("Gagal", data.error || data.message, "error");
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}

// Login manual atau otomatis setelah register
async function loginUser(forceUsername, forcePassword) {
  const username = forceUsername || document.getElementById("usernameLogin").value.trim();
  const password = forcePassword || document.getElementById("passwordLogin").value.trim();

  if (!username || !password)
    return Swal.fire("Perhatian", "Masukkan username & password.", "warning");

  Swal.fire({
    title: "Memproses Login...",
    text: "Mohon tunggu, sistem sedang menyiapkan dashboard Anda.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", username, password }),
    });
    const data = await res.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Login Berhasil!",
        text: "Mengalihkan ke dashboard...",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });
      localStorage.setItem("token_sesi", data.token_sesi);
      localStorage.setItem("username", data.username);
      localStorage.setItem("nama", data.nama_lengkap);
      setTimeout(() => (window.location.href = "dashboard.html"), 1500);
    } else Swal.fire("Gagal", data.error || data.message, "error");
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}

// Pindah antar form manual
function showRegister() {
  showSection("registerSection");
  document.getElementById("title").textContent = "Registrasi Pengguna Baru";
}
function showLogin() {
  showSection("loginSection");
  document.getElementById("title").textContent = "Login Pengguna";
}
