window.ToxicBay = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var dynamicElements = [];
  var time = 0;

  var toxicGreen = 0x00ff00;
  var darkWater = 0x1a1a2e;
  var orangeHazmat = 0xff8c00;
  var darkOrange = 0xff6b00;
  var lightGray = 0xcccccc;
  var darkGray = 0x333333;
  var redWarning = 0xff0000;
  var yellowWarning = 0xffff00;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    objects = [];
    dynamicElements = [];
    time = 0;

    createWaterSurface();
    createToxicBarrels();
    createSunkenShip();
    createDecontaminationStation();
    createPatrolBoats();
    createChemicalFoam();
    createWarningBuoys();
    createContainmentBarrier();
    createToxicPlumeVents();
    createHazmatStagingArea();
    createDockStructures();
    createLighthouse();
  }

  function createWaterSurface() {
    var geometry = new THREE.BoxGeometry(100, 1, 100);
    var material = new THREE.MeshPhongMaterial({
      color: darkWater,
      shininess: 10
    });
    var water = new THREE.Mesh(geometry, material);
    water.position.y = -5;
    water.receiveShadow = true;
    scene.add(water);
    objects.push(water);
  }

  function createToxicBarrels() {
    var barrelPositions = [
      [-20, 0, -15],
      [-18, 0, -10],
      [-22, 0, -8],
      [15, 0, -20],
      [18, 0, -22],
      [20, 0, -18],
      [-5, 0, 20],
      [-8, 0, 22],
      [5, 0, 25],
      [8, 0, 28]
    ];

    barrelPositions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(2, 2, 4, 8);
      var material = new THREE.MeshPhongMaterial({
        color: toxicGreen,
        emissive: 0x00aa00
      });
      var barrel = new THREE.Mesh(geometry, material);
      barrel.position.set(pos[0], pos[1], pos[2]);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      scene.add(barrel);
      objects.push(barrel);

      var ringGeometry = new THREE.CylinderGeometry(2.3, 2.3, 0.3, 8);
      var ringMaterial = new THREE.MeshPhongMaterial({
        color: darkGray
      });
      var ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(pos[0], pos[1] + 2.5, pos[2]);
      ring.castShadow = true;
      scene.add(ring);
      objects.push(ring);
    });
  }

  function createSunkenShip() {
    var hullGeometry = new THREE.BoxGeometry(25, 8, 6);
    var hullMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a4a4a
    });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(-35, -3, 30);
    hull.rotation.z = 0.3;
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    objects.push(hull);

    var superstructure = new THREE.BoxGeometry(8, 6, 5);
    var superstructureMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a2a2a
    });
    var super1 = new THREE.Mesh(superstructure, superstructureMaterial);
    super1.position.set(-30, 2, 30);
    super1.castShadow = true;
    scene.add(super1);
    objects.push(super1);

    var super2 = new THREE.Mesh(superstructure, superstructureMaterial);
    super2.position.set(-20, 2, 31);
    super2.castShadow = true;
    scene.add(super2);
    objects.push(super2);

    var craneGeometry = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
    var craneMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666
    });
    var crane = new THREE.Mesh(craneGeometry, craneMaterial);
    crane.position.set(-25, 6, 30);
    crane.castShadow = true;
    scene.add(crane);
    objects.push(crane);

    var craneArm = new THREE.BoxGeometry(10, 0.5, 0.5);
    var craneArmMesh = new THREE.Mesh(craneArm, craneMaterial);
    craneArmMesh.position.set(-20, 12, 30);
    craneArmMesh.castShadow = true;
    scene.add(craneArmMesh);
    objects.push(craneArmMesh);
  }

  function createDecontaminationStation() {
    var baseGeometry = new THREE.BoxGeometry(20, 1, 15);
    var baseMaterial = new THREE.MeshPhongMaterial({
      color: lightGray
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(35, 0, -10);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    objects.push(base);

    var roofGeometry = new THREE.BoxGeometry(22, 0.5, 17);
    var roofMaterial = new THREE.MeshPhongMaterial({
      color: orangeHazmat
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(35, 8, -10);
    roof.castShadow = true;
    scene.add(roof);
    objects.push(roof);

    var supportGeometry = new THREE.CylinderGeometry(1, 1, 7.5, 6);
    var supportMaterial = new THREE.MeshPhongMaterial({
      color: darkGray
    });

    var supports = [
      [-11, -5],
      [11, -5],
      [-11, 5],
      [11, 5]
    ];

    supports.forEach(function(pos) {
      var support = new THREE.Mesh(supportGeometry, supportMaterial);
      support.position.set(35 + pos[0], 4, -10 + pos[1]);
      support.castShadow = true;
      scene.add(support);
      objects.push(support);
    });

    var ventGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
    var ventMaterial = new THREE.MeshPhongMaterial({
      color: darkGray
    });
    var vent = new THREE.Mesh(ventGeometry, ventMaterial);
    vent.position.set(35, 10.5, -10);
    vent.castShadow = true;
    scene.add(vent);
    objects.push(vent);
    dynamicElements.push(vent);
  }

  function createPatrolBoats() {
    var boatPositions = [
      [30, -2, -35],
      [-30, -2, 35]
    ];

    boatPositions.forEach(function(pos, index) {
      var hullGeometry = new THREE.BoxGeometry(8, 2, 3);
      var hullMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a
      });
      var hull = new THREE.Mesh(hullGeometry, hullMaterial);
      hull.position.set(pos[0], pos[1], pos[2]);
      hull.castShadow = true;
      hull.receiveShadow = true;
      scene.add(hull);
      objects.push(hull);

      var cabinGeometry = new THREE.BoxGeometry(2, 2, 2);
      var cabinMaterial = new THREE.MeshPhongMaterial({
        color: darkGray
      });
      var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
      cabin.position.set(pos[0], pos[1] + 2, pos[2] + 1);
      cabin.castShadow = true;
      scene.add(cabin);
      objects.push(cabin);

      var lampGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      var lampMaterial = new THREE.MeshPhongMaterial({
        color: redWarning,
        emissive: 0xff0000
      });
      var lamp = new THREE.Mesh(lampGeometry, lampMaterial);
      lamp.position.set(pos[0], pos[1] + 4, pos[2]);
      scene.add(lamp);
      dynamicElements.push({
        object: lamp,
        type: 'patrolLight',
        index: index
      });

      var gunGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
      var gunMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333
      });
      var gun = new THREE.Mesh(gunGeometry, gunMaterial);
      gun.position.set(pos[0], pos[1] + 2.5, pos[2] - 2);
      gun.rotation.z = 0.4;
      gun.castShadow = true;
      scene.add(gun);
      objects.push(gun);
    });
  }

  function createChemicalFoam() {
    var foamClusters = [
      [-10, 0, 10],
      [5, 0, -5],
      [25, 0, 15],
      [-25, 0, -25],
      [10, 0, -30],
      [0, 0, 35],
      [-15, 0, 5]
    ];

    foamClusters.forEach(function(pos) {
      var boxCount = 4 + Math.floor(Math.random() * 3);
      for (var i = 0; i < boxCount; i++) {
        var foamGeometry = new THREE.BoxGeometry(2, 1.5, 2);
        var foamMaterial = new THREE.MeshPhongMaterial({
          color: 0xf0f0f0,
          emissive: 0x88ff88,
          transparent: true,
          opacity: 0.8
        });
        var foam = new THREE.Mesh(foamGeometry, foamMaterial);
        var offsetX = (Math.random() - 0.5) * 4;
        var offsetZ = (Math.random() - 0.5) * 4;
        var offsetY = (Math.random() - 0.5) * 1.5;
        foam.position.set(pos[0] + offsetX, pos[1] + offsetY, pos[2] + offsetZ);
        foam.rotation.x = Math.random() * Math.PI;
        foam.rotation.z = Math.random() * Math.PI;
        foam.castShadow = true;
        foam.receiveShadow = true;
        scene.add(foam);
        objects.push(foam);
        dynamicElements.push({
          object: foam,
          type: 'foamBubble',
          basePos: [foam.position.x, foam.position.y, foam.position.z],
          rotSpeed: [(Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3]
        });
      }
    });
  }

  function createWarningBuoys() {
    var buoyPositions = [
      [20, 0, 0],
      [0, 0, 20],
      [-20, 0, 10],
      [10, 0, -20],
      [-10, 0, -15]
    ];

    buoyPositions.forEach(function(pos) {
      var bodyGeometry = new THREE.CylinderGeometry(1, 1, 2, 8);
      var bodyMaterial = new THREE.MeshPhongMaterial({
        color: yellowWarning
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos[0], pos[1], pos[2]);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      objects.push(body);

      var topGeometry = new THREE.ConeGeometry(1.2, 1.5, 8);
      var topMaterial = new THREE.MeshPhongMaterial({
        color: redWarning
      });
      var top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.set(pos[0], pos[1] + 2, pos[2]);
      top.castShadow = true;
      scene.add(top);
      objects.push(top);

      var pole1Geom = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 4);
      var poleMat = new THREE.MeshPhongMaterial({color: darkGray});
      var pole1 = new THREE.Mesh(pole1Geom, poleMat);
      pole1.position.set(pos[0] - 1, pos[1] + 1, pos[2]);
      scene.add(pole1);
      objects.push(pole1);

      var pole2 = new THREE.Mesh(pole1Geom, poleMat);
      pole2.position.set(pos[0] + 1, pos[1] + 1, pos[2]);
      scene.add(pole2);
      objects.push(pole2);
    });
  }

  function createContainmentBarrier() {
    var barrierSegments = 8;
    var radius = 15;
    var baseY = 0;

    for (var i = 0; i < barrierSegments; i++) {
      var angle = (i / barrierSegments) * Math.PI * 2;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var segGeometry = new THREE.BoxGeometry(5, 2, 0.5);
      var segMaterial = new THREE.MeshPhongMaterial({
        color: orangeHazmat
      });
      var segment = new THREE.Mesh(segGeometry, segMaterial);
      segment.position.set(x, baseY, z);
      segment.rotation.y = angle + Math.PI / 2;
      segment.castShadow = true;
      segment.receiveShadow = true;
      scene.add(segment);
      objects.push(segment);

      var floatGeometry = new THREE.SphereGeometry(0.8, 6, 6);
      var floatMaterial = new THREE.MeshPhongMaterial({
        color: yellowWarning
      });
      var float1 = new THREE.Mesh(floatGeometry, floatMaterial);
      float1.position.set(x - 2, baseY + 1.5, z);
      scene.add(float1);
      dynamicElements.push({
        object: float1,
        type: 'barrierFloat',
        basePos: [x - 2, baseY + 1.5, z],
        floatOffset: 0
      });

      var float2 = new THREE.Mesh(floatGeometry, floatMaterial);
      float2.position.set(x + 2, baseY + 1.5, z);
      scene.add(float2);
      dynamicElements.push({
        object: float2,
        type: 'barrierFloat',
        basePos: [x + 2, baseY + 1.5, z],
        floatOffset: 0.5
      });
    }
  }

  function createToxicPlumeVents() {
    var ventPositions = [
      [-30, -4, 0],
      [-15, -4, -20],
      [25, -4, 10]
    ];

    ventPositions.forEach(function(pos) {
      var pipeGeometry = new THREE.CylinderGeometry(1, 1, 6, 8);
      var pipeMaterial = new THREE.MeshPhongMaterial({
        color: darkGray
      });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.position.set(pos[0], pos[1], pos[2]);
      pipe.castShadow = true;
      scene.add(pipe);
      objects.push(pipe);

      var openingGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 8);
      var openingMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333
      });
      var opening = new THREE.Mesh(openingGeometry, openingMaterial);
      opening.position.set(pos[0], pos[1] + 2.8, pos[2]);
      scene.add(opening);
      objects.push(opening);

      dynamicElements.push({
        object: pipe,
        type: 'vent',
        basePos: pos
      });
    });
  }

  function createHazmatStagingArea() {
    var platformGeometry = new THREE.BoxGeometry(18, 0.5, 12);
    var platformMaterial = new THREE.MeshPhongMaterial({
      color: lightGray
    });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(-40, 0, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    objects.push(platform);

    var crateGeometry = new THREE.BoxGeometry(2, 2, 2);
    var crateMaterial = new THREE.MeshPhongMaterial({
      color: orangeHazmat
    });

    var cratePositions = [
      [-48, 1, -4],
      [-48, 1, 0],
      [-48, 1, 4],
      [-45, 1, -4],
      [-45, 1, 4]
    ];

    cratePositions.forEach(function(pos) {
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(pos[0], pos[1], pos[2]);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      objects.push(crate);
    });

    var tankGeometry = new THREE.CylinderGeometry(2.5, 2.5, 5, 8);
    var tankMaterial = new THREE.MeshPhongMaterial({
      color: darkOrange
    });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(-32, 2.5, -4);
    tank.castShadow = true;
    tank.receiveShadow = true;
    scene.add(tank);
    objects.push(tank);

    var roofGeometry = new THREE.BoxGeometry(8, 0.5, 8);
    var roofMaterial = new THREE.MeshPhongMaterial({
      color: darkGray
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-35, 5, 4);
    roof.castShadow = true;
    scene.add(roof);
    objects.push(roof);

    var pillarGeometry = new THREE.CylinderGeometry(0.6, 0.6, 4.5, 6);
    var pillarMaterial = new THREE.MeshPhongMaterial({
      color: lightGray
    });

    var pillars = [
      [-38, 0, 1],
      [-32, 0, 1],
      [-38, 0, 7],
      [-32, 0, 7]
    ];

    pillars.forEach(function(pos) {
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos[0], pos[1] + 2.25, pos[2]);
      pillar.castShadow = true;
      scene.add(pillar);
      objects.push(pillar);
    });
  }

  function createDockStructures() {
    var dockGeometry = new THREE.BoxGeometry(30, 1, 8);
    var dockMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b7355
    });
    var dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.set(-5, 0.5, -35);
    dock.castShadow = true;
    dock.receiveShadow = true;
    scene.add(dock);
    objects.push(dock);

    var pillarGeometry = new THREE.CylinderGeometry(1, 1.5, 2, 8);
    var pillarMaterial = new THREE.MeshPhongMaterial({
      color: 0x654321
    });

    var pillarPositions = [
      [-20, 0, -35],
      [-10, 0, -35],
      [0, 0, -35],
      [10, 0, -35]
    ];

    pillarPositions.forEach(function(pos) {
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos[0], pos[1] + 1, pos[2]);
      pillar.castShadow = true;
      scene.add(pillar);
      objects.push(pillar);
    });

    var boomerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 20, 6);
    var boomerMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666
    });
    var boomer = new THREE.Mesh(boomerGeometry, boomerMaterial);
    boomer.position.set(15, 5, -35);
    boomer.rotation.z = 0.3;
    boomer.castShadow = true;
    scene.add(boomer);
    objects.push(boomer);

    var hooksGeometry = new THREE.SphereGeometry(0.6, 6, 6);
    var hooksMaterial = new THREE.MeshPhongMaterial({
      color: darkGray
    });
    var hooks = new THREE.Mesh(hooksGeometry, hooksMaterial);
    hooks.position.set(24, 10, -35);
    scene.add(hooks);
    objects.push(hooks);
  }

  function createLighthouse() {
    var baseGeometry = new THREE.CylinderGeometry(3, 3.5, 1, 16);
    var baseMaterial = new THREE.MeshPhongMaterial({
      color: lightGray
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(40, 0, 10);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    objects.push(base);

    var towerGeometry = new THREE.CylinderGeometry(2, 2, 20, 12);
    var towerMaterial = new THREE.MeshPhongMaterial({
      color: darkGray
    });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(40, 10, 10);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    objects.push(tower);

    var capGeometry = new THREE.ConeGeometry(2.3, 2, 12);
    var capMaterial = new THREE.MeshPhongMaterial({
      color: redWarning
    });
    var cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(40, 21, 10);
    cap.castShadow = true;
    scene.add(cap);
    objects.push(cap);

    var beamGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    var beamMaterial = new THREE.MeshPhongMaterial({
      color: yellowWarning,
      emissive: 0xffff00
    });
    var beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(40, 22, 10);
    scene.add(beam);
    dynamicElements.push({
      object: beam,
      type: 'lighthouseBeam'
    });

    var railingGeometry = new THREE.CylinderGeometry(2.2, 2.2, 0.3, 12);
    var railingMaterial = new THREE.MeshPhongMaterial({
      color: darkGray
    });
    var railing = new THREE.Mesh(railingGeometry, railingMaterial);
    railing.position.set(40, 20.5, 10);
    scene.add(railing);
    objects.push(railing);
  }

  function update(delta) {
    time += delta;

    dynamicElements.forEach(function(elem) {
      if (elem.type === 'foamBubble') {
        elem.object.rotation.x += elem.rotSpeed[0] * delta;
        elem.object.rotation.y += elem.rotSpeed[1] * delta;
        elem.object.rotation.z += elem.rotSpeed[2] * delta;

        var wave = Math.sin(time * 2 + elem.basePos[0] * 0.1) * 0.3;
        elem.object.position.y = elem.basePos[1] + wave;

        elem.object.position.x = elem.basePos[0] + Math.sin(time * 0.5 + elem.basePos[2] * 0.05) * 0.2;
        elem.object.position.z = elem.basePos[2] + Math.cos(time * 0.5 + elem.basePos[0] * 0.05) * 0.2;
      } else if (elem.type === 'barrierFloat') {
        var floatWave = Math.sin(time * 1.5 + elem.floatOffset) * 0.4;
        elem.object.position.y = elem.basePos[1] + floatWave;
      } else if (elem.type === 'patrolLight') {
        var intensity = Math.sin(time * 3 + elem.index * Math.PI) * 0.5 + 0.5;
        elem.object.material.emissive.setScalar(intensity);
      } else if (elem.type === 'vent') {
        elem.object.rotation.z += 0.02;
      } else if (elem.type === 'lighthouseBeam') {
        elem.object.rotation.y += 1.5 * delta;
        var beamIntensity = Math.sin(time * 2) * 0.3 + 0.7;
        elem.object.material.emissive.setScalar(beamIntensity);
      }
    });
  }

  function reset() {
    time = 0;
    objects.forEach(function(obj) {
      if (obj && obj.parent) {
        obj.parent.remove(obj);
      }
    });
    objects = [];
    dynamicElements = [];
    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
