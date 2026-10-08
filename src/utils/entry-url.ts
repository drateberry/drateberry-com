/**
 * Entry ⇄ URL helpers driven by each collection's admin-configured urlPattern.
 *
 * These replace `getEntryUrl` and `contentRoutes` from the emdash fork we ran
 * on 0.6.0 — upstream emdash ships `resolveEmDashPath` (URL → entry) but not
 * the reverse lookup or the catch-all route. Collections without a urlPattern
 * fall back to `/<collection>/{slug}`, matching the admin's preview links and
 * emdash's sitemap.
 */
import { getCollectionInfo, getEmDashEntry, resolveEmDashPath } from "emdash";
import type { ResolvePathResult } from "emdash";

function defaultPattern(collection: string): string {
	return `/${collection}/{slug}`;
}

/**
 * Build the public path for an entry, e.g. getEntryUrl("posts", "hello")
 * → "/blog/hello" when posts.urlPattern is "/blog/{slug}".
 * Returns null if the collection doesn't exist.
 */
export async function getEntryUrl(collection: string, slug: string): Promise<string | null> {
	const info = await getCollectionInfo(collection);
	if (!info) return null;
	const pattern = info.urlPattern || defaultPattern(collection);
	return pattern.replace("{slug}", slug).replace("{id}", slug);
}

/**
 * Resolve a request path to an entry. Tries collections with a urlPattern
 * first (via emdash), then the `/<collection>/<slug>` default for
 * collections that don't set one.
 */
export async function resolveEntryPath(path: string): Promise<ResolvePathResult | null> {
	const resolved = await resolveEmDashPath(path);
	if (resolved) return resolved;

	const [collection, slug, ...extra] = path.split("/").filter(Boolean);
	if (!collection || !slug || extra.length > 0) return null;

	const info = await getCollectionInfo(collection);
	if (!info || info.urlPattern) return null;

	const { entry } = await getEmDashEntry(collection, decodeURIComponent(slug));
	return entry ? { entry, collection, params: { slug } } : null;
}
