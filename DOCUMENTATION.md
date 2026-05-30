# 🩺 LucidClinics AI: Comprehensive Project & Technology Documentation

Welcome to **LucidClinics AI**! This document is a simple, easy-to-understand guide for developers, clinicians, and newcomers. It explains what this project is, the technology behind it, key terms (keywords), and how all the parts work together.

---

## 🌟 1. Project Overview (In Simple Words)
Imagine a doctor wants to check if a patient is at risk of developing diabetes. Instead of guessing or manual calculation, the doctor enters the patient's test results (like blood sugar, blood pressure, and age) into a beautiful webpage. 

**LucidClinics AI** takes this data and:
1. **Predicts**: Calculates the exact probability (percentage) of the patient being at high risk of diabetes.
2. **Explains**: Shows *why* the score is high or low (e.g., "the patient's high Body Mass Index (BMI) is pushing the risk up, but their young age is helping keep it down").
3. **Recommends**: Searches a digital medical library for official clinical guidelines (from the American Diabetes Association) matching the patient's main risk factors.
4. **Summarizes**: Uses AI to write an easy-to-read, empathetic summary narrative for the patient.
5. **Saves**: Keeps a local registry of patient records so the doctor can search or reload them later.

---

## 🔑 2. Key Terms & Keywords (Glossary)
If you are new to programming or healthcare tech, here are the most important terms used in this project explained simply:

* **Machine Learning (ML)**: Teaching computers to find patterns in data (like historical patient records) so they can make predictions on new data without being explicitly programmed.
* **XGBoost (Extreme Gradient Boosting)**: A very powerful and fast machine learning algorithm. Think of it as a smart decision-making tree that learns from its mistakes to make highly accurate predictions.
* **Feature / Parameter**: The inputs we feed to the machine learning model (e.g., Glucose level, Blood Pressure, Age).
* **SHAP (SHapley Additive exPlanations)**: A mathematical tool that explains *why* the machine learning model made a certain decision. It tells us how much weight each individual feature (like high Glucose) contributed to the final percentage.
* **Vector Database (ChromaDB)**: A special database that stores text as mathematical vectors (lists of numbers). This helps us search for guidelines based on *meaning* rather than just exact word matches.
* **RAG (Retrieval-Augmented Generation)**: Combining database search with an AI model. Instead of asking AI to make up advice, we *retrieve* official guidelines first, then *augment* (give) them to the AI to summarize.
* **Embeddings (`all-MiniLM-L6-v2`)**: A model that turns sentences into numbers representing their semantic meaning. For example, it knows that "high blood sugar" is related to "glucose".
* **FastAPI**: A fast, modern Python framework used to build APIs (bridges that let the frontend webpage talk to the backend code).
* **Pydantic**: A data checker. It makes sure that the patient details entered on the webpage are valid numbers (e.g., preventing a user from typing letters or entering negative age).
* **LocalStorage**: A small database built inside your web browser. It saves patient records on your computer, so they stay saved even if you refresh or close the webpage.
* **Print Stylesheet (`@media print`)**: CSS rules that automatically reformat the webpage into a clean, professional medical chart when a doctor hits "Print" or "Save to PDF".

---

## 🛠️ 3. The Technology Stack
Here is the technology breakdown divided by their roles:

```
┌────────────────────────────────────────────────────────┐
│                      FRONTEND                          │
│  (HTML5 + Vanilla CSS3 + Modular JavaScript)           │
│                                                        │
│  • Landing Page (Dashboard stats)                      │
│  • Analyzer (Forms & vital thresholds)                 │
│  • Report (Score dials, SHAP bars, printing)           │
│  • History (Client-side LocalStorage registry)        │
│  • Performance (ML diagnostics & SVG graphics)         │
└──────────────────────────┬─────────────────────────────┘
                           │ API Requests (JSON)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                    │
│                                                        │
│  • main.py: Coordinates all requests                   │
│  • Pydantic: Validates incoming data                   │
└────┬─────────────────────┬────────────────────────┬────┘
     │                     │                        │
     ▼                     ▼                        ▼
┌──────────────┐     ┌──────────────┐      ┌─────────────────┐
│  ML MODEL    │     │  VECTOR DB   │      │   GEMINI AI     │
│  (XGBoost)   │     │  (ChromaDB)  │      │ (gemini-2.5)    │
│              │     │              │      │                 │
│ Predicts the │     │ Retrieves the│      │ Synthesizes the │
│ risk score % │     │ official ADA │      │ final clinical  │
│ using SHAP.  │     │ guidelines.  │      │ narrative.      │
└──────────────┘     └──────────────┘      └─────────────────┘
```

