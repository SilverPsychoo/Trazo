import { resize } from './pixels';
import type { Settings } from '../processing';
import type { Report } from './types';
export async function vectorize(original: ImageData,s:Settings,base:string,report:Report,outputWidth=original.width,outputHeight=original.height) {
  report({stage:'loading_vector'});
  const url=new URL('vendor/vtracer/vtracer.mjs',base).href;
  const engine=await import(/* @vite-ignore */ url); await engine.init();
  const data=original, ratio=1;
  const binary=['lineart','silhouette','outline'].includes(s.mode);
  if(s.omitWhite||binary)for(let i=0;i<data.data.length;i+=4){
    if(binary){
      const alpha=data.data[i+3]/255;
      const lum=(.2126*data.data[i]+.7152*data.data[i+1]+.0722*data.data[i+2])*alpha+255*(1-alpha);
      const black=(lum<s.threshold)!==s.invert;
      data.data[i]=data.data[i+1]=data.data[i+2]=black?0:255;data.data[i+3]=255;
    } else if(data.data[i]>248&&data.data[i+1]>248&&data.data[i+2]>248)data.data[i+3]=0;
  }
  report({stage:'tracing'});
  let svg:string=engine.vectorize_rgba(new Uint8Array(data.data.buffer),data.width,data.height,{
    hierarchical:s.mode==='poster'?'cutout':'stacked',clustering:binary?'bw':'color-cluster',mode:s.vectorSmooth===0?'pixel':'spline',
    filterSpeckle:s.despeckle,colorPrecision:Math.max(2,Math.round(s.detail/20)+2),
    layerDifference:Math.max(4,Math.round(64-s.detail*.5)),
    cornerThreshold:Math.round(20+s.vectorSmooth*1.4),lengthThreshold:3.5+s.simplify/20,
    spliceThreshold:45,simplify:s.simplify/20,pathPrecision:s.precision,
    ...(['color','poster'].includes(s.mode)?{maxColors:s.colors}:{}),binaryThreshold:128,optimize:0,
  });
  if(s.mode==='outline')svg=svg.replace(/fill="[^"]*"/g,`fill="none" stroke="#000000" stroke-width="${s.stroke*ratio}"`);
  svg=svg.replace(/<svg\b[^>]*>/,`<svg xmlns="http://www.w3.org/2000/svg" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${data.width} ${data.height}">`);
  const count=(svg.match(/<path\b/g)||[]).length;
  if(!count)throw Error('no_paths');
  if(count>50000)throw Error('too_many_paths');
  report({stage:'optimizing_svg'});
  const { optimize }=await import('svgo/browser');
  const optimized=optimize(svg,{multipass:false,floatPrecision:s.precision,plugins:[{name:'preset-default',params:{overrides:{convertPathData:{floatPrecision:s.precision}}}}]}).data;
  return {blob:new Blob([svg],{type:'image/svg+xml'}),optimizedBlob:new Blob([optimized],{type:'image/svg+xml'}),extension:'svg',width:outputWidth,height:outputHeight,paths:count,traceSize:`${data.width} × ${data.height}`,goalMet:true};
}
