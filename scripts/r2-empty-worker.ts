interface R2CleanupEnv {
  BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: R2CleanupEnv): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("ok");
    }
    if (request.method !== "POST" || url.pathname !== "/empty") {
      return new Response("Not Found", { status: 404 });
    }

    let cursor: string | undefined;
    let deleted = 0;
    do {
      const page = await env.BUCKET.list({ limit: 1000, cursor });
      const keys = page.objects.map((object) => object.key);
      if (keys.length > 0) {
        await env.BUCKET.delete(keys);
        deleted += keys.length;
      }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);

    return Response.json({ deleted });
  },
} satisfies ExportedHandler<R2CleanupEnv>;
