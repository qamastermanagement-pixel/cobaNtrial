/* =========================
   GLOBAL STATE
========================= */
let selectedMasters = [];

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
    console.log("[v0] Form.js loaded");

    const basicForm = document.getElementById("basicInfoForm");
    const masterForm = document.getElementById("masterCheckForm");

    if (basicForm) {
        basicForm.addEventListener("submit", function (e) {
            e.preventDefault();
            goToStep2();
        });
    }

    if (masterForm) {
        masterForm.addEventListener("submit", function (e) {
            e.preventDefault();
            submitData();
        });
    }
});

/* =========================
   STEP NAVIGATION
========================= */
function goToStep1() {
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");

    if (step1) step1.classList.add("active");
    if (step2) step2.style.display = "none";
}

/* =========================
   STEP 2 : LOAD & RENDER
========================= */
function goToStep2() {
    const channelEl = document.getElementById("channel");
    const categoryEl = document.getElementById("category");

    if (!channelEl || !categoryEl) {
        alert("Element channel / category tidak ditemukan");
        return;
    }

    const channel = channelEl.value;
    const category = categoryEl.value;

    if (!channel || !category) {
        alert("Channel dan Kategori harus dipilih");
        return;
    }

    if (typeof MASTER_DATA === "undefined") {
        alert("MASTER_DATA belum dimuat (cek config.js)");
        return;
    }

    console.log("[Debug] Channel dipilih:", channel);

    // FILTER DATA
    selectedMasters = MASTER_DATA.filter(item =>
        String(item.channel) === String(channel) &&
        item.category.toLowerCase() === category.toLowerCase()
    );

    if (selectedMasters.length === 0) {
        alert("Master tidak ditemukan");
        return;
    }

    // INFO HEADER
    const channelSpan = document.getElementById("selectedChannel");
    const totalSpan = document.getElementById("totalMasters");

    if (!channelSpan || !totalSpan) {
        alert("Header info Step 2 tidak lengkap");
        return;
    }

    channelSpan.innerText = channel;
    totalSpan.innerText = selectedMasters.length;

    sessionStorage.setItem("displayedMasters", JSON.stringify(selectedMasters));

    // TAMPILKAN STEP 2 DULU (PENTING)
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");

    if (step1) step1.classList.remove("active");
    if (step2) step2.style.display = "block";

    renderMasterCards(selectedMasters);
}

/* =========================
   RENDER MASTER CARDS
========================= */
function renderMasterCards(masters) {
    const masterList = document.getElementById("masterList");

    if (!masterList) {
        console.error("Element #masterList tidak ditemukan");
        return;
    }

    masterList.innerHTML = "";

    masters.forEach((master, index) => {
        const card = document.createElement("div");
        card.className = "master-item";

        card.innerHTML = `
            <div class="master-item-header">
                <div class="master-name">
                    ${index + 1}. ${master.name} (${master.code})
                </div>
                <div class="status-buttons">
                    <button type="button" class="btn-ok" onclick="selectStatus(${index}, 'OK')">OK</button>
                    <button type="button" class="btn-ng" onclick="selectStatus(${index}, 'NG')">NG</button>
                </div>
            </div>

            <div class="remark-field" id="remark-${index}" style="display:none;">
                <label>Jenis Remark</label>
                <div class="remark-type-group">
                    <label>
                        <input type="radio" name="remarkType_${index}" value="numeric" checked>
                        Perubahan nilai pada master
                    </label>
                    <label>
                        <input type="radio" name="remarkType_${index}" value="text">
                        Lainnya
                    </label>
                </div>

                <div class="remark-input" id="numericInput_${index}">
                    <textarea placeholder="Isi angka / perubahan nilai"></textarea>
                </div>

                <div class="remark-input" id="textInput_${index}" style="display:none;">
                    <textarea placeholder="Isi keterangan"></textarea>
                </div>
            </div>
        `;

        masterList.appendChild(card);

        // TOGGLE REMARK TYPE
        document.querySelectorAll(`input[name="remarkType_${index}"]`).forEach(radio => {
            radio.addEventListener("change", function () {
                document.getElementById(`numericInput_${index}`).style.display =
                    this.value === "numeric" ? "block" : "none";
                document.getElementById(`textInput_${index}`).style.display =
                    this.value === "text" ? "block" : "none";
            });
        });
    });
}

/* =========================
   STATUS HANDLER
========================= */
function selectStatus(index, status) {
    const items = document.querySelectorAll(".master-item");
    const item = items[index];
    if (!item) return;

    const okBtn = item.querySelector(".btn-ok");
    const ngBtn = item.querySelector(".btn-ng");
    const remark = document.getElementById(`remark-${index}`);

    okBtn.classList.remove("active");
    ngBtn.classList.remove("active");

    if (status === "OK") {
        okBtn.classList.add("active");
        if (remark) remark.style.display = "none";
    } else {
        ngBtn.classList.add("active");
        if (remark) remark.style.display = "block";
    }
}

/* =========================
   SUBMIT DATA
========================= */
function submitData() {
    const masters = JSON.parse(sessionStorage.getItem("displayedMasters")) || [];
    const results = [];

    for (let i = 0; i < masters.length; i++) {
        const item = document.querySelectorAll(".master-item")[i];
        if (!item) continue;

        const okBtn = item.querySelector(".btn-ok");
        const ngBtn = item.querySelector(".btn-ng");

        let status = null;
        if (okBtn.classList.contains("active")) status = "OK";
        if (ngBtn.classList.contains("active")) status = "NG";

        if (!status) {
            alert(`Status belum dipilih: ${masters[i].name}`);
            return;
        }

        let remark = "";
        if (status === "NG") {
            const numericRadio = document.querySelector(`input[name="remarkType_${i}"][value="numeric"]`);
            const numericText = document.querySelector(`#numericInput_${i} textarea`);
            const textText = document.querySelector(`#textInput_${i} textarea`);

            remark = numericRadio.checked
                ? numericText.value.trim()
                : textText.value.trim();

            if (!remark) {
                alert(`Remark wajib diisi: ${masters[i].name}`);
                return;
            }
        }

        results.push({
            name: masters[i].name,
            code: masters[i].code,
            status,
            remark
        });
    }

    console.log("HASIL SUBMIT:", results);
    alert("Data valid. Silakan lanjutkan kirim ke backend.");
}
