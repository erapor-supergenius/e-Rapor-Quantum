const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

const $ = id => document.getElementById(id);

/* ----------------- Navigation ----------------- */
function navigateTo(page){
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token_sesi");
  if(!username || !token){ Swal.fire("Sesi Habis","Silakan login kembali.","info"); localStorage.clear(); setTimeout(()=>location.href="index.html",900); return; }
  window.location.href = page;
}

/* ----------------- Logout ----------------- */
$("logoutBtn")?.addEventListener("click", async()=>{
  const token = localStorage.getItem("token_sesi");
  try{ await fetch(WEBAPP_URL,{ method:'POST', body:JSON.stringify({action:"logout", token_sesi:token}) }); }catch(e){}
  Swal.fire({icon:'success',title:'Logout',text:'Anda telah keluar',timer:900,showConfirmButton:false});
  localStorage.clear(); setTimeout(()=>location.href="index.html",900);
});

/* ----------------- Load Page ----------------- */
window.addEventListener("load", async()=>{
  await new Promise(r=>setTimeout(r,200));
  const username = localStorage.getItem("username");
  const nama = localStorage.getItem("nama");
  const tokenSesi = localStorage.getItem("token_sesi");
  const tokenUnik = localStorage.getItem("token_unik");
  const expire = Number(localStorage.getItem("login_expire")||0);

  if(!username||!tokenSesi){ localStorage.clear(); return location.href="index.html"; }
  if(expire && Date.now()>expire){ Swal.fire("Sesi Habis","Sesi kadaluarsa","info"); localStorage.clear(); setTimeout(()=>location.href="index.html",1200); return; }

  $("namaUser").innerText = nama||username;
  $("usernameUser").innerText = username;

  await loadProfilSekolah(tokenUnik||tokenSesi);
  await loadDashboardData(tokenUnik||tokenSesi);
  await loadProgressMapel(tokenUnik||tokenSesi);
  await loadDataGuru(tokenUnik||tokenSesi);
});

/* ----------------- Profil Sekolah ----------------- */
async function loadProfilSekolah(token){
  try{
    const res = await fetch(WEBAPP_URL,{method:'POST',body:JSON.stringify({action:'getProfilSekolah',token_sekolah:token})});
    const data = await res.json();
    if(data && data.success){
      const p = data.profil||{};
      $("schoolNameTop").innerText = p.nama_sekolah||"Sekolah Anda";
      if(p.logo_url) $("logoSekolah").src = p.logo_url;
      $("infoSchool").innerHTML = `<strong>${p.nama_sekolah||"-"}</strong><br/>NPSN: ${p.npsn||'-'}<br/>Alamat: ${p.alamat_sekolah||'-'}`;
    }else $("infoSchool").innerText = "Profil sekolah tidak tersedia.";
  }catch(err){ console.error(err); $("infoSchool").innerText="Gagal memuat profil sekolah."; }
}

/* ----------------- Dashboard Cards ----------------- */
async function loadDashboardData(token){
  try{
    const res = await fetch(WEBAPP_URL,{method:'POST',body:JSON.stringify({action:'getDashboardData',token_sekolah:token})});
    const data = await res.json();
    if(!data||!data.success) throw new Error('Tidak ada data');
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
    const res = await fetch(WEBAPP_URL,{method:'POST',body:JSON.stringify({action:'getProgressMapel',token_sekolah:token})});
    const data = await res.json();
    const container = $("progressMapelContainer"); if(!container) return;
    container.innerHTML='';
    if(!data||!data.success||!Array.isArray(data.progress)||data.progress.length===0){ container.innerHTML='<div style="color:#64748b">Belum ada data progress untuk mapel.</div>'; return; }
    data.progress.forEach(item=>{
      const row=document.createElement('div'); row.className='mapel-row'; row.innerHTML=`
        <div class="mapel-label">${escapeHtml(item.mapel)}</div>
        <div class="mapel-bar"><span style="width:0%"></span></div>
        <div class="mapel-percent">${item.persen}%</div>
      `;
      container.appendChild(row);
      setTimeout(()=>{ const span=row.querySelector('.mapel-bar span'); if(span) span.style.width=(item.persen||0)+'%'; },80);
    });
  }catch(err){ console.error(err); const container=$("progressMapelContainer"); if(container) container.innerHTML='<div style="color:#ef4444">Gagal memuat progress mapel.</div>'; }
}

/* ----------------- Chart ----------------- */
let chartInstance=null;
function initChart(stat){
  const ctx=document.getElementById('chartOverview');
  if(!ctx) return;
  const labels=stat.labels||[];
  const values=stat.values||[];
  if(chartInstance){ chartInstance.data.labels=labels; chartInstance.data.datasets[0].data=values; chartInstance.update(); return; }
  chartInstance=new Chart(ctx,{
    type:'bar',
    data:{ labels:labels, datasets:[{label:'Rata-rata Nilai',data:values,backgroundColor:'#3B82F6',borderRadius:6}]},
    options:{ responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,max:100}} }
  });
}

