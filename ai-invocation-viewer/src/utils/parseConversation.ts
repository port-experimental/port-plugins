import type { ChatMessage, ToolCall } from "../types";

interface RawToolCall {
  id?: string;
  name?: string;
  arguments?: unknown;
}

interface RawPart {
  type?: string;
  text?: string;
}

interface RawMessage {
  role?: string;
  messageId?: string;
  content?: unknown;
  toolCalls?: RawToolCall[];
  toolCallId?: string;
  isError?: boolean;
}

function stripMarkdownFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/);
  if (fenced) return fenced[1];
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function assistantMarkdown(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";

  const chunks: string[] = [];
  for (const part of content as RawPart[]) {
    if (part?.type === "text" && part.text?.trim()) {
      chunks.push(part.text.trim());
    }
  }
  return chunks.join("\n\n");
}

function toToolCall(
  call: RawToolCall,
  resultMsg: RawMessage | undefined
): ToolCall {
  const result =
    typeof resultMsg?.content === "string" ? resultMsg.content : null;
  const resultParsed = result != null ? safeParseJson(result) : null;
  return {
    id: call.id ?? `${call.name ?? "tool"}-${Math.random()}`,
    name: call.name ?? "tool",
    inputs: call.arguments ?? null,
    result,
    resultParsed,
    isError: Boolean(resultMsg?.isError),
  };
}

/**
 * Parse `_ai_invocations.execution_logs`.
 *
 * Preferred format (current Port AI):
 * ```json
 * { "messages": [ { role, messageId, content, toolCalls? }, ... ] }
 * ```
 *
 * Tool results are separate `role: "tool"` messages linked by `toolCallId`.
 */
export function parseConversation(logs: string): ChatMessage[] {
  if (!logs?.trim()) return [];

  const parsed = safeParseJson(stripMarkdownFence(logs));
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as { messages?: unknown }).messages)
  ) {
    return [];
  }

  const messages = (parsed as { messages: RawMessage[] }).messages;
  const toolResults = new Map<string, RawMessage>();
  for (const msg of messages) {
    if (msg.role === "tool" && msg.toolCallId) {
      toolResults.set(msg.toolCallId, msg);
    }
  }

  const chat: ChatMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      const markdown =
        typeof msg.content === "string" ? msg.content.trim() : "";
      if (!markdown) continue;
      chat.push({
        kind: "user",
        id: msg.messageId ?? `user-${chat.length}`,
        markdown,
      });
      continue;
    }

    if (msg.role === "assistant") {
      const markdown = assistantMarkdown(msg.content);
      const toolCalls = (msg.toolCalls ?? []).map((call) =>
        toToolCall(call, call.id ? toolResults.get(call.id) : undefined)
      );
      if (!markdown && toolCalls.length === 0) continue;
      chat.push({
        kind: "assistant",
        id: msg.messageId ?? `assistant-${chat.length}`,
        markdown,
        toolCalls,
      });
    }
  }

  return chat;
}
