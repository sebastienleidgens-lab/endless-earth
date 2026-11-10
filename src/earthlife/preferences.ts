// @ts-ignore Shared clamped profile contract.
import {lifeProfile} from './budget.mjs';
export type LifeProfileName='eco'|'balanced'|'quality'|'custom';
export const lifeSettings={name:'balanced' as LifeProfileName,profile:lifeProfile('balanced'),revision:0};
const CUSTOM_KEYS=new Set(Object.keys(lifeProfile('balanced')));
const KEY='endless-earth-graphics-v1',NAMES=new Set(['eco','balanced','quality','custom']);
export function setLifeProfile(name:LifeProfileName,custom:Record<string,number>={}){lifeSettings.name=name;lifeSettings.profile=lifeProfile(name==='custom'?'balanced':name,name==='custom'?custom:{});lifeSettings.revision++;}
export function readLifePreferences(storage?:Pick<Storage,'getItem'>):{name:LifeProfileName;custom:Record<string,number>}|null{
 try{const raw=JSON.parse((storage??globalThis.localStorage).getItem(KEY)??'null');if(!raw||!NAMES.has(raw.name))return null;const custom:Record<string,number>={};for(const [k,v] of Object.entries(raw.custom??{}))if(CUSTOM_KEYS.has(k)&&typeof v==='number'&&Number.isFinite(v))custom[k]=v;return {name:raw.name,custom}}catch{return null}
}
export function saveLifePreferences(name:LifeProfileName,custom:Record<string,number>,storage?:Pick<Storage,'setItem'>){try{(storage??globalThis.localStorage).setItem(KEY,JSON.stringify({name,custom}))}catch{/* Storage may be unavailable; session preferences still work. */}}
