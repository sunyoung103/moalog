export type ImageQualityIssue = 'low_resolution' | 'blurry' | 'too_dark' | 'overexposed';

export interface ImageQualityReport {
  qualityScore: number; // 0 - 100
  isLowQuality: boolean;
  issues: ImageQualityIssue[];
  width: number;
  height: number;
  meanLuminance: number;
  sharpnessVariance: number;
}

/**
 * Evaluates resolution, brightness, and edge sharpness using an offscreen canvas
 * to decide whether Stage 1 (Gen Bio) should escalate to Stage 2 (Gemini Vision).
 */
export async function assessImageQuality(imageSrc: string): Promise<ImageQualityReport> {
  const fallback: ImageQualityReport = {
    qualityScore: 82,
    isLowQuality: false,
    issues: [],
    width: 800,
    height: 800,
    meanLuminance: 128,
    sharpnessVariance: 24,
  };

  if (typeof window === 'undefined' || !imageSrc) return fallback;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        const issues: ImageQualityIssue[] = [];

        if (w < 320 || h < 320) {
          issues.push('low_resolution');
        }

        const sampleW = 160;
        const sampleH = Math.max(80, Math.round((h / Math.max(1, w)) * sampleW));
        const canvas = document.createElement('canvas');
        canvas.width = sampleW;
        canvas.height = sampleH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ ...fallback, width: w, height: h, issues, isLowQuality: issues.length > 0 });
          return;
        }

        ctx.drawImage(img, 0, 0, sampleW, sampleH);
        const { data } = ctx.getImageData(0, 0, sampleW, sampleH);

        const luminances = new Float32Array(sampleW * sampleH);
        let lumSum = 0;
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          luminances[p] = lum;
          lumSum += lum;
        }
        const meanLuminance = lumSum / Math.max(1, luminances.length);

        if (meanLuminance < 42) issues.push('too_dark');
        else if (meanLuminance > 232) issues.push('overexposed');

        // Simple 4-neighbor Laplacian energy in center ROI
        let lapSum = 0;
        let lapSqSum = 0;
        let count = 0;
        const startX = Math.floor(sampleW * 0.15);
        const endX = Math.floor(sampleW * 0.85);
        const startY = Math.floor(sampleH * 0.15);
        const endY = Math.floor(sampleH * 0.85);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = y * sampleW + x;
            const lap =
              4 * luminances[idx] -
              luminances[idx - 1] -
              luminances[idx + 1] -
              luminances[idx - sampleW] -
              luminances[idx + sampleW];
            lapSum += lap;
            lapSqSum += lap * lap;
            count++;
          }
        }

        const lapMean = lapSum / Math.max(1, count);
        const sharpnessVariance = lapSqSum / Math.max(1, count) - lapMean * lapMean;

        if (sharpnessVariance < 140) {
          issues.push('blurry');
        }

        let score = 92;
        if (issues.includes('low_resolution')) score -= 22;
        if (issues.includes('blurry')) score -= 26;
        if (issues.includes('too_dark') || issues.includes('overexposed')) score -= 18;
        score = Math.max(20, Math.min(99, score));

        resolve({
          qualityScore: score,
          isLowQuality: issues.length > 0 || score < 68,
          issues,
          width: w,
          height: h,
          meanLuminance: Math.round(meanLuminance),
          sharpnessVariance: Math.round(sharpnessVariance),
        });
      } catch {
        // Cross-origin image tainted canvas; don't penalize URL images falsely
        resolve(fallback);
      }
    };

    img.onerror = () => resolve(fallback);
    img.src = imageSrc;
  });
}

/**
 * Crops an image around a percentage point (0-100) for targeted subject re-identification.
 */
export async function cropImageAtFocus(
  imageSrc: string,
  focusPercent: { x: number; y: number },
  cropScale = 0.55
): Promise<string> {
  if (typeof window === 'undefined' || !imageSrc) return imageSrc;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) {
          resolve(imageSrc);
          return;
        }
        const side = Math.round(Math.min(w, h) * cropScale);
        const cx = Math.round((focusPercent.x / 100) * w);
        const cy = Math.round((focusPercent.y / 100) * h);
        const sx = Math.max(0, Math.min(w - side, cx - Math.round(side / 2)));
        const sy = Math.max(0, Math.min(h - side, cy - Math.round(side / 2)));

        const canvas = document.createElement('canvas');
        const outSize = 640;
        canvas.width = outSize;
        canvas.height = outSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }
        ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

/**
 * Converts a remote http(s) URL or data URL into a compressed base64 string for server Vision APIs.
 */
export async function imageUrlToBase64(imageSrc: string): Promise<{ base64: string; mimeType: string } | null> {
  if (!imageSrc) return null;
  if (imageSrc.startsWith('data:image/')) {
    const match = imageSrc.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) return { mimeType: match[1], base64: match[2] };
  }
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const maxDim = 960;
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const ratio = Math.min(1, maxDim / Math.max(1, w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * ratio));
        canvas.height = Math.max(1, Math.round(h * ratio));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
        resolve({ mimeType: 'image/jpeg', base64 });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}
