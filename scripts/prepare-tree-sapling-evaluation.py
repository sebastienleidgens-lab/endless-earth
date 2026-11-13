"""Offline comparison only; Blender 4.3 + pinned official Sapling 0.3.6.

Download/extract the official archive under work/mission-17/research/sapling.
Run: BLENDER_USER_SCRIPTS=$PWD/work/mission-17/blender-scripts blender -b
 --factory-startup --python scripts/prepare-tree-sapling-evaluation.py
The GPL generator is not bundled with Endless Earth. Generated evaluation mesh
and raw dumps stay in ignored work/, no production asset or runtime dependency.
"""
import bpy,sys,pathlib,json,time,hashlib
root=pathlib.Path.cwd();src=root/'work/mission-17/research'
sys.path.insert(0,str(src))
import sapling
sapling.register()
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
start=time.monotonic()
# Original evaluation parameters; no imported preset or external leaf object.
bpy.ops.curve.tree_add(seed=17,levels=3,scale=14.0,scaleV=0.0,
    ratio=.026,baseSize=.30,shape='1',branches=(0,28,12,3),
    length=(1.0,.40,.58,.3),lengthV=(0,.12,.16,0),
    downAngle=(0,58,42,35),downAngleV=(0,20,20,10),
    curve=(0,-18,12,0),curveV=(25,30,35,0),
    curveRes=(10,5,3,1),bevel=True,bevelRes=1,resU=4,
    showLeaves=True,leaves=260,leafScale=.17,leafScaleX=.7,
    leafShape='hex',useArm=False,armAnim=False)
deps=bpy.context.evaluated_depsgraph_get();out=[]
for obj in bpy.context.scene.objects:
 if obj.type not in ['MESH','CURVE']:continue
 mesh=bpy.data.meshes.new_from_object(obj.evaluated_get(deps));mesh.calc_loop_triangles()
 # Blender Z-up to the game's Y-up; metres, no normalization.
 pos=[]
 for v in mesh.vertices:
  p=obj.matrix_world@v.co;pos.extend([p.x,p.z,-p.y])
 out.append({'name':obj.name,'position':pos,'index':[i for t in mesh.loop_triangles for i in t.vertices]})
result={'tool':'Official Sapling 0.3.6, GPL-2.0-or-later','blender':bpy.app.version_string,'seed':17,'seconds':time.monotonic()-start,'meshes':out}
(root/'work/mission-17/sapling-evaluation.json').write_text(json.dumps(result,separators=(',',':')))
print('SAPLING_EVALUATION',json.dumps({k:v for k,v in result.items() if k!='meshes'}),[(m['name'],len(m['index'])//3)for m in out])
