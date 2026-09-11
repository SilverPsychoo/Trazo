import { decode, resize, surface, onCanvas, flatten } from './pixels';
import { exportImage } from './codecs';
import { cropPixels } from '../editor-math.mjs';
import type { Settings, Output } from '../processing';
import type { ToolId } from '../catalog';
import type { Report, Watermark } from './types';
const report: Report = progress => self.postMessage({type:'progress',progress});
function rotate(image:ImageData,angle:number,flipX=false,flipY=false) {
  const a=angle*Math.PI/180,c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));
  const {canvas:src}=onCanvas(image);
  const {canvas,ctx}=surface(Math.round(image.width*c+image.height*s),Math.round(image.height*c+image.width*s));
  ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(a);ctx.scale(flipX?-1:1,flipY?-1:1);
  ctx.drawImage(src,-image.width/2,-image.height/2);src.width=src.height=1;
  const result=ctx.getImageData(0,0,canvas.width,canvas.height);canvas.width=canvas.height=1;return result;
}
function adjust(image:ImageData,s:Settings) {
  const d=image.data,exp=2**s.exposure,contrast=s.contrast/100;
  for(let i=0;i<d.length;i+=4){
    let r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255;
    const l=.2126*r+.7152*g+.0722*b;
    const tone=(s.shadows/100)*(1-l)**2*.5+(s.highlights/100)*l*l*.5;
    r=((r*exp+tone)*s.brightness/100-.5)*contrast+.5+s.temperature/600;
    g=((g*exp+tone)*s.brightness/100-.5)*contrast+.5;
    b=((b*exp+tone)*s.brightness/100-.5)*contrast+.5-s.temperature/600;
    const gray=.2126*r+.7152*g+.0722*b,k=s.saturation/100;
    r=gray+(r-gray)*k;g=gray+(g-gray)*k;b=gray+(b-gray)*k;
    const q=s.sepia/100,sr=r*.393+g*.769+b*.189,sg=r*.349+g*.686+b*.168,sb=r*.272+g*.534+b*.131;
    d[i]=(r*(1-q)+sr*q)*255;d[i+1]=(g*(1-q)+sg*q)*255;d[i+2]=(b*(1-q)+sb*q)*255;
  }
  return image;
}
function watermark(image:ImageData,s:Settings) {
  const {canvas,ctx}=onCanvas(image);
  for(const mark of [...s.watermarks,s] as Watermark[]){
    if(!mark.text.trim())continue;
    const size=Math.max(1,image.width*mark.fontSize/100);
    ctx.save();ctx.translate(image.width*mark.textX/100,image.height*mark.textY/100);ctx.rotate(mark.textRotation*Math.PI/180);
    ctx.globalAlpha=mark.textOpacity/100;ctx.fillStyle=mark.textColor;ctx.font=`600 ${size}px Arial, sans-serif`;
    ctx.textBaseline='top';ctx.textAlign=mark.textAlign;
    const lines=mark.text.split('\n').slice(0,8);
    const width=Math.max(...lines.map(line=>ctx.measureText(line).width));
    // Anchor matches the Konva text's top-left origin and explicit alignment width.
    const x=mark.textAlign==='center'?width/2:mark.textAlign==='right'?width:0;
    lines.forEach((line,i)=>ctx.fillText(line,x,i*size*1.2));ctx.restore();
  }
  const out=ctx.getImageData(0,0,image.width,image.height);canvas.width=canvas.height=1;return out;
}
function redact(image:ImageData,s:Settings) {
  const {canvas,ctx}=onCanvas(image),r=cropPixels(s.rect,image.width,image.height);
  if(s.redactMode==='solid') {ctx.fillStyle=s.blockColor;ctx.fillRect(r.x,r.y,r.width,r.height);}
  else {
    const block=Math.max(8,Math.round(8+s.redactStrength*.75));
    const patch=surface(r.width,r.height);
    // Composite onto an opaque surface: no hidden RGB survives under alpha.
    patch.ctx.fillStyle='#ffffff';patch.ctx.fillRect(0,0,r.width,r.height);
    patch.ctx.drawImage(canvas,r.x,r.y,r.width,r.height,0,0,r.width,r.height);
    if(s.redactMode==='pixelate') {
      const tiny=surface(Math.max(1,Math.ceil(r.width/block)),Math.max(1,Math.ceil(r.height/block)));
      tiny.ctx.drawImage(patch.canvas,0,0,tiny.canvas.width,tiny.canvas.height);
      ctx.imageSmoothingEnabled=false;ctx.drawImage(tiny.canvas,r.x,r.y,r.width,r.height);tiny.canvas.width=tiny.canvas.height=1;
    } else {
      // Padded patch + blur, baked into a new raster; no original image or EXIF is exported.
      const pad=block*2,blur=surface(r.width+pad*2,r.height+pad*2);
      blur.ctx.drawImage(patch.canvas,pad,pad);
      blur.ctx.drawImage(patch.canvas,0,0,1,r.height,0,pad,pad,r.height);
      blur.ctx.drawImage(patch.canvas,r.width-1,0,1,r.height,pad+r.width,pad,pad,r.height);
      blur.ctx.drawImage(blur.canvas,0,pad,blur.canvas.width,1,0,0,blur.canvas.width,pad);
      blur.ctx.drawImage(blur.canvas,0,pad+r.height-1,blur.canvas.width,1,0,pad+r.height,blur.canvas.width,pad);
      const filtered=surface(blur.canvas.width,blur.canvas.height);filtered.ctx.filter=`blur(${block}px)`;filtered.ctx.drawImage(blur.canvas,0,0);
      ctx.drawImage(filtered.canvas,pad,pad,r.width,r.height,r.x,r.y,r.width,r.height);
      blur.canvas.width=blur.canvas.height=filtered.canvas.width=filtered.canvas.height=1;
    }
    patch.canvas.width=patch.canvas.height=1;
  }
  const out=ctx.getImageData(0,0,image.width,image.height);canvas.width=canvas.height=1;return out;
}
async function process(blob:Blob,tool:ToolId,s:Settings,base:string):Promise<Output> {
  report({stage:'decoding'});
  let data=await decode(blob),backend:string|undefined;
  if(data.width*data.height>48000000)throw Error('too_many_pixels');
  if(tool==='vector')return (await import('./vector')).vectorize(data,s,base,report);
  report({stage:'processing'});
  if(tool==='background') {
    const out=await (await import('./background')).removeBackground(data,s,base,report);data=out.image;backend=out.backend;
    if(s.addBackground)flatten(data,s.backgroundColor);
  } else if(tool==='resize') {
    if(!Number.isFinite(s.width)||!Number.isFinite(s.height)||s.width<1||s.height<1||s.width>16384||s.height>16384||s.width*s.height>48000000)throw Error('invalid_dimensions');
    report({stage:'resizing'});data=await resize(data,s.width,s.height,s.resizeMethod==='fast');
  } else if(tool==='crop') {
    const c=s.cropData;
    if(c) {
      data=rotate(data,c.rotate,c.scaleX<0,c.scaleY<0);
      const {canvas:src}=onCanvas(data),{canvas,ctx}=surface(c.width,c.height);
      ctx.drawImage(src,-c.x,-c.y);data=ctx.getImageData(0,0,canvas.width,canvas.height);
      canvas.width=canvas.height=src.width=src.height=1;
    } else {
      const r=cropPixels(s.rect,data.width,data.height),{canvas,ctx}=onCanvas(data);
      data=ctx.getImageData(r.x,r.y,r.width,r.height);canvas.width=canvas.height=1;
    }
  } else if(tool==='rotate')data=rotate(data,s.rotation,s.flipX,s.flipY);
  else if(tool==='adjust')data=adjust(data,s);
  else if(tool==='watermark')data=watermark(data,s);
  else if(tool==='redact')data=redact(data,s);
  const format=['compress','convert','background'].includes(tool)?s.format:'png';
  const out=await exportImage(data,format,s.quality,s.backgroundColor,tool==='compress'&&s.targetEnabled?s.targetKB*1024:undefined,report);
  report({stage:'done',percent:100,backend});
  return {blob:out.blob!,extension:format==='jpeg'?'jpg':format,width:data.width,height:data.height,goalMet:out.met,backend};
}
self.onmessage=async({data})=>{
  try{const output=await process(data.blob,data.tool,data.settings,data.base);self.postMessage({type:'done',output});}
  catch(error){console.error('Trazo image engine:',error);self.postMessage({type:'error',code:error instanceof Error?error.message:'processing_failed'});}
};
