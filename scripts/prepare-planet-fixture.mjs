import {mkdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createProjection} from '../src/planet/coordinates.mjs';
const out='public/planet/validation-other-frame',projection={type:'local-tangent',code:'local-tangent',origin:{lat:47,lon:-71}},p=createProjection(projection),tiles=[];
await mkdir(out+'/tiles',{recursive:true});
for(let y=0;y<2;y++)for(let x=0;x<2;x++){
 const bounds=[x*2048,y*2048,(x+1)*2048,(y+1)*2048],heights=[];for(let j=0;j<17;j++)for(let i=0;i<17;i++)heights.push(Math.round((100+(bounds[0]+i*128)*.02+Math.sin((bounds[1]+j*128)/900)*20)*100)/100);
 const tile={schema:'planet-tile-v1',id:`${x}:${y}`,bounds,grid:{size:17,step:128,datum:'WGS84-ellipsoid',heights},features:[{id:'synthetic:road',kind:'road',polygon:false,points:[[0,1000],[4096,1000]],nodes:['fixture-a','fixture-b'],tags:{highway:'residential',access:'yes'}},{id:'synthetic:wood',kind:'landcover',polygon:true,points:[[300,1400],[3800,1400],[3800,3800],[300,3800],[300,1400]],tags:{natural:'wood'}}]};
 const raw=Buffer.from(JSON.stringify(tile)),bytes=gzipSync(raw,{mtime:0}),file=`tiles/${x}-${y}.tile`;await writeFile(out+'/'+file,bytes);tiles.push({id:tile.id,x,y,bounds,url:file,encoding:'gzip',bytes:bytes.length,decodedBytes:raw.length,sha256:createHash('sha256').update(bytes).digest('hex'),coverageM2:2048**2,quality:'synthetic-validation'});
}
const ring=[[0,0],[4096,0],[4096,4096],[0,4096],[0,0]].map(([x,y])=>{const q=p.unproject({x,y});return [q.lon,q.lat]});
const manifest={schema:'planet-region-v1',id:'synthetic-other-frame',name:'Validation d’un autre repère · terrain synthétique',projection,verticalDatum:'WGS84-ellipsoid',tileSize:2048,sampleStep:128,bounds:[0,0,4096,4096],boundary:{type:'Polygon',coordinates:[ring]},communes:[],sources:{synthetic:{source:'Original synthetic validation fixture. Not a reconstruction of Quebec or any actual territory.',license:'CC0-1.0',retrievedAt:'2026-11-15',sha256:'0'.repeat(64),precisionM:null,confidence:'low',inferred:true}},accessDefaults:{publicRoadClasses:true},tiles,coverage:{areaM2:4096**2,preparedM2:4096**2,fraction:1,nodata:0},budgets:{maxResidentTiles:4}};
await writeFile(out+'/manifest.json',JSON.stringify(manifest)+'\n');console.log('Prepared four synthetic tiles in a non-French frame; no real regional coverage claimed.');
