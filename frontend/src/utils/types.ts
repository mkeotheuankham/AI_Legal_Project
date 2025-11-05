// ໄຟລ໌: frontend/src/utils/types.ts

// ໂຄງສ້າງສຳລັບແຫຼ່ງຂໍ້ມູນ (Rich Sources)
export interface SourceDocument {
  file: string;
  article: string | null; // ຮັບປະກັນວ່າ article ສາມາດເປັນ null
}

// ໂຄງສ້າງ Message ຫຼັກ (ສຳລັບສະແດງຜົນ)
export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  sources: SourceDocument[]; // ‼️ ຕ້ອງມີສະເໝີ (ເປັນ Array ວ່າງ) ‼️
}

// ໂຄງສ້າງປະຫວັດແຊັດ (ຈາກ Database)
export interface QAHistory {
  id: number;
  question: string;
  answer: string;
  sources: SourceDocument[];
  timestamp: string; // ‼️ ເພີ່ມ timestamp ‼️
}

// ໂຄງສ້າງປະຫວັດແຊັດ (ສຳລັບສົ່ງໄປ Backend)
// ‼️ ແກ້ໄຂໃຫ້ກົງກັບ Backend (main.py) ‼️
export interface ChatHistoryMessage {
  role: "user" | "model";
  parts: { text: string }[];
}
