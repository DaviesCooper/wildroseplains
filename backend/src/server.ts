import cors from 'cors';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { indexFilePath, staticDir } from './constants.js';
import { checkoutHandler } from './routes/checkout.js';
import { galleryHandler } from './routes/gallery.js';
import { shopifyWebhookHandler } from './routes/shopifyWebhook.js';
import { upload } from './uploads.js';
import { isLocalhostOrigin, redact } from './utils.js';

const app = express();

const allowedOrigins = config.frontendOrigins;
const contentSecurityPolicy = {
  useDefaults: true,
  directives: {
    // Allow product/gallery images served from Azure Blob Storage.
    'img-src': ["'self'", 'data:', 'https://*.blob.core.windows.net'],
  },
} as const;

const logStartupConfig = () => {
  const safeConfig = {
    isDev: config.isDev,
    port: config.port,
    frontendOrigins: config.frontendOrigins,
    shopify: {
      domain: config.shopify.domain,
      storefrontToken: redact(config.shopify.storefrontToken),    
      variantId: redact(config.shopify.variantId),
      webhookSecret: redact(config.shopify.webhookSecret),
    },
    email: {
      host: config.email.host,
      port: config.email.port,
      user: config.email.user,
      from: config.email.from,
      to: config.email.to,
      pass: redact(config.email.pass),
    },
    azure: {
      connectionString: redact(config.azure.connectionString),
    },
  };
  console.log('Loaded config:', JSON.stringify(safeConfig, null, 2));
};

const apiRouter = express.Router();

apiRouter.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (config.isDev && isLocalhostOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
  }),
);

apiRouter.use(express.json({ limit: '1mb' }));

app.use(
  helmet({
    contentSecurityPolicy,
  }),
);

app.use(morgan('tiny'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/shopify/webhook', express.raw({ type: 'application/json' }), shopifyWebhookHandler);

apiRouter.post('/api/checkout', upload.any(), checkoutHandler);
apiRouter.get('/api/gallery', galleryHandler);

app.use('/api', apiRouter);

app.use(express.static(staticDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    next();
    return;
  }

  if (req.path === '/health') {
    next();
    return;
  }

  if (!fs.existsSync(indexFilePath)) {
    res.status(404).send('Frontend not built');
    return;
  }

  res.sendFile(indexFilePath);
});

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  if (res.headersSent) {
    return;
  }

  const status = 500;
  if (req.path.startsWith('/api')) {
    res.status(status).json({ error: 'Internal server error' });
    return;
  }

  res
    .status(status)
    .type('html')
    .send(
      [
        '<!doctype html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="UTF-8" />',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        '  <title>Something went wrong</title>',
        '  <style>body{font-family:sans-serif;margin:2rem;}h1{margin-bottom:0.5rem;}p{margin-top:0;}code{background:#f4f4f4;padding:0.15rem 0.35rem;border-radius:4px;}</style>',
        '</head>',
        '<body>',
        '  <h1>Something went wrong.</h1>',
        '  <p>An unexpected error occurred. Please try again in a moment.</p>',
        '</body>',
        '</html>',
      ].join('\n'),
    );
});

const port = Number(config.port);
logStartupConfig();
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

