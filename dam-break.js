window.DamBreak = (function() {
  'use strict';

  var scene, camera;
  var damGroup = new THREE.Group();
  var animatables = [];
  var hudElement = null;
  var gameState = {
    damIntegrity: 100,
    chargesPlaced: 0,
    defendersAlive: 4
  };
  var inputBuffer = '';
  var lastInputTime = 0;

  function createDam() {
    var damGeom = new THREE.BoxGeometry(100, 30, 10);
    var damMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a });
    var damMesh = new THREE.Mesh(damGeom, damMat);
    damMesh.position.set(0, 15, 0);
    damMesh.castShadow = true;
    damMesh.receiveShadow = true;
    damGroup.add(damMesh);
  }

  function createReservoir() {
    var resGeom = new THREE.BoxGeometry(120, 5, 80);
    var resMat = new THREE.MeshStandardMaterial({ color: 0x1e90ff, metalness: 0.3, roughness: 0.6 });
    var resMesh = new THREE.Mesh(resGeom, resMat);
    resMesh.position.set(0, 40, -60);
    resMesh.castShadow = true;
    resMesh.receiveShadow = true;
    damGroup.add(resMesh);
  }

  function createValleyFloor() {
    var valleyGeom = new THREE.BoxGeometry(400, 0.3, 400);
    var valleyMat = new THREE.MeshStandardMaterial({ color: 0x6b5d4f });
    var valleyMesh = new THREE.Mesh(valleyGeom, valleyMat);
    valleyMesh.position.set(0, -1, 0);
    valleyMesh.receiveShadow = true;
    damGroup.add(valleyMesh);
  }

  function createControlTower() {
    var towerGeom = new THREE.BoxGeometry(8, 20, 8);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    var towerMesh = new THREE.Mesh(towerGeom, towerMat);
    towerMesh.position.set(0, 35, 2);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    damGroup.add(towerMesh);
  }

  function createSpillways() {
    var positions = [-20, -6, 6, 20];
    positions.forEach(function(x) {
      var gateGeom = new THREE.BoxGeometry(12, 8, 0.5);
      var gateMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.8 });
      var gateMesh = new THREE.Mesh(gateGeom, gateMat);
      gateMesh.position.set(x, 15, 4);
      gateMesh.castShadow = true;
      damGroup.add(gateMesh);

      var wheelGeom = new THREE.BoxGeometry(3, 3, 0.3);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var wheelMesh = new THREE.Mesh(wheelGeom, wheelMat);
      wheelMesh.position.set(x, 10, 5);
      wheelMesh.castShadow = true;
      damGroup.add(wheelMesh);

      animatables.push({
        mesh: wheelMesh,
        type: 'spin',
        axis: 'z'
      });
    });
  }

  function createTurbineHall() {
    var turbineGeom = new THREE.BoxGeometry(40, 15, 20);
    var turbineMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var turbineMesh = new THREE.Mesh(turbineGeom, turbineMat);
    turbineMesh.position.set(0, 7.5, 15);
    turbineMesh.castShadow = true;
    turbineMesh.receiveShadow = true;
    damGroup.add(turbineMesh);

    for (var i = 0; i < 3; i++) {
      var cableGeom = new THREE.BoxGeometry(0.5, 25, 0.5);
      var cableMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
      var cableMesh = new THREE.Mesh(cableGeom, cableMat);
      cableMesh.position.set(-10 + i * 10, 20, 15);
      cableMesh.castShadow = true;
      damGroup.add(cableMesh);
    }
  }

  function createSaboteurs() {
    var positions = [-15, -5, 5, 15, 25];
    positions.forEach(function(x) {
      var bodyGeom = new THREE.BoxGeometry(2, 4, 2);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      var bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.position.set(x, 20, 3);
      bodyMesh.castShadow = true;
      damGroup.add(bodyMesh);

      var packGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var packMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      var packMesh = new THREE.Mesh(packGeom, packMat);
      packMesh.position.set(x, 22, 4);
      packMesh.castShadow = true;
      damGroup.add(packMesh);

      animatables.push({
        mesh: bodyMesh,
        startPos: { x: x, y: 20, z: 3 },
        type: 'walk',
        duration: 8
      });
    });
  }

  function createDefenders() {
    var positions = [-8, -2, 2, 8];
    positions.forEach(function(x) {
      var bodyGeom = new THREE.BoxGeometry(1.8, 4, 1.8);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x0047ab });
      var bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
      bodyMesh.position.set(x, 20, -2);
      bodyMesh.castShadow = true;
      damGroup.add(bodyMesh);

      animatables.push({
        mesh: bodyMesh,
        startPos: { x: x, y: 20, z: -2 },
        type: 'patrol',
        range: 4,
        duration: 6
      });
    });
  }

  function createExplosives() {
    var positions = [-10, 0, 10];
    positions.forEach(function(x) {
      var chargeGeom = new THREE.BoxGeometry(2, 2, 2);
      var chargeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x330000 });
      var chargeMesh = new THREE.Mesh(chargeGeom, chargeMat);
      chargeMesh.position.set(x, 22, 5);
      chargeMesh.castShadow = true;
      damGroup.add(chargeMesh);

      var detonatorGeom = new THREE.BoxGeometry(0.4, 1.5, 0.4);
      var detonatorMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
      var detonatorMesh = new THREE.Mesh(detonatorGeom, detonatorMat);
      detonatorMesh.position.set(x, 24, 5);
      damGroup.add(detonatorMesh);

      animatables.push({
        mesh: chargeMesh,
        type: 'blink',
        speed: 0.15
      });
    });
  }

  function createPowerTower() {
    for (var i = 0; i < 4; i++) {
      var angle = (Math.PI / 2) * i;
      var xPos = Math.cos(angle) * 8;
      var zPos = Math.sin(angle) * 8;

      var strutGeom = new THREE.BoxGeometry(0.3, 40, 0.3);
      var strutMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var strutMesh = new THREE.Mesh(strutGeom, strutMat);
      strutMesh.position.set(xPos, 20, zPos + 50);
      strutMesh.castShadow = true;
      damGroup.add(strutMesh);
    }

    var topGeom = new THREE.BoxGeometry(3, 3, 3);
    var topMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, emissive: 0x660000 });
    var topMesh = new THREE.Mesh(topGeom, topMat);
    topMesh.position.set(0, 40, 50);
    topMesh.castShadow = true;
    damGroup.add(topMesh);

    animatables.push({
      mesh: topMesh,
      type: 'spin',
      axis: 'y'
    });
  }

  function createAccessRoad() {
    var roadGeom = new THREE.BoxGeometry(6, 0.2, 100);
    var roadMat = new THREE.MeshStandardMaterial({ color: 0x777777 });
    var roadMesh = new THREE.Mesh(roadGeom, roadMat);
    roadMesh.position.set(40, 0, 0);
    roadMesh.receiveShadow = true;
    damGroup.add(roadMesh);
  }

  function createSiren() {
    var poleGeom = new THREE.BoxGeometry(0.4, 15, 0.4);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var poleMesh = new THREE.Mesh(poleGeom, poleMat);
    poleMesh.position.set(-50, 7.5, -50);
    poleMesh.castShadow = true;
    damGroup.add(poleMesh);

    var sirenGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var sirenMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00 });
    var sirenMesh = new THREE.Mesh(sirenGeom, sirenMat);
    sirenMesh.position.set(-50, 15, -50);
    sirenMesh.castShadow = true;
    damGroup.add(sirenMesh);

    animatables.push({
      mesh: sirenMesh,
      type: 'spin',
      axis: 'z'
    });
  }

  function createSecurityBooth() {
    var boothGeom = new THREE.BoxGeometry(4, 3, 4);
    var boothMat = new THREE.MeshStandardMaterial({ color: 0xaa8844 });
    var boothMesh = new THREE.Mesh(boothGeom, boothMat);
    boothMesh.position.set(35, 1.5, -30);
    boothMesh.castShadow = true;
    boothMesh.receiveShadow = true;
    damGroup.add(boothMesh);
  }

  function createWaterLeaks() {
    var leakPositions = [
      { x: -20, z: 5 },
      { x: -8, z: 5 },
      { x: 0, z: 5 },
      { x: 8, z: 5 },
      { x: 20, z: 5 }
    ];

    leakPositions.forEach(function(pos) {
      var leakGeom = new THREE.BoxGeometry(0.4, 8, 0.4);
      var leakMat = new THREE.MeshStandardMaterial({ color: 0x00ccff, emissive: 0x0099ff });
      var leakMesh = new THREE.Mesh(leakGeom, leakMat);
      leakMesh.position.set(pos.x, 5, pos.z);
      leakMesh.castShadow = true;
      damGroup.add(leakMesh);

      animatables.push({
        mesh: leakMesh,
        startPos: { x: pos.x, y: 5, z: pos.z },
        type: 'leak',
        amplitude: 1.5
      });
    });
  }

  function createHelicopter() {
    var bodyGeom = new THREE.BoxGeometry(8, 4, 20);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
    var bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.position.set(-80, 40, 0);
    bodyMesh.castShadow = true;
    damGroup.add(bodyMesh);

    var rotorGeom = new THREE.BoxGeometry(35, 0.5, 4);
    var rotorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var rotorMesh = new THREE.Mesh(rotorGeom, rotorMat);
    rotorMesh.position.set(-80, 44, 0);
    rotorMesh.castShadow = true;
    damGroup.add(rotorMesh);

    var tailGeom = new THREE.BoxGeometry(2, 2, 8);
    var tailMat = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
    var tailMesh = new THREE.Mesh(tailGeom, tailMat);
    tailMesh.position.set(-80, 38, 12);
    tailMesh.castShadow = true;
    damGroup.add(tailMesh);

    animatables.push({
      mesh: bodyMesh,
      rotorMesh: rotorMesh,
      tailMesh: tailMesh,
      type: 'helicopter',
      duration: 12
    });
  }

  function createWarningLights() {
    var lightPositions = [
      { x: -60, z: -60 },
      { x: 60, z: -60 },
      { x: -60, z: 60 },
      { x: 60, z: 60 }
    ];

    lightPositions.forEach(function(pos) {
      var lightGeom = new THREE.SphereGeometry(1, 8, 8);
      var lightMat = new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xffcc00 });
      var lightMesh = new THREE.Mesh(lightGeom, lightMat);
      lightMesh.position.set(pos.x, 2, pos.z);
      lightMesh.castShadow = true;
      damGroup.add(lightMesh);

      animatables.push({
        mesh: lightMesh,
        centerPos: { x: pos.x, z: pos.z },
        type: 'orbit',
        radius: 1.5,
        duration: 3
      });
    });
  }

  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.id = 'dam-break-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '16px';
    hudElement.style.color = '#00ff00';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '2px solid #00ff00';
    hudElement.style.zIndex = '1000';
    hudElement.innerHTML =
      'DAM INTEGRITY: ' + gameState.damIntegrity + '%<br>' +
      'CHARGES PLACED: ' + gameState.chargesPlaced + '/3<br>' +
      'DEFENDERS ALIVE: ' + gameState.defendersAlive;
    document.body.appendChild(hudElement);

    document.addEventListener('keydown', handleKeyInput);
  }

  function handleKeyInput(event) {
    var now = Date.now();
    if (now - lastInputTime > 400) {
      inputBuffer = '';
    }
    lastInputTime = now;

    inputBuffer += event.key.toLowerCase();

    if (inputBuffer.length > 2) {
      inputBuffer = inputBuffer.slice(-2);
    }

    if (inputBuffer === 'hd') {
      triggerDamBreak();
      inputBuffer = '';
    }
  }

  function triggerDamBreak() {
    gameState.damIntegrity = 0;
    gameState.chargesPlaced = 3;
    updateHUD();
  }

  function updateHUD() {
    if (hudElement) {
      hudElement.innerHTML =
        'DAM INTEGRITY: ' + gameState.damIntegrity + '%<br>' +
        'CHARGES PLACED: ' + gameState.chargesPlaced + '/3<br>' +
        'DEFENDERS ALIVE: ' + gameState.defendersAlive;
    }
  }

  function animateSpins(delta) {
    var spinSpeed = 3;
    animatables.forEach(function(anim) {
      if (anim.type === 'spin') {
        if (anim.axis === 'z') {
          anim.mesh.rotation.z += spinSpeed * delta;
        } else if (anim.axis === 'y') {
          anim.mesh.rotation.y += spinSpeed * delta;
        }
      }
    });
  }

  function animateWalks(delta) {
    var walkSpeed = 5;
    animatables.forEach(function(anim) {
      if (anim.type === 'walk') {
        if (!anim.time) anim.time = 0;
        anim.time += delta;
        var progress = (anim.time % anim.duration) / anim.duration;
        anim.mesh.position.x = anim.startPos.x + (progress * 30 - 15);
      }
    });
  }

  function animatePatrols(delta) {
    animatables.forEach(function(anim) {
      if (anim.type === 'patrol') {
        if (!anim.time) anim.time = 0;
        anim.time += delta;
        var progress = (anim.time % anim.duration) / anim.duration;
        var offset = Math.sin(progress * Math.PI * 2) * anim.range;
        anim.mesh.position.x = anim.startPos.x + offset;
      }
    });
  }

  function animateBlinks(delta) {
    animatables.forEach(function(anim) {
      if (anim.type === 'blink') {
        if (!anim.time) anim.time = 0;
        anim.time += delta;
        var blink = (Math.sin(anim.time / anim.speed) + 1) / 2;
        anim.mesh.material.emissive.setHex(0xff0000 * blink);
      }
    });
  }

  function animateLeaks(delta) {
    animatables.forEach(function(anim) {
      if (anim.type === 'leak') {
        if (!anim.time) anim.time = 0;
        anim.time += delta;
        var spray = Math.sin(anim.time * 2) * anim.amplitude * 0.3;
        anim.mesh.position.x = anim.startPos.x + spray;
        anim.mesh.position.y = anim.startPos.y + Math.sin(anim.time * 1.5) * 0.5;
      }
    });
  }

  function animateHelicopter(delta) {
    animatables.forEach(function(anim) {
      if (anim.type === 'helicopter') {
        if (!anim.time) anim.time = 0;
        anim.time += delta;
        var progress = (anim.time % anim.duration) / anim.duration;

        anim.mesh.position.x = -80 + progress * 160 - 80;
        anim.mesh.position.z = Math.sin(progress * Math.PI * 2) * 40;

        anim.rotorMesh.position.x = anim.mesh.position.x;
        anim.rotorMesh.position.z = anim.mesh.position.z;
        anim.rotorMesh.rotation.z += 15 * delta;

        anim.tailMesh.position.x = anim.mesh.position.x;
        anim.tailMesh.position.z = anim.mesh.position.z;
      }
    });
  }

  function animateOrbit(delta) {
    animatables.forEach(function(anim) {
      if (anim.type === 'orbit') {
        if (!anim.time) anim.time = 0;
        anim.time += delta;
        var angle = (anim.time % anim.duration) / anim.duration * Math.PI * 2;
        anim.mesh.position.x = anim.centerPos.x + Math.cos(angle) * anim.radius;
        anim.mesh.position.z = anim.centerPos.z + Math.sin(angle) * anim.radius;
      }
    });
  }

  var init = function(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    createDam();
    createReservoir();
    createValleyFloor();
    createControlTower();
    createSpillways();
    createTurbineHall();
    createSaboteurs();
    createDefenders();
    createExplosives();
    createPowerTower();
    createAccessRoad();
    createSiren();
    createSecurityBooth();
    createWaterLeaks();
    createHelicopter();
    createWarningLights();

    scene.add(damGroup);
    createHUD();
  };

  var update = function(delta) {
    animateSpins(delta);
    animateWalks(delta);
    animatePatrols(delta);
    animateBlinks(delta);
    animateLeaks(delta);
    animateHelicopter(delta);
    animateOrbit(delta);
  };

  var reset = function() {
    animatables = [];
    inputBuffer = '';

    damGroup.traverse(function(child) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(function(m) { m.dispose(); });
        } else {
          child.material.dispose();
        }
      }
    });

    scene.remove(damGroup);
    damGroup = new THREE.Group();

    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    document.removeEventListener('keydown', handleKeyInput);
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
