/* =======================================================================
 * e-Rapor Quantum — AUTH.JS (Frontend untuk GitHub Pages)
 * Versi Final — Fix CORS + koneksi WebApp GS
 * ======================================================================= */

/* === KONFIGURASI URL WEBAPP ===
 * Pastikan ini URL WebApp hasil Deploy dengan:
 *  - Execute as: Me (pemilik)
 *  - Who has access: Anyone, even anonymous
 * Ganti URL di bawah dengan milik kamu
 */
const GAS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbwZ7RLl5khz3h6O7zJvT8zTnVNz1U0kY_R2ya9ytC4PztEOdxgWURQW_9P49bSPjs98/exec";

/* === PROXY CORS STABIL === */
const PROXY_PREFIX = "https://api.allorigins.win/raw?url=";

/* === FUNGSI UTAMA UNTUK MEMANGGIL GOOGLE APPS SCRIPT === */
async function callGAS(action, payload) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // encode URL target (penting agar tidak gagal di proxy)
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
    } catch (err) {
      return { success: false, error: "Invalid JSON response", raw: text };
    }
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

/* === EVENT LISTENER UNTUK FORM TOKEN === */
document.addEventListener("DOMContentLoaded", () => {
  const tokenForm = document.getElementById("tokenForm");
  const tokenInput = document.getElementById("tokenInput");
  const notifBox = document.getElementById("notifBox");

  if (!tokenForm) return;

  tokenForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = tokenInput.value.trim();
    if (!token) return showNotif("Token tidak boleh kosong.", "error");

    showNotif("Memeriksa token sekolah...", "info");

    const res = await callGAS("validateToken", { token });
    if (!res.success) return showNotif(res.error || "Token tidak valid.", "error");

    if (res.needsRegister) {
      showNotif("Token valid ✅ — Silakan lanjut ke registrasi pengguna.", "success");
      // redirect ke halaman register.html (jika ada)
      setTimeout(() => (window.location.href = "register.html?token=" + token), 1200);
    } else {
      showNotif("Token valid ✅ — Sekolah sudah terdaftar, silakan login.", "success");
      setTimeout(() => (window.location.href = "login.html?token=" + token), 1200);
    }
  });

  function showNotif(msg, type = "info") {
    if (!notifBox) return alert(msg);
    notifBox.innerHTML = msg;
    notifBox.className = "";
    notifBox.classList.add("notif", type);
  }
});
