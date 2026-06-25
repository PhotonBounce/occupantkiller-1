window.DesertRuins = (function() {
  'use strict';

  var scene;
  var camera;
  var sandParticles = [];
  var mirageTime = 0;
  var tombLightFlicker = 0;
  var windTime = 0;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    var sandColor = 0xD4A574;
    var dustColor = 0xE8C9A0;
    var stoneColor = 0xA0826D;
    var darkStoneColor = 0x5C4F42;

    // Set scene background to desert sky gradient (handled in main, but set fog here)
    scene.fog = new THREE.Fog(0xDEB887, 200, 800);

    // ===== SAND DUNES - Undulating terrain blocks =====
    var duneGeometry = new THREE.BoxGeometry(40, 2, 40);
    var duneMaterial = new THREE.MeshPhongMaterial({
      color: sandColor,
      shininess: 10,
      emissive: 0x4A3F33
    });

    var dune1 = new THREE.Mesh(duneGeometry, duneMaterial);
    dune1.position.set(0, -10, 0);
    dune1.rotation.z = 0.15;
    scene.add(dune1);

    var dune2 = new THREE.Mesh(duneGeometry, duneMaterial);
    dune2.position.set(80, -12, -60);
    dune2.rotation.z = -0.2;
    dune2.scale.set(1.2, 0.8, 1.3);
    scene.add(dune2);

    var dune3 = new THREE.Mesh(duneGeometry, duneMaterial);
    dune3.position.set(-60, -11, 40);
    dune3.rotation.z = 0.1;
    dune3.scale.set(1.1, 0.9, 1.2);
    scene.add(dune3);

    // ===== ERODED SANDSTONE RUINS - Partially buried structures =====
    var stoneGeometry = new THREE.BoxGeometry(25, 18, 8);
    var stoneMaterial = new THREE.MeshPhongMaterial({
      color: stoneColor,
      shininess: 5,
      emissive: 0x3D3530
    });

    var ruin1 = new THREE.Mesh(stoneGeometry, stoneMaterial);
    ruin1.position.set(20, -2, 30);
    ruin1.rotation.y = 0.4;
    scene.add(ruin1);

    var ruin2 = new THREE.Mesh(new THREE.BoxGeometry(20, 16, 6), stoneMaterial);
    ruin2.position.set(-40, -3, 50);
    ruin2.rotation.y = -0.6;
    scene.add(ruin2);

    // ===== COLUMN STUMPS - CylinderGeometry columns =====
    var columnGeometry = new THREE.CylinderGeometry(3.5, 4, 20, 12);
    var columnMaterial = new THREE.MeshPhongMaterial({
      color: stoneColor,
      shininess: 8,
      emissive: 0x2F291F
    });

    var columns = [
      { pos: [0, -1, 20], height: 20 },
      { pos: [15, -4, 25], height: 12 },
      { pos: [-12, -2, 30], height: 18 },
      { pos: [25, -3, 15], height: 14 },
      { pos: [-25, -2, 40], height: 16 }
    ];

    columns.forEach(function(col) {
      var colGeom = new THREE.CylinderGeometry(3.5, 4, col.height, 12);
      var column = new THREE.Mesh(colGeom, columnMaterial);
      column.position.set(col.pos[0], col.pos[1], col.pos[2]);
      scene.add(column);

      // Fallen column variant
      if (Math.random() > 0.6) {
        var fallenGeom = new THREE.CylinderGeometry(3, 3.5, col.height * 0.9, 12);
        var fallen = new THREE.Mesh(fallenGeom, columnMaterial);
        fallen.position.set(col.pos[0] + 10, col.pos[1] - 2, col.pos[2] + 8);
        fallen.rotation.z = Math.PI / 2.5;
        scene.add(fallen);
      }
    });

    // ===== CRUMBLED ARCHWAY - BoxGeometry arch with missing keystone =====
    var archLeftGeom = new THREE.BoxGeometry(2, 15, 8);
    var archMaterial = new THREE.MeshPhongMaterial({
      color: stoneColor,
      shininess: 6,
      emissive: 0x3A3530
    });

    var archLeft = new THREE.Mesh(archLeftGeom, archMaterial);
    archLeft.position.set(-12, -1, -30);
    scene.add(archLeft);

    var archRight = new THREE.Mesh(archLeftGeom, archMaterial);
    archRight.position.set(12, -1, -30);
    scene.add(archRight);

    // Arch top sections (missing middle piece for destruction effect)
    var archTopGeom = new THREE.BoxGeometry(8, 2, 8);
    var archTop1 = new THREE.Mesh(archTopGeom, archMaterial);
    archTop1.position.set(-8, 7, -30);
    scene.add(archTop1);

    var archTop2 = new THREE.Mesh(archTopGeom, archMaterial);
    archTop2.position.set(8, 7, -30);
    scene.add(archTop2);

    // ===== HIEROGLYPH WALLS - BoxGeometry panels with LineSegments decoration =====
    var panelGeom = new THREE.BoxGeometry(16, 12, 1.5);
    var panelMaterial = new THREE.MeshPhongMaterial({
      color: stoneColor,
      shininess: 4,
      emissive: 0x2D251F
    });

    var panel = new THREE.Mesh(panelGeom, panelMaterial);
    panel.position.set(50, -2, 10);
    panel.rotation.y = -0.3;
    scene.add(panel);

    // Hieroglyph decoration lines
    var hieroglyphPoints = [];
    for (var i = 0; i < 8; i++) {
      var x = -7 + (i % 4) * 4;
      var y = 4 - Math.floor(i / 4) * 4;
      hieroglyphPoints.push(new THREE.Vector3(x, y, 1));
      hieroglyphPoints.push(new THREE.Vector3(x + 1, y, 1));
      hieroglyphPoints.push(new THREE.Vector3(x + 0.5, y - 1, 1));
    }
    var hieroglyphGeom = new THREE.BufferGeometry().setFromPoints(hieroglyphPoints);
    var hieroglyphLine = new THREE.LineSegments(hieroglyphGeom, new THREE.LineBasicMaterial({ color: 0x8B7355, linewidth: 2 }));
    hieroglyphLine.position.copy(panel.position);
    scene.add(hieroglyphLine);

    // ===== DRY OASIS - BoxGeometry basin surrounded by dead palm trunks =====
    var oasisBasinGeom = new THREE.BoxGeometry(30, 3, 30);
    var oasisMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B7765,
      shininess: 2,
      emissive: 0x3D3530
    });

    var oasisBasin = new THREE.Mesh(oasisBasinGeom, oasisMaterial);
    oasisBasin.position.set(-60, -8, -40);
    scene.add(oasisBasin);

    // Dead palm trunks (CylinderGeometry)
    var palmTrunkGeom = new THREE.CylinderGeometry(1.2, 1.5, 16, 8);
    var palmMaterial = new THREE.MeshPhongMaterial({
      color: 0x6B5C52,
      shininess: 3,
      emissive: 0x2D1F14
    });

    var palmPositions = [
      [-70, -1, -45], [-60, -1, -55], [-50, -1, -42], [-65, -1, -30]
    ];
    palmPositions.forEach(function(pos) {
      var palm = new THREE.Mesh(palmTrunkGeom, palmMaterial);
      palm.position.set(pos[0], pos[1], pos[2]);
      palm.rotation.z = (Math.random() - 0.5) * 0.6;
      scene.add(palm);
    });

    // ===== BURIED STATUE - Giant BoxGeometry face emerging from sand =====
    var faceGeom = new THREE.BoxGeometry(12, 16, 3);
    var faceMaterial = new THREE.MeshPhongMaterial({
      color: stoneColor,
      shininess: 7,
      emissive: 0x3D3530
    });

    var statueHead = new THREE.Mesh(faceGeom, faceMaterial);
    statueHead.position.set(70, 0, -80);
    scene.add(statueHead);

    // Eye sockets
    var eyeGeom = new THREE.BoxGeometry(1.5, 2, 0.5);
    var eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, emissive: 0x0a0a0a });
    var leftEye = new THREE.Mesh(eyeGeom, eyeMaterial);
    leftEye.position.set(67, 4, 2);
    scene.add(leftEye);

    var rightEye = new THREE.Mesh(eyeGeom, eyeMaterial);
    rightEye.position.set(73, 4, 2);
    scene.add(rightEye);

    // ===== UNDERGROUND TOMB ENTRANCE - BoxGeometry stairway descending =====
    var stairGeom = new THREE.BoxGeometry(12, 2, 6);
    var stairMaterial = new THREE.MeshPhongMaterial({
      color: darkStoneColor,
      shininess: 3,
      emissive: 0x1a1510
    });

    for (var s = 0; s < 5; s++) {
      var stair = new THREE.Mesh(stairGeom, stairMaterial);
      stair.position.set(0, -8 - (s * 3), 60 + (s * 6));
      stair.rotation.x = 0.3;
      scene.add(stair);
    }

    // ===== TOMB INTERIOR - BoxGeometry chamber with sarcophagus =====
    var tombChamberGeom = new THREE.BoxGeometry(20, 18, 25);
    var tombMaterial = new THREE.MeshPhongMaterial({
      color: darkStoneColor,
      shininess: 2,
      emissive: 0x0F0D0B
    });

    var tombChamber = new THREE.Mesh(tombChamberGeom, tombMaterial);
    tombChamber.position.set(0, -26, 75);
    tombChamber.receiveShadow = true;
    scene.add(tombChamber);

    // Sarcophagus (BoxGeometry coffin)
    var sarcophagusGeom = new THREE.BoxGeometry(4, 4, 8);
    var sarcophagusMaterial = new THREE.MeshPhongMaterial({
      color: 0x7A6A5A,
      shininess: 5,
      emissive: 0x3D2F25
    });

    var sarcophagus = new THREE.Mesh(sarcophagusGeom, sarcophagusMaterial);
    sarcophagus.position.set(0, -22, 75);
    scene.add(sarcophagus);

    // Tomb wall niches (small BoxGeometry shelves)
    var nicheGeom = new THREE.BoxGeometry(3, 3, 2);
    var nicheMaterial = new THREE.MeshPhongMaterial({
      color: darkStoneColor,
      shininess: 1,
      emissive: 0x0F0D0B
    });

    var niches = [
      [-8, -15, 72], [8, -15, 72], [-8, -20, 90], [8, -20, 90]
    ];
    niches.forEach(function(pos) {
      var niche = new THREE.Mesh(nicheGeom, nicheMaterial);
      niche.position.set(pos[0], pos[1], pos[2]);
      scene.add(niche);
    });

    // ===== SAND PARTICLES - Animated swirling wind effect =====
    var particleCount = 300;
    var particleGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    var particleMaterial = new THREE.MeshBasicMaterial({
      color: dustColor,
      transparent: true,
      opacity: 0.6
    });

    for (var p = 0; p < particleCount; p++) {
      var particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
      particle.position.set(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 100 - 5,
        (Math.random() - 0.5) * 150
      );
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 15
      );
      particle.baseOpacity = 0.3 + Math.random() * 0.4;
      sandParticles.push(particle);
      scene.add(particle);
    }

    // ===== MIRAGE EFFECT - Shimmering transparent BoxGeometry layers =====
    var mirageGeom = new THREE.BoxGeometry(200, 30, 50);
    var mirageMaterial = new THREE.MeshPhongMaterial({
      color: 0x9EB3D9,
      transparent: true,
      opacity: 0.15,
      emissive: 0x6BA3E8
    });

    var mirage = new THREE.Mesh(mirageGeom, mirageMaterial);
    mirage.position.set(0, 5, 200);
    mirage.name = 'mirage';
    scene.add(mirage);

    // ===== LIGHTING =====
    var sunLight = new THREE.DirectionalLight(0xFFEDD5, 1.2);
    sunLight.position.set(80, 60, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -150;
    sunLight.shadow.camera.right = 150;
    sunLight.shadow.camera.top = 150;
    sunLight.shadow.camera.bottom = -150;
    sunLight.shadow.camera.far = 500;
    scene.add(sunLight);

    var ambientLight = new THREE.AmbientLight(0xFFD89B, 0.6);
    scene.add(ambientLight);

    var tombLight = new THREE.PointLight(0x8B7355, 1.2, 40);
    tombLight.position.set(0, -20, 75);
    tombLight.name = 'tombLight';
    scene.add(tombLight);
  };

  var update = function(delta) {
    // ===== ANIMATE SAND PARTICLES - Swirling wind effect =====
    sandParticles.forEach(function(particle) {
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));

      // Wind gust variation
      var windX = Math.sin(windTime + particle.position.y * 0.1) * 0.5;
      particle.velocity.x += windX * delta;
      particle.velocity.y -= 2 * delta;

      // Wrap around screen edges
      if (particle.position.x > 100) particle.position.x = -100;
      if (particle.position.x < -100) particle.position.x = 100;
      if (particle.position.y < -50) {
        particle.position.y = 50;
        particle.velocity.y = (Math.random() - 0.5) * 8;
      }
      if (particle.position.z > 100) particle.position.z = -100;
      if (particle.position.z < -100) particle.position.z = 100;

      // Opacity variation
      particle.material.opacity = particle.baseOpacity + Math.sin(windTime + particle.position.x * 0.05) * 0.2;
    });

    windTime += delta;

    // ===== MIRAGE SHIMMER EFFECT =====
    mirageTime += delta;
    var mirage = scene.getObjectByName('mirage');
    if (mirage) {
      mirage.position.y = 5 + Math.sin(mirageTime * 0.8) * 3;
      mirage.material.opacity = 0.1 + Math.sin(mirageTime * 1.2) * 0.1;
      mirage.material.emissive.setHSL(0.6, 0.7, 0.4 + Math.sin(mirageTime * 0.6) * 0.1);
    }

    // ===== TOMB DARKNESS FLICKER =====
    tombLightFlicker += delta;
    var tombLight = scene.getObjectByName('tombLight');
    if (tombLight) {
      var flicker = 1.0 + Math.sin(tombLightFlicker * 8) * 0.3;
      if (Math.random() > 0.95) {
        flicker += (Math.random() - 0.5) * 0.4;
      }
      tombLight.intensity = Math.max(0.5, flicker);
    }
  };

  var reset = function() {
    mirageTime = 0;
    tombLightFlicker = 0;
    windTime = 0;
    sandParticles.forEach(function(particle) {
      particle.position.set(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 100 - 5,
        (Math.random() - 0.5) * 150
      );
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 15
      );
    });
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
