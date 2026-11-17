import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {missionBrowserOptions,missionContextOptions} from './lib/mission-26-browser.mjs';

const port=Number(process.env.M27_FIXTURE_PORT??5437),destination='docs/mission-27-evidence/gallery';
await mkdir(destination,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port,strictPort:true}});await server.listen();
const browser=await chromium.launch(missionBrowserOptions()),results=[];
try{
 for(const pack of ['vienne','mountain-fixture','tropical-fixture']){
  const page=await browser.newPage({...missionContextOptions,viewport:{width:1152,height:768},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`http://127.0.0.1:${port}/endless-earth/fixtures/mission-27-enrichment-webgl.html?pack=${pack}`);
  await page.waitForFunction(()=>window.enrichmentFixture?.ready,null,{timeout:60000});
  const profiles=[];
  for(const profile of ['eco','balanced','quality']){
   const sample=await page.evaluate(async profile=>{const f=window.enrichmentFixture,v=await f.profile(profile);f.draw(128);return {...v,pack:f.pack,profile,objects:f.art.details.map(d=>d.id),nativeAnimations:false};},profile);
   if(sample.metrics.enrichment.buildings!==1||sample.metrics.enrichment.details<1||sample.metrics.failures.length)throw Error('Missing active fixture geometry: '+JSON.stringify(sample.metrics));
   profiles.push(sample);
  }
  const gpu=await page.evaluate(()=>{const gl=window.enrichmentFixture.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?{vendor:gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),renderer:gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}:{renderer:gl.getParameter(gl.RENDERER)};});
  const screenshot=`fixture-${pack}.png`;await page.screenshot({path:destination+'/'+screenshot});
  if(errors.length)throw Error('WebGL errors: '+JSON.stringify(errors));
  if(profiles.some(p=>JSON.stringify(p.objects)!==JSON.stringify(profiles[0].objects)))throw Error('Profile changed fixture identity');
  results.push({pack,proof:'fixture',synthetic:true,screenshot:'gallery/'+screenshot,profiles,gpu,errors,limits:'Only deterministic generation, active geometry and colour/depth shader compilation. No geographic coverage, native journey, physical phone, soundscape, or perceptual smoothness is proved.'});
  await page.close();
 }
 const files=['src/planet/render.ts','src/enrichment/render.ts','src/enrichment/load.mjs','src/enrichment/architecture.mjs','src/enrichment/generator.mjs','fixtures/mission-27-enrichment-webgl.html'];
 const hashes={};for(const file of files)hashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
 await writeFile('docs/mission-27-evidence/enrichment-webgl-fixtures.json',JSON.stringify({schema:'mission-27-webgl-fixtures-v1',at:new Date().toISOString(),base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHashes:hashes,results,hardware:'SwiftShader software renderer; not physical GPU or phone validation'},null,2));
 console.log(JSON.stringify({passed:true,packs:results.map(r=>({pack:r.pack,details:r.profiles[0].metrics.enrichment.details,windows:r.profiles[0].metrics.enrichment.windows})),evidence:'docs/mission-27-evidence/enrichment-webgl-fixtures.json'}));
}finally{await browser.close();await server.close();}
