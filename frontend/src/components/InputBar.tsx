// ໄຟລ໌: frontend/src/components/InputBar.tsx

import { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Chip,
  Typography,
  Paper,
} from "@mui/material";
import { Send, Lightbulb } from "@mui/icons-material";

interface InputBarProps {
  onSend: (question: string) => void;
  isLoading: boolean;

  // ໂຄງສ້າງສຳລັບ Example Prompts
  onExampleQuestion: (question: string) => void;
  exampleQuestions: string[];
  showExamples: boolean; // ໃຊ້ເພື່ອກຳນົດວ່າຈະສະແດງ Example Prompts ບໍ່
}

export default function InputBar({
  onSend,
  isLoading,
  onExampleQuestion,
  exampleQuestions,
  showExamples,
}: InputBarProps) {
  // ‼️ ແກ້ໄຂ: ປ່ຽນຈາກ InputLoopBarProps ‼️
  const [input, setInput] = useState("");

  // ຈັດການການສົ່ງຄຳຖາມ
  const handleSend = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !isLoading) {
      onSend(trimmedInput);
      setInput("");
    }
  };

  // ຈັດການການກົດປຸ່ມ Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // ຈັດການການກົດ Example Question
  const handleExampleClick = (question: string) => {
    if (!isLoading) {
      onExampleQuestion(question);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "768px", // ຈຳກັດຄວາມກວ້າງສູງສຸດ
        mx: "auto", // ຈັດກາງ
      }}
    >
      {/* --- ສ່ວນຂອງ Example Prompts --- */}
      {showExamples && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              mb: 1.5,
              gap: 1,
            }}
          >
            <Lightbulb fontSize="small" />
            ຄຳຖາມຕົວຢ່າງ
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              justifyContent: "center",
            }}
          >
            {/* ‼️ ແກ້ໄຂ: ເພີ່ມ (q: string) ‼️ */}
            {exampleQuestions.map((q: string) => (
              <Chip
                key={q}
                label={q}
                onClick={() => handleExampleClick(q)}
                disabled={isLoading}
                clickable
                sx={{
                  transition: "0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}
      {/* --- ສ່ວນຂອງ Input ຫຼັກ --- */}
      <Paper
        elevation={6}
        sx={{
          p: 0.5,
          display: "flex",
          alignItems: "center",
          borderRadius: "50px",
          width: "100%",
          backgroundColor: "background.paper",
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="ພິມຄຳຖາມຂອງທ່ານ..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          sx={{
            ml: 1,
            "& fieldset": { border: "none" }, // ເຊື່ອງ Border ຂອງ TextField
            "& input": { py: 1.5 }, // ປັບຄວາມສູງ
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          sx={{ p: 1, mr: 0.5, position: "relative" }}
        >
          {/* ສະແດງ ວົງມົນ (Loading) ຫຼື ປຸ່ມ Send */}
          {isLoading ? (
            <CircularProgress size={24} sx={{ color: "grey.500" }} />
          ) : (
            <Send />
          )}
        </IconButton>
      </Paper>
    </Box>
  );
}
