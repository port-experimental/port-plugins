import { DEV_MOCK } from "../hooks/usePostMessageData";
import {
  AI_OUTPUT_SCHEMA,
  AI_SYSTEM_PROMPT,
  AI_TOOLS,
} from "../constants";
import { MOCK_AI_DRAFT } from "../dev/mockData";
import type { AiProgress, AiSkillDraft, PluginConfig } from "../types";
import { readSse } from "../utils/sse";

type ApiContext = {
  baseUrl: string;
  token: string;
};

type GenerateArgs = {
  prompt: string;
  onProgress?: (p: AiProgress) => void;
  signal?: AbortSignal;
};

/**
 * Ask Port AI to draft a skill. Uses the general `/v1/ai/invoke` endpoint by
 * default, or a configured agent (`/v1/agent/{id}/invoke`) when
 * `config.aiAgentIdentifier` is set. Streams progress via SSE and returns the
 * structured draft produced through `outputSchema`.
 */
export async function generateSkillDraft(
  ctx: ApiContext,
  config: PluginConfig,
  { prompt, onProgress, signal }: GenerateArgs
): Promise<AiSkillDraft> {
  if (DEV_MOCK) {
    onProgress?.({ kind: "status", text: "Contacting Port AI…" });
    await delay(400, signal);
    onProgress?.({ kind: "tool", text: "search_entities" });
    await delay(500, signal);
    onProgress?.({ kind: "text", text: "Drafting SKILL.md…" });
    await delay(500, signal);
    return MOCK_AI_DRAFT;
  }

  const usingAgent = config.aiAgentIdentifier.trim().length > 0;
  const url = usingAgent
    ? `${ctx.baseUrl}/v1/agent/${encodeURIComponent(
        config.aiAgentIdentifier.trim()
      )}/invoke?stream=true`
    : `${ctx.baseUrl}/v1/ai/invoke?stream=true`;

  // Agents own their system prompt + tools; only pass those for the generic AI.
  const body: Record<string, unknown> = {
    prompt,
    outputSchema: AI_OUTPUT_SCHEMA,
    labels: { source: "skill_request_form" },
  };
  if (!usingAgent) {
    body.systemPrompt = AI_SYSTEM_PROMPT;
    body.tools = AI_TOOLS;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Port AI ${res.status}:\n${text}`);
  }

  const executionChunks: string[] = [];
  let errorMessage: string | null = null;

  for await (const evt of readSse(res, signal)) {
    switch (evt.event) {
      case "tool_call":
        onProgress?.({ kind: "tool", text: toolName(evt.data) });
        break;
      case "execution":
        executionChunks.push(evt.data);
        onProgress?.({ kind: "text", text: "Writing the skill…" });
        break;
      case "error":
        errorMessage = evt.data || "Port AI returned an error";
        break;
      case "done":
        break;
      default:
        break;
    }
  }

  if (errorMessage) throw new Error(errorMessage);

  const draft = parseDraft(executionChunks);
  if (!draft) {
    throw new Error(
      "Port AI did not return a usable draft. Try rephrasing your prompt."
    );
  }
  return draft;
}

function parseDraft(chunks: string[]): AiSkillDraft | null {
  if (chunks.length === 0) return null;

  // Structured output normally arrives as a single final JSON payload, but be
  // tolerant of chunked streams.
  const candidates = [chunks[chunks.length - 1], chunks.join("")];
  for (const candidate of candidates) {
    const obj = tryParseObject(candidate);
    if (obj && (obj.skill_md || obj.skill_name)) return obj;
  }

  // Fall back: treat the streamed text as raw SKILL.md content.
  const text = chunks.join("").trim();
  return text ? { skill_md: text } : null;
}

function tryParseObject(text: string): AiSkillDraft | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed ? (parsed as AiSkillDraft) : null;
  } catch {
    return null;
  }
}

function toolName(data: string): string {
  try {
    const parsed = JSON.parse(data);
    return parsed?.name ? `Looking up ${parsed.name}…` : "Gathering context…";
  } catch {
    return "Gathering context…";
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}
