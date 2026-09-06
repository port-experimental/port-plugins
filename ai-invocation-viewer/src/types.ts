export interface Params {
  [key: string]: { type: string; value: unknown };
}

export type PluginConfig = Record<string, never>;

export interface User {
  email?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
}

export interface Entity {
  identifier: string;
  title?: string;
  blueprint?: string;
  properties?: Record<string, unknown>;
  relations?: Record<string, unknown>;
}

export interface Page {
  identifier?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  inputs: unknown;
  result: string | null;
  resultParsed: unknown;
  isError: boolean;
}

export type ChatMessage =
  | {
      kind: "user";
      id: string;
      markdown: string;
    }
  | {
      kind: "assistant";
      id: string;
      markdown: string;
      toolCalls: ToolCall[];
    };
