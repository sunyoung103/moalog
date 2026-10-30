/**
 * Moalog Zero-Cost Client-Side Background Removal & Sticker Engine
 * 100% Client-Side Canvas 2D image processing (0 API costs, runs offline)
 */

export interface CutoutOptions {
  tolerance?: number; // 10 to 80 (default ~32)
  feather?: number; // 0 to 4 (default 2)
  protectCenter?: boolean; // Protects center subject from over-erasing
  strokeWidth?: number; // 0 (none), 3 (thin), 5 (medium), 8 (thick)
  strokeColor?: string; // default '#ffffff'
  addShadow?: boolean;
}

/**
 * Creates a clean procedural canvas placeholder image when src is missing or fails to load
 */
export function createFallbackSpecimenImage(label = '생태 표본'): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Soft naturalist background
      ctx.fillStyle = '#1C1917';
      ctx.fillRect(0, 0, 600, 600);

      // Radial glowing ring
      const grad = ctx.createRadialGradient(300, 300, 40, 300, 300, 220);
      grad.addColorStop(0, '#2E7D32');
      grad.addColorStop(0.7, '#14532D');
      grad.addColorStop(1, '#1C1917');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(300, 300, 200, 0, Math.PI * 2);
      ctx.fill();

      // Botanical Leaf Illustration
      ctx.strokeStyle = '#86EFAC';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(300, 300, 70, 130, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(210, 390);
      ctx.lineTo(390, 210);
      ctx.stroke();

      // Text label
      ctx.fillStyle = '#F5F5F4';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, 300, 480);
    }

    const fallback = new Image();
    fallback.onload = () => resolve(fallback);
    fallback.src = canvas.toDataURL('image/png');
  });
}

/**
 * Safely loads any image URL or Data URL into an HTMLImageElement
 */
export function loadImage(src?: string, fallbackLabel = '생태 표본'): Promise<HTMLImageElement> {
  if (!src || src.trim() === '') {
    return createFallbackSpecimenImage(fallbackLabel);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback without crossOrigin if CORS issues occur
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => {
        // Fallback to beautiful procedural canvas if network or domain fails
        createFallbackSpecimenImage(fallbackLabel).then(resolve);
      };
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

/**
 * Creates a canvas with standard working dimensions
 */
export function imageToCanvas(img: HTMLImageElement, maxDimension = 800): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  let width = img.naturalWidth || img.width || 600;
  let height = img.naturalHeight || img.height || 600;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    ctx.drawImage(img, 0, 0, width, height);
  }
  return canvas;
}

/**
 * Clones a canvas
 */
export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    ctx.drawImage(source, 0, 0);
  }
  return canvas;
}

/**
 * Calculate Euclidean color distance between two RGB colors
 */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const rDiff = r1 - r2;
  const gDiff = g1 - g2;
  const bDiff = b1 - b2;
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

/**
 * Intelligent Auto Background Removal (100% Client-side zero cost)
 */
