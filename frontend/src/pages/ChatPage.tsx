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
// **ແກ້ໄຂ:** ປ່ຽນທີ່ຢູ່ຂອງການ import ໃຫ້ຖືກຕ້ອງ
import DateSeparator from "../components/DateSeparator";
import { fetchHistory, streamQuestion } from "../utils/api";

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

  const handleSendQuestion = async (question: string) => {
    setError(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: question,
      timestamp: new Date().toISOString(),
    };
    const aiMessagePlaceholder: Message = {
      id: `ai-${Date.now()}`,
      sender: "ai",
      text: "",
      sources: [],
    };

    setMessages((prev) => [...prev, userMessage, aiMessagePlaceholder]);

    await streamQuestion(
      question,
      (chunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessagePlaceholder.id
              ? { ...msg, text: msg.text + chunk }
              : msg
          )
        );
      },
      (sources) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessagePlaceholder.id
              ? { ...msg, sources: sources }
              : msg
          )
        );
      },
      (errorMsg) => {
        setError(errorMsg);
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== aiMessagePlaceholder.id)
        );
      }
    );

    setIsLoading(false);
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
        ຊ່ວຍເຫຼືອດ້ານກົດໝາຍ
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
