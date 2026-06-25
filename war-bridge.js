window.WarBridge = (function() {
  'use strict';

  var scene = null;
  var camera = null;

  var bridgeDeck = null;
  var bridgeTowerLeft = null;
  var bridgeTowerRight = null;
  var destroyedSection = null;
  var waterBase = null;
  var suspensionCables = null;
  var fireParticles = [];
  var smokeParticles = [];
  var parachuteGroup = null;
  var parachuteActive = false;
  var parachuteTime = 0;

  var BRIDGE_LENGTH = 200;
  var BRIDGE_WIDTH = 30;
  var BRIDGE_HEIGHT = 2;
  var TOWER_HEIGHT = 80;
  var TOWER_WIDTH = 8;
  var DESTROYED_START = 80;
  var DESTROYED_END = 120;

  var init = function(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;

    buildBridgeDeck();
    buildBridgeTowers();
    buildSuspensionCables();
    buildDestroyedSection();
    buildWater();
    buildBurningVehicles();
    buildSandbagPositions();
    buildSniperNests();
    buildAntiTankBarriers();
    buildSupplyDrop();
  };

  var buildBridgeDeck = function() {
    var deckGeometry = new THREE.BoxGeometry(BRIDGE_LENGTH, BRIDGE_HEIGHT, BRIDGE_WIDTH);
    var deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.2
    });
    bridgeDeck = new THREE.Mesh(deckGeometry, deckMaterial);
    bridgeDeck.position.y = 40;
    scene.add(bridgeDeck);

    var lineGeometry = new THREE.BufferGeometry();
    var linePositions = [];
    var spacing = 2;
    for (var i = -BRIDGE_LENGTH / 2; i < BRIDGE_LENGTH / 2; i += spacing) {
      linePositions.push(i, 40.15, -1);
      linePositions.push(i, 40.15, 1);
    }
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 2 });
    var centerLine = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(centerLine);
  };

  var buildBridgeTowers = function() {
    var towerGeometry = new THREE.BoxGeometry(TOWER_WIDTH, TOWER_HEIGHT, TOWER_WIDTH);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9,
      metalness: 0.1
    });

    bridgeTowerLeft = new THREE.Mesh(towerGeometry, towerMaterial);
    bridgeTowerLeft.position.set(-BRIDGE_LENGTH / 2 + 10, 30, 0);
    scene.add(bridgeTowerLeft);

    bridgeTowerRight = new THREE.Mesh(towerGeometry, towerMaterial);
    bridgeTowerRight.position.set(BRIDGE_LENGTH / 2 - 10, 30, 0);
    scene.add(bridgeTowerRight);

    var cableAnchorSize = 3;
    var leftAnchorGeometry = new THREE.BoxGeometry(cableAnchorSize, cableAnchorSize, cableAnchorSize);
    var anchorMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600, metalness: 0.9 });
    var leftAnchor = new THREE.Mesh(leftAnchorGeometry, anchorMaterial);
    leftAnchor.position.copy(bridgeTowerLeft.position);
    leftAnchor.position.y += TOWER_HEIGHT / 2 + 5;
    scene.add(leftAnchor);

    var rightAnchor = new THREE.Mesh(leftAnchorGeometry, anchorMaterial);
    rightAnchor.position.copy(bridgeTowerRight.position);
    rightAnchor.position.y += TOWER_HEIGHT / 2 + 5;
    scene.add(rightAnchor);
  };

  var buildSuspensionCables = function() {
    var cableGeometry = new THREE.BufferGeometry();
    var cablePositions = [];

    var leftTowerX = -BRIDGE_LENGTH / 2 + 10;
    var rightTowerX = BRIDGE_LENGTH / 2 - 10;
    var towerAnchorY = 30 + TOWER_HEIGHT / 2 + 5;
    var deckY = 40.15;

    for (var x = -BRIDGE_LENGTH / 2 + 20; x < BRIDGE_LENGTH / 2; x += 15) {
      var side = (x < 0) ? -1 : 1;
      var towerX = (side < 0) ? leftTowerX : rightTowerX;

      cablePositions.push(towerX, towerAnchorY, side * 12);
      cablePositions.push(x, deckY, side * 12);
    }

    for (var z = -12; z <= 12; z += 8) {
      cablePositions.push(leftTowerX, towerAnchorY, z);
      cablePositions.push(leftTowerX, towerAnchorY - 15, z);

      cablePositions.push(rightTowerX, towerAnchorY, z);
      cablePositions.push(rightTowerX, towerAnchorY - 15, z);
    }

    cableGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cablePositions), 3));
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0xCCCCCC, linewidth: 1 });
    suspensionCables = new THREE.LineSegments(cableGeometry, cableMaterial);
    scene.add(suspensionCables);
  };

  var buildDestroyedSection = function() {
    var debrisGeometry = new THREE.BoxGeometry(8, 4, BRIDGE_WIDTH);
    var debrisMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.95
    });

    var leftDebris = new THREE.Mesh(debrisGeometry, debrisMaterial);
    leftDebris.position.set(DESTROYED_START - 5, 35, 0);
    leftDebris.rotation.z = 0.3;
    scene.add(leftDebris);

    var rightDebris = new THREE.Mesh(debrisGeometry, debrisMaterial);
    rightDebris.position.set(DESTROYED_END + 5, 35, 0);
    rightDebris.rotation.z = -0.3;
    scene.add(rightDebris);

    var rubbleCount = 15;
    for (var i = 0; i < rubbleCount; i++) {
      var rubbleGeometry = new THREE.BoxGeometry(
        2 + Math.random() * 3,
        1 + Math.random() * 2,
        2 + Math.random() * 3
      );
      var rubbleColor = Math.random() > 0.5 ? 0x555555 : 0x777777;
      var rubbleMaterial = new THREE.MeshStandardMaterial({ color: rubbleColor, roughness: 0.95 });
      var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);

      var rubbleX = DESTROYED_START + Math.random() * (DESTROYED_END - DESTROYED_START);
      rubble.position.set(rubbleX, 20 + Math.random() * 10, (Math.random() - 0.5) * 40);
      rubble.rotation.x = Math.random() * Math.PI;
      rubble.rotation.y = Math.random() * Math.PI;
      rubble.rotation.z = Math.random() * Math.PI;
      scene.add(rubble);
    }
  };

  var buildWater = function() {
    var waterGeometry = new THREE.BoxGeometry(BRIDGE_LENGTH + 100, 20, 150);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A5276,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.7
    });
    waterBase = new THREE.Mesh(waterGeometry, waterMaterial);
    waterBase.position.y = -10;
    waterBase.userData.baseY = -10;
    scene.add(waterBase);
  };

  var buildBurningVehicles = function() {
    var carPositions = [
      { x: -60, y: 40.5, z: -10 },
      { x: 50, y: 40.5, z: 8 },
      { x: 20, y: 40.5, z: -12 }
    ];

    carPositions.forEach(function(pos) {
      var carGeometry = new THREE.BoxGeometry(8, 4, 4);
      var carMaterial = new THREE.MeshStandardMaterial({
        color: 0x330000,
        roughness: 0.8,
        metalness: 0.3
      });
      var car = new THREE.Mesh(carGeometry, carMaterial);
      car.position.set(pos.x, pos.y, pos.z);
      scene.add(car);

      createFireParticles(pos.x, pos.y + 3, pos.z);
    });
  };

  var createFireParticles = function(x, y, z) {
    var particleCount = 8;
    for (var i = 0; i < particleCount; i++) {
      var particleGeometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.8, 4, 4);
      var fireColor = Math.random() > 0.5 ? 0xFF4500 : 0xFFD700;
      var particleMaterial = new THREE.MeshBasicMaterial({
        color: fireColor,
        transparent: true,
        opacity: 0.8
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(x, y, z);
      particle.userData.baseX = x;
      particle.userData.baseY = y;
      particle.userData.baseZ = z;
      particle.userData.velocity = {
        x: (Math.random() - 0.5) * 0.5,
        y: Math.random() * 0.8 + 0.4,
        z: (Math.random() - 0.5) * 0.5
      };
      particle.userData.life = 0;
      particle.userData.maxLife = 2 + Math.random() * 2;
      scene.add(particle);
      fireParticles.push(particle);
    }
  };

  var buildSandbagPositions = function() {
    var sandbagSize = 1.5;
    var positionSets = [
      { x: -80, z: -20 },
      { x: -40, z: 20 },
      { x: 40, z: -20 },
      { x: 70, z: 18 }
    ];

    positionSets.forEach(function(pos) {
      for (var row = 0; row < 3; row++) {
        for (var col = 0; col < 5; col++) {
          var bagGeometry = new THREE.BoxGeometry(sandbagSize, sandbagSize, sandbagSize);
          var bagMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.9
          });
          var bag = new THREE.Mesh(bagGeometry, bagMaterial);
          bag.position.set(
            pos.x + col * sandbagSize,
            40.5 + row * sandbagSize,
            pos.z
          );
          scene.add(bag);
        }
      }
    });
  };

  var buildSniperNests = function() {
    var nestGeometry = new THREE.BoxGeometry(10, 2, 10);
    var nestMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A4A4A,
      roughness: 0.85
    });

    var leftNest = new THREE.Mesh(nestGeometry, nestMaterial);
    leftNest.position.set(-BRIDGE_LENGTH / 2 + 10, 15, -18);
    scene.add(leftNest);

    var rightNest = new THREE.Mesh(nestGeometry, nestMaterial);
    rightNest.position.set(BRIDGE_LENGTH / 2 - 10, 15, 18);
    scene.add(rightNest);

    var sandbagHeight = 1.2;
    var nestPositions = [
      { x: -BRIDGE_LENGTH / 2 + 10, z: -18 },
      { x: BRIDGE_LENGTH / 2 - 10, z: 18 }
    ];

    nestPositions.forEach(function(pos) {
      for (var i = 0; i < 8; i++) {
        var bagGeometry = new THREE.BoxGeometry(1.2, sandbagHeight, 1.2);
        var bagMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });
        var bag = new THREE.Mesh(bagGeometry, bagMaterial);
        bag.position.set(
          pos.x + (i - 3.5) * 1.3,
          17.5,
          pos.z + (Math.random() - 0.5) * 3
        );
        scene.add(bag);
      }
    });
  };

  var buildAntiTankBarriers = function() {
    var barrierPositions = [
      { x: -30, z: 0 },
      { x: 30, z: 0 },
      { x: 0, z: -12 }
    ];

    barrierPositions.forEach(function(pos) {
      for (var i = 0; i < 3; i++) {
        var blockGeometry = new THREE.BoxGeometry(6, 2.5, 1.5);
        var blockMaterial = new THREE.MeshStandardMaterial({
          color: 0x555555,
          roughness: 0.9
        });
        var block = new THREE.Mesh(blockGeometry, blockMaterial);
        block.position.set(pos.x + i * 7, 41.5, pos.z);
        block.rotation.z = 0.35;
        scene.add(block);
      }
    });
  };

  var buildSupplyDrop = function() {
    var crateGeometry = new THREE.BoxGeometry(3, 3, 3);
    var crateMaterial = new THREE.MeshStandardMaterial({
      color: 0xCC8800,
      roughness: 0.75
    });
    var crate = new THREE.Mesh(crateGeometry, crateMaterial);
    crate.position.set(0, 60, 0);
    crate.userData.isParachute = true;
    crate.userData.startY = 60;
    crate.userData.landY = 45;

    parachuteGroup = new THREE.Group();
    parachuteGroup.add(crate);

    var paraCablePositions = [];
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var x = Math.cos(angle) * 2;
      var z = Math.sin(angle) * 2;
      paraCablePositions.push(0, 65, 0);
      paraCablePositions.push(crate.position.x + x, crate.position.y + 5, crate.position.z + z);
    }

    var paraCableGeometry = new THREE.BufferGeometry();
    paraCableGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(paraCablePositions), 3));
    var paraCableMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 1 });
    var paraCables = new THREE.LineSegments(paraCableGeometry, paraCableMaterial);
    parachuteGroup.add(paraCables);

    var parachuteGeometry = new THREE.SphereGeometry(3, 6, 6);
    var paraMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      roughness: 0.7,
      transparent: true,
      opacity: 0.8
    });
    var parachute = new THREE.Mesh(parachuteGeometry, paraMaterial);
    parachute.position.y = 65;
    parachuteGroup.add(parachute);

    scene.add(parachuteGroup);
    parachuteActive = true;
    parachuteTime = 0;
  };

  var createSmokeParticles = function(x, y, z) {
    var smokeCount = 4;
    for (var i = 0; i < smokeCount; i++) {
      var smokeGeometry = new THREE.SphereGeometry(1 + Math.random() * 1.5, 3, 3);
      var smokeMaterial = new THREE.MeshBasicMaterial({
        color: 0x555555,
        transparent: true,
        opacity: 0.6
      });
      var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smoke.position.set(x, y, z);
      smoke.userData.velocity = {
        x: (Math.random() - 0.5) * 0.3,
        y: Math.random() * 0.5 + 0.2,
        z: (Math.random() - 0.5) * 0.3
      };
      smoke.userData.life = 0;
      smoke.userData.maxLife = 4 + Math.random() * 3;
      scene.add(smoke);
      smokeParticles.push(smoke);
    }
  };

  var update = function(delta) {
    if (!scene) return;

    updateFireParticles(delta);
    updateSmokeParticles(delta);
    updateWater(delta);
    updateParachute(delta);
  };

  var updateFireParticles = function(delta) {
    var i = fireParticles.length - 1;
    while (i >= 0) {
      var particle = fireParticles[i];
      particle.userData.life += delta;

      if (particle.userData.life > particle.userData.maxLife) {
        scene.remove(particle);
        fireParticles.splice(i, 1);
        i--;
        continue;
      }

      var lifeRatio = particle.userData.life / particle.userData.maxLife;
      particle.position.x += particle.userData.velocity.x;
      particle.position.y += particle.userData.velocity.y;
      particle.position.z += particle.userData.velocity.z;
      particle.material.opacity = 0.8 * (1 - lifeRatio);
      particle.scale.set(1 + lifeRatio * 0.5, 1 + lifeRatio * 0.5, 1 + lifeRatio * 0.5);

      if (Math.random() > 0.7) {
        createSmokeParticles(particle.position.x, particle.position.y, particle.position.z);
      }

      i--;
    }
  };

  var updateSmokeParticles = function(delta) {
    var i = smokeParticles.length - 1;
    while (i >= 0) {
      var particle = smokeParticles[i];
      particle.userData.life += delta;

      if (particle.userData.life > particle.userData.maxLife) {
        scene.remove(particle);
        smokeParticles.splice(i, 1);
        i--;
        continue;
      }

      var lifeRatio = particle.userData.life / particle.userData.maxLife;
      particle.position.x += particle.userData.velocity.x;
      particle.position.y += particle.userData.velocity.y;
      particle.position.z += particle.userData.velocity.z;
      particle.material.opacity = 0.6 * (1 - lifeRatio);
      particle.scale.set(1 + lifeRatio, 1 + lifeRatio, 1 + lifeRatio);

      i--;
    }
  };

  var updateWater = function(delta) {
    if (!waterBase) return;
    var waveHeight = Math.sin(delta * 2) * 0.3;
    waterBase.position.y = waterBase.userData.baseY + waveHeight;
  };

  var updateParachute = function(delta) {
    if (!parachuteActive || !parachuteGroup) return;

    parachuteTime += delta;
    var duration = 8;
    var progress = Math.min(parachuteTime / duration, 1);

    if (progress >= 1) {
      parachuteActive = false;
      scene.remove(parachuteGroup);
      parachuteGroup = null;
      return;
    }

    var crate = parachuteGroup.children[0];
    var startY = crate.userData.startY;
    var landY = crate.userData.landY;
    crate.position.y = startY + (landY - startY) * progress;

    var swayX = Math.sin(parachuteTime * 1.5) * 2 * (1 - progress);
    var swayZ = Math.cos(parachuteTime * 1.2) * 2 * (1 - progress);
    parachuteGroup.position.x = swayX;
    parachuteGroup.position.z = swayZ;

    if (progress > 0.3 && Math.random() > 0.8) {
      var dustX = crate.position.x + (Math.random() - 0.5) * 2;
      var dustY = crate.position.y - 2;
      var dustZ = crate.position.z + (Math.random() - 0.5) * 2;
      createSmokeParticles(dustX, dustY, dustZ);
    }
  };

  var reset = function() {
    while (fireParticles.length > 0) {
      var particle = fireParticles.pop();
      scene.remove(particle);
    }
    while (smokeParticles.length > 0) {
      var smoke = smokeParticles.pop();
      scene.remove(smoke);
    }
    if (parachuteGroup) {
      scene.remove(parachuteGroup);
      parachuteGroup = null;
      parachuteActive = false;
      parachuteTime = 0;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
