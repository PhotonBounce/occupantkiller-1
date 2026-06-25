window.NeonBunker = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lights = [];
  var indicators = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    lights = [];
    indicators = [];

    buildWalls();
    buildTerminals();
    buildBlastDoor();
    buildComputerBanks();
    buildBriefingTable();
    buildServerRacks();
    buildNeonSigns();
    buildLighting();
  }

  function buildWalls() {
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0e27,
      metalness: 0.3,
      roughness: 0.8
    });

    var leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(2, 20, 40),
      wallMaterial
    );
    leftWall.position.set(-15, 10, 0);
    scene.add(leftWall);
    objects.push(leftWall);

    var rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(2, 20, 40),
      wallMaterial
    );
    rightWall.position.set(15, 10, 0);
    scene.add(rightWall);
    objects.push(rightWall);

    var backWall = new THREE.Mesh(
      new THREE.BoxGeometry(30, 20, 2),
      wallMaterial
    );
    backWall.position.set(0, 10, -20);
    scene.add(backWall);
    objects.push(backWall);

    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1f3a,
      metalness: 0.2,
      roughness: 0.9
    });
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.5, 40),
      floorMaterial
    );
    floor.position.set(0, 0, 0);
    scene.add(floor);
    objects.push(floor);

    buildNeonWallStrips();
  }

  function buildNeonWallStrips() {
    var stripColors = [0x00ff00, 0xff00ff, 0x00ffff, 0xff0080];
    var stripIndex = 0;

    for (var i = 0; i < 8; i++) {
      var color = stripColors[stripIndex % stripColors.length];
      stripIndex += 1;

      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array([
        -14, 2 + i * 2, -15,
        -14, 2 + i * 2, 15
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      var line = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({
          color: color,
          linewidth: 3,
          emissive: color
        })
      );
      scene.add(line);
      objects.push(line);
    }
  }

  function buildTerminals() {
    var terminalPositions = [
      [-10, 2, -15],
      [-10, 6, -15],
      [10, 2, -15],
      [10, 6, -15]
    ];

    terminalPositions.forEach(function(pos) {
      var frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x001a4d,
        metalness: 0.6,
        roughness: 0.4
      });

      var frame = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2.5, 0.3),
        frameMaterial
      );
      frame.position.set(pos[0], pos[1], pos[2]);
      scene.add(frame);
      objects.push(frame);

      var screenMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88
      });

      var screen = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 2.2, 0.1),
        screenMaterial
      );
      screen.position.set(pos[0], pos[1], pos[2] - 0.2);
      scene.add(screen);
      objects.push(screen);
    });
  }

  function buildBlastDoor() {
    var ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d00ff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x2600cc
    });

    var doorRing = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.3, 32),
      ringMaterial
    );
    doorRing.position.set(0, 5, 19);
    doorRing.rotation.x = Math.PI / 2;
    scene.add(doorRing);
    objects.push(doorRing);

    var lockGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1, 16);
    var lockMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0080,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x7f0040
    });

    var lock = new THREE.Mesh(lockGeometry, lockMaterial);
    lock.position.set(0, 5, 19);
    lock.userData.angle = 0;
    scene.add(lock);
    objects.push(lock);
  }

  function buildComputerBanks() {
    var bankPositions = [
      [-8, 1, 8],
      [8, 1, 8],
      [-8, 1, -8],
      [8, 1, -8]
    ];

    bankPositions.forEach(function(pos) {
      var bankMaterial = new THREE.MeshStandardMaterial({
        color: 0x0d1b2a,
        metalness: 0.5,
        roughness: 0.6
      });

      var bank = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 3, 1.5),
        bankMaterial
      );
      bank.position.set(pos[0], pos[1], pos[2]);
      scene.add(bank);
      objects.push(bank);

      for (var i = 0; i < 6; i++) {
        var indicator = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 8, 8),
          new THREE.MeshBasicMaterial({
            color: [0xff0000, 0x00ff00, 0xffff00][i % 3],
            emissive: [0xff0000, 0x00ff00, 0xffff00][i % 3]
          })
        );
        indicator.position.set(
          pos[0] - 0.7 + (i % 3) * 0.5,
          pos[1] + 1 + Math.floor(i / 3) * 0.5,
          pos[2] + 0.8
        );
        indicator.userData.blinkPhase = Math.random() * Math.PI * 2;
        scene.add(indicator);
        indicators.push(indicator);
      }
    });
  }

  function buildBriefingTable() {
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a52,
      metalness: 0.4,
      roughness: 0.7
    });

    var base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.8, 24),
      baseMaterial
    );
    base.position.set(0, 1, 0);
    scene.add(base);
    objects.push(base);

    var topMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      emissive: 0x008080
    });

    var top = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.2, 4.5),
      topMaterial
    );
    top.position.set(0, 2.1, 0);
    scene.add(top);
    objects.push(top);
  }

  function buildServerRacks() {
    var rackPositions = [
      [-11, 2, 0],
      [11, 2, 0]
    ];

    rackPositions.forEach(function(pos) {
      for (var level = 0; level < 4; level++) {
        var rackMaterial = new THREE.MeshStandardMaterial({
          color: 0x0a1428,
          metalness: 0.6,
          roughness: 0.5
        });

        var rack = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1, 0.8),
          rackMaterial
        );
        rack.position.set(pos[0], pos[1] + level * 1.2, pos[2]);
        scene.add(rack);
        objects.push(rack);

        for (var j = 0; j < 4; j++) {
          var light = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 6, 6),
            new THREE.MeshBasicMaterial({
              color: 0x00ffaa,
              emissive: 0x00ffaa
            })
          );
          light.position.set(
            pos[0] - 0.5 + j * 0.35,
            pos[1] + level * 1.2 + 0.3,
            pos[2] + 0.45
          );
          scene.add(light);
          indicators.push(light);
        }
      }
    });
  }

  function buildNeonSigns() {
    var signTexts = ['ALPHA', 'BRAVO', 'CHARLIE'];
    var signColors = [0xff0080, 0x00ffff, 0xffff00];

    signTexts.forEach(function(text, idx) {
      var geometry = new THREE.ConeGeometry(0.5, 2.5, 6);
      var material = new THREE.MeshBasicMaterial({
        color: signColors[idx],
        emissive: signColors[idx]
      });

      var sign = new THREE.Mesh(geometry, material);
      sign.position.set(-8 + idx * 8, 8, -18);
      scene.add(sign);
      objects.push(sign);
    });
  }

  function buildLighting() {
    var ambientLight = new THREE.AmbientLight(0x0033ff, 0.4);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var pointLight1 = new THREE.PointLight(0x00ff88, 1.2, 25);
    pointLight1.position.set(-8, 5, 8);
    scene.add(pointLight1);
    lights.push(pointLight1);

    var pointLight2 = new THREE.PointLight(0xff00ff, 1, 20);
    pointLight2.position.set(8, 5, -8);
    scene.add(pointLight2);
    lights.push(pointLight2);

    var pointLight3 = new THREE.PointLight(0x00ffff, 0.8, 15);
    pointLight3.position.set(0, 8, 15);
    scene.add(pointLight3);
    lights.push(pointLight3);
  }

  function update(delta) {
    if (!scene) return;

    objects.forEach(function(obj) {
      if (obj.userData.angle !== undefined) {
        obj.userData.angle += delta * 1.5;
        obj.rotation.z = obj.userData.angle;
      }
    });

    indicators.forEach(function(indicator, idx) {
      indicator.userData.blinkPhase += delta * 4;
      var brightness = Math.sin(indicator.userData.blinkPhase) * 0.5 + 0.5;
      indicator.material.opacity = brightness;
    });
  }

  function reset() {
    objects.forEach(function(obj) {
      scene.remove(obj);
    });
    indicators.forEach(function(ind) {
      scene.remove(ind);
    });
    lights.forEach(function(light) {
      scene.remove(light);
    });
    objects = [];
    indicators = [];
    lights = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
