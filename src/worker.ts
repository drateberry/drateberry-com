import handler from "@astrojs/cloudflare/entrypoints/server";
import { createScheduledHandler } from "@emdash-cms/cloudflare/worker";
export { PluginBridge } from "@emdash-cms/cloudflare/sandbox";

// The scheduled handler runs EmDash maintenance on the Cron Trigger in
// wrangler.jsonc: scheduled publishing, plugin cron tasks (e.g. the forms
// plugin's weekly cleanup) and automatic backups. If you change the cron
// expression there, pass the same one here as `{ generalCron: "..." }`.
export default {
	...handler,
	scheduled: createScheduledHandler(),
};
