import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {indexNativeWebM} from './lib/native-webm.mjs';
const label=process.argv[2]??'after',port=Number(process.argv[3]??5380),modes=(process.argv[4]??'walk,run,birds,shadows').split(',');
const out='docs/mission-26-evidence/quality-fixes';await mkdir(out+'/raw',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:640,height:420},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
const wait=async ms=>{const start=Date.now();while(Date.now()-start<ms){await page.waitForTimeout(Math.min(15000,ms-(Date.now()-start)));console.log('NATIVE',label,Math.round((Date.now()-start)/1000),'/',ms/1000)}};
try{
 await page.goto(`http://localhost:${port}/endless-earth/?perf=1&evidence=1&spawnSeed=12345&date=2026-06-21T12:00:00Z&moment=afternoon`);
 await page.waitForFunction(()=>window.q26,null,{timeout:120000});await page.evaluate(()=>{window.p252.profile('eco');window.p252.hold(false)});await page.waitForFunction(()=>window.endlessDiagnostics?.ready,null,{timeout:120000});
 for(const mode of modes){
  await page.evaluate(()=>window.p252.setup({x:-620,z:-290,yaw:Math.PI,zoom:4.8,profile:'balanced'}));
  const route=JSON.parse(await readFile('docs/mission-25-2-evidence/sound-route.json','utf8')).points;
  if(mode==='walk'||mode==='run')await page.evaluate(p=>window.p252.setup({x:p.x,z:p.z,yaw:Math.PI,zoom:4.8,profile:'balanced'}),route[0]);
  if(mode==='birds'||mode==='shadows')await page.evaluate(mode=>window.p252.setup({x:-426.723088216,z:346.512916,yaw:.9,zoom:mode==='birds'?0:4.8,view:mode==='birds'?'first':'third',profile:'balanced',date:'2026-04-15',weather:'clear'}),mode);
  const before=await page.evaluate(()=>window.p252.state());console.log('START',label,mode);
  await page.evaluate(()=>window.q26.start());
  if(mode==='walk'||mode==='run'){
   const loop=[];
   // Placement is diagnostic and happens before this recording only. The
   // controller receives directions, never imposed positions during travel.
   for(let i=0;i<12;i++)loop.push(...(i%2?[...route].reverse():route));
   await page.evaluate(({loop,run})=>window.p252.walk(loop,run),{loop,run:mode==='run'});await wait(183000);
  }else if(mode==='birds'){await wait(95000)}
  else if(mode==='shadows'){
   for(let repeat=0;repeat<3;repeat++)for(const sign of [1,-1]){await page.evaluate(s=>window.p252.input(s),sign);await wait(5000);await page.evaluate(()=>window.p252.input());await wait(1500)}
  }
  await page.evaluate(()=>window.p252.input());await page.screenshot({path:`${out}/${label}-${mode}.png`});
  const data=await page.evaluate(()=>window.q26.stop()),bytes=Buffer.from(data.base64,'base64'),sha256=createHash('sha256').update(bytes).digest('hex');if(sha256!==data.sha256)throw Error('Native blob transport mismatch');
  const path=`${out}/${label}-${mode}.webm`;await writeFile(path,bytes);const media=await indexNativeWebM(path,`${out}/raw/${label}-${mode}.webm`);
  await writeFile(`${out}/${label}-${mode}-transforms.json.gz`,gzipSync(JSON.stringify(data.transforms),{mtime:0}));
  await writeFile(`${out}/${label}-${mode}.json`,JSON.stringify({label,mode,before,after:await page.evaluate(()=>window.p252.state()),method:'Native browser MediaRecorder. No frame interpolation, no speed adjustment; SwiftShader. Actual input/controller motion. Diagnostic placement before recording only.',errors,media,browserBlobSha256:sha256,frames:data.frames},null,2));console.log('SAVED',label,mode,data.frames.length,'render frames');
 }
}finally{await browser.close()}
