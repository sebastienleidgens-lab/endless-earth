// DOM text generated once per build/page (or an explicit development HMR update).
// No network, timers, animation frames, Three.js imports or scene objects.
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function buildIdentityMarkup(info,place=''){
 const mission=info.mission?`Mission ${info.mission.number} — ${info.mission.name}`:'Mission indisponible';
 const known=info.commit&&info.shortCommit;
 const modified=info.dirty===true?' · modifié':info.dirty===null&&known?' · état Git indisponible':'';
 const commit=known?`${info.environment==='development'||info.dirty!==false?'Base ':''}${info.shortCommit}${modified}`:'Commit indisponible';
 const status=info.environment==='production'?'Production':'Développement';
 return `<div class="build-indicator" aria-label="Version exécutée d’ENDLESS EARTH" data-environment="${escape(info.environment)}" data-commit="${escape(info.commit??'')}" data-dirty="${info.dirty===null?'unknown':info.dirty}" data-mission="${escape(info.mission?.number??'')}">
 <div class="build-indicator__heading"><strong>${escape(info.app)}</strong><span class="build-indicator__status">${status}</span></div>
 <span class="build-indicator__mission">${escape(mission)}</span>
 <div class="build-indicator__details"><code title="${escape(known?info.commit:'Métadonnées Git indisponibles lors de la compilation')}">${escape(commit)}</code><span class="build-indicator__place">${escape(place)}</span></div></div>`;
}
