window.StormFortress = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var lights = [];
  var animatedObjects = [];
  var radarMesh;
  var seaMines = [];
  var waveImpactFlashes = [];
  var time = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    lights = [];
    animatedObjects = [];
    radarMesh = null;
    seaMines = [];
    waveImpactFlashes = [];
    time = 0;

    buildMainWalls();
    buildRadarTower();
    buildSeaMineField();
    buildStormDrainTunnels();
    buildWallDamage();
    buildNavalCraters();
    buildAmmunitionVaults();
    buildCommandBridge();
    buildEnvironmentalDetails();
    buildLighting();
  }

  function buildMainWalls() {
    var concreteGray = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var darkGray = new THREE.MeshLambertMaterial({ color: 0x505050 });

    var mainWallGeometry = new THREE.BoxGeometry(120, 45, 20);
    var mainWall = new THREE.Mesh(mainWallGeometry, concreteGray);
    mainWall.position.set(0, 22, -50);
    mainWall.castShadow = true;
    mainWall.receiveShadow = true;
    scene.add(mainWall);
    objects.push(mainWall);

    var sideWallGeometry = new THREE.BoxGeometry(20, 40, 100);
    var sideWallLeft = new THREE.Mesh(sideWallGeometry, darkGray);
    sideWallLeft.position.set(-60, 20, 0);
    sideWallLeft.castShadow = true;
    sideWallLeft.receiveShadow = true;
    scene.add(sideWallLeft);
    objects.push(sideWallLeft);

    var sideWallRight = new THREE.Mesh(sideWallGeometry, darkGray);
    sideWallRight.position.set(60, 20, 0);
    sideWallRight.castShadow = true;
    sideWallRight.receiveShadow = true;
    scene.add(sideWallRight);
    objects.push(sideWallRight);

    var backWallGeometry = new THREE.BoxGeometry(120, 40, 15);
    var backWall = new THREE.Mesh(backWallGeometry, concreteGray);
    backWall.position.set(0, 20, 50);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);
    objects.push(backWall);

    var reinforcementBars = buildReinforcementBars();
    for (var i = 0; i < reinforcementBars.length; i++) {
      scene.add(reinforcementBars[i]);
      objects.push(reinforcementBars[i]);
    }

    var waterDeflectorGeometry = new THREE.BoxGeometry(130, 8, 25);
    var waterDeflector = new THREE.Mesh(waterDeflectorGeometry, new THREE.MeshLambertMaterial({ color: 0x606060 }));
    waterDeflector.position.set(0, 5, -55);
    waterDeflector.rotation.z = 0.3;
    waterDeflector.castShadow = true;
    scene.add(waterDeflector);
    objects.push(waterDeflector);
  }

  function buildReinforcementBars() {
    var bars = [];
    var barMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    for (var x = -50; x <= 50; x += 20) {
      for (var y = 0; y < 40; y += 10) {
        var barGeometry = new THREE.CylinderGeometry(1.5, 1.5, 45, 8);
        var bar = new THREE.Mesh(barGeometry, barMaterial);
        bar.position.set(x, y, -50);
        bar.rotation.z = Math.PI / 2;
        bars.push(bar);
      }
    }

    return bars;
  }

  function buildRadarTower() {
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 });
    var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

    var towerBaseGeometry = new THREE.CylinderGeometry(8, 12, 5, 16);
    var towerBase = new THREE.Mesh(towerBaseGeometry, baseMaterial);
    towerBase.position.set(0, 2.5, 30);
    towerBase.castShadow = true;
    scene.add(towerBase);
    objects.push(towerBase);

    var towerPoleGeometry = new THREE.CylinderGeometry(3, 3, 80, 16);
    var towerPole = new THREE.Mesh(towerPoleGeometry, towerMaterial);
    towerPole.position.set(0, 42, 30);
    towerPole.castShadow = true;
    scene.add(towerPole);
    objects.push(towerPole);

    var radarDishGeometry = new THREE.SphereGeometry(6, 16, 16, 0, Math.PI);
    radarMesh = new THREE.Mesh(radarDishGeometry, new THREE.MeshLambertMaterial({ color: 0xFFDD00 }));
    radarMesh.position.set(0, 86, 30);
    radarMesh.rotation.x = 0.3;
    radarMesh.castShadow = true;
    scene.add(radarMesh);
    objects.push(radarMesh);
    animatedObjects.push(radarMesh);

    var supportRing1Geometry = new THREE.CylinderGeometry(9, 9, 2, 16);
    var supportRing1 = new THREE.Mesh(supportRing1Geometry, baseMaterial);
    supportRing1.position.set(0, 50, 30);
    scene.add(supportRing1);
    objects.push(supportRing1);

    var supportRing2Geometry = new THREE.CylinderGeometry(10, 10, 1.5, 16);
    var supportRing2 = new THREE.Mesh(supportRing2Geometry, baseMaterial);
    supportRing2.position.set(0, 70, 30);
    scene.add(supportRing2);
    objects.push(supportRing2);

    var antennaGeometry = new THREE.CylinderGeometry(1, 1, 20, 8);
    var antenna = new THREE.Mesh(antennaGeometry, new THREE.MeshLambertMaterial({ color: 0xAAAAAA }));
    antenna.position.set(0, 96, 30);
    antenna.castShadow = true;
    scene.add(antenna);
    objects.push(antenna);
  }

  function buildSeaMineField() {
    var mineGeometry = new THREE.SphereGeometry(2, 8, 8);
    var mineMaterial = new THREE.MeshLambertMaterial({ color: 0x2C3E50 });

    var seaLevel = -5;

    for (var i = 0; i < 35; i++) {
      var mineX = (Math.random() - 0.5) * 200;
      var mineZ = (Math.random() - 0.5) * 150 - 80;
      var mineY = seaLevel + (Math.random() - 0.5) * 15;

      var mine = new THREE.Mesh(mineGeometry, mineMaterial);
      mine.position.set(mineX, mineY, mineZ);
      mine.castShadow = true;

      var spikes = buildMineSpikers();
      for (var s = 0; s < spikes.length; s++) {
        mine.add(spikes[s]);
      }

      scene.add(mine);
      objects.push(mine);
      seaMines.push({
        mesh: mine,
        baseY: mineY,
        phase: Math.random() * Math.PI * 2
      });
      animatedObjects.push(mine);
    }
  }

  function buildMineSpikers() {
    var spikes = [];
    var spikeMaterial = new THREE.MeshLambertMaterial({ color: 0x1A252F });

    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var spikeGeometry = new THREE.ConeGeometry(0.8, 3, 6);
      var spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(Math.cos(angle) * 3, Math.sin(angle) * 3, 0);
      spike.rotation.set(angle, 0, 0);
      spikes.push(spike);
    }

    return spikes;
  }

  function buildStormDrainTunnels() {
    var tunnelMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });

    var tunnelCount = 5;
    for (var t = 0; t < tunnelCount; t++) {
      var tunnelX = -40 + (t * 20);
      var tunnelGeometry = new THREE.CylinderGeometry(6, 6, 70, 8);
      var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
      tunnel.position.set(tunnelX, -8, 0);
      tunnel.rotation.z = Math.PI / 2;
      tunnel.castShadow = true;
      scene.add(tunnel);
      objects.push(tunnel);
    }

    var tunnelGrateGeometry = new THREE.BoxGeometry(100, 4, 4);
    var tunnelGrateMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var tunnelGrate = new THREE.Mesh(tunnelGrateGeometry, tunnelGrateMaterial);
    tunnelGrate.position.set(0, -12, 30);
    scene.add(tunnelGrate);
    objects.push(tunnelGrate);
  }

  function buildWallDamage() {
    var damageColor = new THREE.MeshLambertMaterial({ color: 0x3E3E3E });

    var damageAreas = [
      { x: -30, y: 15, z: -50 },
      { x: 40, y: 20, z: -50 },
      { x: -60, y: 15, z: -20 },
      { x: 60, y: 18, z: 20 },
      { x: 0, y: 12, z: 50 },
      { x: -50, y: 22, z: -48 }
    ];

    for (var d = 0; d < damageAreas.length; d++) {
      var damageArea = damageAreas[d];
      var crackGeometry = new THREE.BoxGeometry(8 + Math.random() * 4, 6 + Math.random() * 3, 2);
      var crack = new THREE.Mesh(crackGeometry, damageColor);
      crack.position.set(damageArea.x, damageArea.y, damageArea.z);
      scene.add(crack);
      objects.push(crack);
    }
  }

  function buildNavalCraters() {
    var craterMaterial = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });

    var craterLocations = [
      { x: -70, y: 5, z: -60 },
      { x: 50, y: 8, z: -55 },
      { x: 0, y: 6, z: 35 },
      { x: -40, y: 4, z: 40 }
    ];

    for (var c = 0; c < craterLocations.length; c++) {
      var loc = craterLocations[c];
      var craterGeometry = new THREE.SphereGeometry(12 + Math.random() * 8, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      var crater = new THREE.Mesh(craterGeometry, craterMaterial);
      crater.position.set(loc.x, loc.y, loc.z);
      crater.scale.set(1, 0.4, 1);
      crater.castShadow = true;
      scene.add(crater);
      objects.push(crater);
    }
  }

  function buildAmmunitionVaults() {
    var vaultMaterial = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
    var vaultDoorMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });

    var vaultLocations = [
      { x: -45, y: 15, z: 40 },
      { x: 45, y: 15, z: 40 },
      { x: 0, y: 15, z: -40 },
      { x: -80, y: 10, z: 0 }
    ];

    for (var v = 0; v < vaultLocations.length; v++) {
      var vaultLoc = vaultLocations[v];

      var vaultWallGeometry = new THREE.BoxGeometry(15, 12, 12);
      var vaultWall = new THREE.Mesh(vaultWallGeometry, vaultMaterial);
      vaultWall.position.set(vaultLoc.x, vaultLoc.y, vaultLoc.z);
      vaultWall.castShadow = true;
      scene.add(vaultWall);
      objects.push(vaultWall);

      var vaultDoorGeometry = new THREE.BoxGeometry(6, 8, 1);
      var vaultDoor = new THREE.Mesh(vaultDoorGeometry, vaultDoorMaterial);
      vaultDoor.position.set(vaultLoc.x - 5, vaultLoc.y - 1, vaultLoc.z + 6);
      vaultDoor.castShadow = true;
      scene.add(vaultDoor);
      objects.push(vaultDoor);
    }
  }

  function buildCommandBridge() {
    var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
    var railMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });

    var bridgeFloorGeometry = new THREE.BoxGeometry(40, 2, 25);
    var bridgeFloor = new THREE.Mesh(bridgeFloorGeometry, bridgeMaterial);
    bridgeFloor.position.set(0, 48, 0);
    bridgeFloor.castShadow = true;
    scene.add(bridgeFloor);
    objects.push(bridgeFloor);

    var bridgeRoofGeometry = new THREE.BoxGeometry(40, 1.5, 25);
    var bridgeRoof = new THREE.Mesh(bridgeRoofGeometry, new THREE.MeshLambertMaterial({ color: 0x555555 }));
    bridgeRoof.position.set(0, 63, 0);
    bridgeRoof.castShadow = true;
    scene.add(bridgeRoof);
    objects.push(bridgeRoof);

    var bridgeWallLeft = new THREE.Mesh(new THREE.BoxGeometry(1.5, 15, 25), railMaterial);
    bridgeWallLeft.position.set(-20, 55, 0);
    scene.add(bridgeWallLeft);
    objects.push(bridgeWallLeft);

    var bridgeWallRight = new THREE.Mesh(new THREE.BoxGeometry(1.5, 15, 25), railMaterial);
    bridgeWallRight.position.set(20, 55, 0);
    scene.add(bridgeWallRight);
    objects.push(bridgeWallRight);

    var bridgeWallBack = new THREE.Mesh(new THREE.BoxGeometry(40, 15, 1.5), railMaterial);
    bridgeWallBack.position.set(0, 55, -12);
    scene.add(bridgeWallBack);
    objects.push(bridgeWallBack);

    var radarScreenGeometry = new THREE.BoxGeometry(8, 6, 1);
    var radarScreen = new THREE.Mesh(radarScreenGeometry, new THREE.MeshLambertMaterial({ color: 0x00FF00 }));
    radarScreen.position.set(0, 56, -11.5);
    scene.add(radarScreen);
    objects.push(radarScreen);

    var commandConsoleGeometry = new THREE.BoxGeometry(12, 3, 4);
    var commandConsole = new THREE.Mesh(commandConsoleGeometry, new THREE.MeshLambertMaterial({ color: 0x3A3A3A }));
    commandConsole.position.set(0, 50, 8);
    scene.add(commandConsole);
    objects.push(commandConsole);
  }

  function buildEnvironmentalDetails() {
    var detailMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 });
    var steelMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });

    var pillboxCount = 6;
    for (var p = 0; p < pillboxCount; p++) {
      var angle = (p / pillboxCount) * Math.PI * 2;
      var pillboxX = Math.cos(angle) * 70;
      var pillboxZ = Math.sin(angle) * 70;

      var pillboxGeometry = new THREE.CylinderGeometry(4, 5, 6, 16);
      var pillbox = new THREE.Mesh(pillboxGeometry, detailMaterial);
      pillbox.position.set(pillboxX, 8, pillboxZ);
      pillbox.castShadow = true;
      scene.add(pillbox);
      objects.push(pillbox);

      var gunMountGeometry = new THREE.SphereGeometry(2, 8, 8);
      var gunMount = new THREE.Mesh(gunMountGeometry, steelMaterial);
      gunMount.position.set(pillboxX, 14, pillboxZ);
      scene.add(gunMount);
      objects.push(gunMount);
    }

    var searchlightCount = 4;
    for (var l = 0; l < searchlightCount; l++) {
      var slAngle = (l / searchlightCount) * Math.PI * 2;
      var slX = Math.cos(slAngle) * 80;
      var slZ = Math.sin(slAngle) * 80;

      var searchlightPoleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 18, 8);
      var searchlightPole = new THREE.Mesh(searchlightPoleGeometry, steelMaterial);
      searchlightPole.position.set(slX, 9, slZ);
      scene.add(searchlightPole);
      objects.push(searchlightPole);

      var searchlightHeadGeometry = new THREE.SphereGeometry(3, 8, 8);
      var searchlightHead = new THREE.Mesh(searchlightHeadGeometry, new THREE.MeshLambertMaterial({ color: 0xDDDDDD }));
      searchlightHead.position.set(slX, 18, slZ);
      scene.add(searchlightHead);
      objects.push(searchlightHead);
    }

    var ammoBoxGeometry = new THREE.BoxGeometry(4, 3, 4);
    var ammoBoxMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    for (var a = 0; a < 8; a++) {
      var ammoX = -50 + (a * 15);
      var ammoBox = new THREE.Mesh(ammoBoxGeometry, ammoBoxMaterial);
      ammoBox.position.set(ammoX, 2, -55);
      scene.add(ammoBox);
      objects.push(ammoBox);
    }

    var sandbagGeometry = new THREE.BoxGeometry(6, 1.5, 3);
    var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });
    for (var s = 0; s < 12; s++) {
      var sbX = -60 + (s * 10);
      var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbag.position.set(sbX, 1, 55);
      scene.add(sandbag);
      objects.push(sandbag);
    }
  }

  function buildLighting() {
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(50, 80, 60);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    lights.push(directionalLight);

    var stormLight = new THREE.PointLight(0x4488FF, 0.4);
    stormLight.position.set(-100, 60, -100);
    scene.add(stormLight);
    lights.push(stormLight);

    var radarLight = new THREE.PointLight(0xFFDD00, 0.3);
    radarLight.position.set(0, 86, 30);
    scene.add(radarLight);
    lights.push(radarLight);

    var bridgeLight = new THREE.PointLight(0xFFFFCC, 0.5);
    bridgeLight.position.set(0, 65, 0);
    scene.add(bridgeLight);
    lights.push(bridgeLight);

    var spotLight1 = new THREE.PointLight(0xFFFFFF, 0.3);
    spotLight1.position.set(-70, 25, 0);
    scene.add(spotLight1);
    lights.push(spotLight1);

    var spotLight2 = new THREE.PointLight(0xFFFFFF, 0.3);
    spotLight2.position.set(70, 25, 0);
    scene.add(spotLight2);
    lights.push(spotLight2);
  }

  function update(delta) {
    time += delta;

    if (radarMesh) {
      radarMesh.rotation.y += delta * 1.5;
    }

    for (var m = 0; m < seaMines.length; m++) {
      var mineData = seaMines[m];
      var bobAmount = Math.sin(time * 0.8 + mineData.phase) * 0.5;
      mineData.mesh.position.y = mineData.baseY + bobAmount;
    }

    for (var w = 0; w < waveImpactFlashes.length; w++) {
      var flash = waveImpactFlashes[w];
      flash.intensity -= delta * 2;
      if (flash.intensity <= 0) {
        scene.remove(flash);
        waveImpactFlashes.splice(w, 1);
        w--;
      }
    }

    if (Math.floor(time * 2) % 60 === 0 && time > 0) {
      createWaveImpactFlash();
    }
  }

  function createWaveImpactFlash() {
    var flashIntensity = 0.5 + Math.random() * 0.5;
    var flash = new THREE.PointLight(0x4488FF, flashIntensity);
    flash.position.set((Math.random() - 0.5) * 150, 10, -80 + Math.random() * 30);
    scene.add(flash);
    waveImpactFlashes.push(flash);
    lights.push(flash);
  }

  function reset() {
    for (var o = 0; o < objects.length; o++) {
      scene.remove(objects[o]);
    }
    objects = [];

    for (var l = 0; l < lights.length; l++) {
      scene.remove(lights[l]);
    }
    lights = [];

    animatedObjects = [];
    seaMines = [];
    waveImpactFlashes = [];
    radarMesh = null;
    scene = null;
    camera = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
