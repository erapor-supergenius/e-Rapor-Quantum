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
const logoutBtn = $("logoutBtn");
logoutBtn?.addEventListener("click", async () => {
  const token = localStorage.getItem("token_sesi");
  try {
    await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:"logout", token_sesi: token }) });
  } catch(e){}
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

  if (!username || !tokenSesi) {
    localStorage.clear();
    return location.href = "index.html";
  }
  if (expire && Date.now() > expire) {
    Swal.fire("Sesi Habis","Sesi Anda telah kadaluarsa. Silakan login kembali.","info");
    localStorage.clear();
    setTimeout(()=> location.href = "index.html", 1200);
    return;
  }

  $("namaUser").innerText = nama || username;
  $("usernameUser").innerText = username;

  await loadProfilSekolah(tokenUnik || tokenSesi);
  await loadDashboardData(tokenUnik || tokenSesi);
  await loadProgressMapel(tokenUnik || tokenSesi);
  await loadDataGuru(tokenUnik || tokenSesi); // <-- load data guru
});

/* ----------------- Load Profil Sekolah ----------------- */
async function loadProfilSekolah(token) {
  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'getProfilSekolah', token_sekolah: token }) });
    const data = await res.json();
    if (data && data.success) {
      const p = data.profil || {};
      $("schoolNameTop").innerText = p.nama_sekolah || "Sekolah Anda";
      const ln = $("logoSekolah");
      if (p.logo_url) ln.src = p.logo_url;
      $("infoSchool").innerHTML = `<strong>${p.nama_sekolah || "-"}</strong><br/>NPSN: ${p.npsn || '-'}<br/>Alamat: ${p.alamat_sekolah || '-'}`;
    } else {
      $("infoSchool").innerText = "Profil sekolah tidak tersedia.";
    }
  } catch (err) {
    console.error("loadProfilSekolah:", err);
    $("infoSchool").innerText = "Gagal memuat profil sekolah.";
  }
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
  } catch (err) {
    console.error("loadDashboardData:", err);
    Swal.fire("Gagal", "Tidak dapat memuat data dashboard.", "error");
  }
}

/* ----------------- Load Progress per Mapel ----------------- */
async function loadProgressMapel(token) {
  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'getProgressMapel', token_sekolah: token }) });
    const data = await res.json();
    const container = $("progressMapelContainer");
    if (!container) return;
    container.innerHTML = '';
    if (!data || !data.success || !Array.isArray(data.progress) || data.progress.length === 0) {
      container.innerHTML = '<div style="color:#64748b">Belum ada data progress untuk mapel.</div>';
      return;
    }
    data.progress.forEach(item => {
      const row = document.createElement('div');
      row.className = 'mapel-row';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '12px';
      row.innerHTML = `
        <div class="mapel-label">${escapeHtml(item.mapel)}</div>
        <div class="mapel-bar"><span style="width:0%"></span></div>
        <div class="mapel-percent">${item.progress || 0}%</div>
      `;
      container.appendChild(row);
      setTimeout(()=> row.querySelector('span').style.width = (item.progress||0)+'%', 50);
    });
  } catch(e){ console.error(e); }
}

/* ----------------- Chart ----------------- */
function initChart(stat) {
  const ctx = document.getElementById('chartOverview').getContext('2d');
  new Chart(ctx, {
    type:'bar',
    data:{
      labels: stat.labels || [],
      datasets:[{
        label:'Nilai Rata-rata',
        data: stat.values || [],
        backgroundColor:'#3b82f6'
      }]
    },
    options:{
      responsive:true,
      plugins:{ legend:{ display:false } },
      scales:{ y:{ beginAtZero:true, max:100 } }
    }
  });
}

/* ----------------- Load Data Guru ----------------- */
async function loadDataGuru(token) {
  const tbody = $("table-guru-body");
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:10px;">Memuat data guru...</td></tr>';
  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'getDataGuru', token_sekolah: token }) });
    const data = await res.json();
    if (!data || !data.success || !Array.isArray(data.data)) throw new Error('Data guru kosong');

    tbody.innerHTML = '';
    data.data.forEach(guru => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="border:1px solid #ccc; padding:6px;">${escapeHtml(guru.id_guru)}</td>
        <td style="border:1px solid #ccc; padding:6px;">${escapeHtml(guru.nip)}</td>
        <td style="border:1px solid #ccc; padding:6px;">${escapeHtml(guru.nama)}</td>
        <td style="border:1px solid #ccc; padding:6px;">${escapeHtml(guru.jenis_kelamin)}</td>
        <td style="border:1px solid #ccc; padding:6px; text-align:center;">
          <button onclick="hapusGuru('${guru.id_guru}','${token}')" style="background:#ef4444;color:#fff;border:none;padding:4px 8px;border-radius:6px; cursor:pointer;">Hapus</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch(e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:10px;">Gagal memuat data guru.</td></tr>';
  }
}

/* ----------------- Hapus Guru ----------------- */
async function hapusGuru(id_guru, token) {
  const confirmed = await Swal.fire({
    title: 'Hapus Guru',
    text: 'Yakin ingin menghapus guru ini?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus',
    cancelButtonText: 'Batal'
  });
  if (!confirmed.isConfirmed) return;

  try {
    const res = await fetch(WEBAPP_URL, { method:'POST', body: JSON.stringify({ action:'deleteDataGuru', token_sekolah: token, id_guru }) });
    const data = await res.json();
    if (data && data.success) {
      Swal.fire('Berhasil','Guru berhasil dihapus','success');
      loadDataGuru(token);
    } else {
      Swal.fire('Gagal','Guru gagal dihapus','error');
    }
  } catch(e){
    console.error(e);
    Swal.fire('Error','Terjadi kesalahan','error');
  }
}

/* ----------------- Utility ----------------- */
function setText(id, value){ const el=$(id); if(el) el.innerText=value; }
function escapeHtml(text){ return text? text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):'-'; }
