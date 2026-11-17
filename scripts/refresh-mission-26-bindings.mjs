import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
// This is an explicit appearance-only runtime transform. No historical packed
// geometry, anchor, provenance, source checksum or generation version changes.
for(const directory of ['angles-decorations','angles-relief-decorations']){
 const path=`public/data/${directory}/manifest.json`,m=JSON.parse(await readFile(path));
 const file='src/nature/material.ts';m.runtimeTransforms.generators[file]=createHash('sha256').update(await readFile(file)).digest('hex');
 m.runtimeTransforms.mission26='Solar shadow reception is identical across near/coarse nature materials. Original pack bytes, geometry, anchors and source fingerprints remain unchanged.';
 await writeFile(path,JSON.stringify(m)+'\n');
}
