/* =========================
   GLOBAL STATE
========================= */
let MASTER_DATA = [];
let selectedMasters = [];

/* =========================
   UPDATE BEARING TYPE OPTIONS
========================= */
function updateBearingTypeOptions() {
    const channel = document.getElementById("channel").value;
    const bearingSelect = document.getElementById("bearingType");

    if (!bearingSelect) return;

    // Reset dropdown
    bearingSelect.innerHTML = `<option value="">Pilih Tipe</option>`;

    if (!channel) return;

    // Ambil bearing unik berdasarkan channel
    const bearings = [
        ...new Set(
            MASTER_DATA
                .filter(m => String(m.channel) === String(channel))
                .map(m => m.bearingType)
                .filter(Boolean)
        )
    ];

    if (bearings.length === 0) {
        console.warn("Tidak ada bearing untuk channel:", channel);
        return;
    }

    bearings.forEach(bt => {
        const opt = document.createElement("option");
        opt.value = bt;
        opt.textContent = bt;
        bearingSelect.appendChild(opt);
    });

    console.log("[Debug] Bearing Type diisi:", bearings);
}

/* =========================
   CATEGORY CHANGE HANDLER
========================= */
function updateClearanceField() {
    const category = document.getElementById("category").value;
    const clearanceField = document.getElementById("clearanceField");
    
    if (category === "Clearance") {
        clearanceField.style.display = "block";
    } else {
        clearanceField.style.display = "none";
        document.getElementById("clearanceType").value = "";
    }
}

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("[v0] Form.js loaded");
    
    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("tanggal")?.value = today;

    await fetchMasterData();

    // Channel change listener
    const channelSelect = document.getElementById("channel");
    if (channelSelect) {
        channelSelect.addEventListener("change", updateBearingTypeOptions);

        if (channelSelect.value) {
            updateBearingTypeOptions();
        }
    }

    // Category change listener
    const categorySelect = document.getElementById("category");
    if (categorySelect) {
        categorySelect.addEventListener("change", updateClearanceField);
    }

    // Basic form submission
    const basicForm = document.getElementById("basicInfoForm");
    if (basicForm) {
        basicForm.addEventListener("submit", (e) => {
            e.preventDefault();
            goToStep2();
        });
    }
    
    // Master check form submission
    const masterForm = document.getElementById("masterCheckForm");
    if (masterForm) {
        masterForm.addEventListener("submit", (e) => {
            e.preventDefault();
            submitData();
        });
    }
});

/* =========================
   FETCH MASTER DATA (CSV)
========================= */
async function fetchMasterData() {
    const loadingModal = document.getElementById("loadingModal");
    if (loadingModal) loadingModal.classList.add("show");

    try {
        const url =
            window.CONFIG?.MASTER_DATA_URL ||
            "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrVEMf_DG702fbz5Gy12__YvNYc1lNXTW-gFcZbV5J0NSndYYvjQb_HmjsEWImsZBLAEZqlTs9eLDh/pub?gid=0&single=true&output=csv";

        console.log("[v0] Memuat data master dari Sheets...");
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const csv = await response.text();
        const rows = csv.split("\n");

        MASTER_DATA = [];

        const clean = (s) =>
            s ? s.replace(/(^"|"$)/g, "").trim() : "";

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(",");
            if (cols.length < 5) continue;

            MASTER_DATA.push({
                channel: clean(cols[0]),
                bearingType: clean(cols[1]),
                category: clean(cols[2]),
                name: clean(cols[3]),
                code: clean(cols[4]),
            });
        }

        console.log("[v0] Data master berhasil dimuat:", MASTER_DATA.length, "baris");
    } catch (err) {
        console.error(err);
        alert("Gagal memuat data master");
    } finally {
        if (loadingModal) loadingModal.classList.remove("show");
    }
}

/* =========================
   STEP NAVIGATION
========================= */
function goToStep1() {
    document.getElementById("step1")?.classList.add("active");
    document.getElementById("step2")?.classList.remove("active");
}

