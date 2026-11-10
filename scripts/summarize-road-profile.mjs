import {readFile,readdir,writeFile} from 'node:fs/promises';
const dir='docs/mission-07-3-captures',files=await readdir(dir),rows={};
const stats=a=>{const v=a.toSorted((a,b)=>a-b);return {samples:v.length,median:v[Math.floor(v.length/2)],p95:v[Math.min(v.length-1,Math.floor(v.length*.95))],max:v.at(-1)}};
for(const f of files.filter(f=>/^ablation-.+-[123]\.json$/.test(f))){const d=JSON.parse(await readFile(`${dir}/${f}`,'utf8'));rows[d.variant]??={};for(const[k,v]of Object.entries(d.results)){const r=rows[d.variant][k]??={sync:[],cpu:[]};r.sync.push(...v.samples.map(s=>s.ms));r.cpu.push(...v.samples.map(s=>s.render.cpuSubmitMs));}}
const ablations=Object.fromEntries(Object.entries(rows).map(([k,r])=>[k,Object.fromEntries(Object.entries(r).map(([n,a])=>[n,{syncMs:stats(a.sync),cpuSubmitMs:stats(a.cpu)}]))]));
await writeFile(`${dir}/profile-summary.json`,JSON.stringify({method:'3 passes, 7 synchronized software samples per station per ablation; orders forward, reverse and rotated. Frozen 07.2 source at 72006e0; these intentionally incomplete variants are diagnostics, not deliverables. Ablation differences include compiler interactions and are not additive GPU costs.',ablations},null,2)+'\n');
for(const[k,r]of Object.entries(ablations))console.log(k,Object.fromEntries(Object.entries(r).map(([n,a])=>[n,Math.round(a.syncMs.median)])));
