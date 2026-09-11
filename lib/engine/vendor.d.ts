declare module 'pica';
declare module 'onnxruntime-web/webgpu' { export * from 'onnxruntime-common'; }
declare module '*squoosh_oxipng.js' {
  export default function init(): Promise<unknown>;
  export function optimise_raw(data: Uint8ClampedArray, width: number, height: number, level: number, interlace: boolean, optimizeAlpha: boolean): Uint8Array;
}
