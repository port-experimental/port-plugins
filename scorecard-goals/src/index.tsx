import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { appTheme } from "./theme";

const queryClient = new QueryClient();

const root = createRoot(document.getElementById("plugin-root")!);
root.render(
  <StrictMode>
    <ThemeProvider theme={appTheme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
