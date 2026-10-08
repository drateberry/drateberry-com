import type { SettingField, SettingsAccess } from "emdash";

/**
 * Options passed from astro.config.mjs. Every field is optional and acts as
 * a fallback — values saved in the admin settings form take precedence.
 */
export interface MatomoOptions {
	/** Base URL of the Matomo instance, e.g. "https://analytics.example.com/" */
	trackerUrl?: string;
	/** Matomo site ID (the `idsite` shown under Administration → Websites) */
	siteId?: string | number;
	/** Override for the tracker script URL. Defaults to `<trackerUrl>matomo.js` */
	scriptUrl?: string;
	/** Master switch for tracking. Defaults to true */
	enabled?: boolean;
	/** Cookieless tracking (`disableCookies`). Defaults to false */
	disableCookies?: boolean;
	/** Honour the browser's Do Not Track signal (`setDoNotTrack`). Defaults to false */
	respectDoNotTrack?: boolean;
	/** Measure time on page accurately (`enableHeartBeatTimer`). Defaults to false */
	enableHeartBeatTimer?: boolean;
	/** Add a <noscript> image pixel for visitors without JavaScript. Defaults to false */
	noscriptFallback?: boolean;
}

export interface MatomoSettings {
	trackerUrl: string;
	siteId: string;
	scriptUrl: string;
	enabled: boolean;
	disableCookies: boolean;
	respectDoNotTrack: boolean;
	enableHeartBeatTimer: boolean;
	noscriptFallback: boolean;
}

/** A validated tracker configuration, ready to render. */
export interface MatomoTracker extends MatomoSettings {
	/** Full URL of matomo.php */
	endpoint: string;
}

const STRING_KEYS = ["trackerUrl", "siteId", "scriptUrl"] as const;
const BOOLEAN_KEYS = [
	"enabled",
	"disableCookies",
	"respectDoNotTrack",
	"enableHeartBeatTimer",
	"noscriptFallback",
] as const;

const BOOLEAN_DEFAULTS: Record<(typeof BOOLEAN_KEYS)[number], boolean> = {
	enabled: true,
	disableCookies: false,
	respectDoNotTrack: false,
	enableHeartBeatTimer: false,
	noscriptFallback: false,
};

/**
 * Schema for EmDash's generated settings form. Defaults shown in the form are
 * not persisted by EmDash, so `loadSettings` applies the same fallbacks.
 */
export const SETTINGS_SCHEMA: Record<string, SettingField> = {
	enabled: {
		type: "boolean",
		label: "Enable tracking",
		default: BOOLEAN_DEFAULTS.enabled,
	},
	trackerUrl: {
		type: "url",
		label: "Matomo URL",
		description: "Base URL of your Matomo instance.",
		placeholder: "https://analytics.example.com/",
	},
	siteId: {
		type: "string",
		label: "Site ID",
		description: "Shown in Matomo under Administration → Websites → Manage.",
	},
	scriptUrl: {
		type: "url",
		label: "Tracker script URL (optional)",
		description:
			"Defaults to <Matomo URL>/matomo.js. Matomo Cloud: https://cdn.matomo.cloud/<instance>.matomo.cloud/matomo.js",
	},
	disableCookies: {
		type: "boolean",
		label: "Cookieless tracking",
		description: "Don't set Matomo cookies. Useful for avoiding a consent banner.",
		default: BOOLEAN_DEFAULTS.disableCookies,
	},
	respectDoNotTrack: {
		type: "boolean",
		label: "Respect Do Not Track",
		description: "Skip tracking for browsers that send the DNT header.",
		default: BOOLEAN_DEFAULTS.respectDoNotTrack,
	},
	enableHeartBeatTimer: {
		type: "boolean",
		label: "Accurate time on page",
		description: "Send periodic heartbeats so time spent on the last page is measured.",
		default: BOOLEAN_DEFAULTS.enableHeartBeatTimer,
	},
	noscriptFallback: {
		type: "boolean",
		label: "No-JavaScript fallback",
		description: "Add a tracking pixel for visitors with JavaScript disabled.",
		default: BOOLEAN_DEFAULTS.noscriptFallback,
	},
};

const SITE_ID_PATTERN = /^\d+$/;

/**
 * Load settings saved in the admin, falling back to the options passed in
 * astro.config.mjs, then to defaults. Uses a single list call so the
 * per-page cost is one query. An empty text field counts as unset.
 */
export async function loadSettings(
	settingsAccess: SettingsAccess,
	options: MatomoOptions,
): Promise<MatomoSettings> {
	const stored = new Map<string, unknown>();
	for (const { key, value } of await settingsAccess.list()) {
		stored.set(key, value);
	}

	const settings = {} as MatomoSettings;
	for (const key of STRING_KEYS) {
		const value = stored.get(key);
		const text = value == null ? "" : String(value).trim();
		settings[key] = text || (options[key] == null ? "" : String(options[key]).trim());
	}
	for (const key of BOOLEAN_KEYS) {
		const value = stored.get(key) ?? options[key];
		settings[key] = typeof value === "boolean" ? value : BOOLEAN_DEFAULTS[key];
	}
	return settings;
}

/**
 * Validate settings and derive the tracker endpoints. Returns a list of
 * problems instead when the configuration can't be used.
 */
export function resolveTracker(
	settings: MatomoSettings,
): { tracker: MatomoTracker; errors?: never } | { tracker?: never; errors: string[] } {
	const errors: string[] = [];

	const trackerUrl = parseHttpUrl(settings.trackerUrl);
	if (!settings.trackerUrl) {
		errors.push("Matomo URL is required.");
	} else if (!trackerUrl) {
		errors.push("Matomo URL must be a full http(s) URL, e.g. https://analytics.example.com/");
	}

	if (!settings.siteId) {
		errors.push("Site ID is required.");
	} else if (!SITE_ID_PATTERN.test(settings.siteId)) {
		errors.push("Site ID must be a whole number.");
	}

	let scriptUrl: URL | null = null;
	if (settings.scriptUrl) {
		scriptUrl = parseHttpUrl(settings.scriptUrl);
		if (!scriptUrl) errors.push("Tracker script URL must be a full http(s) URL.");
	}

	if (errors.length > 0 || !trackerUrl) return { errors };

	// Matomo expects a directory URL; make sure "matomo.php" resolves inside it.
	if (!trackerUrl.pathname.endsWith("/")) trackerUrl.pathname += "/";
	trackerUrl.search = "";
	trackerUrl.hash = "";

	return {
		tracker: {
			...settings,
			trackerUrl: trackerUrl.href,
			scriptUrl: (scriptUrl ?? new URL("matomo.js", trackerUrl)).href,
			endpoint: new URL("matomo.php", trackerUrl).href,
		},
	};
}

function parseHttpUrl(value: string): URL | null {
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:" ? url : null;
	} catch {
		return null;
	}
}
