# app/models.py
from sqlalchemy import Column, Integer, String, DateTime, JSON
from .database import Base
from datetime import datetime, timezone # **ເພີ່ມ:** import timezone

class QAHistory(Base):
    __tablename__ = "qa_history"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, index=True)
    answer = Column(String)
    
    # **ຈຸດສຳຄັນ:** ບັງຄັບໃຫ້ທຸກໆເວລາທີ່ບັນທຶກ ເປັນເວລາ UTC ທີ່ສົມບູນ
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    sources = Column(JSON)
