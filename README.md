# LucidClinics AI • Clinical Risk Intelligence Suite

> [!TIP]
> **New to this project or domain?** Read our beginner-friendly [DOCUMENTATION.md](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/DOCUMENTATION.md) for a simple explanation of the technologies, keywords, and data flow!

LucidClinics AI is a production-grade clinical decision support web application designed to screen patient data for diabetes risk. It utilizes machine learning models to predict risk probability, computes mathematical explainability graphs, matches clinical guidelines from a local vector database (RAG), and provides a persistent case history registry for healthcare providers.

---

## 🛠️ Technology Stack

The project is built using a clean, modern stack separating clinical algorithms from the interface:

### 1. Machine Learning Core
* **Python**: The programming language hosting our mathematical and server models.
* **XGBoost**: A powerful decision-tree machine learning algorithm trained on clinical datasets to predict diabetes risk probability.
* **scikit-learn**: Used for split training, class balancing calibration, and evaluating model metrics.
* **SHAP (SHapley Additive exPlanations)**: A game-theoretic algorithm that calculates exactly how much each clinical measurement (e.g., Glucose, BMI) drives the predicted risk percentage up or down.
* **joblib**: Serializes and loads the trained ML classifier efficiently.

### 2. Vector Database & RAG (Retrieval-Augmented Generation)
* **ChromaDB**: A lightweight, fast, local database storing official clinical guidelines from the American Diabetes Association (ADA).
* **Sentence-Transformers (`all-MiniLM-L6-v2`)**: A local deep-learning model that converts text queries into dense mathematical vectors. This allows semantic matching so that searching for "high sugar indicators" retrieves guidelines relating to "glucose".

### 3. Backend Server Core
* **FastAPI**: A high-performance, modern Python web framework used to expose our prediction and serving routes.
* **Uvicorn**: A lightning-fast server manager running the FastAPI backend.
* **Pydantic**: Validates incoming patient JSON objects to ensure all inputs fall within safe physiological ranges.

### 4. Interactive Frontend UI
* **HTML5**: Structured semantic page shells (Landing, Analyzer, Report, History, Performance).
* **CSS3**: Cohesive dark-mode theme utilizing glassmorphism, responsive grids, interactive hovering transitions, and customized media print rules.
* **Modular JavaScript**: Split into page-specific scripts (`landing.js`, `analyzer.js`, `report.js`, `history.js`, `metrics.js`) managing range thresholds, counting animations, and state transitions.
* **Browser LocalStorage**: Serves as a persistent database on the client-side to save patient history registry logs.

---

## 📐 System Architecture & Flow

Below is the simple step-by-step diagnostic journey of a patient screening:

```
[1. Clinical Analyzer Page]
       │
       ▼ (Demographics + Slider Inputs)
[2. FastAPI Predict Endpoint]
       │
       ├─► [XGBoost Classifier] ──► Calculates Risk Probability (%)
       │
       ├─► [SHAP Explainer] ─────► Computes Parameter Weight Contributions
       │                                  │
       │                                  ▼ (Primary Risk Driver Identified)
       ├─► [ChromaDB Vector DB] ─► Retrieves ADA Guidelines (RAG matching)
       │
       ▼ (JSON Response Payload Saved to Browser LocalStorage)
[3. Diagnostic Report Page] ─────► Displays Gauge, Explanations, and Exports
```

---

## 📄 Portal Page Breakdown

The application is structured into 5 functioning dashboards:

1. **Home Landing Page (`/`)**: Introduces the suite, technical highlights, and hosts dynamic count-up statistics cards showing system latency and classifier metrics.
2. **Risk Analyzer (`/analyzer`)**: Captures patient demographics (Name, Record Number) and clinical parameters using color-coded range badges (*Normal*, *Borderline*, *High*) to alert clinicians.
3. **Report Analysis (`/report`)**: Displays risk score dials, SHAP diagnostics bars (Coral for risk factors, Teal for protective metrics), matched guidelines, and print utilities.
4. **Saved History (`/history`)**: A search-and-filter case registry table where providers can load past patient screenings or remove completed records.
5. **Model Performance (`/metrics`)**: Displays XGBoost accuracy parameters, SVG Confusion Matrix layouts, and ROC curves (AUC = 0.984).

---

## 🚀 Quick Start Guide (How to Run Locally)

Follow these steps to boot up the clinical suite on your local machine:

### Prerequisite Dependencies
Make sure you have **Python 3.10+** installed, then run the terminal command inside the project root folder:
```bash
pip install xgboost pandas scikit-learn joblib shap fastapi uvicorn chromadb sentence-transformers requests
```

### Setup & Run Commands

1. **Populate Guidelines Database**:
   Seed the local clinical guidelines database in ChromaDB by running the script:
   ```bash
   python backend/seed_vector_db.py
   ```
   *(This will download the `all-MiniLM-L6-v2` weights locally on first run and write the database to `backend/chroma_db/`)*

2. **Launch Backend Server**:
   Start the FastAPI core server by running:
   ```bash
   python backend/main.py
   ```

3. **Access Interface**:
   Open your browser and navigate to **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)** to launch the portal.
