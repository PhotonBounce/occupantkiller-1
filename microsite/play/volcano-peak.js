window.VolcanoPeak = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lavaBombs = [];
  var gasVents = [];
  var lavaLakeGlow = null;
  var time = 0;

  function createVolcanoCone() {
    var coneGeom = new THREE.ConeGeometry(32, 35, 48, 16);
    var coneMat = new THREE.MeshPhongMaterial({ color: 0x2a1a0f });
    var cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.set(0, 17.5, 0);
    scene.add(cone);
    objects.push(cone);

    var rimGeom = new THREE.BoxGeometry(24, 2, 24);
    var rimMat = new THREE.MeshPhongMaterial({ color: 0x1a0a00 });
    var rim = new THREE.Mesh(rimGeom, rimMat);
    rim.position.set(0, 35, 0);
    scene.add(rim);
    objects.push(rim);

    var craterEdge1 = new THREE.BoxGeometry(26, 3, 2);
    craterEdge1.position.set(0, 35, 0);
    var craterEdgeMat = new THREE.MeshPhongMaterial({ color: 0x3a2a1a });
    var craterEdgeMesh1 = new THREE.Mesh(craterEdge1, craterEdgeMat);
    craterEdgeMesh1.position.set(0, 35, 12);
    scene.add(craterEdgeMesh1);
    objects.push(craterEdgeMesh1);

    var craterEdge2 = new THREE.Mesh(craterEdge1, craterEdgeMat);
    craterEdge2.position.set(0, 35, -12);
    scene.add(craterEdge2);
    objects.push(craterEdge2);

    var craterEdge3 = new THREE.BoxGeometry(2, 3, 26);
    var craterEdgeMesh3 = new THREE.Mesh(craterEdge3, craterEdgeMat);
    craterEdgeMesh3.position.set(12, 35, 0);
    scene.add(craterEdgeMesh3);
    objects.push(craterEdgeMesh3);

    var craterEdge4 = new THREE.Mesh(craterEdge3, craterEdgeMat);
    craterEdge4.position.set(-12, 35, 0);
    scene.add(craterEdge4);
    objects.push(craterEdge4);
  }

  function createCalderaRim() {
    var rimWall1 = new THREE.BoxGeometry(28, 4, 2);
    var rimMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var mesh1 = new THREE.Mesh(rimWall1, rimMat);
    mesh1.position.set(0, 36.5, 14);
    scene.add(mesh1);
    objects.push(mesh1);

    var mesh2 = new THREE.Mesh(rimWall1, rimMat);
    mesh2.position.set(0, 36.5, -14);
    scene.add(mesh2);
    objects.push(mesh2);

    var rimWall2 = new THREE.BoxGeometry(2, 4, 28);
    var mesh3 = new THREE.Mesh(rimWall2, rimMat);
    mesh3.position.set(14, 36.5, 0);
    scene.add(mesh3);
    objects.push(mesh3);

    var mesh4 = new THREE.Mesh(rimWall2, rimMat);
    mesh4.position.set(-14, 36.5, 0);
    scene.add(mesh4);
    objects.push(mesh4);

    var rimCorner1 = new THREE.BoxGeometry(3, 4, 3);
    var cornerMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * 13;
      var z = Math.sin(angle) * 13;
      var corner = new THREE.Mesh(rimCorner1, cornerMat);
      corner.position.set(x, 36.5, z);
      scene.add(corner);
      objects.push(corner);
    }
  }

  function createLavaLake() {
    var lavaGeom = new THREE.BoxGeometry(14, 1, 14);
    var lavaMat = new THREE.MeshPhongMaterial({
      color: 0xff4400,
      emissive: 0xff2200,
      shininess: 100
    });
    lavaLakeGlow = new THREE.Mesh(lavaGeom, lavaMat);
    lavaLakeGlow.position.set(0, 27, 0);
    scene.add(lavaLakeGlow);
    objects.push(lavaLakeGlow);

    var lavaDepth = new THREE.BoxGeometry(14, 6, 14);
    var lavaDeepMat = new THREE.MeshPhongMaterial({ color: 0x4a2200 });
    var lavaDeep = new THREE.Mesh(lavaDepth, lavaDeepMat);
    lavaDeep.position.set(0, 22, 0);
    scene.add(lavaDeep);
    objects.push(lavaDeep);
  }

  function createMilitaryBase() {
    var barracksGeom = new THREE.BoxGeometry(8, 5, 12);
    var militaryMat = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    var barracksMesh = new THREE.Mesh(barracksGeom, militaryMat);
    barracksMesh.position.set(-18, 12, 0);
    barracksMesh.rotation.z = 0.2;
    scene.add(barracksMesh);
    objects.push(barracksMesh);

    var barracks2 = new THREE.Mesh(barracksGeom, militaryMat);
    barracks2.position.set(18, 12, 0);
    barracks2.rotation.z = -0.2;
    scene.add(barracks2);
    objects.push(barracks2);

    var bunker1Geom = new THREE.BoxGeometry(6, 4, 8);
    var bunkerMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var bunker1 = new THREE.Mesh(bunker1Geom, bunkerMat);
    bunker1.position.set(-12, 8, 15);
    scene.add(bunker1);
    objects.push(bunker1);

    var bunker2 = new THREE.Mesh(bunker1Geom, bunkerMat);
    bunker2.position.set(12, 8, 15);
    scene.add(bunker2);
    objects.push(bunker2);

    var bunker3 = new THREE.Mesh(bunker1Geom, bunkerMat);
    bunker3.position.set(-12, 8, -15);
    scene.add(bunker3);
    objects.push(bunker3);

    var bunker4 = new THREE.Mesh(bunker1Geom, bunkerMat);
    bunker4.position.set(12, 8, -15);
    scene.add(bunker4);
    objects.push(bunker4);

    var commandCenterGeom = new THREE.BoxGeometry(10, 6, 10);
    var commandMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var commandCenter = new THREE.Mesh(commandCenterGeom, commandMat);
    commandCenter.position.set(0, 10, 0);
    scene.add(commandCenter);
    objects.push(commandCenter);

    var storageGeom = new THREE.BoxGeometry(7, 5, 9);
    var storageMat = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    var storage1 = new THREE.Mesh(storageGeom, storageMat);
    storage1.position.set(-16, 10, -18);
    scene.add(storage1);
    objects.push(storage1);

    var storage2 = new THREE.Mesh(storageGeom, storageMat);
    storage2.position.set(16, 10, -18);
    scene.add(storage2);
    objects.push(storage2);
  }

  function createHeatShieldWalls() {
    var shieldGeom = new THREE.BoxGeometry(20, 6, 1);
    var shieldMat = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      shininess: 200
    });
    var shield1 = new THREE.Mesh(shieldGeom, shieldMat);
    shield1.position.set(0, 15, 22);
    scene.add(shield1);
    objects.push(shield1);

    var shield2 = new THREE.Mesh(shieldGeom, shieldMat);
    shield2.position.set(0, 15, -22);
    scene.add(shield2);
    objects.push(shield2);

    var shieldGeom2 = new THREE.BoxGeometry(1, 6, 20);
    var shield3 = new THREE.Mesh(shieldGeom2, shieldMat);
    shield3.position.set(22, 15, 0);
    scene.add(shield3);
    objects.push(shield3);

    var shield4 = new THREE.Mesh(shieldGeom2, shieldMat);
    shield4.position.set(-22, 15, 0);
    scene.add(shield4);
    objects.push(shield4);
  }

  function createImpactCraters() {
    var craterPositions = [
      [-20, 6, -10], [20, 6, -15], [-25, 5, 8], [22, 6, 12],
      [-15, 7, 20], [18, 7, -22], [-10, 8, 15], [14, 7, 18]
    ];

    for (var i = 0; i < craterPositions.length; i++) {
      var craterGeom = new THREE.BoxGeometry(5, 2, 5);
      var craterMat = new THREE.MeshPhongMaterial({ color: 0x1a0a00 });
      var crater = new THREE.Mesh(craterGeom, craterMat);
      crater.position.set(craterPositions[i][0], craterPositions[i][1], craterPositions[i][2]);
      scene.add(crater);
      objects.push(crater);

      var rimGeom = new THREE.BoxGeometry(6, 1, 6);
      var rimMat = new THREE.MeshPhongMaterial({ color: 0x4a3a2a });
      var rim = new THREE.Mesh(rimGeom, rimMat);
      rim.position.set(craterPositions[i][0], craterPositions[i][1] + 1.5, craterPositions[i][2]);
      scene.add(rim);
      objects.push(rim);
    }
  }

  function createLavaChannels() {
    var channelGeom = new THREE.BoxGeometry(3, 1, 12);
    var channelMat = new THREE.MeshPhongMaterial({
      color: 0xff6600,
      emissive: 0xff3300
    });

    var channel1 = new THREE.Mesh(channelGeom, channelMat);
    channel1.position.set(-15, 8, 0);
    channel1.rotation.z = 0.3;
    scene.add(channel1);
    objects.push(channel1);

    var channel2 = new THREE.Mesh(channelGeom, channelMat);
    channel2.position.set(15, 8, 0);
    channel2.rotation.z = -0.3;
    scene.add(channel2);
    objects.push(channel2);

    var channel3 = new THREE.Mesh(channelGeom, channelMat);
    channel3.position.set(0, 8, 15);
    channel3.rotation.x = 0.3;
    scene.add(channel3);
    objects.push(channel3);

    var channel4 = new THREE.Mesh(channelGeom, channelMat);
    channel4.position.set(0, 8, -15);
    channel4.rotation.x = -0.3;
    scene.add(channel4);
    objects.push(channel4);
  }

  function createResearchStation() {
    var stationGeom = new THREE.BoxGeometry(8, 5, 8);
    var stationMat = new THREE.MeshPhongMaterial({ color: 0x4a5a6a });
    var station = new THREE.Mesh(stationGeom, stationMat);
    station.position.set(-20, 12, -20);
    scene.add(station);
    objects.push(station);

    for (var i = 0; i < 4; i++) {
      var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
      var mastMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
      var mast = new THREE.Mesh(mastGeom, mastMat);
      var angle = (i / 4) * Math.PI * 2;
      var x = -20 + Math.cos(angle) * 3;
      var z = -20 + Math.sin(angle) * 3;
      mast.position.set(x, 15, z);
      scene.add(mast);
      objects.push(mast);

      var antennaGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 6);
      var antennaMat = new THREE.MeshPhongMaterial({ color: 0xff6600 });
      var antenna = new THREE.Mesh(antennaGeom, antennaMat);
      antenna.position.set(x, 19, z);
      scene.add(antenna);
      objects.push(antenna);
    }
  }

  function createRopeLadders() {
    var ladderPositions = [
      [-24, 20, 8],
      [24, 20, -8],
      [-10, 25, 22],
      [10, 25, -22]
    ];

    for (var i = 0; i < ladderPositions.length; i++) {
      var pos = ladderPositions[i];
      var points = [];
      for (var j = 0; j <= 10; j++) {
        var yPos = pos[1] - (j * 1.5);
        points.push(new THREE.Vector3(pos[0], yPos, pos[2]));
      }

      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      objects.push(line);

      for (var k = 0; k <= 10; k++) {
        var rungGeom = new THREE.BoxGeometry(2, 0.3, 0.2);
        var rungMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        var rung = new THREE.Mesh(rungGeom, rungMat);
        rung.position.set(pos[0], pos[1] - (k * 1.5), pos[2]);
        scene.add(rung);
        objects.push(rung);
      }
    }
  }

  function createLavaFlowPlatform() {
    var platformGeom = new THREE.BoxGeometry(6, 1, 8);
    var platformMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(0, 10, -18);
    scene.add(platform);
    objects.push(platform);

    var supportGeom = new THREE.BoxGeometry(1, 8, 1);
    var supportMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var support1 = new THREE.Mesh(supportGeom, supportMat);
    support1.position.set(-2.5, 6, -18);
    scene.add(support1);
    objects.push(support1);

    var support2 = new THREE.Mesh(supportGeom, supportMat);
    support2.position.set(2.5, 6, -18);
    scene.add(support2);
    objects.push(support2);

    var railGeom = new THREE.BoxGeometry(0.3, 1.5, 8);
    var railMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var rail1 = new THREE.Mesh(railGeom, railMat);
    rail1.position.set(-3.2, 10.8, -18);
    scene.add(rail1);
    objects.push(rail1);

    var rail2 = new THREE.Mesh(railGeom, railMat);
    rail2.position.set(3.2, 10.8, -18);
    scene.add(rail2);
    objects.push(rail2);
  }

  function createAntiAirEmplacements() {
    var emplacementPositions = [
      [-16, 37, 12],
      [16, 37, 12],
      [-16, 37, -12],
      [16, 37, -12]
    ];

    for (var i = 0; i < emplacementPositions.length; i++) {
      var pos = emplacementPositions[i];
      var gunBaseGeom = new THREE.BoxGeometry(4, 2, 4);
      var gunBaseMat = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
      var gunBase = new THREE.Mesh(gunBaseGeom, gunBaseMat);
      gunBase.position.set(pos[0], pos[1], pos[2]);
      scene.add(gunBase);
      objects.push(gunBase);

      var turretGeom = new THREE.CylinderGeometry(1.2, 1.2, 1, 8);
      var turretMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
      var turret = new THREE.Mesh(turretGeom, turretMat);
      turret.position.set(pos[0], pos[1] + 2, pos[2]);
      scene.add(turret);
      objects.push(turret);

      var barrelGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
      var barrelMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
      var barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.position.set(pos[0], pos[1] + 3, pos[2]);
      barrel.rotation.z = Math.PI / 4;
      scene.add(barrel);
      objects.push(barrel);

      var shieldGeom = new THREE.BoxGeometry(5, 2.5, 1);
      var shieldMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
      var shield = new THREE.Mesh(shieldGeom, shieldMat);
      shield.position.set(pos[0], pos[1] + 1.5, pos[2] - 2.5);
      scene.add(shield);
      objects.push(shield);
    }
  }

  function createHelicopterPlatform() {
    var padGeom = new THREE.BoxGeometry(12, 1, 12);
    var padMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    var pad = new THREE.Mesh(padGeom, padMat);
    pad.position.set(-24, 9, 20);
    scene.add(pad);
    objects.push(pad);

    var cornerGeom = new THREE.BoxGeometry(1, 0.5, 1);
    var cornerMat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    for (var i = 0; i < 4; i++) {
      var corner = new THREE.Mesh(cornerGeom, cornerMat);
      var offsets = [[-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5]];
      corner.position.set(-24 + offsets[i][0], 9.5, 20 + offsets[i][1]);
      scene.add(corner);
      objects.push(corner);
    }

    var chopperBodyGeom = new THREE.BoxGeometry(8, 3, 3);
    var chopperMat = new THREE.MeshPhongMaterial({ color: 0x2a5a2a });
    var chopperBody = new THREE.Mesh(chopperBodyGeom, chopperMat);
    chopperBody.position.set(-24, 11, 20);
    scene.add(chopperBody);
    objects.push(chopperBody);

    var cockpitGeom = new THREE.BoxGeometry(2, 2, 2);
    var cockpitMat = new THREE.MeshPhongMaterial({ color: 0x4a7a4a });
    var cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
    cockpit.position.set(-20, 13, 20);
    scene.add(cockpit);
    objects.push(cockpit);

    var tailGeom = new THREE.BoxGeometry(1, 1.5, 2);
    var tailMat = new THREE.MeshPhongMaterial({ color: 0x2a5a2a });
    var tail = new THREE.Mesh(tailGeom, tailMat);
    tail.position.set(-27, 11, 20);
    scene.add(tail);
    objects.push(tail);
  }

  function createLavaRockFormations() {
    var formations = [
      [-26, 10, 0], [26, 10, 0], [0, 10, 26], [0, 10, -26],
      [-22, 8, 18], [22, 8, -18], [-18, 9, -22], [18, 9, 22],
      [-28, 6, -8], [28, 6, 8], [-8, 7, -28], [8, 7, 28]
    ];

    for (var i = 0; i < formations.length; i++) {
      var pos = formations[i];
      var boulderGeom = new THREE.BoxGeometry(3, 2, 3);
      var boulderMat = new THREE.MeshPhongMaterial({ color: 0x1a0a00 });
      var boulder = new THREE.Mesh(boulderGeom, boulderMat);
      boulder.position.set(pos[0], pos[1], pos[2]);
      boulder.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      scene.add(boulder);
      objects.push(boulder);

      var smallBoulderGeom = new THREE.BoxGeometry(2, 1.5, 2);
      for (var j = 0; j < 2; j++) {
        var smallBoulder = new THREE.Mesh(smallBoulderGeom, boulderMat);
        var offsetX = (Math.random() - 0.5) * 4;
        var offsetZ = (Math.random() - 0.5) * 4;
        smallBoulder.position.set(pos[0] + offsetX, pos[1] - 1.5, pos[2] + offsetZ);
        smallBoulder.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
        scene.add(smallBoulder);
        objects.push(smallBoulder);
      }
    }
  }

  function createVolcanicVents() {
    var ventPositions = [
      [-8, 25, 8], [8, 25, 8], [-8, 25, -8], [8, 25, -8],
      [-12, 28, 0], [12, 28, 0], [0, 28, 12], [0, 28, -12]
    ];

    for (var i = 0; i < ventPositions.length; i++) {
      var vent = {
        position: new THREE.Vector3(ventPositions[i][0], ventPositions[i][1], ventPositions[i][2]),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          Math.random() * 0.5 + 0.5,
          (Math.random() - 0.5) * 0.3
        ),
        life: 0,
        maxLife: 3
      };
      gasVents.push(vent);
    }
  }

  function createLavaBombs() {
    for (var i = 0; i < 6; i++) {
      var bomb = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          30,
          (Math.random() - 0.5) * 20
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() * 0.5 + 1) * 8,
          (Math.random() - 0.5) * 15
        ),
        life: 0,
        maxLife: 5,
        mesh: null
      };

      var bombGeom = new THREE.SphereGeometry(0.8, 8, 8);
      var bombMat = new THREE.MeshPhongMaterial({
        color: 0xff4400,
        emissive: 0xff2200
      });
      bomb.mesh = new THREE.Mesh(bombGeom, bombMat);
      bomb.mesh.position.copy(bomb.position);
      scene.add(bomb.mesh);
      objects.push(bomb.mesh);
      lavaBombs.push(bomb);
    }
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;

    createVolcanoCone();
    createCalderaRim();
    createLavaLake();
    createMilitaryBase();
    createHeatShieldWalls();
    createImpactCraters();
    createLavaChannels();
    createResearchStation();
    createRopeLadders();
    createLavaFlowPlatform();
    createAntiAirEmplacements();
    createHelicopterPlatform();
    createLavaRockFormations();
    createVolcanicVents();
    createLavaBombs();
  }

  function updateLavaLake(delta) {
    if (lavaLakeGlow) {
      var pulse = 0.5 + 0.3 * Math.sin(time * 2);
      lavaLakeGlow.material.emissive.setHSL(0.05, 1, pulse * 0.4);
    }
  }

  function updateLavaBombs(delta) {
    var gravity = 9.8;

    for (var i = lavaBombs.length - 1; i >= 0; i--) {
      var bomb = lavaBombs[i];
      bomb.life += delta;

      if (bomb.life < bomb.maxLife) {
        bomb.velocity.y -= gravity * delta;
        bomb.position.x += bomb.velocity.x * delta;
        bomb.position.y += bomb.velocity.y * delta;
        bomb.position.z += bomb.velocity.z * delta;

        if (bomb.mesh) {
          bomb.mesh.position.copy(bomb.position);
          var rotation = bomb.life / bomb.maxLife;
          bomb.mesh.rotation.x += rotation * 0.1;
          bomb.mesh.rotation.z += rotation * 0.15;
        }

        if (bomb.position.y < 5) {
          scene.remove(bomb.mesh);
          objects.splice(objects.indexOf(bomb.mesh), 1);
          lavaBombs.splice(i, 1);
        }
      }
    }

    if (lavaBombs.length < 6 && Math.random() < 0.02) {
      var newBomb = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          30,
          (Math.random() - 0.5) * 20
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() * 0.5 + 1) * 8,
          (Math.random() - 0.5) * 15
        ),
        life: 0,
        maxLife: 5,
        mesh: null
      };

      var bombGeom = new THREE.SphereGeometry(0.8, 8, 8);
      var bombMat = new THREE.MeshPhongMaterial({
        color: 0xff4400,
        emissive: 0xff2200
      });
      newBomb.mesh = new THREE.Mesh(bombGeom, bombMat);
      newBomb.mesh.position.copy(newBomb.position);
      scene.add(newBomb.mesh);
      objects.push(newBomb.mesh);
      lavaBombs.push(newBomb);
    }
  }

  function updateGasVents(delta) {
    for (var i = gasVents.length - 1; i >= 0; i--) {
      var vent = gasVents[i];
      vent.life += delta;

      if (vent.life > vent.maxLife) {
        vent.life = 0;
      }

      var ventGeom = new THREE.SphereGeometry(0.3 + vent.life * 0.4, 6, 6);
      var opacity = 1 - (vent.life / vent.maxLife);
      var ventMat = new THREE.MeshPhongMaterial({
        color: 0x888888,
        transparent: true,
        opacity: opacity * 0.5,
        emissive: 0x444444
      });

      if (i < gasVents.length) {
        var ventMesh = new THREE.Mesh(ventGeom, ventMat);
        var newPos = vent.position.clone().add(
          vent.velocity.clone().multiplyScalar(vent.life)
        );
        ventMesh.position.copy(newPos);
        scene.add(ventMesh);

        var cleanupTimer = function(mesh) {
          return setTimeout(function() {
            scene.remove(mesh);
            var idx = objects.indexOf(mesh);
            if (idx > -1) {
              objects.splice(idx, 1);
            }
          }, 100);
        };
        cleanupTimer(ventMesh);
      }
    }
  }

  function update(delta) {
    time += delta;
    updateLavaLake(delta);
    updateLavaBombs(delta);
    updateGasVents(delta);
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    lavaBombs = [];
    gasVents = [];
    lavaLakeGlow = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
