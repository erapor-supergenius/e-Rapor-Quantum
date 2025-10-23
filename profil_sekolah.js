/****************************************************
 * profil_sekolah.js — eRapor Quantum Super Genius
 * Layout dua kolom, terhubung ke Google Apps Script
 ****************************************************/
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";
const $ = id => document.getElementById(id);

window.addEventListener("load", async ()=>{
  const token = localStorage.getItem("token_unik") || localStorage.getItem("token_sesi");
  if (!token) {
    Swal.fire("Sesi Habis","Silakan login ulang.","info");
    setTimeout(()=>location.href="index.html",1000);
    return;
  }
  await loadProfilSekolah(token);
});

async function loadProfilSekolah(token){
  try{
    const res = await fetch(WEBAPP_URL,{method:'POST',body:JSON.stringify({action:'getProfilSekolah',token_sekolah:token})});
    const data = await res.json();
    if(data && data.success){
      const p = data.profil || {};
      $("nama_sekolah").value = p.nama_sekolah || "";
      $("npsn").value = p.npsn || "";
      $("alamat_sekolah").value = p.alamat_sekolah || "";
      $("kepala_sekolah").value = p.kepala_sekolah || "";
      $("email_sekolah").value = p.email_sekolah || "";
      $("logo_url").value = p.logo_url || "";
      $("schoolNameTop").innerText = p.nama_sekolah || "Sekolah Anda";
    } else {
      Swal.fire("Info","Profil sekolah belum diisi.","info");
    }
  }catch(err){
    console.error(err);
    Swal.fire("Gagal","Tidak dapat memuat data.","error");
  }
}

$("formProfilSekolah").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const token = localStorage.getItem("token_unik") || localStorage.getItem("token_sesi");
  const body = {
    action: "saveProfilSekolah",
    token_sekolah: token,
    nama_sekolah: $("nama_sekolah").value.trim(),
    npsn: $("npsn").value.trim(),
    alamat_sekolah: $("alamat_sekolah").value.trim(),
    kepala_sekolah: $("kepala_sekolah").value.trim(),
    email_sekolah: $("email_sekolah").value.trim(),
    logo_url: $("logo_url").value.trim()
  };
  try{
    const res = await fetch(WEBAPP_URL,{method:'POST',body:JSON.stringify(body)});
    const data = await res.json();
    if(data && data.success){
      Swal.fire("Berhasil","Data profil sekolah berhasil disimpan.","success");
      $("schoolNameTop").innerText = $("nama_sekolah").value;
    } else {
      Swal.fire("Gagal", data.message || "Tidak dapat menyimpan data.","error");
    }
  }catch(err){
    console.error(err);
    Swal.fire("Error","Terjadi kesalahan koneksi.","error");
  }
});

function navigateTo(page){ window.location.href = page; }
