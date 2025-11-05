// ໄຟລ໌: frontend/src/pages/ChatPage.tsx

import {
  useState,
  useEffect,
  useRef,
  type ReactElement,
  Fragment,
} from "react";
import {
  Box,
  Container,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  Paper,
} from "@mui/material";
import { DeleteSweep } from "@mui/icons-material";
import ChatBubble from "../components/ChatBubble";
import InputBar from "../components/InputBar";
import DateSeparator from "../components/DateSeparator";

// 1. Import ໂຄງສ້າງ
import {
  type Message,
  type QAHistory,
  type ChatHistoryMessage, // ‼️ ໃຊ້ ChatHistoryMessage ທີ່ຖືກຕ້ອງ ‼️
} from "../utils/types";

// 2. Import API functions
import {
  fetchHistory,
  streamAskQuestion, // ໃຊ້ຟັງຊັນ stream ໃໝ່
  saveChatToDB,
  deleteHistory,
} from "../utils/api";

// --- ຄຳຖາມຕົວຢ່າງ ---
const EXAMPLE_QUESTIONS = [
  "ໃບຕາດິນແມ່ນຫຍັງ?",
  "ການຢ່າຮ້າງ ເຮັດແນວໃດ?",
  "ອາກອນມູນຄ່າເພີ່ມ (ອມພ) ແມ່ນຫຍັງ?",
  "ການສໍ້ລາດບັງຫຼວງ ມີໂທດແນວໃດ?",
];
// --------------------

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

  // ຕົວຄວບຄຸມການ Abort
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 1. ໂຫຼດປະຫວັດແຊັດ ເມື່ອເປີດໜ້າຈໍ
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history: QAHistory[] = await fetchHistory();

        // ‼️ ແກ້ໄຂ Error: 'timestamp' does not exist on type 'QAHistory'. ‼️
        // ‼️ ແກ້ໄຂ Error: Type 'undefined' is not assignable to type 'SourceDocument[]'. ‼️
        const historyMessages: Message[] = history
          .map((item) => [
            {
              id: `user-${item.id}`,
              sender: "user" as const,
              text: item.question,
              timestamp: item.timestamp, // ‼️ ໃຊ້ timestamp ‼️
              sources: [], // ‼️ User ຕ້ອງມີ sources ເປັນ Array ວ່າງ ‼️
            },
            {
              id: `ai-${item.id}`,
              sender: "ai" as const,
              text: item.answer,
              timestamp: item.timestamp, // ‼️ ໃຊ້ timestamp ‼️
              sources: item.sources,
            },
          ])
          .flat(); // ແປງ Array 2 ຊັ້ນ ໃຫ້ເປັນ 1 ຊັ້ນ

        setMessages(historyMessages);
      } catch (err) {
        setError("ບໍ່ສາມາດໂຫຼດປະຫວັດການສົນທະນາໄດ້.");
        console.error(err);
      }
    };
    loadHistory();
  }, []);

  // 2. Scroll ລົງລຸ່ມສຸດ ເມື່ອມີຂໍ້ຄວາມໃໝ່
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]); // ເພີ່ມ isLoading ເພື່ອໃຫ້ມັນ Scroll ຕອນ AI ເລີ່ມພິມ

  // 3. ຟັງຊັນ ຈັດການການສົ່ງຄຳຖາມ (ຫຼັກ)
  const handleSendQuestion = async (question: string) => {
    if (isLoading) return; // ບໍ່ໃຫ້ສົ່ງຊ້ຳ

    setIsLoading(true);
    setError(null);

    // ຍົກເລີກການຕອບກ່ອນໜ້າ (ຖ້າມີ)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // A. ສ້າງ ID ຊົ່ວຄາວ
    const userMessageId = `user-${Date.now()}`;
    const aiMessageId = `ai-${Date.now()}`;

    // B. ສ້າງ "ປະຫວັດແຊັດ" 4 ຂໍ້ຄວາມຫຼ້າສຸດ (2 ຄູ່)
    // ‼️ ແກ້ໄຂ Error: Type '{ role: string; ... }' is missing properties from 'ChatHistoryMessage' ‼️
    const history: ChatHistoryMessage[] = messages
      .slice(-4) // ເອົາ 4 ຂໍ້ຄວາມຫຼ້າສຸດ
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "model", // ‼️ ໃຊ້ 'role' ‼️
        parts: [{ text: msg.text }], // ‼️ ໃຊ້ 'parts' ‼️
      }));

    // C. ອັບເດດ State (ສະແດງຄຳຖາມຂອງ User ແລະ Bubble ວ່າງຂອງ AI)
    // ‼️ ແກ້ໄຂ Error: Property 'sources' is missing ‼️
    const userMessage: Message = {
      id: userMessageId,
      sender: "user",
      text: question,
      timestamp: new Date().toISOString(),
      sources: [], // ‼️ User ຕ້ອງມີ sources ‼️
    };
    const aiMessage: Message = {
      id: aiMessageId,
      sender: "ai",
      text: "", // Bubble ວ່າງ
      timestamp: new Date().toISOString(),
      sources: [],
    };
    setMessages((prev) => [...prev, userMessage, aiMessage]);

    // --- D. ເລີ່ມການ Stream ---
    let fullAnswer = "";
    let finalSources: Message["sources"] = [];

    try {
      // ‼️ ແກ້ໄຂ Error: Expected 2 arguments, but got 3. (ປ່ຽນ api.ts ໃຫ້ຮັບ 3) ‼️
      const reader = await streamAskQuestion(
        question,
        history,
        controller.signal
      );

      // --- ‼️ ວິທີແກ້ໄຂ Stream JSON Lines (ແກ້ Bug 'Unexpected non-whitespace') ‼️ ---
      const decoder = new TextDecoder();
      let jsonBuffer = ""; // ສ້າງ Buffer ເພື່ອເກັບ JSON

      while (true) {
        const { done, value } = await reader.read();

        // ເພີ່ມຂໍ້ມູນໃໝ່ໃສ່ Buffer
        jsonBuffer += decoder.decode(value || new Uint8Array(), {
          stream: !done,
        });

        // ພະຍາຍາມແຍກ Buffer ຕາມແຖວ ( \n )
        let newlineIndex;
        while ((newlineIndex = jsonBuffer.indexOf("\n")) !== -1) {
          const completeJsonString = jsonBuffer
            .substring(0, newlineIndex)
            .trim();
          jsonBuffer = jsonBuffer.substring(newlineIndex + 1); // ເກັບສ່ວນທີ່ເຫຼືອໄວ້

          if (completeJsonString) {
            try {
              const data = JSON.parse(completeJsonString); // ແປງ JSON ທີ່ລະແຖວ

              // D1. ອັບເດດ Sources (ຖ້າມີ)
              if (data.sources) {
                finalSources = data.sources;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, sources: data.sources }
                      : msg
                  )
                );
              }

              // D2. ອັບເດດ Text (ຄຳຕອບ)
              if (data.answer_chunk) {
                fullAnswer += data.answer_chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId ? { ...msg, text: fullAnswer } : msg
                  )
                );
              }
            } catch (e) {
              console.error(
                "Failed to parse JSON line:",
                completeJsonString,
                e
              );
            }
          }
        }

        if (done) {
          // ຖ້າ Stream ຈົບ, ກວດສອບ Buffer ທີ່ເຫຼືອ (ຖ້າມີ)
          if (jsonBuffer.trim()) {
            try {
              const data = JSON.parse(jsonBuffer.trim());
              if (data.answer_chunk) {
                fullAnswer += data.answer_chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId ? { ...msg, text: fullAnswer } : msg
                  )
                );
              }
            } catch (e) {
              console.error("Failed to parse final JSON buffer:", e);
            }
          }
          break; // ຈົບ Loop ຫຼັກ
        }
      }
      // --- ‼️ ສິ້ນສຸດການແກ້ໄຂ Stream ‼️ ---
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        console.log("Stream aborted by user.");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, text: "(ການຕອບຖືກຍົກເລີກ)", sources: [] }
              : msg
          )
        );
        fullAnswer = "(ການຕອບຖືກຍົກເລີກ)";
      } else {
        const errorText = `ເກີດຂໍ້ຜິດພາດ: ${(err as Error).message}`;
        setError(errorText);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, text: errorText, sources: [] }
              : msg
          )
        );
        fullAnswer = "";
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;

      // E. ບັນທຶກລົງ DB
      if (
        fullAnswer.trim() &&
        fullAnswer !== "(ການຕອບຖືກຍົກເລີກ)" &&
        fullAnswer !== "..."
      ) {
        try {
          await saveChatToDB(question, fullAnswer, finalSources || []);
        } catch (dbErr) {
          setError("ບໍ່ສາມາດບັນທຶກການສົນທະນາໄດ້.");
          console.error("Save to DB failed:", dbErr);
        }
      }
    }
  };

  // 4. ຟັງຊັນ ຈັດການການລຶບປະຫວັດ
  const handleClearHistory = async () => {
    if (!window.confirm("ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບປະຫວັດການສົນທະນາທັງໝົດ?")) {
      return;
    }

    try {
      await deleteHistory();
      setMessages([]);
      setError(null);
    } catch (err) {
      setError("ບໍ່ສາມາດລຶບປະຫວັດການສົນທະນາໄດ້.");
      console.error(err);
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        height: "calc(100dvh - 64px)",
        display: "flex",
        flexDirection: "column",
        pt: 2,
        pb: 1,
      }}
    >
      {/* ສ່ວນຫົວ (Title) ແລະ ປຸ່ມລຶບ */}
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          px: 2,
          py: 1,
          mb: 1,
        }}
      >
        <Typography variant="h5" component="h1" fontWeight="bold">
          LAO-RAG Chatbot
        </Typography>

        {/* --- ແກ້ໄຂ Warning ຂອງ Tooltip --- */}
        <Tooltip title="ລຶບປະຫວັດແຊັດທັງໝົດ">
          <span>
            <IconButton
              color="error"
              onClick={handleClearHistory}
              disabled={messages.length === 0 || isLoading}
            >
              <DeleteSweep />
            </IconButton>
          </span>
        </Tooltip>
      </Paper>

      {/* ສ່ວນສະແດງ Error (ຖ້າມີ) */}
      {error && (
        <Alert severity="error" sx={{ mb: 1, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* ສ່ວນຂອງ Chat Bubbles */}
      <Box
        ref={chatContainerRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          mb: 2,
          px: 1,
        }}
      >
        {/* ວົນ Loop ສະແດງຂໍ້ຄວາມ */}
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

      {/* ສ່ວນພິມ (Input Bar Area) */}
      <Box sx={{ mt: "auto", flexShrink: 0 }}>
        <InputBar
          onSend={handleSendQuestion}
          isLoading={isLoading}
          onExampleQuestion={handleSendQuestion}
          exampleQuestions={EXAMPLE_QUESTIONS}
          showExamples={messages.length === 0 && !isLoading}
        />
        <Typography
          variant="caption"
          sx={{
            textAlign: "center",
            display: "block",
            color: "text.secondary",
            mt: 1,
            px: 2,
          }}
        >
          ຂໍ້ມູນນີ້ອາດຈະບໍ່ຖືກຕ້ອງ 100%, ກະລຸນາກວດສອບກັບເອກະສານທາງການສະເໝີ.
        </Typography>
      </Box>
    </Container>
  );
}
