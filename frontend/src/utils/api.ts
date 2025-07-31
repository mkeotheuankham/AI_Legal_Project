// src/utils/api.ts
import axios from "axios";

interface ApiResponse {
  answer: string;
}

interface HistoryItem {
  question: string;
  answer: string;
}

const API_BASE_URL = "http://localhost:8000";

export const sendQuestion = async (question: string): Promise<ApiResponse> => {
  const response = await axios.post(`${API_BASE_URL}/ask`, { question });
  return response.data;
};

export const fetchHistory = async (): Promise<HistoryItem[]> => {
  const response = await axios.get(`${API_BASE_URL}/history`);
  return response.data;
};
