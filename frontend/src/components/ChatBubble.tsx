// ໄຟລ໌: frontend/src/components/ChatBubble.tsx

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

// 1. Import ໂຄງສ້າງ Message ຫຼັກ ຈາກ types.ts
import { type Message } from "../utils/types";

interface ChatBubbleProps {
  message: Message; // ໃຊ້ Message ຈາກ types.ts
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === "user";
  const [copied, setCopied] = useState(false);

  // ຟັງຊັນສຳລັບການກັອບປີ້ຂໍ້ຄວາມ
  const handleCopy = () => {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // ປ່ຽນກັບເປັນປຸ່ມເດີມຫຼັງຈາກ 2 ວິນາທີ
    });
  };

  // ຟັງຊັນສຳລັບການຈັດການການກົດ Chip
  const handleSourceClick = (sourcePath: string) => {
    // ທ່ານສາມາດເພີ່ມການເປີດໄຟລ໌ ຫຼື link ໄດ້ໃນອະນາຄົດ
    console.log("Clicked source:", sourcePath);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 3,
        gap: 2,
        position: "relative", // ໃຊ້ສຳລັບປຸ່ມ Copy
        "&:hover .copy-button": {
          opacity: 1, // ສະແດງປຸ່ມ Copy ເມື່ອເມົ້າສ໌ຢູ່ເທິງ
        },
      }}
    >
      {/* Avatar ຂອງ AI */}
      {!isUser && (
        <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
          <SmartToy />
        </Avatar>
      )}

      {/* ເນື້ອໃນ Bubble */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          bgcolor: isUser ? "primary.main" : "background.paper",
          color: isUser ? "primary.contrastText" : "text.primary",
          borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
          maxWidth: "80%",
          wordWrap: "break-word",
          // CSS ສຳລັບການສະແດງຜົນ Markdown
          // ‼️ ແກ້ໄຂ Bug ຂອງ ReactMarkdown ‼️
          "& .markdown-body": {
            "& p": { margin: 0 },
            "& ol, & ul": {
              paddingLeft: "20px",
              margin: "8px 0",
            },
            "& li": {
              marginBottom: "4px",
            },
            "& pre": {
              backgroundColor: "rgba(0,0,0,0.05)",
              padding: "10px",
              borderRadius: "4px",
              overflowX: "auto",
            },
            "& code": {
              backgroundColor: "rgba(0,0,0,0.05)",
              padding: "2px 4px",
              borderRadius: "4px",
            },
          },
        }}
      >
        {/* ‼️ ແກ້ໄຂ Bug ຂອງ ReactMarkdown ‼️ */}
        {/* ຫໍ່ດ້ວຍ div ເພື່ອແກ້ Error TypeScript */}
        <div className="markdown-body">
          <ReactMarkdown>
            {/* ສະແດງຂໍ້ຄວາມ (ຖ້າກຳລັງໂຫຼດ ໃຫ້ສະແດງ '...') */}
            {message.text || "..."}
          </ReactMarkdown>
        </div>

        {/* ‼️ 2. ການສະແດງແຫຼ່ງຂໍ້ມູນ (Rich Sources) - ສະບັບແກ້ໄຂ ‼️ */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: "bold",
                color: isUser ? "primary.contrastText" : "text.secondary",
              }}
            >
              ແຫຼ່ງຂໍ້ມູນ:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
              {/* 3. ວົນ Loop ຜ່ານ sources ທີ່ເປັນ object */}
              {message.sources.map((source, index) => (
                <Chip
                  key={index}
                  icon={<Source fontSize="small" />}
                  size="small"
                  variant="outlined"
                  onClick={() => handleSourceClick(source.file)}
                  // 4. ໃຊ້ label prop ເພື່ອສະແດງ 2 ແຖວ
                  label={
                    <Box sx={{ textAlign: "left" }}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: "bold", display: "block" }}
                      >
                        {/* ສະແດງຊື່ມາດຕາ */}
                        {source.article || "ບໍ່ພົບຊື່ມາດຕາ"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ fontStyle: "italic", display: "block" }}
                      >
                        {/* ສະແດງຊື່ໄຟລ໌ */}
                        {source.file}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    height: "auto", // ໃຫ້ Chip ປັບຂະໜາດອັດຕະໂນມັດ
                    "& .MuiChip-label": {
                      paddingY: "4px", // ເພີ່ມຊ່ອງຫວ່າງ
                    },
                    // ປັບສີໃຫ້ເຂົ້າກັບ Bubble
                    color: isUser ? "primary.contrastText" : "text.primary",
                    borderColor: isUser
                      ? "rgba(255,255,255,0.23)"
                      : "rgba(0,0,0,0.23)",
                    "& .MuiChip-icon": {
                      color: "inherit",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Avatar ຂອງຜູ້ໃຊ້ */}
      {isUser && (
        <Avatar sx={{ bgcolor: "grey.500", width: 40, height: 40 }}>
          <Person />
        </Avatar>
      )}

      {/* ປຸ່ມ Copy (ສະເພາະ AI) */}
      {!isUser &&
        message.text && ( // ສະແດງປຸ່ມ Copy ຕໍ່ເມື່ອມີຂໍ້ຄວາມ
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
                bottom: 0,
                right: isUser ? "unset" : 48, // ວາງປຸ່ມໄວ້ຂ້າງ Avatar
                left: isUser ? 48 : "unset",
                opacity: 0, // ປົກກະຕິຈະເຊື່ອງໄວ້
                transition: "opacity 0.2s",
                color: "text.secondary",
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
