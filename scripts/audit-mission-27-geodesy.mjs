import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {toECEF,fromECEF,createECEFTangent} from '../src/planet/coordinates.mjs';

const directory='docs/mission-27-evidence';
await mkdir(directory,{recursive:true});
const command=['--test','--test-reporter=tap','tests/enrichment-geodesy.test.mjs','tests/planet.test.mjs'];
let output,exitCode=0;
try{output=execFileSync(process.execPath,command,{encoding:'utf8'});}
catch(error){output=String(error.stdout??'')+String(error.stderr??'');exitCode=error.status??1;}
await writeFile(directory+'/geodesy-tests.tap',output);
const tests={command:'node '+command.join(' '),exitCode,passed:Number(/^# pass (\d+)/m.exec(output)?.[1]??0),failed:Number(/^# fail (\d+)/m.exec(output)?.[1]??0),log:'geodesy-tests.tap'};
let samples=0,maxECEFErrorM=0,maxHeightErrorM=0;
for(const lat of [-90,-89.99999,-80,-45,-16,0,10,46.6953,80,89.99999,90]){
 for(const lon of [-180,-179.9999,-71,.8844,86.9,179.9999,180])for(const height of [-50,0,69,8848]){
  const p={lat,lon,height,datum:'WGS84-ellipsoid'},a=toECEF(p),b=fromECEF(a),c=toECEF(b);
  maxECEFErrorM=Math.max(maxECEFErrorM,Math.hypot(a.x-c.x,a.y-c.y,a.z-c.z));
  maxHeightErrorM=Math.max(maxHeightErrorM,Math.abs(p.height-b.height));samples++;
 }
}
const crossings=[];
for(const [origin,target]of [
 [{lat:10,lon:179.9999,height:12},{lat:10,lon:-179.9999,height:13}],
 [{lat:90,lon:0,height:0},{lat:89.9999,lon:140,height:8}],
 [{lat:-90,lon:73,height:100},{lat:-89.9999,lon:-111,height:101}]
]){
 origin.datum=target.datum='WGS84-ellipsoid';
 const frame=createECEFTangent({origin,maxDistanceM:5000}),local=frame.project(target),q=frame.unproject(local),a=toECEF(target),b=toECEF(q);
 crossings.push({origin,target,local,errorM:Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)});
}
const result={
 schema:'mission-27-geodesy-audit-v1',evidenceType:'synthetic-numeric',executedAt:new Date().toISOString(),
 sourceFileSHA256:createHash('sha256').update(await readFile('src/planet/coordinates.mjs')).digest('hex'),
 sampleCount:samples,maxECEFRoundTripErrorM:maxECEFErrorM,maxHeightRoundTripErrorM:maxHeightErrorM,crossings,tests,
 limits:[
  'Numerical precision is not geospatial source accuracy.',
  'WGS84 ellipsoidal heights only for the new ENU provider; no IGN69/geoid conversion.',
  'ENU x/y/up are required; no global flat terrain or inter-frame runtime traversal validated.',
  'Global angular cells are addressing contracts; current Vienne files remain historical Lambert cells.',
  'No timezone library or local civil-calendar validation added.'
 ]
};
await writeFile(directory+'/geodesy-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({samples,maxECEFErrorM,maxHeightErrorM,tests}));
process.exitCode=exitCode;
