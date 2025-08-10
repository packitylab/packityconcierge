import 'dotenv/config';
import fetch from 'node-fetch';

const domain = process.env.SHOPIFY_STORE_DOMAIN!;
const version = process.env.SHOPIFY_API_VERSION!;
const admin = `https://${domain}/admin/api/${version}/graphql.json`;

async function gql(query: string, variables: any = {}) {
  const r = await fetch(admin, { method: 'POST', headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN!, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

(async () => {
  const mutation = `#graphql
  mutation($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: { callbackUrl: $callbackUrl, format: JSON }) {
      webhookSubscription { id } userErrors { message }
    }
  }`;
  const base = (process.env.PUBLIC_WIDGET_ORIGIN || 'http://localhost:8787') + '/webhooks';
  for (const [topic, path] of [ ['PRODUCTS_UPDATE','/products'], ['INVENTORY_LEVELS_UPDATE','/inventory'], ['ORDERS_CREATE','/orders'] ] as const) {
    const d = await gql(mutation, { topic, callbackUrl: base + path });
    console.log(topic, d);
  }
})();
