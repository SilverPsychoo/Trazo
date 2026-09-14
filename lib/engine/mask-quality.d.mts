export type Quality={coverage:number;uncertain:number;components:number;holes:number;roughness:number;suspicious:boolean};
export function inspectMask(alpha:Float32Array,w:number,h:number,guide?:ImageData,repair?:boolean):Quality;
export function maskScore(q:Quality):number;
