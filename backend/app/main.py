# app/main.py
import os
import json
import httpx
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from dotenv import load_dotenv

from . import models, schemas
from .database import SessionLocal, engine

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings

# **ສຳຄັນ:** ໂຫຼດ API Key ຈາກໄຟລ໌ .env
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Configuration ---
PERSIST_DIRECTORY = "db_vector"
EMBEDDING_MODEL = "intfloat/multilingual-e5-large"
# ໃຊ້ Gemini API URL ພ້ອມ API Key
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={GEMINI_API_KEY}"

# --- ໂຫຼດ AI Model ແລະ Database ຕຽມໄວ້ ---
print("ກຳລັງໂຫຼດ Embedding Model...")
embeddings = SentenceTransformerEmbeddings(model_name=EMBEDDING_MODEL)
print("ກຳລັງໂຫຼດ Vector Database...")
vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
retriever = vectordb.as_retriever(search_kwargs={"k": 5})

# -------------------------------

models.Base.metadata.create_all(bind=engine)
app = FastAPI()

# --- CORS Configuration ---
origins = ["http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- API Endpoints ---
@app.post("/ask", response_model=schemas.QAHistory)
async def ask_question(request: schemas.QuestionRequest, db: Session = Depends(get_db)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set in the environment.")
    
    try:
        # 1. ຄົ້ນຫາຂໍ້ມູນທີ່ກ່ຽວຂ້ອງ (Retrieval)
        relevant_docs = retriever.invoke(request.question)
        context = "\n\n".join([doc.page_content for doc in relevant_docs])
        
        source_files = [os.path.basename(doc.metadata.get('source', 'N/A')) for doc in relevant_docs]
        unique_sources = sorted(list(set(source_files)))

        # 2. ສ້າງ Prompt ສຳລັບ Gemini
        prompt = f"""
        ທ່ານເປັນຜູ້ຊ່ວຍ AI ດ້ານກົດໝາຍລາວທີ່ຊ່ຽວຊານ. 
        ໃຫ້ຕອບຄຳຖາມຕໍ່ໄປນີ້ເປັນພາສາລາວທີ່ຊັດເຈນ, ກະທັດຮັດ ແລະ ເຂົ້າໃຈງ່າຍ.
        ຄຳຕອບຕ້ອງອີງໃສ່ຂໍ້ມູນຈາກ "ຂໍ້ມູນອ້າງອີງ" ທີ່ໃຫ້ມາເທົ່ານັ້ນ.
        ໃຫ້ໃຊ້ Markdown formatting ເພື່ອເຮັດໃຫ້ຄຳຕອບອ່ານງ່າຍ (ເຊັ່ນ: ໃຊ້ `*` ສຳລັບ bullet points, `**ຄຳ**` ສຳລັບໂຕໜາ).
        ຖ້າຂໍ້ມູນບໍ່ພຽງພໍທີ່ຈະຕອບຄຳຖາມໄດ້, ໃຫ້ຕອບວ່າ "ຂໍອະໄພ, ຂ້າພະເຈົ້າບໍ່ສາມາດຊອກຫາຂໍ້ມູນທີ່ກ່ຽວຂ້ອງກັບຄຳຖາມນີ້ໃນຖານຂໍ້ມູນໄດ້."

        ---
        ຂໍ້ມູນອ້າງອີງ:
        {context}
        ---

        ຄຳຖາມ: {request.question}

        ຄຳຕອບທີ່ເປັນປະໂຫຍດ (ໃນຮູບແບບ Markdown):
        """

        # 3. ສົ່ງ Request ໄປຫາ Gemini API
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(GEMINI_API_URL, json=payload)
            response.raise_for_status()
            result = response.json()
            
            if (result.get('candidates') and result['candidates'][0].get('content')):
                answer = result['candidates'][0]['content']['parts'][0]['text']
            else:
                answer = "ຂໍອະໄພ, ເກີດຂໍ້ຜິດພາດໃນການສ້າງຄຳຕອບຈາກ AI."

        # 4. ບັນທຶກລົງຖານຂໍ້ມູນ
        db_qa = models.QAHistory(
            question=request.question, 
            answer=answer,
            sources=unique_sources
        )
        db.add(db_qa)
        db.commit()
        db.refresh(db_qa)
        
        return db_qa

    except httpx.HTTPStatusError as http_err:
        print(f"HTTP error occurred: {http_err} - {http_err.response.text}")
        raise HTTPException(status_code=500, detail=f"Error communicating with AI service: {http_err.response.text}")
    except Exception as e:
        print(f"Error in /ask: {e}")
        raise HTTPException(status_code=500, detail="Internal server error occurred.")

@app.get("/history", response_model=List[schemas.QAHistory])
def get_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        history = db.query(models.QAHistory).order_by(models.QAHistory.id.asc()).offset(skip).limit(limit).all()
        return history
    except Exception as e:
        print(f"Error in /history: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch history.")
