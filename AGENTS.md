This is an EmDash site -- a CMS built on Astro with a full admin UI.

## Commands

```bash
npm run dev           # Start dev server (applies pending migrations on first request)
npm run build         # Production build (also writes .emdash/migrations.json)
npx emdash types      # Regenerate TypeScript types from schema
npx emdash seed seed/seed.json --validate  # Validate seed file
npx emdash doctor     # Check scheduler wiring (its "database not found" error is expected -- this site uses D1)
```

`npx emdash dev` was removed in EmDash 1.0 -- use `npm run dev`.

The admin UI is at `http://localhost:4321/_emdash/admin`.

## Key Files

| File                     | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `astro.config.mjs`       | Astro config with `emdash()` integration, database, storage, and plugins           |
| `wrangler.jsonc`         | Cloudflare bindings (D1, R2, Worker Loader) and the every-minute Cron Trigger      |
| `src/worker.ts`          | Worker entry: Astro handler + EmDash `scheduled()` handler + `PluginBridge`        |
| `src/live.config.ts`     | EmDash loader registration (boilerplate -- don't modify)                         |
| `seed/seed.json`         | Schema definition + demo content (collections, fields, taxonomies, menus, widgets) |
| `emdash-env.d.ts`        | Generated types for collections (auto-regenerated on dev server start)             |
| `src/templates/drateberry-com/layouts/Base.astro` | Base layout with EmDash wiring (menus, search, page contributions) |
| `src/templates/drateberry-com/layouts/EmDashEntry.astro` | Renders a resolved content entry (posts, pages)           |
| `src/pages/[first]/[...rest].astro` | Catch-all that resolves URLs to entries via each collection's urlPattern |
| `src/utils/entry-url.ts` | `getEntryUrl()` / `resolveEntryPath()` -- entry ⇄ URL from the admin urlPattern   |
| `src/pages/`             | Astro pages -- all server-rendered                                                 |
| `plugins/matomo/`        | Local native plugin: Matomo analytics via `page:fragments`                         |

## Skills

Agent skills are in `.agents/skills/` (refresh with `npx --yes skills@1.7.0 add emdash-cms/skills -y`). Load them when working on specific tasks:

- **building-emdash-site** -- Querying content, rendering Portable Text, schema design, seed files, site features (menus, widgets, search, SEO, comments, bylines), deployment config. Start here.
- **creating-plugins** -- Building EmDash plugins with hooks, storage, admin UI, API routes, and Portable Text block types.
- **emdash-cli** -- CLI commands for content, schema, media, migrations, seeding, and type generation.
- **upgrading-emdash** -- Upgrading EmDash packages with `upgrade-emdash` and working through `.emdash/UPGRADE.md`.
- **wordpress-plugin-to-emdash** / **wordpress-theme-to-emdash** -- Porting WordPress plugins and themes.

## Rules

- All content pages must be server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- Image fields are objects (`{ src, alt }`), not strings. Use `<Image image={...} />` from `"emdash/ui"`.
- `Comments` and `CommentForm` come from `"emdash/ui/comments"`, not `"emdash/ui"`.
- Build links to entries with `getEntryUrl(collection, slug)` from `src/utils/entry-url.ts`, never hardcoded `/posts/...` paths -- URL patterns are set per collection in the admin.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for API calls like `getEntryTerms`).
- Always call `Astro.cache.set(cacheHint)` on pages that query content.
- Taxonomy names in queries must match the seed's `"name"` field exactly (e.g., `"category"` not `"categories"`).
- Plugins that inject scripts (`page:fragments`) are native and must go in `plugins: []`, never `sandboxed: []`.

## Secrets

- `EMDASH_ENCRYPTION_KEY` encrypts plugin settings marked `secret`. Locally it lives in `.dev.vars` (gitignored); in production set it with `npx wrangler secret put EMDASH_ENCRYPTION_KEY`. Production uses its own key -- back it up outside Cloudflare, since D1 backups don't include it.
