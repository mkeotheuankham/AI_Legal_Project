// src/components/ChatBubble.tsx
import {
  Box,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  Chip,
} from "@mui/material";
import { SmartToy, Person, Source } from "@mui/icons-material";

interface Message {
  id?: number | string;
  sender: "user" | "ai";
  text: string;
  timestamp?: string;
  sources?: string[] | null; // **ເພີ່ມ:** sources
}

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === "user";

  if (message.text === "...") {
    // ... (ໂຄດສ່ວນ Loading Indicator ຄືເກົ່າ)
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
        <Avatar sx={{ mr: 1, bgcolor: "secondary.main" }}>
          <SmartToy />
        </Avatar>
        <Paper
          sx={{
            p: 2,
            maxWidth: "80%",
            bgcolor: "grey.100",
            display: "flex",
            alignItems: "center",
          }}
        >
          <CircularProgress size={20} />
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 2,
      }}
    >
      {!isUser && (
        <Avatar sx={{ mr: 1, bgcolor: "secondary.main" }}>
          <SmartToy />
        </Avatar>
      )}
      <Paper
        sx={{
          p: 2,
          maxWidth: "80%",
          bgcolor: isUser ? "primary.light" : "grey.100",
          color: isUser ? "primary.contrastText" : "text.primary",
        }}
      >
        <Typography sx={{ whiteSpace: "pre-wrap" }}>{message.text}</Typography>

        {/* **ເພີ່ມ:** ສ່ວນສະແດງແຫຼ່ງອ້າງອີງ */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <Box sx={{ mt: 2, borderTop: "1px solid #eee", pt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: "bold" }}>
              ແຫຼ່ງຂໍ້ມູນ:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
              {message.sources.map((source, index) => (
                <Chip
                  key={index}
                  icon={<Source fontSize="small" />}
                  label={source}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {message.timestamp && (
          <Typography
            variant="caption"
            color={isUser ? "rgba(255,255,255,0.7)" : "text.secondary"}
            sx={{ display: "block", textAlign: "right", mt: 1 }}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        )}
      </Paper>
      {isUser && (
        <Avatar sx={{ ml: 1, bgcolor: "primary.main" }}>
          <Person />
        </Avatar>
      )}
    </Box>
  );
}
