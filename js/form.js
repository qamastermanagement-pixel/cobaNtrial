let MASTER_DATA = [];

async function loadMasterData() {
    try {
        const response = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vTrVEMf_DG702fbz5Gy12__YvNYc1lNXTW-gFcZbV5J0NSndYYvjQb_HmjsEWImsZBLAEZqlTs9eLDh/pub?gid=0&single=true&output=csv");
        const text = await response.text();

        const rows = text.split("\n").slice(1);

        MASTER_DATA = rows.map(row => {
            const cols = row.split(",");
            return {
                channel: cols[0]?.trim(),
                bearingType: cols[1]?.trim(),
                category: cols[2]?.trim(),
                name: cols[3]?.trim()
            };
        });

        console.log("MASTER LOADED:", MASTER_DATA);
    } catch (err) {
        console.error("Error load master:", err);
    }
}

document.addEventListener("DOMContentLoaded", async () => {

    await loadMasterData();

    // set tanggal otomatis
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("tanggal").value = today;

    const channelSelect = document.getElementById("channel");
    const bearingSelect = document.getElementById("bearingType");

    channelSelect.addEventListener("change", () => {

        const channel = channelSelect.value;
        bearingSelect.innerHTML = '<option value="">Pilih Tipe Bearing</option>';

        const filtered = MASTER_DATA.filter(item => item.channel === channel);
        const uniqueBearings = [...new Set(filtered.map(item => item.bearingType))];

        uniqueBearings.forEach(type => {
            const opt = document.createElement("option");
            opt.value = type;
            opt.textContent = type;
            bearingSelect.appendChild(opt);
        });
    });

});

function goToStep2() {

    const channel = document.getElementById("channel").value;
    const bearingType = document.getElementById("bearingType").value;
    const category = document.getElementById("category").value;

    if (!channel || !bearingType || !category) {
        alert("Lengkapi semua field!");
        return;
    }

    let masters = MASTER_DATA.filter(item =>
        item.channel === channel &&
        item.bearingType === bearingType &&
        (
            category === "Clearance"
                ? item.category === "Pokayoke" &&
                  /Clearance Check - (C2|Cn|C3|C4|C5)/.test(item.name)
                : item.category === category
        )
    );

    if (category === "Pokayoke") {
        masters = masters.filter(item =>
            !/Clearance Check - (C2|Cn|C3|C4|C5)/.test(item.name)
        );
    }

    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    masters.forEach((item, index) => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>
                <select>
                    <option value="">Pilih</option>
                    <option value="OK">OK</option>
                    <option value="NG">NG</option>
                </select>
            </td>
            <td><input type="text" placeholder="Remark"></td>
        `;

        tableBody.appendChild(row);
    });

    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
}
