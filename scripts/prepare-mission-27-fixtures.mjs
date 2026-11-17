import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createProjection} from '../src/planet/coordinates.mjs';

// These coordinates anchor deliberately synthetic test data. No footprint,
// path, terrain, source accuracy or public right here describes the real place.
const definitions=[
 {id:'mountain',origin:{lat:46.45,lon:10.45},pack:'mountain-fixture.json',base:1400,gradeX:.3,gradeY:.18,relief:9,cover:'forest',second:{natural:'bare_rock'}},
 {id:'tropical',origin:{lat:-16,lon:-48},pack:'tropical-fixture.json',base:35,gradeX:.02,gradeY:.025,relief:2,cover:'forest',second:{natural:'wetland'}}
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const tileSize=512,gridSize=17,datum='WGS84-ellipsoid';
const rectangle=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]];
const summary=[];
for(const definition of definitions){
 const directory=`public/planet/validation-m27-${definition.id}`;
 await mkdir(directory+'/tiles',{recursive:true});
 const projection={type:'local-tangent',code:'local-tangent',origin:definition.origin};
 const transform=createProjection(projection),namespace='synthetic-m27-'+definition.id;
 const height=(x,y)=>Number((definition.base+definition.gradeX*x+definition.gradeY*y+definition.relief*Math.sin(x/220)*Math.sin(y/270)).toFixed(5));
 const source={source:'Original synthetic validation fixture. Every elevation, feature, habitat and permission is invented for software tests; no reconstruction of its geographic anchor.',license:'CC0-1.0',retrievedAt:'2026-11-17',sha256:hash(JSON.stringify(definition)),precisionM:null,confidence:'low',inferred:true};
 const features=[
  {id:namespace+':road-south',kind:'road',polygon:false,points:[[0,192],[128,192],[1024,192]],nodes:[namespace+':west-south',namespace+':junction-south',namespace+':east-south'],tags:{highway:'residential',width:'6',access:'yes',synthetic:'yes'}},
  {id:namespace+':road-north',kind:'road',polygon:false,points:[[0,704],[128,704],[1024,704]],nodes:[namespace+':west-north',namespace+':junction-north',namespace+':east-north'],tags:{highway:'residential',width:'6',access:'yes',synthetic:'yes'}},
  {id:namespace+':road-link',kind:'road',polygon:false,points:[[128,0],[128,192],[128,704],[128,1024]],nodes:[namespace+':south',namespace+':junction-south',namespace+':junction-north',namespace+':north'],tags:{highway:'residential',width:'6',access:'yes',synthetic:'yes'}}
 ];
 for(let ty=0;ty<2;ty++)for(let tx=0;tx<2;tx++){
  const x=tx*tileSize,y=ty*tileSize,id=namespace+':'+tx+':'+ty;
  features.push(
   {id:id+':habitat',kind:'landcover',polygon:true,points:rectangle(x,y,x+tileSize,y+tileSize),tags:{landuse:definition.cover,synthetic:'yes',foot:'yes'}},
   {id:id+':a-secondary-habitat',kind:'landcover',polygon:true,points:rectangle(x+325,y+300,x+500,y+500),tags:{...definition.second,synthetic:'yes'}},
   {id:id+':house',kind:'building',polygon:true,points:rectangle(x+206,y+229,x+224,y+243),tags:{building:'house','building:levels':definition.id==='mountain'?'2':'1','roof:shape':'gabled',synthetic:'yes'}},
   {id:id+':utility',kind:'building',polygon:true,points:rectangle(x+257,y+230,x+282,y+249),tags:{building:'shed','building:levels':'1','roof:shape':'flat',synthetic:'yes'}}
  );
 }
 const entries=[];
 for(let ty=0;ty<2;ty++)for(let tx=0;tx<2;tx++){
  const bounds=[tx*tileSize,ty*tileSize,(tx+1)*tileSize,(ty+1)*tileSize],heights=[];
  for(let gy=0;gy<gridSize;gy++)for(let gx=0;gx<gridSize;gx++)heights.push(height(bounds[0]+gx*32,bounds[1]+gy*32));
  const relevant=features.filter(feature=>{const xs=feature.points.map(p=>p[0]),ys=feature.points.map(p=>p[1]);return Math.min(...xs)<=bounds[2]&&Math.max(...xs)>=bounds[0]&&Math.min(...ys)<=bounds[3]&&Math.max(...ys)>=bounds[1];});
  const tile={schema:'planet-tile-v1',id:tx+':'+ty,bounds,grid:{size:gridSize,step:32,datum,heights},features:relevant,fixture:{synthetic:true,namespace,realGeography:false}};
  const raw=Buffer.from(JSON.stringify(tile)),packed=gzipSync(raw,{level:9,mtime:0}),url=`tiles/${tx}-${ty}.tile`;
  await writeFile(directory+'/'+url,packed);
  entries.push({id:tile.id,x:tx,y:ty,bounds,url,encoding:'gzip',bytes:packed.length,decodedBytes:raw.length,sha256:hash(packed),coverageM2:tileSize**2,quality:'synthetic-validation'});
 }
 const geoRing=rectangle(0,0,1024,1024).map(([x,y])=>{const p=transform.unproject({x,y});return [p.lon,p.lat];});
 const spawn=transform.unproject({x:150,y:192});
 const manifest={schema:'planet-region-v1',id:namespace,name:`M27 ${definition.id} · FIXTURE SYNTHÉTIQUE`,projection,verticalDatum:datum,tileSize,sampleStep:32,bounds:[0,0,1024,1024],boundary:{type:'Polygon',coordinates:[geoRing]},communes:[],stations:null,overview:null,navigation:null,enrichmentManifest:'enrichment/manifest.json',sources:{elevation:source,vectors:{...source,sha256:hash(JSON.stringify(features))}},accessDefaults:{publicRoadClasses:true,unknownBridge:'blocked',unknownLand:'blocked',unknownWaterClearance:'blocked'},tiles:entries,coverage:{areaM2:1024**2,preparedM2:1024**2,fraction:1,nodata:0},budgets:{maxResidentTiles:4},fixture:{synthetic:true,production:false,realGeography:false,anchorIsNotSurveyed:true,pack:'../../../enrichment/packs/'+definition.pack,spawn:{...spawn,height:height(150,192),datum},spawnCanonical:{x:150,y:192},targetCanonical:{x:900,y:192},buildingCanonical:{x:215,y:236},elevationRangeM:[height(0,0),height(1024,1024)],note:'The access=yes and foot=yes tags are synthetic test permissions, not public access in the real world.'}};
 await writeFile(directory+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
 if(!process.argv.includes('--sources-only')){
  execFileSync(process.execPath,['scripts/prepare-mission-27.mjs','--region',directory+'/manifest.json','--pack','public/enrichment/packs/'+definition.pack,'--output',directory+'/enrichment','--evidence','docs/mission-27-evidence/fixtures/'+definition.id,'--spacing','32','--max-details','128','--verify'],{stdio:'inherit'});
 }
 summary.push({id:namespace,manifest:directory+'/manifest.json',enrichmentManifest:directory+'/enrichment/manifest.json',pack:'public/enrichment/packs/'+definition.pack,tiles:entries.length,synthetic:true,fixture:manifest.fixture});
}
await mkdir('docs/mission-27-evidence',{recursive:true});
await writeFile('docs/mission-27-evidence/international-fixtures.json',JSON.stringify({schema:'mission-27-international-fixtures-v1',evidenceType:'synthetic',sourceGeneration:'executed',enrichmentGeneration:process.argv.includes('--sources-only')?'not-executed':'executed-with-two-identical-generations',runtimeValidation:'not-executed-by-this-script',fixtures:summary,limits:['These fixtures do not expand real geographic production coverage.','Climate fields select different regional content; monsoon/alpine weather and botanical authenticity are not simulated or proved here.','Rendering, input, collision, save, map, audio and eviction require a separate runtime receipt.']},null,2)+'\n');
console.log('M27 synthetic sources written: '+summary.map(s=>s.manifest).join(', '));
