import { createServer } from "http";
import net from "net";
import { createApp } from "./app";
import { serveStatic } from "./static";

const app = createApp();

// Development: Vite dev server. Production: static files from dist/public
if (process.env.NODE_ENV === "development") {
  const server = createServer(app);
  import("./vite").then(({ setupVite }) => setupVite(app, server)).then(() => {
    findAvailablePort(parseInt(process.env.PORT || "3000")).then((port) => {
      server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
    });
  }).catch(console.error);
} else {
  serveStatic(app);
  // Local production: start server. Vercel: uses prod.ts entry (never this file)
  if (!process.env.VERCEL) {
    const server = createServer(app);
    const port = parseInt(process.env.PORT || "3000");
    server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(port, () => {
      s.close(() => resolve(true));
    });
    s.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

export default app;
