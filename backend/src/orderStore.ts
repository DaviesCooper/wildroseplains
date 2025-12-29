import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { orderDataDir } from './constants.js';
import { SavedOrder } from './types.js';

fs.mkdirSync(orderDataDir, { recursive: true });

const orderRecordPath = (checkoutId: string) => path.join(orderDataDir, `${encodeURIComponent(checkoutId)}.json`);

export const saveOrder = async (order: SavedOrder) => {
  const recordPath = orderRecordPath(order.checkoutId);
  await fsPromises.writeFile(recordPath, JSON.stringify(order, null, 2), 'utf8');
};

export const loadOrder = async (checkoutId: string): Promise<SavedOrder | null> => {
  const recordPath = orderRecordPath(checkoutId);
  try {
    const data = await fsPromises.readFile(recordPath, 'utf8');
    return JSON.parse(data) as SavedOrder;
  } catch {
    return null;
  }
};

