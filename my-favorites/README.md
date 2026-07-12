# My Favorites

Bookmark and quick-access your most-used Port Pages, Actions, and Entities from a single [Port](https://app.getport.io) dashboard widget. Each user's favorites are persisted on their own `_user` entity, so bookmarks survive across browsers and devices.

<img width="900" height="540" alt="My Favorites widget showing Pages, Actions, and Entities tabs with drag-to-reorder items" src="https://github.com/port-experimental/port-plugins/blob/main/my-favorites/assets/preview.png" />

## Features

- Three tabs — **Pages**, **Actions**, **Entities** — each with an item count badge
- Click any item row to navigate to it in Port (or open the action modal for Actions)
- **Drag-to-reorder** items within a tab and **drag-to-reorder** tabs themselves; order persists per user
- **Trash** icon to remove an item (appears on row hover)
- **Refresh** button to sync with the latest Port data
- **Add** dropdown per tab with real-time search/filter by title, identifier, or description
  - Entities tab: first picks a blueprint, then lists entities within it
- Favorites **persist per user** via the `_user` blueprint's `favorites` property
- Follows Port dark/light theme via `applyThemeCss()`

## Prerequisites

### Catalog

#### Add a `favorites` property to the `_user` blueprint

The plugin stores each user's favorites as a JSON object in a custom property on the built-in `_user` blueprint.

| Property identifier | Type   | Required |
|---------------------|--------|----------|
| `favorites`         | object | No       |

**Port API — PATCH to add the property:**

```bash
curl -X PATCH "https://api.getport.io/v1/blueprints/_user" \
  -H "Authorization: Bearer $PORT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": {
      "properties": {
        "favorites": {
          "type": "object",
          "title": "My Favorites",
          "description": "Bookmarked pages, actions, and entities for this user"
        }
      }
    }
  }'
```

> **Note:** The `_user` blueprint is managed by Port. Adding a custom property is supported but treat the property as append-only — do not remove Port's built-in properties (`port_role`, `port_type`, `status`, etc.).

### Access

The authenticated user must have **read** access to pages and actions in their Port organization, and **write** access to their own `_user` entity (to persist favorites).

## Plugin parameters

This plugin requires no upload parameters. All data is fetched at runtime using the authenticated Port token from the iframe host context.

## Local development

```bash
cd my-favorites
npm install
npm run dev   # http://localhost:9000
```

The dev server opens with a `DEV_MOCK` guard that shows a "Waiting for Port context" message by default. To preview the full UI, add small mock favorites to `src/hooks/usePostMessageData.ts` or enable Port's **Local development** toggle after uploading.

> **Note:** Portal navigation links (page, action, and entity URLs) built from mock identifiers do not resolve outside Port's iframe. Validate navigation by enabling **Local development** mode in Port's widget settings after uploading.

## Setup

### 1. Catalog

Add the `favorites` property to the `_user` blueprint as described in **Prerequisites → Catalog** above.

### 2. Build

```bash
npm install
npm run build   # produces dist/index.html
```

Commit `dist/index.html` after every version bump — it is the upload artifact tracked in git.

### 3. Upload

Install the CLI once if you haven't: see [@port-labs/port-plugins-cli on npm](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier my-favorites-port-plugin \
  --title "My Favorites" \
  --params "$(cat upload-params.json)" \
  --description "Bookmark and quick-access Pages, Actions, and Entities." \
  --upsert
```

> The identifier `my-favorites-port-plugin` satisfies the Port identifier regex `^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$`.

### 4. Add in Port

1. Go to your Port dashboard → **Edit** → **Add widget** → **Custom widget**.
2. Select the **My Favorites** plugin.
3. No parameters are required — save and reload.

## Project structure

```
my-favorites/
├── src/
│   ├── api/
│   │   └── user.ts              # PATCH _user entity favorites property
│   ├── components/
│   │   ├── AddDropdown.tsx      # Search + drill-down add panel
│   │   ├── ErrorBanner.tsx      # Query error display
│   │   ├── FavoriteItem.tsx     # Single draggable row
│   │   ├── LoadingState.tsx     # Skeleton / spinner
│   │   └── TabContent.tsx       # Per-tab list + drop indicators
│   ├── hooks/
│   │   ├── useFavoriteData.ts   # TanStack Query fetches + saveMutation
│   │   └── usePostMessageData.ts # SDK bridge; applyThemeCss; data-theme stamp
│   ├── App.tsx                  # Root component — tabs, drag-reorder, refresh
│   ├── App.css                  # All styles (Port CSS variable tokens)
│   ├── index.tsx                # React root mount
│   ├── index.html               # Webpack HTML template
│   └── types.ts                 # Shared TypeScript types
├── dist/
│   └── index.html               # ✅ Committed upload artifact
├── upload-params.json           # Empty — no params required
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "User profile not found" | `_user` entity for your email does not exist or `favorites` property not added | Add the `favorites` property per Prerequisites above |
| Favorites not persisting | `PATCH /v1/blueprints/_user/entities/{id}` fails | Check Port token permissions; ensure the user has write access to their own `_user` entity |
| Navigation links don't open | Running outside Port iframe | Use Port's **Local development** toggle or upload and test in a dashboard |
| Add dropdown shows no items | Pages / Actions API returned empty | Verify your Port organization has pages/actions defined |
| Theme looks wrong | `applyThemeCss()` not applied | Ensure the widget is loaded inside Port's iframe; CSS fallbacks cover local dev |
