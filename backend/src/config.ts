import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const defaultFrontendOrigins = ['http://wildroseplains.ca', 'http://www.wildroseplains.ca'];
const envOrigins =
  process.env.FRONTEND_ORIGINS?.split(',').map((value) => value.trim()).filter(Boolean) ?? [];
const legacyOrigin = process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN] : [];

export const config = {
  isDev: process.env.NODE_ENV !== 'production',
  port: process.env.PORT ?? '8080',
  frontendOrigins:
    envOrigins.length > 0 ? envOrigins : legacyOrigin.length > 0 ? legacyOrigin : defaultFrontendOrigins,
  shopify: {
    domain: process.env.SHOPIFY_STORE_DOMAIN,
    storefrontToken: process.env.SHOPIFY_STOREFRONT_TOKEN,
    variantId: process.env.SHOPIFY_VARIANT_ID,
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
  },
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
  },
  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  },
};

