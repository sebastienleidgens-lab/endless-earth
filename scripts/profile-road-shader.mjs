import {spawnSync} from 'node:child_process';
import {ABLATIONS} from './lib/road-ablations.mjs';
const run=(phase,label,extra={})=>{
 const result=spawnSync(process.execPath,['scripts/browser-road-performance.mjs',phase],{stdio:'inherit',env:{...process.env,TEST_NO_SCREENSHOTS:'1',TEST_VIEWS:'village,aerienne,eco,mobile',TEST_SAMPLES:'9',CAPTURE_LABEL:label,...extra}});
 if(result.status!==0)process.exit(result.status??1);
};
for(let n=1;n<=3;n++)for(const phase of n%2?['071','072']:['072','071'])run(phase,`reference-${phase}-${n}`);
for(let n=1;n<=3;n++){
 const order=n===1?ABLATIONS:n===2?[...ABLATIONS].reverse():[...ABLATIONS.slice(4),...ABLATIONS.slice(0,4)];
 for(const variant of order)run('072',`ablation-${variant}-${n}`,{TEST_VARIANT:variant,TEST_VIEWS:'village,aerienne,mobile',TEST_SAMPLES:'7'});
}
for(const phase of ['071','072'])for(const subset of ['roads','ground'])run(phase,`subset-${phase}-${subset}`,{TEST_SURFACE_ONLY:subset,TEST_SAMPLES:'9'});
