// Offline GeoJSON -> deterministic Web Mercator tile bundles.
// Input must already be licensed, verified geographic data; never synthesizes geography.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tileForLocation, tileKey } from '../src/world/tiles.mjs';

export function coordinatesOf(geometry) {
  if(!geometry || !geometry.coordinates)return [];
  const result=[];
  const visit=value=>{
    if(!Array.isArray(value))return;
    if(value.length>=2 && typeof value[0]==='number' && typeof value[1]==='number'){
      if(Number.isFinite(value[0])&&Number.isFinite(value[1]))result.push(value);
    } else for(const child of value)visit(child);
  };
  visit(geometry.coordinates);
  return result;
}
export function buildTileIndex(collection,zoom=14){
  if(collection?.type!=='FeatureCollection'||!Array.isArray(collection.features))
    throw new Error('Expected GeoJSON FeatureCollection');
  const tiles=new Map();
  let skipped=0;
  for(const [index,feature] of collection.features.entries()){
    if(feature?.type!=='Feature'){skipped++;continue;}
    const coords=coordinatesOf(feature.geometry);
    if(!coords.length){skipped++;continue;}
    // Index by all touched vertex tiles. Cross-tile edges without intermediate
    // vertices need a clipping step before this can be used at national scale.
    const keys=new Set(coords.map(([lon,lat])=>tileKey(tileForLocation(lat,lon,zoom))));
    for(const key of keys){
      if(!tiles.has(key))tiles.set(key,[]);
      tiles.get(key).push({...feature,id:feature.id??`source-feature-${index}`});
    }
  }
  return {tiles,skipped};
}
export async function buildTiles({input,output,zoom=14}){
  const collection=JSON.parse(await readFile(input,'utf8'));
  const {tiles,skipped}=buildTileIndex(collection,zoom);
  if(!tiles.size)throw new Error('No geographic features: refusing empty export');
  const manifest={schema:'endless-earth-tile-manifest-v1',zoom,tileCount:tiles.size,featureReferences:0,skipped,tiles:[]};
  for(const key of [...tiles.keys()].sort()){
    const features=tiles.get(key);
    const file=join(output,...key.split('/'))+'.json';
    await mkdir(resolve(file,'..'),{recursive:true});
    await writeFile(file,JSON.stringify({schema:'endless-earth-tile-v1',key,features}));
    manifest.tiles.push(key);
    manifest.featureReferences+=features.length;
  }
  await mkdir(output,{recursive:true});
  await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}
if(process.argv[1] && import.meta.url===new URL('file://'+resolve(process.argv[1])).href){
  const [input,output,zoomArg]=process.argv.slice(2);
  if(!input||!output)throw new Error('Usage: node scripts/build-tiles.mjs input.geojson output-directory [zoom]');
  const zoom=zoomArg===undefined?14:Number(zoomArg);
  const manifest=await buildTiles({input,output,zoom});
  console.log(JSON.stringify(manifest));
}
