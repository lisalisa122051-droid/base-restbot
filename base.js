// Connect & event handlers (baileys)
import makeWASocket, { useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@adiwajshing/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { CONFIG } from "./src/config.js";
import { handleCommand } from "./src/commands.js";

const logger = pino({ level: "info" });

export async function startBot() {
  const { version } = await fetchLatestBaileysVersion().catch(()=>({ version: [2,2204,13] }));
  const { state, saveState } = useSingleFileAuthState(CONFIG.AUTH_FILE);

  const conn = makeWASocket({
    logger,
    printQRInTerminal: false,
    auth: state,
    version
  });

  conn.ev.on("creds.update", saveState);

  conn.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      qrcode.generate(qr, { small: true });
      logger.info("QR code generated in terminal. Scan with WhatsApp.");
    }
    if (connection === "close") {
      const reason = (lastDisconnect?.error)?.output?.statusCode;
      logger.warn("Connection closed:", lastDisconnect?.error || reason);
      // auto reconnect
      if ((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
        startBot();
      } else {
        logger.info("Device logged out - delete auth file to re-login.");
      }
    } else if (connection === "open") {
      logger.info("Connected to WhatsApp.");
    }
  });

  conn.ev.on("messages.upsert", async m => {
    try {
      const msg = m.messages[0];
      if (!msg.message) return;
      const from = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");
      const sender = msg.key.participant || from;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
      // determine admin
      const isAdmin = CONFIG.ADMINS.includes(sender);

      // handle commands if startswith prefix or plain keyword
      const starts = text.trim().startsWith(CONFIG.PREFIX) || ["produk","order","cekpesanan","halo","hi"].some(k => text.toLowerCase().startsWith(k));
      if (starts) {
        await handleCommand(conn, msg.message, from, isAdmin);
      } else {
        // auto reply for media / greetings
        // example: user sends "foto" -> reply with top product photo if exists
        if (text.toLowerCase().includes("daftar")) {
          await conn.sendMessage(from, { text: "Mau lihat produk? ketik !produk" });
        }
      }
    } catch (err) {
      logger.error("error handling message", err);
    }
  });

  return conn;
}
