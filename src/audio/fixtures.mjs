import {acousticContext} from './context.mjs';
// TECHNICAL SYNTHETIC CONTEXTS. These places are not built/observed in the game.
export const AUDIO_FIXTURES=Object.freeze([
 ['temperate-morning',{lat:46.7,lon:.9},'2026-05-10T06:00:00Z',{forest:1,vegetation:1},.2],
 ['temperate-evening',{lat:46.7,lon:.9},'2026-05-10T18:00:00Z',{forest:1,vegetation:1},.12],
 ['rural-village',{lat:46.7,lon:.9},'2026-05-10T12:00:00Z',{settlement:.7,rural:.8,vegetation:.3},.8],
 ['coastal-village',{lat:48,lon:-4.5},'2026-05-10T12:00:00Z',{coast:.9,water:.7,port:.7,settlement:.4,exposure:.8},.8],
 ['large-city',{lat:35.7,lon:139.7},'2026-05-10T03:00:00Z',{urban:1,road:.8,settlement:1},.8],
 ['mountain',{lat:-44,lon:169},'2026-05-10T00:00:00Z',{exposure:1,vegetation:.05},.6],
 ['inhabited-valley',{lat:-44,lon:169},'2026-05-10T00:00:00Z',{exposure:.2,vegetation:.7,settlement:.3,water:.5},.6]
].map(([name,geo,date,influences,solarAltitude])=>({name,context:acousticContext({geo,worldTimeMs:Date.parse(date),solarAltitude,weather:{wind:.35,rain:0},influences,habitat:'fixture-only',fixture:true,provenance:{geography:'synthetic fixture, not a rendered region',weather:'synthetic fixture',region:'temperate-europe'}})})));
export function blendFixture(a,b,t){const influences={},keys=new Set([...Object.keys(a.influences),...Object.keys(b.influences)]);for(const k of keys)influences[k]=(a.influences[k]??0)*(1-t)+(b.influences[k]??0)*t;return {...a,influences,fixture:true}}
