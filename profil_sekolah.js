/****************************************************
 * e-Rapor Quantum — profil_sekolah.js (Final Premium)
 * Kode ini 100% kompatibel dengan dashboard Quantum.
 * Pastikan WEBAPP_URL sesuai dengan deployment Apps Script.
 ****************************************************/



/* ---------- Helper ---------- */
const $ = id => document.getElementById(id);
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- Fields (sesuai header profil_sekolah) ---------- */
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

/* ---------- SweetAlert Toast ---------- */
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
    const el = $(f);
    if(el) obj[f] = el.value.trim();
  });
  return obj;
}
function setFormData(data){
  FIELDS.forEach(f=>{
    const el = $(f);
    if(el) el.value = data[f] || '';
  });
  refreshPreview();
}

/* ---------- Preview ---------- */
function refreshPreview(){
  const nama = $('nama_sekolah')?.value || 'Nama Sekolah';
  const alamat = $('alamat_sekolah')?.value || '';
  const email = $('email')?.value || '';
  const telepon = $('telepon')?.value || '';
  const url = $('url_logo')?.value || '';

  $('previewNama').textContent = nama;
  $('previewAlamat').textContent = alamat;
  $('previewKontak').textContent = [email,telepon].filter(Boolean).join(' • ');

  const logoPreview = $('logoPreview');
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
  const el = $(id);
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
      // Update sidebar name & logo
      if(r.profil.nama_sekolah) $('schoolNameTop').innerText = r.profil.nama_sekolah;
      if(r.profil.url_logo || r.profil.logo_url){
        const src = r.profil.url_logo || r.profil.logo_url;
        const ln = $('logoSekolah');
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
      if(data.nama_sekolah) $('schoolNameTop').innerText = data.nama_sekolah;
      if(data.url_logo){ const ln = $('logoSekolah'); if(ln) ln.src = data.url_logo; }
    }else{
      toastError('Gagal menyimpan', (r && (r.error||r.message)) || 'Tidak ada respon server');
    }
  }catch(e){
    console.error('saveProfilSekolah error',e);
    toastError('Kesalahan koneksi', e.message || '');
  }
}

/* ---------- Pastikan Header (admin) ---------- */
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
$('btn-save')?.addEventListener('click', saveProfilSekolah);
$('btn-save-2')?.addEventListener('click', saveProfilSekolah);
$('btn-refresh')?.addEventListener('click', ()=>{
  const token = localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || '';
  if(!token) return toastError('Token sekolah tidak ditemukan.');
  loadProfilSekolah(token);
});
$('btn-init-ensure')?.addEventListener('click', initEnsureHeaders);

/* ---------- Logout (sama seperti dashboard) ---------- */
$('logoutBtn')?.addEventListener('click', async ()=>{
  const token = localStorage.getItem('token_sesi') || '';
  try{
    await fetch(WEBAPP_URL,{method:'POST',body:JSON.stringify({action:'logout',token_sesi:token})});
  }catch(e){}
  Swal.fire({icon:'success',title:'Logout',text:'Anda telah keluar.',timer:900,showConfirmButton:false});
  localStorage.clear();
  setTimeout(()=>location.href="index.html",900);
});

/* ---------- Inisialisasi Saat Load ---------- */
window.addEventListener('load', async ()=>{
  await new Promise(r=>setTimeout(r,160));
  const username = localStorage.getItem('username') || '';
  const nama = localStorage.getItem('nama') || username;
  $('namaUser').textContent = nama;
  $('usernameUser').textContent = localStorage.getItem('username') || '';

  const token = localStorage.getItem('token_unik') || localStorage.getItem('token_sesi') || '';
  if(token) loadProfilSekolah(token);
});

/* ---------- ✅ Tambahan untuk kompatibilitas HTML lama ---------- */
function simpanProfil(){
  // Alias untuk kompatibilitas, agar onclick="simpanProfil()" tetap berfungsi
  saveProfilSekolah();
}
