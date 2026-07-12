import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./styles.css";

const qc = new QueryClient();
const root = createRoot(document.getElementById("root")!);
root.render(
  <QueryClientProvider client={qc}>
    <App />
  </QueryClientProvider>
);
