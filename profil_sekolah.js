/****************************************************
 * profil_sekolah.js — Logic untuk profil_sekolah.html
 * Pastikan file ini berada di root (sama level dashboard.js)
 ****************************************************/

// gunakan WEBAPP_URL yang sama dengan dashboard.js (ganti jika perlu)
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

/* helper */
const $ = id => document.getElementById(id);
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, (m)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* FIELDS sesuai sheet profil_sekolah yang kamu kirim */
const FIELDS = ['nama_sekolah','nss','npsn','status_sekolah','alamat_sekolah','kelurahan_desa','kecamatan','kabupaten_kota','provinsi','website','email','telepon','kepala_sekolah','nip_kepsek','url_logo','kabupaten_kota_rapor','tanggal_rapor'];

/* NAV (shared helper dari dashboard) */
function navigateTo(page){
  // tetap pakai check sesi yg sederhana
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token_sesi");
  if (!username || !token) {
    Swal.fire("Sesi Habis","Silakan login kembali.","info");
    localStorage.clear();
    setTimeout(()=> location.href = "index.html", 900);
    return;
  }
  window.location.href = page;
}

/* TOAST menggunakan SweetAlert2 (consistency with dashboard) */
function toastSuccess(title, text=''){
  Swal.fire({ icon:'success', title: title, text: text, timer:1200, showConfirmButton:false, toast:true, position:'top-end' });
}
function toastError(title, text=''){
  Swal.fire({ icon:'error', title: title, text: text, timer:2000, showConfirmButton:false, toast:true, position:'top-end' });
}

/* FORM <-> OBJECT */
function getFormData(){
  const o = {};
  FIELDS.forEach(f => { const el = $(f); if(el) o[f] = el.value.trim(); });
  return o;
}
function setFormData(obj){
  FIELDS.forEach(f => { const el = $(f); if(el) el.value = obj[f] || ''; });
  refreshPreview();
}

/* PREVIEW */
function refreshPreview(){
  const nama = $('nama_sekolah').value || 'Nama Sekolah';
  const alamat = $('alamat_sekolah').value || '';
  const email = $('email').value || '';
  const telepon = $('telepon').value || '';
  $('previewNama').textContent = nama;
  $('previewAlamat').textContent = alamat;
  $('previewKontak').textContent = [email, telepon].filter(Boolean).join(' • ');
  const url = $('url_logo').value || '';
  const logoPreview = $('logoPreview');
  if (url){
    // safe set
    logoPreview.innerHTML = '<img src="'+escapeHtml(url)+'" alt="Logo" style="max-width:100%;max-height:120px;object-fit:contain;border-radius:8px">';
  } else {
    logoPreview.innerHTML = '<div style="text-align:center;color:#64748b"><div style="font-weight:700;font-size:20px">EQ</div><div style="font-size:13px">Logo Sekolah</div></div>';
  }
}

/* Hook preview inputs */
['url_logo','nama_sekolah','alamat_sekolah','email','telepon'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', refreshPreview);
});

/* GS Post helper */
async function gsPost(body){
  try {
    const res = await fetch(WEBAPP_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) {
    console.error('gsPost error', e);
    throw e;
  }
}

/* Load profil (action: getProfilSekolah) */
async function loadProfilSekolah(token){
  try {
    const payload = { action:'getProfilSekolah', token_sekolah: token || localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || '' };
    const r = await gsPost(payload);
    if (r && r.success && r.profil){
      setFormData(r.profil);
      // update topbar/sidebar name & logo
      if (r.profil.nama_sekolah) $('schoolNameTop').innerText = r.profil.nama_sekolah;
      if (r.profil.url_logo || r.profil.logo_url) {
        const src = r.profil.url_logo || r.profil.logo_url;
        const ln = $('logoSekolah'); if (ln) ln.src = src;
      }
      toastSuccess('Profil dimuat');
    } else {
      // clear form
      setFormData({});
      if (r && r.message) toastError('Perhatian', r.message);
      else toastError('Profil tidak ditemukan');
    }
  } catch (e){
    console.error('loadProfilSekolah', e);
    toastError('Gagal memuat profil', e.message || '');
  }
}

/* Save profil (action: saveProfilSekolah) */
async function saveProfilSekolah(){
  try {
    const data = getFormData();
    if (!data.nama_sekolah || data.nama_sekolah.length < 2) { toastError('Isi Nama Sekolah'); return; }
    // include token_sekolah if stored
    const token = localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || '';
    const payload = { action:'saveProfilSekolah', token_sekolah: token, data: data };
    const r = await gsPost(payload);
    if (r && r.success) {
      toastSuccess('Profil tersimpan');
      // update sidebar name/logo
      if (data.nama_sekolah) $('schoolNameTop').innerText = data.nama_sekolah;
      if (data.url_logo) { const ln = $('logoSekolah'); if (ln) ln.src = data.url_logo; }
    } else {
      toastError('Gagal simpan', (r && (r.error||r.message)) || '');
    }
  } catch (e){
    console.error('saveProfilSekolah', e);
    toastError('Gagal menyimpan', e.message || '');
  }
}

/* initEnsure (pastikan headers di sheet) */
async function initEnsureHeaders(){
  try {
    const token = localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || '';
    if (!token) { toastError('Token sekolah dibutuhkan untuk inisialisasi.'); return; }
    const r = await gsPost({ action:'initEnsure', token_sekolah: token });
    if (r && r.success) toastSuccess('Headers dipastikan di spreadsheet');
    else toastError('Gagal memastikan headers', (r && (r.error||r.message)) || '');
  } catch (e){ console.error('initEnsureHeaders', e); toastError('Inisialisasi error', e.message || ''); }
}

/* Events pada tombol */
document.getElementById('btn-save')?.addEventListener('click', saveProfilSekolah);
document.getElementById('btn-save-2')?.addEventListener('click', saveProfilSekolah);
document.getElementById('btn-refresh')?.addEventListener('click', ()=> {
  const token = localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || '';
  if (!token) return toastError('Token sekolah tidak ditemukan. Masuk/isi token dahulu.');
  loadProfilSekolah(token);
});
document.getElementById('btn-init-ensure')?.addEventListener('click', initEnsureHeaders);

/* Logout (re-use dashboard.js behavior) */
document.getElementById('logoutBtn')?.addEventListener('click', async ()=>{
  const token = localStorage.getItem('token_sesi') || '';
  try {
    await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'logout', token_sesi: token }) });
  } catch(e){}
  Swal.fire({ icon:'success', title:'Logout', text:'Anda telah keluar.', timer:900, showConfirmButton:false });
  localStorage.clear();
  setTimeout(()=> location.href = "index.html", 900);
});

/* inisialisasi saat load */
window.addEventListener('load', async ()=>{
  await new Promise(r => setTimeout(r, 160)); // sedikit tunggu
  const username = localStorage.getItem('username') || '';
  const nama = localStorage.getItem('nama') || username;
  $('namaUser').textContent = nama;
  $('usernameUser').textContent = localStorage.getItem('username') || '';
  // autoload profil jika token ada
  const token = localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || '';
  if (token) { loadProfilSekolah(token); }
});
