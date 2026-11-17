import {execFileSync,spawn} from 'node:child_process';import {open} from 'node:fs/promises';
while(execFileSync('ps',['-eo','args']).toString().split('\n').some(s=>/^node scripts\/record-mission-26-3.mjs /.test(s)))await new Promise(r=>setTimeout(r,2000));
const f=await open('work/mission-26-3/native-reference-checked.log','w');await new Promise(resolve=>spawn('node',['scripts/record-mission-26-3.mjs','reference-checked','5417'],{stdio:['ignore',f.fd,f.fd]}).on('exit',resolve));await f.close();
