# ໄຟລ໌: backend/app/schemas.py

from pydantic import BaseModel, ConfigDict # [ ແກ້ໄຂ 1 ] - Import ConfigDict
from typing import List
from datetime import datetime # [ ແກ້ໄຂ 2 ] - Import datetime

class QARequest(BaseModel):
    question: str

# ແຍກ Base Model ເພື່ອການຈັດການທີ່ງ່າຍຂຶ້ນ
class QAHistoryBase(BaseModel):
    question: str
    answer: str
    sources: List[str] = []

# Schema ສໍາລັບການສົ່ງຂໍ້ມູນອອກ (Response)
class QAHistory(QAHistoryBase):
    id: int
    created_at: datetime # [ ແກ້ໄຂ 3 ] - ເພີ່ມ created_at ເພື່ອໃຫ້ກົງກັບ models.py

    # [ ແກ້ໄຂ 4 ] - ປ່ຽນໄປໃຊ້ Pydantic V2 (model_config)
    model_config = ConfigDict(from_attributes=True)