import { tileKey } from './tiles.mjs';
// Bounded, request-deduplicating tile cache. A failed request is never cached.
export class TileLoader {
  constructor({baseUrl,fetchImpl=fetch,maxEntries=32}){
    if(!Number.isInteger(maxEntries)||maxEntries<1)throw new RangeError('Invalid maxEntries');
    this.baseUrl=baseUrl.replace(/\/$/,'');
    this.fetchImpl=fetchImpl;
    this.maxEntries=maxEntries;
    this.cache=new Map();
    this.pending=new Map();
  }
  async load(tile){
    const key=tileKey(tile);
    if(this.cache.has(key)){
      const value=this.cache.get(key);
      this.cache.delete(key);this.cache.set(key,value);return value;
    }
    if(this.pending.has(key))return this.pending.get(key);
    const promise=(async()=>{
      const response=await this.fetchImpl(`${this.baseUrl}/${key}.json`);
      if(response.status===404)return null;
      if(!response.ok)throw new Error(`Tile ${key}: HTTP ${response.status}`);
      const value=await response.json();
      if(!value||value.schema!=='endless-earth-tile-v1'||value.key!==key||!Array.isArray(value.features))
        throw new Error(`Invalid tile payload ${key}`);
      this.cache.set(key,value);
      while(this.cache.size>this.maxEntries)this.cache.delete(this.cache.keys().next().value);
      return value;
    })();
    this.pending.set(key,promise);
    try{return await promise;}finally{this.pending.delete(key);}
  }
  clear(){this.cache.clear();}
}
