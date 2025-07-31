# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from app.llm.local_llm import LegalAI
from app.database import SessionLocal, engine
from app import models, schemas

app = FastAPI()

# ການຕັ້ງຄ່າ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ເລີ່ມຕົ້ນ Database
models.Base.metadata.create_all(bind=engine)

# ໂຫລດ Legal AI model
legal_ai = LegalAI()

class QuestionRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_question(request: QuestionRequest):
    try:
        # ສົ່ງຄຳຖາມໄປຫາ Legal AI
        answer = legal_ai.generate_answer(request.question)
        
        # ເກັບຂໍ້ມູນໃນ Database
        db = SessionLocal()
        db_qa = models.QAHistory(
            question=request.question,
            answer=answer
        )
        db.add(db_qa)
        db.commit()
        db.refresh(db_qa)
        db.close()
        
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history", response_model=List[schemas.QAHistory])
async def get_history():
    db = SessionLocal()
    history = db.query(models.QAHistory).all()
    db.close()
    return history