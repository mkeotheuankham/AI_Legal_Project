// src/utils/api.ts
import axios from "axios";

export interface MessageRecord {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
  sources: string[] | null;
}

const API_BASE_URL = "http://localhost:8000";

// **ສຳຄັນ:** ສ້າງ Function ໃໝ່ສຳລັບ Streaming
export const streamQuestion = async (
  question: string,
  onChunk: (chunk: string) => void,
  onSources: (sources: string[]) => void,
  onError: (error: string) => void
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let sourcesSent = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // ກວດສອບ chunk ທຳອິດເພື່ອເອົາແຫຼ່ງອ້າງອີງ
      if (!sourcesSent && chunk.startsWith("SOURCES:")) {
        try {
          const parts = chunk.split("\n");
          const sourcesJson = parts[0].replace("SOURCES:", "");
          const sources = JSON.parse(sourcesJson);
          onSources(sources);
          sourcesSent = true;
          // ສົ່ງສ່ວນທີ່ເຫຼືອຂອງ chunk (ຖ້າມີ)
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