/* =========================
   STEP 2 - GO TO MASTER CHECK
========================= */
function goToStep2() {
    console.log("[v0] goToStep2 function called");
    
    const tanggal = document.getElementById("tanggal")?.value;
    const shift = document.getElementById("shift")?.value;
    const npk = document.getElementById("npk")?.value;
    const channel = document.getElementById("channel")?.value;
    const bearingType = document.getElementById("bearingType")?.value;
    const category = document.getElementById("category")?.value;

    // --- Tambahkan: field clearanceType jika dipilih ---
    let clearanceType = "";
    if (category === "Clearance") {
        clearanceType = document.getElementById("clearanceType")?.value;
        if (!clearanceType) {
            alert("Pilih tipe clearance yang sedang running!");
            return;
        }
    }

    if (!tanggal || !shift || !npk || !channel || !bearingType || !category) {
        alert("Semua field harus diisi!");
        return;
    }

    // --- Simpan ke sessionStorage ---
    sessionStorage.setItem("tanggal", tanggal);
    sessionStorage.setItem("shift", shift);
    sessionStorage.setItem("npk", npk);
    sessionStorage.setItem("channel", channel);
    sessionStorage.setItem("bearingType", bearingType);
    
    // ✅ PENTING: Simpan kategori asli sebagai "Pokayoke" jika pilih Clearance
    const actualCategory = (category === "Clearance") ? "Pokayoke" : category;
    sessionStorage.setItem("category", actualCategory);

    // Display selected channel info
    document.getElementById("selectedChannel").textContent = channel;

    // --- Ambil data master ---
    let masters;

    if (category === "Clearance") {
        // Ambil dari Pokayoke
        const pokayokeMasters = MASTER_DATA.filter(m =>
            String(m.channel) === String(channel) &&
            String(m.bearingType) === String(bearingType) &&
            m.category.toLowerCase() === "pokayoke"
        );
        
        if (!pokayokeMasters || pokayokeMasters.length === 0) {
            alert("Data Pokayoke tidak ditemukan!");
            return;
        }

        // Filter hanya clearance
        const clearanceItems = pokayokeMasters.filter(item =>
            /Clearance Check - (C2|Cn|C3|C4|C5)/.test(item.name)
        );

        // Mapping
        const map = {};
        clearanceItems.forEach(item => {
            const match = item.name.match(/Clearance Check - (C2|Cn|C3|C4|C5)/);
            if (match) map[match[1]] = item;
        });

        const order = ["C2", "Cn", "C3", "C4", "C5"];
        const idx = order.indexOf(clearanceType);
        if (idx === -1) {
            alert("Tipe clearance tidak valid!");
            return;
        }

        masters = [];
        if (idx > 0 && map[order[idx - 1]]) masters.push(map[order[idx - 1]]);
        if (map[clearanceType]) masters.push(map[clearanceType]);
        if (idx < order.length - 1 && map[order[idx + 1]]) masters.push(map[order[idx + 1]]);

    } else {
        // Kategori biasa
        let rawMasters = MASTER_DATA.filter(m =>
            String(m.channel) === String(channel) &&
            String(m.bearingType) === String(bearingType) &&
            m.category.toLowerCase() === category.toLowerCase()
        );
        
        if (!rawMasters || rawMasters.length === 0) {
            masters = [];
        } else if (category === "Pokayoke") {
            // 🔥 FILTER: HILANGKAN SEMUA "Clearance Check"
            masters = rawMasters.filter(item =>
                !/Clearance Check - (C2|Cn|C3|C4|C5)/.test(item.name)
            );
        } else {
            masters = rawMasters;
        }
    }
    
    if (!masters || masters.length === 0) {
        alert(`Data master tidak ditemukan untuk kategori ${category}!`);
        return;
    }

    document.getElementById("totalMasters").textContent = masters.length;

    // Render master cards
    renderMasterCards(masters);

    // Simpan daftar master yang ditampilkan (termasuk hasil filter Clearance)
    sessionStorage.setItem("displayedMasters", JSON.stringify(masters));

    // Switch to step 2
    document.getElementById("step1")?.classList.remove("active");
    document.getElementById("step2")?.classList.add("active");
}

