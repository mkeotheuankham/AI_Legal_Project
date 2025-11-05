# ໄຟລ໌: backend/app/main.py (ແກ້ໄຂ KeyError 'parts')

import os
import httpx
import json
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, AsyncGenerator, Dict, Any
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

from . import models, schemas
from .database import SessionLocal, engine

# --- Configuration ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("FATAL ERROR: ບໍ່ພົບ 'GEMINI_API_KEY' ໃນໄຟລ໌ .env")

APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(APP_DIR, os.pardir))
PERSIST_DIRECTORY = os.path.join(BACKEND_DIR, "db_vector")

EMBEDDING_MODEL = "intfloat/multilingual-e5-base"
GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025" # ຊື່ Model ທີ່ເຮົາ List ມາໄດ້

# --- Loading Models ---
print("ກຳລັງໂຫຼດ Embedding Model...")
embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL,
    model_kwargs={},
    encode_kwargs={'normalize_embeddings': True}
)

print("ກຳລັງໂຫຼດ Vector Database...")
try:
    vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
    retriever = vectordb.as_retriever(search_kwargs={"k": 5}) # ດຶງ 5 chunks
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

# --- Helper Functions ---
def format_docs(docs: List[Document]) -> str:
    """
    ຊ່ວຍຈັດຮູບແບບ context ຈາກ vector store ໃຫ້ Gemini ອ່ານງ່າຍ.
    """
    formatted = []
    for i, doc in enumerate(docs):
        source = doc.metadata.get('source', 'N/A')
        article = doc.metadata.get('article', 'N/A')
        content = doc.page_content
        formatted.append(f"--- ແຫຼ່ງອ້າງອີງ {i+1} (ຈາກ {source} - {article}) ---\n{content}\n---")
    return "\n\n".join(formatted)

def get_sources_from_docs(docs: List[Document]) -> List[schemas.SourceDocument]:
    """
    ດຶງແຫຼ່ງຂໍ້ມູນ (ແບບບໍ່ຊໍ້າຊ້ອນ) ຈາກ metadata ຂອງ RAG.
    """
    unique_sources_map = {}
    for doc in docs:
        source_file = doc.metadata.get("source", "N/A")
        article_name = doc.metadata.get("article", "ບໍ່ມີຊື່ມາດຕາ").strip()
        if not article_name:
            article_name = "ບໍ່ມີຊື່ມາດຕາ"
        
        key = (source_file, article_name)
        if key not in unique_sources_map:
            unique_sources_map[key] = schemas.SourceDocument(
                file=source_file,
                article=article_name
            )
    
    return list(unique_sources_map.values())

