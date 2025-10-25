/****************************************************
 * dashboard.js — eRapor Quantum Super Genius
 ****************************************************/

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

/* ----------------- Helpers DOM ----------------- */
const $ = id => document.getElementById(id);

/* ----------------- Navigation ----------------- */
function navigateTo(page) {
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token_sesi");
  if (!username || !token) {
    Swal.fire("Sesi Habis", "Silakan login kembali.", "info");
    localStorage.clear();
    setTimeout(() => location.href = "index.html", 900);
    return;
  }
  window.location.href = page;
}

/* ----------------- Logout ----------------- */
$("logoutBtn")?.addEventListener("click", async () => {
  const token = localStorage.getItem("token_sesi");
  try { await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:"logout", token_sesi: token }) }); } catch(e){}
  Swal.fire({ icon:'success', title:'Logout', text:'Anda telah keluar.', timer:900, showConfirmButton:false });
  localStorage.clear();
  setTimeout(()=> location.href = "index.html", 900);
});

/* ----------------- On load ----------------- */
window.addEventListener("load", async () => {
  await new Promise(r => setTimeout(r, 200));
  const username = localStorage.getItem("username");
  const nama = localStorage.getItem("nama");
  const tokenSesi = localStorage.getItem("token_sesi");
  const tokenUnik = localStorage.getItem("token_unik");
  const expire = Number(localStorage.getItem("login_expire") || 0);

  if (!username || !tokenSesi) { localStorage.clear(); return location.href = "index.html"; }
  if (expire && Date.now() > expire) {
    Swal.fire("Sesi Habis","Sesi Anda telah kadaluarsa. Silakan login kembali.","info");
    localStorage.clear(); setTimeout(()=> location.href = "index.html", 1200); return;
  }

  $("namaUser").innerText = nama || username;
  $("usernameUser").innerText = username;

  await loadProfilSekolah(tokenUnik || tokenSesi);
  await loadDashboardData(tokenUnik || tokenSesi);
  await loadProgressMapel(tokenUnik || tokenSesi);
  await loadDataGuru(tokenUnik || tokenSesi);
});

/* ----------------- Load Profil Sekolah ----------------- */
async function loadProfilSekolah(token) {
  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'getProfilSekolah', token_sekolah: token }) });
    const data = await res.json();
    if (data && data.success) {
      const p = data.profil || {};
      $("schoolNameTop").innerText = p.nama_sekolah || "Sekolah Anda";
      if (p.logo_url) $("logoSekolah").src = p.logo_url;
      $("infoSchool").innerHTML = `<strong>${p.nama_sekolah || "-"}</strong><br/>NPSN: ${p.npsn || '-'}<br/>Alamat: ${p.alamat_sekolah || '-'}`;
    } else { $("infoSchool").innerText = "Profil sekolah tidak tersedia."; }
  } catch (err) { console.error("loadProfilSekolah:", err); $("infoSchool").innerText = "Gagal memuat profil sekolah."; }
}

/* ----------------- Load Dashboard Data ----------------- */
async function loadDashboardData(token) {
  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'getDashboardData', token_sekolah: token }) });
    const data = await res.json();
    if (!data || !data.success) throw new Error('Tidak ada data');

    setText('totalSiswa', data.total_siswa);
    setText('totalGuru', data.total_guru);
    setText('totalMapel', data.total_mapel);
    setText('totalKelas', data.total_kelas);
    setText('totalBimbingan', data.total_bimbingan);

    initChart(data.statistik || { labels:[], values:[] });
  } catch (err) { console.error("loadDashboardData:", err); Swal.fire("Gagal", "Tidak dapat memuat data dashboard.", "error"); }
}

/* ----------------- Load Progress per Mapel ----------------- */
async function loadProgressMapel(token) {
  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'getProgressMapel', token_sekolah: token }) });
    const data = await res.json();
    const container = $("progressMapelContainer"); if(!container) return;
    container.innerHTML = '';
    if (!data || !data.success || !Array.isArray(data.progress) || data.progress.length===0) {
      container.innerHTML = '<div style="color:#64748b">Belum ada data progress untuk mapel.</div>'; return;
    }
    data.progress.forEach(item=>{
      const row = document.createElement('div'); row.className='mapel-row'; row.innerHTML=`<div class="mapel-label">${escapeHtml(item.mapel)}</div><div class="mapel-bar"><span style="width:0%"></span></div><div class="mapel-percent">${item.persen}%</div>`; container.appendChild(row);
      setTimeout(()=>{const span=row.querySelector('.mapel-bar span'); if(span) span.style.width=(item.persen||0)+'%';},80);
    });
  } catch(err){ console.error("loadProgressMapel:",err); $("progressMapelContainer").innerHTML='<div style="color:#ef4444">Gagal memuat progress mapel.</div>'; }
}

/* ----------------- Chart.js ----------------- */
let chartInstance = null;
function initChart(stat) {
  const ctx = $("chartOverview"); if(!ctx) return;
  const labels=stat.labels||[], values=stat.values||[];
  if(chartInstance){ chartInstance.data.labels=labels; chartInstance.data.datasets[0].data=values; chartInstance.update(); return; }
  chartInstance = new Chart(ctx,{ type:'bar', data:{ labels, datasets:[{ label:'Rata-rata Nilai', data:values, backgroundColor:'#3B82F6', borderRadius:6 }] }, options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, max:100 } } } });
}

