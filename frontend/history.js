const tbody = document.getElementById("ui-history-tbody");
const table = document.getElementById("ui-history-table");
const emptyState = document.getElementById("ui-history-empty");
const searchInput = document.getElementById("history-search");
const toast = document.getElementById("toast-notification");
const toastMsg = document.getElementById("toast-message");

let patientCases = [];

// Load cases from localStorage
function loadCases() {
    const rawData = localStorage.getItem("patientHistory");
    if (rawData) {
        try {
            patientCases = JSON.parse(rawData);
        } catch (e) {
            console.error("Failed to parse cases history: ", e);
            patientCases = [];
        }
    } else {
        patientCases = [];
    }
}

// Show feedback notification
function showToast(message) {
    if (!toast) return;
    toastMsg.textContent = message;
    toast.classList.add("active");
    setTimeout(() => {
        toast.classList.remove("active");
    }, 2500);
}

// Format date nicely
function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Render historical cases table
function renderTable(filterQuery = "") {
    tbody.innerHTML = "";
    loadCases();

    // Sort cases by date descending (latest first)
    patientCases.sort((a, b) => new Date(b.dateSaved) - new Date(a.dateSaved));

    const query = filterQuery.toLowerCase().trim();
    const filteredCases = patientCases.filter(c => {
        const name = (c.demographics.name || "").toLowerCase();
        const mrn = (c.demographics.mrn || "").toLowerCase();
        return name.includes(query) || mrn.includes(query);
    });

    if (filteredCases.length === 0) {
        table.style.display = "none";
        emptyState.style.display = "flex";
        return;
    }

    table.style.display = "table";
    emptyState.style.display = "none";

    filteredCases.forEach((c, idx) => {
        const tr = document.createElement("tr");

        // Patient Name
        const tdName = document.createElement("td");
        tdName.style.fontWeight = "600";
        tdName.style.color = "#ffffff";
        tdName.textContent = c.demographics.name || "Unknown Patient";
        tr.appendChild(tdName);

        // Record ID
        const tdMrn = document.createElement("td");
        tdMrn.textContent = c.demographics.mrn || "N/A";
        tr.appendChild(tdMrn);

        // Date Saved
        const tdDate = document.createElement("td");
        tdDate.textContent = formatDate(c.dateSaved);
        tr.appendChild(tdDate);

        // Risk Score
        const tdScore = document.createElement("td");
        tdScore.style.fontFamily = "var(--font-heading)";
        tdScore.style.fontWeight = "700";
        tdScore.textContent = `${c.prediction.risk_percentage}%`;
        tr.appendChild(tdScore);

        // Risk Pill
        const tdStatus = document.createElement("td");
        const pill = document.createElement("span");
        pill.className = `status-pill ${c.prediction.is_high_risk ? 'high' : 'low'}`;
        pill.textContent = c.prediction.is_high_risk ? "High Risk" : "Normal";
        tdStatus.appendChild(pill);
        tr.appendChild(tdStatus);

        // Actions
        const tdActions = document.createElement("td");
        tdActions.className = "text-right";

        // Load Button
        const loadBtn = document.createElement("button");
        loadBtn.type = "button";
        loadBtn.className = "load-row-btn";
        loadBtn.title = "View Clinical Report";
        loadBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        loadBtn.addEventListener("click", () => {
            // Load this case as the active report
            localStorage.setItem("latestReport", JSON.stringify({
                payload: c.payload,
                prediction: c.prediction,
                explainability: c.explainability,
                demographics: c.demographics
            }));
            window.location.href = "/report";
        });
        tdActions.appendChild(loadBtn);

        // Delete Button
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-row-btn";
        deleteBtn.title = "Delete Case";
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        deleteBtn.addEventListener("click", () => {
            if (confirm(`Are you sure you want to delete patient case record for ${c.demographics.name}?`)) {
                deleteCase(c.id);
            }
        });
        tdActions.appendChild(deleteBtn);

        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

// Delete case function
function deleteCase(id) {
    loadCases();
    const updatedHistory = patientCases.filter(c => c.id !== id);
    localStorage.setItem("patientHistory", JSON.stringify(updatedHistory));
    showToast("Patient case record deleted successfully.");
    renderTable(searchInput ? searchInput.value : "");
}

// Attach listeners
window.addEventListener("DOMContentLoaded", () => {
    renderTable();

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            renderTable(e.target.value);
        });
    }
});
