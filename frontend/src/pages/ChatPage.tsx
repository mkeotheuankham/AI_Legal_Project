// src/pages/ChatPage.tsx
import { useState, useEffect, useRef, type ReactElement } from "react";
import { Box, Container, Typography, Alert } from "@mui/material";
import ChatBubble from "../components/ChatBubble";
import InputBar from "../components/InputBar";
import { fetchHistory, sendQuestion } from "../utils/api";

// **ແກ້ໄຂ:** ເພີ່ມ sources ເຂົ້າໄປໃນ Interface
interface Message {
  id: number | string;
  sender: "user" | "ai";
  text: string;
  timestamp?: string;
  sources?: string[] | null;
}

export default function ChatPage(): ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setError(null);
        const history = await fetchHistory();
        const formattedMessages: Message[] = [];
        history.forEach((item) => {
          formattedMessages.push({
            id: `${item.id}-q`,
            sender: "user",
            text: item.question,
            timestamp: item.timestamp,
          });
          formattedMessages.push({
            id: item.id,
            sender: "ai",
            text: item.answer,
            timestamp: item.timestamp,
            sources: item.sources, // **ເພີ່ມ:** ໂຫຼດ sources ຈາກ history
          });
        });
        setMessages(formattedMessages);
      } catch (err) {
        console.error("Error loading history:", err);
        setError("ບໍ່ສາມາດໂຫຼດປະຫວັດການສົນທະນາໄດ້.");
      }
    };
    loadHistory();
  }, []);

  const handleSendQuestion = async (question: string) => {
    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendQuestion(question);

      const aiMessage: Message = {
        id: response.id,
        sender: "ai",
        text: response.answer,
        timestamp: response.timestamp,
        sources: response.sources, // **ເພີ່ມ:** ເກັບ sources ຈາກ response
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error sending question:", err);
      setError("ເກີດຂໍ້ຜິດພາດໃນການສົ່ງຄຳຖາມ. ກະລຸນາລອງໃໝ່ອີກຄັ້ງ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ... (ສ່ວນ JSX ຄືເກົ່າ)
    <Container
      maxWidth="md"
      sx={{ py: 4, display: "flex", flexDirection: "column", height: "100vh" }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", textAlign: "center" }}
      >
        ຊ່ວຍເຫຼືອດ້ານກົດໝາຍ
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        ref={chatContainerRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          mb: 2,
          p: 2,
          border: "1px solid #ddd",
          borderRadius: 2,
        }}
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <ChatBubble message={{ sender: "ai", text: "..." }} />}
      </Box>

      <Box sx={{ mt: "auto" }}>
        <InputBar onSend={handleSendQuestion} isLoading={isLoading} />
      </Box>
    </Container>
  );
}
