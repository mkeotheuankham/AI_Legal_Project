// src/pages/ChatPage.tsx
import {
  useState,
  useEffect,
  useRef,
  type ReactElement,
  Fragment,
} from "react";
import { Box, Container, Typography, Alert } from "@mui/material";
import ChatBubble from "../components/ChatBubble";
import InputBar from "../components/InputBar";
import DateSeparator from "../components/DateSeparator";
import { fetchHistory } from "../utils/api"; // ບໍ່ຕ້ອງ import sendQuestion ແລ້ວ

interface Message {
  id: number | string;
  sender: "user" | "ai";
  text: string;
  timestamp?: string;
  sources?: string[] | null;
}

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

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
  }, [messages, isLoading]);

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
            sources: item.sources,
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

  // Function sendQuestion ສຳລັບ axios
  const sendQuestion = async (question: string) => {
    const response = await fetch("http://localhost:8000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  };

  const handleSendQuestion = async (question: string) => {
    setError(null);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: question,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendQuestion(question);

      // **ຈຸດສຳຄັນ:** ເພີ່ມ console.log ເພື່ອເບິ່ງຂໍ້ມູນທີ່ໄດ້ຮັບ
      console.log("Data received from backend:", response);

      // ກວດສອບໃຫ້ແນ່ໃຈວ່າ response ມີ field ທີ່ຈຳເປັນຄົບຖ້ວນ
      if (response && response.id && response.answer) {
        const aiMessage: Message = {
          id: response.id,
          sender: "ai",
          text: response.answer,
          timestamp: response.timestamp,
          sources: response.sources,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // ຖ້າຂໍ້ມູນບໍ່ຄົບ, ໃຫ້ສະແດງ Error
        console.error("Invalid response structure from backend:", response);
        setError("ໄດ້ຮັບຂໍ້ມູນທີ່ບໍ່ສົມບູນຈາກເຊີບເວີ.");
      }
    } catch (err) {
      console.error("Error sending question:", err);
      setError("ເກີດຂໍ້ຜິດພາດໃນການສົ່ງຄຳຖາມ. ກະລຸນາລອງໃໝ່ອີກຄັ້ງ.");
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{ py: 4, display: "flex", flexDirection: "column", height: "100vh" }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", textAlign: "center" }}
      >
        SoLo Dev ຊ່ວຍເຫຼືອດ້ານກົດໝາຍ
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        ref={chatContainerRef}
        sx={{ flexGrow: 1, overflowY: "auto", mb: 2, px: 1 }}
      >
        {messages.map((msg, index) => {
          const currentDate = msg.timestamp
            ? new Date(msg.timestamp)
            : new Date();
          const prevDate =
            index > 0 && messages[index - 1].timestamp
              ? new Date(messages[index - 1].timestamp!)
              : null;
          const showDateSeparator =
            !prevDate || !isSameDay(prevDate, currentDate);

          return (
            <Fragment key={msg.id}>
              {showDateSeparator && (
                <DateSeparator date={currentDate.toISOString()} />
              )}
              <ChatBubble message={msg} />
            </Fragment>
          );
        })}
        {isLoading && <ChatBubble message={{ sender: "ai", text: "..." }} />}
      </Box>

      <Box sx={{ mt: "auto", px: { xs: 0, sm: 4 } }}>
        <InputBar onSend={handleSendQuestion} isLoading={isLoading} />
        <Typography
          variant="caption"
          sx={{
            textAlign: "center",
            display: "block",
            mt: 2,
            color: "text.secondary",
          }}
        >
          AI ອາດຈະຕອບຜິດພາດໄດ້. ກະລຸນາກວດສອບຂໍ້ມູນສຳຄັນ.
        </Typography>
      </Box>
    </Container>
  );
}
