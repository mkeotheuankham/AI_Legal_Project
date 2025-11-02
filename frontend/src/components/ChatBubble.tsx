// src/components/ChatBubble.tsx
import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  SmartToy,
  Person,
  Source,
  ContentCopy,
  Check,
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";

interface Message {
  id?: number | string;
  sender: "user" | "ai";
  text: string;
  timestamp?: string;
  sources?: string[] | null;
}

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // ປ່ຽນກັບເປັນປຸ່ມເດີມຫຼັງຈາກ 2 ວິນາທີ
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        mb: 3,
        gap: 2,
        position: "relative",
        "&:hover .copy-button": {
          opacity: 1,
        },
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUser ? "primary.main" : "secondary.main",
          width: 32,
          height: 32,
          mt: 0.5,
        }}
      >
        {isUser ? <Person /> : <SmartToy />}
      </Avatar>

      <Box sx={{ width: "100%" }}>
        <Box className="markdown-content">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </Box>

        {!isUser && message.sources && message.sources.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: "bold", color: "text.secondary" }}
            >
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
      </Box>

      {!isUser && (
        <Tooltip
          title={copied ? "ກັອບປີ້ແລ້ວ!" : "ກັອບປີ້ຄຳຕອບ"}
          placement="top"
        >
          <IconButton
            className="copy-button"
            onClick={handleCopy}
            size="small"
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              opacity: 0,
              transition: "opacity 0.2s",
            }}
          >
            {copied ? (
              <Check fontSize="small" />
            ) : (
              <ContentCopy fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
