// ========================================================
// 🚨 GANTI DENGAN URL WEB APP GAS ANDA 🚨
// Pastikan ini adalah URL Web App yang sudah Anda deploy!
// ========================================================
const AUTH_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxvlW32iZ_o1RttaGUTQUt9X2MQOxoRiGEjuzsDiXt4eHsb9FXLG4u9HLDnpY5avTZweA/exec";  // Web App untuk Login/Register
const DATA_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwvNzVh_4AgTDa1HQcF6nTit5x9bHnMwKOjM9wpYU3iBwsf7LgaZ0zl8uA14lYtcUqX-A/exec";  // Web App untuk Ambil Data Global/Input Nilai
// ========================================================

// Variabel Global untuk menyimpan data aplikasi setelah login
let APP_DATA = { 
    siswa: [], 
    guru: [], 
    mapel: [], 
    mulok: [], 
    kelas: [], 
    frasaTercapai: [], 
    frasaBimbingan: [], 
    tahunAjaran: "", 
    semester: "" 
};

// ========================================================
// HELPER: UI & KOMUNIKASI
// ========================================================

/**
 * Menampilkan section UI tertentu dan menyembunyikan yang lain.
 */
function showSection(id) {
    document.querySelectorAll('.app-section').forEach(sec => sec.style.display = 'none');
    
    const targetSection = document.getElementById(id);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

/**
 * Mengirim data Form ke Google Apps Script (GAS) menggunakan Fetch API.
 * (Pengganti dari google.script.run)
 */
function sendToGas(url, formId, buttonId) {
    const form = document.getElementById(formId);
    const button = document.getElementById(buttonId);
    const formData = new FormData(form);

    button.disabled = true;

    return fetch(url, {
        method: 'POST',
        body: formData 
    })
    .then(response => response.json())
    .finally(() => {
        button.disabled = false;
    });
}

// ========================================================
// LOGIKA DASHBOARD & DATA GLOBAL
// ========================================================

/**
 * Dipanggil setelah login sukses. Memuat UI dan data awal.
 */
function loadDashboard(nama, sheetId, username) {
    showSection('dashboard-section');
    
    // Tampilkan data sesi di header dashboard
    document.getElementById('user-display').textContent = nama;
    document.getElementById('sheet-id-display').textContent = sheetId;
    
    // Isi hidden field di form input nilai
    document.getElementById('nilai-sheet-id').value = sheetId;
    document.getElementById('nilai-email-guru').value = username; 

    // Hapus token sementara setelah berhasil login
    sessionStorage.removeItem('temp_token'); 
    sessionStorage.removeItem('temp_sheetId');

    // **Langkah Kritis:** Ambil semua data global (siswa, mapel, tahun ajaran)
    fetchGlobalData(sheetId);
}

/**
 * Mengambil data global dari Web App 2 (DATA_WEB_APP_URL).
 */
function fetchGlobalData(sheetId) {
    const data = new FormData();
    data.append('action', 'get_global_data');
    data.append('spreadsheet_id', sheetId);

    // Gunakan elemen di dashboard untuk menunjukkan proses loading jika perlu
    const statusEl = document.getElementById('status-data-global'); // Anda mungkin perlu menambahkan elemen ini di dashboard.html

    fetch(DATA_WEB_APP_URL, {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(res => {
        if (res.status === 'success') {
            APP_DATA = { ...APP_DATA, ...res.data };
            
            // Isi dropdown UI setelah data diterima
            populateDropdowns();
            
            // Tampilkan Tahun Ajaran dan Semester aktif di UI
            document.getElementById('ta-display').textContent = APP_DATA.tahunAjaran;
            document.getElementById('sem-display').textContent = APP_DATA.semester;

            // Default ke section Input Nilai setelah dashboard dimuat
            setupNavigation();
            
        } else {
            alert(`Gagal memuat data global: ${res.message}`);
        }
    })
    .catch(error => {
        console.error('Error saat fetch global data:', error);
        alert('Error koneksi saat memuat data global.');
    });
}

/**
 * Mengisi dropdown (select element) di dashboard dengan data dari APP_DATA.
 */
function populateDropdowns() {
    // 1. Dropdown Mata Pelajaran (Input Nilai)
    const mapelSelect = document.getElementById('input-mapel');
    if (mapelSelect) {
        mapelSelect.innerHTML = '<option value="">-- Pilih Mapel --</option>';
        // Gabungkan mapel dan mulok
        const allMapel = [...APP_DATA.mapel, ...APP_DATA.mulok];
        allMapel.forEach(mapel => {
            const option = document.createElement('option');
            // Format value: [ID_MAPEL|ID_MULOK] - [NAMA_MAPEL]
            option.value = mapel.id; 
            option.textContent = mapel.nama;
            mapelSelect.appendChild(option);
        });
    }

    // 2. Dropdown Kelas (Cetak Leger)
    const kelasSelect = document.getElementById('cetak-kelas');
    if (kelasSelect) {
        kelasSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';
        APP_DATA.kelas.forEach(kelas => {
            const option = document.createElement('option');
            option.value = kelas.nama; 
            option.textContent = kelas.nama;
            kelasSelect.appendChild(option);
        });
    }

    // 3. Dropdown Siswa (Cetak Rapor Siswa Tunggal)
    const siswaSelect = document.getElementById('cetak-siswa-single');
    if (siswaSelect) {
        siswaSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
        APP_DATA.siswa.forEach(siswa => {
            const option = document.createElement('option');
            // Format value: id_siswa
            option.value = siswa.id; 
            option.textContent = `${siswa.nama} (${siswa.kelas})`;
            siswaSelect.appendChild(option);
        });
    }
}

/**
 * Mengatur event listener untuk navigasi di dalam dashboard.
 */
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-button');
    const sections = document.querySelectorAll('#dashboard-section > .app-section');

    // Sembunyikan semua section di dashboard
    sections.forEach(sec => sec.style.display = 'none');
    
    // Tampilkan default section (Input Nilai)
    const defaultSection = document.getElementById('input-nilai-section');
    if (defaultSection) {
        defaultSection.style.display = 'block';
    }

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            // Sembunyikan semua section
            sections.forEach(sec => sec.style.display = 'none');
            // Tampilkan section target
            const target = document.getElementById(targetId);
            if (target) {
                target.style.display = 'block';
            }
        });
    });
}

