// ໄຟລ໌: frontend/src/utils/api.ts (ສະບັບແກ້ໄຂ)

// 1. ດຶງ URL ຂອງ Backend ຈາກ Environment Variable
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// 2. ກำນົດ Type ຂອງຂໍ້ມູນທີ່ໄດ້ຮັບ (ໃຫ້ກົງກັບ schemas.py)
interface HistoryItem {
  id: number;
  question: string;
  answer: string;
  sources: string[];
  created_at: string;
}

// 3. ຕັ້ງ Type ຂອງຄຳຕອບ (ຄືກັນກັບ HistoryItem)
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
    return []; // ສົ່ງຄ່າ array ວ່າງກັບໄປຖ້າເກີດ error
  }
};

/**
 * ຟັງຊັນທີ 2: ສົ່ງຄຳຖາມໃໝ່
 * (ມີພຽງອັນດຽວ)
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
 * (ມີພຽງອັນດຽວ)
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
