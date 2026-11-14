import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const out='docs/mission-23-evidence',walk=JSON.parse(await readFile(out+'/walk.json')),trace=JSON.parse(gunzipSync(await readFile(out+'/walk-trace.json.gz'))),f=trace.frames,stalls=[];
let pending=null,maximumRequestedIdleSeconds=0,ascentM=0,descentM=0;
for(let i=0;i<f.length;i++){
 const row=f[i],requested=row.auto||Math.hypot(row.requested?.forward??0,row.requested?.strafe??0)>.01;
 if(requested&&row.ms>0&&row.step/(row.ms/1000)<.01){pending??={start:row.t,end:row.t,position:row.position,rule:row.refusal,clear:row.clear};pending.end=row.t;maximumRequestedIdleSeconds=Math.max(maximumRequestedIdleSeconds,(pending.end-pending.start)/1000)}
 else if(pending){if((pending.end-pending.start)/1000>=20)stalls.push({...pending,seconds:(pending.end-pending.start)/1000});pending=null}
 if(i){const dy=row.position[1]-f[i-1].position[1];ascentM+=Math.max(0,dy);descentM+=Math.max(0,-dy)}
 assert.ok(row.position.every(Number.isFinite));assert.ok(Number.isFinite(row.groundError)&&row.groundError<.001);assert.ok(row.step<1&&row.clear);
}
if(pending&&(pending.end-pending.start)/1000>=20)stalls.push({...pending,seconds:(pending.end-pending.start)/1000});
const samples=walk.samples.map(s=>({seconds:s.seconds,heapAfterGCMiB:s.heapAfterGC/1048576,bufferMiB:s.alloc.bufferBytes/1048576,textureEstimateMiB:s.alloc.textureBytesEstimate/1048576}));
const result={sourceCommit:walk.sourceCommit,nativeSeconds:(f.at(-1).t-f[0].t)/1000,metres:walk.metres,ascentM,descentM,requestedIdleThresholdSeconds:20,maximumRequestedIdleSeconds,stalls,manualInputFields:'Actual InputController forward/strafe fields; AutoWalk activity also counts as a request. The manual sequence is only 5.5 seconds; this independent analysis covers both modes.',manualRequestedFrames:f.filter(r=>Math.hypot(r.requested?.forward??0,r.requested?.strafe??0)>.01).length,profiles:[...new Set(f.map(r=>r.profile))],views:[...new Set(f.map(r=>r.mode))],habitats:walk.habitats,nearRiverFrames:walk.nearRiverFrames,minRiverDistanceM:walk.minRiverDistanceM,pose:walk.pose,samples,individualTerrainLODChanges:'Not exported per frame. Fine/far invariants are tested exhaustively and LOD is reported at native control stations; changing view/profile is not presented as a count of every LOD switch.',coverageLimit:'Bridge is a separately recorded native out-and-back. Broad habitat and bank-distance counters are not a cadastral access survey or seven-owner-case reproduction.'};
assert.ok(result.nativeSeconds>=1800);assert.deepEqual(stalls,[]);assert.deepEqual(walk.changed,[]);assert.deepEqual(walk.errors,[]);assert.deepEqual(walk.glErrors,[]);assert.deepEqual(walk.suspects,[]);
await writeFile(out+'/walk-analysis.json',JSON.stringify(result,null,2)+'\n');
console.log('PASS independent native trace analysis',result.nativeSeconds,result.metres,{ascentM,descentM,maximumRequestedIdleSeconds,stalls:stalls.length});
