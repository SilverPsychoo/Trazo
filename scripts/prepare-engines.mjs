import { mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
mkdirSync('public/vendor/onnx',{recursive:true});
for(const name of ['ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm'])copyFileSync('node_modules/onnxruntime-web/dist/'+name,'public/vendor/onnx/'+name);
// The WebGPU entry also uses the JSEP runtime for WASM fallback.
for(const name of ['ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm'])rmSync('public/vendor/onnx/'+name,{force:true});
// Official VTracer WASM unchanged. Only the Node filesystem loader becomes async browser fetch.
mkdirSync('public/vendor/vtracer',{recursive:true});
let text=readFileSync('node_modules/@visioncortex/vtracer/pkg/vtracer_wasm.js','utf8');
text=text.replace('exports.vectorize_bytes = vectorize_bytes;','export { vectorize_bytes };').replace('exports.vectorize_rgba = vectorize_rgba;','export { vectorize_rgba };');
text=text.slice(0,text.indexOf('const wasmPath ='))+`let wasm, pending;
export async function init() {
  if(wasm)return;
  if(!pending)pending=(async()=>{
    const response=await fetch(new URL('./vtracer_wasm_bg.wasm',import.meta.url));
    if(!response.ok)throw Error('vector_load_failed');
    const {instance}=await WebAssembly.instantiate(await response.arrayBuffer(),__wbg_get_imports());
    wasm=instance.exports;wasm.__wbindgen_start();
  })().catch(error=>{pending=undefined;throw error});
  return pending;
}`;
writeFileSync('public/vendor/vtracer/vtracer.mjs','// Loader adapted from @visioncortex/vtracer 1.0.0-alpha.4; MIT OR Apache-2.0\n'+text);
copyFileSync('node_modules/@visioncortex/vtracer/pkg/vtracer_wasm_bg.wasm','public/vendor/vtracer/vtracer_wasm_bg.wasm');
