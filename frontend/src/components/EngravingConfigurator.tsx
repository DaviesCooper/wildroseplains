import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { EngravingMethod, Face } from '../lib/api';
import { DeckBoxRenderer } from './DeckBoxRenderer';

export type FaceEngraving = {
  method: EngravingMethod;
  uploadFile: File | null;
  text: string;
  font: string;
  size: string;
  alignment: 'left' | 'center' | 'right';
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  imageFit: 'fit' | 'fill' | 'stretch';
};

type EngravingConfiguratorProps = {
  faces: Face[];
  faceEngravings: Record<Face, FaceEngraving>;
  onChange: (next: Record<Face, FaceEngraving>) => void;
};

export const EngravingConfigurator = ({
  faces,
  faceEngravings,
  onChange,
}: EngravingConfiguratorProps) => {
  const fontOptions = [
    { label: 'System Sans (Segoe/Helvetica/Arial)', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' },
    { label: 'System Serif (Times/Baskerville)', value: '"Times New Roman", "Times", Georgia, "Baskerville", "Palatino Linotype", serif' },
    { label: 'System Mono (SFMono/Consolas)', value: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace' },
    { label: 'Arial', value: 'Arial, "Helvetica Neue", Helvetica, sans-serif' },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
    { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
    { label: 'Trebuchet MS', value: '"Trebuchet MS", "Helvetica Neue", Helvetica, sans-serif' },
    { label: 'Helvetica', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
    { label: 'Segoe UI', value: '"Segoe UI", "Helvetica Neue", Arial, sans-serif' },
    { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Garamond', value: 'Garamond, "Times New Roman", serif' },
    { label: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
    { label: 'Courier New', value: '"Courier New", Courier, monospace' },
    { label: 'Consolas', value: 'Consolas, "Liberation Mono", Menlo, monospace' },
    { label: 'Menlo', value: 'Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
    { label: 'Monaco', value: 'Monaco, Menlo, Consolas, "Liberation Mono", monospace' },
  ];

  const horizontalAlignmentOptions: FaceEngraving['alignment'][] = ['left', 'center', 'right'];
  const alignmentIconMap: Record<FaceEngraving['alignment'], string> = {
    left: '/align-left.png',
    center: '/align-center.png',
    right: '/align-right.png',
  };
  const placementOptions: FaceEngraving['placement'][] = ['top', 'left', 'center', 'right', 'bottom'];
  const placementIconMap: Record<FaceEngraving['placement'], string> = {
    top: '/arrow.png',
    bottom: '/arrow.png',
    left: '/arrow.png',
    right: '/arrow.png',
    center: '/centered.png',
  };
  const imageFitOptions: { id: FaceEngraving['imageFit']; label: string }[] = [
    { id: 'fit', label: 'Fit' },
    { id: 'fill', label: 'Fill' },
    { id: 'stretch', label: 'Stretch' },
  ];

  const engravingMethods: { id: EngravingMethod; label: string; helper: string }[] = [
    { id: 'upload', label: 'Upload', helper: 'SVG, PNG, JPEG, or BMP under 10MB' },
    { id: 'text', label: 'Text', helper: 'Add text with your font + size' },
  ];

  const [activeFaceIndex, setActiveFaceIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const activeFace = faces[activeFaceIndex];

  const goToFace = (index: number) => {
    const faceCount = faces.length;
    const normalizedIndex = ((index % faceCount) + faceCount) % faceCount;
    setActiveFaceIndex(normalizedIndex);
  };

  const handleNextFace = () => {
    goToFace(activeFaceIndex + 1);
  };

  const handlePrevFace = () => {
    goToFace(activeFaceIndex - 1);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        handlePrevFace();
      } else {
        handleNextFace();
      }
    }
    setTouchStartX(null);
  };

  const updateFaceEngraving = (face: Face, updates: Partial<FaceEngraving>) => {
    const current = faceEngravings[face];
    if (!current) return;
    onChange({
      ...faceEngravings,
      [face]: {
        ...current,
        ...updates,
      },
    });
  };

  const handleUploadChange = (face: Face, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    updateFaceEngraving(face, { uploadFile: file });
  };

  const handleTextChange = (face: Face, value: string) => {
    updateFaceEngraving(face, { text: value });
  };

  const handleFontChange = (face: Face, value: string) => {
    updateFaceEngraving(face, { font: value });
  };

  const handleSizeChange = (face: Face, value: string) => {
    updateFaceEngraving(face, { size: value });
  };

  const handleAlignmentChange = (face: Face, value: FaceEngraving['alignment']) => {
    updateFaceEngraving(face, { alignment: value });
  };

  const handlePlacementChange = (face: Face, value: FaceEngraving['placement']) => {
    updateFaceEngraving(face, { placement: value });
  };

  const toggleFormat = (face: Face, key: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    const current = faceEngravings[face];
    if (!current) return;
    updateFaceEngraving(face, { [key]: !current[key] } as Partial<FaceEngraving>);
  };

  const handleImageFitChange = (face: Face, value: FaceEngraving['imageFit']) => {
    updateFaceEngraving(face, { imageFit: value });
  };

  const helperText = useMemo(
    () => engravingMethods.find((method) => method.id === faceEngravings[activeFace]?.method)?.helper,
    [activeFace, engravingMethods, faceEngravings],
  );

  const renderFieldsForFace = (face: Face) => {
    const engraving = faceEngravings[face];
    const isActive = face === activeFace;

    if (!engraving) return null;

    if (engraving.method === 'upload') {
      const uploadInputKey = `${face}-upload`;
      const inputId = `${face}-upload-input`;
      return (
        <div className="input-stack" hidden={!isActive} aria-hidden={!isActive}>
          <input
            key={uploadInputKey}
            id={inputId}
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.bmp"
            className="sr-only"
            onChange={(event) => handleUploadChange(face, event)}
          />
          <div className="file-row">
            <label htmlFor={inputId} className="file-btn">
              Choose File
            </label>
            <span className="file-name" aria-live="polite">
              {engraving.uploadFile?.name ?? 'No file chosen'}
            </span>
          </div>
          <div className="engraving-format-row" role="group" aria-label="Image fit">
            {imageFitOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`engraving-format-btn ${engraving.imageFit === option.id ? 'engraving-format-btn--active' : ''}`}
                aria-pressed={engraving.imageFit === option.id}
                onClick={() => handleImageFitChange(face, option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="input-stack" hidden={!isActive} aria-hidden={!isActive}>
        <textarea
          rows={3}
          placeholder="Your text"
          value={engraving.text}
          onChange={(event) => handleTextChange(face, event.target.value)}
        />
        <div className="engraving-text-row">
          <label className="form-field">
            <span className="label">Font</span>
            <select value={engraving.font} onChange={(event) => handleFontChange(face, event.target.value)}>
              <option value="">Select a font</option>
              {fontOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  style={{ fontFamily: option.value }}
                  title={option.label}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field form-field--compact">
            <span className="label">Font size</span>
            <input
              type="number"
              min={8}
              max={128}
              step={1}
              placeholder="Size"
              value={engraving.size}
              onChange={(event) => handleSizeChange(face, event.target.value)}
            />
          </label>
        </div>
        <div className="engraving-controls">
          <div className="engraving-control-row">
            <div className="engraving-format-row" role="group" aria-label="Text formatting">
              <button
                type="button"
                className={`engraving-format-btn ${engraving.bold ? 'engraving-format-btn--active' : ''}`}
                aria-pressed={engraving.bold}
                onClick={() => toggleFormat(face, 'bold')}
                title="Bold"
                style={{ fontWeight: 800 }}
              >
                B
              </button>
              <button
                type="button"
                className={`engraving-format-btn ${engraving.italic ? 'engraving-format-btn--active' : ''}`}
                aria-pressed={engraving.italic}
                onClick={() => toggleFormat(face, 'italic')}
                title="Italic"
                style={{ fontStyle: 'italic' }}
              >
                I
              </button>
              <button
                type="button"
                className={`engraving-format-btn ${engraving.underline ? 'engraving-format-btn--active' : ''}`}
                aria-pressed={engraving.underline}
                onClick={() => toggleFormat(face, 'underline')}
                title="Underline"
                style={{ textDecoration: 'underline' }}
              >
                U
              </button>
              <button
                type="button"
                className={`engraving-format-btn ${engraving.strikethrough ? 'engraving-format-btn--active' : ''}`}
                aria-pressed={engraving.strikethrough}
                onClick={() => toggleFormat(face, 'strikethrough')}
                title="Strikethrough"
                style={{ textDecoration: 'line-through' }}
              >
                S
              </button>
            </div>
            <div className="engraving-toggle-group" role="group" aria-label="Horizontal text alignment">
              {horizontalAlignmentOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`engraving-toggle-btn ${
                    engraving.alignment === option ? 'engraving-toggle-btn--active' : ''
                  }`}
                  aria-pressed={engraving.alignment === option}
                  onClick={() => handleAlignmentChange(face, option)}
                >
                  <img src={alignmentIconMap[option]} alt={`${option} align`} className="engraving-toggle-icon" />
                </button>
              ))}
            </div>
            <div className="engraving-placement-grid" role="group" aria-label="Text placement">
              {placementOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`engraving-toggle-btn placement-${option} ${
                    engraving.placement === option ? 'engraving-toggle-btn--active' : ''
                  }`}
                  aria-pressed={engraving.placement === option}
                  onClick={() => handlePlacementChange(face, option)}
                >
                  <img
                    src={placementIconMap[option]}
                    alt=""
                    aria-hidden="true"
                    className={`placement-icon placement-icon--${option} ${
                      option === 'center' ? 'placement-icon--center' : 'placement-icon--arrow'
                    }`}
                  />
                  <span className="sr-only">{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="panel panel--stretch engraving-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Engraving</p>
        </div>
      </div>
      <div className="engraving-carousel">
        <div className="engraving-bar">
          <div className="engraving-dots" aria-label="Select face">
            {faces.map((face, index) => (
              <button
                key={face}
                type="button"
                className={`engraving-dot ${index === activeFaceIndex ? 'engraving-dot--active' : ''}`}
                onClick={() => goToFace(index)}
                aria-label={`Show ${face}`}
              >
                <span className="sr-only">{face}</span>
              </button>
            ))}
          </div>
          <div className="method-help">
            <button type="button" className="method-help__btn" aria-label="Engraving help">
              ?
            </button>
            <div className="method-help__tooltip" role="tooltip">
              If these options are insufficient for your needs, <a href="/contact">contact us</a> for custom orders.
            </div>
          </div>
        </div>
        <div className="engraving-card" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="engraving-card__header">
            <div>
              <p className="label">Face</p>
              <h3>{activeFace}</h3>
            </div>
            <div className="method-toggle">
              {engravingMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  className={`method-toggle__btn ${
                    faceEngravings[activeFace]?.method === method.id ? 'method-toggle__btn--active' : ''
                  }`}
                  onClick={() => updateFaceEngraving(activeFace, { method: method.id })}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>
          <div className="engraving-card__body">
            <div className="engraving-card__form">
              <p className="caption">{helperText}</p>
              {renderFieldsForFace(activeFace)}
              <div className="engraving-card__nav">
                <button type="button" className="nav-btn" onClick={handlePrevFace} aria-label="Previous face">
                  ‹
                </button>
                <span className="caption">
                  {activeFaceIndex + 1} / {faces.length}
                </span>
                <button type="button" className="nav-btn" onClick={handleNextFace} aria-label="Next face">
                  ›
                </button>
              </div>
            </div>
            <div className="engraving-card__orientation">
            <DeckBoxRenderer
              activeFace={activeFace}
              widthIn={3.25}
              heightIn={4.125}
              depthIn={3.1875}
              faceEngravings={faceEngravings}
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

