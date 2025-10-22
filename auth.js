// e-Rapor Quantum — Auth System (premium)
// WebApp URL (pakai URL deploy kamu)
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

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

/* ---------- TOKEN validation (token -> registration) ---------- */
async function validateToken() {
  const token = (document.getElementById("token") || {}).value || "";
  if (!token.trim()) return Swal.fire("Perhatian","Masukkan token sekolah!","warning");

  try {
    Swal.fire({
      title: "Memeriksa Token...",
      text: "Mohon tunggu, sistem sedang memverifikasi token sekolah Anda.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const resp = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "validateToken", token_unik: token.trim() })
    });
    const data = await resp.json();

    if (data && data.success) {
      // simpan token sekolah untuk penggunaan di dashboard
      localStorage.setItem("token_unik", token.trim());
      // notifikasi sukses dan pindah ke form registrasi (delay agar terlihat premium)
      Swal.fire({ icon:"success", title:"Token Diterima!", text:"Mengalihkan ke registrasi...", showConfirmButton:false, timer:1400, timerProgressBar:true });
      setTimeout(() => _showSection("registerSection"), 1400);
    } else {
      Swal.fire("Gagal", data.error || data.message || "Token tidak valid", "error");
    }
  } catch (err) {
    Swal.fire("Error", err.message || String(err), "error");
  }
}

/* ---------- register -> auto login ---------- */
async function registerUser() {
  const token = localStorage.getItem("token_unik") || "";
  const nama = (document.getElementById("nama") || {}).value || "";
  const username = (document.getElementById("usernameReg") || {}).value || "";
  const password = (document.getElementById("passwordReg") || {}).value || "";

  if (!token) return Swal.fire("Gagal","Token sekolah tidak ditemukan. Kembali ke awal.","error");
  if (!nama.trim() || !username.trim() || !password) return Swal.fire("Perhatian","Lengkapi semua kolom.", "warning");

  try {
    Swal.fire({ title:"Menyimpan Data...", text:"Mohon tunggu, sedang memproses pendaftaran.", allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

    const resp = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "register",
        token_unik: token,
        nama_lengkap: nama.trim(),
        username: username.trim(),
        password: password
      })
    });
    const data = await resp.json();

    if (data && data.success) {
      // success -> autoplogin
      Swal.fire({ icon:"success", title:"Registrasi Berhasil", text:"Masuk ke dashboard...", showConfirmButton:false, timer:1400, timerProgressBar:true });

      // call login after short delay to ensure storage timing
      setTimeout(() => loginUser(username.trim(), password), 1400);
    } else {
      Swal.fire("Gagal", data.error || data.message || "Gagal registrasi", "error");
    }
  } catch (err) {
    Swal.fire("Error", err.message || String(err), "error");
  }
}

/* ---------- login ---------- */
async function loginUser(forceUsername, forcePassword) {
  const username = forceUsername || (document.getElementById("usernameLogin") || {}).value || "";
  const password = forcePassword || (document.getElementById("passwordLogin") || {}).value || "";

  if (!username.trim() || !password) return Swal.fire("Perhatian","Masukkan username & password.","warning");

  try {
    Swal.fire({ title:"Memproses Login...", text:"Mohon tunggu, menyiapkan dashboard Anda.", allowOutsideClick:false, didOpen:()=>Swal.showLoading() });

    const resp = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "login", username: username.trim(), password: password })
    });
    const data = await resp.json();

    if (data && data.success) {
      // simpan sesi di localStorage
      localStorage.setItem("token_sesi", data.token_sesi || "");
      localStorage.setItem("username", data.username || username.trim());
      localStorage.setItem("nama", data.nama_lengkap || data.username || username.trim());

      // simpan token sekolah expiry (opsional) dan waktu login expire (1 jam)
      const expireAt = Date.now() + (60 * 60 * 1000); // 1 jam
      localStorage.setItem("login_expire", String(expireAt));

      Swal.fire({ icon:"success", title:"Login Berhasil", text:"Mengalihkan ke dashboard...", showConfirmButton:false, timer:1200, timerProgressBar:true });

      // berikan sedikit delay agar localStorage benar-benar ready
      setTimeout(()=> { window.location.href = "dashboard.html"; }, 1200);
    } else {
      Swal.fire("Gagal", data.error || data.message || "Login gagal", "error");
    }
  } catch (err) {
    Swal.fire("Error", err.message || String(err), "error");
  }
}

/* ---------- small helpers for manual navigation ---------- */
function showRegister(){ _showSection("registerSection"); }
function showLogin(){ _showSection("loginSection"); }
