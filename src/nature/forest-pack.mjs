import {FOREST_VERSION} from './forest-model.mjs';
const hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(n=>n.toString(16).padStart(2,'0')).join('');
export async function validateForest(data,bindings,anchors){
 if(data?.schema!=='endless-earth-forest-v1'||data.version!==FOREST_VERSION||Object.entries(bindings).some(([k,v])=>data.bindings?.[k]!==v)||!Array.isArray(data.added)||data.added.length>2000||data.added.some(p=>!['x','y','z','scale'].every(k=>Number.isFinite(p[k]))||Math.abs(p.x)>980||Math.abs(p.z)>980||p.scale<=0||p.mapped||!p.forestAdded))throw Error('Invalid or stale forest layer');
 const encode=s=>new TextEncoder().encode(JSON.stringify(s));if(await hash(encode(anchors))!==data.originalTreesSha256||await hash(encode(data.added))!==data.addedSha256)throw Error('Forest anchor checksum mismatch');return data;
}
export async function loadForestLayer(terrain,osmText,anchors){
 try{const response=await fetch(`${import.meta.env.BASE_URL}data/angles-forest.json`);if(!response.ok)throw Error('Prepared forest layer unavailable');const data=await response.json();return await validateForest(data,{terrain:terrain.sourceSha256,environment:terrain.environmentSha256,osm:await hash(new TextEncoder().encode(osmText)),refinement:terrain.relief?.sha256},anchors)}catch(error){console.warn('Forest infill rebuilt from mapped habitat',error);return null}
}
