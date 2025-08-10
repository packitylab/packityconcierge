PackityLab – Kai & Lunari Concierge (Starter Kit v0.1)

Quick steps:
1) Install Node.js LTS (if not installed): https://nodejs.org
2) Unzip this folder anywhere on your PC.
3) Copy .env.example to .env and fill your real values (Shopify domain/token, OpenAI key, optional ElevenLabs key).
4) Open a terminal in this folder and run:
   npm i
   npm run dev
5) In Shopify → Online Store → Themes → Edit code:
   - Upload web/widget.js to Assets as widget.js
   - Create snippet theme/snippets/ai-widget.liquid with the content in theme/snippets/ai-widget.liquid
   - Include the snippet just before </body> in theme.liquid: {% render 'ai-widget' %}
6) Open your storefront and click the chat bubble.
7) Visit http://localhost:8787/review (username packity, password lab) to publish draft products the bot prepares.
