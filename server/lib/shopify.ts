import fetch from 'node-fetch';

const domain = process.env.SHOPIFY_STORE_DOMAIN!;
const version = process.env.SHOPIFY_API_VERSION!;
const admin = `https://${domain}/admin/api/${version}/graphql.json`;

async function gql(query: string, variables: any = {}) {
  const r = await fetch(admin, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  if (j.data?.userErrors?.length) throw new Error(JSON.stringify(j.data.userErrors));
  return j.data;
}

export const shopify = {
  async searchProducts(queryStr: string) {
    const query = /* GraphQL */ `#graphql
      query($q: String!, $first: Int!) {
        products(first: $first, query: $q) { edges { node { id title handle status totalInventory featuredImage { url altText } variants(first: 10) { edges { node { id title price } } } } } }
      }
    `;
    const data = await gql(query, { q: queryStr, first: 10 });
    return data.products.edges.map((e:any) => e.node);
  },

  async createDraftProduct(input: { title: string; descriptionHtml?: string; price?: string; images?: string[]; tags?: string[]; }) {
    const mutation = /* GraphQL */ `#graphql
      mutation($input: ProductInput!) {
        productCreate(input: $input) { product { id title status handle } userErrors { field message } }
      }
    `;
    const variables = {
      input: {
        title: input.title,
        descriptionHtml: input.descriptionHtml || '',
        status: 'DRAFT',
        tags: input.tags || []
      }
    };
    const data = await gql(mutation, variables);

    const pid = data.productCreate.product.id;
    if (input.images?.length) {
      await shopify.attachImages(pid, input.images);
    }
    if (input.price) {
      await shopify.setSingleVariantPrice(pid, input.price);
    }
    return data.productCreate.product;
  },

  async attachImages(productId: string, urls: string[]) {
    const mutation = /* GraphQL */ `#graphql
      mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) { media { alt errors { code details message } } userErrors { field message } }
      }
    `;
    const media = urls.map(u => ({ alt: 'packitylab', originalSource: u, mediaContentType: 'IMAGE' }));
    await gql(mutation, { productId, media });
  },

  async setSingleVariantPrice(productId: string, price: string) {
    const query = /* GraphQL */ `#graphql
      query($id: ID!) { product(id: $id) { variants(first: 1) { edges { node { id } } } } }
    `;
    const d = await gql(query, { id: productId });
    const vid = d.product.variants.edges[0]?.node?.id;
    if (!vid) return;
    const mutation = /* GraphQL */ `#graphql
      mutation($id: ID!, $price: Money!) { productVariantUpdate(input: {id: $id, price: $price}) { userErrors { field message } productVariant { id price } } }
    `;
    await gql(mutation, { id: vid, price });
  },

  async createDraftOrder({ email, lineItems }: { email: string; lineItems: { variantId: string; quantity: number; }[] }) {
    const mutation = /* GraphQL */ `#graphql
      mutation($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) { draftOrder { id invoiceUrl } userErrors { field message } }
      }
    `;
    const data = await gql(mutation, { input: { email, lineItems } });
    return data.draftOrderCreate.draftOrder;
  },

  async listDraftProducts() {
    const query = /* GraphQL */ `#graphql
      query { products(first: 50, query: "status:draft") { edges { node { id title status } } } }
    `;
    const d = await gql(query);
    return d.products.edges.map((e:any) => e.node);
  },

  async publishProduct(id: string) {
    const mutation = /* GraphQL */ `#graphql
      mutation publish($input: ProductInput!) { productUpdate(input: $input) { product { id status } userErrors { message } } }
    `;
    await gql(mutation, { input: { id, status: 'ACTIVE' } });
  }
};
