// @ts-ignore The exact same checksum/schema decoder is used by Node and fixtures.
import {tileLoader,boundedBytes,sha256} from './tile-manager.mjs';
// @ts-ignore Shared binary raster decoder.
import {decodeFineGrid,fineVertex} from './fine-grid.mjs';
const scope=globalThis as any,controllers=new Map<number,AbortController>(),acks=new Map<number,()=>void>();
scope.onmessage=async({data:d}:any)=>{
 if(d.type==='ack'){acks.get(d.id)?.();acks.delete(d.id);return;}
 if(d.type==='abort'){controllers.get(d.id)?.abort();acks.get(d.id)?.();acks.delete(d.id);return;}
 if(d.type!=='load')return;
 const controller=new AbortController();controllers.set(d.id,controller);const started=performance.now();
 try{
  const tile=await tileLoader(d.base)(d.entry,controller.signal);let transfer:ArrayBuffer[]=[];
  if(d.entry.fine){const f=d.entry.fine,response=await fetch(new URL(f.url,f.baseURL??d.base),{signal:controller.signal});if(!response.ok)throw Error('Contact raster unavailable');const packed=await boundedBytes(response.body,f.bytes+1);if(packed.length!==f.bytes||await sha256(packed)!==f.sha256)throw Error('Contact raster checksum mismatch');const raw=await boundedBytes(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip')),f.size*f.size*2+1);tile.contact=decodeFineGrid(raw,f,tile.bounds);transfer=[tile.contact.values.buffer];tile.parentGrid={...tile.grid};const heights=[...tile.grid.heights],n=tile.grid.size,stride=(f.size-1)/(n-1);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const h=fineVertex(tile.contact,x*stride,y*stride);if(h!==null)heights[y*n+x]=h;}tile.grid={...tile.grid,heights,derivation:'128 m parent of acquired 2 m contact raster; original RGE pack unchanged'};}
  const {features,...header}=tile;
  scope.postMessage({type:'header',id:d.id,header,decodeWallMs:performance.now()-started},transfer);
  const send=async(batch:any[])=>{controller.signal.throwIfAborted();const ready=new Promise<void>(r=>acks.set(d.id,r));scope.postMessage({type:'features',id:d.id,features:batch});await ready;controller.signal.throwIfAborted();};
  let batch:any[]=[],points=0;
  for(const feature of features){if(batch.length&&(points+feature.points.length>4096||batch.length>=256)){await send(batch);batch=[];points=0;}batch.push(feature);points+=feature.points.length;}
  if(batch.length)await send(batch);scope.postMessage({type:'done',id:d.id});
 }catch(e){scope.postMessage({type:'error',id:d.id,error:String(e)});}finally{controllers.delete(d.id);acks.delete(d.id);}
};
