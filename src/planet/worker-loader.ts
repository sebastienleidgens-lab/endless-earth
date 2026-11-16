// @ts-ignore Same bounded fallback for environments without module workers.
import {tileLoader} from './tile-manager.mjs';
/** Parsing/validation off the rendering thread, bounded acknowledged batches
 * back to the canonical owner. The worker has no scene or simulation clock. */
export function createWorkerTileLoader(base:URL){
 const metrics={worker:typeof Worker!=='undefined',batches:0,maxReceiveMs:0,maxDecodeWallMs:0};
 if(typeof Worker==='undefined')return {load:tileLoader(base),metrics,dispose(){}};
 const worker=new Worker(new URL('./decode.worker.ts',import.meta.url),{type:'module'}),pending=new Map<number,any>();let next=0,closed=false;
 worker.onmessage=({data:d})=>{const record=pending.get(d.id);if(!record)return;const start=performance.now();
  if(d.type==='header'){record.tile={...d.header,features:[]};metrics.maxDecodeWallMs=Math.max(metrics.maxDecodeWallMs,d.decodeWallMs);}
  else if(d.type==='features'){record.tile.features.push(...d.features);metrics.batches++;worker.postMessage({type:'ack',id:d.id});}
  else if(d.type==='done'){pending.delete(d.id);record.cleanup();record.resolve(record.tile);}
  else if(d.type==='error'){pending.delete(d.id);record.cleanup();record.reject(new Error(d.error));}
  metrics.maxReceiveMs=Math.max(metrics.maxReceiveMs,performance.now()-start);
 };
 worker.onerror=e=>{for(const record of pending.values()){record.cleanup();record.reject(new Error(e.message));}pending.clear();};
 function load(entry:any,signal:AbortSignal){return new Promise((resolve,reject)=>{if(closed||signal.aborted){reject(new DOMException('Tile load cancelled','AbortError'));return;}const id=++next,abort=()=>{worker.postMessage({type:'abort',id});pending.delete(id);reject(new DOMException('Tile load cancelled','AbortError'));};signal.addEventListener('abort',abort,{once:true});pending.set(id,{resolve,reject,cleanup:()=>signal.removeEventListener('abort',abort)});worker.postMessage({type:'load',id,entry,base:base.href});});}
 return {load,metrics,dispose(){closed=true;for(const [id,record]of pending){worker.postMessage({type:'abort',id});record.cleanup();record.reject(new DOMException('Decoder disposed','AbortError'));}pending.clear();worker.terminate();}};
}
