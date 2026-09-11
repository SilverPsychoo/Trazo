export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
export function previewCanDownload(result, signature, busy, loading) {
  return Boolean(
    result &&
    result.signature === signature &&
    result.goalMet &&
    !busy &&
    !loading,
  );
}
export function fitDimensions(
  width,
  height,
  maxSide = 16384,
  maxPixels = 48000000,
) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1
  )
    throw Error('invalid_dimensions');
  const scale = Math.min(
    1,
    maxSide / Math.max(width, height),
    Math.sqrt(maxPixels / (width * height)),
  );
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
export function resizeProportional(value, axis, width, height) {
  const n = clamp(Math.round(value) || 1, 1, 16384);
  const ratio = width / height;
  return fitDimensions(
    axis === 'width' ? n : n * ratio,
    axis === 'height' ? n : n / ratio,
  );
}
export function cropPixels(rect, width, height) {
  const x = clamp(Math.round((rect.x / 100) * width), 0, width - 1),
    y = clamp(Math.round((rect.y / 100) * height), 0, height - 1);
  return {
    x,
    y,
    width: clamp(Math.round((rect.w / 100) * width), 1, width - x),
    height: clamp(Math.round((rect.h / 100) * height), 1, height - y),
  };
}
export function boundedRect(rect) {
  const w = clamp(rect.w, 2, 100),
    h = clamp(rect.h, 2, 100);
  return { x: clamp(rect.x, 0, 100 - w), y: clamp(rect.y, 0, 100 - h), w, h };
}
export function formatBytes(bytes) {
  return bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(2)} MB`
    : `${Math.max(0.1, bytes / 1024).toFixed(1)} KB`;
}
export async function compressToTarget(
  encode,
  target,
  maxQuality = 0.92,
  aborted = () => false,
) {
  if (!Number.isFinite(target) || target < 1024) throw Error('invalid_target');
  let best = null,
    min = null,
    low = 0.05,
    high = clamp(maxQuality, 0.05, 1);
  for (let i = 0; i < 10; i++) {
    if (aborted()) throw Error('cancelled');
    const q = i === 0 ? high : i === 1 ? 0.05 : (low + high) / 2;
    const blob = await encode(q);
    if (!min || blob.size < min.size) min = blob;
    if (blob.size <= target) {
      best = blob;
      if (i === 0) break;
      low = q;
    } else high = q;
    if (i === 0) high = q;
    if (i === 1 && blob.size > target) break;
  }
  if (aborted()) throw Error('cancelled');
  return { blob: best || min, met: !!best };
}
