import type { APIRoute } from "astro";
import { hasPermission } from "@emdash-cms/auth";
import { sql } from "kysely";

export const prerender = false;

/**
 * Backdate (or forward-date) a post's publishedAt timestamp.
 *
 * Writes directly to the ec_<type> table because the EmDash public content
 * update API does not accept publishedAt in its request schema.
 *
 * Auth: requires an authenticated session with `content:edit_any`
 * (Editor role or higher). CSRF: requires same-origin request.
 */
export const POST: APIRoute = async ({ request, locals, url }) => {
	const { user, emdash } = locals;

	if (!hasPermission(user, "content:edit_any")) {
		return jsonError(user ? 403 : 401, user ? "forbidden" : "unauthorized");
	}

	const origin = request.headers.get("origin");
	if (origin && origin !== url.origin) {
		return jsonError(403, "cross_origin_blocked");
	}

	if (!emdash?.db) {
		return jsonError(500, "database_unavailable");
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError(400, "invalid_json");
	}

	const parsed = parseBody(body);
	if ("error" in parsed) {
		return jsonError(400, parsed.error);
	}
	const { type, id, publishedAt } = parsed;

	const tableName = `ec_${type}`;
	const now = new Date().toISOString();

	try {
		const result = await sql`
			UPDATE ${sql.raw(tableName)}
			SET
				published_at = ${publishedAt},
				updated_at = ${now},
				version = version + 1
			WHERE id = ${id}
		`.execute(emdash.db);

		const updated = Number(result.numAffectedRows ?? 0);
		if (updated === 0) {
			return jsonError(404, "post_not_found");
		}

		return new Response(JSON.stringify({ ok: true, id, publishedAt }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return jsonError(500, `update_failed: ${message}`);
	}
};

type ParsedBody =
	| { type: string; id: string; publishedAt: string }
	| { error: string };

function parseBody(body: unknown): ParsedBody {
	if (!body || typeof body !== "object") return { error: "invalid_body" };
	const obj = body as Record<string, unknown>;

	const type = obj.type;
	const id = obj.id;
	const publishedAt = obj.publishedAt;

	if (typeof type !== "string" || !/^[a-z0-9_]+$/.test(type)) {
		return { error: "invalid_type" };
	}
	if (typeof id !== "string" || id.length === 0) {
		return { error: "invalid_id" };
	}
	if (publishedAt !== null && typeof publishedAt !== "string") {
		return { error: "invalid_publishedAt" };
	}
	if (typeof publishedAt === "string" && Number.isNaN(Date.parse(publishedAt))) {
		return { error: "invalid_publishedAt_format" };
	}

	return { type, id, publishedAt: publishedAt as string };
}

function jsonError(status: number, code: string) {
	return new Response(JSON.stringify({ ok: false, error: code }), {
		status,
		headers: { "content-type": "application/json" },
	});
}
