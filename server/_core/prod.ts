/**
 * Production entry point for Vercel/serverless.
 * Never imports Vite - keeps the bundle small and under Vercel's 250MB limit.
 */
import { createServer } from "http";
import { createApp } from "./app";
import { serveStatic } from "./static";

const app = createApp();
serveStatic(app);

// Local production: start server. Vercel: uses exported app as serverless handler
if (!process.env.VERCEL) {
  const server = createServer(app);
  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

export default app;
