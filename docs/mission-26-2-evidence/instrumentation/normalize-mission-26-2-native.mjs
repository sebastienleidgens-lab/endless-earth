// Correct metadata labels only. Never change native media, timestamps or transforms.
import {readFile,writeFile,mkdir,copyFile,constants} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
const out='docs/mission-26-2-evidence',rows=[];await mkdir(out+'/prior-cohorts',{recursive:true});
for(const label of ['reference','candidate']){
 const file=out+'/'+label+'-native.json';let report;try{report=JSON.parse(await readFile(file));}catch(e){if(e.code==='ENOENT')continue;throw e;}
 try{await copyFile(file,out+'/prior-cohorts/'+label+'-native-recorded.json',constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;}
 for(const c of report.cases){
  if(!c.framesFile)continue;const frames=JSON.parse(gunzipSync(await readFile(out+'/'+c.framesFile)));
  if(!c.timingCorrection){c.environmentClockElapsedS=c.simulationElapsedS;c.longestConsecutiveRunEnvironmentS=c.longestConsecutiveRunSimulationS;}
  c.simulationElapsedS=null;c.longestConsecutiveRunSimulationS=null;
  let count=0,max=0;for(const f of frames){if(f.activity==='running'&&f.gait?.mode==='run'){count++;max=Math.max(max,count);}else count=0;}
  c.controllerElapsedUpperBoundS=frames.length*.25;c.longestConsecutiveRunControllerUpperBoundS=max*.25;
  c.timingCorrection='The transform time field is the environment clock, NOT accumulated controller dt. Exact native controller dt was not exported. One production frame per recorded transform and dt<=0.25 s give an upper bound only. Original recorded reports retained in prior-cohorts; no media, PTS or transforms altered.';
  c.controllerTimeMeasured=false;c.assertions??={};c.assertions.running180WallObserved=c.longestConsecutiveObservedRunS>=180;c.assertions.running180ControllerSecondsVerified=false;delete c.assertions.running180Observed;
  if(c.name==='run-flat-front')c.functionalSuccess=false;
  rows.push({label,name:c.name,sourceSHA:c.sourceSHA,observedWallSeconds:c.observedWallSeconds,environmentClockElapsedS:c.environmentClockElapsedS,controllerElapsedS:null,controllerElapsedUpperBoundS:c.controllerElapsedUpperBoundS,longestConsecutiveRunControllerUpperBoundS:c.longestConsecutiveRunControllerUpperBoundS,controller180Verified:false});
 }
 await writeFile(file,JSON.stringify(report,null,2));
}
await writeFile(out+'/native-timing-analysis.json',JSON.stringify({method:'Environment clock and capped controller dt are separate. Exact controller accumulation unavailable; upper bounds do not grant acceptance. Recorded reports preserved; all media and raw samples unchanged.',cases:rows},null,2));
