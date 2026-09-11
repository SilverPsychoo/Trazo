'use client';
import { useEffect,useRef } from 'react';
import Konva from 'konva';
import type { Settings } from '@/lib/processing';
import type { SourceImage } from '@/lib/images';
import type { Watermark } from '@/lib/engine/types';
export function TextEditor({source,s,set,label}:{source:SourceImage;s:Settings;set:(p:Partial<Settings>)=>void;label:string}) {
  const host=useRef<HTMLDivElement>(null),stage=useRef<Konva.Stage|null>(null),layer=useRef<Konva.Layer|null>(null),current=useRef(s),update=useRef(set);
  current.current=s;update.current=set;
  useEffect(()=>{
    if(!host.current)return;
    const st=new Konva.Stage({container:host.current,width:1,height:1});stage.current=st;layer.current=new Konva.Layer();st.add(layer.current);
    const size=()=>{if(!host.current)return;const w=host.current.clientWidth;st.width(w);st.height(w*source.height/source.width);st.scale({x:w/source.width,y:w/source.width});};
    const observer=new ResizeObserver(size);observer.observe(host.current);size();
    return()=>{observer.disconnect();st.destroy();stage.current=null;layer.current=null;};
  },[source.url,source.width,source.height]);
  useEffect(()=>{
    const l=layer.current,st=stage.current;if(!l||!st)return;l.destroyChildren();
    const tr=new Konva.Transformer({rotateEnabled:true,enabledAnchors:['top-left','top-right','bottom-left','bottom-right'],keepRatio:true,anchorSize:14,rotateAnchorOffset:34,borderStroke:'#557238',anchorFill:'#ffffff',anchorStroke:'#557238'});
    [...s.watermarks,s].forEach((mark,index)=>{
      const text=new Konva.Text({text:mark.text,fontFamily:'Arial',fontStyle:'600',fontSize:source.width*mark.fontSize/100,fill:mark.textColor,opacity:mark.textOpacity/100,x:source.width*mark.textX/100,y:source.height*mark.textY/100,rotation:mark.textRotation,align:mark.textAlign,lineHeight:1.2,draggable:true});
      l.add(text);text.on('click tap',()=>{tr.nodes([text]);l.batchDraw();});
      const commit=()=>{
        const patch={textX:text.x()/source.width*100,textY:text.y()/source.height*100,textRotation:text.rotation(),fontSize:Math.max(.5,Math.min(80,text.fontSize()*text.scaleX()/source.width*100))};
        if(index===current.current.watermarks.length)update.current(patch);
        else update.current({watermarks:current.current.watermarks.map((m,i)=>i===index?{...m,...patch}:m)});
      };
      text.on('dragend transformend',commit);
      if(index===s.watermarks.length)tr.nodes([text]);
    });l.add(tr);l.batchDraw();
  },[s.text,s.fontSize,s.textColor,s.textOpacity,s.textX,s.textY,s.textRotation,s.textAlign,s.watermarks,source.width,source.height]);
  return <div className="text-editor" role="group" aria-label={label}><img src={source.url} alt="" draggable={false}/><div ref={host} className="text-stage"/></div>;
}
