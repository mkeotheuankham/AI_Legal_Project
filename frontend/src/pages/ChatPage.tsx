// ໄຟລ໌: frontend/src/pages/ChatPage.tsx (ສະບັບແກ້ໄຂ)

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
// ===================================================================
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼ [ ນີ້ຄືຈຸດທີ່ແກ້ໄຂ ] ▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// ===================================================================
// import SourceDoc ມາພ້ອມ
import {
  fetchHistory,
  askQuestion,
  deleteHistory,
  type SourceDoc,
} from "../utils/api";
// ===================================================================
// ▲▲▲▲▲▲▲▲▲▲▲▲▲ [ /ຈົບສ່ວນທີ່ແກ້ໄຂ ] ▲▲▲▲▲▲▲▲▲▲▲▲▲
// ===================================================================

interface Message {
  id: number | string;
  sender: "user" | "ai";
  text: string;
  timestamp?: string;
  // ===================================================================
  // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼ [ ນີ້ຄືຈຸດທີ່ແກ້ໄຂ ] ▼▼▼▼▼▼▼▼▼▼▼▼▼▼
  // ===================================================================
  sources?: SourceDoc[] | null; // <--- ປ່ຽນຈາກ string[] ເປັນ SourceDoc[]
  // ===================================================================
  // ▲▲▲▲▲▲▲▲▲▲▲▲▲ [ /ຈົບສ່ວນທີ່ແກ້ໄຂ ] ▲▲▲▲▲▲▲▲▲▲▲▲▲
  // ===================================================================
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

  // Scroll to bottom effect
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Load history on first render
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const historyData = await fetchHistory();
        const formattedHistory = historyData
          .map((item) => ({
            id: item.id,
            sender: "ai" as const,
            text: item.answer,
            timestamp: item.created_at,
            sources: item.sources,
            // ສ້າງຄໍາຖາມຂອງ user ຂຶ້ນມາຄູ່ກັນ
            userQuestion: {
              id: `user-${item.id}`,
              sender: "user" as const,
              text: item.question,
              timestamp: item.created_at, // ໃຊ້ວັນທີດຽວກັນ
            },
          }))
          .reverse(); // ປີ້ນກັບ ເພື່ອໃຫ້ເກົ່າສຸດຢູ່ເທິງ

        // ແຍກ user question ແລະ ai answer ອອກມາ
        const allMessages = formattedHistory.flatMap((item) => [
          item.userQuestion,
          item,
        ]);
        setMessages(allMessages);
      } catch (e) {
        setError("ບໍ່ສາມາດໂຫຼດປະຫວັດການສົນທະນາໄດ້.");
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleSendQuestion = async (question: string) => {
    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Send to backend
      const aiResponse = await askQuestion(question);

      // Create new AI message from response
      const aiMessage: Message = {
        id: aiResponse.id,
        sender: "ai",
        text: aiResponse.answer,
        timestamp: aiResponse.created_at,
        sources: aiResponse.sources,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "ເກີດຂໍ້ຜິດພາດທີ່ບໍ່ຄາດຄິດ";
      setError(`ຂໍອະໄພ, ເກີດຂໍ້ຜິດພາດ: ${errorMsg}`);

      // Remove user message if API call failed
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setIsLoading(true);
    try {
      await deleteHistory();
      setMessages([]); // ລ້າງ state
      setError(null);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "ເກີດຂໍ້ຜິດພາດ";
      setError(`ບໍ່ສາມາດລຶບປະຫວັດໄດ້: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        py: 2,
      }}
    >
      {/* (Header and Clear Button) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          ⚖️ AI ນັກກົດໝາຍ
        </Typography>
        <button
          onClick={handleClearHistory}
          disabled={isLoading || messages.length === 0}
          style={{
            padding: "8px 12px",
            fontSize: "14px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            opacity: isLoading || messages.length === 0 ? 0.5 : 1,
          }}
        >
          ລຶບປະຫວັດ
        </button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* (Chat Bubbles Area) */}
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
        {isLoading && (
          <ChatBubble message={{ sender: "ai", text: "ກຳລັງຄິດ..." }} />
        )}
      </Box>

      {/* (Input Bar Area) */}
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
          AI ສາມາດຕອບຜິດພາດໄດ້. ກະລຸນາກວດສອບຄວາມຖືກຕ້ອງຈາກແຫຼ່ງຂໍ້ມູນຕົ້ນສະບັບ.
        </Typography>
      </Box>
    </Container>
  );
}
