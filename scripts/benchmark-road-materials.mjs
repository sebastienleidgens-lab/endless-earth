// Run after other browser tests finish. Alternating isolated browser instances
// prevent a fixed ordering from hiding software-renderer drift.
import {spawnSync} from 'node:child_process';
for(let run=1;run<=3;run++)for(const phase of run%2?['before','after']:['after','before']){
 const result=spawnSync(process.execPath,['scripts/browser-road-materials.mjs',phase],{stdio:'inherit',env:{...process.env,TEST_VIEWS:'village,aerienne,eco,mobile',TEST_SAMPLES:'15',TEST_NO_SCREENSHOTS:'1',CAPTURE_LABEL:`bench-${phase}-${run}`}});
 if(result.status!==0)process.exit(result.status??1);
}
for(const phase of ['before','after']){
 const result=spawnSync(process.execPath,['scripts/browser-road-materials.mjs',phase],{stdio:'inherit',env:{...process.env,TEST_VIEWS:'village,aerienne,eco,mobile',TEST_SAMPLES:'15',TEST_NO_SCREENSHOTS:'1',TEST_TERRAIN_ONLY:'1',CAPTURE_LABEL:`terrain-${phase}`}});
 if(result.status!==0)process.exit(result.status??1);
}