### Backend Technologies (Python)
1. **Python**: The core language powering the backend logic and training scripts.
2. **FastAPI**: Serves the website pages and processes predictive calculation API calls.
3. **Uvicorn**: The engine that hosts the FastAPI application locally.
4. **XGBoost & scikit-learn**: The machine learning algorithms used to train and run the diabetes predictor.
5. **SHAP**: Generates local feature contributions (attributions) for each input parameters.
6. **ChromaDB**: Stashes the guidelines as dense vectors for fast semantic matching.
7. **Sentence-Transformers**: Embeds the clinical terms for semantic similarity search.
8. **Google GenAI SDK**: Integrates Gemini 2.5 Flash to write structured summaries based *only* on the retrieved guidelines.

### Frontend Technologies (Web Standards)
1. **HTML5**: Creates the structure of the five dashboards.
2. **CSS3**: Designs a premium dark-mode, glassmorphic UI with smooth animations. No bulky CSS frameworks (like Bootstrap or Tailwind) were used, ensuring complete control and speed.
3. **JavaScript (ES6+)**: Powers client-side navigation, dynamically updates UI components, interacts with the backend APIs, and manages the database stored in browser memory (`localStorage`).

---

## 🔄 4. How the Data Flows (Step-by-Step)

Here is exactly what happens when you use the app:

1. **Inputting Data**: A user enters patient details on the `/analyzer` page.
2. **Checking Inputs**: JavaScript checks the numbers. If any value looks abnormal, a color-coded badge (*Borderline* or *High*) lights up to warn the clinician.
3. **Sending the Request**: When the user clicks "Generate Diagnostics", JavaScript bundles the patient data and sends an HTTP POST request to `/api/v1/predict`.
4. **Processing Backend Logic**:
   * **Validation**: The backend uses **Pydantic** to confirm the data is safe and in the right format.
   * **Predicting**: The data is loaded into our **XGBoost model** which spits out a percentage risk (e.g., `72.5%`).
   * **Explaining**: **SHAP** calculates exactly how much each vital (Glucose, BMI, etc.) affected the risk score.
   * **Retrieving Guidelines**: The backend identifies the patient's #1 risk driver (e.g., `Glucose`). It queries **ChromaDB** with a semantic phrase like `"High Glucose medical indicators"`. ChromaDB finds and returns the official ADA guidelines for high glucose.
   * **AI Summarization**: The backend formats a prompt containing the patient’s data, the risk score, and the retrieved guideline. It sends this to **Gemini** to write a clean, empathetic summary.
5. **Rendering Report**: The backend sends all these details back to the browser in a JSON response. The browser redirect the user to `/report` where the gauge spins, SHAP horizontal bar charts animate, and recommendations appear.
6. **Saving to History**: The doctor can click "Save Record" to write the patient's assessment (with timestamp and MRN) into the browser's `localStorage` (History Database).

---

## 📁 5. Project Directory & File Details

Here is a map of the project files and what they do:

### Root Files
* [train_model.py](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/train_model.py): **Machine Learning Training Script.** Reads `diabetes.csv` (historical Pima Indians patient dataset), balances classes, trains the XGBoost Classifier, evaluates its accuracy (F1-score), and saves the trained model as `xgboost_diabetes_model.pkl`.
* [diabetes.csv](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/diabetes.csv): The training dataset containing health metrics of patients and whether they developed diabetes.
* [README.md](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/README.md): Quick setup and installation instructions for developers.
* [DOCUMENTATION.md](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/DOCUMENTATION.md): *This file!* An easy-to-read guide explaining the project's internal workings.

