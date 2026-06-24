window.VampireLair = (function() {
  'use strict';

  var objects = [];
  var scene = null;
  var sceneObjects = {
    batSwarm: [],
    candelabra: [],
    altar: null,
    coffin: null,
    chains: [],
    cursedArmor: [],
    throne: null,
    mirrorRoom: null,
    roseWindow: null,
    vault: null
  };

  function init(sceneParam, camera) {
    scene = sceneParam;

    // Gothic mansion exterior - tall dark stone structure
    var mansionGeometry = new THREE.BoxGeometry(40, 50, 35);
    var mansionMaterial = new THREE.MeshStandardMaterial({
      color: 0x221122,
      roughness: 0.8,
      metalness: 0.1
    });
    var mansion = new THREE.Mesh(mansionGeometry, mansionMaterial);
    mansion.position.set(0, 25, -15);
    mansion.castShadow = true;
    mansion.receiveShadow = true;
    scene.add(mansion);
    objects.push(mansion);

    // Coffin room - dark wood coffin with sarcophagus
    var coffinLidGeometry = new THREE.BoxGeometry(2.5, 0.5, 5);
    var coffinLidMaterial = new THREE.MeshStandardMaterial({
      color: 0x331122,
      roughness: 0.7,
      metalness: 0.2
    });
    var coffinLid = new THREE.Mesh(coffinLidGeometry, coffinLidMaterial);
    coffinLid.position.set(-12, 2, 5);
    coffinLid.castShadow = true;
    coffinLid.receiveShadow = true;
    scene.add(coffinLid);
    objects.push(coffinLid);
    sceneObjects.coffin = coffinLid;

    var sarcophagusGeometry = new THREE.CylinderGeometry(1.3, 1.5, 5, 8);
    var sarcophagusMaterial = new THREE.MeshStandardMaterial({
      color: 0x221122,
      roughness: 0.75
    });
    var sarcophagus = new THREE.Mesh(sarcophagusGeometry, sarcophagusMaterial);
    sarcophagus.position.set(-12, 2.8, 5);
    sarcophagus.castShadow = true;
    sarcophagus.receiveShadow = true;
    scene.add(sarcophagus);
    objects.push(sarcophagus);

    // Blood ritual altar - dark red with gold chalice
    var altarGeometry = new THREE.BoxGeometry(3, 2.5, 3);
    var altarMaterial = new THREE.MeshStandardMaterial({
      color: 0x440000,
      roughness: 0.6,
      metalness: 0.3,
      emissive: 0x220000,
      emissiveIntensity: 0.3
    });
    var altar = new THREE.Mesh(altarGeometry, altarMaterial);
    altar.position.set(8, 1.25, 8);
    altar.castShadow = true;
    altar.receiveShadow = true;
    scene.add(altar);
    objects.push(altar);
    sceneObjects.altar = altar;

    var chaliceGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1, 8);
    var chaliceMaterial = new THREE.MeshStandardMaterial({
      color: 0x886622,
      roughness: 0.3,
      metalness: 0.8
    });
    var chalice = new THREE.Mesh(chaliceGeometry, chaliceMaterial);
    chalice.position.set(8, 3.2, 8);
    chalice.castShadow = true;
    chalice.receiveShadow = true;
    scene.add(chalice);
    objects.push(chalice);

    // Bat swarm colony - small spheres circling
    var batCount = 12;
    for (var i = 0; i < batCount; i++) {
      var batGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var batMaterial = new THREE.MeshStandardMaterial({
        color: 0x221122,
        roughness: 0.6,
        metalness: 0.2
      });
      var bat = new THREE.Mesh(batGeometry, batMaterial);
      var angle = (i / batCount) * Math.PI * 2;
      bat.position.x = Math.cos(angle) * 10;
      bat.position.z = Math.sin(angle) * 10;
      bat.position.y = 15 + Math.sin(i) * 5;
      bat.castShadow = true;
      scene.add(bat);
      objects.push(bat);
      sceneObjects.batSwarm.push(bat);
    }

    // Gothic rose window - cylinder frame with stained pattern
    var roseFrameGeometry = new THREE.CylinderGeometry(3, 3, 0.3, 16);
    var roseFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x330011,
      roughness: 0.7,
      metalness: 0.4
    });
    var roseFrame = new THREE.Mesh(roseFrameGeometry, roseFrameMaterial);
    roseFrame.rotation.z = Math.PI / 2;
    roseFrame.position.set(0, 18, -20);
    roseFrame.castShadow = true;
    roseFrame.receiveShadow = true;
    scene.add(roseFrame);
    objects.push(roseFrame);
    sceneObjects.roseWindow = roseFrame;

    // Rose window stained pattern - LineSegments
    var rosePoints = [];
    var roseSegments = 8;
    for (var i = 0; i < roseSegments; i++) {
      var angle = (i / roseSegments) * Math.PI * 2;
      var x = Math.cos(angle) * 2.5;
      var y = Math.sin(angle) * 2.5;
      rosePoints.push(new THREE.Vector3(x, y, -20.1));
      rosePoints.push(new THREE.Vector3(0, 0, -20.1));
    }
    var roseGeometry = new THREE.BufferGeometry().setFromPoints(rosePoints);
    var roseMaterial = new THREE.LineBasicMaterial({ color: 0x990022, linewidth: 2 });
    var rosePattern = new THREE.LineSegments(roseGeometry, roseMaterial);
    rosePattern.position.set(0, 18, 0);
    scene.add(rosePattern);
    objects.push(rosePattern);

    // Candelabra stands - gold cylinders with flame spheres
    var candelabraCount = 4;
    var candelabraPositions = [
      [-15, 1, -10],
      [15, 1, -10],
      [-15, 1, 12],
      [15, 1, 12]
    ];

    for (var i = 0; i < candelabraCount; i++) {
      var standGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
      var standMaterial = new THREE.MeshStandardMaterial({
        color: 0x886622,
        roughness: 0.4,
        metalness: 0.7
      });
      var stand = new THREE.Mesh(standGeometry, standMaterial);
      stand.position.set(candelabraPositions[i][0], candelabraPositions[i][1], candelabraPositions[i][2]);
      stand.castShadow = true;
      stand.receiveShadow = true;
      scene.add(stand);
      objects.push(stand);

      var flameGeometry = new THREE.SphereGeometry(0.25, 4, 4);
      var flameMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF2200,
        emissive: 0xFF1100,
        emissiveIntensity: 0.7,
        roughness: 0.5,
        metalness: 0.1
      });
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(candelabraPositions[i][0], candelabraPositions[i][1] + 1.2, candelabraPositions[i][2]);
      flame.castShadow = true;
      scene.add(flame);
      objects.push(flame);
      sceneObjects.candelabra.push({
        stand: stand,
        flame: flame
      });
    }

    // Vampire lord throne - ornate dark wood with spike back
    var throneGeometry = new THREE.BoxGeometry(2, 3, 2);
    var throneMaterial = new THREE.MeshStandardMaterial({
      color: 0x330022,
      roughness: 0.7,
      metalness: 0.3
    });
    var throne = new THREE.Mesh(throneGeometry, throneMaterial);
    throne.position.set(0, 1.5, -18);
    throne.castShadow = true;
    throne.receiveShadow = true;
    scene.add(throne);
    objects.push(throne);
    sceneObjects.throne = throne;

    var spikeBackGeometry = new THREE.ConeGeometry(0.3, 2.5, 8);
    var spikeMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.5,
      metalness: 0.6
    });
    var spikeBack = new THREE.Mesh(spikeBackGeometry, spikeMaterial);
    spikeBack.position.set(0, 4, -18);
    spikeBack.castShadow = true;
    spikeBack.receiveShadow = true;
    scene.add(spikeBack);
    objects.push(spikeBack);

    // Dungeon chains - hanging cylinder links
    var chainCount = 3;
    for (var i = 0; i < chainCount; i++) {
      var chainGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6);
      var chainMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.6,
        metalness: 0.7
      });
      var chain = new THREE.Mesh(chainGeometry, chainMaterial);
      chain.position.set(-10 + i * 8, 8, 15);
      chain.castShadow = true;
      chain.receiveShadow = true;
      scene.add(chain);
      objects.push(chain);
      sceneObjects.chains.push(chain);
    }

    // Bloodborne victim stakes - wooden stakes
    var stakeCount = 4;
    var stakePositions = [
      [-8, 0.5, 0],
      [-2, 0.5, 0],
      [4, 0.5, 0],
      [10, 0.5, 0]
    ];

    for (var i = 0; i < stakeCount; i++) {
      var stakeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 6);
      var stakeMaterial = new THREE.MeshStandardMaterial({
        color: 0x5C3D1F,
        roughness: 0.8,
        metalness: 0.1
      });
      var stake = new THREE.Mesh(stakeGeometry, stakeMaterial);
      stake.position.set(stakePositions[i][0], stakePositions[i][1], stakePositions[i][2]);
      stake.castShadow = true;
      stake.receiveShadow = true;
      scene.add(stake);
      objects.push(stake);
    }

    // Underground catacombs tunnel
    var catacombGeometry = new THREE.BoxGeometry(8, 4, 30);
    var catacombMaterial = new THREE.MeshStandardMaterial({
      color: 0x221111,
      roughness: 0.9,
      metalness: 0
    });
    var catacomb = new THREE.Mesh(catacombGeometry, catacombMaterial);
    catacomb.position.set(0, 2, 20);
    catacomb.castShadow = true;
    catacomb.receiveShadow = true;
    scene.add(catacomb);
    objects.push(catacomb);

    // Silver-lined vault with emissive lining
    var vaultGeometry = new THREE.BoxGeometry(5, 5, 6);
    var vaultMaterial = new THREE.MeshStandardMaterial({
      color: 0x888899,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x444455,
      emissiveIntensity: 0.2
    });
    var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
    vault.position.set(-12, 2.5, 18);
    vault.castShadow = true;
    vault.receiveShadow = true;
    scene.add(vault);
    objects.push(vault);
    sceneObjects.vault = vault;

    // Mirror room - dark walls with mirror frame patterns
    var mirrorWallGeometry = new THREE.BoxGeometry(10, 6, 0.5);
    var mirrorWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.5,
      metalness: 0.4
    });
    var mirrorWall = new THREE.Mesh(mirrorWallGeometry, mirrorWallMaterial);
    mirrorWall.position.set(10, 3, 0);
    mirrorWall.castShadow = true;
    mirrorWall.receiveShadow = true;
    scene.add(mirrorWall);
    objects.push(mirrorWall);
    sceneObjects.mirrorRoom = mirrorWall;

    // Mirror frames - LineSegments pattern
    var mirrorFramePoints = [];
    var frameSize = 4;
    mirrorFramePoints.push(new THREE.Vector3(-frameSize, frameSize, 0.3));
    mirrorFramePoints.push(new THREE.Vector3(frameSize, frameSize, 0.3));
    mirrorFramePoints.push(new THREE.Vector3(frameSize, frameSize, 0.3));
    mirrorFramePoints.push(new THREE.Vector3(frameSize, -frameSize, 0.3));
    mirrorFramePoints.push(new THREE.Vector3(frameSize, -frameSize, 0.3));
    mirrorFramePoints.push(new THREE.Vector3(-frameSize, -frameSize, 0.3));
    mirrorFramePoints.push(new THREE.Vector3(-frameSize, -frameSize, 0.3));
    mirrorFramePoints.push(new THREE.Vector3(-frameSize, frameSize, 0.3));

    var mirrorFrameGeometry = new THREE.BufferGeometry().setFromPoints(mirrorFramePoints);
    var mirrorFrameMaterial = new THREE.LineBasicMaterial({ color: 0xAAAAAA, linewidth: 3 });
    var mirrorFrames = new THREE.LineSegments(mirrorFrameGeometry, mirrorFrameMaterial);
    mirrorFrames.position.set(10, 3, 0);
    scene.add(mirrorFrames);
    objects.push(mirrorFrames);

    // Cursed armor suits - animated dark metallic forms
    var armorCount = 3;
    var armorPositions = [
      [5, 1.5, -12],
      [-5, 1.5, -12],
      [0, 1.5, 22]
    ];

    for (var i = 0; i < armorCount; i++) {
      var armorGeometry = new THREE.BoxGeometry(1.2, 2.5, 0.8);
      var armorMaterial = new THREE.MeshStandardMaterial({
        color: 0x444433,
        roughness: 0.6,
        metalness: 0.5
      });
      var armor = new THREE.Mesh(armorGeometry, armorMaterial);
      armor.position.set(armorPositions[i][0], armorPositions[i][1], armorPositions[i][2]);
      armor.castShadow = true;
      armor.receiveShadow = true;
      scene.add(armor);
      objects.push(armor);
      sceneObjects.cursedArmor.push(armor);
    }

    // Gargoyle statues on ramparts
    var gargoyleCount = 4;
    var gargoylePositions = [
      [-18, 35, -15],
      [18, 35, -15],
      [-18, 35, 5],
      [18, 35, 5]
    ];

    for (var i = 0; i < gargoyleCount; i++) {
      var gargoyleGeometry = new THREE.BoxGeometry(1.5, 3, 1);
      var gargoyleMaterial = new THREE.MeshStandardMaterial({
        color: 0x443333,
        roughness: 0.8,
        metalness: 0.1
      });
      var gargoyle = new THREE.Mesh(gargoyleGeometry, gargoyleMaterial);
      gargoyle.position.set(gargoylePositions[i][0], gargoylePositions[i][1], gargoylePositions[i][2]);
      gargoyle.castShadow = true;
      gargoyle.receiveShadow = true;
      scene.add(gargoyle);
      objects.push(gargoyle);
    }

    // Extra detail: Stone archway
    var archGeometry = new THREE.CylinderGeometry(2, 2, 0.4, 16);
    var archMaterial = new THREE.MeshStandardMaterial({
      color: 0x2A1D2A,
      roughness: 0.85,
      metalness: 0.05
    });
    var arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.rotation.z = Math.PI / 2;
    arch.position.set(0, 6, 0);
    arch.castShadow = true;
    arch.receiveShadow = true;
    scene.add(arch);
    objects.push(arch);
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    // Bat swarm orbits and oscillates
    for (var i = 0; i < sceneObjects.batSwarm.length; i++) {
      var bat = sceneObjects.batSwarm.length > 0 ? sceneObjects.batSwarm[i] : null;
      if (bat) {
        var angle = (i / sceneObjects.batSwarm.length) * Math.PI * 2 + time * 0.5;
        bat.position.x = Math.cos(angle) * 10;
        bat.position.z = Math.sin(angle) * 10;
        bat.position.y = 15 + Math.sin(time * 1.5 + i) * 3;
      }
    }

    // Candelabra flames flicker
    for (var i = 0; i < sceneObjects.candelabra.length; i++) {
      var candle = sceneObjects.candelabra[i];
      if (candle && candle.flame) {
        var flickerIntensity = 0.6 + Math.sin(time * 8 + i) * 0.15;
        candle.flame.material.emissiveIntensity = flickerIntensity;
        candle.flame.position.y += Math.sin(time * 6 + i * 0.5) * 0.01;
      }
    }

    // Blood altar pulses
    if (sceneObjects.altar) {
      var pulseIntensity = 0.3 + Math.sin(time * 2) * 0.2;
      sceneObjects.altar.material.emissiveIntensity = pulseIntensity;
    }

    // Dungeon chains sway
    for (var i = 0; i < sceneObjects.chains.length; i++) {
      var chain = sceneObjects.chains[i];
      if (chain) {
        chain.rotation.z = Math.sin(time * 1.2 + i) * 0.2;
      }
    }

    // Cursed armor animates
    for (var i = 0; i < sceneObjects.cursedArmor.length; i++) {
      var armor = sceneObjects.cursedArmor[i];
      if (armor) {
        armor.rotation.y += (Math.sin(time * 0.8 + i) * 0.01);
      }
    }

    // Coffin lid slowly opens
    if (sceneObjects.coffin) {
      sceneObjects.coffin.rotation.x = Math.sin(time * 0.5) * 0.4;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    sceneObjects.batSwarm = [];
    sceneObjects.candelabra = [];
    sceneObjects.chains = [];
    sceneObjects.cursedArmor = [];
    sceneObjects.altar = null;
    sceneObjects.coffin = null;
    sceneObjects.throne = null;
    sceneObjects.mirrorRoom = null;
    sceneObjects.roseWindow = null;
    sceneObjects.vault = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
