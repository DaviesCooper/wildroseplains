import { useState } from 'react';
import { EngravingConfigurator } from '../components/EngravingConfigurator';
import type { FaceEngraving } from '../components/EngravingConfigurator';
import { createCheckout } from '../lib/api';
import type { EngravingMethod, Face } from '../lib/api';
import './DeckBoxesPage.css';

const variantOptions = [
  {
    id: 'chest',
    name: 'Chest',
    image: '/1.png',
  },
  {
    id: 'insert',
    name: 'Insert',
    image: '/5.png',
  },
];

const finishOptions = [
  { id: 'green', name: 'Green Stain', background: 'url("/green.png")' },
  { id: 'yellow', name: 'Yellow Stain', background: 'url("/yellow.png")' },
  { id: 'red', name: 'Red Stain', background: 'url("/red.png")' },
  { id: 'blue', name: 'Blue Stain', background: 'url("/blue.png")' },
  { id: 'linseed', name: 'Linseed Oil', background: 'url("/linseed.png")' },
  {
    id: 'none',
    name: 'None',
    background: 'url("/none.png")',
  },
];

const faces: Face[] = ['Front', 'Lid', 'Back', 'Left', 'Right', 'Bottom'];

 type FaceEngravingDetails = Partial<Omit<FaceEngraving, 'uploadFile'>> & {
   method: EngravingMethod;
   fileName?: string;
 };

const variantImages: Record<
  string,
  {
    closed: string;
    open: string;
  }
> = {
  chest: { closed: '/1.png', open: '/8.png' },
  insert: { closed: '/5.png', open: '/7.png' },
};


