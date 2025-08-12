import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/", (_req, res) => res.send("packity concierge up"));
// Optional: keep or ignore this; Render health check not required for chat
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.post("/chat", async (req, res) => {
  try {
    const { message, model } = req.body ?? {};
    if (!message) return res.status(400).json({ error: "message is required" });

    const out = await client.chat.completions.create({
      model: model || "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    res.json({ reply: out.choices?.[0]?.message?.content ?? "" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || "server error" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on ${PORT}`);
});
