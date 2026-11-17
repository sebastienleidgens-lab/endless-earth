import {execFileSync,spawn} from 'node:child_process';import {open,writeFile} from 'node:fs/promises';
const phases=[],out='work/mission-26-3/campaign.json';
const run=async(args,log,env={})=>{const phase={args,startedAt:new Date().toISOString()};phases.push(phase);await writeFile(out,JSON.stringify(phases,null,2));const file=await open('work/mission-26-3/'+log,'w');const code=await new Promise(resolve=>{const p=spawn('node',args,{stdio:['ignore',file.fd,file.fd],env:{...process.env,...env}});p.on('exit',resolve);});await file.close();phase.exitCode=code;phase.finishedAt=new Date().toISOString();await writeFile(out,JSON.stringify(phases,null,2));};
while(true){const running=execFileSync('ps',['-eo','args']).toString().split('\n').filter(s=>/^node scripts\/(traverse-mission-26-3|verify-mission-26-3-gait|check-mission-26-3-(offroad|seams)|record-mission-26-3)/.test(s));if(!running.length)break;console.log('Waiting for existing functional/native campaigns',running);await new Promise(r=>setTimeout(r,10000));}
await run(['scripts/check-mission-26-3-fixture.mjs','5416'],'fixture.log');
await run(['scripts/check-mission-26-3-map-ui.mjs','5416'],'map-ui.log');
await run(['scripts/check-mission-26-3-streaming.mjs','5416'],'streaming-network.log');
await run(['scripts/record-mission-26-3-car.mjs','5416'],'native-car.log');
for(const [port,label]of [['5417','reference'],['5416','candidate']])await run(['scripts/benchmark-mission-26-3.mjs',port,label],'benchmark-'+label+'.log',{M262_BENCH_SECONDS:'8'});
