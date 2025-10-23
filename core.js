/****************************************************
 * core.js — Sistem Inti e-Rapor Quantum Premium
 * Digunakan di semua halaman (kecuali login.html)
 * Developed by: Dedi Agus Mustofa
 ****************************************************/

// ===== KONFIGURASI DASAR =====
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec"; // sesuaikan jika berbeda

// ===== HELPER DOM & FORMAT =====
const $ = id => document.getElementById(id);

function escapeHtml(str){
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[m]);
}

function formatTanggal(dateStr){
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" });
  } catch { return dateStr; }
}

// ===== SWEETALERT2 TOAST & ALERT =====
function showAlert(title, text="", icon="info", timer=1600){
  Swal.fire({
    icon, title, text, timer,
    showConfirmButton:false,
    timerProgressBar:true,
    toast:true,
    position:'top-end'
  });
}

function showSuccess(msg){ showAlert(msg,"","success"); }
function showError(msg){ showAlert(msg,"","error",2200); }
function showInfo(msg){ showAlert(msg,"","info"); }
function showWarning(msg){ showAlert(msg,"","warning"); }

// ===== FETCH GOOGLE APPS SCRIPT =====
async function gsPost(payload){
  try {
    const res = await fetch(WEBAPP_URL, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    return json;
  } catch(err){
    console.error("gsPost error:", err);
    showError("Koneksi gagal ke server");
    throw err;
  }
}

// ===== SISTEM LOGIN & SESI =====
function ensureLogin(){
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token_sesi");
  const expire = Number(localStorage.getItem("login_expire") || 0);

  if (!username || !token) {
    Swal.fire("Sesi Habis","Silakan login kembali.","info");
    localStorage.clear();
    setTimeout(()=> location.href = "index.html", 1200);
    throw new Error("Sesi tidak valid");
  }
  if (expire && Date.now() > expire){
    Swal.fire("Sesi Kadaluarsa","Silakan login kembali.","info");
    localStorage.clear();
    setTimeout(()=> location.href = "index.html", 1200);
    throw new Error("Sesi kadaluarsa");
  }
}

// ===== NAVIGASI ANTAR HALAMAN =====
function navigateTo(page){
  try { ensureLogin(); } catch { return; }
  window.location.href = page;
}

// ===== LOGOUT =====
async function logout(){
  const token = localStorage.getItem("token_sesi") || "";
  try {
    await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:"logout", token_sesi: token }) });
  } catch(e){}
  Swal.fire({ icon:'success', title:'Logout', text:'Anda telah keluar.', timer:900, showConfirmButton:false });
  localStorage.clear();
  setTimeout(()=> location.href = "index.html", 900);
}

// ===== INIT OTOMATIS (HEADER USER) =====
window.addEventListener("DOMContentLoaded", ()=>{
  const nama = localStorage.getItem("nama") || localStorage.getItem("username") || "User";
  const username = localStorage.getItem("username") || "";
  if ($("namaUser")) $("namaUser").textContent = nama;
  if ($("usernameUser")) $("usernameUser").textContent = username;
});

// ===== HELPER UI TAMBAHAN =====
function loading(show=true){
  if (show){
    if (!document.getElementById("loadingOverlay")){
      const overlay = document.createElement("div");
      overlay.id = "loadingOverlay";
      overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
        z-index:9999;backdrop-filter:blur(2px);
      `;
      overlay.innerHTML = `<div style="padding:18px 28px;background:#fff;border-radius:12px;font-weight:600;color:#0b4ea2;box-shadow:0 6px 24px rgba(2,6,23,0.2)">⏳ Memuat...</div>`;
      document.body.appendChild(overlay);
    }
  } else {
    const o = document.getElementById("loadingOverlay");
    if (o) o.remove();
  }
}