# --- Streaming Generator (ແກ້ໄຂ Memory Logic) ---
async def stream_generator(request: schemas.QARequest) -> AsyncGenerator[str, None]:
    """
    ຟັງຊັນຫຼັກທີ່ເຮັດ RAG, ເອີ້ນ Gemini ແບບ Stream, ແລະ ສົ່ງຂໍ້ມູນຄືນ
    """
    if retriever is None:
        yield json.dumps({"type": "error", "data": "Vector Database is not loaded"}) + "\n"
        return

    try:
        # 1. ດຶງຂໍ້ມູນ (Retrieve context) - ໃຊ້ຄຳຖາມໃໝ່
        print("Retrieving context...")
        relevant_docs = retriever.invoke(request.question)
        context = format_docs(relevant_docs)
        sources = get_sources_from_docs(relevant_docs)

        # 2. ສົ່ງ Sources ກັບໄປກ່ອນ
        yield json.dumps({"type": "sources", "data": [s.model_dump() for s in sources]}) + "\n"

        # 3. ສ້າງ Payload ຂອງ Gemini (ແບບມີປະຫວັດ)

        # 3.1 ສ້າງ "contents" ຈາກ ປະຫວັດທີ່ສົ່ງມາ
        gemini_history = []
        for msg in request.history:
            gemini_history.append({
                "role": msg.role,
                "parts": [{"text": msg.parts}]
            })
        
        # 3.2 ສ້າງ "Prompt" ໃໝ່ (ແກ້ໄຂ Logic)
        final_prompt_text = f"""
        (System Prompt: ທ່ານຄື AI ຜູ້ຊ່ວຍດ້ານກົດໝາຍຂອງ ສປປ ລາວ.
        ໜ້າທີ່ຂອງທ່ານຄື ຕອບຄຳຖາມໃໝ່ຂອງຜູ້ໃຊ້ ໂດຍອີງໃສ່ "ປະຫວັດການສົນທະນາ" (ຖ້າມີ) ແລະ "ຂໍ້ມູນອ້າງອີງໃໝ່" (RAG) ທີ່ສະໜອງໃຫ້.

        **ຄຳສັ່ງໃນການຕອບ (ສຳຄັນທີ່ສຸດ):**

        1.  **ອ່ານປະຫວັດການສົນທະນາ:** ເພື່ອເຂົ້າໃຈບໍລິບົດ (Context) ວ່າຄຳຖາມໃໝ່ (ເຊັ່ນ "ມັນ", "ລາວ") ໝາຍເຖິງຫຍັງ.
        2.  **ກວດສອບປະຫວັດການສົນທະນາ:** ຖ້າຄຳຖາມໃໝ່ ເປັນການຖາມຕໍ່ເນື່ອງຈາກຄຳຕອບກ່ອນໜ້າ (ເຊັ່ນ "ມັນມີຈັກປະເພດ?" ຫຼັງຈາກຖາມ "ໃບຕາດິນແມ່ນຫຍັງ?"), ໃຫ້ທ່ານໃຊ້ຂໍ້ມູນຈາກ "ຄຳຕອບກ່ອນໜ້າ" ເປັນຫຼັກໃນການຕອບ.
        3.  **ກວດສອບຂໍ້ມູນອ້າງອີງໃໝ່ (RAG):** ຖ້າຄຳຖາມໃໝ່ ເປັນຫົວຂໍ້ໃໝ່, ຫຼື ປະຫວັດການສົນທະນາບໍ່ມີຄຳຕອບ, ໃຫ້ທ່ານໃຊ້ "ຂໍ້ມູນອ້າງອີງໃໝ່" ທີ່ສະໜອງໃຫ້ ເພື່ອຕອບ.
        4.  **ຫ້າມຄິດເອງ:** ໃຫ້ຕອບຕາມ "ປະຫວັດການສົນທະນາ" ຫຼື "ຂໍ້ມູນອ້າງອີງໃໝ່" ເທົ່ານັ້ນ.
        5.  **ຖ້າບໍ່ມີຂໍ້ມູນ:** ຖ້າທັງ "ປະຫວັດ" ແລະ "ຂໍ້ມູນອ້າງອີງໃໝ່" ບໍ່ມີຄຳຕອບ, ໃຫ້ຕອບວ່າ "ຂໍອະໄພ, ຂ້າພະເຈົ້າບໍ່ສາມາດຊອກຫາຂໍ້ມູນກ່ຽວກັບເລື່ອງນີ້ໄດ້ໃນຖານຂໍ້ມູນ".

        --- ຂໍ້ມູນອ້າງອີງໃໝ່ (RAG - ໃຊ້ສຳລັບຄຳຖາມໃໝ່ ຖ້າປະຫວັດບໍ່ມີຄຳຕອບ) ---
        {context}
        --- ສິ້ນສຸດຂໍ້ມູນອ້າງອີງໃໝ່ ---
        
        ຄຳຖາມໃໝ່ (ຈາກຜູ້ໃຊ້):
        {request.question}
        
        ຄຳຕອບ (ຕອບເປັນພາສາລາວ, ໂດຍປະຕິບັດຕາມຄຳສັ່ງຂ້າງເທິງ):
        """
        
        gemini_history.append({
            "role": "user",
            "parts": [{"text": final_prompt_text}]
        })
        
        payload = {"contents": gemini_history}

        # 4. ກຽມເອີ້ນ Gemini API (Streaming)
        STREAMING_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:streamGenerateContent?key={GEMINI_API_KEY}"
        
        print("Calling Gemini API with chat history...")
        json_buffer = ""

        async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
            async with client.stream("POST", STREAMING_API_URL, json=payload) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    error_detail = f"Gemini API Error: {response.status_code} - {error_text.decode()}"
                    print(error_detail)
                    yield json.dumps({"type": "error", "data": error_detail}) + "\n"
                    return

                # 5. ‼️ ອ່ານ Stream (ແກ້ໄຂ KeyError 'parts') ‼️
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    
                    json_buffer += line.strip()

                    try:
                        if (json_buffer.startswith('{') and json_buffer.endswith('}')) or \
                           (json_buffer.startswith('[') and json_buffer.endswith(']')):
                            
                            data = json.loads(json_buffer)
                            json_buffer = "" # ລ້າງ buffer ຫຼັງຈາກ decode ສຳເລັດ

                            items = data if isinstance(data, list) else [data]

                            for item in items:
                                # --- ‼️ ໂຄດທີ່ປອດໄພກວ່າ (Safer Parsing) ‼️ ---
                                candidates = item.get('candidates')
                                if not candidates or not isinstance(candidates, list):
                                    continue # ບໍ່ແມ່ນ content chunk

                                candidate = candidates[0]
                                content = candidate.get('content')
                                
                                if not content:
                                    # ກວດສອບ Safety blocks
                                    finish_reason = candidate.get('finishReason')
                                    if finish_reason == 'SAFETY':
                                        print("Warning: Gemini response blocked due to safety settings.")
                                        yield json.dumps({"type": "error", "data": "ຄຳຕອບຖືກບລັອກເນື່ອງຈາກນະໂຍບາຍຄວາມປອດໄພ."}) + "\n"
                                    continue # ບໍ່ມີ content

                                # ‼️ .get('parts') ເພື່ອຫຼີກລ້ຽງ KeyError ‼️
                                parts = content.get('parts') 
                                if not parts or not isinstance(parts, list) or len(parts) == 0:
                                    continue # ບໍ່ມີ 'parts' (ນີ້ຄືຈຸດທີ່ແກ້ໄຂ)

                                text_chunk = parts[0].get('text')
                                if text_chunk:
                                    yield json.dumps({"type": "chunk", "data": text_chunk}) + "\n"
                                # --- ------------------- ---

                    except json.JSONDecodeError:
                        # Buffer ຍັງບໍ່ສົມບູນ, ລໍຖ້າ line ຕໍ່ໄປ
                        continue

        print("Stream complete.")

    except Exception as e:
        print(f"Error in stream_generator: {e}")
        yield json.dumps({"type": "error", "data": str(e)}) + "\n"

