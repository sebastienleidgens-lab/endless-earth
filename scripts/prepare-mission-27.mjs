import {readFile, writeFile, mkdir, stat} from 'node:fs/promises';
import {resolve, dirname, relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import {performance} from 'node:perf_hooks';
import {execFileSync} from 'node:child_process';
import {generateEnrichment} from '../src/enrichment/generator.mjs';
import {createProjection, legacyAdapter} from '../src/planet/coordinates.mjs';
import {validateEnrichment} from '../src/enrichment/load.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const flags = process.argv.slice(2);
const option = (name, fallback) => { const i=flags.indexOf(name); return i<0?fallback:flags[i+1]; };
const regionPath=resolve(option('--region','public/planet/fr-86/manifest.json'));
const packPath=resolve(option('--pack','public/enrichment/packs/vienne.json'));
const output=resolve(option('--output',resolve(dirname(regionPath),'enrichment')));
const evidence=resolve(option('--evidence','docs/mission-27-evidence'));
const verify=flags.includes('--verify');
const sourceManifest=await readFile(regionPath),region=JSON.parse(sourceManifest);
const packBytes=await readFile(packPath),pack=JSON.parse(packBytes);
if(region.schema!=='planet-region-v1'||!Array.isArray(region.tiles))throw Error('Unsupported region manifest');
const ruleFiles=['src/enrichment/generator.mjs','src/enrichment/architecture.mjs','src/enrichment/load.mjs','src/planet/surface.mjs','src/planet/coordinates.mjs','scripts/prepare-mission-27.mjs'];
const ruleHashes=Object.fromEntries(await Promise.all(ruleFiles.map(async file=>[file,hash(await readFile(file))])));
const projection=createProjection(region.projection);
// The legacy protected footprint is data from the existing player adapter,
// never an administrative test inside the universal generation algorithm.
let protectedBounds;
 if(region.protectedBoundary){
 const protectedData=JSON.parse(await readFile(resolve(dirname(regionPath),region.protectedBoundary.url)));
 const pilotOrigin=pack.protectedRegion?.origin;
 if(!pilotOrigin)throw Error('Protected boundary requires a declared regional-pack origin');
 const pilot=legacyAdapter(pilotOrigin),b=protectedData.bounds;
 const corners=[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]]].map(([x,z])=>projection.project(pilot.toGeo({x,z})));
 protectedBounds=[Math.min(...corners.map(p=>p.x)),Math.min(...corners.map(p=>p.y)),Math.max(...corners.map(p=>p.x)),Math.max(...corners.map(p=>p.y))];
}
const options={maxDetails:Number(option('--max-details','512')),spacing:Number(option('--spacing','128')),coordinateNamespace:JSON.stringify(region.projection)+'/'+region.verticalDatum,...(protectedBounds?{protectedBounds}:{})};
if(!Number.isFinite(options.maxDetails)||options.maxDetails<0||options.maxDetails>4096||!Number.isFinite(options.spacing)||options.spacing<8)throw Error('Unsafe generation budget');
await mkdir(output,{recursive:true});await mkdir(evidence,{recursive:true});
let previous;
try{previous=JSON.parse(await readFile(resolve(output,'manifest.json')));}catch{previous={tiles:[]};}
const prior=new Map(previous.tiles.map(t=>[t.id,t]));
const entries=[],generation=[];const started=performance.now();
for(const source of region.tiles){
 const begin=performance.now(),bytes=await readFile(resolve(dirname(regionPath),source.url));
 if(bytes.length!==source.bytes||hash(bytes)!==source.sha256)throw Error('Source tile checksum mismatch '+source.id);
 const dependencySHA256=hash(JSON.stringify({source:source.sha256,pack:hash(packBytes),rules:ruleHashes,options}));
 const old=prior.get(source.id),filename=source.id.replaceAll(':','-')+'.pack';
 let artifact,packed,decoded,reused=false,repeatability=null;
 if(old?.dependencySHA256===dependencySHA256){
  try{packed=await readFile(resolve(output,old.url));if(hash(packed)===old.sha256&&packed.length===old.bytes){decoded=gunzipSync(packed);artifact=JSON.parse(decoded);reused=artifact.tileId===source.id&&artifact.schema==='world-enrichment-v1';}}catch{}
 }
 if(!reused||verify){
  const tile=JSON.parse(gunzipSync(bytes));
  const one=validateEnrichment(generateEnrichment(tile,pack,options),tile.id);
  const first=Buffer.from(JSON.stringify(one));
  if(verify){const second=Buffer.from(JSON.stringify(generateEnrichment(tile,pack,options)));repeatability={identical:first.equals(second),sha256:hash(first)};if(!repeatability.identical)throw Error('Non-deterministic generation '+source.id);if(reused&&!decoded.equals(first))throw Error('Cached generation differs '+source.id);}
  artifact=one;decoded=first;packed=gzipSync(decoded,{level:9,mtime:0});
  if(!reused)await writeFile(resolve(output,filename),packed);
 }
 const entry={id:source.id,url:filename,sha256:hash(packed),bytes:packed.length,decodedBytes:decoded.length,sourceSHA256:source.sha256,dependencySHA256,buildingPlans:artifact.buildings?.length??0,detailPlans:artifact.details?.length??0};
 entries.push(entry);generation.push({id:source.id,reused,wallMs:performance.now()-begin,repeatability});
 if(entries.length%50===0)console.log('Prepared '+entries.length+'/'+region.tiles.length);
}
const manifest={schema:'world-enrichment-manifest-v1',version:1,region:region.id,sourceManifestSHA256:hash(sourceManifest),pack:{id:pack.id,version:pack.version,sha256:hash(packBytes)},ruleHashes,options,tiles:entries,coverage:{expected:region.tiles.length,generated:entries.length,sourceGeographyChanged:false,renderedObserved:0,status:'generated-not-render-validated'},provenance:{geometry:'Source OSM footprints and landcover; height and appearance inferred unless tagged',decoration:'procedural-decorative; no access or collision authority',license:'ODbL 1.0 source vectors; original procedural rules; see source-manifest.json'}};
await writeFile(resolve(output,'manifest.json'),JSON.stringify(manifest));
const receipt={
 schema:'mission-27-generation-v1',
 sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 sourceManifestSHA256:hash(sourceManifest),
 manifestSHA256:hash(JSON.stringify(manifest)),ruleHashes,options,tiles:entries.length,
 buildingPlans:entries.reduce((n,t)=>n+t.buildingPlans,0),
 detailPlans:entries.reduce((n,t)=>n+t.detailPlans,0),
 packedBytes:entries.reduce((n,t)=>n+t.bytes,0),
 decodedBytes:entries.reduce((n,t)=>n+t.decodedBytes,0),
 wallMs:performance.now()-started,
 verification:verify?'two-identical-generations-per-tile':'not-requested',
 generated:entries.length-generation.filter(t=>t.reused).length,
 reused:generation.filter(t=>t.reused).length,results:generation,
 limitations:['Artifact generation is not evidence of visual rendering or artistic equivalence.','Terrain and physical support are unchanged.','No 50 cm LiDAR was acquired by this command.']
};
await writeFile(resolve(evidence,'generation.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify({...receipt,results:undefined},null,2));
