# @drateberry/emdash-plugin-matomo

Matomo analytics for EmDash. Adds the Matomo JavaScript tracker to every public page (admin routes under `/_emdash` are never tracked).

This is a **native** plugin: injecting scripts into pages uses the `page:fragments` hook, which EmDash only allows for trusted, in-process plugins with the `hooks.page-fragments:register` capability. Requires emdash 1.2 or later. Register it in `plugins: []`, not `sandboxed: []`.

## Setup

```js
// astro.config.mjs
import { matomoPlugin } from "@drateberry/emdash-plugin-matomo";

emdash({
	plugins: [matomoPlugin()],
});
```

Then open **Plugins** in the admin, open Matomo's settings, and enter your Matomo URL and site ID.

Your theme layout must render `<EmDashHead page={...} />` (and `<EmDashBodyEnd page={...} />` for the no-JavaScript pixel).

## Options

All options are optional defaults. Values saved in the admin take precedence; clearing a text field in the admin falls back to the option.

| Option                 | Default                 | Matomo command          |
| ---------------------- | ----------------------- | ----------------------- |
| `trackerUrl`           | —                       | `setTrackerUrl`         |
| `siteId`               | —                       | `setSiteId`             |
| `scriptUrl`            | `<trackerUrl>matomo.js` | —                       |
| `enabled`              | `true`                  | —                       |
| `disableCookies`       | `false`                 | `disableCookies`        |
| `respectDoNotTrack`    | `false`                 | `setDoNotTrack`         |
| `enableHeartBeatTimer` | `false`                 | `enableHeartBeatTimer`  |
| `noscriptFallback`     | `false`                 | `<noscript>` image pixel |

For Matomo Cloud, set `scriptUrl` to `https://cdn.matomo.cloud/<instance>.matomo.cloud/matomo.js`.
