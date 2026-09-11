import type { SourceImage, ResultImage } from './images';
import type { Progress, CropData, Watermark } from './engine/types';
import { assetURL } from './paths';
import { fitDimensions, cropPixels, compressToTarget } from './editor-math.mjs';
import type { ToolId } from './catalog';
export type Rect = { x: number; y: number; w: number; h: number };
export type Settings = {
  bgQuality: 'fast' | 'balanced' | 'maximum';
  edgeRefine: number; smoothing: number; feather: number;
  vectorSmooth: number; simplify: number; precision: number; despeckle: number;
  resizeMethod: 'quality' | 'fast';
  exposure: number; temperature: number; shadows: number; highlights: number; sepia: number;
  cropData: CropData | null; cropAspect: number; cropZoom: number;
  textRotation: number; textAlign: 'left' | 'center' | 'right';
  watermarks: Watermark[];
  redactMode: 'solid' | 'pixelate' | 'blur'; redactStrength: number;
  mode: string;
  detail: number;
  colors: number;
  threshold: number;
  stroke: number;
  omitWhite: boolean;
  invert: boolean;
  bgMethod: string;
  tolerance: number;
  backgroundColor: string;
  addBackground: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  width: number;
  height: number;
  locked: boolean;
  format: string;
  quality: number;
  targetEnabled: boolean;
  targetKB: number;
  rect: Rect;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  text: string;
  fontSize: number;
  textColor: string;
  textOpacity: number;
  textX: number;
  textY: number;
  blockColor: string;
};
export type Output = Omit<ResultImage, 'url'> & {
  optimizedBlob?: Blob;
  backend?: string;
  goalMet: boolean;
  note?: string;
};
export function defaultSettings(width = 1200, height = 1200): Settings {
  const size = {width, height};
  return {
    bgQuality: 'balanced', edgeRefine: 45, smoothing: 20, feather: 1,
    vectorSmooth: 50, simplify: 25, precision: 2, despeckle: 4,
    resizeMethod: 'quality', exposure: 0, temperature: 0, shadows: 0, highlights: 0, sepia: 0,
    cropData: null, cropAspect: 0, cropZoom: 1,
    textRotation: 0, textAlign: 'center', watermarks: [], redactMode: 'solid', redactStrength: 50,
    mode: 'color',
    detail: 75,
    colors: 16,
    threshold: 180,
    stroke: 2,
    omitWhite: true,
    invert: false,
    bgMethod: 'ai',
    tolerance: 25,
    backgroundColor: '#ffffff',
    addBackground: false,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    ...size,
    locked: true,
    format: 'webp',
    quality: 85,
    targetEnabled: false,
    targetKB: 200,
    rect: { x: 10, y: 10, w: 80, h: 80 },
    rotation: 0,
    flipX: false,
    flipY: false,
    text: 'Trazo',
    fontSize: 8,
    textColor: '#ffffff',
    textOpacity: 80,
    textX: 50,
    textY: 85,
    blockColor: '#000000',
  };
}
// One operation per editor: abort terminates the worker even during synchronous WASM.
let activeWorker: Worker | undefined;
let idle: ReturnType<typeof setTimeout> | undefined;
export function releaseEngine() { clearTimeout(idle); activeWorker?.terminate(); activeWorker=undefined; }
export async function processImage(source: SourceImage, tool: ToolId, settings: Settings, signal: AbortSignal, report: (p: Progress) => void): Promise<Output> {
  if(signal.aborted) throw new DOMException('Cancelled','AbortError');
  if(typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') throw Error('browser_unsupported');
  clearTimeout(idle);
  const worker=activeWorker ??= new Worker(new URL('./engine/worker.ts',import.meta.url),{type:'module'});
  return new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(err?:Error,output?:Output)=>{
      if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',cancel);
      worker.onmessage=null;worker.onerror=null;
      if(err){releaseEngine();reject(err);}else{idle=setTimeout(releaseEngine,60000);resolve(output!);}
    };
    const cancel=()=>finish(new DOMException('Cancelled','AbortError'));
    const timer=setTimeout(()=>finish(Error('timeout')),300000);
    signal.addEventListener('abort',cancel,{once:true});
    worker.onerror=(event)=>{console.error('Trazo worker:',event.message);finish(Error('processing_failed'));};
    worker.onmessage=({data})=>{
      if(data.type==='progress')report(data.progress);
      else if(data.type==='done')finish(undefined,data.output);
      else finish(Error(data.code||'processing_failed'));
    };
    worker.postMessage({blob:source.blob,tool,settings,base:assetURL('./')});
  });
}
