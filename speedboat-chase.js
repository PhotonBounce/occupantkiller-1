window.SpeedboatChase = (function() {
  'use strict';

  var objects = [];
  var scene = null;
  var camera = null;
  var time = 0;
  var playerBoat = null;
  var enemyBoats = [];
  var submarine = null;
  var helicopter = null;
  var oilRig = null;
  var wakeTrails = [];
  var buoys = [];
  var waterTiles = [];
  var gunFire = [];
  var debrisField = [];

  var colors = {
    oceanBlue: 0x1A4A7A,
    boatWhite: 0xEEEEEE,
    subGray: 0x667788,
    wakeFoam: 0xCCDDEE,
    oilRigYellow: 0xFFAA00,
    dangerRed: 0xFF2200,
    black: 0x000000,
    orange: 0xFF6600,
    lightBlue: 0x4488DD
  };

  var spawns = {
    playerX: -50,
    playerY: 5,
    playerZ: 0,
    enemyFormationX: 100,
    enemyFormationZ: 0,
    submarineX: 200,
    submarineY: -20,
    submarineZ: 50,
    oilRigX: 300,
    oilRigY: 0,
    oilRigZ: -150,
    helicopterX: 150,
    helicopterY: 80,
    helicopterZ: -100
  };

  function createWaterSurface() {
    var tileSize = 100;
    var gridCount = 8;
    var startX = -gridCount * tileSize / 2;
    var startZ = -gridCount * tileSize / 2;

    for (var i = 0; i < gridCount; i++) {
      for (var j = 0; j < gridCount; j++) {
        var geometry = new THREE.BoxGeometry(tileSize, 0.5, tileSize);
        var material = new THREE.MeshStandardMaterial({
          color: colors.oceanBlue,
          metalness: 0.6,
          roughness: 0.4
        });
        var tile = new THREE.Mesh(geometry, material);
        tile.position.set(
          startX + i * tileSize + tileSize / 2,
          -0.25,
          startZ + j * tileSize + tileSize / 2
        );
        tile.receiveShadow = true;
        tile.castShadow = true;
        scene.add(tile);
        waterTiles.push({
          mesh: tile,
          baseY: tile.position.y,
          offsetX: i,
          offsetZ: j
        });
        objects.push(tile);
      }
    }
  }

  function createPlayerBoat() {
    var group = new THREE.Group();
    group.position.set(spawns.playerX, spawns.playerY, spawns.playerZ);

    // Hull
    var hullGeometry = new THREE.BoxGeometry(8, 2.5, 16);
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: colors.boatWhite,
      metalness: 0.3,
      roughness: 0.5
    });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    hull.receiveShadow = true;
    hull.position.z = 0;
    group.add(hull);

    // Cockpit
    var cockpitGeometry = new THREE.BoxGeometry(4, 1.5, 3);
    var cockpitMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.5,
      roughness: 0.3
    });
    var cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.castShadow = true;
    cockpit.position.set(0, 2, -3);
    group.add(cockpit);

    // Engine nacelles
    var nacelleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
    var nacelleMaterial = new THREE.MeshStandardMaterial({
      color: colors.dangerRed,
      metalness: 0.8,
      roughness: 0.2
    });
    var nacelleLeft = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    nacelleLeft.castShadow = true;
    nacelleLeft.position.set(-3, 1, 4);
    nacelleLeft.rotation.z = Math.PI / 2;
    group.add(nacelleLeft);

    var nacelleRight = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    nacelleRight.castShadow = true;
    nacelleRight.position.set(3, 1, 4);
    nacelleRight.rotation.z = Math.PI / 2;
    group.add(nacelleRight);

    // Gun turret
    var gunGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
    var gunMaterial = new THREE.MeshStandardMaterial({
      color: colors.black,
      metalness: 0.9,
      roughness: 0.1
    });
    var gunTurret = new THREE.Mesh(gunGeometry, gunMaterial);
    gunTurret.castShadow = true;
    gunTurret.position.set(0, 3, -1);
    gunTurret.rotation.z = Math.PI / 2;
    group.add(gunTurret);

    scene.add(group);
    playerBoat = {
      group: group,
      position: group.position,
      baseY: spawns.playerY,
      velocity: new THREE.Vector3(0, 0, 0),
      targetRotation: 0
    };
    objects.push(group);
    return group;
  }

  function createEnemyBoat(offsetX, offsetZ) {
    var group = new THREE.Group();
    group.position.set(spawns.enemyFormationX + offsetX, 5, spawns.enemyFormationZ + offsetZ);

    // Hull
    var hullGeometry = new THREE.BoxGeometry(6, 2, 12);
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.4,
      roughness: 0.4
    });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Cabin
    var cabinGeometry = new THREE.BoxGeometry(3.5, 1.5, 2.5);
    var cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.3
    });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.castShadow = true;
    cabin.position.set(0, 2, -2);
    group.add(cabin);

    // Engine nacelles
    var nacelleGeometry = new THREE.CylinderGeometry(0.6, 0.6, 3, 8);
    var nacelleMaterial = new THREE.MeshStandardMaterial({
      color: colors.orange,
      metalness: 0.7
    });
    var nacelleLeft = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    nacelleLeft.castShadow = true;
    nacelleLeft.position.set(-2.5, 0.8, 3);
    nacelleLeft.rotation.z = Math.PI / 2;
    group.add(nacelleLeft);

    var nacelleRight = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    nacelleRight.castShadow = true;
    nacelleRight.position.set(2.5, 0.8, 3);
    nacelleRight.rotation.z = Math.PI / 2;
    group.add(nacelleRight);

    // Gunner position
    var gunPositionGeometry = new THREE.BoxGeometry(1, 1, 1);
    var gunPositionMaterial = new THREE.MeshStandardMaterial({
      color: colors.dangerRed,
      metalness: 0.8
    });
    var gunPosition = new THREE.Mesh(gunPositionGeometry, gunPositionMaterial);
    gunPosition.castShadow = true;
    gunPosition.position.set(0, 2.5, -1);
    group.add(gunPosition);

    scene.add(group);
    var enemy = {
      group: group,
      position: group.position,
      baseY: 5,
      velocity: new THREE.Vector3(0, 0, 0),
      angle: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.1
    };
    objects.push(group);
    return enemy;
  }

  function createSubmarine() {
    var group = new THREE.Group();
    group.position.set(spawns.submarineX, spawns.submarineY, spawns.submarineZ);

    // Conning tower
    var towerGeometry = new THREE.CylinderGeometry(2, 2.2, 8, 16);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: colors.subGray,
      metalness: 0.5,
      roughness: 0.4
    });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.castShadow = true;
    tower.receiveShadow = true;
    tower.position.y = 4;
    group.add(tower);

    // Periscope
    var periscopeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    var periscope = new THREE.Mesh(periscopeGeometry, towerMaterial);
    periscope.castShadow = true;
    periscope.position.set(0, 10, 0);
    group.add(periscope);

    // Hull (partially submerged)
    var hullGeometry = new THREE.BoxGeometry(5, 6, 20);
    var hull = new THREE.Mesh(hullGeometry, towerMaterial);
    hull.castShadow = true;
    hull.receiveShadow = true;
    hull.position.y = -2;
    group.add(hull);

    scene.add(group);
    submarine = {
      group: group,
      position: group.position,
      baseY: spawns.submarineY,
      surfaceProgress: 0,
      maxSurfaceY: 2
    };
    objects.push(group);
    return group;
  }

  function createOilRig() {
    var group = new THREE.Group();
    group.position.set(spawns.oilRigX, spawns.oilRigY, spawns.oilRigZ);

    // Platform
    var platformGeometry = new THREE.BoxGeometry(30, 2, 30);
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: colors.oilRigYellow,
      metalness: 0.6,
      roughness: 0.5
    });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.castShadow = true;
    platform.receiveShadow = true;
    platform.position.y = 1;
    group.add(platform);

    // Support legs
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var legGeometry = new THREE.CylinderGeometry(1, 1.2, 40, 12);
      var legMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCC00,
        metalness: 0.7,
        roughness: 0.4
      });
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.castShadow = true;
      leg.receiveShadow = true;
      var offsetX = Math.cos(angle) * 12;
      var offsetZ = Math.sin(angle) * 12;
      leg.position.set(offsetX, -18, offsetZ);
      group.add(leg);
    }

    // Derrick tower
    var derrickGeometry = new THREE.BoxGeometry(1, 50, 1);
    var derrickMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAAAAA,
      metalness: 0.8,
      roughness: 0.3
    });
    var derrick = new THREE.Mesh(derrickGeometry, derrickMaterial);
    derrick.castShadow = true;
    derrick.position.set(0, 28, 0);
    group.add(derrick);

    // Flare stack
    var flareGeometry = new THREE.CylinderGeometry(1.5, 1.5, 35, 12);
    var flareMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF8844,
      emissive: 0xFF4400,
      metalness: 0.6,
      roughness: 0.4
    });
    var flare = new THREE.Mesh(flareGeometry, flareMaterial);
    flare.castShadow = true;
    flare.position.set(8, 25, 8);
    group.add(flare);

    scene.add(group);
    oilRig = {
      group: group,
      flare: flare,
      flareIntensity: 0
    };
    objects.push(group);
    return group;
  }

  function createHelicopter() {
    var group = new THREE.Group();
    group.position.set(spawns.helicopterX, spawns.helicopterY, spawns.helicopterZ);

    // Fuselage
    var fuselageGeometry = new THREE.BoxGeometry(2, 2, 8);
    var fuselageMaterial = new THREE.MeshStandardMaterial({
      color: 0x004422,
      metalness: 0.5,
      roughness: 0.4
    });
    var fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    group.add(fuselage);

    // Cockpit
    var cockpitGeometry = new THREE.SphereGeometry(1.2, 8, 6);
    var cockpitMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.2
    });
    var cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.castShadow = true;
    cockpit.position.set(0, 2, -2);
    group.add(cockpit);

    // Rotor mast
    var mastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    var mastMaterial = new THREE.MeshStandardMaterial({
      color: colors.black,
      metalness: 0.9
    });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.castShadow = true;
    mast.position.y = 3;
    group.add(mast);

    // Rotor blades
    var bladeGeometry = new THREE.BoxGeometry(16, 0.2, 1);
    var bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.3
    });
    var rotor = new THREE.Group();
    for (var b = 0; b < 2; b++) {
      var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.castShadow = true;
      blade.rotation.z = (b / 2) * Math.PI;
      rotor.add(blade);
    }
    rotor.position.y = 3;
    group.add(rotor);

    // Tail boom
    var boomGeometry = new THREE.BoxGeometry(0.8, 0.8, 6);
    var boom = new THREE.Mesh(boomGeometry, fuselageMaterial);
    boom.castShadow = true;
    boom.position.set(0, 0.5, 5);
    group.add(boom);

    // Tail rotor
    var tailRotorGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 8);
    var tailRotor = new THREE.Mesh(tailRotorGeometry, bladeMaterial);
    tailRotor.castShadow = true;
    tailRotor.position.set(0.8, 1, 10);
    group.add(tailRotor);

    scene.add(group);
    helicopter = {
      group: group,
      rotor: rotor,
      rotorSpeed: 0.3,
      angle: 0,
      radius: 80,
      centerX: spawns.helicopterX,
      centerZ: spawns.helicopterZ
    };
    objects.push(group);
    return group;
  }

  function createNavigationBuoys() {
    var positions = [
      { x: 50, z: -80 },
      { x: 120, z: 100 },
      { x: 200, z: -120 },
      { x: 280, z: 80 }
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();
      group.position.set(pos.x, 3, pos.z);

      // Buoy sphere
      var sphereGeometry = new THREE.SphereGeometry(1.5, 12, 12);
      var sphereMaterial = new THREE.MeshStandardMaterial({
        color: colors.dangerRed,
        metalness: 0.6,
        roughness: 0.4
      });
      var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.castShadow = true;
      group.add(sphere);

      // Post
      var postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
      var postMaterial = new THREE.MeshStandardMaterial({
        color: colors.orange,
        metalness: 0.8
      });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.castShadow = true;
      post.position.y = -4;
      group.add(post);

      scene.add(group);
      buoys.push({
        group: group,
        baseY: 3,
        bobPhase: Math.random() * Math.PI * 2
      });
      objects.push(group);
    });
  }

  function createDebrisField() {
    for (var i = 0; i < 12; i++) {
      var debrisGeometry = new THREE.BoxGeometry(
        0.5 + Math.random() * 1,
        0.3 + Math.random() * 0.5,
        0.8 + Math.random() * 1.2
      );
      var debrisMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555 + Math.floor(Math.random() * 0x333333),
        metalness: 0.6,
        roughness: 0.5
      });
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.castShadow = true;
      debris.receiveShadow = true;
      debris.position.set(
        -30 + Math.random() * 60,
        1,
        -80 + Math.random() * 160
      );
      debris.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      scene.add(debris);
      debrisField.push({
        mesh: debris,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        )
      });
      objects.push(debris);
    }
  }

  function createWakeTrails() {
    var trailPoints = [];
    for (var i = 0; i < 8; i++) {
      trailPoints.push(new THREE.Vector3(0, 0.5, -i * 2));
    }
    var geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
    var material = new THREE.LineBasicMaterial({
      color: colors.wakeFoam,
      linewidth: 2
    });
    var wake = new THREE.LineSegments(geometry, material);
    scene.add(wake);
    wakeTrails.push({
      line: wake,
      points: trailPoints,
      offset: 0
    });
  }

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    enemyBoats = [];
    wakeTrails = [];
    buoys = [];
    waterTiles = [];
    gunFire = [];
    debrisField = [];
    time = 0;

    createWaterSurface();
    createPlayerBoat();

    for (var i = 0; i < 4; i++) {
      var offsetX = (i % 2) * 8 - 4;
      var offsetZ = Math.floor(i / 2) * 12;
      var enemy = createEnemyBoat(offsetX, offsetZ);
      enemyBoats.push(enemy);
    }

    createSubmarine();
    createOilRig();
    createHelicopter();
    createNavigationBuoys();
    createDebrisField();

    for (var t = 0; t < 2; t++) {
      createWakeTrails();
    }
  };

  var update = function(delta) {
    time += delta;

    // Update water tiles with wave animation
    waterTiles.forEach(function(tile) {
      var waveX = Math.sin((time + tile.offsetX * 0.5) * 0.7) * 0.3;
      var waveZ = Math.cos((time + tile.offsetZ * 0.5) * 0.7) * 0.3;
      tile.mesh.position.y = tile.baseY + waveX + waveZ;
      tile.mesh.rotation.z = Math.sin(time * 0.5) * 0.02;
    });

    // Update player boat bobbing
    if (playerBoat) {
      var bobAmount = Math.sin(time * 1.2) * 0.4;
      playerBoat.group.position.y = playerBoat.baseY + bobAmount;
      playerBoat.group.rotation.z = Math.sin(time * 0.8) * 0.05;
      playerBoat.group.rotation.x = Math.cos(time * 0.9) * 0.04;
    }

    // Update enemy boats with evasive weaving
    enemyBoats.forEach(function(enemy, index) {
      enemy.angle += delta * enemy.speed;
      var wavePattern = Math.sin(enemy.angle * 2) * 15;
      enemy.group.position.x = spawns.enemyFormationX + index * 10 + wavePattern;
      enemy.group.position.y = enemy.baseY + Math.sin(time * 1.1 + index) * 0.5;
      enemy.group.position.z = spawns.enemyFormationZ + Math.cos(enemy.angle) * 20;
      enemy.group.rotation.y = enemy.angle;
      enemy.group.rotation.x = Math.sin(time * 0.7 + index) * 0.06;
    });

    // Update submarine surfacing
    if (submarine) {
      submarine.surfaceProgress = (Math.sin(time * 0.3) + 1) * 0.5;
      submarine.group.position.y = submarine.baseY + submarine.surfaceProgress * submarine.maxSurfaceY;
      submarine.group.rotation.x = Math.sin(time * 0.4) * 0.03;
    }

    // Update helicopter circling
    if (helicopter) {
      helicopter.angle += delta * 0.3;
      helicopter.group.position.x = helicopter.centerX + Math.cos(helicopter.angle) * helicopter.radius;
      helicopter.group.position.z = helicopter.centerZ + Math.sin(helicopter.angle) * helicopter.radius;
      helicopter.group.position.y = spawns.helicopterY + Math.sin(time * 0.6) * 5;
      helicopter.group.rotation.y = helicopter.angle + Math.PI / 2;
      helicopter.rotor.rotation.z += helicopter.rotorSpeed;
    }

    // Update buoys rocking
    buoys.forEach(function(buoy) {
      var bobAmount = Math.sin(time * 1.3 + buoy.bobPhase) * 0.6;
      buoy.group.position.y = buoy.baseY + bobAmount;
      buoy.group.rotation.x = Math.sin(time * 0.8 + buoy.bobPhase) * 0.08;
      buoy.group.rotation.z = Math.cos(time * 0.7 + buoy.bobPhase) * 0.08;
    });

    // Update debris spinning
    debrisField.forEach(function(debris) {
      debris.mesh.rotation.x += debris.rotationSpeed.x;
      debris.mesh.rotation.y += debris.rotationSpeed.y;
      debris.mesh.rotation.z += debris.rotationSpeed.z;
      debris.mesh.position.y = 1 + Math.sin(time * 0.5 + debris.mesh.position.x * 0.1) * 0.3;
    });

    // Update wake trails
    wakeTrails.forEach(function(wake, idx) {
      wake.offset += delta * 3;
      if (playerBoat) {
        var baseZ = playerBoat.group.position.z;
        for (var i = 0; i < wake.points.length; i++) {
          wake.points[i].x = (idx === 0 ? -1.5 : 1.5) + Math.sin(time * 0.8 + i) * 0.5;
          wake.points[i].z = baseZ - i * 2.5 - wake.offset % 50;
          wake.points[i].y = 0.3 + Math.sin((time * 0.9 + i * 0.5)) * 0.15;
        }
        wake.line.geometry.setFromPoints(wake.points);
      }
    });

    // Update oil rig flare burning
    if (oilRig) {
      oilRig.flareIntensity = 0.7 + Math.sin(time * 2.5) * 0.3;
      oilRig.flare.material.emissiveIntensity = oilRig.flareIntensity;
    }

    // Simulate gunfire tracers (simple rising particles)
    for (var g = gunFire.length - 1; g >= 0; g--) {
      gunFire[g].position.y += delta * 30;
      gunFire[g].position.x += (Math.random() - 0.5) * 0.5;
      gunFire[g].position.z += (Math.random() - 0.5) * 0.5;
      if (gunFire[g].position.y > 50) {
        scene.remove(gunFire[g]);
        gunFire.splice(g, 1);
      }
    }
  };

  var reset = function() {
    objects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    });

    wakeTrails.forEach(function(trail) {
      if (trail.line.geometry) {
        trail.line.geometry.dispose();
      }
      if (trail.line.material) {
        trail.line.material.dispose();
      }
      if (trail.line.parent) {
        trail.line.parent.remove(trail.line);
      }
    });

    gunFire.forEach(function(tracer) {
      if (tracer.geometry) {
        tracer.geometry.dispose();
      }
      if (tracer.material) {
        tracer.material.dispose();
      }
      if (tracer.parent) {
        tracer.parent.remove(tracer);
      }
    });

    objects = [];
    enemyBoats = [];
    submarine = null;
    helicopter = null;
    oilRig = null;
    playerBoat = null;
    wakeTrails = [];
    buoys = [];
    waterTiles = [];
    gunFire = [];
    debrisField = [];
    time = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
