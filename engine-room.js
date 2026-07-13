window.EngineRoom = (function() {
  'use strict';

  var scene;
  var camera;
  var turbines = [];
  var gaugeMeshes = [];
  var pipeNetwork = [];
  var steamBursts = [];
  var catwalks = [];
  var controlPanels = [];
  var time = 0;

  var steelColor = 0x444444;
  var warningColor = 0xFF6600;
  var bilgeColor = 0x1a1a2e;
  var pipeColor = 0x555555;
  var gaussColor = 0x333333;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    time = 0;

    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 200, 500);

    buildFloor();
    buildBilge();
    buildTurbines();
    buildCatwalks();
    buildBoilers();
    buildPipesNetwork();
    buildControlPanels();
    buildEmergencyShutdown();
    buildCoolantTanks();
    buildGauges();
    buildFireSuppression();
    buildDriveShaft();
    buildLighting();
  }

  function buildFloor() {
    var floorGeometry = new THREE.BoxGeometry(80, 2, 80);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: steelColor,
      metalness: 0.7,
      roughness: 0.8
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 8;
    scene.add(floor);
  }

  function buildBilge() {
    var bilgeGeometry = new THREE.BoxGeometry(80, 6, 80);
    var bilgeMaterial = new THREE.MeshStandardMaterial({
      color: bilgeColor,
      metalness: 0.5,
      roughness: 0.9
    });
    var bilge = new THREE.Mesh(bilgeGeometry, bilgeMaterial);
    bilge.position.y = 0;
    scene.add(bilge);

    var waterGeometry = new THREE.BoxGeometry(75, 2, 75);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x001a4d,
      metalness: 0.6,
      roughness: 0.3,
      transparent: true,
      opacity: 0.5
    });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, 1.5, 0);
    scene.add(water);
  }

  function buildTurbines() {
    var turbinePositions = [
      { x: -30, z: -25 },
      { x: -30, z: 0 },
      { x: -30, z: 25 },
      { x: 0, z: -30 },
      { x: 0, z: 0 },
      { x: 0, z: 30 },
      { x: 30, z: -25 },
      { x: 30, z: 0 },
      { x: 30, z: 25 }
    ];

    for (var i = 0; i < turbinePositions.length; i++) {
      var pos = turbinePositions[i];
      var turbine = buildTurbine(pos.x, pos.z);
      turbines.push({
        group: turbine,
        position: pos,
        rotation: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 0.5
      });
    }
  }

  function buildTurbine(x, z) {
    var group = new THREE.Group();
    group.position.set(x, 12, z);

    var baseCylinderGeometry = new THREE.CylinderGeometry(4, 4, 8, 16);
    var turbineMaterial = new THREE.MeshStandardMaterial({
      color: steelColor,
      metalness: 0.8,
      roughness: 0.6
    });
    var baseStage = new THREE.Mesh(baseCylinderGeometry, turbineMaterial);
    baseStage.position.y = 2;
    group.add(baseStage);

    var stage2 = new THREE.Mesh(baseCylinderGeometry, turbineMaterial);
    stage2.position.y = 6;
    group.add(stage2);

    var stage3 = new THREE.Mesh(baseCylinderGeometry, turbineMaterial);
    stage3.position.y = 10;
    group.add(stage3);

    var shaftGeometry = new THREE.CylinderGeometry(0.8, 0.8, 14, 8);
    var shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.4
    });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = 4;
    group.add(shaft);

    var capGeometry = new THREE.SphereGeometry(4.5, 16, 8);
    var capMaterial = new THREE.MeshStandardMaterial({
      color: warningColor,
      metalness: 0.6,
      roughness: 0.7
    });
    var cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = 14;
    group.add(cap);

    scene.add(group);
    return group;
  }

  function buildCatwalks() {
    var catwalkConfigs = [
      { y: 18, z: -35, length: 60 },
      { y: 20, z: 0, length: 60 },
      { y: 22, z: 35, length: 60 },
      { y: 16, x: -35, length: 60 },
      { y: 24, x: 35, length: 60 }
    ];

    for (var i = 0; i < catwalkConfigs.length; i++) {
      var config = catwalkConfigs[i];
      var catwalk = buildCatwalk(config);
      catwalks.push(catwalk);
    }
  }

  function buildCatwalk(config) {
    var group = new THREE.Group();

    var plankGeometry = new THREE.BoxGeometry(config.length, 0.4, 3);
    var plankMaterial = new THREE.MeshStandardMaterial({
      color: steelColor,
      metalness: 0.7,
      roughness: 0.8
    });
    var plank = new THREE.Mesh(plankGeometry, plankMaterial);
    plank.position.y = config.y;
    if (config.z !== undefined) {
      plank.position.z = config.z;
    } else if (config.x !== undefined) {
      plank.position.x = config.x;
      plank.rotation.y = Math.PI / 2;
    }
    group.add(plank);

    var railGeometry = new THREE.BoxGeometry(config.length, 1.5, 0.3);
    var railMaterial = new THREE.MeshStandardMaterial({
      color: warningColor,
      metalness: 0.6,
      roughness: 0.7
    });
    var rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.y = config.y + 0.8;
    if (config.z !== undefined) {
      rail.position.z = config.z - 1.5;
    } else if (config.x !== undefined) {
      rail.position.x = config.x - 1.5;
      rail.rotation.y = Math.PI / 2;
    }
    group.add(rail);

    scene.add(group);
    return group;
  }

  function buildBoilers() {
    var boilerPositions = [
      { x: -35, z: -35 },
      { x: -35, z: 35 },
      { x: 35, z: -35 },
      { x: 35, z: 35 }
    ];

    for (var i = 0; i < boilerPositions.length; i++) {
      var pos = boilerPositions[i];
      var boiler = buildBoiler(pos.x, pos.z);
      scene.add(boiler);
    }
  }

  function buildBoiler(x, z) {
    var group = new THREE.Group();
    group.position.set(x, 12, z);

    var tankGeometry = new THREE.CylinderGeometry(5, 5, 12, 16);
    var tankMaterial = new THREE.MeshStandardMaterial({
      color: steelColor,
      metalness: 0.7,
      roughness: 0.8
    });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.y = 2;
    group.add(tank);

    var hemisphereMaterial = new THREE.MeshStandardMaterial({
      color: warningColor,
      metalness: 0.6,
      roughness: 0.7
    });
    var domeGeometry = new THREE.SphereGeometry(5.2, 16, 8);
    var dome = new THREE.Mesh(domeGeometry, hemisphereMaterial);
    dome.position.y = 8;
    dome.scale.z = 0.5;
    group.add(dome);

    for (var i = 0; i < 4; i++) {
      var gaugeGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      var gaugeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        metalness: 0.5,
        roughness: 0.6
      });
      var gauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
      var angle = (i / 4) * Math.PI * 2;
      gauge.position.set(Math.cos(angle) * 4, 6, Math.sin(angle) * 4);
      group.add(gauge);
      gaugeMeshes.push({ mesh: gauge, index: i });
    }

    return group;
  }

  function buildPipesNetwork() {
    var pipeConfigs = [
      { start: { x: -25, y: 15, z: -25 }, end: { x: 25, y: 15, z: -25 } },
      { start: { x: -25, y: 17, z: 0 }, end: { x: 25, y: 17, z: 0 } },
      { start: { x: -25, y: 19, z: 25 }, end: { x: 25, y: 19, z: 25 } },
      { start: { x: -35, y: 12, z: -20 }, end: { x: -35, y: 20, z: -20 } },
      { start: { x: 35, y: 12, z: 20 }, end: { x: 35, y: 20, z: 20 } },
      { start: { x: -15, y: 10, z: -35 }, end: { x: -15, y: 18, z: -35 } },
      { start: { x: 15, y: 10, z: 35 }, end: { x: 15, y: 18, z: 35 } }
    ];

    for (var i = 0; i < pipeConfigs.length; i++) {
      var config = pipeConfigs[i];
      var pipe = buildPipe(config.start, config.end);
      pipeNetwork.push(pipe);
      scene.add(pipe);
    }
  }

  function buildPipe(start, end) {
    var group = new THREE.Group();

    var dx = end.x - start.x;
    var dy = end.y - start.y;
    var dz = end.z - start.z;
    var length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    var pipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, length, 8);
    var pipeMaterial = new THREE.MeshStandardMaterial({
      color: pipeColor,
      metalness: 0.7,
      roughness: 0.8
    });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);

    var midX = (start.x + end.x) / 2;
    var midY = (start.y + end.y) / 2;
    var midZ = (start.z + end.z) / 2;
    pipe.position.set(midX, midY, midZ);

    pipe.lookAt(end.x, end.y, end.z);
    pipe.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

    group.add(pipe);

    var flangeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 8);
    var flangeMaterial = new THREE.MeshStandardMaterial({
      color: warningColor,
      metalness: 0.5,
      roughness: 0.7
    });
    var flange1 = new THREE.Mesh(flangeGeometry, flangeMaterial);
    flange1.position.copy(new THREE.Vector3(start.x, start.y, start.z));
    group.add(flange1);

    var flange2 = new THREE.Mesh(flangeGeometry, flangeMaterial);
    flange2.position.copy(new THREE.Vector3(end.x, end.y, end.z));
    group.add(flange2);

    return group;
  }

  function buildControlPanels() {
    var panelPositions = [
      { x: -39, z: -20, rot: Math.PI / 2 },
      { x: -39, z: 20, rot: Math.PI / 2 },
      { x: 39, z: -20, rot: -Math.PI / 2 },
      { x: 39, z: 20, rot: -Math.PI / 2 },
      { x: -20, z: 39, rot: 0 },
      { x: 20, z: 39, rot: 0 }
    ];

    for (var i = 0; i < panelPositions.length; i++) {
      var pos = panelPositions[i];
      var panel = buildPanel(pos);
      controlPanels.push(panel);
      scene.add(panel);
    }
  }

  function buildPanel(config) {
    var group = new THREE.Group();
    group.position.set(config.x, 14, config.z);
    group.rotation.y = config.rot;

    var backplateGeometry = new THREE.BoxGeometry(8, 10, 0.5);
    var backplateMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.4,
      roughness: 0.9
    });
    var backplate = new THREE.Mesh(backplateGeometry, backplateMaterial);
    group.add(backplate);

    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var buttonGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.3);
        var buttonColor = (row + col) % 2 === 0 ? 0xFF0000 : 0x00FF00;
        var buttonMaterial = new THREE.MeshStandardMaterial({
          color: buttonColor,
          metalness: 0.6,
          roughness: 0.5
        });
        var button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        var x = -3 + col * 2;
        var y = 3 - row * 3;
        button.position.set(x, y, 0.3);
        group.add(button);
      }
    }

    return group;
  }

  function buildEmergencyShutdown() {
    var shutdownGeometry = new THREE.BoxGeometry(3, 6, 1);
    var shutdownMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      metalness: 0.5,
      roughness: 0.6,
      emissive: 0xFF0000,
      emissiveIntensity: 0.3
    });
    var shutdown = new THREE.Mesh(shutdownGeometry, shutdownMaterial);
    shutdown.position.set(0, 16, -39);
    scene.add(shutdown);

    var leverGeometry = new THREE.BoxGeometry(0.5, 3, 0.3);
    var leverMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      metalness: 0.8,
      roughness: 0.4
    });
    var lever = new THREE.Mesh(leverGeometry, leverMaterial);
    lever.position.set(0, 19, -38);
    scene.add(lever);
  }

  function buildCoolantTanks() {
    var tankPositions = [
      { x: -25, z: -40 },
      { x: 0, z: -40 },
      { x: 25, z: -40 },
      { x: -25, z: 40 },
      { x: 0, z: 40 },
      { x: 25, z: 40 }
    ];

    for (var i = 0; i < tankPositions.length; i++) {
      var pos = tankPositions[i];
      var tank = buildCoolantTank(pos.x, pos.z);
      scene.add(tank);
    }
  }

  function buildCoolantTank(x, z) {
    var group = new THREE.Group();
    group.position.set(x, 10, z);

    var bodyGeometry = new THREE.CylinderGeometry(2.5, 2.5, 6, 12);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: steelColor,
      metalness: 0.7,
      roughness: 0.8
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    group.add(body);

    var capGeometry = new THREE.SphereGeometry(2.6, 12, 6);
    var capMaterial = new THREE.MeshStandardMaterial({
      color: warningColor,
      metalness: 0.6,
      roughness: 0.7
    });
    var cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = 4;
    cap.scale.z = 0.4;
    group.add(cap);

    var ventGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 6);
    var ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      metalness: 0.5,
      roughness: 0.6
    });
    var vent = new THREE.Mesh(ventGeometry, ventMaterial);
    vent.position.set(0, 5.5, 0);
    group.add(vent);

    return group;
  }

  function buildGauges() {
    var gaugePositions = [
      { x: -28, y: 16, z: -28 },
      { x: 28, y: 16, z: -28 },
      { x: -28, y: 16, z: 28 },
      { x: 28, y: 16, z: 28 },
      { x: -15, y: 22, z: 0 },
      { x: 15, y: 22, z: 0 }
    ];

    for (var i = 0; i < gaugePositions.length; i++) {
      var pos = gaugePositions[i];
      var gauge = buildGauge(pos.x, pos.y, pos.z);
      scene.add(gauge);
    }
  }

  function buildGauge(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var caseGeometry = new THREE.BoxGeometry(2.5, 2.5, 0.8);
    var caseMaterial = new THREE.MeshStandardMaterial({
      color: gaussColor,
      metalness: 0.6,
      roughness: 0.7
    });
    var caseBox = new THREE.Mesh(caseGeometry, caseMaterial);
    group.add(caseBox);

    var faceGeometry = new THREE.BoxGeometry(2.2, 2.2, 0.1);
    var faceMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      metalness: 0.3,
      roughness: 0.8
    });
    var face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.position.z = 0.5;
    group.add(face);

    var needleGeometry = new THREE.BoxGeometry(0.2, 1, 0.1);
    var needleMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      metalness: 0.7,
      roughness: 0.5
    });
    var needle = new THREE.Mesh(needleGeometry, needleMaterial);
    needle.position.z = 0.6;
    group.add(needle);
    gaugeMeshes.push({ mesh: needle, isNeedle: true });

    var rimGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.2, 16);
    var rimMaterial = new THREE.MeshStandardMaterial({
      color: warningColor,
      metalness: 0.7,
      roughness: 0.6
    });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.z = 0.5;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    return group;
  }

  function buildFireSuppression() {
    var nozzlePositions = [
      { x: -30, y: 28, z: -30 },
      { x: 0, y: 28, z: -30 },
      { x: 30, y: 28, z: -30 },
      { x: -30, y: 28, z: 0 },
      { x: 30, y: 28, z: 0 },
      { x: -30, y: 28, z: 30 },
      { x: 0, y: 28, z: 30 },
      { x: 30, y: 28, z: 30 }
    ];

    for (var i = 0; i < nozzlePositions.length; i++) {
      var pos = nozzlePositions[i];
      var nozzle = buildNozzle(pos.x, pos.y, pos.z);
      scene.add(nozzle);
    }
  }

  function buildNozzle(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
    var armMaterial = new THREE.MeshStandardMaterial({
      color: steelColor,
      metalness: 0.7,
      roughness: 0.8
    });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.y = -1.5;
    group.add(arm);

    var nozzleGeometry = new THREE.ConeGeometry(0.4, 1.2, 8);
    var nozzleMaterial = new THREE.MeshStandardMaterial({
      color: warningColor,
      metalness: 0.6,
      roughness: 0.7
    });
    var nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
    nozzle.position.y = -3;
    nozzle.rotation.x = Math.PI;
    group.add(nozzle);

    return group;
  }

  function buildDriveShaft() {
    var shaftLength = 60;
    var shaftGeometry = new THREE.CylinderGeometry(1.5, 1.5, shaftLength, 12);
    var shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.5
    });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = 10;
    shaft.rotation.z = Math.PI / 2;
    scene.add(shaft);

    for (var i = 0; i < 8; i++) {
      var bearingGeometry = new THREE.SphereGeometry(2, 8, 8);
      var bearingMaterial = new THREE.MeshStandardMaterial({
        color: steelColor,
        metalness: 0.7,
        roughness: 0.7
      });
      var bearing = new THREE.Mesh(bearingGeometry, bearingMaterial);
      var bearingX = -30 + i * 8.5;
      bearing.position.set(bearingX, 10, 0);
      scene.add(bearing);
    }
  }

  function buildLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    var warningLight1 = new THREE.PointLight(0xFF6600, 0.8, 40);
    warningLight1.position.set(-30, 20, -30);
    scene.add(warningLight1);

    var warningLight2 = new THREE.PointLight(0xFF6600, 0.8, 40);
    warningLight2.position.set(30, 20, 30);
    scene.add(warningLight2);

    var bilgeLight = new THREE.PointLight(0x1a4d7f, 0.5, 50);
    bilgeLight.position.set(0, 2, 0);
    scene.add(bilgeLight);
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < turbines.length; i++) {
      var turbine = turbines[i];
      turbine.rotation += turbine.speed * delta * 2;
      turbine.group.rotation.y = turbine.rotation;

      var children = turbine.group.children;
      for (var j = 0; j < children.length; j++) {
        if (children[j].geometry instanceof THREE.CylinderGeometry) {
          children[j].rotation.y += turbine.speed * delta * 3;
        }
      }
    }

    for (var i = 0; i < gaugeMeshes.length; i++) {
      var gauge = gaugeMeshes[i];
      if (gauge.isNeedle) {
        var needleAngle = Math.sin(time * 2 + i) * 0.4;
        gauge.mesh.rotation.z = needleAngle;
      } else {
        var scaleVar = 0.9 + Math.sin(time * 3 + i * 0.5) * 0.1;
        gauge.mesh.scale.set(scaleVar, scaleVar, 1);
      }
    }

    if (Math.random() > 0.98) {
      var burstX = (Math.random() - 0.5) * 60;
      var burstZ = (Math.random() - 0.5) * 60;
      steamBursts.push({
        x: burstX,
        z: burstZ,
        life: 0.3,
        maxLife: 0.3,
        particles: []
      });
    }

    for (var i = steamBursts.length - 1; i >= 0; i--) {
      var burst = steamBursts[i];
      burst.life -= delta;
      if (burst.life <= 0) {
        steamBursts.splice(i, 1);
      }
    }
  }

  function reset() {
    time = 0;
    turbines = [];
    gaugeMeshes = [];
    pipeNetwork = [];
    steamBursts = [];
    catwalks = [];
    controlPanels = [];

    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
