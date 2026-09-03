/// <reference types="vite/client" />
/// <reference types="@cloudflare/workers-types" />

declare module "*dist/server/index.js" {
  const handler: {
    fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Response | Promise<Response>;
  };
  export default handler;
}
