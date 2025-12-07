/* =============================
   KONFIGURASI BACKEND
============================= */
const API_URL = "https://script.google.com/macros/s/AKfycbwemvo2D1gJHV2UCBTX7IzusTx2gO-20QK2tKqGbBRrdiAuEhSkpjLD9w6yUiLZl75LoQ/exec";  // Ganti dengan URL Web App Anda

/* =============================
   HELPER : POST REQUEST
============================= */
async function apiRequest(action, data = {}) {
    const payload = {
        action: action,
        ...data
    };

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
   LOGIN USER
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

    if (!response || !response.status) {
        alert(response?.message || "Login gagal!");
        return;
    }

    // Simpan data ke localStorage
    localStorage.setItem("username", response.username);
    localStorage.setItem("token_unik", response.token_unik);
    localStorage.setItem("spreadsheet_id", response.spreadsheet_id);

    // Arahkan ke dashboard
    window.location.href = "dashboard.html";
}

/* =============================
   REGISTRASI USER
============================= */
async function registerUser() {
    const token = document.getElementById("token").value.trim();
    const fullname = document.getElementById("fullname").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    if (!token || !fullname || !username || !password) {
        alert("Semua field wajib diisi!");
        return;
    }

    const response = await apiRequest("registerUser", {
        token_unik: token,
        nama_lengkap: fullname,
        username: username,
        password: password,
        role: role
    });

    if (!response.status) {
        alert(response.message);
        return;
    }

    alert("Registrasi berhasil! Silakan login.");
    window.location.href = "index.html";
}

/* =============================
   LOGIN MENGGUNAKAN TOKEN SEKOLAH
============================= */
async function loginToken() {
    const token = document.getElementById("schoolToken").value.trim();

    if (!token) {
        alert("Token sekolah wajib diisi!");
        return;
    }

    const response = await apiRequest("validateToken", { token_unik: token });

    if (!response.status) {
        alert(response.message);
        return;
    }

    // simpan info sekolah
    localStorage.setItem("token_unik", token);
    localStorage.setItem("spreadsheet_id", response.spreadsheet_id);

    alert("Token valid! Anda dapat melanjutkan registrasi.");
    window.location.href = "register.html";
}

/* =============================
   MEMUAT DASHBOARD DATA USER
============================= */
function loadDashboard() {
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token_unik");

    if (!username || !token) {
        alert("Anda belum login!");
        window.location.href = "index.html";
        return;
    }

    // Tampilkan nama user
    document.getElementById("username").innerText = username;

    // Load nama sekolah dari lisensi
    loadSchoolName();
}

/* =============================
   AMBIL NAMA SEKOLAH DARI LISENSI
============================= */
async function loadSchoolName() {
    const token = localStorage.getItem("token_unik");

    const response = await apiRequest("getLisensi", {
        token_unik: token
    });

    if (response.status) {
        document.getElementById("schoolName").innerText = response.nama_sekolah || "Sekolah";
    }
}

/* =============================
   LOGOUT
============================= */
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
