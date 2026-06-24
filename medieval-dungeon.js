window.MedievalDungeon = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var animatedObjects = [];

  function init(sceneRef, camera) {
    scene = sceneRef;
    objects = [];
    animatedObjects = [];

    // Stone dungeon corridor network
    var corridorGeometry = new THREE.BoxGeometry(8, 4, 20);
    var stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var corridor = new THREE.Mesh(corridorGeometry, stoneMaterial);
    corridor.position.z = 0;
    scene.add(corridor);
    objects.push(corridor);

    // Torture chamber with iron maiden
    var chamberGeometry = new THREE.BoxGeometry(6, 5, 8);
    var ironMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var chamber = new THREE.Mesh(chamberGeometry, ironMaterial);
    chamber.position.set(-15, 0, 0);
    scene.add(chamber);
    objects.push(chamber);

    // Prison cells with iron bar doors
    var cellWidth = 4;
    var cellDepth = 5;
    var barMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    for (var i = 0; i < 3; i++) {
      var cellGeometry = new THREE.BoxGeometry(cellWidth, 3.5, cellDepth);
      var cell = new THREE.Mesh(cellGeometry, barMaterial);
      cell.position.set(-8 + i * 6, 0, -12);
      scene.add(cell);
      objects.push(cell);

      // Bar doors
      var barGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 8);
      for (var j = 0; j < 5; j++) {
        var bar = new THREE.Mesh(barGeometry, barMaterial);
        bar.position.set(-8 + i * 6 - 1.5 + j * 0.7, 0, -12 - cellDepth / 2);
        scene.add(bar);
        objects.push(bar);
      }
    }

    // Skeleton warriors at guard posts
    var skeletonPositions = [[15, 0, 5], [12, 0, -8], [-12, 0, 10]];
    var skullMaterial = new THREE.MeshStandardMaterial({ color: 0xE8DCC8 });
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    for (var k = 0; k < skeletonPositions.length; k++) {
      var pos = skeletonPositions[k];

      // Skull
      var skullGeometry = new THREE.SphereGeometry(0.6, 16, 16);
      var skull = new THREE.Mesh(skullGeometry, skullMaterial);
      skull.position.set(pos[0], pos[1] + 2.2, pos[2]);
      scene.add(skull);
      objects.push(skull);

      // Body
      var bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.8);
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos[0], pos[1] + 0.75, pos[2]);
      scene.add(body);
      objects.push(body);
    }

    // Lava pit trap rooms
    var lavaGeometry = new THREE.BoxGeometry(5, 0.5, 6);
    var lavaMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF4400,
      emissiveIntensity: 0.4
    });
    var lavaPit = new THREE.Mesh(lavaGeometry, lavaMaterial);
    lavaPit.position.set(18, -2.5, -15);
    scene.add(lavaPit);
    objects.push(lavaPit);
    animatedObjects.push({ obj: lavaPit, type: 'lava' });

    // Chain wall attachments
    var chainRingGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    var chainMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    for (var c = 0; c < 6; c++) {
      var chain = new THREE.Mesh(chainRingGeometry, chainMaterial);
      chain.position.set(-20 + c * 3, 1.5, 5);
      chain.rotation.x = Math.PI / 2;
      scene.add(chain);
      objects.push(chain);
      animatedObjects.push({ obj: chain, type: 'chain' });
    }

    // Wall-mounted torches
    var torchPositions = [[-18, 2.5, 8], [-10, 2.5, 12], [8, 2.5, -10], [16, 2.5, 0]];
    var torchHolderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
    var torchHolderMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var flameMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      emissive: 0xFF6600,
      emissiveIntensity: 0.6
    });
    for (var t = 0; t < torchPositions.length; t++) {
      var tpos = torchPositions[t];

      // Holder
      var holder = new THREE.Mesh(torchHolderGeometry, torchHolderMaterial);
      holder.position.set(tpos[0], tpos[1], tpos[2]);
      scene.add(holder);
      objects.push(holder);

      // Flame
      var flameGeometry = new THREE.SphereGeometry(0.4, 12, 12);
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(tpos[0], tpos[1] + 0.8, tpos[2]);
      scene.add(flame);
      objects.push(flame);
      animatedObjects.push({ obj: flame, type: 'torch' });
    }

    // Treasure vault with gold piles
    var goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0x999900,
      emissiveIntensity: 0.2
    });
    var goldCount = 0;
    for (var gx = -2; gx <= 2; gx++) {
      for (var gy = 0; gy <= 2; gy++) {
        for (var gz = -2; gz <= 2; gz++) {
          var goldGeometry = new THREE.SphereGeometry(0.35, 12, 12);
          var goldSphere = new THREE.Mesh(goldGeometry, goldMaterial);
          goldSphere.position.set(-22 + gx * 0.8, -2.5 + gy * 0.8, 18 + gz * 0.8);
          scene.add(goldSphere);
          objects.push(goldSphere);
          goldCount++;
        }
      }
    }

    // Giant wooden portcullis gate
    var portcullisFrameGeometry = new THREE.BoxGeometry(5, 5, 0.5);
    var woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    var portcullisFrame = new THREE.Mesh(portcullisFrameGeometry, woodMaterial);
    portcullisFrame.position.set(22, 0, 5);
    scene.add(portcullisFrame);
    objects.push(portcullisFrame);

    // Portcullis bars
    var barCount = 0;
    for (var pb = 0; pb < 8; pb++) {
      var portbarGeometry = new THREE.BoxGeometry(0.4, 5, 0.3);
      var portbar = new THREE.Mesh(portbarGeometry, woodMaterial);
      portbar.position.set(22 - 1.8 + pb * 0.5, 0, 5);
      scene.add(portbar);
      objects.push(portbar);
      animatedObjects.push({ obj: portbar, type: 'portcullis', baseY: portbar.position.y });
      barCount++;
    }

    // Rat swarm zone
    var ratMaterial = new THREE.MeshStandardMaterial({ color: 0x553322 });
    for (var r = 0; r < 12; r++) {
      var ratGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      var rat = new THREE.Mesh(ratGeometry, ratMaterial);
      rat.position.set(-5 + Math.random() * 8, -2 + Math.random() * 1, -25 + Math.random() * 6);
      scene.add(rat);
      objects.push(rat);
    }

    // Dungeon boss throne room
    var throneBaseGeometry = new THREE.BoxGeometry(4, 1, 3);
    var throneMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
    var throneBase = new THREE.Mesh(throneBaseGeometry, throneMaterial);
    throneBase.position.set(25, -1.5, -12);
    scene.add(throneBase);
    objects.push(throneBase);

    // Throne back
    var throneBackGeometry = new THREE.BoxGeometry(3, 3, 0.5);
    var throneBack = new THREE.Mesh(throneBackGeometry, throneMaterial);
    throneBack.position.set(25, 1, -11);
    scene.add(throneBack);
    objects.push(throneBack);

    // Throne spikes
    for (var ts = 0; ts < 5; ts++) {
      var spikeGeometry = new THREE.ConeGeometry(0.3, 1, 8);
      var spike = new THREE.Mesh(spikeGeometry, throneMaterial);
      spike.position.set(25 - 1.5 + ts * 0.75, 2, -11);
      scene.add(spike);
      objects.push(spike);
    }

    // Underground river
    var riverGeometry = new THREE.BoxGeometry(3, 0.5, 15);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x001122,
      emissive: 0x001122,
      emissiveIntensity: 0.3
    });
    var river = new THREE.Mesh(riverGeometry, waterMaterial);
    river.position.set(-25, -2.8, 0);
    scene.add(river);
    objects.push(river);
    animatedObjects.push({ obj: river, type: 'water' });

    // Pit trap with spikes
    var pitGeometry = new THREE.BoxGeometry(4, 0.5, 4);
    var pitMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var pit = new THREE.Mesh(pitGeometry, pitMaterial);
    pit.position.set(10, -3.5, -18);
    scene.add(pit);
    objects.push(pit);

    // Pit spikes
    var spikeMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    for (var ps = 0; ps < 6; ps++) {
      var pitSpikeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
      var pitSpike = new THREE.Mesh(pitSpikeGeometry, spikeMaterial);
      pitSpike.position.set(10 - 1.2 + ps * 0.5, -3, -18);
      scene.add(pitSpike);
      objects.push(pitSpike);
    }

    // Stone pillars holding up ceiling
    var pillarGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
    var pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var pillarPositions = [[-15, 0, 5], [0, 0, 15], [15, 0, -8], [-8, 0, -15], [20, 0, 10]];
    for (var pl = 0; pl < pillarPositions.length; pl++) {
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pillarPositions[pl][0], pillarPositions[pl][1], pillarPositions[pl][2]);
      scene.add(pillar);
      objects.push(pillar);
    }
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    for (var i = 0; i < animatedObjects.length; i++) {
      var animated = animatedObjects[i];

      if (animated.type === 'torch') {
        var flicker = 0.5 + 0.5 * Math.sin(time * 8 + i);
        animated.obj.material.emissiveIntensity = 0.4 + flicker * 0.3;
      } else if (animated.type === 'lava') {
        var lavaBubble = 1 + 0.05 * Math.sin(time * 3 + i);
        animated.obj.scale.y = lavaBubble;
      } else if (animated.type === 'portcullis') {
        var portHeight = animated.baseY + Math.sin(time * 1.5 + i) * 1.5;
        animated.obj.position.y = portHeight;
      } else if (animated.type === 'chain') {
        animated.obj.rotation.z = 0.3 * Math.sin(time * 2 + i);
      } else if (animated.type === 'water') {
        var waterShimmer = 0.5 + 0.3 * Math.sin(time * 4 + i * 0.5);
        animated.obj.position.y = -2.8 + waterShimmer * 0.1;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
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
