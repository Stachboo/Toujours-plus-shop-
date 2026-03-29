import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { ENV } from "./env";

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

  // Trust reverse proxy (Render, Railway) for correct req.protocol and x-forwarded-proto
  app.set("trust proxy", 1);

  // Security headers (allow popups for Google OAuth flow)
  app.use(helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  }));

  // Compress responses
  app.use(compression());

  // CORS — allow frontend origin (strip trailing slash for strict comparison)
  const FRONTEND_URL = ENV.frontendUrl.replace(/\/+$/, "");
  app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
  }));

  // Stripe webhook must receive raw body for signature verification — mount BEFORE json parser
  const { stripeWebhookHandler } = await import("../stripeWebhook");
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

  // Configure body parser
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // Rate limiting on auth and payment endpoints
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: "Too many requests" });
  app.use("/api/auth", authLimiter);
  app.use("/api/stripe", authLimiter);
  app.use("/api/trpc/auth.login", authLimiter);
  app.use("/api/trpc/auth.register", authLimiter);
  app.use("/api/trpc/stripe.createPaymentIntent", authLimiter);

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

  const preferredPort = ENV.port;
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("[Server] Shutting down gracefully...");
    server.close(() => {
      console.log("[Server] HTTP server closed");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch(console.error);
