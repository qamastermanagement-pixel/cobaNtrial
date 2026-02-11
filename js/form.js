/* =========================
   GLOBAL STATE
========================= */
let selectedMasters = [];

/* =========================
   STEP NAVIGATION
========================= */
document.getElementById("basicInfoForm").addEventListener("submit", function (e) {
    e.preventDefault();
    goToStep2();
});

function goToStep1() {
    document.getElementById("step2").style.display = "none";
    document.getElementById("step1").classList.add("active");
}

/* =========================
   STEP 2 : RENDER MASTER
========================= */
function goToStep2() {
    const channel = document.getElementById("channel").value;
    const category = document.getElementById("category").value;

    if (!channel || !category) {
        alert("Channel dan Kategori harus dipilih");
        return;
    }

    // FILTER DATA DARI config.js
    selectedMasters = MASTER_DATA.filter(item =>
        item.channel == channel &&
        item.category.toLowerCase() === category.toLowerCase()
    );

    if (selectedMasters.length === 0) {
        alert("Master tidak ditemukan");
        return;
    }

    // INFO HEADER
    document.getElementById("selectedChannel").innerText = channel;
    document.getElementById("totalMasters").innerText = selectedMasters.length;

    // SIMPAN KE SESSION
    sessionStorage.setItem("displayedMasters", JSON.stringify(selectedMasters));

    renderMasterCards(selectedMasters);

    document.getElementById("step1").classList.remove("active");
    document.getElementById("step2").style.display = "block";
}

/* =========================
   RENDER MASTER CARD
========================= */
function renderMasterCards(masters) {
    const masterList = document.getElementById("masterList");
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

                <div class="remark-input numeric-input" id="numericInput_${index}">
                    <textarea placeholder="Isi angka / perubahan nilai"></textarea>
                </div>

                <div class="remark-input text-input" id="textInput_${index}" style="display:none;">
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

    const okBtn = item.querySelector(".btn-ok");
    const ngBtn = item.querySelector(".btn-ng");
    const remark = document.getElementById(`remark-${index}`);

    okBtn.classList.remove("active");
    ngBtn.classList.remove("active");

    if (status === "OK") {
        okBtn.classList.add("active");
        remark.style.display = "none";
    } else {
        ngBtn.classList.add("active");
        remark.style.display = "block";
    }
}

/* =========================
   SUBMIT DATA
========================= */
document.getElementById("masterCheckForm").addEventListener("submit", function (e) {
    e.preventDefault();
    submitData();
});

function submitData() {
    const masters = JSON.parse(sessionStorage.getItem("displayedMasters"));
    const results = [];

    for (let i = 0; i < masters.length; i++) {
        const item = document.querySelectorAll(".master-item")[i];
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

    alert("Data berhasil divalidasi (cek console)");
    // 👉 lanjutkan kirim ke backend / Apps Script
}
