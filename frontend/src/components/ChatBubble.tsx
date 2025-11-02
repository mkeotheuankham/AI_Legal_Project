// ໄຟລ໌: frontend/src/components/ChatBubble.tsx (ສະບັບແກ້ໄຂ)

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

// ===================================================================
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼ [ ນີ້ຄືຈຸດທີ່ແກ້ໄຂ ] ▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// ===================================================================
import { type SourceDoc } from "../utils/api"; // 1. import Type ໃໝ່
// ===================================================================
// ▲▲▲▲▲▲▲▲▲▲▲▲▲ [ /ຈົບສ່ວນທີ່ແກ້ໄຂ ] ▲▲▲▲▲▲▲▲▲▲▲▲▲
// ===================================================================

interface Message {
  id?: number | string;
  sender: "user" | "ai";
  text: string;
  timestamp?: string;
  // ===================================================================
  // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼ [ ນີ້ຄືຈຸດທີ່ແກ້ໄຂ ] ▼▼▼▼▼▼▼▼▼▼▼▼▼▼
  // ===================================================================
  sources?: SourceDoc[] | null; // 2. ປ່ຽນ Type ຂອງ sources
  // ===================================================================
  // ▲▲▲▲▲▲▲▲▲▲▲▲▲ [ /ຈົບສ່ວນທີ່ແກ້ໄຂ ] ▲▲▲▲▲▲▲▲▲▲▲▲▲
  // ===================================================================
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
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 3,
        gap: 2,
      }}
    >
      {!isUser && (
        <Avatar sx={{ bgcolor: "primary.main" }}>
          <SmartToy />
        </Avatar>
      )}

      <Paper
        elevation={1}
        sx={{
          position: "relative",
          px: 2.5,
          py: 1.5,
          maxWidth: "80%",
          bgcolor: isUser ? "primary.main" : "background.paper",
          color: isUser ? "primary.contrastText" : "text.primary",
          borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
          "&:hover .copy-button": {
            opacity: 1,
          },
        }}
      >
        <Box
          className="markdown-content"
          sx={{
            "& p": { margin: 0 },
            "& ul, & ol": { pl: 2.5, my: 1 },
          }}
        >
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </Box>

        {/* =================================================================== */}
        {/* ▼▼▼▼▼▼▼▼▼▼▼▼▼▼ [ ນີ້ຄືຈຸດທີ່ແກ້ໄຂ ] ▼▼▼▼▼▼▼▼▼▼▼▼▼▼ */}
        {/* =================================================================== */}
        {/* 3. ປ່ຽນວິທີສະແດງຜົນ sources ໃໝ່ທັງໝົດ */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: "bold", color: "text.secondary" }}
            >
              ແຫຼ່ງຂໍ້ມູນ:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
              {message.sources.map((source, index) => (
                <Chip
                  key={index}
                  icon={<Source fontSize="small" />}
                  // ໃຊ້ Box ເພື່ອຈັດລຽງ "ມາດຕາ" ແລະ "ໄຟລ໌"
                  label={
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: "bold", lineHeight: 1.2 }}
                      >
                        {source.article}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.8,
                          fontStyle: "italic",
                          lineHeight: 1.2,
                        }}
                      >
                        {source.file}
                      </Typography>
                    </Box>
                  }
                  size="medium" // ປ່ຽນເປັນ medium ເພື່ອໃຫ້ມີພື້ນທີ່
                  variant="outlined"
                  sx={{
                    height: "auto", // ໃຫ້ Chip ປັບຂະໜາດເອງ
                    "& .MuiChip-label": {
                      paddingTop: "6px",
                      paddingBottom: "6px",
                      whiteSpace: "normal",
                      textAlign: "left",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        {/* =================================================================== */}
        {/* ▲▲▲▲▲▲▲▲▲▲▲▲▲ [ /ຈົບສ່ວນທີ່ແກ້ໄຂ ] ▲▲▲▲▲▲▲▲▲▲▲▲▲ */}
        {/* =================================================================== */}
      </Paper>

      {isUser && (
        <Avatar sx={{ bgcolor: "grey[700]" }}>
          <Person />
        </Avatar>
      )}

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
              alignSelf: "flex-start",
              mt: 0.5,
              opacity: 0,
              transition: "opacity 0.2s",
              "&:hover": { opacity: 1 },
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
