/** Bounded exact-coordinate memoization. A loading result belongs to the same
 * ownership revision as a known triangle; neither may survive a revision. */
export class ContactQueryCache {
 constructor(limit=4096){this.limit=limit;this.values=new Map();this.stamp=null;this.metrics={queries:0,hits:0,invalidations:0,maxEntries:0};}
 invalidate(){this.values.clear();this.stamp=null;this.metrics.invalidations++;}
 get(key,stamp,compute){this.metrics.queries++;if(stamp!==this.stamp){this.values.clear();this.stamp=stamp;this.metrics.invalidations++;}if(this.values.has(key)){this.metrics.hits++;return this.values.get(key);}const value=compute();if(this.values.size>=this.limit)this.values.delete(this.values.keys().next().value);this.values.set(key,value);this.metrics.maxEntries=Math.max(this.metrics.maxEntries,this.values.size);return value;}
}
