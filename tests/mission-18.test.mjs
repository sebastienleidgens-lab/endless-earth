import test from 'node:test';
import assert from 'node:assert/strict';
import {civilParts,representativeMonth,solar,momentDate,weatherStep,WEATHER} from '../src/nature/climate.mjs';
import {forestDay,forestSeason,FOREST_PHENOLOGY} from '../src/nature/forest-life.mjs';
import {flowerSeason} from '../src/nature/flowers.mjs';
import {acousticContext,syncEnvironment} from '../src/audio/context.mjs';
import {birdActivity,BIRD_PROFILES} from '../src/audio/profiles.mjs';
const site={lat:46.695,lon:.884,timeZone:'Europe/Paris'};
test('all twelve representative dates retain the simulation year and civil time across DST',()=>{
 for(const ref of ['2026-01-31T14:37:23.125Z','2028-12-31T22:21:45Z'])for(let month=1;month<=12;month++){
  const original=civilParts(ref,site.timeZone),date=representativeMonth(ref,month,site),actual=civilParts(date,site.timeZone);
  assert.deepEqual(actual,{...original,month,day:15});assert.equal(date.getUTCMilliseconds(),new Date(ref).getUTCMilliseconds());
 }
 assert.equal(representativeMonth('2026-01-15T14:00Z',7,site).toISOString(),'2026-07-15T13:00:00.000Z');
 for(const month of [0,13,-1,1.5,NaN,'7'])assert.throws(()=>representativeMonth('2026-01-15',month,site));
 assert.throws(()=>representativeMonth('invalid',7,site));
});
test('December/January and rapid commands do not roll years or accumulate elapsed weeks',()=>{
 let date=new Date('2026-10-25T00:30Z');const before=civilParts(date,site.timeZone);
 for(const month of [12,1,7,4,10,12,1,7,1])date=representativeMonth(date,month,site);
 assert.deepEqual(civilParts(date,site.timeZone),{...before,month:1,day:15});
});
test('calendar changes actual solar geometry and day length; afternoon presets use their chosen month',()=>{
 const winter=representativeMonth('2026-01-15T14:00Z',1,site),summer=representativeMonth(winter,7,site),w=solar(winter,site.lat,site.lon),s=solar(summer,site.lat,site.lon);
 assert.ok(s.altitude>w.altitude+.4);assert.notEqual(s.azimuth,w.azimuth);
 const wd=momentDate('afternoon',winter,site),sd=momentDate('afternoon',summer,site);assert.ok(sd.sunset-sd.sunrise>wd.sunset-wd.sunrise+6*3600000);
 for(let month=1;month<=12;month++){const date=representativeMonth(winter,month,site),d=momentDate('evening',date,site);assert.equal(civilParts(d.date,site.timeZone).month,month);assert.ok(+d.date<d.sunset);assert.ok(Number.isFinite(solar(d.date,site.lat,site.lon).altitude))}
});
test('one date drives deciduous/evergreen leaf states, flowers, independent snow and acoustic season',()=>{
 const context=acousticContext({geo:site,worldTimeMs:0}),states=[];
 for(let month=1;month<=12;month++){
  const date=representativeMonth('2026-01-15T14:00Z',month,site),day=forestDay(date),deciduous=forestSeason(day,FOREST_PHENOLOGY.spreading),evergreen=forestSeason(day,FOREST_PHENOLOGY.needle,true),flowers=flowerSeason(date);
  const season=['winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn','autumn','winter'][month-1];
  syncEnvironment(context,{worldTimeMs:+date,localHour:15,solar:solar(date,site.lat,site.lon),season,acousticWeather:WEATHER.clear,transition:{commandRevision:month}});
  assert.equal(context.worldTimeMs,+date);assert.equal(context.season,season);assert.equal(evergreen.retention,1);
  let weather={...WEATHER.rain};for(let i=0;i<100;i++)weather=weatherStep(weather,WEATHER.rain,.1,{},.65);assert.equal(weather.snow,0);
  states.push({deciduous,flowers,bird:birdActivity(BIRD_PROFILES[0],{...context,provenance:{region:'temperate-europe'}},'wood')});
 }
 assert.equal(states[0].deciduous.retention,0);assert.equal(states[6].deciduous.retention,1);assert.equal(states[0].flowers.bloom,0);assert.ok(states[3].flowers.bloom>0);assert.notEqual(states[0].bird,states[3].bird);
});
