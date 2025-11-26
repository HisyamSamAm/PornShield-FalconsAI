from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
from PIL import Image
import io

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model once at startup
model = pipeline("image-classification", model="Falconsai/nsfw_image_detection")

@app.post("/api/predict")
async def predict_nsfw(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read image
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data))

    # Run prediction
    results = model(image)

    # Assuming binary classification: nsfw or normal
    # Results are list of dicts: [{"label": "nsfw", "score": 0.987}, {"label": "normal", "score": 0.013}]
    # Take the highest score
    top_result = max(results, key=lambda x: x["score"])

    # Map to desired format
    label = "nsfw" if top_result["label"].lower() == "nsfw" else "normal"
    score = round(top_result["score"], 3)

    return {"label": label, "score": score}

@app.get("/")
def read_root():
    return {"message": "NSFW Detection API"}