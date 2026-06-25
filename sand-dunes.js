window.SandDunes = (function() {
  'use strict';

  var scene, camera;
  var terrain = [];
  var objects = [];

  function buildTerrain() {
    var duneCount = 6;
    for (var i = 0; i < duneCount; i++) {
      var x = (Math.random() - 0.5) * 200;
      var z = (Math.random() - 0.5) * 200;
      var scale = 20 + Math.random() * 40;
      var height = 15 + Math.random() * 25;

      var duneGeom = new THREE.BoxGeometry(scale, height, scale);
      var duneMat = new THREE.MeshStandardMaterial({
        color: 0xD4A574,
        roughness: 0.9,
        metalness: 0.0
      });
      var duneMesh = new THREE.Mesh(duneGeom, duneMat);
      duneMesh.position.set(x, height / 2, z);
      duneMesh.castShadow = true;
      duneMesh.receiveShadow = true;
      scene.add(duneMesh);
      terrain.push(duneMesh);

      var coneGeom = new THREE.ConeGeometry(scale * 0.6, height * 0.5, 12);
      var coneMat = new THREE.MeshStandardMaterial({
        color: 0xC9956B,
        roughness: 0.85
      });
      var coneMesh = new THREE.Mesh(coneGeom, coneMat);
      coneMesh.position.set(x + scale * 0.4, height + 2, z - scale * 0.3);
      coneMesh.castShadow = true;
      coneMesh.receiveShadow = true;
      scene.add(coneMesh);
      terrain.push(coneMesh);
    }
  }

  function buildBuriedTank() {
    var x = 60;
    var z = 80;

    var sandMound = new THREE.BoxGeometry(18, 8, 20);
    var sandMat = new THREE.MeshStandardMaterial({
      color: 0xDEB887,
      roughness: 0.95
    });
    var mound = new THREE.Mesh(sandMound, sandMat);
    mound.position.set(x, 4, z);
    mound.castShadow = true;
    mound.receiveShadow = true;
    scene.add(mound);
    objects.push(mound);

    var turretGeom = new THREE.CylinderGeometry(3, 3.5, 4, 16);
    var turretMat = new THREE.MeshStandardMaterial({
      color: 0x4A4A4A,
      roughness: 0.7,
      metalness: 0.3
    });
    var turret = new THREE.Mesh(turretGeom, turretMat);
    turret.position.set(x, 8.5, z);
    turret.castShadow = true;
    turret.receiveShadow = true;
    scene.add(turret);
    objects.push(turret);

    var barrelGeom = new THREE.CylinderGeometry(0.8, 0.9, 12, 8);
    var barrel = new THREE.Mesh(barrelGeom, turretMat);
    barrel.position.set(x + 9, 10, z);
    barrel.rotation.z = -0.3;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    scene.add(barrel);
    objects.push(barrel);
  }

  function buildBedouinCamp() {
    var baseX = -80;
    var baseZ = -100;

    for (var i = 0; i < 3; i++) {
      var tentX = baseX + i * 25;
      var tentGeom = new THREE.BoxGeometry(8, 10, 12);
      var tentMat = new THREE.MeshStandardMaterial({
        color: 0x2C1810,
        roughness: 0.8
      });
      var tent = new THREE.Mesh(tentGeom, tentMat);
      tent.position.set(tentX, 5, baseZ);
      tent.rotation.z = 0.4;
      tent.castShadow = true;
      tent.receiveShadow = true;
      scene.add(tent);
      objects.push(tent);

      var poleGeom = new THREE.CylinderGeometry(0.4, 0.5, 8, 6);
      var poleMat = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.6
      });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(tentX - 3, 4, baseZ - 4);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);
      objects.push(pole);
    }
  }

  function buildPillars() {
    var positions = [
      { x: 0, z: 40, height: 16 },
      { x: 30, z: 50, height: 10 },
      { x: -25, z: 30, height: 12 },
      { x: 15, z: -60, height: 14 },
      { x: -50, z: -40, height: 9 }
    ];

    positions.forEach(function(pos) {
      var pillarGeom = new THREE.CylinderGeometry(2, 2.5, pos.height, 12);
      var pillarMat = new THREE.MeshStandardMaterial({
        color: 0xA0826D,
        roughness: 0.7,
        metalness: 0.1
      });
      var pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(pos.x, pos.height / 2, pos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      objects.push(pillar);
    });
  }

  function buildGuideWires() {
    var wirePositions = [
      { start: [-100, 5, -100], end: [100, 5, -100] },
      { start: [-100, 5, 0], end: [100, 5, 0] },
      { start: [-100, 5, 100], end: [100, 5, 100] }
    ];

    wirePositions.forEach(function(wire) {
      var points = [
        new THREE.Vector3(wire.start[0], wire.start[1], wire.start[2]),
        new THREE.Vector3(wire.end[0], wire.end[1], wire.end[2])
      ];
      var lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      var lineMat = new THREE.LineBasicMaterial({ color: 0xFF6B35, linewidth: 2 });
      var line = new THREE.LineSegments(lineGeom, lineMat);
      scene.add(line);
      objects.push(line);
    });
  }

  function buildMirages() {
    for (var i = 0; i < 4; i++) {
      var x = (Math.random() - 0.5) * 180;
      var z = 120 + Math.random() * 40;
      var radiusSegments = 8 + Math.floor(Math.random() * 4);

      var sphereGeom = new THREE.SphereGeometry(4 + Math.random() * 3, radiusSegments, radiusSegments);
      var sphereMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0x888888,
        emissiveIntensity: 0.6,
        wireframe: false,
        transparent: true,
        opacity: 0.4
      });
      var sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(x, 8 + Math.random() * 4, z);
      scene.add(sphere);
      objects.push(sphere);
    }
  }

  function buildCamelCarcasses() {
    for (var i = 0; i < 2; i++) {
      var x = -60 + i * 60;
      var z = 20 + Math.random() * 40;

      var bodyGeom = new THREE.SphereGeometry(5, 10, 8);
      var bodyMat = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.8
      });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.scale.set(1.2, 0.8, 1);
      body.position.set(x, 4, z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      objects.push(body);

      var legGeom = new THREE.BoxGeometry(1.2, 5, 1.2);
      for (var j = 0; j < 4; j++) {
        var legX = x + (j % 2) * 3 - 1.5;
        var legZ = z + Math.floor(j / 2) * 3 - 1.5;
        var leg = new THREE.Mesh(legGeom, bodyMat);
        leg.position.set(legX, 2.5, legZ);
        leg.castShadow = true;
        leg.receiveShadow = true;
        scene.add(leg);
        objects.push(leg);
      }
    }
  }

  function buildOasis() {
    var oasisX = -100;
    var oasisZ = 50;

    for (var i = 0; i < 5; i++) {
      var angle = (i / 5) * Math.PI * 2;
      var x = oasisX + Math.cos(angle) * 12;
      var z = oasisZ + Math.sin(angle) * 12;

      var trunkGeom = new THREE.CylinderGeometry(1.2, 1.5, 18, 8);
      var trunkMat = new THREE.MeshStandardMaterial({
        color: 0x6B4423,
        roughness: 0.7
      });
      var trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.set(x, 9, z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);
      objects.push(trunk);

      var foliageGeom = new THREE.SphereGeometry(8, 8, 6);
      var foliageMat = new THREE.MeshStandardMaterial({
        color: 0x228B22,
        roughness: 0.6
      });
      var foliage = new THREE.Mesh(foliageGeom, foliageMat);
      foliage.position.set(x, 20, z);
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      scene.add(foliage);
      objects.push(foliage);
    }
  }

  function init(s, c) {
    scene = s;
    camera = c;

    buildTerrain();
    buildBuriedTank();
    buildBedouinCamp();
    buildPillars();
    buildGuideWires();
    buildMirages();
    buildCamelCarcasses();
    buildOasis();

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    scene.add(directionalLight);

    var skyGeom = new THREE.SphereGeometry(400, 32, 32);
    var skyMat = new THREE.MeshBasicMaterial({
      color: 0xE0B090,
      side: THREE.BackSide
    });
    var sky = new THREE.Mesh(skyGeom, skyMat);
    scene.add(sky);
  }

  function update(delta) {
    objects.forEach(function(obj) {
      if (obj.material && obj.material.emissiveIntensity !== undefined) {
        obj.material.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.003) * 0.2;
      }
    });
  }

  function reset() {
    terrain.forEach(function(obj) {
      scene.remove(obj);
    });
    objects.forEach(function(obj) {
      scene.remove(obj);
    });
    terrain = [];
    objects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
