import { mkdir, writeFile } from 'node:fs/promises';
const center = { lat: 46.6953, lon: 0.8844 };
const radius = 900;
const query = `[out:json][timeout:90];(way(around:${radius},${center.lat},${center.lon})[highway];way(around:${radius},${center.lat},${center.lon})[building];way(around:${radius},${center.lat},${center.lon})[waterway];way(around:${radius},${center.lat},${center.lon})[natural=water];);out geom;`;
const endpoints = ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
let data;
for(const endpoint of endpoints) {
  try {
    const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(100000)});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    data=await response.json(); break;
  } catch(err){ console.warn(`Overpass unavailable at ${endpoint}: ${err.message}`); }
}
if(!data) throw new Error('No Overpass endpoint available. Retry later; no fabricated geographic data will be written.');
const features=[];
for(const el of data.elements ?? []) {
  if(el.type!=='way'||!Array.isArray(el.geometry)||el.geometry.length<2) continue;
  const tags=el.tags??{};
  const isPolygon=Boolean(tags.building||tags.natural==='water');
  const coords=el.geometry.map(p=>[p.lon,p.lat]);
  if(isPolygon && JSON.stringify(coords[0])!==JSON.stringify(coords.at(-1))) coords.push(coords[0]);
  features.push({type:'Feature',id:`osm-way-${el.id}`,properties:{osm_id:el.id,source:'OpenStreetMap',...tags},geometry:{type:isPolygon?'Polygon':'LineString',coordinates:isPolygon?[coords]:coords}});
}
const output={type:'FeatureCollection',metadata:{source:'© OpenStreetMap contributors',license:'ODbL 1.0',retrieved_at:new Date().toISOString(),center,radius_m:radius,warning:'OSM coverage and tagging are incomplete. Not authoritative building heights or terrain.'},features};
await mkdir('public/data',{recursive:true});
await writeFile('public/data/angles-osm.geojson',JSON.stringify(output));
console.log(`Wrote ${features.length} OSM features to public/data/angles-osm.geojson`);
