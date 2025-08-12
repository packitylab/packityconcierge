import { Hono } from "hono";
import { cors } from "hono/cors";
import { Context } from "hono";
import OpenAI from "openai";

const app = new Hono();
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", // Set this in Render Environment
});

// Persona definitions
const personaStyle: Record<string, string> = {
  kai: "You are Kai: concise, technical, a little dry, always practical.",
  lunari: "You are Lunari: warm, helpful, lightly poetic, friendly.",
};

// Reply generator
async function generateReply(persona: string, userText: string): Promise<string> {
  const p = (persona || "lunari").toLowerCase();
  const style = personaStyle[p] ?? personaStyle.lunari;

  if (!openai.apiKey) {
    return `${p[0].toUpperCase() + p.slice(1)} heard: "${userText}". (demo mode)`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: style },
        { role: "user", content: userText },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message?.content || "No response.";
  } catch (error) {
    console.error("OpenAI error:", error);
    return "An error occurred while generating the reply.";
  }
}

// Route handler
app.post("/api/chat", async (c: Context) => {
  const { persona, message } = await c.req.json();
  const reply = await generateReply(persona, message);
  return c.json({ reply });
});

export default app;
