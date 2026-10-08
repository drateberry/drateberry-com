import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { matomoPlugin } from "@drateberry/emdash-plugin-matomo";
import { socialSharePlugin } from "@drateberry/emdash-plugin-social-share";
import { d1, r2, sandbox } from "@emdash-cms/cloudflare";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import webhookNotifier from "@emdash-cms/plugin-webhook-notifier";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			// matomoPlugin is native (injects page scripts), so it must stay in plugins, not sandboxed
			plugins: [formsPlugin(), socialSharePlugin(), matomoPlugin()],
			sandboxed: [webhookNotifier],
			sandboxRunner: sandbox(),
			marketplace: "https://marketplace.emdashcms.com",
		}),
	],
	devToolbar: { enabled: false },
});
