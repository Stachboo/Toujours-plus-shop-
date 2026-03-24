import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers
  app.use(helmet());

  // CORS — allow frontend origin
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
  app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
  }));

  // Stripe webhook must receive raw body for signature verification — mount BEFORE json parser
  const { stripeWebhookHandler } = await import("../stripeWebhook");
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Rate limiting on auth and payment endpoints
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: "Too many requests" });
  app.use("/api/auth", authLimiter);
  app.use("/api/stripe", authLimiter);

  // Auth routes (Google OAuth callback, etc.)
  registerAuthRoutes(app);

  // Health check
  app.get("/api/health", (_, res) => res.json({ ok: true }));

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
