window.GreekRuins = (function() {
  'use strict';

  var objects = [];
  var animatedObjects = [];

  function init(scene, camera) {
    objects = [];
    animatedObjects = [];

    // Acropolis foundation - wide marble platform
    var foundationGeometry = new THREE.BoxGeometry(100, 3, 80);
    var foundationMaterial = new THREE.MeshStandardMaterial({ color: 0xE8D5B0 });
    var foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundation.position.y = 1.5;
    scene.add(foundation);
    objects.push(foundation);

    // Parthenon columns - 8 columns arranged in rectangle
    var columnPositions = [
      { x: -25, z: -15 },
      { x: -25, z: 15 },
      { x: 25, z: -15 },
      { x: 25, z: 15 },
      { x: -10, z: -15 },
      { x: -10, z: 15 },
      { x: 10, z: -15 },
      { x: 10, z: 15 }
    ];

    for (var i = 0; i < columnPositions.length; i++) {
      var pos = columnPositions[i];
      var columnGeometry = new THREE.CylinderGeometry(2, 2.2, 35, 12);
      var columnMaterial = new THREE.MeshStandardMaterial({ color: 0xE8D5B0 });
      var column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(pos.x, 18.5, pos.z);
      scene.add(column);
      objects.push(column);

      // Some broken columns - add rotated drum segment near base
      if (i % 3 === 0) {
        var drumGeometry = new THREE.CylinderGeometry(2, 2.2, 4, 12);
        var drumMaterial = new THREE.MeshStandardMaterial({ color: 0xCCC5A0 });
        var drum = new THREE.Mesh(drumGeometry, drumMaterial);
        drum.position.set(pos.x + 5, 2.5, pos.z);
        drum.rotation.z = Math.PI / 6;
        scene.add(drum);
        objects.push(drum);
        animatedObjects.push({
          object: drum,
          type: 'drum',
          initialRotation: drum.rotation.z
        });
      }
    }

    // Triangular pediment (using BoxGeometry approximation)
    var pedimentGeometry = new THREE.BoxGeometry(45, 1, 20);
    var pedimentMaterial = new THREE.MeshStandardMaterial({ color: 0xDDD0A0 });
    var pediment = new THREE.Mesh(pedimentGeometry, pedimentMaterial);
    pediment.position.set(0, 36, 0);
    pediment.rotation.x = Math.PI / 12;
    scene.add(pediment);
    objects.push(pediment);

    // Broken marble sculptures scattered
    var sculptureLocations = [
      { x: -40, z: -30 },
      { x: 40, z: -30 },
      { x: 0, z: 35 }
    ];

    for (var j = 0; j < sculptureLocations.length; j++) {
      var sLoc = sculptureLocations[j];

      // Sculpture head (sphere)
      var headGeometry = new THREE.SphereGeometry(3, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xCCBB99 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(sLoc.x, 5, sLoc.z);
      scene.add(head);
      objects.push(head);

      // Sculpture body fragment (box)
      var bodyGeometry = new THREE.BoxGeometry(4, 8, 3);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xCCBB99 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(sLoc.x + 8, 4, sLoc.z + 3);
      body.rotation.z = Math.PI / 8;
      scene.add(body);
      objects.push(body);
    }

    // Oracle fire pit
    var pitGeometry = new THREE.CylinderGeometry(6, 6.5, 2, 16);
    var pitMaterial = new THREE.MeshStandardMaterial({ color: 0x884422 });
    var pit = new THREE.Mesh(pitGeometry, pitMaterial);
    pit.position.set(-45, 1.5, 0);
    scene.add(pit);
    objects.push(pit);

    // Oracle flame (sphere with emissive)
    var flameGeometry = new THREE.SphereGeometry(3, 12, 12);
    var flameMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      emissive: 0xFF6600,
      emissiveIntensity: 0.8
    });
    var flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(-45, 7, 0);
    scene.add(flame);
    objects.push(flame);
    animatedObjects.push({
      object: flame,
      type: 'flame',
      initialIntensity: 0.8
    });

    // Oracle smoke (rising sphere)
    var smokeGeometry = new THREE.SphereGeometry(2.5, 8, 8);
    var smokeMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
    smoke.position.set(-45, 10, 0);
    scene.add(smoke);
    objects.push(smoke);
    animatedObjects.push({
      object: smoke,
      type: 'smoke',
      initialY: 10
    });

    // Amphitheater seating - curved stepped tiers
    var seatColors = [0xCCBBAA, 0xBBAA99, 0xAA9988];
    for (var tier = 0; tier < 5; tier++) {
      var tierY = 2 + tier * 2.5;
      var tierWidth = 50 - tier * 8;
      var tierDepth = 8;
      var seatGeometry = new THREE.BoxGeometry(tierWidth, 1.5, tierDepth);
      var seatMaterial = new THREE.MeshStandardMaterial({
        color: seatColors[tier % seatColors.length]
      });
      var seat = new THREE.Mesh(seatGeometry, seatMaterial);
      seat.position.set(45, tierY, 5 + tier * 3);
      seat.rotation.x = -Math.PI / 12;
      scene.add(seat);
      objects.push(seat);
    }

    // Underground catacomb entrance
    var cataGeometry = new THREE.BoxGeometry(12, 15, 8);
    var cataMaterial = new THREE.MeshStandardMaterial({ color: 0x443322 });
    var cata = new THREE.Mesh(cataGeometry, cataMaterial);
    cata.position.set(-50, 8, -35);
    scene.add(cata);
    objects.push(cata);

    // Olive trees - scattered around ruins
    var treeLocations = [
      { x: -30, z: -40 },
      { x: 35, z: -40 },
      { x: -35, z: 40 },
      { x: 30, z: 40 }
    ];

    for (var t = 0; t < treeLocations.length; t++) {
      var tLoc = treeLocations[t];

      // Tree trunk
      var trunkGeometry = new THREE.CylinderGeometry(1.2, 1.5, 14, 8);
      var trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5C3D1F });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(tLoc.x, 7, tLoc.z);
      scene.add(trunk);
      objects.push(trunk);

      // Tree crown
      var crownGeometry = new THREE.SphereGeometry(8, 16, 16);
      var crownMaterial = new THREE.MeshStandardMaterial({ color: 0x4A6B2A });
      var crown = new THREE.Mesh(crownGeometry, crownMaterial);
      crown.position.set(tLoc.x, 16, tLoc.z);
      scene.add(crown);
      objects.push(crown);
      animatedObjects.push({
        object: crown,
        type: 'tree',
        initialRotationZ: 0
      });
    }

    // Ancient pottery shards - scattered fragments
    var shardCount = 8;
    for (var s = 0; s < shardCount; s++) {
      var shardX = -60 + Math.random() * 120;
      var shardZ = -50 + Math.random() * 100;
      var shardGeometry = new THREE.SphereGeometry(1.5 + Math.random(), 6, 6);
      var shardMaterial = new THREE.MeshStandardMaterial({ color: 0x884422 });
      var shard = new THREE.Mesh(shardGeometry, shardMaterial);
      shard.position.set(shardX, 0.5, shardZ);
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(shard);
      objects.push(shard);
    }

    // Greek warrior statue
    var warriorX = 55;
    var warriorZ = -20;

    // Warrior body
    var warriorBodyGeometry = new THREE.BoxGeometry(3, 12, 2.5);
    var warriorMaterial = new THREE.MeshStandardMaterial({ color: 0xCCBB99 });
    var warriorBody = new THREE.Mesh(warriorBodyGeometry, warriorMaterial);
    warriorBody.position.set(warriorX, 6.5, warriorZ);
    scene.add(warriorBody);
    objects.push(warriorBody);

    // Warrior head
    var warriorHeadGeometry = new THREE.SphereGeometry(2, 12, 12);
    var warriorHead = new THREE.Mesh(warriorHeadGeometry, warriorMaterial);
    warriorHead.position.set(warriorX, 14, warriorZ);
    scene.add(warriorHead);
    objects.push(warriorHead);

    // Warrior spear
    var spearGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20, 8);
    var spearMaterial = new THREE.MeshStandardMaterial({ color: 0x996633 });
    var spear = new THREE.Mesh(spearGeometry, spearMaterial);
    spear.position.set(warriorX + 3, 10, warriorZ - 2);
    spear.rotation.z = Math.PI / 6;
    scene.add(spear);
    objects.push(spear);

    // Mosaic floor tile pattern
    var mosaicPositions = [
      { x: -15, z: -25 },
      { x: -15, z: -10 },
      { x: 0, z: -25 },
      { x: 0, z: -10 },
      { x: 15, z: -25 },
      { x: 15, z: -10 }
    ];

    for (var m = 0; m < mosaicPositions.length; m++) {
      var mPos = mosaicPositions[m];
      var tileGeometry = new THREE.BoxGeometry(8, 0.2, 8);
      var tileMaterial = new THREE.MeshStandardMaterial({ color: 0x997755 });
      var tile = new THREE.Mesh(tileGeometry, tileMaterial);
      tile.position.set(mPos.x, 3.1, mPos.z);
      scene.add(tile);
      objects.push(tile);

      // Colored decorative sections
      var decorGeometry = new THREE.BoxGeometry(2, 0.3, 2);
      var decorColors = [0xFF6B35, 0x004E89, 0xF7B801];
      for (var d = 0; d < 2; d++) {
        var decorMaterial = new THREE.MeshStandardMaterial({
          color: decorColors[d]
        });
        var decor = new THREE.Mesh(decorGeometry, decorMaterial);
        decor.position.set(mPos.x - 2 + d * 4, 3.3, mPos.z);
        scene.add(decor);
        objects.push(decor);
      }
    }

    // Stone archway gate
    var archX = 0;
    var archZ = -45;

    // Archway left pillar
    var archLeftGeometry = new THREE.BoxGeometry(3, 18, 3);
    var archMaterial = new THREE.MeshStandardMaterial({ color: 0xDDCC99 });
    var archLeft = new THREE.Mesh(archLeftGeometry, archMaterial);
    archLeft.position.set(archX - 10, 9, archZ);
    scene.add(archLeft);
    objects.push(archLeft);

    // Archway right pillar
    var archRight = new THREE.Mesh(archLeftGeometry, archMaterial);
    archRight.position.set(archX + 10, 9, archZ);
    scene.add(archRight);
    objects.push(archRight);

    // Archway top beam
    var archTopGeometry = new THREE.BoxGeometry(23, 2, 3);
    var archTop = new THREE.Mesh(archTopGeometry, archMaterial);
    archTop.position.set(archX, 18, archZ);
    scene.add(archTop);
    objects.push(archTop);

    // Treasure vault with gold artifacts
    var vaultX = 60;
    var vaultZ = 30;

    // Vault sealed room
    var vaultGeometry = new THREE.BoxGeometry(15, 12, 15);
    var vaultMaterial = new THREE.MeshStandardMaterial({ color: 0xCCBB88 });
    var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
    vault.position.set(vaultX, 6.5, vaultZ);
    scene.add(vault);
    objects.push(vault);

    // Gold artifacts inside vault
    for (var g = 0; g < 4; g++) {
      var goldGeometry = new THREE.BoxGeometry(2, 2, 2);
      var goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 0.4
      });
      var gold = new THREE.Mesh(goldGeometry, goldMaterial);
      gold.position.set(vaultX - 4 + g * 3, 4, vaultZ - 3 + Math.random() * 6);
      scene.add(gold);
      objects.push(gold);
    }

    // Additional decorative column drum segments scattered
    var drumScatterCount = 5;
    for (var ds = 0; ds < drumScatterCount; ds++) {
      var dsx = -50 + Math.random() * 100;
      var dsz = -40 + Math.random() * 80;
      var drScatGeometry = new THREE.CylinderGeometry(1.8, 2, 3.5, 10);
      var drScatMaterial = new THREE.MeshStandardMaterial({ color: 0xCCC5A0 });
      var drScat = new THREE.Mesh(drScatGeometry, drScatMaterial);
      drScat.position.set(dsx, 1.75, dsz);
      drScat.rotation.x = Math.random() * Math.PI / 4;
      scene.add(drScat);
      objects.push(drScat);
    }
  }

  function update(delta) {
    var time = delta || 0;

    for (var i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];

      if (anim.type === 'flame') {
        // Oracle flame flickers
        anim.object.material.emissiveIntensity = anim.initialIntensity * (0.6 + 0.4 * Math.sin(time * 8));
      }

      if (anim.type === 'drum') {
        // Fallen column drums settle with oscillation
        var driftAmount = 0.15 * Math.sin(time * 2);
        anim.object.rotation.z = anim.initialRotation + driftAmount;
      }

      if (anim.type === 'smoke') {
        // Oracle smoke rises with oscillation
        var smokeWave = 1.5 * Math.sin(time * 2.5);
        anim.object.position.y = anim.initialY + smokeWave;
      }

      if (anim.type === 'tree') {
        // Olive tree crowns sway
        var swayAmount = 0.3 * Math.sin(time * 1.5);
        anim.object.rotation.z = anim.initialRotationZ + swayAmount;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
    }
    objects = [];
    animatedObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
