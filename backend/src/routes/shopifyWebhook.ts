import crypto from 'crypto';
import type { Request, Response } from 'express';
import { config } from '../config.js';
import { sendEmail } from '../mailer.js';
import { getContainerClient } from '../storage.js';
import { EngravingDetails, SavedFile, ShopifyAddress } from '../types.js';
import { formatEngravingDetails, formatShippingAddress } from '../utils.js';

type ShopifyOrderPayload = {
  id?: number | string;
  name?: string;
  email?: string;
  currency?: string;
  total_price?: string;
  shipping_address?: ShopifyAddress;
  checkout?: { id?: string };
  order_id?: string | number;
  line_items?: {
    name?: string;
    sku?: string;
    quantity?: number;
    properties?: { name?: string; value?: string }[];
  }[];
};

type EmbeddedOrderPayload = {
  variant?: string;
  finish?: string;
  engravingMethods?: Record<string, string>;
  engravingDetails?: unknown;
  files?: SavedFile[];
};

const verifyWebhookSignature = (rawBody: Buffer, hmacHeader: string, secret: string) => {
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  const expected = Buffer.from(digest, 'base64');
  const received = Buffer.from(hmacHeader, 'base64');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

const parseWebhookPayload = (rawBody: Buffer): ShopifyOrderPayload | null => {
  try {
    return JSON.parse(rawBody.toString('utf8')) as ShopifyOrderPayload;
  } catch {
    return null;
  }
};

const findCheckoutId = (payload: ShopifyOrderPayload) =>
  payload.checkout?.id ?? payload.id?.toString() ?? payload.order_id?.toString();

const findOrderId = (payload: ShopifyOrderPayload) => payload.order_id?.toString() ?? payload.id?.toString();

const extractEmbeddedOrder = (payload: ShopifyOrderPayload): EmbeddedOrderPayload | null => {
  const engravingProperty = payload.line_items
    ?.flatMap((item) => item?.properties ?? [])
    .find((property) => property?.name === 'engraving_payload' && property.value);

  if (!engravingProperty?.value) {
    return null;
  }

  try {
    return JSON.parse(engravingProperty.value) as EmbeddedOrderPayload;
  } catch {
    return null;
  }
};

const downloadAttachments = async (files: SavedFile[] | undefined) => {
  if (!files?.length) {
    return [];
  }

  try {
    const containerClient = await getContainerClient('uploads');
    const attachments = await Promise.all(
      files.map(async (file) => {
        const blobName = file.blobName;
        if (!blobName) {
          return null;
        }

        const blobClient = containerClient.getBlockBlobClient(blobName);
        const content = await blobClient.downloadToBuffer();
        return { filename: file.originalName, content, contentType: file.mimeType };
      }),
    );

    return attachments.filter(Boolean) as { filename: string; content: Buffer; contentType?: string }[];
  } catch (error) {
    console.error('Failed to download attachments from Azure', error);
    return [];
  }
};

export const shopifyWebhookHandler = async (req: Request, res: Response) => {
  const secret = config.shopify.webhookSecret;
  if (!secret) {
    res.status(500).json({ error: 'Shopify webhook secret not configured' });
    return;
  }

  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  if (typeof hmacHeader !== 'string') {
    res.status(401).json({ error: 'Missing HMAC header' });
    return;
  }

  const rawBody = req.body as Buffer;
  if (!verifyWebhookSignature(rawBody, hmacHeader, secret)) {
    res.status(401).json({ error: 'Invalid HMAC signature' });
    return;
  }

  const payload = parseWebhookPayload(rawBody);
  if (!payload) {
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }

  const topic = req.headers['x-shopify-topic'];
  const checkoutId = findCheckoutId(payload);
  const orderId = findOrderId(payload);
  console.log('Shopify webhook received', { topic, checkoutId, orderId });

  const embeddedOrder = extractEmbeddedOrder(payload);
  const engravingDetails = embeddedOrder?.engravingDetails as EngravingDetails | undefined;

  const shippingAddressSummary = formatShippingAddress(payload.shipping_address);
  const emailSubject = `Shopify order webhook: ${payload.name ?? payload.id ?? 'unknown'} (${topic ?? 'no-topic'})`;
  const emailBody = [
    `Topic: ${topic ?? 'unknown'}`,
    `Order: ${payload.name ?? payload.id ?? 'unknown'}`,
    `Checkout ID: ${checkoutId ?? 'unknown'}`,
    `Customer email: ${payload.email ?? 'unknown'}`,
    `Total: ${payload.total_price ?? 'unknown'} ${payload.currency ?? ''}`,
    '',
    'Shipping address:',
    shippingAddressSummary,
    '',
    'Saved engraving details:',
    formatEngravingDetails(engravingDetails),
  ].join('\n');

  const attachments = await downloadAttachments(embeddedOrder?.files);

  try {
    await sendEmail({ subject: emailSubject, text: emailBody, attachments });
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Failed to send webhook email', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

