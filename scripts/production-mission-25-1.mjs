import {execFileSync} from 'node:child_process';
import {writeFile,copyFile} from 'node:fs/promises';
const url='http://localhost:5365/endless-earth/?perf=1&spawnSeed=12345&moment=afternoon&weather=clear&date=2026-06-21T12:00:00Z';
const log=execFileSync(process.execPath,['scripts/browser-smoke.mjs'],{env:{...process.env,TEST_URL:url},encoding:'utf8',maxBuffer:4*1024*1024});
await writeFile('docs/mission-25-1-evidence/production-smoke.txt',log);
for(const name of ['aerial','third','first','mobile'])await copyFile('work/visual/'+name+'.png','docs/mission-25-1-evidence/production-'+name+'.png');
await writeFile('docs/mission-25-1-evidence/production.json',JSON.stringify({passed:true,url,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),method:'Uninstrumented compiled Vite build via local preview. Existing browser-smoke assertions: loading, views, admitted movement, eye/camera stability, audio unlock, profile selection and mobile viewport. CDP real-touch evidence is separate in mobile.json. Software SwiftShader; no physical Android or hardware GPU.',log:'production-smoke.txt'},null,2));
console.log('PASS compiled production smoke');
