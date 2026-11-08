import {surroundingTiles,tileKey} from './tiles.mjs';

// Streaming coordinator independent of Three.js. The caller owns scene meshes.
// Updates are serialized by a generation token, so stale asynchronous responses
// cannot reintroduce tiles after the player has moved away.
export class TileStream {
  constructor({loader,create,dispose,zoom=14,radius=1,maxVisible=25}){
    if(!loader||typeof create!=='function'||typeof dispose!=='function')throw new TypeError('Invalid stream callbacks');
    if(!Number.isInteger(maxVisible)||maxVisible<1)throw new RangeError('Invalid visible budget');
    this.loader=loader;this.create=create;this.dispose=dispose;
    this.zoom=zoom;this.radius=radius;this.maxVisible=maxVisible;
    this.visible=new Map();this.generation=0;this.disposed=false;
  }
  async update(lat,lon){
    if(this.disposed)return;
    const generation=++this.generation;
    const desired=surroundingTiles(lat,lon,this.zoom,this.radius).slice(0,this.maxVisible);
    const keys=new Set(desired.map(tileKey));
    for(const [key,object] of this.visible){
      if(!keys.has(key)){this.visible.delete(key);this.dispose(object,key);}
    }
    // Parallel fetches, but each result is committed only if still relevant.
    await Promise.all(desired.map(async tile=>{
      const key=tileKey(tile);
      if(this.visible.has(key))return;
      let data;
      try{data=await this.loader.load(tile);}
      catch(error){if(generation===this.generation)console.warn('Tile load failed',key,error);return;}
      if(this.disposed||generation!==this.generation||!data||this.visible.has(key))return;
      const object=this.create(data,tile);
      if(this.disposed||generation!==this.generation){this.dispose(object,key);return;}
      this.visible.set(key,object);
    }));
  }
  clear(){
    ++this.generation;
    for(const [key,object] of this.visible)this.dispose(object,key);
    this.visible.clear();
  }
  destroy(){this.disposed=true;this.clear();}
}
