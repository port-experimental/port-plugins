import "./App.css";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Avatar,
  Button,
  Callout,
  CalloutText,
  CircularProgressBar,
  Counter,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dot,
  Label,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Typography,
} from "@port-labs/anchor-ui";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useInvocationEntity } from "./hooks/useInvocationEntity";
import { parseConversation } from "./utils/parseConversation";
import type { ChatMessage, ToolCall } from "./types";

const COLLAPSED_MAX_HEIGHT = 154;
const TAB_STORAGE_PREFIX = "ai-invocation-viewer:tab:";

function readStoredTab(entityId: string): number {
  try {
    const raw = sessionStorage.getItem(TAB_STORAGE_PREFIX + entityId);
    const index = raw == null ? NaN : Number(raw);
    return index === 0 || index === 1 ? index : 0;
  } catch {
    return 0;
  }
}

function writeStoredTab(entityId: string, index: number) {
  try {
    sessionStorage.setItem(TAB_STORAGE_PREFIX + entityId, String(index));
  } catch {
    // ignore quota / private-mode failures
  }
}

function ExpandChevron({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d={up ? "M2.5 7.5 L6 4 L9.5 7.5" : "M2.5 4.5 L6 8 L9.5 4.5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * Tool results often nest schemas as stringified JSON (e.g. search_tools
 * `inputSchema`). Leave those as strings and the highlighter paints the whole
 * blob as one string token — looks "all black" in light mode. Expand them.
 */
function expandEmbeddedJson(value: unknown, depth = 0): unknown {
  if (depth > 6) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return expandEmbeddedJson(JSON.parse(trimmed), depth + 1);
      } catch {
        return value;
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => expandEmbeddedJson(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = expandEmbeddedJson(child, depth + 1);
    }
    return out;
  }

  return value;
}

/** Pretty-print when the value is JSON; otherwise return plain text. */
function formatToolPayload(value: unknown): { text: string; isJson: boolean } {
  if (value == null) return { text: "", isJson: false };

  if (typeof value !== "string") {
    return { text: prettyJson(expandEmbeddedJson(value)), isJson: true };
  }

  const trimmed = value.trim();
  if (!trimmed) return { text: value, isJson: false };

  try {
    return {
      text: prettyJson(expandEmbeddedJson(JSON.parse(trimmed))),
      isJson: true,
    };
  } catch {
    return { text: value, isJson: false };
  }
}

function highlightJson(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re =
    /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}\[\],:])/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }

    if (match[1] != null) {
      const full = match[0];
      const keyLexeme = match[1];
      nodes.push(
        <span key={key++} className="pl-ent">
          {keyLexeme}
        </span>
      );
      nodes.push(full.slice(keyLexeme.length));
    } else if (match[2] != null) {
      nodes.push(
        <span key={key++} className="pl-s">
          {match[2]}
        </span>
      );
    } else if (match[3] != null) {
      nodes.push(
        <span key={key++} className="pl-c1">
          {match[3]}
        </span>
      );
    } else if (match[4] != null) {
      nodes.push(
        <span key={key++} className="pl-k">
          {match[4]}
        </span>
      );
    } else {
      nodes.push(match[0]);
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function ToolCode({
  text,
  isJson,
  isError = false,
}: {
  text: string;
  isJson: boolean;
  isError?: boolean;
}) {
  // Local tokenizer + AnchorUI prettylights classes (pl-*) so colors match
  // CodeBlock without depending on starry-night/wasm.
  return (
    <pre
      className={`code-block${isJson ? " code-block--json code-block-highlight" : ""}${
        isError ? " code-block--error" : ""
      }`}
    >
      {isJson ? highlightJson(text) : text}
    </pre>
  );
}

function statusColor(
  status: string
): "green" | "blue" | "red" | "grey" | "orange" {
  const s = status.toLowerCase();
  if (s === "completed" || s === "success" || s === "succeeded") return "green";
  if (s === "running" || s === "in progress" || s === "in_progress") return "blue";
  if (s === "failed" || s === "error") return "red";
  if (s === "cancelled" || s === "canceled") return "orange";
  return "grey";
}

function isFailedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "failed" || s === "error";
}

