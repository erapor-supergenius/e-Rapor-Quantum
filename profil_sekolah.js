/****************************************************
 * e-Rapor Quantum — profil_sekolah.js (Final Premium)
 * ✅ Fix semua error $/_, WEBAPP_URL, tombol, live preview
 * ✅ Kompatibel HTML lama & dashboard
 ****************************************************/

/* ---------- WEBAPP_URL ---------- */
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwR-1WBxIhP6JnuGoLe_j8lxczr5NiM8K-D5qjWHaZiH8fMxa_qY4RzgiO47Eo71eZU9A/exec";

/* ---------- Helper ---------- */
const _ = id => document.getElementById(id);
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- Fields Profil Sekolah ---------- */
const FIELDS = [
  'nama_sekolah','nss','npsn','status_sekolah','alamat_sekolah',
  'kelurahan_desa','kecamatan','kabupaten_kota','provinsi','website',
  'email','telepon','kepala_sekolah','nip_kepsek','url_logo',
  'kabupaten_kota_rapor','tanggal_rapor'
];

/* ---------- Navigation ---------- */
function navigateTo(page){
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token_sesi");
  if(!username || !token){
    Swal.fire("Sesi Habis","Silakan login kembali.","info");
    localStorage.clear();
    setTimeout(()=>location.href="index.html",900);
    return;
  }
  window.location.href = page;
}

/* ---------- Toast ---------- */
function toastSuccess(title,text=''){
  Swal.fire({icon:'success',title,text,timer:1300,showConfirmButton:false,toast:true,position:'top-end'});
}
function toastError(title,text=''){
  Swal.fire({icon:'error',title,text,timer:1800,showConfirmButton:false,toast:true,position:'top-end'});
}

/* ---------- Form <-> Object ---------- */
function getFormData(){
  const obj = {};
  FIELDS.forEach(f=>{
    const el = _(f);
    if(el) obj[f] = el.value.trim();
  });
  return obj;
}
function setFormData(data){
  FIELDS.forEach(f=>{
    const el = _(f);
    if(el) el.value = data[f] || '';
  });
  refreshPreview();
}

/* ---------- Preview ---------- */
function refreshPreview(){
  const nama = _('nama_sekolah')?.value || 'Nama Sekolah';
  const alamat = _('alamat_sekolah')?.value || '';
  const email = _('email')?.value || '';
  const telepon = _('telepon')?.value || '';
  const url = _('url_logo')?.value || '';

  _('previewNama').textContent = nama;
  _('previewAlamat').textContent = alamat;
  _('previewKontak').textContent = [email,telepon].filter(Boolean).join(' • ');

  const logoPreview = _('logoPreview');
  if(!logoPreview) return;
  if(url){
    logoPreview.innerHTML = `<img src="${escapeHtml(url)}" alt="Logo Sekolah"
      style="max-width:100%;max-height:120px;object-fit:contain;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.08)">`;
  } else {
    logoPreview.innerHTML = `<div style="text-align:center;color:#64748b">
      <div style="font-weight:700;font-size:20px">EQ</div>
      <div style="font-size:13px">Logo Sekolah</div></div>`;
  }
}

/* ---------- Event Live Preview ---------- */
['url_logo','nama_sekolah','alamat_sekolah','email','telepon'].forEach(id=>{
  const el = _(id);
  if(el) el.addEventListener('input',refreshPreview);
});

