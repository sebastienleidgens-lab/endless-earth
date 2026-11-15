const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/** Navigation over the LOADED water surface. No terrain, access, bridge or
 * depth is manufactured here. Rebuild only when the surface owner changes.
 * The conservative lattice carries a checked corridor, not a flow direction.
 */
export function createWaterNetwork({areas, sample, contains, clear, accesses, step = 4, limit = 998}) {
  let nodes = null,iterator=null,scheduled=false,closed=false;
  const metrics = {builds: 0, nodes: 0, edges: 0, components: 0, ready: false,
    step, bounds: [-limit, -limit, limit, limit], source: 'loaded OSM surface / estimated game bed',
    confidence: 'low', bridgePolicy: 'existing clearance refusals preserved', buildMs: 0};
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
      const minX = Math.max(-limit, Math.min(...ring.map(p => p.x)));
      const maxX = Math.min(limit, Math.max(...ring.map(p => p.x)));
      const minZ = Math.max(-limit, Math.min(...ring.map(p => p.z)));
      const maxZ = Math.min(limit, Math.max(...ring.map(p => p.z)));
      for (let z = Math.ceil(minZ / step) * step; z <= maxZ; z += step) {
        for (let x = Math.ceil(minX / step) * step; x <= maxX; x += step) {
          if (nodes.has(key(x, z)) || !valid(x, z)) continue;
          if (![[1.12,0],[-1.12,0],[0,1.12],[0,-1.12]].every(([dx,dz]) => valid(x+dx,z+dz))) continue;
          nodes.set(key(x,z), {x,z,links:[],parent:null,exit:null,component:-1});
        }
        yield;
      }
    }
    for (const node of nodes.values()) {
      for (const [dx,dz] of [[step,0],[0,step],[step,step],[-step,step]]) {
        const other = nodes.get(key(node.x+dx,node.z+dz));
        if (!other || !corridor(node,other)) continue;
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
      const node=queue[i];
      for (const other of node.links) if (!other.exit) {
        other.exit=node.exit;other.parent=node;queue.push(other);
      }
    }
    for (const node of nodes.values()) if (node.component<0) {
      const group=[node], id=metrics.components++;node.component=id;
      for(let i=0;i<group.length;i++)for(const other of group[i].links)if(other.component<0){other.component=id;group.push(other);}
    }
    metrics.nodes=nodes.size;metrics.builds++;metrics.ready=true;metrics.buildMs=performance.now()-start;
  }
  function build(){if(metrics.ready||closed)return;iterator??=buildSteps();while(!iterator.next().done){};}
  function prepare(){
    if(metrics.ready||scheduled||closed)return;
    iterator??=buildSteps();scheduled=true;
    const advance=()=>{if(closed||metrics.ready){scheduled=false;return;}const start=performance.now();while(performance.now()-start<3){if(iterator.next().done){scheduled=false;return;}}setTimeout(advance,16);};
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
  return {metrics,build,prepare,corridor,attach,route,connected:(x,z)=>!!attach({x,z}),
    snapshot(){build();return [...nodes.values()].map(n=>({x:n.x,z:n.z,component:n.component,exit:n.exit?.id??null,links:n.links.map(o=>[o.x,o.z])}));},
    dispose(){closed=true;nodes?.clear();nodes=null;iterator=null;metrics.ready=false;}};
}
