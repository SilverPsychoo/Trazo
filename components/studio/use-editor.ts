'use client';
import {useState,useRef,useEffect,useCallback} from 'react';
import {defaultSettings,type Settings,type Output} from '@/lib/processing';
import {readImage,loadImage,toBlob,download,type SourceImage} from '@/lib/images';
import {EngineChannel,type Analysis,type Mask} from '@/lib/engine/client';
import {outputSize} from '@/lib/engine/operations';
import type {Progress} from '@/lib/engine/types';
import {catalog,type Locale,type ToolId} from '@/lib/catalog';
const emptyBlob=new Blob();
export function useEditor(lang:Locale,toolId:ToolId){
 const t=useCallback((es:string,en:string)=>lang==='es'?es:en,[lang]);
 const tool=catalog.find(t=>t.id===toolId)!;
 const [source,setSource]=useState<SourceImage|null>(null),[settings,setSettings]=useState(()=>defaultSettings()),[sample,setSample]=useState<ImageData>(),[analysis,setAnalysis]=useState<Analysis>();
 const [mask,setMask]=useState<Mask>(),[maskBusy,setMaskBusy]=useState(false),[autoIndex,setAutoIndex]=useState(0),[paused,setPaused]=useState(false);
 const [preview,setPreview]=useState<(Output&{url:string;signature:string})>(),[exported,setExported]=useState<(Output&{signature:string;downloadUrl:string;optimizedUrl?:string})>();
 useEffect(()=>()=>{if(exported){URL.revokeObjectURL(exported.downloadUrl);if(exported.optimizedUrl)URL.revokeObjectURL(exported.optimizedUrl)}},[exported]);
 const [loading,setLoading]=useState(false),[previewBusy,setPreviewBusy]=useState(false),[exporting,setExporting]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [progress,setProgress]=useState<Progress>({stage:'idle'}),[message,setMessage]=useState('');
 const [view,setView]=useState('compare'),[zoom,setZoom]=useState(100),[backdrop,setBackdrop]=useState('checker');
 const input=useRef<HTMLInputElement>(null),demoIcon=useRef<SVGSVGElement>(null),sourceRef=useRef<SourceImage|null>(null),previewURL=useRef<string|undefined>(undefined),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [engines]=useState(()=>({analyze:new EngineChannel(),mask:new EngineChannel(),preview:new EngineChannel(),export:new EngineChannel()}));
 const controllers=useRef<Record<string,AbortController>>({}),tickets=useRef({analyze:0,preview:0,export:0});
 const latest=useRef({settings,source,mask,sample,analysis,paused,loading});latest.current={settings,source,mask,sample,analysis,paused,loading};
 const signature=JSON.stringify({settings,source:source?.url});const signatureRef=useRef(signature);signatureRef.current=signature;
 const live=['adjust','crop','rotate','watermark','redact'].includes(toolId);
 const busy=loading||maskBusy||previewBusy||exporting;
 const [visibleBusy,setVisibleBusy]=useState(false);
 useEffect(()=>{if(!busy){setVisibleBusy(false);return;}const timer=setTimeout(()=>setVisibleBusy(true),250);return()=>clearTimeout(timer)},[busy]);
 const say=useCallback((p:Progress)=>{
  setProgress(p);
  const stages:Record<string,[string,string]>={analyzing:['Analizando imagen…','Analyzing image…'],preparing_ai:['Preparando IA. Esto solo ocurre la primera vez.','Preparing AI. This only happens the first time.'],loading_ai:['Preparando la IA…','Preparing AI…'],segmenting:['Quitando fondo…','Removing background…'],refining_ai:['Refinando detalles…','Refining details…'],refining_mask:['Refinando bordes…','Refining edges…'],applying_mask:['Actualizando vista previa…','Updating preview…'],wasm_fallback:['Quitando fondo…','Removing background…'],light_fallback:['Adaptando al dispositivo…','Adapting to your device…'],loading_vector:['Preparando vectorización…','Preparing vectorization…'],tracing:['Vectorizando…','Vectorizing…'],optimizing_svg:['Optimizando…','Optimizing…'],encoding:['Optimizando…','Optimizing…'],optimizing:['Optimizando…','Optimizing…'],exporting:['Exportando a resolución completa…','Exporting at full resolution…'],updating_preview:['Actualizando vista previa…','Updating preview…']};
  if(p.stage==='light_fallback')setNotice(t('Se está usando el modelo ligero por compatibilidad o memoria.','The lightweight model is being used for compatibility or memory.'));
  setMessage(t(...(stages[p.stage]||stages.updating_preview)));
 },[t]);
 const errorText=useCallback((e:unknown)=>{
  const code=e instanceof Error?e.message:String(e);const map:Record<string,[string,string]>={too_large:['La imagen debe pesar como máximo 60 MB.','The image must be 60 MB or smaller.'],too_many_pixels:['Esta imagen supera los 48 megapíxeles. Usa una más pequeña.','This image exceeds 48 megapixels. Use a smaller image.'],invalid_dimensions:['Revisa las medidas: hasta 16384 px por lado y 48 megapíxeles.','Check the dimensions: up to 16384 px per side and 48 megapixels.'],unsupported_image:['Elige un archivo PNG, JPG, WebP o AVIF.','Choose a PNG, JPG, WebP or AVIF file.'],invalid_image:['Este archivo no parece una imagen válida.','This file does not appear to be a valid image.'],model_load_failed:['No se pudo cargar la IA. Revisa la conexión y pulsa Auto.','AI could not load. Check your connection and press Auto.'],model_init_failed:['No se pudo preparar la IA. Cierra otras pestañas o usa una imagen menor.','AI could not start. Close other tabs or use a smaller image.'],no_paths:['No se encontraron formas. Prueba Auto o cambia el modo en ajustes avanzados.','No shapes were found. Try Auto or change the mode in advanced settings.'],too_many_paths:['Demasiadas formas. Aumenta la eliminación de ruido o reduce colores.','Too many shapes. Increase noise removal or reduce colors.'],timeout:['Está tardando demasiado. Prueba una imagen más pequeña.','This is taking too long. Try a smaller image.']};return map[code]?t(...map[code]):t('No se pudo completar la operación. Prueba Auto o elige otra imagen.','The operation could not finish. Try Auto or choose another image.');
 },[t]);
 const controller=(key:string)=>{controllers.current[key]?.abort();return controllers.current[key]=new AbortController()};
 function cancel(){clearTimeout(timer.current);timer.current=undefined;Object.values(controllers.current).forEach(c=>c.abort());tickets.current.analyze++;tickets.current.preview++;tickets.current.export++;setPreviewBusy(false);setMaskBusy(false);setExporting(false);setLoading(false);setPaused(true);setMessage(t('Cancelado. Pulsa Auto para continuar.','Cancelled. Press Auto to continue.'));}
 const set=useCallback((patch:Partial<Settings>)=>{controllers.current.export?.abort();tickets.current.export++;setExporting(false);setPaused(false);setError('');setSettings(s=>{const next={...s,...patch};return JSON.stringify(s)===JSON.stringify(next)?s:next})},[]);
 async function analyze(src:SourceImage){
  const task=controller('analyze'),id=++tickets.current.analyze;setLoading(true);setPaused(false);setError('');say({stage:'analyzing'});
  try{const out=await engines.analyze.run<{analysis:Analysis;patch:Partial<Settings>;preview:ImageData}>({mode:'analyze',blob:src.blob,tool:toolId,width:src.width,height:src.height,format:src.blob.type.split('/')[1]},task.signal,say);
   if(task.signal.aborted||id!==tickets.current.analyze||sourceRef.current!==src)return;
   setAnalysis(out.analysis);setSample(out.preview);setMask(undefined);setSettings({...defaultSettings(src.width,src.height),...out.patch,text:t('Mi marca','My watermark')});setAutoIndex(i=>i+1);
  }catch(e){if(!task.signal.aborted)setError(errorText(e))}finally{if(id===tickets.current.analyze)setLoading(false)}
 }
 async function accept(file?:File){if(!file)return;cancel();setPaused(false);setError('');setLoading(true);
  const id=++tickets.current.analyze;
  try{const next=await readImage(file,file.name);if(id!==tickets.current.analyze){URL.revokeObjectURL(next.url);return;}if(sourceRef.current)URL.revokeObjectURL(sourceRef.current.url);sourceRef.current=next;setSource(next);setPreview(undefined);setExported(undefined);setMask(undefined);setSample(undefined);setAnalysis(undefined);if(previewURL.current)URL.revokeObjectURL(previewURL.current);previewURL.current=undefined;setView('compare');setZoom(100);setNotice(next.width*next.height>12000000?t('Imagen grande: la edición usa una preview ligera; la descarga conserva la resolución.','Large image: editing uses a lightweight preview; download retains full resolution.'):'');await analyze(next);
  }catch(e){if(id===tickets.current.analyze){setError(errorText(e));setLoading(false)}}finally{if(input.current)input.current.value=''}
 }
 function clear(){cancel();Object.values(engines).forEach(e=>e.dispose());if(sourceRef.current)URL.revokeObjectURL(sourceRef.current.url);sourceRef.current=null;if(previewURL.current)URL.revokeObjectURL(previewURL.current);previewURL.current=undefined;setSource(null);setSample(undefined);setAnalysis(undefined);setMask(undefined);setPreview(undefined);setExported(undefined);setError('');setNotice('');}
 async function reset(){if(!sourceRef.current)return;cancel();setPaused(false);await analyze(sourceRef.current)}
  async function demo() {
    try {
      if (!demoIcon.current) return;
      const svg = demoIcon.current.cloneNode(true) as SVGSVGElement;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', '480');
      svg.setAttribute('height', '480');
      svg.setAttribute('stroke', '#102b25');
      svg.setAttribute('stroke-width', '1.2');
      const url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(svg)], {
          type: 'image/svg+xml',
        }),
      );
      try {
        const image = await loadImage(url);
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 640;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 640, 640);
        ctx.drawImage(image, 80, 80, 480, 480);
        await accept(
          new File([await toBlob(canvas)], 'trazo-ejemplo.png', {
            type: 'image/png',
          }),
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setError(errorText(e));
    }
  } useEffect(()=>{
  if(!source||!analysis||loading||toolId!=='background')return;
  const task=controller('mask');setMaskBusy(true);setMask(undefined);
  const lowMemory=((navigator as any).deviceMemory??8)<=2;
  engines.mask.run<Mask>({mode:'mask',blob:source.blob,settings,lowMemory},task.signal,say).then(out=>{if(!task.signal.aborted){setMask(out);if(out.model==='u2netp'&&settings.bgQuality!=='fast')setNotice(t('Se ha elegido el modelo ligero para este dispositivo.','The lightweight model was selected for this device.'));}}).catch(e=>{if(!task.signal.aborted)setError(errorText(e))}).finally(()=>{if(!task.signal.aborted)setMaskBusy(false)});
  return()=>task.abort();
 },[source?.url,autoIndex,settings.bgQuality,analysis,loading,toolId,engines,say,errorText,t]);
 // At most one synchronous WASM task runs. Changes are coalesced into the latest
 // settings; old outputs never replace a newer revision. No queue of slider jobs.
 const previewRunning=useRef(false),previewRequested=useRef(false);
 const launchRef=useRef<()=>void>(()=>{});
 launchRef.current=()=>{
  const state=latest.current;timer.current=undefined;
  if(!state.source||!state.sample||state.paused||state.loading||(toolId==='background'&&!state.mask))return;
  if(previewRunning.current){previewRequested.current=true;return;}
  previewRequested.current=false;previewRunning.current=true;
  const task=controller('preview'),id=++tickets.current.preview,stamp=signatureRef.current;setPreviewBusy(true);setError('');
  engines.preview.run<Output>({mode:'preview',data:state.sample,tool:toolId,settings:state.settings,mask:state.mask,width:state.source.width,height:state.source.height,previewSide:state.analysis?.previewSide},task.signal,say).then(out=>{
   if(task.signal.aborted||id!==tickets.current.preview||stamp!==signatureRef.current)return;
   const url=URL.createObjectURL(out.blob);if(previewURL.current)URL.revokeObjectURL(previewURL.current);previewURL.current=url;setPreview({...out,url,signature:stamp});
  }).catch(e=>{if(!task.signal.aborted&&id===tickets.current.preview&&stamp===signatureRef.current)setError(errorText(e))}).finally(()=>{
   previewRunning.current=false;if(id===tickets.current.preview)setPreviewBusy(false);
   if(previewRequested.current&&!latest.current.paused){clearTimeout(timer.current);timer.current=setTimeout(()=>launchRef.current(),80);}
  });
 };
 useEffect(()=>{
  if(!source||!sample||loading||live||paused||(toolId==='background'&&!mask))return;
  previewRequested.current=true;
  if(!timer.current)timer.current=setTimeout(()=>launchRef.current(),toolId==='resize'?60:110);
 },[signature,sample,mask,loading,paused,live,toolId]);
 useEffect(()=>()=>{clearTimeout(timer.current);Object.values(controllers.current).forEach(c=>c.abort());Object.values(engines).forEach(e=>e.dispose());if(sourceRef.current)URL.revokeObjectURL(sourceRef.current.url);if(previewURL.current)URL.revokeObjectURL(previewURL.current)},[engines]);
 async function exportFile(optimized=false){
  const state=latest.current;if(!state.source||!state.sample)return;
  const stamp=signatureRef.current,task=controller('export'),id=++tickets.current.export;setExporting(true);setError('');say({stage:'exporting'});
  try{const out=exported?.signature===stamp?exported:await engines.export.run<Output>({mode:'export',blob:state.source.blob,tool:toolId,settings:state.settings,mask:state.mask,width:state.source.width,height:state.source.height},task.signal,say);
   if(task.signal.aborted||id!==tickets.current.export||stamp!==signatureRef.current)return;
   if(exported?.signature!==stamp)setExported({...out,signature:stamp,downloadUrl:URL.createObjectURL(out.blob),optimizedUrl:out.optimizedBlob?URL.createObjectURL(out.optimizedBlob):undefined});
   if(!out.goalMet){setError(t('No se alcanzó el tamaño solicitado. Aumenta el límite o cambia el formato.','The requested size could not be reached. Increase the limit or change format.'));return;}
   download(optimized&&out.optimizedBlob?out.optimizedBlob:out.blob,`${state.source.name.replace(/\.[^.]+$/, '')}-${tool.slug}${optimized?'-optimized':''}.${out.extension}`);
  }catch(e){if(!task.signal.aborted)setError(errorText(e))}finally{if(id===tickets.current.export)setExporting(false)}
 }
 const fresh=!!sample&&!loading&&(live||preview?.signature===signature);
 const exact=exported?.signature===signature?exported:undefined;
 const dims=source?outputSize(settings,toolId,source.width,source.height):{width:0,height:0};
 const result:(Output&{url?:string})|undefined=exact?{...exact,url:preview?.url}:preview?{...preview,...dims}:live&&sample?{blob:emptyBlob,extension:'png',goalMet:true,isPreview:true,...dims}:undefined;
 return {ready:true,t,tool,source,settings,result,analysis,sample,live,busy:visibleBusy,working:busy,exporting,loading,error,message,progress,notice,view,setView,zoom,setZoom,backdrop,setBackdrop,input,demoIcon,fresh,canDownload:fresh&&!busy&&!paused,set,accept,clear,demo,cancel,reset,exportFile,downloadUrl:exact?.downloadUrl,optimizedUrl:exact?.optimizedUrl,exact:!!exact};
}
