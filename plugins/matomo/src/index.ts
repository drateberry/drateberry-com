/**
 * Matomo Analytics plugin for EmDash CMS
 *
 * Injects the Matomo JavaScript tracker into every public page via the
 * `page:fragments` hook. Injecting scripts is a native-only capability, so
 * this is a native-format plugin and must be registered in `plugins: []`
 * (not `sandboxed: []`).
 *
 * Configure it from the admin plugin settings form or with options:
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import { matomoPlugin } from "@drateberry/emdash-plugin-matomo";
 *
 * emdash({
 *   plugins: [matomoPlugin({ trackerUrl: "https://analytics.example.com/", siteId: 1 })],
 * });
 * ```
 */

import type { PluginDescriptor, ResolvedPlugin } from "emdash";
import { definePlugin } from "emdash";

import { loadSettings, resolveTracker, SETTINGS_SCHEMA, type MatomoOptions } from "./settings.js";
import { buildFragments } from "./tracker.js";

export type { MatomoOptions } from "./settings.js";

const PLUGIN_ID = "matomo";
const VERSION = "0.2.0";

// ─── Plugin Descriptor (for astro.config.mjs) ────────────────────

export function matomoPlugin(options: MatomoOptions = {}): PluginDescriptor<MatomoOptions> {
	return {
		id: PLUGIN_ID,
		version: VERSION,
		format: "native",
		entrypoint: "@drateberry/emdash-plugin-matomo",
		options,
		capabilities: ["hooks.page-fragments:register"],
		settingsSchema: SETTINGS_SCHEMA,
	};
}

// ─── Plugin Implementation ───────────────────────────────────────

export function createPlugin(options: MatomoOptions = {}): ResolvedPlugin {
	return definePlugin({
		id: PLUGIN_ID,
		version: VERSION,
		capabilities: ["hooks.page-fragments:register"],

		hooks: {
			"page:fragments": {
				handler: async (event, ctx) => {
					// Never track the admin UI.
					if (event.page.path.startsWith("/_emdash")) return null;

					const settings = await loadSettings(ctx.settings, options);
					// Stay quiet until the plugin has been configured.
					if (!settings.enabled || (!settings.trackerUrl && !settings.siteId)) return null;

					const { tracker, errors } = resolveTracker(settings);
					if (errors) {
						ctx.log.warn(`Matomo tracking skipped: ${errors.join(" ")}`);
						return null;
					}

					return buildFragments(tracker);
				},
			},
		},

		admin: {
			settingsSchema: SETTINGS_SCHEMA,
		},
	});
}
