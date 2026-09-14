import {mkdirSync,existsSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='public/models/isnet',cache='.model-cache/isnet-general-use.onnx';
const upstream='https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx';
const originalHash='60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964a';
const hash=b=>createHash('sha256').update(b).digest('hex');
mkdirSync(root,{recursive:true});mkdirSync('.model-cache',{recursive:true});
async function downloadVerified(path,url,expectedHash,label){
 if(existsSync(path)&&hash(readFileSync(path))===expectedHash)return;
 rmSync(path,{force:true});console.log(`Downloading ${label}…`);
 const response=await fetch(url);if(!response.ok)throw Error(`${label} download failed: ${response.status}`);
 const data=Buffer.from(await response.arrayBuffer());if(hash(data)!==expectedHash)throw Error(`${label} checksum mismatch`);writeFileSync(path,data);
}
await downloadVerified('public/models/u2netp.onnx','https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx','309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8','U2NetP model');
let ready=false;
if(existsSync(root+'/manifest.json')){
 const m=JSON.parse(readFileSync(root+'/manifest.json'));
 ready=m.variant==='primary-output-v1'&&m.parts.every(p=>existsSync(root+'/'+p.name)&&hash(readFileSync(root+'/'+p.name))===p.sha256);
}
if(ready){console.log('Image models verified.');process.exit(0);}
await downloadVerified(cache,upstream,originalHash,'Apache-2.0 ISNet General model (179 MB, first build only)');
const original=readFileSync(cache);if(hash(original)!==originalHash)throw Error('ISNet checksum mismatch');
// ONNX protobuf: retain only the primary GraphProto output. Weights, operations,
// input shape and primary output stay byte-for-byte unchanged.
const varint=(b,p)=>{let n=0,k=0,start=p;while(p<b.length){const c=b[p++];n+=(c&127)*2**k;if(!(c&128))return {n,end:p,start};k+=7;if(k>49)throw Error('Invalid protobuf');}throw Error('Truncated protobuf');};
const enc=n=>{const b=[];do{let x=n%128;n=Math.floor(n/128);b.push(x|(n?128:0));}while(n);return Buffer.from(b)};
function fields(b){const out=[];let p=0;while(p<b.length){const start=p,t=varint(b,p);p=t.end;const wire=t.n%8,field=Math.floor(t.n/8);let payload;
 if(wire===0)p=varint(b,p).end;else if(wire===1)p+=8;else if(wire===5)p+=4;else if(wire===2){const len=varint(b,p);payload=b.subarray(len.end,len.end+len.n);p=len.end+len.n;}else throw Error('Unsupported protobuf wire type');
 out.push({field,wire,payload,raw:b.subarray(start,p)});}return out;}
const model=Buffer.concat(fields(original).map(f=>{if(f.field!==7)return f.raw;let first=true;const graph=Buffer.concat(fields(f.payload).filter(x=>x.field!==12||first&&(first=false,true)).map(x=>x.raw));return Buffer.concat([enc(7*8+2),enc(graph.length),graph]);}));
const parts=[];for(let i=0;i<model.length;i+=20*1024*1024){const bytes=model.subarray(i,i+20*1024*1024),name=`part-${String(parts.length).padStart(2,'0')}.bin`;writeFileSync(root+'/'+name,bytes);parts.push({name,bytes:bytes.length,sha256:hash(bytes)});}
writeFileSync(root+'/manifest.json',JSON.stringify({model:'ISNet General',variant:'primary-output-v1',license:'Apache-2.0',upstream,upstreamSha256:originalHash,bytes:model.length,sha256:hash(model),inputSize:1024,modification:'Only auxiliary graph outputs removed; original weights and 1024 input unchanged.',parts},null,2)+'\n');
console.log(`ISNet ready: ${parts.length} parts, ${model.length} bytes.`);
