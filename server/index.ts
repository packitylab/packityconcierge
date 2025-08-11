import cors from "cors";
import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import { json } from 'express';
import { shopify } from './lib/shopify.js';
import { tools } from './lib/tools.js';
import { basicAuth } from './lib/utils.js';

const app = express();
app.use(cors({ origin: "*" }));
app.use(json({ limit: '2mb' }));
// Health
app.get('/health', (_req, res) => res.json({ ok: true }));
// Root route
app.get("/", (_req, res) => {
  res.send("Packity Concierge API is running ✅");
});

// Detailed health route
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Simple chat endpoint (text). Voice can be added later.
app.post('/api/realtime/message', async (req, res) => {
  const { persona = 'lunari', input, conversation } = req.body || {};
  if (!input) return res.status(400).json({ error: 'missing input' });

  const system = `You are ${persona === 'kai' ? 'Kai' : 'Lunari'}, a polite AI concierge for PackityLab.
Rules:
- NEVER change prices or publish products.
- You may only call tools exposed by the server.
- For purchases, create a draft order and ask for email to send invoice.
- Tone: concise, helpful, a touch of warmth.`;

  const payload = {
    model: process.env.OPENAI_TEXT_MODEL || "gpt-5.1",
    messages: [
      { role: 'system', content: system },
      ...(Array.isArray(conversation) ? conversation : []),
      { role: 'user', content: input }
    ],
    tools: tools.schema,
    tool_choice: 'auto'
  } as any;

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await r.json();

  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) {
    const name = toolCall.function?.name;
    const args = JSON.parse(toolCall.function?.arguments || '{}');
    try {
      const result = await tools.execute(name, args);
      return res.json({ tool: name, result });
    } catch (e: any) {
      return res.status(500).json({ tool: name, error: e?.message || 'tool error' });
    }
  }

  const text = data?.choices?.[0]?.message?.content ?? '';
  res.json({ text });
});

// Webhooks (optional during dev)
app.post('/webhooks/products', async (req, res) => {
  console.log('Product webhook');
  res.sendStatus(200);
});

app.post('/webhooks/inventory', async (req, res) => {
  console.log('Inventory webhook');
  res.sendStatus(200);
});

// Review UI for drafts -> publish
app.get('/review', basicAuth, async (_req, res) => {
  const drafts = await shopify.listDraftProducts();
  const items = drafts.map(p => `<li><b>${p.title}</b> — ${p.id}
  <form method="post" action="/review/publish" style="display:inline">
    <input type="hidden" name="id" value="${p.id}">
    <button>Publish</button>
  </form></li>`).join('');
  res.setHeader('Content-Type','text/html');
  res.end(`<h1>Drafts</h1><ul>${items}</ul>`);
});

app.post('/review/publish', basicAuth, express.urlencoded({ extended: false }), async (req, res) => {
  const id = (req.body as any).id;
  await shopify.publishProduct(id);
  res.redirect('/review');
});
// Root route
app.get("/", (_req, res) => {
  res.send("Packity Concierge API is running ✅");
});

// Detailed health route
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

const PORT = Number(process.env.PORT || 8787);
app.listen(PORT, () => console.log('Server on', PORT));
