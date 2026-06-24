window.WastelandTown = (function() {
  'use strict';

  var sceneObjects = [];
  var animationData = {};

  function createShackBuilding(x, y, z) {
    var group = new THREE.Group();
    var material = new THREE.MeshStandardMaterial({ color: 0x885533 });
    var geometry = new THREE.BoxGeometry(4, 5, 3);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return group;
  }

  function createBarricadeWall(x, y, z) {
    var group = new THREE.Group();
    var material = new THREE.MeshStandardMaterial({ color: 0x554422 });
    for (var i = 0; i < 5; i++) {
      var carGeometry = new THREE.BoxGeometry(2, 2, 1.5);
      var carMesh = new THREE.Mesh(carGeometry, material);
      carMesh.position.set(x + i * 2.2, y + i * 0.5, z);
      carMesh.castShadow = true;
      carMesh.receiveShadow = true;
      group.add(carMesh);
    }
    return group;
  }

  function createWaterTower(x, y, z) {
    var group = new THREE.Group();
    var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 12, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x665533 });
    var poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
    poleMesh.position.set(x, y, z);
    poleMesh.castShadow = true;
    poleMesh.receiveShadow = true;
    group.add(poleMesh);

    var tankGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    var tankMesh = new THREE.Mesh(tankGeometry, poleMaterial);
    tankMesh.position.set(x, y + 8, z);
    tankMesh.castShadow = true;
    tankMesh.receiveShadow = true;
    group.add(tankMesh);

    group.userData = { type: 'waterTower' };
    return group;
  }

  function createBanditWatchtower(x, y, z) {
    var group = new THREE.Group();
    var towerGeometry = new THREE.BoxGeometry(2.5, 8, 2.5);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x554422 });
    var towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
    towerMesh.position.set(x, y, z);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    group.add(towerMesh);

    var spotGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
    var spotMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFCC, emissive: 0xFFFF00, emissiveIntensity: 0.5 });
    var spotMesh = new THREE.Mesh(spotGeometry, spotMaterial);
    spotMesh.position.set(x, y + 4.5, z);
    spotMesh.castShadow = true;
    group.add(spotMesh);

    group.userData = { type: 'watchtower', spotlight: spotMesh };
    return group;
  }

  function createBarrelBonfire(x, y, z) {
    var group = new THREE.Group();
    var barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 8);
    var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x553322 });
    var barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrelMesh.position.set(x, y, z);
    barrelMesh.castShadow = true;
    barrelMesh.receiveShadow = true;
    group.add(barrelMesh);

    var fireGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    var fireMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4400, emissive: 0xFF4400, emissiveIntensity: 0.7 });
    var fireMesh = new THREE.Mesh(fireGeometry, fireMaterial);
    fireMesh.position.set(x, y + 1.5, z);
    group.add(fireMesh);

    group.userData = { type: 'bonfire', fire: fireMesh };
    return group;
  }

  function createJunkyard(x, y, z) {
    var group = new THREE.Group();
    var scrapMaterial = new THREE.MeshStandardMaterial({ color: 0x554433 });

    var heapGeometry = new THREE.SphereGeometry(3, 6, 6);
    var heapMesh = new THREE.Mesh(heapGeometry, scrapMaterial);
    heapMesh.position.set(x, y + 1.5, z);
    heapMesh.castShadow = true;
    heapMesh.receiveShadow = true;
    group.add(heapMesh);

    for (var i = 0; i < 4; i++) {
      var pileGeometry = new THREE.BoxGeometry(1.5, 2, 1);
      var pileMesh = new THREE.Mesh(pileGeometry, scrapMaterial);
      pileMesh.position.set(x + Math.cos(i * Math.PI / 2) * 2.5, y + 1, z + Math.sin(i * Math.PI / 2) * 2.5);
      pileMesh.castShadow = true;
      pileMesh.receiveShadow = true;
      group.add(pileMesh);
    }
    return group;
  }

  function createWarlordThrone(x, y, z) {
    var group = new THREE.Group();
    var baseGeometry = new THREE.BoxGeometry(3, 1, 3);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x553322 });
    var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(x, y, z);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    var seatGeometry = new THREE.BoxGeometry(2, 2, 2);
    var seatMaterial = new THREE.MeshStandardMaterial({ color: 0x332211, emissive: 0xCC6600, emissiveIntensity: 0.3 });
    var seatMesh = new THREE.Mesh(seatGeometry, seatMaterial);
    seatMesh.position.set(x, y + 2, z);
    seatMesh.castShadow = true;
    group.add(seatMesh);

    group.userData = { type: 'throne', seat: seatMesh };
    return group;
  }

  function createMarketStall(x, y, z) {
    var group = new THREE.Group();
    var stallGeometry = new THREE.BoxGeometry(3, 2.5, 2);
    var stallMaterial = new THREE.MeshStandardMaterial({ color: 0x664433 });
    var stallMesh = new THREE.Mesh(stallGeometry, stallMaterial);
    stallMesh.position.set(x, y, z);
    stallMesh.castShadow = true;
    stallMesh.receiveShadow = true;
    group.add(stallMesh);

    var roofGeometry = new THREE.BoxGeometry(3.5, 0.3, 2.3);
    var roofMesh = new THREE.Mesh(roofGeometry, stallMaterial);
    roofMesh.position.set(x, y + 2, z);
    roofMesh.castShadow = true;
    group.add(roofMesh);

    return group;
  }

  function createGasolineStorage(x, y, z) {
    var group = new THREE.Group();
    var tankGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x665544 });
    var tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
    tankMesh.position.set(x, y + 2, z);
    tankMesh.castShadow = true;
    tankMesh.receiveShadow = true;
    tankMesh.rotation.z = Math.PI / 2;
    group.add(tankMesh);

    var pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 6);
    var pipeMesh = new THREE.Mesh(pipeGeometry, tankMaterial);
    pipeMesh.position.set(x + 2, y + 3, z);
    pipeMesh.castShadow = true;
    pipeMesh.rotation.z = Math.PI / 3;
    group.add(pipeMesh);

    return group;
  }

  function createCombatArena(x, y, z) {
    var group = new THREE.Group();
    var pitGeometry = new THREE.BoxGeometry(8, 0.5, 8);
    var pitMaterial = new THREE.MeshStandardMaterial({ color: 0x886644 });
    var pitMesh = new THREE.Mesh(pitGeometry, pitMaterial);
    pitMesh.position.set(x, y, z);
    pitMesh.castShadow = true;
    pitMesh.receiveShadow = true;
    group.add(pitMesh);

    for (var i = 0; i < 8; i++) {
      var spikeGeometry = new THREE.ConeGeometry(0.2, 1.5, 4);
      var spikeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var spikeMesh = new THREE.Mesh(spikeGeometry, spikeMaterial);
      var angle = (i / 8) * Math.PI * 2;
      spikeMesh.position.set(x + Math.cos(angle) * 3.5, y + 0.8, z + Math.sin(angle) * 3.5);
      spikeMesh.castShadow = true;
      group.add(spikeMesh);
    }
    return group;
  }

  function createSpikedBarrier(x, y, z) {
    var group = new THREE.Group();
    var logGeometry = new THREE.CylinderGeometry(0.25, 0.25, 4, 6);
    var logMaterial = new THREE.MeshStandardMaterial({ color: 0x555544 });
    var logMesh = new THREE.Mesh(logGeometry, logMaterial);
    logMesh.position.set(x, y, z);
    logMesh.castShadow = true;
    logMesh.receiveShadow = true;
    logMesh.rotation.z = Math.PI / 2;
    group.add(logMesh);

    for (var i = 0; i < 3; i++) {
      var tipGeometry = new THREE.ConeGeometry(0.15, 0.8, 4);
      var tipMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var tipMesh = new THREE.Mesh(tipGeometry, tipMaterial);
      tipMesh.position.set(x + (i - 1) * 1.2, y + 2.5, z);
      tipMesh.castShadow = true;
      group.add(tipMesh);
    }
    return group;
  }

  function createRaiderVehicle(x, y, z) {
    var group = new THREE.Group();
    var carGeometry = new THREE.BoxGeometry(3, 1.5, 1.5);
    var carMaterial = new THREE.MeshStandardMaterial({ color: 0x554422 });
    var carMesh = new THREE.Mesh(carGeometry, carMaterial);
    carMesh.position.set(x, y, z);
    carMesh.castShadow = true;
    carMesh.receiveShadow = true;
    group.add(carMesh);

    var gunGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 6);
    var gunMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    var gunMesh = new THREE.Mesh(gunGeometry, gunMaterial);
    gunMesh.position.set(x, y + 1, z);
    gunMesh.castShadow = true;
    group.add(gunMesh);

    group.userData = { type: 'vehicle', basePosition: new THREE.Vector3(x, y, z) };
    return group;
  }

  function createSkullPole(x, y, z) {
    var group = new THREE.Group();
    var poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 6);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x665544 });
    var poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
    poleMesh.position.set(x, y, z);
    poleMesh.castShadow = true;
    poleMesh.receiveShadow = true;
    group.add(poleMesh);

    var skullGeometry = new THREE.SphereGeometry(0.5, 6, 6);
    var skullMaterial = new THREE.MeshStandardMaterial({ color: 0xE8DCC8 });
    var skullMesh = new THREE.Mesh(skullGeometry, skullMaterial);
    skullMesh.position.set(x, y + 3.5, z);
    skullMesh.castShadow = true;
    group.add(skullMesh);

    group.userData = { type: 'skull', skull: skullMesh };
    return group;
  }

  function createWindTurbine(x, y, z) {
    var group = new THREE.Group();
    var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 10, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x665544 });
    var poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
    poleMesh.position.set(x, y, z);
    poleMesh.castShadow = true;
    poleMesh.receiveShadow = true;
    group.add(poleMesh);

    var bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    for (var i = 0; i < 3; i++) {
      var bladeGeometry = new THREE.BoxGeometry(0.3, 3, 0.1);
      var bladeMesh = new THREE.Mesh(bladeGeometry, bladeMaterial);
      bladeMesh.position.set(x, y + 6, z);
      var bladeGroup = new THREE.Group();
      bladeGroup.add(bladeMesh);
      bladeGroup.rotation.z = (i / 3) * Math.PI * 2;
      group.add(bladeGroup);
      if (!group.userData.turbineBlades) {
        group.userData.turbineBlades = [];
      }
      group.userData.turbineBlades.push(bladeGroup);
    }

    group.userData = { type: 'turbine' };
    return group;
  }

  function init(scene, camera) {
    sceneObjects = [];
    animationData = {};

    var shack1 = createShackBuilding(-15, 0, -10);
    sceneObjects.push(shack1);
    scene.add(shack1);

    var shack2 = createShackBuilding(15, 0, -15);
    sceneObjects.push(shack2);
    scene.add(shack2);

    var shack3 = createShackBuilding(10, 0, 5);
    sceneObjects.push(shack3);
    scene.add(shack3);

    var barricade = createBarricadeWall(-20, 0, 0);
    sceneObjects.push(barricade);
    scene.add(barricade);

    var waterTower = createWaterTower(20, 0, 10);
    sceneObjects.push(waterTower);
    scene.add(waterTower);

    var watchtower1 = createBanditWatchtower(-25, 0, 15);
    sceneObjects.push(watchtower1);
    scene.add(watchtower1);
    animationData.watchtower1 = { spotLight: watchtower1.userData.spotlight, angle: 0 };

    var watchtower2 = createBanditWatchtower(25, 0, -20);
    sceneObjects.push(watchtower2);
    scene.add(watchtower2);
    animationData.watchtower2 = { spotLight: watchtower2.userData.spotlight, angle: 0 };

    var bonfire1 = createBarrelBonfire(-10, 0, 10);
    sceneObjects.push(bonfire1);
    scene.add(bonfire1);
    animationData.bonfire1 = { fire: bonfire1.userData.fire, flickerPhase: Math.random() * Math.PI * 2 };

    var bonfire2 = createBarrelBonfire(5, 0, 15);
    sceneObjects.push(bonfire2);
    scene.add(bonfire2);
    animationData.bonfire2 = { fire: bonfire2.userData.fire, flickerPhase: Math.random() * Math.PI * 2 };

    var junkyard = createJunkyard(-5, 0, -20);
    sceneObjects.push(junkyard);
    scene.add(junkyard);

    var throne = createWarlordThrone(0, 0, 20);
    sceneObjects.push(throne);
    scene.add(throne);
    animationData.throne = { seat: throne.userData.seat, pulsePhase: 0 };

    var stall1 = createMarketStall(-10, 0, 0);
    sceneObjects.push(stall1);
    scene.add(stall1);

    var stall2 = createMarketStall(10, 0, 0);
    sceneObjects.push(stall2);
    scene.add(stall2);

    var gasStorage = createGasolineStorage(30, 0, 0);
    sceneObjects.push(gasStorage);
    scene.add(gasStorage);

    var arena = createCombatArena(0, 0, 0);
    sceneObjects.push(arena);
    scene.add(arena);

    var barrier1 = createSpikedBarrier(-15, 0, 25);
    sceneObjects.push(barrier1);
    scene.add(barrier1);

    var raider1 = createRaiderVehicle(-30, 0.75, 5);
    sceneObjects.push(raider1);
    scene.add(raider1);
    animationData.raider1 = { vehicle: raider1, patrol: 0 };

    var raider2 = createRaiderVehicle(30, 0.75, -10);
    sceneObjects.push(raider2);
    scene.add(raider2);
    animationData.raider2 = { vehicle: raider2, patrol: 0 };

    var skull1 = createSkullPole(-20, 0, -15);
    sceneObjects.push(skull1);
    scene.add(skull1);
    animationData.skull1 = { skull: skull1.userData.skull, rattlePhase: 0 };

    var skull2 = createSkullPole(20, 0, 15);
    sceneObjects.push(skull2);
    scene.add(skull2);
    animationData.skull2 = { skull: skull2.userData.skull, rattlePhase: 0 };

    var turbine = createWindTurbine(0, 0, -30);
    sceneObjects.push(turbine);
    scene.add(turbine);
    animationData.turbine = { blades: turbine.userData.turbineBlades, rotation: 0 };
  }

  function update(delta) {
    var keys = Object.keys(animationData);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var data = animationData[key];

      if (key.indexOf('bonfire') !== -1 && data.fire) {
        data.flickerPhase += delta * 4;
        data.fire.material.emissiveIntensity = 0.5 + Math.sin(data.flickerPhase) * 0.3;
      }

      if (key.indexOf('watchtower') !== -1 && data.spotLight) {
        data.angle += delta * 1.5;
        data.spotLight.rotation.y = Math.sin(data.angle) * 1.5;
      }

      if (key === 'throne' && data.seat) {
        data.pulsePhase += delta * 3;
        data.seat.material.emissiveIntensity = 0.3 + Math.sin(data.pulsePhase) * 0.25;
      }

      if (key.indexOf('raider') !== -1 && data.vehicle) {
        data.patrol += delta * 0.5;
        data.vehicle.position.x = data.vehicle.userData.basePosition.x + Math.sin(data.patrol) * 8;
      }

      if (key.indexOf('skull') !== -1 && data.skull) {
        data.rattlePhase += delta * 3;
        data.skull.rotation.z = Math.sin(data.rattlePhase) * 0.15;
      }

      if (key === 'turbine' && data.blades) {
        data.rotation += delta * 3;
        for (var j = 0; j < data.blades.length; j++) {
          data.blades[j].rotation.z = data.rotation;
        }
      }
    }
  }

  function reset() {
    for (var i = sceneObjects.length - 1; i >= 0; i--) {
      var obj = sceneObjects[i];
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      obj.traverse(function(child) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            for (var j = 0; j < child.material.length; j++) {
              child.material[j].dispose();
            }
          } else {
            child.material.dispose();
          }
        }
      });
    }
    sceneObjects = [];
    animationData = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
