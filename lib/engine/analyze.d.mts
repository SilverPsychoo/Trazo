import type {Analysis} from './client';
import type {Settings} from '../processing';
export function analyzePixels(data:ImageData,width?:number,height?:number,format?:string):Analysis;
export function recommend(a:Analysis,tool:string):Partial<Settings>;
export function otsu(hist:ArrayLike<number>):number;
