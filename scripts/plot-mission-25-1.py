import os
from pathlib import Path
import json

os.environ['MPLCONFIGDIR']=str(Path('work/mission-25-1/matplotlib').resolve())
os.environ['XDG_CACHE_HOME']=str(Path('work/mission-25-1/cache').resolve())
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root=Path('docs/mission-25-1-evidence')
rows=json.loads((root/'determinism.json').read_text())['wind']
figure,axes=plt.subplots(3,1,figsize=(11,7),layout='constrained')
for axis,(end,div,label) in zip(axes,[(180,1,'Secondes'),(1200,60,'Minutes'),(10800,3600,'Heures')]):
    data=[row for row in rows if row['seconds']<=end]
    axis.plot([row['seconds']/div for row in data],[row['speed'] for row in data],color='#376b57',lw=1.2)
    axis.set(xlabel=label,ylabel='Intensité simulée',ylim=(0,1.05))
    axis.grid(alpha=.2)
figure.suptitle('Un même champ de vent, trois échelles — scénario déterministe, aucune mesure réelle',fontsize=12)
figure.savefig(root/'wind-scales.png',dpi=140)
figure.savefig(root/'wind-scales.svg')
plt.close(figure)

svg=root/'wind-scales.svg'
svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines())+'\n')
