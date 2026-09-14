import {resize} from './pixels';
import type {Settings} from '../processing';
import type {Mask} from './client';
import type {Report} from './types';
// Separable box mean. Used for guided mask refinement, never for segmentation.
function mean(a: Float32Array, w: number, h: number, radius: number) {
  const tmp = new Float32Array(a.length), out = new Float32Array(a.length);
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = -radius; x <= radius; x++) sum += a[y*w + Math.max(0, Math.min(w-1, x))];
    for (let x = 0; x < w; x++) {
      tmp[y*w+x] = sum / (2*radius+1);
      sum += a[y*w+Math.min(w-1,x+radius+1)] - a[y*w+Math.max(0,x-radius)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) sum += tmp[Math.max(0,Math.min(h-1,y))*w+x];
    for (let y = 0; y < h; y++) {
      out[y*w+x] = sum / (2*radius+1);
      sum += tmp[Math.min(h-1,y+radius+1)*w+x] - tmp[Math.max(0,y-radius)*w+x];
    }
  }
  return out;
}
function guided(mask: Float32Array, guide: ImageData, amount: number) {
  const { width:w, height:h, data:d } = guide;
  const n = w*h, lum = new Float32Array(n), square = new Float32Array(n), product = new Float32Array(n);
  for (let i=0;i<n;i++) { lum[i]=(d[i*4]*.2126+d[i*4+1]*.7152+d[i*4+2]*.0722)/255; square[i]=lum[i]*lum[i]; product[i]=lum[i]*mask[i]; }
  const radius = Math.max(1,Math.round(1+amount/20)), mi=mean(lum,w,h,radius), mp=mean(mask,w,h,radius), mii=mean(square,w,h,radius), mip=mean(product,w,h,radius);
  for(let i=0;i<n;i++){ square[i]=(mip[i]-mi[i]*mp[i])/(mii[i]-mi[i]*mi[i]+.002); product[i]=mp[i]-square[i]*mi[i]; }
  const a=mean(square,w,h,radius),b=mean(product,w,h,radius);
  for(let i=0;i<n;i++) mask[i]=mask[i]*(1-amount/100)+Math.max(0,Math.min(1,a[i]*lum[i]+b[i]))*amount/100;
  return mask;
}

export async function applyMask(original:ImageData,baseMask:Mask,s:Settings,report:Report){
 report({stage:'refining_mask'});
 const small=new ImageData(baseMask.width,baseMask.height);
 for(let i=0;i<baseMask.alpha.length;i++){const a=Math.max(0,Math.min(1,(baseMask.alpha[i]-.5)*s.maskContrast/100+.5))*255;small.data[i*4]=small.data[i*4+1]=small.data[i*4+2]=a;small.data[i*4+3]=255;}
 const k=Math.min(1,1280/Math.max(original.width,original.height)),w=Math.max(1,Math.round(original.width*k)),h=Math.max(1,Math.round(original.height*k));
 const maskImage=await resize(small,w,h),guide=await resize(original,w,h);let mask=new Float32Array(w*h);
 for(let i=0;i<mask.length;i++)mask[i]=maskImage.data[i*4]/255;
 if(s.edgeRefine>0)guided(mask,guide,s.edgeRefine);
 const radius=s.smoothing/35+s.feather*k;
 if(radius>0){const r=Math.ceil(radius),smoothed=mean(mask,w,h,r),amount=Math.min(1,radius/r);for(let i=0;i<mask.length;i++)mask[i]=mask[i]*(1-amount)+smoothed[i]*amount;}
 for(let i=0;i<mask.length;i++)maskImage.data[i*4]=maskImage.data[i*4+1]=maskImage.data[i*4+2]=Math.round(mask[i]*255);
 report({stage:'applying_mask'});const full=await resize(maskImage,original.width,original.height);
 for(let i=0;i<original.data.length;i+=4)original.data[i+3]=Math.round(original.data[i+3]*full.data[i]/255);
 return original;
}
