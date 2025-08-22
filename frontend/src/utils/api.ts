// src/utils/api.ts
import axios from "axios";

export interface MessageRecord {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
  sources: string[] | null;
}

// **ເພີ່ມ:** Interface ສຳລັບປະຫວັດການສົນທະນາ
interface HistoryMessage {
  role: "user" | "ai";
  text: string;
}

const API_BASE_URL = "http://localhost:8000";

export const streamQuestion = async (
  question: string,
  history: HistoryMessage[], // **ເພີ່ມ:** ຮັບ history ເປັນ parameter
  onChunk: (chunk: string) => void,
  onSources: (sources: string[]) => void,
  onError: (error: string) => void
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // **ເພີ່ມ:** ສົ່ງ history ໄປພ້ອມກັບ question
      body: JSON.stringify({ question, history }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    // ... (Streaming logic is the same)
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let sourcesSent = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      if (!sourcesSent && chunk.startsWith("SOURCES:")) {
        try {
          const parts = chunk.split("\n");
          const sourcesJson = parts[0].replace("SOURCES:", "");
          const sources = JSON.parse(sourcesJson);
          onSources(sources);
          sourcesSent = true;
          const remainingChunk = parts.slice(1).join("\n");
          if (remainingChunk) {
            onChunk(remainingChunk);
          }
        } catch (e) {
          console.error("Error parsing sources:", e);
        }
      } else {
        onChunk(chunk);
      }
    }
  } catch (error) {
    console.error("Streaming API error:", error);
    onError("ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ກັບ AI.");
  }
};

export const fetchHistory = async (): Promise<MessageRecord[]> => {
  const response = await axios.get(`${API_BASE_URL}/history`);
  return response.data;
};
