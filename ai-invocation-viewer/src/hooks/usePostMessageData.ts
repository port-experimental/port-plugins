import { useEffect, useMemo, useState } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import type { Entity, Page, Params, User } from "../types";

export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;

const MOCK_BASE_URL = "https://api.getport.io";
const MOCK_TOKEN = "dev-mock-token";
const MOCK_ENTITY_ID: string | null = "mock-invocation";
const MOCK_ENTITY_BLUEPRINT = "_ai_invocations";
const MOCK_ENTITY_TITLE = "AI Invocation (mock)";
const MOCK_USER_EMAIL = "developer@example.com";

const MOCK_EXECUTION_LOGS = JSON.stringify(
  {
    messages: [
      {
        role: "user",
        messageId: "u1",
        content: [
          "## User Request",
          "I want you to create a custom widget for the `_ai_invocations` entity.",
          "",
          "It should:",
          "- show the invocation as a chat",
          "- let me open tool inputs/outputs",
          "- render markdown correctly",
          "- truncate long messages with an expand control",
          "- keep the expand chevron compact (no circle)",
          "",
          "Also make sure dark theme works, tool dialogs stay centered in the iframe,",
          "and the fade at the bottom of truncated bubbles does not cover the last line of text.",
        ].join("\n"),
      },
      {
        role: "assistant",
        messageId: "a1",
        content: [
          {
            type: "reasoning",
            text: "",
            durationMs: 1200,
          },
          {
            type: "text",
            text: "I'll inspect the blueprint schema and the `port-custom-widgets` repo next.",
          },
        ],
        toolCalls: [
          {
            id: "t1",
            name: "list_blueprints",
            arguments: { identifiers: ["_ai_invocations"] },
          },
          {
            id: "t2",
            name: "github_get_file_contents",
            arguments: {
              path: "README.md",
              owner: "port-labs",
              repo: "port-custom-widgets",
            },
          },
          {
            id: "t3",
            name: "search_entities",
            arguments: {
              blueprint: "_ai_invocations",
              limit: 2,
            },
          },
          {
            id: "t4",
            name: "get_skill_instructions",
            arguments: {
              name: "create-custom-widget",
            },
          },
        ],
      },
      {
        role: "tool",
        messageId: "tr1",
        toolCallId: "t1",
        content: JSON.stringify(
          {
            blueprints: [
              { identifier: "_ai_invocations", title: "AI Invocation" },
            ],
          },
          null,
          2
        ),
      },
      {
        role: "tool",
        messageId: "tr2",
        toolCallId: "t2",
        isError: true,
        content: "Error: file not found in mock mode",
      },
      {
        role: "tool",
        messageId: "tr3",
        toolCallId: "t3",
        content: JSON.stringify(
          {
            entities: [
              {
                identifier: "mock-invocation",
                title: "AI Invocation (mock)",
                properties: {
                  status: "In Progress",
                  model: "claude-sonnet-4-6",
                },
              },
              {
                identifier: "inv-42",
                title: "Deploy widget polish",
                properties: {
                  status: "Completed",
                  model: "claude-sonnet-4-6",
                },
              },
            ],
            matchedCount: 2,
          },
          null,
          2
        ),
      },
      {
        role: "tool",
        messageId: "tr4",
        toolCallId: "t4",
        content: [
          "# create-custom-widget",
          "",
          "Build the widget with `@port-labs/anchor-ui`.",
          "",
          "## Checklist",
          "- Import AnchorUI `styles.css`",
          "- Set `data-theme` from Port theme mode",
          "- Reset `--side-chat-width` in the iframe",
          "",
          "This output is plain markdown (not JSON) so the tool dialog should",
          "render it as a normal code block without JSON highlighting.",
        ].join("\n"),
      },
      {
        role: "assistant",
        messageId: "a2",
        content: [
          {
            type: "text",
            text: [
              "### Plan",
              "1. Parse `execution_logs.messages` into a chronological chat transcript",
              "2. Render user messages on the right and assistant messages on the left",
              "3. Support expandable markdown for long replies (this message should trigger the chevron)",
              "4. Open tool calls in an AnchorUI dialog with input/output panels",
              "",
              "### Implementation notes",
              "- Prefer `@port-labs/anchor-ui` for interactive controls",
              "- Reset `--side-chat-width` inside the iframe so dialogs stay centered",
              "- Keep collapsed bubbles compact: short fade + small chevron, no circular button",
              "",
              "```ts",
              "parseConversation(logs)",
              "```",
              "",
              "After that, verify truncation, theme tokens, and tool modal alignment against a real `_ai_invocations` entity.",
            ].join("\n"),
          },
        ],
        toolCalls: [],
      },
      {
        role: "user",
        messageId: "u2",
        content: [
          "Looks good — please continue.",
          "",
          "Also add:",
          "- Overview tab with identity / gauges / details sections",
          "- Overview first, Flow second",
          "- Enough mock turns so I can verify chat scrolling in the iframe",
        ].join("\n"),
      },
      {
        role: "assistant",
        messageId: "a3",
        content: [
          {
            type: "text",
            text: "Next I'll pull a few sample entities and sketch the Overview dashboard layout.",
          },
        ],
        toolCalls: [
          {
            id: "t5",
            name: "get_blueprint",
            arguments: { identifier: "_ai_invocations" },
          },
          {
            id: "t6",
            name: "search_entities",
            arguments: {
              blueprint: "_ai_invocations",
              query: { combinator: "and", rules: [] },
              limit: 5,
            },
          },
        ],
      },
      {
        role: "tool",
        messageId: "tr5",
        toolCallId: "t5",
        content: JSON.stringify(
          {
            identifier: "_ai_invocations",
            title: "AI Invocation",
            schema: {
              properties: {
                status: { type: "string", enum: ["Completed", "Failed", "In Progress"] },
                model: { type: "string" },
                context_usage_percent: { type: "number" },
                execution_logs: { type: "string", format: "markdown" },
              },
            },
          },
          null,
          2
        ),
      },
      {
        role: "tool",
        messageId: "tr6",
        toolCallId: "t6",
        content: JSON.stringify(
          {
            matchedCount: 5,
            entities: [
              { identifier: "inv-01", title: "Summarize P589DAL", status: "Completed" },
              { identifier: "inv-02", title: "Draft runbook", status: "Completed" },
              { identifier: "inv-03", title: "Triage alert", status: "Failed" },
              { identifier: "inv-04", title: "Widget polish", status: "In Progress" },
              { identifier: "inv-05", title: "Quota check", status: "Completed" },
            ],
          },
          null,
          2
        ),
      },
      {
        role: "assistant",
        messageId: "a4",
        content: [
          {
            type: "text",
            text: [
              "### Overview sections",
              "",
              "| Section | Contents |",
              "| --- | --- |",
              "| Identity | Avatar, title, status chips |",
              "| Summary | Duration, tool count |",
              "| Usage | Context + quota gauges |",
              "| Details | Model, provider, timestamps, labels |",
              "| Feedback | Rating + comment when present |",
              "",
              "I'll keep gauges in one panel so they read as a single usage block.",
              "Flow stays a chronological chat with tool pills opening a dialog.",
            ].join("\n"),
          },
        ],
        toolCalls: [],
      },
      {
        role: "user",
        messageId: "u3",
        content:
          "Scrolling broke after Overview became the default tab. Can you check the flex height chain?",
      },
      {
        role: "assistant",
        messageId: "a5",
        content: [
          {
            type: "text",
            text: "Likely AnchorUI `TabGroup` wrapping without `min-height: 0`. I'll confirm against the package and fix the CSS.",
          },
        ],
        toolCalls: [
          {
            id: "t7",
            name: "github_search_code",
            arguments: {
              query: "TabPanels selectedChild cloneElement",
              owner: "port-labs",
            },
          },
        ],
      },
      {
        role: "tool",
        messageId: "tr7",
        toolCallId: "t7",
        content: JSON.stringify(
          {
            hits: [
              {
                path: "src/components/Tabs/TabPanels.tsx",
                snippet:
                  "const selectedChild = Children.toArray(children)[selectedIndex]",
              },
              {
                path: "src/components/Tabs/TabGroup.tsx",
                snippet: 'as: Component = "div"',
              },
            ],
          },
          null,
          2
        ),
      },
      {
        role: "assistant",
        messageId: "a6",
        content: [
          {
            type: "text",
            text: [
              "Confirmed: `TabGroup` renders a bare wrapper `div`, and `TabPanels` only mounts the selected panel.",
              "",
              "Fix:",
              "1. Add `className=\"tabs-group\"` on `TabGroup`",
              "2. Style it with `flex: 1`, `min-height: 0`, `overflow: hidden`",
              "3. Keep `.chat-thread` as the only vertical scroller in Flow",
              "",
              "That restores nested scrolling inside the iframe regardless of which tab is default.",
            ].join("\n"),
          },
        ],
        toolCalls: [],
      },
      {
        role: "user",
        messageId: "u4",
        content: [
          "Great. One more pass:",
          "- pad the mock conversation so Flow is tall enough to scroll",
          "- keep a mix of short and long bubbles",
          "- include at least one more tool round for dialog testing",
        ].join("\n"),
      },
      {
        role: "assistant",
        messageId: "a7",
        content: [
          {
            type: "text",
            text: "Expanding the mock entity now, then I'll re-check overflow on both tabs.",
          },
        ],
        toolCalls: [
          {
            id: "t8",
            name: "read_file",
            arguments: {
              path: "ai-invocation-viewer/src/hooks/usePostMessageData.ts",
            },
          },
          {
            id: "t9",
            name: "read_file",
            arguments: {
              path: "ai-invocation-viewer/src/App.css",
            },
          },
        ],
      },
      {
        role: "tool",
        messageId: "tr8",
        toolCallId: "t8",
        content:
          "MOCK_EXECUTION_LOGS currently has 2 user turns and 2 assistant turns — too short for scroll QA.",
      },
      {
        role: "tool",
        messageId: "tr9",
        toolCallId: "t9",
        content: [
          ".tabs-group { flex: 1; min-height: 0; overflow: hidden; }",
          ".chat-thread { overflow-y: auto; min-height: 0; }",
          ".overview { overflow-y: auto; min-height: 0; }",
        ].join("\n"),
      },
      {
        role: "assistant",
        messageId: "a8",
        content: [
          {
            type: "text",
            text: [
              "### Scroll QA checklist",
              "",
              "- [ ] Overview scrolls independently when content exceeds the iframe",
              "- [ ] Flow chat scrolls independently after switching tabs",
              "- [ ] Long bubbles show the expand chevron",
              "- [ ] Wheel events do not escape to the Port host page",
              "- [ ] Tool dialog still centers with `--side-chat-width: 0`",
              "",
              "This reply is intentionally long so the bubble collapses and you can",
              "exercise expand/collapse while also scrolling the thread.",
              "",
              "Lorem notes for height only:",
              "1. Identity panel stays sticky in visual hierarchy, not position",
              "2. Usage gauges share one panel",
              "3. Details grid wraps labels without blowing horizontal overflow",
              "4. Feedback panel appears only when rating/comment exist",
              "5. Mock quota / context percentages should look realistic",
              "6. Tool pills stay centered under assistant turns",
              "7. User bubbles stay right-aligned",
              "8. Assistant bubbles stay left-aligned with avatar",
              "9. Markdown tables / lists must not break bubble width",
              "10. Dark theme tokens come from Port / AnchorUI, not hard-coded hex",
            ].join("\n"),
          },
        ],
        toolCalls: [],
      },
      {
        role: "user",
        messageId: "u5",
        content: "Ship it. Refreshing local `npm run dev` to verify.",
      },
      {
        role: "assistant",
        messageId: "a9",
        content: [
          {
            type: "text",
            text: [
              "Done — mock conversation now has multiple user/assistant turns and tool rounds.",
              "",
              "If Flow still does not scroll after refresh, inspect that `.tabs-group` is present",
              "on the TabGroup wrapper and that `.chat-thread` has a bounded height in DevTools.",
            ].join("\n"),
          },
        ],
        toolCalls: [],
      },
    ],
  },
  null,
  2
);

