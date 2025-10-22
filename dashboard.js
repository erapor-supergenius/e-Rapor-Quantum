const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwZ7RLl5khzAy0IMGfgA5Oe9DdgmaNDtHIvf2iqjyyVgMRnOXMeHU5gz0lUahEfN3Wg/exec";

window.onload = async () => {
  const username = localStorage.getItem("username");
  const nama = localStorage.getItem("nama");
  if (!username) return (window.location.href = "index.html");

  document.getElementById("namaUser").textContent = nama || username;

  const token = localStorage.getItem("token_sesi");
  const res = await fetch(WEBAPP_URL, {
    method: "POST",
    body: JSON.stringify({ action: "validateToken", token_unik: token }),
  });
  const data = await res.json();
  if (!data.success) {
    Swal.fire("Sesi Habis", "Silakan login kembali.", "info");
    localStorage.clear();
    window.location.href = "index.html";
  }
};

async function logout() {
  const token = localStorage.getItem("token_sesi");
  await fetch(WEBAPP_URL, {
    method: "POST",
    body: JSON.stringify({ action: "logout", token_sesi: token }),
  });
  Swal.fire("Logout", "Anda telah keluar dari sistem.", "success");
  localStorage.clear();
  setTimeout(() => (window.location.href = "index.html"), 1000);
}
