# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np
import shap
import os
import chromadb
from google import genai
from google.genai import types

app = FastAPI(
    title="LucidClinics AI Advanced Core",
    version="2.0.0"
)

# Base directories resolving
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# Serve index.html on root route
@app.get("/")
async def serve_frontend():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/analyzer")
async def serve_analyzer():
    return FileResponse(os.path.join(FRONTEND_DIR, "analyzer.html"))

@app.get("/report")
async def serve_report():
    return FileResponse(os.path.join(FRONTEND_DIR, "report.html"))

@app.get("/history")
async def serve_history():
    return FileResponse(os.path.join(FRONTEND_DIR, "history.html"))

@app.get("/metrics")
async def serve_metrics():
    return FileResponse(os.path.join(FRONTEND_DIR, "metrics.html"))

# Mount static frontend assets
app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")

# 1. Load the serialized XGBoost model at startup
MODEL_PATH = os.path.join(BACKEND_DIR, "xgboost_diabetes_model.pkl")
try:
    model = joblib.load(MODEL_PATH)
    # Pre-initialize a SHAP Explainer using our model for quick calculations
    explainer = shap.TreeExplainer(model)
    print("Successfully loaded the trained XGBoost ML engine.")
except Exception as e:
    raise RuntimeError(f"Failed to load the trained ML engine at {MODEL_PATH}: {str(e)}")

# 2. Connect to the ChromaDB Vector database
CHROMA_DB_PATH = os.path.join(BACKEND_DIR, "chroma_db")
try:
    chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    from chromadb.utils import embedding_functions
    embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    vdb_collection = chroma_client.get_collection(
        name="medical_guidelines",
        embedding_function=embedding_function
    )
    print("Successfully connected to the clinical guidelines vector database.")
except Exception as e:
    print(f"Warning: Could not connect to ChromaDB at {CHROMA_DB_PATH}: {e}")
    vdb_collection = None

# 3. Initialize the Google GenAI Client
ai_client = None
if os.environ.get("GEMINI_API_KEY"):
    try:
        ai_client = genai.Client()
        print("Gemini API Client initialized successfully.")
    except Exception as e:
        print(f"Warning: Failed to initialize GenAI client: {e}")
        ai_client = None
else:
    print("Warning: GEMINI_API_KEY environment variable not set. Running with mock narrative fallback.")
    ai_client = None

# 4. Define the Pydantic Medical Data Schema (Data Validation Layer)
class PatientDataInput(BaseModel):
    pregnancies: int = Field(..., ge=0, description="Number of times pregnant")
    glucose: float = Field(..., ge=0, le=300, description="Plasma glucose concentration")
    blood_pressure: float = Field(..., ge=0, le=200, description="Diastolic blood pressure (mm Hg)")
    skin_thickness: float = Field(..., ge=0, le=100, description="Triceps skin fold thickness (mm)")
    insulin: float = Field(..., ge=0, le=900, description="2-Hour serum insulin (mu U/ml)")
    bmi: float = Field(..., ge=0, le=70, description="Body mass index (weight in kg/(height in m)^2)")
    diabetes_pedigree: float = Field(..., ge=0, description="Diabetes pedigree function score")
    age: int = Field(..., ge=0, le=120, description="Age in years")

    class Config:
        json_schema_extra = {
            "example": {
                "pregnancies": 2,
                "glucose": 130.0,
                "blood_pressure": 72.0,
                "skin_thickness": 20.0,
                "insulin": 85.0,
                "bmi": 28.4,
                "diabetes_pedigree": 0.45,
                "age": 34
            }
        }

