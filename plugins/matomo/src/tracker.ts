import type { PageFragmentContribution } from "emdash";

import type { MatomoTracker } from "./settings.js";

/**
 * Build the `_paq` command queue for the tracker. Config commands go first so
 * they apply before the page view is recorded.
 */
export function buildCommands(tracker: MatomoTracker): unknown[][] {
	const commands: unknown[][] = [];
	if (tracker.disableCookies) commands.push(["disableCookies"]);
	if (tracker.respectDoNotTrack) commands.push(["setDoNotTrack", true]);
	commands.push(["setTrackerUrl", tracker.endpoint]);
	commands.push(["setSiteId", tracker.siteId]);
	commands.push(["trackPageView"]);
	commands.push(["enableLinkTracking"]);
	if (tracker.enableHeartBeatTimer) commands.push(["enableHeartBeatTimer"]);
	return commands;
}

/** The inline bootstrap script. Values are JSON-encoded, never concatenated raw. */
export function buildInitScript(tracker: MatomoTracker): string {
	return [
		"var _paq = window._paq = window._paq || [];",
		...buildCommands(tracker).map((command) => `_paq.push(${JSON.stringify(command)});`),
	].join("\n");
}

/** Page fragments that load Matomo on a public page. */
export function buildFragments(tracker: MatomoTracker): PageFragmentContribution[] {
	const fragments: PageFragmentContribution[] = [
		{
			kind: "inline-script",
			placement: "head",
			code: buildInitScript(tracker),
			key: "matomo-init",
		},
		{
			kind: "external-script",
			placement: "head",
			src: tracker.scriptUrl,
			async: true,
			key: "matomo-js",
		},
	];

	if (tracker.noscriptFallback) {
		const pixel = new URL(tracker.endpoint);
		pixel.searchParams.set("idsite", tracker.siteId);
		pixel.searchParams.set("rec", "1");
		// "html" fragments are inserted verbatim, so escape the attribute value ourselves.
		fragments.push({
			kind: "html",
			placement: "body:end",
			html: `<noscript><img referrerpolicy="no-referrer-when-downgrade" src="${escapeAttr(pixel.href)}" style="border:0" alt="" /></noscript>`,
			key: "matomo-noscript",
		});
	}

	return fragments;
}

function escapeAttr(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}
