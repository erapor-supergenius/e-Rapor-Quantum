/** =====================================================
 * FILE: print.js (Untuk Leger & Rapor)
 * =====================================================*/

// 🚨 GANTI DENGAN URL WEB APP GAS UNTUK CETAK 🚨
const PRINT_WEB_APP_URL = "URL_WEB_APP_3_PRINT_ANDA"; 
// ========================================================

// Diasumsikan APP_DATA dan SPREADSHEET_ID tersedia secara global setelah login

// Helper untuk menampilkan pesan (Asumsikan Anda punya fungsi showToast/Swal.fire dari file lama)
function showMessage(msg, type = 'info', elId = 'cetak-message') {
    const msgEl = document.getElementById(elId);
    if (msgEl) {
        msgEl.textContent = msg;
        msgEl.style.color = type === 'error' ? 'red' : (type === 'success' ? 'green' : 'black');
    }
}

function startSpinner(button) {
    button.disabled = true;
    button.textContent = 'Memproses...';
}

function stopSpinner(button, originalText) {
    button.disabled = false;
    button.textContent = originalText;
}


// --- HANDLER: CETAK RAPOR SISWA TUNGGAL ---
document.getElementById('btn-cetak-rapor-single').addEventListener('click', function() {
    const btn = this;
    const originalText = btn.textContent;
    const selectSiswa = document.getElementById('cetak-siswa-single');
    
    const siswaId = selectSiswa.value;
    const sheetId = sessionStorage.getItem('spreadsheetId');
    const tahunAjaran = APP_DATA.tahunAjaran;
    const semester = APP_DATA.semester;

    if (!siswaId || !sheetId || !tahunAjaran || !semester) {
        showMessage('Pilih siswa dan pastikan data sesi lengkap.', 'error');
        return;
    }

    startSpinner(btn);

    const formData = new FormData();
    formData.append('action', 'cetak_rapor');
    formData.append('spreadsheet_id', sheetId);
    formData.append('siswa_id', siswaId);
    formData.append('tahun_ajaran', tahunAjaran);
    formData.append('semester', semester);

    fetch(PRINT_WEB_APP_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showMessage('✅ Rapor berhasil dibuat. Membuka tab baru...', 'success');
            window.open(data.url, "_blank");
        } else {
            showMessage(`❌ Gagal Cetak Rapor: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        showMessage('Error koneksi saat mencetak rapor.', 'error');
        console.error(error);
    })
    .finally(() => {
        stopSpinner(btn, originalText);
    });
});


// --- HANDLER: CETAK LEGER KELAS ---
document.getElementById('btn-cetak-leger-pdf').addEventListener('click', function() {
    const btn = this;
    const originalText = btn.textContent;
    const selectKelas = document.getElementById('cetak-kelas');

    const kelasId = selectKelas.value;
    const sheetId = sessionStorage.getItem('spreadsheetId');
    const tahunAjaran = APP_DATA.tahunAjaran;
    const semester = APP_DATA.semester;

    if (!kelasId || !sheetId || !tahunAjaran || !semester) {
        showMessage('Pilih kelas dan pastikan data sesi lengkap.', 'error');
        return;
    }

    startSpinner(btn);

    const formData = new FormData();
    formData.append('action', 'cetak_leger');
    formData.append('spreadsheet_id', sheetId);
    formData.append('kelas_id', kelasId);
    formData.append('tahun_ajaran', tahunAjaran);
    formData.append('semester', semester);

    fetch(PRINT_WEB_APP_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showMessage('✅ Leger PDF berhasil dibuat. Membuka tab baru...', 'success');
            window.open(data.url, "_blank");
        } else {
            showMessage(`❌ Gagal Cetak Leger: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        showMessage('Error koneksi saat mencetak leger.', 'error');
        console.error(error);
    })
    .finally(() => {
        stopSpinner(btn, originalText);
    });
});
