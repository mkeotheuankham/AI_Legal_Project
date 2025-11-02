# ໄຟລ໌: backend/app/main.py (ສະບັບແກ້ໄຂ)

import os
import httpx
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from dotenv import load_dotenv

from . import models, schemas
from .database import SessionLocal, engine

# Import ຈາກ package ໃໝ່
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

# ໂຫຼດ .env
load_dotenv() 
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("FATAL ERROR: ບໍ່ພົບ 'GEMINI_API_KEY' ໃນໄຟລ໌ .env")
    # ... (error message) ...

# --- Configuration ---
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(APP_DIR, os.pardir))
PERSIST_DIRECTORY = os.path.join(BACKEND_DIR, "db_vector")
EMBEDDING_MODEL = "intfloat/multilingual-e5-base"

# ===================================================================
# ▼▼▼▼▼▼▼▼▼▼▼▼▼▼ [ ນີ້ຄືຈຸດທີ່ແກ້ໄຂ ] ▼▼▼▼▼▼▼▼▼▼▼▼▼▼
# ===================================================================
# ປ່ຽນຊື່ Model ໃຫ້ກົງກັບລາຍການຈາກ curl (ບໍ່ມີ 1.5)
GEMINI_MODEL = "gemini-flash-latest"
# ===================================================================
# ▲▲▲▲▲▲▲▲▲▲▲▲▲ [ /ຈົບສ່ວນທີ່ແກ້ໄຂ ] ▲▲▲▲▲▲▲▲▲▲▲▲▲
# ===================================================================

GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"


# --- Loading Models (Global - CPU-only) ---
print("ກຳລັງໂຫຼດ Embedding Model...")
embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL,
    model_kwargs={'device': 'cpu'}, 
    encode_kwargs={'normalize_embeddings': True}
)

print("ກຳລັງໂຫຼດ Vector Database...")
try:
    vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
    retriever = vectordb.as_retriever(search_kwargs={"k": 5})
    print("Vector Database ໂຫຼດສຳເລັດ.")
except Exception as e:
    print(f"Error loading Vector DB from {PERSIST_DIRECTORY}: {e}")
    retriever = None

# --- DB and App Setup ---
models.Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Helper Function ---
def format_docs(docs: List[Document]) -> str:
    # ... (ເນື້ອໃນຟັງຊັນຄືເກົ່າ) ...
    formatted = []
    for i, doc in enumerate(docs):
        source = doc.metadata.get('source', 'N/A')
        article = doc.metadata.get('article', 'N/A')
        content = doc.page_content
        formatted.append(f"--- ແຫຼ່ງອ້າງອີງ {i+1} (ຈາກ {source} - {article}) ---\n{content}\n---")
    return "\n\n".join(formatted)

# --- API Endpoints ---
@app.on_event("startup")
async def startup_event():
    # ... (ເນື້ອໃນຟັງຊັນຄືເກົ່າ) ...
    if retriever is None:
        print("WARNING: Server is running, but Retriever is not loaded.")
    else:
        print("Application startup complete. Models loaded.")

@app.post("/ask", response_model=schemas.QAHistory)
async def ask(request: schemas.QARequest, db: Session = Depends(get_db)):
    if retriever is None:
        raise HTTPException(status_code=500, detail="Vector Database is not loaded. Please run ingest.py.")
    
    try:
        print(f"Received question: {request.question}")
        
        # 1. ດຶງຂໍ້ມູນ (Retrieve context)
        print("Retrieving context...")
        relevant_docs = retriever.invoke(request.question)
        context = format_docs(relevant_docs)
        unique_sources = sorted(list(set([doc.metadata.get("source", "N/A") for doc in relevant_docs])))
        
        # 2. ສ້າງ Prompt ສົ່ງໃຫ້ Gemini
        prompt = f"""
        ທ່ານຄື AI ຜູ້ຊ່ວຍດ້ານກົດໝາຍຂອງ ສປປ ລາວ ທີ່ຊື່ສັດ ແລະ ຕອບຕາມຄວາມຈິງ.
        ກະລຸນາຕອບຄຳຖາມໂດຍອີງໃສ່ "ຂໍ້ມູນອ້າງອີງ" ທີ່ໃຫ້ມາເທົ່ານັ້ນ.
        ຫ້າມຄິດຄຳຕອບເອງ ຫຼື ໃຊ້ຄວາມຮູ້ນອກເໜືອຈາກຂໍ້ມູນອ້າງອີງ.
        ຖ້າຂໍ້ມູນອ້າງອີງບໍ່ມີຄຳຕອບ, ໃຫ້ຕອບວ່າ "ຂໍອະໄພ, ຂ້າພະເຈົ້າບໍ່ສາມາດຊອກຫາຂໍ້ມູນກ່ຽວກັບເລື່ອງນີ້ໄດ້ໃນຖານຂໍ້ມູນ".

        ຂໍ້ມູນອ້າງອີງ:
        {context}
        
        ຄຳຖາມ:
        {request.question}
        
        ຄຳຕອບ (ຕອບເປັນພາສາລາວ):
        """
        
        # 3. ເອີ້ນ Gemini API
        print("Calling Gemini API...")
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(GEMINI_API_URL, json=payload)
            
            if response.status_code != 200:
                print(f"Gemini API Error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=500, detail=f"Gemini API Error: {response.text}")

            result = response.json()
            
            # 4. ແກະຄຳຕອບ
            answer = "ຂໍອະໄພ, ເກີດຂໍ້ຜິດພາດໃນການສ້າງຄຳຕອບຈາກ AI."
            if (result.get('candidates') and 
                result['candidates'][0].get('content') and
                result['candidates'][0]['content']['parts'][0].get('text')):
                answer = result['candidates'][0]['content']['parts'][0]['text'].strip()
            else:
                block_reason = result.get('promptFeedback', {}).get('blockReason', 'Unknown')
                answer = f"ຂໍອະໄພ, ຄຳຕອບຖືກບລັອກໂດຍ Gemini. ເຫດຜົນ: {block_reason}"

        # 5. ບັນທຶກລົງ DB
        print("Saving to database...")
        db_qa = models.QAHistory(
            question=request.question, 
            answer=answer,
            sources=unique_sources
        )
        db.add(db_qa)
        db.commit()
        db.refresh(db_qa)
        
        print("Done.")
        return db_qa

    except Exception as e:
        db.rollback()
        print(f"Error in /ask: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error occurred: {str(e)}")

@app.get("/history", response_model=List[schemas.QAHistory])
def get_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # ... (ເນື້ອໃນຟັງຊັນຄືເກົ່າ) ...
    try:
        history = db.query(models.QAHistory).order_by(models.QAHistory.id.desc()).offset(skip).limit(limit).all()
        return history
    except Exception as e:
        print(f"Error in /history: {e}")
        raise HTTPException(status_code=500, detail="Internal server error occurred.")

@app.delete("/history")
def delete_history(db: Session = Depends(get_db)):
    # ... (ເນື້ອໃນຟັງຊຄືເກົ່າ) ...
    try:
        num_rows_deleted = db.query(models.QAHistory).delete()
        db.commit()
        return {"ok": True, "num_rows_deleted": num_rows_deleted}
    except Exception as e:
        db.rollback()
        print(f"Error in /history DELETE: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete. {str(e)}")
