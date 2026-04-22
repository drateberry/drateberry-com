import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { socialSharePlugin } from "@drateberry/emdash-plugin-social-share";
import { d1, r2, sandbox } from "@emdash-cms/cloudflare";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import { webhookNotifierPlugin } from "@emdash-cms/plugin-webhook-notifier";
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
			plugins: [formsPlugin(), socialSharePlugin()],
			sandboxed: [webhookNotifierPlugin()],
			sandboxRunner: sandbox(),
			marketplace: "https://marketplace.emdashcms.com",
			contentRoutes: {
				entrypoint: "./src/templates/drateberry-com/layouts/EmDashEntry.astro",
			},
		}),
	],
	devToolbar: { enabled: false },
	vite: {
		optimizeDeps: {
			exclude: [
				"@tiptap/extension-collaboration",
				"@tiptap/y-tiptap",
			],
		},
		plugins: [
			{
				name: "stub-tiptap-optional-deps",
				enforce: "pre",
				resolveId(id) {
					if (id === "@tiptap/extension-collaboration") {
						return "\0stub-tiptap-collaboration";
					}
					if (id === "@tiptap/y-tiptap") {
						return "\0stub-tiptap-y-tiptap";
					}
				},
				load(id) {
					if (id === "\0stub-tiptap-collaboration") {
						return "export const isChangeOrigin = () => false;";
					}
					if (id === "\0stub-tiptap-y-tiptap") {
						return [
							"export const absolutePositionToRelativePosition = () => null;",
							"export const relativePositionToAbsolutePosition = () => null;",
							"export const ySyncPluginKey = Symbol('ySyncPluginKey-stub');",
						].join("\n");
					}
				},
			},
		],
	},
});
