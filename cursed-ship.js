window.CursedShip = (function() {
  'use strict';

  var scene;
  var camera;
  var elements = [];
  var cannonFlashTimer = 0;
  var cannonFlashes = [];
  var treasureGlows = [];
  var fogParticles = [];
  var time = 0;

  var darkWood = 0x2b1810;
  var spectralGreen = 0x00ff88;
  var cursedGold = 0xffd700;
  var rustRed = 0x8b4513;
  var black = 0x1a1a1a;
  var rottenBrown = 0x3d2817;

  function createHull() {
    var hull = new THREE.Group();

    var mainHullGeo = new THREE.BoxGeometry(60, 15, 25);
    var mainHullMat = new THREE.MeshLambertMaterial({ color: darkWood });
    var mainHull = new THREE.Mesh(mainHullGeo, mainHullMat);
    mainHull.position.set(0, 5, 0);
    mainHull.castShadow = true;
    mainHull.receiveShadow = true;
    hull.add(mainHull);
    elements.push(mainHull);

    var keel = new THREE.BoxGeometry(60, 3, 25);
    var keelMat = new THREE.MeshLambertMaterial({ color: rustRed });
    var keelMesh = new THREE.Mesh(keel, keelMat);
    keelMesh.position.set(0, -8, 0);
    keelMesh.castShadow = true;
    keelMesh.receiveShadow = true;
    hull.add(keelMesh);
    elements.push(keelMesh);

    var sternCastle = new THREE.BoxGeometry(20, 12, 18);
    var sternMat = new THREE.MeshLambertMaterial({ color: rottenBrown });
    var sternCastleMesh = new THREE.Mesh(sternCastle, sternMat);
    sternCastleMesh.position.set(20, 12, 0);
    sternCastleMesh.castShadow = true;
    sternCastleMesh.receiveShadow = true;
    hull.add(sternCastleMesh);
    elements.push(sternCastleMesh);

    var bowCastle = new THREE.BoxGeometry(16, 10, 16);
    var bowMat = new THREE.MeshLambertMaterial({ color: rottenBrown });
    var bowCastleMesh = new THREE.Mesh(bowCastle, bowMat);
    bowCastleMesh.position.set(-28, 10, 0);
    bowCastleMesh.castShadow = true;
    bowCastleMesh.receiveShadow = true;
    hull.add(bowCastleMesh);
    elements.push(bowCastleMesh);

    return hull;
  }

  function createMainMast() {
    var mast = new THREE.Group();

    var mastPoleGeo = new THREE.CylinderGeometry(0.8, 1.2, 45, 8);
    var mastMat = new THREE.MeshLambertMaterial({ color: darkWood });
    var mastPole = new THREE.Mesh(mastPoleGeo, mastMat);
    mastPole.position.set(0, 30, 0);
    mastPole.castShadow = true;
    mastPole.receiveShadow = true;
    mast.add(mastPole);
    elements.push(mastPole);

    var crowsnestGeo = new THREE.CylinderGeometry(3, 3, 1.5, 12);
    var crowsNestMat = new THREE.MeshLambertMaterial({ color: rottenBrown });
    var crowsnest = new THREE.Mesh(crowsnestGeo, crowsNestMat);
    crowsnest.position.set(0, 50, 0);
    crowsnest.castShadow = true;
    crowsnest.receiveShadow = true;
    mast.add(crowsnest);
    elements.push(crowsnest);

    var yardArm1Geo = new THREE.CylinderGeometry(0.4, 0.4, 35, 6);
    var yardMat = new THREE.MeshLambertMaterial({ color: darkWood });
    var yardArm1 = new THREE.Mesh(yardArm1Geo, yardMat);
    yardArm1.rotation.z = Math.PI / 2;
    yardArm1.position.set(0, 35, 0);
    yardArm1.castShadow = true;
    yardArm1.receiveShadow = true;
    mast.add(yardArm1);
    elements.push(yardArm1);

    var yardArm2 = new THREE.Mesh(yardArm1Geo, yardMat);
    yardArm2.rotation.z = Math.PI / 2;
    yardArm2.position.set(0, 25, 0);
    yardArm2.castShadow = true;
    yardArm2.receiveShadow = true;
    mast.add(yardArm2);
    elements.push(yardArm2);

    return mast;
  }

  function createSails() {
    var sails = new THREE.Group();

    var sailGeo = new THREE.BoxGeometry(0.3, 20, 18);
    var sailMat = new THREE.MeshLambertMaterial({ color: black });

    var sail1 = new THREE.Mesh(sailGeo, sailMat);
    sail1.position.set(2, 28, 5);
    sail1.castShadow = true;
    sail1.receiveShadow = true;
    sails.add(sail1);
    elements.push(sail1);

    var sail2 = new THREE.Mesh(sailGeo, sailMat);
    sail2.position.set(2, 20, -8);
    sail2.castShadow = true;
    sail2.receiveShadow = true;
    sails.add(sail2);
    elements.push(sail2);

    return sails;
  }

  function createCannonBattery() {
    var cannons = new THREE.Group();

    var cannonBarrelGeo = new THREE.CylinderGeometry(0.5, 0.6, 12, 8);
    var cannonMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    for (var i = 0; i < 4; i++) {
      var barrel = new THREE.Mesh(cannonBarrelGeo, cannonMat);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(-15 + i * 12, 8 + i * 2, 13);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      cannons.add(barrel);
      elements.push(barrel);
      cannonFlashes.push({ mesh: barrel, active: false, timer: 0 });

      var wheelGeo = new THREE.CylinderGeometry(2, 2, 0.8, 12);
      var wheelMat = new THREE.MeshLambertMaterial({ color: rustRed });
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(-15 + i * 12, 6 + i * 2, 13);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      cannons.add(wheel);
      elements.push(wheel);
    }

    return cannons;
  }

  function createTreasureChests() {
    var chests = new THREE.Group();

    var chestGeo = new THREE.BoxGeometry(3, 2, 2);
    var chestMat = new THREE.MeshLambertMaterial({ color: cursedGold });

    var positions = [
      [-20, 5, 8],
      [15, 5, -10],
      [5, 5, 12],
      [-10, 5, -8]
    ];

    for (var i = 0; i < positions.length; i++) {
      var chest = new THREE.Mesh(chestGeo, chestMat);
      chest.position.set(positions[i][0], positions[i][1], positions[i][2]);
      chest.castShadow = true;
      chest.receiveShadow = true;
      chests.add(chest);
      elements.push(chest);
      treasureGlows.push({ mesh: chest, intensity: 0.3 });

      var lidGeo = new THREE.BoxGeometry(3.2, 1, 2.2);
      var lidMat = new THREE.MeshLambertMaterial({ color: 0xc9a961 });
      var lid = new THREE.Mesh(lidGeo, lidMat);
      lid.position.set(positions[i][0], positions[i][1] + 1.5, positions[i][2]);
      lid.castShadow = true;
      lid.receiveShadow = true;
      chests.add(lid);
      elements.push(lid);
    }

    return chests;
  }

  function createSpectralTorches() {
    var torches = new THREE.Group();

    var positions = [
      [-25, 8, -12],
      [25, 10, 10],
      [-15, 15, -15],
      [20, 12, -8]
    ];

    for (var i = 0; i < positions.length; i++) {
      var poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
      var poleMat = new THREE.MeshLambertMaterial({ color: darkWood });
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(positions[i][0], positions[i][1] + 4, positions[i][2]);
      pole.castShadow = true;
      pole.receiveShadow = true;
      torches.add(pole);
      elements.push(pole);

      var flameGeo = new THREE.SphereGeometry(1.2, 8, 8);
      var flameMat = new THREE.MeshBasicMaterial({ color: spectralGreen, emissive: spectralGreen });
      var flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(positions[i][0], positions[i][1] + 8, positions[i][2]);
      flame.scale.set(1, 1.5, 1);
      torches.add(flame);
      elements.push(flame);
    }

    return torches;
  }

  function createHoldAndDecks() {
    var structure = new THREE.Group();

    var deckGeo = new THREE.BoxGeometry(58, 1.5, 24);
    var deckMat = new THREE.MeshLambertMaterial({ color: rottenBrown });
    var mainDeck = new THREE.Mesh(deckGeo, deckMat);
    mainDeck.position.set(0, 20, 0);
    mainDeck.castShadow = true;
    mainDeck.receiveShadow = true;
    structure.add(mainDeck);
    elements.push(mainDeck);

    var holdEntranceGeo = new THREE.BoxGeometry(6, 3, 5);
    var holdMat = new THREE.MeshLambertMaterial({ color: 0x1a0f0a });
    var holdEntrance = new THREE.Mesh(holdEntranceGeo, holdMat);
    holdEntrance.position.set(0, 3, 0);
    holdEntrance.castShadow = true;
    holdEntrance.receiveShadow = true;
    structure.add(holdEntrance);
    elements.push(holdEntrance);

    var treasureRoomGeo = new THREE.BoxGeometry(8, 6, 10);
    var treasureRoomMat = new THREE.MeshLambertMaterial({ color: 0x0d0805 });
    var treasureRoom = new THREE.Mesh(treasureRoomGeo, treasureRoomMat);
    treasureRoom.position.set(5, -3, 0);
    treasureRoom.castShadow = true;
    treasureRoom.receiveShadow = true;
    structure.add(treasureRoom);
    elements.push(treasureRoom);

    return structure;
  }

  function createBarnacleSections() {
    var barnacles = new THREE.Group();

    var positions = [
      [-28, 2, -13],
      [28, 4, 13],
      [-20, -2, 10],
      [15, 3, -12],
      [0, 1, 15]
    ];

    for (var i = 0; i < positions.length; i++) {
      var clusterGeo = new THREE.SphereGeometry(2 + Math.random() * 1.5, 6, 6);
      var barnMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
      var cluster = new THREE.Mesh(clusterGeo, barnMat);
      cluster.position.set(positions[i][0], positions[i][1], positions[i][2]);
      cluster.scale.set(0.8 + Math.random() * 0.4, 1 + Math.random() * 0.5, 0.8 + Math.random() * 0.4);
      cluster.castShadow = true;
      cluster.receiveShadow = true;
      barnacles.add(cluster);
      elements.push(cluster);
    }

    return barnacles;
  }

  function createDebrisField() {
    var debris = new THREE.Group();

    var positions = [
      [-35, -5, 30],
      [40, -3, -35],
      [-50, -4, -20],
      [45, -4, 25],
      [-40, -5, 0],
      [35, -3, -15]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pieceGeo = new THREE.BoxGeometry(4 + Math.random() * 3, 2 + Math.random() * 2, 3 + Math.random() * 2);
      var pieceMat = new THREE.MeshLambertMaterial({ color: rustRed });
      var piece = new THREE.Mesh(pieceGeo, pieceMat);
      piece.position.set(positions[i][0], positions[i][1], positions[i][2]);
      piece.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      piece.castShadow = true;
      piece.receiveShadow = true;
      debris.add(piece);
      elements.push(piece);
    }

    return debris;
  }

  function createCompassRose() {
    var compass = new THREE.Group();

    var points = [];
    points.push(new THREE.Vector3(0, 0.1, 0));
    points.push(new THREE.Vector3(8, 0.1, 0));

    var line1Geo = new THREE.BufferGeometry().setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: cursedGold, linewidth: 2 });
    var line1 = new THREE.LineSegments(line1Geo, lineMat);
    line1.position.set(-5, 20.5, -8);
    compass.add(line1);

    var points2 = [];
    points2.push(new THREE.Vector3(0, 0.1, 0));
    points2.push(new THREE.Vector3(0, 0.1, 8));
    var line2Geo = new THREE.BufferGeometry().setFromPoints(points2);
    var line2 = new THREE.LineSegments(line2Geo, lineMat);
    line2.position.set(-5, 20.5, -8);
    compass.add(line2);

    var points3 = [];
    points3.push(new THREE.Vector3(0, 0.1, 0));
    points3.push(new THREE.Vector3(-8, 0.1, 0));
    var line3Geo = new THREE.BufferGeometry().setFromPoints(points3);
    var line3 = new THREE.LineSegments(line3Geo, lineMat);
    line3.position.set(-5, 20.5, -8);
    compass.add(line3);

    var points4 = [];
    points4.push(new THREE.Vector3(0, 0.1, 0));
    points4.push(new THREE.Vector3(0, 0.1, -8));
    var line4Geo = new THREE.BufferGeometry().setFromPoints(points4);
    var line4 = new THREE.LineSegments(line4Geo, lineMat);
    line4.position.set(-5, 20.5, -8);
    compass.add(line4);

    return compass;
  }

  function createFogParticles() {
    var fogGroup = new THREE.Group();

    for (var i = 0; i < 12; i++) {
      var fogGeo = new THREE.SphereGeometry(3 + Math.random() * 2, 4, 4);
      var fogMat = new THREE.MeshBasicMaterial({
        color: spectralGreen,
        transparent: true,
        opacity: 0.15,
        emissive: spectralGreen
      });
      var fogParticle = new THREE.Mesh(fogGeo, fogMat);
      fogParticle.position.set(
        -30 + Math.random() * 60,
        2 + Math.random() * 8,
        -25 + Math.random() * 50
      );
      fogGroup.add(fogParticle);
      fogParticles.push({ mesh: fogParticle, baseY: fogParticle.position.y });
    }

    return fogGroup;
  }

  function createRigging() {
    var rigging = new THREE.Group();

    var positions = [
      [-20, 25, 5],
      [-5, 30, 3],
      [10, 28, -5],
      [0, 35, 0],
      [-15, 32, -8]
    ];

    for (var i = 0; i < positions.length; i++) {
      var ropeGeo = new THREE.CylinderGeometry(0.15, 0.15, 25, 4);
      var ropeMat = new THREE.MeshLambertMaterial({ color: 0x4a3f35 });
      var rope = new THREE.Mesh(ropeGeo, ropeMat);
      rope.position.set(positions[i][0], positions[i][1], positions[i][2]);
      rope.rotation.z = Math.PI / 3 + Math.random() * 0.5;
      rope.castShadow = true;
      rope.receiveShadow = true;
      rigging.add(rope);
      elements.push(rope);
    }

    return rigging;
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    elements = [];
    cannonFlashes = [];
    treasureGlows = [];
    fogParticles = [];
    time = 0;

    var shipGroup = new THREE.Group();

    var hull = createHull();
    shipGroup.add(hull);

    var mast = createMainMast();
    shipGroup.add(mast);

    var sails = createSails();
    shipGroup.add(sails);

    var cannons = createCannonBattery();
    shipGroup.add(cannons);

    var chests = createTreasureChests();
    shipGroup.add(chests);

    var torches = createSpectralTorches();
    shipGroup.add(torches);

    var holdsAndDecks = createHoldAndDecks();
    shipGroup.add(holdsAndDecks);

    var barnacles = createBarnacleSections();
    shipGroup.add(barnacles);

    var debris = createDebrisField();
    shipGroup.add(debris);

    var compass = createCompassRose();
    shipGroup.add(compass);

    var fogParticlesGroup = createFogParticles();
    shipGroup.add(fogParticlesGroup);

    var rigging = createRigging();
    shipGroup.add(rigging);

    scene.add(shipGroup);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    scene.add(directionalLight);

    var spectralLight = new THREE.PointLight(spectralGreen, 0.5, 100);
    spectralLight.position.set(0, 5, 0);
    scene.add(spectralLight);

    var fog = new THREE.Fog(0x1a1a2e, 150, 300);
    scene.fog = fog;
    scene.background = new THREE.Color(0x0d0f1a);
  }

  function updateCannonFlashes(delta) {
    cannonFlashTimer += delta;

    if (cannonFlashTimer > 1.5) {
      var randomIndex = Math.floor(Math.random() * cannonFlashes.length);
      cannonFlashes[randomIndex].active = true;
      cannonFlashes[randomIndex].timer = 0.15;
      cannonFlashTimer = 0;
    }

    for (var i = 0; i < cannonFlashes.length; i++) {
      if (cannonFlashes[i].active) {
        cannonFlashes[i].timer -= delta;

        if (cannonFlashes[i].timer > 0) {
          cannonFlashes[i].mesh.material.emissive.setHex(0xffaa00);
          cannonFlashes[i].mesh.material.emissiveIntensity = 1.5;
        } else {
          cannonFlashes[i].active = false;
          cannonFlashes[i].mesh.material.emissive.setHex(0x000000);
          cannonFlashes[i].mesh.material.emissiveIntensity = 0;
        }
      }
    }
  }

  function updateTreasureGlows(delta) {
    for (var i = 0; i < treasureGlows.length; i++) {
      var glow = treasureGlows[i];
      glow.intensity = 0.3 + 0.2 * Math.sin(time * 2 + i);
      glow.mesh.material.emissive.setHex(cursedGold);
      glow.mesh.material.emissiveIntensity = glow.intensity;
    }
  }

  function updateFogWisps(delta) {
    for (var i = 0; i < fogParticles.length; i++) {
      var particle = fogParticles[i];
      particle.mesh.position.y = particle.baseY + Math.sin(time * 0.8 + i * 0.5) * 2;
      particle.mesh.position.x += Math.sin(time * 0.3 + i) * 0.3 * delta;
      particle.mesh.position.z += Math.cos(time * 0.25 + i) * 0.3 * delta;

      var opacityVariation = 0.15 + 0.1 * Math.sin(time * 1.2 + i);
      particle.mesh.material.opacity = opacityVariation;
    }
  }

  function update(delta) {
    time += delta;

    updateCannonFlashes(delta);
    updateTreasureGlows(delta);
    updateFogWisps(delta);

    if (camera && camera.position) {
      camera.lookAt(0, 15, 0);
    }
  }

  function reset() {
    time = 0;
    cannonFlashTimer = 0;

    for (var i = 0; i < cannonFlashes.length; i++) {
      cannonFlashes[i].active = false;
      cannonFlashes[i].timer = 0;
      cannonFlashes[i].mesh.material.emissive.setHex(0x000000);
      cannonFlashes[i].mesh.material.emissiveIntensity = 0;
    }

    for (var j = 0; j < treasureGlows.length; j++) {
      treasureGlows[j].intensity = 0.3;
      treasureGlows[j].mesh.material.emissiveIntensity = 0.3;
    }

    for (var k = 0; k < fogParticles.length; k++) {
      fogParticles[k].mesh.position.y = fogParticles[k].baseY;
      fogParticles[k].mesh.material.opacity = 0.15;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
