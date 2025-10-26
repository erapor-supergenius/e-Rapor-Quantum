<script>
// e-Rapor Quantum — Auth System (premium)
// TIDAK PERLU WEBAPP_URL, kita gunakan google.script.run

/* ---------- UI helpers ---------- */
function _showSection(id) {
  const sections = ["tokenSection", "registerSection", "loginSection"];
  sections.forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    if (s === id) {
      el.style.display = "block";
      el.classList.add("fade");
      setTimeout(() => el.classList.add("show"), 30);
    } else {
      el.classList.remove("show");
      setTimeout(() => { el.style.display = "none"; }, 250);
    }
  });
  // update title
  const title = document.getElementById("title");
  if (id === "registerSection") title.innerText = "Registrasi Pengguna Baru";
  else if (id === "loginSection") title.innerText = "Login Pengguna";
  else title.innerText = "Masuk ke e-Rapor Quantum";
}

/* ---------- Penangan Error Umum ---------- */
/**
 * Fungsi ini akan dipanggil jika google.script.run gagal.
 * @param {Error} err - Objek error dari server.
 */
function onApiFailure(err) {
  Swal.fire("Error", err.message || String(err), "error");
}


/* ---------- TOKEN validation (token -> registration) ---------- */
function validateToken() {
  const token = (document.getElementById("token") || {}).value || "";
  if (!token.trim()) return Swal.fire("Perhatian","Masukkan token sekolah!","warning");

  Swal.fire({
    title: "Memeriksa Token...",
    text: "Mohon tunggu, sistem sedang memverifikasi token sekolah Anda.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  // MODIFIKASI: Menggunakan google.script.run
  google.script.run
    .withSuccessHandler(onValidateTokenSuccess)
    .withFailureHandler(onApiFailure)
    .validateToken(token.trim());
}

/**
 * Dipanggil setelah validateToken() di server berhasil.
 * @param {object} data - Respon dari server {success: boolean, needsRegister?: boolean, error?: string}
 */
function onValidateTokenSuccess(data) {
  if (data && data.success) {
    const token = (document.getElementById("token") || {}).value || "";
    // Simpan token di local storage APA PUN HASILNYA (login atau register)
    localStorage.setItem("token_unik", token.trim());
    
    if (data.needsRegister) {
      // Token valid & sekolah BELUM terdaftar -> Arahkan ke REGISTRASI
      Swal.fire({ 
        icon:"success", 
        title:"Token Diterima!", 
        text:"Mengalihkan ke registrasi pengguna baru...", 
        showConfirmButton:false, 
        timer:1400, 
        timerProgressBar:true 
      });
      setTimeout(() => _showSection("registerSection"), 1400);
    
    } else {
      // Token valid & sekolah SUDAH terdaftar -> Arahkan ke LOGIN
      Swal.fire({ 
        icon:"info", 
        title:"Token Dikenali", 
        text:"Sekolah ini sudah terdaftar. Silakan login.", 
        showConfirmButton:true 
      });
      _showSection("loginSection");
    }
  } else {
    // Token Gagal
    Swal.fire("Gagal", data.error || data.message || "Token tidak valid", "error");
  }
}


/* ---------- register -> auto login ---------- */
function registerUser() {
  const token = localStorage.getItem("token_unik") || "";
  const nama = (document.getElementById("nama") || {}).value || "";
  const username = (document.getElementById("usernameReg") || {}).value || "";
  const password = (document.getElementById("passwordReg") || {}).value || "";

  if (!token) return Swal.fire("Gagal","Token sekolah tidak ditemukan. Kembali ke awal.","error");
  if (!nama.trim() || !username.trim() || !password) return Swal.fire("Perhatian","Lengkapi semua kolom.", "warning");

  Swal.fire({ title:"Menyimpan Data...", text:"Mohon tunggu, sedang memproses pendaftaran.", allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

  const payload = {
    token_unik: token,
    nama_lengkap: nama.trim(),
    username: username.trim(),
    password: password
  };
  
  // MODIFIKASI: Menggunakan google.script.run
  google.script.run
    .withSuccessHandler(onRegisterSuccess)
    .withFailureHandler(onApiFailure)
    .register(payload);
}

/**
 * Dipanggil setelah register() di server berhasil.
 * @param {object} data - Respon dari server {success: boolean, error?: string}
 */
function onRegisterSuccess(data) {
  if (data && data.success) {
    const username = (document.getElementById("usernameReg") || {}).value || "";
    const password = (document.getElementById("passwordReg") || {}).value || "";
    
    Swal.fire({ icon:"success", title:"Registrasi Berhasil", text:"Masuk ke dashboard...", showConfirmButton:false, timer:1400, timerProgressBar:true });
    // Otomatis login setelah registrasi sukses
    setTimeout(() => loginUser(username.trim(), password), 1400);
  } else {
    Swal.fire("Gagal", data.error || data.message || "Gagal registrasi", "error");
  }
}


/* ---------- login ---------- */
function loginUser(forceUsername, forcePassword) {
  const username = forceUsername || (document.getElementById("usernameLogin") || {}).value || "";
  const password = forcePassword || (document.getElementById("passwordLogin") || {}).value || "";

  if (!username.trim() || !password) return Swal.fire("Perhatian","Masukkan username & password.","warning");

  Swal.fire({ title:"Memproses Login...", text:"Mohon tunggu, menyiapkan dashboard Anda.", allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

  const payload = {
    username: username.trim(),
    password: password
  };

  // MODIFIKASI: Menggunakan google.script.run
  google.script.run
    .withSuccessHandler(onLoginSuccess)
    .withFailureHandler(onApiFailure)
    .login(payload);
}

/**
 * Dipanggil setelah login() di server berhasil.
 * @param {object} data - Respon dari server {success: boolean, ...data}
 */
function onLoginSuccess(data) {
  if (data && data.success) {
    localStorage.setItem("token_sesi", data.token_sesi || "");
    localStorage.setItem("username", data.username || "");
    localStorage.setItem("nama", data.nama_lengkap || data.username || "");
    
    // Simpan info tambahan ini, akan sangat berguna
    localStorage.setItem("token_unik_sekolah", data.token_unik_sekolah || "");
    localStorage.setItem("spreadsheet_id_sekolah", data.spreadsheet_id_sekolah || "");

    const expireAt = Date.now() + (60 * 60 * 1000); // 1 jam
    localStorage.setItem("login_expire", String(expireAt));

    Swal.fire({ icon:"success", title:"Login Berhasil", text:"Mengalihkan ke dashboard...", showConfirmButton:false, timer:1200, timerProgressBar:true });
    setTimeout(()=> { window.location.href = "dashboard.html"; }, 1200);
  } else {
    Swal.fire("Gagal", data.error || data.message || "Login gagal", "error");
  }
}


/* ---------- small helpers for manual navigation ---------- */
function showRegister(){ _showSection("registerSection"); }
function showLogin(){ _showSection("loginSection"); }


/* ---------- LUPA PASSWORD (baru) ---------- */
function lupaPassword() {
  Swal.fire({
    title: "Lupa Password?",
    html: `
      <input id="lpUsername" class="swal2-input" placeholder="Username">
      <input id="lpToken" class="swal2-input" placeholder="Token Sekolah">
  t   <input id="lpNewPass" type="password" class="swal2-input" placeholder="Password Baru">
    `,
    confirmButtonText: "Ubah Password",
    showCancelButton: true,
    cancelButtonText: "Batal",
    preConfirm: () => ({
      username: (document.getElementById("lpUsername") || {}).value.trim(),
      token_unik: (document.getElementById("lpToken") || {}).value.trim(),
      password_baru: (document.getElementById("lpNewPass") || {}).value
    })
  }).then(res => {
    if (res.isConfirmed && res.value) {
      Swal.fire({
        title: "Mengubah password...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      
      // MODIFIKASI: Menggunakan google.script.run
      google.script.run
        .withSuccessHandler(onResetPasswordSuccess)
        .withFailureHandler(onApiFailure)
        .resetPasswordUser(res.value);
    }
  });
}

/**
 * Dipanggil setelah resetPasswordUser() di server berhasil.
 * @param {object} data - Respon dari server {success: boolean, message: string}
 */
function onResetPasswordSuccess(data) {
  Swal.close();
  Swal.fire({
    icon: data.success ? "success" : "error",
    title: data.success ? "Berhasil" : "Gagal",
    text: data.message
  });
}

</script>
