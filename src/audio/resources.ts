// @ts-ignore Generated lightweight runtime metadata; full rights manifest is not bundled.
import {AUDIO_ASSETS} from './catalog.mjs';
import type {AudioAsset} from './types';
export const ASSETS=AUDIO_ASSETS as Record<string,Pick<AudioAsset,'file'|'source'|'bytes'|'duration'>>;
export const CACHE_LIMIT=24*1024*1024;
/** Progressive, demand-only loader. Active voices pin their buffers in the LRU.
 * Admission uses the actual context sample rate; the host currently uses 32 kHz.
 * All prepared catalog assets are mono; decoded accounting remains exact. */
export class AudioResources {
 readonly cache=new Map<string,AudioBuffer>();readonly pending=new Map<string,Promise<AudioBuffer|null>>();
 readonly failures=new Map<string,string>();readonly abort=new AbortController();
 bytes=0;loads=0;decodes=0;peakBytes=0;activeLoads=0;deferred=0;deniedDecodes=0;closed=false;
 constructor(readonly context:BaseAudioContext,readonly base:string,readonly pins:()=>Set<string>){ }
 get(id:string){const b=this.cache.get(id);if(b){this.cache.delete(id);this.cache.set(id,b)}return b??null}
 request(id:string):Promise<AudioBuffer|null>{
 const ready=this.get(id);if(ready)return Promise.resolve(ready);
 if(this.pending.has(id))return this.pending.get(id)!;
 if(this.closed||this.failures.has(id)||this.activeLoads>=2||!ASSETS[id])return Promise.resolve(null);
 if(!this.admissible(id)){this.deferred++;return Promise.resolve(null)}
 const p=this.load(id).finally(()=>this.pending.delete(id));this.pending.set(id,p);return p;
 }
 private admissible(id:string){
 // LRU entries can be evicted, active voice buffers cannot. Do not fetch or
 // repeatedly decode a buffer that cannot coexist with the pinned working set.
 const pins=this.pins();let pinnedBytes=0;
 for(const key of pins){const b=this.cache.get(key);if(b)pinnedBytes+=b.length*b.numberOfChannels*4}
 const estimate=Math.ceil(ASSETS[id].duration*this.context.sampleRate)*4;
 return pinnedBytes+estimate<=CACHE_LIMIT;
 }
 private async load(id:string){
 this.activeLoads++;try{
 const a=ASSETS[id];this.loads++;
 const r=await fetch(this.base+a.file,{signal:this.abort.signal});if(!r.ok)throw Error(`HTTP ${r.status}`);
 if(Number(r.headers.get('content-length'))>6*1024*1024)throw Error('Compressed asset exceeds budget');
 const data=await r.arrayBuffer();if(data.byteLength>6*1024*1024)throw Error('Compressed asset exceeds budget');
 if(this.closed)return null;
 if(!this.admissible(id)){this.deniedDecodes++;return null}
 // Bound concurrent decodes too (at most the two in-flight requests).
 this.decodes++;const buffer=await this.context.decodeAudioData(data);if(this.closed)return null;
 const bytes=buffer.length*buffer.numberOfChannels*4;if(bytes>CACHE_LIMIT)throw Error('Decoded asset exceeds budget');
 const pins=this.pins();for(const [key,value] of this.cache){if(this.bytes+bytes<=CACHE_LIMIT&&this.cache.size<16)break;if(pins.has(key))continue;this.cache.delete(key);this.bytes-=value.length*value.numberOfChannels*4}
 if(this.bytes+bytes>CACHE_LIMIT||this.cache.size>=16)return null;
 this.cache.set(id,buffer);this.bytes+=bytes;this.peakBytes=Math.max(this.peakBytes,this.bytes);return buffer;
 }catch(e){if(!this.closed)this.failures.set(id,String(e));return null}finally{this.activeLoads--}
 }
 dispose(){this.closed=true;this.abort.abort();this.cache.clear();this.bytes=0;this.pending.clear()}
 stats(){return {cacheBytes:this.bytes,peakBytes:this.peakBytes,cached:this.cache.size,pending:this.pending.size,activeLoads:this.activeLoads,loads:this.loads,decodes:this.decodes,deferred:this.deferred,deniedDecodes:this.deniedDecodes,failures:Object.fromEntries(this.failures)}}
}
