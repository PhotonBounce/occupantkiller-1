window.CoastalFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var animations = {
    searchlightAngle: 0,
    gunElevation: 0,
    flagWave: 0,
    oceanWave: 0,
    wavePhase: 0
  };

  var init = function(s, c) {
    scene = s;
    camera = c;
    meshes = [];

    var fortressGroup = new THREE.Group();
    scene.add(fortressGroup);

    buildSeaSurface(fortressGroup);
    buildCliffBluff(fortressGroup);
    buildCasemate(fortressGroup);
    buildNavalGun(fortressGroup);
    buildObservationTower(fortressGroup);
    buildInfantryTrenches(fortressGroup);
    buildCommunicationTrenches(fortressGroup);
    buildMGBunker(fortressGroup);
    buildFlameThrowerPosition(fortressGroup);
    buildBeachObstacles(fortressGroup);
    buildAmmunitionStorage(fortressGroup);
    buildCrewQuarters(fortressGroup);
    buildPeriscopeMount(fortressGroup);
    buildEmergencyExitTunnel(fortressGroup);
    buildFlagMast(fortressGroup);
    buildSearchlightMount(fortressGroup);
  };

  var buildSeaSurface = function(parent) {
    var seaGeom = new THREE.BoxGeometry(400, 3, 300);
    var seaMat = new THREE.MeshLambertMaterial({ color: 0x1a4d7a });
    var sea = new THREE.Mesh(seaGeom, seaMat);
    sea.position.set(150, -8, 80);
    sea.castShadow = true;
    sea.receiveShadow = true;
    parent.add(sea);
    meshes.push(sea);

    var waveGeom = new THREE.BoxGeometry(420, 1, 320);
    var waveMat = new THREE.MeshLambertMaterial({ color: 0x2a6d9a });
    var wave = new THREE.Mesh(waveGeom, waveMat);
    wave.position.set(150, -5, 80);
    wave.userData.isWave = true;
    parent.add(wave);
    meshes.push(wave);
  };

  var buildCliffBluff = function(parent) {
    var cliffGeom = new THREE.BoxGeometry(180, 25, 80);
    var cliffMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
    var cliff = new THREE.Mesh(cliffGeom, cliffMat);
    cliff.position.set(-40, -5, -20);
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    parent.add(cliff);
    meshes.push(cliff);
  };

  var buildCasemate = function(parent) {
    var caseGeom = new THREE.BoxGeometry(45, 18, 55);
    var caseMat = new THREE.MeshLambertMaterial({ color: 0x6b7170 });
    var casemate = new THREE.Mesh(caseGeom, caseMat);
    casemate.position.set(0, 8, 0);
    casemate.castShadow = true;
    casemate.receiveShadow = true;
    casemate.userData.type = 'casemate';
    parent.add(casemate);
    meshes.push(casemate);

    var gunPortGeom = new THREE.BoxGeometry(8, 7, 12);
    var gunPortMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var gunPort = new THREE.Mesh(gunPortGeom, gunPortMat);
    gunPort.position.set(0, 4, 27);
    gunPort.castShadow = true;
    parent.add(gunPort);
    meshes.push(gunPort);

    var reinforcingBarGeom = new THREE.BoxGeometry(48, 2, 60);
    var reinforcingMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var reinforcing = new THREE.Mesh(reinforcingBarGeom, reinforcingMat);
    reinforcing.position.set(0, 16, 0);
    parent.add(reinforcing);
    meshes.push(reinforcing);
  };

  var buildNavalGun = function(parent) {
    var gunGroup = new THREE.Group();
    gunGroup.position.set(0, 20, 0);
    gunGroup.userData.type = 'gun';
    parent.add(gunGroup);

    var breechGeom = new THREE.CylinderGeometry(2.5, 2.5, 8, 16);
    var gunMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var breech = new THREE.Mesh(breechGeom, gunMat);
    breech.rotation.z = Math.PI / 2;
    breech.position.x = 0;
    gunGroup.add(breech);
    meshes.push(breech);

    var barrelGeom = new THREE.CylinderGeometry(1.8, 1.8, 48, 16);
    var barrel = new THREE.Mesh(barrelGeom, gunMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.x = 26;
    barrel.userData.isBarrel = true;
    gunGroup.add(barrel);
    meshes.push(barrel);

    var muzzleGeom = new THREE.CylinderGeometry(2.2, 1.8, 3, 16);
    var muzzle = new THREE.Mesh(muzzleGeom, gunMat);
    muzzle.rotation.z = Math.PI / 2;
    muzzle.position.x = 50;
    gunGroup.add(muzzle);
    meshes.push(muzzle);

    gunGroup.userData.gunGroup = gunGroup;
  };

  var buildObservationTower = function(parent) {
    var towerGeom = new THREE.BoxGeometry(12, 16, 12);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(-20, 22, -15);
    tower.castShadow = true;
    tower.receiveShadow = true;
    parent.add(tower);
    meshes.push(tower);

    var crownGeom = new THREE.BoxGeometry(8, 4, 8);
    var crownMat = new THREE.MeshLambertMaterial({ color: 0x6b7170 });
    var crown = new THREE.Mesh(crownGeom, crownMat);
    crown.position.set(-20, 32, -15);
    crown.castShadow = true;
    parent.add(crown);
    meshes.push(crown);

    var binGeom = new THREE.BoxGeometry(4, 2, 5);
    var binMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var binocLeft = new THREE.Mesh(binGeom, binMat);
    binocLeft.position.set(-22, 34, -13);
    binocLeft.rotation.y = Math.PI / 6;
    parent.add(binocLeft);
    meshes.push(binocLeft);

    var binocRight = new THREE.Mesh(binGeom, binMat);
    binocRight.position.set(-18, 34, -13);
    binocRight.rotation.y = -Math.PI / 6;
    parent.add(binocRight);
    meshes.push(binocRight);
  };

  var buildInfantryTrenches = function(parent) {
    var trenchGeom = new THREE.BoxGeometry(80, 6, 8);
    var trenchMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
    var trench1 = new THREE.Mesh(trenchGeom, trenchMat);
    trench1.position.set(20, 0, -40);
    trench1.receiveShadow = true;
    parent.add(trench1);
    meshes.push(trench1);

    var trench2 = new THREE.Mesh(trenchGeom, trenchMat);
    trench2.position.set(20, 0, 40);
    trench2.receiveShadow = true;
    parent.add(trench2);
    meshes.push(trench2);

    var trench3Geom = new THREE.BoxGeometry(6, 6, 90);
    var trench3 = new THREE.Mesh(trench3Geom, trenchMat);
    trench3.position.set(-25, 0, 0);
    trench3.receiveShadow = true;
    parent.add(trench3);
    meshes.push(trench3);
  };

  var buildCommunicationTrenches = function(parent) {
    var connGeom = new THREE.BoxGeometry(15, 4, 4);
    var connMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });

    var conn1 = new THREE.Mesh(connGeom, connMat);
    conn1.position.set(-5, 0, -20);
    conn1.rotation.z = Math.PI / 4;
    parent.add(conn1);
    meshes.push(conn1);

    var conn2 = new THREE.Mesh(connGeom, connMat);
    conn2.position.set(-5, 0, 20);
    conn2.rotation.z = -Math.PI / 4;
    parent.add(conn2);
    meshes.push(conn2);

    var conn3Geom = new THREE.BoxGeometry(20, 4, 4);
    var conn3 = new THREE.Mesh(conn3Geom, connMat);
    conn3.position.set(-40, 0, 0);
    conn3.receiveShadow = true;
    parent.add(conn3);
    meshes.push(conn3);
  };

  var buildMGBunker = function(parent) {
    var bunkerGeom = new THREE.BoxGeometry(18, 10, 20);
    var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
    var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
    bunker.position.set(35, 4, -50);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    parent.add(bunker);
    meshes.push(bunker);

    var slotGeom = new THREE.BoxGeometry(10, 4, 2);
    var slotMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var slot = new THREE.Mesh(slotGeom, slotMat);
    slot.position.set(35, 6, -59);
    parent.add(slot);
    meshes.push(slot);
  };

  var buildFlameThrowerPosition = function(parent) {
    var emplaceGeom = new THREE.BoxGeometry(10, 8, 12);
    var emplaceMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
    var emplace = new THREE.Mesh(emplaceGeom, emplaceMat);
    emplace.position.set(-35, 3, -50);
    emplace.castShadow = true;
    emplace.receiveShadow = true;
    parent.add(emplace);
    meshes.push(emplace);

    var nozzleGeom = new THREE.CylinderGeometry(0.8, 0.6, 6, 12);
    var nozzleMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(-35, 8, -56);
    parent.add(nozzle);
    meshes.push(nozzle);
  };

  var buildBeachObstacles = function(parent) {
    var hedgehogGroup = new THREE.Group();
    hedgehogGroup.position.set(80, -2, -60);
    parent.add(hedgehogGroup);

    var barGeom = new THREE.BoxGeometry(1.5, 15, 1);
    var barMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });

    var bar1 = new THREE.Mesh(barGeom, barMat);
    bar1.rotation.z = Math.PI / 2.5;
    hedgehogGroup.add(bar1);
    meshes.push(bar1);

    var bar2 = new THREE.Mesh(barGeom, barMat);
    bar2.rotation.x = Math.PI / 2.5;
    hedgehogGroup.add(bar2);
    meshes.push(bar2);

    var bar3 = new THREE.Mesh(barGeom, barMat);
    bar3.rotation.y = Math.PI / 2.5;
    hedgehogGroup.add(bar3);
    meshes.push(bar3);

    for (var i = 0; i < 6; i++) {
      var stakeGeom = new THREE.CylinderGeometry(0.6, 0.8, 8, 8);
      var stakeMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
      var stake = new THREE.Mesh(stakeGeom, stakeMat);
      stake.position.set(70 + i * 5, -1, -50 + i * 3);
      stake.castShadow = true;
      parent.add(stake);
      meshes.push(stake);
    }

    var wireGeom = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      60, 0, -70,  90, 0, -50,
      85, 0, -60,  75, 0, -40,
      70, 0, -65,  95, 0, -45
    ]);
    wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wireMat = new THREE.LineBasicMaterial({ color: 0x8a7a6a });
    var wireMesh = new THREE.LineSegments(wireGeom, wireMat);
    parent.add(wireMesh);
    meshes.push(wireMesh);
  };

  var buildDragonTeeth = function(parent) {
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 4; j++) {
        var toothGeom = new THREE.ConeGeometry(2, 6, 6);
        var toothMat = new THREE.MeshLambertMaterial({ color: 0x6b7170 });
        var tooth = new THREE.Mesh(toothGeom, toothMat);
        tooth.position.set(100 + i * 6, 1, -40 + j * 6);
        tooth.castShadow = true;
        parent.add(tooth);
        meshes.push(tooth);
      }
    }
  };

  var buildAmmunitionStorage = function(parent) {
    var storageGeom = new THREE.BoxGeometry(30, 12, 35);
    var storageMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
    var storage = new THREE.Mesh(storageGeom, storageMat);
    storage.position.set(-25, 5, 35);
    storage.castShadow = true;
    storage.receiveShadow = true;
    parent.add(storage);
    meshes.push(storage);

    var doorGeom = new THREE.BoxGeometry(6, 8, 1);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(-25, 6, 52);
    parent.add(door);
    meshes.push(door);
  };

  var buildCrewQuarters = function(parent) {
    var quartersGeom = new THREE.BoxGeometry(25, 10, 30);
    var quartersMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
    var quarters = new THREE.Mesh(quartersGeom, quartersMat);
    quarters.position.set(30, 5, 30);
    quarters.castShadow = true;
    quarters.receiveShadow = true;
    parent.add(quarters);
    meshes.push(quarters);

    var windowGeom = new THREE.BoxGeometry(3, 2, 0.5);
    var windowMat = new THREE.MeshLambertMaterial({ color: 0x1a3a5a });
    for (var i = 0; i < 3; i++) {
      var window1 = new THREE.Mesh(windowGeom, windowMat);
      window1.position.set(22, 7, 30 + i * 5);
      parent.add(window1);
      meshes.push(window1);
    }
  };

  var buildPeriscopeMount = function(parent) {
    var mountGeom = new THREE.BoxGeometry(4, 8, 4);
    var mountMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
    var mount = new THREE.Mesh(mountGeom, mountMat);
    mount.position.set(-15, 20, 10);
    parent.add(mount);
    meshes.push(mount);

    var pipeGeom = new THREE.CylinderGeometry(0.5, 0.5, 6, 12);
    var pipeMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
    var pipe = new THREE.Mesh(pipeGeom, pipeMat);
    pipe.position.set(-15, 26, 10);
    pipe.castShadow = true;
    parent.add(pipe);
    meshes.push(pipe);

    var lensGeom = new THREE.SphereGeometry(1, 16, 16);
    var lensMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
    var lens = new THREE.Mesh(lensGeom, lensMat);
    lens.position.set(-15, 32, 10);
    parent.add(lens);
    meshes.push(lens);
  };

  var buildEmergencyExitTunnel = function(parent) {
    var tunnelGeom = new THREE.BoxGeometry(5, 4, 8);
    var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
    var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
    tunnel.position.set(60, 1, 20);
    tunnel.castShadow = true;
    parent.add(tunnel);
    meshes.push(tunnel);

    var gateGeom = new THREE.BoxGeometry(4.5, 3.5, 0.5);
    var gateMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
    var gate = new THREE.Mesh(gateGeom, gateMat);
    gate.position.set(60, 1, 24);
    parent.add(gate);
    meshes.push(gate);
  };

  var buildFlagMast = function(parent) {
    var mastGeom = new THREE.CylinderGeometry(0.6, 0.8, 20, 12);
    var mastMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(50, 20, 0);
    mast.castShadow = true;
    parent.add(mast);
    meshes.push(mast);

    var flagGeom = new THREE.BoxGeometry(8, 5, 0.2);
    var flagMat = new THREE.MeshLambertMaterial({ color: 0x8a3a2a });
    var flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(54, 28, 0);
    flag.userData.isFlag = true;
    parent.add(flag);
    meshes.push(flag);

    var topKnotGeom = new THREE.SphereGeometry(1.2, 12, 12);
    var topKnotMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
    var topKnot = new THREE.Mesh(topKnotGeom, topKnotMat);
    topKnot.position.set(50, 32, 0);
    parent.add(topKnot);
    meshes.push(topKnot);
  };

  var buildSearchlightMount = function(parent) {
    var baseGeom = new THREE.BoxGeometry(8, 6, 8);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(-50, 12, 0);
    base.castShadow = true;
    parent.add(base);
    meshes.push(base);

    var mountGroup = new THREE.Group();
    mountGroup.position.set(-50, 18, 0);
    mountGroup.userData.type = 'searchlight';
    parent.add(mountGroup);

    var crazyPipeGeom = new THREE.CylinderGeometry(0.8, 0.8, 10, 12);
    var crayonMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
    var cradlePipe = new THREE.Mesh(crazyPipeGeom, crayonMat);
    cradlePipe.rotation.z = Math.PI / 2;
    mountGroup.add(cradlePipe);
    meshes.push(cradlePipe);

    var lensGeom = new THREE.SphereGeometry(2.5, 16, 16);
    var lensMat = new THREE.MeshLambertMaterial({ color: 0xffff99, emissive: 0xffaa00 });
    var searchLens = new THREE.Mesh(lensGeom, lensMat);
    searchLens.position.set(6, 0, 0);
    searchLens.userData.isSearchLight = true;
    mountGroup.add(searchLens);
    meshes.push(searchLens);

    mountGroup.userData.mountGroup = mountGroup;
  };

  var buildDragonTeeth = function(parent) {
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 4; j++) {
        var toothGeom = new THREE.ConeGeometry(2, 6, 6);
        var toothMat = new THREE.MeshLambertMaterial({ color: 0x6b7170 });
        var tooth = new THREE.Mesh(toothGeom, toothMat);
        tooth.position.set(100 + i * 6, 1, -40 + j * 6);
        tooth.castShadow = true;
        parent.add(tooth);
        meshes.push(tooth);
      }
    }
  };

  var update = function(delta) {
    if (!scene || !camera) return;

    animations.searchlightAngle += delta * 0.5;
    if (animations.searchlightAngle > Math.PI * 2) {
      animations.searchlightAngle -= Math.PI * 2;
    }

    animations.gunElevation = Math.sin(animations.wavePhase * 0.3) * 0.15;
    animations.flagWave = Math.sin(animations.wavePhase * 0.8) * 0.08;
    animations.oceanWave = Math.sin(animations.wavePhase * 0.5) * 0.3;
    animations.wavePhase += delta;

    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.userData && mesh.userData.isBarrel) {
        mesh.rotation.z = Math.PI / 2 + animations.gunElevation;
      }
      if (mesh.userData && mesh.userData.isFlag) {
        mesh.rotation.z = animations.flagWave;
      }
      if (mesh.userData && mesh.userData.isWave) {
        mesh.position.y = -5 + animations.oceanWave;
      }
      if (mesh.userData && mesh.userData.isSearchLight) {
        var parent = mesh.parent;
        if (parent && parent.userData && parent.userData.type === 'searchlight') {
          parent.rotation.y = animations.searchlightAngle;
        }
      }
    }
  };

  var reset = function() {
    animations.searchlightAngle = 0;
    animations.gunElevation = 0;
    animations.flagWave = 0;
    animations.oceanWave = 0;
    animations.wavePhase = 0;

    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.userData && mesh.userData.isBarrel) {
        mesh.rotation.z = Math.PI / 2;
      }
      if (mesh.userData && mesh.userData.isFlag) {
        mesh.rotation.z = 0;
      }
      if (mesh.userData && mesh.userData.isWave) {
        mesh.position.y = -5;
      }
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
