// src/styles/theme.ts
import { createTheme } from "@mui/material/styles";
import "@fontsource/noto-sans-lao/400.css";
import "@fontsource/noto-sans-lao/700.css";

export const theme = createTheme({
  typography: {
    fontFamily: ['"Noto Sans Lao"', '"Roboto"', '"Arial"', "sans-serif"].join(
      ","
    ),
  },
  palette: {
    mode: "light",
    background: {
      default: "#f9f9f9", // ສີພື້ນຫຼັງອ່ອນໆ
      paper: "#ffffff",
    },
    primary: {
      main: "#1a73e8", // ສີຟ້າຂອງ Google
    },
    secondary: {
      main: "#9c27b0",
    },
    text: {
      primary: "#202124", // ສີໂຕໜັງສືເຂັ້ມ
      secondary: "#5f6368",
    },
  },
});
