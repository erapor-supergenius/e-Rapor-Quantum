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
