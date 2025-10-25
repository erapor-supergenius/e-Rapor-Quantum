// ========== KONFIGURASI DASAR ==========
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";
const TOKEN_SEKOLAH = localStorage.getItem("token_sekolah");

// ========== SIMPAN DATA GURU ==========
async function saveDataGuru() {
  const nama = document.getElementById("nama_guru").value.trim();
  const nip = document.getElementById("nip").value.trim();

  if (!nama) {
    Swal.fire("Peringatan", "Nama guru wajib diisi!", "warning");
    return;
  }

  const payload = {
    action: "handleSaveDataGuru",
    payload: {
      token_sekolah: TOKEN_SEKOLAH,
      data: [{ id_guru: generateAutoId("GURU"), nama_guru: nama, nip: nip }]
    }
  };

  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.success) {
      Swal.fire("Berhasil", result.message, "success");
      document.getElementById("formGuru").reset();
      loadDataGuru();
    } else {
      Swal.fire("Gagal", result.message, "error");
    }
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
}

// ========== MUAT DATA GURU ==========
async function loadDataGuru() {
  const payload = { action: "handleGetDataGuru", payload: { token_sekolah: TOKEN_SEKOLAH } };
  const tbody = document.querySelector("#tabelGuru tbody");
  tbody.innerHTML = "<tr><td colspan='4'>Memuat data...</td></tr>";

  try {
    const res = await fetch(WEBAPP_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.success) {
      tbody.innerHTML = "";
      result.data.forEach((guru, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${guru.nama_guru || "-"}</td>
          <td>${guru.nip || "-"}</td>
          <td>
            <button class="action-btn edit-btn" onclick="editGuru('${guru.nip}')">Edit</button>
            <button class="action-btn del-btn" onclick="hapusGuru('${guru.nip}')">Hapus</button>
          </td>`;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = "<tr><td colspan='4'>Tidak ada data guru.</td></tr>";
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan='4'>Error: ${err.message}</td></tr>`;
  }
}

// ========== EDIT & HAPUS ==========
function editGuru(nip) {
  const baris = [...document.querySelectorAll("#tabelGuru tbody tr")].find(tr => tr.cells[2].innerText === nip);
  if (!baris) return;
  document.getElementById("nama_guru").value = baris.cells[1].innerText;
  document.getElementById("nip").value = baris.cells[2].innerText;
  Swal.fire("Mode Edit", "Silakan ubah data dan klik Simpan.", "info");
}

function hapusGuru(nip) {
  Swal.fire({
    title: "Yakin hapus?",
    text: "Data guru ini akan dihapus!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  }).then((res) => {
    if (res.isConfirmed) {
      // TODO: Implementasi hapus di Apps Script nanti
      Swal.fire("Terhapus", "Data guru telah dihapus (fitur akan diaktifkan nanti).", "info");
    }
  });
}

// ========== UTILITY ID ==========
function generateAutoId(prefix) {
  return `${prefix}_${Date.now()}`;
}

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", loadDataGuru);
