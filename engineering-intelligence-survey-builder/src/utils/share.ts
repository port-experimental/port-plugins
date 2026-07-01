import type { SurveyRow } from "../types";

/**
 * A ready-to-paste invite for a survey. Names the survey to choose and links to
 * the developer-survey picker dashboard (no per-survey deep link - the picker
 * lists everything shared with the recipient's team).
 */
export function buildSurveyShareText(
  survey: SurveyRow,
  dashboardUrl: string
): string {
  const lines: string[] = [`📋 ${survey.title} is open for responses.`];

  if (survey.description) lines.push(survey.description);
  if (typeof survey.questionCount === "number") {
    lines.push(`${survey.questionCount} questions, takes a few minutes.`);
  }
  lines.push(`Find it under "${survey.title}" here: ${dashboardUrl}`);

  return lines.join("\n");
}

/**
 * Copy text to the clipboard. Tries the async Clipboard API first, then falls
 * back to a hidden textarea for contexts (such as cross-origin iframes) where
 * the API is unavailable. Resolves to whether the copy succeeded.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    // Pin the textarea to the viewport and focus without scrolling, so the
    // page does not jump to it inside Port's iframe. Restore scroll as a guard.
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.width = "1px";
    ta.style.height = "1px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus({ preventScroll: true });
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    window.scrollTo(scrollX, scrollY);
    return ok;
  } catch {
    return false;
  }
}
