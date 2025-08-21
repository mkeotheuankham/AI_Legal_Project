// src/components/DateSeparator.tsx
import { Box, Typography, Divider } from "@mui/material";

interface DateSeparatorProps {
  date: string;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  const formattedDate = new Date(date).toLocaleDateString("lo-LA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
      <Divider sx={{ flexGrow: 1 }} />
      <Typography variant="caption" sx={{ mx: 2, color: "text.secondary" }}>
        {formattedDate}
      </Typography>
      <Divider sx={{ flexGrow: 1 }} />
    </Box>
  );
}
