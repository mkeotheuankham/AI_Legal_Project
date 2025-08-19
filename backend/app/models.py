# app/models.py
from sqlalchemy import Column, Integer, String, DateTime, JSON # **ເພີ່ມ:** JSON
from sqlalchemy.sql import func
from .database import Base

class QAHistory(Base):
    __tablename__ = "qa_history"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, index=True)
    answer = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    # **ເພີ່ມ:** ຖັນໃໝ່ສຳລັບເກັບແຫຼ່ງອ້າງອີງໃນຮູບແບບ JSON
    sources = Column(JSON)
