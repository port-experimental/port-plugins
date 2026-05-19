# My Favorites

Personal quick-access bookmarks for [Port](https://app.port.io) pages, self-service actions, and catalog entities. Favorites are stored on the signed-in user’s Port entity, sync across browsers, and open in-place via the portal (links use `document.referrer` for the correct region).

Designed for **dashboard** placement (home page or any dashboard). Requires a logged-in Port user with a matching `_user` catalog entity.

## Features

- Tabs for **Pages**, **Actions**, and **Entities** with live counts (plugin title/icon come from Port’s widget chrome, not inside the iframe)
- Overflow menu to clear the current tab or all favorites
- Favorited rows with star icon, drag handles for reorder, and remove
- **Add** picker per tab with search:
  - Pages — filter by title, ID, or page type
  - Actions — filter by title, ID, or description (self-service actions only)
  - Entities — blueprint selector, then entities in that blueprint (title or ID)
- Click a row to navigate in Port (`OPEN_URL` via `@port-labs/plugins-sdk`)

## Prerequisites

### Access

- Port user signed in with an email present in `PLUGIN_DATA.user`
- Widget token able to read pages/actions/blueprints/entities and **patch** the current user entity

### Blueprints & properties

Add an **object** property on the User blueprint (`_user` by default) to hold favorites JSON:

| Blueprint | Property | Type | Required | Purpose |
|-----------|----------|------|----------|---------|
| `_user` | `myFavorites` | `object` | No | Per-user `{ pages, actions, entities }` arrays (see shape below) |

Example property definition (Port Builder or API):

```json
{
  "myFavorites": {
    "title": "My Favorites",
    "type": "object"
  }
}
```

Stored shape:

```json
{
  "pages": [{ "identifier": "services", "title": "Services", "pageType": "blueprint-entities" }],
  "actions": [{ "identifier": "deploy_service", "title": "Deploy service" }],
  "entities": [{ "identifier": "payments-api", "title": "Payments API", "blueprint": "service" }]
}
```

### User entity

The widget resolves the current user’s entity on the configured user blueprint, typically by **entity identifier = user email**. If no entity exists, register the user via your org’s “Register your user” self-service action.

**Node.js:** `>=20` (see `package.json` `engines`).

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `favoritesProperty` | `string` | No | `myFavorites` | Object property on the user entity used for persistence |
| `userBlueprint` | `blueprint` | No | `_user` | Blueprint that stores Port users |

## Local development

```bash
cd my-favorites
npm install
npm run dev
```

Open `http://localhost:9000` (webpack `devServer.port: 9000` — required for Port **Local development** iframe mode). Outside Port’s iframe, `DEV_MOCK` supplies token, catalog lists, and sample favorites.

| File | Purpose |
|------|---------|
| `src/hooks/usePostMessageData.ts` | Host bridge + `DEV_MOCK` gate |
| `src/dev/mockData.ts` | Pages, actions, blueprints, entities, favorites fixtures |

Enable Port’s **Local development** toggle on the custom widget to test real `postMessage` and API calls.

## Setup

### Catalog

1. Add the `myFavorites` object property to `_user` (or your chosen user blueprint).
2. Ensure users have a `_user` entity (identifier usually matches email).

### Build

```bash
npm install
npm run build
```

Artifact: `dist/index.html`

### Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier my-favorites \
  --title "My Favorites" \
  --params "$(cat upload-params.json)" \
  --upsert
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for auth and region flags.

### Add in Port

1. Builder → Plugins → confirm **my-favorites** is listed.
2. On a dashboard (e.g. home), add a **Custom widget** → **My Favorites**.
3. Set **User blueprint** to `_user` and **Favorites property** to `myFavorites` unless you use custom names.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| “No `_user` entity was found” | User not registered in catalog | Run “Register your user” SSA or create entity with identifier = email |
| Save fails with property error | `myFavorites` missing on blueprint | Add object property per Prerequisites |
| Empty page/action lists | API permissions or beta Pages API | Confirm token scopes; check browser console for `Port API` errors |
| Links open wrong region | Tested outside Port iframe | Validate inside Port; referrer sets portal origin |
| Local dev blank in Port | Wrong dev server port | Use port **9000** (`npm run dev`); Port Local development expects `http://localhost:9000` |
| Theme mismatch in Port | `applyThemeCss()` not applied | Widget calls SDK theme on host path; surfaces use Port tokens in `App.css` `:root` |
