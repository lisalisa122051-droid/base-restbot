import express from "express";
import { startBot } from "./base.js";
import { CONFIG } from "./src/config.js";
import fs from "fs";

const app = express();

(async () => {
  const conn = await startBot();

  app.get("/", (req, res) => {
    res.send(`<h2>${CONFIG.STORE_NAME} - Bot is running</h2><p>See console for QR if not connected yet.</p>`);
  });

  app.get("/status", (req, res) => {
    res.json({ status: "ok" });
  });

  app.listen(CONFIG.PORT, () => {
    console.log(`Web server running at http://localhost:${CONFIG.PORT}`);
  });

})();