### Backend Folder (`/backend`)
* [main.py](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/backend/main.py): **The Main Server Code.** Launches the FastAPI application, serves HTML files, loads the trained XGBoost model, establishes a connection to ChromaDB, validates incoming requests, runs SHAP explanations, queries vector documents, interfaces with Gemini, and returns JSON payloads.
* [seed_vector_db.py](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/backend/seed_vector_db.py): **Vector DB Setup.** Initializes ChromaDB local database, embeds official American Diabetes Association (ADA) and WHO guidelines using `all-MiniLM-L6-v2`, and writes them to disk.
* `/chroma_db/`: Persistent storage directory created automatically by ChromaDB to save the embedded guidelines database.

### Frontend Folder (`/frontend`)
* [styles.css](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/frontend/styles.css): **Global Styling System.** Handles the premium dark glass theme, neon indicator widgets, responsive grids, transitions, and print templates.
* **Web Pages (HTML)**:
  - [index.html](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/frontend/index.html): **Landing Portal.** Introduces the application and features animated metric counter widgets.
  - [analyzer.html](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/frontend/analyzer.html): **Data Intake Form.** Houses slider controls, input forms, and dynamic vital validation badges.
  - [report.html](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/frontend/report.html): **Diagnostic Dashboard.** Renders the interactive risk speedometer gauge, SHAP driver bar charts, guidelines, and print utilities.
  - [history.html](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/frontend/history.html): **Case Registry Table.** Displays saved patient screenings, allowing search, filtering, and deleting records.
  - [metrics.html](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/frontend/metrics.html): **ML Diagnostics.** Displays system accuracy charts, SVG confusion matrices, and ROC curve vectors.
* **Scripts (JavaScript)**:
  - [landing.js](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/frontend/landing.js): Animates the homepage metrics.
  - [analyzer.js](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/frontend/analyzer.js): Handles form validations, vital ranges, and packages the API payload.
  - [report.js](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/frontend/report.js): Renders dynamic SVG gauges, parses SHAP values, and maps print layouts.
  - [history.js](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/frontend/history.js): Interfaces with browser `localStorage` to display, search, load, and clear saved records.
  - [metrics.js](file:///c:/Users/Kshitiz/Documents/nexuscare.ai/frontend/metrics.js): Powers the ML performance page animations.

---

## ⚡ 6. Quick Start & Execution Guide

Follow these quick commands to set up the project on your machine:

### 1. Install Dependencies
Make sure you have Python 3.10+ installed. Open your terminal in the project directory and run:
```bash
pip install xgboost pandas scikit-learn joblib shap fastapi uvicorn chromadb sentence-transformers requests
```

### 2. Populate Guidelines Database
Seed the local medical guidelines database by running:
```bash
python backend/seed_vector_db.py
```
*(On first execution, this downloads the local embedding model files from HuggingFace, which may take a few moments. Subsequent startups will run instantly.)*

### 3. Launch Backend Server
Run the FastAPI web server:
```bash
python backend/main.py
```

### 4. Access the Application
Open your web browser and go to:
👉 **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)**

---

## 💡 7. FAQ for New Developers

**Q: Where is the machine learning model file stored?**  
A: It is stored in `backend/xgboost_diabetes_model.pkl` and loaded into memory on server startup in `backend/main.py`.

**Q: Do I need an internet connection or paid API keys to run this?**  
A: No! The XGBoost model, SHAP explainer, Sentence-Transformers, and ChromaDB run 100% locally on your computer. An internet connection and Gemini API key are only needed if you want custom AI-written empathetic patient summaries. If no Gemini API key is found, the system automatically falls back to a clean mock narrative template without crashing.

**Q: How do I view saved patient reports?**  
A: Navigate to the **History** tab in the top navigation bar. All records you save are persistent and will stay in your local browser history even if you close the tab.
