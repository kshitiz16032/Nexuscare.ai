import os
import chromadb
from chromadb.utils import embedding_functions

# Get absolute path for database persistence (in backend directory as 'chroma_db')
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
DB_PATH = os.path.join(BACKEND_DIR, "chroma_db")


# 1. Initialize persistent Chroma client
print("Initializing ChromaDB persistent storage...")
client = chromadb.PersistentClient(path=DB_PATH)

# 2. Use Sentence Transformers for local embeddings
print("Loading sentence-transformers embedding model ('all-MiniLM-L6-v2')...")
# all-MiniLM-L6-v2 runs locally and generates 384-dimensional dense vectors
embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

# 3. Create or get collection
collection = client.get_or_create_collection(
    name="medical_guidelines",
    embedding_function=embedding_function,
    metadata={"hnsw:space": "cosine"} # Use cosine similarity distance
)

# 4. Clinical Guidelines Dataset (American Diabetes Association / WHO References)
guidelines = [
    {
        "id": "glucose_1",
        "text": "For non-pregnant adults, the American Diabetes Association (ADA) recommends a target fasting plasma glucose level between 80-130 mg/dL (4.4-7.2 mmol/L).",
        "metadata": {"category": "Glucose", "topic": "Fasting Targets", "source": "ADA Guidelines"}
    },
    {
        "id": "glucose_2",
        "text": "Postprandial (post-meal) blood glucose levels should ideally be under 180 mg/dL (10.0 mmol/L) measured 1-2 hours after the beginning of a meal.",
        "metadata": {"category": "Glucose", "topic": "Postprandial Targets", "source": "ADA Guidelines"}
    },
    {
        "id": "glucose_3",
        "text": "An A1C level of 6.5% or higher indicates diabetes. Prediabetes is defined as an A1C between 5.7% and 6.4%. Under 5.7% is considered normal.",
        "metadata": {"category": "Glucose", "topic": "A1C Thresholds", "source": "ADA/WHO Guidelines"}
    },
    {
        "id": "bmi_1",
        "text": "Weight management and lifestyle changes are critical for patients with a BMI of 25 kg/m² or higher (23 kg/m² or higher for Asian Americans). A modest weight loss of 5% to 7% of body weight can significantly reduce diabetes risk and improve insulin sensitivity.",
        "metadata": {"category": "BMI", "topic": "Weight Control", "source": "ADA Lifestyle Management"}
    },
    {
        "id": "bmi_2",
        "text": "Medical nutrition therapy (MNT) for elevated BMI focuses on reducing calorie intake, promoting physical activity, and choosing nutrient-dense foods high in fiber and low in saturated fats.",
        "metadata": {"category": "BMI", "topic": "Nutrition Therapy", "source": "ADA Guidelines"}
    },
    {
        "id": "physical_activity_1",
        "text": "Patients with diabetes or prediabetes should engage in at least 150 minutes of moderate-to-vigorous intensity aerobic physical activity per week, spread over at least 3 days, with no more than 2 consecutive days without activity.",
        "metadata": {"category": "Exercise", "topic": "Aerobic Training", "source": "ADA Guidelines"}
    },
    {
        "id": "physical_activity_2",
        "text": "Resistance training should be performed 2-3 times per week on non-consecutive days to increase muscle mass, which enhances glucose uptake and insulin action.",
        "metadata": {"category": "Exercise", "topic": "Resistance Training", "source": "ADA Guidelines"}
    },
    {
        "id": "bp_1",
        "text": "The recommended target blood pressure for individuals with diabetes is less than 130/80 mm Hg to reduce the risk of cardiovascular events and diabetic nephropathy (kidney disease).",
        "metadata": {"category": "BloodPressure", "topic": "Hypertension Target", "source": "ADA Guidelines"}
    },
    {
        "id": "insulin_1",
        "text": "For patients with type 2 diabetes presenting with extreme hyperglycemia (glucose >= 300 mg/dL or A1C >= 10%), insulin therapy should be initiated immediately to alleviate glucose toxicity.",
        "metadata": {"category": "Insulin", "topic": "Insulin Initiation", "source": "ADA Pharmacological Therapy"}
    },
    {
        "id": "insulin_2",
        "text": "If target glucose goals are not met with non-insulin agents (like Metformin) after 3-6 months, dual or triple combination therapy, or basal insulin, should be added to the regimen.",
        "metadata": {"category": "Insulin", "topic": "Combination Therapy", "source": "ADA Guidelines"}
    },
    {
        "id": "pedigree_1",
        "text": "A strong family history of diabetes (diabetes pedigree) significantly increases the genetic risk of type 2 diabetes. Individuals with first-degree relatives with diabetes should undergo screening starting at age 35, or earlier if overweight.",
        "metadata": {"category": "Pedigree", "topic": "Genetic Screening", "source": "ADA Clinical Reference"}
    },
    {
        "id": "age_1",
        "text": "In older adults (age 65+), glycemic goals should be individualized. For healthy older adults, A1C targets can remain < 7.0-7.5%, while for those with complex medical histories, a relaxed target of < 8.0% is appropriate.",
        "metadata": {"category": "Age", "topic": "Geriatric Care", "source": "ADA Guidelines"}
    }
]

# 5. Populate ChromaDB
ids = [g["id"] for g in guidelines]
documents = [g["text"] for g in guidelines]
metadatas = [g["metadata"] for g in guidelines]

print(f"Upserting {len(documents)} official guidelines into the vector store...")
collection.upsert(
    ids=ids,
    documents=documents,
    metadatas=metadatas
)

# 6. Verify by running a mock query
print("\nVerifying database seeding by executing a search query...")
test_query = "What fasting glucose target is recommended?"
results = collection.query(
    query_texts=[test_query],
    n_results=1
)

print(f"Test Query: '{test_query}'")
print(f"Top Retained Document: {results['documents'][0][0]}")
print(f"Cosine Distance Score: {results['distances'][0][0]:.4f}")
print("\nSuccess! Vector database populated and verified.")