// ========================================================
// HANDLER FORM (Token, Auth, Input Nilai)
// ========================================================

/**
 * HANDLER: Cek Token
 */
/**
 * HANDLER: Cek Token
 * (MODIFIKASI: Menambahkan 'action' ke FormData secara manual)
 */
function handleTokenForm(e) {
    e.preventDefault();
    const msgEl = document.getElementById('token-message');
    const form = document.getElementById('tokenForm');
    const button = document.getElementById('btn-token');

    msgEl.textContent = 'Memvalidasi token...';
    msgEl.style.color = 'orange';
    button.disabled = true;

    // 1. Buat FormData dari form
    const formData = new FormData(form);
    
    // 2. 🚨 SOLUSI: Tambahkan action yang spesifik untuk cek token
    formData.append('action', 'check_token'); 

    // 3. Kirim request dengan fetch langsung
    fetch(AUTH_WEB_APP_URL, {
        method: 'POST',
        body: formData // Mengirim FormData yang sudah di-update
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            msgEl.textContent = '✅ Token Valid. Silakan Login atau Daftar.';
            msgEl.style.color = 'green';
            
            // Simpan data sesi sementara
            sessionStorage.setItem('temp_token', data.token);  
            sessionStorage.setItem('temp_sheetId', data.spreadsheetId);
            
            showSection('auth-section');
        } else {
            // Jika status 'error', GAS mungkin mengembalikan 'Token tidak ditemukan.'
            msgEl.textContent = `❌ ${data.message}`;
            msgEl.style.color = 'red';
        }
    })
    .catch(error => { 
        msgEl.textContent = 'Error koneksi ke server. Cek koneksi atau URL Web App.'; 
        msgEl.style.color = 'red'; 
        console.error(error); 
    })
    .finally(() => {
        button.disabled = false;
    });
}

/**
 * HANDLER: Login Pengguna
 */
function handleLoginForm(e) {
    e.preventDefault();
    const msgEl = document.getElementById('login-message');
    msgEl.textContent = 'Sedang Login...';
    msgEl.style.color = 'orange';
    
    // Ambil sheetId dari sesi sementara sebelum dikirim
    const formData = new FormData(document.getElementById('loginForm'));
    const tempSheetId = sessionStorage.getItem('temp_sheetId');
    if (tempSheetId) {
        formData.append('spreadsheet_id', tempSheetId);
    }
    // 🚨 SOLUSI TAMBAHAN: Tambahkan action untuk login
    formData.append('action', 'login_user'); // <--- TAMBAHKAN INI

    fetch(AUTH_WEB_APP_URL, {
        method: 'POST',
        body: formData 
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            msgEl.textContent = '✅ Login Berhasil!';
            msgEl.style.color = 'green';
            
            // **SIMPAN DATA SESI UTAMA**
            sessionStorage.setItem('spreadsheetId', data.spreadsheetId);
            sessionStorage.setItem('namaUser', data.namaUser);
            sessionStorage.setItem('role', data.role);
            sessionStorage.setItem('username', document.getElementById('username-login').value);  

            // Alihkan ke dashboard
            loadDashboard(data.namaUser, data.spreadsheetId, document.getElementById('username-login').value);

        } else {
            msgEl.textContent = `❌ Gagal Login: ${data.message}`;
            msgEl.style.color = 'red';
        }
    })
    .catch(error => { 
        msgEl.textContent = 'Error koneksi saat login.'; 
        msgEl.style.color = 'red'; 
        console.error(error); 
    })
    .finally(() => {
         document.getElementById('btn-login').disabled = false;
    });
}

