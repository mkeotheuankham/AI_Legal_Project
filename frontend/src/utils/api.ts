// src/utils/api.ts
import axios from "axios";

// **ແກ້ໄຂ:** ເພີ່ມ sources ເຂົ້າໄປໃນ Interface
export interface MessageRecord {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
  sources: string[] | null; // sources ສາມາດເປັນ array ຂອງ string ຫຼື null
}

const API_BASE_URL = "http://localhost:8000";

export const sendQuestion = async (
  question: string
): Promise<MessageRecord> => {
  const response = await axios.post(`${API_BASE_URL}/ask`, { question });
  return response.data;
};

export const fetchHistory = async (): Promise<MessageRecord[]> => {
  const response = await axios.get(`${API_BASE_URL}/history`);
  return response.data;
};
