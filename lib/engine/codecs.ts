import { flatten } from './pixels';
import type { Report } from './types';
import { compressToTarget } from '../editor-math.mjs';
export async function encode(data: ImageData, format: string, quality: number) {
  let bytes: ArrayBuffer;
  if (format === 'jpeg') bytes = await (await import('@jsquash/jpeg/encode.js')).default(data, { quality });
  else if (format === 'webp') bytes = await (await import('@jsquash/webp/encode.js')).default(data, { quality, method: 4, exact: 1 });
  else if (format === 'avif') bytes = await (await import('@jsquash/avif/encode.js')).default(data, { quality, speed: 8 });
  else {
    // Explicit single-thread build: GitHub Pages cannot set COOP/COEP headers.
    const codec = await import('@jsquash/oxipng/codec/pkg/squoosh_oxipng.js');
    await codec.default();
    bytes = codec.optimise_raw(data.data, data.width, data.height, 2, false, false).buffer as ArrayBuffer;
    format = 'png';
  }
  return new Blob([bytes], { type: `image/${format}` });
}
export async function exportImage(data: ImageData, format: string, quality: number, background: string, target: number | undefined, report: Report) {
  if (format === 'jpeg') flatten(data, background);
  report({ stage: 'encoding' });
  if (target && format !== 'png') {
    let pass = 0;
    return compressToTarget(async (q: number) => {
      report({ stage: 'optimizing', percent: Math.min(95, 20 + pass++ * 7) });
      return encode(data, format, q * 100);
    }, target, quality / 100);
  }
  const blob = await encode(data, format, quality);
  return { blob, met: !target || blob.size <= target };
}