/**
 * HANDLER: Registrasi Pengguna
 */
function handleRegisterForm(e) {
    e.preventDefault();
    const msgEl = document.getElementById('register-message');
    msgEl.textContent = 'Sedang Mendaftar...';
    msgEl.style.color = 'orange';
    
    // Isi hidden field token dari sesi sementara
    document.getElementById('reg-token-field').value = sessionStorage.getItem('temp_token');
    
    sendToGas(AUTH_WEB_APP_URL, 'registerForm', 'btn-register')
        .then(data => {
            if (data.status === 'success') {
                msgEl.textContent = '✅ Pendaftaran berhasil. Silakan Login.';
                msgEl.style.color = 'green';
                // Pindah kembali ke form login
                document.getElementById('register-container').style.display = 'none';
                document.getElementById('login-container').style.display = 'block';
            } else {
                msgEl.textContent = `❌ Gagal Mendaftar: ${data.message}`;
                msgEl.style.color = 'red';
            }
        })
        .catch(error => { 
            msgEl.textContent = 'Error koneksi saat mendaftar.'; 
            msgEl.style.color = 'red'; 
            console.error(error); 
        });
}

/**
 * HANDLER: Input Nilai
 */
function handleInputNilaiForm(e) {
    e.preventDefault();
    const msgEl = document.getElementById('nilai-message');
    msgEl.textContent = 'Menyimpan nilai...';
    msgEl.style.color = 'orange';

    // Mengirim data ke Web App 2 (Input Data)
    sendToGas(DATA_WEB_APP_URL, 'inputNilaiForm', 'btn-input-nilai')
        .then(data => {
            if (data.status === 'success') {
                msgEl.textContent = '✅ Nilai Berhasil Disimpan!';
                msgEl.style.color = 'green';
                document.getElementById('inputNilaiForm').reset(); // Reset form
            } else {
                msgEl.textContent = `❌ Gagal Simpan Nilai: ${data.message}`;
                msgEl.style.color = 'red';
            }
        })
        .catch(error => { 
            msgEl.textContent = 'Error koneksi saat input nilai.'; 
            msgEl.style.color = 'red'; 
            console.error(error); 
        });
}


// ========================================================
// SETUP APLIKASI UTAMA (Listeners & Sesi)
// ========================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Setup listeners Form Auth
    document.getElementById('tokenForm').addEventListener('submit', handleTokenForm);
    document.getElementById('loginForm').addEventListener('submit', handleLoginForm);
    document.getElementById('registerForm').addEventListener('submit', handleRegisterForm);
    
    // Setup listener Form Input Nilai (di Dashboard)
    document.getElementById('inputNilaiForm').addEventListener('submit', handleInputNilaiForm);
    
    // Setup listener Navigasi Login/Register
    document.getElementById('showRegister').addEventListener('click', function() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('register-container').style.display = 'block';
    });
    document.getElementById('showLogin').addEventListener('click', function() {
        document.getElementById('register-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'block';
    });
    
    // Setup listener Logout
    document.getElementById('logout-button').addEventListener('click', function() {
        sessionStorage.clear();
        showSection('token-section');
        document.getElementById('token-message').textContent = 'Anda telah logout.';
        document.getElementById('token-message').style.color = 'green';
    });


    // Pengecekan Sesi Awal
    if (sessionStorage.getItem('spreadsheetId')) {
        // Jika sudah ada sesi, langsung tampilkan dashboard dan load data
        loadDashboard(
            sessionStorage.getItem('namaUser'), 
            sessionStorage.getItem('spreadsheetId'),
            sessionStorage.getItem('username')
        );
    } else {
        // Jika belum ada sesi, mulai dari cek token
        showSection('token-section');
    }
});
