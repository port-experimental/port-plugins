import { Field, Select, TextArea, TextInput, Toggle } from "./Field";
import { CADENCES, type Scale, type SurveyDraft } from "../types";

type Props = {
  draft: SurveyDraft;
  update: (patch: Partial<SurveyDraft>) => void;
  /** Custom framework names from existing surveys, shown as extra dropdown options. */
  customFrameworks?: string[];
};

const SCALE_MAXES = [3, 5, 7, 10];

const PRESET_FRAMEWORKS = new Set(["SPACE", "AI Adoption", "DORA", "DX Core 4"]);

const CADENCE_LABEL: Record<string, string> = {
  "one-off": "One-off",
  monthly: "Monthly",
  quarterly: "Quarterly",
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
};

export function MetaEditor({ draft, update, customFrameworks }: Props) {
  const setScale = (patch: Partial<Scale>) =>
    update({ scale: { ...draft.scale, ...patch } });

  const isPreset = PRESET_FRAMEWORKS.has(draft.framework);
  const isKnownCustom = !isPreset && !!customFrameworks?.includes(draft.framework);
  // Any non-preset framework triggers custom mode (shows name text input).
  const isCustom = !isPreset;
  // Show the actual value in the Select for presets and previously-used customs;
  // fall back to the "custom" sentinel for anything else.
  const selectValue = isPreset || isKnownCustom ? draft.framework : "custom";
  const customName = isCustom && draft.framework !== "custom" ? draft.framework : "";

  const frameworkOptions = [
    { value: "SPACE", label: "SPACE" },
    { value: "AI Adoption", label: "AI Adoption" },
    { value: "DORA", label: "DORA" },
    { value: "DX Core 4", label: "DX Core 4" },
    ...(customFrameworks ?? []).map((f) => ({ value: f, label: f })),
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="section">
      <Field label="Survey title">
        <TextInput
          value={draft.title}
          placeholder="e.g. SPACE - Q3 2026"
          onChange={(e) => update({ title: e.target.value })}
        />
      </Field>

      <Field
        label="Status"
        hint="Create saves a draft. Publish, share, and close live on the survey card."
      >
        {/* alignSelf keeps the pill at content width inside the stretch-column field. */}
        <span
          className={`tag tag--status tag--${draft.status}`}
          style={{ alignSelf: "flex-start" }}
        >
          {STATUS_LABEL[draft.status] ?? draft.status}
        </span>
      </Field>

      <div className="grid grid--2">
        <Field label="Framework" hint="Sets survey.framework on the entity.">
          <Select
            value={selectValue}
            onChange={(v) => update({ framework: v })}
            options={frameworkOptions}
          />
        </Field>
        <Field label="Cadence">
          <Select
            value={draft.cadence}
            onChange={(v) => update({ cadence: v })}
            options={CADENCES.map((c) => ({ value: c, label: CADENCE_LABEL[c] ?? c }))}
          />
        </Field>
      </div>
      {isCustom && (
        <Field
          label="Framework name"
          required
          hint="Required for custom frameworks."
        >
          <TextInput
            value={customName}
            placeholder="e.g. Google HEART, OKR Survey…"
            onChange={(e) =>
              update({ framework: e.target.value || "custom" })
            }
          />
        </Field>
      )}

      <Field
        label="Anonymous responses"
        hint="When on, responses are not attributed to the respondent."
      >
        <Toggle
          checked={draft.anonymous}
          onChange={(v) => update({ anonymous: v })}
          label={draft.anonymous ? "Responses are anonymous" : "Responses identify the respondent"}
        />
      </Field>

      <Field label="Description" hint="Shown to respondents above the form. Markdown supported.">
        <TextArea
          rows={3}
          value={draft.description}
          placeholder="A short intro explaining the purpose of this survey…"
          onChange={(e) => update({ description: e.target.value })}
        />
      </Field>

      <fieldset className="subsection">
        <legend>Default rating scale</legend>
        <p className="muted small">
          Applied to every rating-scale question.
        </p>
        <div className="grid grid--3">
          <Field label="Points">
            <Select
              value={String(draft.scale.max)}
              onChange={(v) => setScale({ min: 1, max: Number(v) })}
              options={SCALE_MAXES.map((n) => ({ value: String(n), label: `1–${n}` }))}
            />
          </Field>
          <Field label="Low label">
            <TextInput
              value={draft.scale.minLabel}
              onChange={(e) => setScale({ minLabel: e.target.value })}
            />
          </Field>
          <Field label="High label">
            <TextInput
              value={draft.scale.maxLabel}
              onChange={(e) => setScale({ maxLabel: e.target.value })}
            />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}
