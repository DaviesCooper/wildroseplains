import type { Request, Response } from 'express';
import { getContainerClient } from '../storage.js';

const CONTAINER_NAME = 'gallery';
const MAX_RESULTS = 10;

const pickRandom = <T>(items: T[], count: number): T[] => {
  if (items.length <= count) {
    return items;
  }
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
};

export const galleryHandler = async (_req: Request, res: Response) => {
  try {
    const containerClient = await getContainerClient(CONTAINER_NAME);
    const urls: string[] = [];

    for await (const blob of containerClient.listBlobsFlat()) {
      const client = containerClient.getBlockBlobClient(blob.name);
      urls.push(client.url);
    }

    console.log(urls);

    const selected = pickRandom(urls, MAX_RESULTS);
    res.json({ images: selected });
  } catch (error) {
    console.error('Failed to load gallery blobs', error);
    res.status(500).json({ error: 'Failed to load gallery images' });
  }
};

