var window = window || {};

window.LavaFortress = (function() {
  'use strict';

  var objects = [];
  var geyserCols = [];
  var lavaChannels = [];
  var torches = [];
  var magmaPools = [];
  var animationTime = 0;

  function addObject(obj, scene) {
    objects.push(obj);
    scene.add(obj);
  }

  function createWall(scene, x, y, z, width, height, depth) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.7,
      roughness: 0.3
    });
    var wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, y, z);
    addObject(wall, scene);
    return wall;
  }

  function createLavaChannel(scene, x, y, z, width, height, depth) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff6600,
      metalness: 0.4,
      roughness: 0.6
    });
    var channel = new THREE.Mesh(geometry, material);
    channel.position.set(x, y, z);
    addObject(channel, scene);
    lavaChannels.push({
      mesh: channel,
      material: material,
      baseColor: 0xff4500,
      baseEmissive: 0xff6600
    });
    return channel;
  }

  function createTower(scene, x, y, z, radius, height) {
    var cylinderGeom = new THREE.CylinderGeometry(radius, radius, height, 16);
    var material = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.4
    });
    var cylinder = new THREE.Mesh(cylinderGeom, material);
    cylinder.position.set(x, y, z);
    addObject(cylinder, scene);

    var coneGeom = new THREE.ConeGeometry(radius * 0.6, height * 0.4, 16);
    var coneMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.8,
      roughness: 0.2
    });
    var cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.set(x, y + height * 0.5 + height * 0.2, z);
    addObject(cone, scene);
  }

  function createGeyser(scene, x, y, z, radius, maxHeight) {
    var geom = new THREE.CylinderGeometry(radius, radius, maxHeight, 12);
    var material = new THREE.MeshStandardMaterial({
      color: 0xff8c00,
      emissive: 0xffaa00,
      metalness: 0.3,
      roughness: 0.7
    });
    var geyser = new THREE.Mesh(geom, material);
    geyser.position.set(x, y, z);
    addObject(geyser, scene);

    geyserCols.push({
      mesh: geyser,
      baseY: y,
      maxHeight: maxHeight,
      radius: radius,
      phase: Math.random() * Math.PI * 2
    });

    return geyser;
  }

  function createBridge(scene, x, y, z, length, width, thickness) {
    var geom = new THREE.BoxGeometry(length, thickness, width);
    var material = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.5,
      roughness: 0.5
    });
    var bridge = new THREE.Mesh(geom, material);
    bridge.position.set(x, y, z);
    addObject(bridge, scene);
    return bridge;
  }

  function createRockChunk(scene, x, y, z, scaleX, scaleY, scaleZ) {
    var geom = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);
    var material = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.4,
      roughness: 0.6
    });
    var rock = new THREE.Mesh(geom, material);
    rock.position.set(x, y, z);
    addObject(rock, scene);
    return rock;
  }

  function createForgeRoom(scene, x, y, z, width, height, depth) {
    var geom = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.4
    });
    var forge = new THREE.Mesh(geom, material);
    forge.position.set(x, y, z);
    addObject(forge, scene);

    var chimneyGeom = new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
    var chimneyMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.7,
      roughness: 0.3
    });
    var chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
    chimney.position.set(x, y + height * 0.5 + 2, z);
    addObject(chimney, scene);

    torches.push({
      position: new THREE.Vector3(x, y + height * 0.5 + 3, z),
      phase: Math.random() * Math.PI * 2
    });
  }

  function createIronGate(scene, x, y, z, gateWidth, gateHeight) {
    var frameGeom = new THREE.BoxGeometry(0.5, gateHeight, 0.5);
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.9,
      roughness: 0.1
    });

    var leftFrame = new THREE.Mesh(frameGeom, frameMat);
    leftFrame.position.set(x - gateWidth * 0.5, y, z);
    addObject(leftFrame, scene);

    var rightFrame = new THREE.Mesh(frameGeom, frameMat);
    rightFrame.position.set(x + gateWidth * 0.5, y, z);
    addObject(rightFrame, scene);

    var barSpacing = gateWidth / 10;
    for (var i = 0; i < 12; i++) {
      var barX = x - gateWidth * 0.5 + i * barSpacing;
      var barPoints = [
        new THREE.Vector3(barX, y - gateHeight * 0.5, z),
        new THREE.Vector3(barX, y + gateHeight * 0.5, z)
      ];
      var barGeom = new THREE.BufferGeometry().setFromPoints(barPoints);
      var barMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
      var bar = new THREE.LineSegments(barGeom, barMat);
      addObject(bar, scene);
    }

    for (var j = 0; j < 8; j++) {
      var barY = y - gateHeight * 0.5 + j * (gateHeight / 8);
      var hbarPoints = [
        new THREE.Vector3(x - gateWidth * 0.5, barY, z),
        new THREE.Vector3(x + gateWidth * 0.5, barY, z)
      ];
      var hbarGeom = new THREE.BufferGeometry().setFromPoints(hbarPoints);
      var hbarMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
      var hbar = new THREE.LineSegments(hbarGeom, hbarMat);
      addObject(hbar, scene);
    }
  }

  function createLavaFall(scene, x, y, z, width, height) {
    var fallGeom = new THREE.BoxGeometry(width, height, 0.3);
    var fallMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff8800,
      metalness: 0.2,
      roughness: 0.8
    });
    var fall = new THREE.Mesh(fallGeom, fallMat);
    fall.position.set(x, y, z);
    addObject(fall, scene);
    return fall;
  }

  function createBattlement(scene, x, y, z) {
    var crenGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var crenMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.5,
      roughness: 0.5
    });
    var cren = new THREE.Mesh(crenGeom, crenMat);
    cren.position.set(x, y, z);
    addObject(cren, scene);
  }

  function createMagmaPool(scene, x, y, z, poolRadius) {
    var bubbleCount = 8 + Math.floor(Math.random() * 6);
    for (var i = 0; i < bubbleCount; i++) {
      var angle = (i / bubbleCount) * Math.PI * 2;
      var distance = poolRadius * 0.4;
      var bx = x + Math.cos(angle) * distance;
      var bz = z + Math.sin(angle) * distance;
      var bubbleRadius = 0.3 + Math.random() * 0.4;
      var bubbleGeom = new THREE.SphereGeometry(bubbleRadius, 8, 8);
      var bubbleMat = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        emissive: 0xff6600,
        metalness: 0.5,
        roughness: 0.5,
        transparent: true,
        opacity: 0.8
      });
      var bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
      bubble.position.set(bx, y + 0.3, bz);
      addObject(bubble, scene);
      magmaPools.push({
        mesh: bubble,
        baseY: y + 0.3,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function createGuardPost(scene, x, y, z) {
    var roofGeom = new THREE.BoxGeometry(4, 2, 4);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.4
    });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(x, y + 3, z);
    addObject(roof, scene);

    var supportGeom = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
    var supportMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.7,
      roughness: 0.3
    });

    var support1 = new THREE.Mesh(supportGeom, supportMat);
    support1.position.set(x - 1.5, y + 1.5, z - 1.5);
    addObject(support1, scene);

    var support2 = new THREE.Mesh(supportGeom, supportMat);
    support2.position.set(x + 1.5, y + 1.5, z - 1.5);
    addObject(support2, scene);

    var support3 = new THREE.Mesh(supportGeom, supportMat);
    support3.position.set(x - 1.5, y + 1.5, z + 1.5);
    addObject(support3, scene);

    var support4 = new THREE.Mesh(supportGeom, supportMat);
    support4.position.set(x + 1.5, y + 1.5, z + 1.5);
    addObject(support4, scene);

    var torchGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
    var torchMat = new THREE.MeshStandardMaterial({
      color: 0xff8c00,
      emissive: 0xffaa00,
      metalness: 0.4,
      roughness: 0.6
    });
    var torch = new THREE.Mesh(torchGeom, torchMat);
    torch.position.set(x, y + 3.5, z);
    addObject(torch, scene);

    torches.push({
      position: new THREE.Vector3(x, y + 3.8, z),
      phase: Math.random() * Math.PI * 2
    });
  }

  function init(scene, camera) {
    animationTime = 0;
    objects = [];
    geyserCols = [];
    lavaChannels = [];
    torches = [];
    magmaPools = [];

    var fortressSize = 80;
    var halfSize = fortressSize * 0.5;

    var groundGeom = new THREE.BoxGeometry(fortressSize, 1, fortressSize);
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.4,
      roughness: 0.6
    });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.set(0, -0.5, 0);
    addObject(ground, scene);

    createWall(scene, -halfSize + 2, 8, 0, 4, 16, fortressSize);
    createWall(scene, halfSize - 2, 8, 0, 4, 16, fortressSize);
    createWall(scene, 0, 8, -halfSize + 2, fortressSize, 16, 4);
    createWall(scene, 0, 8, halfSize - 2, fortressSize, 16, 4);

    createLavaChannel(scene, -15, 0.5, 0, 6, 1, 40);
    createLavaChannel(scene, 15, 0.5, 0, 6, 1, 40);
    createLavaChannel(scene, 0, 0.5, -15, 40, 1, 6);
    createLavaChannel(scene, 0, 0.5, 15, 40, 1, 6);

    createLavaChannel(scene, -10, 0.5, -10, 4, 1, 4);
    createLavaChannel(scene, 10, 0.5, -10, 4, 1, 4);
    createLavaChannel(scene, -10, 0.5, 10, 4, 1, 4);
    createLavaChannel(scene, 10, 0.5, 10, 4, 1, 4);

    createBridge(scene, -15, 1.5, 0, 6, 2, 0.5);
    createBridge(scene, 15, 1.5, 0, 6, 2, 0.5);
    createBridge(scene, 0, 1.5, -15, 2, 40, 0.5);
    createBridge(scene, 0, 1.5, 15, 2, 40, 0.5);

    createTower(scene, -halfSize + 5, 8, -halfSize + 5, 2.5, 16);
    createTower(scene, halfSize - 5, 8, -halfSize + 5, 2.5, 16);
    createTower(scene, -halfSize + 5, 8, halfSize - 5, 2.5, 16);
    createTower(scene, halfSize - 5, 8, halfSize - 5, 2.5, 16);

    createTower(scene, -20, 6, 0, 1.5, 12);
    createTower(scene, 20, 6, 0, 1.5, 12);
    createTower(scene, 0, 6, -20, 1.5, 12);
    createTower(scene, 0, 6, 20, 1.5, 12);

    createGeyser(scene, -12, 0.5, -12, 0.8, 3);
    createGeyser(scene, 12, 0.5, -12, 0.8, 3);
    createGeyser(scene, -12, 0.5, 12, 0.8, 3);
    createGeyser(scene, 12, 0.5, 12, 0.8, 3);
    createGeyser(scene, 0, 0.5, 0, 1, 4);
    createGeyser(scene, -25, 0.5, 0, 0.7, 2.5);
    createGeyser(scene, 25, 0.5, 0, 0.7, 2.5);

    createRockChunk(scene, -18, 1, -18, 3, 2, 3);
    createRockChunk(scene, 18, 1, -18, 3, 2, 3);
    createRockChunk(scene, -18, 1, 18, 3, 2, 3);
    createRockChunk(scene, 18, 1, 18, 3, 2, 3);

    createRockChunk(scene, -30, 1.5, 0, 2.5, 2.5, 2.5);
    createRockChunk(scene, 30, 1.5, 0, 2.5, 2.5, 2.5);
    createRockChunk(scene, 0, 1.5, -30, 2.5, 2.5, 2.5);
    createRockChunk(scene, 0, 1.5, 30, 2.5, 2.5, 2.5);

    createRockChunk(scene, -8, 0.8, -25, 2, 1.5, 2);
    createRockChunk(scene, 8, 0.8, -25, 2, 1.5, 2);
    createRockChunk(scene, -8, 0.8, 25, 2, 1.5, 2);
    createRockChunk(scene, 8, 0.8, 25, 2, 1.5, 2);

    for (var i = 0; i < 15; i++) {
      var rx = -35 + Math.random() * 70;
      var rz = -35 + Math.random() * 70;
      var rh = 0.5 + Math.random() * 1.5;
      createRockChunk(scene, rx, rh, rz, 1 + Math.random() * 1.5, rh, 1 + Math.random() * 1.5);
    }

    createForgeRoom(scene, -20, 0, 20, 6, 5, 6);
    createForgeRoom(scene, 20, 0, 20, 6, 5, 6);
    createForgeRoom(scene, -20, 0, -20, 6, 5, 6);
    createForgeRoom(scene, 20, 0, -20, 6, 5, 6);

    createIronGate(scene, -halfSize + 3, 5, 0, 4, 10);
    createIronGate(scene, halfSize - 3, 5, 0, 4, 10);
    createIronGate(scene, 0, 5, -halfSize + 3, 4, 10);
    createIronGate(scene, 0, 5, halfSize - 3, 4, 10);

    createLavaFall(scene, -35, 3, 0, 2, 4);
    createLavaFall(scene, 35, 3, 0, 2, 4);
    createLavaFall(scene, 0, 3, -35, 2, 4);
    createLavaFall(scene, 0, 3, 35, 2, 4);

    createLavaFall(scene, -25, 2.5, -25, 1.5, 3);
    createLavaFall(scene, 25, 2.5, -25, 1.5, 3);
    createLavaFall(scene, -25, 2.5, 25, 1.5, 3);
    createLavaFall(scene, 25, 2.5, 25, 1.5, 3);

    for (var j = 0; j < 8; j++) {
      var bx = -halfSize + 5 + j * (fortressSize - 10) / 7;
      createBattlement(scene, bx, 16, -halfSize + 3);
      createBattlement(scene, bx, 16, halfSize - 3);
    }

    for (var k = 0; k < 8; k++) {
      var bz = -halfSize + 5 + k * (fortressSize - 10) / 7;
      createBattlement(scene, -halfSize + 3, 16, bz);
      createBattlement(scene, halfSize - 3, 16, bz);
    }

    createMagmaPool(scene, -10, 0.2, -15, 3);
    createMagmaPool(scene, 10, 0.2, -15, 3);
    createMagmaPool(scene, -10, 0.2, 15, 3);
    createMagmaPool(scene, 10, 0.2, 15, 3);
    createMagmaPool(scene, 0, 0.2, -10, 2.5);
    createMagmaPool(scene, 0, 0.2, 10, 2.5);

    createGuardPost(scene, -30, 0, -30);
    createGuardPost(scene, 30, 0, -30);
    createGuardPost(scene, -30, 0, 30);
    createGuardPost(scene, 30, 0, 30);

    var additionalRocks = 20;
    for (var m = 0; m < additionalRocks; m++) {
      var arx = -28 + Math.random() * 56;
      var arz = -28 + Math.random() * 56;
      var arh = 0.4 + Math.random() * 1.2;
      createRockChunk(scene, arx, arh, arz, 0.8 + Math.random() * 1.2, arh, 0.8 + Math.random() * 1.2);
    }

    for (var n = 0; n < 12; n++) {
      var cx = -30 + Math.random() * 60;
      var cz = -30 + Math.random() * 60;
      createMagmaPool(scene, cx, 0.1, cz, 1.5);
    }

    if (camera) {
      camera.position.set(0, 15, 25);
      camera.lookAt(0, 5, 0);
    }
  }

  function update(delta) {
    animationTime += delta;

    for (var i = 0; i < lavaChannels.length; i++) {
      var channel = lavaChannels[i];
      var pulseFactor = 0.5 + 0.5 * Math.sin(animationTime * 2);
      var pulseColor = Math.round(0xff4500 + (0xff6600 - 0xff4500) * pulseFactor);
      var pulseEmissive = Math.round(0xff6600 + (0xffaa00 - 0xff6600) * pulseFactor);
      channel.material.color.setHex(pulseColor);
      channel.material.emissive.setHex(pulseEmissive);
    }

    for (var j = 0; j < geyserCols.length; j++) {
      var geyser = geyserCols[j];
      var oscillation = 0.5 + 0.5 * Math.sin(animationTime * 1.5 + geyser.phase);
      var newHeight = geyser.maxHeight * (0.6 + 0.4 * oscillation);
      geyser.mesh.scale.y = newHeight / geyser.maxHeight;
      geyser.mesh.position.y = geyser.baseY + (newHeight - geyser.maxHeight) * 0.5;
    }

    for (var k = 0; k < magmaPools.length; k++) {
      var bubble = magmaPools[k];
      var bobbing = 0.2 * Math.sin(animationTime * 2 + bubble.phase);
      bubble.mesh.position.y = bubble.baseY + bobbing;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        if (Array.isArray(objects[i].material)) {
          for (var j = 0; j < objects[i].material.length; j++) {
            objects[i].material[j].dispose();
          }
        } else {
          objects[i].material.dispose();
        }
      }
    }

    for (var k = objects.length - 1; k >= 0; k--) {
      if (objects[k].parent) {
        objects[k].parent.remove(objects[k]);
      }
    }

    objects = [];
    geyserCols = [];
    lavaChannels = [];
    torches = [];
    magmaPools = [];
    animationTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
