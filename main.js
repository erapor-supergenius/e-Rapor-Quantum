const API_URL = "YOUR_WEBAPP_URL_HERE";  // <--- GANTI

// Request umum
async function api(action, data = {}) {
    const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action, ...data }),
        headers: { "Content-Type": "application/json" }
    });

    return res.json();
}

/*************************************************
 * LOGIN
 *************************************************/
async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const result = await api("login", { username, password });

    if (!result.success) {
        alert(result.message);
        return;
    }

    localStorage.setItem("userData", JSON.stringify(result));
    location.href = "dashboard.html";
}

/*************************************************
 * REGISTRASI
 *************************************************/
async function registerUser() {
    const token = document.getElementById("token").value;
    const nama = document.getElementById("nama").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const result = await api("register", { token, nama, username, password });

    alert(result.message);
}

/*************************************************
 * DASHBOARD — Load user info
 *************************************************/
window.onload = function () {
    if (location.pathname.includes("dashboard")) {
        const user = JSON.parse(localStorage.getItem("userData"));
        if (!user) {
            location.href = "index.html";
            return;
        }
        document.getElementById("namaUser").innerText = user.nama_lengkap;
    }
};

/*************************************************
 * Ambil Pengaturan Global (tahun ajaran & semester)
 *************************************************/
async function getPengaturan() {
    const res = await api("getGlobal");
    document.getElementById("infoSekolah").innerHTML =
        `<p>Tahun Ajaran Aktif: <b>${res.tahun_ajaran_aktif}</b></p>
         <p>Semester Aktif: <b>${res.semester_aktif}</b></p>`;
}

/*************************************************
 * LOGOUT
 *************************************************/
function logout() {
    localStorage.removeItem("userData");
    location.href = "index.html";
}
