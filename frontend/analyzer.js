// Profile Presets Data Mapping
const PRESETS = {
    healthy: {
        pregnancies: 1,
        glucose: 85,
        blood_pressure: 66,
        skin_thickness: 29,
        insulin: 0,
        bmi: 26.6,
        diabetes_pedigree: 0.35,
        age: 31
    },
    high_risk: {
        pregnancies: 8,
        glucose: 183,
        blood_pressure: 80,
        skin_thickness: 42,
        insulin: 175,
        bmi: 38.2,
        diabetes_pedigree: 0.85,
        age: 47
    },
    borderline: {
        pregnancies: 5,
        glucose: 139,
        blood_pressure: 74,
        skin_thickness: 35,
        insulin: 140,
        bmi: 31.4,
        diabetes_pedigree: 0.48,
        age: 41
    }
};

const form = document.getElementById("prediction-form");
const rangeInputs = form.querySelectorAll('input[type="range"]');
const presetButtons = document.querySelectorAll('.preset-btn');
const nameInput = document.getElementById("patient-name");
const mrnInput = document.getElementById("patient-mrn");
const notesInput = document.getElementById("patient-notes");

// Threshold parameters checker
function updateParamStatus(id, val) {
    const badge = document.getElementById(`status-${id}`);
    if (!badge) return;

    let status = "normal";
    let text = "Normal";

    switch(id) {
        case "pregnancies":
            if (val >= 9) { status = "high"; text = "High"; }
            else if (val >= 5) { status = "borderline"; text = "Elevated"; }
            break;
        case "glucose":
            if (val >= 126) { status = "high"; text = "High"; }
            else if (val >= 100) { status = "borderline"; text = "Borderline"; }
            break;
        case "blood_pressure":
            if (val >= 90) { status = "high"; text = "High"; }
            else if (val >= 80) { status = "borderline"; text = "Elevated"; }
            break;
        case "skin_thickness":
            if (val > 40) { status = "high"; text = "High"; }
            else if (val > 30) { status = "borderline"; text = "Moderate"; }
            break;
        case "insulin":
            if (val >= 167) { status = "high"; text = "High"; }
            else if (val >= 100) { status = "borderline"; text = "Elevated"; }
            break;
        case "bmi":
            if (val >= 30) { status = "high"; text = "High (Obese)"; }
            else if (val >= 25) { status = "borderline"; text = "Overweight"; }
            break;
        case "diabetes_pedigree":
            if (val >= 0.8) { status = "high"; text = "High"; }
            else if (val >= 0.4) { status = "borderline"; text = "Moderate"; }
            break;
        case "age":
            if (val >= 50) { status = "high"; text = "High Risk"; }
            else if (val >= 35) { status = "borderline"; text = "Moderate"; }
            break;
    }

    badge.className = `status-badge ${status}`;
    badge.textContent = text;
}

// Sync ranges to values
function initSliderSync() {
    rangeInputs.forEach(input => {
        const valSpan = document.getElementById(`val-${input.id}`);
        updateParamStatus(input.id, Number(input.value));

        if (valSpan) {
            valSpan.textContent = Number(input.value).toFixed(input.id === 'bmi' || input.id === 'diabetes_pedigree' || input.id === 'glucose' || input.id === 'blood_pressure' || input.id === 'skin_thickness' || input.id === 'insulin' ? 1 : 0);
        }
        
        input.addEventListener("input", (e) => {
            let val = Number(e.target.value);
            
            if (e.target.id === 'bmi' || e.target.id === 'glucose' || e.target.id === 'blood_pressure' || e.target.id === 'skin_thickness' || e.target.id === 'insulin') {
                valSpan.textContent = val.toFixed(1);
            } else if (e.target.id === 'diabetes_pedigree') {
                valSpan.textContent = val.toFixed(2);
            } else {
                valSpan.textContent = val.toFixed(0);
            }

            updateParamStatus(e.target.id, val);
            presetButtons.forEach(btn => btn.classList.remove("active"));
        });
    });
}

