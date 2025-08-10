import { shopify } from './shopify.js';

const schema = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search Shopify catalog with a query string',
      parameters: { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_draft_product',
      description: 'Create a DRAFT product (never publishes) with optional price and images',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          descriptionHtml: { type: 'string' },
          price: { type: 'string' },
          images: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } }
        }, required: ['title']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_draft_order',
      description: 'Create a draft order invoice for approval/payment',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          lineItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: { variantId: { type: 'string' }, quantity: { type: 'number' } },
              required: ['variantId','quantity']
            }
          }
        }, required: ['email','lineItems']
      }
    }
  }
] as const;

async function execute(name: string, args: any) {
  if (name === 'search_products') return shopify.searchProducts(args.q);
  if (name === 'create_draft_product') return shopify.createDraftProduct(args);
  if (name === 'create_draft_order') return shopify.createDraftOrder(args);
  throw new Error('unknown tool');
}

export const tools = { schema, execute };
