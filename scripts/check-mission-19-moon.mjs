import * as A from '../work/mission-19/reference/node_modules/astronomy-engine/esm/astronomy.js';
import {lunar} from '../src/nature/moon.mjs';
import {readFile,writeFile} from 'node:fs/promises';
const observer=new A.Observer(46.6953,.8844,0),rows=[];
for(const date of ['2026-01-03T20:00:00Z','2026-01-18T12:00:00Z','2026-04-24T20:00:00Z','2026-07-15T20:00:00Z','2026-07-29T23:00:00Z','2026-10-10T00:00:00Z','2026-11-13T17:00:00Z','2026-12-24T22:00:00Z']){
 const time=new Date(date),equ=A.Equator('Moon',time,observer,true,true),h=A.Horizon(time,observer,equ.ra,equ.dec),phase=A.MoonPhase(time)/360,illumination=A.Illumination('Moon',time).phase_fraction,m=lunar(time,observer.latitude,observer.longitude),angularDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))*180/Math.PI;
 rows.push({date,reference:{altitude:h.altitude,azimuth:h.azimuth,phase,illumination},model:m,error:{altitudeDeg:Math.abs(m.altitude*180/Math.PI-h.altitude),azimuthDeg:angularDistance(m.azimuth,h.azimuth*Math.PI/180),illumination:Math.abs(m.illumination-illumination)}});
}
const pkg=JSON.parse(await readFile('work/mission-19/reference/node_modules/astronomy-engine/package.json'));
console.log(pkg.version,rows.map(r=>[r.date,r.error]));await writeFile('docs/mission-19-evidence/moon-reference.json',JSON.stringify({reference:{library:'Astronomy Engine',version:pkg.version,license:'MIT',url:'https://github.com/cosinekitty/astronomy',observer,refraction:'none (both geometric altitude)',productionDependency:false},rows},null,2)+'\n');
