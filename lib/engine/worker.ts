import {decode,resize,flatten} from './pixels';
import {exportImage} from './codecs';
import {analyzePixels,recommend} from './analyze.mjs';
import {lightOperation,scaledSettings,outputSize} from './operations';
import type {Settings,Output} from '../processing';
import type {Report} from './types';
self.onmessage=async({data:job})=>{
 const report:Report=progress=>self.postMessage({id:job.id,type:'progress',progress});
 try{
  if(job.mode==='analyze'){
   report({stage:'analyzing'});let data=await decode(job.blob,768);const analysis=analyzePixels(data,job.width,job.height,job.format);
   const side=['adjust','watermark','redact','crop','rotate'].includes(job.tool)?512:job.tool==='vector'?448:Math.min(512,analysis.previewSide);
   const k=Math.min(1,side/Math.max(data.width,data.height));data=await resize(data,data.width*k,data.height*k);
   self.postMessage({id:job.id,type:'done',output:{analysis,patch:recommend(analysis,job.tool),preview:data}},[data.data.buffer]);return;
  }
  if(job.mode==='mask'){
   const image=await decode(job.blob,1024),out=await (await import('./background')).prepareMask(image,job.settings,job.base,report,job.lowMemory);
   self.postMessage({id:job.id,type:'done',output:out},[out.alpha.buffer]);return;
  }
  const preview=job.mode==='preview';let image:ImageData=job.data||await decode(job.blob);
  const s:Settings=preview?scaledSettings(job.settings,job.width,image):job.settings;
  const size=outputSize(job.settings,job.tool,job.width,job.height);let out:Output;
  if(job.tool==='vector')out=await (await import('./vector')).vectorize(image,s,job.base,report,job.width,job.height);
  else{
   if(job.tool==='background'){
    if(!job.mask)throw Error('mask_missing');image=await (await import('./mask-refine')).applyMask(image,job.mask,s,report);if(s.addBackground)flatten(image,s.backgroundColor);
   }else if(job.tool==='resize'){
    if(!Number.isFinite(s.width)||!Number.isFinite(s.height)||s.width<1||s.height<1||s.width>16384||s.height>16384||s.width*s.height>48000000)throw Error('invalid_dimensions');
    const k=preview?Math.min(1,(job.previewSide||640)/Math.max(s.width,s.height)):1;
    image=await resize(image,s.width*k,s.height*k,s.resizeMethod==='fast');
   }else image=lightOperation(image,job.tool,s);
   const format=['compress','convert','background'].includes(job.tool)?s.format:'png';
   const encoded=await exportImage(image,format,s.quality,s.backgroundColor,job.tool==='compress'&&s.targetEnabled?Math.max(256,s.targetKB*1024*(preview?image.width*image.height/(size.width*size.height):1)):undefined,report);
   out={blob:encoded.blob!,extension:format==='jpeg'?'jpg':format,...size,goalMet:encoded.met,backend:job.mask?.backend};
  }
  out.isPreview=preview;out.previewWidth=image.width;out.previewHeight=image.height;
  if(preview&&job.tool!=='vector')out.estimatedBytes=Math.round(out.blob.size*(size.width*size.height)/(image.width*image.height));
  self.postMessage({id:job.id,type:'done',output:out});
 }catch(error){console.error('Trazo engine:',error);self.postMessage({id:job.id,type:'error',code:error instanceof Error?error.message:'processing_failed'});}
};
