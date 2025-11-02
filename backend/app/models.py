from sqlalchemy import Column, Integer, String, JSON, DateTime, func
from .database import Base

class QAHistory(Base):
    __tablename__ = "qa_history"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, index=True)
    answer = Column(String)
    sources = Column(JSON) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())