const mockEntity: Entity | undefined =
  DEV_MOCK && MOCK_ENTITY_ID
    ? {
        identifier: MOCK_ENTITY_ID,
        blueprint: MOCK_ENTITY_BLUEPRINT,
        title: MOCK_ENTITY_TITLE,
        properties: {
          status: "Completed",
          model: "claude-sonnet-4-6",
          provider: "port",
          source: "workflow",
          asked_at: "2026-08-25T18:00:01.743Z",
          replied_at: "2026-08-25T18:01:59.332Z",
          response_time_seconds: 118,
          prompt: "## User Request\ncontinue where you left off",
          response: "Picking up right where we left off.",
          error: null,
          context_usage_percent: 12.6,
          agent_title: "On call summarizer",
          feedback_rating: "positive",
          feedback_comment: "Useful trace — tools were easy to inspect.",
          labels: {
            source: "workflow",
            _workflow_node_run_identifier: "wfnr_mockDemo01",
          },
          quota: {
            month: "2026-08",
            monthlyLimit: 20000,
            remainingQuota: 13105,
            remainingTimeMs: 539880668,
          },
          execution_logs: `\`\`\`json\n${MOCK_EXECUTION_LOGS}\n\`\`\``,
        },
        relations: {
          agent: {
            identifier: "on_call_summarizer",
            title: "On call summarizer",
          },
          conversation: {
            identifier: "6af56464-b389-406f-a268-ae15a21ae69e",
            title: "Summary Triggered for Entity P589DAL",
          },
          asked_by: {
            identifier: "developer@example.com",
            title: "Dev Mock",
          },
          parent: null,
        },
      }
    : undefined;

