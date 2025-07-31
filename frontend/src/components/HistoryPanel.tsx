// src/components/HistoryPanel.tsx
import { List, ListItem, ListItemText, Typography, Paper } from "@mui/material";

interface HistoryPanelProps {
  messages: Array<{
    id: number;
    question: string;
    answer: string;
    timestamp: string;
  }>;
}

export default function HistoryPanel({ messages }: HistoryPanelProps) {
  return (
    <Paper sx={{ mt: 2, p: 2 }}>
      <Typography variant="h6">ປະຫວັດການສົນທະນາ</Typography>
      <List>
        {messages.map((message) => (
          <ListItem key={message.id}>
            <ListItemText
              primary={message.question}
              secondary={message.answer}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
