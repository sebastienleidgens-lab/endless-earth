/** Keep stable source identities near the budget boundary. Hysteresis is a
 * spatial preference only; it never substitutes a visual LOD or moving proxy. */
export function selectCasters(trees,center,capacity,radius,previous=new Set(),hysteresis=8){
 return new Set(trees.map(tree=>({tree,d:Math.hypot(tree.x-center.x,tree.z-center.z)})).filter(r=>r.d<radius).sort((a,b)=>(a.d-(previous.has(a.tree)?hysteresis:0))-(b.d-(previous.has(b.tree)?hysteresis:0))||a.tree.x-b.tree.x||a.tree.z-b.tree.z).slice(0,capacity).map(r=>r.tree));
}
