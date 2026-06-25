window.StormValley = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var rainDroplets = [];
  var lightningSegments = [];
  var waterBodies = [];
  var flappingTents = [];
  var animationState = {
    rainTime: 0,
    lightningTime: 0,
    waterRipple: 0,
    tentFlap: 0
  };

  var STORM_GRAY = 0x4a5568;
  var DARK_ROCK = 0x2c2c2c;
  var MUDDY_BROWN = 0x5c4a3d;
  var WATER_BLUE = 0x1a3a52;
  var LIGHTNING_WHITE = 0xffff99;
  var BURNT_BLACK = 0x1a1a1a;

  function createMountainWalls() {
    var wallConfigs = [
      { x: 40, y: 12.5, z: 0, width: 10, height: 25, depth: 80 },
      { x: -40, y: 12.5, z: 0, width: 10, height: 25, depth: 80 },
      { x: 0, y: 12.5, z: 40, width: 80, height: 25, depth: 10 },
      { x: 0, y: 12.5, z: -40, width: 80, height: 25, depth: 10 },
      { x: 35, y: 15, z: 35, width: 12, height: 20, depth: 12 },
      { x: -35, y: 15, z: 35, width: 12, height: 20, depth: 12 },
      { x: 35, y: 15, z: -35, width: 12, height: 20, depth: 12 },
      { x: -35, y: 15, z: -35, width: 12, height: 20, depth: 12 }
    ];

    wallConfigs.forEach(function(config) {
      var geometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
      var material = new THREE.MeshStandardMaterial({ color: DARK_ROCK, roughness: 0.8 });
      var wall = new THREE.Mesh(geometry, material);
      wall.position.set(config.x, config.y, config.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      objects.push(wall);
    });
  }

  function createFloodedValleyFloor() {
    var waterBodies = [
      { x: 0, y: 0.5, z: 0, width: 60, depth: 50 },
      { x: 20, y: 0.5, z: -20, width: 30, depth: 25 },
      { x: -25, y: 0.5, z: 15, width: 25, depth: 35 }
    ];

    waterBodies.forEach(function(config) {
      var geometry = new THREE.BoxGeometry(config.width, 1, config.depth);
      var material = new THREE.MeshStandardMaterial({
        color: WATER_BLUE,
        roughness: 0.3,
        metalness: 0.1
      });
      var water = new THREE.Mesh(geometry, material);
      water.position.set(config.x, config.y, config.z);
      water.receiveShadow = true;
      water.userData.isWater = true;
      water.userData.originalY = config.y;
      scene.add(water);
      objects.push(water);
      window.StormValley.waterBodies.push(water);
    });
  }

  function createDownedTrees() {
    var treePositions = [
      { x: 15, y: 1, z: 10, rx: 0.5, rz: 0.3 },
      { x: -20, y: 1, z: -15, rx: -0.4, rz: 0.5 },
      { x: 25, y: 1, z: -25, rx: 0.3, rz: -0.4 },
      { x: -15, y: 1, z: 20, rx: 0.6, rz: 0.2 },
      { x: 30, y: 1, z: 5, rx: -0.3, rz: 0.4 },
      { x: -30, y: 1, z: -10, rx: 0.4, rz: -0.5 },
      { x: 10, y: 1, z: -30, rx: 0.2, rz: 0.3 },
      { x: -10, y: 1, z: 30, rx: -0.5, rz: 0.2 }
    ];

    treePositions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
      var material = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
      var trunk = new THREE.Mesh(geometry, material);
      trunk.position.set(pos.x, pos.y, pos.z);
      trunk.rotation.z = pos.rz;
      trunk.rotation.x = pos.rx;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);
      objects.push(trunk);
    });
  }

  function createLightningScars() {
    var scarPositions = [
      { x: 5, z: 8 },
      { x: -10, z: -5 },
      { x: 15, z: -20 },
      { x: -20, z: 15 },
      { x: 12, z: 25 },
      { x: -15, z: -25 },
      { x: 25, z: 10 },
      { x: -25, z: -10 }
    ];

    scarPositions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(3, 0.2, 3);
      var material = new THREE.MeshStandardMaterial({ color: BURNT_BLACK, roughness: 1 });
      var scar = new THREE.Mesh(geometry, material);
      scar.position.set(pos.x, 0.1, pos.z);
      scar.receiveShadow = true;
      scene.add(scar);
      objects.push(scar);
    });
  }

  function createStormDebris() {
    var debrisTypes = [
      { x: 8, y: 2, z: 12, w: 2, h: 1, d: 0.5 },
      { x: -18, y: 2.5, z: -8, w: 1.5, h: 0.5, d: 2 },
      { x: 22, y: 1.5, z: -18, w: 3, h: 0.3, d: 1 },
      { x: -12, y: 2, z: 18, w: 1, h: 1.5, d: 0.8 },
      { x: 28, y: 2, z: 8, w: 2, h: 0.8, d: 1 },
      { x: -28, y: 1.5, z: -12, w: 1.5, h: 1, d: 2.5 },
      { x: 18, y: 2, z: -28, w: 2.5, h: 0.5, d: 1.5 },
      { x: -8, y: 2, z: 28, w: 1, h: 1.2, d: 2 },
      { x: 5, y: 1.5, z: 5, w: 2, h: 0.8, d: 1.5 },
      { x: -5, y: 2, z: -5, w: 1.5, h: 1, d: 2 }
    ];

    debrisTypes.forEach(function(item) {
      var geometry = new THREE.BoxGeometry(item.w, item.h, item.d);
      var material = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? MUDDY_BROWN : 0x4a4a4a,
        roughness: 0.7
      });
      var debris = new THREE.Mesh(geometry, material);
      debris.position.set(item.x, item.y, item.z);
      debris.rotation.y = Math.random() * Math.PI;
      debris.castShadow = true;
      debris.receiveShadow = true;
      scene.add(debris);
      objects.push(debris);
    });
  }

  function createMilitaryForwardCamp() {
    var tentPositions = [
      { x: -10, z: -20 },
      { x: -5, z: -20 },
      { x: 0, z: -20 },
      { x: 5, z: -20 },
      { x: -10, z: -15 },
      { x: 5, z: -15 },
      { x: -2.5, z: -10 }
    ];

    tentPositions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(4, 3, 4);
      var material = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.6 });
      var tent = new THREE.Mesh(geometry, material);
      tent.position.set(pos.x, 1.5, pos.z);
      tent.castShadow = true;
      tent.receiveShadow = true;
      tent.userData.isTent = true;
      tent.userData.baseRotation = 0;
      scene.add(tent);
      objects.push(tent);
      flappingTents.push(tent);
    });

    for (var i = 0; i < 3; i++) {
      var geometry = new THREE.BoxGeometry(4, 2, 4);
      var material = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.7 });
      var collapsedTent = new THREE.Mesh(geometry, material);
      collapsedTent.position.set(-15 + i * 5, 0.8, -18);
      collapsedTent.rotation.z = Math.PI / 6;
      collapsedTent.castShadow = true;
      collapsedTent.receiveShadow = true;
      scene.add(collapsedTent);
      objects.push(collapsedTent);
    }
  }

  function createBrokenBridge() {
    var bridgeSegments = [
      { x: -8, width: 4 },
      { x: 8, width: 4 }
    ];

    bridgeSegments.forEach(function(seg) {
      var geometry = new THREE.BoxGeometry(seg.width, 1, 8);
      var material = new THREE.MeshStandardMaterial({ color: 0x6b5b4f, roughness: 0.8 });
      var bridge = new THREE.Mesh(geometry, material);
      bridge.position.set(seg.x, 1, 0);
      bridge.castShadow = true;
      bridge.receiveShadow = true;
      scene.add(bridge);
      objects.push(bridge);
    });

    for (var i = 0; i < 4; i++) {
      var geometry = new THREE.BoxGeometry(0.3, 3, 8);
      var material = new THREE.MeshStandardMaterial({ color: 0x5c4a3d, roughness: 0.9 });
      var pillar = new THREE.Mesh(geometry, material);
      pillar.position.set(-8 + i * 5.5, 1.5, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      objects.push(pillar);
    }

    for (var i = 0; i < 8; i++) {
      var geometry = new THREE.BoxGeometry(0.2, 4, 0.2);
      var material = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      var railing = new THREE.Mesh(geometry, material);
      railing.position.set(-10 + i * 2.5, 2.5, -4.5);
      railing.castShadow = true;
      railing.receiveShadow = true;
      scene.add(railing);
      objects.push(railing);
    }

    for (var i = 0; i < 8; i++) {
      var geometry = new THREE.BoxGeometry(0.2, 4, 0.2);
      var material = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      var railing2 = new THREE.Mesh(geometry, material);
      railing2.position.set(-10 + i * 2.5, 2.5, 4.5);
      railing2.castShadow = true;
      railing2.receiveShadow = true;
      scene.add(railing2);
      objects.push(railing2);
    }
  }

  function createRainEffect() {
    for (var i = 0; i < 120; i++) {
      var geometry = new THREE.SphereGeometry(0.05, 4, 4);
      var material = new THREE.MeshStandardMaterial({
        color: 0xccccff,
        roughness: 0.2,
        metalness: 0.1
      });
      var drop = new THREE.Mesh(geometry, material);
      drop.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 40 + 20,
        (Math.random() - 0.5) * 100
      );
      drop.userData.velocityY = -15 - Math.random() * 10;
      drop.userData.startY = drop.position.y;
      scene.add(drop);
      objects.push(drop);
      rainDroplets.push(drop);
    }
  }

  function createStormDrainChannels() {
    var drainPositions = [
      { x: 10, z: 15 },
      { x: -15, z: -10 },
      { x: 20, z: -15 },
      { x: -20, z: 20 }
    ];

    drainPositions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(1, 0.5, 12);
      var material = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
      var drain = new THREE.Mesh(geometry, material);
      drain.position.set(pos.x, 0.25, pos.z);
      drain.castShadow = true;
      drain.receiveShadow = true;
      scene.add(drain);
      objects.push(drain);
    });
  }

  function createWaterfalls() {
    var waterfallConfigs = [
      { x: 40, y: 20, z: 10, width: 3 },
      { x: 40, y: 20, z: -10, width: 2.5 },
      { x: -40, y: 20, z: -15, width: 2 },
      { x: -40, y: 20, z: 15, width: 3 }
    ];

    waterfallConfigs.forEach(function(config) {
      for (var i = 0; i < 4; i++) {
        var geometry = new THREE.BoxGeometry(config.width / 4, 18, 0.3);
        var material = new THREE.MeshStandardMaterial({
          color: 0x5a7a8a,
          roughness: 0.4,
          metalness: 0.2
        });
        var water = new THREE.Mesh(geometry, material);
        water.position.set(
          config.x - config.width / 2 + i * config.width / 4,
          config.y - 9,
          config.z
        );
        water.castShadow = true;
        water.receiveShadow = true;
        scene.add(water);
        objects.push(water);
      }
    });
  }

  function createLightningConductorArray() {
    var poleSides = [
      { x: 35, z: 35 },
      { x: -35, z: 35 },
      { x: 35, z: -35 },
      { x: -35, z: -35 },
      { x: 0, z: 40 },
      { x: 0, z: -40 },
      { x: 40, z: 0 },
      { x: -40, z: 0 }
    ];

    poleSides.forEach(function(pos) {
      var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 10, 8);
      var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pos.x, 5, pos.z);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);
      objects.push(pole);

      var rodGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 6);
      var rodMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.5 });
      var rod = new THREE.Mesh(rodGeometry, rodMaterial);
      rod.position.set(pos.x, 10.5, pos.z);
      rod.castShadow = true;
      rod.receiveShadow = true;
      scene.add(rod);
      objects.push(rod);
    });
  }

  function createEmergencyWeatherStation() {
    var bunkerGeometry = new THREE.BoxGeometry(6, 4, 6);
    var bunkerMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.set(30, 2, 25);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    scene.add(bunker);
    objects.push(bunker);

    var anemometerGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
    var anemometerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    var anemometer = new THREE.Mesh(anemometerGeometry, anemometerMaterial);
    anemometer.position.set(30, 6.5, 25);
    anemometer.castShadow = true;
    anemometer.receiveShadow = true;
    anemometer.userData.isAnemometer = true;
    anemometer.userData.baseRotation = 0;
    scene.add(anemometer);
    objects.push(anemometer);

    for (var i = 0; i < 4; i++) {
      var armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4);
      var armMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 });
      var arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(
        30 + Math.cos(i * Math.PI / 2) * 1,
        7.5,
        25 + Math.sin(i * Math.PI / 2) * 1
      );
      arm.rotation.z = i * Math.PI / 2;
      arm.castShadow = true;
      arm.receiveShadow = true;
      scene.add(arm);
      objects.push(arm);
    }

    for (var i = 0; i < 8; i++) {
      var antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 4);
      var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.6 });
      var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
      antenna.position.set(30 + Math.cos(i * Math.PI / 4) * 2, 7, 25 + Math.sin(i * Math.PI / 4) * 2);
      antenna.rotation.z = Math.random() * 0.3 - 0.15;
      antenna.castShadow = true;
      antenna.receiveShadow = true;
      scene.add(antenna);
      objects.push(antenna);
    }
  }

  function createFlotsam() {
    var flotsamConfigs = [
      { x: 5, y: 0.7, z: 5, w: 2, h: 0.4, d: 1 },
      { x: -8, y: 0.7, z: 3, w: 1.5, h: 0.3, d: 2.5 },
      { x: 12, y: 0.7, z: -2, w: 2.5, h: 0.35, d: 1.5 },
      { x: -15, y: 0.7, z: 8, w: 1.8, h: 0.4, d: 2 },
      { x: 20, y: 0.7, z: -5, w: 2.2, h: 0.3, d: 1.8 },
      { x: -20, y: 0.7, z: -8, w: 2, h: 0.35, d: 2.2 },
      { x: 8, y: 0.7, z: -12, w: 1.5, h: 0.4, d: 1.2 },
      { x: -12, y: 0.7, z: 12, w: 2.3, h: 0.3, d: 1.6 },
      { x: 18, y: 0.7, z: 10, w: 1.7, h: 0.35, d: 2 },
      { x: -18, y: 0.7, z: -15, w: 2.1, h: 0.4, d: 1.9 }
    ];

    flotsamConfigs.forEach(function(config) {
      var geometry = new THREE.BoxGeometry(config.w, config.h, config.d);
      var material = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0x8b7355 : 0x6b5b4f,
        roughness: 0.9
      });
      var flotsam = new THREE.Mesh(geometry, material);
      flotsam.position.set(config.x, config.y, config.z);
      flotsam.rotation.y = Math.random() * Math.PI;
      flotsam.castShadow = true;
      flotsam.receiveShadow = true;
      flotsam.userData.isFlotsam = true;
      flotsam.userData.originalY = config.y;
      scene.add(flotsam);
      objects.push(flotsam);
    });
  }

  function createLightningStrikes() {
    for (var i = 0; i < 8; i++) {
      var points = [];
      var x = (Math.random() - 0.5) * 70;
      var z = (Math.random() - 0.5) * 70;
      var segments = 6;

      for (var j = 0; j <= segments; j++) {
        var offsetX = (Math.random() - 0.5) * 4;
        var offsetZ = (Math.random() - 0.5) * 4;
        points.push(new THREE.Vector3(x + offsetX, 30 - j * 5, z + offsetZ));
      }

      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: LIGHTNING_WHITE });
      var lightning = new THREE.LineSegments(geometry, material);
      lightning.userData.isLightning = true;
      lightning.userData.intensity = 0;
      lightning.visible = false;
      scene.add(lightning);
      objects.push(lightning);
      lightningSegments.push(lightning);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    rainDroplets = [];
    lightningSegments = [];
    waterBodies = [];
    flappingTents = [];

    createMountainWalls();
    createFloodedValleyFloor();
    createDownedTrees();
    createLightningScars();
    createStormDebris();
    createMilitaryForwardCamp();
    createBrokenBridge();
    createRainEffect();
    createStormDrainChannels();
    createWaterfalls();
    createLightningConductorArray();
    createEmergencyWeatherStation();
    createFlotsam();
    createLightningStrikes();

    return objects.length;
  }

  function update(delta) {
    animationState.rainTime += delta;
    animationState.lightningTime += delta;
    animationState.waterRipple += delta;
    animationState.tentFlap += delta;

    rainDroplets.forEach(function(drop) {
      drop.position.y += drop.userData.velocityY * delta;

      if (drop.position.y < drop.userData.startY - 30) {
        drop.position.y = drop.userData.startY;
      }
    });

    lightningSegments.forEach(function(lightning, index) {
      var threshold = 0.1;
      var flashDuration = 0.15;
      var timeSinceFlash = (animationState.lightningTime - Math.floor(animationState.lightningTime / 3) * 3) % 3;

      if (timeSinceFlash < flashDuration && Math.random() > 0.6) {
        lightning.visible = true;
        lightning.material.opacity = Math.max(0, 1 - (timeSinceFlash / flashDuration));
      } else {
        lightning.visible = false;
      }
    });

    waterBodies.forEach(function(water) {
      var rippleAmount = Math.sin(animationState.waterRipple * 2) * 0.1;
      water.position.y = water.userData.originalY + rippleAmount;

      var flotsam = objects.filter(function(obj) { return obj.userData.isFlotsam; });
      flotsam.forEach(function(item) {
        if (Math.abs(item.position.x - water.position.x) < water.geometry.parameters.width / 2 &&
            Math.abs(item.position.z - water.position.z) < water.geometry.parameters.depth / 2) {
          item.position.y = water.userData.originalY + 0.5 + rippleAmount;
        }
      });
    });

    flappingTents.forEach(function(tent) {
      var flapAmount = Math.sin(animationState.tentFlap * 3) * 0.08;
      tent.rotation.z = tent.userData.baseRotation + flapAmount;
      tent.rotation.x = Math.sin(animationState.tentFlap * 2.5) * 0.05;
    });

    var anemometer = objects.find(function(obj) { return obj.userData.isAnemometer; });
    if (anemometer) {
      anemometer.rotation.y += delta * 3 + Math.sin(animationState.tentFlap) * 0.5;
    }
  }

  function reset() {
    objects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });

    objects = [];
    rainDroplets = [];
    lightningSegments = [];
    waterBodies = [];
    flappingTents = [];
    animationState = {
      rainTime: 0,
      lightningTime: 0,
      waterRipple: 0,
      tentFlap: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset,
    waterBodies: []
  };
}());
