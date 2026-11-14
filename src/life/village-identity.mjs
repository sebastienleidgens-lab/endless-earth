/** Original interpreted people; no names, demographics or real household data. */
export const LIFE_VERSION='village-life-v1';
export function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function random(seed){let a=seed>>>0;const next=()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296};Object.defineProperty(next,'state',{get:()=>a>>>0,set:v=>{a=v>>>0}});return next;}
export const AGES=['baby','young-child','child','teen','young-adult','adult','senior'];
const HEIGHTS=[[.68,.82],[.91,1.10],[1.17,1.43],[1.46,1.77],[1.55,1.90],[1.50,1.91],[1.49,1.86]];
export function identity(id,age=null){const seed=hash(id),r=random(seed),a=age??AGES[2+Math.floor(r()*5)],i=AGES.indexOf(a),h=HEIGHTS[Math.max(0,i)];return {id,seed,age:a,presentation:['masculine','feminine','androgynous'][Math.floor(r()*3)],height:h[0]+r()*(h[1]-h[0]),build:.78+r()*.57,shoulders:.84+r()*.35,legRatio:i<3?.40+r()*.025:.46+r()*.025,headRatio:i<3?.17+r()*.025:.122+r()*.015,face:.86+r()*.30,skin:[0xe6bc99,0xd2a383,0xb9815d,0x956443,0x6d4936,0xc18b6c][Math.floor(r()*6)],hair:i===6?[0xaaa9a1,0xd5d1c3,0x746e63][Math.floor(r()*3)]:[0x322b25,0x66503a,0xa58a5d,0x8e4e32,0x242425][Math.floor(r()*5)],hairStyle:Math.floor(r()*5),beard:i>3&&r()<.24,glasses:i>2&&r()<.28,posture:(r()-.5)*.065,speed:.85+r()*.66,stride:.39+r()*.22,armSwing:.20+r()*.14,phase:r()*Math.PI*2,favourite:['walk','view','conversation','dog-walk'][Math.floor(r()*4)],preferredHour:8+r()*11};}
export function wardrobe(person,context={}){const r=random(person.seed+hash('wardrobe')),winter=(context.temperatureC??16)<9,rain=(context.rain??0)>.15,summer=(context.temperatureC??16)>22;
 const styles=winter?['coat','jacket','jumper']:summer?['tee','shirt','dress','shorts']:['shirt','jumper','jacket','skirt'];
 const style=rain?'raincoat':styles[Math.floor(r()*styles.length)];return {style,top:[0x777f65,0x8e6255,0x5f737f,0xb1a184,0x52675d,0x8c7f91,0xc2b8a4][Math.floor(r()*7)],bottom:[0x4c5863,0x655e52,0x474c46,0x8b8272][Math.floor(r()*4)],hat:winter?r()<.45:r()<.12,scarf:winter&&r()<.5,pack:r()<.22,umbrella:rain&&r()<.38,shorts:style==='shorts'||summer&&style==='tee'&&r()<.55};}
export const LIFE_BUDGETS=Object.freeze({eco:{people:3,animals:1,hz:12,detailM:23,perceptibleM:100},balanced:{people:6,animals:2,hz:20,detailM:35,perceptibleM:145},quality:{people:10,animals:3,hz:30,detailM:48,perceptibleM:180}});
export function attendance(c={},zone='village'){
 const hour=c.hour??12,month=c.month??5,day=c.weekday??6;
 const rhythm=hour<5?.013:hour<7?.13:hour<10?.55:hour<12?.88:hour<14?.72:hour<18?1:hour<21?.45:.055;
 const season=[.34,.40,.65,.85,1,1.08,1.16,1.13,.91,.74,.48,.36][month-1]??.8;
 const weather=Math.max(.025,(1-(c.rain??0)*.85)*(1-(c.snow??0)*.72)*(1-(c.storm??0)*.96)*(1-Math.max(0,(c.wind??0)-.4)*.7));
 const thermal=(c.temperatureC??16)<0?.48:(c.temperatureC??16)>32?.62:1;
 return rhythm*season*weather*thermal*([0,6].includes(day)?1.18:.87)*({village:1,residential:.52,heritage:1.05,bridge:.55,bank:.48,path:.40,forest:.19,isolated:.07,view:.64}[zone]??.4);
}
export function contextFromClimate(c={}){const date=new Date(c.worldTimeMs??Date.parse(c.date??'2026-05-16T09:00Z'));return {hour:c.localHour??12,month:date.getUTCMonth()+1,weekday:date.getUTCDay(),temperatureC:c.metrics?.temperatureC??16,rain:c.weather?.rain??0,snow:c.snow?.cover??c.weather?.snow??0,storm:c.metrics?.electricalActivity??0,wind:c.weather?.wind??0};}
