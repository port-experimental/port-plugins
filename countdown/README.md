# Countdown

Live countdown to a target date and time — custom plugin for [Port](https://app.port.io). Works on dashboard and entity pages.

## Preview image

<img width="751" height="282" alt="Countdown plugin showing Migration deadline with days, hours, minutes, and seconds" src="https://github.com/port-experimental/port-plugins/blob/main/countdown/assets/preview.png" />

## Features

- Live days / hours / minutes / seconds display, updating every second
- Optional title shown above the countdown
- Formatted target date and time in the viewer's locale
- Clear setup and invalid-date messages
- "Time's up" state when the target has passed
- Light/dark theme support via Port SDK

## Prerequisites

### Access

- Port account with permission to add custom plugins
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Blueprints & properties

No catalog setup required. The widget is driven entirely by plugin parameters.

## Plugin parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `title` | string | no | — | Optional heading shown above the countdown |
| `targetDateTime` | string (ISO 8601) | yes | — | Target moment to count down to — e.g. `2026-12-31T23:59:59Z` |

### Date and time format

**Example:** `2026-12-31T23:59:59Z`

`targetDateTime` must be an **ISO 8601** date-time string: `YYYY-MM-DD` + `T` + `HH:mm:ss`, with optional timezone.

| Example | Meaning |
|---------|---------|
| `2026-12-31T23:59:59Z` | 31 Dec 2026, 23:59 UTC (**recommended**) |
| `2026-06-15T14:30:00` | 15 Jun 2026, 14:30 in the viewer's local timezone |
| `2026-06-15T14:30:00+03:00` | 15 Jun 2026, 14:30 Israel time (UTC+3) |

In Port, the parameter appears as **Target datetime (e.g. 2026-12-31T23:59:59Z)** when configuring the widget.

## Local development

```bash
cd countdown
npm install
npm run dev   # http://localhost:9000
```

Mock parameters are defined in `src/hooks/usePostMessageData.ts` for standalone dev.

## Setup

### Build

```bash
npm install
npm run build   # output: dist/index.html
git add dist/index.html   # commit the upload artifact (tracked in repo)
```

### Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier countdown \
  --title "Countdown" \
  --params "$(cat upload-params.json)" \
  --description "Live countdown to a target date and time" \
  --upsert
```

`countdown` satisfies Port's plugin identifier regex:

```javascript
const PLUGIN_IDENTIFIER_REGEX = /^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$/;
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for CLI install and credential setup.

### Add in Port

1. Open a dashboard or entity page → **Add widget** → **Custom widget**
2. Select **Countdown**
3. Set **Target datetime (e.g. 2026-12-31T23:59:59Z)** (required) and optionally **Title**
4. Save

## Project structure

```
countdown/
  src/
    components/
      CountdownDisplay.tsx
    hooks/
      useCountdown.ts
      usePostMessageData.ts
    utils/
      config.ts
      parseDateTime.ts
    types.ts
    App.tsx
    App.css
    index.tsx
  upload-params.json
  webpack.config.js
  tsconfig.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank white iframe (no text) | React hooks called after early returns | Call all hooks before early returns |
| Setup prompt | Missing `targetDateTime` | Set **Target datetime (e.g. 2026-12-31T23:59:59Z)** |
| Invalid date message | Unparseable datetime string | Use e.g. `2026-12-31T23:59:59Z` |
| Waiting for Port context | Opened outside Port | Embed via Port **Local development** or deploy |
