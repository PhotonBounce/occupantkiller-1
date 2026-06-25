window.AncientFort = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var fortObjects = [];
  var campfireLight = null;
  var satelliteDish = null;
  var solarPanels = [];
  var artilleryFlash = null;
  var campfireParticles = [];
  var time = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    fortObjects = [];
    solarPanels = [];
    campfireParticles = [];
    time = 0;

    // Hilltop stone base - elevated rock platform
    var baseGeometry = new THREE.BoxGeometry(200, 8, 200);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.9,
      metalness: 0.1
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -4;
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    fortObjects.push(base);

    // Roman perimeter wall sections - limestone blocks
    var wallHeight = 12;
    var wallThickness = 2;
    var wallSegments = [
      { x: 80, z: 0, length: 160, rotation: 0 },
      { x: -80, z: 0, length: 160, rotation: 0 },
      { x: 0, z: 80, length: 160, rotation: Math.PI / 2 },
      { x: 0, z: -80, length: 160, rotation: Math.PI / 2 }
    ];

    wallSegments.forEach(function(seg, index) {
      var wallGeometry = new THREE.BoxGeometry(seg.length, wallHeight, wallThickness);
      var wallMaterial = new THREE.MeshStandardMaterial({
        color: index % 2 === 0 ? 0xD3D3D3 : 0xA9A9A9,
        roughness: 0.95,
        metalness: 0.0
      });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(seg.x, wallHeight / 2, seg.z);
      wall.rotation.y = seg.rotation;
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      fortObjects.push(wall);

      // Add crumbled sections to some walls
      if (index % 2 === 1) {
        for (var i = 0; i < 3; i++) {
          var rubbleGeometry = new THREE.BoxGeometry(8, 6, 3);
          var rubbleMaterial = new THREE.MeshStandardMaterial({
            color: 0x696969,
            roughness: 1.0,
            metalness: 0.0
          });
          var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
          var offset = (i - 1) * 30;
          rubble.position.set(
            seg.x + Math.sin(seg.rotation) * offset,
            wallHeight - 3,
            seg.z + Math.cos(seg.rotation) * offset
          );
          rubble.rotation.set(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3);
          rubble.castShadow = true;
          rubble.receiveShadow = true;
          scene.add(rubble);
          fortObjects.push(rubble);
        }
      }
    });

    // Round tower ruins - cylinder with crumbled cap
    var towerPositions = [
      { x: 70, z: 70 },
      { x: -70, z: 70 },
      { x: 70, z: -70 },
      { x: -70, z: -70 }
    ];

    towerPositions.forEach(function(pos) {
      var towerGeometry = new THREE.CylinderGeometry(8, 10, 10, 16);
      var towerMaterial = new THREE.MeshStandardMaterial({
        color: 0xB8860B,
        roughness: 0.92,
        metalness: 0.05
      });
      var tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(pos.x, 5, pos.z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      scene.add(tower);
      fortObjects.push(tower);

      // Crumbled cap
      for (var i = 0; i < 5; i++) {
        var capGeometry = new THREE.BoxGeometry(6, 4, 6);
        var capMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B7355,
          roughness: 0.98,
          metalness: 0.0
        });
        var cap = new THREE.Mesh(capGeometry, capMaterial);
        var angle = (i / 5) * Math.PI * 2;
        cap.position.set(
          pos.x + Math.cos(angle) * 10,
          11 + Math.random() * 2,
          pos.z + Math.sin(angle) * 10
        );
        cap.rotation.set(Math.random() * 0.4, Math.random() * 0.4, Math.random() * 0.4);
        cap.castShadow = true;
        cap.receiveShadow = true;
        scene.add(cap);
        fortObjects.push(cap);
      }
    });

    // Gate arch remains - two pillars and lintel
    var pillarGeometry = new THREE.CylinderGeometry(4, 4.5, 14, 12);
    var pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0,
      roughness: 0.88,
      metalness: 0.08
    });
    var leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    leftPillar.position.set(-12, 7, -75);
    leftPillar.castShadow = true;
    leftPillar.receiveShadow = true;
    scene.add(leftPillar);
    fortObjects.push(leftPillar);

    var rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    rightPillar.position.set(12, 7, -75);
    rightPillar.castShadow = true;
    rightPillar.receiveShadow = true;
    scene.add(rightPillar);
    fortObjects.push(rightPillar);

    var lintelGeometry = new THREE.BoxGeometry(28, 3, 4);
    var lintelMaterial = new THREE.MeshStandardMaterial({
      color: 0xA9A9A9,
      roughness: 0.9,
      metalness: 0.05
    });
    var lintel = new THREE.Mesh(lintelGeometry, lintelMaterial);
    lintel.position.set(0, 15, -75);
    lintel.castShadow = true;
    lintel.receiveShadow = true;
    scene.add(lintel);
    fortObjects.push(lintel);

    // Barracks building ruin - partial walls, open top
    var barrackGeometry = new THREE.BoxGeometry(40, 8, 30);
    var barrackMaterial = new THREE.MeshStandardMaterial({
      color: 0xA0826D,
      roughness: 0.91,
      metalness: 0.03
    });
    var barrack = new THREE.Mesh(barrackGeometry, barrackMaterial);
    barrack.position.set(-45, 4, 20);
    barrack.castShadow = true;
    barrack.receiveShadow = true;
    scene.add(barrack);
    fortObjects.push(barrack);

    // Barracks door opening
    var doorFrameGeometry = new THREE.BoxGeometry(6, 8, 0.5);
    var doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x2F4F4F,
      roughness: 0.85,
      metalness: 0.2
    });
    var doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrame.position.set(-45, 4, 34);
    doorFrame.castShadow = true;
    scene.add(doorFrame);
    fortObjects.push(doorFrame);

    // Well in courtyard - stone ring
    var wellRingGeometry = new THREE.CylinderGeometry(8, 8, 3, 16);
    var wellMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.93,
      metalness: 0.02
    });
    var wellRing = new THREE.Mesh(wellRingGeometry, wellMaterial);
    wellRing.position.set(30, 0.3, -20);
    wellRing.castShadow = true;
    wellRing.receiveShadow = true;
    scene.add(wellRing);
    fortObjects.push(wellRing);

    // Well rope - line segments
    var ropeGeometry = new THREE.BufferGeometry();
    var ropePositions = new Float32Array([
      5, 3, -20, 5, -15, -20,
      -5, 3, -20, -5, -15, -20
    ]);
    ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 });
    var wellRope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
    scene.add(wellRope);
    fortObjects.push(wellRope);

    // Roman column stumps
    var columnPositions = [
      { x: -20, z: -40 },
      { x: 20, z: -40 },
      { x: -30, z: 15 }
    ];

    columnPositions.forEach(function(pos) {
      var colGeometry = new THREE.CylinderGeometry(1.5, 1.8, 6, 12);
      var colMaterial = new THREE.MeshStandardMaterial({
        color: 0xC0C0C0,
        roughness: 0.87,
        metalness: 0.1
      });
      var column = new THREE.Mesh(colGeometry, colMaterial);
      column.position.set(pos.x, 3, pos.z);
      column.castShadow = true;
      column.receiveShadow = true;
      scene.add(column);
      fortObjects.push(column);

      // Fallen column segment
      var fallenGeometry = new THREE.CylinderGeometry(1.2, 1.2, 8, 12);
      var fallen = new THREE.Mesh(fallenGeometry, colMaterial);
      fallen.position.set(pos.x + 8, 2, pos.z);
      fallen.rotation.z = Math.PI / 2;
      fallen.castShadow = true;
      fallen.receiveShadow = true;
      scene.add(fallen);
      fortObjects.push(fallen);
    });

    // Satellite dish on Roman pillar
    var dishPedestalGeometry = new THREE.CylinderGeometry(1, 1.2, 4, 12);
    var dishPedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0x505050,
      roughness: 0.8,
      metalness: 0.5
    });
    var dishPedestal = new THREE.Mesh(dishPedestalGeometry, dishPedestalMaterial);
    dishPedestal.position.set(-60, 9, 60);
    dishPedestal.castShadow = true;
    scene.add(dishPedestal);
    fortObjects.push(dishPedestal);

    // Satellite dish bowl
    var dishBowlGeometry = new THREE.BoxGeometry(8, 5, 8);
    var dishBowlMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.4,
      metalness: 0.8
    });
    satelliteDish = new THREE.Mesh(dishBowlGeometry, dishBowlMaterial);
    satelliteDish.position.set(-60, 12, 60);
    satelliteDish.castShadow = true;
    scene.add(satelliteDish);
    fortObjects.push(satelliteDish);

    // Solar panels
    var panelPositions = [
      { x: 50, z: 40, angle: 0.3 },
      { x: 55, z: 45, angle: 0.35 },
      { x: 45, z: 35, angle: 0.25 }
    ];

    panelPositions.forEach(function(pos) {
      var panelGeometry = new THREE.BoxGeometry(6, 4, 0.3);
      var panelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.3,
        metalness: 0.6,
        emissive: 0x0a4a0a
      });
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(pos.x, 10, pos.z);
      panel.rotation.x = pos.angle;
      panel.castShadow = true;
      panel.receiveShadow = true;
      scene.add(panel);
      solarPanels.push(panel);
      fortObjects.push(panel);
    });

    // Modern ammo crates in barracks
    for (var i = 0; i < 4; i++) {
      var crateGeometry = new THREE.BoxGeometry(3, 3, 3);
      var crateMaterial = new THREE.MeshStandardMaterial({
        color: 0x2F4F2F,
        roughness: 0.7,
        metalness: 0.3
      });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(-50 + i * 5, 1.5, 20);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      fortObjects.push(crate);
    }

    // Generator in cellar
    var generatorGeometry = new THREE.BoxGeometry(4, 3, 4);
    var generatorMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.75,
      metalness: 0.4
    });
    var generator = new THREE.Mesh(generatorGeometry, generatorMaterial);
    generator.position.set(60, 1.5, -50);
    generator.castShadow = true;
    generator.receiveShadow = true;
    scene.add(generator);
    fortObjects.push(generator);

    // Chain-link fence section closing ancient wall gap
    for (var i = 0; i < 2; i++) {
      var fencePostGeometry = new THREE.CylinderGeometry(0.6, 0.6, 10, 8);
      var fencePostMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.8,
        metalness: 0.6
      });
      var fencePost = new THREE.Mesh(fencePostGeometry, fencePostMaterial);
      fencePost.position.set(-40 + i * 15, 5, 75);
      fencePost.castShadow = true;
      scene.add(fencePost);
      fortObjects.push(fencePost);
    }

    // Fence mesh
    var fenceGeometry = new THREE.BufferGeometry();
    var fencePositions = new Float32Array([
      -40, 0, 75, 20, 0, 75,
      -40, 10, 75, 20, 10, 75
    ]);
    fenceGeometry.setAttribute('position', new THREE.BufferAttribute(fencePositions, 3));
    var fenceMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 1 });
    var fenceLines = new THREE.LineSegments(fenceGeometry, fenceMaterial);
    scene.add(fenceLines);
    fortObjects.push(fenceLines);

    // Modern latrine tent
    var tentGeometry = new THREE.BoxGeometry(4, 3, 4);
    var tentMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.85,
      metalness: 0.05
    });
    var tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.position.set(65, 1.5, 30);
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);
    fortObjects.push(tent);

    // Ancient cobblestone courtyard
    var courtGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    var courtMaterial = new THREE.MeshStandardMaterial({
      color: 0x6B6B47,
      roughness: 0.96,
      metalness: 0.0
    });
    var court = new THREE.Mesh(courtGeometry, courtMaterial);
    court.position.set(0, 0, 0);
    court.receiveShadow = true;
    scene.add(court);
    fortObjects.push(court);

    // Stone altar ruin
    var altarGeometry = new THREE.BoxGeometry(6, 4, 6);
    var altarMaterial = new THREE.MeshStandardMaterial({
      color: 0xA9A9A9,
      roughness: 0.88,
      metalness: 0.02
    });
    var altar = new THREE.Mesh(altarGeometry, altarMaterial);
    altar.position.set(35, 2, 10);
    altar.castShadow = true;
    altar.receiveShadow = true;
    scene.add(altar);
    fortObjects.push(altar);

    // Carved relief wall panel
    var reliefGeometry = new THREE.BoxGeometry(8, 6, 0.8);
    var reliefMaterial = new THREE.MeshStandardMaterial({
      color: 0xD3D3D3,
      roughness: 0.85,
      metalness: 0.08,
      map: createReliefsTexture()
    });
    var relief = new THREE.Mesh(reliefGeometry, reliefMaterial);
    relief.position.set(-70, 6, 0);
    relief.castShadow = true;
    scene.add(relief);
    fortObjects.push(relief);

    // Stone steps descending
    for (var i = 0; i < 8; i++) {
      var stepGeometry = new THREE.BoxGeometry(30, 1, 3);
      var stepMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B8B83,
        roughness: 0.92,
        metalness: 0.01
      });
      var step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(0, -2 - i * 1.2, 50 + i * 3);
      step.castShadow = true;
      step.receiveShadow = true;
      scene.add(step);
      fortObjects.push(step);
    }

    // Archers' crenellations on walls
    for (var i = 0; i < 12; i++) {
      var creneGeometry = new THREE.BoxGeometry(2.5, 3, 1.5);
      var creneMaterial = new THREE.MeshStandardMaterial({
        color: 0xA0A0A0,
        roughness: 0.89,
        metalness: 0.04
      });
      var crene = new THREE.Mesh(creneGeometry, creneMaterial);
      crene.position.set(-75 + i * 13, 15, -70);
      crene.castShadow = true;
      crene.receiveShadow = true;
      scene.add(crene);
      fortObjects.push(crene);
    }

    // Campfire pit in ancient hearth location
    var fireGeometry = new THREE.SphereGeometry(2, 8, 8);
    var fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6347,
      emissive: 0xFF4500,
      roughness: 0.7,
      metalness: 0.0
    });
    var fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(-15, 1, -10);
    fire.castShadow = false;
    scene.add(fire);
    fortObjects.push(fire);

    // Campfire light
    campfireLight = new THREE.PointLight(0xFF6347, 1.5, 50);
    campfireLight.position.set(-15, 3, -10);
    campfireLight.castShadow = true;
    scene.add(campfireLight);

    // Artillery flash sphere for distant explosion
    var flashGeometry = new THREE.SphereGeometry(1, 8, 8);
    var flashMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDD00,
      emissive: 0xFFFF00,
      roughness: 0.5,
      metalness: 0.0
    });
    artilleryFlash = new THREE.Mesh(flashGeometry, flashMaterial);
    artilleryFlash.position.set(120, 80, -100);
    artilleryFlash.scale.set(0.1, 0.1, 0.1);
    scene.add(artilleryFlash);
    fortObjects.push(artilleryFlash);
  }

  function createReliefsTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#D3D3D3';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#A9A9A9';
    ctx.fillRect(50, 50, 60, 60);
    ctx.fillRect(150, 80, 60, 60);
    ctx.fillRect(100, 150, 50, 50);
    var texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  function update(delta) {
    time += delta;

    // Campfire flicker
    if (campfireLight) {
      var flicker = 1.5 + Math.sin(time * 8) * 0.4 + Math.random() * 0.2;
      campfireLight.intensity = flicker;
      campfireLight.distance = 50 + Math.sin(time * 6) * 5;
    }

    // Satellite dish slow tracking rotation
    if (satelliteDish) {
      satelliteDish.rotation.y += delta * 0.3;
      satelliteDish.rotation.x = 0.3 + Math.sin(time * 0.5) * 0.1;
    }

    // Solar panel shimmer
    solarPanels.forEach(function(panel) {
      panel.material.emissive.setHex(0x0a4a0a + Math.floor(Math.sin(time * 3) * 20) * 0x010000);
    });

    // Distant artillery flash pulse
    if (artilleryFlash) {
      var flashPulse = Math.max(0, Math.sin(time * 2) - 0.7);
      artilleryFlash.scale.set(flashPulse, flashPulse, flashPulse);
      artilleryFlash.material.emissive.setHex(0xFFFF00 - Math.floor(flashPulse * 50) * 0x000001);
    }
  }

  function reset() {
    time = 0;
    fortObjects.forEach(function(obj) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    });
    fortObjects = [];
    solarPanels = [];
    campfireParticles = [];
    if (campfireLight && campfireLight.parent) {
      campfireLight.parent.remove(campfireLight);
    }
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
