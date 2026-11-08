import * as THREE from 'three';
// Illustrative placeholder. NOT an IGN/OSM reconstruction of Angles-sur-l'Anglin.
export function createDemoWorld(scene: THREE.Scene, onlyGround = false) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2200, 2200), new THREE.MeshLambertMaterial({ color: 0x8eaa80 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  if (onlyGround) return;
  const road = new THREE.Mesh(new THREE.BoxGeometry(8, 0.08, 260), new THREE.MeshLambertMaterial({color:0xc5ae8d}));
  road.position.y = 0.05; road.rotation.y = 0.25; road.receiveShadow = true; scene.add(road);
  const houseColors = [0xe9d6b8, 0xc5c9ad, 0xe7c8aa, 0xd5d5c5];
  for (let i=0; i<12; i++) {
    const x = (i%2 ? 1:-1)*(20+(i%3)*7), z = Math.floor(i/2)*35-90;
    const h = new THREE.Group(); h.position.set(x,0,z);
    const body = new THREE.Mesh(new THREE.BoxGeometry(13,9,12),new THREE.MeshLambertMaterial({color:houseColors[i%houseColors.length]}));
    body.position.y=4.5; body.castShadow=true; body.receiveShadow=true; h.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(11,5,4),new THREE.MeshLambertMaterial({color:0x805d50}));
    roof.position.y=11.3; roof.rotation.y=Math.PI/4; roof.castShadow=true; h.add(roof); scene.add(h);
  }
  const trunkGeometry = new THREE.CylinderGeometry(.55,.85,5,7);
  const foliageGeometry = new THREE.IcosahedronGeometry(4,1);
  const trunkMat = new THREE.MeshLambertMaterial({color:0x705e49});
  const foliageMat = new THREE.MeshLambertMaterial({color:0x567d53});
  for (let i=0;i<90;i++) {
    const a=i*2.399963, r=48+Math.sqrt(i/90)*155;
    const x=Math.cos(a)*r, z=Math.sin(a)*r;
    if(Math.abs(x)<40 && Math.abs(z)<115)continue;
    const trunk=new THREE.Mesh(trunkGeometry,trunkMat); trunk.position.set(x,2.5,z); trunk.castShadow=true; scene.add(trunk);
    const crown=new THREE.Mesh(foliageGeometry,foliageMat); crown.position.set(x,8,z); crown.scale.set(1,1.2,1); crown.castShadow=true; scene.add(crown);
  }
}
