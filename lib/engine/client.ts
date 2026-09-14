import {assetURL} from '../paths';
import type {Progress} from './types';
export type Analysis={width:number;height:number;format:string;hasAlpha:boolean;kind:string;colors:number;threshold:number;previewSide:number;orientation:string;[key:string]:unknown};
export type Mask={alpha:Float32Array;width:number;height:number;model:string;backend:string;passes:number;quality:{suspicious:boolean;coverage:number;uncertain:number;components:number;holes:number}};
/** Independent serial channel. Termination interrupts synchronous WASM too. */
export class EngineChannel{
 private worker?:Worker;private id=0;private abort?:()=>void;private idle?:ReturnType<typeof setTimeout>;
 run<T>(payload:Record<string,unknown>,signal:AbortSignal,progress:(p:Progress)=>void=()=>{}):Promise<T>{
  clearTimeout(this.idle);
  if(signal.aborted)return Promise.reject(new DOMException('Cancelled','AbortError'));
  if(this.abort)this.dispose();
  const worker=this.worker??=new Worker(new URL('./worker.ts',import.meta.url),{type:'module'}),id=++this.id;
  return new Promise((resolve,reject)=>{
   let done=false;const finish=(error?:Error,output?:T)=>{if(done)return;done=true;clearTimeout(timeout);signal.removeEventListener('abort',cancel);this.abort=undefined;worker.onmessage=null;worker.onerror=null;if(error){worker.terminate();this.worker=undefined;reject(error)}else{this.idle=setTimeout(()=>this.dispose(),120000);resolve(output!)}};
   const cancel=()=>finish(new DOMException('Cancelled','AbortError'));this.abort=cancel;
   const timeout=setTimeout(()=>finish(Error('timeout')),300000);signal.addEventListener('abort',cancel,{once:true});
   worker.onmessage=({data})=>{if(data.id!==id)return;if(data.type==='progress')progress(data.progress);else if(data.type==='done')finish(undefined,data.output);else finish(Error(data.code||'processing_failed'));};
   worker.onerror=e=>{console.error('Trazo worker:',e.message);finish(Error('processing_failed'))};
   worker.postMessage({...payload,id,base:assetURL('./')});
  });
 }
 dispose(){clearTimeout(this.idle);this.abort?.();this.worker?.terminate();this.worker=undefined;}
}
