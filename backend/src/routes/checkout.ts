import type { Request, Response } from 'express';
import { createCheckout, type CheckoutRequest } from '../shopifyClient.js';
import { getContainerClient } from '../storage.js';
import { EngravingDetails, Face, faceOrder, SavedOrder } from '../types.js';
import { buildBlobName } from '../utils.js';
import { saveOrder } from '../orderStore.js';

const parseFaceField = (fieldname?: string): Face | undefined => {
  if (!fieldname || !fieldname.startsWith('file-')) {
    return undefined;
  }

  const candidate = fieldname.replace('file-', '') as Face;
  return faceOrder.includes(candidate) ? candidate : undefined;
};

export const checkoutHandler = async (req: Request, res: Response) => {
  const { variant, finish, engravingMethods: engravingMethodsRaw, engravingDetails: engravingDetailsRaw } = req.body ?? {};

  if (!variant || !finish || !engravingMethodsRaw) {
    res.status(400).json({ error: 'Missing required fields: variant, finish, engravingMethods' });
    return;
  }

  let engravingMethods: CheckoutRequest['engravingMethods'];
  try {
    engravingMethods = JSON.parse(engravingMethodsRaw) as CheckoutRequest['engravingMethods'];
  } catch {
    res.status(400).json({ error: 'Invalid engravingMethods JSON' });
    return;
  }

  let engravingDetails: EngravingDetails | undefined;
  if (engravingDetailsRaw) {
    try {
      engravingDetails = JSON.parse(engravingDetailsRaw) as EngravingDetails;
    } catch {
      res.status(400).json({ error: 'Invalid engravingDetails JSON' });
      return;
    }
  }

  const uploadedFiles = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];

  let files: SavedOrder['files'] = [];
  try {
    const containerClient = await getContainerClient('uploads');
    const uploads = await Promise.all(
      uploadedFiles.map(async (file) => {
        const blobName = buildBlobName(file.originalname);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(file.buffer, {
          blobHTTPHeaders: { blobContentType: file.mimetype },
        });

        return {
          face: parseFaceField(file.fieldname),
          blobName,
          url: blockBlobClient.url,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        };
      }),
    );
    files = uploads ?? [];
  } catch (error) {
    console.error('Failed to upload files to Azure', error);
    res.status(500).json({ error: 'Failed to upload files' });
    return;
  }

  try {
    const checkout = await createCheckout({ variant, finish, engravingMethods });
    const record: SavedOrder = {
      checkoutId: checkout.checkoutId,
      variant,
      finish,
      engravingMethods,
      engravingDetails,
      files,
      createdAt: new Date().toISOString(),
    };

    await saveOrder(record);
    res.json(checkout);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

