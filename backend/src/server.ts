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
import { isLocalhostOrigin } from './utils.js';

const app = express();

const allowedOrigins = config.frontendOrigins;
const contentSecurityPolicy = {
  useDefaults: true,
  directives: {
    // Allow product/gallery images served from Azure Blob Storage.
    'img-src': ["'self'", 'data:', 'https://*.blob.core.windows.net'],
  },
} as const;

app.use(
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

app.use(express.json({ limit: '1mb' }));

app.post('/api/checkout', upload.any(), checkoutHandler);
app.get('/api/gallery', galleryHandler);

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

const port = Number(config.port);
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

