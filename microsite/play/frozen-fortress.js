window.FrozenFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var fortressObjects = [];
  var blizzardParticles = [];
  var icicles = [];
  var heatVents = [];
  var time = 0;

  function createIceWalls() {
    var walls = [];

    var wallGeometry = new THREE.BoxGeometry(60, 20, 2);
    var stoneGray = 0x3a3a3a;
    var stoneMaterial = new THREE.MeshStandardMaterial({ color: stoneGray, roughness: 0.8 });

    var northWall = new THREE.Mesh(wallGeometry, stoneMaterial);
    northWall.position.set(0, 10, -40);
    scene.add(northWall);
    walls.push(northWall);

    var southWall = new THREE.Mesh(wallGeometry, stoneMaterial);
    southWall.position.set(0, 10, 40);
    scene.add(southWall);
    walls.push(southWall);

    var wallGeometryEW = new THREE.BoxGeometry(2, 20, 60);
    var eastWall = new THREE.Mesh(wallGeometryEW, stoneMaterial);
    eastWall.position.set(40, 10, 0);
    scene.add(eastWall);
    walls.push(eastWall);

    var westWall = new THREE.Mesh(wallGeometryEW, stoneMaterial);
    westWall.position.set(-40, 10, 0);
    scene.add(westWall);
    walls.push(westWall);

    var iceBlue = 0x4da6ff;
    var iceTransparent = new THREE.MeshPhysicalMaterial({
      color: iceBlue,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 0.8
    });

    var iceCoatingN = new THREE.Mesh(new THREE.BoxGeometry(61, 21, 2.5), iceTransparent);
    iceCoatingN.position.set(0, 10.1, -40);
    scene.add(iceCoatingN);
    walls.push(iceCoatingN);

    var iceCoatingS = new THREE.Mesh(new THREE.BoxGeometry(61, 21, 2.5), iceTransparent);
    iceCoatingS.position.set(0, 10.1, 40);
    scene.add(iceCoatingS);
    walls.push(iceCoatingS);

    var iceCoatingE = new THREE.Mesh(new THREE.BoxGeometry(2.5, 21, 61), iceTransparent);
    iceCoatingE.position.set(40, 10.1, 0);
    scene.add(iceCoatingE);
    walls.push(iceCoatingE);

    var iceCoatingW = new THREE.Mesh(new THREE.BoxGeometry(2.5, 21, 61), iceTransparent);
    iceCoatingW.position.set(-40, 10.1, 0);
    scene.add(iceCoatingW);
    walls.push(iceCoatingW);

    return walls;
  }

  function createFrozenGate() {
    var gates = [];

    var gateFrameL = new THREE.Mesh(
      new THREE.BoxGeometry(8, 18, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 })
    );
    gateFrameL.position.set(-6, 10, -40.5);
    scene.add(gateFrameL);
    gates.push(gateFrameL);

    var gateFrameR = new THREE.Mesh(
      new THREE.BoxGeometry(8, 18, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 })
    );
    gateFrameR.position.set(6, 10, -40.5);
    scene.add(gateFrameR);
    gates.push(gateFrameR);

    var gateTop = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 })
    );
    gateTop.position.set(0, 19, -40.5);
    scene.add(gateTop);
    gates.push(gateTop);

    var iceGateMat = new THREE.MeshPhysicalMaterial({
      color: 0x6eb3ff,
      transparent: true,
      opacity: 0.7,
      roughness: 0.15,
      clearcoat: 0.9
    });

    var iceFormation1 = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 2), iceGateMat);
    iceFormation1.position.set(-4, 8, -40.8);
    iceFormation1.rotation.z = 0.3;
    scene.add(iceFormation1);
    gates.push(iceFormation1);

    var iceFormation2 = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 2), iceGateMat);
    iceFormation2.position.set(4, 8, -40.8);
    iceFormation2.rotation.z = -0.3;
    scene.add(iceFormation2);
    gates.push(iceFormation2);

    var iceFormation3 = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 2), iceGateMat);
    iceFormation3.position.set(0, 14, -40.8);
    scene.add(iceFormation3);
    gates.push(iceFormation3);

    var iceFormation4 = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 2), iceGateMat);
    iceFormation4.position.set(0, 5, -40.8);
    scene.add(iceFormation4);
    gates.push(iceFormation4);

    return gates;
  }

  function createIceTowers() {
    var towers = [];

    var positions = [
      { x: -35, z: -35 },
      { x: 35, z: -35 },
      { x: -35, z: 35 },
      { x: 35, z: 35 }
    ];

    positions.forEach(function(pos) {
      var towerCore = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 5, 22, 8),
        new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.85 })
      );
      towerCore.position.set(pos.x, 11, pos.z);
      scene.add(towerCore);
      towers.push(towerCore);

      var iceShell1 = new THREE.Mesh(
        new THREE.CylinderGeometry(4.5, 5.5, 23, 8),
        new THREE.MeshPhysicalMaterial({
          color: 0x5eb3ff,
          transparent: true,
          opacity: 0.5,
          roughness: 0.2,
          clearcoat: 0.7
        })
      );
      iceShell1.position.set(pos.x, 11.2, pos.z);
      scene.add(iceShell1);
      towers.push(iceShell1);

      var iceShell2 = new THREE.Mesh(
        new THREE.CylinderGeometry(5.2, 6, 24, 8),
        new THREE.MeshPhysicalMaterial({
          color: 0x7ed9ff,
          transparent: true,
          opacity: 0.3,
          roughness: 0.3,
          clearcoat: 0.6
        })
      );
      iceShell2.position.set(pos.x, 11.4, pos.z);
      scene.add(iceShell2);
      towers.push(iceShell2);

      var spire = new THREE.Mesh(
        new THREE.ConeGeometry(2.5, 8, 8),
        new THREE.MeshPhysicalMaterial({
          color: 0x4db3ff,
          transparent: true,
          opacity: 0.6,
          roughness: 0.25,
          clearcoat: 0.8
        })
      );
      spire.position.set(pos.x, 23, pos.z);
      scene.add(spire);
      towers.push(spire);

      var spireTip = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x6eb3ff, emissiveIntensity: 0.3 })
      );
      spireTip.position.set(pos.x, 27, pos.z);
      scene.add(spireTip);
      towers.push(spireTip);
    });

    return towers;
  }

  function createSnowdriftWalls() {
    var drifts = [];

    var positions = [
      { x: -42, z: 0 },
      { x: 42, z: 0 },
      { x: 0, z: -42 },
      { x: 0, z: 42 },
      { x: -30, z: -30 },
      { x: 30, z: -30 },
      { x: -30, z: 30 },
      { x: 30, z: 30 }
    ];

    var snowMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0ff,
      roughness: 0.9,
      metalness: 0
    });

    positions.forEach(function(pos) {
      var drift = new THREE.Mesh(
        new THREE.BoxGeometry(6, 12, 3),
        snowMaterial
      );
      drift.position.set(pos.x, 6, pos.z);
      drift.rotation.z = (Math.random() - 0.5) * 0.3;
      scene.add(drift);
      drifts.push(drift);
    });

    return drifts;
  }

  function createFrozenMoat() {
    var moatParts = [];

    var moatNorth = new THREE.Mesh(
      new THREE.BoxGeometry(70, 1.5, 4),
      new THREE.MeshStandardMaterial({ color: 0xd0d0e8, roughness: 0.3 })
    );
    moatNorth.position.set(0, 0.75, -44);
    scene.add(moatNorth);
    moatParts.push(moatNorth);

    var moatSouth = new THREE.Mesh(
      new THREE.BoxGeometry(70, 1.5, 4),
      new THREE.MeshStandardMaterial({ color: 0xd0d0e8, roughness: 0.3 })
    );
    moatSouth.position.set(0, 0.75, 44);
    scene.add(moatSouth);
    moatParts.push(moatSouth);

    var moatEast = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.5, 62),
      new THREE.MeshStandardMaterial({ color: 0xd0d0e8, roughness: 0.3 })
    );
    moatEast.position.set(44, 0.75, 0);
    scene.add(moatEast);
    moatParts.push(moatEast);

    var moatWest = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.5, 62),
      new THREE.MeshStandardMaterial({ color: 0xd0d0e8, roughness: 0.3 })
    );
    moatWest.position.set(-44, 0.75, 0);
    scene.add(moatWest);
    moatParts.push(moatWest);

    for (var i = 0; i < 12; i++) {
      var iceChunk = new THREE.Mesh(
        new THREE.BoxGeometry(
          2 + Math.random() * 2,
          0.8 + Math.random() * 1,
          2 + Math.random() * 2
        ),
        new THREE.MeshPhysicalMaterial({
          color: 0xb0d0ff,
          transparent: true,
          opacity: 0.6,
          roughness: 0.2
        })
      );
      iceChunk.position.set(
        (Math.random() - 0.5) * 50,
        1.5,
        (Math.random() - 0.5) * 50
      );
      iceChunk.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(iceChunk);
      moatParts.push(iceChunk);
    }

    return moatParts;
  }

  function createCryoWeaponEmplacements() {
    var emplacements = [];

    var positions = [
      { x: -32, z: -32 },
      { x: 32, z: -32 },
      { x: -32, z: 32 },
      { x: 32, z: 32 },
      { x: -20, z: 0 },
      { x: 20, z: 0 },
      { x: 0, z: -20 },
      { x: 0, z: 20 }
    ];

    var bunkerMaterial = new THREE.MeshStandardMaterial({ color: 0x505050, roughness: 0.85 });

    positions.forEach(function(pos) {
      var bunker = new THREE.Mesh(
        new THREE.BoxGeometry(5, 3, 5),
        bunkerMaterial
      );
      bunker.position.set(pos.x, 1.5, pos.z);
      scene.add(bunker);
      emplacements.push(bunker);

      var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x282828, roughness: 0.9 });
      var barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 6, 8),
        barrelMaterial
      );
      barrel.position.set(pos.x, 3.5, pos.z);
      barrel.rotation.x = 0.4;
      scene.add(barrel);
      emplacements.push(barrel);

      var iceBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.75, 6.5, 8),
        new THREE.MeshPhysicalMaterial({
          color: 0x7eb3ff,
          transparent: true,
          opacity: 0.4,
          roughness: 0.2
        })
      );
      iceBarrel.position.set(pos.x, 3.5, pos.z);
      iceBarrel.rotation.x = 0.4;
      scene.add(iceBarrel);
      emplacements.push(iceBarrel);
    });

    return emplacements;
  }

  function createIcicleFormations() {
    var icicleList = [];

    var roofPoints = [
      { x: -30, z: -30 },
      { x: -10, z: -35 },
      { x: 10, z: -35 },
      { x: 30, z: -30 },
      { x: 35, z: -10 },
      { x: 35, z: 10 },
      { x: 30, z: 30 },
      { x: 10, z: 35 },
      { x: -10, z: 35 },
      { x: -30, z: 30 },
      { x: -35, z: 10 },
      { x: -35, z: -10 }
    ];

    var icicleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x9dd9ff,
      transparent: true,
      opacity: 0.7,
      roughness: 0.15,
      clearcoat: 0.9
    });

    roofPoints.forEach(function(point) {
      for (var i = 0; i < 4; i++) {
        var icicle = new THREE.Mesh(
          new THREE.ConeGeometry(0.3 + Math.random() * 0.2, 3 + Math.random() * 1.5, 6),
          icicleMaterial
        );
        var xOffset = (Math.random() - 0.5) * 3;
        var zOffset = (Math.random() - 0.5) * 3;
        icicle.position.set(point.x + xOffset, 20 - Math.random() * 2, point.z + zOffset);
        icicle.rotation.x = Math.PI;
        scene.add(icicle);
        icicleList.push({
          mesh: icicle,
          baseY: icicle.position.y,
          phase: Math.random() * Math.PI * 2
        });
      }
    });

    return icicleList;
  }

  function createFrozenSoldiers() {
    var soldiers = [];

    var positions = [
      { x: -25, z: -25 },
      { x: 25, z: -25 },
      { x: -25, z: 25 },
      { x: 25, z: 25 },
      { x: -15, z: 0 },
      { x: 15, z: 0 },
      { x: 0, z: -15 },
      { x: 0, z: 15 },
      { x: -8, z: -8 },
      { x: 8, z: -8 },
      { x: -8, z: 8 },
      { x: 8, z: 8 }
    ];

    var stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x505050, roughness: 0.8 });
    var iceMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x5eb3ff,
      transparent: true,
      opacity: 0.5,
      roughness: 0.2
    });

    positions.forEach(function(pos) {
      var torso = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 1), stoneMaterial);
      torso.position.set(pos.x, 2.5, pos.z);
      scene.add(torso);
      soldiers.push(torso);

      var head = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 1), stoneMaterial);
      head.position.set(pos.x, 4.8, pos.z);
      scene.add(head);
      soldiers.push(head);

      var legL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2, 0.6), stoneMaterial);
      legL.position.set(pos.x - 0.5, 1, pos.z);
      scene.add(legL);
      soldiers.push(legL);

      var legR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2, 0.6), stoneMaterial);
      legR.position.set(pos.x + 0.5, 1, pos.z);
      scene.add(legR);
      soldiers.push(legR);

      var armL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.5, 0.4), stoneMaterial);
      armL.position.set(pos.x - 1.2, 2.5, pos.z);
      scene.add(armL);
      soldiers.push(armL);

      var armR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.5, 0.4), stoneMaterial);
      armR.position.set(pos.x + 1.2, 2.5, pos.z);
      scene.add(armR);
      soldiers.push(armR);

      var iceCoat = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 1.5), iceMaterial);
      iceCoat.position.set(pos.x, 2.8, pos.z);
      scene.add(iceCoat);
      soldiers.push(iceCoat);
    });

    return soldiers;
  }

  function createHeatVents() {
    var vents = [];

    var ventPositions = [
      { x: -20, z: 20 },
      { x: 20, z: -20 },
      { x: -10, z: -10 },
      { x: 10, z: 10 }
    ];

    var pipeColor = 0x606060;
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: pipeColor, roughness: 0.7 });

    ventPositions.forEach(function(pos) {
      var pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 5, 8),
        pipeMaterial
      );
      pipe.position.set(pos.x, 2.5, pos.z);
      scene.add(pipe);
      vents.push({
        pipe: pipe,
        light: null,
        phase: Math.random() * Math.PI * 2,
        position: pos
      });

      var glow = new THREE.Light();
      var pointLight = new THREE.PointLight(0xff9900, 0.8, 15);
      pointLight.position.set(pos.x, 4, pos.z);
      scene.add(pointLight);
      vents[vents.length - 1].light = pointLight;
    });

    return vents;
  }

  function createSupplyCaches() {
    var caches = [];

    var cachePositions = [
      { x: -25, z: 0 },
      { x: 25, z: 0 },
      { x: 0, z: -25 },
      { x: 0, z: 25 },
      { x: -18, z: -18 },
      { x: 18, z: -18 },
      { x: -18, z: 18 },
      { x: 18, z: 18 }
    ];

    var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
    var handleMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.7 });

    cachePositions.forEach(function(pos) {
      var crate = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        crateMaterial
      );
      crate.position.set(pos.x, 2, pos.z);
      scene.add(crate);
      caches.push(crate);

      var snowCover = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.5, 3.2),
        new THREE.MeshStandardMaterial({ color: 0xf5f5ff, roughness: 0.85 })
      );
      snowCover.position.set(pos.x, 3.8, pos.z);
      scene.add(snowCover);
      caches.push(snowCover);

      var handleL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 2, 6),
        handleMaterial
      );
      handleL.position.set(pos.x - 1.2, 3.5, pos.z);
      handleL.rotation.z = Math.PI / 2;
      scene.add(handleL);
      caches.push(handleL);

      var handleR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 2, 6),
        handleMaterial
      );
      handleR.position.set(pos.x + 1.2, 3.5, pos.z);
      handleR.rotation.z = Math.PI / 2;
      scene.add(handleR);
      caches.push(handleR);
    });

    return caches;
  }

  function createPerimeterStakes() {
    var stakes = [];

    var stakePositions = [];
    var radius = 45;
    var stakeCount = 24;

    for (var i = 0; i < stakeCount; i++) {
      var angle = (i / stakeCount) * Math.PI * 2;
      stakePositions.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius
      });
    }

    var stakeMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.8 });

    stakePositions.forEach(function(pos) {
      var stake = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 8, 6),
        stakeMaterial
      );
      stake.position.set(pos.x, 4, pos.z);
      scene.add(stake);
      stakes.push(stake);
    });

    for (var i = 0; i < stakePositions.length; i++) {
      var nextI = (i + 1) % stakePositions.length;
      var pos1 = stakePositions[i];
      var pos2 = stakePositions[nextI];

      var wireGeometry = new THREE.BufferGeometry();
      var positions = new Float32Array([
        pos1.x, 5, pos1.z,
        pos2.x, 5, pos2.z
      ]);
      wireGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      var wiresMaterial = new THREE.LineBasicMaterial({ color: 0x4a4a4a, linewidth: 1 });
      var wires = new THREE.LineSegments(wireGeometry, wiresMaterial);
      scene.add(wires);
      stakes.push(wires);
    }

    return stakes;
  }

  function createBlizzardParticles() {
    var particles = [];

    var snowMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      roughness: 0.6
    });

    for (var i = 0; i < 150; i++) {
      var flake = new THREE.Mesh(
        new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 4, 4),
        snowMaterial
      );

      flake.position.set(
        (Math.random() - 0.5) * 90,
        Math.random() * 35 + 5,
        (Math.random() - 0.5) * 90
      );

      flake.scale.set(
        0.8 + Math.random() * 0.4,
        0.6 + Math.random() * 0.3,
        0.8 + Math.random() * 0.4
      );

      scene.add(flake);

      particles.push({
        mesh: flake,
        baseX: flake.position.x,
        baseY: flake.position.y,
        baseZ: flake.position.z,
        driftX: (Math.random() - 0.5) * 0.015,
        driftZ: (Math.random() - 0.5) * 0.015,
        fallSpeed: 0.005 + Math.random() * 0.005,
        phase: Math.random() * Math.PI * 2,
        swirl: Math.random() * 0.02
      });
    }

    return particles;
  }

  function init(sceneIn, cameraIn) {
    scene = sceneIn;
    camera = cameraIn;
    time = 0;

    fortressObjects = [];
    blizzardParticles = [];
    icicles = [];
    heatVents = [];

    fortressObjects = fortressObjects.concat(createIceWalls());
    fortressObjects = fortressObjects.concat(createFrozenGate());
    fortressObjects = fortressObjects.concat(createIceTowers());
    fortressObjects = fortressObjects.concat(createSnowdriftWalls());
    fortressObjects = fortressObjects.concat(createFrozenMoat());
    fortressObjects = fortressObjects.concat(createCryoWeaponEmplacements());
    icicles = createIcicleFormations();
    fortressObjects = fortressObjects.concat(createFrozenSoldiers());
    heatVents = createHeatVents();
    fortressObjects = fortressObjects.concat(createSupplyCaches());
    fortressObjects = fortressObjects.concat(createPerimeterStakes());
    blizzardParticles = createBlizzardParticles();

    var totalObjects = fortressObjects.length + icicles.length + blizzardParticles.length + heatVents.length;
  }

  function update(delta) {
    time += delta;

    blizzardParticles.forEach(function(particle) {
      particle.mesh.position.x = particle.baseX + Math.sin(time * particle.driftX + particle.phase) * 8;
      particle.mesh.position.z = particle.baseZ + Math.cos(time * particle.driftZ + particle.phase) * 8;
      particle.mesh.position.y = particle.baseY - (time * particle.fallSpeed) % (particle.baseY + 5);

      if (particle.mesh.position.y < 0) {
        particle.mesh.position.y = particle.baseY + 30;
      }

      particle.mesh.rotation.x += particle.driftX * 2;
      particle.mesh.rotation.y += particle.driftZ * 2;
    });

    icicles.forEach(function(icicle) {
      icicle.mesh.position.y = icicle.baseY + Math.sin(time * 0.3 + icicle.phase) * 0.2;
      icicle.mesh.rotation.z = Math.sin(time * 0.2 + icicle.phase) * 0.05;
    });

    heatVents.forEach(function(vent) {
      if (vent.light) {
        var intensity = 0.5 + Math.sin(time * 2 + vent.phase) * 0.3;
        vent.light.intensity = intensity;
      }
    });
  }

  function reset() {
    blizzardParticles.forEach(function(particle) {
      scene.remove(particle.mesh);
    });

    icicles.forEach(function(icicle) {
      scene.remove(icicle.mesh);
    });

    heatVents.forEach(function(vent) {
      if (vent.light) {
        scene.remove(vent.light);
      }
    });

    fortressObjects.forEach(function(obj) {
      scene.remove(obj);
    });

    fortressObjects = [];
    blizzardParticles = [];
    icicles = [];
    heatVents = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
