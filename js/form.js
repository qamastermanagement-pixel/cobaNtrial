// ==========================================
// 1. DEKLARASI DATA MASTER (KOSONG)
// ==========================================
// Data ini akan diisi secara dinamis dari Google Sheets (CSV)
let MASTER_DATA = [];

// ==========================================
// 2. FUNGSI FETCH DATA DARI GOOGLE SHEETS
// ==========================================
async function fetchMasterData() {
    const loadingModal = document.getElementById("loadingModal");
    if (loadingModal) loadingModal.classList.add("show");
    
    try {
        // Link CSV dari Google Sheets yang di-publish
        const masterDataUrl = window.CONFIG?.MASTER_DATA_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrVEMf_DG702fbz5Gy12__YvNYc1lNXTW-gFcZbV5J0NSndYYvjQb_HmjsEWImsZBLAEZqlTs9eLDh/pub?gid=0&single=true&output=csv";
        
        console.log("[v0] Memuat data master dari Sheets...");
        const response = await fetch(masterDataUrl);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        // Membaca response sebagai teks (karena formatnya CSV, bukan JSON)
        const csvText = await response.text();
        
        // Parsing CSV menjadi Array of Objects
        // Asumsi format kolom: Channel, BearingType, Category, Name, Code
        const rows = csvText.split('\n');
        MASTER_DATA = [];
        
        // Mulai dari i = 1 untuk mengabaikan baris Header
        for (let i = 1; i < rows.length; i++) { 
            const rowText = rows[i].trim();
            if (!rowText) continue; // Lewati baris kosong
            
            // Pisahkan berdasarkan koma (asumsi tidak ada koma di dalam nama/teks)
            const cols = rowText.split(','); 
            
            MASTER_DATA.push({
                channel: cols[0] ? cols[0].trim() : "",
                bearingType: cols[1] ? cols[1].trim() : "",
                category: cols[2] ? cols[2].trim() : "",
                name: cols[3] ? cols[3].trim() : "",
                code: cols[4] ? cols[4].trim() : ""
            });
        }
        
        console.log("[v0] Data master berhasil dimuat:", MASTER_DATA.length, "baris");
        
    } catch (error) {
        console.error("[v0] Error fetching master data:", error);
        alert("Gagal memuat data master dari Google Sheets. Pastikan koneksi internet stabil.");
    } finally {
        if (loadingModal) loadingModal.classList.remove("show");
    }
}

// ==========================================
// 3. INISIALISASI & EVENT LISTENER (SAAT HALAMAN DIMUAT)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("[v0] Form.js loaded");

    // Tunggu sampai data master selesai dimuat sebelum user bisa berinteraksi
    await fetchMasterData();

    // Set tanggal hari ini sebagai default
    const today = new Date().toISOString().split("T")[0];
    const tanggalInput = document.getElementById("tanggal");
    if (tanggalInput) tanggalInput.value = today;

    // Handle form Step 1 (Basic Info)
    document.getElementById("basicInfoForm").addEventListener("submit", (e) => {
        e.preventDefault();
        goToStep2();
    });

    // Handle form Step 2 (Master Check Form / Tabel Data)
    document.getElementById("masterCheckForm").addEventListener("submit", (e) => {
        e.preventDefault();
        submitData();
    });

    // Handle Dropdown Channel -> Filter Bearing Type
    document.getElementById("channel").addEventListener("change", function () {
        const selectedChannel = this.value;
        const bearingSelect = document.getElementById("bearingType");
        bearingSelect.innerHTML = '<option value="">--Pilih Tipe--</option>';

        if (MASTER_DATA.length === 0) {
            alert("Data master belum termuat, silakan refresh halaman.");
            return;
        }

        // Cari tipe bearing yang spesifik untuk channel yang dipilih
        const uniqueBearings = [...new Set(
            MASTER_DATA
                .filter(item => item.channel === selectedChannel)
                .map(item => item.bearingType)
        )];

        uniqueBearings.forEach(type => {
            const opt = document.createElement("option");
            opt.value = type;
            opt.textContent = type;
            bearingSelect.appendChild(opt);
        });
    });

    // Handle Toggle Kategori Clearance
    document.getElementById("category").addEventListener("change", function () {
        const field = document.getElementById("clearanceField");
        if (!field) return;

        if (this.value === "Clearance") {
            field.style.display = "block";
        } else {
            field.style.display = "none";
            const clType = document.getElementById("clearanceType");
            if (clType) clType.value = "";
        }
    });
});

// ==========================================
// 4. LOGIKA PINDAH KE STEP 2 (MEMBENTUK TABEL HTML)
// ==========================================
function goToStep2() {
    const tanggal = document.getElementById("tanggal").value;
    const shift = document.getElementById("shift").value;
    const npk = document.getElementById("npk").value;
    const channel = document.getElementById("channel").value;
    const bearingType = document.getElementById("bearingType").value;
    const category = document.getElementById("category").value;

    if (!tanggal || !shift || !npk || !channel || !bearingType || !category) {
        alert("Lengkapi semua field informasi dasar!");
        return;
    }

    // Simpan ke Session Storage untuk keperluan saat submit nanti
    sessionStorage.setItem("tanggal", tanggal);
    sessionStorage.setItem("shift", shift);
    sessionStorage.setItem("npk", npk);
    sessionStorage.setItem("channel", channel);
    sessionStorage.setItem("bearingType", bearingType);
    
    // Jika user memilih Clearance, kita simpan secara sistem sebagai "Pokayoke"
    const actualCategory = (category === "Clearance") ? "Pokayoke" : category;
    sessionStorage.setItem("category", actualCategory);

    // Filter data master dari array
    let masters = MASTER_DATA.filter(item =>
        item.channel === channel &&
        item.bearingType === bearingType &&
        (
            category === "Clearance"
                ? item.category === "Pokayoke" && /Clearance Check - (C2|Cn|C3|C4|C5)/.test(item.name)
                : item.category === category
        )
    );

    // Jika pilih Pokayoke biasa, saring dan hilangkan item Clearance
    if (category === "Pokayoke") {
        masters = masters.filter(item =>
            !/Clearance Check - (C2|Cn|C3|C4|C5)/.test(item.name)
        );
    }

    if (masters.length === 0) {
        alert(`Data master tidak ditemukan untuk Channel ${channel}, Tipe ${bearingType}, Kategori ${category}!`);
        return;
    }

    // Tampilkan informasi ke UI
    const selectedChannelEl = document.getElementById("selectedChannel");
    if (selectedChannelEl) selectedChannelEl.textContent = channel;
    
    const totalMastersEl = document.getElementById("totalMasters");
    if (totalMastersEl) totalMastersEl.textContent = masters.length;

    // Render ke dalam Tabel (Table Body)
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    masters.forEach((item, index) => {
        const row = document.createElement("tr");
        
        // Simpan metadata ke elemen baris (dataset) agar mudah diambil saat submit
        row.dataset.code = item.code;
        row.dataset.name = item.name;

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name} <br><small>(${item.code})</small></td>
            <td>
                <select class="status-select" required>
                    <option value="">Pilih</option>
                    <option value="OK">OK</option>
                    <option value="NG">NG</option>
                </select>
            </td>
            <td>
                <input type="text" class="remark-input" placeholder="Isi remark jika NG
