import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

const app = express();
const port = process.env.PORT || 3000;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(cors());
app.use(bodyParser.json());

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send({ error: 'Message is required' });
  }

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are Kai and Lunari, two AI shopping assistants for PackityLab. Be smart, humble, helpful, and talk like a Harvard-educated concierge.' },
        { role: 'user', content: message },
      ],
    });

    const reply = response.data.choices[0].message?.content;
    res.send({ reply });
  } catch (err: any) {
    console.error(err);
    res.status(500).send({ error: 'Failed to get response from OpenAI' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
