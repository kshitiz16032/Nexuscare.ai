const uiRiskPercentage = document.getElementById("ui-risk-percentage");
const uiRiskLabel = document.getElementById("ui-risk-label");
const uiRiskDescription = document.getElementById("ui-risk-description");
const uiRiskStatusCard = document.getElementById("ui-risk-status-card");
const uiStatusIcon = document.getElementById("ui-status-icon");
const gaugeFillRing = document.getElementById("gauge-fill-ring");
const uiShapChart = document.getElementById("ui-shap-chart");
const uiDriversList = document.getElementById("ui-drivers-list");
const exportBtn = document.getElementById("export-report-btn");
const saveHistoryBtn = document.getElementById("save-history-btn");
const toast = document.getElementById("toast-notification");
const toastMsg = document.getElementById("toast-message");

let currentGaugePercentage = 0;

// Update the circular SVG risk meter with linear counting transition
function updateRiskGauge(percentage) {
    const totalCircumference = 251.2;
    const offset = totalCircumference - (totalCircumference * percentage) / 100;
    
    gaugeFillRing.style.strokeDashoffset = offset;

    // Apply color logic
    if (percentage < 35) {
        gaugeFillRing.style.stroke = "var(--color-teal)";
    } else if (percentage < 65) {
        gaugeFillRing.style.stroke = "var(--color-warning)";
    } else {
        gaugeFillRing.style.stroke = "var(--color-danger)";
    }

    // Number counting animation
    const startVal = currentGaugePercentage;
    const endVal = Math.round(percentage);
    const duration = 800; // ms
    let startTime = null;

    function countAnim(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentVal = Math.floor(startVal + (endVal - startVal) * progress);
        uiRiskPercentage.textContent = `${currentVal}%`;
        if (progress < 1) {
            window.requestAnimationFrame(countAnim);
        } else {
            uiRiskPercentage.textContent = `${endVal}%`;
            currentGaugePercentage = endVal;
        }
    }
    
    window.requestAnimationFrame(countAnim);
}

// Update the risk state description panel
function updateRiskCard(isHighRisk, percentage, narrative) {
    uiRiskStatusCard.className = "risk-status-card"; // Reset
    
    if (isHighRisk) {
        uiRiskStatusCard.classList.add("state-high");
        uiStatusIcon.className = "fa-solid fa-triangle-exclamation status-icon";
        uiRiskLabel.textContent = "High Risk Detected";
    } else {
        uiRiskStatusCard.classList.add("state-low");
        uiStatusIcon.className = "fa-solid fa-shield-check status-icon";
        uiRiskLabel.textContent = "Normal / Low Risk";
    }
    
    uiRiskDescription.textContent = narrative || `The model estimates a ${percentage}% probability of diabetes.`;
}

// Dynamic rendering of SHAP Bar Chart
function renderShapChart(shapContributions) {
    uiShapChart.innerHTML = ""; // Clear placeholders

    let maxAbsVal = 0.001; 
    Object.values(shapContributions).forEach(val => {
        if (Math.abs(val) > maxAbsVal) {
            maxAbsVal = Math.abs(val);
        }
    });

    Object.keys(shapContributions).forEach(feature => {
        const val = shapContributions[feature];
        const absValPercent = (Math.abs(val) / maxAbsVal) * 50; 
        
        const isPositive = val >= 0;
        const colorClass = isPositive ? "positive" : "negative";
        const valTextClass = isPositive ? "positive-val" : "negative-val";
        const formattedVal = (isPositive ? "+" : "") + val.toFixed(3);

        const barItem = document.createElement("div");
        barItem.className = "shap-bar-item";

        // Feature label
        const nameSpan = document.createElement("span");
        nameSpan.className = "shap-feature-name";
        nameSpan.textContent = feature;
        barItem.appendChild(nameSpan);

        // Bar wrapper
        const barWrapper = document.createElement("div");
        barWrapper.className = "shap-bar-wrapper";
        const bar = document.createElement("div");
        bar.className = `shap-bar ${colorClass}`;
        
        setTimeout(() => {
            bar.style.width = `${absValPercent}%`;
        }, 50);

        barWrapper.appendChild(bar);
        barItem.appendChild(barWrapper);

        // SHAP value text
        const valueSpan = document.createElement("span");
        valueSpan.className = `shap-bar-value ${valTextClass}`;
        valueSpan.textContent = formattedVal;
        barItem.appendChild(valueSpan);

        uiShapChart.appendChild(barItem);
    });
}

// Update primary drivers text-breakdown
function updatePrimaryDrivers(drivers) {
    uiDriversList.innerHTML = "";
    
    drivers.forEach((driver, idx) => {
        const li = document.createElement("li");
        
        const badge = document.createElement("span");
        badge.className = "bullet-no";
        badge.textContent = idx + 1;
        
        li.appendChild(badge);
        
        const nameText = document.createTextNode(` ${driver} is contributing strongly to the current risk output.`);
        li.appendChild(nameText);
        
        uiDriversList.appendChild(li);
    });
}