/* ---------- Fetch Helper ---------- */
async function gsPost(body){
  try{
    const res = await fetch(WEBAPP_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    return await res.json();
  }catch(e){
    console.error('gsPost error',e);
    throw e;
  }
}

/* ---------- Load Profil Sekolah ---------- */
async function loadProfilSekolah(token){
  try{
    const payload = {
      action:'getProfilSekolah',
      token_sekolah: token || localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || ''
    };
    const r = await gsPost(payload);
    if(r && r.success && r.profil){
      setFormData(r.profil);
      // Update sidebar & logo
      if(r.profil.nama_sekolah) _('schoolNameTop').innerText = r.profil.nama_sekolah;
      if(r.profil.url_logo || r.profil.logo_url){
        const src = r.profil.url_logo || r.profil.logo_url;
        const ln = _('logoSekolah');
        if(ln) ln.src = src;
      }
      toastSuccess('Profil dimuat');
    }else{
      setFormData({});
      toastError('Profil tidak ditemukan', r?.message || '');
    }
  }catch(e){
    console.error('loadProfilSekolah',e);
    toastError('Gagal memuat profil', e.message || '');
  }
}

/* ---------- Simpan Profil Sekolah ---------- */
async function saveProfilSekolah(){
  try{
    const data = getFormData();
    if(!data.nama_sekolah){ toastError('Nama sekolah wajib diisi'); return; }

    const token = localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || '';
    if(!token){ toastError('Token sekolah tidak ditemukan. Silakan login ulang.'); return; }

    const payload = { action:'saveProfilSekolah', token_sekolah: token, data };
    console.log('Kirim data profil:', payload);

    const r = await gsPost(payload);
    console.log('Respon dari server:', r);

    if(r && r.success){
      toastSuccess('Profil sekolah berhasil disimpan');
      if(data.nama_sekolah) _('schoolNameTop').innerText = data.nama_sekolah;
      if(data.url_logo){ const ln = _('logoSekolah'); if(ln) ln.src = data.url_logo; }
    }else{
      toastError('Gagal menyimpan', (r && (r.error||r.message)) || 'Tidak ada respon server');
    }
  }catch(e){
    console.error('saveProfilSekolah error',e);
    toastError('Kesalahan koneksi', e.message || '');
  }
}

/* ---------- Pastikan Header Spreadsheet ---------- */
async function initEnsureHeaders(){
  try{
    const token = localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || '';
    if(!token){ toastError('Token sekolah dibutuhkan untuk inisialisasi.'); return; }
    const r = await gsPost({ action:'initEnsure', token_sekolah: token });
    if(r && r.success) toastSuccess('Header dipastikan di spreadsheet');
    else toastError('Gagal memastikan header', r?.message || '');
  }catch(e){
    console.error('initEnsureHeaders',e);
    toastError('Inisialisasi error', e.message || '');
  }
}

/* ---------- Tombol Aksi ---------- */
_('btn-save')?.addEventListener('click', saveProfilSekolah);
_('btn-save-2')?.addEventListener('click', saveProfilSekolah);
_('btn-refresh')?.addEventListener('click', ()=>{
  const token = localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || '';
  if(!token) return toastError('Token sekolah tidak ditemukan.');
  loadProfilSekolah(token);
});
_('btn-init-ensure')?.addEventListener('click', initEnsureHeaders);

/* ---------- Logout ---------- */
_('logoutBtn')?.addEventListener('click', async ()=>{
  const token = localStorage.getItem('token_sesi') || '';
  try{ await fetch(WEBAPP_URL,{method:'POST',body:JSON.stringify({action:'logout',token_sesi:token})}); }catch(e){}
  Swal.fire({icon:'success',title:'Logout',text:'Anda telah keluar.',timer:900,showConfirmButton:false});
  localStorage.clear();
  setTimeout(()=>location.href="index.html",900);
});

/* ---------- Inisialisasi Saat Load ---------- */
window.addEventListener('load', async ()=>{
  await new Promise(r=>setTimeout(r,160));
  const username = localStorage.getItem('username') || '';
  const nama = localStorage.getItem('nama') || username;
  _('namaUser').textContent = nama;
  _('usernameUser').textContent = localStorage.getItem('username') || '';

  const token = localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || '';
  if(token) loadProfilSekolah(token);
});

/* ---------- Kompatibilitas HTML lama ---------- */
function simpanProfil(){ saveProfilSekolah(); }
window.saveProfilSekolah = saveProfilSekolah;
window.simpanProfil = simpanProfil;
