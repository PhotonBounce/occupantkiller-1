window.CliffOutpost = (function() {
  'use strict';

  var meshes = [];
  var state = {
    cableCarPosition: 0,
    windTurbineRotation: 0,
    hoistPosition: 0,
    hoistDirection: 1,
    gunBarrelRotation: 0,
    flickerPhase: 0,
    rockPositions: [],
    observationGlowPhase: 0,
    guardPatrolPosition: 0,
    ropeSwayPhase: 0
  };

  var colors = {
    cliffRock: 0x6A6A5A,
    concrete: 0x808080,
    gunMetal: 0x4A4A4A,
    mountainSnow: 0xE8E8E8,
    cableRed: 0xCC0000,
    tunnelDark: 0x2A2A2A,
    steel: 0x5A5A6A,
    outpostYellow: 0xFFCC00
  };

  var spawnPoints = [];

  function init(scene, camera) {
    meshes = [];
    state.cableCarPosition = 0;
    state.windTurbineRotation = 0;
    state.hoistPosition = 0;
    state.hoistDirection = 1;
    state.gunBarrelRotation = 0;
    state.flickerPhase = 0;
    state.rockPositions = [];
    state.observationGlowPhase = 0;
    state.guardPatrolPosition = 0;
    state.ropeSwayPhase = 0;
    spawnPoints = [];

    // Main cliff face - massive vertical rock wall
    var cliffGeometry = new THREE.BoxGeometry(250, 450, 80);
    var cliffMaterial = new THREE.MeshStandardMaterial({
      color: colors.cliffRock,
      roughness: 0.9,
      metalness: 0.1
    });
    var cliffFace = new THREE.Mesh(cliffGeometry, cliffMaterial);
    cliffFace.position.set(0, 100, -150);
    scene.add(cliffFace);
    meshes.push(cliffFace);

    // Mountain peak above outpost
    var peakGeometry = new THREE.ConeGeometry(180, 320, 12);
    var peakMaterial = new THREE.MeshStandardMaterial({
      color: colors.mountainSnow,
      roughness: 0.8,
      metalness: 0
    });
    var peak = new THREE.Mesh(peakGeometry, peakMaterial);
    peak.position.set(0, 400, -200);
    scene.add(peak);
    meshes.push(peak);

    // Cliff edge ledge - upper right
    var ledgeGeometry = new THREE.BoxGeometry(120, 15, 40);
    var ledgeMaterial = new THREE.MeshStandardMaterial({
      color: colors.cliffRock,
      roughness: 0.85
    });
    var ledge = new THREE.Mesh(ledgeGeometry, ledgeMaterial);
    ledge.position.set(80, 220, -140);
    scene.add(ledge);
    meshes.push(ledge);

    // Gun emplacement bay 1 - upper left
    var gunBayGeometry = new THREE.BoxGeometry(50, 45, 70);
    var gunBayMaterial = new THREE.MeshStandardMaterial({
      color: colors.concrete,
      roughness: 0.7
    });
    var gunBay1 = new THREE.Mesh(gunBayGeometry, gunBayMaterial);
    gunBay1.position.set(-90, 160, -100);
    scene.add(gunBay1);
    meshes.push(gunBay1);

    // Gun barrel 1
    var barrelGeometry = new THREE.CylinderGeometry(8, 8, 120, 8);
    var barrelMaterial = new THREE.MeshStandardMaterial({
      color: colors.gunMetal,
      roughness: 0.3,
      metalness: 0.9
    });
    var barrel1 = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel1.position.set(-90, 180, -30);
    barrel1.rotation.z = 0.3;
    scene.add(barrel1);
    meshes.push(barrel1);

    // Gun emplacement bay 2 - middle right
    var gunBay2 = new THREE.Mesh(gunBayGeometry, gunBayMaterial);
    gunBay2.position.set(100, 100, -100);
    scene.add(gunBay2);
    meshes.push(gunBay2);

    // Gun barrel 2
    var barrel2 = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel2.position.set(100, 120, -30);
    barrel2.rotation.z = -0.25;
    scene.add(barrel2);
    meshes.push(barrel2);

    // Gun emplacement bay 3 - lower center
    var gunBay3 = new THREE.Mesh(gunBayGeometry, gunBayMaterial);
    gunBay3.position.set(20, 20, -100);
    scene.add(gunBay3);
    meshes.push(gunBay3);

    // Gun barrel 3
    var barrel3 = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel3.position.set(20, 40, -30);
    barrel3.rotation.z = 0.15;
    scene.add(barrel3);
    meshes.push(barrel3);

    // Tunnel entrance - dark opening in cliff face
    var tunnelEntranceGeometry = new THREE.BoxGeometry(60, 80, 20);
    var tunnelMaterial = new THREE.MeshStandardMaterial({
      color: colors.tunnelDark,
      roughness: 0.95,
      metalness: 0
    });
    var tunnelEntrance = new THREE.Mesh(tunnelEntranceGeometry, tunnelMaterial);
    tunnelEntrance.position.set(-70, 50, -140);
    scene.add(tunnelEntrance);
    meshes.push(tunnelEntrance);
    spawnPoints.push({x: -70, y: 100, z: -80});

    // Tunnel interior corridor 1
    var corridorGeometry = new THREE.BoxGeometry(50, 50, 150);
    var corridorMaterial = new THREE.MeshStandardMaterial({
      color: colors.tunnelDark,
      roughness: 0.8,
      metalness: 0.1
    });
    var corridor1 = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor1.position.set(-70, 50, 0);
    scene.add(corridor1);
    meshes.push(corridor1);

    // Tunnel interior corridor 2
    var corridor2 = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor2.position.set(-70, 50, 150);
    scene.add(corridor2);
    meshes.push(corridor2);
    spawnPoints.push({x: -70, y: 80, z: 150});

    // Command room inside cliff
    var commandRoomGeometry = new THREE.BoxGeometry(70, 60, 80);
    var commandMaterial = new THREE.MeshStandardMaterial({
      color: colors.concrete,
      roughness: 0.6
    });
    var commandRoom = new THREE.Mesh(commandRoomGeometry, commandMaterial);
    commandRoom.position.set(40, 120, 80);
    scene.add(commandRoom);
    meshes.push(commandRoom);
    spawnPoints.push({x: 40, y: 150, z: 80});

    // Command room screen panel 1
    var screenGeometry = new THREE.BoxGeometry(40, 25, 3);
    var screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A,
      roughness: 0.2,
      metalness: 0.3
    });
    var screen1 = new THREE.Mesh(screenGeometry, screenMaterial);
    screen1.position.set(20, 135, 120);
    scene.add(screen1);
    meshes.push(screen1);

    // Command room screen panel 2
    var screen2 = new THREE.Mesh(screenGeometry, screenMaterial);
    screen2.position.set(55, 135, 120);
    scene.add(screen2);
    meshes.push(screen2);

    // Cable car station building
    var stationGeometry = new THREE.BoxGeometry(80, 50, 60);
    var stationMaterial = new THREE.MeshStandardMaterial({
      color: colors.concrete,
      roughness: 0.7
    });
    var station = new THREE.Mesh(stationGeometry, stationMaterial);
    station.position.set(120, 180, 20);
    scene.add(station);
    meshes.push(station);
    spawnPoints.push({x: 120, y: 220, z: 20});

    // Cable car pulley wheel
    var pulleyGeometry = new THREE.CylinderGeometry(25, 25, 8, 16);
    var pulleyMaterial = new THREE.MeshStandardMaterial({
      color: colors.steel,
      roughness: 0.5,
      metalness: 0.8
    });
    var pulley = new THREE.Mesh(pulleyGeometry, pulleyMaterial);
    pulley.position.set(120, 230, 0);
    pulley.rotation.z = Math.PI / 2;
    scene.add(pulley);
    meshes.push(pulley);

    // Cable car vehicle
    var carGeometry = new THREE.BoxGeometry(35, 30, 35);
    var carMaterial = new THREE.MeshStandardMaterial({
      color: colors.cableRed,
      roughness: 0.4,
      metalness: 0.6
    });
    var cableCar = new THREE.Mesh(carGeometry, carMaterial);
    cableCar.position.set(120, 150, 0);
    cableCar.userData.isMoving = true;
    scene.add(cableCar);
    meshes.push(cableCar);

    // Cable line from station to cliff
    var cablePoints = [
      new THREE.Vector3(120, 230, 0),
      new THREE.Vector3(0, 150, -120)
    ];
    var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({color: colors.cableRed, linewidth: 3});
    var cableLine = new THREE.LineSegments(cableGeometry, cableMaterial);
    scene.add(cableLine);
    meshes.push(cableLine);

    // Ammunition hoist cage
    var hoistGeometry = new THREE.BoxGeometry(30, 40, 30);
    var hoistMaterial = new THREE.MeshStandardMaterial({
      color: colors.steel,
      roughness: 0.4,
      metalness: 0.7
    });
    var hoist = new THREE.Mesh(hoistGeometry, hoistMaterial);
    hoist.position.set(60, 80, -160);
    hoist.userData.isHoist = true;
    scene.add(hoist);
    meshes.push(hoist);

    // Hoist cable
    var hoistCablePoints = [
      new THREE.Vector3(60, 200, -160),
      new THREE.Vector3(60, 80, -160)
    ];
    var hoistCableGeometry = new THREE.BufferGeometry().setFromPoints(hoistCablePoints);
    var hoistCableLine = new THREE.LineSegments(hoistCableGeometry, cableMaterial);
    scene.add(hoistCableLine);
    meshes.push(hoistCableLine);

    // Observation window slit 1
    var slitGeometry = new THREE.BoxGeometry(80, 8, 12);
    var slitMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A,
      emissive: colors.outpostYellow,
      emissiveIntensity: 0.3,
      roughness: 0.3
    });
    var slit1 = new THREE.Mesh(slitGeometry, slitMaterial);
    slit1.position.set(-50, 240, -130);
    slit1.userData.isSlit = true;
    scene.add(slit1);
    meshes.push(slit1);

    // Observation window slit 2
    var slit2 = new THREE.Mesh(slitGeometry, slitMaterial);
    slit2.position.set(60, 240, -130);
    slit2.userData.isSlit = true;
    scene.add(slit2);
    meshes.push(slit2);

    // Rappelling anchor point 1
    var anchorGeometry = new THREE.CylinderGeometry(4, 4, 15, 6);
    var anchorMaterial = new THREE.MeshStandardMaterial({
      color: colors.steel,
      roughness: 0.3,
      metalness: 0.95
    });
    var anchor1 = new THREE.Mesh(anchorGeometry, anchorMaterial);
    anchor1.position.set(-120, 180, -140);
    scene.add(anchor1);
    meshes.push(anchor1);

    // Rappelling rope 1
    var ropePoints1 = [
      new THREE.Vector3(-120, 180, -140),
      new THREE.Vector3(-120, 20, -140)
    ];
    var ropeGeometry1 = new THREE.BufferGeometry().setFromPoints(ropePoints1);
    var ropeMaterial = new THREE.LineBasicMaterial({color: 0xFFFFFF, linewidth: 2});
    var rope1 = new THREE.LineSegments(ropeGeometry1, ropeMaterial);
    rope1.userData.isRope = true;
    scene.add(rope1);
    meshes.push(rope1);

    // Rappelling anchor point 2
    var anchor2 = new THREE.Mesh(anchorGeometry, anchorMaterial);
    anchor2.position.set(100, 220, -140);
    scene.add(anchor2);
    meshes.push(anchor2);

    // Rappelling rope 2
    var ropePoints2 = [
      new THREE.Vector3(100, 220, -140),
      new THREE.Vector3(100, 40, -140)
    ];
    var ropeGeometry2 = new THREE.BufferGeometry().setFromPoints(ropePoints2);
    var rope2 = new THREE.LineSegments(ropeGeometry2, ropeMaterial);
    rope2.userData.isRope = true;
    scene.add(rope2);
    meshes.push(rope2);

    // Ammunition storage cave entrance
    var caveGeometry = new THREE.BoxGeometry(90, 70, 60);
    var caveMaterial = new THREE.MeshStandardMaterial({
      color: colors.tunnelDark,
      roughness: 0.9,
      metalness: 0
    });
    var cave = new THREE.Mesh(caveGeometry, caveMaterial);
    cave.position.set(-120, 80, 180);
    scene.add(cave);
    meshes.push(cave);
    spawnPoints.push({x: -120, y: 100, z: 180});

    // Ammunition crate 1
    var crateGeometry = new THREE.BoxGeometry(30, 25, 35);
    var crateMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A4A00,
      roughness: 0.8,
      metalness: 0.1
    });
    var crate1 = new THREE.Mesh(crateGeometry, crateMaterial);
    crate1.position.set(-150, 95, 160);
    scene.add(crate1);
    meshes.push(crate1);

    // Ammunition crate 2
    var crate2 = new THREE.Mesh(crateGeometry, crateMaterial);
    crate2.position.set(-120, 95, 180);
    scene.add(crate2);
    meshes.push(crate2);

    // Wind turbine mast
    var mastGeometry = new THREE.CylinderGeometry(5, 8, 200, 8);
    var mastMaterial = new THREE.MeshStandardMaterial({
      color: colors.steel,
      roughness: 0.5,
      metalness: 0.8
    });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(-150, 250, -80);
    scene.add(mast);
    meshes.push(mast);

    // Wind turbine blade 1
    var bladeGeometry = new THREE.BoxGeometry(15, 80, 5);
    var bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xEEEEEE,
      roughness: 0.6,
      metalness: 0.3
    });
    var blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade1.position.set(-150, 280, -80);
    blade1.userData.isBlade = true;
    scene.add(blade1);
    meshes.push(blade1);

    // Wind turbine blade 2
    var blade2 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade2.position.set(-150, 280, -80);
    blade2.rotation.z = Math.PI / 3;
    blade2.userData.isBlade = true;
    scene.add(blade2);
    meshes.push(blade2);

    // Wind turbine blade 3
    var blade3 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade3.position.set(-150, 280, -80);
    blade3.rotation.z = (Math.PI * 2) / 3;
    blade3.userData.isBlade = true;
    scene.add(blade3);
    meshes.push(blade3);

    // Perimeter guard position on ledge
    var guardBoxGeometry = new THREE.BoxGeometry(20, 25, 15);
    var guardMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.2
    });
    var guardPost = new THREE.Mesh(guardBoxGeometry, guardMaterial);
    guardPost.position.set(80, 240, -140);
    guardPost.userData.isGuard = true;
    scene.add(guardPost);
    meshes.push(guardPost);

    // Ammunition storage in command room
    var ammoBoxGeometry = new THREE.BoxGeometry(25, 20, 25);
    var ammoMaterial = new THREE.MeshStandardMaterial({
      color: 0x5A5A00,
      roughness: 0.8,
      metalness: 0.1
    });
    var ammoBox = new THREE.Mesh(ammoBoxGeometry, ammoMaterial);
    ammoBox.position.set(60, 100, 100);
    scene.add(ammoBox);
    meshes.push(ammoBox);

    // Cliff base spawn area
    spawnPoints.push({x: 0, y: 10, z: -150});

    // Gun emplacement spawn
    spawnPoints.push({x: 100, y: 50, z: -100});
  }

  function update(delta) {
    // Move cable car smoothly along cable path
    state.cableCarPosition += delta * 0.3;
    if (state.cableCarPosition > 1) {
      state.cableCarPosition = 0;
    }

    var cableCarMesh = meshes.find(function(m) {
      return m.userData.isMoving;
    });
    if (cableCarMesh) {
      cableCarMesh.position.x = 120 - (state.cableCarPosition * 120);
      cableCarMesh.position.y = 150 + (state.cableCarPosition * 80);
      cableCarMesh.position.z = delta * 10 - 120;
    }

    // Spin wind turbine blades very fast
    state.windTurbineRotation += delta * 8;
    meshes.forEach(function(mesh) {
      if (mesh.userData.isBlade) {
        mesh.rotation.x = state.windTurbineRotation;
      }
    });

    // Track gun barrels toward threat
    state.gunBarrelRotation += delta * 0.5;
    var barrelRotationValue = Math.sin(state.gunBarrelRotation) * 0.3;
    var barrelIndex = 0;
    meshes.forEach(function(mesh, index) {
      if (mesh.geometry instanceof THREE.CylinderGeometry) {
        if (mesh.position.y > 100 && mesh.position.x < 50) {
          mesh.rotation.y = barrelRotationValue;
          barrelIndex++;
        }
      }
    });

    // Flicker tunnel lights
    state.flickerPhase += delta * 8;
    meshes.forEach(function(mesh) {
      if (mesh.userData.isSlit) {
        var flicker = Math.sin(state.flickerPhase) * 0.5 + 0.5;
        mesh.material.emissiveIntensity = flicker * 0.5;
      }
    });

    // Hoist ascending and descending
    state.hoistPosition += delta * state.hoistDirection * 0.4;
    if (state.hoistPosition > 1 || state.hoistPosition < 0) {
      state.hoistDirection *= -1;
    }

    var hoistMesh = meshes.find(function(m) {
      return m.userData.isHoist;
    });
    if (hoistMesh) {
      hoistMesh.position.y = 80 + (state.hoistPosition * 120);
    }

    // Rappelling ropes sway in wind
    state.ropeSwayPhase += delta * 2;
    meshes.forEach(function(mesh) {
      if (mesh.userData.isRope) {
        var sway = Math.sin(state.ropeSwayPhase) * 15;
        mesh.position.x += sway * delta;
      }
    });

    // Guard patrol on ledge
    state.guardPatrolPosition += delta * 0.3;
    if (state.guardPatrolPosition > 1) {
      state.guardPatrolPosition = 0;
    }

    var guardMesh = meshes.find(function(m) {
      return m.userData.isGuard;
    });
    if (guardMesh) {
      guardMesh.position.x = 60 + (state.guardPatrolPosition * 40);
    }

    // Generate and animate falling rocks from mountain
    while (state.rockPositions.length < 8) {
      state.rockPositions.push({
        x: -150 + Math.random() * 300,
        y: 350 + Math.random() * 100,
        z: -200 + Math.random() * 100,
        vx: (Math.random() - 0.5) * 20,
        vy: -50 - Math.random() * 30,
        vz: (Math.random() - 0.5) * 15,
        lifespan: 0
      });
    }

    for (var i = state.rockPositions.length - 1; i >= 0; i--) {
      var rock = state.rockPositions[i];
      rock.lifespan += delta;
      rock.y += rock.vy * delta;
      rock.x += rock.vx * delta;
      rock.z += rock.vz * delta;
      rock.vy -= 30 * delta;

      if (rock.y < -50 || rock.lifespan > 8) {
        state.rockPositions.splice(i, 1);
      }
    }

    // Observation slit glow cycling
    state.observationGlowPhase += delta * 3;
    meshes.forEach(function(mesh) {
      if (mesh.userData.isSlit) {
        var glowCycle = Math.abs(Math.sin(state.observationGlowPhase)) * 0.6;
        mesh.material.emissive.setHex(Math.floor(colors.outpostYellow * glowCycle));
      }
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          mesh.material.dispose();
        }
      }
    });
    meshes = [];
    state = {
      cableCarPosition: 0,
      windTurbineRotation: 0,
      hoistPosition: 0,
      hoistDirection: 1,
      gunBarrelRotation: 0,
      flickerPhase: 0,
      rockPositions: [],
      observationGlowPhase: 0,
      guardPatrolPosition: 0,
      ropeSwayPhase: 0
    };
    spawnPoints = [];
  }

  function getSpawnPoints() {
    return spawnPoints;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: getSpawnPoints
  };
}());
