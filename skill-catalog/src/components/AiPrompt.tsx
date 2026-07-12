import React, { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { generateSkillDraft } from "../api/ai";
import type { AiProgress, PluginConfig, SkillDraft } from "../types";
import { draftFromAi } from "../utils/draft";

type Props = {
  baseUrl: string;
  token: string;
  config: PluginConfig;
  onBack: () => void;
  onGenerated: (draft: SkillDraft, prompt: string) => void;
};

const EXAMPLES = [
  "A skill for safely rolling back a production deployment",
  "A skill that explains how to onboard a new microservice to our catalog",
  "A skill for triaging a failing CI pipeline",
];

export function AiPrompt({ baseUrl, token, config, onBack, onGenerated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [progress, setProgress] = useState<AiProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      const ai = await generateSkillDraft(
        { baseUrl, token },
        config,
        { prompt: text, onProgress: setProgress, signal: controller.signal }
      );
      return draftFromAi(ai);
    },
    onSuccess: (draft) => onGenerated(draft, prompt.trim()),
  });

  const generate = () => {
    const text = prompt.trim();
    if (!text || mutation.isPending) return;
    setProgress(null);
    mutation.mutate(text);
  };

  return (
    <div className="ai-panel">
      <button type="button" className="btn btn-ghost back-btn" onClick={onBack}>
        <ArrowLeft size={15} aria-hidden /> Back
      </button>

      <div>
        <h2 className="picker-title">
          <Sparkles size={18} aria-hidden className="inline-icon" /> Create with AI
        </h2>
        <p className="muted-block">
          Describe the skill in plain language. Port AI will draft a SKILL.md and
          any helpful supporting files for you to review.
        </p>
      </div>

      <textarea
        className="ai-textarea"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. A skill for debugging elevated latency on the rider API…"
        rows={4}
        disabled={mutation.isPending}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate();
        }}
      />

      <div className="ai-examples">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="chip"
            disabled={mutation.isPending}
            onClick={() => setPrompt(ex)}
          >
            {ex}
          </button>
        ))}
      </div>

      {mutation.isError && (
        <p className="inline-error" role="alert">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "AI generation failed"}
        </p>
      )}

      <div className="actions-bar">
        {mutation.isPending && progress && (
          <span className="muted-inline ai-progress">
            <Loader2 size={13} aria-hidden className="spinner" /> {progress.text}
          </span>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={generate}
          disabled={!prompt.trim() || mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={15} aria-hidden className="spinner" /> Generating…
            </>
          ) : (
            <>
              <Sparkles size={15} aria-hidden /> Generate draft
            </>
          )}
        </button>
      </div>
    </div>
  );
}
