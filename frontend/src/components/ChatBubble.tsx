// src/components/ChatBubble.tsx
import { Box, Typography, Paper, Avatar } from "@mui/material";
import { QuestionAnswer, Person } from "@mui/icons-material";

interface ChatBubbleProps {
  question: string;
  answer: string;
  timestamp: string;
}

export default function ChatBubble({
  question,
  answer,
  timestamp,
}: ChatBubbleProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Paper sx={{ p: 2, maxWidth: "80%", bgcolor: "primary.light" }}>
          <Typography>{question}</Typography>
        </Paper>
        <Avatar sx={{ ml: 1, bgcolor: "primary.main" }}>
          <Person />
        </Avatar>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
        <Avatar sx={{ mr: 1, bgcolor: "secondary.main" }}>
          <QuestionAnswer />
        </Avatar>
        <Paper sx={{ p: 2, maxWidth: "80%", bgcolor: "grey.100" }}>
          <Typography>{answer}</Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(timestamp).toLocaleString()}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
