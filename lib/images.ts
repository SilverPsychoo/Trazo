export type SourceImage = {
  url: string;
  blob: Blob;
  name: string;
  width: number;
  height: number;
};
export type ResultImage = {
  url: string;
  blob: Blob;
  extension: string;
  width: number;
  height: number;
  paths?: number;
  traceSize?: string;
};
export async function readImage(
  blob: Blob,
  name: string,
): Promise<SourceImage> {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(blob.type))
    throw new Error('unsupported_image');
  if (blob.size > 60 * 1024 * 1024) throw new Error('too_large');
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImage(url);
    if (image.naturalWidth * image.naturalHeight > 48000000)
      throw new Error('too_many_pixels');
    return {
      url,
      blob,
      name,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('invalid_image'));
    img.src = url;
  });
}
export async function canvasFor(source: SourceImage, maxSide: number = 2400) {
  const ratio = Math.min(1, maxSide / Math.max(source.width, source.height)),
    canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * ratio));
  canvas.height = Math.max(1, Math.round(source.height * ratio));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas_unavailable');
  ctx.drawImage(await loadImage(source.url), 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}
export function toBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('export_failed'))),
      type,
      quality,
    ),
  );
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}
