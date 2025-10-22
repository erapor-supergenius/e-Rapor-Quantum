// dashboard.js — logic untuk dashboard (responsive + session check)
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

const sidebar = document.getElementById("sidebar");
const mainWrap = document.getElementById("mainWrap");
const menuBtn = document.getElementById("menuBtn");
const logoutBtn = document.getElementById("logoutBtn");

menuBtn?.addEventListener("click", () => {
  // toggle sidebar on small screens
  if (sidebar.classList.contains("show")) {
    sidebar.classList.remove("show");
  } else {
    sidebar.classList.add("show");
  }
});

logoutBtn?.addEventListener("click", async () => {
  const token = localStorage.getItem("token_sesi");
  try {
    await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "logout", token_sesi: token })
    });
  } catch(e) { /* ignore network errors for logout */ }

  Swal.fire({ icon:"success", title:"Logout", text:"Anda telah keluar dari sistem.", timer:900, showConfirmButton:false });
  localStorage.clear();
  setTimeout(()=> location.href = "index.html", 900);
});

function goto(page){ Swal.fire("Fitur","Menu "+page+" akan tersedia pada modul berikutnya.","info"); }

/* ---------- on load: validate session & fetch profil sekolah ---------- */
window.addEventListener("load", async () => {
  // small delay to ensure localStorage has been set by auth flow
  await new Promise(r => setTimeout(r, 300));

  const username = localStorage.getItem("username");
  const nama = localStorage.getItem("nama");
  const tokenSesi = localStorage.getItem("token_sesi");
  const tokenUnik = localStorage.getItem("token_unik");
  const expire = Number(localStorage.getItem("login_expire") || 0);

  // if no username or token -> redirect to login
  if (!username || !tokenSesi) {
    localStorage.clear();
    return location.href = "index.html";
  }

  // check expiry
  if (expire && Date.now() > expire) {
    Swal.fire("Sesi Habis", "Sesi Anda telah kadaluarsa. Silakan login kembali.", "info");
    localStorage.clear();
    setTimeout(()=> location.href = "index.html", 1300);
    return;
  }

  // show user info
  document.getElementById("namaUser").innerText = nama || username;
  document.getElementById("usernameUser").innerText = username;

  // try fetch profil sekolah (use token_unik if available)
  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getProfilSekolah", token_sekolah: tokenUnik || tokenSesi })
    });
    const data = await res.json();
    if (data && data.success) {
      document.getElementById("schoolName").innerText = data.profil?.nama_sekolah || data.nama_sekolah || "Sekolah Anda";
      // logo: if backend returns logo_url, use it; else keep local asset
      if (data.profil && data.profil.logo_url) {
        const img = document.getElementById("logoSekolah");
        img.src = data.profil.logo_url;
      }
      const info = document.getElementById("infoSchool");
      info.innerHTML = `<strong>${document.getElementById("schoolName").innerText}</strong><br/>NPSN: ${data.profil?.npsn || '-'}<br/>Alamat: ${data.profil?.alamat_sekolah || '-'}`;
    } else {
      document.getElementById("infoSchool").innerText = "Profil sekolah tidak tersedia.";
    }
  } catch (err) {
    document.getElementById("infoSchool").innerText = "Gagal memuat profil sekolah.";
    console.error(err);
  }

  // responsive: if viewport small, collapse sidebar initially
  if (window.innerWidth <= 900) {
    sidebar.classList.remove("show");
    mainWrap.classList.add("full");
  } else {
    sidebar.classList.remove("collapsed");
    mainWrap.classList.remove("full");
  }
});
