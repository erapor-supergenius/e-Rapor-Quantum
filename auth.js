/* =======================================================================
 * e-Rapor Quantum — AUTH.JS (Frontend untuk GitHub Pages)
 * Versi Klik Tombol + Loading Aktif (Final Fix)
 * ======================================================================= */

/* === KONFIGURASI URL WEBAPP === */
const GAS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbyIMIUeOxefGQro-2cpf7c3r6rZpZ6eGLmBjg-OIFvrvTUuUNzv1_kMngxGbCWh8hvUUw/exec";

/* === PROXY CORS STABIL === */
const PROXY_PREFIX = "https://api.allorigins.win/raw?url=";

/* === Utility umum untuk notifikasi === */
function showNotif(msg, type = "info") {
  const box = document.getElementById("notifBox");
  if (!box) return alert(msg);
  box.innerHTML = msg;
  box.className = ""; // reset class
  box.classList.add("notif", type);
}

/* === Utility Loading Spinner === */
function showLoading(text = "Memproses...") {
  const box = document.getElementById("notifBox");
  if (!box) return;
  box.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <span>${text}</span>
    </div>
  `;
  box.className = "notif loading";
}

/* === Fungsi utama pemanggilan Apps Script === */
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

/* === Fungsi Klik Tombol: validateToken === */
async function validateToken() {
  const input = document.getElementById("tokenInput");
  const token = input?.value.trim();
  if (!token) return showNotif("Token sekolah tidak boleh kosong.", "error");

  showLoading("Memeriksa token sekolah...");

  const res = await callGAS("validateToken", { token });
  if (!res.success) {
    return showNotif(res.error || "Token tidak valid.", "error");
  }

  if (res.needsRegister) {
    showNotif("✅ Token valid — lanjut ke registrasi pengguna...", "success");
    setTimeout(() => (window.location.href = "register.html?token=" + token), 1200);
  } else {
    showNotif("✅ Token valid — sekolah sudah terdaftar, lanjut login...", "success");
    setTimeout(() => (window.location.href = "login.html?token=" + token), 1200);
  }
}

/* === Styling Spinner (otomatis dimasukkan jika belum ada) === */
(function injectSpinnerStyle() {
  if (document.getElementById("spinner-style")) return;
  const style = document.createElement("style");
  style.id = "spinner-style";
  style.textContent = `
    .notif {
      margin-top: 15px;
      padding: 10px 14px;
      border-radius: 8px;
      font-family: 'Poppins', sans-serif;
      transition: all .3s;
    }
    .notif.info { background: #e3f2fd; color: #0d47a1; border-left: 4px solid #2196f3; }
    .notif.error { background: #fdecea; color: #b71c1c; border-left: 4px solid #f44336; }
    .notif.success { background: #e8f5e9; color: #1b5e20; border-left: 4px solid #4caf50; }
    .notif.loading { background: #fff3e0; color: #e65100; border-left: 4px solid #ff9800; }

    .loading {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 3px solid #ffb74d;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
})();
