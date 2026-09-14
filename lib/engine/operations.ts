import {surface,onCanvas} from './pixels';
import {cropPixels} from '../editor-math.mjs';
import type {Settings} from '../processing';
import type {Watermark} from './types';
export function rotate(image:ImageData,angle:number,flipX=false,flipY=false) {
  const a=angle*Math.PI/180,c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));
  const {canvas:src}=onCanvas(image);
  const {canvas,ctx}=surface(Math.round(image.width*c+image.height*s),Math.round(image.height*c+image.width*s));
  ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(a);ctx.scale(flipX?-1:1,flipY?-1:1);
  ctx.drawImage(src,-image.width/2,-image.height/2);src.width=src.height=1;
  const result=ctx.getImageData(0,0,canvas.width,canvas.height);canvas.width=canvas.height=1;return result;
}
export function adjust(image:ImageData,s:Settings) {
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
export function watermark(image:ImageData,s:Settings) {
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
export function redact(image:ImageData,s:Settings) {
  const {canvas,ctx}=onCanvas(image),r=cropPixels(s.rect,image.width,image.height);
  if(s.redactMode==='solid') {ctx.fillStyle=s.blockColor;ctx.fillRect(r.x,r.y,r.width,r.height);}
  else {
    const block=Math.max(1,(8+s.redactStrength*.75)*image.width/1200);
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

export function scaledSettings(s:Settings, originalWidth:number, image:ImageData):Settings {
 const k=image.width/originalWidth,c=s.cropData;
 return {...s,feather:s.feather*k,cropData:c?{...c,x:c.x*k,y:c.y*k,width:Math.max(1,c.width*k),height:Math.max(1,c.height*k)}:null};
}
export function lightOperation(image:ImageData,tool:string,s:Settings):ImageData {
 if(tool==='adjust')return adjust(new ImageData(new Uint8ClampedArray(image.data),image.width,image.height),s);
 if(tool==='rotate')return rotate(image,s.rotation,s.flipX,s.flipY);
 if(tool==='watermark')return watermark(image,s);
 if(tool==='redact')return redact(image,s);
 if(tool==='crop'){
  const c=s.cropData;
  if(c){
   if(c.width*c.height>48000000||c.width>16384||c.height>16384||c.width<1||c.height<1)throw Error('invalid_dimensions');
   const data=rotate(image,c.rotate,c.scaleX<0,c.scaleY<0),{canvas:src}=onCanvas(data),{canvas,ctx}=surface(c.width,c.height);
   ctx.drawImage(src,-c.x,-c.y);const out=ctx.getImageData(0,0,canvas.width,canvas.height);src.width=src.height=canvas.width=canvas.height=1;return out;
  }
  const r=cropPixels(s.rect,image.width,image.height),{canvas,ctx}=onCanvas(image),out=ctx.getImageData(r.x,r.y,r.width,r.height);canvas.width=canvas.height=1;return out;
 }
 return image;
}
export function outputSize(s:Settings,tool:string,width:number,height:number){
 if(tool==='resize')return {width:Math.round(s.width),height:Math.round(s.height)};
 if(tool==='crop')return s.cropData?{width:Math.max(1,Math.round(s.cropData.width)),height:Math.max(1,Math.round(s.cropData.height))}:cropPixels(s.rect,width,height);
 if(tool==='rotate'&&s.rotation%180!==0)return {width:height,height:width};
 return {width,height};
}