/* =========================
   RENDER MASTER CARDS
========================= */
function renderMasterCards(masters) {
    const masterList = document.getElementById("masterList");
    if (!masterList) return;

    masterList.innerHTML = "";

    masters.forEach((m, i) => {
        const div = document.createElement("div");
        div.className = "master-item";

        div.innerHTML = `
            <div class="master-item-header">
                <div class="master-name">
                    ${i + 1}. ${m.name} (${m.code})
                </div>
                <div class="status-buttons">
                    <button type="button" class="btn-ok" onclick="selectStatus(${i}, 'OK')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        OK
                    </button>
                    <button type="button" class="btn-ng" onclick="selectStatus(${i}, 'NG')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        NG
                    </button>
                </div>
            </div>

            <div class="remark-field" id="remark-${i}" style="display:none;">
                <label class="form-label">Jenis Remark</label>
                <div class="remark-type-group">
                    <label>
                        <input type="radio" name="remarkType_${i}" value="numeric" checked>
                        Perubahan nilai pada master
                    </label>
                    <label>
                        <input type="radio" name="remarkType_${i}" value="text">
                        Lainnya: Keterangan
                    </label>
                </div>

                <!-- Numeric remark -->
                <div class="remark-input numeric-input" id="numericInput_${i}">
                    <textarea class="remark-textarea" 
                        placeholder="Remark hanya boleh diisi jika ada perubahan nilai numerik pada master"></textarea>
                    <small class="error-msg" id="errorNumeric_${i}" style="color:red; display:none;"></small>
                </div>

                <!-- Text remark -->
                <div class="remark-input text-input" id="textInput_${i}" style="display:none;">
                    <textarea class="remark-textarea" 
                        placeholder="Remark diisi jika NG, dapat berupa problem yang terjadi. Tapi bukan perubahan nilai!"></textarea>
                </div>
            </div>
        `;

        masterList.appendChild(div);

        // Tambahkan event listener untuk toggle remark type
        document.querySelectorAll(`input[name="remarkType_${i}"]`).forEach(radio => {
            radio.addEventListener("change", function() {
                const numericDiv = document.getElementById(`numericInput_${i}`);
                const textDiv = document.getElementById(`textInput_${i}`);
                const errorDiv = document.getElementById(`errorNumeric_${i}`);

                if (this.value === "numeric") {
                    numericDiv.style.display = "block";
                    textDiv.style.display = "none";
                    if (errorDiv) errorDiv.style.display = "none";
                } else {
                    numericDiv.style.display = "none";
                    textDiv.style.display = "block";
                    if (errorDiv) errorDiv.style.display = "none";
                }
            });
        });
    });
}

/* =========================
   STATUS HANDLER
========================= */
function selectStatus(i, status) {
    const item = document.querySelectorAll(".master-item")[i];
    if (!item) return;

    const ok = item.querySelector(".btn-ok");
    const ng = item.querySelector(".btn-ng");
    const remark = document.getElementById(`remark-${i}`);
    const errorDiv = document.getElementById(`errorNumeric_${i}`);

    ok.classList.remove("active");
    ng.classList.remove("active");

    if (status === "OK") {
        ok.classList.add("active");
        remark.style.display = "none";
        
        // Reset ke opsi default (numeric)
        const numericRadio = document.querySelector(`input[name="remarkType_${i}"][value="numeric"]`);
        if (numericRadio) numericRadio.checked = true;
        
        // Sembunyikan error
        if (errorDiv) errorDiv.style.display = "none";
    } else {
        ng.classList.add("active");
        remark.style.display = "block";
        
        // Default ke "numeric"
        const numericRadio = document.querySelector(`input[name="remarkType_${i}"][value="numeric"]`);
        if (numericRadio) numericRadio.checked = true;
        
        // Trigger tampilan numeric
        const numericDiv = document.getElementById(`numericInput_${i}`);
        const textDiv = document.getElementById(`textInput_${i}`);
        if (numericDiv) numericDiv.style.display = "block";
        if (textDiv) textDiv.style.display = "none";
        
        if (errorDiv) errorDiv.style.display = "none";
    }
}

