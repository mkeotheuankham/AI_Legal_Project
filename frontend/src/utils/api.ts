// ໄຟລ໌: frontend/src/utils/api.ts

// 1. Import ໂຄງສ້າງທີ່ຈຳເປັນ
import {
  type QAHistory,
  type SourceDocument,
  type ChatHistoryMessage,
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
      timestamp: item.timestamp || new Date().toISOString(), // ຮັບປະກັນ timestamp
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
export async function streamAskQuestion(
  question: string,
  history: ChatHistoryMessage[],
  signal: AbortSignal
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  try {
    const response = await fetch(`${API_BASE_URL}/stream-ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, history }),
      signal,
    });

    // --- ‼️ ວິທີແກ້ໄຂ Error [object Object] ‼️ ---
    if (!response.ok) {
      let errorDetail = response.statusText; // ຕັ້ງຄ່າເລີ່ມຕົ້ນ

      try {
        // ພະຍາຍາມອ່ານ Error ທີ່ເປັນ JSON
        const errorBody = await response.json();

        if (errorBody.detail) {
          // ກວດສອບວ່າ 'detail' ເປັນ Array (Pydantic Validation Error)
          if (Array.isArray(errorBody.detail)) {
            // ສະກັດຂໍ້ຄວາມທຳອິດອອກມາ
            errorDetail = errorBody.detail
              .map((err: any) => err.msg || JSON.stringify(err))
              .join(", ");
          } else {
            // ຖ້າເປັນ Object ຫຼື String ທຳມະດາ (Standard HTTPException)
            errorDetail = errorBody.detail;
          }
        }
      } catch (e) {
        // ຖ້າ Response ບໍ່ແມ່ນ JSON (ເຊັ່ນ 500 Server Error)
        console.warn("Could not parse error JSON, using statusText.");
      }

      // ໂຍນ Error ທີ່ອ່ານເຂົ້າໃຈໄດ້
      throw new Error(`Backend Error: ${errorDetail}`);
    }
    // --- ‼️ ສິ້ນສຸດການແກ້ໄຂ ‼️ ---

    if (!response.body) {
      throw new Error("No response body from server.");
    }

    return response.body.getReader();
  } catch (err: unknown) {
    if ((err as Error).name === "AbortError") {
      console.log("Fetch aborted by user.");
      throw new Error("ການເຊື່ອມຕໍ່ຖືກຍົກເລີກ.");
    }
    console.error("Failed to stream answer:", err);
    // ໂຍນ Error ໄປໃຫ້ ChatPage.tsx ສະແດງຜົນ
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
  } catch (err: unknown) {
    console.error("Failed to save chat to DB:", err);
  }
}
