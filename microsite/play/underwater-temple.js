window.UnderwaterTemple = (function() {
  'use strict';

  var scene = null;
  var camera = null;

  // Object references for animation
  var coral1, coral2, coral3, coral4;
  var shark;
  var kelp1, kelp2, kelp3, kelp4, kelp5;
  var bubbles = [];
  var runeStone1, runeStone2, runeStone3, runeStone4;
  var portalRing;
  var statueGuardian;
  var allObjects = [];

  var time = 0;

  function init(inScene, inCamera) {
    scene = inScene;
    camera = inCamera;
    allObjects = [];
    bubbles = [];
    time = 0;

    // Set scene background and fog for underwater effect
    scene.background = new THREE.Color(0x001122);
    scene.fog = new THREE.Fog(0x001122, 200, 500);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0x4488BB, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x88CCFF, 0.5);
    directionalLight.position.set(100, 150, 100);
    scene.add(directionalLight);

    // 1. Temple columns (8 CylinderGeometry tall columns)
    var columnPositions = [
      [-60, 0, -60],
      [60, 0, -60],
      [-60, 0, 60],
      [60, 0, 60],
      [-40, 0, -40],
      [40, 0, -40],
      [-40, 0, 40],
      [40, 0, 40]
    ];

    columnPositions.forEach(function(pos) {
      var columnGeom = new THREE.CylinderGeometry(8, 10, 120, 16);
      var columnMat = new THREE.MeshPhongMaterial({ color: 0x6688AA });
      var column = new THREE.Mesh(columnGeom, columnMat);
      column.position.set(pos[0], pos[1], pos[2]);
      scene.add(column);
      allObjects.push(column);
    });

    // 2. Submerged altar (BoxGeometry)
    var altarGeom = new THREE.BoxGeometry(30, 20, 30);
    var altarMat = new THREE.MeshPhongMaterial({ color: 0x557799 });
    var altar = new THREE.Mesh(altarGeom, altarMat);
    altar.position.y = 10;
    altar.position.z = 0;
    scene.add(altar);
    allObjects.push(altar);

    // 3. Algae growth on altar (SphereGeometry clusters)
    for (var i = 0; i < 4; i++) {
      var algaeGeom = new THREE.SphereGeometry(6, 8, 8);
      var algaeMat = new THREE.MeshPhongMaterial({ color: 0x336644 });
      var algae = new THREE.Mesh(algaeGeom, algaeMat);
      algae.position.set(
        -15 + i * 10,
        25,
        -10 + (i % 2) * 20
      );
      scene.add(algae);
      allObjects.push(algae);
    }

    // 4-7. Bioluminescent coral formations (SphereGeometry clusters with emissive)
    coral1 = new THREE.Group();
    for (var i = 0; i < 5; i++) {
      var coralGeom = new THREE.SphereGeometry(3 + i * 0.5, 8, 8);
      var coralMat = new THREE.MeshPhongMaterial({
        color: 0x00CCFF,
        emissive: 0x0088FF,
        emissiveIntensity: 0.5
      });
      var coralPart = new THREE.Mesh(coralGeom, coralMat);
      coralPart.position.y = i * 4;
      coral1.add(coralPart);
    }
    coral1.position.set(-80, 0, 0);
    scene.add(coral1);
    allObjects.push(coral1);

    coral2 = new THREE.Group();
    for (var i = 0; i < 5; i++) {
      var coralGeom = new THREE.SphereGeometry(3 + i * 0.5, 8, 8);
      var coralMat = new THREE.MeshPhongMaterial({
        color: 0x00CCFF,
        emissive: 0x0088FF,
        emissiveIntensity: 0.5
      });
      var coralPart = new THREE.Mesh(coralGeom, coralMat);
      coralPart.position.y = i * 4;
      coral2.add(coralPart);
    }
    coral2.position.set(80, 0, 0);
    scene.add(coral2);
    allObjects.push(coral2);

    coral3 = new THREE.Group();
    for (var i = 0; i < 5; i++) {
      var coralGeom = new THREE.SphereGeometry(3 + i * 0.5, 8, 8);
      var coralMat = new THREE.MeshPhongMaterial({
        color: 0x00CCFF,
        emissive: 0x0088FF,
        emissiveIntensity: 0.5
      });
      var coralPart = new THREE.Mesh(coralGeom, coralMat);
      coralPart.position.y = i * 4;
      coral3.add(coralPart);
    }
    coral3.position.set(0, 0, -80);
    scene.add(coral3);
    allObjects.push(coral3);

    coral4 = new THREE.Group();
    for (var i = 0; i < 5; i++) {
      var coralGeom = new THREE.SphereGeometry(3 + i * 0.5, 8, 8);
      var coralMat = new THREE.MeshPhongMaterial({
        color: 0x00CCFF,
        emissive: 0x0088FF,
        emissiveIntensity: 0.5
      });
      var coralPart = new THREE.Mesh(coralGeom, coralMat);
      coralPart.position.y = i * 4;
      coral4.add(coralPart);
    }
    coral4.position.set(0, 0, 80);
    scene.add(coral4);
    allObjects.push(coral4);

    // 8. Ancient sealed treasure chest (BoxGeometry with gold emissive)
    var chestGeom = new THREE.BoxGeometry(25, 20, 20);
    var chestMat = new THREE.MeshPhongMaterial({ color: 0x886644 });
    var chest = new THREE.Mesh(chestGeom, chestMat);
    chest.position.set(-50, 15, 50);
    scene.add(chest);
    allObjects.push(chest);

    var goldGeom = new THREE.BoxGeometry(24, 5, 19);
    var goldMat = new THREE.MeshPhongMaterial({
      color: 0xFFD700,
      emissive: 0xFFAA00,
      emissiveIntensity: 0.6
    });
    var goldLid = new THREE.Mesh(goldGeom, goldMat);
    goldLid.position.set(-50, 25, 50);
    scene.add(goldLid);
    allObjects.push(goldLid);

    // 9-10. Air pocket chambers (BoxGeometry dark with emissive ceiling)
    var chamber1Geom = new THREE.BoxGeometry(40, 50, 40);
    var chamber1Mat = new THREE.MeshPhongMaterial({ color: 0x001133 });
    var chamber1 = new THREE.Mesh(chamber1Geom, chamber1Mat);
    chamber1.position.set(-70, 50, -70);
    scene.add(chamber1);
    allObjects.push(chamber1);

    var ceiling1Geom = new THREE.BoxGeometry(38, 2, 38);
    var ceiling1Mat = new THREE.MeshPhongMaterial({
      color: 0x334455,
      emissive: 0x8888FF,
      emissiveIntensity: 0.4
    });
    var ceiling1 = new THREE.Mesh(ceiling1Geom, ceiling1Mat);
    ceiling1.position.set(-70, 95, -70);
    scene.add(ceiling1);
    allObjects.push(ceiling1);

    var chamber2Geom = new THREE.BoxGeometry(40, 50, 40);
    var chamber2Mat = new THREE.MeshPhongMaterial({ color: 0x001133 });
    var chamber2 = new THREE.Mesh(chamber2Geom, chamber2Mat);
    chamber2.position.set(70, 50, 70);
    scene.add(chamber2);
    allObjects.push(chamber2);

    var ceiling2Geom = new THREE.BoxGeometry(38, 2, 38);
    var ceiling2Mat = new THREE.MeshPhongMaterial({
      color: 0x334455,
      emissive: 0x8888FF,
      emissiveIntensity: 0.4
    });
    var ceiling2 = new THREE.Mesh(ceiling2Geom, ceiling2Mat);
    ceiling2.position.set(70, 95, 70);
    scene.add(ceiling2);
    allObjects.push(ceiling2);

    // 11. Shark patrol fish (BoxGeometry elongated)
    var sharkGeom = new THREE.BoxGeometry(8, 4, 20);
    var sharkMat = new THREE.MeshPhongMaterial({ color: 0x445566 });
    shark = new THREE.Mesh(sharkGeom, sharkMat);
    shark.position.set(0, 30, 0);
    scene.add(shark);
    allObjects.push(shark);

    // 12-16. Kelp forest (CylinderGeometry thin, swaying)
    var kelpPositions = [
      [-50, 0, -30],
      [-30, 0, -50],
      [30, 0, -50],
      [50, 0, -30],
      [0, 0, 40]
    ];

    var kelpArray = [];
    kelpPositions.forEach(function(pos) {
      var kelpGeom = new THREE.CylinderGeometry(1.5, 1.5, 80, 8);
      var kelpMat = new THREE.MeshPhongMaterial({ color: 0x335533 });
      var kelp = new THREE.Mesh(kelpGeom, kelpMat);
      kelp.position.set(pos[0], pos[1], pos[2]);
      scene.add(kelp);
      allObjects.push(kelp);
      kelpArray.push(kelp);
    });
    kelp1 = kelpArray[0];
    kelp2 = kelpArray[1];
    kelp3 = kelpArray[2];
    kelp4 = kelpArray[3];
    kelp5 = kelpArray[4];

    // 17-18. Underwater ruins walls (BoxGeometry mossy)
    var wallGeom1 = new THREE.BoxGeometry(80, 60, 10);
    var wallMat = new THREE.MeshPhongMaterial({ color: 0x446655 });
    var wall1 = new THREE.Mesh(wallGeom1, wallMat);
    wall1.position.set(0, 20, -100);
    scene.add(wall1);
    allObjects.push(wall1);

    var wallGeom2 = new THREE.BoxGeometry(80, 60, 10);
    var wall2 = new THREE.Mesh(wallGeom2, wallMat);
    wall2.position.set(0, 20, 100);
    scene.add(wall2);
    allObjects.push(wall2);

    // 19-22. Glowing rune stones on floor (BoxGeometry flat with emissive)
    var runePositions = [
      [-40, 2, 0],
      [40, 2, 0],
      [0, 2, -40],
      [0, 2, 40]
    ];

    var runeArray = [];
    runePositions.forEach(function(pos) {
      var runeGeom = new THREE.BoxGeometry(10, 1, 10);
      var runeMat = new THREE.MeshPhongMaterial({
        color: 0x002244,
        emissive: 0x0088FF,
        emissiveIntensity: 0.5
      });
      var rune = new THREE.Mesh(runeGeom, runeMat);
      rune.position.set(pos[0], pos[1], pos[2]);
      scene.add(rune);
      allObjects.push(rune);
      runeArray.push(rune);
    });
    runeStone1 = runeArray[0];
    runeStone2 = runeArray[1];
    runeStone3 = runeArray[2];
    runeStone4 = runeArray[3];

    // 23-27. Pressure vent bubbles (SphereGeometry tiny rising)
    for (var i = 0; i < 5; i++) {
      var bubbleGeom = new THREE.SphereGeometry(1, 8, 8);
      var bubbleMat = new THREE.MeshPhongMaterial({ color: 0xAADDFF });
      var bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
      bubble.position.set(-20 + i * 10, -40, 0);
      bubble.originalY = bubble.position.y;
      scene.add(bubble);
      allObjects.push(bubble);
      bubbles.push(bubble);
    }

    // 28. Ancient statue guardian (BoxGeometry tall)
    var statueBodyGeom = new THREE.BoxGeometry(12, 60, 12);
    var statueMat = new THREE.MeshPhongMaterial({ color: 0x557788 });
    statueGuardian = new THREE.Group();

    var body = new THREE.Mesh(statueBodyGeom, statueMat);
    body.position.y = 20;
    statueGuardian.add(body);
    allObjects.push(statueGuardian);

    var armGeom = new THREE.BoxGeometry(8, 8, 35);
    var arm = new THREE.Mesh(armGeom, statueMat);
    arm.position.set(15, 45, 0);
    statueGuardian.add(arm);

    statueGuardian.position.set(50, 0, -50);
    scene.add(statueGuardian);

    // 29-30. Diving equipment cache (CylinderGeometry tank + BoxGeometry crate)
    var tankGeom = new THREE.CylinderGeometry(3, 3, 25, 12);
    var tankMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(-60, 10, -60);
    scene.add(tank);
    allObjects.push(tank);

    var crateGeom = new THREE.BoxGeometry(20, 15, 15);
    var crateMat = new THREE.MeshPhongMaterial({ color: 0x666644 });
    var crate = new THREE.Mesh(crateGeom, crateMat);
    crate.position.set(-60, 20, -45);
    scene.add(crate);
    allObjects.push(crate);

    // 31-32. Hidden enemy submarine dock (BoxGeometry with lights)
    var dockGeom = new THREE.BoxGeometry(50, 30, 40);
    var dockMat = new THREE.MeshPhongMaterial({ color: 0x334455 });
    var dock = new THREE.Mesh(dockGeom, dockMat);
    dock.position.set(-90, 15, 50);
    scene.add(dock);
    allObjects.push(dock);

    var dockLightGeom = new THREE.BoxGeometry(8, 2, 8);
    var lightMat = new THREE.MeshPhongMaterial({
      color: 0xFFFF00,
      emissive: 0xFF8800,
      emissiveIntensity: 0.7
    });
    var dockLight = new THREE.Mesh(dockLightGeom, lightMat);
    dockLight.position.set(-90, 35, 50);
    scene.add(dockLight);
    allObjects.push(dockLight);

    // 33. Ancient portal ring (CylinderGeometry ring, spinning)
    var ringGeom = new THREE.CylinderGeometry(30, 30, 3, 32);
    var ringMat = new THREE.MeshPhongMaterial({
      color: 0x004488,
      emissive: 0x0066FF,
      emissiveIntensity: 0.5
    });
    portalRing = new THREE.Mesh(ringGeom, ringMat);
    portalRing.position.set(0, 50, 0);
    scene.add(portalRing);
    allObjects.push(portalRing);
  }

  function update(delta) {
    time += delta;

    // Coral pulses
    [coral1, coral2, coral3, coral4].forEach(function(coral) {
      coral.children.forEach(function(part) {
        if (part.material && part.material.emissiveIntensity !== undefined) {
          part.material.emissiveIntensity = 0.3 + 0.3 * Math.sin(time * 2);
        }
      });
    });

    // Shark patrol orbits
    if (shark) {
      var angle = time * 0.5;
      shark.position.x = Math.cos(angle) * 60;
      shark.position.z = Math.sin(angle) * 60;
      shark.rotation.y = angle;
    }

    // Kelp sways with phase offsets
    var kelpArray = [kelp1, kelp2, kelp3, kelp4, kelp5];
    kelpArray.forEach(function(kelp, index) {
      if (kelp) {
        kelp.rotation.z = 0.1 * Math.sin(time * 1.5 + index * 0.7);
      }
    });

    // Pressure bubbles rise
    bubbles.forEach(function(bubble) {
      bubble.position.y += 20 * delta;
      if (bubble.position.y > 80) {
        bubble.position.y = bubble.originalY;
      }
    });

    // Rune stones glow brighter/dimmer
    [runeStone1, runeStone2, runeStone3, runeStone4].forEach(function(rune) {
      if (rune && rune.material) {
        rune.material.emissiveIntensity = 0.3 + 0.4 * Math.sin(time * 1.2);
      }
    });

    // Portal ring spins
    if (portalRing) {
      portalRing.rotation.y += 0.3 * delta;
    }

    // Statue guardian arm extends
    if (statueGuardian && statueGuardian.children.length > 1) {
      var arm = statueGuardian.children[1];
      if (arm) {
        arm.rotation.x = 0.3 * Math.sin(time * 1.5);
      }
    }
  }

  function reset() {
    if (scene) {
      allObjects.forEach(function(obj) {
        scene.remove(obj);
      });
    }
    allObjects = [];
    bubbles = [];
    time = 0;
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
