'use client';
import {useEffect,useRef} from 'react';
import Konva from 'konva';
import type {Settings} from '@/lib/processing';
import type {SourceImage} from '@/lib/images';
export function TextEditor({source,s,set,label}:{source:SourceImage;s:Settings;set:(p:Partial<Settings>)=>void;label:string}){
 const host=useRef<HTMLDivElement>(null),stage=useRef<Konva.Stage|null>(null),layer=useRef<Konva.Layer|null>(null),nodes=useRef<Konva.Text[]>([]),transformer=useRef<Konva.Transformer|null>(null);
 const current=useRef(s),update=useRef(set),active=useRef<Konva.Text|null>(null);current.current=s;update.current=set;
 useEffect(()=>{
  if(!host.current)return;const st=new Konva.Stage({container:host.current,width:1,height:1}),l=new Konva.Layer();st.add(l);stage.current=st;layer.current=l;
  const size=()=>{if(!host.current)return;const w=host.current.clientWidth;st.width(w);st.height(w*source.height/source.width);st.scale({x:w/source.width,y:w/source.width});};const observer=new ResizeObserver(size);observer.observe(host.current);size();
  return()=>{observer.disconnect();st.destroy();stage.current=null;layer.current=null;nodes.current=[];transformer.current=null;active.current=null;};
 },[source.url,source.width,source.height]);
 useEffect(()=>{
  const l=layer.current;if(!l)return;nodes.current.forEach(n=>n.destroy());transformer.current?.destroy();
  const tr=new Konva.Transformer({rotateEnabled:true,enabledAnchors:['top-left','top-right','bottom-left','bottom-right'],keepRatio:true,anchorSize:16,rotateAnchorOffset:34,borderStroke:'#557238',anchorFill:'#ffffff',anchorStroke:'#557238'});transformer.current=tr;
  nodes.current=[...current.current.watermarks,current.current].map((mark,index)=>{
   const text=new Konva.Text({draggable:true,fontFamily:'Arial',fontStyle:'600',lineHeight:1.2});l.add(text);
   const commit=()=>{const patch={textX:text.x()/source.width*100,textY:text.y()/source.height*100,textRotation:text.rotation(),fontSize:Math.max(.5,Math.min(80,text.fontSize()*text.scaleX()/source.width*100))};
    if(index===current.current.watermarks.length)update.current(patch);else update.current({watermarks:current.current.watermarks.map((m,i)=>i===index?{...m,...patch}:m)});
   };
   text.on('click tap',()=>{tr.nodes([text]);l.batchDraw()});text.on('dragstart transformstart',()=>{active.current=text});
   text.on('dragmove transform',commit);text.on('dragend transformend',()=>{commit();active.current=null;text.fontSize(text.fontSize()*text.scaleX());text.scale({x:1,y:1});});return text;
  });l.add(tr);tr.nodes(nodes.current.slice(-1));
 },[source.url,source.width,source.height,s.watermarks.length]);
 useEffect(()=>{
  [...s.watermarks,s].forEach((mark,i)=>{const text=nodes.current[i];if(!text||text===active.current)return;text.setAttrs({text:mark.text,fontSize:source.width*mark.fontSize/100,fill:mark.textColor,opacity:mark.textOpacity/100,x:source.width*mark.textX/100,y:source.height*mark.textY/100,rotation:mark.textRotation,align:mark.textAlign,scaleX:1,scaleY:1});});layer.current?.batchDraw();
 },[s,source.url,source.width,source.height]);
 return <div className="text-editor" role="group" aria-label={label}><img src={source.url} alt="" draggable={false}/><div ref={host} className="text-stage"/></div>;
}
