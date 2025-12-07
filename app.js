// ========================================================
// NAMA FILE: app.js
// Diletakkan di GitHub (Harus ditarik dari index.html)
// ========================================================

// 🚨 GANTI DENGAN URL WEB APP GAS ANDA 🚨
const AUTH_WEB_APP_URL = "URL_WEB_APP_1_AUTH_ANDA"; 
const INPUT_WEB_APP_URL = "URL_WEB_APP_2_INPUT_ANDA"; 
// ========================================================

// Helper untuk menampilkan/menyembunyikan bagian
function showSection(id) {
    document.querySelectorAll('section').forEach(sec => sec.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

// --- FUNGSI UTAMA PENGGANTI google.script.run (menggunakan Fetch API) ---
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

// --- HANDLER TOKEN CHECK ---
document.getElementById('tokenForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const msgEl = document.getElementById('token-message');
    msgEl.textContent = 'Memvalidasi token...';
    msgEl.style.color = 'orange';

    sendToGas(AUTH_WEB_APP_URL, 'tokenForm', 'btn-token')
        .then(data => {
            if (data.status === 'success') {
                msgEl.textContent = '✅ Token Valid. Silakan Login atau Daftar.';
                msgEl.style.color = 'green';
                
                // Simpan data sesi penting
                sessionStorage.setItem('temp_token', data.token); 
                sessionStorage.setItem('temp_sheetId', data.spreadsheetId);
                
                showSection('auth-section');
            } else {
                msgEl.textContent = `❌ ${data.message}`;
                msgEl.style.color = 'red';
            }
        })
        .catch(error => { msgEl.textContent = 'Error koneksi ke server.'; msgEl.style.color = 'red'; console.error(error); });
});

// --- HANDLER LOGIN ---
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const msgEl = document.getElementById('login-message');
    msgEl.textContent = 'Sedang Login...';
    msgEl.style.color = 'orange';
    
    sendToGas(AUTH_WEB_APP_URL, 'loginForm', 'btn-login')
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
        .catch(error => { msgEl.textContent = 'Error koneksi saat login.'; msgEl.style.color = 'red'; console.error(error); });
});

// --- HANDLER REGISTRASI ---
document.getElementById('registerForm').addEventListener('submit', function(e) {
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
                document.getElementById('register-container').style.display = 'none';
                document.getElementById('login-container').style.display = 'block';
            } else {
                msgEl.textContent = `❌ Gagal Mendaftar: ${data.message}`;
                msgEl.style.color = 'red';
            }
        });
});

// --- HANDLER INPUT NILAI ---
document.getElementById('inputNilaiForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const msgEl = document.getElementById('nilai-message');
    msgEl.textContent = 'Menyimpan nilai...';
    msgEl.style.color = 'orange';

    // Mengirim data ke Web App 2 (Input Data)
    sendToGas(INPUT_WEB_APP_URL, 'inputNilaiForm', 'btn-input-nilai')
        .then(data => {
            if (data.status === 'success') {
                msgEl.textContent = '✅ Nilai Berhasil Disimpan!';
                msgEl.style.color = 'green';
                document.getElementById('inputNilaiForm').reset(); // Reset form input nilai
            } else {
                msgEl.textContent = `❌ Gagal Simpan Nilai: ${data.message}`;
                msgEl.style.color = 'red';
            }
        })
        .catch(error => { msgEl.textContent = 'Error koneksi saat input nilai.'; msgEl.style.color = 'red'; console.error(error); });
});

// --- Logika Navigasi UI ---
document.getElementById('showRegister').addEventListener('click', function() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
});
document.getElementById('showLogin').addEventListener('click', function() {
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
});
document.getElementById('logout-button').addEventListener('click', function() {
    sessionStorage.clear();
    showSection('token-section');
    document.getElementById('token-message').textContent = 'Anda telah logout.';
    document.getElementById('token-message').style.color = 'green';
});

function loadDashboard(nama, sheetId, username) {
    showSection('dashboard-section');
    document.getElementById('user-display').textContent = nama;
    document.getElementById('sheet-id-display').textContent = sheetId;
    document.getElementById('nilai-sheet-id').value = sheetId;
    document.getElementById('nilai-email-guru').value = username; // Mengirim username sebagai email_guru untuk pencatatan
    
    // Hapus token sementara setelah berhasil login
    sessionStorage.removeItem('temp_token'); 
    sessionStorage.removeItem('temp_sheetId');
}

