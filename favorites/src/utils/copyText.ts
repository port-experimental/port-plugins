/**
 * Copy text to the clipboard. In Port's iframe the Clipboard API is blocked by
 * permissions policy, so use the legacy textarea path there to avoid console
 * violations while still copying on user gesture when the browser allows it.
 */
export async function copyText(text: string): Promise<boolean> {
  const embedded = typeof window !== "undefined" && window.parent !== window;

  if (!embedded) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fall through to the legacy path */
    }
  }

  try {
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
