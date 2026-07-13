window.SnowFortress = (function() {
  'use strict';

  var scene;
  var camera;
  var allObjects = [];
  var snowParticles = [];
  var smokePuffs = [];
  var searchLights = [];
  var heliBlade;

  function createMaterial(color, opacity) {
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.8,
      opacity: opacity || 1,
      transparent: opacity < 1
    });
    return mat;
  }

  function addToScene(obj) {
    scene.add(obj);
    allObjects.push(obj);
    return obj;
  }

  function createPerimeterWalls() {
    var wallMaterial = createMaterial(0x888888);
    var snowMaterial = createMaterial(0xf0f5ff);

    var wallHeight = 8;
    var wallThickness = 1;
    var fortressSize = 70;

    var corners = [
      [-fortressSize / 2, -fortressSize / 2],
      [fortressSize / 2, -fortressSize / 2],
      [fortressSize / 2, fortressSize / 2],
      [-fortressSize / 2, fortressSize / 2]
    ];

    for (var i = 0; i < corners.length; i++) {
      var c1 = corners[i];
      var c2 = corners[(i + 1) % corners.length];
      var midX = (c1[0] + c2[0]) / 2;
      var midZ = (c1[1] + c2[1]) / 2;
      var dist = Math.sqrt(Math.pow(c2[0] - c1[0], 2) + Math.pow(c2[1] - c1[1], 2));

      var wallGeom = new THREE.BoxGeometry(dist, wallHeight, wallThickness);
      var wall = new THREE.Mesh(wallGeom, wallMaterial);
      wall.position.set(midX, wallHeight / 2, midZ);
      wall.rotation.z = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
      addToScene(wall);

      var snowCapGeom = new THREE.BoxGeometry(dist, 1.2, wallThickness + 0.3);
      var snowCap = new THREE.Mesh(snowCapGeom, snowMaterial);
      snowCap.position.set(midX, wallHeight + 0.6, midZ);
      snowCap.rotation.z = wall.rotation.z;
      addToScene(snowCap);
    }
  }

  function createWatchtowers() {
    var concreteColor = 0x777777;
    var snowColor = 0xf5f5ff;
    var towerMaterial = createMaterial(concreteColor);
    var snowRoofMaterial = createMaterial(snowColor);

    var positions = [
      [-35, -35],
      [35, -35],
      [35, 35],
      [-35, 35]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var towerGeom = new THREE.BoxGeometry(5, 12, 5);
      var tower = new THREE.Mesh(towerGeom, towerMaterial);
      tower.position.set(pos[0], 6, pos[1]);
      addToScene(tower);

      var roofGeom = new THREE.ConeGeometry(3.5, 4, 8);
      var roof = new THREE.Mesh(roofGeom, snowRoofMaterial);
      roof.position.set(pos[0], 14, pos[1]);
      addToScene(roof);

      var searchLightGeom = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
      var searchLight = new THREE.Mesh(searchLightGeom, createMaterial(0x333333));
      searchLight.position.set(pos[0], 15, pos[1]);
      searchLight.userData.baseRotation = Math.random() * Math.PI * 2;
      addToScene(searchLight);
      searchLights.push(searchLight);
    }
  }

  function createSnowDrifts() {
    var snowMaterial = createMaterial(0xf8ffff);

    var driftPositions = [
      [-40, -40, 3, 8, 5, 6],
      [-40, 0, 2, 6, 4, 5],
      [-40, 40, 3, 7, 5, 6],
      [0, -40, 2.5, 5, 4, 5],
      [0, 40, 2.5, 5, 4, 5],
      [40, -40, 3, 8, 5, 6],
      [40, 0, 2, 6, 4, 5],
      [40, 40, 3, 7, 5, 6],
      [-25, -35, 2, 5, 3, 4],
      [25, -35, 2, 5, 3, 4],
      [-25, 35, 2, 5, 3, 4],
      [25, 35, 2, 5, 3, 4]
    ];

    for (var i = 0; i < driftPositions.length; i++) {
      var d = driftPositions[i];
      var driftGeom = new THREE.BoxGeometry(d[3], d[4], d[5]);
      var drift = new THREE.Mesh(driftGeom, snowMaterial);
      drift.position.set(d[0], d[2], d[1]);
      drift.rotation.z = (Math.random() - 0.5) * 0.3;
      addToScene(drift);
    }
  }

  function createCannonEmplacements() {
    var platformMaterial = createMaterial(0x666666);
    var barrelMaterial = createMaterial(0x333333);
    var iceMaterial = createMaterial(0xc0e8ff);

    var cannonPositions = [
      [-25, -28],
      [25, -28],
      [-28, 25],
      [28, 25]
    ];

    for (var i = 0; i < cannonPositions.length; i++) {
      var pos = cannonPositions[i];

      var platformGeom = new THREE.BoxGeometry(8, 1, 8);
      var platform = new THREE.Mesh(platformGeom, platformMaterial);
      platform.position.set(pos[0], 0.5, pos[1]);
      addToScene(platform);

      var barrelGeom = new THREE.CylinderGeometry(0.6, 0.7, 6, 16);
      var barrel = new THREE.Mesh(barrelGeom, barrelMaterial);
      barrel.position.set(pos[0], 2.5, pos[1]);
      barrel.rotation.z = 0.4;
      addToScene(barrel);

      var iceCapGeom = new THREE.ConeGeometry(2, 2, 8);
      var iceCap = new THREE.Mesh(iceCapGeom, iceMaterial);
      iceCap.position.set(pos[0], 3.5, pos[1]);
      addToScene(iceCap);
    }
  }

  function createBunkerEntrance() {
    var bunkerMaterial = createMaterial(0x555555);
    var blastDoorMaterial = createMaterial(0x444444);
    var snowMaterial = createMaterial(0xf0f5ff);

    var tunnelGeom = new THREE.BoxGeometry(6, 5, 8);
    var tunnel = new THREE.Mesh(tunnelGeom, bunkerMaterial);
    tunnel.position.set(0, 2.5, -38);
    addToScene(tunnel);

    var doorGeom = new THREE.BoxGeometry(5, 4, 0.5);
    var door = new THREE.Mesh(doorGeom, blastDoorMaterial);
    door.position.set(0, 2, -34);
    addToScene(door);

    var snowCoverGeom = new THREE.BoxGeometry(7, 1.5, 3);
    var snowCover = new THREE.Mesh(snowCoverGeom, snowMaterial);
    snowCover.position.set(0, 5, -38);
    addToScene(snowCover);
  }

  function createBarracksBuilding() {
    var brickMaterial = createMaterial(0x8b6f47);
    var roofMaterial = createMaterial(0x4a4a4a);
    var snowMaterial = createMaterial(0xf5f5ff);

    var barracksGeom = new THREE.BoxGeometry(20, 8, 15);
    var barracks = new THREE.Mesh(barracksGeom, brickMaterial);
    barracks.position.set(0, 4, 20);
    addToScene(barracks);

    var roofGeom = new THREE.BoxGeometry(22, 1, 17);
    var roof = new THREE.Mesh(roofGeom, roofMaterial);
    roof.position.set(0, 8.5, 20);
    addToScene(roof);

    var snowOnRoofGeom = new THREE.BoxGeometry(22, 0.8, 17);
    var snowOnRoof = new THREE.Mesh(snowOnRoofGeom, snowMaterial);
    snowOnRoof.position.set(0, 9.3, 20);
    addToScene(snowOnRoof);

    var chimneyGeom = new THREE.CylinderGeometry(1, 1.2, 6, 8);
    var chimney = new THREE.Mesh(chimneyGeom, createMaterial(0x666666));
    chimney.position.set(-7, 11.5, 22);
    addToScene(chimney);

    for (var i = 0; i < 8; i++) {
      var smokeGeom = new THREE.SphereGeometry(0.8 - i * 0.08, 8, 8);
      var smoke = new THREE.Mesh(smokeGeom, createMaterial(0xcccccc, 0.7 - i * 0.08));
      smoke.position.set(-7 + (Math.random() - 0.5) * 0.5, 12 + i * 1.2, 22 + (Math.random() - 0.5) * 0.5);
      smoke.userData.initialY = smoke.position.y;
      smoke.userData.riseSpeed = 0.5 + Math.random() * 0.3;
      addToScene(smoke);
      smokePuffs.push(smoke);
    }
  }

  function createSnowTrenches() {
    var groundMaterial = createMaterial(0xd0d0d0);

    var trenchPositions = [
      [0, -15, 20, 2, 8],
      [-15, 0, 15, 2, 8],
      [15, 0, 15, 2, 8],
      [0, 15, 20, 2, 8],
      [-10, -10, 10, 1.5, 6],
      [10, -10, 10, 1.5, 6],
      [-10, 10, 10, 1.5, 6],
      [10, 10, 10, 1.5, 6]
    ];

    for (var i = 0; i < trenchPositions.length; i++) {
      var t = trenchPositions[i];
      var trenchGeom = new THREE.BoxGeometry(t[2], t[3], t[4]);
      var trench = new THREE.Mesh(trenchGeom, groundMaterial);
      trench.position.set(t[0], t[3] / 2 - 0.5, t[1]);
      addToScene(trench);
    }
  }

  function createSnowmobileDepot() {
    var vehicleMaterial = createMaterial(0x2d5016);
    var skiMaterial = createMaterial(0xcccccc);

    var vehiclePositions = [
      [-12, -10],
      [0, -10],
      [12, -10],
      [-12, -5],
      [0, -5],
      [12, -5]
    ];

    for (var i = 0; i < vehiclePositions.length; i++) {
      var vpos = vehiclePositions[i];

      var bodyGeom = new THREE.BoxGeometry(3, 2, 5);
      var body = new THREE.Mesh(bodyGeom, vehicleMaterial);
      body.position.set(vpos[0], 1, vpos[1]);
      addToScene(body);

      for (var j = 0; j < 2; j++) {
        var skiGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        var ski = new THREE.Mesh(skiGeom, skiMaterial);
        ski.position.set(vpos[0] + (j - 0.5) * 1.5, 0.3, vpos[1]);
        ski.rotation.z = Math.PI / 2;
        addToScene(ski);
      }

      var engineGeom = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
      var engine = new THREE.Mesh(engineGeom, createMaterial(0x333333));
      engine.position.set(vpos[0], 1.5, vpos[1] + 2);
      addToScene(engine);
    }
  }

  function createPerimeterWire() {
    var wireMaterial = createMaterial(0x4a4a4a);
    var postMaterial = createMaterial(0x555555);

    var postPositions = [
      [-30, -35],
      [-15, -35],
      [0, -35],
      [15, -35],
      [30, -35],
      [-30, 35],
      [-15, 35],
      [0, 35],
      [15, 35],
      [30, 35],
      [-35, -20],
      [-35, -10],
      [-35, 0],
      [-35, 10],
      [-35, 20],
      [35, -20],
      [35, -10],
      [35, 0],
      [35, 10],
      [35, 20]
    ];

    for (var i = 0; i < postPositions.length; i++) {
      var ppos = postPositions[i];

      var postGeom = new THREE.BoxGeometry(0.5, 5, 0.5);
      var post = new THREE.Mesh(postGeom, postMaterial);
      post.position.set(ppos[0], 2.5, ppos[1]);
      addToScene(post);

      var wireGeom = new THREE.CylinderGeometry(0.15, 0.15, 2, 4);
      var wire = new THREE.Mesh(wireGeom, wireMaterial);
      wire.position.set(ppos[0], 4, ppos[1]);
      addToScene(wire);
    }
  }

  function createHelipadAndWreck() {
    var padMaterial = createMaterial(0x4a4a4a);
    var wreckMaterial = createMaterial(0x8b7355);
    var snowMaterial = createMaterial(0xf0f5ff);

    var padGeom = new THREE.BoxGeometry(15, 0.5, 15);
    var pad = new THREE.Mesh(padGeom, padMaterial);
    pad.position.set(-20, 0.25, -15);
    addToScene(pad);

    var wreckFuselageGeom = new THREE.BoxGeometry(4, 2, 8);
    var wreckFuselage = new THREE.Mesh(wreckFuselageGeom, wreckMaterial);
    wreckFuselage.position.set(-20, 1.5, -15);
    wreckFuselage.rotation.z = 0.3;
    addToScene(wreckFuselage);

    var bladeGeom = new THREE.BoxGeometry(12, 0.3, 1);
    heliBlade = new THREE.Mesh(bladeGeom, createMaterial(0x555555));
    heliBlade.position.set(-20, 3.5, -15);
    heliBlade.userData.rotation = 0;
    addToScene(heliBlade);

    var rotorGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 8);
    var rotor = new THREE.Mesh(rotorGeom, createMaterial(0x333333));
    rotor.position.set(-20, 3.5, -15);
    addToScene(rotor);

    for (var i = 0; i < 3; i++) {
      var snowGeom = new THREE.BoxGeometry(6, 1, 3);
      var snow = new THREE.Mesh(snowGeom, snowMaterial);
      snow.position.set(-20 + (i - 1) * 4, 0.5, -15 + (i - 1) * 3);
      addToScene(snow);
    }
  }

  function createSupplyCache() {
    var crateMaterial = createMaterial(0x8b4513);
    var snowMaterial = createMaterial(0xf0f5ff);

    var cratePositions = [
      [-15, 10, 2],
      [-10, 10, 2],
      [-5, 10, 2],
      [-15, 15, 2],
      [-10, 15, 2],
      [35, 5, 2],
      [30, 5, 2],
      [25, 5, 2],
      [35, 10, 2],
      [30, 10, 2]
    ];

    for (var i = 0; i < cratePositions.length; i++) {
      var cpos = cratePositions[i];

      var crateGeom = new THREE.BoxGeometry(2, 2, 2);
      var crate = new THREE.Mesh(crateGeom, crateMaterial);
      crate.position.set(cpos[0], cpos[2], cpos[1]);
      addToScene(crate);

      if (Math.random() > 0.5) {
        var snowGeom = new THREE.BoxGeometry(2.5, 1, 2.5);
        var snow = new THREE.Mesh(snowGeom, snowMaterial);
        snow.position.set(cpos[0], cpos[2] + 1.5, cpos[1]);
        addToScene(snow);
      }
    }
  }

  function createBlizzardSnow() {
    var snowMaterial = createMaterial(0xffffff, 0.8);

    var particleCount = 80;
    for (var i = 0; i < particleCount; i++) {
      var snowGeom = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 4, 4);
      var snowParticle = new THREE.Mesh(snowGeom, snowMaterial);

      snowParticle.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 50,
        (Math.random() - 0.5) * 100
      );

      snowParticle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        -1 - Math.random() * 1,
        (Math.random() - 0.5) * 2
      );
      snowParticle.userData.initialY = snowParticle.position.y;

      addToScene(snowParticle);
      snowParticles.push(snowParticle);
    }
  }

  function createAdditionalStructures() {
    var concreteColor = 0x777777;
    var metalColor = 0x555555;
    var snowColor = 0xf5f5ff;

    var concreteMat = createMaterial(concreteColor);
    var metalMat = createMaterial(metalColor);
    var snowMat = createMaterial(snowColor);

    var gunneriesPositions = [
      [-20, -20],
      [20, -20],
      [-20, 20],
      [20, 20]
    ];

    for (var i = 0; i < gunneriesPositions.length; i++) {
      var gpos = gunneriesPositions[i];

      var gunGeom = new THREE.BoxGeometry(4, 3, 4);
      var gun = new THREE.Mesh(gunGeom, concreteMat);
      gun.position.set(gpos[0], 1.5, gpos[1]);
      addToScene(gun);

      var ammoGeom = new THREE.CylinderGeometry(0.8, 0.8, 1, 8);
      var ammo = new THREE.Mesh(ammoGeom, metalMat);
      ammo.position.set(gpos[0], 2, gpos[1]);
      addToScene(ammo);
    }

    var radarGeom = new THREE.CylinderGeometry(1.5, 1.5, 8, 16);
    var radar = new THREE.Mesh(radarGeom, metalMat);
    radar.position.set(0, 4, 0);
    addToScene(radar);

    var radarDomeGeom = new THREE.SphereGeometry(2, 16, 16);
    var radarDome = new THREE.Mesh(radarDomeGeom, snowMat);
    radarDome.position.set(0, 9, 0);
    addToScene(radarDome);

    var generatorPositions = [
      [-30, -25],
      [30, -25],
      [-30, 25],
      [30, 25]
    ];

    for (var j = 0; j < generatorPositions.length; j++) {
      var genpos = generatorPositions[j];

      var genGeom = new THREE.BoxGeometry(3, 3, 3);
      var generator = new THREE.Mesh(genGeom, concreteMat);
      generator.position.set(genpos[0], 1.5, genpos[1]);
      addToScene(generator);

      var intakeGeom = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
      var intake = new THREE.Mesh(intakeGeom, metalMat);
      intake.position.set(genpos[0], 3.5, genpos[1]);
      addToScene(intake);
    }

    var storagePositions = [
      [-25, 0],
      [25, 0],
      [0, -25],
      [0, 25]
    ];

    for (var k = 0; k < storagePositions.length; k++) {
      var storpos = storagePositions[k];

      var storageGeom = new THREE.BoxGeometry(6, 5, 6);
      var storage = new THREE.Mesh(storageGeom, metalMat);
      storage.position.set(storpos[0], 2.5, storpos[1]);
      addToScene(storage);

      var roofGeom = new THREE.ConeGeometry(4, 2, 8);
      var roofStorage = new THREE.Mesh(roofGeom, snowMat);
      roofStorage.position.set(storpos[0], 5.5, storpos[1]);
      addToScene(roofStorage);
    }
  }

  var publicAPI = {
    init: function(sceneRef, cameraRef) {
      scene = sceneRef;
      camera = cameraRef;
      allObjects = [];
      snowParticles = [];
      smokePuffs = [];
      searchLights = [];

      createPerimeterWalls();
      createWatchtowers();
      createSnowDrifts();
      createCannonEmplacements();
      createBunkerEntrance();
      createBarracksBuilding();
      createSnowTrenches();
      createSnowmobileDepot();
      createPerimeterWire();
      createHelipadAndWreck();
      createSupplyCache();
      createBlizzardSnow();
      createAdditionalStructures();

      return allObjects.length;
    },

    update: function(delta) {
      var i;

      for (i = 0; i < snowParticles.length; i++) {
        var particle = snowParticles[i];
        particle.position.add(particle.userData.velocity.clone().multiplyScalar(delta));

        if (particle.position.y < -10) {
          particle.position.y = particle.userData.initialY;
        }
        if (particle.position.x < -60) {
          particle.position.x = 60;
        }
        if (particle.position.x > 60) {
          particle.position.x = -60;
        }
        if (particle.position.z < -60) {
          particle.position.z = 60;
        }
        if (particle.position.z > 60) {
          particle.position.z = -60;
        }
      }

      for (i = 0; i < smokePuffs.length; i++) {
        var puff = smokePuffs[i];
        puff.position.y += puff.userData.riseSpeed * delta;
        puff.material.opacity -= 0.1 * delta;
        if (puff.material.opacity <= 0) {
          puff.material.opacity = 0.7 - i * 0.08;
          puff.position.y = puff.userData.initialY;
        }
      }

      for (i = 0; i < searchLights.length; i++) {
        var light = searchLights[i];
        light.userData.baseRotation += 0.8 * delta;
        light.rotation.y = light.userData.baseRotation;
      }

      if (heliBlade) {
        heliBlade.userData.rotation += 15 * delta;
        heliBlade.rotation.y = heliBlade.userData.rotation * Math.PI / 180;
      }
    },

    reset: function() {
      var i;
      for (i = allObjects.length - 1; i >= 0; i--) {
        scene.remove(allObjects[i]);
      }
      allObjects = [];
      snowParticles = [];
      smokePuffs = [];
      searchLights = [];
      heliBlade = null;
    }
  };

  return publicAPI;
}());
