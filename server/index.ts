// --- Core & AI setup ---------------------------------------------------------
import OpenAI from "openai";
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

import cors from "cors";
import "dotenv/config";
import express from "express";

// If you use these elsewhere in your project, keep them.
// They’re used below for the /review routes so TS doesn’t complain.
import fetch from "node-fetch";
import { shopify } from "./lib/shopify.js";
import { tools } from "./lib/tools.js";
import { basicAuth } from "./lib/utils.js";

// --- App init ---------------------------------------------------------------
const app = express();
app.use(cors({ origin: "*" })); // tighten later for production
app.use(express.json({ limit: "2mb" }));

// --- Persona styles + reply generator ---------------------------------------
const personaStyle: Record<string, string> = {
  kai: "You are Kai: concise, technical, a little dry, always practical.",
  lunari: "You are Lunari: warm, helpful, lightly poetic, friendly."
};
async function generateReply(persona: string, userText: string): Promise<string> {
  // hard-fail if the server isn’t configured correctly
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing on server");
  }

  const p = (persona || "lunari").toLowerCase();

  // PackityLab brand voice
  const BRAND = `You are a concierge for PackityLab — a global AI retail brand.
  Be gentle, humble and genuinely helpful. Use clear, confident language.
  We predict trends, surface viral products, and match people with the “magic”
  they want for everyday life and special experiences. Never pushy; always useful.`;

  const personaStyle: Record<string, string> = {
    kai: `${BRAND}
    Role: Kai — global business & marketing strategist.
    Voice: concise, technical, practical. Focus on ROI, funnels, CAC/LTV, ops efficiency.
    Provide crisp next actions, optional cross/upsell angles, and measurable outcomes.`,

    lunari: `${BRAND}
    Role: Lunari — warm retail guide & product matchmaker.
    Voice: friendly, lightly poetic, reassuring. Suggest discovery paths, tasteful bundles,
    and delightful ideas. Keep it short, kind, and confidence-building.`
  };

  const style = personaStyle[p] ?? personaStyle.lunari;

  const res = await openai!.chat.completions.create({
    model: "gpt-4o",  // or "gpt-4o-mini" if you prefer cheaper
    messages: [
      { role: "system", content: style },
      { role: "user", content: userText }
    ],
    temperature: 0.7
  });

  const text = res.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from model");
  return text;
}

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: style },
      { role: "user", content: userText }
    ],
    temperature: 0.7
  });

  return res.choices[0]?.message?.content ?? "… (no content)";
}

// --- Health & root ----------------------------------------------------------
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/", (_req, res) => {
  res.send("Packity Concierge API is running ✅");
});

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// --- Unified chat endpoint (Kai & Lunari) -----------------------------------
app.post("/api/realtime/message", async (req, res) => {
  try {
    const { persona, input, conversation, text } = req.body || {};
    const userText = String(input ?? conversation ?? text ?? "").trim();
    if (!userText) return res.status(400).json({ error: "missing input" });

    const who = String(persona ?? "lunari");
    const reply = await generateReply(who, userText);

    return res.status(200).json({ persona: who, text: reply });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || "server error" });
  }
});

// --- (Optional) simple review helper routes to keep your earlier features ---
app.get("/review", basicAuth, async (_req, res) => {
  const drafts = await shopify.listDraftProducts();
  const items = drafts.map((p: any) => `<li><b>${p.title}</b> – ${p.id}
    <form method="post" action="/review/publish" style="display:inline">
      <input type="hidden" name="id" value="${p.id}">
      <button>Publish</button>
    </form></li>`).join("");
  res.setHeader("Content-Type", "text/html");
  res.end(`<h1>Drafts</h1><ul>${items}</ul>`);
});

app.post(
  "/review/publish",
  basicAuth,
  express.urlencoded({ extended: false }),
  async (req, res) => {
    const id = (req.body as any)?.id;
    if (!id) return res.status(400).send("Missing id");
    await shopify.publishProduct(id);
    res.redirect("/review");
  }
);

// --- Start server -----------------------------------------------------------
const PORT = Number(process.env.PORT || 8787);
app.listen(PORT, () => console.log("Server on", PORT));
