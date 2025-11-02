// ໄຟລ໌: frontend/src/utils/api.ts (ສະບັບແກ້ໄຂ)

// 1. ດຶງ URL ຂອງ Backend ຈາກ Environment Variable
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ===================================================================
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼ [ ນີ້ຄືຈຸດທີ່ແກ້ໄຂ ] ▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// ===================================================================
// 2. ສ້າງ Interface ໃໝ່ສໍາລັບແຫຼ່ງອ້າງອີງ
export interface SourceDoc {
  file: string;
  article: string;
}

// 3. ກໍານົດ Type ຂອງຂໍ້ມູນທີ່ໄດ້ຮັບ
export interface HistoryItem {
  id: number;
  question: string;
  answer: string;
  sources: SourceDoc[]; // <--- ປ່ຽນຈາກ string[] ເປັນ SourceDoc[]
  created_at: string;
}
// ===================================================================
// ▲▲▲▲▲▲▲▲▲▲▲▲▲ [ /ຈົບສ່ວນທີ່ແກ້ໄຂ ] ▲▲▲▲▲▲▲▲▲▲▲▲▲
// ===================================================================

// 4. ຕັ້ງ Type ຂອງຄໍາຕອບ
type AskResponse = HistoryItem;

/**
 * ຟັງຊັນທີ 1: ດຶງປະຫວັດການສົນທະນາ
 */
export const fetchHistory = async (): Promise<HistoryItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/history`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return [];
  }
};

/**
 * ຟັງຊັນທີ 2: ສົ່ງຄໍາຖາມໃໝ່
 */
export const askQuestion = async (question: string): Promise<AskResponse> => {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question: question }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to ask question");
  }

  return await response.json();
};

/**
 * ຟັງຊັນທີ 3: ລຶບປະຫວັດການສົນທະນາທັງໝົດ
 */
export const deleteHistory = async (): Promise<{ ok: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/history`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to delete history");
  }

  return await response.json();
};
