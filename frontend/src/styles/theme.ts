// src/styles/theme.ts
import { createTheme } from "@mui/material/styles";
import "@fontsource/noto-sans-lao/400.css"; // ເພີ່ມ weight 400 (normal)
import "@fontsource/noto-sans-lao/700.css"; // ເພີ່ມ weight 700 (bold)

export const theme = createTheme({
  typography: {
    fontFamily: ['"Noto Sans Lao"', '"Roboto"', '"Arial"', "sans-serif"].join(
      ","
    ),
  },
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#9c27b0",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "@global": {
          "@font-face": [
            {
              fontFamily: "Noto Sans Lao",
              fontStyle: "normal",
              fontDisplay: "swap",
            },
          ],
        },
      },
    },
  },
});

// TypeScript declarations
declare module "@mui/material/styles" {
  interface Theme {
    // ປະກອບຄຸນລັກສະນະ theme ເພີ່ມເຕີມຖ້າມີ
    custom?: {
      palette?: {
        customColor?: string;
      };
    };
  }

  interface ThemeOptions {
    // ປະກອບຕົວເລືອກ theme ເພີ່ມເຕີມ
    custom?: {
      palette?: {
        customColor?: string;
      };
    };
  }
}
