# UI and styling

Port plugins are embedded product UI. Build for full iframe width **and** height — large panels and small dashboard tiles.

## Table of contents

- [UI and styling](#ui-and-styling)
- [UX requirements](#ux-requirements)
- [Layout](#layout)
- [No duplicate Port chrome](#no-duplicate-port-chrome)
- [Icons](#icons)
- [Surface vs decoration colors](#surface-vs-decoration-colors)
- [Optional palette (`:root`)](#optional-palette-root)
- [Thin scrollbars](#thin-scrollbars)
- [Charts (Recharts)](#charts-recharts)
- [Drag-and-drop (optional)](#drag-and-drop-optional)

## UX requirements

| Area | Guidance |
|------|----------|
| **Loading** | Skeletons/spinners — never blank iframe while token or fetches are in flight |
| **Empty** | Explain why + next step (catalog, entity page placement, relations) |
| **Errors** | Human message + optional retry; log full API body to console |
| **Theme** | **`applyThemeCss()`**; Port CSS vars with local fallbacks |
| **Density** | Responsive typography/spacing (`clamp()`, media/container queries) |
| **Actions** | Clear primary actions; entity links via **`buildEntityPageUrl`** (portal, not API host) |
| **Accessibility** | Semantic HTML, focus, `aria-*`; icon library — **never emoji** |

Extract `LoadingState.tsx`, `EmptyState.tsx`, `ErrorBanner.tsx` when multiple views exist.

## Layout

Start from **`assets/template-App.css`** (includes iframe-safe flex). Minimum:

- Chain **`height: 100%`** / **`min-height: 100%`** on `html`, `body`, `#plugin-root` — [plugin-architecture.md](plugin-architecture.md).
- **`#plugin-root`**: `display: flex; flex-direction: column; min-height: 0`.
- **`.shell`**: `display: flex; flex-direction: column; flex: 1; min-height: 120px` (prevents **0px blank cards** in Port).
- **`.main`**: `flex: 1; min-height: 0` for scrollable content.
- **`width: 100%`**, **`box-sizing: border-box`**; avoid root **`max-width`** unless intentional inner cap.
- **`overflow-x: auto`** only on inner regions (wide tables), not the whole page.

Guard/setup screens: **`.shell--message`** + **`.muted`** with explicit color fallback (`var(--muted, #6b7280)`).

Blank iframe with no text → [production-readiness.md](production-readiness.md) §1 and §3.

## No duplicate Port chrome

Port’s iframe wrapper shows plugin **title**, **description**, and **icon**. **Do not** repeat them in `App.tsx`. Start at functional UI (toolbar, list, chart). In-content labels and entity titles are fine.

## Icons

Use a vetted icon library (Lucide, react-icons). No hardcoded emoji.

```tsx
<button type="button" aria-label="Remove">
  <TrashIcon size={16} aria-hidden />
</button>
```

## Surface vs decoration colors

| Layer | Where | Use for |
|-------|--------|---------|
| **Surface** | `:root` in `App.css` | Backgrounds, text, borders — `var(--background-primary, …)` |
| **Decoration** | Class-local vars | Dots, pills, links, chart marks — hex fallback on the class |

**Do not** add `--accent: var(--primary)` in `:root` for decorations.

```css
:root {
  --bg: var(--background-primary, #f0f2f5);
  --card: var(--background-dim, #ffffff);
  --text: var(--text-high, #111827);
  --border: var(--border-medium, rgba(0, 0, 0, 0.09));
}

.day-dot {
  --day-dot-color: #2563eb;
  background: var(--day-dot-color);
}
```

## Optional palette (`:root`)

After surfaces, optional hue aliases at **300** for strokes/dots/charts:

```css
--gold: var(--color-gold-300, #eec355);
```

For **pills/badges** on `--card`, add **`-bg`** (100/200) and **`-text`** (600–800) — not `color-mix` into white cards, not 300 for both bg and text:

```css
.level--gold {
  --level-pill-bg: var(--gold-bg);
  --level-pill-text: var(--gold-text);
}
```

Define variants only for hues the plugin actually uses.

## Thin scrollbars

From `template-App.css`:

| Class | Use |
|-------|-----|
| `.shell` | Main vertical scroll |
| `.scroll-area` | Other scrollable panels |
| `.table-scroll` + `.table-area` + `.scroll-mirror` | Wide tables — one horizontal bar on mirror only |

Copy `template-useScrollMirror.ts` for the table pattern. Reference: `ai-invocation-stats`.

## Charts (Recharts)

For bar/line/area/pie/donut and similar viz, **prefer [Recharts](https://recharts.org/)** — not hand-rolled SVG/CSS charts (except trivial single progress bars).

| Step | Action |
|------|--------|
| 1 | Add `"recharts": "^2.15.0"` |
| 2 | Apply [webpack-port-upload-safety.md](webpack-port-upload-safety.md) **proactively** |
| 3 | `<ResponsiveContainer width="100%" height={…}>` |
| 4 | Themed axes/tooltips via Port CSS vars |
| 5 | Loading/empty/error around chart |
| 6 | Mention Recharts in README **Features** |

Repo references: `entity-timeline`, `blueprint-field-types`. Do not add Chart.js/D3 stacks unless user explicitly requires them.

## Drag-and-drop (optional)

Native HTML5 DnD pattern for reorder/cross-container lists is documented in [plugin-architecture.md](plugin-architecture.md) (**Drag-and-drop**). Use optimistic local state + background Port API writes when persisting order.
