import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async file=>JSON.parse(await readFile(file));

test('offline enrichment reuses valid artifacts and invalidates only a changed or corrupt tile',async()=>{
 const directory=await mkdtemp(resolve(tmpdir(),'ee-enrichment-pipeline-'));
 try{
  const tiles=resolve(directory,'tiles'),output=resolve(directory,'enrichment'),evidence=resolve(directory,'evidence');
  await mkdir(tiles);const entries=[];
  const makeTile=(index,height=0)=>{
   const x=index*256;
   return {schema:'planet-tile-v1',id:index+':0',bounds:[x,0,x+256,256],grid:{size:3,step:128,datum:'WGS84-ellipsoid',heights:Array(9).fill(height)},features:[
    {id:'fixture:forest:'+index,kind:'landcover',polygon:true,tags:{landuse:'forest'},points:[[x,0],[x+256,0],[x+256,256],[x,256],[x,0]]},
    {id:'fixture:house:'+index,kind:'building',polygon:true,tags:{building:'house'},points:[[x+20,20],[x+35,20],[x+35,32],[x+20,32],[x+20,20]]}
   ]};
  };
  const storeTile=async(index,height=0)=>{
   const tile=makeTile(index,height),bytes=gzipSync(JSON.stringify(tile),{mtime:0});
   await writeFile(resolve(tiles,index+'.tile'),bytes);
   entries[index]={id:tile.id,x:index,y:0,bounds:tile.bounds,url:'tiles/'+index+'.tile',bytes:bytes.length,decodedBytes:Buffer.byteLength(JSON.stringify(tile)),sha256:sha(bytes),coverageM2:256**2};
  };
  await storeTile(0);await storeTile(1);
  const manifest=resolve(directory,'manifest.json');
  const storeManifest=()=>writeFile(manifest,JSON.stringify({schema:'planet-region-v1',id:'synthetic-pipeline-test',projection:{type:'local-tangent',origin:{lat:-8,lon:140}},verticalDatum:'WGS84-ellipsoid',tileSize:256,tiles:entries,communes:[]}));
  await storeManifest();
  const run=()=>execFileSync(process.execPath,['scripts/prepare-mission-27.mjs','--region',manifest,'--pack','public/enrichment/packs/tropical-fixture.json','--output',output,'--evidence',evidence],{cwd:process.cwd(),encoding:'utf8',timeout:30000});
  run();let receipt=await json(resolve(evidence,'generation.json'));assert.equal(receipt.generated,2);assert.equal(receipt.reused,0);
  const first=await json(resolve(output,'manifest.json')),unchangedSHA=first.tiles[1].sha256;
  run();receipt=await json(resolve(evidence,'generation.json'));assert.equal(receipt.generated,0);assert.equal(receipt.reused,2);
  await storeTile(0,1);await storeManifest();run();receipt=await json(resolve(evidence,'generation.json'));assert.equal(receipt.generated,1);assert.equal(receipt.reused,1);
  const changed=await json(resolve(output,'manifest.json'));assert.equal(changed.tiles[1].sha256,unchangedSHA);assert.notEqual(changed.tiles[0].dependencySHA256,first.tiles[0].dependencySHA256);
  await writeFile(resolve(output,changed.tiles[1].url),'corrupt gzip');run();receipt=await json(resolve(evidence,'generation.json'));assert.equal(receipt.generated,1);assert.equal(receipt.reused,1);
  const repaired=await json(resolve(output,'manifest.json'));assert.equal(repaired.tiles[1].sha256,unchangedSHA);
 }finally{await rm(directory,{recursive:true,force:true});}
});
