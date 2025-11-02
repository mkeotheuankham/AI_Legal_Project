# ໄຟລ໌: backend/app/schemas.py (ສະບັບແກ້ໄຂ)

from pydantic import BaseModel, ConfigDict
from typing import List
from datetime import datetime

# 1. ສ້າງ Schema ສໍາລັບ "ແຫຼ່ງອ້າງອີງ"
class SourceDocument(BaseModel):
    file: str
    article: str

class QARequest(BaseModel):
    question: str

class QAHistory(BaseModel):
    id: int
    question: str
    answer: str
    sources: List[SourceDocument] # <--- 2. ປ່ຽນຈາກ List[str] ເປັນ List[SourceDocument]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