export function autoRemoveBackground(
  sourceCanvas: HTMLCanvasElement,
  options: CutoutOptions = {}
): HTMLCanvasElement {
  const {
    tolerance = 32,
    feather = 2,
    protectCenter = true,
    strokeWidth = 0,
    strokeColor = '#ffffff',
    addShadow = false,
  } = options;

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  // Work on a copy
  const workCanvas = document.createElement('canvas');
  workCanvas.width = width;
  workCanvas.height = height;
  const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Sample perimeter background reference colors (corners and border strips)
  const samplePoints: [number, number][] = [];
  const borderMargin = Math.min(10, Math.floor(Math.min(width, height) * 0.05));

  // 4 corners
  samplePoints.push([borderMargin, borderMargin]);
  samplePoints.push([width - 1 - borderMargin, borderMargin]);
  samplePoints.push([borderMargin, height - 1 - borderMargin]);
  samplePoints.push([width - 1 - borderMargin, height - 1 - borderMargin]);
  // Border midpoints
  samplePoints.push([Math.floor(width / 2), borderMargin]);
  samplePoints.push([Math.floor(width / 2), height - 1 - borderMargin]);
  samplePoints.push([borderMargin, Math.floor(height / 2)]);
  samplePoints.push([width - 1 - borderMargin, Math.floor(height / 2)]);

  const bgColors: { r: number; g: number; b: number }[] = [];
  for (const [sx, sy] of samplePoints) {
    const idx = (sy * width + sx) * 4;
    bgColors.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }

  // 2. Flood fill mask from perimeter
  const visited = new Uint8Array(width * height);
  const isBackground = new Uint8Array(width * height);
  const queue: number[] = [];

  const pushToQueue = (x: number, y: number) => {
    const pos = y * width + x;
    if (!visited[pos]) {
      visited[pos] = 1;
      queue.push(pos);
    }
  };

  // Seed top and bottom borders
  for (let x = 0; x < width; x++) {
    pushToQueue(x, 0);
    pushToQueue(x, height - 1);
  }
  // Seed left and right borders
  for (let y = 0; y < height; y++) {
    pushToQueue(0, y);
    pushToQueue(width - 1, y);
  }

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy);
  const tolDist = tolerance * 4.41; // Map 0-100 to ~0-441 RGB distance

  let head = 0;
  while (head < queue.length) {
    const pos = queue[head++];
    const x = pos % width;
    const y = Math.floor(pos / width);
    const idx = pos * 4;

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Distance from center factor
    const distFromCenter = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / maxRadius;
    let localTolerance = tolDist;

    if (protectCenter) {
      // In center 45%, reduce threshold so we don't accidentally bite into specimen flowers/leaves
      if (distFromCenter < 0.45) {
        localTolerance *= 0.6;
      } else if (distFromCenter < 0.7) {
        localTolerance *= 0.85;
      }
    }

    // Check if pixel matches any background sample color
    let isBgPixel = false;
    for (const bg of bgColors) {
      if (colorDistance(r, g, b, bg.r, bg.g, bg.b) <= localTolerance) {
        isBgPixel = true;
        break;
      }
    }

    // If near the absolute outer border (within 2%), be slightly more lenient
    if (!isBgPixel && (x <= 2 || x >= width - 3 || y <= 2 || y >= height - 3)) {
      const minDistance = Math.min(
        ...bgColors.map((bg) => colorDistance(r, g, b, bg.r, bg.g, bg.b))
      );
      if (minDistance <= localTolerance * 1.3) {
        isBgPixel = true;
      }
    }

    if (isBgPixel) {
      isBackground[pos] = 1;

      // Expand neighbors
      if (x > 0) pushToQueue(x - 1, y);
      if (x < width - 1) pushToQueue(x + 1, y);
      if (y > 0) pushToQueue(x, y - 1);
      if (y < height - 1) pushToQueue(x, y + 1);
    }
  }

  // 3. Apply alpha transparency
  for (let i = 0; i < width * height; i++) {
    if (isBackground[i]) {
      data[i * 4 + 3] = 0; // Transparent
    }
  }

  // 4. Soft Feathering (Anti-Aliasing on boundary pixels)
  if (feather > 0) {
    const alphaCopy = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      alphaCopy[i] = data[i * 4 + 3];
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pos = y * width + x;
        const currentA = alphaCopy[pos];

        // Check if on edge
        if (currentA > 0) {
          const neighbors = [
            alphaCopy[pos - 1],
            alphaCopy[pos + 1],
            alphaCopy[pos - width],
            alphaCopy[pos + width],
          ];
          const hasTransparentNeighbor = neighbors.some((a) => a === 0);

          if (hasTransparentNeighbor) {
            // Soften boundary
            data[pos * 4 + 3] = Math.round(currentA * 0.7);
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 5. If strokeWidth > 0, generate physical white sticker outline
  if (strokeWidth > 0) {
    return applyStickerBorder(workCanvas, strokeWidth, strokeColor, addShadow);
  }

  return workCanvas;
}

/**
 * Generates a crisp die-cut physical sticker border (White outline + soft drop shadow)
 */
export function applyStickerBorder(
  cutoutCanvas: HTMLCanvasElement,
  borderWidth = 5,
  borderColor = '#ffffff',
  addShadow = true
): HTMLCanvasElement {
  const padding = borderWidth * 2 + 10;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = cutoutCanvas.width + padding * 2;
  outCanvas.height = cutoutCanvas.height + padding * 2;

  const ctx = outCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return cutoutCanvas;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = outCanvas.width;
  tempCanvas.height = outCanvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return cutoutCanvas;

  // Draw shadow if requested
  if (addShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
  }

  // Draw multiple expanded silhouette circles to create a thick smooth stroke
  const steps = 16;
  tempCtx.fillStyle = borderColor;

  for (let r = 1; r <= borderWidth; r += 1.2) {
    for (let i = 0; i < steps; i++) {
      const angle = (i * 2 * Math.PI) / steps;
      const dx = Math.cos(angle) * r;
      const dy = Math.sin(angle) * r;

      // Draw silhouette as mask
      tempCtx.drawImage(cutoutCanvas, padding + dx, padding + dy);
    }
  }

  // Composite solid white color over the expanded silhouette
  tempCtx.globalCompositeOperation = 'source-in';
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.globalCompositeOperation = 'source-over';

  // Draw border outline onto main canvas
  ctx.drawImage(tempCanvas, 0, 0);

  // Reset shadow before drawing the crisp foreground subject
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw original cutout on top
  ctx.drawImage(cutoutCanvas, padding, padding);

  return outCanvas;
}

/**
 * Magic Wand Tap: Flood fills and erases color matching the tapped pixel
 */
export function magicWandErase(
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  tolerance = 30
): HTMLCanvasElement {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const startPos = (startY * width + startX) * 4;
  const targetR = data[startPos];
  const targetG = data[startPos + 1];
  const targetB = data[startPos + 2];
  const targetA = data[startPos + 3];

  if (targetA === 0) return canvas; // Already transparent

  const visited = new Uint8Array(width * height);
  const queue = [startY * width + startX];
  visited[startY * width + startX] = 1;

  const tolDist = tolerance * 4.41;
  let head = 0;

  while (head < queue.length) {
    const pos = queue[head++];
    const x = pos % width;
    const y = Math.floor(pos / width);
    const idx = pos * 4;

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    if (a > 0 && colorDistance(r, g, b, targetR, targetG, targetB) <= tolDist) {
      data[idx + 3] = 0; // Erase to transparent

      // Check 4 neighbors
      if (x > 0 && !visited[pos - 1]) {
        visited[pos - 1] = 1;
        queue.push(pos - 1);
      }
      if (x < width - 1 && !visited[pos + 1]) {
        visited[pos + 1] = 1;
        queue.push(pos + 1);
      }
      if (y > 0 && !visited[pos - width]) {
        visited[pos - width] = 1;
        queue.push(pos - width);
      }
      if (y < height - 1 && !visited[pos + width]) {
        visited[pos + width] = 1;
        queue.push(pos + width);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Brush Tool: Erase or Restore pixels with a circular brush
 */
export function brushAction(
  targetCanvas: HTMLCanvasElement,
  originalCanvas: HTMLCanvasElement,
  centerX: number,
  centerY: number,
  radius: number,
  mode: 'erase' | 'restore'
): void {
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  const origCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !origCtx) return;

  const width = targetCanvas.width;
  const height = targetCanvas.height;

  const startX = Math.max(0, Math.floor(centerX - radius));
  const startY = Math.max(0, Math.floor(centerY - radius));
  const endX = Math.min(width - 1, Math.ceil(centerX + radius));
  const endY = Math.min(height - 1, Math.ceil(centerY + radius));

  const boxW = endX - startX + 1;
  const boxH = endY - startY + 1;
  if (boxW <= 0 || boxH <= 0) return;

  const imgData = ctx.getImageData(startX, startY, boxW, boxH);
  const origData = origCtx.getImageData(startX, startY, boxW, boxH);
  const data = imgData.data;
  const oData = origData.data;

  const rSq = radius * radius;

  for (let y = 0; y < boxH; y++) {
    for (let x = 0; x < boxW; x++) {
      const curX = startX + x;
      const curY = startY + y;
      const dSq = (curX - centerX) * (curX - centerX) + (curY - centerY) * (curY - centerY);

      if (dSq <= rSq) {
        const idx = (y * boxW + x) * 4;
        if (mode === 'erase') {
          // Soft edge feathering
          const distRatio = Math.sqrt(dSq) / radius;
          if (distRatio > 0.8) {
            data[idx + 3] = Math.round(data[idx + 3] * (1 - (distRatio - 0.8) * 5));
          } else {
            data[idx + 3] = 0;
          }
        } else {
          // Restore original pixel
          data[idx] = oData[idx];
          data[idx + 1] = oData[idx + 1];
          data[idx + 2] = oData[idx + 2];
          data[idx + 3] = oData[idx + 3];
        }
      }
    }
  }

  ctx.putImageData(imgData, startX, startY);
}

/**
 * Extracts 5 dominant nature hex colors from non-transparent specimen pixels
 */
export function extractDominantPalette(canvas: HTMLCanvasElement, count = 5): string[] {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return ['#2E7D32', '#7CB342', '#E6C229', '#3E2723', '#F9FBE7'];

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const colorCounts: { [key: string]: { r: number; g: number; b: number; count: number } } = {};
  const step = 4; // Sample every 4th pixel for speed

  for (let i = 0; i < data.length; i += 4 * step) {
    const a = data[i + 3];
    if (a < 128) continue; // Skip transparent/semi-transparent

    const r = Math.round(data[i] / 24) * 24;
    const g = Math.round(data[i + 1] / 24) * 24;
    const b = Math.round(data[i + 2] / 24) * 24;

    const key = `${r},${g},${b}`;
    if (!colorCounts[key]) {
      colorCounts[key] = { r, g, b, count: 0 };
    }
    colorCounts[key].count++;
  }

  const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count);
  const results: string[] = [];

  for (const c of sorted) {
    const hex = `#${((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1).toUpperCase()}`;
    if (!results.includes(hex)) {
      results.push(hex);
    }
    if (results.length >= count) break;
  }

  return results.length >= count
    ? results
    : [...results, '#2E7D32', '#7CB342', '#E6C229', '#3E2723', '#F9FBE7'].slice(0, count);
}