/* ----------------- Data Guru ----------------- */
async function loadDataGuru(token){
  try{
    const res=await fetch(WEBAPP_URL,{method:'POST',body:JSON.stringify({action:'getDataGuru',token_sekolah:token})});
    const data=await res.json();
    const tbody=document.querySelector("#tableGuru tbody"); if(!tbody) return;
    tbody.innerHTML='';
    if(!data||!data.success||!Array.isArray(data.guru)||data.guru.length===0){ tbody.innerHTML='<tr><td colspan="6">Belum ada data guru.</td></tr>'; return; }
    data.guru.forEach(g=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${escapeHtml(g.nama_lengkap)}</td>
                     <td>${escapeHtml(g.username)}</td>
                     <td>${escapeHtml(g.email)}</td>
                     <td>${escapeHtml(g.level)}</td>
                     <td>${escapeHtml(g.status)}</td>
                     <td>
                       <span class="btn-action" onclick="editGuru('${g.username}')">✏️</span>
                       <span class="btn-action btn-delete" onclick="hapusGuru('${g.username}')">🗑️</span>
                     </td>`;
      tbody.appendChild(tr);
    });
  }catch(err){ console.error(err); }
}

/* ----------------- Modal Guru ----------------- */
const modalGuru=$("modalGuru");
const btnAddGuru=$("btnAddGuru");
const btnCloseModal=$("btnCloseModal");
const btnSaveGuru=$("btnSaveGuru");
let editMode=false;
let editUsername='';

btnAddGuru.addEventListener("click",()=>{ editMode=false; editUsername=''; $("modalTitle").innerText='Tambah Guru'; modalGuru.style.display='block'; $("inputNama").value=''; $("inputUsername").value=''; $("inputEmail").value=''; $("inputLevel").value='Guru'; $("inputStatus").value='aktif'; });
btnCloseModal.addEventListener("click",()=>{ modalGuru.style.display='none'; });

btnSaveGuru.addEventListener("click", async()=>{
  const payload={ nama:$("inputNama").value.trim(), username:$("inputUsername").value.trim(), email:$("inputEmail").value.trim(), level:$("inputLevel").value.trim(), status:$("inputStatus").value, action: editMode?'editGuru':'tambahGuru', token_sekolah: localStorage.getItem("token_unik")||localStorage.getItem("token_sesi") };
  if(editMode) payload.username_lama=editUsername;
  try{
    const res=await fetch(WEBAPP_URL,{method:'POST',body:JSON.stringify(payload)});
    const data=await res.json();
    if(data && data.success){ Swal.fire('Berhasil',data.message,'success'); modalGuru.style.display='none'; await loadDataGuru(payload.token_sekolah); }
    else Swal.fire('Gagal',data.message||'Terjadi kesalahan','error');
  }catch(err){ console.error(err); Swal.fire('Gagal','Terjadi kesalahan','error'); }
});

/* ----------------- Edit & Hapus Guru ----------------- */
function editGuru(username){
  editMode=true; editUsername=username;
  const row=[...document.querySelectorAll('#tableGuru tbody tr')].find(r=>r.children[1].innerText===username);
  if(!row) return Swal.fire('Error','Data guru tidak ditemukan','error');
  $("inputNama").value=row.children[0].innerText;
  $("inputUsername").value=row.children[1].innerText;
  $("inputEmail").value=row.children[2].innerText;
  $("inputLevel").value=row.children[3].innerText;
  $("inputStatus").value=row.children[4].innerText;
  $("modalTitle").innerText='Edit Guru'; modalGuru.style.display='block';
}

async function hapusGuru(username){
  const ok = await Swal.fire({title:'Hapus Guru?',text:'Anda yakin ingin menghapus guru ini?',icon:'warning',showCancelButton:true,confirmButtonText:'Ya, hapus',cancelButtonText:'Batal'});
  if(!ok.isConfirmed) return;
  try{
    const res=await fetch(WEBAPP_URL,{method:'POST',body:JSON.stringify({action:'hapusGuru',username,token_sekolah: localStorage.getItem("token_unik")||localStorage.getItem("token_sesi")})});
    const data=await res.json();
    if(data && data.success){ Swal.fire('Berhasil',data.message,'success'); await loadDataGuru(localStorage.getItem("token_unik")||localStorage.getItem("token_sesi")); }
    else Swal.fire('Gagal',data.message||'Terjadi kesalahan','error');
  }catch(err){ console.error(err); Swal.fire('Gagal','Terjadi kesalahan','error'); }
}

/* ----------------- Helpers ----------------- */
function setText(id,val){ const el=$(id); if(el) el.innerText=val||0; }
function escapeHtml(str){ if(!str) return ''; return str.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }

/* ----------------- Click Outside Modal ----------------- */
window.onclick = function(event){ if(event.target==modalGuru){ modalGuru.style.display='none'; } }
