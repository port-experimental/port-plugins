import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

const queryClient = new QueryClient();

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("plugin-root");
  if (root) {
    createRoot(root).render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );
  }
});
