/* =======================================================================
 * e-Rapor Quantum — AUTH.JS (Frontend untuk GitHub Pages)
 * Versi Klik Tombol + Notifikasi SweetAlert2 + Fix CORS Final
 * ======================================================================= */

/* === KONFIGURASI URL WEBAPP === */
const GAS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbyIMIUeOxefGQro-2cpf7c3r6rZpZ6eGLmBjg-OIFvrvTUuUNzv1_kMngxGbCWh8hvUUw/exec";

/* === PROXY CORS STABIL === */
const PROXY_PREFIX = "https://api.allorigins.win/raw?url=";

/* === FUNGSI PEMANGGIL APPS SCRIPT === */
async function callGAS(action, payload) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const proxiedUrl = PROXY_PREFIX + encodeURIComponent(GAS_WEBAPP_URL);
    const response = await fetch(proxiedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok)
      return { success: false, error: `Server error (${response.status})` };

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: "Invalid JSON response", raw: text };
    }
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

/* === FUNGSI KLIK TOMBOL VALIDASI TOKEN === */
async function validateToken() {
  const input = document.getElementById("tokenInput") || document.getElementById("token");
  const token = input?.value.trim();
  if (!token) {
    Swal.fire({
      icon: "error",
      title: "Token belum diisi",
      text: "Silakan masukkan token sekolah Anda terlebih dahulu.",
      confirmButtonColor: "#1d4ed8",
    });
    return;
  }

  // Tampilkan loading elegan
  Swal.fire({
    title: "Memeriksa Token...",
    text: "Mohon tunggu sebentar",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  const res = await callGAS("validateToken", { token });

  // Tutup loading
  Swal.close();

  if (!res.success) {
    Swal.fire({
      icon: "error",
      title: "Token Tidak Valid",
      text: res.error || "Token sekolah tidak ditemukan.",
      confirmButtonColor: "#1d4ed8",
    });
    return;
  }

  if (res.needsRegister) {
    Swal.fire({
      icon: "success",
      title: "Token Valid ✅",
      text: "Silakan lanjut ke halaman registrasi pengguna.",
      confirmButtonText: "Lanjut",
      confirmButtonColor: "#16a34a",
    }).then(() => {
      window.location.href = "register.html?token=" + token;
    });
  } else {
    Swal.fire({
      icon: "success",
      title: "Token Valid ✅",
      text: "Sekolah sudah terdaftar. Silakan login.",
      confirmButtonText: "Masuk",
      confirmButtonColor: "#1d4ed8",
    }).then(() => {
      window.location.href = "login.html?token=" + token;
    });
  }
}
