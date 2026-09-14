'use client';
import {useEffect,useRef} from 'react';
import {lightOperation,scaledSettings} from '@/lib/engine/operations';
import type {Settings} from '@/lib/processing';
export function LiveResult({sample,settings,tool,width,label}:{sample:ImageData;settings:Settings;tool:string;width:number;label:string}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const frame=requestAnimationFrame(()=>{if(!canvas.current)return;const out=lightOperation(sample,tool,scaledSettings(settings,width,sample));canvas.current.width=out.width;canvas.current.height=out.height;canvas.current.getContext('2d')?.putImageData(out,0,0)});return()=>cancelAnimationFrame(frame)},[sample,settings,tool,width]);
 return <canvas ref={canvas} className="live-result" role="img" aria-label={label}/>;
}