// Load presets
function loadPreset(presetName) {
    const data = PRESETS[presetName];
    if (!data) return;

    Object.keys(data).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            input.value = data[key];
            updateParamStatus(key, data[key]);
            const valSpan = document.getElementById(`val-${key}`);
            if (valSpan) {
                if (key === 'diabetes_pedigree') {
                    valSpan.textContent = data[key].toFixed(2);
                } else if (key === 'bmi' || key === 'glucose' || key === 'blood_pressure' || key === 'skin_thickness' || key === 'insulin') {
                    valSpan.textContent = data[key].toFixed(1);
                } else {
                    valSpan.textContent = data[key].toFixed(0);
                }
            }
        }
    });
}

// Submit inputs, call API, save to localStorage, and redirect
async function runPrediction(e) {
    if (e) e.preventDefault();

    const submitBtn = form.querySelector(".submit-btn");
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin btn-icon"></i> <span>Analyzing Clinical Vectors...</span>`;
    submitBtn.disabled = true;

    const payload = {
        pregnancies: parseInt(document.getElementById("pregnancies").value, 10),
        glucose: parseFloat(document.getElementById("glucose").value),
        blood_pressure: parseFloat(document.getElementById("blood_pressure").value),
        skin_thickness: parseFloat(document.getElementById("skin_thickness").value),
        insulin: parseFloat(document.getElementById("insulin").value),
        bmi: parseFloat(document.getElementById("bmi").value),
        diabetes_pedigree: parseFloat(document.getElementById("diabetes_pedigree").value),
        age: parseInt(document.getElementById("age").value, 10)
    };

    const demographics = {
        name: nameInput.value.trim() || "Anonymous Patient",
        mrn: mrnInput.value.trim() || "MRN-TEMP-" + Math.floor(Math.random() * 1000),
        notes: notesInput.value.trim() || "No diagnostic observations recorded."
    };

    try {
        const response = await fetch("/api/v1/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status === "success") {
            // Save state, including demographics
            localStorage.setItem('latestReport', JSON.stringify({
                payload,
                prediction: data.prediction,
                explainability: data.explainability,
                demographics
            }));
            
            // Redirect to report view page
            window.location.href = "/report";
        }
    } catch (err) {
        console.error("Prediction failed: ", err);
        alert("Analytics Engine Error: Failed to generate report. Make sure the backend server is running.");
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

window.addEventListener("DOMContentLoaded", () => {
    initSliderSync();

    form.addEventListener("submit", runPrediction);

    presetButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            presetButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            loadPreset(btn.dataset.preset);
        });
    });

    // Check if we returned from report page to preserve inputs
    const prevReport = localStorage.getItem('latestReport');
    if (prevReport) {
        try {
            const parsed = JSON.parse(prevReport);
            
            // Restore demographics
            if (parsed.demographics) {
                nameInput.value = parsed.demographics.name || "";
                mrnInput.value = parsed.demographics.mrn || "";
                notesInput.value = parsed.demographics.notes || "";
            }
            
            // Restore sliders
            Object.keys(parsed.payload).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = parsed.payload[key];
                    updateParamStatus(key, parsed.payload[key]);
                    const valSpan = document.getElementById(`val-${key}`);
                    if (valSpan) {
                        if (key === 'diabetes_pedigree') {
                            valSpan.textContent = parsed.payload[key].toFixed(2);
                        } else if (key === 'bmi' || key === 'glucose' || key === 'blood_pressure' || key === 'skin_thickness' || key === 'insulin') {
                            valSpan.textContent = parsed.payload[key].toFixed(1);
                        } else {
                            valSpan.textContent = parsed.payload[key].toFixed(0);
                        }
                    }
                }
            });
        } catch (e) {
            loadPreset("healthy");
            presetButtons[0].classList.add("active");
        }
    } else {
        loadPreset("healthy");
        presetButtons[0].classList.add("active");
    }
});
