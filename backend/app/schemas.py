# app/schemas.py
from pydantic import BaseModel
from datetime import datetime

class QAHistoryBase(BaseModel):
    question: str
    answer: str

class QAHistory(QAHistoryBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True