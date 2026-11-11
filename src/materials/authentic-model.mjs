// Provider-neutral metric/identity contract. Not imported by the walking game in 13B.
export const AUTHENTIC_VERSION='authentic-materials-13B-v1';
export function authenticIdentity(sourceId,objectId){
 let hash=2166136261;
 for(const c of sourceId+'\0'+objectId){hash^=c.codePointAt(0);hash=Math.imul(hash,16777619)}
 const a=hash>>>0;hash=Math.imul(hash^(hash>>>16),2246822507);const b=hash>>>0;
 return {offset:[(a&65535)/65536,(b&65535)/65536],macroPhase:(b>>>16)/65536};
}
export function mipBytes(width,height,channels){
 let n=0;
 while(true){n+=width*height*channels;if(width===1&&height===1)return n;width=Math.max(1,width>>1);height=Math.max(1,height>>1)}
}
export function validateAuthenticCatalogue(c){
 if(c?.schema!==AUTHENTIC_VERSION||c.tilePixels!==256||c.gutterPixels!==16||c.columns!==4||c.rows!==3||c.dimensions?.join()!=='1152,864'||c.entries?.length!==10)throw Error('Invalid authentic material layout');
 const slots=new Set(),ids=new Set();
 for(const e of c.entries){
  if(typeof e.id!=='string'||ids.has(e.id)||!Number.isInteger(e.slot)||e.slot<0||e.slot>=12||slots.has(e.slot)||e.license!=='CC0-1.0'||e.metres?.length!==2||!e.metres.every(v=>Number.isFinite(v)&&v>.1&&v<50)||!Number.isFinite(e.reliefM)||e.reliefM<0||e.reliefM>.03)throw Error('Invalid authentic material entry');
  ids.add(e.id);slots.add(e.slot);
 }
 const names=['photographic-color.jpg','photographic-data.png','hybrid.png'];
 if(c.files?.length!==3)throw Error('Invalid authentic texture count');
 for(const f of c.files)if(!names.includes(f.file)||!/^[a-f0-9]{64}$/.test(f.sha256)||f.bytes<=0||f.bytes>3e6||f.dimensions?.join()!=='1152,864')throw Error('Invalid authentic file');
 if(new Set(c.files.map(f=>f.file)).size!==3)throw Error('Duplicate authentic file');
 return c;
}
