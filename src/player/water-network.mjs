const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/** Navigation over the LOADED water surface. No terrain, access, bridge or
 * depth is manufactured here. Rebuild only when the surface owner changes.
 * The conservative lattice carries a checked corridor, not a flow direction.
 */
export function createWaterNetwork({areas, sample, contains, clear, accesses, step = 4, limit = 998, bounds=[-limit,-limit,limit,limit], deferred = false}) {
  let nodes = null,iterator=null,scheduled=false,closed=false;
  const metrics = {builds: 0, nodes: 0, edges: 0, components: 0, ready: false,
    step, bounds: [...bounds], source: 'loaded OSM surface / estimated game bed',
    confidence: 'low', bridgePolicy: 'existing clearance refusals preserved', buildMs: 0,cpuMs:0,maxSliceMs:0,slices:0};
  const key = (x, z) => `${x},${z}`;
  function valid(x, z) {
    if (!contains(x, z) || !clear(x, z)) return false;
    const s = sample(x, z);
    return !!s?.reliable && s.allowed && s.depth >= .18;
  }
  function corridor(a, b, radius = 1.12) {
    const d = distance(a, b), n = Math.max(1, Math.ceil(d / .65));
    const nx = d ? -(b.z - a.z) / d * radius : radius;
    const nz = d ? (b.x - a.x) / d * radius : 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      if (!valid(x, z) || !valid(x + nx, z + nz) || !valid(x - nx, z - nz)) return false;
    }
    return true;
  }
  function* buildSteps() {
    const start = performance.now();
    nodes = new Map();
    for (const area of areas) {
      const ring = area.rings[0];
      const minX = Math.max(bounds[0], Math.min(...ring.map(p => p.x)));
      const maxX = Math.min(bounds[2], Math.max(...ring.map(p => p.x)));
      const minZ = Math.max(bounds[1], Math.min(...ring.map(p => p.z)));
      const maxZ = Math.min(bounds[3], Math.max(...ring.map(p => p.z)));
      for (let z = Math.ceil(minZ / step) * step; z <= maxZ; z += step) {
        for (let x = Math.ceil(minX / step) * step; x <= maxX; x += step) {
          yield;if (nodes.has(key(x, z)) || !valid(x, z)) continue;
          if (![[1.12,0],[-1.12,0],[0,1.12],[0,-1.12]].every(([dx,dz]) => valid(x+dx,z+dz))) continue;
          nodes.set(key(x,z), {x,z,links:[],parent:null,exit:null,component:-1});
        }
        yield;
      }
    }
    for (const node of nodes.values()) {
      for (const [dx,dz] of [[step,0],[0,step],[step,step],[-step,step]]) {
        const other = nodes.get(key(node.x+dx,node.z+dz));
        yield;if (!other || !corridor(node,other)) continue;
        node.links.push(other); other.links.push(node); metrics.edges++;
      }
      yield;
    }
    // Breadth first search from all genuine bank accesses; every parent edge
    // was swept above. Disconnected water without an exit stays inadmissible.
    const queue = [];
    for (const access of accesses) {
      const candidates = nearby(access.water, step*2.5, false);
      const node = candidates.find(n => corridor(access.water,n,.53));
      if (node && !node.exit) {node.exit=access;queue.push(node);}
      yield;
    }
    for (let i=0;i<queue.length;i++) {
      yield;const node=queue[i];
      for (const other of node.links) if (!other.exit) {
        other.exit=node.exit;other.parent=node;queue.push(other);
      }
    }
    for (const node of nodes.values()) if (node.component<0) {
      const group=[node], id=metrics.components++;node.component=id;
      for(let i=0;i<group.length;i++){yield;for(const other of group[i].links)if(other.component<0){other.component=id;group.push(other);}}
    }
    metrics.nodes=nodes.size;metrics.builds++;metrics.ready=true;metrics.buildMs=performance.now()-start;
  }
  function* hydrateSteps(snapshot){
    if(metrics.ready||closed)return;const next=new Map(),exits=new Map(accesses.map(a=>[a.id,a]));
    if(!Array.isArray(snapshot)||snapshot.length>100000)throw Error('Invalid water cache node count');
    for(const row of snapshot){yield;if(!Number.isFinite(row.x)||!Number.isFinite(row.z)||Math.abs(row.x)>limit||Math.abs(row.z)>limit||!Array.isArray(row.links)||row.links.length>8||next.has(key(row.x,row.z))||row.exit&&!exits.has(row.exit))throw Error('Invalid cached water node');next.set(key(row.x,row.z),{x:row.x,z:row.z,component:row.component,exit:exits.get(row.exit)??null,parent:null,links:[]});}
    let edges=0;for(const row of snapshot){yield;const node=next.get(key(row.x,row.z));for(const p of row.links){const other=next.get(key(p[0],p[1]));if(!other||distance(node,other)>step*1.415)throw Error('Invalid cached water edge');node.links.push(other);edges++;}if(row.parent){node.parent=next.get(key(...row.parent));if(!node.parent||!node.links.includes(node.parent)||node.parent.exit!==node.exit)throw Error('Invalid cached bank route');}}
    // Verify each parent chain terminates rather than installing a cyclic return route.
    const verified=new Set();for(const node of next.values()){yield;const chain=new Set();let n=node;while(n?.parent&&!verified.has(n)){if(chain.has(n))throw Error('Cyclic cached bank route');chain.add(n);n=n.parent;}for(const n of chain)verified.add(n);}
    nodes=next;deferred=false;metrics.nodes=next.size;metrics.edges=edges/2;metrics.components=new Set([...next.values()].map(n=>n.component)).size;metrics.ready=true;metrics.builds++;metrics.cache=true;
  }
  function build(){if(metrics.ready||closed)return;if(deferred)throw Error('Water cache is still preparing');iterator??=buildSteps();while(!iterator.next().done){};}
  function prepare(){
    if(metrics.ready||scheduled||closed||deferred)return;
    iterator??=buildSteps();scheduled=true;
    const advance=()=>{if(closed||metrics.ready){scheduled=false;return;}const start=performance.now();while(performance.now()-start<3){if(iterator.next().done){scheduled=false;break;}}const slice=performance.now()-start;metrics.cpuMs+=slice;metrics.maxSliceMs=Math.max(metrics.maxSliceMs,slice);metrics.slices++;if(!metrics.ready)setTimeout(advance,8);};
    setTimeout(advance,0);
  }
  function nearby(p, radius=step*2, connected=true) {
    const found=[];
    for(let z=Math.floor((p.z-radius)/step)*step;z<=p.z+radius;z+=step)
      for(let x=Math.floor((p.x-radius)/step)*step;x<=p.x+radius;x+=step){
        const n=nodes.get(key(x,z));if(n&&(!connected||n.exit)&&distance(p,n)<=radius)found.push(n);
      }
    return found.sort((a,b)=>distance(p,a)-distance(p,b));
  }
  function attach(p, radius=.53) {if(!metrics.ready){prepare();return null;}return nearby(p).find(n=>corridor(p,n,radius))??null;}
  function route(p, toEntry=false) {
    const node=attach(p);if(!node)return null;
    const points=[{x:p.x,z:p.z}];let n=node;
    while(n){points.push({x:n.x,z:n.z});n=n.parent;}
    points.push({...node.exit.water});if(toEntry)points.push({...node.exit.entry});
    // Resample the route for the existing swimmer's <1 m edge contract.
    const result=[points[0]];
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],count=Math.max(1,Math.ceil(distance(a,b)/.65));
      for(let j=1;j<=count;j++)result.push({x:a.x+(b.x-a.x)*j/count,z:a.z+(b.z-a.z)*j/count});
    }
    return result;
  }
  function follow(p,heading,maxDistance=2000){
    if(!metrics.ready){prepare();return {ok:false,reason:'river-loading'};}
    const start=attach(p);if(!start)return {ok:false,reason:'no-safe-river'};
    const forward={x:Math.sin(heading),z:Math.cos(heading)},cost=new Map([[start,0]]),parent=new Map(),queue=[start],visited=new Set();let best=start,bestDistance=0;
    // This is a loaded, checked component. No global graph completion, no
    // invented flow direction, and a single plan per user request.
    for(let cursor=0;cursor<queue.length&&cursor<12000;cursor++){
      const n=queue[cursor];if(visited.has(n))continue;visited.add(n);const d=cost.get(n);if(d>maxDistance)continue;
      if(d>bestDistance){best=n;bestDistance=d;}
      for(const other of n.links){if(!other.exit||visited.has(other))continue;
        const edge=distance(n,other);if(n===start&&((other.x-n.x)*forward.x+(other.z-n.z)*forward.z)/edge<.35)continue;
        const next=d+edge;if(next>=(cost.get(other)??Infinity))continue;cost.set(other,next);parent.set(other,n);queue.push(other);
      }
    }
    if(bestDistance<12)return {ok:false,reason:'river-direction-required'};
    const points=[];let node=best;while(node){points.push({x:node.x,z:node.z});node=parent.get(node);}points.reverse();points.unshift({x:p.x,z:p.z});
    const simplified=[points[0]];for(let i=0;i<points.length-1;){let end=i+1;for(let j=i+2;j<Math.min(points.length,i+10);j++){if(!corridor(points[i],points[j]))break;end=j;}simplified.push(points[end]);i=end;}
    return {ok:true,points:simplified,distance:bestDistance,source:metrics.source,confidence:'low',flow:'unknown; chosen heading, no upstream/downstream assertion'};
  }
  return {metrics,build,prepare,hydrateSteps,release(){deferred=false;},corridor,attach,route,follow,connected:(x,z)=>!!attach({x,z}),
    snapshot(){build();return [...nodes.values()].map(n=>({x:n.x,z:n.z,component:n.component,exit:n.exit?.id??null,links:n.links.map(o=>[o.x,o.z])}));},
    dispose(){closed=true;nodes?.clear();nodes=null;iterator=null;metrics.ready=false;}};
}
