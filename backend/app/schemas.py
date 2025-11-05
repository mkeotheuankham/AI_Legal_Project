# ໄຟລ໌: backend/app/schemas.py (ສະບັບເຕັມ)

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

# --- Schemas ສໍາລັບ Chat Memory ---

class ChatHistoryMessage(BaseModel):
    """
    ໂຄງສ້າງຂອງຂໍ້ຄວາມໃນປະຫວັດແຊັດທີ່ສົ່ງມາຈາກ Frontend
    """
    role: str  # ຈະເປັນ "user" ຫຼື "model" (model ຄື ai)
    parts: str # ເນື້ອໃນຂໍ້ຄວາມ

# --- Schemas ສໍາລັບ Endpoint ຫຼັກ ---

class QARequest(BaseModel):
    """
    ສິ່ງທີ່ Frontend ສົ່ງມາເມື່ອຖາມຄຳຖາມ (/stream-ask)
    """
    question: str
    history: List[ChatHistoryMessage] # ປະຫວັດແຊັດ 4-6 ຂໍ້ຄວາມຫຼ້າສຸດ

class SourceDocument(BaseModel):
    """
    ໂຄງສ້າງຂອງແຫຼ່ງຂໍ້ມູນ (Rich Sources)
    """
    file: str
    article: str

class SaveChatRequest(BaseModel):
    """
    ສິ່ງທີ່ Frontend ສົ່ງມາເພື່ອບັນທຶກລົງ DB (/save-chat)
    """
    question: str
    answer: str
    sources: List[SourceDocument]

# --- Schemas ສໍາລັບ Response (ສິ່ງທີ່ສົ່ງກັບໄປ) ---

class QAHistory(BaseModel):
    """
    ໂຄງສ້າງຂອງຂໍ້ມູນປະຫວັດ ທີ່ດຶງຈາກ DB (GET /history)
    """
    id: int
    question: str
    answer: str
    sources: List[SourceDocument] # ໃຊ້ SourceDocument ໃໝ່
    created_at: datetime

    # ບອກ Pydantic ให้อ่านข้อมูลจาก ORM (SQLAlchemy)
    model_config = ConfigDict(from_attributes=True) # ສຳລັບ Pydantic V2