/* =========================
   SUBMIT DATA
========================= */
async function submitData() {
    const masters = JSON.parse(sessionStorage.getItem("displayedMasters"));
    
    if (!masters || !Array.isArray(masters)) {
        alert("Data master tidak valid. Silakan ulangi.");
        return;
    }

    console.log("[v0] Submitting data...");
    
    const masterResults = [];

    for (let i = 0; i < masters.length; i++) {
        const item = document.querySelectorAll(".master-item")[i];
        const ok = item.querySelector(".btn-ok");
        const ng = item.querySelector(".btn-ng");
        
        const status = ok.classList.contains("active") ? "OK" : 
                      ng.classList.contains("active") ? "NG" : null;

        if (!status) {
            const masterDisplay = `${masters[i].name} (${masters[i].code})`;
            alert(`Mohon pilih status untuk ${masterDisplay}`);
            return;
        }

        let remark = "";
        if (status === "NG") {
            const masterDisplay = `${masters[i].name} (${masters[i].code})`;
            const numericRadio = document.querySelector(`input[name="remarkType_${i}"][value="numeric"]`);
            const textRadio = document.querySelector(`input[name="remarkType_${i}"][value="text"]`);
            const numericTextarea = document.getElementById(`numericInput_${i}`)?.querySelector("textarea");
            const textTextarea = document.getElementById(`textInput_${i}`)?.querySelector("textarea");
            const errorDiv = document.getElementById(`errorNumeric_${i}`);
            
            if (numericRadio?.checked) {
                remark = numericTextarea?.value.trim() || "";
                if (!remark) {
                    if (errorDiv) {
                        errorDiv.textContent = "Wajib diisi karena memilih 'Perubahan nilai pada master'";
                        errorDiv.style.display = "block";
                    }
                    alert(`Mohon isi remark untuk ${masterDisplay}`);
                    return;
                }

                // Validasi format angka
                const singleNum = /^[-+]?\d*\.?\d+$/;
                const numList = /^([-+]?\d*\.?\d+)(;[-+]?\d*\.?\d+)*$/;

                if (!singleNum.test(remark) && !numList.test(remark)) {
                    if (errorDiv) {
                        errorDiv.textContent = "Hanya boleh angka (misal: 0, -1, +3, atau -9;-10;-11)";
                        errorDiv.style.display = "block";
                    }
                    alert(`Format remark tidak valid untuk ${masterDisplay}`);
                    return;
                }
                if (errorDiv) errorDiv.style.display = "none";

            } else if (textRadio?.checked) {
                remark = textTextarea?.value.trim() || "";
            }
        }

        masterResults.push({
            name: masters[i].name,
            code: masters[i].code,
            status: status,
            remark: remark,
        });
    }

    // Prepare data to send
    const data = {
        tanggal: sessionStorage.getItem("tanggal"),
        shift: sessionStorage.getItem("shift"),
        npk: sessionStorage.getItem("npk"),
        channel: `Channel ${sessionStorage.getItem("channel")}`,
        bearingType: sessionStorage.getItem("bearingType"),
        category: sessionStorage.getItem("category"),
        masters: masterResults,
    };

    console.log("[v0] Data to send:", JSON.stringify(data, null, 2));

    const appsScriptUrl = window.CONFIG
        ? window.CONFIG.APPS_SCRIPT_URL
        : "https://script.google.com/macros/s/AKfycbytpHuYFDR_G-sugVMYFVpEbw1uQObHt68HiiRsuo01YybVLh_otjhjW971CO9QrH5gtA/exec";

    console.log("[v0] Apps Script URL:", appsScriptUrl);

    // Show loading modal
    const loadingModal = document.getElementById("loadingModal");
    if (loadingModal) loadingModal.classList.add("show");

    try {
        // Send data to Google Apps Script
        const response = await fetch(appsScriptUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(data),
        });

        console.log("[v0] Response status:", response.status);
        const result = await response.text();
        console.log("[v0] Response:", result);

        // Hide loading modal
        if (loadingModal) loadingModal.classList.remove("show");

        // Show success message
        alert("Data berhasil disimpan ke Google Sheets!");

        // Clear session storage
        sessionStorage.clear();

        // Redirect to dashboard
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("[v0] Error:", error);
        if (loadingModal) loadingModal.classList.remove("show");
        alert("Gagal menyimpan data. Silakan coba lagi. Error: " + error.message);
    }
}
