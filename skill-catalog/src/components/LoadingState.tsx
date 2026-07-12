import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <Loader2 className="spinner" size={20} aria-hidden />
      <span>{label ?? "Loading…"}</span>
    </div>
  );
}
