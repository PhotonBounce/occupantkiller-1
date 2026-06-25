window.DeltaBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var structures = [];
  var lights = [];
  var bridges = [];
  var waterLights = [];
  var radarMast = null;
  var radarHead = null;
  var animationTime = 0;

  var materialWoodBrown = new THREE.MeshPhongMaterial({ color: 0x6B4423 });
  var materialMilitaryGreen = new THREE.MeshPhongMaterial({ color: 0x2d5016 });
  var materialDarkWater = new THREE.MeshPhongMaterial({ color: 0x1a3a52 });
  var materialMetal = new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 100 });
  var materialCamouflage = new THREE.MeshPhongMaterial({ color: 0x4a5c3d });
  var materialConcrete = new THREE.MeshPhongMaterial({ color: 0x555555 });

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    structures = [];
    lights = [];
    bridges = [];
    waterLights = [];
    animationTime = 0;

    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 200, 500);

    createWaterPlane();
    createMainPlatform();
    createElevatedStructures();
    createSupplyCaches();
    createSniperTower();
    createRadarMastArray();
    createZodiacBoats();
    createRopeBridges();
    createCamouflageNetting();
    createTunnelEntrance();
    createEnvironmentalLights();
    createWaterLights();

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 80, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
  }

  function createWaterPlane() {
    var waterGeo = new THREE.CylinderGeometry(100, 100, 2, 32);
    var water = new THREE.Mesh(waterGeo, materialDarkWater);
    water.position.y = -8;
    water.castShadow = true;
    water.receiveShadow = true;
    scene.add(water);
    structures.push(water);
  }

  function createMainPlatform() {
    var platformGeo = new THREE.BoxGeometry(60, 2, 60);
    var platform = new THREE.Mesh(platformGeo, materialWoodBrown);
    platform.position.y = 3;
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    structures.push(platform);

    var stiltsCount = 8;
    var stiltRadius = 1.5;
    var positions = [
      [-25, -25], [-25, 25], [25, -25], [25, 25],
      [0, -30], [0, 30], [-30, 0], [30, 0]
    ];

    var i = 0;
    while (i < stiltsCount) {
      var stiltGeo = new THREE.CylinderGeometry(stiltRadius, stiltRadius, 12, 12);
      var stilt = new THREE.Mesh(stiltGeo, materialConcrete);
      stilt.position.x = positions[i][0];
      stilt.position.z = positions[i][1];
      stilt.position.y = -2;
      stilt.castShadow = true;
      stilt.receiveShadow = true;
      scene.add(stilt);
      structures.push(stilt);
      i = i + 1;
    }
  }

  function createElevatedStructures() {
    var baseX = -20;
    var baseZ = -20;
    var platformHeight = 3.5;

    var struct1Geo = new THREE.BoxGeometry(12, 8, 12);
    var struct1 = new THREE.Mesh(struct1Geo, materialMilitaryGreen);
    struct1.position.set(baseX, platformHeight + 4, baseZ);
    struct1.castShadow = true;
    struct1.receiveShadow = true;
    scene.add(struct1);
    structures.push(struct1);

    var roofGeo = new THREE.ConeGeometry(7, 3, 4);
    var roof1 = new THREE.Mesh(roofGeo, materialWoodBrown);
    roof1.position.set(baseX, platformHeight + 8.5, baseZ);
    roof1.castShadow = true;
    roof1.receiveShadow = true;
    scene.add(roof1);
    structures.push(roof1);

    var struct2Geo = new THREE.BoxGeometry(10, 6, 10);
    var struct2 = new THREE.Mesh(struct2Geo, materialMilitaryGreen);
    struct2.position.set(baseX + 35, platformHeight + 3, baseZ);
    struct2.castShadow = true;
    struct2.receiveShadow = true;
    scene.add(struct2);
    structures.push(struct2);

    var roof2Geo = new THREE.ConeGeometry(6, 2.5, 4);
    var roof2 = new THREE.Mesh(roof2Geo, materialWoodBrown);
    roof2.position.set(baseX + 35, platformHeight + 6, baseZ);
    roof2.castShadow = true;
    roof2.receiveShadow = true;
    scene.add(roof2);
    structures.push(roof2);

    var struct3Geo = new THREE.BoxGeometry(14, 7, 10);
    var struct3 = new THREE.Mesh(struct3Geo, materialCamouflage);
    struct3.position.set(baseX + 18, platformHeight + 3.5, baseZ + 35);
    struct3.castShadow = true;
    struct3.receiveShadow = true;
    scene.add(struct3);
    structures.push(struct3);

    var roof3Geo = new THREE.ConeGeometry(7.5, 3, 4);
    var roof3 = new THREE.Mesh(roof3Geo, materialWoodBrown);
    roof3.position.set(baseX + 18, platformHeight + 7.5, baseZ + 35);
    roof3.castShadow = true;
    roof3.receiveShadow = true;
    scene.add(roof3);
    structures.push(roof3);
  }

  function createSupplyCaches() {
    var cacheX = 15;
    var cacheZ = 15;
    var platformHeight = 3.5;

    var cache1Geo = new THREE.BoxGeometry(8, 5, 8);
    var cache1 = new THREE.Mesh(cache1Geo, materialConcrete);
    cache1.position.set(cacheX, platformHeight + 2.5, cacheZ);
    cache1.castShadow = true;
    cache1.receiveShadow = true;
    scene.add(cache1);
    structures.push(cache1);

    var cache2Geo = new THREE.BoxGeometry(7, 5, 7);
    var cache2 = new THREE.Mesh(cache2Geo, materialConcrete);
    cache2.position.set(cacheX + 12, platformHeight + 2.5, cacheZ);
    cache2.castShadow = true;
    cache2.receiveShadow = true;
    scene.add(cache2);
    structures.push(cache2);

    var cache3Geo = new THREE.BoxGeometry(8, 5, 8);
    var cache3 = new THREE.Mesh(cache3Geo, materialConcrete);
    cache3.position.set(cacheX, platformHeight + 2.5, cacheZ - 12);
    cache3.castShadow = true;
    cache3.receiveShadow = true;
    scene.add(cache3);
    structures.push(cache3);
  }

  function createSniperTower() {
    var towerX = -35;
    var towerZ = 25;
    var platformHeight = 3.5;

    var baseGeo = new THREE.CylinderGeometry(3, 3.5, 3, 8);
    var base = new THREE.Mesh(baseGeo, materialConcrete);
    base.position.set(towerX, platformHeight + 1.5, towerZ);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    structures.push(base);

    var shaftGeo = new THREE.CylinderGeometry(1.5, 1.5, 16, 8);
    var shaft = new THREE.Mesh(shaftGeo, materialMetal);
    shaft.position.set(towerX, platformHeight + 11, towerZ);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    scene.add(shaft);
    structures.push(shaft);

    var platformGeo = new THREE.CylinderGeometry(4, 4, 1, 8);
    var towerPlatform = new THREE.Mesh(platformGeo, materialWoodBrown);
    towerPlatform.position.set(towerX, platformHeight + 19, towerZ);
    towerPlatform.castShadow = true;
    towerPlatform.receiveShadow = true;
    scene.add(towerPlatform);
    structures.push(towerPlatform);

    var shieldGeo = new THREE.BoxGeometry(3, 2, 3);
    var shield = new THREE.Mesh(shieldGeo, materialMilitaryGreen);
    shield.position.set(towerX, platformHeight + 21, towerZ + 2);
    shield.castShadow = true;
    shield.receiveShadow = true;
    scene.add(shield);
    structures.push(shield);
  }

  function createRadarMastArray() {
    var mastX = -25;
    var mastZ = -35;
    var platformHeight = 3.5;

    var baseGeo = new THREE.CylinderGeometry(2, 2.5, 2, 8);
    var base = new THREE.Mesh(baseGeo, materialConcrete);
    base.position.set(mastX, platformHeight + 1, mastZ);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    structures.push(base);

    var shaftGeo = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
    radarMast = new THREE.Mesh(shaftGeo, materialMetal);
    radarMast.position.set(mastX, platformHeight + 12, mastZ);
    radarMast.castShadow = true;
    radarMast.receiveShadow = true;
    scene.add(radarMast);
    structures.push(radarMast);

    var headGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 8);
    radarHead = new THREE.Mesh(headGeo, materialMilitaryGreen);
    radarHead.position.set(mastX, platformHeight + 24, mastZ);
    radarHead.castShadow = true;
    radarHead.receiveShadow = true;
    scene.add(radarHead);
    structures.push(radarHead);

    var antenna1Geo = new THREE.CylinderGeometry(0.15, 0.15, 4, 4);
    var antenna1 = new THREE.Mesh(antenna1Geo, materialMetal);
    antenna1.position.set(mastX - 2, platformHeight + 26, mastZ);
    antenna1.castShadow = true;
    antenna1.receiveShadow = true;
    scene.add(antenna1);
    structures.push(antenna1);

    var antenna2Geo = new THREE.CylinderGeometry(0.15, 0.15, 4, 4);
    var antenna2 = new THREE.Mesh(antenna2Geo, materialMetal);
    antenna2.position.set(mastX + 2, platformHeight + 26, mastZ);
    antenna2.castShadow = true;
    antenna2.receiveShadow = true;
    scene.add(antenna2);
    structures.push(antenna2);
  }

  function createZodiacBoats() {
    var boat1X = -40;
    var boat1Z = -5;

    var hull1Geo = new THREE.BoxGeometry(8, 2, 3.5);
    var hull1 = new THREE.Mesh(hull1Geo, materialMilitaryGreen);
    hull1.position.set(boat1X, -6, boat1Z);
    hull1.rotation.z = 0.05;
    hull1.castShadow = true;
    hull1.receiveShadow = true;
    scene.add(hull1);
    structures.push(hull1);

    var cabin1Geo = new THREE.BoxGeometry(4, 1.5, 2);
    var cabin1 = new THREE.Mesh(cabin1Geo, materialCamouflage);
    cabin1.position.set(boat1X - 1, -4.5, boat1Z);
    cabin1.castShadow = true;
    cabin1.receiveShadow = true;
    scene.add(cabin1);
    structures.push(cabin1);

    var boat2X = 35;
    var boat2Z = 10;

    var hull2Geo = new THREE.BoxGeometry(8, 2, 3.5);
    var hull2 = new THREE.Mesh(hull2Geo, materialMilitaryGreen);
    hull2.position.set(boat2X, -6, boat2Z);
    hull2.rotation.z = -0.08;
    hull2.castShadow = true;
    hull2.receiveShadow = true;
    scene.add(hull2);
    structures.push(hull2);

    var cabin2Geo = new THREE.BoxGeometry(4, 1.5, 2);
    var cabin2 = new THREE.Mesh(cabin2Geo, materialCamouflage);
    cabin2.position.set(boat2X + 1, -4.5, boat2Z);
    cabin2.castShadow = true;
    cabin2.receiveShadow = true;
    scene.add(cabin2);
    structures.push(cabin2);
  }

  function createRopeBridges() {
    var bridgeZ1 = 20;
    var bridgeX1Start = -20;
    var bridgeX1End = 20;

    createBridge(bridgeX1Start, 4.5, bridgeZ1, bridgeX1End, 4.5, bridgeZ1, 1.5);

    var bridgeZ2 = -20;
    var bridgeX2Start = -15;
    var bridgeX2End = 15;

    createBridge(bridgeX2Start, 4.5, bridgeZ2, bridgeX2End, 4.2, bridgeZ2, 1.2);

    var bridgeX3 = 15;
    var bridgeZ3Start = -10;
    var bridgeZ3End = 10;

    createBridge(bridgeX3, 4.3, bridgeZ3Start, bridgeX3, 4.3, bridgeZ3End, 0.8);
  }

  function createBridge(x1, y1, z1, x2, y2, z2, width) {
    var dx = x2 - x1;
    var dz = z2 - z1;
    var length = Math.sqrt(dx * dx + dz * dz);
    var angle = Math.atan2(dz, dx);

    var boardGeo = new THREE.BoxGeometry(length, 0.3, width);
    var board = new THREE.Mesh(boardGeo, materialWoodBrown);
    board.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
    board.rotation.y = angle;
    board.castShadow = true;
    board.receiveShadow = true;
    scene.add(board);
    structures.push(board);
    bridges.push(board);

    var ropeMat = new THREE.LineBasicMaterial({ color: 0x8B7355 });
    var ropePts = [];
    ropePts.push(new THREE.Vector3(x1, y1 + 1, z1));
    ropePts.push(new THREE.Vector3(x2, y2 + 1, z2));
    var ropeGeo = new THREE.BufferGeometry().setFromPoints(ropePts);
    var rope = new THREE.LineSegments(ropeGeo, ropeMat);
    scene.add(rope);
  }

  function createCamouflageNetting() {
    var netMat = new THREE.LineBasicMaterial({ color: 0x4a5c3d, linewidth: 2 });
    var platformHeight = 3.5;

    var net1Pts = [];
    var netX = -35;
    var netZ = -15;
    var netSize = 18;
    var gridCount = 6;

    var i = 0;
    while (i <= gridCount) {
      var ratio = i / gridCount;
      var x = netX + ratio * netSize;
      net1Pts.push(new THREE.Vector3(x, platformHeight + 10, netZ));
      net1Pts.push(new THREE.Vector3(x, platformHeight + 10, netZ + netSize));
      i = i + 1;
    }

    var j = 0;
    while (j <= gridCount) {
      var ratio2 = j / gridCount;
      var z = netZ + ratio2 * netSize;
      net1Pts.push(new THREE.Vector3(netX, platformHeight + 10, z));
      net1Pts.push(new THREE.Vector3(netX + netSize, platformHeight + 10, z));
      j = j + 1;
    }

    var netGeo1 = new THREE.BufferGeometry().setFromPoints(net1Pts);
    var net1 = new THREE.LineSegments(netGeo1, netMat);
    scene.add(net1);

    var net2Pts = [];
    var net2X = 20;
    var net2Z = -10;
    var net2Size = 16;

    var k = 0;
    while (k <= gridCount) {
      var ratio3 = k / gridCount;
      var x2 = net2X + ratio3 * net2Size;
      net2Pts.push(new THREE.Vector3(x2, platformHeight + 8, net2Z));
      net2Pts.push(new THREE.Vector3(x2, platformHeight + 8, net2Z + net2Size));
      k = k + 1;
    }

    var m = 0;
    while (m <= gridCount) {
      var ratio4 = m / gridCount;
      var z2 = net2Z + ratio4 * net2Size;
      net2Pts.push(new THREE.Vector3(net2X, platformHeight + 8, z2));
      net2Pts.push(new THREE.Vector3(net2X + net2Size, platformHeight + 8, z2));
      m = m + 1;
    }

    var netGeo2 = new THREE.BufferGeometry().setFromPoints(net2Pts);
    var net2 = new THREE.LineSegments(netGeo2, netMat);
    scene.add(net2);
  }

  function createTunnelEntrance() {
    var tunnelX = 40;
    var tunnelZ = -35;
    var waterLevel = -8;

    var ringCount = 3;
    var ringSpacing = 4;

    var n = 0;
    while (n < ringCount) {
      var rGeo = new THREE.CylinderGeometry(3, 3, 0.4, 12);
      var ring = new THREE.Mesh(rGeo, materialMetal);
      ring.position.set(tunnelX + n * ringSpacing, waterLevel + 0.5, tunnelZ);
      ring.rotation.z = Math.PI / 2;
      ring.castShadow = true;
      ring.receiveShadow = true;
      scene.add(ring);
      structures.push(ring);
      n = n + 1;
    }

    var entranceFrameGeo = new THREE.CylinderGeometry(3.2, 3.2, 0.3, 12);
    var entranceFrame = new THREE.Mesh(entranceFrameGeo, materialConcrete);
    entranceFrame.position.set(tunnelX - 2, waterLevel + 1, tunnelZ);
    entranceFrame.rotation.z = Math.PI / 2;
    entranceFrame.castShadow = true;
    entranceFrame.receiveShadow = true;
    scene.add(entranceFrame);
    structures.push(entranceFrame);
  }

  function createEnvironmentalLights() {
    var light1 = new THREE.PointLight(0xffaa00, 0.4, 50);
    light1.position.set(-20, 12, -20);
    scene.add(light1);
    lights.push(light1);

    var light2 = new THREE.PointLight(0xffaa00, 0.4, 50);
    light2.position.set(20, 10, 20);
    scene.add(light2);
    lights.push(light2);

    var light3 = new THREE.PointLight(0x0099ff, 0.3, 40);
    light3.position.set(0, 15, 0);
    scene.add(light3);
    lights.push(light3);
  }

  function createWaterLights() {
    var wl1 = new THREE.PointLight(0x00ccff, 0.25, 60);
    wl1.position.set(-30, -4, -30);
    scene.add(wl1);
    waterLights.push(wl1);

    var wl2 = new THREE.PointLight(0x00ccff, 0.25, 60);
    wl2.position.set(30, -4, -30);
    scene.add(wl2);
    waterLights.push(wl2);

    var wl3 = new THREE.PointLight(0x00ccff, 0.25, 60);
    wl3.position.set(0, -4, 40);
    scene.add(wl3);
    waterLights.push(wl3);
  }

  function update(delta) {
    animationTime = animationTime + delta;

    if (radarHead) {
      radarHead.rotation.y = animationTime * 0.8;
    }

    var bridgeWaveAmount = 0.15;
    var p = 0;
    while (p < bridges.length) {
      var bridge = bridges[p];
      bridge.position.y = bridge.position.y + Math.sin(animationTime * 1.5 + p) * bridgeWaveAmount * delta;
      p = p + 1;
    }

    var q = 0;
    while (q < waterLights.length) {
      var wLight = waterLights[q];
      var intensity = 0.25 + Math.sin(animationTime * 2 + q * 1.2) * 0.15;
      wLight.intensity = intensity;
      q = q + 1;
    }

    var r = 0;
    while (r < lights.length) {
      var fLight = lights[r];
      fLight.intensity = 0.35 + Math.sin(animationTime * 1.2 + r * 0.8) * 0.15;
      r = r + 1;
    }
  }

  function reset() {
    var s = 0;
    while (s < structures.length) {
      scene.remove(structures[s]);
      s = s + 1;
    }

    var l = 0;
    while (l < lights.length) {
      scene.remove(lights[l]);
      l = l + 1;
    }

    var w = 0;
    while (w < waterLights.length) {
      scene.remove(waterLights[w]);
      w = w + 1;
    }

    structures = [];
    lights = [];
    waterLights = [];
    bridges = [];
    animationTime = 0;
    radarMast = null;
    radarHead = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
