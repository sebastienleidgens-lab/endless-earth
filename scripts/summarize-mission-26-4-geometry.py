import json, math
from pathlib import Path
R=Path('docs/mission-26-4-evidence')
a=json.loads((R/'reference-checked-d749.json').read_text()); b=json.loads((R/'phase-checked-d749.json').read_text())
report={'method':'Actual source-identified runtime admission and visible Float32 triangles at the same WGS84 station and heading; diagnostic overlay only. Reference and final road source differ; fine source, thresholds and source widths unchanged. ff8 road module is byte-identical to final30d3bc. No physical trip inferred from these stationary probes.','reference':a['sourceSHA'],'candidate':b['sourceSHA'],'gps':a['gps'],'samples':[]}
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 590"><rect width="1100" height="590" fill="#f8fafc"/><style>text{font-family:system-ui;fill:#152e40}.small{font-size:12px}</style><text x="24" y="29" font-size="19">D749 — triangles visibles et cinq points de coque, avance de 1 mm</text>']
for side,d in enumerate([a,b]):
 ox=275+550*side; oz=290; c=d['mesh']['center']; scale=17
 def xy(v):return (ox+(v[0]-c['x'])*scale,oz-(v[2]-c['z'])*scale)
 svg.append(f'<text x="{side*550+24}" y="58" font-size="15">{("Référence b5a4f98" if side==0 else "Candidat ff8cf93 / route finale30d3bc")}</text>')
 svg.append(f'<clipPath id="p{side}"><rect x="{side*550+20}" y="75" width="510" height="420"/></clipPath><g clip-path="url(#p{side})">')
 for mesh in d['mesh']['meshes']:
  if mesh['kind']!='road':continue
  for t in mesh['triangles']:
   v=t['vertices'];u=[v[1][i]-v[0][i]for i in range(3)];w=[v[2][i]-v[0][i]for i in range(3)];n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];s=math.hypot(n[0],n[2])/max(abs(n[1]),1e-15)
   pts=' '.join(f'{x:.2f},{y:.2f}'for x,y in map(xy,v));col='#f8bbac' if s>.45 else '#dce9db'
   svg.append(f'<polygon points="{pts}" fill="{col}" stroke="#748896" stroke-width=".7"><title>Face visible {t["face"]}; pente normale {s:.6f}</title></polygon>')
 points=[p for p in d['allHullPoints']if p['advance']==.001]
 for i,p in enumerate(points):
  x,y=xy([p['x'],0,p['z']]);refusal=p['admission'].get('ok')==False
  svg.append(f'<circle cx="{x}" cy="{y}" r="5" fill="{("#d92337"if refusal else "#076e57")}" stroke="white"/><text class="small" x="{x+8}" y="{y-5}">{i}</text>')
 svg.append('</g>')
 front=points[3];svg.append(f'<text x="{side*550+24}" y="525" font-size="14">Coin3 : pente {front["admission"]["slope"]:.6f} ; seuil0,45 inchangé</text>')
 for p in points:
  rays=p['ray'];road=next((q for q in rays if q.get('object')==''),None)
  report['samples'].append({'version':d['sourceSHA'],**{k:p[k] for k in ['advance','u','v','x','z','gps','longitudinalGrade','lateralGrade','roadTerrainDeltaM','bridge','layer']},'support':p['admission'],'visibleRay':road,'supportRayDeltaM':abs(p['admission']['height']-road['point'][1]) if road else None})
svg.append('<text class="small" x="24" y="565">Vert : triangle ≤0,45 · saumon : triangle &gt;0,45. Relief conservé ; maillage transversal affiné. Survol : face et pente.</text></svg>')
(R/'geometry-comparison.svg').write_text(''.join(svg));(R/'geometry-comparison.json').write_text(json.dumps(report,indent=2))
