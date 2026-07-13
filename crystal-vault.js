window.CrystalVault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var vaultObjects = [];
  var crystals = [];
  var energyBeams = [];
  var centralCrystal = null;
  var containmentField = null;
  var pulseMaterials = [];
  var animatingBeams = [];
  var time = 0;

  function createMaterial(color, emissive, emissiveIntensity) {
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissiveIntensity || 0,
      metalness: 0.7,
      roughness: 0.3
    });
    return mat;
  }

  function createCrystal(x, y, z, scale) {
    var geometry = new THREE.ConeGeometry(scale * 0.6, scale * 3, 8);
    var colors = [0x6600cc, 0x2200aa, 0x0066ff, 0x00ccff];
    var color = colors[Math.floor(Math.random() * colors.length)];
    var mat = createMaterial(color, color, 0.3);
    var crystal = new THREE.Mesh(geometry, mat);
    crystal.position.set(x, y, z);
    crystal.castShadow = true;
    crystal.receiveShadow = true;
    scene.add(crystal);
    vaultObjects.push(crystal);
    crystals.push({ mesh: crystal, material: mat, baseIntensity: 0.3 });
    return crystal;
  }

  function createSmallCrystal(x, y, z) {
    return createCrystal(x, y, z, 0.4 + Math.random() * 0.4);
  }

  function createLargeCrystal(x, y, z, scale) {
    return createCrystal(x, y, z, scale || 2.5 + Math.random() * 1.5);
  }

  function createEnergyConduit(x1, y1, z1, x2, y2, z2) {
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array([x1, y1, z1, x2, y2, z2]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
    var line = new THREE.LineSegments(geometry, mat);
    scene.add(line);
    vaultObjects.push(line);
    energyBeams.push({ mesh: line, material: mat });
    return line;
  }

  function createDrillingMachine(x, y, z) {
    var group = new THREE.Group();

    var baseGeom = new THREE.BoxGeometry(2, 1.5, 2);
    var baseMat = createMaterial(0x333333, 0x111111, 0.2);
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    var armGeom = new THREE.BoxGeometry(0.8, 3, 0.6);
    var armMat = createMaterial(0x444444, 0x222222, 0.1);
    var arm = new THREE.Mesh(armGeom, armMat);
    arm.position.y = 2;
    arm.castShadow = true;
    arm.receiveShadow = true;
    group.add(arm);

    var drillGeom = new THREE.CylinderGeometry(0.4, 0.3, 1.5, 16);
    var drillMat = createMaterial(0x888888, 0x444444, 0.4);
    var drill = new THREE.Mesh(drillGeom, drillMat);
    drill.position.y = 3.5;
    drill.castShadow = true;
    drill.receiveShadow = true;
    group.add(drill);

    group.position.set(x, y, z);
    scene.add(group);
    vaultObjects.push(group);
    return group;
  }

  function createExtractionChamber(x, y, z) {
    var group = new THREE.Group();

    var wallsGeom = new THREE.BoxGeometry(6, 5, 6);
    var wallsMat = createMaterial(0x1a1a2e, 0x0a0a1a, 0.15);
    var walls = new THREE.Mesh(wallsGeom, wallsMat);
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    for (var i = 0; i < 3; i++) {
      var cx = (i - 1) * 1.5;
      createCrystal(x + cx, y + 0.5, z, 1.2);
    }

    group.position.set(x, y, z);
    scene.add(group);
    vaultObjects.push(group);
    return group;
  }

  function createCollectorArray(x, y, z) {
    var group = new THREE.Group();

    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var cx = Math.cos(angle) * 5;
      var cz = Math.sin(angle) * 5;
      var podGeom = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 16);
      var podMat = createMaterial(0x004466, 0x003344, 0.4);
      var pod = new THREE.Mesh(podGeom, podMat);
      pod.position.set(cx, 0, cz);
      pod.castShadow = true;
      pod.receiveShadow = true;
      group.add(pod);
      crystals.push({ mesh: pod, material: podMat, baseIntensity: 0.4 });
    }

    group.position.set(x, y, z);
    scene.add(group);
    vaultObjects.push(group);
    return group;
  }

  function createResearchBunker(x, y, z) {
    var group = new THREE.Group();

    var outerGeom = new THREE.BoxGeometry(10, 6, 8);
    var outerMat = createMaterial(0x222222, 0x111111, 0.1);
    var outer = new THREE.Mesh(outerGeom, outerMat);
    outer.castShadow = true;
    outer.receiveShadow = true;
    group.add(outer);

    var innerGeom = new THREE.BoxGeometry(8, 4, 6);
    var innerMat = createMaterial(0x1a1a1a, 0x0a0a0a, 0.05);
    var inner = new THREE.Mesh(innerGeom, innerMat);
    inner.position.z = 0;
    inner.castShadow = true;
    inner.receiveShadow = true;
    group.add(inner);

    for (var i = 0; i < 4; i++) {
      var px = (i % 2 - 0.5) * 4;
      var pz = (Math.floor(i / 2) - 0.5) * 3;
      var machineGeom = new THREE.BoxGeometry(1, 2, 1);
      var machineMat = createMaterial(0x333333, 0x111111, 0.2);
      var machine = new THREE.Mesh(machineGeom, machineMat);
      machine.position.set(px, 0, pz);
      machine.castShadow = true;
      machine.receiveShadow = true;
      group.add(machine);
    }

    group.position.set(x, y, z);
    scene.add(group);
    vaultObjects.push(group);
    return group;
  }

  function createCatwalk(x, y, z, length, direction) {
    var group = new THREE.Group();

    var walkGeom = new THREE.BoxGeometry(direction === 'x' ? length : 1.5, 0.5, direction === 'z' ? length : 1.5);
    var walkMat = createMaterial(0x444444, 0x222222, 0.15);
    var walk = new THREE.Mesh(walkGeom, walkMat);
    walk.castShadow = true;
    walk.receiveShadow = true;
    group.add(walk);

    if (direction === 'x') {
      for (var i = 0; i < length; i += 2) {
        var railGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
        var railMat = createMaterial(0x555555, 0x333333, 0.1);
        var rail = new THREE.Mesh(railGeom, railMat);
        rail.rotation.z = Math.PI / 2;
        rail.position.set((i - length / 2), 1, 1);
        rail.castShadow = true;
        rail.receiveShadow = true;
        group.add(rail);
      }
    } else {
      for (var i = 0; i < length; i += 2) {
        var railGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
        var railMat = createMaterial(0x555555, 0x333333, 0.1);
        var rail = new THREE.Mesh(railGeom, railMat);
        rail.rotation.x = Math.PI / 2;
        rail.position.set(1, 1, (i - length / 2));
        rail.castShadow = true;
        rail.receiveShadow = true;
        group.add(rail);
      }
    }

    group.position.set(x, y, z);
    scene.add(group);
    vaultObjects.push(group);
    return group;
  }

  function createSecurityLaserGrid(x, y, z, size) {
    for (var i = 0; i < 5; i++) {
      var offset = (i - 2) * (size / 4);
      createEnergyConduit(x - size / 2, y + offset, z, x + size / 2, y + offset, z);
      createEnergyConduit(x + offset, y - size / 2, z, x + offset, y + size / 2, z);
    }

    for (var i = 0; i < 4; i++) {
      var px = (i % 2 - 0.5) * size / 2;
      var pz = (Math.floor(i / 2) - 0.5) * size / 2;
      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array([
        px, -size / 2, pz,
        px, size / 2, pz
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var mat = new THREE.LineBasicMaterial({ color: 0xff0066, linewidth: 2 });
      var line = new THREE.LineSegments(geometry, mat);
      line.position.set(x, y, z);
      scene.add(line);
      vaultObjects.push(line);
      energyBeams.push({ mesh: line, material: mat, isLaser: true });
    }
  }

  function createCentralCrystal(x, y, z) {
    var geometry = new THREE.ConeGeometry(4, 12, 12);
    var mat = createMaterial(0xff00ff, 0xff00ff, 0.8);
    var crystal = new THREE.Mesh(geometry, mat);
    crystal.position.set(x, y, z);
    crystal.castShadow = true;
    crystal.receiveShadow = true;
    scene.add(crystal);
    vaultObjects.push(crystal);
    centralCrystal = crystal;
    pulseMaterials.push({ material: mat, baseIntensity: 0.8, intensity: 0.8 });
    return crystal;
  }

  function createContainmentField(x, y, z) {
    var geometry = new THREE.SphereGeometry(5.5, 32, 32);
    var mat = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.3,
      metalness: 0.3,
      roughness: 0.7,
      transparent: true,
      opacity: 0.2,
      wireframe: true
    });
    var field = new THREE.Mesh(geometry, mat);
    field.position.set(x, y, z);
    scene.add(field);
    vaultObjects.push(field);
    containmentField = field;
    pulseMaterials.push({ material: mat, baseIntensity: 0.3, intensity: 0.3 });
    return field;
  }

  function createCaveCeiling(x, y, z, width, depth) {
    var group = new THREE.Group();

    var ceilingGeom = new THREE.BoxGeometry(width, 2, depth);
    var ceilingMat = createMaterial(0x2a2a3a, 0x1a1a2a, 0.1);
    var ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
    ceiling.position.y = 0;
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    group.add(ceiling);

    for (var i = 0; i < 20; i++) {
      var sx = (Math.random() - 0.5) * width * 0.8;
      var sz = (Math.random() - 0.5) * depth * 0.8;
      var stalactiteGeom = new THREE.ConeGeometry(0.4, 2.5, 8);
      var stalactiteMat = createMaterial(0x4400cc, 0x3300aa, 0.4);
      var stalactite = new THREE.Mesh(stalactiteGeom, stalactiteMat);
      stalactite.position.set(sx, -1.5, sz);
      stalactite.castShadow = true;
      stalactite.receiveShadow = true;
      group.add(stalactite);
      crystals.push({ mesh: stalactite, material: stalactiteMat, baseIntensity: 0.4 });
    }

    group.position.set(x, y, z);
    scene.add(group);
    vaultObjects.push(group);
    return group;
  }

  function createExcavationTunnel(x, y, z, length, direction) {
    var group = new THREE.Group();

    var tunnelGeom = new THREE.BoxGeometry(
      direction === 'x' ? length : 4,
      4,
      direction === 'z' ? length : 4
    );
    var tunnelMat = createMaterial(0x1a1a2e, 0x0a0a1a, 0.08);
    var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
    tunnel.castShadow = true;
    tunnel.receiveShadow = true;
    group.add(tunnel);

    group.position.set(x, y, z);
    scene.add(group);
    vaultObjects.push(group);
    return group;
  }

  function createCrystalFormation(x, y, z, count) {
    for (var i = 0; i < count; i++) {
      var offset = i * 1.2;
      var cx = x + (i % 2) * 0.8;
      var cy = y + offset;
      var cz = z + Math.floor(i / 2) * 0.8;
      createSmallCrystal(cx, cy, cz);
    }
  }

  var init = function(sceneIn, cameraIn) {
    scene = sceneIn;
    camera = cameraIn;
    time = 0;

    scene.background = new THREE.Color(0x0a0a15);
    scene.fog = new THREE.Fog(0x0a0a15, 80, 150);

    var light1 = new THREE.DirectionalLight(0xffffff, 0.5);
    light1.position.set(30, 40, 30);
    light1.castShadow = true;
    light1.shadow.mapSize.width = 2048;
    light1.shadow.mapSize.height = 2048;
    scene.add(light1);

    var light2 = new THREE.PointLight(0x6600ff, 1.5, 80);
    light2.position.set(0, 15, 0);
    light2.castShadow = true;
    scene.add(light2);

    var light3 = new THREE.PointLight(0x00ffff, 1, 60);
    light3.position.set(25, 20, 25);
    scene.add(light3);

    var ambientLight = new THREE.AmbientLight(0x4444ff, 0.4);
    scene.add(ambientLight);

    // Cave floor and walls
    var floorGeom = new THREE.BoxGeometry(70, 0.5, 70);
    var floorMat = createMaterial(0x1a1a1a, 0x0a0a0a, 0.05);
    var floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);
    vaultObjects.push(floor);

    // Massive crystal formations
    createLargeCrystal(-25, 5, -25, 3);
    createLargeCrystal(25, 4, -28, 2.8);
    createLargeCrystal(-28, 6, 22, 3.2);
    createLargeCrystal(28, 5, 25, 2.9);
    createLargeCrystal(0, 8, -30, 3.5);
    createLargeCrystal(-30, 7, 0, 3.1);
    createLargeCrystal(30, 6, 5, 2.7);

    // Crystal formations scattered around
    createCrystalFormation(-20, 0.5, -20, 8);
    createCrystalFormation(20, 0.5, -15, 10);
    createCrystalFormation(-15, 0.5, 20, 7);
    createCrystalFormation(15, 0.5, 18, 9);

    // Crystal cave ceiling with stalactites
    createCaveCeiling(0, 30, 0, 65, 65);

    // Central super-crystal with containment field
    createCentralCrystal(0, 8, 0);
    createContainmentField(0, 8, 0);

    // Energy collector array around central crystal
    createCollectorArray(0, 1.5, 0);

    // Energy conduits connecting crystals
    createEnergyConduit(-25, 5, -25, 0, 8, 0);
    createEnergyConduit(25, 4, -28, 0, 8, 0);
    createEnergyConduit(-28, 6, 22, 0, 8, 0);
    createEnergyConduit(28, 5, 25, 0, 8, 0);
    createEnergyConduit(0, 8, -30, 0, 8, 0);
    createEnergyConduit(-30, 7, 0, 0, 8, 0);
    createEnergyConduit(30, 6, 5, 0, 8, 0);

    // Additional interconnecting beams
    for (var i = 0; i < 15; i++) {
      var angle1 = (i / 15) * Math.PI * 2;
      var angle2 = ((i + 1) / 15) * Math.PI * 2;
      var x1 = Math.cos(angle1) * 8;
      var z1 = Math.sin(angle1) * 8;
      var x2 = Math.cos(angle2) * 8;
      var z2 = Math.sin(angle2) * 8;
      createEnergyConduit(x1, 8, z1, x2, 8, z2);
    }

    // Mining and drilling equipment
    createDrillingMachine(-15, 1, -15);
    createDrillingMachine(15, 1, -12);
    createDrillingMachine(-12, 1, 18);
    createDrillingMachine(18, 1, 20);

    // Crystal extraction chambers
    createExtractionChamber(-20, 2.5, 5);
    createExtractionChamber(20, 2.5, -8);
    createExtractionChamber(5, 2.5, -20);

    // Catwalks threading between crystals
    createCatwalk(-10, 3, -10, 15, 'x');
    createCatwalk(10, 3, 8, 12, 'z');
    createCatwalk(-8, 2.5, 12, 14, 'x');

    // Military research bunker
    createResearchBunker(-25, 1.5, 20);

    // Excavation tunnels
    createExcavationTunnel(-30, 1.5, 0, 20, 'x');
    createExcavationTunnel(0, 1.5, -30, 20, 'z');
    createExcavationTunnel(25, 1.5, -20, 18, 'z');

    // Security laser grid
    createSecurityLaserGrid(0, 15, -20, 16);
    createSecurityLaserGrid(20, 12, 15, 12);

    // Additional scattered small crystals on floor
    for (var i = 0; i < 35; i++) {
      var rx = (Math.random() - 0.5) * 60;
      var rz = (Math.random() - 0.5) * 60;
      createSmallCrystal(rx, 0.5, rz);
    }

    // Store references for animation
    animatingBeams = energyBeams.slice();
  };

  var update = function(delta) {
    time += delta;

    // Pulse central crystal
    if (centralCrystal) {
      centralCrystal.rotation.y += delta * 0.3;
      centralCrystal.position.y = 8 + Math.sin(time * 2) * 0.3;
    }

    // Pulse containment field
    if (containmentField) {
      containmentField.scale.set(
        1 + Math.sin(time * 1.5) * 0.1,
        1 + Math.sin(time * 1.5) * 0.1,
        1 + Math.sin(time * 1.5) * 0.1
      );
    }

    // Update pulsing materials
    for (var i = 0; i < pulseMaterials.length; i++) {
      var entry = pulseMaterials[i];
      var pulse = Math.sin(time * 2 + i) * 0.3 + 0.7;
      entry.material.emissiveIntensity = entry.baseIntensity * pulse;
    }

    // Update crystal pulsing
    for (var i = 0; i < crystals.length; i++) {
      var crystal = crystals[i];
      var pulse = Math.sin(time * 1.8 + i * 0.5) * 0.25 + 0.75;
      crystal.material.emissiveIntensity = crystal.baseIntensity * pulse;
    }

    // Animate energy conduit beams
    for (var i = 0; i < animatingBeams.length; i++) {
      var beam = animatingBeams[i];
      if (!beam.isLaser) {
        var glow = Math.sin(time * 3 + i) * 0.5 + 1;
        beam.material.linewidth = glow;
        beam.material.opacity = Math.sin(time * 2.5 + i) * 0.3 + 0.7;
      }
    }
  };

  var reset = function() {
    for (var i = 0; i < vaultObjects.length; i++) {
      scene.remove(vaultObjects[i]);
    }
    vaultObjects = [];
    crystals = [];
    energyBeams = [];
    animatingBeams = [];
    pulseMaterials = [];
    centralCrystal = null;
    containmentField = null;
    time = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
