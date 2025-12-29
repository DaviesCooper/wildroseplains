import { EngravingDetails, faceOrder, ShopifyAddress } from './types.js';

export const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export const buildBlobName = (originalName: string) => {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${unique}-${sanitizeFileName(originalName)}`;
};

export const formatEngravingDetails = (details?: EngravingDetails) => {
  if (!details || Object.keys(details).length === 0) {
    return 'None';
  }

  const lines: string[] = [];

  faceOrder.forEach((face) => {
    const detail = details[face];
    if (!detail) {
      return;
    }

    if (detail.method === 'text') {
      const text = (detail.text ?? '').trim();
      const emphasis: string[] = [];
      if (detail.bold) emphasis.push('bold');
      if (detail.italic) emphasis.push('italic');
      if (detail.underline) emphasis.push('underline');
      if (detail.strikethrough) emphasis.push('strikethrough');

      const styleParts = [
        detail.font ? `font: ${detail.font}` : null,
        detail.size ? `size: ${detail.size}` : null,
        detail.alignment ? `align: ${detail.alignment}` : null,
        detail.placement ? `placement: ${detail.placement}` : null,
        emphasis.length ? `style: ${emphasis.join(', ')}` : null,
      ].filter(Boolean);

      const summary = styleParts.length ? ` (${styleParts.join('; ')})` : '';
      const textLabel = text ? `"${text}"` : '(no text provided)';
      lines.push(`${face}: text ${textLabel}${summary}`);
      return;
    }

    if (detail.method === 'upload') {
      const imageParts = [
        detail.fileName ? `file: ${detail.fileName}` : 'file: (missing)',
        detail.imageFit ? `fit: ${detail.imageFit}` : null,
      ].filter(Boolean);
      lines.push(`${face}: upload ${imageParts.join('; ')}`);
      return;
    }

    lines.push(`${face}: ${JSON.stringify(detail)}`);
  });

  return lines.length ? lines.join('\n') : 'None';
};

export const formatShippingAddress = (address?: ShopifyAddress) => {
  if (!address) {
    return 'None';
  }

  const parts: string[] = [];
  const nameLine = [address.name, address.company].filter(Boolean).join(' — ');
  if (nameLine) {
    parts.push(nameLine);
  }

  const street = [address.address1, address.address2].filter(Boolean).join(', ');
  if (street) {
    parts.push(street);
  }

  const cityLine = [address.city, address.province, address.zip].filter(Boolean).join(', ');
  if (cityLine) {
    parts.push(cityLine);
  }

  if (address.country) {
    parts.push(address.country);
  }

  if (address.phone) {
    parts.push(`Phone: ${address.phone}`);
  }

  return parts.length ? parts.join('\n') : 'None';
};

export const isLocalhostOrigin = (origin: string) => {
  return origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
};