# --- API Endpoints ---
@app.on_event("startup")
async def startup_event():
    if retriever is None:
        print("WARNING: Server is running, but Retriever is not loaded.")
    else:
        print("Application startup complete. Models loaded.")

# 1. Endpoint ໃໝ່ສຳລັບ Streaming
@app.post("/stream-ask")
async def stream_ask(request: schemas.QARequest):
    print(f"Received question for streaming: {request.question}")
    return StreamingResponse(stream_generator(request), media_type="application/x-ndjson")

# 2. Endpoint ໃໝ່ສຳລັບບັນທຶກ Chat
@app.post("/save-chat", response_model=schemas.QAHistory)
def save_chat(request: schemas.SaveChatRequest, db: Session = Depends(get_db)):
    try:
        print("Saving chat to database...")
        
        sources_as_dicts = [s.model_dump() for s in request.sources]
        
        db_qa = models.QAHistory(
            question=request.question,
            answer=request.answer,
            sources=sources_as_dicts
        )
        db.add(db_qa)
        db.commit()
        db.refresh(db_qa)
        print(f"Chat saved with ID: {db_qa.id}")
        return db_qa
    except Exception as e:
        db.rollback()
        print(f"Error saving chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to save chat.")

# 3. Endpoint ເກົ່າ (ສຳຮອງ - ບໍ່ໄດ້ໃຊ້)
@app.post("/ask", response_model=schemas.QAHistory)
async def ask(request: schemas.QARequest, db: Session = Depends(get_db)):
    if retriever is None:
        raise HTTPException(status_code=500, detail="Vector Database is not loaded.")
    
    try:
        relevant_docs = retriever.invoke(request.question)
        sources = get_sources_from_docs(relevant_docs)
        sources_as_dicts = [s.model_dump() for s in sources]
        
        answer = "This is a non-streaming answer (fallback)."

        db_qa = models.QAHistory(
            question=request.question, 
            answer=answer,
            sources=sources_as_dicts
        )
        db.add(db_qa)
        db.commit()
        db.refresh(db_qa)
        return db_qa
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# 4. Endpoint ດຶງປະຫວັດ
@app.get("/history", response_model=List[schemas.QAHistory])
def get_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        history = db.query(models.QAHistory).order_by(models.QAHistory.created_at.asc()).offset(skip).limit(limit).all()
        return history
    except Exception as e:
        print(f"Error in /history: {e}")
        raise HTTPException(status_code=500, detail="Internal server error occurred.")

# 5. Endpoint ລຶບປະຫວັດ
@app.delete("/history")
def delete_history(db: Session = Depends(get_db)):
    try:
        num_rows_deleted = db.query(models.QAHistory).delete()
        db.commit()
        return {"ok": True, "num_rows_deleted": num_rows_deleted}
    except Exception as e:
        db.rollback()
        print(f"Error in /history DELETE: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete history.")