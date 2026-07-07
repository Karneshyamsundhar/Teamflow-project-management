import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/routes/api";
import { LocalDb } from "./server/db/localDb.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Try to pre-seed/verify database connection on startup
  try {
    await LocalDb.ensureSeeded();
    console.log("Database connection verified and pre-seeded successfully.");
  } catch (err) {
    console.warn("Database pre-seeding skipped during startup:", err);
  }

  // Body parsing middleware
  app.use(express.json());

  // API Router registration
  app.use("/api", apiRouter);

  // API health status
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "TeamFlow Server is healthy and running." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
