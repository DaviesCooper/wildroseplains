import { config } from './config.js';
import { EngravingMethod, Face } from './types.js';

export type CheckoutRequest = {
  variant: string;
  finish: string;
  engravingMethods: Record<Face, EngravingMethod>;
  attributes?: { key: string; value: string }[];
  lineAttributes?: { key: string; value: string }[];
};

type CheckoutCreateResponse = {
  checkoutUrl: string;
  checkoutId: string;
};

const shopifyEndpoint = () => {
  if (!config.shopify.domain) {
    throw new Error('SHOPIFY_STORE_DOMAIN is not set');
  }
  return `https://${config.shopify.domain}/api/2023-07/graphql.json`;
};

const shopifyHeaders = () => {
  if (!config.shopify.storefrontToken) {
    throw new Error('SHOPIFY_STOREFRONT_TOKEN is not set');
  }
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': config.shopify.storefrontToken,
  };
};

export const createCheckout = async (request: CheckoutRequest): Promise<CheckoutCreateResponse> => {
  const variantId = config.shopify.variantId;
  if (!variantId) {
    throw new Error('SHOPIFY_VARIANT_ID is not set');
  }

  const payload = {
    query: `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: {
      input: {
        attributes: request.attributes,
        lines: [
          {
            quantity: 1,
            merchandiseId: variantId,
            attributes: request.lineAttributes,
          },
        ],
      },
    },
  };

  const response = await fetch(shopifyEndpoint(), {
    method: 'POST',
    headers: shopifyHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify responded with ${response.status}: ${body}`);
  }

  const json = (await response.json()) as {
    data?: {
      cartCreate?: {
        cart?: { id: string; checkoutUrl: string };
        userErrors?: { field?: string[]; message: string }[];
      };
    };
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new Error(json.errors.map((err) => err.message).join('; '));
  }

  const result = json.data?.cartCreate;
  if (!result?.cart?.checkoutUrl || !result.cart.id) {
    const messages = result?.userErrors?.map((e) => e.message).join('; ') ?? 'Unknown Shopify response';
    throw new Error(messages);
  }

  return {
    checkoutUrl: result.cart.checkoutUrl,
    checkoutId: result.cart.id,
  };
};

