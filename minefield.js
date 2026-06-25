window.Minefield = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var mineDetector = null;
  var sniperNest = null;
  var civilianGroup = null;
  var minefield = null;
  var explosionParticles = [];
  var tracerRounds = [];
  var helicopterPosition = null;

  var config = {
    mineColor: 0x8B3A3A,
    terrainColor: 0xC8A874,
    safeMarkerColor: 0xFFFFFF,
    dangerColor: 0xFF0000,
    craterColor: 0x4A3A2A,
    sniperColor: 0x4A5C3A,
    disarmedColor: 0x00FF00,
    spawnPoints: {
      entry: { x: -50, y: 0, z: 0 },
      sniperRidge: { x: 40, y: 30, z: -60 },
      mineCluster1: { x: -20, y: 0, z: 20 },
      mineCluster2: { x: 0, y: 0, z: 40 },
      mineCluster3: { x: 20, y: 0, z: 10 },
      extractionZone: { x: 60, y: 0, z: 60 }
    }
  };

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    explosionParticles = [];
    tracerRounds = [];

    createTerrain();
    createMineCasings();
    createSafePathMarkers();
    createDestroyedVehicleWreck();
    createSniperNest();
    createMineDetectorDevice();
    createCraterHoles();
    createBarbedWireBarriers();
    createCivilianGroup();
    createMedKitBoxes();
    createDeactivatedMineCasing();
  }

  function createTerrain() {
    var terrainGeometry = new THREE.BoxGeometry(150, 2, 150);
    var terrainMaterial = new THREE.MeshPhongMaterial({ color: config.terrainColor });
    var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.position.y = -1;
    terrain.receiveShadow = true;
    terrain.castShadow = true;
    scene.add(terrain);
    meshes.push(terrain);

    var grassSection1 = new THREE.BoxGeometry(70, 1, 80);
    var grassMat = new THREE.MeshPhongMaterial({ color: 0xA0B86A });
    var grass1 = new THREE.Mesh(grassSection1, grassMat);
    grass1.position.set(-30, 0.5, 20);
    grass1.receiveShadow = true;
    scene.add(grass1);
    meshes.push(grass1);

    var grassSection2 = new THREE.BoxGeometry(60, 1, 70);
    var grass2 = new THREE.Mesh(grassSection2, grassMat);
    grass2.position.set(30, 0.5, 30);
    grass2.receiveShadow = true;
    scene.add(grass2);
    meshes.push(grass2);
  }

  function createMineCasings() {
    var minePositions = [
      { x: -10, z: 10 },
      { x: -5, z: 15 },
      { x: 5, z: 12 },
      { x: -15, z: 25 },
      { x: 0, z: 30 },
      { x: 10, z: 28 },
      { x: 15, z: 35 },
      { x: -20, z: 20 },
      { x: 25, z: 20 },
      { x: 30, z: 25 }
    ];

    minePositions.forEach(function(pos) {
      var mineGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
      var mineMaterial = new THREE.MeshPhongMaterial({ color: config.mineColor });
      var mine = new THREE.Mesh(mineGeometry, mineMaterial);
      mine.position.set(pos.x, 0.15, pos.z);
      mine.receiveShadow = true;
      mine.castShadow = true;
      scene.add(mine);
      meshes.push(mine);

      var topRing = new THREE.CylinderGeometry(0.85, 0.85, 0.05, 16);
      var ringMaterial = new THREE.MeshPhongMaterial({ color: 0x4A2A2A });
      var ring = new THREE.Mesh(topRing, ringMaterial);
      ring.position.set(pos.x, 0.35, pos.z);
      ring.castShadow = true;
      scene.add(ring);
      meshes.push(ring);
    });
  }

  function createSafePathMarkers() {
    var pathPoints = [
      { x: -45, z: 0 },
      { x: -30, z: 5 },
      { x: -10, z: 3 },
      { x: 10, z: -5 },
      { x: 30, z: 0 },
      { x: 50, z: 10 },
      { x: 65, z: 60 }
    ];

    pathPoints.forEach(function(point) {
      var stakeGeometry = new THREE.BoxGeometry(0.15, 1.2, 0.15);
      var stakeMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
      var stake = new THREE.Mesh(stakeGeometry, stakeMaterial);
      stake.position.set(point.x, 0.6, point.z);
      stake.castShadow = true;
      scene.add(stake);
      meshes.push(stake);

      var tapeGeometry = new THREE.BoxGeometry(0.08, 0.5, 2.5);
      var tapeMaterial = new THREE.MeshPhongMaterial({ color: config.dangerColor });
      var tape = new THREE.Mesh(tapeGeometry, tapeMaterial);
      tape.position.set(point.x + 1.5, 0.8, point.z);
      tape.castShadow = true;
      scene.add(tape);
      meshes.push(tape);
    });
  }

  function createDestroyedVehicleWreck() {
    var hullGeometry = new THREE.BoxGeometry(5, 1.5, 3);
    var hullMaterial = new THREE.MeshPhongMaterial({ color: 0x3A3A3A });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(35, 0.75, -20);
    hull.rotation.z = 0.3;
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    meshes.push(hull);

    var turretGeometry = new THREE.CylinderGeometry(0.8, 1.2, 0.6, 8);
    var turretMaterial = new THREE.MeshPhongMaterial({ color: 0x2A2A2A });
    var turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.set(35, 2.5, -20);
    turret.castShadow = true;
    scene.add(turret);
    meshes.push(turret);

    var gunGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    var gun = new THREE.Mesh(gunGeometry, turretMaterial);
    gun.position.set(36, 3, -18);
    gun.rotation.z = 0.4;
    gun.castShadow = true;
    scene.add(gun);
    meshes.push(gun);

    var debrisGeometry1 = new THREE.BoxGeometry(2, 0.5, 1);
    var debris1 = new THREE.Mesh(debrisGeometry1, hullMaterial);
    debris1.position.set(38, 1.2, -22);
    debris1.rotation.z = 0.8;
    debris1.castShadow = true;
    scene.add(debris1);
    meshes.push(debris1);

    var debrisGeometry2 = new THREE.BoxGeometry(1.5, 0.6, 0.8);
    var debris2 = new THREE.Mesh(debrisGeometry2, hullMaterial);
    debris2.position.set(32, 1.5, -18);
    debris2.rotation.x = 0.5;
    debris2.castShadow = true;
    scene.add(debris2);
    meshes.push(debris2);
  }

  function createSniperNest() {
    var ridgeGeometry = new THREE.BoxGeometry(25, 5, 15);
    var ridgeMaterial = new THREE.MeshPhongMaterial({ color: 0x6B7A4A });
    var ridge = new THREE.Mesh(ridgeGeometry, ridgeMaterial);
    ridge.position.set(40, 2, -60);
    ridge.castShadow = true;
    ridge.receiveShadow = true;
    scene.add(ridge);
    meshes.push(ridge);

    var fortGeometry = new THREE.BoxGeometry(12, 2, 8);
    var fortMaterial = new THREE.MeshPhongMaterial({ color: config.sniperColor });
    var fort = new THREE.Mesh(fortGeometry, fortMaterial);
    fort.position.set(40, 7, -60);
    fort.castShadow = true;
    scene.add(fort);
    meshes.push(fort);

    var gunEmplacementGeometry = new THREE.CylinderGeometry(1, 1.2, 0.3, 8);
    var gunMat = new THREE.MeshPhongMaterial({ color: 0x1A1A1A });
    var gunEm = new THREE.Mesh(gunEmplacementGeometry, gunMat);
    gunEm.position.set(40, 8, -60);
    gunEm.castShadow = true;
    scene.add(gunEm);
    meshes.push(gunEm);

    sniperNest = {
      position: new THREE.Vector3(40, 8, -60),
      firingInterval: 0,
      nextFireTime: 3
    };
  }

  function createMineDetectorDevice() {
    var handleGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
    var handleMaterial = new THREE.MeshPhongMaterial({ color: 0x1A1A1A });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(-55, 1.5, 5);
    handle.castShadow = true;
    scene.add(handle);
    meshes.push(handle);

    var headGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    var headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(-55, 0.3, 5);
    head.castShadow = true;
    scene.add(head);
    meshes.push(head);

    var cableGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8);
    var cableMaterial = new THREE.MeshPhongMaterial({ color: 0x4A4A4A });
    var cable = new THREE.Mesh(cableGeometry, cableMaterial);
    cable.position.set(-55, 2, 5);
    cable.castShadow = true;
    scene.add(cable);
    meshes.push(cable);

    mineDetector = {
      handle: handle,
      head: head,
      position: new THREE.Vector3(-55, 0.3, 5),
      rotation: 0
    };
  }

  function createCraterHoles() {
    var craterPositions = [
      { x: -25, z: 15 },
      { x: 12, z: 5 },
      { x: 40, z: 20 }
    ];

    craterPositions.forEach(function(pos) {
      var craterGeometry = new THREE.BoxGeometry(6, 1.5, 6);
      var craterMaterial = new THREE.MeshPhongMaterial({ color: config.craterColor });
      var crater = new THREE.Mesh(craterGeometry, craterMaterial);
      crater.position.set(pos.x, -0.5, pos.z);
      crater.receiveShadow = true;
      scene.add(crater);
      meshes.push(crater);

      var rimGeometry = new THREE.CylinderGeometry(3.5, 3, 0.3, 32);
      var rimMaterial = new THREE.MeshPhongMaterial({ color: 0x6B5A4A });
      var rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.position.set(pos.x, 0.2, pos.z);
      rim.receiveShadow = true;
      scene.add(rim);
      meshes.push(rim);
    });
  }

  function createBarbedWireBarriers() {
    var wirePoints = [
      new THREE.Vector3(-40, 0.5, 40),
      new THREE.Vector3(-20, 0.5, 50),
      new THREE.Vector3(0, 0.5, 45),
      new THREE.Vector3(20, 0.5, 50)
    ];

    var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 });
    var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wire);
    meshes.push(wire);

    var barbs = [
      new THREE.Vector3(-35, 1.2, 42),
      new THREE.Vector3(-25, 1.2, 48),
      new THREE.Vector3(-5, 1.2, 46),
      new THREE.Vector3(15, 1.2, 49)
    ];

    barbs.forEach(function(pos) {
      var barbGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 4);
      var barbMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
      var barb = new THREE.Mesh(barbGeometry, barbMaterial);
      barb.position.copy(pos);
      barb.castShadow = true;
      scene.add(barb);
      meshes.push(barb);
    });
  }

  function createCivilianGroup() {
    var civilianPositions = [
      { x: -48, z: 2 },
      { x: -50, z: -3 },
      { x: -46, z: -2 }
    ];

    var civilians = [];
    civilianPositions.forEach(function(pos) {
      var headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
      var skinMaterial = new THREE.MeshPhongMaterial({ color: 0xD2691E });
      var head = new THREE.Mesh(headGeometry, skinMaterial);
      head.position.set(pos.x, 1.8, pos.z);
      head.castShadow = true;
      scene.add(head);
      meshes.push(head);

      var bodyGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.4);
      var clothMaterial = new THREE.MeshPhongMaterial({ color: 0x4A5A7A });
      var body = new THREE.Mesh(bodyGeometry, clothMaterial);
      body.position.set(pos.x, 1, pos.z);
      body.castShadow = true;
      scene.add(body);
      meshes.push(body);

      civilians.push({
        head: head,
        body: body,
        position: new THREE.Vector3(pos.x, 1, pos.z),
        pathIndex: 0
      });
    });

    civilianGroup = {
      members: civilians,
      moving: true
    };
  }

  function createMedKitBoxes() {
    var kitPositions = [
      { x: -35, z: 5 },
      { x: 25, z: 35 },
      { x: 55, z: 55 }
    ];

    kitPositions.forEach(function(pos) {
      var kitGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
      var kitMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6347 });
      var kit = new THREE.Mesh(kitGeometry, kitMaterial);
      kit.position.set(pos.x, 0.3, pos.z);
      kit.castShadow = true;
      scene.add(kit);
      meshes.push(kit);

      var crossGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.01);
      var crossMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
      var cross1 = new THREE.Mesh(crossGeometry, crossMaterial);
      cross1.position.set(pos.x, 0.45, pos.z + 0.05);
      scene.add(cross1);
      meshes.push(cross1);

      var cross2 = new THREE.Mesh(crossGeometry, crossMaterial);
      cross2.rotation.z = Math.PI / 2;
      cross2.position.set(pos.x, 0.45, pos.z + 0.05);
      scene.add(cross2);
      meshes.push(cross2);
    });
  }

  function createDeactivatedMineCasing() {
    var safeMineGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
    var safeMaterial = new THREE.MeshPhongMaterial({ color: config.disarmedColor });
    var safeMine = new THREE.Mesh(safeMineGeometry, safeMaterial);
    safeMine.position.set(-5, 0.15, 5);
    safeMine.castShadow = true;
    scene.add(safeMine);
    meshes.push(safeMine);

    var checkmarkGeometry = new THREE.BoxGeometry(0.6, 0.05, 0.01);
    var checkMat = new THREE.MeshPhongMaterial({ color: 0x00AA00 });
    var checkmark = new THREE.Mesh(checkmarkGeometry, checkMat);
    checkmark.position.set(-5, 0.35, 5.1);
    checkmark.rotation.z = 0.3;
    scene.add(checkmark);
    meshes.push(checkmark);
  }

  function createExplosion(position) {
    var burstGeometry = new THREE.SphereGeometry(3, 8, 8);
    var burstMaterial = new THREE.MeshPhongMaterial({
      color: 0xFF6347,
      emissive: 0xFF4500,
      wireframe: true
    });
    var burst = new THREE.Mesh(burstGeometry, burstMaterial);
    burst.position.copy(position);
    burst.castShadow = true;
    scene.add(burst);

    explosionParticles.push({
      mesh: burst,
      startTime: Date.now(),
      duration: 0.5,
      startScale: 1,
      startPosition: position.clone()
    });
  }

  function createTracerRound(from, to) {
    var direction = new THREE.Vector3().subVectors(to, from).normalize();
    var lineGeometry = new THREE.BufferGeometry().setFromPoints([from, to]);
    var lineMaterial = new THREE.LineBasicMaterial({
      color: 0xFFFF00,
      linewidth: 3
    });
    var tracer = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(tracer);

    tracerRounds.push({
      mesh: tracer,
      from: from.clone(),
      to: to.clone(),
      startTime: Date.now(),
      duration: 0.3
    });
  }

  function update(delta) {
    if (!scene || !camera) return;

    if (mineDetector) {
      mineDetector.rotation += delta * 2;
      mineDetector.head.rotation.y = mineDetector.rotation;
      mineDetector.head.rotation.x = Math.sin(mineDetector.rotation * 0.5) * 0.3;
    }

    if (sniperNest) {
      sniperNest.firingInterval += delta;
      if (sniperNest.firingInterval >= sniperNest.nextFireTime) {
        var targetPosition = new THREE.Vector3(
          -40 + Math.random() * 30,
          1,
          5 + Math.random() * 20
        );
        createTracerRound(sniperNest.position, targetPosition);
        sniperNest.firingInterval = 0;
        sniperNest.nextFireTime = 2 + Math.random() * 2;
      }
    }

    if (civilianGroup && civilianGroup.moving) {
      civilianGroup.members.forEach(function(civilian, idx) {
        civilian.pathIndex += delta * 0.08;
        if (civilian.pathIndex > 1) {
          civilian.pathIndex = 0;
        }

        var pathPoints = [
          new THREE.Vector3(-48, 1, 2),
          new THREE.Vector3(-30, 1, 5),
          new THREE.Vector3(-5, 1, 3),
          new THREE.Vector3(20, 1, 0),
          new THREE.Vector3(50, 1, 15),
          new THREE.Vector3(65, 1, 60)
        ];

        var currentIndex = Math.floor(civilian.pathIndex * (pathPoints.length - 1));
        var nextIndex = Math.min(currentIndex + 1, pathPoints.length - 1);
        var t = (civilian.pathIndex * (pathPoints.length - 1)) - currentIndex;

        var newPos = new THREE.Vector3().lerpVectors(
          pathPoints[currentIndex],
          pathPoints[nextIndex],
          t
        );

        civilian.head.position.copy(newPos);
        civilian.head.position.y = 1.8;
        civilian.body.position.copy(newPos);
        civilian.body.position.y = 1;
      });
    }

    var now = Date.now();
    explosionParticles = explosionParticles.filter(function(particle) {
      var elapsed = (now - particle.startTime) / 1000;
      var progress = elapsed / particle.duration;

      if (progress >= 1) {
        scene.remove(particle.mesh);
        return false;
      }

      var scale = particle.startScale * (1 - progress);
      particle.mesh.scale.set(scale, scale, scale);
      particle.mesh.material.opacity = 1 - progress;

      return true;
    });

    tracerRounds = tracerRounds.filter(function(tracer) {
      var elapsed = (now - tracer.startTime) / 1000;
      var progress = elapsed / tracer.duration;

      if (progress >= 1) {
        scene.remove(tracer.mesh);
        return false;
      }

      tracer.mesh.material.opacity = 1 - progress;
      return true;
    });

    if (!helicopterPosition) {
      helicopterPosition = new THREE.Vector3(80, 40, 80);
    } else {
      helicopterPosition.x -= delta * 5;
      helicopterPosition.z -= delta * 8;
    }
  }

  function triggerDetonate(position) {
    createExplosion(position);
    createTracerRound(
      position.clone().add(new THREE.Vector3(0, 2, 0)),
      sniperNest.position.clone()
    );
  }

  function reset() {
    meshes.forEach(function(mesh) {
      scene.remove(mesh);
    });
    meshes = [];

    explosionParticles.forEach(function(particle) {
      scene.remove(particle.mesh);
    });
    explosionParticles = [];

    tracerRounds.forEach(function(tracer) {
      scene.remove(tracer.mesh);
    });
    tracerRounds = [];

    mineDetector = null;
    sniperNest = null;
    civilianGroup = null;
    helicopterPosition = null;

    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset,
    triggerDetonate: triggerDetonate,
    getMeshes: function() { return meshes; },
    getCivilians: function() { return civilianGroup; },
    getSniperNest: function() { return sniperNest; }
  };
}());
