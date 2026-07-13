window.FrozenCastle = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];
  var blizzardParticles = [];

  function init(sceneIn, cameraIn) {
    scene = sceneIn;
    camera = cameraIn;
    objects = [];
    animatedObjects = [];
    blizzardParticles = [];

    // Castle keep - tall ice-blue stone
    var keepGeometry = new THREE.BoxGeometry(30, 60, 25);
    var keepMaterial = new THREE.MeshStandardMaterial({ color: 0x99BBCC, roughness: 0.7, metalness: 0.2 });
    var keep = new THREE.Mesh(keepGeometry, keepMaterial);
    keep.position.set(0, 30, 0);
    scene.add(keep);
    objects.push(keep);

    // Round towers with cone ice caps
    var towerRadius = 8;
    var towerHeight = 50;
    var towerGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x88AACC, roughness: 0.7, metalness: 0.1 });

    var towerPositions = [
      { x: -25, z: -20 },
      { x: 25, z: -20 },
      { x: -25, z: 20 },
      { x: 25, z: 20 }
    ];

    for (var i = 0; i < towerPositions.length; i++) {
      var tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(towerPositions[i].x, towerHeight / 2, towerPositions[i].z);
      scene.add(tower);
      objects.push(tower);

      // Ice cap cone on top
      var capGeometry = new THREE.ConeGeometry(towerRadius + 2, 10, 16);
      var capMaterial = new THREE.MeshStandardMaterial({ color: 0xCCEEFF, roughness: 0.5, metalness: 0.3 });
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.set(towerPositions[i].x, towerHeight + 5, towerPositions[i].z);
      scene.add(cap);
      objects.push(cap);
    }

    // Frozen moat - wide ice
    var moatGeometry = new THREE.BoxGeometry(80, 2, 70);
    var moatMaterial = new THREE.MeshStandardMaterial({
      color: 0x9BBCCC,
      roughness: 0.4,
      metalness: 0.5,
      emissive: 0x5588CC,
      emissiveIntensity: 0.3
    });
    var moat = new THREE.Mesh(moatGeometry, moatMaterial);
    moat.position.set(0, 0.5, 0);
    scene.add(moat);
    objects.push(moat);
    animatedObjects.push({ mesh: moat, type: 'moat' });

    // Ice-covered drawbridge
    var bridgeGeometry = new THREE.BoxGeometry(15, 3, 12);
    var bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0xAABBCC, roughness: 0.6, metalness: 0.2 });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(0, 3, -30);
    scene.add(bridge);
    objects.push(bridge);

    // Icicle formations on battlements
    var iciclePositions = [
      { x: -15, z: -12 }, { x: -8, z: -12 }, { x: 0, z: -12 },
      { x: 8, z: -12 }, { x: 15, z: -12 },
      { x: -15, z: 12 }, { x: -8, z: 12 }, { x: 8, z: 12 }, { x: 15, z: 12 }
    ];

    for (var j = 0; j < iciclePositions.length; j++) {
      var icicleGeometry = new THREE.ConeGeometry(1.2, 6, 6);
      var icicleMaterial = new THREE.MeshStandardMaterial({ color: 0xCCEEFF, roughness: 0.3, metalness: 0.4 });
      var icicle = new THREE.Mesh(icicleGeometry, icicleMaterial);
      icicle.position.set(iciclePositions[j].x, 58, iciclePositions[j].z);
      icicle.rotation.z = Math.PI;
      scene.add(icicle);
      objects.push(icicle);
      animatedObjects.push({ mesh: icicle, type: 'icicle', originalY: 58 });
    }

    // Frozen soldiers encased in ice
    var soldierPositions = [
      { x: -10, z: -15 },
      { x: 10, z: 15 },
      { x: -15, z: 5 }
    ];

    for (var k = 0; k < soldierPositions.length; k++) {
      var soldierGeometry = new THREE.BoxGeometry(2.5, 6, 2);
      var soldierMaterial = new THREE.MeshStandardMaterial({ color: 0x8899BB, roughness: 0.8, metalness: 0.1 });
      var soldier = new THREE.Mesh(soldierGeometry, soldierMaterial);
      soldier.position.set(soldierPositions[k].x, 3, soldierPositions[k].z);
      scene.add(soldier);
      objects.push(soldier);
    }

    // Ice throne room
    var throneRoomGeometry = new THREE.BoxGeometry(20, 15, 20);
    var throneRoomMaterial = new THREE.MeshStandardMaterial({ color: 0x9AABB5, roughness: 0.7, metalness: 0.15 });
    var throneRoom = new THREE.Mesh(throneRoomGeometry, throneRoomMaterial);
    throneRoom.position.set(35, 7.5, 0);
    scene.add(throneRoom);
    objects.push(throneRoom);

    // Ice throne (sphere)
    var throneGeometry = new THREE.SphereGeometry(3.5, 8, 6);
    var throneMaterial = new THREE.MeshStandardMaterial({
      color: 0xBBDDEE,
      roughness: 0.4,
      metalness: 0.6,
      emissive: 0x6699DD,
      emissiveIntensity: 0.2
    });
    var throne = new THREE.Mesh(throneGeometry, throneMaterial);
    throne.position.set(35, 8, 0);
    scene.add(throne);
    objects.push(throne);
    animatedObjects.push({ mesh: throne, type: 'throne' });

    // Frozen fountain courtyard
    var fountainBasinGeometry = new THREE.CylinderGeometry(8, 8, 1.5, 16);
    var fountainMaterial = new THREE.MeshStandardMaterial({ color: 0xAABBCC, roughness: 0.6, metalness: 0.2 });
    var fountainBasin = new THREE.Mesh(fountainBasinGeometry, fountainMaterial);
    fountainBasin.position.set(-35, 1, 0);
    scene.add(fountainBasin);
    objects.push(fountainBasin);

    // Ice spray sphere in fountain
    var sprayGeometry = new THREE.SphereGeometry(4, 6, 6);
    var sprayMaterial = new THREE.MeshStandardMaterial({
      color: 0xDDEEFF,
      roughness: 0.3,
      metalness: 0.5,
      emissive: 0x7799EE,
      emissiveIntensity: 0.15
    });
    var spray = new THREE.Mesh(sprayGeometry, sprayMaterial);
    spray.position.set(-35, 4, 0);
    scene.add(spray);
    objects.push(spray);
    animatedObjects.push({ mesh: spray, type: 'spray' });

    // Crystal ice pillars
    var pillarPositions = [
      { x: -20, z: -25 },
      { x: 20, z: -25 },
      { x: 0, z: 35 },
      { x: -18, z: 0 },
      { x: 18, z: 0 }
    ];

    for (var m = 0; m < pillarPositions.length; m++) {
      var pillarGeometry = new THREE.CylinderGeometry(2, 2.5, 25, 8);
      var pillarMaterial = new THREE.MeshStandardMaterial({
        color: 0xBBDDEE,
        roughness: 0.25,
        metalness: 0.7,
        emissive: 0x99CCEE,
        emissiveIntensity: 0.25
      });
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pillarPositions[m].x, 12.5, pillarPositions[m].z);
      scene.add(pillar);
      objects.push(pillar);
      animatedObjects.push({ mesh: pillar, type: 'pillar' });
    }

    // Snow drifts piled at walls
    var driftPositions = [
      { x: -35, z: -30, scale: 1.2 },
      { x: 35, z: -30, scale: 1.5 },
      { x: -40, z: 25, scale: 1.3 },
      { x: 40, z: 25, scale: 1.1 }
    ];

    for (var n = 0; n < driftPositions.length; n++) {
      var driftGeometry = new THREE.SphereGeometry(5, 6, 5);
      var driftMaterial = new THREE.MeshStandardMaterial({ color: 0xEEEEFF, roughness: 0.8, metalness: 0.05 });
      var drift = new THREE.Mesh(driftGeometry, driftMaterial);
      drift.scale.set(driftPositions[n].scale, 0.6, driftPositions[n].scale);
      drift.position.set(driftPositions[n].x, 2.5, driftPositions[n].z);
      scene.add(drift);
      objects.push(drift);
    }

    // Blizzard particle effects
    blizzardParticles = [];
    for (var p = 0; p < 40; p++) {
      var particleGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xDDEEFF,
        roughness: 0.4,
        metalness: 0.3,
        emissive: 0xAABBEE,
        emissiveIntensity: 0.3
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 40,
        (Math.random() - 0.5) * 100
      );
      scene.add(particle);
      objects.push(particle);
      blizzardParticles.push({
        mesh: particle,
        originalX: particle.position.x,
        originalZ: particle.position.z,
        phase: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.02 + 0.01
      });
    }

    // Ice dungeon with frozen prisoners
    var dungeonGeometry = new THREE.BoxGeometry(25, 12, 18);
    var dungeonMaterial = new THREE.MeshStandardMaterial({ color: 0x8899AA, roughness: 0.8, metalness: 0.1 });
    var dungeon = new THREE.Mesh(dungeonGeometry, dungeonMaterial);
    dungeon.position.set(0, 6, -50);
    scene.add(dungeon);
    objects.push(dungeon);

    // Frozen siege weapons (catapult)
    var catapultArmGeometry = new THREE.BoxGeometry(3, 1, 8);
    var catapultMaterial = new THREE.MeshStandardMaterial({ color: 0x7788AA, roughness: 0.7, metalness: 0.2 });
    var catapultArm = new THREE.Mesh(catapultArmGeometry, catapultMaterial);
    catapultArm.position.set(15, 8, -50);
    scene.add(catapultArm);
    objects.push(catapultArm);

    var catapultBaseGeometry = new THREE.BoxGeometry(6, 3, 6);
    var catapultBase = new THREE.Mesh(catapultBaseGeometry, catapultMaterial);
    catapultBase.position.set(15, 3, -50);
    scene.add(catapultBase);
    objects.push(catapultBase);

    // Ancient ice runes on floor
    var runePositions = [
      { x: -8, z: -8 },
      { x: 8, z: -8 },
      { x: 0, z: 0 },
      { x: -8, z: 8 },
      { x: 8, z: 8 },
      { x: 0, z: -16 },
      { x: 0, z: 16 }
    ];

    for (var r = 0; r < runePositions.length; r++) {
      var runeGeometry = new THREE.BoxGeometry(3, 0.2, 3);
      var runeMaterial = new THREE.MeshStandardMaterial({
        color: 0x99AABB,
        roughness: 0.6,
        metalness: 0.3,
        emissive: 0x88CCFF,
        emissiveIntensity: 0.4
      });
      var rune = new THREE.Mesh(runeGeometry, runeMaterial);
      rune.position.set(runePositions[r].x, 1.1, runePositions[r].z);
      scene.add(rune);
      objects.push(rune);
      animatedObjects.push({ mesh: rune, type: 'rune' });
    }
  }

  function update(delta) {
    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];

      if (obj.type === 'moat') {
        // Moat ice shimmers
        obj.mesh.material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.003) * 0.15;
      } else if (obj.type === 'icicle') {
        // Icicles drip slightly
        obj.mesh.position.y = obj.originalY + Math.sin(Date.now() * 0.002) * 0.3;
      } else if (obj.type === 'pillar') {
        // Crystal pillars shimmer
        obj.mesh.material.emissiveIntensity = 0.25 + Math.sin(Date.now() * 0.0025 + i) * 0.15;
      } else if (obj.type === 'rune') {
        // Ice runes pulse
        obj.mesh.material.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.0035) * 0.2;
      } else if (obj.type === 'throne') {
        // Throne subtle shimmer
        obj.mesh.material.emissiveIntensity = 0.2 + Math.sin(Date.now() * 0.002) * 0.1;
      } else if (obj.type === 'spray') {
        // Fountain spray shimmer
        obj.mesh.material.emissiveIntensity = 0.15 + Math.sin(Date.now() * 0.0028) * 0.12;
      }
    }

    // Blizzard particles drift and swirl
    for (var j = 0; j < blizzardParticles.length; j++) {
      var particle = blizzardParticles[j];
      var time = Date.now() * 0.001;

      // Orbital drift
      particle.mesh.position.x = particle.originalX + Math.sin(time * particle.driftSpeed + particle.phase) * 15;
      particle.mesh.position.z = particle.originalZ + Math.cos(time * particle.driftSpeed + particle.phase) * 15;

      // Vertical oscillation
      particle.mesh.position.y = particle.mesh.position.y - 0.01;
      if (particle.mesh.position.y < -5) {
        particle.mesh.position.y = 45;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
    blizzardParticles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
