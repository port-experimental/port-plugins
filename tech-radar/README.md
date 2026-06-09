# Port Tech Radar

A custom plugin for [Port](https://www.port.io) that renders a Zalando/ThoughtWorks-style tech radar from your software catalog. Entities are plotted as blips on a four-quadrant, four-ring radar; hovering shows a tooltip, clicking opens a detail panel.

![radar layout](https://opensource.zalando.com/tech-radar/images/radar.png)

## Background

The plugin reads entities from a configurable Port blueprint and positions each one on the radar using two properties:

- **`ring`** — maturity: `Adopt`, `Trial`, `Assess`, or `Hold`
- **`quadrant`** — category: `AI Models & APIs`, `AI Dev Tools`, `AI Platforms & Infra`, or `Frameworks & Orchestration`

The radar dimensions, colors, and label ordering live in [`src/types.ts`](src/types.ts) — change them there if you want different rings or quadrants.

## Blueprint schema

Whatever blueprint you wire to the widget must define these properties:

| Property      | Type     | Required | Notes                                              |
| ------------- | -------- | -------- | -------------------------------------------------- |
| `ring`        | string   | yes      | One of `Adopt`, `Trial`, `Assess`, `Hold`          |
| `quadrant`    | string   | yes      | One of the four quadrants above                    |
| `description` | string   | no       | Shown in the tooltip and detail panel              |
| `url`         | string   | no       | "Learn more" link in the detail panel              |
| `moved`       | number   | no       | `2` = new, `1` = moved in, `0` = same, `-1` = out  |

Entities whose `ring` or `quadrant` don't match the allowed values are silently dropped.

## Prerequisites

- Node.js **≥ 22** (CLI requirement; build itself works on older versions)
- Port [`port-plugins` CLI](https://www.npmjs.com/package/@port-labs/port-plugins-cli): `npm i -g @port-labs/port-plugins-cli`
- Port authentication — either the unified `port` CLI (`port auth login`) or `PORT_CLIENT_ID` / `PORT_CLIENT_SECRET` env vars

## Build & upload

```bash
nvm use 22         # or any Node >= 22
npm install
npm run build      # produces dist/index.html (single self-contained file)

# Auth via the unified port CLI, then pipe token to port-plugins:
PORT_TOKEN="$(port auth token --no-bearer)" port-plugins upload \
  --file dist/index.html \
  --identifier tech-radar \
  --title "Tech Radar" \
  --description "Visualize software entities by ring and quadrant" \
  --upsert
```

`--upsert` updates the existing plugin in place. Omit `--params` on subsequent uploads to preserve the param config you set in the Plugins Manager.

## Wire it to a dashboard

1. Open the **Plugins Manager** in Port and confirm `tech-radar` is listed.
2. On any dashboard or entity page, **Add widget → Custom widget → Tech Radar**.
3. Set the **Blueprint** parameter to the identifier of the blueprint you want to render (defaults to `software` if left blank).
4. Save. The widget queries `/v1/entities/search` for that blueprint and renders the radar.

## Local development

```bash
npm run dev
```

Opens a dev server on `http://localhost:9000`. Note: outside of Port, `usePortPluginData()` will not receive a token, so the radar will show "Connecting to Port…" — you'll need to test interactively inside Port for full functionality.

## Project structure

```
src/
├── index.tsx, index.html    Entry point
├── App.tsx, App.css         Top-level UI + theme integration
├── api.ts                   Port entities-search API call
├── types.ts                 Rings, quadrants, geometry constants
├── components/
│   ├── Radar.tsx            SVG radar (wedges, rings, blips)
│   ├── Legend.tsx           Sidebar with grouped blip list
│   └── Tooltip.tsx          Hover tooltip
└── utils/radar.ts           Blip positioning (deterministic per id)
```

Built with React 19, TypeScript, and webpack. The production build inlines all JS/CSS into a single `dist/index.html` via `InlineChunkHtmlPlugin` so the plugin meets Port's single-file requirement.
