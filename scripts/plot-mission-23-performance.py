import json,pathlib,os
os.environ.setdefault('MPLCONFIGDIR',str(pathlib.Path('work/mission-23/matplotlib').resolve()))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
root=pathlib.Path('docs/mission-23-evidence')
data=json.loads((root/'performance.json').read_text())
rows=[r for r in data['rows'] if r['profile']=='balanced']
labels={'village':'Village','pont':'Pont','foret':'Forêt','rive':'Rive','terrain':'Relief accidenté','route':'Route','nuit':'Nuit','neige':'Neige'}
values=[r['regressionPercent'] for r in rows]
fig,ax=plt.subplots(figsize=(9,4.9),layout='constrained')
colors=['#476f5d' if v<=5 else '#a05d43' for v in values]
bars=ax.barh([labels[r['station']] for r in rows],values,color=colors,height=.57)
ax.invert_yaxis();ax.axvline(0,color='#555b56',linewidth=.8)
ax.axvline(5,color='#636b63',linestyle='--',linewidth=1,label='Objectif : +5 % maximum')
for bar,value in zip(bars,values):ax.text(value+(.4 if value>=0 else -.4),bar.get_y()+bar.get_height()/2,f'{value:+.2f} %',va='center',ha='left' if value>=0 else 'right',fontsize=9)
ax.set_xlim(min(values)-3,max(values)+4)
ax.set_title('Temps de rendu logiciel — profil Équilibré',loc='left',pad=18,fontsize=15)
ax.set_xlabel('Écart de médiane M23 / M22.1 (%)')
ax.spines[['top','right','left']].set_visible(False);ax.tick_params(axis='y',length=0,pad=9)
ax.grid(axis='x',alpha=.15);ax.set_axisbelow(True);ax.legend(loc='lower right',frameon=False,fontsize=8)
fig.suptitle('Chromium / SwiftShader · 480 × 320 · 16 échantillons appariés par cas · aucun appareil Android',y=.005,fontsize=8,color='#555b56')
fig.savefig(root/'performance-balanced.png',dpi=160,bbox_inches='tight')
fig.savefig(root/'performance-balanced.svg',bbox_inches='tight')
print('Saved measured balanced-profile comparison')
