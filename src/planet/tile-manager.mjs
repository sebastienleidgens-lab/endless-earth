export async function sha256(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function validateTile(t,entry){
 if(t?.schema!=='planet-tile-v1'||t.id!==entry.id||!Array.isArray(t.bounds)||t.bounds.length!==4||!t.bounds.every(Number.isFinite)||t.bounds.some((v,i)=>v!==entry.bounds[i])||!Number.isInteger(t.grid?.size)||t.grid.size<2||t.grid.size>129||!Array.isArray(t.grid.heights)||t.grid.heights.length!==t.grid.size**2||!t.grid.heights.every(v=>Number.isFinite(v)&&v>-1000&&v<10000)||!Array.isArray(t.features)||t.features.length>100000)throw Error('Invalid geographic tile');
 for(const f of t.features)if(typeof f.id!=='string'||!Array.isArray(f.points)||f.points.length>100000||!f.points.every(p=>Array.isArray(p)&&p.length>=2&&p.every(Number.isFinite)))throw Error('Invalid tile feature');return t;
}
async function boundedBytes(stream,max){const reader=stream.getReader(),parts=[];let length=0;try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>max)throw Error('Tile decode budget exceeded');parts.push(value);}}finally{reader.releaseLock()}const bytes=new Uint8Array(length);let p=0;for(const b of parts){bytes.set(b,p);p+=b.length}return bytes;}
export function tileLoader(base,fetcher=fetch){return async(entry,signal)=>{
 const r=await fetcher(new URL(entry.url,base),{signal});if(!r.ok)throw Error('Tile unavailable: '+r.status);const raw=await boundedBytes(r.body,Math.min(entry.bytes+1,8*1024*1024));if(raw.byteLength!==entry.bytes||await sha256(raw)!==entry.sha256)throw Error('Geographic tile checksum mismatch');
 const decoded=entry.encoding==='gzip'||entry.url.endsWith('.tile')||entry.url.endsWith('.gz')?await boundedBytes(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip')),Math.min(entry.decodedBytes+1,24*1024*1024)):raw;
 if(decoded.byteLength!==entry.decodedBytes)throw Error('Tile decoded length mismatch');return validateTile(JSON.parse(new TextDecoder().decode(decoded)),entry);
};}
/** Bounded asynchronous residency. Failed/absent tiles have NO physical floor. */
export class WorldTileManager {
 constructor(manifest,{load,onLoad=()=>{},onUnload=()=>{},capacity=16,concurrency=2,byteBudget=32*1024*1024}={}){this.entries=new Map(manifest.tiles.map(t=>[t.id,t]));this.load=load;this.onLoad=onLoad;this.onUnload=onUnload;this.capacity=capacity;this.concurrency=concurrency;this.byteBudget=byteBudget;this.resident=new Map();this.pending=new Map();this.failed=new Map();this.wanted=new Map();this.clock=0;this.closed=false;this.metrics={loaded:0,unloaded:0,failures:0,residentBytes:0,active:0,queued:0};}
 demand(items){if(this.closed)return;let bytes=0;const admitted=[];for(const i of items.filter(i=>this.entries.has(i.id)).sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id))){const size=this.entries.get(i.id).decodedBytes;if(admitted.length>=this.capacity||bytes+size>this.byteBudget)continue;admitted.push([i.id,i.priority]);bytes+=size;}this.wanted=new Map(admitted);this.clock++;
  for(const [id,record]of this.resident)if(this.wanted.has(id))record.used=this.clock;
  for(const [id,controller]of this.pending)if(!this.wanted.has(id))controller.abort();this.evict();this.pump();
 }
 evict(){for(const [id,r]of [...this.resident].sort((a,b)=>a[1].used-b[1].used)){if(this.wanted.has(id))continue;if(this.resident.size<this.capacity&&this.metrics.residentBytes<this.byteBudget)break;this.resident.delete(id);this.metrics.residentBytes-=r.bytes;this.onUnload(r.tile);this.metrics.unloaded++;}}
 pump(){if(this.closed)return;const queue=[...this.wanted].filter(([id])=>!this.resident.has(id)&&!this.pending.has(id)&&!this.failed.has(id));this.metrics.queued=queue.length;
  for(const [id]of queue){if(this.pending.size>=this.concurrency)break;const entry=this.entries.get(id);if(entry.decodedBytes>this.byteBudget){this.failed.set(id,'tile-exceeds-memory-budget');continue;}const controller=new AbortController();this.pending.set(id,controller);this.metrics.active=this.pending.size;
   Promise.resolve().then(()=>this.load(entry,controller.signal)).then(tile=>{
    if(this.closed||controller.signal.aborted||!this.wanted.has(id))return;
    // Evict before installation, including when the capacity is all demanded.
    for(const [old,r]of [...this.resident].sort((a,b)=>a[1].used-b[1].used)){if(this.resident.size<this.capacity&&this.metrics.residentBytes+entry.decodedBytes<=this.byteBudget)break;if(old===id)continue;this.resident.delete(old);this.metrics.residentBytes-=r.bytes;this.onUnload(r.tile);this.metrics.unloaded++;}
    if(this.metrics.residentBytes+entry.decodedBytes>this.byteBudget)throw Error('Resident budget exhausted');
    this.onLoad(tile);this.resident.set(id,{tile,bytes:entry.decodedBytes,used:this.clock});this.metrics.residentBytes+=entry.decodedBytes;this.metrics.loaded++;
   }).catch(e=>{if(!controller.signal.aborted&&!this.closed){this.failed.set(id,String(e));this.metrics.failures++;}}).finally(()=>{this.pending.delete(id);this.metrics.active=this.pending.size;this.pump()});
  }
 }
 retry(){this.failed.clear();this.pump();}
 dispose(){this.closed=true;for(const p of this.pending.values())p.abort();for(const r of this.resident.values())this.onUnload(r.tile);this.pending.clear();this.resident.clear();this.wanted.clear();this.failed.clear();this.metrics.residentBytes=0;}
}
export function tileDemand(manifest,p,velocity={x:0,y:0},radius=1){const s=manifest.tileSize,cx=Math.floor(p.x/s),cy=Math.floor(p.y/s),wanted=[];for(const t of manifest.tiles){const dx=t.x-cx,dy=t.y-cy;if(Math.abs(dx)>radius+1||Math.abs(dy)>radius+1)continue;const forward=(dx*velocity.x+dy*velocity.y)/Math.max(1,Math.hypot(velocity.x,velocity.y));if(Math.abs(dx)>radius||Math.abs(dy)>radius){if(forward<.5)continue;}wanted.push({id:t.id,priority:Math.hypot(dx,dy)-Math.max(0,forward)*.3})}return wanted;}
