import React, { useState } from "react";
import type {
  CreateMethod,
  PluginConfig,
  SkillContext,
  SkillDraft,
  SkillGroupOption,
} from "../types";
import { draftFromUpload, emptyDraft } from "../utils/draft";
import { AiPrompt } from "./AiPrompt";
import { ModePicker } from "./ModePicker";
import { SkillRequestForm } from "./SkillRequestForm";

type Props = {
  baseUrl: string;
  token: string;
  config: PluginConfig;
  context: SkillContext;
  skillGroups: SkillGroupOption[];
  requesterEmail?: string;
  onClose: () => void;
};

type Phase = "choose" | "ai" | "editor";

export function CreateFlow({
  baseUrl,
  token,
  config,
  context,
  skillGroups,
  requesterEmail,
  onClose,
}: Props) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [draft, setDraft] = useState<SkillDraft | null>(null);
  const [method, setMethod] = useState<CreateMethod>("write");
  const [aiPrompt, setAiPrompt] = useState<string | undefined>();

  const startWith = (next: SkillDraft, m: CreateMethod, prompt?: string) => {
    setDraft(next);
    setMethod(m);
    setAiPrompt(prompt);
    setPhase("editor");
  };

  if (phase === "ai") {
    return (
      <AiPrompt
        baseUrl={baseUrl}
        token={token}
        config={config}
        onBack={() => setPhase("choose")}
        onGenerated={(d, prompt) => startWith(d, "ai", prompt)}
      />
    );
  }

  if (phase === "editor" && draft) {
    return (
      <SkillRequestForm
        baseUrl={baseUrl}
        token={token}
        config={config}
        context={context}
        initialDraft={draft}
        createMethod={method}
        aiPrompt={aiPrompt}
        skillGroups={skillGroups}
        requesterEmail={requesterEmail}
        onBack={() => setPhase("choose")}
      />
    );
  }

  return (
    <ModePicker
      onWrite={() => startWith(emptyDraft(), "write")}
      onAi={() => setPhase("ai")}
      onUpload={(content, fileName) =>
        startWith(draftFromUpload(content, deriveName(fileName)), "upload")
      }
      onClose={onClose}
    />
  );
}

function deriveName(fileName: string): string {
  const base = fileName.replace(/\.(md|markdown|txt)$/i, "");
  if (!base || base.toLowerCase() === "skill") return "";
  return base;
}
