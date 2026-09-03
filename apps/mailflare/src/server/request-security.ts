export function isSameOriginRequest(request: Request): boolean {
	const origin = request.headers.get("origin");
	if (origin) return origin === new URL(request.url).origin;
	const referer = request.headers.get("referer");
	if (referer) return new URL(referer).origin === new URL(request.url).origin;
	return true;
}

export function rejectCrossOriginMutation(request: Request): Response | undefined {
	if (request.method !== "GET" && !isSameOriginRequest(request)) {
		return Response.json({ error: "Cross-origin request blocked." }, { status: 403 });
	}
	return undefined;
}
