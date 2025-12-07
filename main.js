/* =============================
   KONFIGURASI BACKEND
============================= */
const API_URL = "https://script.google.com/macros/s/AKfycbwemvo2D1gJHV2UCBTX7IzusTx2gO-20QK2tKqGbBRrdiAuEhSkpjLD9w6yUiLZl75LoQ/exec";

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

        return await res.json();
    } catch (err) {
        console.error("API Error:", err);
        alert("Gagal terhubung ke server!");
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

    // Simpan session
    localStorage.setItem("username", response.username);
    localStorage.setItem("token_unik", response.token_unik);
    localStorage.setItem("spreadsheet_id", response.spreadsheet_id);

    window.location.href = "dashboard.html";
}

/* =============================
   CEK TOKEN SEKOLAH (LANGKAH 1)
============================= */
async function checkToken() {
    const token = document.getElementById("schoolToken").value.trim();

    if (!token) {
        alert("Token sekolah wajib diisi!");
        return;
    }

    const response = await apiRequest("checkToken", { token: token });

    if (!response || !response.success) {
        alert(response?.message || "Token tidak valid!");
        return;
    }

    // Simpan token untuk registrasi
    localStorage.setItem("token_sekolah", token);

    alert("Token valid! Silakan isi form registrasi.");
    window.location.href = "register.html";
}

/* =============================
   REGISTRASI USER (LANGKAH 2)
============================= */
async function registerUser() {
    const token = localStorage.getItem("token_sekolah");
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
        // role tidak dikirim → backend otomatis ADMIN
    });

    if (!response || !response.success) {
        alert(response?.message || "Registrasi gagal");
        return;
    }

    // Simpan session login otomatis
    localStorage.setItem("username", response.username);
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

    document.getElementById("username").innerText = username;

    loadSchoolName();
}

/* =============================
   AMBIL NAMA SEKOLAH DARI DATABASE ADMIN
============================= */
async function loadSchoolName() {
    const token = localStorage.getItem("token_unik");

    const response = await apiRequest("getLisensi", { token_unik: token });

    if (response && response.success) {
        document.getElementById("schoolName").innerText =
            response.nama_sekolah || "Sekolah";
    }
}

/* =============================
   LOGOUT
============================= */
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
