window.GrantonKeep = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var gasdomeSphere = null;
  var lighthouseLight = null;
  var lastFlashTime = 0;
  var flashInterval = 2.0;

  var Material = THREE.MeshLambertMaterial;

  function createGasHolderFrame() {
    var frameGroup = new THREE.Group();

    var ironDark = new Material({ color: 0x333344 });
    var columns = 8;
    var radius = 25;
    var height = 40;
    var midHeight = height / 2;

    var columnGeo = new THREE.BoxGeometry(2, height, 2);

    for (var i = 0; i < columns; i++) {
      var angle = (i / columns) * Math.PI * 2;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var column = new THREE.Mesh(columnGeo, ironDark);
      column.position.set(x, height / 2, z);
      frameGroup.add(column);
      objects.push(column);
    }

    var ringGeo = new THREE.BoxGeometry(4, 1, 4);

    for (var i = 0; i < columns; i++) {
      var angle = (i / columns) * Math.PI * 2;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var ringMid = new THREE.Mesh(ringGeo, ironDark);
      ringMid.position.set(x, midHeight, z);
      frameGroup.add(ringMid);
      objects.push(ringMid);

      var ringTop = new THREE.Mesh(ringGeo, ironDark);
      ringTop.position.set(x, height - 2, z);
      frameGroup.add(ringTop);
      objects.push(ringTop);
    }

    return frameGroup;
  }

  function createGasDomeSphere() {
    var ironGrey = new Material({ color: 0x556677 });
    var sphereGeo = new THREE.SphereGeometry(10, 32, 32);
    var sphere = new THREE.Mesh(sphereGeo, ironGrey);
    sphere.position.set(0, 20, 0);
    gasdomeSphere = sphere;
    objects.push(sphere);
    return sphere;
  }

  function createGrantonPier() {
    var concrete = new Material({ color: 0x888888 });
    var pierGeo = new THREE.BoxGeometry(30, 1, 6);
    var pier = new THREE.Mesh(pierGeo, concrete);
    pier.position.set(-50, 0.5, 0);
    objects.push(pier);
    return pier;
  }

  function createSubmarinePen() {
    var concrete = new Material({ color: 0x888877 });

    var penGeo = new THREE.BoxGeometry(16, 6, 20);
    var pen = new THREE.Mesh(penGeo, concrete);
    pen.position.set(60, 3, -40);
    objects.push(pen);

    var wallNorth = new THREE.BoxGeometry(16, 6, 0.5);
    var wallN = new THREE.Mesh(wallNorth, concrete);
    wallN.position.set(60, 3, -50.25);
    objects.push(wallN);

    var wallSouth = new THREE.BoxGeometry(16, 6, 0.5);
    var wallS = new THREE.Mesh(wallSouth, concrete);
    wallS.position.set(60, 3, -29.75);
    objects.push(wallS);

    var wallWest = new THREE.BoxGeometry(0.5, 6, 20);
    var wallW = new THREE.Mesh(wallWest, concrete);
    wallW.position.set(52.25, 3, -40);
    objects.push(wallW);

    return pen;
  }

  function createMiniSubmarine() {
    var darkGrey = new Material({ color: 0x445544 });

    var hullGeo = new THREE.BoxGeometry(14, 3, 5);
    var hull = new THREE.Mesh(hullGeo, darkGrey);
    hull.position.set(60, 4.5, -40);
    objects.push(hull);

    var towerGeo = new THREE.BoxGeometry(2, 4, 2);
    var tower = new THREE.Mesh(towerGeo, darkGrey);
    tower.position.set(58, 6.5, -40);
    objects.push(tower);

    return hull;
  }

  function createCoastguardStation() {
    var white = new Material({ color: 0xFFFFFF });
    var orange = new Material({ color: 0xFF6600 });

    var stationGeo = new THREE.BoxGeometry(10, 6, 8);
    var station = new THREE.Mesh(stationGeo, white);
    station.position.set(-30, 3, 30);
    objects.push(station);

    var stripeGeo = new THREE.BoxGeometry(10, 0.6, 8);
    var stripe = new THREE.Mesh(stripeGeo, orange);
    stripe.position.set(-30, 5, 30);
    objects.push(stripe);

    return station;
  }

  function createTorpedoTubes() {
    var grey = new Material({ color: 0x888888 });

    for (var i = 0; i < 4; i++) {
      var tubeGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 16);
      var tube = new THREE.Mesh(tubeGeo, grey);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(70 + i * 2.5, 5 + i * 1.5, -40);
      objects.push(tube);
    }
  }

  function createLighthouse() {
    var white = new Material({ color: 0xFFFFFF });
    var red = new Material({ color: 0xFF0000 });

    var cylinderGeo = new THREE.CylinderGeometry(2, 2, 16, 16);
    var cylinder = new THREE.Mesh(cylinderGeo, white);
    cylinder.position.set(0, 8, -60);
    objects.push(cylinder);

    var coneGeo = new THREE.ConeGeometry(2.5, 3, 16);
    var cone = new THREE.Mesh(coneGeo, red);
    cone.position.set(0, 19.5, -60);
    objects.push(cone);

    return cylinder;
  }

  function createLights() {
    var ambientLight = new THREE.AmbientLight(0x99AABB, 0.5);
    lights.push(ambientLight);

    var lighthousePointLight = new THREE.PointLight(0xFF2200, 2.0, 100);
    lighthousePointLight.position.set(0, 22, -60);
    lighthouseLight = lighthousePointLight;
    lights.push(lighthousePointLight);

    var harborLight1 = new THREE.PointLight(0xFFFFFF, 0.8, 80);
    harborLight1.position.set(-40, 15, 20);
    lights.push(harborLight1);

    var harborLight2 = new THREE.PointLight(0xFFFFFF, 0.8, 80);
    harborLight2.position.set(50, 15, -30);
    lights.push(harborLight2);

    var harborLight3 = new THREE.PointLight(0xFFFFFF, 0.8, 80);
    harborLight3.position.set(60, 12, -60);
    lights.push(harborLight3);
  }

  function build(scene) {
    var frameGroup = createGasHolderFrame();
    scene.add(frameGroup);

    var sphere = createGasDomeSphere();
    scene.add(sphere);

    var pier = createGrantonPier();
    scene.add(pier);

    createSubmarinePen();

    createMiniSubmarine();

    var station = createCoastguardStation();
    scene.add(station);

    createTorpedoTubes();

    var lighthouse = createLighthouse();
    scene.add(lighthouse);

    createLights();

    for (var i = 0; i < lights.length; i++) {
      scene.add(lights[i]);
    }
  }

  function update(delta) {
    if (gasdomeSphere) {
      gasdomeSphere.rotation.y += delta * 0.1;
    }

    if (lighthouseLight) {
      lastFlashTime += delta;
      if (lastFlashTime > flashInterval) {
        lastFlashTime = 0;
        lighthouseLight.intensity = lighthouseLight.intensity > 1.5 ? 0.3 : 2.0;
      }
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    objects = [];
    lights = [];
    gasdomeSphere = null;
    lighthouseLight = null;
    lastFlashTime = 0;
  }

  return {
    build: build,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