export const DeckBoxesPage = () => {
  const [selectedVariant, setSelectedVariant] = useState(variantOptions[0].id);
  const [selectedFinish, setSelectedFinish] = useState('none');
  const [isOpenPreview, setIsOpenPreview] = useState(false);
  const [faceEngravings, setFaceEngravings] = useState<Record<Face, FaceEngraving>>(() =>
    faces.reduce(
      (acc, face) => ({
        ...acc,
        [face]: {
          method: 'upload',
          uploadFile: null,
          text: '',
          font: '',
          size: '70',
          alignment: 'center',
          placement: 'center',
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          imageFit: 'fit',
        },
      }),
      {} as Record<Face, FaceEngraving>,
    ),
  );
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [checkoutLink, setCheckoutLink] = useState<string | null>(null);

  const selectedImages =
    variantImages[selectedVariant] ?? { closed: variantOptions[0].image, open: variantOptions[0].image };
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  const selectedFinishStyle = (() => {
    const finish = finishOptions.find((f) => f.id === selectedFinish);
    if (!finish) return {};
    const bg = finish.background;
    if (bg.startsWith('url')) {
      return {
        backgroundImage: bg,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } as const;
    }
    return {
      background: bg,
      backgroundSize: '200% 200%',
      backgroundPosition: 'center',
    } as const;
  })();

  const isMobile = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const openCheckout = (url: string) => {
    if (isMobile()) {
      window.location.assign(url);
      return;
    }
    const newTab = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newTab) {
      setOrderStatus('Popup blocked—use the checkout link below.');
    }
  };

  const handleOrder = async () => {
    setIsOrdering(true);
    setOrderStatus(null);
    setCheckoutLink(null);

    const engravingMethodsPayload = faces.reduce<Record<Face, EngravingMethod>>((acc, face) => {
      acc[face] = faceEngravings[face].method;
      return acc;
    }, {} as Record<Face, EngravingMethod>);

     const engravingDetailsPayload = faces.reduce<Partial<Record<Face, FaceEngravingDetails>>>((acc, face) => {
       const engraving = faceEngravings[face];
       if (!engraving) {
         return acc;
       }

       if (engraving.method === 'text') {
         const text = engraving.text.trim();
         if (!text) {
           return acc;
         }
         acc[face] = {
           method: engraving.method,
           text,
           font: engraving.font || undefined,
           size: engraving.size || undefined,
           alignment: engraving.alignment,
           placement: engraving.placement,
           bold: engraving.bold || undefined,
           italic: engraving.italic || undefined,
           underline: engraving.underline || undefined,
           strikethrough: engraving.strikethrough || undefined,
         };
         return acc;
       }

       if (engraving.method === 'upload') {
         const fileName = engraving.uploadFile?.name?.trim();
         if (!fileName) {
           return acc;
         }
         acc[face] = {
           method: engraving.method,
           fileName,
           imageFit: engraving.imageFit,
         };
       }

       return acc;
     }, {});

    const formData = new FormData();
    formData.append('variant', selectedVariant);
    formData.append('finish', selectedFinish);
    formData.append('engravingMethods', JSON.stringify(engravingMethodsPayload));
    formData.append('engravingDetails', JSON.stringify(engravingDetailsPayload));

    faces.forEach((face) => {
      const engraving = faceEngravings[face];
      if (engraving.method === 'upload' && engraving.uploadFile) {
        formData.append(`file-${face}`, engraving.uploadFile);
      }
    });

    try {
      const checkout = await createCheckout(formData);
      const redirectUrl = checkout.checkoutUrl;
      setOrderStatus('Order submitted! Redirecting to checkout…');
      setCheckoutLink(redirectUrl);
      openCheckout(redirectUrl);
    } catch (error) {
      setOrderStatus('Could not submit the order. Please try again or email us.');
    } finally {
      setIsTermsOpen(false);
      setHasAcceptedTerms(false);
      setIsOrdering(false);
    }
  };

  const openTermsModal = () => {
    setHasAcceptedTerms(false);
    setIsTermsOpen(true);
  };

  const closeTermsModal = () => {
    if (isOrdering) return;
    setIsTermsOpen(false);
  };

  return (
    <div className="page deck-boxes">
      <section className="hero hero--tight">
        <h1>Deck Boxes</h1>
      </section>

      <div className="deck-grid">
        <div className="panel preview-panel panel--stretch">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Preview</p>
            </div>
          </div>
          <div className="preview-media-row">
            <button
              type="button"
              className="preview-media preview-media--active preview-media--clickable"
              aria-label={isOpenPreview ? 'Open view' : 'Closed view'}
              onClick={() => setIsOpenPreview((prev) => !prev)}
            >
              <div
                className="preview-media__img"
                style={{
                  backgroundImage: `url("${isOpenPreview ? selectedImages.open : selectedImages.closed}")`,
                }}
              />
              <div className="preview-media__label">
                <img
                  src={isOpenPreview ? '/behind.svg' : '/infront.svg'}
                  alt={isOpenPreview ? 'Open/behind indicator' : 'Closed/in front indicator'}
                  className="preview-media__icon-img"
                />
              </div>
            </button>
            <div className="preview-media preview-media--active" aria-label="Finish view">
              <div className="preview-media__img" style={selectedFinishStyle} />
              <div className="preview-media__label">
              </div>
            </div>
          </div>
        </div>

        <div className="panel options-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Options</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span className="label">Variant</span>
              <select value={selectedVariant} onChange={(e) => setSelectedVariant(e.target.value)}>
                {variantOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="label">Finish</span>
              <select value={selectedFinish} onChange={(e) => setSelectedFinish(e.target.value)}>
                {finishOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <EngravingConfigurator
          faces={faces}
          faceEngravings={faceEngravings}
          onChange={setFaceEngravings}
        />
      </div>

      <div className="order-bar panel panel--stretch" role="complementary" aria-label="Order deck box">
        <div className="order-bar__summary">
          <p className="label">Ready to order?</p>
          <p className="caption">
            Checkout is handled by Shopify. We will verify engraving files after purchase.
            In the event of any confusion we will attempt to contact you via email.
          </p>
        </div>
        <div className="order-bar__action">
          <button type="button" className="order-btn" onClick={openTermsModal} disabled={isOrdering}>
            {isOrdering ? 'Placing order…' : 'Order now'}
          </button>
          {orderStatus && (
            <p className="order-status" role="status">
              {orderStatus}
            </p>
          )}
          {checkoutLink && (
            <p className="order-status" role="status">
              Checkout link ready:{' '}
              <a href={checkoutLink} target="_blank" rel="noopener noreferrer">
                Open checkout
              </a>
            </p>
          )}
        </div>
      </div>
      {isTermsOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Terms and conditions">
          <div className="modal">
            <div className="modal__header">
              <h3>Terms &amp; Conditions</h3>
            </div>
            <div className="modal__body">
              <p>
                I understand that the product is hand-crafted and may contain minor defects or errors (for example,
                slight misalignment of the lid). Minor defects like these are not a sufficient reason for a refund.
              </p>
              <p>
                I understand that due to the nature of the product, there may be slight variations in the color of
                the wood, the finish, and the engraving. These variations are not a sufficient reason for a refund.
              </p>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={hasAcceptedTerms}
                  onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                />
                <span>I agree to the terms and wish to place my order.</span>
              </label>
            </div>
            <div className="modal__actions">
              <button type="button" className="ghost-btn" onClick={closeTermsModal} disabled={isOrdering}>
                Cancel
              </button>
              <button
                type="button"
                className="order-btn"
                onClick={handleOrder}
                disabled={!hasAcceptedTerms || isOrdering}
              >
                {isOrdering ? 'Placing order…' : 'Agree and order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
