export type EngravingMethod = 'upload' | 'text';
export type Face = 'Front' | 'Lid' | 'Back' | 'Left' | 'Right' | 'Bottom';

export type CheckoutResponse = {
  checkoutUrl: string;
  checkoutId: string;
};

export type GalleryResponse = {
  images?: string[];
};

export const createCheckout = async (payload: FormData): Promise<CheckoutResponse> => {
  // Same origin as the frontend
  const response = await fetch(`/checkout`, {
    method: 'POST',
    body: payload,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Checkout failed');
  }

  return (await response.json()) as CheckoutResponse;
};

export const fetchGallery = async (): Promise<string[]> => {
  const response = await fetch('/gallery', { method: 'GET' });
  const contentType = response.headers.get('content-type') ?? '';
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(bodyText || 'Failed to load images');
  }

  if (!contentType.includes('application/json')) {
    throw new Error('Unexpected gallery response format');
  }

  let data: GalleryResponse;
  try {
    data = JSON.parse(bodyText) as GalleryResponse;
  } catch {
    throw new Error('Invalid gallery response');
  }

  return Array.from(new Set(data.images ?? []));
};