function MarkdownBody({ markdown }: { markdown: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}

function ExpandableMessage({ children }: { children: ReactNode }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const measure = () => {
      setOverflows(el.scrollHeight > COLLAPSED_MAX_HEIGHT + 8);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div className={`expandable${expanded ? " expandable--open" : ""}`}>
      <div
        ref={bodyRef}
        className="expandable-body"
        style={
          expanded || !overflows
            ? undefined
            : { maxHeight: COLLAPSED_MAX_HEIGHT }
        }
      >
        {children}
      </div>
      {overflows && (
        <button
          type="button"
          className="expand-toggle"
          aria-label={expanded ? "Collapse message" : "Expand message"}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="expand-toggle-icon" aria-hidden="true">
            <ExpandChevron up={expanded} />
          </span>
        </button>
      )}
    </div>
  );
}

function ConversationAvatar({ side }: { side: "user" | "assistant" }) {
  return (
    <div className={`avatar avatar--${side}`} aria-hidden="true">
      {side === "user" ? "You" : "AI"}
    </div>
  );
}

function ToolPill({
  call,
  onOpen,
}: {
  call: ToolCall;
  onOpen: (call: ToolCall) => void;
}) {
  return (
    <button
      type="button"
      className={`tool-pill${call.isError ? " tool-pill--error" : ""}`}
      onClick={() => onOpen(call)}
    >
      <span className="tool-pill-name">{call.name}</span>
      {call.result !== null && (
        <span
          className={`tool-pill-status${
            call.isError ? " tool-pill-status--error" : ""
          }`}
        >
          {call.isError ? "Failed" : "Done"}
        </span>
      )}
      <span className="tool-pill-hint">Open</span>
    </button>
  );
}

function ToolDialog({
  call,
  onClose,
}: {
  call: ToolCall | null;
  onClose: () => void;
}) {
  if (!call) return null;

  const input =
    call.inputs == null ? null : formatToolPayload(call.inputs);
  const output =
    call.resultParsed != null
      ? {
          text: prettyJson(expandEmbeddedJson(call.resultParsed)),
          isJson: true,
        }
      : call.result != null
        ? formatToolPayload(call.result)
        : null;

  return (
    <Dialog
      open={Boolean(call)}
      onClose={onClose}
      size="small"
      className="tool-dialog-panel"
      overlayClassName="tool-dialog-overlay"
    >
      <DialogHeader>
        <DialogTitle>{call.name}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="tool-dialog-body">
          <Label color={call.isError ? "red" : "green"} size="small">
            {call.isError
              ? "Failed"
              : call.result !== null
                ? "Succeeded"
                : "No result yet"}
          </Label>

          {input != null && (
            <div className="io-block">
              <Typography variant="note" className="io-label">
                Input
              </Typography>
              <ToolCode text={input.text} isJson={input.isJson} />
            </div>
          )}

          {output != null && (
            <div className="io-block">
              <Typography
                variant="note"
                className={
                  call.isError ? "io-label io-label--error" : "io-label"
                }
              >
                Output
              </Typography>
              <ToolCode
                text={output.text}
                isJson={output.isJson}
                isError={call.isError}
              />
            </div>
          )}
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function ChatBubble({
  side,
  kicker,
  markdown,
}: {
  side: "user" | "assistant";
  kicker: string;
  markdown: string;
}) {
  if (!markdown) return null;

  return (
    <div className={`chat-row chat-row--${side}`}>
      {side === "assistant" && <ConversationAvatar side="assistant" />}
      <div className={`bubble-col bubble-col--${side}`}>
        <div className={`bubble bubble--${side}`}>
          <Typography variant="note" className="bubble-kicker">
            {kicker}
          </Typography>
          <ExpandableMessage>
            <MarkdownBody markdown={markdown} />
          </ExpandableMessage>
        </div>
      </div>
      {side === "user" && <ConversationAvatar side="user" />}
    </div>
  );
}

function ToolsRow({
  tools,
  onOpenTool,
}: {
  tools: ToolCall[];
  onOpenTool: (call: ToolCall) => void;
}) {
  if (tools.length === 0) return null;

  return (
    <div className="chat-row chat-row--tools">
      <div className="tools-list">
        {tools.map((call) => (
          <ToolPill key={call.id} call={call} onOpen={onOpenTool} />
        ))}
      </div>
    </div>
  );
}

function buildFallbackMessages(args: {
  prompt: string;
  response: string;
}): ChatMessage[] {
  const items: ChatMessage[] = [];
  if (args.prompt) {
    items.push({ kind: "user", id: "prompt", markdown: args.prompt });
  }
  if (args.response) {
    items.push({
      kind: "assistant",
      id: "response",
      markdown: args.response,
      toolCalls: [],
    });
  }
  return items;
}

function formatWhen(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Seconds between asked_at and replied_at (system fields — no org calc needed). */
function responseTimeSeconds(
  askedAt: string,
  repliedAt: string
): number | null {
  if (!askedAt || !repliedAt) return null;
  const start = Date.parse(askedAt);
  const end = Date.parse(repliedAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return (end - start) / 1000;
}

function relationLabel(rel: unknown): string | null {
  if (!rel || typeof rel !== "object") return null;
  const r = rel as { title?: string; identifier?: string };
  return r.title || r.identifier || null;
}

function statusDotColor(
  status: string
): "green" | "blue" | "red" | "orange" | "grey" {
  const s = status.toLowerCase();
  if (s === "completed" || s === "success" || s === "succeeded") return "green";
  if (s === "running" || s === "in progress" || s === "in_progress") return "blue";
  if (s === "failed" || s === "error") return "red";
  if (s === "cancelled" || s === "canceled") return "orange";
  return "grey";
}

function contextBarColor(
  pct: number
): "purple" | "oceanBlue" | "yellow" | "orange" | "red" {
  if (pct >= 85) return "red";
  if (pct >= 65) return "orange";
  if (pct >= 40) return "yellow";
  if (pct >= 20) return "oceanBlue";
  return "purple";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AI";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function OverviewSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`dash-panel${className ? ` ${className}` : ""}`}>
      <header className="dash-panel-head">
        <Typography variant="note" className="dash-panel-title">
          {title}
        </Typography>
      </header>
      <div className="dash-panel-body">{children}</div>
    </section>
  );
}

function OverviewPanel({
  title,
  status,
  model,
  provider,
  source,
  askedAt,
  repliedAt,
  responseTimeSec,
  contextPct,
  agentTitle,
  conversationTitle,
  askedBy,
  errorMsg,
  quota,
  feedbackRating,
  feedbackComment,
  labels,
  toolCount,
}: {
  title: string;
  status: string;
  model: string;
  provider: string;
  source: string;
  askedAt: string;
  repliedAt: string;
  responseTimeSec: number | null;
  contextPct: number | null;
  agentTitle: string | null;
  conversationTitle: string | null;
  askedBy: string | null;
  errorMsg: string | null;
  quota: Record<string, unknown> | null;
  feedbackRating: string;
  feedbackComment: string;
  labels: Record<string, unknown> | null;
  toolCount: number;
}) {
  const remainingQuota =
    quota && typeof quota.remainingQuota === "number"
      ? quota.remainingQuota
      : null;
  const monthlyLimit =
    quota && typeof quota.monthlyLimit === "number" ? quota.monthlyLimit : null;
  const quotaPct =
    remainingQuota != null && monthlyLimit != null && monthlyLimit > 0
      ? Math.round((remainingQuota / monthlyLimit) * 100)
      : null;
  const labelEntries =
    labels && typeof labels === "object" ? Object.entries(labels) : [];
  const heroName = agentTitle || title;
  const ctx = contextPct != null && !Number.isNaN(contextPct) ? contextPct : null;
  const hasUsage = ctx != null || quotaPct != null;
  const hasDetails = Boolean(
    (provider && provider !== model) ||
      conversationTitle ||
      askedBy ||
      askedAt ||
      repliedAt ||
      labelEntries.length > 0
  );
  // `error` is often left set after a successful resume; only trust it when
  // status still says the invocation failed.
  const showError = Boolean(errorMsg && isFailedStatus(status));

  return (
    <div className="overview">
      <OverviewSection title="Identity" className="dash-panel--identity">
        <div className="identity-row">
          <Avatar color="purple" size="xl" variant="filled">
            {initials(heroName)}
          </Avatar>
          <div className="identity-copy">
            <Typography variant="h3" className="overview-title">
              {title}
            </Typography>
            <div className="overview-hero-meta">
              {status && (
                <span className="overview-status">
                  <Dot color={statusDotColor(status)} size="sm" />
                  <Label color={statusColor(status)} size="small">
                    {status}
                  </Label>
                </span>
              )}
              {agentTitle && (
                <Label color="purple" size="small">
                  {agentTitle}
                </Label>
              )}
              {source && (
                <Label color="oceanBlue" size="small">
                  via {source}
                </Label>
              )}
              {model && (
                <Label color="grey" size="small">
                  {model}
                </Label>
              )}
            </div>
          </div>
        </div>
      </OverviewSection>

      {showError && errorMsg && (
        <OverviewSection title="Error" className="dash-panel--error">
          <Callout variant="alert">
            <CalloutText>{errorMsg}</CalloutText>
          </Callout>
        </OverviewSection>
      )}

      <div className="dash-row">
        <OverviewSection title="Summary" className="dash-panel--summary">
          <div className="kpi-grid" aria-label="Run metrics">
            <div className="kpi-cell kpi-cell--blue">
              <span className="kpi-label">Duration</span>
              <span className="kpi-value">
                {responseTimeSec != null && !Number.isNaN(responseTimeSec)
                  ? `${Math.round(responseTimeSec)}s`
                  : "—"}
              </span>
            </div>
            <div className="kpi-cell kpi-cell--green">
              <span className="kpi-label">Tools</span>
              <span className="kpi-value">{toolCount}</span>
            </div>
          </div>
        </OverviewSection>

        {hasUsage && (
          <OverviewSection title="Usage" className="dash-panel--usage">
            <div className="gauge-row">
              {ctx != null && (
                <div className="gauge-item">
                  <CircularProgressBar
                    value={Math.min(100, Math.max(0, ctx))}
                    size="lg"
                    color={contextBarColor(ctx)}
                    renderLabel={(v) => `${Math.round(v)}%`}
                  />
                  <div className="capacity-copy">
                    <Typography variant="body2">Context</Typography>
                    <Typography variant="note" className="muted">
                      Model window used
                    </Typography>
                  </div>
                </div>
              )}
              {quotaPct != null && (
                <div className="gauge-item">
                  <CircularProgressBar
                    value={Math.min(100, Math.max(0, quotaPct))}
                    size="lg"
                    color={
                      quotaPct < 15 ? "red" : quotaPct < 40 ? "orange" : "lime"
                    }
                    renderLabel={(v) => `${Math.round(v)}%`}
                  />
                  <div className="capacity-copy">
                    <Typography variant="body2">Quota</Typography>
                    <Typography variant="note" className="muted">
                      {remainingQuota!.toLocaleString()} /{" "}
                      {monthlyLimit!.toLocaleString()} left
                    </Typography>
                  </div>
                </div>
              )}
            </div>
          </OverviewSection>
        )}
      </div>

      {hasDetails && (
        <OverviewSection title="Details" className="dash-panel--details">
          <div className="info-grid">
            {provider && provider !== model && (
              <div className="info-item">
                <span className="detail-label">Provider</span>
                <span className="detail-value">{provider}</span>
              </div>
            )}
            {conversationTitle && (
              <div className="info-item info-item--wide">
                <span className="detail-label">Conversation</span>
                <span className="detail-value">{conversationTitle}</span>
              </div>
            )}
            {askedBy && (
              <div className="info-item">
                <span className="detail-label">Asked by</span>
                <span className="detail-value">{askedBy}</span>
              </div>
            )}
            {askedAt && (
              <div className="info-item">
                <span className="detail-label">Asked</span>
                <span className="detail-value">{formatWhen(askedAt)}</span>
              </div>
            )}
            {repliedAt && (
              <div className="info-item">
                <span className="detail-label">Replied</span>
                <span className="detail-value">{formatWhen(repliedAt)}</span>
              </div>
            )}
          </div>
          {labelEntries.length > 0 && (
            <div className="meta-labels">
              {labelEntries.map(([key, value]) => (
                <Label key={key} color="grey" size="small">
                  {key}: {str(value)}
                </Label>
              ))}
            </div>
          )}
        </OverviewSection>
      )}

      {feedbackRating && (
        <OverviewSection title="Feedback" className="dash-panel--feedback">
          <div
            className={`feedback-body${
              feedbackRating === "positive"
                ? " feedback-body--positive"
                : " feedback-body--negative"
            }`}
          >
            <Label
              color={feedbackRating === "positive" ? "green" : "red"}
              size="small"
            >
              {feedbackRating === "positive"
                ? "Positive feedback"
                : "Negative feedback"}
            </Label>
            {feedbackComment && (
              <Typography variant="body2" className="feedback-quote">
                {feedbackComment}
              </Typography>
            )}
          </div>
        </OverviewSection>
      )}
    </div>
  );
}

export function App() {
  const {
    entity: pageEntity,
    portToken,
    portApiBaseUrl,
  } = usePostMessageData();
  const {
    source,
    entity,
    isLoading: invocationLoading,
    error: invocationError,
    missingLatestInvocation,
  } = useInvocationEntity(pageEntity, portToken, portApiBaseUrl);
  const [activeTool, setActiveTool] = useState<ToolCall | null>(null);
  const [tabOverride, setTabOverride] = useState<number | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const props = entity?.properties ?? {};
  const relations = entity?.relations ?? {};
  const executionLogs = str(props.execution_logs);
  const prompt = str(props.prompt);
  const response = str(props.response);
  const status = str(props.status);
  const model = str(props.model);
  const provider = str(props.provider);
  const sourceProp = str(props.source);
  const askedAt = str(props.asked_at);
  const repliedAt = str(props.replied_at);
  const errorMsg = props.error ? str(props.error) : null;
  const feedbackRating = str(props.feedback_rating);
  const feedbackComment = str(props.feedback_comment);
  const contextPct =
    props.context_usage_percent != null
      ? Number(props.context_usage_percent)
      : null;
  const responseTimeSec = responseTimeSeconds(askedAt, repliedAt);
  const quota =
    props.quota && typeof props.quota === "object"
      ? (props.quota as Record<string, unknown>)
      : null;
  const labels =
    props.labels && typeof props.labels === "object"
      ? (props.labels as Record<string, unknown>)
      : null;

  const agentTitle =
    relationLabel(relations.agent) ||
    (props.agent_title ? str(props.agent_title) : null);
  const conversationTitle =
    relationLabel(relations.conversation) ||
    (source === "conversation"
      ? pageEntity?.title || pageEntity?.identifier || null
      : null);
  const askedBy = relationLabel(relations.asked_by);

  const messages = useMemo(() => {
    const fromLogs = parseConversation(executionLogs);
    if (fromLogs.length > 0) return fromLogs;
    return buildFallbackMessages({ prompt, response });
  }, [executionLogs, prompt, response]);

  const toolCount = useMemo(
    () =>
      messages.reduce(
        (n, msg) => (msg.kind === "assistant" ? n + msg.toolCalls.length : n),
        0
      ),
    [messages]
  );

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = 0;
  }, [entity?.identifier, messages.length]);

  useEffect(() => {
    setTabOverride(null);
  }, [entity?.identifier]);

  // Fullscreen remounts the iframe; keep the tab in sessionStorage so Flow
  // doesn't snap back to Overview (defaultIndex 0).
  const tabIndex =
    tabOverride ??
    (entity?.identifier ? readStoredTab(entity.identifier) : 0);

  const handleTabChange = (index: number) => {
    setTabOverride(index);
    if (entity?.identifier) writeStoredTab(entity.identifier, index);
  };

  if (!portApiBaseUrl || !portToken) {
    return (
      <div className="shell">
        <Typography variant="body1" className="muted">
          Waiting for Port context… Embed this widget on an entity page in Port.
        </Typography>
      </div>
    );
  }

  if (!pageEntity?.identifier) {
    return (
      <div className="shell">
        <Typography variant="body1" className="muted">
          Open this widget on an AI Invocation or AI Conversation entity page.
        </Typography>
      </div>
    );
  }

  if (source === "unknown") {
    return (
      <div className="shell">
        <Typography variant="body1" className="muted">
          This widget works on `_ai_invocations` or `_ai_conversation` entity
          pages.
        </Typography>
      </div>
    );
  }

  if (source === "conversation" && missingLatestInvocation) {
    return (
      <div className="shell">
        <Typography variant="body1" className="muted">
          This conversation has no latest invocation to display yet.
        </Typography>
      </div>
    );
  }

  if (source === "conversation" && invocationLoading && !entity) {
    return (
      <div className="shell">
        <Typography variant="body1" className="muted">
          Loading latest invocation…
        </Typography>
      </div>
    );
  }

  if (source === "conversation" && invocationError) {
    return (
      <div className="shell">
        <Typography variant="body1" className="muted">
          Could not load the latest invocation: {invocationError.message}
        </Typography>
      </div>
    );
  }

  if (!entity?.identifier) {
    return (
      <div className="shell">
        <Typography variant="body1" className="muted">
          Open this widget on an AI Invocation or AI Conversation entity page.
        </Typography>
      </div>
    );
  }

  return (
    <div className="shell">
      <TabGroup
        selectedIndex={tabIndex}
        onChange={handleTabChange}
        className="tabs-group"
      >
        <div className="tabs-shell">
          <div className="tabs-bar">
            <TabList>
              <Tab>Overview</Tab>
              <Tab
                rightIcon={
                  toolCount > 0 ? <Counter value={toolCount} /> : undefined
                }
              >
                Flow
              </Tab>
            </TabList>
          </div>

          <TabPanels className="tab-panels">
            <TabPanel className="tab-panel">
              <OverviewPanel
                title={entity.title ?? entity.identifier}
                status={status}
                model={model}
                provider={provider}
                source={sourceProp}
                askedAt={askedAt}
                repliedAt={repliedAt}
                responseTimeSec={responseTimeSec}
                contextPct={contextPct}
                agentTitle={agentTitle}
                conversationTitle={conversationTitle}
                askedBy={askedBy}
                errorMsg={errorMsg}
                quota={quota}
                feedbackRating={feedbackRating}
                feedbackComment={feedbackComment}
                labels={labels}
                toolCount={toolCount}
              />
            </TabPanel>

            <TabPanel className="tab-panel">
              <div
                ref={threadRef}
                className="chat-thread"
                role="log"
                aria-label="Invocation conversation"
              >
                {messages.length === 0 && (
                  <div className="chat-empty">
                    <Typography variant="body2" className="muted">
                      No conversation messages on this invocation yet.
                    </Typography>
                  </div>
                )}

                {messages.map((msg) =>
                  msg.kind === "user" ? (
                    <ChatBubble
                      key={msg.id}
                      side="user"
                      kicker="You"
                      markdown={msg.markdown}
                    />
                  ) : (
                    <div key={msg.id} className="assistant-block">
                      <ChatBubble
                        side="assistant"
                        kicker="Assistant"
                        markdown={msg.markdown}
                      />
                      <ToolsRow
                        tools={msg.toolCalls}
                        onOpenTool={setActiveTool}
                      />
                    </div>
                  )
                )}
              </div>
            </TabPanel>
          </TabPanels>
        </div>
      </TabGroup>

      <ToolDialog call={activeTool} onClose={() => setActiveTool(null)} />
    </div>
  );
}
