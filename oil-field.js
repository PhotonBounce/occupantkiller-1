var OilField = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var pumpJacks = [];
  var flares = [];
  var geysers = [];
  var explosions = [];
  var fires = [];
  var demolitionCharges = [];
  var time = 0;

  var colors = {
    equipment: 0xCC2200,
    tank: 0xCCCCCC,
    pipe: 0x778899,
    fire: 0xFF5500,
    oil: 0x1A1A1A,
    desert: 0xC8A874,
    darkFire: 0xFF3300,
    yellow: 0xFFDD00
  };

  var config = {
    pumpJackCount: 8,
    storageCount: 5,
    geyserCount: 4,
    chargeDetonationTime: 5.0,
    explosionDuration: 2.0,
    fireDuration: 8.0
  };

  function createPumpJackUnit(x, z, rotation) {
    var group = { position: { x: x, z: z }, meshes: [], rotation: 0, rocking: true };

    // Walking beam (beam structure)
    var beamGeom = new THREE.BoxGeometry(8, 0.3, 1);
    var beamMat = new THREE.MeshStandardMaterial({ color: colors.equipment });
    var beam = new THREE.Mesh(beamGeom, beamMat);
    beam.position.set(x, 3, z);
    beam.rotation.z = rotation;
    beam.castShadow = true;
    beam.receiveShadow = true;
    scene.add(beam);
    meshes.push(beam);
    group.meshes.push(beam);

    // Counterweight (cylinder)
    var counterGeom = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 16);
    var counterMat = new THREE.MeshStandardMaterial({ color: colors.equipment, metalness: 0.6 });
    var counter = new THREE.Mesh(counterGeom, counterMat);
    counter.position.set(x - 4, 3.5, z);
    counter.castShadow = true;
    counter.receiveShadow = true;
    scene.add(counter);
    meshes.push(counter);
    group.meshes.push(counter);

    // Base frame
    var baseGeom = new THREE.BoxGeometry(2, 2, 2);
    var baseMat = new THREE.MeshStandardMaterial({ color: colors.equipment });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(x + 3, 1, z);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    meshes.push(base);
    group.meshes.push(base);

    // Rod connection (thin)
    var rodGeom = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    var rodMat = new THREE.MeshStandardMaterial({ color: colors.pipe });
    var rod = new THREE.Mesh(rodGeom, rodMat);
    rod.position.set(x + 3, 2.5, z);
    rod.castShadow = true;
    rod.receiveShadow = true;
    scene.add(rod);
    meshes.push(rod);
    group.meshes.push(rod);

    pumpJacks.push(group);
  }

  function createStorageTank(x, z) {
    // Large cylindrical storage tank
    var tankGeom = new THREE.CylinderGeometry(3, 3, 8, 20);
    var tankMat = new THREE.MeshStandardMaterial({ color: colors.tank, metalness: 0.8 });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(x, 4, z);
    tank.castShadow = true;
    tank.receiveShadow = true;
    scene.add(tank);
    meshes.push(tank);

    // Tank base support
    var supportGeom = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 16);
    var supportMat = new THREE.MeshStandardMaterial({ color: colors.pipe, metalness: 0.7 });
    var support = new THREE.Mesh(supportGeom, supportMat);
    support.position.set(x, 0.25, z);
    support.castShadow = true;
    support.receiveShadow = true;
    scene.add(support);
    meshes.push(support);

    // Tank top cap
    var capGeom = new THREE.CylinderGeometry(3, 3, 0.3, 16);
    var capMat = new THREE.MeshStandardMaterial({ color: colors.pipe });
    var cap = new THREE.Mesh(capGeom, capMat);
    cap.position.set(x, 8.1, z);
    cap.castShadow = true;
    cap.receiveShadow = true;
    scene.add(cap);
    meshes.push(cap);
  }

  function createPipelineSection(startX, startZ, endX, endZ) {
    // Horizontal pipe run
    var dx = endX - startX;
    var dz = endZ - startZ;
    var distance = Math.sqrt(dx * dx + dz * dz);
    var angle = Math.atan2(dz, dx);

    var pipeGeom = new THREE.CylinderGeometry(0.4, 0.4, distance, 12);
    var pipeMat = new THREE.MeshStandardMaterial({ color: colors.pipe, metalness: 0.6 });
    var pipe = new THREE.Mesh(pipeGeom, pipeMat);
    pipe.position.set((startX + endX) / 2, 1.5, (startZ + endZ) / 2);
    pipe.rotation.z = Math.PI / 2;
    pipe.rotation.y = angle;
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    scene.add(pipe);
    meshes.push(pipe);

    // Joint coupling (small box)
    var jointGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var jointMat = new THREE.MeshStandardMaterial({ color: colors.equipment });
    var joint = new THREE.Mesh(jointGeom, jointMat);
    joint.position.set(endX, 1.5, endZ);
    joint.castShadow = true;
    joint.receiveShadow = true;
    scene.add(joint);
    meshes.push(joint);
  }

  function createWellheadManifold(x, z) {
    // Control valves (stacked boxes)
    for (var i = 0; i < 3; i++) {
      var valveGeom = new THREE.BoxGeometry(0.8, 0.6, 0.8);
      var valveMat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? colors.equipment : colors.pipe });
      var valve = new THREE.Mesh(valveGeom, valveMat);
      valve.position.set(x + i * 1.2, 1.5 + i * 0.8, z);
      valve.castShadow = true;
      valve.receiveShadow = true;
      scene.add(valve);
      meshes.push(valve);
    }

    // Main wellhead body
    var headGeom = new THREE.CylinderGeometry(1.5, 1.5, 2, 12);
    var headMat = new THREE.MeshStandardMaterial({ color: colors.equipment, metalness: 0.5 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.set(x, 1, z);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    meshes.push(head);
  }

  function createSeparatorUnit(x, z) {
    // Horizontal separator vessel
    var sepGeom = new THREE.CylinderGeometry(2, 2, 6, 16);
    var sepMat = new THREE.MeshStandardMaterial({ color: colors.tank, metalness: 0.7 });
    var sep = new THREE.Mesh(sepGeom, sepMat);
    sep.position.set(x, 2, z);
    sep.rotation.z = Math.PI / 2;
    sep.castShadow = true;
    sep.receiveShadow = true;
    scene.add(sep);
    meshes.push(sep);

    // Inlet manifold
    var inletGeom = new THREE.CylinderGeometry(0.6, 0.6, 3, 8);
    var inletMat = new THREE.MeshStandardMaterial({ color: colors.pipe });
    var inlet = new THREE.Mesh(inletGeom, inletMat);
    inlet.position.set(x - 4, 2, z);
    inlet.rotation.z = Math.PI / 2;
    inlet.castShadow = true;
    inlet.receiveShadow = true;
    scene.add(inlet);
    meshes.push(inlet);
  }

  function createFlareStack(x, z) {
    // Tower structure (vertical cylinder)
    var towerGeom = new THREE.CylinderGeometry(0.4, 0.5, 12, 8);
    var towerMat = new THREE.MeshStandardMaterial({ color: colors.pipe, metalness: 0.8 });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(x, 6, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    meshes.push(tower);

    // Flare head (cone)
    var flareGeom = new THREE.ConeGeometry(1.2, 2, 8);
    var flareMat = new THREE.MeshStandardMaterial({ color: colors.equipment });
    var flare = new THREE.Mesh(flareGeom, flareMat);
    flare.position.set(x, 13, z);
    flare.castShadow = true;
    flare.receiveShadow = true;
    scene.add(flare);
    meshes.push(flare);

    // Fire effect at top
    var fireGeom = new THREE.SphereGeometry(1.5, 8, 8);
    var fireMat = new THREE.MeshBasicMaterial({ color: colors.fire });
    var fireTop = new THREE.Mesh(fireGeom, fireMat);
    fireTop.position.set(x, 14.5, z);
    fireTop.scale.z = 0.6;
    scene.add(fireTop);
    meshes.push(fireTop);

    flares.push({
      mesh: fireTop,
      intensity: 1.0,
      flicker: Math.random()
    });
  }

  function createControlTrailer(x, z) {
    // Building structure (large box)
    var buildGeom = new THREE.BoxGeometry(6, 3, 4);
    var buildMat = new THREE.MeshStandardMaterial({ color: colors.desert });
    var build = new THREE.Mesh(buildGeom, buildMat);
    build.position.set(x, 1.5, z);
    build.castShadow = true;
    build.receiveShadow = true;
    scene.add(build);
    meshes.push(build);

    // Door frame (boxes)
    for (var i = 0; i < 2; i++) {
      var doorGeom = new THREE.BoxGeometry(1, 2, 0.2);
      var doorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var door = new THREE.Mesh(doorGeom, doorMat);
      door.position.set(x - 1.5 + i * 3, 1.5, z + 2);
      door.castShadow = true;
      scene.add(door);
      meshes.push(door);
    }

    // Antenna tower
    var antGeom = new THREE.CylinderGeometry(0.15, 0.15, 4, 6);
    var antMat = new THREE.MeshStandardMaterial({ color: colors.pipe });
    var ant = new THREE.Mesh(antGeom, antMat);
    ant.position.set(x + 3, 4, z);
    ant.castShadow = true;
    scene.add(ant);
    meshes.push(ant);
  }

  function createBurningOilGeyser(x, z) {
    // Wellhead cylinder
    var headGeom = new THREE.CylinderGeometry(1, 1, 1.5, 12);
    var headMat = new THREE.MeshStandardMaterial({ color: colors.oil });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.set(x, 1, z);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    meshes.push(head);

    // Oil spray plume base (dark)
    var plumeGeom = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
    var plumeMat = new THREE.MeshStandardMaterial({ color: colors.oil });
    var plume = new THREE.Mesh(plumeGeom, plumeMat);
    plume.position.set(x, 3, z);
    scene.add(plume);
    meshes.push(plume);

    // Flame effect
    var flameGeom = new THREE.SphereGeometry(1.8, 6, 6);
    var flameMat = new THREE.MeshBasicMaterial({ color: colors.fire });
    var flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.set(x, 5, z);
    flame.scale.y = 2.5;
    scene.add(flame);
    meshes.push(flame);

    geysers.push({
      position: { x: x, z: z },
      flame: flame,
      height: 2.5,
      maxHeight: 3.5,
      minHeight: 1.5,
      phase: Math.random() * Math.PI * 2
    });
  }

  function createCompressionStation(x, z) {
    // Compressor unit (box)
    var compGeom = new THREE.BoxGeometry(3, 2, 2);
    var compMat = new THREE.MeshStandardMaterial({ color: colors.equipment });
    var comp = new THREE.Mesh(compGeom, compMat);
    comp.position.set(x, 1, z);
    comp.castShadow = true;
    comp.receiveShadow = true;
    scene.add(comp);
    meshes.push(comp);

    // Motors (cylinders on top)
    for (var i = 0; i < 3; i++) {
      var motorGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8);
      var motorMat = new THREE.MeshStandardMaterial({ color: colors.pipe, metalness: 0.5 });
      var motor = new THREE.Mesh(motorGeom, motorMat);
      motor.position.set(x - 0.8 + i * 0.8, 2.5, z);
      motor.castShadow = true;
      motor.receiveShadow = true;
      scene.add(motor);
      meshes.push(motor);
    }

    // Exhaust pipe (vertical)
    var exhaustGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
    var exhaustMat = new THREE.MeshStandardMaterial({ color: colors.pipe });
    var exhaust = new THREE.Mesh(exhaustGeom, exhaustMat);
    exhaust.position.set(x + 2, 3, z);
    exhaust.castShadow = true;
    scene.add(exhaust);
    meshes.push(exhaust);
  }

  function createPressureGaugeTower(x, z) {
    // Tower base (cylinder)
    var baseGeom = new THREE.CylinderGeometry(0.6, 0.7, 6, 8);
    var baseMat = new THREE.MeshStandardMaterial({ color: colors.pipe });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(x, 3, z);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    meshes.push(base);

    // Gauge box platform
    var platformGeom = new THREE.BoxGeometry(2, 0.3, 1.5);
    var platformMat = new THREE.MeshStandardMaterial({ color: colors.equipment });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(x, 6.5, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    meshes.push(platform);

    // Gauge spheres (representing pressure gauges)
    for (var i = 0; i < 2; i++) {
      var gaugeGeom = new THREE.SphereGeometry(0.4, 8, 8);
      var gaugeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, metalness: 0.9 });
      var gauge = new THREE.Mesh(gaugeGeom, gaugeMat);
      gauge.position.set(x - 0.6 + i * 1.2, 6.5, z);
      gauge.castShadow = true;
      scene.add(gauge);
      meshes.push(gauge);
    }
  }

  function createWorkerTrailerCamp(x, z) {
    // Multiple trailers (small boxes)
    for (var i = 0; i < 3; i++) {
      var trailerGeom = new THREE.BoxGeometry(4, 2.5, 2.5);
      var trailerMat = new THREE.MeshStandardMaterial({ color: colors.desert });
      var trailer = new THREE.Mesh(trailerGeom, trailerMat);
      trailer.position.set(x + i * 5, 1.25, z);
      trailer.castShadow = true;
      trailer.receiveShadow = true;
      scene.add(trailer);
      meshes.push(trailer);

      // Windows
      for (var j = 0; j < 2; j++) {
        var windowGeom = new THREE.BoxGeometry(0.8, 0.6, 0.1);
        var windowMat = new THREE.MeshStandardMaterial({ color: 0x4488FF });
        var window = new THREE.Mesh(windowGeom, windowMat);
        window.position.set(x - 1.5 + j * 3 + i * 5, 1.8, z + 1.3);
        window.castShadow = true;
        scene.add(window);
        meshes.push(window);
      }
    }
  }

  function createDemolitionCharge(x, z) {
    // Timer device (small box)
    var deviceGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var deviceMat = new THREE.MeshStandardMaterial({ color: colors.darkFire });
    var device = new THREE.Mesh(deviceGeom, deviceMat);
    device.position.set(x, 0.5, z);
    device.castShadow = true;
    scene.add(device);
    meshes.push(device);

    var charge = {
      mesh: device,
      position: { x: x, z: z },
      timeLeft: config.chargeDetonationTime,
      detonated: false
    };
    demolitionCharges.push(charge);
  }

  function createExplosion(x, z) {
    var exploGeom = new THREE.SphereGeometry(2, 8, 8);
    var exploMat = new THREE.MeshBasicMaterial({ color: colors.fire });
    var explo = new THREE.Mesh(exploGeom, exploMat);
    explo.position.set(x, 3, z);
    scene.add(explo);
    meshes.push(explo);

    explosions.push({
      mesh: explo,
      position: { x: x, z: z },
      startSize: 2,
      timeLeft: config.explosionDuration,
      maxSize: 5
    });
  }

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    time = 0;
    meshes = [];
    pumpJacks = [];
    flares = [];
    geysers = [];
    explosions = [];
    fires = [];
    demolitionCharges = [];

    // Pump jack field
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        createPumpJackUnit(-15 + i * 8, -15 + j * 8, (i + j) % 2 === 0 ? 0.1 : -0.1);
      }
    }

    // Storage tank farm
    for (var k = 0; k < config.storageCount; k++) {
      var angle = (k / config.storageCount) * Math.PI * 2;
      var tankX = 25 + Math.cos(angle) * 10;
      var tankZ = 10 + Math.sin(angle) * 10;
      createStorageTank(tankX, tankZ);
    }

    // Pipeline network
    createPipelineSection(-15, -5, 5, 5);
    createPipelineSection(5, 5, 20, 15);
    createPipelineSection(20, 15, 30, 20);
    createPipelineSection(-10, 10, 10, 20);

    // Wellhead manifold
    createWellheadManifold(-8, -8);
    createWellheadManifold(5, -10);

    // Separator unit
    createSeparatorUnit(15, 5);

    // Flare stacks
    createFlareStack(35, 25);
    createFlareStack(40, 5);

    // Control trailer
    createControlTrailer(-25, 20);

    // Burning oil geysers
    for (var g = 0; g < config.geyserCount; g++) {
      var gyX = -20 + g * 15;
      var gyZ = -25;
      createBurningOilGeyser(gyX, gyZ);
    }

    // Compression station
    createCompressionStation(20, -15);

    // Pressure gauge towers
    createPressureGaugeTower(10, -20);
    createPressureGaugeTower(30, -18);

    // Worker trailer camp
    createWorkerTrailerCamp(-30, -30);

    // Initial demolition charges (some plants on equipment)
    createDemolitionCharge(25, 10);
    createDemolitionCharge(-5, -10);
    createDemolitionCharge(30, 18);
  }

  function update(delta) {
    time += delta;

    // Pump jack rocking
    for (var i = 0; i < pumpJacks.length; i++) {
      var pj = pumpJacks[i];
      var rockAngle = Math.sin(time * 1.5 + i * 0.5) * 0.15;
      pj.meshes[0].rotation.z = pj.meshes[0].rotation.z + (rockAngle - pj.rotation) * 0.1;
      pj.rotation = rockAngle;
    }

    // Flare stack fire flickering
    for (var f = 0; f < flares.length; f++) {
      var flare = flares[f];
      flare.flicker += delta * 3;
      var flicker = Math.abs(Math.sin(flare.flicker + time * 5)) * 0.3 + 0.7;
      flare.mesh.scale.set(1 + flicker * 0.2, 1 + flicker * 0.3, 1 + flicker * 0.2);
    }

    // Oil geyser flame varying
    for (var g = 0; g < geysers.length; g++) {
      var geyser = geysers[g];
      geyser.phase += delta;
      var heightFactor = Math.sin(geyser.phase * 1.2) * 0.5 + 0.5;
      geyser.height = geyser.minHeight + (geyser.maxHeight - geyser.minHeight) * heightFactor;
      geyser.flame.scale.y = geyser.height;
      var flameColor = Math.sin(time * 2 + g) > 0 ? colors.fire : colors.darkFire;
      geyser.flame.material.color.setHex(flameColor);
    }

    // Demolition charge timers
    for (var d = 0; d < demolitionCharges.length; d++) {
      var charge = demolitionCharges[d];
      if (!charge.detonated) {
        charge.timeLeft -= delta;
        var pulseIntensity = (charge.timeLeft / config.chargeDetonationTime) * 0.5 + 0.5;
        charge.mesh.scale.set(pulseIntensity, pulseIntensity, pulseIntensity);

        if (charge.timeLeft <= 0) {
          charge.detonated = true;
          createExplosion(charge.position.x, charge.position.z);
          scene.remove(charge.mesh);
        }
      }
    }

    // Explosion effects
    for (var e = 0; e < explosions.length; e++) {
      var explo = explosions[e];
      explo.timeLeft -= delta;
      var progress = 1 - (explo.timeLeft / config.explosionDuration);
      explo.mesh.scale.set(1 + progress * 3, 1 + progress * 3, 1 + progress * 3);
      explo.mesh.material.opacity = 1 - progress;

      if (explo.timeLeft <= 0) {
        scene.remove(explo.mesh);
      }
    }

    // Remove expired explosions
    explosions = explosions.filter(function(e) { return e.timeLeft > 0; });
  }

  function reset() {
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    pumpJacks = [];
    flares = [];
    geysers = [];
    explosions = [];
    fires = [];
    demolitionCharges = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
