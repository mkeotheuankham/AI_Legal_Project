// src/components/InputBar.tsx
import { useState, type KeyboardEvent } from "react";
import { TextField, Box, IconButton, CircularProgress } from "@mui/material";
import { Send } from "@mui/icons-material";

interface InputBarProps {
  onSend: (question: string) => void;
  isLoading: boolean;
}

export default function InputBar({ onSend, isLoading }: InputBarProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    if (question.trim() && !isLoading) {
      onSend(question);
      setQuestion("");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box
      sx={{
        p: 1,
        bgcolor: "background.paper",
        borderRadius: "28px",
        boxShadow: "0 1px 6px 0 rgba(32,33,36,0.28)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={5}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="ຖາມຄຳຖາມກ່ຽວກັບກົດໝາຍ..."
        disabled={isLoading}
        variant="standard" // ໃຊ້ standard ເພື່ອບໍ່ໃຫ້ມີຂອບ
        InputProps={{
          disableUnderline: true,
        }}
        sx={{
          ml: 2,
        }}
      />
      <IconButton
        color="primary"
        onClick={handleSubmit}
        disabled={isLoading}
        sx={{
          bgcolor: isLoading ? "transparent" : "primary.main",
          color: "white",
          "&:hover": { bgcolor: "primary.dark" },
        }}
      >
        {isLoading ? <CircularProgress size={24} /> : <Send />}
      </IconButton>
    </Box>
  );
}
