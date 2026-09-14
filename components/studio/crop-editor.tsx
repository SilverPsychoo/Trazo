'use client';
import { useEffect, useRef } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import type { Settings } from '@/lib/processing';
import type { SourceImage } from '@/lib/images';
export function CropEditor({source,s,set,label}:{source:SourceImage;s:Settings;set:(p:Partial<Settings>)=>void;label:string}) {
  const image=useRef<HTMLImageElement>(null),cropper=useRef<Cropper|null>(null),current=useRef(s),update=useRef(set);
  const readyRef=useRef(false);
  current.current=s;update.current=set;
  useEffect(()=>{
    if(!image.current)return;
    let ready=false;
    const c=new Cropper(image.current,{viewMode:1,dragMode:'move',autoCropArea:1,responsive:true,restore:false,checkOrientation:true,background:false,zoomOnWheel:true,toggleDragModeOnDblclick:false,
      ready(){ready=true;readyRef.current=true;c.setAspectRatio(current.current.cropAspect||NaN);if(current.current.cropData)c.setData(current.current.cropData);sync();},crop(){if(ready)sync();}});
    function sync(){
      const data=c.getData(true),next={x:data.x,y:data.y,width:Math.max(1,data.width),height:Math.max(1,data.height),rotate:data.rotate||0,scaleX:data.scaleX??1,scaleY:data.scaleY??1};
      if(JSON.stringify(next)!==JSON.stringify(current.current.cropData))update.current({cropData:next});
    }
    cropper.current=c;return()=>{ready=false;readyRef.current=false;c.destroy();cropper.current=null;};
  },[source.url]);
  useEffect(()=>{const c=cropper.current;if(!c||!readyRef.current)return;c.rotateTo(s.rotation);c.scale(s.flipX?-1:1,s.flipY?-1:1);},[s.rotation,s.flipX,s.flipY]);
  useEffect(()=>{if(readyRef.current)cropper.current?.setAspectRatio(s.cropAspect||NaN);},[s.cropAspect]);
  useEffect(()=>{if(readyRef.current)cropper.current?.zoomTo(s.cropZoom);},[s.cropZoom]);
  useEffect(()=>{if(!readyRef.current||!cropper.current)return;if(!s.cropData){cropper.current.reset();return;}if(JSON.stringify(cropper.current.getData(true))!==JSON.stringify(s.cropData))cropper.current.setData(s.cropData);},[s.cropData]);
  return <div className="crop-editor" aria-label={label}><img ref={image} src={source.url} alt={label}/></div>;
}
