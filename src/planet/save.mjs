import {validateGeo} from './coordinates.mjs';
const MODES=['walking','driving','boating','camping','wading','swimming','sitting'];
export function migrateJourney(value){if(value?.schema==='planet-journey-v1')return {...value,schema:'planet-journey-v2',migration:{from:'planet-journey-v1',vehicleFrame:'legacy-fixed-pilot-origin',original:value},extensions:{},map:null,route:null};return value;}
export function validateJourney(input){const value=migrateJourney(input);if(value?.schema!=='planet-journey-v2'||typeof value.region!=='string'||!MODES.includes(value.activity)||!Number.isFinite(value.heading)||!Number.isFinite(value.position?.height)||!['IGN69','EGM2008','WGS84-ellipsoid'].includes(value.position.datum))throw Error('Invalid saved journey');validateGeo(value.position);if(value.vehicle?.position?.lat!==undefined)validateGeo(value.vehicle.position);if(JSON.stringify(value).length>2*1024*1024)throw Error('Journey exceeds storage budget');return value;}
export class JourneyStorage {
 constructor(storage,key='endless-earth:journey:v1'){this.storage=storage;this.key=key;this.reason='';}
 write(value){try{this.storage.setItem(this.key,JSON.stringify(validateJourney(value)));this.reason='';return true;}catch(e){this.reason=String(e);return false;}}
 read(){try{const s=this.storage.getItem(this.key);return s?validateJourney(JSON.parse(s)):null;}catch(e){this.reason=String(e);return null;}}
 async resume(load,admit){const value=this.read();if(!value)return {ok:false,reason:'no-valid-save'};await load(value);if(!admit(value))return {ok:false,reason:'saved-position-unavailable',position:value.position};return {ok:true,value};}
}
