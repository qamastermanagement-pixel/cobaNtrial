function setupForm() {
  console.log("[v0] Form.js loaded");
  
  // 1. Set tanggal default
  const tanggalInput = document.getElementById("tanggal");
  if (tanggalInput) {
    const today = new Date().toISOString().split("T")[0];
    tanggalInput.value = today;
  }

  // 2. Ambil elemen dropdown Channel
  const channelSelect = document.getElementById("channel"); // Pastikan ID di HTML adalah "channel"
  
  if (!channelSelect) {
    console.error("Elemen dropdown channel tidak ditemukan!");
    return;
  }

  // 3. Isi dropdown Channel dari keys CHANNEL_MASTERS
  const daftarChannel = Object.keys(CHANNEL_MASTERS);
  
  // Kosongkan dan isi pilihan default
  channelSelect.innerHTML = '<option value="">-- Pilih Channel --</option>';
  
  if (daftarChannel.length > 0) {
    daftarChannel.forEach(ch => {
      let option = document.createElement("option");
      option.value = ch;
      option.text = ch;
      channelSelect.appendChild(option);
    });
    console.log("[v0] Dropdown channel berhasil diisi.");
  } else {
    console.warn("[v0] Data channel kosong. Cek Apps Script atau Koneksi.");
  }

  // 4. Tambahkan Event Listener jika ingin mengisi data lain otomatis (Optional)
  channelSelect.addEventListener("change", function() {
    const selectedChannel = this.value;
    console.log("Channel dipilih:", selectedChannel);
    
    // Jika kamu punya dropdown "Master Name" yang bergantung pada Channel:
    updateMasterNameDropdown(selectedChannel);
  });
}

// Fungsi tambahan untuk mengisi dropdown Master Name (Gauging)
function updateMasterNameDropdown(channelName) {
  const masterSelect = document.getElementById("master_name"); // Sesuaikan ID-nya
  if (!masterSelect) return;

  masterSelect.innerHTML = '<option value="">-- Pilih Master --</option>';

  if (CHANNEL_MASTERS[channelName] && CHANNEL_MASTERS[channelName].gauging) {
    CHANNEL_MASTERS[channelName].gauging.forEach(item => {
      let option = document.createElement("option");
      option.value = item.code; // Simpan kodenya sebagai value
      option.text = item.name;  // Tampilkan namanya
      masterSelect.appendChild(option);
    });
  }
}