export const usePostMessageData = () => {
  const sdk = usePortPluginData();

  const [mockParams] = useState<Params>({});
  const [mockPage] = useState<Page | undefined>();
  const [mockUser] = useState<User | undefined>(
    DEV_MOCK ? { email: MOCK_USER_EMAIL } : undefined
  );
  const [mockEntity_] = useState<Entity | undefined>(mockEntity);
  const [mockToken] = useState<string | null>(DEV_MOCK ? MOCK_TOKEN : null);
  const [mockBaseUrl] = useState<string | null>(
    DEV_MOCK ? MOCK_BASE_URL : null
  );

  const applyThemeCss = sdk.applyThemeCss;
  const themeMode = sdk.theme?.mode;
  const themeCss = sdk.theme?.css;

  useEffect(() => {
    const root = document.documentElement;

    if (DEV_MOCK) {
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
      // Widgets have no Port side-chat chrome; AnchorUI Dialog reads this var.
      root.style.setProperty("--side-chat-width", "0px", "important");
      return;
    }

    applyThemeCss();

    // Host theme.css may set --side-chat-width for the main app. Inside the
    // iframe that insets Dialog backdrop/panel incorrectly — force zero.
    root.style.setProperty("--side-chat-width", "0px", "important");

    if (themeMode === "light" || themeMode === "dark") {
      root.setAttribute("data-theme", themeMode);
      root.style.colorScheme = themeMode;
    } else {
      root.removeAttribute("data-theme");
      root.style.removeProperty("color-scheme");
    }
  }, [applyThemeCss, themeMode, themeCss]);

  return useMemo(() => {
    if (DEV_MOCK) {
      return {
        params: mockParams,
        page: mockPage,
        user: mockUser,
        entity: mockEntity_,
        portToken: mockToken,
        portApiBaseUrl: mockBaseUrl,
      };
    }
    return {
      params: (sdk.params ?? {}) as Params,
      page: sdk.page as Page | undefined,
      user: sdk.user as User | undefined,
      entity: sdk.entity as Entity | undefined,
      portToken: sdk.portToken,
      portApiBaseUrl: sdk.portApiBaseUrl,
    };
  }, [
    sdk.params,
    sdk.page,
    sdk.user,
    sdk.entity,
    sdk.portToken,
    sdk.portApiBaseUrl,
    mockParams,
    mockPage,
    mockUser,
    mockEntity_,
    mockToken,
    mockBaseUrl,
  ]);
};
