// Provider-neutral normalized polygons. National adapters run offline; the
// renderer consumes classes and provenance, never an IGN service or archive.
export const ENVIRONMENT_CLASSES=Object.freeze(['wood','scrub','meadow','farmland','orchard','garden','wetland','rock','built','bare','open']);
export function validateEnvironment(data){
 if(data?.schema!=='endless-earth-environment-v1'||data.type!=='FeatureCollection'||data.projection!=='EPSG:4326'||!Array.isArray(data.extent)||data.extent.length!==4||!data.extent.every(Number.isFinite)||data.extent[0]>=data.extent[2]||data.extent[1]>=data.extent[3]||!Array.isArray(data.sources)||!data.sources.length||!Array.isArray(data.features)||data.features.length>10000)throw new Error('Invalid environment metadata');
 const ids=new Set();
 for(const s of data.sources){if(typeof s.id!=='string'||ids.has(s.id)||typeof s.name!=='string'||!s.name||typeof s.license!=='string'||!s.license||typeof s.url!=='string'||!s.url.startsWith('https://')||!/^[a-f0-9]{64}$/.test(s.sha256)||!s.source_crs||!s.confidence||!('vintage' in s)||!Array.isArray(s.extent)||!('resolution_m' in s))throw new Error('Missing environment provenance');ids.add(s.id)}
 let vertices=0;
 for(const f of data.features){const p=f.properties,g=f.geometry;if(!p||!ENVIRONMENT_CLASSES.includes(p.class)||!ids.has(p.source_id)||typeof p.original_id!=='string'||!p.confidence||!Number.isFinite(p.priority)||p.priority<0||p.priority>100||g?.type!=='Polygon'||!Array.isArray(g.coordinates)||!g.coordinates.length)throw new Error('Invalid environment feature');
  for(const ring of g.coordinates){if(!Array.isArray(ring)||ring.length<4||ring[0][0]!==ring.at(-1)[0]||ring[0][1]!==ring.at(-1)[1])throw new Error('Invalid environment ring');for(const q of ring){vertices++;if(!Array.isArray(q)||q.length!==2||!q.every(Number.isFinite)||q[0]<-180||q[0]>180||q[1]<-90||q[1]>90)throw new Error('Invalid environment coordinate')}}
 }
 if(vertices>200000)throw new Error('Excessive environment geometry');return data;
}
export function mergeEnvironment(osm,data){
 if(!data)return osm;
 validateEnvironment(data);
 const legacy= data.replaces_generalized_clc_forest?osm.filter(f=>!((f.properties?.natural==='wood'||f.properties?.landuse==='forest')&&(f.properties['CLC:year']||String(f.properties.source??'').includes('CORINE')))):osm;
 return [...legacy,...data.features.map(f=>({...f,properties:{'world:class':f.properties.class,'world:priority':f.properties.priority,'world:source':f.properties.source_id,leaf_type:f.properties.leaf_type}}))];
}
