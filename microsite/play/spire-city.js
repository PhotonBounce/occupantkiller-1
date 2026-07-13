window.SpireCity = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var environment = [];
  var rotatingTowers = [];
  var floatingPlatforms = [];
  var antiGravityLifts = [];
  var crystalShards = [];
  var energyShields = [];
  var centralMonolith = null;
  var time = 0;

  var init = function(s, c) {
    scene = s;
    camera = c;
    environment = [];
    rotatingTowers = [];
    floatingPlatforms = [];
    antiGravityLifts = [];
    crystalShards = [];
    energyShields = [];
    time = 0;

    buildSpireTowers();
    buildAerialWalkways();
    buildAntiGravityLifts();
    buildCrystallineArch();
    buildBioluminescentMarket();
    buildEnergyShields();
    buildCentralMonolith();
  };

  var buildSpireTowers = function() {
    var towerCount = 12;
    var radius = 80;

    for (var i = 0; i < towerCount; i++) {
      var angle = (i / towerCount) * Math.PI * 2;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var towerGeometry = new THREE.CylinderGeometry(1.5, 2, 120, 8);
      var towerMaterial = new THREE.MeshStandardMaterial({
        color: 0x6d4c8f,
        metalness: 0.8,
        roughness: 0.2
      });
      var tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(x, 60, z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      scene.add(tower);
      environment.push(tower);

      var spireTopGeometry = new THREE.ConeGeometry(1.5, 15, 8);
      var spireTopMaterial = new THREE.MeshStandardMaterial({
        color: 0x9d6dd3,
        emissive: 0x4a2a7d,
        metalness: 0.9
      });
      var spireTop = new THREE.Mesh(spireTopGeometry, spireTopMaterial);
      spireTop.position.set(x, 127.5, z);
      scene.add(spireTop);
      environment.push(spireTop);
      rotatingTowers.push(spireTop);
    }
  };

  var buildAerialWalkways = function() {
    var walkwayCount = 6;

    for (var i = 0; i < walkwayCount; i++) {
      var angle1 = (i / walkwayCount) * Math.PI * 2;
      var angle2 = ((i + 1) / walkwayCount) * Math.PI * 2;
      var radius = 75;

      var x1 = Math.cos(angle1) * radius;
      var z1 = Math.sin(angle1) * radius;
      var x2 = Math.cos(angle2) * radius;
      var z2 = Math.sin(angle2) * radius;

      var walkwayHeight = 45 + (i * 8);
      var distance = Math.sqrt((x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1));

      var walkwayGeometry = new THREE.BoxGeometry(distance, 1.2, 3);
      var walkwayMaterial = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0x0099cc
      });
      var walkway = new THREE.Mesh(walkwayGeometry, walkwayMaterial);
      walkway.position.set((x1 + x2) / 2, walkwayHeight, (z1 + z2) / 2);
      walkway.rotation.y = angle1 + Math.PI / 4;
      walkway.castShadow = true;
      walkway.receiveShadow = true;
      scene.add(walkway);
      environment.push(walkway);
      floatingPlatforms.push(walkway);
    }
  };

  var buildAntiGravityLifts = function() {
    var liftCount = 4;
    var radius = 60;

    for (var i = 0; i < liftCount; i++) {
      var angle = (i / liftCount) * Math.PI * 2;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var shaftGeometry = new THREE.CylinderGeometry(3, 3, 150, 12);
      var shaftMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00cc66,
        transparent: true,
        opacity: 0.6,
        metalness: 0.5
      });
      var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
      shaft.position.set(x, 75, z);
      scene.add(shaft);
      environment.push(shaft);
      antiGravityLifts.push(shaft);

      var coreGeometry = new THREE.CylinderGeometry(1, 1, 140, 8);
      var coreMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffaa,
        emissive: 0x00ff88
      });
      var core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.position.set(x, 75, z);
      core.castShadow = true;
      scene.add(core);
      environment.push(core);
    }
  };

  var buildCrystallineArch = function() {
    var crystalCount = 20;

    for (var i = 0; i < crystalCount; i++) {
      var angle = (i / crystalCount) * Math.PI * 2;
      var x = Math.cos(angle) * 100;
      var z = Math.sin(angle) * 100;
      var y = 30 + Math.sin(angle * 3) * 40;

      var crystalGeometry = new THREE.ConeGeometry(2 + Math.random() * 2, 15 + Math.random() * 10, 6);
      var crystalMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x0099ff,
        metalness: 0.6,
        transparent: true,
        opacity: 0.8
      });
      var crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
      crystal.position.set(x, y, z);
      crystal.rotation.x = Math.random() * Math.PI;
      crystal.castShadow = true;
      scene.add(crystal);
      environment.push(crystal);
      crystalShards.push(crystal);
    }
  };

  var buildBioluminescentMarket = function() {
    var marketCells = 16;

    for (var i = 0; i < marketCells; i++) {
      var x = (i % 4) * 25 - 37.5;
      var z = Math.floor(i / 4) * 25 - 37.5;

      var cellGeometry = new THREE.BoxGeometry(8, 6, 8);
      var cellMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a3a2a,
        emissive: 0x00ff66,
        metalness: 0.3
      });
      var cell = new THREE.Mesh(cellGeometry, cellMaterial);
      cell.position.set(x, 3, z);
      cell.castShadow = true;
      cell.receiveShadow = true;
      scene.add(cell);
      environment.push(cell);

      var glowGeometry = new THREE.SphereGeometry(2.5, 8, 8);
      var glowMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        metalness: 0.2
      });
      var glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(x, 7, z);
      scene.add(glow);
      environment.push(glow);
    }
  };

  var buildEnergyShields = function() {
    var shieldCount = 8;

    for (var i = 0; i < shieldCount; i++) {
      var angle = (i / shieldCount) * Math.PI * 2;
      var x = Math.cos(angle) * 90;
      var z = Math.sin(angle) * 90;

      var shieldGeometry = new THREE.BoxGeometry(15, 25, 3);
      var shieldMaterial = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xaa0088,
        transparent: true,
        opacity: 0.4,
        metalness: 0.8
      });
      var shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
      shield.position.set(x, 20, z);
      shield.rotation.y = angle;
      scene.add(shield);
      environment.push(shield);
      energyShields.push(shield);
    }
  };

  var buildCentralMonolith = function() {
    var monolithGeometry = new THREE.BoxGeometry(12, 180, 12);
    var monolithMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a2e,
      emissive: 0x5500ff,
      metalness: 0.9,
      roughness: 0.1
    });
    centralMonolith = new THREE.Mesh(monolithGeometry, monolithMaterial);
    centralMonolith.position.set(0, 90, 0);
    centralMonolith.castShadow = true;
    centralMonolith.receiveShadow = true;
    scene.add(centralMonolith);
    environment.push(centralMonolith);

    var auraGeometry = new THREE.CylinderGeometry(25, 25, 160, 12);
    var auraMaterial = new THREE.MeshStandardMaterial({
      color: 0x5500ff,
      emissive: 0x5500ff,
      transparent: true,
      opacity: 0.2
    });
    var aura = new THREE.Mesh(auraGeometry, auraMaterial);
    aura.position.set(0, 90, 0);
    scene.add(aura);
    environment.push(aura);
  };

  var update = function(delta) {
    time += delta;

    for (var i = 0; i < rotatingTowers.length; i++) {
      rotatingTowers[i].rotation.y += delta * 0.3;
      rotatingTowers[i].rotation.z += delta * 0.1;
    }

    for (var i = 0; i < floatingPlatforms.length; i++) {
      var originalY = 45 + (i * 8);
      floatingPlatforms[i].position.y = originalY + Math.sin(time * 1.5 + i) * 2;
    }

    for (var i = 0; i < antiGravityLifts.length; i++) {
      antiGravityLifts[i].rotation.z += delta * 0.8;
    }

    for (var i = 0; i < crystalShards.length; i++) {
      crystalShards[i].rotation.x += delta * 0.2;
      crystalShards[i].rotation.y += delta * 0.3;
    }

    for (var i = 0; i < energyShields.length; i++) {
      energyShields[i].material.opacity = 0.3 + Math.sin(time * 2 + i) * 0.15;
    }

    if (centralMonolith) {
      centralMonolith.rotation.y += delta * 0.2;
      var pulseScale = 1 + Math.sin(time * 1.2) * 0.05;
      centralMonolith.scale.set(pulseScale, pulseScale, pulseScale);
    }
  };

  var reset = function() {
    for (var i = 0; i < environment.length; i++) {
      scene.remove(environment[i]);
      if (environment[i].geometry) {
        environment[i].geometry.dispose();
      }
      if (environment[i].material) {
        environment[i].material.dispose();
      }
    }
    environment = [];
    rotatingTowers = [];
    floatingPlatforms = [];
    antiGravityLifts = [];
    crystalShards = [];
    energyShields = [];
    centralMonolith = null;
    time = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
