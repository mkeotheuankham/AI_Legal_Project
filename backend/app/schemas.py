# app/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any # **ເພີ່ມ:** Optional, Any

class QuestionRequest(BaseModel):
    question: str

class QAHistory(BaseModel):
    id: int
    question: str
    answer: str
    timestamp: datetime
    # **ເພີ່ມ:** ເພີ່ມ sources ເຂົ້າໄປใน Schema, 
    # Optional ໝາຍຄວາມວ່າຂໍ້ມູນເກົ່າທີ່ບໍ່ມີ sources ກໍຍັງໃຊ້ງານໄດ້
    sources: Optional[List[str]] = None

    class Config:
        from_attributes = True

class AnswerResponse(BaseModel):
    answer: str
    # **ເພີ່ມ:** ສົ່ງ sources ກັບໄປນຳ
    sources: List[str]
