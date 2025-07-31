// src/pages/ChatPage.tsx
import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { Box, Container, Typography } from "@mui/material";
import ChatBubble from "../components/ChatBubble";
import InputBar from "../components/InputBar";
import HistoryPanel from "../components/HistoryPanel";
import { fetchHistory, sendQuestion } from "../utils/api";

interface Message {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
}

export default function ChatPage(): ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendQuestion = async (question: string) => {
    setIsLoading(true);
    try {
      const response = await sendQuestion(question);
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          question,
          answer: response.answer,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error sending question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await fetchHistory();
        setMessages(
          history.map((item, index) => ({
            id: index + 1,
            question: item.question,
            answer: item.answer,
            timestamp: new Date().toISOString(),
          }))
        );
      } catch (error) {
        console.error("Error loading history:", error);
      }
    };
    loadHistory();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        ຊ່ວຍເຫຼືອດ້ານກົດໝາຍ
      </Typography>

      <Box sx={{ height: "70vh", overflowY: "auto", mb: 2 }}>
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            question={message.question}
            answer={message.answer}
            timestamp={message.timestamp}
          />
        ))}
      </Box>

      <InputBar onSend={handleSendQuestion} isLoading={isLoading} />

      <HistoryPanel messages={messages} />
    </Container>
  );
}
