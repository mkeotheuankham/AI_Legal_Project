// src/components/InputBar.tsx
import { useState, type KeyboardEvent } from "react"; // ແກ້ໄຂ: ເພີ່ມ 'type' ສຳລັບ KeyboardEvent
import { TextField, Box, IconButton } from "@mui/material"; // ແກ້ໄຂ: ລຶບ 'Button' ທີ່ບໍ່ໄດ້ໃຊ້ອອກ
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
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      <TextField
        fullWidth
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="ຖາມຄຳຖາມກ່ຽວກັບກົດໝາຍ..."
        disabled={isLoading}
        variant="outlined"
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "20px",
          },
        }}
      />
      <IconButton
        color="primary"
        onClick={handleSubmit}
        disabled={isLoading}
        sx={{
          bgcolor: "primary.main",
          color: "white",
          "&:hover": { bgcolor: "primary.dark" },
        }}
      >
        <Send />
      </IconButton>
    </Box>
  );
}
