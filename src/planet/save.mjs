import {validateGeo} from './coordinates.mjs';
export function validateJourney(value){if(value?.schema!=='planet-journey-v1'||typeof value.region!=='string'||!['walking','driving','boating'].includes(value.activity)||!Number.isFinite(value.heading)||!Number.isFinite(value.position?.height)||!['IGN69','EGM2008','WGS84-ellipsoid'].includes(value.position.datum))throw Error('Invalid saved journey');validateGeo(value.position);return value;}
export class JourneyStorage {
 constructor(storage,key='endless-earth:journey:v1'){this.storage=storage;this.key=key;this.reason='';}
 write(value){try{this.storage.setItem(this.key,JSON.stringify(validateJourney(value)));this.reason='';return true;}catch(e){this.reason=String(e);return false;}}
 read(){try{const s=this.storage.getItem(this.key);return s?validateJourney(JSON.parse(s)):null;}catch(e){this.reason=String(e);return null;}}
 async resume(load,admit){const value=this.read();if(!value)return {ok:false,reason:'no-valid-save'};await load(value);if(!admit(value))return {ok:false,reason:'saved-position-unavailable',position:value.position};return {ok:true,value};}
}
