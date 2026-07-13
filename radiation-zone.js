window.RadiationZone = (function() {
  'use strict';

  var objects = [];
  var animatedObjects = [];

  function init(scene, camera) {
    objects = [];
    animatedObjects = [];

    // 1. Ruined city blocks - BoxGeometry buildings
    var blockGeom1 = new THREE.BoxGeometry(20, 25, 15);
    var blockMat1 = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.8 });
    var block1 = new THREE.Mesh(blockGeom1, blockMat1);
    block1.position.set(-30, 12.5, -40);
    block1.rotation.z = 0.1;
    scene.add(block1);
    objects.push(block1);

    var blockGeom2 = new THREE.BoxGeometry(18, 20, 12);
    var blockMat2 = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.8 });
    var block2 = new THREE.Mesh(blockGeom2, blockMat2);
    block2.position.set(25, 10, -35);
    block2.rotation.z = -0.15;
    scene.add(block2);
    objects.push(block2);

    var blockGeom3 = new THREE.BoxGeometry(16, 18, 10);
    var blockMat3 = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.8 });
    var block3 = new THREE.Mesh(blockGeom3, blockMat3);
    block3.position.set(0, 9, 30);
    block3.rotation.z = 0.08;
    scene.add(block3);
    objects.push(block3);

    // 2. Glowing radioactive craters - SphereGeometry large flat
    var craterGeom1 = new THREE.SphereGeometry(15, 32, 16);
    var craterMat1 = new THREE.MeshStandardMaterial({
      color: 0x00FF22,
      emissive: 0x00FF22,
      emissiveIntensity: 0.6,
      roughness: 0.6
    });
    var crater1 = new THREE.Mesh(craterGeom1, craterMat1);
    crater1.position.set(-50, -5, 10);
    crater1.scale.y = 0.3;
    scene.add(crater1);
    objects.push(crater1);
    animatedObjects.push({
      mesh: crater1,
      type: 'crater',
      baseIntensity: 0.6,
      baseScale: { x: 1, y: 0.3, z: 1 },
      time: 0
    });

    var craterGeom2 = new THREE.SphereGeometry(12, 32, 16);
    var craterMat2 = new THREE.MeshStandardMaterial({
      color: 0x00FF22,
      emissive: 0x00FF22,
      emissiveIntensity: 0.6,
      roughness: 0.6
    });
    var crater2 = new THREE.Mesh(craterGeom2, craterMat2);
    crater2.position.set(35, -3, 45);
    crater2.scale.y = 0.25;
    scene.add(crater2);
    objects.push(crater2);
    animatedObjects.push({
      mesh: crater2,
      type: 'crater',
      baseIntensity: 0.6,
      baseScale: { x: 1, y: 0.25, z: 1 },
      time: 1
    });

    // 3. Radiation warning signs - BoxGeometry flat panels
    var signGeom = new THREE.BoxGeometry(3, 4, 0.2);
    var signMat = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.7 });
    var sign1 = new THREE.Mesh(signGeom, signMat);
    sign1.position.set(-15, 2, 5);
    scene.add(sign1);
    objects.push(sign1);

    var sign2 = new THREE.Mesh(signGeom, signMat);
    sign2.position.set(40, 2, 25);
    sign2.rotation.y = Math.PI / 4;
    scene.add(sign2);
    objects.push(sign2);

    // 4. Abandoned military jeeps - BoxGeometry body + CylinderGeometry wheels
    var jeepBodyGeom = new THREE.BoxGeometry(3, 2, 6);
    var jeepBodyMat = new THREE.MeshStandardMaterial({ color: 0x4A5C2A, roughness: 0.8 });
    var jeepBody = new THREE.Mesh(jeepBodyGeom, jeepBodyMat);
    jeepBody.position.set(-10, 1.5, 15);
    scene.add(jeepBody);
    objects.push(jeepBody);

    var wheelGeom = new THREE.CylinderGeometry(1, 1, 0.5, 16);
    var wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    var wheel1 = new THREE.Mesh(wheelGeom, wheelMat);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(-2, 0.8, 12);
    scene.add(wheel1);
    objects.push(wheel1);

    var wheel2 = new THREE.Mesh(wheelGeom, wheelMat);
    wheel2.rotation.z = Math.PI / 2;
    wheel2.position.set(-2, 0.8, 18);
    scene.add(wheel2);
    objects.push(wheel2);

    // 5. Geiger counter hotspot indicators - CylinderGeometry poles with SphereGeometry top
    var poleGeom1 = new THREE.CylinderGeometry(0.3, 0.3, 8, 12);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
    var pole1 = new THREE.Mesh(poleGeom1, poleMat);
    pole1.position.set(10, 4, -20);
    scene.add(pole1);
    objects.push(pole1);

    var topGeom1 = new THREE.SphereGeometry(0.8, 16, 16);
    var topMat1 = new THREE.MeshStandardMaterial({
      color: 0x00FF00,
      emissive: 0x00FF00,
      emissiveIntensity: 0.5
    });
    var top1 = new THREE.Mesh(topGeom1, topMat1);
    top1.position.set(10, 8.5, -20);
    scene.add(top1);
    objects.push(top1);
    animatedObjects.push({
      mesh: top1,
      type: 'hotspot',
      baseIntensity: 0.5,
      time: 0
    });

    var pole2 = new THREE.Mesh(poleGeom1, poleMat);
    pole2.position.set(-40, 4, 0);
    scene.add(pole2);
    objects.push(pole2);

    var top2 = new THREE.Mesh(topGeom1, topMat1);
    top2.position.set(-40, 8.5, 0);
    scene.add(top2);
    objects.push(top2);
    animatedObjects.push({
      mesh: top2,
      type: 'hotspot',
      baseIntensity: 0.5,
      time: 0.3
    });

    // 6. Mutant creature spawns - SphereGeometry large
    var mutantGeom1 = new THREE.SphereGeometry(3, 16, 16);
    var mutantMat1 = new THREE.MeshStandardMaterial({ color: 0x2A4A1A, roughness: 0.6 });
    var mutant1 = new THREE.Mesh(mutantGeom1, mutantMat1);
    mutant1.position.set(20, 3, -10);
    scene.add(mutant1);
    objects.push(mutant1);
    animatedObjects.push({
      mesh: mutant1,
      type: 'mutant',
      baseScale: 1,
      time: 0
    });

    var mutant2 = new THREE.Mesh(mutantGeom1, mutantMat1);
    mutant2.position.set(-25, 3, 20);
    scene.add(mutant2);
    objects.push(mutant2);
    animatedObjects.push({
      mesh: mutant2,
      type: 'mutant',
      baseScale: 1,
      time: 0.5
    });

    // 7. Overturned nuclear waste trucks - BoxGeometry + CylinderGeometry tank
    var truckBodyGeom = new THREE.BoxGeometry(2.5, 2, 7);
    var truckBodyMat = new THREE.MeshStandardMaterial({ color: 0x553322, roughness: 0.8 });
    var truckBody = new THREE.Mesh(truckBodyGeom, truckBodyMat);
    truckBody.position.set(50, 1.5, -20);
    truckBody.rotation.z = 0.5;
    scene.add(truckBody);
    objects.push(truckBody);

    var tankGeom = new THREE.CylinderGeometry(2, 2, 5, 16);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0xFF8800, roughness: 0.7 });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(50, 2, -20);
    tank.rotation.x = 0.4;
    scene.add(tank);
    objects.push(tank);

    // 8. Radiation suits on hooks - BoxGeometry suit shape
    var suitGeom = new THREE.BoxGeometry(1.5, 3, 0.8);
    var suitMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 });
    var suit1 = new THREE.Mesh(suitGeom, suitMat);
    suit1.position.set(-5, 1.5, 40);
    scene.add(suit1);
    objects.push(suit1);

    var suit2 = new THREE.Mesh(suitGeom, suitMat);
    suit2.position.set(5, 1.5, 40);
    scene.add(suit2);
    objects.push(suit2);

    // 9. Contaminated water pool - BoxGeometry
    var poolGeom = new THREE.BoxGeometry(30, 0.5, 20);
    var poolMat = new THREE.MeshStandardMaterial({
      color: 0x00AA44,
      emissive: 0x00AA44,
      emissiveIntensity: 0.3,
      roughness: 0.4
    });
    var pool = new THREE.Mesh(poolGeom, poolMat);
    pool.position.set(0, 0.25, -60);
    scene.add(pool);
    objects.push(pool);
    animatedObjects.push({
      mesh: pool,
      type: 'water',
      baseIntensity: 0.3,
      time: 0
    });

    // 10. Collapsed communications tower - CylinderGeometry fallen/angled
    var towerGeom = new THREE.CylinderGeometry(0.5, 0.5, 40, 12);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(60, 10, -30);
    tower.rotation.z = 0.6;
    scene.add(tower);
    objects.push(tower);

    // 11. Emergency shelter bunker - BoxGeometry
    var bunkerGeom = new THREE.BoxGeometry(10, 5, 12);
    var bunkerMat = new THREE.MeshStandardMaterial({ color: 0x555544, roughness: 0.8 });
    var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
    bunker.position.set(-60, 2.5, -10);
    scene.add(bunker);
    objects.push(bunker);

    // 12. Burning radioactive barrel field - CylinderGeometry barrels + SphereGeometry flames
    var barrelGeom = new THREE.CylinderGeometry(1, 1, 2.5, 12);
    var barrelMat = new THREE.MeshStandardMaterial({ color: 0x882222, roughness: 0.8 });
    var barrel1 = new THREE.Mesh(barrelGeom, barrelMat);
    barrel1.position.set(-20, 1.25, -15);
    scene.add(barrel1);
    objects.push(barrel1);

    var flameGeom1 = new THREE.SphereGeometry(1.5, 12, 12);
    var flameMat1 = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF4400,
      emissiveIntensity: 0.7
    });
    var flame1 = new THREE.Mesh(flameGeom1, flameMat1);
    flame1.position.set(-20, 3, -15);
    scene.add(flame1);
    objects.push(flame1);
    animatedObjects.push({
      mesh: flame1,
      type: 'flame',
      baseIntensity: 0.7,
      time: 0
    });

    var barrel2 = new THREE.Mesh(barrelGeom, barrelMat);
    barrel2.position.set(-15, 1.25, -20);
    scene.add(barrel2);
    objects.push(barrel2);

    var flame2 = new THREE.Mesh(flameGeom1, flameMat1);
    flame2.position.set(-15, 3, -20);
    scene.add(flame2);
    objects.push(flame2);
    animatedObjects.push({
      mesh: flame2,
      type: 'flame',
      baseIntensity: 0.7,
      time: 0.4
    });

    // 13. Dead trees - CylinderGeometry trunks
    var trunkGeom = new THREE.CylinderGeometry(0.6, 1, 8, 12);
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x332222, roughness: 0.9 });
    var tree1 = new THREE.Mesh(trunkGeom, trunkMat);
    tree1.position.set(15, 4, 50);
    scene.add(tree1);
    objects.push(tree1);

    var tree2 = new THREE.Mesh(trunkGeom, trunkMat);
    tree2.position.set(25, 4, 55);
    scene.add(tree2);
    objects.push(tree2);

    var tree3 = new THREE.Mesh(trunkGeom, trunkMat);
    tree3.position.set(10, 4, 60);
    scene.add(tree3);
    objects.push(tree3);

    // 14. Additional scattered objects for variety
    var debrisGeom = new THREE.BoxGeometry(2, 1, 3);
    var debrisMat = new THREE.MeshStandardMaterial({ color: 0x775533, roughness: 0.9 });
    var debris1 = new THREE.Mesh(debrisGeom, debrisMat);
    debris1.position.set(30, 0.5, -5);
    debris1.rotation.z = 0.3;
    scene.add(debris1);
    objects.push(debris1);

    var debrisGeom2 = new THREE.BoxGeometry(1.5, 0.8, 2.5);
    var debris2 = new THREE.Mesh(debrisGeom2, debrisMat);
    debris2.position.set(-35, 0.4, 15);
    debris2.rotation.z = -0.2;
    scene.add(debris2);
    objects.push(debris2);

    // 15. Warning poles - CylinderGeometry
    var warnPoleGeom = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
    var warnPoleMat = new THREE.MeshStandardMaterial({ color: 0xFFDD00, roughness: 0.6 });
    var warnPole1 = new THREE.Mesh(warnPoleGeom, warnPoleMat);
    warnPole1.position.set(45, 2.5, 10);
    scene.add(warnPole1);
    objects.push(warnPole1);

    var warnPole2 = new THREE.Mesh(warnPoleGeom, warnPoleMat);
    warnPole2.position.set(-45, 2.5, 35);
    scene.add(warnPole2);
    objects.push(warnPole2);
  }

  function update(delta) {
    var i;
    for (i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      obj.time += delta;

      if (obj.type === 'crater') {
        var craterPulse = 0.5 + 0.5 * Math.sin(obj.time * 2);
        obj.mesh.material.emissiveIntensity = obj.baseIntensity * craterPulse;
        var craterScale = 1 + 0.1 * Math.sin(obj.time * 1.5);
        obj.mesh.scale.x = obj.baseScale.x * craterScale;
        obj.mesh.scale.z = obj.baseScale.z * craterScale;
      } else if (obj.type === 'hotspot') {
        var hotspotFlash = 0.2 + 0.8 * Math.abs(Math.sin(obj.time * 4));
        obj.mesh.material.emissiveIntensity = obj.baseIntensity * hotspotFlash;
      } else if (obj.type === 'mutant') {
        var mutantScale = obj.baseScale + 0.15 * Math.sin(obj.time * 2.5);
        obj.mesh.scale.set(mutantScale, mutantScale, mutantScale);
      } else if (obj.type === 'water') {
        var waterShimmer = 0.25 + 0.15 * Math.sin(obj.time * 3);
        obj.mesh.material.emissiveIntensity = waterShimmer;
      } else if (obj.type === 'flame') {
        var flameFlicker = 0.5 + 0.5 * Math.sin(obj.time * 6 + Math.random());
        obj.mesh.material.emissiveIntensity = obj.baseIntensity * flameFlicker;
      }
    }
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      objects[i].geometry.dispose();
      objects[i].material.dispose();
    }
    objects = [];
    animatedObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