// --- Pengecekan Sesi Awal saat halaman dimuat ---
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('spreadsheetId')) {
         // Jika sudah ada sesi, langsung tampilkan dashboard
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

// ... (Bagian atas file app.js)

// 🚨 GANTI DENGAN URL WEB APP GAS ANDA 🚨
const AUTH_WEB_APP_URL = "URL_WEB_APP_1_AUTH_ANDA"; 
const INPUT_WEB_APP_URL = "URL_WEB_APP_2_INPUT_ANDA"; 
const DATA_GLOBAL_WEB_APP_URL = "URL_WEB_APP_3_DATA_GLOBAL_ANDA"; // <-- URL BARU
// ========================================================

let APP_DATA = { mapel: [], siswa: [], tahunAjaran: "", semester: "" }; // Global data container

// ... (Fungsi showSection dan sendToGas tetap sama)
// ... (Handler Token, Login, Registrasi, Input Nilai tetap sama)

// --- HANDLER BARU: Navigasi Dashboard ---
function setupNavigation() {
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            // Menampilkan section target dan menyembunyikan yang lain
            document.querySelectorAll('.app-section').forEach(sec => sec.style.display = 'none');
            document.getElementById(targetId).style.display = 'block';
        });
    });
}

// --- FUNGSI BARU: Memuat Data Dashboard ---
function loadDashboard(nama, sheetId, username) {
    showSection('dashboard-section'); // Asumsi Anda menyalin konten dashboard.html ke dalam dashboard-section di index.html
    // ATAU: Muat konten dashboard.html ke div container
    
    document.getElementById('user-display').textContent = nama;
    document.getElementById('sheet-id-display').textContent = sheetId; // Di index.html
    document.getElementById('nilai-sheet-id').value = sheetId;
    document.getElementById('nilai-email-guru').value = username;
    
    // PANGGIL WEB APP 3 UNTUK MEMUAT DATA GLOBAL
    const formData = new FormData();
    formData.append('spreadsheet_id', sheetId);

    fetch(DATA_GLOBAL_WEB_APP_URL, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            APP_DATA = data.data; // Simpan data global
            
            // Isi tampilan tahun ajaran
            document.getElementById('ta-display').textContent = APP_DATA.tahunAjaran;
            document.getElementById('sem-display').textContent = APP_DATA.semester;
            
            // Panggil fungsi untuk mengisi dropdown (Anda harus membuat fungsi ini)
            populateDropdowns(APP_DATA); 
            setupNavigation(); // Setup navigasi setelah data dimuat
            
            // Alihkan ke halaman input nilai (default)
            document.getElementById('input-nilai-section').style.display = 'block';

        } else {
            alert("Gagal memuat data global: " + data.message);
        }
    })
    .catch(error => { console.error("Error loading global data:", error); });

    // Hapus token sementara setelah berhasil login
    sessionStorage.removeItem('temp_token'); 
    sessionStorage.removeItem('temp_sheetId');
}


// --- FUNGSI BARU: Mengisi Dropdown ---
function populateDropdowns(data) {
    // 1. Dropdown Mapel (di form input nilai)
    const selectMapel = document.getElementById('input-mapel');
    data.mapel.forEach(mapel => {
        const opt = document.createElement('option');
        opt.value = mapel.id;
        opt.textContent = mapel.nama;
        selectMapel.appendChild(opt);
    });

    // 2. Dropdown Siswa (di form cetak rapor)
    const selectSiswaCetak = document.getElementById('cetak-siswa-single');
    // ... logic untuk mengisi dropdown siswa ...

    // 3. Dropdown Kelas (di form cetak leger)
    const selectKelas = document.getElementById('cetak-kelas');
    const kelasUnik = [...new Set(data.siswa.map(s => s.kelas))].filter(Boolean);
    kelasUnik.forEach(kelas => {
        const opt = document.createElement('option');
        opt.value = kelas;
        opt.textContent = kelas;
        selectKelas.appendChild(opt);
    });
    // ... dan seterusnya untuk semua dropdown yang Anda butuhkan
}

// ... (Pengecekan Sesi Awal tetap sama)
