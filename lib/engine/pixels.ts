import pica from 'pica';
const resizer = pica({ features: ['js', 'wasm'] });
export function surface(w: number, h: number) {
  const canvas = new OffscreenCanvas(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw Error('canvas_unavailable');
  return { canvas, ctx };
}
export async function resize(data: ImageData, width: number, height: number, fast = false) {
  width = Math.max(1, Math.round(width)); height = Math.max(1, Math.round(height));
  if (width === data.width && height === data.height) return data;
  const result = await resizer.resizeBuffer({ src: data.data, width: data.width, height: data.height, toWidth: width, toHeight: height, filter: fast ? 'box' : 'mks2013' });
  return new ImageData(new Uint8ClampedArray(result), width, height);
}
export async function decode(blob: Blob, maxSide=Infinity) {
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' }); }
  catch { throw Error('invalid_image'); }
  try {
    const { canvas, ctx } = surface(bitmap.width*Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height)), bitmap.height*Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height)));
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const result = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.height = 1;
    return result;
  } finally { bitmap.close(); }
}
export function onCanvas(data: ImageData) {
  const s = surface(data.width, data.height); s.ctx.putImageData(data, 0, 0); return s;
}
export function flatten(data: ImageData, color: string) {
  const rgb = color.match(/[a-f\d]{2}/gi)?.map(x => parseInt(x, 16)) || [255, 255, 255];
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] * a + rgb[k] * (1 - a));
    d[i + 3] = 255;
  }
  return data;
}