/* ----------------- Utilities ----------------- */
function setText(id,val){ const el=$(id); if(el) el.innerText=(val!==undefined && val!==null)?val:'-'; }
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ----------------- Developer Info ----------------- */
function showDeveloperInfo(){
  Swal.fire({
    title:'Tentang eRapor Quantum',
    html:`<p><strong>eRapor Quantum Super Genius</strong></p>
          <ul style="text-align:left">
            <li>Integrasi Google Sheets & Apps Script</li>
            <li>Keamanan berbasis token sekolah & sesi</li>
            <li>Dashboard real-time & progress per mapel</li>
          </ul>
          <p>Developed by: <strong>Dedi Agus Mustofa, S.Pd.SD</strong></p>`,
    icon:'info', confirmButtonText:'Tutup'
  });
}

/* ----------------- DATA GURU ----------------- */
async function loadDataGuru(token) {
  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'getDataGuru', token_sekolah: token }) });
    const data = await res.json();
    const tbody = $("table-guru-body");
    if(!tbody) return;
    tbody.innerHTML='';
    if(!data || !data.success || !Array.isArray(data.guru) || data.guru.length===0){
      tbody.innerHTML='<tr><td colspan="4" style="text-align:center;color:#64748b;">Belum ada data guru.</td></tr>'; return;
    }
    data.guru.forEach(g=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${escapeHtml(g.nip)}</td>
                    <td>${escapeHtml(g.nama)}</td>
                    <td>${g.jk==='L'?'Laki-laki':'Perempuan'}</td>
                    <td>
                      <button onclick="openModalEditGuru('${g.id}','${escapeHtml(g.nip)}','${escapeHtml(g.nama)}','${g.jk}')">Edit</button>
                      <button onclick="hapusGuru('${g.id}')">Hapus</button>
                    </td>`;
      tbody.appendChild(tr);
    });
  } catch(err){ console.error("loadDataGuru:",err); $("table-guru-body").innerHTML='<tr><td colspan="4" style="text-align:center;color:#ef4444;">Gagal memuat data guru.</td></tr>'; }
}

/* ----------------- MODAL TAMBAH / EDIT ----------------- */
function openModalTambahGuru(){
  $("modalGuruTitle").innerText="Tambah Guru";
  $("inputIdGuru").value='';
  $("inputNIP").value='';
  $("inputNama").value='';
  $("inputJK").value='';
  $("modalGuru").style.display='flex';
}
function openModalEditGuru(id,nip,nama,jk){
  $("modalGuruTitle").innerText="Edit Guru";
  $("inputIdGuru").value=id;
  $("inputNIP").value=nip;
  $("inputNama").value=nama;
  $("inputJK").value=jk;
  $("modalGuru").style.display='flex';
}
function closeModalGuru(){ $("modalGuru").style.display='none'; }

/* ----------------- SIMPAN GURU ----------------- */
async function simpanGuru(){
  const id = $("inputIdGuru").value.trim();
  const nip = $("inputNIP").value.trim();
  const nama = $("inputNama").value.trim();
  const jk = $("inputJK").value;
  if(!nip || !nama || !jk){ Swal.fire("Oops","Semua field wajib diisi","warning"); return; }
  const token = localStorage.getItem("token_unik") || localStorage.getItem("token_sesi");
  const act = id? "updateGuru":"addGuru";
  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:act, token_sekolah:token, id,id_nip:nip,nama,jk }) });
    const data = await res.json();
    if(data && data.success){
      Swal.fire("Sukses", data.message || "Berhasil disimpan","success");
      closeModalGuru();
      await loadDataGuru(token);
      setText('totalGuru', data.total_guru);
    } else { Swal.fire("Gagal", data.message || "Tidak dapat menyimpan data","error"); }
  } catch(err){ console.error("simpanGuru:",err); Swal.fire("Gagal","Terjadi kesalahan server","error"); }
}

/* ----------------- HAPUS GURU ----------------- */
async function hapusGuru(id){
  if(!id) return;
  const token = localStorage.getItem("token_unik") || localStorage.getItem("token_sesi");
  const confirm = await Swal.fire({ title:"Hapus Guru?", text:"Data guru akan dihapus permanen!", icon:"warning", showCancelButton:true, confirmButtonText:"Ya, hapus" });
  if(confirm.isConfirmed){
    try {
      const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'deleteGuru', token_sekolah:token, id }) });
      const data = await res.json();
      if(data && data.success){
        Swal.fire("Terhapus", data.message || "Data guru berhasil dihapus","success");
        await loadDataGuru(token);
        setText('totalGuru', data.total_guru);
      } else { Swal.fire("Gagal", data.message || "Tidak dapat menghapus","error"); }
    } catch(err){ console.error("hapusGuru:",err); Swal.fire("Gagal","Terjadi kesalahan server","error"); }
  }
}

/* ----------------- Tutup modal klik di luar ----------------- */
window.onclick = function(event){
  const modal = $("modalGuru");
  if(event.target===modal) modal.style.display='none';
}
