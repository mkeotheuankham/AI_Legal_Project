// src/components/InputBar.tsx
import { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import { Send } from "@mui/icons-material";

interface InputBarProps {
  onSend: (question: string) => void;
  isLoading: boolean;
}

export default function InputBar({ onSend, isLoading }: InputBarProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    if (question.trim()) {
      onSend(question);
      setQuestion("");
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <TextField
        fullWidth
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="ຖາມຄຳຖາມກ່ຽວກັບກົດໝາຍ..."
        disabled={isLoading}
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={isLoading}
        endIcon={<Send />}
      >
        ສົ່ງ
      </Button>
    </Box>
  );
}
