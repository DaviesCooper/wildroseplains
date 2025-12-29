import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchGallery } from '../lib/api';
import './GalleryPage.css';

export const GalleryPage = () => {
  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isTrackingTouch = useRef(false);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await fetchGallery();
      setImages(loaded);
      setActiveIndex(0);
    } catch (err) {
      console.error('Failed to load gallery', err);
      setImages([]);
      setError('Could not load the gallery right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    void loadImages();
  }, [loadImages]);

  const hasImages = images.length > 0;
  const canNavigate = images.length > 1;
  const activeImage = hasImages ? images[activeIndex] : null;

  const goPrev = () => {
    if (!canNavigate) return;
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNext = () => {
    if (!canNavigate) return;
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isTrackingTouch.current = true;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isTrackingTouch.current) return;
    isTrackingTouch.current = false;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX > 0) {
      goPrev();
    } else {
      goNext();
    }
  };

  return (
    <div className="page gallery">
      <section className="hero hero--center">
        <h1>Gallery</h1>
      </section>

      <div className="panel panel--stretch gallery-panel">
        {isLoading && <div className="viewer-placeholder">Loading gallery…</div>}

        {!isLoading && error && (
          <div className="banner banner--error">
            <span>{error}</span>
            <button type="button" onClick={loadImages} className="ghost-btn">
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && !hasImages && <div className="empty-state">No images to show just yet.</div>}

        {!isLoading && !error && hasImages && (
          <div className="gallery-viewer">
            <div
              className="viewer-main"
              aria-live="polite"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <button
                type="button"
                className="viewer-nav viewer-nav--prev"
                onClick={goPrev}
                disabled={!canNavigate}
                aria-label="Previous image"
              >
                {'<'}
              </button>
              {activeImage ? (
                <img src={activeImage} alt={`Gallery image ${activeIndex + 1}`} loading="eager" />
              ) : (
                <div className="viewer-placeholder">No image</div>
              )}
              <button
                type="button"
                className="viewer-nav viewer-nav--next"
                onClick={goNext}
                disabled={!canNavigate}
                aria-label="Next image"
              >
                {'>'}
              </button>
              <div className="viewer-count">
                {activeIndex + 1} / {images.length}
              </div>
            </div>

            <div className="thumb-grid" role="list" aria-label="Gallery images">
              {images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  className={`thumb ${index === activeIndex ? 'thumb--active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={index === activeIndex}
                >
                  <img src={src} alt={`Gallery thumbnail ${index + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
            <p className="gallery-footer">
              Want your image featured here? <a href="mailto:hello@wildroseplains.com">Email us</a> with a picture of your order.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

