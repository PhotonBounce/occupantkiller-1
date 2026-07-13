window.WaterTowerSiege = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var towers = [];
  var catwalks = [];
  var waterBlocks = [];
  var pipes = [];
  var fence = null;
  var burstedPipe = null;
  var pumpHouse = null;
  var supplyDepot = null;
  var time = 0;

  function createWaterTower(x, z, index) {
    var towerGroup = new THREE.Group();
    towerGroup.position.set(x, 0, z);

    // Tower leg - tall cylinder
    var legGeometry = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
    var legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });
    var leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.y = 10;
    leg.castShadow = true;
    towerGroup.add(leg);

    // Access ladder rungs - LineSegments
    var ladderGeometry = new THREE.BufferGeometry();
    var ladderPositions = [];
    var rungCount = 16;
    for (var i = 0; i < rungCount; i++) {
      var yPos = i * 1.25;
      // Left rung
      ladderPositions.push(-0.7, yPos, 0);
      ladderPositions.push(0.7, yPos, 0);
    }
    ladderGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ladderPositions), 3));
    var ladderMaterial = new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 2 });
    var ladder = new THREE.LineSegments(ladderGeometry, ladderMaterial);
    ladder.position.y = 0.2;
    towerGroup.add(ladder);

    // Spherical tank at top
    var tankGeometry = new THREE.SphereGeometry(2.5, 16, 12);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x1a5f7a, metalness: 0.6, roughness: 0.3 });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.y = 21.5;
    tank.scale.set(1, 0.7, 1);
    tank.castShadow = true;
    tank.receiveShadow = true;
    towerGroup.add(tank);

    // Sniper platform on tank - BoxGeometry
    var platformGeometry = new THREE.BoxGeometry(4, 0.4, 4);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.5 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 24.5;
    platform.castShadow = true;
    towerGroup.add(platform);

    // Sandbag fortifications - stacked boxes
    var sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355, metalness: 0.1 });
    for (var sb = 0; sb < 3; sb++) {
      var sbGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.6);
      var sandbag = new THREE.Mesh(sbGeometry, sandbagMaterial);
      sandbag.position.set((sb - 1) * 0.8, 25.2 + (sb * 0.35), 1.5);
      sandbag.castShadow = true;
      towerGroup.add(sandbag);
    }

    towers.push({ group: towerGroup, index: index });
    return towerGroup;
  }

  function createCatwalk(fromTower, toTower) {
    var walkGeometry = new THREE.BoxGeometry(0.6, 0.3, 8);
    var walkMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });
    var walkway = new THREE.Mesh(walkGeometry, walkMaterial);

    var fx = fromTower.position.x;
    var fz = fromTower.position.z;
    var tx = toTower.position.x;
    var tz = toTower.position.z;

    walkway.position.x = (fx + tx) / 2;
    walkway.position.z = (fz + tz) / 2;
    walkway.position.y = 22;

    var dx = tx - fx;
    var dz = tz - fz;
    walkway.rotation.y = Math.atan2(dx, dz);
    var len = Math.sqrt(dx * dx + dz * dz);
    walkway.scale.z = len / 8;

    walkway.castShadow = true;
    walkway.receiveShadow = true;

    // Railing LineSegments
    var railGeometry = new THREE.BufferGeometry();
    var railPoints = [];
    var railSegments = 10;
    for (var rs = 0; rs <= railSegments; rs++) {
      var t = rs / railSegments;
      var wx = fx + t * dx;
      var wz = fz + t * dz;
      // Vertical rail posts
      railPoints.push(wx, 22, wz);
      railPoints.push(wx, 23.5, wz);
    }
    railGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(railPoints), 3));
    var railMaterial = new THREE.LineBasicMaterial({ color: 0xff9900 });
    var railing = new THREE.LineSegments(railGeometry, railMaterial);

    catwalks.push(walkway);
    scene.add(walkway);
    scene.add(railing);
  }

  function createPumpHouse() {
    var phGeometry = new THREE.BoxGeometry(6, 4, 6);
    var phMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.4 });
    var house = new THREE.Mesh(phGeometry, phMaterial);
    house.position.set(-15, 2, -15);
    house.castShadow = true;
    house.receiveShadow = true;
    scene.add(house);

    // Roof vent - cylinder
    var ventGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    var ventMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
    var vent = new THREE.Mesh(ventGeometry, ventMaterial);
    vent.position.set(-15, 4.5, -15);
    vent.castShadow = true;
    scene.add(vent);

    pumpHouse = house;
    return house;
  }

  function createSupplyDepot() {
    var depotGroup = new THREE.Group();
    depotGroup.position.set(12, 0, -15);

    var crateSize = 1.2;
    var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6f47 });

    for (var cx = 0; cx < 3; cx++) {
      for (var cz = 0; cz < 3; cz++) {
        for (var cy = 0; cy < 2; cy++) {
          var crateGeometry = new THREE.BoxGeometry(crateSize, crateSize, crateSize);
          var crate = new THREE.Mesh(crateGeometry, crateMaterial);
          crate.position.set(cx * 1.3, cy * 1.3, cz * 1.3);
          crate.castShadow = true;
          depotGroup.add(crate);
        }
      }
    }

    scene.add(depotGroup);
    supplyDepot = depotGroup;
    return depotGroup;
  }

  function createFloodedWater() {
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a5f7a,
      metalness: 0.2,
      roughness: 0.6,
      transparent: true,
      opacity: 0.6
    });

    // Create water blocks in grid pattern
    for (var wx = -20; wx <= 20; wx += 4) {
      for (var wz = -20; wz <= 20; wz += 4) {
        var waterGeometry = new THREE.BoxGeometry(4, 0.5, 4);
        var water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.set(wx, 0.25, wz);
        water.receiveShadow = true;
        waterBlocks.push({ mesh: water, baseX: wx, baseZ: wz });
        scene.add(water);
      }
    }
  }

  function createPipeSystem() {
    var pipePositions = [
      { from: [-5, 4], to: [5, 4] },
      { from: [5, 4], to: [5, 16] },
      { from: [5, 16], to: [-8, 16] },
      { from: [-8, 16], to: [-8, 4] }
    ];

    for (var pp = 0; pp < pipePositions.length; pp++) {
      var fromPos = pipePositions[pp].from;
      var toPos = pipePositions[pp].to;

      var dx = toPos[0] - fromPos[0];
      var dy = toPos[1] - fromPos[1];
      var dist = Math.sqrt(dx * dx + dy * dy);

      var pipeGeometry = new THREE.CylinderGeometry(0.25, 0.25, dist, 6);
      var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000, metalness: 0.8 });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);

      pipe.position.x = (fromPos[0] + toPos[0]) / 2;
      pipe.position.y = (fromPos[1] + toPos[1]) / 2 + 0.2;
      pipe.position.z = 0;

      var angle = Math.atan2(dy, dx);
      pipe.rotation.z = angle - Math.PI / 2;

      pipe.castShadow = true;
      scene.add(pipe);
      pipes.push(pipe);

      // Control valve junction box
      var valveGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      var valveMaterial = new THREE.MeshStandardMaterial({ color: 0xccaa00 });
      var valve = new THREE.Mesh(valveGeometry, valveMaterial);
      valve.position.set((fromPos[0] + toPos[0]) / 2, (fromPos[1] + toPos[1]) / 2 + 1, 0);
      valve.castShadow = true;
      scene.add(valve);
    }
  }

  function createBurstedPipe() {
    var sprayGeometry = new THREE.SphereGeometry(0.15, 4, 4);
    var sprayMaterial = new THREE.MeshStandardMaterial({ color: 0x4488ff, transparent: true, opacity: 0.7 });

    var sprayGroup = new THREE.Group();
    var sprayParticles = [];

    for (var sp = 0; sp < 8; sp++) {
      var spray = new THREE.Mesh(sprayGeometry, sprayMaterial);
      spray.position.set(5, 12, 0);
      spray.velocity = {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 3 + 2,
        z: (Math.random() - 0.5) * 4
      };
      sprayGroup.add(spray);
      sprayParticles.push({ mesh: spray, velocity: spray.velocity });
    }

    scene.add(sprayGroup);
    burstedPipe = { group: sprayGroup, particles: sprayParticles };
  }

  function createPerimeterFence() {
    var fenceGeometry = new THREE.BufferGeometry();
    var fencePositions = [];
    var fenceRange = 35;
    var fenceSegments = 16;

    // Create fence perimeter
    for (var fs = 0; fs <= fenceSegments; fs++) {
      var angle = (fs / fenceSegments) * Math.PI * 2;
      var x = Math.cos(angle) * fenceRange;
      var z = Math.sin(angle) * fenceRange;

      // Vertical posts
      fencePositions.push(x, 0, z);
      fencePositions.push(x, 2, z);
    }

    // Horizontal rails
    for (var fr = 0; fr <= fenceSegments; fr++) {
      var angle1 = (fr / fenceSegments) * Math.PI * 2;
      var angle2 = ((fr + 1) / fenceSegments) * Math.PI * 2;

      var x1 = Math.cos(angle1) * fenceRange;
      var z1 = Math.sin(angle1) * fenceRange;
      var x2 = Math.cos(angle2) * fenceRange;
      var z2 = Math.sin(angle2) * fenceRange;

      fencePositions.push(x1, 1, z1);
      fencePositions.push(x2, 1, z2);
    }

    fenceGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fencePositions), 3));
    var fenceMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1 });
    fence = new THREE.LineSegments(fenceGeometry, fenceMaterial);
    scene.add(fence);
  }

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    time = 0;

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Create main water towers in a cluster
    var tower1 = createWaterTower(-10, -10, 0);
    scene.add(tower1);

    var tower2 = createWaterTower(10, -10, 1);
    scene.add(tower2);

    var tower3 = createWaterTower(10, 10, 2);
    scene.add(tower3);

    var tower4 = createWaterTower(-10, 10, 3);
    scene.add(tower4);

    // Connect towers with catwalks
    createCatwalk(tower1, tower2);
    createCatwalk(tower2, tower3);
    createCatwalk(tower3, tower4);
    createCatwalk(tower4, tower1);

    // Create infrastructure
    createPumpHouse();
    createSupplyDepot();
    createFloodedWater();
    createPipeSystem();
    createBurstedPipe();
    createPerimeterFence();

    // Ground plane
    var groundGeometry = new THREE.BoxGeometry(100, 0.2, 100);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.2 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  function update(delta) {
    time += delta;

    // Animate water waves
    for (var wbi = 0; wbi < waterBlocks.length; wbi++) {
      var wb = waterBlocks[wbi];
      var wave = Math.sin(time * 2 + wb.baseX * 0.1 + wb.baseZ * 0.1) * 0.15;
      wb.mesh.position.y = 0.25 + wave;
    }

    // Animate tower sway
    for (var ti = 0; ti < towers.length; ti++) {
      var tower = towers[ti];
      var sway = Math.sin(time * 0.5 + ti) * 0.05;
      tower.group.rotation.z = sway * 0.02;
    }

    // Animate bursted pipe spray
    if (burstedPipe) {
      for (var pti = 0; pti < burstedPipe.particles.length; pti++) {
        var particle = burstedPipe.particles[pti];
        particle.mesh.position.x += particle.velocity.x * delta;
        particle.mesh.position.y += particle.velocity.y * delta;
        particle.mesh.position.z += particle.velocity.z * delta;

        particle.velocity.y -= 9.8 * delta; // gravity

        // Reset spray
        if (particle.mesh.position.y < 0 || Math.abs(particle.mesh.position.x) > 30) {
          particle.mesh.position.set(5, 12, 0);
          particle.velocity.x = (Math.random() - 0.5) * 4;
          particle.velocity.y = Math.random() * 3 + 2;
          particle.velocity.z = (Math.random() - 0.5) * 4;
        }
      }
    }

    // Animate pump house slightly
    if (pumpHouse) {
      pumpHouse.rotation.y = Math.sin(time * 0.3) * 0.01;
    }

    // Pipe color pulse
    for (var pii = 0; pii < pipes.length; pii++) {
      var pressurePulse = 0.5 + Math.sin(time * 3 + pii) * 0.5;
      pipes[pii].material.emissiveIntensity = pressurePulse * 0.3;
    }
  }

  function reset() {
    time = 0;
    towers = [];
    catwalks = [];
    waterBlocks = [];
    pipes = [];
    fence = null;
    burstedPipe = null;
    pumpHouse = null;
    supplyDepot = null;

    if (scene) {
      var objectsToRemove = [];
      scene.traverse(function(child) {
        if (child !== scene && child.parent === scene) {
          objectsToRemove.push(child);
        }
      });

      for (var oi = 0; oi < objectsToRemove.length; oi++) {
        scene.remove(objectsToRemove[oi]);
      }
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