// Update retrieved clinical guidelines list
function updateRetrievedGuidelines(guidelines) {
    const guidelinesList = document.getElementById("ui-guidelines-list");
    guidelinesList.innerHTML = "";
    
    if (!guidelines || guidelines.length === 0) {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fa-solid fa-circle-exclamation info-icon"></i> No matching guidelines found in local vector database.`;
        guidelinesList.appendChild(li);
        return;
    }

    guidelines.forEach(guideline => {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fa-solid fa-file-medical-alt guideline-bullet-icon"></i> <span>${guideline}</span>`;
        guidelinesList.appendChild(li);
    });
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

// Save case to local registry history list
function saveReportToHistory(data) {
    if (!data) return;

    const rawHistory = localStorage.getItem("patientHistory");
    let history = [];
    if (rawHistory) {
        try {
            history = JSON.parse(rawHistory);
        } catch (e) {
            history = [];
        }
    }

    // Assign unique ID and timestamp
    const caseRecord = {
        id: "case-" + Date.now(),
        dateSaved: new Date().toISOString(),
        payload: data.payload,
        prediction: data.prediction,
        explainability: data.explainability,
        demographics: data.demographics
    };

    history.push(caseRecord);
    localStorage.setItem("patientHistory", JSON.stringify(history));

    showToast("Diagnostic report saved to history registry!");
}

// Function to export clinical report as text file
function exportClinicalReport(data) {
    if (!data) return;

    const reportContent = `==================================================
LUCIDCLINICS AI - CLINICAL RISK INTELLIGENCE REPORT
Generated on: ${new Date().toLocaleString()}
==================================================

PATIENT DEMOGRAPHICS:
---------------------
Name:                     ${data.demographics.name}
Record ID (MRN):          ${data.demographics.mrn}
Observation Notes:        ${data.demographics.notes}

PATIENT PARAMETERS SUMMARY:
---------------------------
Pregnancies:              ${data.payload.pregnancies}
Glucose Level:            ${data.payload.glucose} mg/dL
Blood Pressure:           ${data.payload.blood_pressure} mm Hg
Skin Thickness:           ${data.payload.skin_thickness} mm
Insulin Level:            ${data.payload.insulin} mu U/ml
BMI Score:                ${data.payload.bmi} kg/m²
Diabetes Pedigree Score:  ${data.payload.diabetes_pedigree}
Age:                      ${data.payload.age} Years

DIAGNOSTIC RISK ASSESSMENT:
---------------------------
Calculated Risk Score:    ${data.prediction.risk_percentage}%
Risk Status Classification: ${data.prediction.is_high_risk ? "HIGH RISK DETECTED" : "NORMAL / LOW RISK"}

MATCHED REFERENCE CLINICAL GUIDELINES (RAG):
--------------------------------------------
${data.explainability.retrieved_guidelines.join("\n")}

CLINICAL ANALYSIS NARRATIVE:
----------------------------
${data.prediction.narrative}

--------------------------------------------------
DISCLAIMER: This report is generated by an artificial intelligence model trained on historical statistical data. It is intended for screening and educational purposes only, and does NOT constitute formal medical advice, diagnosis, or treatment. Please consult with a licensed healthcare professional to discuss these results.
==================================================`;

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `LucidClinics_Report_${data.demographics.mrn}_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Modal overlay element selections and listeners
function initInteractiveListeners(data) {
    const shapModal = document.getElementById("shap-modal");
    const shapInfoTrigger = document.getElementById("shap-info-trigger");
    const shapModalClose = document.getElementById("shap-modal-close");

    if (shapInfoTrigger && shapModal && shapModalClose) {
        shapInfoTrigger.addEventListener("click", () => {
            shapModal.classList.add("active");
        });
        
        shapModalClose.addEventListener("click", () => {
            shapModal.classList.remove("active");
        });

        shapModal.addEventListener("click", (e) => {
            if (e.target === shapModal) {
                shapModal.classList.remove("active");
            }
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener("click", () => exportClinicalReport(data));
    }

    if (saveHistoryBtn) {
        saveHistoryBtn.addEventListener("click", () => saveReportToHistory(data));
    }
}

// Initialize loading data
window.addEventListener("DOMContentLoaded", () => {
    const reportDataStr = localStorage.getItem('latestReport');
    if (!reportDataStr) {
        window.location.href = "/analyzer";
        return;
    }

    try {
        const data = JSON.parse(reportDataStr);
        
        // Render Patient Demographics banner
        document.getElementById("report-patient-name").textContent = data.demographics.name || "Anonymous Patient";
        document.getElementById("report-patient-mrn").textContent = data.demographics.mrn || "N/A";
        document.getElementById("report-patient-date").textContent = new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
        document.getElementById("report-patient-notes").textContent = data.demographics.notes || "No symptom notes recorded.";
        
        // Render UI panels
        updateRiskGauge(data.prediction.risk_percentage);
        updateRiskCard(data.prediction.is_high_risk, data.prediction.risk_percentage, data.prediction.narrative);
        renderShapChart(data.explainability.raw_shap_contributions);
        updatePrimaryDrivers(data.explainability.primary_risk_drivers);
        updateRetrievedGuidelines(data.explainability.retrieved_guidelines);
        
        // Bind button actions
        initInteractiveListeners(data);
    } catch (e) {
        console.error("Failed to parse report: ", e);
        window.location.href = "/analyzer";
    }
});
