// ໄຟລ໌: frontend/src/pages/ChatPage.tsx (ສະບັບປັບປຸງ)

import {
  useState,
  useEffect,
  useRef,
  type ReactElement,
  Fragment,
} from "react";
import { Box, Container, Typography, Alert, Button } from "@mui/material";
// [ ປັບປຸງ 1 ] - Import ໄອຄອນ Delete
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import ChatBubble from "../components/ChatBubble";
import InputBar from "../components/InputBar";
import DateSeparator from "../components/DateSeparator";
// [ ປັບປຸງ 2 ] - Import ຟັງຊັນ deleteHistory
import { fetchHistory, askQuestion, deleteHistory } from "../utils/api";

interface Message {
  id: number | string;
  sender: "user" | "ai";
  text: string;
  timestamp?: string;
  sources?: string[] | null;
}

const isSameDay = (d1: Date, d2: Date) => {
  // ... (ເນື້ອໃນຟັງຊັນ isSameDay) ...
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

  // ... (ຟັງຊັນ useEffect [messages] - ຄືເກົ່າ) ...
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // ... (ຟັງຊັນ useEffect [] - loadHistory - ຄືເກົ່າ) ...
  useEffect(() => {
    const loadHistory = async () => {
      // ... (ເນື້ອໃນຟັງຊັນ loadHistory) ...
      setIsLoading(true);
      setError(null);
      try {
        const history = await fetchHistory();
        const formattedMessages: Message[] = history
          .reverse()
          .map((item) => [
            {
              id: `${item.id}-q`,
              sender: "user" as const,
              text: item.question,
              timestamp: item.created_at,
            },
            {
              id: item.id,
              sender: "ai" as const,
              text: item.answer,
              sources: item.sources,
              timestamp: item.created_at,
            },
          ])
          .flat();

        setMessages(formattedMessages);
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setError("ບໍ່ສາມາດໂຫຼດປະຫວັດການສົນທະນາໄດ້");
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  // ... (ຟັງຊັນ handleSendQuestion - ຄືເກົ່າ) ...
  const handleSendQuestion = async (question: string) => {
    // ... (ເນື້ອໃນຟັງຊັນ handleSendQuestion) ...
    if (!question.trim()) return;
    setIsLoading(true);
    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    try {
      const response = await askQuestion(question);
      const aiMessage: Message = {
        id: response.id,
        sender: "ai",
        text: response.answer,
        sources: response.sources,
        timestamp: response.created_at,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMessage = "ຂໍອະໄພ, ເກີດຂໍ້ຜິດພາດ. ກະລຸນາລອງໃໝ່ອີກຄັ້ງ.";
      setError(errorMessage);
      const errorBubble: Message = {
        id: `error-${Date.now()}`,
        sender: "ai",
        text: errorMessage,
      };
      setMessages((prevMessages) => [...prevMessages, errorBubble]);
    } finally {
      setIsLoading(false);
    }
  };

  // ຟັງຊັນລ້າງໜ້າຈໍ (ຄືເກົ່າ)
  const handleNewChat = () => {
    setMessages([]);
    setError(null);
  };

  // [ ປັບປຸງ 3 ] - ເພີ່ມຟັງຊັນລຶບຂໍ້ມູນໃນ DB
  const handleDeleteHistory = async () => {
    // 1. ຖາມຢືນຢັນກ່ອນ
    if (
      window.confirm(
        "ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບປະຫວັດການສົນທະນາທັງໝົດ? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້."
      )
    ) {
      try {
        // 2. ເອີ້ນ API ເພື່ອລຶບ
        await deleteHistory();
        // 3. ລ້າງຂໍ້ຄວາມເທິງໜ້າຈໍ
        handleNewChat();
      } catch (err) {
        console.error("Failed to delete history:", err);
        setError("ບໍ່ສາມາດລຶບປະຫວັດໄດ້. ກະລຸນາລອງໃໝ່.");
      }
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        py: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap", // ຊ່ວຍໃຫ້ປຸ່ມຕົກລົງລຸ່ມໃນຈໍນ້ອຍ
          mb: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ mr: 2 }} // ເພີ່ມຍະຫວ່າງ
        >
          AI ຜູ້ຊ່ວຍດ້ານກົດໝາຍ
        </Typography>

        {/* [ ປັບປຸງ 4 ] - ເພີ່ມປຸ່ມ "ລຶບປະຫວັດ" */}
        <Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleNewChat}
            sx={{ mr: 1 }} // ເພີ່ມຍະຫວ່າງ
          >
            ແຊັດໃໝ່
          </Button>
          <Button
            variant="outlined"
            color="error" // ປັບເປັນສີແດງ
            startIcon={<DeleteIcon />}
            onClick={handleDeleteHistory}
          >
            ລຶບປະຫວັດ
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, mt: -1 }}>
          {error}
        </Alert>
      )}

      {/* ... (ສ່ວນທີ່ເຫຼືອຂອງ Component ແມ່ນຄືເກົ່າ) ... */}
      <Box
        ref={chatContainerRef}
        sx={{ flexGrow: 1, overflowY: "auto", mb: 2, px: 1 }}
      >
        {messages.map((msg, index) => {
          // ... (ໂຄດສະແດງ DateSeparator ແລະ ChatBubble) ...
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
            color: "text.secondary",
            mt: 1,
          }}
        >
          AI ສາມາດຕອບຜິດພາດໄດ້. ກະລຸນາກວດສອບຂໍ້ມູນສຳຄັນ.
        </Typography>
      </Box>
    </Container>
  );
}
