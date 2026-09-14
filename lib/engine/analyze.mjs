// Small local analysis; no pixels leave the device. Defaults depend on content.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function otsu(hist){
 let count=0,total=0;for(let i=0;i<256;i++){count+=hist[i];total+=i*hist[i];}
 let low=0,sum=0,best=-1,first=127,last=127;
 for(let i=0;i<255;i++){low+=hist[i];sum+=i*hist[i];if(!low||low===count)continue;const score=low*(count-low)*(sum/low-(total-sum)/(count-low))**2;if(score>best+1e-4){best=score;first=last=i;}else if(Math.abs(score-best)<1e-4)last=i;}
 return Math.round((first+last)/2);
}
export function analyzePixels(image,width=image.width,height=image.height,format='png'){
 const {data:d,width:w,height:h}=image,hist=new Uint32Array(256),palette=new Uint32Array(4096);
 let visible=0,transparent=0,gray=0,edges=0,hard=0,flat=0,pairs=0,saturation=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;if(d[i+3]<250)transparent++;if(d[i+3]<16)continue;
  const r=d[i],g=d[i+1],b=d[i+2],lum=Math.round(.2126*r+.7152*g+.0722*b),hi=Math.max(r,g,b),lo=Math.min(r,g,b);visible++;hist[lum]++;palette[(r>>4)*256+(g>>4)*16+(b>>4)]++;if(hi-lo<18)gray++;saturation+=(hi-lo)/Math.max(1,hi);
  if(x&&d[i-1]>=16){const delta=Math.max(Math.abs(r-d[i-4]),Math.abs(g-d[i-3]),Math.abs(b-d[i-2]));pairs++;if(delta>15)edges++;if(delta>65)hard++;if(delta<6)flat++;}
 }
 const n=Math.max(1,visible),bins=Array.from(palette).sort((a,b)=>b-a);let covered=0,count=0;for(const v of bins){if(!v||v/n<.0025||covered/n>.96)break;covered+=v;count++;}
 const percentile=p=>{let c=0;for(let i=0;i<256;i++){c+=hist[i];if(c>=n*p)return i;}return 255;};
 const threshold=otsu(hist),ink=hist.reduce((a,v,i)=>a+(i<threshold?v:0),0)/n;
 const edgeDensity=edges/Math.max(1,pairs),flatness=flat/Math.max(1,pairs),hardness=hard/Math.max(1,edges),grayFraction=gray/n;
 const mono=grayFraction>.94&&count<18&&flatness>.65&&ink<.55;
 const pixel=count<=24&&Math.max(width,height)<=640&&hardness>.82&&flatness>.8;
 const kind=mono?(ink<.22?'signature':'lineart'):pixel?'pixelart':count<=12&&flatness>.7?'logo':count<=40&&flatness>.48?'illustration':'photo';
 return {width,height,format,hasAlpha:transparent>0,alphaFraction:transparent/(w*h),kind,colors:clamp(count,2,64),threshold,edgeDensity,flatness,hardness,grayFraction,saturation:saturation/n,ink,p10:percentile(.1),median:percentile(.5),p90:percentile(.9),orientation:width===height?'square':width>height?'landscape':'portrait',previewSide:width*height>20000000?512:kind==='photo'?768:640};
}
export function recommend(a,tool){
 const mono=['signature','lineart'].includes(a.kind),simple=['logo','pixelart'].includes(a.kind),detail=clamp(Math.round(48+a.edgeDensity*160),35,90);
 const p={mode:mono?'lineart':simple?'poster':'color',colors:a.colors,threshold:a.threshold,invert:false,omitWhite:mono,detail,
 vectorSmooth:a.kind==='pixelart'?0:mono?45:simple?25:55,simplify:mono?18:simple?12:clamp(42-detail/4,10,40),precision:simple?2:3,despeckle:a.kind==='pixelart'?0:mono?2:clamp(Math.round(a.edgeDensity*14),1,8),
 edgeRefine:clamp(Math.round(22+a.edgeDensity*60),20,50),smoothing:a.edgeDensity>.12?6:12,feather:a.edgeDensity>.12?.3:.65,maskContrast:100,bgQuality:'balanced',
 width:a.width,height:a.height,locked:true,resizeMethod:'quality',format:simple||mono?'png':'webp',quality:a.kind==='photo'?clamp(Math.round(78+a.edgeDensity*40),78,88):90,
 cropData:null,cropAspect:0,cropZoom:1,rect:{x:0,y:0,w:100,h:100},fontSize:a.orientation==='portrait'?6:4,textColor:a.median>140?'#17241c':'#ffffff',textOpacity:85,textX:5,textY:88,textAlign:'left'};
 if(tool==='background')p.format='png';
 if(tool==='convert')p.format=a.format==='webp'?(a.hasAlpha?'png':'jpeg'):'webp';
 if(tool==='adjust')Object.assign(p,{exposure:Math.round(clamp(Math.log2(118/Math.max(35,a.median))*.35,-.5,.6)*10)/10,contrast:a.p90-a.p10<130?108:100,shadows:a.p10<25?8:0,highlights:a.p90>245?-6:0});
 if(tool==='redact')p.rect={x:25,y:40,w:50,h:20};
 return p;
}
