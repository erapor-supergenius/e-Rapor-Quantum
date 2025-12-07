/* =============================
   KONFIGURASI BACKEND
============================= */
// Pastikan URL ini adalah URL Web App Apps Script terbaru Anda
const API_URL = "https://script.google.com/macros/s/AKfycbyIqR8Hc7-xU_lMurDgvhanBugmOoES_WvYfy13w58YAapkFqvMq-o3sCvfZWatK417Xg/exec";

/* =============================
   HELPER : POST REQUEST
============================= */
async function apiRequest(action, data = {}) {
    const payload = { action: action, ...data };

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" }
        });

        // Pastikan kita membaca respons JSON hanya jika status OK
        if (res.ok) {
            return await res.json();
        } else {
            // Jika status bukan OK (misalnya 404, 500)
            console.error(`HTTP Error Status: ${res.status}`);
            alert("Gagal terhubung ke server! (Status: " + res.status + ")");
            return null;
        }
        
    } catch (err) {
        // Ini menangkap TypeError: Failed to fetch (masalah koneksi/CORS)
        console.error("API Error:", err);
        alert("Gagal terhubung ke server! Token tidak valid! (Pastikan CORS di Apps Script sudah diatur)");
        return null;
    }
}

/* =============================
   LOGIN USER / GURU
============================= */
async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Username dan Password wajib diisi!");
        return;
    }

    const response = await apiRequest("loginUser", {
        username: username,
        password: password
    });

    if (!response || !response.success) {
        alert(response?.message || "Login gagal!");
        return;
    }

    // Data dari backend ada di response.data
    // Simpan session menggunakan data yang dikembalikan dari API
    localStorage.setItem("username", response.data.username);
    localStorage.setItem("token_unik", response.data.token_unik);
    localStorage.setItem("spreadsheet_id", response.data.spreadsheet_id);

    window.location.href = "dashboard.html";
}

/* =============================
   CEK TOKEN SEKOLAH (LANGKAH 1)
   ACTION DISESUAIKAN DENGAN BACKEND: validateToken
============================= */
async function checkToken() {
    const token = document.getElementById("schoolToken").value.trim();

    if (!token) {
        alert("Token sekolah wajib diisi!");
        return;
    }
    
    // Perbaikan 1: Ubah action dari "checkToken" menjadi "validateToken" 
    // agar sesuai dengan router di Google Apps Script (GS)
    const response = await apiRequest("validateToken", { token_unik: token });

    if (!response || !response.success) {
        // Ini adalah pesan error yang Anda lihat
        alert(response?.message || "Token tidak valid!"); 
        return;
    }

    // Perbaikan 2: Simpan token_unik (sesuai dengan nama kolom di Sheet)
    localStorage.setItem("token_unik", token); 

    alert("Token valid! Silakan isi form registrasi.");
    window.location.href = "register.html";
}

/* =============================
   REGISTRASI USER (LANGKAH 2)
============================= */
async function registerUser() {
    // Menggunakan token_unik yang sudah disimpan dari langkah checkToken
    const token = localStorage.getItem("token_unik"); 
    if (!token) {
        alert("Token tidak ditemukan! Silakan ulangi dari awal.");
        window.location.href = "index.html";
        return;
    }

    const fullname = document.getElementById("fullname").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!fullname || !username || !password) {
        alert("Semua field wajib diisi!");
        return;
    }

    const response = await apiRequest("registerUser", {
        token_unik: token,
        nama_lengkap: fullname,
        username: username,
        password: password
    });

    if (!response || !response.success) {
        alert(response?.message || "Registrasi gagal");
        return;
    }

    // Simpan session login otomatis
    // Data spreadsheet_id yang dikembalikan dari registerUser
    localStorage.setItem("username", username); 
    localStorage.setItem("token_unik", token);
    localStorage.setItem("spreadsheet_id", response.spreadsheet_id);

    alert("Registrasi berhasil! Anda otomatis menjadi ADMIN.");
    window.location.href = "dashboard.html";
}

/* =============================
   MEMUAT DASHBOARD
============================= */
function loadDashboard() {
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token_unik");

    if (!username || !token) {
        alert("Anda belum login!");
        window.location.href = "index.html";
        return;
    }

    // Pastikan elemen dengan ID 'username' ada di dashboard.html
    const usernameEl = document.getElementById("username");
    if(usernameEl) usernameEl.innerText = username;

    loadSchoolName();
}

/* =============================
   AMBIL NAMA SEKOLAH DARI DATABASE ADMIN
   ACTION DISESUAIKAN DENGAN BACKEND: validateToken
============================= */
async function loadSchoolName() {
    const token = localStorage.getItem("token_unik");
    if (!token) return;

    // Perbaikan 3: Ubah action dari "getLisensi" menjadi "validateToken"
    // Karena validateToken di backend mengembalikan data lisensi (termasuk nama sekolah)
    const response = await apiRequest("validateToken", { token_unik: token });

    if (response && response.success && response.data) {
        // Ambil data dari response.data.nama_sekolah
        const schoolNameEl = document.getElementById("schoolName");
        if(schoolNameEl) {
            schoolNameEl.innerText = 
                response.data.nama_sekolah || "Sekolah Tidak Dikenal";
        }
    }
}

/* =============================
   LOGOUT
============================= */
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
