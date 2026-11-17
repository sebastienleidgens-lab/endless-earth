import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createProjection} from '../src/planet/coordinates.mjs';
import {validateEnrichment} from '../src/enrichment/load.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const regionPath=resolve(option('--region','public/planet/fr-86/manifest.json'));
const enrichmentPath=resolve(option('--enrichment',resolve(dirname(regionPath),'enrichment/manifest.json')));
const output=resolve(option('--output','docs/mission-27-evidence'));
const region=JSON.parse(await readFile(regionPath)),index=JSON.parse(await readFile(enrichmentPath)),projection=createProjection(region.projection);
const coveredAreaM2=region.coverage?.areaM2??region.tiles.reduce((sum,t)=>sum+(t.coverageM2??(t.bounds[2]-t.bounds[0])*(t.bounds[3]-t.bounds[1])),0);
const byId=new Map(index.tiles.map(t=>[t.id,t]));
if(index.schema!=='world-enrichment-manifest-v1'||index.tiles.length!==region.tiles.length||byId.size!==index.tiles.length)throw Error('Incomplete or duplicate enrichment manifest');
await mkdir(output,{recursive:true});
const tiles=[],richness=[],immersive=[],features=[],detailOwners=new Map(),duplicateDetails=[],outOfBoundsDetails=[],buildingIdentities=new Map(),conflictingBuildingPlans=[];
const countKinds=items=>Object.fromEntries([...new Set(items.map(f=>f.kind))].sort().map(kind=>[kind,items.filter(f=>f.kind===kind).length]));
const histogram=(items,key)=>{const r={};for(const item of items){const k=key(item);r[k]=(r[k]??0)+1;}return r;};
const forest=f=>f.polygon&&(f.tags?.landuse==='forest'||f.tags?.natural==='wood');
const meadow=f=>f.polygon&&['meadow','grass'].includes(f.tags?.landuse);
const wet=f=>f.kind==='hydro'||f.tags?.natural==='wetland';
const road=f=>f.kind==='road';
const building=f=>f.kind==='building';
const predicates={building,forest,meadow,wet,road,rail:f=>f.kind==='rail',bridge:f=>['road','rail'].includes(f.kind)&&f.tags?.bridge&&f.tags.bridge!=='no',farmland:f=>f.tags?.landuse==='farmland',mixed:f=>forest(f)&&['mixed','needleleaved'].includes(f.tags?.leaf_type)};
const stationRequests=[
 ['angles-reference','Angles-sur-l’Anglin','Angles-sur-l’Anglin','road'],['poitiers-historic','Poitiers ancien','Poitiers','building'],['poitiers-outskirts','Poitiers périphérie','Poitiers','road'],['clain-poitiers','Bords du Clain','Poitiers','wet'],['chatellerault','Châtellerault','Châtellerault','building'],['chauvigny','Chauvigny','Chauvigny','building'],['montmorillon','Montmorillon','Montmorillon','building'],['loudun','Loudun','Loudun','building'],['roche-posay','La Roche-Posay','La Roche-Posay','building'],['lussac','Lussac-les-Châteaux','Lussac-les-Châteaux','building'],['civray','Civray','Civray','building'],['plateau','Plateau cultivé',null,'farmland'],['dense-forest','Forêt cartographiée',null,'forest'],['mixed-forest','Forêt mixte cartographiée',null,'mixed'],['meadow','Prairie cartographiée',null,'meadow'],['wetland','Milieu humide cartographié',null,'wet'],['road-bridge','Ouvrage routier cartographié',null,'bridge'],['rail-bridge','Ouvrage ferroviaire cartographié',null,'rail'],['long-road','Route longue',null,'road'],['hamlet','Hameau stratifié',null,'building'],['border','Tuile de bordure',null,'road'],['sparse','Secteur pauvre en données',null,'road']
].map(([id,label,commune,kind])=>{
 const normalize=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z]/gi,'').toLowerCase();
 const c=commune?region.communes.find(c=>normalize(c.name)===normalize(commune)):null;
 return {id,label,requestedCommune:commune,kind,target:c?projection.project(c):null,candidate:null,distance:Infinity};
});
const stationScore=(request,tile,f,p)=>{
 if(!p)return Infinity;
 if(request.target){const d=Math.hypot(p[0]-request.target.x,p[1]-request.target.y);if(request.id==='poitiers-outskirts'&&(d<3000||d>8000||!['residential','unclassified','service'].includes(f.tags?.highway)))return Infinity;return d;}
 // Stable sampling avoids optimizing only renowned places.
 return parseInt(hash(request.id+'|'+f.id).slice(0,12),16);
};
for(const entry of region.tiles){
 const sourceBytes=await readFile(resolve(dirname(regionPath),entry.url));
 if(sourceBytes.length!==entry.bytes||hash(sourceBytes)!==entry.sha256)throw Error('Source integrity failure '+entry.id);
 const source=JSON.parse(gunzipSync(sourceBytes)),e=byId.get(entry.id);
 let artifact=null,integrity=false,error=null;
 if(e)try{const bytes=await readFile(resolve(dirname(enrichmentPath),e.url));integrity=bytes.length===e.bytes&&hash(bytes)===e.sha256&&e.sourceSHA256===entry.sha256;if(!integrity)throw Error('Artifact SHA/size/source mismatch');const decoded=gunzipSync(bytes);if(decoded.length!==e.decodedBytes)throw Error('Decoded artifact size mismatch');artifact=validateEnrichment(JSON.parse(decoded),entry.id);}catch(cause){error=String(cause);artifact=null;integrity=false;}
 const kinds=countKinds(source.features),habitats=histogram(source.features.filter(f=>f.kind==='landcover'),f=>f.tags.landuse??f.tags.natural??'unknown'),details=artifact?.details??[],buildings=artifact?.buildings??[];
 for(const d of details){if(detailOwners.has(d.id))duplicateDetails.push({id:d.id,owners:[detailOwners.get(d.id),entry.id]});else detailOwners.set(d.id,entry.id);if(d.x<entry.bounds[0]||d.x>=entry.bounds[2]||d.y<entry.bounds[1]||d.y>=entry.bounds[3])outOfBoundsDetails.push({tile:entry.id,id:d.id,x:d.x,y:d.y});}
 for(const b of buildings){const digest=hash(JSON.stringify(b)),old=buildingIdentities.get(b.id);if(old&&old.sha256!==digest)conflictingBuildingPlans.push({id:b.id,owners:[old.tile,entry.id],hashes:[old.sha256,digest]});else if(!old)buildingIdentities.set(b.id,{tile:entry.id,sha256:digest,family:b.family,roofType:b.roof?.type,heightStatus:b.provenance?.height});}
 const contentBearing=buildings.length+details.length>0;
 const row={id:entry.id,bounds:entry.bounds,coverageM2:entry.coverageM2,sourceSHA256:entry.sha256,sourceFeatureCounts:kinds,sourceHabitatFeatures:habitats,artifact:e?{url:e.url,sha256:e.sha256,bytes:e.bytes,decodedBytes:e.decodedBytes,integrity,buildingPlans:buildings.length,detailPlans:details.length}:null,generated:!!artifact,contentBearing,status:artifact?(contentBearing?'generated-not-render-validated':'generated-empty'):'failed',renderObserved:false,artisticCoverageFraction:null,groundEnrichedFraction:null,limitations:['Source coverage and generated plans do not establish close-range artistic parity.','Only a sparse bounded sample of mapped habitats receives decorative detail.'],error};
 tiles.push(row);richness.push({id:entry.id,sourceFeatureCounts:kinds,sourceHabitatFeatures:habitats,generatedBuildingPlans:buildings.length,generatedDetailPlans:details.length,detailKinds:histogram(details,d=>d.kind),detailHabitats:histogram(details,d=>d.habitat??'unknown'),generatorAudit:artifact?.audit??null,perceptiveParity:'not-validated',warnings:details.length===0?['No habitat detail generated; source habitat and exclusions must be reviewed.']:[]});
 immersive.push({id:entry.id,sourceHabitats:habitats,artifactIntegrity:integrity,capabilities:{sourceTerrain:true,sourceRoads:!!kinds.road,sourceWater:!!kinds.hydro,sourceBuildings:!!kinds.building,decorativePlans:details.length,enrichedBuildingPlans:buildings.length},runtimeObserved:false,animationRate:null,spatialAudioObserved:null,seasonMatrixObserved:false,status:'inventory-only-not-runtime-validated',limitations:['Source and plan availability only; not proof that all systems are active in this tile.','Shared historical weather/wind clock is reused by the renderer; department-wide perceptive parity remains open.']});
 const geoCorners=[[entry.bounds[0],entry.bounds[1]],[entry.bounds[2],entry.bounds[1]],[entry.bounds[2],entry.bounds[3]],[entry.bounds[0],entry.bounds[3]],[entry.bounds[0],entry.bounds[1]]].map(([x,y])=>{const p=projection.unproject({x,y});return [p.lon,p.lat];});
 features.push({type:'Feature',properties:{id:entry.id,generated:!!artifact,artifactIntegrity:integrity,buildingPlans:buildings.length,detailPlans:details.length,renderObserved:false,status:row.status},geometry:{type:'Polygon',coordinates:[geoCorners]}});
 for(const f of source.features){
  // Full source features may span many tiles. A station belongs to the tile
  // containing its actual selected vertex, not an arbitrary cached copy.
  const sourcePointIndex=f.points.findIndex(p=>p[0]>=entry.bounds[0]&&p[0]<entry.bounds[2]&&p[1]>=entry.bounds[1]&&p[1]<entry.bounds[3]);
  if(sourcePointIndex<0)continue;
  const p=f.points[sourcePointIndex];
  for(const request of stationRequests){
   if(!predicates[request.kind]?.(f))continue;
   if(request.id==='rail-bridge'&&!(f.tags?.bridge&&f.tags.bridge!=='no'))continue;
   if(request.id==='road-bridge'&&f.kind!=='road')continue;
   if(request.id==='border'&&entry.coverageM2>region.tileSize**2*.8)continue;
   if(request.id==='sparse'&&source.features.length>500)continue;
   if(request.id==='long-road'&&(!['primary','secondary','tertiary','trunk','motorway'].includes(f.tags?.highway)||f.points.slice(1).reduce((sum,q,i)=>sum+Math.hypot(q[0]-f.points[i][0],q[1]-f.points[i][1]),0)<1000))continue;
   const score=stationScore(request,entry,f,p);if(score>=request.distance)continue;
   const geo=projection.unproject({x:p[0],y:p[1]});
   request.candidate={tile:entry.id,featureId:f.id,featureKind:f.kind,sourcePointIndex,projected:{x:p[0],y:p[1],crs:region.projection.code},geo,tags:f.tags,sourceSHA256:entry.sha256};
   request.distance=score;
  }
 }
}
const communes=region.communes.map(c=>{const p=projection.project(c),entry=region.tiles.find(t=>p.x>=t.bounds[0]&&p.x<t.bounds[2]&&p.y>=t.bounds[1]&&p.y<t.bounds[3]),row=entry?tiles.find(t=>t.id===entry.id):null;return {...c,projected:p,centroidTile:entry?.id??null,centroidHasArtifact:row?.generated??false,renderObserved:false,status:row?.generated?'centroid-covered-art-not-validated':'centroid-not-covered',method:'Manifest source commune centre point, not exhaustive municipal polygon artistic coverage'};});
const stations=stationRequests.map(({distance,target,...request})=>({...request,nearestCommuneCentreDistanceM:target&&request.candidate?distance:null,status:request.candidate?'source-point-selected-not-visited':'missing-required-source',cameraHeightM:1.65,contextStatus:'requested-environment-not-field-certified',provenance:'source-derived',access:'not-certified-by-station-selection',limitations:['A source geometry vertex is an observation target, not a verified standing position or public access.','Camera placement requires runtime terrain/support/admission checks.']}));
const seed='mission27-stratified-v1';
const stratum=t=>t.coverageM2<region.tileSize**2*.8?'administrative-edge':(t.sourceFeatureCounts.building??0)>500?'built-dense':(t.sourceFeatureCounts.hydro??0)>30?'hydro-rich':(t.sourceHabitatFeatures.forest??0)+(t.sourceHabitatFeatures.wood??0)>10?'forest-rich':(t.sourceHabitatFeatures.farmland??0)>10?'agricultural':Object.values(t.sourceFeatureCounts).reduce((a,b)=>a+b,0)<500?'source-sparse':'mixed';
const strata=new Map();for(const tile of tiles){const s=stratum(tile);if(!strata.has(s))strata.set(s,[]);strata.get(s).push(tile);}
const sampled=[],selected=new Set();
const addSample=(tile,s)=>{if(selected.has(tile.id))return;selected.add(tile.id);sampled.push({tileId:tile.id,stratum:s,sourceFeatureCounts:tile.sourceFeatureCounts,sourceHabitatFeatures:tile.sourceHabitatFeatures,status:'selected-not-visited'});};
for(const [s,members]of [...strata].sort(([a],[b])=>a.localeCompare(b))){members.sort((a,b)=>hash(seed+a.id).localeCompare(hash(seed+b.id)));for(const t of members.slice(0,4))addSample(t,s);}
for(const tile of [...tiles].sort((a,b)=>hash(seed+a.id).localeCompare(hash(seed+b.id)))){if(sampled.length>=32)break;addSample(tile,stratum(tile));}
const write=(name,value)=>writeFile(resolve(output,name),JSON.stringify(value,null,2));
await write('coverage-tiles.json',{schema:'mission-27-coverage-v1',expected:region.tiles.length,generated:tiles.filter(t=>t.generated).length,contentBearingTiles:tiles.filter(t=>t.contentBearing).length,emptyArtifacts:tiles.filter(t=>t.generated&&!t.contentBearing).map(t=>t.id),renderObserved:0,artisticCoverageFraction:null,tiles});
await write('coverage-communes.json',{schema:'mission-27-commune-coverage-v1',expected:region.communes.length,centroidCovered:communes.filter(c=>c.centroidHasArtifact).length,renderObserved:0,communes});
await write('coverage.geojson',{type:'FeatureCollection',features});
await write('richness-audit.json',{schema:'mission-27-richness-audit-v1',method:'Offline source and artifact inventory; no perceptual verdict inferred',tiles:richness,totals:{buildingPlans:richness.reduce((n,t)=>n+t.generatedBuildingPlans,0),uniqueBuildingPlans:buildingIdentities.size,buildingFamilies:histogram([...buildingIdentities.values()],b=>b.family??'unknown'),roofTypes:histogram([...buildingIdentities.values()],b=>b.roofType??'unknown'),buildingHeightStatus:histogram([...buildingIdentities.values()],b=>b.heightStatus??'unknown'),detailPlans:richness.reduce((n,t)=>n+t.generatedDetailPlans,0),detailPlanDensityPerKm2:detailOwners.size/(coveredAreaM2/1e6)},ownership:{uniqueDetails:detailOwners.size,duplicateDetails,outOfBoundsDetails,conflictingBuildingPlans}});
await write('visual-stations.json',{schema:'mission-27-visual-stations-v1',method:'Existing source-feature vertices and commune-centre proximity, never invented coordinates or admissions',stations,stratifiedSample:{seed,count:sampled.length,strata:Object.fromEntries([...strata].map(([s,t])=>[s,t.length])),method:'Stratification by source feature counts and tile administrative coverage, not verified habitat surface fractions',tiles:sampled}});
await write('department-immersive-parity-audit.json',{schema:'mission-27-immersive-parity-audit-v1',expected:region.tiles.length,inventoryCount:immersive.length,runtimeObserved:0,perceptiveParity:'not-validated',tiles:immersive});
console.log(JSON.stringify({tiles:tiles.length,generated:tiles.filter(t=>t.generated).length,communes:communes.length,centroidsCovered:communes.filter(c=>c.centroidHasArtifact).length,stationsSelected:stations.filter(s=>s.candidate).length,artisticCoverageFraction:null,renderObserved:0}));
