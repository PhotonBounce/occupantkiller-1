window.CyberLab = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var animatedObjects = [];

  function init(sceneRef, camera) {
    scene = sceneRef;
    objects = [];
    animatedObjects = [];

    // Main lab floor grid
    var floorMaterial1 = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
    var floorMaterial2 = new THREE.MeshStandardMaterial({ color: 0x001133, metalness: 0.8, roughness: 0.2 });
    var tileSize = 2;
    var gridSize = 20;
    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        var mat = ((i + j) % 2 === 0) ? floorMaterial1 : floorMaterial2;
        var geo = new THREE.BoxGeometry(tileSize, 0.1, tileSize);
        var tile = new THREE.Mesh(geo, mat);
        tile.position.set(i * tileSize - gridSize * tileSize / 2, 0, j * tileSize - gridSize * tileSize / 2);
        tile.receiveShadow = true;
        scene.add(tile);
        objects.push(tile);
      }
    }

    // Holographic server racks
    var serverMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A2E, metalness: 0.9, roughness: 0.1 });
    var serverEmissive = new THREE.MeshStandardMaterial({ color: 0x0044FF, emissive: 0x0044FF, emissiveIntensity: 0.6 });
    for (var s = 0; s < 4; s++) {
      var serverGeo = new THREE.BoxGeometry(1, 5, 1);
      var serverRack = new THREE.Mesh(serverGeo, serverMaterial);
      serverRack.position.set(-15 + s * 8, 2.5, -15);
      serverRack.castShadow = true;
      serverRack.receiveShadow = true;
      scene.add(serverRack);
      objects.push(serverRack);

      // Blue emissive strips on server
      var stripGeo = new THREE.BoxGeometry(0.8, 0.3, 0.8);
      var strip = new THREE.Mesh(stripGeo, serverEmissive);
      strip.position.set(-15 + s * 8, 3, -15);
      strip.castShadow = true;
      scene.add(strip);
      objects.push(strip);
      animatedObjects.push({ obj: strip, type: 'blink' });
    }

    // Central quantum computer core
    var coreMaterial = new THREE.MeshStandardMaterial({ color: 0x0022AA, emissive: 0x0066FF, emissiveIntensity: 0.8 });
    var coreGeo = new THREE.SphereGeometry(3, 32, 32);
    var core = new THREE.Mesh(coreGeo, coreMaterial);
    core.position.set(0, 3, 0);
    core.castShadow = true;
    scene.add(core);
    objects.push(core);
    animatedObjects.push({ obj: core, type: 'pulse' });

    // Neon lighting grid on ceiling
    var neonMaterial = new THREE.MeshStandardMaterial({ color: 0x00FFFF, emissive: 0x00FFFF, emissiveIntensity: 0.8 });
    for (var nx = 0; nx < 8; nx++) {
      var neonGeo = new THREE.BoxGeometry(20, 0.05, 0.3);
      var neonLight = new THREE.Mesh(neonGeo, neonMaterial);
      neonLight.position.set(-16, 9.5, -16 + nx * 4);
      scene.add(neonLight);
      objects.push(neonLight);
      animatedObjects.push({ obj: neonLight, type: 'flicker' });
    }

    // Android soldier assembly lines
    var androidMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
    for (var a = 0; a < 3; a++) {
      // Body
      var bodyGeo = new THREE.BoxGeometry(0.6, 1.8, 0.4);
      var body = new THREE.Mesh(bodyGeo, androidMaterial);
      body.position.set(-8 + a * 6, 0.9, 10);
      body.castShadow = true;
      scene.add(body);
      objects.push(body);
      animatedObjects.push({ obj: body, type: 'convey', offset: a * 0.3 });

      // Head
      var headGeo = new THREE.BoxGeometry(0.5, 0.6, 0.4);
      var head = new THREE.Mesh(headGeo, androidMaterial);
      head.position.set(-8 + a * 6, 2.4, 10);
      head.castShadow = true;
      scene.add(head);
      objects.push(head);
      animatedObjects.push({ obj: head, type: 'convey', offset: a * 0.3 });
    }

    // Laser grid security
    var laserMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000 });
    for (var lx = 0; lx < 3; lx++) {
      for (var ly = 0; ly < 4; ly++) {
        var laserPoints = [
          new THREE.Vector3(-10, 3 + ly * 1.5, -10 + lx * 8),
          new THREE.Vector3(10, 3 + ly * 1.5, -10 + lx * 8)
        ];
        var laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
        var laser = new THREE.LineSegments(laserGeo, laserMaterial);
        scene.add(laser);
        objects.push(laser);
        animatedObjects.push({ obj: laser, type: 'scan', startX: -10, endX: 10, y: 3 + ly * 1.5 });
      }
    }

    // Hologram projector pedestals
    var pedestalMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A2E, metalness: 0.8, roughness: 0.2 });
    var projectorMaterial = new THREE.MeshStandardMaterial({ color: 0x0044FF, emissive: 0x0044FF, emissiveIntensity: 0.7 });
    for (var p = 0; p < 4; p++) {
      // Base cylinder
      var baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.5, 16);
      var base = new THREE.Mesh(baseGeo, pedestalMaterial);
      base.position.set(-12 + p * 8, 0.25, 12);
      base.castShadow = true;
      scene.add(base);
      objects.push(base);

      // Projector sphere
      var projGeo = new THREE.SphereGeometry(0.6, 16, 16);
      var projector = new THREE.Mesh(projGeo, projectorMaterial);
      projector.position.set(-12 + p * 8, 1.5, 12);
      projector.castShadow = true;
      scene.add(projector);
      objects.push(projector);
      animatedObjects.push({ obj: projector, type: 'shimmer' });
    }

    // Security robot charging stations
    var stationMaterial = new THREE.MeshStandardMaterial({ color: 0x222244, metalness: 0.6, roughness: 0.4 });
    for (var st = 0; st < 3; st++) {
      var stationGeo = new THREE.BoxGeometry(1.5, 2, 1);
      var station = new THREE.Mesh(stationGeo, stationMaterial);
      station.position.set(10 + st * 3, 1, -10);
      station.castShadow = true;
      scene.add(station);
      objects.push(station);
    }

    // Data cable runs
    var cableMaterial = new THREE.MeshStandardMaterial({ color: 0x00AAFF, emissive: 0x00AAFF, emissiveIntensity: 0.5 });
    for (var cb = 0; cb < 3; cb++) {
      var cableGeo = new THREE.CylinderGeometry(0.15, 0.15, 15, 8);
      var cable = new THREE.Mesh(cableGeo, cableMaterial);
      cable.rotation.z = Math.PI / 2;
      cable.position.set(-5 + cb * 5, 8, 0);
      cable.castShadow = true;
      scene.add(cable);
      objects.push(cable);
    }

    // Containment chambers
    var chamberMaterial = new THREE.MeshStandardMaterial({ color: 0x88CCFF, transparent: true, opacity: 0.3, metalness: 0.2, roughness: 0.1 });
    for (var ch = 0; ch < 2; ch++) {
      var chamberGeo = new THREE.BoxGeometry(2, 3, 2);
      var chamber = new THREE.Mesh(chamberGeo, chamberMaterial);
      chamber.position.set(-5 + ch * 10, 1.5, 5);
      chamber.castShadow = false;
      chamber.receiveShadow = true;
      scene.add(chamber);
      objects.push(chamber);
    }

    // Weapon synthesis lab
    var workbenchMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
    var equipmentMaterial = new THREE.MeshStandardMaterial({ color: 0xFFAA00, emissive: 0xFFAA00, emissiveIntensity: 0.4 });
    for (var wb = 0; wb < 2; wb++) {
      var benchGeo = new THREE.BoxGeometry(2, 0.8, 1.5);
      var bench = new THREE.Mesh(benchGeo, workbenchMaterial);
      bench.position.set(-8 + wb * 8, 0.4, -8);
      bench.castShadow = true;
      scene.add(bench);
      objects.push(bench);

      // Equipment on bench
      var equipGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      var equip = new THREE.Mesh(equipGeo, equipmentMaterial);
      equip.position.set(-8 + wb * 8, 1.2, -8);
      equip.castShadow = true;
      scene.add(equip);
      objects.push(equip);
      animatedObjects.push({ obj: equip, type: 'blink' });
    }

    // Emergency bulkhead doors
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.8, roughness: 0.2 });
    for (var d = 0; d < 4; d++) {
      var doorGeo = new THREE.BoxGeometry(1.5, 2.5, 0.2);
      var door = new THREE.Mesh(doorGeo, doorMaterial);
      door.position.set(-15 + d * 10, 1.25, 15);
      door.castShadow = true;
      scene.add(door);
      objects.push(door);
    }

    // DNA sequencer machines
    var dnaBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x224422, metalness: 0.7, roughness: 0.3 });
    var dnaGlowMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF44, emissive: 0x00FF44, emissiveIntensity: 0.6 });
    for (var dn = 0; dn < 2; dn++) {
      var dnaGeo = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
      var dnaMachine = new THREE.Mesh(dnaGeo, dnaBaseMaterial);
      dnaMachine.position.set(-10 + dn * 12, 1, 8);
      dnaMachine.castShadow = true;
      scene.add(dnaMachine);
      objects.push(dnaMachine);

      // Glowing top
      var dnaTopGeo = new THREE.SphereGeometry(0.5, 8, 8);
      var dnaTop = new THREE.Mesh(dnaTopGeo, dnaGlowMaterial);
      dnaTop.position.set(-10 + dn * 12, 2.2, 8);
      dnaTop.castShadow = true;
      scene.add(dnaTop);
      objects.push(dnaTop);
      animatedObjects.push({ obj: dnaTop, type: 'pulse' });
    }

    // Monitoring stations
    var deskMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
    var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x002233, emissive: 0x002233, emissiveIntensity: 0.5 });
    for (var mo = 0; mo < 2; mo++) {
      var deskGeo = new THREE.BoxGeometry(1.5, 0.8, 1);
      var desk = new THREE.Mesh(deskGeo, deskMaterial);
      desk.position.set(5 + mo * 5, 0.4, 8);
      desk.castShadow = true;
      scene.add(desk);
      objects.push(desk);

      // Screen
      var screenGeo = new THREE.BoxGeometry(1, 1.2, 0.1);
      var screen = new THREE.Mesh(screenGeo, screenMaterial);
      screen.position.set(5 + mo * 5, 1.5, 8);
      screen.castShadow = true;
      scene.add(screen);
      objects.push(screen);
      animatedObjects.push({ obj: screen, type: 'flicker' });
    }
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    for (var i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];
      var obj = anim.obj;

      if (anim.type === 'pulse') {
        var pulseIntensity = 0.4 + Math.sin(time * 2) * 0.4;
        obj.material.emissiveIntensity = pulseIntensity;
        var scaleVar = 1 + Math.sin(time * 1.5) * 0.1;
        obj.scale.set(scaleVar, scaleVar, scaleVar);
      }
      else if (anim.type === 'blink') {
        var blinkIntensity = Math.sin(time * 3) > 0 ? 0.8 : 0.2;
        obj.material.emissiveIntensity = blinkIntensity;
      }
      else if (anim.type === 'flicker') {
        var flickerIntensity = 0.5 + Math.random() * 0.3;
        obj.material.emissiveIntensity = flickerIntensity;
      }
      else if (anim.type === 'shimmer') {
        var shimmerScale = 1 + Math.sin(time * 2.5 + i) * 0.08;
        obj.scale.set(shimmerScale, shimmerScale, shimmerScale);
      }
      else if (anim.type === 'scan') {
        var scanProgress = (Math.sin(time * 1.5) + 1) / 2;
        var scanX = anim.startX + (anim.endX - anim.startX) * scanProgress;
        obj.rotation.y = scanProgress * Math.PI;
        obj.position.x = scanX;
      }
      else if (anim.type === 'convey') {
        var conveyOffset = (time * 2 + anim.offset) % 10;
        obj.position.z = 10 - conveyOffset;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
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
