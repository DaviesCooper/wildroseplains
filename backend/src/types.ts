export type Face = 'Front' | 'Lid' | 'Back' | 'Left' | 'Right' | 'Bottom';

export type EngravingMethod = 'upload' | 'text';

export const faceOrder: Face[] = ['Front', 'Lid', 'Back', 'Left', 'Right', 'Bottom'];

export type EngravingDetails = Partial<
  Record<
    Face,
    {
      method?: EngravingMethod;
      text?: string;
      font?: string;
      size?: string;
      alignment?: string;
      placement?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
      imageFit?: string;
      fileName?: string;
    }
  >
>;

export type SavedFile = {
  face?: Face;
  blobName: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type SavedOrder = {
  checkoutId: string;
  variant: string;
  finish: string;
  engravingMethods: Record<Face, EngravingMethod>;
  engravingDetails?: EngravingDetails;
  files: SavedFile[];
  createdAt: string;
};

export type ShopifyAddress = {
  name?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  phone?: string;
};

