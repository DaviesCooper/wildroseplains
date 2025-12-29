import { BlobServiceClient, type ContainerClient } from '@azure/storage-blob';
import { config } from './config.js';

const azureConnectionString = config.azure.connectionString;
const blobServiceClient = azureConnectionString
  ? BlobServiceClient.fromConnectionString(azureConnectionString)
  : null;

const containerPromises = new Map<string, Promise<ContainerClient>>();

export const getContainerClient = async (containerName: string) => {
  if (!blobServiceClient) {
    throw new Error('Azure storage is not configured');
  }

  if (!containerPromises.has(containerName)) {
    containerPromises.set(
      containerName,
      (async () => {
        const client = blobServiceClient.getContainerClient(containerName);
        await client.createIfNotExists();
        return client;
      })(),
    );
  }

  const promise = containerPromises.get(containerName);
  if (!promise) {
    throw new Error('Failed to initialize container client');
  }

  return promise;
};

