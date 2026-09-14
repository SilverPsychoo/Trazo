// Conservative topology cleanup. Confident holes (handles, gaps) are untouched.
export function inspectMask(alpha,w,h,guide,repair=false){
 const n=w*h,seen=new Uint8Array(n),queue=new Int32Array(n);let fg=0,uncertain=0,perimeter=0,components=0,holes=0;
 for(let i=0;i<n;i++){if(alpha[i]>.5)fg++;if(alpha[i]>.1&&alpha[i]<.9)uncertain++;if(i%w&&((alpha[i]>.5)!==(alpha[i-1]>.5)))perimeter++;if(i>=w&&((alpha[i]>.5)!==(alpha[i-w]>.5)))perimeter++;}
 for(let start=0;start<n;start++){
  if(seen[start])continue;const foreground=alpha[start]>.5;let head=0,tail=1,touches=false,sum=0;queue[0]=start;seen[start]=1;
  while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);sum+=alpha[i];if(!x||!y||x===w-1||y===h-1)touches=true;
   const visit=j=>{if(!seen[j]&&(alpha[j]>.5)===foreground){seen[j]=1;queue[tail++]=j;}};
   if(x)visit(i-1);if(x<w-1)visit(i+1);if(y)visit(i-w);if(y<h-1)visit(i+w);
  }
  if(foreground)components++;else if(!touches)holes++;
  if(!repair||tail>Math.max(12,n*.00008))continue;
  if(foreground&&tail<=Math.max(3,n*.000015)&&sum/tail<.8){for(let k=0;k<tail;k++)alpha[queue[k]]=0;continue;}
  if(foreground||touches||tail>Math.max(6,n*.000035)||sum/tail<.16||!guide)continue;
  let delta=0,border=0;
  for(let k=0;k<tail;k++){const i=queue[k];for(const j of [i-1,i+1,i-w,i+w]){if(j<0||j>=n||alpha[j]<.8)continue;let distance=0;for(let c=0;c<3;c++)distance+=Math.abs(guide.data[i*4+c]-guide.data[j*4+c]);delta+=distance/3;border++;}}
  if(border&&delta/border<14)for(let k=0;k<tail;k++)alpha[queue[k]]=Math.max(alpha[queue[k]],.96);
 }
 const coverage=fg/n,roughness=perimeter/Math.max(1,Math.sqrt(fg)),u=uncertain/n;
 return {coverage,uncertain:u,components,holes,roughness,suspicious:coverage<.015||coverage>.985||u>.2||components>60||holes>50||roughness>45};
}
export function maskScore(q){return q.uncertain*10+Math.max(0,q.components-2)*.03+Math.max(0,q.holes-3)*.02+q.roughness*.005+(q.coverage<.015||q.coverage>.985?5:0);}
