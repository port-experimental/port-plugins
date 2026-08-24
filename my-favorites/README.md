# My Favorites

Bookmark and quick-access your most-used Port Pages, Self service actions/workflows, and Entities from a single [Port](https://app.getport.io) dashboard widget. Each user's favorites are persisted on their own `_user` entity, so bookmarks survive across browsers and devices.

<img width="900" height="540" alt="My Favorites widget showing Pages, Actions, and Entities tabs with drag-to-reorder items" src="https://github.com/port-experimental/port-plugins/blob/main/my-favorites/assets/preview.png" />

## Features

- Three tabs — **Pages**, **Self service**, **Entities** — each with an item count badge
- Click any item row to navigate to it in Port (or open the action/workflow dialog for Self service)
- **Drag-to-reorder** items within a tab and **drag-to-reorder** tabs themselves; order persists per user
- **Copy link** on row hover (with copied confirmation); **Remove** via star icon
- **Auto-sync on load** — reconciles favorites against Port (drops deleted pages/actions/entities) and saves if anything changed
- **Add** centered modal per tab with search across titles, identifiers, and descriptions
  - Entities tab: entities grouped by blueprint in one searchable list
- **Setup screen** when the required `favorites` property is missing on `_user` (admin users see setup instructions; others are prompted to contact an admin)
- Optional **`favorites_identifiers`** mirror for catalog/widget filtering (see Prerequisites)
- Favorites **persist per user** via the `_user` blueprint's `favorites` property
- Follows Port dark/light theme via `applyThemeCss()`

## Prerequisites

### Catalog

#### Required: `favorites` property on `_user`

The plugin stores each user's favorites as a JSON object in a custom property on the built-in `_user` blueprint. **This property is required** for the plugin to work.

| Property identifier | Type   | Required |
|---------------------|--------|----------|
| `favorites`         | object | **Yes**  |

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

#### Optional: `favorites_identifiers` property on `_user`

If you want to **filter Port widgets by a user's favorite entities**, add an optional array property. The plugin detects this field automatically and keeps it in sync whenever favorites are saved.

| Property identifier       | Type           | Required |
|---------------------------|----------------|----------|
| `favorites_identifiers`   | array (string) | No       |

**Purpose:** A denormalized list of favorited **entity identifiers** (not blueprints). Use it in catalog filters — for example, show entity tables or widgets scoped to entities whose `identifier` appears in the current user's `favorites_identifiers`.

**Behavior:**
- The plugin **never reads** this field on load — `favorites` remains the source of truth.
- On every save (add/remove entity, refresh reconcile, reorder), the plugin writes `favorites_identifiers` as the list of `identifier` values from `favorites.entities`.
- If the property is not defined on the `_user` blueprint schema, the plugin skips it entirely.

**Port API — PATCH to add the optional property:**

```bash
curl -X PATCH "https://api.getport.io/v1/blueprints/_user" \
  -H "Authorization: Bearer $PORT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": {
      "properties": {
        "favorites_identifiers": {
          "type": "array",
          "title": "Favorite entity identifiers",
          "description": "Entity identifiers bookmarked by this user (synced by My Favorites plugin)",
          "items": { "type": "string" }
        }
      }
    }
  }'
```

**Example filter use case:** On an entity page or widget, add a filter rule such as **Identifier** → **is one of** → `{user}.favorites_identifiers` (exact filter syntax depends on your Port page configuration). This lets each user see content scoped to the entities they bookmarked in My Favorites.

> **Note:** The `_user` blueprint is managed by Port. Adding custom properties is supported but treat them as append-only — do not remove Port's built-in properties (`port_role`, `port_type`, `status`, etc.).

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

The dev server runs outside Port's iframe by default (`DEV_MOCK`). The mock user includes `roles: ["Admin"]` so you can preview the admin setup screen. Set `roles: []` in `usePostMessageData.ts` to preview the non-admin setup copy.

To preview the full favorites UI locally, ensure `MOCK_USER_BLUEPRINT` in `src/dev/mockData.ts` includes the `favorites` schema property, or enable Port's **Local development** toggle after uploading.

> **Note:** Portal navigation links (page, action, and entity URLs) built from mock identifiers do not resolve outside Port's iframe. Validate navigation by enabling **Local development** mode in Port's widget settings after uploading.

## Setup

### 1. Catalog

Add the required `favorites` property to the `_user` blueprint as described in **Prerequisites → Catalog** above. Optionally add `favorites_identifiers` if you need catalog filtering by favorite entity identifiers.

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
  --description "Bookmark and quick-access Pages, Self service, and Entities." \
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
├── assets/
│   └── preview.png              # README screenshot
├── dist/
│   └── index.html               # Committed upload artifact (rebuild after version bumps)
├── src/
│   ├── api/
│   │   ├── actions.ts           # Self-service actions
│   │   ├── blueprints.ts        # Blueprint list + _user schema fetch
│   │   ├── entities.ts          # Entity search / fetch by blueprint
│   │   ├── pages.ts             # Port pages
│   │   ├── user.ts              # GET/PATCH _user entity properties
│   │   └── workflows.ts         # Self-service workflow triggers
│   ├── components/
│   │   ├── tab-content/
│   │   │   ├── DraggableFavoritesList.tsx
│   │   │   └── FavoriteControls.tsx   # Search + “+ Favorite” button
│   │   ├── ActionTooltip.tsx
│   │   ├── AddModal.tsx           # Centered add-favorites modal
│   │   ├── BlueprintLabel.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBanner.tsx
│   │   ├── FavoriteItem.tsx
│   │   ├── FavoriteItemText.tsx
│   │   ├── LoadingState.tsx
│   │   ├── MissingFavoritesProperty.tsx
│   │   ├── SearchNoResults.tsx
│   │   ├── TabContent.tsx
│   │   └── TabTypeIcon.tsx
│   ├── dev/
│   │   └── mockData.ts            # Local mock favorites, _user blueprint, entities
│   ├── hooks/
│   │   ├── useFavoriteData.ts     # Queries, save mutation, load reconcile
│   │   └── usePostMessageData.ts  # SDK bridge, theme, DEV_MOCK
│   ├── utils/
│   │   ├── config.ts
│   │   ├── copyText.ts            # iframe-safe clipboard copy
│   │   ├── entitySearch.ts        # Entity modal search helpers
│   │   ├── favoritesIdentifiers.ts
│   │   ├── portalUrl.ts           # Page / entity / self-service URLs
│   │   ├── portUser.ts            # Admin detection via user.roles
│   │   └── reconcileFavorites.ts  # Refresh stale favorites against Port
│   ├── App.tsx
│   ├── App.css
│   ├── global.d.ts
│   ├── index.html
│   ├── index.tsx
│   └── types.ts
├── upload-params.json
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Setup required" screen | `favorites` property missing on `_user` blueprint schema | Admins: follow **Prerequisites → Catalog** (link in widget). Others: ask a Port admin to add the property |
| "User profile not found" | No `_user` entity for your email | Ensure your Port account has a matching `_user` entity |
| Favorites not persisting | `PATCH /v1/blueprints/_user/entities/{id}` fails | Check Port token permissions; ensure the user has write access to their own `_user` entity |
| `favorites_identifiers` stays empty | Optional property not on `_user` blueprint schema, or save never ran after adding it | Add `favorites_identifiers` per Prerequisites above, then add/remove an entity favorite to trigger a save |
| Copy link does nothing | Clipboard blocked in iframe | The plugin uses an iframe-safe copy path; if it still fails, copy the URL from the opened page manually |
| Navigation links don't open | Running outside Port iframe | Use Port's **Local development** toggle or upload and test in a dashboard |
| Add modal shows no items | Pages / actions / entities API returned empty | Verify your Port organization has catalog content and the user has read access |
| Theme looks wrong | `applyThemeCss()` not applied | Ensure the widget is loaded inside Port's iframe; CSS fallbacks cover local dev |
