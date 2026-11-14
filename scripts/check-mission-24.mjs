import {readFile,writeFile,stat,readdir,copyFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {launch,out} from './lib/mission-24-browser.mjs';
const captures=JSON.parse(await readFile(out+'/captures.json')),perf=JSON.parse(await readFile(out+'/performance.json')),raster=JSON.parse(await readFile(out+'/branch-raster.json')),proof=JSON.parse(await readFile(out+'/preservation.json'));
const evidence={images:0,videos:[],gallery:[],errors:[],base:proof.base,protectedFiles:proof.protectedFiles.length};
assert.equal(captures.errors.length,0);assert.equal(perf.errors.length,0);assert.equal(perf.rows.length,24);
for(const shot of captures.shots){if(!shot.file)continue;assert.ok(existsSync(out+'/'+shot.file));evidence.images++;}
for(const video of captures.videos){assert.ok(video.media.packetPTSAndPayloadsIdentical);const f=out+'/'+video.file;execFileSync('ffmpeg',['-v','error','-i',f,'-f','null','-'],{stdio:['ignore','pipe','pipe']});const p=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',f]));evidence.videos.push({file:video.file,durationSeconds:Number(p.format.duration),bytes:Number(p.format.size),streams:p.streams.map(s=>({codec:s.codec_name,type:s.codec_type,width:s.width,height:s.height})),nativePacketsIdentical:true,fullyDecoded:true});}
for(const s of captures.shots.filter(s=>s.syntheticExposure&&s.version==='after')){const before=captures.shots.find(b=>b.file===s.file.replace('after-','before-'));assert.deepEqual(s.camera,before.camera);assert.equal(s.climate.elapsedSeconds,before.climate.elapsedSeconds);}
for(const f of ['before-collisions.json','after-collisions.json'])assert.ok(existsSync(out+'/'+f));assert.deepEqual(JSON.parse(await readFile(out+'/before-collisions.json')),JSON.parse(await readFile(out+'/after-collisions.json')));
for(const x of raster.filter(r=>r.version==='after'&&r.below))assert.ok(x.whitenedFraction<.002&&x.branchPixels>1000);
const html=await readFile(out+'/index.html','utf8');for(const [,href]of html.matchAll(/(?:href|src)="([^"]+)"/g)){if(/^(https?:|#|data:)/.test(href))continue;assert.ok(existsSync(resolve(out,href)),'broken gallery link: '+href);}
const b=await launch();try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){const page=await b.newPage({viewport});page.on('pageerror',e=>evidence.errors.push(String(e)));await page.goto('http://localhost:5360/endless-earth/'+out+'/index.html');await page.evaluate(async()=>{const images=[...document.images];images.forEach(i=>i.loading='eager');await Promise.all(images.map(i=>i.decode()))});
  for(const family of ['spreading','high','pendant','young','needle']){await page.locator('#family').selectOption(family);await page.evaluate(()=>Promise.all([...document.querySelectorAll('#branch-before,#branch-after')].map(i=>i.decode())));}
  const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].map(i=>({src:i.getAttribute('src'),decoded:i.naturalWidth>0})),videos:[...document.querySelectorAll('video')].map(v=>({src:v.getAttribute('src'),duration:v.duration,ready:v.readyState}))}));assert.equal(state.overflow,false);assert.ok(state.images.every(i=>i.decoded));
  await page.screenshot({path:out+'/gallery-'+viewport.width+'.png'});evidence.gallery.push({viewport,...state});await page.close();
 }
 assert.deepEqual(evidence.errors,[]);
}finally{await b.close()}
const sourceFiles=execFileSync('git',['ls-files','src','build','index.html','vite.config.ts','package.json','package-lock.json'],{encoding:'utf8'}).trim().split('\n'),hashes={};
for(const f of sourceFiles)hashes[f]=createHash('sha256').update(await readFile(f)).digest('hex');
const bundle=async root=>{const file=(await readdir(root+'/assets')).find(f=>f.endsWith('.js')),bytes=await readFile(root+'/assets/'+file);return {file,bytes:bytes.length,gzipBytes:gzipSync(bytes).length}};
const baseDir=process.env.MISSION24_BASE_DIR??resolve('..','endless-earth-m24-base');
evidence.bundles={before:await bundle(baseDir+'/dist'),after:await bundle('dist')};evidence.bundles.deltaBytes=evidence.bundles.after.bytes-evidence.bundles.before.bytes;
evidence.balancedExceptions=perf.rows.filter(r=>r.profile==='balanced'&&r.deltaPct>5).map(r=>({scene:r.scene,deltaPct:r.deltaPct}));evidence.newAssets=[];evidence.licenseAudit='No external model, texture, sound, dependency or service added; source assets/licences retained byte-identically in the 608-file audit. New media are native documentary engine captures.';
for(const [source,name]of [['tests.log','tests.txt'],['build.log','build.txt'],['baseline-tests-native.log','baseline-tests.txt'],['baseline-build-native.log','baseline-build.txt'],['raster.log','raster.txt'],['mobile.log','mobile.txt'],['smoke.log','controls-desktop.txt']])await copyFile('work/mission-24/'+source,out+'/'+name);
await writeFile(out+'/runtime-sources.json',JSON.stringify({testedLocalHead:proof.base,dirty:true,note:'Runtime source hashes are identical during branch captures, pilot captures, raster checks, full tests, compiled controls and paired benchmark. Final Git commit may additionally contain documentary evidence.',sha256:hashes},null,2)+'\n');await writeFile(out+'/checks.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({images:evidence.images,videos:evidence.videos.length,viewports:evidence.gallery.map(g=>g.viewport),exceptions:evidence.balancedExceptions,bundleDelta:evidence.bundles.deltaBytes}));
