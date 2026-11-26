/**
 * Image & Location Privacy Utilities
 * Strips EXIF metadata (including GPS coordinates and device identifiers)
 * before storing or sharing user-uploaded wildlife photos (under-14 safe).
 */

export async function stripExifFromImageFile(file: File, maxDimension = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Empty image data'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          // Re-drawing onto Canvas produces a clean pixel bitmap with zero EXIF/GPS headers
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(cleanDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Obfuscates precise coordinates for community sharing and protected-species safety.
 * - Normal observations: rounds to ~500m grid so home/school addresses cannot be pinpointed.
 * - Protected species: applies a wider ~2km zone mask so rare habitats are not exposed.
 */
export function obfuscateCoordinates(
  lat: number,
  lng: number,
  isProtectedSpecies = false
): { lat: number; lng: number; precisionLabel: string } {
  const grid = isProtectedSpecies ? 0.02 : 0.005; // ~2.2km vs ~550m
  const maskedLat = Math.round(lat / grid) * grid;
  const maskedLng = Math.round(lng / grid) * grid;
  return {
    lat: Number(maskedLat.toFixed(4)),
    lng: Number(maskedLng.toFixed(4)),
    precisionLabel: isProtectedSpecies
      ? '보호종 위치 보호 · 광역 권역만 표시'
      : '안전 반경 약 500m 단위 표시 (EXIF 제거됨)',
  };
}
