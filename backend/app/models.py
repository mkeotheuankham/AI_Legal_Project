# app/models.py
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class QAHistory(Base):
    __tablename__ = "qa_history"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(500))
    answer = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())