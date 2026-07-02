import { useEffect, useRef, useState } from "react";
import { openAiChat } from "@port-labs/plugins-sdk";
import { TEMPLATES } from "../surveys/registry";
import { groupByFramework, partition } from "../utils/surveyGrouping";
import { copyText } from "../utils/share";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { SurveyDefinition, SurveyRow } from "../types";

/** Small sparkle mark for the "Build with AI" affordances (replaces an emoji). */
function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.2 6.2a3 3 0 0 0 1.6 1.6L22 12l-6.2 2.2a3 3 0 0 0-1.6 1.6L12 22l-2.2-6.2a3 3 0 0 0-1.6-1.6L2 12l6.2-2.2a3 3 0 0 0 1.6-1.6z" />
    </svg>
  );
}

/**
 * Starter prompts to paste into Port AI for drafting a survey from a goal.
 * `label` is the scannable row text; `text` is the richer prompt that gets copied.
 */
const AI_PROMPTS: { label: string; text: string }[] = [
  {
    label: "Uncover our biggest delivery bottlenecks",
    text: `Before writing a single question, I need you to do some discovery first.

Start by analyzing our Port environment: look at deployment frequency, change failure rate, lead time for changes, and any incident or on-call data available across our teams and services. Identify the top 2-3 delivery bottlenecks you can see in the data.

Then ask me:
- Which engineering teams or services should this survey focus on?
- Which bottleneck concerns me most right now - speed, stability, or process overhead?
- Is there a specific time window I care about (e.g. last quarter, since a recent reorg)?

Once I answer, use your findings and my priorities to design a targeted survey (8-12 questions, mostly 1-5 rating scales with one or two open-text questions) that surfaces the root causes - not just the symptoms. Group questions into clear dimensions (e.g. Release process, Review cycles, Incident response).

Finally, recommend which specific teams should receive this survey based on the patterns you identified, and explain why.`,
  },
  {
    label: "AI adoption & impact pulse",
    text: `Before building this survey, do discovery first.

Look at our Port environment: check team structures, tool integrations, any AI-related service catalog entries, and usage patterns that might indicate where AI tooling is already embedded vs. where it is absent. Note which teams appear to be early adopters vs. laggards.

Then ask me:
- What outcome matters most to me right now - developer velocity, code quality, time saved on toil, or confidence in AI output?
- Are there specific teams I want to include or exclude from this pulse?
- Is this a baseline measurement or a follow-up to a previous survey?

Use your analysis and my answers to design a focused AI adoption and impact survey (10-14 questions) with dimensions covering: adoption breadth, usage frequency, perceived impact, and barriers to adoption. Recommend the teams that would provide the most representative and actionable signal, and flag any teams where low data coverage suggests we should treat results with caution.`,
  },
  {
    label: "Post-incident developer experience check",
    text: `Start with discovery before writing any questions.

Review our recent incident data in Port: look at incident frequency, severity distribution, mean time to resolve, and which teams or services appear most often. Identify the teams that have been under the most operational pressure recently.

Then ask me:
- Should this survey focus on a specific incident, a time window, or general on-call health?
- Am I more concerned about process friction (e.g. runbooks, escalation), tooling friction (e.g. observability, alerting), or team coordination?
- Do I want this to go to all engineers or only those who were on-call?

Based on your findings and my answers, create a developer experience survey (8-12 questions) that pinpoints what is driving fatigue and friction - covering detection, response, communication, and recovery. At the end, recommend the specific teams who should fill it out and in what order of priority.`,
  },
  {
    label: "New-engineer onboarding experience",
    text: `Before designing questions, do some discovery in our Port environment.

Look at our team structures, service ownership data, and any onboarding-related entities or workflows visible in Port. Try to understand: how many teams have recently onboarded engineers, what our typical service complexity looks like, and whether there are common toolchains across teams or significant fragmentation.

Then ask me:
- How recently did the engineers I want to survey join (e.g. last 30, 60, or 90 days)?
- What do I suspect is the biggest friction point - documentation, access and setup, or finding the right people to ask?
- Are there specific teams or tribes whose onboarding I want to compare?

Use this context to design a targeted onboarding survey (8-12 questions) covering: time to first meaningful contribution, clarity of documentation, tooling setup experience, and social integration. Recommend which teams to send it to first for the clearest signal.`,
  },
  {
    label: "Meeting load & focus time",
    text: `Before writing questions, do discovery in our Port environment.

Look at team sizes, on-call rotations, and any workflow or sprint data visible in Port to get a sense of which teams are likely to have the most fragmented schedules. Identify signals that suggest high coordination overhead (e.g. many cross-team dependencies, large on-call pools, frequent incidents).

Then ask me:
- Is this about a specific team I am concerned about, or am I trying to get a broad picture across engineering?
- Am I more focused on meeting volume, context-switching, or the quality of focus blocks?
- Has there been a recent org change (reorg, new process, hybrid work policy) that might be influencing this?

Design a survey (8-10 questions) covering: meeting frequency and perceived value, depth and availability of focus time, context-switching cost, and async communication effectiveness. Recommend the teams where fragmentation signals in the data are strongest.`,
  },
  {
    label: "Tooling & platform satisfaction",
    text: `Start with a discovery pass before writing any questions.

Analyze our Port service catalog and integrations: look at which tools and platforms are in use across teams, how many services each team owns, and whether there are signals of inconsistency (e.g. teams using very different stacks, or services with many open issues in the catalog). Identify areas where tooling fragmentation or dissatisfaction is most likely.

Then ask me:
- Am I focusing on internal developer tooling (CI, deployment, monitoring), the developer portal itself, or both?
- Are there specific platform capabilities that have recently changed or been rolled out?
- Which teams or roles (e.g. senior engineers vs. new joiners) should I prioritize?

Design a platform satisfaction survey (10-14 questions) with dimensions covering: reliability and uptime, ease of use and discoverability, support and documentation, and overall productivity impact. Based on catalog complexity and team size, recommend the teams most likely to give high-signal feedback.`,
  },
  {
    label: "Code review health",
    text: `Before designing questions, analyze what is already visible in our Port data.

Look at pull request and code review data: check review turnaround times, PR size distributions, and which teams or services have the most review activity or the longest review queues. Identify where review bottlenecks or quality issues are most likely based on the patterns you see.

Then ask me:
- Am I more concerned about review speed (PRs sitting too long) or review quality (shallow feedback, rubber-stamping)?
- Is there a specific team, codebase area, or recent incident that triggered this survey?
- Should this survey go to all engineers or focus on senior reviewers and leads?

Design a code review health survey (8-12 questions) covering: turnaround expectations, feedback quality and depth, psychological safety in the review process, and tooling support. At the end, recommend the teams where the data suggests review health is most at risk.`,
  },
];

