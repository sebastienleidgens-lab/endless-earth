// @ts-ignore Shared clamped profile contract.
import {lifeProfile} from './budget.mjs';
export type LifeProfileName='eco'|'balanced'|'quality'|'custom';
export const lifeSettings={name:'balanced' as LifeProfileName,profile:lifeProfile('balanced'),revision:0};
export function setLifeProfile(name:LifeProfileName,custom:Record<string,number>={}){lifeSettings.name=name;lifeSettings.profile=lifeProfile(name==='custom'?'balanced':name,custom);lifeSettings.revision++;}
