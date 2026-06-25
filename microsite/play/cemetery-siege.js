window.CemeterySiege = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var materials = [];
  var hudOverlay = null;
  var gameState = {
    sectorsCleared: 0,
    militiaKilled: 0,
    chapelStatus: 'HOSTILE',
    time: 0
  };

  var animationData = {
    militiaSoldiers: [],
    lanterns: [],
    fogLayers: [],
    burningBarrels: [],
    militaryTeam: []
  };

  function createMaterial(color, emissive, emissiveIntensity) {
    var mat = new THREE.MeshStandardMaterial({
      color: color || 0xffffff,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissiveIntensity || 0,
      roughness: 0.8,
      metalness: 0.1
    });
    materials.push(mat);
    return mat;
  }

  function createCemeteryGround() {
    var groundGeo = new THREE.BoxGeometry(400, 0.2, 400);
    var groundMat = createMaterial(0x1a1a1a);
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.1;
    scene.add(ground);
    objects.push(ground);
  }

  function createTombstones() {
    var tmbMat = createMaterial(0x888888);
    for (var i = 0; i < 25; i++) {
      var height = 0.5 + Math.random() * 1.5;
      var geo = new THREE.BoxGeometry(0.3, height, 0.15);
      var tomb = new THREE.Mesh(geo, tmbMat);
      tomb.position.x = -150 + Math.random() * 300;
      tomb.position.y = height / 2;
      tomb.position.z = -150 + Math.random() * 300;
      tomb.rotation.y = Math.random() * Math.PI * 0.3;
      scene.add(tomb);
      objects.push(tomb);
    }
  }

  function createMausoleums() {
    var mauMat = createMaterial(0x999999);
    for (var i = 0; i < 3; i++) {
      var posX = -100 + i * 100;
      var posZ = -150 + Math.random() * 100;

      var bodyGeo = new THREE.BoxGeometry(4, 3, 3);
      var body = new THREE.Mesh(bodyGeo, mauMat);
      body.position.set(posX, 1.5, posZ);
      scene.add(body);
      objects.push(body);

      var doorGeo = new THREE.BoxGeometry(1.5, 2, 0.1);
      var doorMat = createMaterial(0x222222);
      var door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(posX, 1, posZ + 1.5);
      scene.add(door);
      objects.push(door);

      var roofGeo = new THREE.BoxGeometry(4.2, 0.3, 3.2);
      var roof = new THREE.Mesh(roofGeo, createMaterial(0x555555));
      roof.position.set(posX, 3.15, posZ);
      scene.add(roof);
      objects.push(roof);
    }
  }

  function createIronFence() {
    var fenceMat = createMaterial(0x333333);
    var postPositions = [
      { x: -200, z: -200 }, { x: -200, z: 0 }, { x: -200, z: 200 },
      { x: 0, z: -200 }, { x: 200, z: -200 },
      { x: 200, z: 0 }, { x: 200, z: 200 },
      { x: 0, z: 200 }, { x: -100, z: -200 }, { x: 100, z: -200 }
    ];

    for (var i = 0; i < postPositions.length; i++) {
      var pos = postPositions[i];
      var postGeo = new THREE.BoxGeometry(0.15, 2.5, 0.15);
      var post = new THREE.Mesh(postGeo, fenceMat);
      post.position.set(pos.x, 1.25, pos.z);
      scene.add(post);
      objects.push(post);

      if (i < postPositions.length - 1) {
        var nextPos = postPositions[(i + 1) % postPositions.length];
        var railGeo = new THREE.BoxGeometry(
          Math.sqrt(Math.pow(nextPos.x - pos.x, 2) + Math.pow(nextPos.z - pos.z, 2)),
          0.1,
          0.1
        );
        var rail = new THREE.Mesh(railGeo, fenceMat);
        rail.position.set((pos.x + nextPos.x) / 2, 2, (pos.z + nextPos.z) / 2);
        scene.add(rail);
        objects.push(rail);
      }
    }
  }

  function createTrees() {
    for (var i = 0; i < 5; i++) {
      var trunkGeo = new THREE.CylinderGeometry(0.4, 0.5, 4, 8);
      var trunkMat = createMaterial(0x3d2817);
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(-150 + i * 70, 2, -180 + Math.random() * 100);
      scene.add(trunk);
      objects.push(trunk);

      var foliageGeo = new THREE.BoxGeometry(3, 3.5, 3);
      var foliageMat = createMaterial(0x1a3a1a);
      var foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(trunk.position.x, trunk.position.y + 3, trunk.position.z);
      scene.add(foliage);
      objects.push(foliage);
    }
  }

  function createMilitiaSoldiers() {
    var camoMat = createMaterial(0x556b2f);
    var skinMat = createMaterial(0xc89968);

    for (var i = 0; i < 6; i++) {
      var groupX = -120 + i * 40;
      var groupZ = -50 + Math.random() * 100;

      var bodyGeo = new THREE.BoxGeometry(0.4, 0.8, 0.25);
      var body = new THREE.Mesh(bodyGeo, camoMat);
      body.position.set(groupX, 0.4, groupZ);
      body.rotation.z = Math.PI * 0.2;
      scene.add(body);
      objects.push(body);

      var headGeo = new THREE.BoxGeometry(0.2, 0.25, 0.2);
      var head = new THREE.Mesh(headGeo, skinMat);
      head.position.set(groupX, 1.1, groupZ);
      scene.add(head);
      objects.push(head);

      var armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.12);
      var armL = new THREE.Mesh(armGeo, camoMat);
      armL.position.set(groupX - 0.3, 0.7, groupZ);
      scene.add(armL);
      objects.push(armL);

      var armR = new THREE.Mesh(armGeo, camoMat);
      armR.position.set(groupX + 0.3, 0.7, groupZ);
      scene.add(armR);
      objects.push(armR);

      animationData.militiaSoldiers.push({
        body: body,
        head: head,
        baseY: body.position.y,
        bobPhase: Math.random() * Math.PI * 2
      });
    }
  }

  function createMilitaryTeam() {
    var tacMat = createMaterial(0x2d5016);
    var skinMat = createMaterial(0xc89968);

    for (var i = 0; i < 4; i++) {
      var spacing = 1.5;
      var bodyGeo = new THREE.BoxGeometry(0.4, 0.9, 0.25);
      var body = new THREE.Mesh(bodyGeo, tacMat);
      body.position.set(-190 + i * spacing, 0.45, 180);
      scene.add(body);
      objects.push(body);

      var headGeo = new THREE.BoxGeometry(0.2, 0.25, 0.2);
      var head = new THREE.Mesh(headGeo, skinMat);
      head.position.set(body.position.x, 1.15, body.position.z);
      scene.add(head);
      objects.push(head);

      animationData.militaryTeam.push({
        body: body,
        head: head,
        startX: body.position.x,
        startZ: body.position.z,
        phase: i * 0.3
      });
    }
  }

  function createFogLayers() {
    var fogMat = createMaterial(0x333333);
    fogMat.transparent = true;
    fogMat.opacity = 0.3;

    for (var i = 0; i < 2; i++) {
      var fogGeo = new THREE.BoxGeometry(400, 0.5, 400);
      var fog = new THREE.Mesh(fogGeo, fogMat.clone());
      fog.position.y = 0.5 + i * 1.5;
      scene.add(fog);
      objects.push(fog);
      materials.push(fog.material);

      animationData.fogLayers.push({
        mesh: fog,
        baseMat: fog.material,
        phase: i * Math.PI,
        offsetX: 0,
        offsetZ: 0
      });
    }
  }

  function createLanterns() {
    var poleMat = createMaterial(0x2d2d2d);
    var lanternMat = createMaterial(0xff8800, 0xff4400, 1);

    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var radius = 120;
      var posX = Math.cos(angle) * radius;
      var posZ = Math.sin(angle) * radius;

      var poleGeo = new THREE.BoxGeometry(0.08, 3, 0.08);
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(posX, 1.5, posZ);
      scene.add(pole);
      objects.push(pole);

      var lanternGeo = new THREE.SphereGeometry(0.3, 8, 8);
      var lantern = new THREE.Mesh(lanternGeo, lanternMat.clone());
      lantern.position.set(posX, 3.2, posZ);
      scene.add(lantern);
      objects.push(lantern);
      materials.push(lantern.material);

      animationData.lanterns.push({
        mesh: lantern,
        mat: lantern.material,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function createChapel() {
    var stoneMat = createMaterial(0x666666);
    var darkMat = createMaterial(0x1a1a1a);

    var wallGeo = new THREE.BoxGeometry(3, 4, 4);
    var wall = new THREE.Mesh(wallGeo, stoneMat);
    wall.position.set(-120, 2, -120);
    scene.add(wall);
    objects.push(wall);

    var roofGeo = new THREE.BoxGeometry(3.2, 1, 4.2);
    var roof = new THREE.Mesh(roofGeo, createMaterial(0x444444));
    roof.position.set(-120, 4, -120);
    scene.add(roof);
    objects.push(roof);

    var crossVGeo = new THREE.BoxGeometry(0.3, 1.5, 0.2);
    var crossV = new THREE.Mesh(crossVGeo, stoneMat);
    crossV.position.set(-120, 5.2, -120);
    scene.add(crossV);
    objects.push(crossV);

    var crossHGeo = new THREE.BoxGeometry(1, 0.3, 0.2);
    var crossH = new THREE.Mesh(crossHGeo, stoneMat);
    crossH.position.set(-120, 5, -120);
    scene.add(crossH);
    objects.push(crossH);

    var windowGeo = new THREE.BoxGeometry(1.5, 1, 0.05);
    var window = new THREE.Mesh(windowGeo, darkMat);
    window.position.set(-120, 2.5, -122);
    scene.add(window);
    objects.push(window);
  }

  function createMachineGunNests() {
    var sandMat = createMaterial(0x8b7355);

    for (var i = 0; i < 2; i++) {
      var nestX = -80 + i * 160;
      var nestZ = 80;

      for (var j = 0; j < 3; j++) {
        var bagGeo = new THREE.BoxGeometry(0.4, 0.3, 0.4);
        var bag = new THREE.Mesh(bagGeo, sandMat);
        bag.position.set(nestX + j * 0.5 - 0.5, 0.15 + j * 0.35, nestZ);
        scene.add(bag);
        objects.push(bag);
      }

      var gunnerGeo = new THREE.BoxGeometry(0.35, 0.4, 0.2);
      var gunnerMat = createMaterial(0x556b2f);
      var gunner = new THREE.Mesh(gunnerGeo, gunnerMat);
      gunner.position.set(nestX, 0.25, nestZ + 0.5);
      gunner.rotation.z = Math.PI * 0.3;
      scene.add(gunner);
      objects.push(gunner);

      var barrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
      var barrelMat = createMaterial(0x2d2d2d);
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(nestX + 0.3, 0.5, nestZ + 1);
      barrel.rotation.z = Math.PI * 0.4;
      scene.add(barrel);
      objects.push(barrel);
    }
  }

  function createMassGravePit() {
    var pitGeo = new THREE.BoxGeometry(8, 1.5, 6);
    var pitMat = createMaterial(0x0f0f0f);
    var pit = new THREE.Mesh(pitGeo, pitMat);
    pit.position.set(100, -0.8, 100);
    scene.add(pit);
    objects.push(pit);

    var rimMat = createMaterial(0x3d2817);
    var rimGeo = new THREE.BoxGeometry(9, 0.2, 7);
    var rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(100, 0, 100);
    scene.add(rim);
    objects.push(rim);
  }

  function createBurningBarrels() {
    var barrelMat = createMaterial(0x2d2d2d);
    var fireMat = createMaterial(0xff4400, 0xff6600, 1.5);

    for (var i = 0; i < 3; i++) {
      var posX = -60 + i * 60;
      var posZ = 140;

      var barrelGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.7, 8);
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(posX, 0.35, posZ);
      scene.add(barrel);
      objects.push(barrel);

      var fireGeo = new THREE.SphereGeometry(0.5, 8, 8);
      var fire = new THREE.Mesh(fireGeo, fireMat.clone());
      fire.position.set(posX, 1.2, posZ);
      scene.add(fire);
      objects.push(fire);
      materials.push(fire.material);

      animationData.burningBarrels.push({
        mesh: fire,
        mat: fire.material,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function createStonePathway() {
    var pathMat = createMaterial(0xaaaaaa);
    var pathPositions = [
      { x: 0, z: 180 },
      { x: -40, z: 120 },
      { x: -80, z: 60 },
      { x: -100, z: 0 },
      { x: -80, z: -60 },
      { x: 0, z: -100 },
      { x: 80, z: -60 },
      { x: 120, z: 0 }
    ];

    for (var i = 0; i < pathPositions.length; i++) {
      var pos = pathPositions[i];
      var pathGeo = new THREE.BoxGeometry(1.5, 0.05, 1.5);
      var pathTile = new THREE.Mesh(pathGeo, pathMat);
      pathTile.position.set(pos.x, 0.025, pos.z);
      scene.add(pathTile);
      objects.push(pathTile);
    }
  }

  function createNightSky() {
    var skyGeo = new THREE.BoxGeometry(500, 350, 500);
    var skyMat = createMaterial(0x0a0a1a);
    var sky = new THREE.Mesh(skyGeo, skyMat);
    sky.position.y = 175;
    scene.add(sky);
    objects.push(sky);

    var starMat = createMaterial(0xffffff, 0xffffff, 0.8);
    for (var i = 0; i < 40; i++) {
      var starGeo = new THREE.SphereGeometry(0.3, 4, 4);
      var star = new THREE.Mesh(starGeo, starMat.clone());
      star.position.set(
        -250 + Math.random() * 500,
        100 + Math.random() * 200,
        -250 + Math.random() * 500
      );
      scene.add(star);
      objects.push(star);
      materials.push(star.material);
    }
  }

  function createCommandPostTent() {
    var tentMat = createMaterial(0x556b2f);
    var tentGeo = new THREE.BoxGeometry(3, 2, 2.5);
    var tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.set(-180, 1, -180);
    scene.add(tent);
    objects.push(tent);

    var antennaPoleGeo = new THREE.BoxGeometry(0.05, 2, 0.05);
    var antennaMat = createMaterial(0x2d2d2d);
    var antenna = new THREE.Mesh(antennaPoleGeo, antennaMat);
    antenna.position.set(-180, 3.2, -180);
    scene.add(antenna);
    objects.push(antenna);
  }

  function createHUD() {
    hudOverlay = document.createElement('div');
    hudOverlay.id = 'cemetery-hud';
    hudOverlay.style.position = 'fixed';
    hudOverlay.style.top = '20px';
    hudOverlay.style.left = '20px';
    hudOverlay.style.fontFamily = 'monospace';
    hudOverlay.style.fontSize = '16px';
    hudOverlay.style.color = '#00ff00';
    hudOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudOverlay.style.padding = '10px 15px';
    hudOverlay.style.border = '2px solid #00ff00';
    hudOverlay.style.zIndex = '1000';
    hudOverlay.style.fontWeight = 'bold';
    hudOverlay.innerHTML =
      'SECTOR CLEAR: ' + gameState.sectorsCleared + '/3<br>' +
      'MILITIA DOWN: ' + gameState.militiaKilled + '/6<br>' +
      'CHAPEL STATUS: ' + gameState.chapelStatus;
    document.body.appendChild(hudOverlay);

    var keyPressData = { h: false, c: false, hTime: 0, cTime: 0 };
    document.addEventListener('keydown', function(e) {
      if (e.key === 'h' || e.key === 'H') {
        if (!keyPressData.h) {
          keyPressData.h = true;
          keyPressData.hTime = Date.now();
        }
      }
      if (e.key === 'c' || e.key === 'C') {
        if (!keyPressData.c) {
          keyPressData.c = true;
          keyPressData.cTime = Date.now();
          if (keyPressData.h && Math.abs(keyPressData.cTime - keyPressData.hTime) < 400) {
            gameState.chapelStatus = gameState.chapelStatus === 'HOSTILE' ? 'CLEAR' : 'HOSTILE';
            updateHUD();
          }
          keyPressData.c = false;
        }
      }
    });

    document.addEventListener('keyup', function(e) {
      if (e.key === 'h' || e.key === 'H') {
        keyPressData.h = false;
      }
    });
  }

  function updateHUD() {
    if (hudOverlay) {
      hudOverlay.innerHTML =
        'SECTOR CLEAR: ' + gameState.sectorsCleared + '/3<br>' +
        'MILITIA DOWN: ' + gameState.militiaKilled + '/6<br>' +
        'CHAPEL STATUS: ' + gameState.chapelStatus;
    }
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    createCemeteryGround();
    createTombstones();
    createMausoleums();
    createIronFence();
    createTrees();
    createMilitiaSoldiers();
    createMilitaryTeam();
    createFogLayers();
    createLanterns();
    createChapel();
    createMachineGunNests();
    createMassGravePit();
    createBurningBarrels();
    createStonePathway();
    createNightSky();
    createCommandPostTent();
    createHUD();
  }

  function update(delta) {
    gameState.time += delta;

    for (var i = 0; i < animationData.militiaSoldiers.length; i++) {
      var soldier = animationData.militiaSoldiers[i];
      soldier.bobPhase += delta * 2;
      soldier.body.position.y = soldier.baseY + Math.sin(soldier.bobPhase) * 0.15;
    }

    for (var i = 0; i < animationData.lanterns.length; i++) {
      var lantern = animationData.lanterns[i];
      lantern.phase += delta * 3;
      lantern.mat.emissiveIntensity = 0.7 + Math.sin(lantern.phase) * 0.4;
    }

    for (var i = 0; i < animationData.fogLayers.length; i++) {
      var fog = animationData.fogLayers[i];
      fog.offsetX += Math.cos(gameState.time * 0.3 + i) * 0.05;
      fog.offsetZ += Math.sin(gameState.time * 0.3 + i) * 0.05;
      fog.mesh.position.x = fog.offsetX;
      fog.mesh.position.z = fog.offsetZ;
      fog.baseMat.opacity = 0.2 + Math.sin(gameState.time + fog.phase) * 0.15;
    }

    for (var i = 0; i < animationData.burningBarrels.length; i++) {
      var barrel = animationData.burningBarrels[i];
      barrel.phase += delta * 2.5;
      barrel.mat.emissiveIntensity = 1 + Math.sin(barrel.phase) * 0.5;
    }

    for (var i = 0; i < animationData.militaryTeam.length; i++) {
      var soldier = animationData.militaryTeam[i];
      var advanceAmount = Math.min(gameState.time * 15, 200);
      soldier.body.position.z = soldier.startZ - advanceAmount;
      soldier.head.position.z = soldier.body.position.z;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
    }

    for (var i = 0; i < materials.length; i++) {
      materials[i].dispose();
    }

    objects = [];
    materials = [];
    animationData.militiaSoldiers = [];
    animationData.lanterns = [];
    animationData.fogLayers = [];
    animationData.burningBarrels = [];
    animationData.militaryTeam = [];

    if (hudOverlay && hudOverlay.parentNode) {
      hudOverlay.parentNode.removeChild(hudOverlay);
    }
    hudOverlay = null;

    gameState.sectorsCleared = 0;
    gameState.militiaKilled = 0;
    gameState.chapelStatus = 'HOSTILE';
    gameState.time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
