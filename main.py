from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import shutil
from pyannote.audio import Pipeline
import torch
from diarise import diarise
import uuid
import os
import numpy as np

# --- CONFIGURATION ---
SPEAKER_BANK_PATH = "embeddings/"
THRESHOLD = 0.75

# Global Variables
PIPELINE = None
SPEAKER_BANK = {}
results_store = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP LOGIC ---
    global PIPELINE, SPEAKER_BANK
    
    # 1. Load Diarization Pipeline
    print("Loading Diarization Pipeline...")
    PIPELINE = Pipeline.from_pretrained("pyannote/speaker-diarization-community-1")
    PIPELINE.to(torch.device("cuda" if torch.cuda.is_available() else "cpu"))
    
    # 2. Load Speaker Bank
    if not os.path.exists(SPEAKER_BANK_PATH):
        os.makedirs(SPEAKER_BANK_PATH)
    
    print("Loading Speaker Bank...")
    count = 0
    for f in os.listdir(SPEAKER_BANK_PATH):
        if f.endswith(".npy"):
            name = f.replace(".npy", "")
            path = os.path.join(SPEAKER_BANK_PATH, f)
            SPEAKER_BANK[name] = np.load(path)
            count += 1
    print(f"✅ Loaded {count} identities from speaker bank.")

    yield  # <--- The application runs while yielded

    # --- SHUTDOWN LOGIC ---
    # This runs when the server stops, clearing GPU cache if needed.
    print("Shutting down... clearing resources.")
    del PIPELINE
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

# --- APP INITIALIZATION ---
app = FastAPI(lifespan=lifespan) 

# Allow common origins for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# Compare a single embedding vector against the entire loaded bank
def identify_speaker(embedding):

    best_name = None
    best_score = 0.0
    
    for name, bank_emb in SPEAKER_BANK.items():
        # Cosine Similarity
        sim = np.dot(embedding, bank_emb) / (np.linalg.norm(embedding) * np.linalg.norm(bank_emb))
        
        if sim > best_score:
            best_score = sim
            best_name = name
            
    if best_score >= THRESHOLD:
        return best_name, float(best_score)
    
    return None, float(best_score)

def process_audio_task(file_path: str, task_id: str):
    try:
        # 1. Run Diarization
        output = diarise(file_path, PIPELINE)
        
        # 2. Extract Embeddings
        raw_embeddings = output.speaker_embeddings
        if len(raw_embeddings.shape) == 1:
            raw_embeddings = raw_embeddings[np.newaxis, :]
            
        # 3. Create a Map: { "SPEAKER_00": "John_Doe", "SPEAKER_01": "SPEAKER_01" }
        speaker_map = {}
        sorted_speakers = sorted(output.speaker_diarization.labels())
        
        for i, label in enumerate(sorted_speakers):
            if i < len(raw_embeddings):
                emb = raw_embeddings[i]
                identity, score = identify_speaker(emb)
                
                if identity:
                    speaker_map[label] = identity # Replace with Name
                else:
                    speaker_map[label] = label    # Keep generic ID
        
        # 4. Format Results with Real Names
        formatted_result = []
        for turn, speaker in output.speaker_diarization:
            original_label = str(speaker)
            final_name = speaker_map.get(original_label, original_label)
            
            formatted_result.append({
                "start": turn.start,
                "end": turn.end,
                "speaker": final_name
            })
        
        results_store[task_id] = {
            "status": "completed", 
            "result": formatted_result
        }

    except Exception as e:
        print(f"Error processing {task_id}: {e}")
        results_store[task_id] = {"status": "failed", "error": str(e)}
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

# Starts a diarization task for an uploaded audio file.
@app.post("/diarize/")
async def create_upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    task_id = str(uuid.uuid4()) 
    results_store[task_id] = {"status": "processing", "result": None}
    
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    background_tasks.add_task(process_audio_task, temp_path, task_id)
    
    return {"task_id": task_id, "message": "Processing started"}

# Returns the status of a diarization task.
@app.get("/status/{task_id}")
async def get_status(task_id: str):
    status_info = results_store.get(task_id)
    if not status_info:
        return {"error": "Invalid Task ID"}, 404
    return status_info

# Returns a list of all enrolled speaker names.
@app.get("/speakers")
async def get_speakers():
    speaker_names = list(SPEAKER_BANK.keys())
    return {"speakers": speaker_names, "total": len(speaker_names)}