window.DowntownSiege = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var waterDrops = [];
  var spawnPoints = [];
  var glowPulseTime = 0;
  var powerLineSwayTime = 0;
  var sniperGlintTime = 0;
  var debrisRiseTime = 0;

  var ASPHALT_GRAY = 0x444444;
  var GLASS_BLUE = 0x5c7d9e;
  var EMERGENCY_RED = 0xff3333;
  var EMERGENCY_YELLOW = 0xffdd33;
  var SMOKE_BLACK = 0x1a1a1a;
  var CONCRETE_GRAY = 0x888888;
  var TRAFFIC_GREEN = 0x22dd22;
  var FIRE_ORANGE = 0xff6600;

  function createRoadSection(x, z, width, length) {
    var geometry = new THREE.BoxGeometry(width, 0.2, length);
    var material = new THREE.MeshStandardMaterial({ color: ASPHALT_GRAY });
    var road = new THREE.Mesh(geometry, material);
    road.position.set(x, 0.1, z);
    road.castShadow = true;
    road.receiveShadow = true;
    scene.add(road);
    meshes.push(road);
    return road;
  }

  function createOfficeTower(x, z, height, width) {
    var geometry = new THREE.BoxGeometry(width, height, width);
    var material = new THREE.MeshStandardMaterial({
      color: GLASS_BLUE,
      metalness: 0.3,
      roughness: 0.6
    });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(x, height / 2, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    meshes.push(tower);

    var frameGeometry = new THREE.BoxGeometry(width, 0.4, 0.2);
    var frameColor = new THREE.MeshStandardMaterial({ color: 0x222222 });
    for (var i = 0; i < height / 4; i++) {
      var frame = new THREE.Mesh(frameGeometry, frameColor);
      frame.position.set(x, 2 + i * 4, z);
      frame.castShadow = true;
      scene.add(frame);
      meshes.push(frame);
    }

    return tower;
  }

  function createOverturnedBus(x, z) {
    var bodyGeometry = new THREE.BoxGeometry(2.5, 3, 9);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: EMERGENCY_YELLOW,
      metalness: 0.2,
      roughness: 0.5
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, 1.5, z);
    body.rotation.z = Math.PI / 2.5;
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    meshes.push(body);

    for (var i = 0; i < 2; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 32);
      var wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.8
      });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(x + (i === 0 ? -1.2 : 1.2), 0.8, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      scene.add(wheel);
      meshes.push(wheel);
    }

    return body;
  }

  function createShatteredGlass(x, z, baseY) {
    for (var i = 0; i < 8; i++) {
      var fragGeometry = new THREE.BoxGeometry(
        0.4 + Math.random() * 0.3,
        0.5 + Math.random() * 0.4,
        0.05
      );
      var fragMaterial = new THREE.MeshStandardMaterial({
        color: GLASS_BLUE,
        metalness: 0.1,
        roughness: 0.2,
        transparent: true,
        opacity: 0.6
      });
      var fragment = new THREE.Mesh(fragGeometry, fragMaterial);
      fragment.position.set(
        x + (Math.random() - 0.5) * 2,
        baseY + Math.random() * 2,
        z
      );
      fragment.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      fragment.castShadow = true;
      scene.add(fragment);
      meshes.push(fragment);
    }
  }

  function createBarricadedDoorway(x, z) {
    var blockGeometry = new THREE.BoxGeometry(1.2, 1, 0.4);
    var blockMaterial = new THREE.MeshStandardMaterial({
      color: CONCRETE_GRAY,
      metalness: 0.1
    });

    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 2; col++) {
        var block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.set(
          x + col * 1.3,
          1.2 + row * 1.2,
          z
        );
        block.castShadow = true;
        block.receiveShadow = true;
        scene.add(block);
        meshes.push(block);
      }
    }
  }

  function createDumpster(x, z) {
    var dumpGeometry = new THREE.BoxGeometry(1.5, 1.8, 1.2);
    var dumpMaterial = new THREE.MeshStandardMaterial({
      color: SMOKE_BLACK,
      metalness: 0.6
    });
    var dump = new THREE.Mesh(dumpGeometry, dumpMaterial);
    dump.position.set(x, 0.9, z);
    dump.castShadow = true;
    dump.receiveShadow = true;
    scene.add(dump);
    meshes.push(dump);

    var lidGeometry = new THREE.BoxGeometry(1.6, 0.2, 1.3);
    var lidMaterial = new THREE.MeshStandardMaterial({
      color: EMERGENCY_RED,
      metalness: 0.5
    });
    var lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.set(x, 1.9, z);
    lid.rotation.x = Math.PI * 0.2;
    lid.castShadow = true;
    scene.add(lid);
    meshes.push(lid);
  }

  function createLampPost(x, z) {
    var poleGeometry = new THREE.CylinderGeometry(0.12, 0.12, 8, 16);
    var poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7
    });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, 4, z);
    pole.castShadow = true;
    scene.add(pole);
    meshes.push(pole);

    var bulbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    var bulbMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff99,
      emissive: 0xffff66,
      metalness: 0.2
    });
    var bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.set(x, 8, z);
    bulb.castShadow = true;
    scene.add(bulb);
    meshes.push(bulb);
  }

  function createPoliceBarrier(x, z) {
    var blockGeometry = new THREE.BoxGeometry(2, 1.2, 0.5);
    var blockMaterial = new THREE.MeshStandardMaterial({
      color: CONCRETE_GRAY,
      metalness: 0.2
    });

    for (var i = 0; i < 3; i++) {
      var block = new THREE.Mesh(blockGeometry, blockMaterial);
      block.position.set(x + i * 2.2, 0.6, z);
      block.castShadow = true;
      block.receiveShadow = true;
      scene.add(block);
      meshes.push(block);
    }
  }

  function createWreckedPoliceCar(x, z) {
    var bodyGeometry = new THREE.BoxGeometry(1.8, 1.2, 4);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: EMERGENCY_BLUE,
      metalness: 0.5,
      roughness: 0.6
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, 0.6, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    meshes.push(body);

    var cabGeometry = new THREE.BoxGeometry(1.6, 1, 1.2);
    var cabMaterial = new THREE.MeshStandardMaterial({
      color: GLASS_BLUE,
      metalness: 0.3
    });
    var cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(x, 1.2, z - 1);
    cab.castShadow = true;
    scene.add(cab);
    meshes.push(cab);

    for (var w = 0; w < 2; w++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32);
      var wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.9
      });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(x + (w === 0 ? -0.8 : 0.8), 0.5, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      scene.add(wheel);
      meshes.push(wheel);
    }
  }

  var EMERGENCY_BLUE = 0x003366;

  function createFireHydrant(x, z) {
    var baseGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: EMERGENCY_RED,
      metalness: 0.8
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, 0.15, z);
    base.castShadow = true;
    scene.add(base);
    meshes.push(base);

    var pipeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 16);
    var pipeMaterial = new THREE.MeshStandardMaterial({
      color: EMERGENCY_RED,
      metalness: 0.9
    });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.set(x, 0.9, z);
    pipe.castShadow = true;
    scene.add(pipe);
    meshes.push(pipe);

    var nozzleGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    var nozzleMaterial = new THREE.MeshStandardMaterial({
      color: EMERGENCY_YELLOW,
      metalness: 0.7
    });
    var nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
    nozzle.position.set(x, 1.7, z);
    nozzle.castShadow = true;
    scene.add(nozzle);
    meshes.push(nozzle);
  }

  function createBurningDebris(x, z) {
    var debrisGeometry = new THREE.BoxGeometry(1.5, 0.5, 1);
    var debrisMaterial = new THREE.MeshStandardMaterial({
      color: SMOKE_BLACK,
      emissive: FIRE_ORANGE,
      emissiveIntensity: 0.6,
      metalness: 0.1
    });
    var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
    debris.position.set(x, 0.25, z);
    debris.castShadow = true;
    scene.add(debris);
    meshes.push(debris);
    debris.isDebris = true;

    var glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    var glowMaterial = new THREE.MeshStandardMaterial({
      color: FIRE_ORANGE,
      emissive: FIRE_ORANGE,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.3
    });
    var glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(x, 0.8, z);
    scene.add(glow);
    meshes.push(glow);
    glow.isGlow = true;
  }

  function createSniperPosition(x, z) {
    var ledgeGeometry = new THREE.BoxGeometry(4, 0.5, 3);
    var ledgeMaterial = new THREE.MeshStandardMaterial({
      color: CONCRETE_GRAY,
      metalness: 0.1
    });
    var ledge = new THREE.Mesh(ledgeGeometry, ledgeMaterial);
    ledge.position.set(x, 25, z);
    ledge.castShadow = true;
    ledge.receiveShadow = true;
    scene.add(ledge);
    meshes.push(ledge);

    var sandbagGeometry = new THREE.BoxGeometry(3.5, 1.2, 0.8);
    var sandbagMaterial = new THREE.MeshStandardMaterial({
      color: 0x9d8b5c,
      metalness: 0.1,
      roughness: 0.8
    });
    var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
    sandbag.position.set(x, 25.8, z - 1.2);
    sandbag.castShadow = true;
    scene.add(sandbag);
    meshes.push(sandbag);
    sandbag.isSniperPosition = true;
  }

  function createManholeCover(x, z) {
    var rimGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 32);
    var rimMaterial = new THREE.MeshStandardMaterial({
      color: CONCRETE_GRAY,
      metalness: 0.6
    });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(x, 0.08, z);
    rim.castShadow = true;
    rim.receiveShadow = true;
    scene.add(rim);
    meshes.push(rim);

    var coverGeometry = new THREE.CylinderGeometry(0.55, 0.55, 0.1, 32);
    var coverMaterial = new THREE.MeshStandardMaterial({
      color: SMOKE_BLACK,
      metalness: 0.8
    });
    var cover = new THREE.Mesh(coverGeometry, coverMaterial);
    cover.position.set(x, 0.15, z);
    cover.castShadow = true;
    scene.add(cover);
    meshes.push(cover);
  }

  function createPowerLines(startX, startZ, endX, endZ) {
    var points = [
      new THREE.Vector3(startX, 9, startZ),
      new THREE.Vector3((startX + endX) / 2, 8.5, (startZ + endZ) / 2),
      new THREE.Vector3(endX, 9, endZ)
    ];

    var curve = new THREE.CatmullRomCurve3(points);
    var linePoints = curve.getPoints(20);
    var lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 3 });
    var line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
    meshes.push(line);
    line.isPowerLine = true;
  }

  function createBrokenTrafficSignal(x, z) {
    var poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 6, 16);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, 3, z);
    pole.castShadow = true;
    scene.add(pole);
    meshes.push(pole);

    var signGeometry = new THREE.BoxGeometry(0.6, 1.8, 0.3);
    var signMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.2
    });
    var sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(x, 5.5, z);
    sign.castShadow = true;
    scene.add(sign);
    meshes.push(sign);
    sign.isSignal = true;

    for (var l = 0; l < 3; l++) {
      var lightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      var lightColor = [TRAFFIC_GREEN, EMERGENCY_YELLOW, EMERGENCY_RED][l];
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: lightColor,
        emissive: lightColor,
        emissiveIntensity: 0.4
      });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(x + 0.2, 5 - l * 0.6, z);
      light.castShadow = true;
      scene.add(light);
      meshes.push(light);
    }
  }

  function createBurningBus(x, z) {
    var bodyGeometry = new THREE.BoxGeometry(2.5, 3, 9);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: SMOKE_BLACK,
      emissive: FIRE_ORANGE,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.7
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, 1.5, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    meshes.push(body);
    body.isBurningBus = true;

    var flameGeometry = new THREE.SphereGeometry(2, 16, 16);
    var flameMaterial = new THREE.MeshStandardMaterial({
      color: FIRE_ORANGE,
      emissive: FIRE_ORANGE,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.4
    });
    var flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(x, 3.5, z);
    scene.add(flame);
    meshes.push(flame);
    flame.isFlame = true;
  }

  function initSpawnPoints() {
    spawnPoints = [
      { x: -15, z: 0, y: 1 },
      { x: 15, z: 0, y: 1 },
      { x: 0, z: -20, y: 1 },
      { x: 0, z: 20, y: 1 },
      { x: 8, z: 12, y: 1 }
    ];
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    meshes = [];
    waterDrops = [];
    glowPulseTime = 0;
    powerLineSwayTime = 0;
    sniperGlintTime = 0;
    debrisRiseTime = 0;

    createRoadSection(0, 0, 30, 30);
    createRoadSection(-20, -15, 20, 20);
    createRoadSection(20, -15, 20, 20);
    createRoadSection(-15, 15, 15, 15);
    createRoadSection(15, 15, 15, 15);

    createOfficeTower(-25, 0, 30, 8);
    createOfficeTower(25, 0, 28, 7);
    createOfficeTower(-20, 20, 25, 6);
    createOfficeTower(20, 20, 26, 7);
    createOfficeTower(0, -25, 32, 8);

    createOverturnedBus(-8, 0);
    createOverturnedBus(8, 0);

    createShatteredGlass(-20, 5, 3);
    createShatteredGlass(20, -8, 3);
    createShatteredGlass(-15, -15, 2);

    createBarricadedDoorway(-22, 3);
    createBarricadedDoorway(22, -5);

    createDumpster(-10, -8);
    createDumpster(12, 10);

    createLampPost(-12, -12);
    createLampPost(10, 14);
    createLampPost(-18, 8);

    createPoliceBarrier(0, -10);
    createPoliceBarrier(-5, 12);

    createWreckedPoliceCar(-6, -18);
    createWreckedPoliceCar(6, 18);

    createFireHydrant(-3, 8);
    createFireHydrant(4, -12);

    createBurningDebris(-12, 15);
    createBurningDebris(14, -10);

    createSniperPosition(-25, 25);
    createSniperPosition(25, -20);

    createManholeCover(0, 8);
    createManholeCover(-8, -8);
    createManholeCover(10, 6);

    createPowerLines(-30, -20, 30, -20);
    createPowerLines(-30, 25, 30, 25);

    createBrokenTrafficSignal(-10, 10);
    createBrokenTrafficSignal(10, -10);

    createBurningBus(0, -8);

    initSpawnPoints();

    for (var i = 0; i < 20; i++) {
      var drop = {
        x: -2 + Math.random() * 4,
        z: 8 + Math.random() * 2,
        y: 2.5,
        vy: -3 - Math.random() * 2,
        life: 0
      };
      waterDrops.push(drop);
    }
  }

  function updateWaterDrops(delta) {
    for (var i = 0; i < waterDrops.length; i++) {
      var drop = waterDrops[i];
      drop.y += drop.vy * delta;
      drop.vy -= 9.8 * delta;

      if (drop.y < 0) {
        drop.y = 2.5;
        drop.vy = -3 - Math.random() * 2;
      }
    }
  }

  function updateGlowPulse(delta) {
    glowPulseTime += delta;
    var intensity = 0.4 + 0.3 * Math.sin(glowPulseTime * 3);

    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.isGlow || mesh.isFlame) {
        mesh.material.emissiveIntensity = intensity;
      }
      if (mesh.isBurningBus && mesh.material.emissive) {
        mesh.material.emissiveIntensity = intensity * 0.7;
      }
    }
  }

  function updatePowerLineSway(delta) {
    powerLineSwayTime += delta;
    var sway = Math.sin(powerLineSwayTime * 0.5) * 0.3;

    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.isPowerLine && mesh.geometry.attributes.position) {
        var positions = mesh.geometry.attributes.position.array;
        for (var j = 0; j < positions.length; j += 3) {
          positions[j + 1] += sway * 0.01;
        }
        mesh.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  function updateSniperGlint(delta) {
    sniperGlintTime += delta;

    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.isSniperPosition) {
        var glintFactor = Math.abs(Math.sin(sniperGlintTime * 4)) * 0.5 + 0.2;
        mesh.material.metalness = 0.1 + glintFactor * 0.5;
      }
    }
  }

  function updateDebrisSmoke(delta) {
    debrisRiseTime += delta;

    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.isDebris) {
        var rise = Math.sin(debrisRiseTime * 2 + i) * 0.05;
        mesh.position.y += rise * delta;
      }
    }
  }

  function updateSignalSwing(delta) {
    var swingTime = powerLineSwayTime * 1.5;

    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.isSignal) {
        mesh.rotation.z = Math.sin(swingTime) * 0.3;
      }
    }
  }

  function update(delta) {
    updateWaterDrops(delta);
    updateGlowPulse(delta);
    updatePowerLineSway(delta);
    updateSniperGlint(delta);
    updateDebrisSmoke(delta);
    updateSignalSwing(delta);
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    waterDrops = [];
    glowPulseTime = 0;
    powerLineSwayTime = 0;
    sniperGlintTime = 0;
    debrisRiseTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; },
    getMeshes: function() { return meshes; }
  };
}());
