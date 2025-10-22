// core.js — utilities & backend connector for e-Rapor Quantum
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

// store/get helpers
const token_sesi = localStorage.getItem('token_sesi') || "";
const token_sekolah = localStorage.getItem('token_sekolah') || "";

/**
 * postData(action, payload)
 * - sends JSON POST to Apps Script doPost
 * - returns parsed JSON
 */
async function postData(action, payload = {}) {
  try {
    const body = { action, ...payload };
    const res = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    return json;
  } catch (e) {
    console.error('postData error', e);
    showToast('Koneksi ke server gagal', 'error');
    return { success: false, error: e.message || e };
  }
}

/* Simple toast (uses .toast element in index.html) */
let toastTimer = null;
function showToast(text, type='info', timeout=3200) {
  const t = document.getElementById('toast');
  if (!t) return alert(text);
  t.textContent = text;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), timeout);
}

/* Loading overlay helpers (simple) */
function showLoading() {
  if (document.getElementById('__loading__')) return;
  const div = document.createElement('div');
  div.id = '__loading__';
  div.style = 'position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9998';
  div.innerHTML = '<div style="padding:18px;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.03);box-shadow:0 8px 30px rgba(0,0,0,0.6)"><div style="width:44px;height:44px;border-radius:50%;border:4px solid rgba(255,255,255,0.08);border-top-color:var(--gold);animation:spin 1s linear infinite"></div></div>';
  document.body.appendChild(div);
}
function hideLoading() { const d = document.getElementById('__loading__'); if (d) d.remove(); }

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection', e);
  showToast('Terjadi kesalahan (promise rejected)', 'error');
});

/* small helper to format percent */
function pct(n) { return (Math.round((n||0)*100))/100; }

/* export for other scripts */
window.EQ = {
  postData,
  showToast,
  showLoading,
  hideLoading,
  token_sesi,
  token_sekolah,
  pct
};

/* simple spinner keyframes */
(function addSpinStyle(){
  const s = document.createElement('style');
  s.innerHTML = '@keyframes spin { to { transform: rotate(360deg) } }';
  document.head.appendChild(s);
})();
