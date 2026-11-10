import {spawnSync} from 'node:child_process';
const run=(phase,label,extra={})=>{const r=spawnSync(process.execPath,['scripts/browser-road-performance.mjs',phase],{stdio:'inherit',env:{...process.env,TEST_NO_SCREENSHOTS:'1',TEST_SAMPLES:'15',TEST_VIEWS:'village,aerienne,eco,mobile',CAPTURE_LABEL:label,...extra}});if(r.status!==0)process.exit(r.status??1)};
for(let n=1;n<=3;n++)for(const phase of n===1?['071','072','073']:n===2?['073','072','071']:['072','071','073'])run(phase,`final-bench-${phase}-${n}`);
for(const phase of ['071','072','073'])run(phase,`final-terrain-${phase}`,{TEST_TERRAIN_ONLY:'1'});
for(const subset of ['roads','ground'])run('073',`subset-073-${subset}`,{TEST_SURFACE_ONLY:subset,TEST_SAMPLES:'9'});
