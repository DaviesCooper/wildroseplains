import { useEffect, useMemo, useRef } from 'react';
import type { TouchEvent } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Face } from '../lib/api';
import type { FaceEngraving } from './EngravingConfigurator';

type DeckBoxRendererProps = {
  activeFace: Face;
  widthIn: number;
  heightIn: number;
  depthIn: number;
  faceEngravings: Record<Face, FaceEngraving>;
};

const materialIndexToFace: Face[] = ['Right', 'Left', 'Lid', 'Bottom', 'Front', 'Back'];
const baseColor = 0xe8dec8;
const activeColor = 0xd8c17a;
const activeEmissive = 0x90752d;
const edgeColor = 0x6f5b3a;

export const DeckBoxRenderer = ({ activeFace, widthIn, heightIn, depthIn, faceEngravings }: DeckBoxRendererProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const materialRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const orientationFrameRef = useRef<number | null>(null);
  const textureDisposersRef = useRef<(() => void)[]>([]);
  const imageBitmapDisposersRef = useRef<(() => void)[]>([]);

  const boxDimensions = useMemo(
    () => ({
      width: widthIn,
      height: heightIn,
      depth: depthIn,
    }),
    [depthIn, heightIn, widthIn],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    // Clear any previous renderer (helps during HMR/StrictMode double effects)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    const fitCameraToBox = () => {
      const fitOffset = 1.35;
      const fov = (camera.fov * Math.PI) / 180;
      const maxDim = Math.max(boxDimensions.width, boxDimensions.height, boxDimensions.depth);
      const distance = (maxDim / 2 / Math.tan(fov / 2)) * fitOffset;
      camera.position.set(0, 0, distance);
      camera.near = distance / 50;
      camera.far = distance * 50;
      camera.updateProjectionMatrix();
      controlsRef.current?.target.set(0, 0, 0);
      controlsRef.current?.saveState();
    };

    const mountRenderer = () => {
      const measuredWidth = container.clientWidth;
      const width = measuredWidth > 0 ? measuredWidth : 260;
      const height = Math.max(container.clientHeight, 220);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      fitCameraToBox();
    };

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    container.appendChild(renderer.domElement);
    mountRenderer();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(6, 8, 5);
    scene.add(ambientLight, keyLight);

    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    const geometry = new THREE.BoxGeometry(boxDimensions.width, boxDimensions.height, boxDimensions.depth);
    materialRefs.current = materialIndexToFace.map(
      () =>
        new THREE.MeshStandardMaterial({
          color: baseColor,
          metalness: 0.05,
          roughness: 0.68,
        }),
    );

    const mesh = new THREE.Mesh(geometry, materialRefs.current);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);

    const edges = new THREE.EdgesGeometry(geometry);
    const outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: edgeColor }));
    group.add(outline);

    group.rotation.set(0, 0, 0);

    controlsRef.current = new OrbitControls(camera, renderer.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.08;
    controlsRef.current.rotateSpeed = 0.9;
    controlsRef.current.enablePan = false;
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
    controlsRef.current.saveState();

    let isDisposed = false;

    const animate = () => {
      if (isDisposed) return;
      controlsRef.current?.update();
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      mountRenderer();
      renderer.render(scene, camera);
    };

    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserverRef.current?.disconnect();
      window.removeEventListener('resize', handleResize);
      resizeObserverRef.current = null;
      controlsRef.current?.dispose();
      controlsRef.current = null;
      if (orientationFrameRef.current) {
        cancelAnimationFrame(orientationFrameRef.current);
        orientationFrameRef.current = null;
      }
      materialRefs.current.forEach((material) => material.dispose());
      textureDisposersRef.current.forEach((dispose) => dispose());
      textureDisposersRef.current = [];
      imageBitmapDisposersRef.current.forEach((dispose) => dispose());
      imageBitmapDisposersRef.current = [];
      geometry.dispose();
      edges.dispose();
      outline.geometry.dispose();
      (outline.material as THREE.Material).dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      groupRef.current = null;
    };
  }, [boxDimensions.depth, boxDimensions.height, boxDimensions.width]);

  useEffect(() => {
    materialRefs.current.forEach((material, index) => {
      const faceName = materialIndexToFace[index];
      const isActive = faceName === activeFace;
      material.color.setHex(isActive ? activeColor : baseColor);
      material.emissive.setHex(isActive ? activeEmissive : 0x000000);
      material.needsUpdate = true;
    });
  }, [activeFace]);

  const createTextTexture = (engraving?: FaceEngraving) => {
    if (!engraving || engraving.method !== 'text' || !engraving.text.trim()) return null;

    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    const size = 512;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const fontSize = Number(engraving.size) || 70;
    const weight = engraving.bold ? '700' : '400';
    const style = engraving.italic ? 'italic' : 'normal';
    const fontFamily = engraving.font?.trim() || 'Arial, sans-serif';
    ctx.font = `${style} ${weight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#2f3341';

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const placement = engraving.placement ?? 'center';
    const positions: Record<FaceEngraving['placement'], { x: number; y: number }> = {
      center: { x: size / 2, y: size / 2 },
      top: { x: size / 2, y: size * 0.2 },
      bottom: { x: size / 2, y: size * 0.8 },
      left: { x: size * 0.05, y: size / 2 },
      right: { x: size * 0.95, y: size / 2 },
    };
    const anchor = positions[placement] ?? positions.center;

    const lines = engraving.text.replace(/\r\n/g, '\n').split('\n');
    const lineHeight = fontSize * 1.2;
    const totalHeight = lineHeight * lines.length;

    const measureLine = (line: string) => {
      const metrics = ctx.measureText(line || ' ');
      const ascent = metrics.actualBoundingBoxAscent ?? fontSize * 0.75;
      const descent = metrics.actualBoundingBoxDescent ?? fontSize * 0.25;
      return { ascent, descent, width: metrics.width };
    };

    const lineMetrics = lines.map(measureLine);
    const textWidth = Math.max(1, Math.max(...lineMetrics.map((m) => m.width)));
    const textHeight = totalHeight;

    const padding = Math.max(0, Math.min(8, fontSize * 0.1));
    const boxWidth = textWidth + padding * 2;
    const boxHeight = textHeight + padding * 2;

    const textCanvas = document.createElement('canvas');
    textCanvas.width = boxWidth * dpr;
    textCanvas.height = boxHeight * dpr;
    const textCtx = textCanvas.getContext('2d');
    if (!textCtx) return null;
    textCtx.scale(dpr, dpr);
    textCtx.font = ctx.font;
    textCtx.fillStyle = ctx.fillStyle;
    textCtx.strokeStyle = '#2f3341';
    textCtx.lineWidth = Math.max(1, fontSize * 0.06);
    textCtx.textBaseline = 'alphabetic';

    const align = engraving.alignment;
    textCtx.textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
    const anchorXInBox = align === 'left' ? padding : align === 'right' ? boxWidth - padding : boxWidth / 2;
    const boxTop = padding;

    lines.forEach((line, index) => {
      const { ascent, descent, width } = lineMetrics[index];
      const baselineY = boxTop + lineHeight * index + lineHeight / 2 + (ascent - descent) / 2;

      textCtx.fillText(line, anchorXInBox, baselineY);

      const startX =
        align === 'left' ? anchorXInBox : align === 'right' ? anchorXInBox - width : anchorXInBox - width / 2;
      const endX = startX + width;

      if (engraving.underline) {
        const underlineY = baselineY + descent + 2;
        textCtx.beginPath();
        textCtx.moveTo(startX, underlineY);
        textCtx.lineTo(endX, underlineY);
        textCtx.stroke();
      }

      if (engraving.strikethrough) {
        const strikeY = baselineY - ascent * 0.35;
        textCtx.beginPath();
        textCtx.moveTo(startX, strikeY);
        textCtx.lineTo(endX, strikeY);
        textCtx.stroke();
      }
    });

    const offsets = {
      center: { x: -boxWidth / 2, y: -boxHeight / 2 },
      top: { x: -boxWidth / 2, y: -boxHeight },
      bottom: { x: -boxWidth / 2, y: 0 },
      left: { x: 0, y: -boxHeight / 2 },
      right: { x: -boxWidth, y: -boxHeight / 2 },
    };

    const offset = offsets[placement] ?? offsets.center;
    let drawX = anchor.x + offset.x;
    let drawY = anchor.y + offset.y;

    drawX = Math.min(Math.max(0, drawX), size - boxWidth);
    drawY = Math.min(Math.max(0, drawY), size - boxHeight);

    ctx.drawImage(textCanvas, drawX, drawY, boxWidth, boxHeight);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  };

  const createUploadTexture = async (engraving?: FaceEngraving) => {
    if (!engraving || engraving.method !== 'upload' || !engraving.uploadFile) return null;
    try {
      const bitmap = await createImageBitmap(engraving.uploadFile);
      const canvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      const size = 512;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        return null;
      }
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);
      ctx.filter = 'grayscale(1)';

      const imgW = bitmap.width;
      const imgH = bitmap.height;
      const fit = engraving.imageFit ?? 'fit';
      let drawW = size;
      let drawH = size;
      if (fit === 'fit') {
        const scale = Math.min(size / imgW, size / imgH);
        drawW = imgW * scale;
        drawH = imgH * scale;
      } else if (fit === 'fill') {
        const scale = Math.max(size / imgW, size / imgH);
        drawW = imgW * scale;
        drawH = imgH * scale;
      }
      const dx = (size - drawW) / 2;
      const dy = (size - drawH) / 2;
      ctx.drawImage(bitmap, 0, 0, imgW, imgH, dx, dy, drawW, drawH);

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 4;
      texture.needsUpdate = true;

      const dispose = () => bitmap.close();
      return { texture, dispose };
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (!materialRefs.current.length) return;

    let isCancelled = false;

    const updateTextures = async () => {
      const disposers: (() => void)[] = [];
      const bitmapDisposers: (() => void)[] = [];

      for (let i = 0; i < materialRefs.current.length; i += 1) {
        const material = materialRefs.current[i];
        const faceName = materialIndexToFace[i];
        const engraving = faceEngravings[faceName];

        if (material.map) {
          material.map.dispose();
          material.map = null;
        }

        let texture: THREE.Texture | null = null;
        let bitmapDispose: (() => void) | undefined;
        if (engraving?.method === 'upload') {
          const result = await createUploadTexture(engraving);
          if (result) {
            texture = result.texture;
            bitmapDispose = result.dispose;
          }
        } else {
          texture = createTextTexture(engraving);
        }

        if (isCancelled) {
          texture?.dispose();
          continue;
        }

        if (texture) {
          material.map = texture;
          material.needsUpdate = true;
          disposers.push(() => texture.dispose());
        } else {
          material.map = null;
          material.needsUpdate = true;
        }

        if (bitmapDispose) {
          bitmapDisposers.push(bitmapDispose);
        }
      }

      if (isCancelled) {
        disposers.forEach((dispose) => dispose());
        bitmapDisposers.forEach((dispose) => dispose());
        return;
      }

      textureDisposersRef.current.forEach((dispose) => dispose());
      textureDisposersRef.current = disposers;

      imageBitmapDisposersRef.current.forEach((dispose) => dispose());
      imageBitmapDisposersRef.current = bitmapDisposers;
    };

    updateTextures();

    return () => {
      isCancelled = true;
    };
  }, [faceEngravings]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const targetEuler = (() => {
      switch (activeFace) {
        case 'Front':
          return new THREE.Euler(0, 0, 0);
        case 'Back':
          return new THREE.Euler(0, Math.PI, 0);
        case 'Right':
          return new THREE.Euler(0, -Math.PI / 2, 0);
        case 'Left':
          return new THREE.Euler(0, Math.PI / 2, 0);
        case 'Lid':
          return new THREE.Euler(Math.PI / 2, 0, 0);
        case 'Bottom':
          return new THREE.Euler(-Math.PI / 2, 0, 0);
        default:
          return new THREE.Euler(0, 0, 0);
      }
    })();

    controlsRef.current?.reset();
    controlsRef.current?.update();

    if (orientationFrameRef.current) {
      cancelAnimationFrame(orientationFrameRef.current);
    }

    const startQuat = group.quaternion.clone();
    const endQuat = new THREE.Quaternion().setFromEuler(targetEuler);
    const duration = 200;
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const t = Math.min((timestamp - start) / duration, 1);
      group.quaternion.copy(startQuat).slerp(endQuat, t);
      group.rotation.setFromQuaternion(group.quaternion);
      if (t < 1) {
        orientationFrameRef.current = requestAnimationFrame(step);
      } else {
        orientationFrameRef.current = null;
      }
    };

    orientationFrameRef.current = requestAnimationFrame(step);
  }, [activeFace]);

  const stopTouchPropagation = (event: TouchEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      className="engraving-3d"
      ref={containerRef}
      role="presentation"
      aria-label="3D deck box preview"
      onTouchStart={stopTouchPropagation}
      onTouchMove={stopTouchPropagation}
      onTouchEnd={stopTouchPropagation}
    />
  );
};

