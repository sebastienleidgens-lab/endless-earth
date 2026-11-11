import {test} from 'node:test';
import assert from 'node:assert/strict';
import {momentDate,MOMENTS,solar,weatherStep,WEATHER} from '../src/nature/climate.mjs';
import {lifeUniforms,updateLifeTime} from '../src/earthlife/state.mjs';
const angles={lat:46.6953,lon:.8844,timeZone:'Europe/Paris'};
test('five stable solar-relative moments track season and latitude',()=>{
 assert.equal(Object.keys(MOMENTS).length,5);assert.equal(Object.keys(WEATHER).length,6);
 for(const site of [angles,{lat:45.44,lon:12.33,timeZone:'Europe/Rome'},{lat:0,lon:-78.5,timeZone:'America/Guayaquil'},{lat:-33.9,lon:151.2,timeZone:'Australia/Sydney'}])for(const ref of ['2026-06-21T12:00Z','2026-12-21T12:00Z']){
  const r=momentDate('morning',ref,site),a=momentDate('afternoon',ref,site),e=momentDate('evening',ref,site),n=momentDate('night',ref,site);
  assert.equal(r.polar,null);assert.ok(+r.date>r.sunrise&&+r.date<r.solarNoon);assert.ok(+a.date>a.solarNoon&&+a.date<a.sunset);assert.ok(+e.date<e.sunset&&+e.date>e.solarNoon);assert.ok(solar(n.date,site.lat,site.lon).altitude<-.1);assert.equal(+r.date,+momentDate('morning',ref,site).date);
 }
 assert.notEqual(+momentDate('morning','2026-06-21',angles).date%86400000,+momentDate('morning','2026-12-21',angles).date%86400000);
});
test('civil day comes from site timezone even across the dateline and DST',()=>{
 const site={lat:-36.85,lon:174.76,timeZone:'Pacific/Auckland'},r=momentDate('morning','2026-06-21T23:30Z',site);
 assert.equal(new Intl.DateTimeFormat('en-CA',{timeZone:site.timeZone}).format(r.date),'2026-06-22');
 assert.equal(+momentDate('real','2026-10-25T01:30Z',angles).date,Date.parse('2026-10-25T01:30Z'));
});
test('polar day and polar night use explicit phases, never invent a sunset',()=>{
 const site={lat:78.22,lon:15.65,timeZone:'Arctic/Longyearbyen'};
 for(const moment of Object.keys(MOMENTS).filter(m=>m!=='real')){const summer=momentDate(moment,'2026-06-21',site),winter=momentDate(moment,'2026-12-21',site);assert.equal(summer.polar,'polar-day');assert.equal(winter.polar,'polar-night');assert.ok(solar(summer.date,site.lat,site.lon).altitude>0);assert.ok(solar(winter.date,site.lat,site.lon).altitude<0)}
});
test('manual weather reaches 98 percent within 2.6 seconds, natural remains slow; rapid reversals stay continuous',()=>{
 let w={...WEATHER.clear};for(let i=0;i<26;i++)weatherStep(w,WEATHER.storm,.1,w,.65);assert.ok(w.rain>.98);const prior=w.rain;weatherStep(w,WEATHER.clear,.016,w,.65);assert.ok(w.rain<prior&&w.rain>prior-.03);
 assert.ok(weatherStep(WEATHER.clear,WEATHER.storm,1).rain<.03);
 for(let i=0;i<1000;i++){weatherStep(w,WEATHER[Object.keys(WEATHER)[i%6]],.016,w,.65);for(const v of Object.values(w))assert.ok(v>=0&&v<=1)}
});
test('cloud drift integrates the shared wind continuously and changing wind does not teleport clouds',()=>{
 updateLifeTime(0,.2);updateLifeTime(1,.2);const a=lifeUniforms.lifeCloudDrift.value.clone();updateLifeTime(1,.9);assert.deepEqual(lifeUniforms.lifeCloudDrift.value,a);updateLifeTime(2,.9);const b=lifeUniforms.lifeCloudDrift.value.clone();assert.ok(b.x-a.x>a.x);assert.ok(b.y<a.y);updateLifeTime(0,.35);
});
