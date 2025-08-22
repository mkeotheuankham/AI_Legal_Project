# app/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any

# **ເພີ່ມ:** Schema ສຳລັບຂໍ້ຄວາມໃນປະຫວັດ
class HistoryMessage(BaseModel):
    role: str # "user" or "model"
    text: str

class QuestionRequest(BaseModel):
    question: str
    # **ເພີ່ມ:** ຮັບເອົາປະຫວັດການສົນທະນາຈາກ Frontend
    history: Optional[List[HistoryMessage]] = None

class QAHistory(BaseModel):
    id: int
    question: str
    answer: str
    timestamp: datetime
    sources: Optional[List[str]] = None

    class Config:
        from_attributes = True
