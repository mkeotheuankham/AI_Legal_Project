// src/App.tsx
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./styles/theme";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChatPage />
    </ThemeProvider>
  );
}

export default App;
