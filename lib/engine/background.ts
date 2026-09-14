import * as ort from 'onnxruntime-web/webgpu';
import {resize} from './pixels';
import {inspectMask,maskScore} from './mask-quality.mjs';
import type {Settings} from '../processing';
import type {Report} from './types';
let session:ort.InferenceSession|undefined,activeModel='',backend='wasm';
async function bytes(url:string,size:number,report:Report,offset=0,total=size){
 let cache:Cache|undefined;try{cache=await caches.open('trazo-ai-v2')}catch{/* Optional storage. */}
 const cached=await cache?.match(url);if(cached){const a=await cached.arrayBuffer();if(a.byteLength===size){report({stage:'loading_ai',loaded:offset+size,total,percent:(offset+size)/total*100});return new Uint8Array(a);}}
 let r:Response;try{r=await fetch(url)}catch{throw Error('model_load_failed')}if(!r.ok)throw Error('model_load_failed');
 const out=new Uint8Array(size),reader=r.body?.getReader();let loaded=0;
 if(reader){while(true){const {value,done}=await reader.read();if(done)break;if(loaded+value.length>size)throw Error('model_load_failed');out.set(value,loaded);loaded+=value.length;report({stage:'preparing_ai',loaded:offset+loaded,total,percent:(offset+loaded)/total*100});}}
 else{const b=new Uint8Array(await r.arrayBuffer());loaded=b.length;if(loaded!==size)throw Error('model_load_failed');out.set(b);}
 if(loaded!==size)throw Error('model_load_failed');try{await cache?.put(url,new Response(out.buffer as ArrayBuffer))}catch{/* Memory/quota does not block inference. */}return out;
}
async function weights(model:string,base:string,report:Report){
 if(model==='u2netp')return bytes(new URL('models/u2netp.onnx',base).href,4574861,report);
 let m;try{const r=await fetch(new URL('models/isnet/manifest.json',base));if(!r.ok)throw Error();m=await r.json()}catch{throw Error('model_load_failed')}
 const out=new Uint8Array(m.bytes);let offset=0;
 for(const p of m.parts){out.set(await bytes(new URL('models/isnet/'+p.name,base).href,p.bytes,report,offset,m.bytes),offset);offset+=p.bytes;}
 return out;
}
async function start(model:string,gpu:boolean,base:string,report:Report){
 if(session&&activeModel===model&&(!gpu||backend==='webgpu'))return session;
 await session?.release();session=undefined;activeModel=model;
 ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;ort.env.wasm.wasmPaths=new URL('vendor/onnx/',base).href;
 const data=await weights(model,base,report);report({stage:'loading_ai'});
 if(gpu)try{session=await ort.InferenceSession.create(data,{executionProviders:['webgpu','wasm']});backend='webgpu'}catch{report({stage:'wasm_fallback'})}
 if(!session){report({stage:'wasm_fallback'});session=await ort.InferenceSession.create(data,{executionProviders:['wasm']});backend='wasm';}return session;
}
export async function prepareMask(original:ImageData,s:Settings,base:string,report:Report,lowMemory=false){
 let gpu=false;try{gpu=!!await (navigator as any).gpu?.requestAdapter()}catch{/* WASM fallback. */}
 let model=s.bgQuality==='fast'||lowMemory&&!gpu?'u2netp':'isnet',allowGpu=gpu;
 for(let attempt=0;attempt<3;attempt++)try{
  const net=await start(model,allowGpu,base,report),side=model==='isnet'?1024:320,small=await resize(original,side,side),n=side*side;
  let max=1;for(let i=0;i<small.data.length;i+=4)max=Math.max(max,small.data[i],small.data[i+1],small.data[i+2]);
  const infer=async(flipped:boolean)=>{
   const tensor=new Float32Array(n*3),means=[.485,.456,.406],std=[.229,.224,.225];
   for(let y=0;y<side;y++)for(let x=0;x<side;x++){const i=y*side+x,j=y*side+(flipped?side-1-x:x);for(let c=0;c<3;c++)tensor[c*n+i]=model==='isnet'?small.data[j*4+c]/max-.5:(small.data[j*4+c]/255-means[c])/std[c];}
   const input=new ort.Tensor('float32',tensor,[1,3,side,side]);let outputs:Record<string,ort.Tensor>|undefined;
   try{outputs=await net.run({[net.inputNames[0]]:input},[net.outputNames[0]]);const raw=outputs[net.outputNames[0]].data as Float32Array;let lo=Infinity,hi=-Infinity;for(let i=0;i<n;i++){lo=Math.min(lo,raw[i]);hi=Math.max(hi,raw[i])}const range=hi-lo,alpha=new Float32Array(n);
    for(let y=0;y<side;y++)for(let x=0;x<side;x++){const v=raw[y*side+(flipped?side-1-x:x)];alpha[y*side+x]=range>1e-6?(v-lo)/range:Math.max(0,Math.min(1,v));}return alpha;
   }finally{input.dispose();if(outputs)Object.values(outputs).forEach(t=>t.dispose())}
  };
  report({stage:'segmenting',backend});let alpha=await infer(false),passes=1,q=inspectMask(alpha,side,side,small);
  if(q.suspicious||s.bgQuality==='maximum'){
   report({stage:'refining_ai',backend});const second=await infer(true),other=inspectMask(second,side,side,small);passes++;
   if(maskScore(other)<maskScore(q)*.8)alpha=second;
   else if(maskScore(other)<=maskScore(q)*1.15)for(let i=0;i<n;i++)alpha[i]=(alpha[i]+second[i])/2;
  }
  report({stage:'refining_mask',backend});q=inspectMask(alpha,side,side,small,true);
  return {alpha,width:side,height:side,model,backend,passes,quality:q};
 }catch(error){
  console.warn('Trazo segmentation fallback:',error);await session?.release().catch(()=>{});session=undefined;
  if(allowGpu){allowGpu=false;report({stage:'wasm_fallback'});continue;}
  if(model==='isnet'){model='u2netp';report({stage:'light_fallback'});continue;}
  throw Error(error instanceof Error&&error.message==='model_load_failed'?'model_load_failed':'model_init_failed');
 }
 throw Error('model_init_failed');
}
