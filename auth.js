/* ======================================================================
 * e-Rapor Quantum — auth.js (client-side untuk GitHub Pages)
 * ====================================================================== */

/* GANTI URL di bawah dengan URL Web App kamu (Deploy as web app → Anyone even anonymous) */
const GAS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbz1W1BESRCIjZbzFtvDmVctegROoAb1B7X9VWL5wH8bxbChs0KBvT4elzoF5u2m3Wkk/exec";

/* ======================================================================
 * UI helpers
 * ====================================================================== */
function _showSection(id) {
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
  if (id === "registerSection") title.innerText = "Registrasi Pengguna Baru";
  else if (id === "loginSection") title.innerText = "Login Pengguna";
  else title.innerText = "Masuk ke e-Rapor Quantum";
}

/* ======================================================================
 * Helper umum
 * ====================================================================== */
function onApiFailure(err) {
  Swal.fire("Error", err.message || String(err), "error");
}

/* ======================================================================
 * Helper utama: panggil GAS via fetch() dengan dukungan CORS
 * ====================================================================== */
async function callGAS(action, payload) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // timeout 15 detik

    const res = await fetch(GAS_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
      mode: "cors",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok)
      return {
        success: false,
        error: `Server error (${res.status})`,
      };

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: "Invalid JSON response from server", raw: text };
    }
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

/* ======================================================================
 * Validasi Token Sekolah
 * ====================================================================== */
async function validateToken() {
  const token = (document.getElementById("token") || {}).value || "";
  if (!token.trim())
    return Swal.fire("Perhatian", "Masukkan token sekolah!", "warning");

  Swal.fire({
    title: "Memeriksa Token...",
    text: "Mohon tunggu, sistem sedang memverifikasi token sekolah Anda.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  const response = await callGAS("validateToken", { token: token.trim() });
  Swal.close();

  if (!response) return onApiFailure({ message: "No response" });

  if (response.success) {
    localStorage.setItem("token_unik", token.trim());
    if (response.needsRegister) {
      Swal.fire({
        icon: "success",
        title: "Token Diterima!",
        text: "Mengalihkan ke registrasi...",
        timer: 1100,
        showConfirmButton: false,
      });
      setTimeout(() => _showSection("registerSection"), 1100);
    } else {
      Swal.fire({
        icon: "info",
        title: "Token Dikenali",
        text: "Silakan login.",
        showConfirmButton: true,
      });
      _showSection("loginSection");
    }
  } else {
    Swal.fire("Gagal", response.error || response.message || "Token tidak valid", "error");
  }
}

/* ======================================================================
 * Registrasi Pengguna Baru
 * ====================================================================== */
async function registerUser() {
  const token = localStorage.getItem("token_unik") || "";
  const nama = (document.getElementById("nama") || {}).value || "";
  const username = (document.getElementById("usernameReg") || {}).value || "";
  const password = (document.getElementById("passwordReg") || {}).value || "";

  if (!token)
    return Swal.fire("Gagal", "Token sekolah tidak ditemukan. Kembali ke awal.", "error");
  if (!nama.trim() || !username.trim() || !password)
    return Swal.fire("Perhatian", "Lengkapi semua kolom.", "warning");

  Swal.fire({
    title: "Menyimpan Data...",
    text: "Mohon tunggu, sedang memproses pendaftaran.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  const payload = {
    token_unik: token,
    nama_lengkap: nama.trim(),
    username: username.trim(),
    password: password,
  };

  const response = await callGAS("register", payload);
  Swal.close();

  if (response && response.success) {
    Swal.fire({
      icon: "success",
      title: "Registrasi Berhasil",
      text: "Masuk ke dashboard...",
      showConfirmButton: false,
      timer: 1200,
    });
    setTimeout(() => loginUser(username.trim(), password), 1200);
  } else {
    Swal.fire("Gagal", response.error || response.message || "Gagal registrasi", "error");
  }
}

/* ======================================================================
 * Login Pengguna
 * ====================================================================== */
async function loginUser(forceUsername, forcePassword) {
  const username =
    forceUsername || (document.getElementById("usernameLogin") || {}).value || "";
  const password =
    forcePassword || (document.getElementById("passwordLogin") || {}).value || "";

  if (!username.trim() || !password)
    return Swal.fire("Perhatian", "Masukkan username & password.", "warning");

  Swal.fire({
    title: "Memproses Login...",
    text: "Mohon tunggu, menyiapkan dashboard Anda.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  const payload = { username: username.trim(), password: password };
  const response = await callGAS("login", payload);
  Swal.close();

  if (response && response.success) {
    localStorage.setItem("token_sesi", response.token_sesi || "");
    localStorage.setItem("username", response.username || "");
    localStorage.setItem("nama", response.nama_lengkap || response.username || "");
    localStorage.setItem("token_unik_sekolah", response.token_unik_sekolah || "");
    localStorage.setItem("spreadsheet_id_sekolah", response.spreadsheet_id_sekolah || "");

    const expireAt = Date.now() + 60 * 60 * 1000; // 1 jam
    localStorage.setItem("login_expire", String(expireAt));

    Swal.fire({
      icon: "success",
      title: "Login Berhasil",
      text: "Mengalihkan ke dashboard...",
      showConfirmButton: false,
      timer: 1200,
    });
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1200);
  } else {
    Swal.fire("Gagal", response.error || response.message || "Login gagal", "error");
  }
}

/* ======================================================================
 * Navigasi kecil
 * ====================================================================== */
function showRegister() { _showSection("registerSection"); }
function showLogin() { _showSection("loginSection"); }

/* ======================================================================
 * Lupa Password
 * ====================================================================== */
function lupaPassword() {
  Swal.fire({
    title: "Lupa Password?",
    html: `
      <input id="lpUsername" class="swal2-input" placeholder="Username">
      <input id="lpToken" class="swal2-input" placeholder="Token Sekolah">
      <input id="lpNewPass" type="password" class="swal2-input" placeholder="Password Baru">
    `,
    confirmButtonText: "Ubah Password",
    showCancelButton: true,
    cancelButtonText: "Batal",
    preConfirm: () => ({
      username: (document.getElementById("lpUsername") || {}).value.trim(),
      token_unik: (document.getElementById("lpToken") || {}).value.trim(),
      password_baru: (document.getElementById("lpNewPass") || {}).value,
    }),
  }).then(async (res) => {
    if (res.isConfirmed && res.value) {
      Swal.fire({
        title: "Mengubah password...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      const response = await callGAS("resetPasswordUser", res.value);
      Swal.close();
      Swal.fire({
        icon: response && response.success ? "success" : "error",
        title: response && response.success ? "Berhasil" : "Gagal",
        text:
          (response && (response.message || response.error)) ||
          "Terjadi kesalahan",
      });
    }
  });
}
