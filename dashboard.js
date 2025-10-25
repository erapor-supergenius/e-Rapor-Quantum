/****************************************************
 * dashboard.js — eRapor Quantum Super Genius
 * Semua fungsi: load dashboard, profil sekolah,
 * progress mapel, tambah/edit/hapus guru
 ****************************************************/

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

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

/* ----------------- Load page ----------------- */
window.addEventListener("load", async () => {
  await new Promise(r => setTimeout(r, 200));
  const username = localStorage.getItem("username");
  const nama = localStorage.getItem("nama");
  const tokenSesi = localStorage.getItem("token_sesi");
  const tokenUnik = localStorage.getItem("token_unik");
  const expire = Number(localStorage.getItem("login_expire")||0);

  if (!username || !tokenSesi || (expire && Date.now() > expire)) {
    localStorage.clear();
    Swal.fire("Sesi Habis","Sesi Anda telah kadaluarsa. Silakan login kembali.","info");
    setTimeout(()=> location.href = "index.html", 1200);
    return;
  }

  $("namaUser").innerText = nama || username;
  $("usernameUser").innerText = username;

  await loadProfilSekolah(tokenUnik||tokenSesi);
  await loadDashboardData(tokenUnik||tokenSesi);
  await loadProgressMapel(tokenUnik||tokenSesi);
  await loadDataGuru(tokenUnik||tokenSesi);

  setupGuruModal(tokenUnik||tokenSesi);
});

/* ----------------- Profil Sekolah ----------------- */
async function loadProfilSekolah(token){
  try{
    const res = await fetch(WEBAPP_URL,{ method:'POST', body:JSON.stringify({action:'getProfilSekolah',token_sekolah:token}) });
    const data = await res.json();
    if(data.success){
      const p = data.profil||{};
      $("schoolNameTop").innerText = p.nama_sekolah||"Sekolah Anda";
      if(p.logo_url) $("logoSekolah").src = p.logo_url;
      $("infoSchool").innerHTML = `<strong>${p.nama_sekolah||"-"}</strong><br/>NPSN: ${p.npsn||'-'}<br/>Alamat: ${p.alamat_sekolah||'-'}`;
    } else $("infoSchool").innerText = "Profil sekolah tidak tersedia.";
  } catch(err){ console.error(err); $("infoSchool").innerText = "Gagal memuat profil sekolah."; }
}

/* ----------------- Dashboard Data ----------------- */
async function loadDashboardData(token){
  try{
    const res = await fetch(WEBAPP_URL,{ method:'POST', body:JSON.stringify({action:'getDashboardData',token_sekolah:token}) });
    const data = await res.json();
    if(!data.success) throw new Error('Tidak ada data');
    setText('totalSiswa',data.total_siswa);
    setText('totalGuru',data.total_guru);
    setText('totalMapel',data.total_mapel);
    setText('totalKelas',data.total_kelas);
    setText('totalBimbingan',data.total_bimbingan);
    initChart(data.statistik||{labels:[],values:[]});
  }catch(err){ console.error(err); Swal.fire("Gagal","Tidak dapat memuat data dashboard.","error"); }
}

/* ----------------- Progress Mapel ----------------- */
async function loadProgressMapel(token){
  try{
    const res = await fetch(WEBAPP_URL,{ method:'POST', body:JSON.stringify({action:'getProgressMapel',token_sekolah:token}) });
    const data = await res.json();
    const container = $("progressMapelContainer");
    container.innerHTML='';
    if(!data.success || !Array.isArray(data.progress)||data.progress.length===0){
      container.innerHTML='<div style="color:#64748b">Belum ada data progress untuk mapel.</div>'; return;
    }
    data.progress.forEach(item=>{
      const row=document.createElement('div');
      row.className='mapel-row';
      row.innerHTML=`<div class="mapel-label">${escapeHtml(item.mapel)}</div>
        <div class="mapel-bar"><span style="width:0%"></span></div>
        <div class="mapel-percent">${item.persen}%</div>`;
      container.appendChild(row);
      setTimeout(()=>{ const span=row.querySelector('.mapel-bar span'); if(span) span.style.width=(item.persen||0)+'%'; },80);
    });
  }catch(err){ console.error(err); $("progressMapelContainer").innerHTML='<div style="color:#ef4444">Gagal memuat progress mapel.</div>'; }
}

/* ----------------- Chart ----------------- */
let chartInstance=null;
function initChart(stat){
  const ctx=$("chartOverview");
  if(!ctx) return;
  const labels=stat.labels||[];
  const values=stat.values||[];
  if(chartInstance){ chartInstance.data.labels=labels; chartInstance.data.datasets[0].data=values; chartInstance.update(); return;}
  chartInstance=new Chart(ctx,{
    type:'bar',
    data:{labels:labels,datasets:[{label:'Rata-rata Nilai',data:values,backgroundColor:'#3B82F6',borderRadius:6}]},
    options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100}}}
  });
}

/* ----------------- Data Guru ----------------- */
async function loadDataGuru(token){
  try{
    const res=await fetch(WEBAPP_URL,{method:'POST',body:JSON.stringify({action:'getDataGuru',token_sekolah:token})});
    const data=await res.json();
    const container=$("guruTableContainer");
    if(!data.success || !Array.isArray(data.data) || data.data.length===0){
      container.innerHTML='<div style="color:#64748b">Belum ada data guru.</div>'; return;
    }
    let html='<table><thead><tr><th>No</th><th>Nama</th><th>Username</th><th>Level</th><th>Aksi</th></tr></thead><tbody>';
    data.data.forEach((g,i)=>{
      html+=`<tr>
        <td>${i+1}</td>
        <td>${escapeHtml(g.nama_lengkap)}</td>
        <td>${escapeHtml(g.username)}</td>
        <td>${escapeHtml(g.level)}</td>
        <td>
          <button class="btn-action btn-edit" onclick="editGuru('${g.id}')">Edit</button>
          <button class="btn-action btn-delete" onclick="deleteGuru('${g.id}')">Hapus</button>
        </td>
      </tr>`;
    });
    html+='</tbody></table>';
    container.innerHTML=html;
  }catch(err){ console.error(err); $("guruTableContainer").innerHTML='<div style="color:#ef4444">Gagal memuat data guru.</div>'; }
}

/* ----------------- Modal Tambah/Edit Guru ----------------- */
function setupGuruModal(token){
  const modal=$("modalGuru"),closeBtn=$("closeModalGuru"),saveBtn=$("saveGuruBtn"),btnTambah=$("btnTambahGuru");
  closeBtn.onclick=()=> modal.style.display='none';
  window.onclick=e=>{if(e.target===modal) modal.style.display='none';};
  btnTambah.onclick=()=>{ modal.style.display='flex'; $("modalTitle").innerText='Tambah Guru'; $("guruId").value=''; $("guruNama").value=''; $("guruUsername").value=''; $("guruPassword").value=''; $("guruLevel").value='guru'; };
  
  saveBtn.onclick=async ()=>{
    const id=$("guruId").value, nama=$("guruNama").value, username=$("guruUsername").value, password=$("guruPassword").value, level=$("guruLevel").value;
    if(!nama||!username||!password){ Swal.fire("Oops","Semua field harus diisi","warning"); return; }
    try{
      const res=await fetch(WEBAPP_URL,{ method:'POST', body:JSON.stringify({ action:'saveDataGuru',
