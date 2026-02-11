/* =========================
   GLOBAL STATE
========================= */
let MASTER_DATA = [];
let selectedMasters = [];

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("[v0] Form.js loaded");

    // FETCH DATA SAAT AWAL
    await fetchMasterData();

    const basicForm = document.getElementById("basicInfoForm");
    const masterForm = document.getElementById("masterCheckForm");

    if (basicForm) {
        basicForm.addEventListener("submit", (e) => {
            e.preventDefault();
            goToStep2();
        });
    }

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
    document.getElementById("step2").style.display = "none";
}

/* =========================
   STEP 2
========================= */
function goToStep2() {
    const channel = document.getElementById("channel")?.value;
    const category = document.getElementById("category")?.value;

    if (!channel || !category) {
        alert("Channel dan Kategori harus dipilih");
        return;
    }

    selectedMasters = MASTER_DATA.filter(
        (m) =>
            String(m.channel) === String(channel) &&
            m.category.toLowerCase() === category.toLowerCase()
    );

    if (selectedMasters.length === 0) {
        alert("Master tidak ditemukan");
        return;
    }

    // === TAMPILKAN STEP 2 DULU ===
    document.getElementById("step1")?.classList.remove("active");
    document.getElementById("step2").style.display = "block";

    // === BARU SET INFO HEADER ===
    document.getElementById("selectedChannel").innerText = channel;
    document.getElementById("totalMasters").innerText = selectedMasters.length;

    sessionStorage.setItem(
        "displayedMasters",
        JSON.stringify(selectedMasters)
    );

    renderMasterCards(selectedMasters);
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
                    <button type="button" class="btn-ok" onclick="selectStatus(${i}, 'OK')">OK</button>
                    <button type="button" class="btn-ng" onclick="selectStatus(${i}, 'NG')">NG</button>
                </div>
            </div>

            <div class="remark-field" id="remark-${i}" style="display:none;">
                <label>Jenis Remark</label>
                <label>
                    <input type="radio" name="remarkType_${i}" value="numeric" checked>
                    Perubahan nilai
                </label>
                <label>
                    <input type="radio" name="remarkType_${i}" value="text">
                    Lainnya
                </label>

                <div id="numericInput_${i}">
                    <textarea></textarea>
                </div>
                <div id="textInput_${i}" style="display:none;">
                    <textarea></textarea>
                </div>
            </div>
        `;

        masterList.appendChild(div);

        document
            .querySelectorAll(`input[name="remarkType_${i}"]`)
            .forEach((r) =>
                r.addEventListener("change", () => {
                    document.getElementById(`numericInput_${i}`).style.display =
                        r.value === "numeric" ? "block" : "none";
                    document.getElementById(`textInput_${i}`).style.display =
                        r.value === "text" ? "block" : "none";
                })
            );
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

    ok.classList.remove("active");
    ng.classList.remove("active");

    if (status === "OK") {
        ok.classList.add("active");
        remark.style.display = "none";
    } else {
        ng.classList.add("active");
        remark.style.display = "block";
    }
}

/* =========================
   SUBMIT
========================= */
function submitData() {
    const masters =
        JSON.parse(sessionStorage.getItem("displayedMasters")) || [];

    const results = [];

    for (let i = 0; i < masters.length; i++) {
        const item = document.querySelectorAll(".master-item")[i];
        const ok = item.querySelector(".btn-ok").classList.contains("active");
        const ng = item.querySelector(".btn-ng").classList.contains("active");

        if (!ok && !ng) {
            alert(`Status belum dipilih: ${masters[i].name}`);
            return;
        }

        let remark = "";
        if (ng) {
            const isNumeric = document.querySelector(
                `input[name="remarkType_${i}"]:checked`
            ).value === "numeric";

            remark = isNumeric
                ? document.querySelector(`#numericInput_${i} textarea`).value
                : document.querySelector(`#textInput_${i} textarea`).value;

            if (!remark) {
                alert(`Remark wajib diisi: ${masters[i].name}`);
                return;
            }
        }

        results.push({
            ...masters[i],
            status: ok ? "OK" : "NG",
            remark,
        });
    }

    console.log("HASIL SUBMIT:", results);
    alert("Data valid, siap dikirim ke backend");
}
