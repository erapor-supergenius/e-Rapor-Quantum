// ===============================
// e-Rapor Quantum — Auth System
// ===============================
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec"; // Ganti dengan URL Web App dari Google Apps Script

function showRegister() {
  document.getElementById("registerSection").classList.remove("hidden");
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("tokenSection").classList.add("hidden");
  document.getElementById("title").textContent = "Registrasi Pengguna Baru";
}

function showLogin() {
  document.getElementById("registerSection").classList.add("hidden");
  document.getElementById("loginSection").classList.remove("hidden");
  document.getElementById("title").textContent = "Login Pengguna";
}

async function validateToken() {
  const token = document.getElementById("token").value.trim();
  if (!token) return Swal.fire("Perhatian", "Masukkan token sekolah!", "warning");

  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "validateToken", token_unik: token }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token_unik", token);
      Swal.fire("Berhasil!", "Token valid, silakan registrasi akun.", "success");
      showRegister();
    } else Swal.fire("Gagal", data.error || data.message, "error");
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}

async function registerUser() {
  const token = localStorage.getItem("token_unik");
  const nama = document.getElementById("nama").value.trim();
  const username = document.getElementById("usernameReg").value.trim();
  const password = document.getElementById("passwordReg").value.trim();

  if (!nama || !username || !password)
    return Swal.fire("Perhatian", "Lengkapi semua kolom.", "warning");

  const res = await fetch(WEBAPP_URL, {
    method: "POST",
    body: JSON.stringify({ action: "register", token_unik: token, nama_lengkap: nama, username, password }),
  });
  const data = await res.json();

  if (data.success) {
    Swal.fire("Berhasil!", "Registrasi berhasil, masuk ke dashboard...", "success");
    setTimeout(() => loginUser(username, password), 1500);
  } else Swal.fire("Gagal", data.error || data.message, "error");
}

async function loginUser(forceUsername, forcePassword) {
  const username = forceUsername || document.getElementById("usernameLogin").value.trim();
  const password = forcePassword || document.getElementById("passwordLogin").value.trim();

  if (!username || !password)
    return Swal.fire("Perhatian", "Masukkan username & password.", "warning");

  const res = await fetch(WEBAPP_URL, {
    method: "POST",
    body: JSON.stringify({ action: "login", username, password }),
  });
  const data = await res.json();

  if (data.success) {
    localStorage.setItem("token_sesi", data.token_sesi);
    localStorage.setItem("username", data.username);
    localStorage.setItem("nama", data.nama_lengkap);
    window.location.href = "dashboard.html";
  } else Swal.fire("Gagal", data.error || data.message, "error");
}
