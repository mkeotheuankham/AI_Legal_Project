// ໄຟລ໌: frontend/src/utils/api.ts

// 1. Import ໂຄງສ້າງທີ່ຈຳເປັນ
import {
  type QAHistory,
  type SourceDocument,
  type ChatHistoryMessage, // ໃຊ້ ChatHistoryMessage ທີ່ຖືກຕ້ອງ
} from "./types";

const API_BASE_URL = "http://127.0.0.1:8000";

// --- 1. ດຶງປະຫວັດແຊັດ ---
export async function fetchHistory(): Promise<QAHistory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/history`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data: QAHistory[] = await response.json();
    // ຮັບປະກັນວ່າ timestamp ມີຢູ່ (ສຳຄັນ)
    return data.map((item) => ({
      ...item,
      timestamp: item.timestamp || new Date().toISOString(), // ‼️ ຮັບປະກັນ timestamp ‼️
    }));
  } catch (err: unknown) {
    console.error("Failed to fetch history:", err);
    throw new Error("ບໍ່ສາມາດໂຫຼດປະຫວັດການສົນທະນາໄດ້.");
  }
}

// --- 2. ລຶບປະຫວັດແຊັດ ---
export async function deleteHistory(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
  } catch (err: unknown) {
    console.error("Failed to delete history:", err);
    throw new Error("ບໍ່ສາມາດລຶບປະຫວັດການສົນທະນາໄດ້.");
  }
}

// --- 3. ຟັງຊັນຫຼັກ: ຖາມຄຳຖາມແບບ Stream ---
// ‼️ ແກ້ໄຂ: ຮັບ 3 arguments ‼️
export async function streamAskQuestion(
  question: string,
  history: ChatHistoryMessage[], // ຮັບ Chat Memory ທີ່ຖືກຕ້ອງ
  signal: AbortSignal // ຮັບ Abort Signal
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  try {
    const response = await fetch(`${API_BASE_URL}/stream-ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, history }), // ສົ່ງທັງຄຳຖາມ ແລະ ປະຫວັດ
      signal, // ສົ່ງ signal ໄປ
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(
        `Backend Error: ${errorBody.detail || response.statusText}`
      );
    }

    if (!response.body) {
      throw new Error("No response body from server.");
    }

    return response.body.getReader();
  } catch (err: unknown) {
    if ((err as Error).name === "AbortError") {
      console.log("Fetch aborted by user.");
      throw new Error("ການເຊື່ອມຕໍ່ຖືກຍົກເລີກ."); // ໂຍນ Error ໃຫ້ ChatPage ຈັດການ
    }
    console.error("Failed to stream answer:", err);
    throw new Error(`ການເຊື່ອມຕໍ່ລົ້ມເຫຼວ: ${(err as Error).message}`);
  }
}

// --- 4. ບັນທຶກແຊັດລົງ DB (ຫຼັງ Stream ຈົບ) ---
export async function saveChatToDB(
  question: string,
  answer: string,
  sources: SourceDocument[]
): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/save-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, answer, sources }),
    });
    // ບໍ່ຈຳເປັນຕ້ອງລໍຖ້າ response ຖ້າບໍ່ໄດ້ໃຊ້ມັນ
  } catch (err: unknown) {
    // ບໍ່ຕ້ອງ throw Error, ແຕ່ໃຫ້ Log ໄວ້
    console.error("Failed to save chat to DB:", err);
  }
}