# 5. Create the Prediction API Route
@app.post("/api/v1/predict", tags=["Clinical Analytics"])
async def predict_risk(patient: PatientDataInput):
    try:
        # Convert incoming JSON schema smoothly into a Pandas DataFrame
        patient_dict = {
            "Pregnancies": [patient.pregnancies],
            "Glucose": [patient.glucose],
            "BloodPressure": [patient.blood_pressure],
            "SkinThickness": [patient.skin_thickness],
            "Insulin": [patient.insulin],
            "BMI": [patient.bmi],
            "DiabetesPedigreeFunction": [patient.diabetes_pedigree],
            "Age": [patient.age]
        }
        input_df = pd.DataFrame(patient_dict)

        # Compute risk probability percentage
        risk_probability = float(model.predict_proba(input_df)[0][1]) * 100
        binary_prediction = int(model.predict(input_df)[0])

        # Compute SHAP Values for Model Explainability
        shap_values = explainer(input_df)
        feature_contributions = {col: float(shap_values.values[0][idx]) for idx, col in enumerate(input_df.columns)}

        # Determine the #1 metric pushing risk upwards
        primary_driver = max(feature_contributions, key=feature_contributions.get)

        # C. RAG Layer: Retrieve Medical Guidelines matching our top risk driver
        retrieved_guideline = "Follow standard healthy living guidelines."
        if vdb_collection:
            try:
                vdb_results = vdb_collection.query(
                    query_texts=[f"High {primary_driver} medical indicators"],
                    n_results=1
                )
                if vdb_results and 'documents' in vdb_results and vdb_results['documents'] and len(vdb_results['documents'][0]) > 0:
                    retrieved_guideline = vdb_results['documents'][0][0]
            except Exception as e:
                print(f"ChromaDB query failed: {e}")

        # D. GenAI Integration Layer: Construct the Prompt with Guardrails
        system_instruction = (
            "You are a secure Clinical AI Scribe. Translate raw diagnostic numbers and "
            "verified medical guidelines into a highly structured, empathetic summary for the patient. "
            "CRITICAL: You are strictly forbidden from fabricating data or giving prescriptions. "
            "You must ground your advice entirely inside the provided Context Guidelines. "
            "Always output a medical disclaimer at the bottom."
        )

        user_prompt = f"""
Patient Metrics:
- Age: {patient.age}
- BMI: {patient.bmi}
- Glucose Level: {patient.glucose}
- Diastolic Blood Pressure: {patient.blood_pressure}
- Pregnancies: {patient.pregnancies}
- Skin Thickness: {patient.skin_thickness}
- Insulin: {patient.insulin}
- Diabetes Pedigree Score: {patient.diabetes_pedigree}

Analysis Metrics:
- ML Evaluated Diabetes Risk Score: {risk_probability:.2f}%
- Primary Risk Driver: {primary_driver}

Retrieved Context Guidelines:
- {retrieved_guideline}

Translate the patient metrics, ML evaluated risk score, primary risk driver, and context guidelines into a highly structured, empathetic summary. Write a concise patient narrative (around 100-140 words) structured in 2 paragraphs. Ground your advice strictly in the retrieved guidelines and include a disclaimer.
"""

        # E. Prompt execution / Client call with fallback
        patient_narrative = ""
        if ai_client:
            try:
                response = ai_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction
                    )
                )
                patient_narrative = response.text.strip()
            except Exception as e:
                print(f"Gemini generation failed: {e}")
                patient_narrative = (
                    f"Based on your recent screening, your calculated diabetes risk probability is {risk_probability:.2f}%. "
                    f"Our analytics identify {primary_driver} as the primary factor driving this score. "
                    f"Under official clinical guidelines, we recommend: {retrieved_guideline} "
                    f"Please share this automated screening assessment with your primary care provider to outline a diagnostic plan."
                )
        else:
            patient_narrative = (
                f"Based on your recent screening, your calculated diabetes risk probability is {risk_probability:.2f}%. "
                f"Our analytics identify {primary_driver} as the primary factor driving this score. "
                f"Under official clinical guidelines, we recommend: {retrieved_guideline} "
                f"Please share this automated screening assessment with your primary care provider to outline a diagnostic plan."
            )

        return {
            "status": "success",
            "prediction": {
                "is_high_risk": bool(binary_prediction),
                "risk_percentage": round(risk_probability, 2),
                "narrative": patient_narrative
            },
            "explainability": {
                "raw_shap_contributions": feature_contributions,
                "primary_risk_drivers": [primary_driver],
                "retrieved_guidelines": [retrieved_guideline]
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Analytics Engine Error: {str(e)}")

# Running the app locally
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
