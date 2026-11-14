// Artistic diffuse adaptation, separate from direct astronomical moonlight.
// Never claims that an overcast sky is a visible Moon or a daylight source.
export function nightLight({lightDay=0,moonlight=0,cloud=0,rain=0}={}){
 const t=Math.max(0,Math.min(1,lightDay)),moon=Math.max(0,moonlight)*(1-t);
 return {intensity:(.78*(1-t)+1.535*t+moon*.45)*(1-cloud*(.15+.19*t))*(1-rain*(.12+.08*t)),nightWeight:1-t,moon};
}
