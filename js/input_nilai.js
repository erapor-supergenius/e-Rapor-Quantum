// ===== Input Nilai JS =====
const BASE_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0";
const tbodySiswa = document.getElementById('tbodySiswa');
const formNilai = document.getElementById('formNilai');
const statusEl = document.getElementById('status');

// Fetch siswa
async function fetchSiswa() {
    try {
        const res = await axios.get(`${BASE_URL}?action=getSiswa`);
        const siswaList = res.data;

        tbodySiswa.innerHTML = siswaList.map((siswa, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${siswa.nama}</td>
                <td><input type="number" name="H1_${siswa.id}" min="0" max="100" required></td>
                <td><input type="number" name="H2_${siswa.id}" min="0" max="100" required></td>
                <td><input type="number" name="H3_${siswa.id}" min="0" max="100" required></td>
                <td><input type="number" name="H4_${siswa.id}" min="0" max="100" required></td>
            </tr>
        `).join('');

    } catch (err) {
        console.error("Error fetching siswa:", err);
        statusEl.textContent = "Gagal memuat data siswa.";
    }
}

// Submit nilai
formNilai.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formNilai);
    const payload = {};
    formData.forEach((value, key) => {
        payload[key] = parseFloat(value);
    });

    try {
        const res = await axios.post(BASE_URL, { action: 'saveNilai', data: payload });
        if(res.data.success) {
            statusEl.textContent = "Nilai berhasil disimpan!";
        } else {
            statusEl.textContent = "Gagal menyimpan nilai.";
        }
    } catch (err) {
        console.error("Error saving nilai:", err);
        statusEl.textContent = "Terjadi kesalahan saat menyimpan nilai.";
    }
});

// Inisialisasi
document.addEventListener('DOMContentLoaded', fetchSiswa);
