import {boundedBytes,sha256} from '../planet/tile-manager.mjs';

/** An artistic sidecar never grants support, access or transport rights. */
export function validateEnrichment(value,tileId){
 if(value?.schema!=='world-enrichment-v1'||value.tileId!==tileId||value.pack?.schema!=='regional-enrichment-pack-v1'||typeof value.pack.id!=='string'||!Array.isArray(value.buildings)||value.buildings.length>100000||!Array.isArray(value.details)||value.details.length>10000)throw Error('Invalid enrichment artefact');
 const ids=new Set();
 const color=v=>Number.isInteger(v)&&v>=0&&v<=0xffffff;
 for(const p of value.buildings){
  if(typeof p.id!=='string'||p.sourceId!==p.id||typeof p.worldObjectId!=='string'||p.version!==value.schema||ids.has(p.id)||!Number.isFinite(p.height)||p.height<1||p.height>150||!Number.isInteger(p.levels)||p.levels<1||p.levels>30||!['flat','gabled','hipped'].includes(p.roof?.type)||!Number.isFinite(p.roof.height)||p.roof.height<0||p.roof.height>10||!color(p.roof.color)||!['wall','roof','trim','glass','wood'].every(k=>color(p.palette?.[k]))||![p.facadeSpacing,p.windowWidth,p.windowHeight].every(v=>Number.isFinite(v)&&v>.1&&v<=20)||!Number.isInteger(p.doorEdge)||p.doorEdge<0||typeof p.shutters!=='boolean')throw Error('Invalid enrichment building');
  ids.add(p.id);
 }
 ids.clear();
 for(const d of value.details){if(typeof d.id!=='string'||ids.has(d.id)||!['grass','fern','reed','stone','deadwood'].includes(d.kind)||![d.x,d.y,d.scale,d.rotation].every(Number.isFinite)||d.scale<=0||d.scale>10)throw Error('Invalid enrichment detail');ids.add(d.id);}
 return value;
}

export async function loadEnrichment(entry,base,signal,fetcher=fetch){
 if(!entry) return null;
 if(!Number.isSafeInteger(entry.bytes)||entry.bytes<1||entry.bytes>8*1024*1024||!Number.isSafeInteger(entry.decodedBytes)||entry.decodedBytes<1||entry.decodedBytes>24*1024*1024)throw Error('Enrichment byte budget exceeded');
 const response=await fetcher(new URL(entry.url,entry.baseURL??base),{signal});
 if(!response.ok)throw Error('Enrichment unavailable: '+response.status);
 const packed=await boundedBytes(response.body,entry.bytes+1);
 if(packed.length!==entry.bytes||await sha256(packed)!==entry.sha256)throw Error('Enrichment checksum mismatch');
 const decoded=await boundedBytes(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip')),entry.decodedBytes+1);
 if(decoded.length!==entry.decodedBytes)throw Error('Enrichment decoded length mismatch');
 return validateEnrichment(JSON.parse(new TextDecoder().decode(decoded)),entry.id);
}

/** Feature-sized messages keep the existing worker acknowledgement budget.
 * A city-sized plans array must not be copied in a single worker header. */
export async function enrichTile(tile,entry,base,signal,fetcher=fetch){
 if(!entry){tile.enrichmentStatus={state:'not-provided'};return tile;}
 try{
  const artefact=await loadEnrichment(entry,base,signal,fetcher);
  const sourceIds=new Set(tile.features.filter(f=>f.kind==='building').map(f=>f.id));
  if(artefact.buildings.some(p=>!sourceIds.has(p.id)))throw Error('Enrichment plan has no matching source footprint');
  const plans=new Map(artefact.buildings.map(p=>[p.id,p]));
  for(const feature of tile.features)if(feature.kind==='building')feature.enrichmentPlan=plans.get(feature.id);
  const {buildings,...header}=artefact;
  tile.enrichment={...header,buildingCount:buildings.length};
  tile.enrichmentStatus={state:'verified',sha256:entry.sha256,bytes:entry.bytes,decodedBytes:entry.decodedBytes};
 }catch(error){
  if(signal?.aborted)throw error;
  tile.enrichmentStatus={state:'fallback',error:String(error)};
 }
 return tile;
}