/** How many starter prompts to show before "Show more". */
const AI_PROMPTS_PREVIEW = 3;

type Props = {
  onPick: (def: SurveyDefinition | null) => void; // null = blank
  onCancel: () => void;
  /** Existing surveys offered as clone sources. */
  surveys?: SurveyRow[];
  /** Clone an existing survey into a new draft. */
  onClone?: (identifier: string) => void;
};

/** Choose a starting point for a new survey: a template, blank, or a clone. */
export function TemplatePicker({ onPick, onCancel, surveys, onClone }: Props) {
  const cloneable = surveys ?? [];
  // Frameworks whose clone group is expanded (collapsed by default to stay tidy
  // when there are many frameworks/surveys).
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  // Frameworks whose older clone sources are currently expanded.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // Whether the "Build with AI" starter prompts are revealed.
  const [aiOpen, setAiOpen] = useState(false);
  // Whether all prompts are shown (vs. the preview count).
  const [aiShowAll, setAiShowAll] = useState(false);
  // The prompt whose full text is currently previewed (by label), or null.
  const [previewLabel, setPreviewLabel] = useState<string | null>(null);
  // The prompt whose action just fired, with the transient label to show
  // ("Opened in Port AI" or, in standalone dev, "Copied!").
  const [ackPrompt, setAckPrompt] = useState<{ text: string; label: string } | null>(null);
  const ackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptsRef = useRef<HTMLElement | null>(null);

  useEffect(() => () => {
    if (ackTimer.current) clearTimeout(ackTimer.current);
  }, []);

  // The prompts panel renders at the bottom; scroll it into view when opened.
  useEffect(() => {
    if (aiOpen) promptsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [aiOpen]);

  const ackFor = (text: string, label: string) => {
    setAckPrompt({ text, label });
    if (ackTimer.current) clearTimeout(ackTimer.current);
    ackTimer.current = setTimeout(() => setAckPrompt(null), 2000);
  };

  // Open the Port AI side chat with the prompt pre-filled (build mode - these
  // prompts ask Port AI to design a survey). Standalone dev has no Port host to
  // receive the message, so fall back to copying the prompt to the clipboard.
  const handleUsePrompt = async (prompt: string) => {
    if (DEV_MOCK) {
      const ok = await copyText(prompt);
      if (ok) ackFor(prompt, "Copied!");
      return;
    }
    openAiChat(prompt, { chatMode: "build" });
    ackFor(prompt, "Opened in Port AI");
  };

  const cloneCard = (s: SurveyRow) => (
    <button
      key={s.identifier}
      type="button"
      className="tpl-card"
      onClick={() => onClone?.(s.identifier)}
    >
      <span className="tpl-card__label">{s.title}</span>
      <span className="tpl-card__meta">
        {[
          s.framework && s.framework !== "custom" ? s.framework : s.framework === "custom" ? "Custom" : null,
          typeof s.questionCount === "number" ? `${s.questionCount} questions` : null,
          typeof s.dimensionCount === "number" ? `${s.dimensionCount} dimensions` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </button>
  );

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Choose a starting point">
      <div className="modal">
        <div className="modal__head">
          <h2 className="modal__title">New survey</h2>
          <button type="button" className="iconbtn" title="Close" onClick={onCancel}>✕</button>
        </div>
        <p className="muted">Start from a research-backed template, or build your own.</p>

        <div className="tpl-grid">
          <button type="button" className="tpl-card tpl-card--blank" onClick={() => onPick(null)}>
            <span className="tpl-card__label">Blank survey</span>
            <span className="tpl-card__blurb">
              An empty survey. Add your own dimensions and questions from scratch.
            </span>
          </button>

          <button
            type="button"
            className={`tpl-card tpl-card--ai${aiOpen ? " tpl-card--ai-open" : ""}`}
            aria-expanded={aiOpen}
            onClick={() => setAiOpen((v) => !v)}
          >
            <span className="tpl-card__label ai-label">
              <SparkleIcon /> Build with AI
            </span>
            <span className="tpl-card__blurb">
              Draft a survey using Port AI.
            </span>
            <span className="tpl-card__meta">
              {aiOpen ? "Hide starter prompts" : "Show starter prompts"}
            </span>
          </button>

          {TEMPLATES.map((t) => (
            <button
              key={t.framework}
              type="button"
              className="tpl-card"
              onClick={() => onPick(t.definition)}
            >
              <span className="tpl-card__label">{t.label}</span>
              <span className="tpl-card__blurb">{t.blurb}</span>
              <span className="tpl-card__meta">
                {t.definition.questions.length} questions · {t.definition.dimensions.length} dimensions
              </span>
            </button>
          ))}
        </div>

        {aiOpen && (
          <section className="ai-prompts" ref={promptsRef}>
            <span className="ai-prompts__title ai-label">
              <SparkleIcon /> Build with AI
            </span>
            <p className="muted ai-prompts__hint">
              Pick a prompt to open Port AI with it pre-filled. Each one asks Port AI to analyze your environment first, ask clarifying questions, then design a targeted survey and recommend which teams to send it to - edit it before or after sending.
            </p>
            <ul className="ai-prompts__list">
              {(aiShowAll ? AI_PROMPTS : AI_PROMPTS.slice(0, AI_PROMPTS_PREVIEW)).map(
                (p) => (
                  <li key={p.label} className="ai-prompts__item">
                    <div className="ai-prompts__row">
                      <span className="ai-prompts__label">{p.label}</span>
                      <div className="ai-prompts__actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          aria-expanded={previewLabel === p.label}
                          onClick={() =>
                            setPreviewLabel((cur) => (cur === p.label ? null : p.label))
                          }
                        >
                          {previewLabel === p.label ? "Hide" : "Preview"}
                        </button>
                        <button
                          type="button"
                          className="btn btn--cta btn--sm ai-prompts__use"
                          onClick={() => void handleUsePrompt(p.text)}
                        >
                          {ackPrompt?.text === p.text
                            ? ackPrompt.label
                            : DEV_MOCK
                            ? "Copy"
                            : "Open in Port AI"}
                        </button>
                      </div>
                    </div>
                    {previewLabel === p.label && (
                      <p className="ai-prompts__preview">{p.text}</p>
                    )}
                  </li>
                )
              )}
            </ul>
            {AI_PROMPTS.length > AI_PROMPTS_PREVIEW && (
              <button
                type="button"
                className="survey-group__more ai-prompts__more"
                aria-expanded={aiShowAll}
                onClick={() => setAiShowAll((v) => !v)}
              >
                {aiShowAll
                  ? "Show fewer"
                  : `Show ${AI_PROMPTS.length - AI_PROMPTS_PREVIEW} more`}
              </button>
            )}
          </section>
        )}

        {onClone && cloneable.length > 0 && (
          <>
            <p className="modal__section">Duplicate an existing survey</p>
            <p className="muted">
              Reuse another survey's questions and customizations. The copy opens as a draft you can rename and activate.
            </p>
            {groupByFramework(cloneable).map((g) => {
              const { primary, history } = partition(g.items);
              const isOpen = !!expanded[g.framework];
              const groupOpen = !!openGroups[g.framework];
              return (
                <div key={g.framework} className="clone-group">
                  <button
                    type="button"
                    className="clone-group__toggle"
                    aria-expanded={groupOpen}
                    onClick={() =>
                      setOpenGroups((o) => ({ ...o, [g.framework]: !groupOpen }))
                    }
                  >
                    <span className="clone-group__caret" aria-hidden="true">
                      {groupOpen ? "▾" : "▸"}
                    </span>
                    <span className="clone-group__name">{g.framework}</span>
                    <span className="clone-group__count">{g.items.length}</span>
                  </button>
                  {groupOpen && (
                    <>
                      <div className="tpl-grid">{primary.map(cloneCard)}</div>
                      {history.length > 0 && (
                        <>
                          <button
                            type="button"
                            className="survey-group__more"
                            aria-expanded={isOpen}
                            onClick={() =>
                              setExpanded((e) => ({ ...e, [g.framework]: !isOpen }))
                            }
                          >
                            {isOpen
                              ? "Hide earlier surveys"
                              : `Show ${history.length} earlier survey${history.length === 1 ? "" : "s"}`}
                          </button>
                          {isOpen && <div className="tpl-grid">{history.map(cloneCard)}</div>}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
