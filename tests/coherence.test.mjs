import {test} from 'node:test';import assert from 'node:assert/strict';
import {acousticContext,syncEnvironment,temporalContext} from '../src/audio/context.mjs';
import {diurnalBirdsAllowed,birdActivity,BIRD_PROFILES,layerMix} from '../src/audio/profiles.mjs';
import {lifeUniforms,updateLifeTime} from '../src/earthlife/state.mjs';
import {windAtWorld} from '../src/earthlife/wind.mjs';

test('audio follows a shared environmental clock between spatial-query ticks, including DST and season changes',()=>{
 const context=acousticContext({worldTimeMs:Date.parse('2026-05-10T06:00Z'),geo:{lat:46.7,lon:.9},timeZone:'Europe/Paris',water:{distanceM:8},influences:{vegetation:1}}),water=context.water;
 for(const date of ['2026-10-25T00:30Z','2026-10-25T01:30Z','2026-12-21T22:00Z']){
  const worldTimeMs=Date.parse(date),t=temporalContext(worldTimeMs,context.geo,'Europe/Paris'),environment={worldTimeMs,solar:{altitude:-.5},localHour:t.localHour,season:t.season,acousticWeather:{wind:.6,rain:.6,gust:.3},transition:{revision:20,commandRevision:2,manual:true}};
  syncEnvironment(context,environment);assert.equal(context.worldTimeMs,worldTimeMs);assert.equal(context.localHour,t.localHour);assert.equal(context.season,t.season);assert.equal(context.water,water);assert.equal(context.weather,environment.acousticWeather);assert.equal(context.environment,environment.transition);
 }
});
test('existing diurnal calls and future scheduling share the night/rain/strong-wind gate',()=>{
 const context={solarAltitude:.2,weather:{rain:0,wind:.2},localHour:8,season:'spring',provenance:{region:'temperate-europe'}};
 assert.ok(diurnalBirdsAllowed(context));assert.ok(birdActivity(BIRD_PROFILES[0],context,'wood')>0);
 for(const change of [{solarAltitude:-.01},{weather:{rain:.21,wind:.2}},{weather:{rain:0,wind:.81}},{weather:null}]){const c={...context,...change};assert.equal(diurnalBirdsAllowed(c),false);assert.equal(birdActivity(BIRD_PROFILES[0],c,'wood'),0)}
});
test('one gust drives local GPU wind, advected clouds and foliage gain in all profiles',()=>{
 const x=214.42,z=530.66,mean=.52;let calm=null,gust=null;
 for(let t=0;t<180;t+=.1){const w=windAtWorld(x,z,t,mean);if(!calm||w.speed<calm.w.speed)calm={t,w};if(!gust||w.speed>gust.w.speed)gust={t,w}}
 const outcomes=[];
 for(const {t,w} of [calm,gust]){
  updateLifeTime(t-.01,mean,x,z);const before=lifeUniforms.lifeCloudDrift.value.clone();const actual=updateLifeTime(t,mean,x,z);
  assert.equal(actual.speed,w.speed);assert.deepEqual(lifeUniforms.lifeLocalWind.value.toArray(),[w.x,w.z]);
  const drift=lifeUniforms.lifeCloudDrift.value.clone().sub(before);assert.ok(Math.abs(drift.x/.01-(.88+w.x*5))<1e-9);assert.ok(Math.abs(drift.y/.01-(-.475+w.z*5))<1e-9);
  const c={habitat:'wood',influences:{vegetation:1,forest:1},season:'spring',weather:{wind:w.speed,gust:w.gust,rain:0}};
  outcomes.push({speed:w.speed,drift:drift.length(),gain:layerMix(c).find(l=>l.id==='foliage').weight});
  const stable=lifeUniforms.lifeCloudDrift.value.clone();updateLifeTime(t,.95,x,z);assert.deepEqual(lifeUniforms.lifeCloudDrift.value,stable);
 }
 assert.ok(outcomes[1].speed>outcomes[0].speed*1.3);assert.ok(outcomes[1].drift>outcomes[0].drift);assert.ok(outcomes[1].gain>outcomes[0].gain);updateLifeTime(0,.35);
});

test('recording that contains distant thunder is eligible only in storm-strength rain',()=>{
 const c={habitat:'wood',influences:{vegetation:1},season:'spring',weather:{wind:.5,rain:.6}};
 const rain=layerMix(c).find(l=>l.id==='rain');assert.ok(rain.assets.length>0);assert.ok(!rain.assets.includes('rain-fs-501243-1'));
 const storm=layerMix({...c,weather:{wind:.95,rain:1}}).find(l=>l.id==='rain');assert.ok(storm.assets.includes('rain-fs-501243-1'));
});
