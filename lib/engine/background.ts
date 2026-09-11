import * as ort from 'onnxruntime-web/webgpu';
import { resize } from './pixels';
import type { Settings } from '../processing';
import type { Report } from './types';
let session: ort.InferenceSession | undefined;
let backend = 'wasm';
const SIDE = 320;
async function modelBytes(url: string, report: Report) {
  let cache: Cache | undefined;
  try { cache = await caches.open('trazo-models-v1'); } catch { /* Storage unavailable: processing still works. */ }
  const cached = await cache?.match(url);
  if (cached) { report({ stage: 'model_cached', percent: 100 }); return cached.arrayBuffer(); }
  report({ stage: 'preparing_ai', percent: 0 });
  let response: Response;
  try { response = await fetch(url); } catch { throw Error('model_load_failed'); }
  if (!response.ok) throw Error('model_load_failed');
  const total = Number(response.headers.get('content-length')) || 4574861;
  const reader = response.body?.getReader();
  let bytes: Uint8Array;
  if (reader) {
    const chunks: Uint8Array[] = []; let loaded = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      chunks.push(value); loaded += value.length;
      report({ stage: 'preparing_ai', percent: Math.min(100, loaded / total * 100), loaded, total });
    }
    bytes = new Uint8Array(loaded); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  } else bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength !== 4574861) throw Error('model_load_failed');
  try { await cache?.put(url, new Response(bytes.buffer as ArrayBuffer, { headers: { 'content-type': 'application/octet-stream' } })); } catch { /* Quota limits do not block inference. */ }
  return bytes.buffer as ArrayBuffer;
}
async function getSession(base: string, report: Report) {
  if (session) return session;
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = new URL('vendor/onnx/', base).href;
  const bytes = await modelBytes(new URL('models/u2netp.onnx', base).href, report);
  report({ stage: 'loading_ai' });
  let gpu = false;
  try { gpu = !!(await (navigator as any).gpu?.requestAdapter()); } catch { /* Try WASM. */ }
  if (gpu) {
    try { session = await ort.InferenceSession.create(bytes, { executionProviders: ['webgpu', 'wasm'] }); backend = 'webgpu'; }
    catch { report({ stage: 'wasm_fallback' }); }
  } else report({ stage: 'wasm_fallback' });
  if (!session) {
    try { session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] }); }
    catch { throw Error('model_init_failed'); }
    backend = 'wasm';
  }
  return session;
}
// Separable box mean. Used for guided mask refinement, never for segmentation.
function mean(a: Float32Array, w: number, h: number, radius: number) {
  const tmp = new Float32Array(a.length), out = new Float32Array(a.length);
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = -radius; x <= radius; x++) sum += a[y*w + Math.max(0, Math.min(w-1, x))];
    for (let x = 0; x < w; x++) {
      tmp[y*w+x] = sum / (2*radius+1);
      sum += a[y*w+Math.min(w-1,x+radius+1)] - a[y*w+Math.max(0,x-radius)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) sum += tmp[Math.max(0,Math.min(h-1,y))*w+x];
    for (let y = 0; y < h; y++) {
      out[y*w+x] = sum / (2*radius+1);
      sum += tmp[Math.min(h-1,y+radius+1)*w+x] - tmp[Math.max(0,y-radius)*w+x];
    }
  }
  return out;
}
function guided(mask: Float32Array, guide: ImageData, amount: number) {
  const { width:w, height:h, data:d } = guide;
  const n = w*h, lum = new Float32Array(n), square = new Float32Array(n), product = new Float32Array(n);
  for (let i=0;i<n;i++) { lum[i]=(d[i*4]*.2126+d[i*4+1]*.7152+d[i*4+2]*.0722)/255; square[i]=lum[i]*lum[i]; product[i]=lum[i]*mask[i]; }
  const radius = Math.max(1,Math.round(1+amount/20)), mi=mean(lum,w,h,radius), mp=mean(mask,w,h,radius), mii=mean(square,w,h,radius), mip=mean(product,w,h,radius);
  for(let i=0;i<n;i++){ square[i]=(mip[i]-mi[i]*mp[i])/(mii[i]-mi[i]*mi[i]+.002); product[i]=mp[i]-square[i]*mi[i]; }
  const a=mean(square,w,h,radius),b=mean(product,w,h,radius);
  for(let i=0;i<n;i++) mask[i]=Math.max(0,Math.min(1,a[i]*lum[i]+b[i]));
  return mask;
}
export async function removeBackground(original: ImageData, s: Settings, base: string, report: Report) {
  const model = await getSession(base, report);
  const small = await resize(original,SIDE,SIDE);
  const n=SIDE*SIDE, means=[.485,.456,.406], std=[.229,.224,.225];
  const infer = async (flipped: boolean) => {
    const tensor = new Float32Array(n*3);
    for(let y=0;y<SIDE;y++) for(let x=0;x<SIDE;x++) {
      const i=y*SIDE+x, j=y*SIDE+(flipped?SIDE-1-x:x);
      for(let c=0;c<3;c++) tensor[c*n+i]=(small.data[j*4+c]/255-means[c])/std[c];
    }
    const input = new ort.Tensor('float32',tensor,[1,3,SIDE,SIDE]);
    let outputs: Record<string, ort.Tensor> | undefined;
    try {
      outputs=await model.run({[model.inputNames[0]]:input},[model.outputNames[0]]);
      const raw=outputs[model.outputNames[0]].data as Float32Array;
      let lo=Infinity,hi=-Infinity; for(const v of raw){lo=Math.min(lo,v);hi=Math.max(hi,v);}
      const mask=new Float32Array(n),range=Math.max(1e-6,hi-lo);
      for(let y=0;y<SIDE;y++)for(let x=0;x<SIDE;x++)mask[y*SIDE+x]=(raw[y*SIDE+(flipped?SIDE-1-x:x)]-lo)/range;
      return mask;
    } finally { input.dispose(); if(outputs) Object.values(outputs).forEach(t=>t.dispose()); }
  };
  report({stage:'segmenting',backend});
  let mask:Float32Array;
  try { mask=await infer(false); }
  catch(error) {
    if(backend!=='webgpu')throw error;
    await session?.release(); session=undefined;
    report({stage:'wasm_fallback'});
    const bytes=await modelBytes(new URL('models/u2netp.onnx',base).href,report);
    session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm']});backend='wasm';
    return removeBackground(original,s,base,report);
  }
  if(s.bgQuality==='maximum') {
    report({stage:'refining_ai',percent:50,backend});
    const mirrored=await infer(true);for(let i=0;i<n;i++)mask[i]=(mask[i]+mirrored[i])/2;
  }
  report({stage:'refining_mask'});
  const image=new ImageData(SIDE,SIDE);
  for(let i=0;i<n;i++){image.data[i*4]=image.data[i*4+1]=image.data[i*4+2]=Math.round(mask[i]*255);image.data[i*4+3]=255;}
  const scale=Math.min(1,(s.bgQuality==='fast'?512:1280)/Math.max(original.width,original.height));
  const w=Math.max(1,Math.round(original.width*scale)),h=Math.max(1,Math.round(original.height*scale));
  const maskImage=await resize(image,w,h), guide=await resize(original,w,h);
  mask=new Float32Array(w*h);for(let i=0;i<mask.length;i++)mask[i]=maskImage.data[i*4]/255;
  if(s.edgeRefine>0)guided(mask,guide,s.edgeRefine);
  const radius=Math.round(s.smoothing/35+s.feather*scale);
  if(radius>0)mask=mean(mask,w,h,radius);
  for(let i=0;i<mask.length;i++){const a=Math.round(mask[i]*255);maskImage.data[i*4]=maskImage.data[i*4+1]=maskImage.data[i*4+2]=a;}
  report({stage:'applying_mask'});
  const full=await resize(maskImage,original.width,original.height);
  // Original RGB pixels and full dimensions are preserved. Existing alpha is multiplied.
  for(let i=0;i<original.data.length;i+=4)original.data[i+3]=Math.round(original.data[i+3]*full.data[i]/255);
  return {image:original,backend};
}
