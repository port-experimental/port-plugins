# Favorites

Bookmark your most-used Port Pages, self-service actions, and entities, and access them instantly from the widget on any dashboard where it's added. Favorites are persisted on your _user entity, so they follow you across browsers and devices.

## Preview image

<img width="1004" height="234" alt="My Favorites widget showing Pages, Actions, and Entities tabs with drag-to-reorder items" src="https://github.com/port-experimental/port-plugins/blob/main/favorites/assets/preview.png" />

## Features

- Three tabs — **Pages**, **Self service**, **Entities** — each with an item count badge
- Click any item row to navigate to it in Port (or open the action/workflow dialog for Self service)
- **Drag-to-reorder** items within a tab and **drag-to-reorder** tabs themselves; order persists per user
- **Copy link** on row hover (with copied confirmation); **Remove** via star icon
- **Auto-sync on load** — reconciles favorites against Port (drops deleted pages/actions/entities) and saves if anything changed
- **Add** centered modal per tab with search across titles, identifiers, and descriptions
  - Entities tab: entities grouped by blueprint in one searchable list
- **Setup screen** when the required `favorites` property is missing on `_user` (admin users see setup instructions; others are prompted to contact an admin)
- Favorites **persist per user** via the `_user` blueprint's `favorites` property
- Optional: favorites_identifiers field on the _user entity, kept in sync with your favorites, so you can filter a dashboard page to show only favorite entities (see Prerequisites).
- Follows Port dark/light theme`

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
          "description": "Bookmarked pages, actions, and entities for user"
        }
      }
    }
  }'
```

#### Optional: `favorites_identifiers` property on `_user`

If you want to **filter a dashboard page by a user's favorite entities**, add an optional array property. The plugin detects this field automatically and keeps it in sync whenever favorites are saved.

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
          "title": "Favorites identifiers",
          "description": "Entity identifiers bookmarked by this user (synced by Favorites plugin)",
          "items": { "type": "string" }
        }
      }
    }
  }'
```

Example filter use case: To scope entities to a user's favorites, set an initial filter rule on the widget, such as Identifier → is in → User → favorites_identifiers. Since filters are applied at the widget level, filtering an entire dashboard page requires adding this filter to each widget on that page.

> **Note:** The `_user` blueprint is managed by Port. Adding custom properties is supported but treat them as append-only — do not remove Port's built-in properties (`port_role`, `port_type`, `status`, etc.).

### Access

The authenticated user must have **read** access to pages and actions in their Port organization, and **write** access to their own `_user` entity (to persist favorites).

## Local development

```bash
cd favorites
npm install
npm run dev   # http://localhost:9000
```

The dev server runs outside Port's iframe by default (`DEV_MOCK`). The mock user includes `roles: [{ name: "Admin", orgId: "..." }]` so you can preview the admin setup screen. Set `roles: []` in `usePostMessageData.ts` to preview the non-admin setup copy.

To preview the full favorites UI locally, ensure `MOCK_USER_BLUEPRINT` in `src/dev/mockData.ts` includes the `favorites` schema property, or enable Port's **Local development** toggle after uploading.

> **Note:** Portal navigation links (page, action, and entity URLs) built from mock identifiers do not resolve outside Port's iframe. Validate navigation by enabling **Local development** mode in Port's widget settings after uploading.

## Setup

### 1. Catalog

Add the required `favorites` property to the `_user` blueprint as described in **Prerequisites → Catalog** above. Optionally add `favorites_identifiers` if you need catalog filtering by favorite entity identifiers.

> **Note:** If you do not need to modify the plugin, install it from Port and skip **Build** and **Upload** (steps 2 and 3) below. Go to **Plugins** → **Plugin library**, search for **Favorites**, and click **Install**. You can manage it under **Plugin manager**, then continue to step 4.

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
  --identifier favorites-port-plugin \
  --title "Favorites" \
  --params "$(cat upload-params.json)" \
  --description "Bookmark and quick-access Pages, Self service, and Entities." \
  --upsert
```

> The identifier `favorites-port-plugin` satisfies the Port identifier regex `^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$`.

### 4. Add in Port

1. Go to your Port dashboard → **Add widget** → **Custom widget**.
2. Select the **Favorites** plugin.
3. No parameters are required — save and reload.

## Project structure

```
favorites/
├── assets/
│   └── preview.png
├── dist/
│   └── index.html               # Committed upload artifact (rebuild after version bumps)
├── src/
│   ├── api/                     # Port API clients
│   │   ├── actions.ts
│   │   ├── blueprints.ts
│   │   ├── entities.ts
│   │   ├── pages.ts
│   │   ├── user.ts
│   │   └── workflows.ts
│   ├── components/
│   │   ├── add-modal/
│   │   │   └── AddModal.tsx     # Centered picker modal
│   │   ├── favorites/           # List, rows, tab panel
│   │   │   ├── TabContent.tsx
│   │   │   ├── FavoriteItem.tsx
│   │   │   ├── FavoriteItemText.tsx
│   │   │   ├── FavoriteControls.tsx
│   │   │   └── DraggableFavoritesList.tsx
│   │   ├── setup/
│   │   │   └── MissingFavoritesProperty.tsx
│   │   └── shared/              # Reusable UI primitives
│   │       ├── ActionTooltip.tsx
│   │       ├── BlueprintLabel.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBanner.tsx
│   │       ├── LoadingState.tsx
│   │       ├── SearchNoResults.tsx
│   │       └── TabTypeIcon.tsx
│   ├── dev/
│   │   └── mockData.ts
│   ├── hooks/
│   │   ├── catalog/             # Add-modal catalog queries
│   │   │   ├── constants.ts
│   │   │   ├── useActionsCatalogQuery.ts
│   │   │   ├── useBlueprintsCatalogQuery.ts
│   │   │   ├── useEntityCatalogQueries.ts
│   │   │   ├── usePagesCatalogQuery.ts
│   │   │   └── useWorkflowsCatalogQuery.ts
│   │   ├── useFavoriteData.ts
│   │   └── usePostMessageData.ts
│   ├── utils/
│   │   ├── favorites/           # Favorites domain logic
│   │   │   ├── favoritesIdentifiers.ts
│   │   │   └── reconcileFavorites.ts
│   │   ├── copyText.ts
│   │   ├── config.ts
│   │   ├── entitySearch.ts
│   │   ├── portalUrl.ts
│   │   └── portUser.ts
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
