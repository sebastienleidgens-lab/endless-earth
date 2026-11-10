import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {acousticContext,temporalContext} from '../src/audio/context.mjs';
test('audio admission metadata describes mono buffers at every host sample rate',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/audio/manifest.json',import.meta.url)));assert.ok(Object.keys(manifest.assets).length>=93);
 for(const a of Object.values(manifest.assets)){assert.equal(a.channels,1);assert.ok(a.duration>0&&a.sampleRate>0);for(const rate of [24000,32000,48000])assert.ok(Math.ceil(a.duration*rate)*4<24*1024*1024)}
});
test('precomputed environment time keeps the same acoustic civil-time/season contract',()=>{
 const geo={lat:46.7,lon:.9},timeZone='Europe/Paris';for(const worldTimeMs of [Date.parse('2026-10-25T00:30Z'),Date.parse('2026-10-25T01:30Z'),Date.parse('2026-12-21T22:00Z')]){const temporal=temporalContext(worldTimeMs,geo,timeZone),cold=acousticContext({worldTimeMs,geo,timeZone}),warm=acousticContext({worldTimeMs,geo,timeZone,temporal});assert.deepEqual(warm,cold)}
});
