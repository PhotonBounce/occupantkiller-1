window.ArmsFactory = (function() {
  'use strict';

  var state = {
    meshes: [],
    conveyor: null,
    press: null,
    forklift: null,
    smokestack: null,
    crane: null,
    welders: [],
    guards: [],
    cameras: [],
    spawnPoints: []
  };

  var colors = {
    floor: 0x666666,
    machinery: 0xCC2200,
    steel: 0x778899,
    warning: 0xFFCC00,
    wood: 0x8B6914,
    sparks: 0xFF8800,
    wall: 0x333333,
    window: 0x1E90FF,
    concrete: 0x555555
  };

  function createBox(x, y, z, w, h, d, color) {
    var geom = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshPhongMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    state.meshes.push(mesh);
    return mesh;
  }

  function createCylinder(x, y, z, rTop, rBot, h, color) {
    var geom = new THREE.CylinderGeometry(rTop, rBot, h, 32);
    var mat = new THREE.MeshPhongMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    state.meshes.push(mesh);
    return mesh;
  }

  function createSphere(x, y, z, r, color) {
    var geom = new THREE.SphereGeometry(r, 16, 16);
    var mat = new THREE.MeshPhongMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    state.meshes.push(mesh);
    return mesh;
  }

  function createCone(x, y, z, rBase, h, color) {
    var geom = new THREE.ConeGeometry(rBase, h, 32);
    var mat = new THREE.MeshPhongMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    state.meshes.push(mesh);
    return mesh;
  }

  function createFactoryFloor(scene) {
    var floor = createBox(0, 0, 0, 200, 0.5, 150, colors.floor);
    floor.receiveShadow = true;

    var wallNorth = createBox(0, 20, -75, 200, 40, 1, colors.wall);
    var wallSouth = createBox(0, 20, 75, 200, 40, 1, colors.wall);
    var wallEast = createBox(100, 20, 0, 1, 40, 150, colors.wall);
    var wallWest = createBox(-100, 20, 0, 1, 40, 150, colors.wall);

    var ceiling = createBox(0, 40, 0, 200, 1, 150, colors.concrete);
  }

  function createAssemblyLine(scene) {
    var beltBase = createBox(-40, 2, 0, 80, 0.5, 8, colors.machinery);
    state.conveyor = beltBase;

    var roller1 = createCylinder(-35, 2, 0, 0.4, 0.4, 8, colors.steel);
    var roller2 = createCylinder(-25, 2, 0, 0.4, 0.4, 8, colors.steel);
    var roller3 = createCylinder(-15, 2, 0, 0.4, 0.4, 8, colors.steel);
    var roller4 = createCylinder(-5, 2, 0, 0.4, 0.4, 8, colors.steel);
    var roller5 = createCylinder(5, 2, 0, 0.4, 0.4, 8, colors.steel);
    var roller6 = createCylinder(15, 2, 0, 0.4, 0.4, 8, colors.steel);
    var roller7 = createCylinder(25, 2, 0, 0.4, 0.4, 8, colors.steel);
    var roller8 = createCylinder(35, 2, 0, 0.4, 0.4, 8, colors.steel);

    var frameLeft = createBox(-40, 4, -6, 80, 1, 0.5, colors.steel);
    var frameRight = createBox(-40, 4, 6, 80, 1, 0.5, colors.steel);

    state.spawnPoints.push({ x: -45, y: 1, z: 0 });
  }

  function createWeaponRacks(scene) {
    for (var i = 0; i < 4; i++) {
      var rackX = -50 + i * 40;
      var rackFrame = createBox(rackX, 8, 20, 12, 16, 2, colors.steel);

      for (var j = 0; j < 5; j++) {
        var barrelY = 2 + j * 3;
        var barrel = createCylinder(rackX, barrelY, 20.5, 0.3, 0.3, 8, colors.machinery);
        barrel.rotation.z = Math.PI / 2;
      }
    }

    state.spawnPoints.push({ x: -50, y: 1, z: 20 });
  }

  function createHydraulicPress(scene) {
    var baseFrame = createBox(50, 3, 0, 15, 1, 12, colors.steel);

    var pressPlate = createBox(50, 15, 0, 12, 2, 10, colors.machinery);
    state.press = pressPlate;

    var hydraulic1 = createCylinder(45, 8, -3, 1, 1, 12, colors.steel);
    var hydraulic2 = createCylinder(55, 8, 3, 1, 1, 12, colors.steel);

    var motorBase = createBox(50, 18, 0, 6, 3, 6, colors.machinery);

    state.spawnPoints.push({ x: 50, y: 1, z: -10 });
  }

  function createForklift(scene) {
    var body = createBox(30, 3, -40, 6, 4, 8, colors.machinery);
    body.userData.type = 'forklift';

    var cabin = createBox(28, 6, -40, 4, 3, 4, colors.steel);

    var wheel1 = createCylinder(26, 2, -36, 1.2, 1.2, 2, colors.wall);
    var wheel2 = createCylinder(26, 2, -44, 1.2, 1.2, 2, colors.wall);
    var wheel3 = createCylinder(34, 2, -36, 1.2, 1.2, 2, colors.wall);
    var wheel4 = createCylinder(34, 2, -44, 1.2, 1.2, 2, colors.wall);

    var forkLeft = createBox(32, 4, -38, 1, 4, 2, colors.steel);
    var forkRight = createBox(32, 4, -42, 1, 4, 2, colors.steel);

    state.forklift = body;
    state.spawnPoints.push({ x: 30, y: 1, z: -40 });
  }

  function createShippingCrates(scene) {
    var cratePositions = [
      { x: -20, y: 3, z: -50 },
      { x: -15, y: 3, z: -50 },
      { x: -10, y: 3, z: -50 },
      { x: -20, y: 9, z: -50 },
      { x: -15, y: 9, z: -50 },
      { x: 0, y: 3, z: -55 },
      { x: 5, y: 3, z: -55 },
      { x: 10, y: 3, z: -55 },
      { x: 0, y: 9, z: -55 },
      { x: 5, y: 9, z: -55 }
    ];

    for (var i = 0; i < cratePositions.length; i++) {
      var pos = cratePositions[i];
      var crate = createBox(pos.x, pos.y, pos.z, 4, 5, 4, colors.wood);
      var crateStencil = createBox(pos.x, pos.y, pos.z, 3.8, 4.8, 3.8, colors.warning);
    }

    state.spawnPoints.push({ x: -15, y: 1, z: -50 });
  }

  function createLoadingBay(scene) {
    var bayFloor = createBox(80, 0.5, 50, 30, 0.25, 20, colors.concrete);

    var doorLeft = createBox(75, 10, 45, 8, 15, 0.5, colors.machinery);
    var doorRight = createBox(85, 10, 45, 8, 15, 0.5, colors.machinery);

    var dock = createBox(80, 2, 60, 30, 0.5, 5, colors.warning);

    var ramp1 = createBox(80, 1.5, 70, 30, 1, 10, colors.concrete);

    state.spawnPoints.push({ x: 80, y: 1, z: 50 });
  }

  function createSmokestack(scene) {
    var stack = createCylinder(70, 25, 30, 4, 4, 30, colors.machinery);
    state.smokestack = stack;

    var cap = createCone(70, 40, 30, 4.5, 3, colors.steel);
  }

  function createOverheadCrane(scene) {
    var beamLong = createBox(0, 38, 0, 180, 1, 2, colors.steel);
    var beamLeft = createBox(-80, 38, 0, 2, 1, 150, colors.steel);
    var beamRight = createBox(80, 38, 0, 2, 1, 150, colors.steel);

    var trolley = createBox(0, 35, 0, 8, 2, 8, colors.machinery);
    state.crane = trolley;

    var hook = createCylinder(0, 30, 0, 0.5, 0.5, 8, colors.steel);
  }

  function createSecurityRoom(scene) {
    var roomBase = createBox(-85, 15, 40, 20, 15, 15, colors.wall);

    var windowPanel = createBox(-95, 18, 40, 1, 8, 8, colors.window);

    var controlDesk = createBox(-80, 8, 35, 12, 3, 6, colors.steel);

    var monitorStand = createCylinder(-82, 12, 35, 1, 1, 4, colors.steel);

    var camera1 = createBox(-90, 20, 35, 2, 2, 2, colors.wall);
    var camera2 = createBox(-75, 20, 40, 2, 2, 2, colors.wall);

    state.cameras.push({ mesh: camera1, angle: 0 });
    state.cameras.push({ mesh: camera2, angle: Math.PI });

    state.spawnPoints.push({ x: -80, y: 1, z: 40 });
  }

  function createExitGates(scene) {
    var gateFrame = createBox(-95, 12, -60, 8, 18, 2, colors.steel);
    var gateDoor = createBox(-95, 12, -60.5, 6, 16, 1, colors.machinery);

    var exitSign = createBox(-95, 18, -60, 4, 2, 0.5, colors.warning);
  }

  function createWeldingStations(scene) {
    var stations = [
      { x: -60, z: -20 },
      { x: -20, z: -30 },
      { x: 20, z: -15 },
      { x: 60, z: -25 }
    ];

    for (var i = 0; i < stations.length; i++) {
      var station = stations[i];
      var table = createBox(station.x, 3, station.z, 8, 1, 6, colors.steel);
      var arm = createCylinder(station.x, 6, station.z, 0.5, 0.5, 4, colors.machinery);

      var welder = {
        table: table,
        x: station.x,
        z: station.z,
        flashTimer: 0
      };
      state.welders.push(welder);
    }
  }

  function createFireSuppression(scene) {
    var sprinklers = [
      { x: -60, y: 39, z: -40 },
      { x: -20, y: 39, z: -40 },
      { x: 20, y: 39, z: -40 },
      { x: 60, y: 39, z: -40 },
      { x: -60, y: 39, z: 0 },
      { x: -20, y: 39, z: 0 },
      { x: 20, y: 39, z: 0 },
      { x: 60, y: 39, z: 0 },
      { x: -60, y: 39, z: 40 },
      { x: -20, y: 39, z: 40 },
      { x: 20, y: 39, z: 40 },
      { x: 60, y: 39, z: 40 }
    ];

    for (var i = 0; i < sprinklers.length; i++) {
      var sprink = sprinklers[i];
      var head = createBox(sprink.x, sprink.y, sprink.z, 0.8, 0.8, 0.8, colors.steel);
      var pipe = createCylinder(sprink.x, sprink.y - 2, sprink.z, 0.15, 0.15, 4, colors.steel);
    }
  }

  function createGuards(scene) {
    var guardStartPos = [
      { x: -80, z: 20 },
      { x: 50, z: 30 },
      { x: 0, z: -45 }
    ];

    for (var i = 0; i < guardStartPos.length; i++) {
      var pos = guardStartPos[i];
      var guard = {
        body: createBox(pos.x, 2.5, pos.z, 1, 5, 1, colors.machinery),
        x: pos.x,
        z: pos.z,
        angle: 0,
        patrolDist: 20,
        alert: false
      };
      state.guards.push(guard);
    }
  }

  function createWarningMarking(scene) {
    var markings = [
      { x: -40, z: -30 },
      { x: 0, z: -20 },
      { x: 40, z: 10 }
    ];

    for (var i = 0; i < markings.length; i++) {
      var mark = markings[i];
      var stripe1 = createBox(mark.x, 0.3, mark.z, 10, 0.1, 2, colors.warning);
      var stripe2 = createBox(mark.x, 0.3, mark.z + 3, 10, 0.1, 2, colors.warning);
    }
  }

  function init(scene, camera) {
    state.meshes = [];
    state.welders = [];
    state.guards = [];
    state.cameras = [];
    state.spawnPoints = [];

    createFactoryFloor(scene);
    createAssemblyLine(scene);
    createWeaponRacks(scene);
    createHydraulicPress(scene);
    createForklift(scene);
    createShippingCrates(scene);
    createLoadingBay(scene);
    createSmokestack(scene);
    createOverheadCrane(scene);
    createSecurityRoom(scene);
    createExitGates(scene);
    createWeldingStations(scene);
    createFireSuppression(scene);
    createGuards(scene);
    createWarningMarking(scene);

    for (var i = 0; i < state.meshes.length; i++) {
      scene.add(state.meshes[i]);
    }

    if (state.spawnPoints.length === 0) {
      state.spawnPoints.push({ x: 0, y: 1, z: 0 });
    }
  }

  function updateConveyorBelt(delta) {
    if (state.conveyor) {
      state.conveyor.userData.beltOffset = (state.conveyor.userData.beltOffset || 0) + delta * 2;
    }
  }

  function updateHydraulicPress(delta) {
    if (state.press) {
      state.press.userData.pressTime = (state.press.userData.pressTime || 0) + delta;
      var cycle = state.press.userData.pressTime % 3;
      if (cycle < 1.5) {
        state.press.position.y = 15 - cycle * 2;
      } else {
        state.press.position.y = 15 - (3 - cycle) * 2;
      }
    }
  }

  function updateForklift(delta) {
    if (state.forklift) {
      state.forklift.userData.forkTime = (state.forklift.userData.forkTime || 0) + delta;
      var forkCycle = state.forklift.userData.forkTime % 6;
      if (forkCycle < 2) {
        state.forklift.position.x = 30 + forkCycle * 1.5;
      } else if (forkCycle < 4) {
        state.forklift.position.x = 33 - (forkCycle - 2) * 1.5;
      }
    }
  }

  function updateSmokestack(delta, scene) {
    if (state.smokestack) {
      state.smokestack.userData.smokeTime = (state.smokestack.userData.smokeTime || 0) + delta;
      var smokePhase = state.smokestack.userData.smokeTime;
      if (Math.floor(smokePhase * 2) % 3 === 0) {
        var particleX = 70 + (Math.random() - 0.5) * 3;
        var particleZ = 30 + (Math.random() - 0.5) * 3;
        var particle = createSphere(particleX, 42 + Math.random() * 3, particleZ, 0.8, 0x999999);
        particle.userData.smokeParticle = true;
        particle.userData.age = 0;
      }
    }
  }

  function updateWelders(delta, scene) {
    for (var i = 0; i < state.welders.length; i++) {
      var welder = state.welders[i];
      welder.flashTimer = (welder.flashTimer || 0) + delta;
      if (welder.flashTimer > 0.5) {
        welder.flashTimer = 0;
        var flashLight = new THREE.PointLight(colors.sparks, 0.8, 15);
        flashLight.position.set(welder.x, 8, welder.z);
        flashLight.userData.flashLife = 0.1;
        scene.add(flashLight);
      }
    }
  }

  function updateSecurityCameras(delta) {
    for (var i = 0; i < state.cameras.length; i++) {
      var cam = state.cameras[i];
      cam.angle = (cam.angle || 0) + delta * 0.5;
      cam.mesh.rotation.y = Math.sin(cam.angle) * 0.3;
    }
  }

  function updateGuards(delta) {
    for (var i = 0; i < state.guards.length; i++) {
      var guard = state.guards[i];
      guard.patrolTime = (guard.patrolTime || 0) + delta;
      var patrolPhase = Math.sin(guard.patrolTime * 0.5) * guard.patrolDist;
      guard.body.position.x = guard.x + patrolPhase;
    }
  }

  function update(delta, scene) {
    updateConveyorBelt(delta);
    updateHydraulicPress(delta);
    updateForklift(delta);
    updateSmokestack(delta, scene);
    updateWelders(delta, scene);
    updateSecurityCameras(delta);
    updateGuards(delta);

    for (var i = scene.children.length - 1; i >= 0; i--) {
      var child = scene.children[i];
      if (child.userData && child.userData.flashLife !== undefined) {
        child.userData.flashLife -= delta;
        if (child.userData.flashLife <= 0) {
          scene.remove(child);
        } else {
          child.intensity *= 0.9;
        }
      }
      if (child.userData && child.userData.smokeParticle) {
        child.userData.age = (child.userData.age || 0) + delta;
        if (child.userData.age > 3) {
          scene.remove(child);
        } else {
          child.position.y += delta * 2;
          child.material.opacity = 1 - child.userData.age / 3;
        }
      }
    }
  }

  function reset() {
    for (var i = 0; i < state.meshes.length; i++) {
      state.meshes[i].geometry.dispose();
      state.meshes[i].material.dispose();
    }
    state.meshes = [];
    state.welders = [];
    state.guards = [];
    state.cameras = [];
    state.spawnPoints = [];
    state.conveyor = null;
    state.press = null;
    state.forklift = null;
    state.smokestack = null;
    state.crane = null;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return state.spawnPoints; },
    getMeshes: function() { return state.meshes; },
    getGuards: function() { return state.guards; }
  };
}());
