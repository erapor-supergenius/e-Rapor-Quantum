// =======================================================================
// e-Rapor Quantum — AUTH SYSTEM (Final Terhubung Tanpa Proxy)
// Sinkron dengan index.html & Notifikasi SweetAlert2 elegan
// =======================================================================

// Ganti dengan URL WebApp kamu (Deploy as: Me, access: Anyone)
const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbyIMIUeOxefGQro-2cpf7c3r6rZpZ6eGLmBjg-OIFvrvTUuUNzv1_kMngxGbCWh8hvUUw/exec";

/* ---------- UI helpers ---------- */
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

/* ---------- VALIDASI TOKEN ---------- */
async function validateToken() {
  const el = document.getElementById("tokenInput") || document.getElementById("token");
  if (!el) {
    Swal.fire("Error", "Kolom token tidak ditemukan di halaman.", "error");
    return;
  }

  const token = el.value.trim();
  if (!token) {
    Swal.fire("Perhatian", "Masukkan token sekolah!", "warning");
    return;
  }

  try {
    Swal.fire({
      title: "Memeriksa Token...",
      text: "Mohon tunggu, sistem sedang memverifikasi token sekolah Anda.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

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
      localStorage.setItem("login_expire", String(Date.now() + 3600000)); // 1 jam

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
function showRegister() {
  _showSection("registerSection");
}
function showLogin() {
  _showSection("loginSection");
}

/* ---------- Lupa Password ---------- */
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
      username: document.getElementById("lpUsername").value.trim(),
      token_unik: document.getElementById("lpToken").value.trim(),
      password_baru: document.getElementById("lpNewPass").value.trim(),
    }),
  }).then((res) => {
    if (res.isConfirmed) {
      Swal.fire({
        title: "Mengubah password...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      fetch(WEBAPP_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "resetPasswordUser",
          ...res.value,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          Swal.close();
          Swal.fire({
            icon: data.success ? "success" : "error",
            title: data.success ? "Berhasil" : "Gagal",
            text: data.message,
          });
        })
        .catch(() => {
          Swal.close();
          Swal.fire("Error", "Gagal terhubung ke server.", "error");
        });
    }
  });
}
