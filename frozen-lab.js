window.FrozenLab = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var icicles = [];
  var particles = [];
  var breathParticles = [];
  var nitrogenWisps = [];
  var gaugeNeedle = null;
  var time = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    icicles = [];
    particles = [];
    breathParticles = [];
    nitrogenWisps = [];
    time = 0;

    buildCorridors();
    buildCryoChambers();
    buildFrozenScientists();
    buildOverturnedTables();
    buildNitrogenSpill();
    buildFrozenTerminals();
    buildIcicleFormations();
    buildFrozenExit();
    buildCryoVault();
    buildTemperatureGauge();
    initBreathParticles();
    initNitrogenWisps();
  }

  function buildCorridors() {
    var hallway1Geometry = new THREE.BoxGeometry(20, 8, 40);
    var hallway1Material = new THREE.MeshStandardMaterial({ color: 0x1a3a52, roughness: 0.7 });
    var hallway1 = new THREE.Mesh(hallway1Geometry, hallway1Material);
    hallway1.position.set(0, 4, 0);
    hallway1.receiveShadow = true;
    scene.add(hallway1);
    objects.push(hallway1);

    var iceOverlay1Geometry = new THREE.BoxGeometry(20.1, 0.2, 40.1);
    var iceOverlayMaterial = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      roughness: 0.3,
      transparent: true,
      opacity: 0.4
    });
    var iceOverlay1 = new THREE.Mesh(iceOverlay1Geometry, iceOverlayMaterial);
    iceOverlay1.position.set(0, 8.05, 0);
    scene.add(iceOverlay1);

    var hallway2Geometry = new THREE.BoxGeometry(40, 8, 20);
    var hallway2Material = new THREE.MeshStandardMaterial({ color: 0x1a3a52, roughness: 0.7 });
    var hallway2 = new THREE.Mesh(hallway2Geometry, hallway2Material);
    hallway2.position.set(0, 4, -20);
    hallway2.receiveShadow = true;
    scene.add(hallway2);
    objects.push(hallway2);

    var iceOverlay2Geometry = new THREE.BoxGeometry(40.1, 0.2, 20.1);
    var iceOverlay2 = new THREE.Mesh(iceOverlay2Geometry, iceOverlayMaterial);
    iceOverlay2.position.set(0, 8.05, -20);
    scene.add(iceOverlay2);

    var wallGeometry = new THREE.BoxGeometry(0.5, 8, 40);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2a4a62, roughness: 0.6 });
    var leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-10.25, 4, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    var rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(10.25, 4, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);
  }

  function buildCryoChambers() {
    var positions = [
      { x: -25, z: 5 },
      { x: -25, z: -15 },
      { x: 25, z: 5 },
      { x: 25, z: -15 }
    ];

    positions.forEach(function(pos) {
      var tankGeometry = new THREE.CylinderGeometry(3, 3, 6, 16);
      var tankMaterial = new THREE.MeshStandardMaterial({
        color: 0x336699,
        metalness: 0.6,
        roughness: 0.4
      });
      var tank = new THREE.Mesh(tankGeometry, tankMaterial);
      tank.position.set(pos.x, 3, pos.z);
      tank.castShadow = true;
      tank.receiveShadow = true;
      scene.add(tank);
      objects.push(tank);

      var iceCoatingGeometry = new THREE.CylinderGeometry(3.1, 3.1, 6.1, 16);
      var iceCoatingMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.2
      });
      var iceCoating = new THREE.Mesh(iceCoatingGeometry, iceCoatingMaterial);
      iceCoating.position.set(pos.x, 3, pos.z);
      iceCoating.scale.z = 0.98;
      scene.add(iceCoating);
    });
  }

  function buildFrozenScientists() {
    var positions = [
      { x: -12, z: 10, rotZ: Math.PI * 0.3 },
      { x: 8, z: -8, rotZ: Math.PI * 0.6 },
      { x: -18, z: -25, rotZ: 0 }
    ];

    positions.forEach(function(pos) {
      var headGeometry = new THREE.BoxGeometry(1, 1, 0.8);
      var frozenMaterial = new THREE.MeshStandardMaterial({
        color: 0xccddee,
        roughness: 0.5
      });
      var head = new THREE.Mesh(headGeometry, frozenMaterial);
      head.position.set(pos.x, 1.8, pos.z);
      head.castShadow = true;
      scene.add(head);

      var bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.6);
      var body = new THREE.Mesh(bodyGeometry, frozenMaterial);
      body.position.set(pos.x, 0.9, pos.z);
      body.castShadow = true;
      body.rotation.z = pos.rotZ;
      scene.add(body);

      var legGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
      var leftLeg = new THREE.Mesh(legGeometry, frozenMaterial);
      leftLeg.position.set(pos.x - 0.3, 0.2, pos.z);
      leftLeg.castShadow = true;
      scene.add(leftLeg);

      var rightLeg = new THREE.Mesh(legGeometry, frozenMaterial);
      rightLeg.position.set(pos.x + 0.3, 0.2, pos.z);
      rightLeg.castShadow = true;
      scene.add(rightLeg);
    });
  }

  function buildOverturnedTables() {
    var tablePositions = [
      { x: -8, z: 20 },
      { x: 15, z: -10 }
    ];

    tablePositions.forEach(function(pos) {
      var tableGeometry = new THREE.BoxGeometry(4, 0.4, 2);
      var tableMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3a2a,
        roughness: 0.8
      });
      var table = new THREE.Mesh(tableGeometry, tableMaterial);
      table.position.set(pos.x, 1.5, pos.z);
      table.rotation.z = Math.PI * 0.4;
      table.castShadow = true;
      table.receiveShadow = true;
      scene.add(table);

      var equipment1Geometry = new THREE.BoxGeometry(0.6, 0.3, 0.4);
      var equipmentMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.7
      });
      var eq1 = new THREE.Mesh(equipment1Geometry, equipmentMaterial);
      eq1.position.set(pos.x + 1, 0.8, pos.z + 0.5);
      eq1.castShadow = true;
      scene.add(eq1);

      var equipment2Geometry = new THREE.BoxGeometry(0.5, 0.25, 0.5);
      var eq2 = new THREE.Mesh(equipment2Geometry, equipmentMaterial);
      eq2.position.set(pos.x - 1.2, 0.6, pos.z - 0.8);
      eq2.castShadow = true;
      scene.add(eq2);
    });
  }

  function buildNitrogenSpill() {
    var spillGeometry = new THREE.BoxGeometry(15, 0.1, 8);
    var spillMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.4,
      emissive: 0x888888
    });
    var spill = new THREE.Mesh(spillGeometry, spillMaterial);
    spill.position.set(-5, 0.05, -5);
    spill.receiveShadow = true;
    scene.add(spill);
  }

  function buildFrozenTerminals() {
    var terminalPositions = [
      { x: -12, z: 18 },
      { x: 14, z: 12 }
    ];

    terminalPositions.forEach(function(pos) {
      var screenGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.1);
      var screenMaterial = new THREE.MeshStandardMaterial({
        color: 0x004400,
        emissive: 0x003300,
        roughness: 0.3
      });
      var screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.set(pos.x, 1.5, pos.z);
      screen.castShadow = true;
      scene.add(screen);

      var frostOverlayGeometry = new THREE.BoxGeometry(1.3, 1.6, 0.15);
      var frostMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.25,
        roughness: 0.2
      });
      var frostOverlay = new THREE.Mesh(frostOverlayGeometry, frostMaterial);
      frostOverlay.position.set(pos.x, 1.5, pos.z + 0.1);
      scene.add(frostOverlay);

      var baseGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.4);
      var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(pos.x, 0.15, pos.z);
      base.castShadow = true;
      base.receiveShadow = true;
      scene.add(base);
    });
  }

  function buildIcicleFormations() {
    var iciclePositions = [
      { x: -15, y: 7.5, z: 10 },
      { x: -5, y: 7.5, z: 5 },
      { x: 10, y: 7.5, z: -10 },
      { x: 18, y: 7.5, z: 2 },
      { x: -20, y: 7.5, z: -20 },
      { x: 5, y: 7.5, z: -25 }
    ];

    iciclePositions.forEach(function(pos) {
      var icicleGeometry = new THREE.ConeGeometry(0.3, 1.5, 8);
      var icicleMaterial = new THREE.MeshStandardMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.7,
        roughness: 0.1
      });
      var icicle = new THREE.Mesh(icicleGeometry, icicleMaterial);
      icicle.position.set(pos.x, pos.y, pos.z);
      icicle.castShadow = true;
      scene.add(icicle);
      icicles.push({
        mesh: icicle,
        baseY: pos.y,
        swayX: pos.x,
        swayZ: pos.z
      });
    });
  }

  function buildFrozenExit() {
    var doorGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.2);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x663333,
      roughness: 0.8
    });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1.75, -29);
    door.castShadow = true;
    door.receiveShadow = true;
    scene.add(door);

    var iceBlockGeometry = new THREE.BoxGeometry(3, 2.5, 0.5);
    var iceMaterial = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.5,
      roughness: 0.2
    });
    var iceBlock = new THREE.Mesh(iceBlockGeometry, iceMaterial);
    iceBlock.position.set(0, 1.5, -28);
    iceBlock.castShadow = true;
    scene.add(iceBlock);
  }

  function buildCryoVault() {
    var vaultGeometry = new THREE.BoxGeometry(30, 5, 15);
    var vaultMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a2a3a,
      roughness: 0.6
    });
    var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
    vault.position.set(35, 2.5, 0);
    vault.receiveShadow = true;
    scene.add(vault);

    var rows = 5;
    var cols = 4;
    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < cols; j++) {
        var containerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 12);
        var containerMaterial = new THREE.MeshStandardMaterial({
          color: 0x2a4a6a,
          metalness: 0.5,
          roughness: 0.5
        });
        var container = new THREE.Mesh(containerGeometry, containerMaterial);
        container.position.set(
          20 + j * 3.5,
          1 + i * 1.2,
          0
        );
        container.castShadow = true;
        container.receiveShadow = true;
        scene.add(container);
      }
    }
  }

  function buildTemperatureGauge() {
    var gaugeBodyGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2, 12);
    var gaugeMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    var gaugeBody = new THREE.Mesh(gaugeBodyGeometry, gaugeMaterial);
    gaugeBody.position.set(-28, 2, -5);
    gaugeBody.castShadow = true;
    scene.add(gaugeBody);

    var dialGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
    var dialMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x333333
    });
    var dial = new THREE.Mesh(dialGeometry, dialMaterial);
    dial.position.set(-28, 2, -5.1);
    dial.receiveShadow = true;
    scene.add(dial);

    var needleGeometry = new THREE.BoxGeometry(0.08, 0.35, 0.02);
    var needleMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0x880000
    });
    gaugeNeedle = new THREE.Mesh(needleGeometry, needleMaterial);
    gaugeNeedle.position.set(-28, 2, -5.15);
    gaugeNeedle.rotation.z = Math.PI * 0.3;
    scene.add(gaugeNeedle);
  }

  function initBreathParticles() {
    for (var i = 0; i < 40; i++) {
      var breathGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      var breathMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.8
      });
      var breathParticle = new THREE.Mesh(breathGeometry, breathMaterial);
      breathParticle.position.copy(camera.position);
      breathParticle.position.x += (Math.random() - 0.5) * 0.5;
      breathParticle.position.y += (Math.random() - 0.5) * 0.5;
      breathParticle.position.z -= 1;
      scene.add(breathParticle);
      breathParticles.push({
        mesh: breathParticle,
        life: 0,
        maxLife: 1.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: Math.random() * 0.5,
        vz: (Math.random() - 0.5) * 0.2
      });
    }
  }

  function initNitrogenWisps() {
    for (var i = 0; i < 30; i++) {
      var wispGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var wispMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        transparent: true,
        opacity: 0.4,
        roughness: 0.6
      });
      var wisp = new THREE.Mesh(wispGeometry, wispMaterial);
      wisp.position.set(
        -5 + Math.random() * 15,
        0.3 + Math.random() * 0.5,
        -5 + Math.random() * 8
      );
      scene.add(wisp);
      nitrogenWisps.push({
        mesh: wisp,
        baseX: wisp.position.x,
        baseY: wisp.position.y,
        baseZ: wisp.position.z,
        time: Math.random() * Math.PI * 2
      });
    }
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < icicles.length; i++) {
      var icicle = icicles[i];
      icicle.mesh.position.y = icicle.baseY + Math.sin(time * 0.5 + i) * 0.05;
      icicle.mesh.rotation.x = Math.sin(time * 0.3 + i * 0.5) * 0.02;
    }

    for (var j = 0; j < breathParticles.length; j++) {
      var breath = breathParticles[j];
      breath.life += delta;
      breath.mesh.position.x += breath.vx * delta;
      breath.mesh.position.y += breath.vy * delta;
      breath.mesh.position.z += breath.vz * delta;

      var breathAlpha = breath.life / breath.maxLife;
      breath.mesh.material.opacity = 0.3 * (1 - breathAlpha);

      if (breath.life > breath.maxLife) {
        breath.mesh.position.copy(camera.position);
        breath.mesh.position.x += (Math.random() - 0.5) * 0.5;
        breath.mesh.position.y += (Math.random() - 0.5) * 0.5;
        breath.mesh.position.z -= 1;
        breath.life = 0;
      }
    }

    for (var k = 0; k < nitrogenWisps.length; k++) {
      var wisp = nitrogenWisps[k];
      wisp.time += delta * 0.5;
      wisp.mesh.position.x = wisp.baseX + Math.sin(wisp.time) * 0.4;
      wisp.mesh.position.y = wisp.baseY + Math.sin(wisp.time * 0.7) * 0.3;
      wisp.mesh.position.z = wisp.baseZ + Math.cos(wisp.time * 0.6) * 0.3;
      wisp.mesh.material.opacity = 0.4 + Math.sin(wisp.time) * 0.1;
    }

    if (gaugeNeedle) {
      var targetAngle = Math.PI * (0.2 + Math.sin(time * 0.2) * 0.05);
      gaugeNeedle.rotation.z += (targetAngle - gaugeNeedle.rotation.z) * 0.1;
    }
  }

  function reset() {
    time = 0;
    for (var i = breathParticles.length - 1; i >= 0; i--) {
      scene.remove(breathParticles[i].mesh);
    }
    for (var j = nitrogenWisps.length - 1; j >= 0; j--) {
      scene.remove(nitrogenWisps[j].mesh);
    }
    breathParticles = [];
    nitrogenWisps = [];
    initBreathParticles();
    initNitrogenWisps();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
