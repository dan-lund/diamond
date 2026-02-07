from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import shutil
from pyannote.audio import Pipeline
import torch
from functions import diarise
import uuid
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], # Vite & Next default ports
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your pipeline on startup
PIPELINE = Pipeline.from_pretrained("pyannote/speaker-diarization-community-1")
PIPELINE.to(torch.device("cuda" if torch.cuda.is_available() else "cpu"))

def process_audio_task(file_path: str, task_id: str):
    try:
        
        output = diarise(file_path, PIPELINE)
        
        formatted_result = []
        for turn, speaker in output.speaker_diarization:
            formatted_result.append({
                "start": turn.start,
                "end": turn.end,
                "speaker": str(speaker) 
            })
        
        results_store[task_id] = {
            "status": "completed", 
            "result": formatted_result
        }

    except Exception as e:
        results_store[task_id] = {"status": "failed", "error": str(e)}
    finally:
        if os.path.exists(file_path):
            os.remove(file_path) # Clean up the audio file

results_store = {}

@app.post("/diarize/")
async def create_upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    task_id = str(uuid.uuid4()) 
    results_store[task_id] = {"status": "processing", "result": None}
    
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Pass the task_id to the background worker
    background_tasks.add_task(process_audio_task, temp_path, task_id)
    
    return {"task_id": task_id, "message": "Processing started"}


@app.get("/status/{task_id}")
async def get_status(task_id: str):
    status_info = results_store.get(task_id)
    if not status_info:
        return {"error": "Invalid Task ID"}, 404
    return status_info