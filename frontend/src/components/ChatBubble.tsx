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

  // **ເພີ່ມ:** Logic ໃນການກວດສອບ ແລະ ແກ້ໄຂຂໍ້ມູນທີ່ຜິດພາດ
  let displayText = message.text;
  let displaySources = message.sources;

  try {
    // ກວດສອບວ່າຂໍ້ຄວາມເປັນ JSON string หรือไม่
    if (
      typeof message.text === "string" &&
      message.text.trim().startsWith("{")
    ) {
      const parsedData = JSON.parse(message.text);
      // ຖ້າຫາກ parse ສຳເລັດ ແລະ ມີ 'answer', ໃຫ້ໃຊ້ຂໍ້ມູນນັ້ນແທນ
      if (parsedData && parsedData.answer) {
        displayText = parsedData.answer;
        displaySources = parsedData.sources || message.sources;
      }
    }
  } catch (e) {
    // ຖ້າບໍ່ແມ່ນ JSON, ກໍໃຫ້ສະແດງຂໍ້ຄວາມເດີມ
  }
  // --------------------------------------------------

  const handleCopy = () => {
    // ໃຫ້ແນ່ໃຈວ່າເຮົາກັອບປີ້ຂໍ້ຄວາມທີ່ສະອາດແລ້ວ
    navigator.clipboard.writeText(displayText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          {/* **ແກ້ໄຂ:** ໃຊ້ displayText ແທນ message.text */}
          <ReactMarkdown>{displayText}</ReactMarkdown>
        </Box>

        {!isUser && displaySources && displaySources.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: "bold", color: "text.secondary" }}
            >
              ແຫຼ່ງຂໍ້ມູນ:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
              {displaySources.map((source, index) => (
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
