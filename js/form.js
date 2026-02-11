// Ambil data master dari Google Sheets
let CHANNEL_MASTERS = {};

async function loadChannelMasters() {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbz0-nOeLgDb42iqu0Wz9dD-uUQ8BlpyygHmQs7s2ID1yBHzOspC72ORwdJaLOEYbtVN/exec'); // GANTI DENGAN URL WEB APP ANDA
    CHANNEL_MASTERS = await response.json();
    console.log("[v0] Data master berhasil dimuat dari Google Sheets:", CHANNEL_MASTERS);
  } catch (error) {
    console.error("[v0] Gagal memuat data master:", error);
    alert("Gagal memuat data master dari Google Sheets. Periksa koneksi internet atau hubungi admin.");
    // Fallback minimal (opsional)
    CHANNEL_MASTERS = {};
  }
}

// Panggil saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  loadChannelMasters().then(() => {
    // Setup event listeners dan lainnya...
    setupForm();
  });
});

// Pindahkan semua kode dalam DOMContentLoaded ke fungsi ini
function setupForm() {
  console.log("[v0] Form.js loaded");
  
  // Set today's date as default
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("tanggal").value = today;
  
  // ... (copy SEMUA kode dari dalam DOMContentLoaded yang lama ke sini)
  // Termasuk event listeners, goToStep2(), submitData(), dll.
}
