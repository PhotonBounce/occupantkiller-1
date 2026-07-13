window.CyberFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var neonMaterials = [];
  var animationStates = {};

  var init = function(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    objects = [];
    neonMaterials = [];
    animationStates = {};

    // Neon colors for cyberpunk theme
    var neonCyan = 0x00ffff;
    var neonMagenta = 0xff00ff;
    var neonYellow = 0xffff00;
    var neonGreen = 0x00ff00;
    var neonPurple = 0xff00aa;
    var darkBase = 0x0a0a1a;

    // 1. Massive fortress outer walls
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a3a,
      metalness: 0.9,
      roughness: 0.1,
      emissive: neonCyan,
      emissiveIntensity: 0.2
    });

    var wallGeometry = new THREE.BoxGeometry(200, 80, 20);
    var wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(0, 40, -150);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);
    objects.push(wall1);
    animationStates.wall1 = { phase: 0 };

    var wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.position.set(-150, 40, 0);
    wall2.rotation.y = Math.PI / 2;
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    scene.add(wall2);
    objects.push(wall2);
    animationStates.wall2 = { phase: Math.PI / 2 };

    var wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall3.position.set(150, 40, 0);
    wall3.rotation.y = Math.PI / 2;
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    scene.add(wall3);
    objects.push(wall3);
    animationStates.wall3 = { phase: Math.PI / 2 };

    // 2. Data center towers with streaming light
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f0f2e,
      metalness: 0.8,
      roughness: 0.15,
      emissive: neonMagenta,
      emissiveIntensity: 0.3
    });

    var towerGeometry = new THREE.CylinderGeometry(15, 15, 120, 32);
    var tower1 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower1.position.set(-60, 60, 80);
    tower1.castShadow = true;
    tower1.receiveShadow = true;
    scene.add(tower1);
    objects.push(tower1);
    animationStates.tower1 = { streamOffset: 0, rotation: 0 };

    var tower2 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower2.position.set(60, 60, 80);
    tower2.castShadow = true;
    tower2.receiveShadow = true;
    scene.add(tower2);
    objects.push(tower2);
    animationStates.tower2 = { streamOffset: Math.PI, rotation: 0 };

    // 3. Holographic barrier sphere generators
    var barrierMaterial = new THREE.MeshStandardMaterial({
      color: neonGreen,
      metalness: 0.7,
      roughness: 0.3,
      emissive: neonGreen,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.6
    });

    var barrierGeometry = new THREE.SphereGeometry(12, 32, 32);
    var barrier1 = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier1.position.set(-80, 30, -80);
    barrier1.castShadow = true;
    scene.add(barrier1);
    objects.push(barrier1);
    animationStates.barrier1 = { scale: 1, pulse: 0 };

    var barrier2 = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier2.position.set(80, 30, -80);
    barrier2.castShadow = true;
    scene.add(barrier2);
    objects.push(barrier2);
    animationStates.barrier2 = { scale: 1, pulse: Math.PI };

    // 4. Automated defense turrets on walls
    var turretBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.95,
      roughness: 0.05
    });

    var turretBarrelMaterial = new THREE.MeshStandardMaterial({
      color: neonYellow,
      metalness: 0.9,
      roughness: 0.1,
      emissive: neonYellow,
      emissiveIntensity: 0.5
    });

    var turretBaseGeometry = new THREE.CylinderGeometry(8, 8, 4, 32);
    var turret1 = new THREE.Mesh(turretBaseGeometry, turretBaseMaterial);
    turret1.position.set(-40, 75, -140);
    turret1.castShadow = true;
    turret1.receiveShadow = true;
    scene.add(turret1);
    objects.push(turret1);
    animationStates.turret1 = { rotation: 0, pitch: 0 };

    var turretBarrelGeometry = new THREE.CylinderGeometry(2, 2, 20, 16);
    var turretBarrel1 = new THREE.Mesh(turretBarrelGeometry, turretBarrelMaterial);
    turretBarrel1.position.set(-40, 80, -125);
    turretBarrel1.rotation.z = Math.PI / 6;
    turretBarrel1.castShadow = true;
    turretBarrel1.receiveShadow = true;
    scene.add(turretBarrel1);
    objects.push(turretBarrel1);
    animationStates.turretBarrel1 = { charge: 0 };

    var turret2 = new THREE.Mesh(turretBaseGeometry, turretBaseMaterial);
    turret2.position.set(40, 75, -140);
    turret2.castShadow = true;
    turret2.receiveShadow = true;
    scene.add(turret2);
    objects.push(turret2);
    animationStates.turret2 = { rotation: Math.PI, pitch: 0 };

    var turretBarrel2 = new THREE.Mesh(turretBarrelGeometry, turretBarrelMaterial);
    turretBarrel2.position.set(40, 80, -125);
    turretBarrel2.rotation.z = Math.PI / 6;
    turretBarrel2.castShadow = true;
    turretBarrel2.receiveShadow = true;
    scene.add(turretBarrel2);
    objects.push(turretBarrel2);
    animationStates.turretBarrel2 = { charge: Math.PI };

    // 5. Flying surveillance drones
    var droneMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      metalness: 0.85,
      roughness: 0.15,
      emissive: neonCyan,
      emissiveIntensity: 0.3
    });

    var droneBodyGeometry = new THREE.BoxGeometry(6, 3, 8);
    var drone1 = new THREE.Mesh(droneBodyGeometry, droneMaterial);
    drone1.position.set(-100, 100, 0);
    drone1.castShadow = true;
    drone1.receiveShadow = true;
    scene.add(drone1);
    objects.push(drone1);
    animationStates.drone1 = { orbitAngle: 0, orbitRadius: 100, orbitCenter: [-100, 100, 0] };

    var droneRotorGeometry = new THREE.CylinderGeometry(4, 4, 0.5, 8);
    var droneRotor1 = new THREE.Mesh(droneRotorGeometry, droneMaterial);
    droneRotor1.position.set(-100, 103, 0);
    droneRotor1.castShadow = true;
    scene.add(droneRotor1);
    objects.push(droneRotor1);
    animationStates.droneRotor1 = { rotation: 0, parentDrone: drone1 };

    var drone2 = new THREE.Mesh(droneBodyGeometry, droneMaterial);
    drone2.position.set(100, 110, -80);
    drone2.castShadow = true;
    drone2.receiveShadow = true;
    scene.add(drone2);
    objects.push(drone2);
    animationStates.drone2 = { orbitAngle: Math.PI, orbitRadius: 90, orbitCenter: [100, 110, -80] };

    // 6. Energy shield generators on towers
    var shieldEmitterGeometry = new THREE.ConeGeometry(8, 15, 32);
    var shieldEmitterMaterial = new THREE.MeshStandardMaterial({
      color: neonPurple,
      metalness: 0.8,
      roughness: 0.2,
      emissive: neonPurple,
      emissiveIntensity: 0.6
    });

    var shieldEmitter1 = new THREE.Mesh(shieldEmitterGeometry, shieldEmitterMaterial);
    shieldEmitter1.position.set(-60, 130, 80);
    shieldEmitter1.castShadow = true;
    shieldEmitter1.receiveShadow = true;
    scene.add(shieldEmitter1);
    objects.push(shieldEmitter1);
    animationStates.shieldEmitter1 = { pulsePhase: 0, intensity: 0.6 };

    var shieldEmitter2 = new THREE.Mesh(shieldEmitterGeometry, shieldEmitterMaterial);
    shieldEmitter2.position.set(60, 130, 80);
    shieldEmitter2.castShadow = true;
    shieldEmitter2.receiveShadow = true;
    scene.add(shieldEmitter2);
    objects.push(shieldEmitter2);
    animationStates.shieldEmitter2 = { pulsePhase: Math.PI, intensity: 0.6 };

    // 7. Black market bazaar structures below
    var bazaarMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      metalness: 0.5,
      roughness: 0.5,
      emissive: neonYellow,
      emissiveIntensity: 0.2
    });

    var bazaarStallGeometry = new THREE.BoxGeometry(20, 8, 15);
    var bazaarStall1 = new THREE.Mesh(bazaarStallGeometry, bazaarMaterial);
    bazaarStall1.position.set(-70, -20, 100);
    bazaarStall1.castShadow = true;
    bazaarStall1.receiveShadow = true;
    scene.add(bazaarStall1);
    objects.push(bazaarStall1);
    animationStates.bazaarStall1 = { flicker: 0 };

    var bazaarStall2 = new THREE.Mesh(bazaarStallGeometry, bazaarMaterial);
    bazaarStall2.position.set(0, -20, 110);
    bazaarStall2.castShadow = true;
    bazaarStall2.receiveShadow = true;
    scene.add(bazaarStall2);
    objects.push(bazaarStall2);
    animationStates.bazaarStall2 = { flicker: Math.PI / 2 };

    // 8. Hacker den control nodes
    var controlNodeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a2a0a,
      metalness: 0.9,
      roughness: 0.1,
      emissive: neonGreen,
      emissiveIntensity: 0.5
    });

    var controlNodeGeometry = new THREE.BoxGeometry(10, 25, 10);
    var controlNode1 = new THREE.Mesh(controlNodeGeometry, controlNodeMaterial);
    controlNode1.position.set(-50, 20, 130);
    controlNode1.castShadow = true;
    controlNode1.receiveShadow = true;
    scene.add(controlNode1);
    objects.push(controlNode1);
    animationStates.controlNode1 = { scanLine: 0 };

    var controlNode2 = new THREE.Mesh(controlNodeGeometry, controlNodeMaterial);
    controlNode2.position.set(50, 20, 130);
    controlNode2.castShadow = true;
    controlNode2.receiveShadow = true;
    scene.add(controlNode2);
    objects.push(controlNode2);
    animationStates.controlNode2 = { scanLine: Math.PI };

    // 9. EMP cannon on corner tower
    var empBaseGeometry = new THREE.CylinderGeometry(10, 10, 6, 32);
    var empBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.95,
      roughness: 0.05
    });

    var empBase = new THREE.Mesh(empBaseGeometry, empBaseMaterial);
    empBase.position.set(-140, 85, -130);
    empBase.castShadow = true;
    empBase.receiveShadow = true;
    scene.add(empBase);
    objects.push(empBase);
    animationStates.empBase = { charge: 0 };

    var empCoilGeometry = new THREE.SphereGeometry(8, 16, 16);
    var empCoilMaterial = new THREE.MeshStandardMaterial({
      color: neonYellow,
      metalness: 0.8,
      roughness: 0.2,
      emissive: neonYellow,
      emissiveIntensity: 0.7
    });

    var empCoil = new THREE.Mesh(empCoilGeometry, empCoilMaterial);
    empCoil.position.set(-140, 95, -130);
    empCoil.castShadow = true;
    scene.add(empCoil);
    objects.push(empCoil);
    animationStates.empCoil = { chargeIntensity: 0 };

    // 10. Neon sign structures (vertical lines for signage)
    var neonLineMaterial = new THREE.LineBasicMaterial({
      color: neonMagenta,
      linewidth: 3,
      emissive: neonMagenta
    });

    var signPoints1 = [];
    signPoints1.push(new THREE.Vector3(-100, 50, 150));
    signPoints1.push(new THREE.Vector3(-100, 80, 150));
    var signGeometry1 = new THREE.BufferGeometry().setFromPoints(signPoints1);
    var neonSign1 = new THREE.LineSegments(signGeometry1, neonLineMaterial);
    scene.add(neonSign1);
    objects.push(neonSign1);
    animationStates.neonSign1 = { flicker: 0 };

    var neonLineMaterial2 = new THREE.LineBasicMaterial({
      color: neonCyan,
      linewidth: 3,
      emissive: neonCyan
    });

    var signPoints2 = [];
    signPoints2.push(new THREE.Vector3(100, 50, 150));
    signPoints2.push(new THREE.Vector3(100, 80, 150));
    var signGeometry2 = new THREE.BufferGeometry().setFromPoints(signPoints2);
    var neonSign2 = new THREE.LineSegments(signGeometry2, neonLineMaterial2);
    scene.add(neonSign2);
    objects.push(neonSign2);
    animationStates.neonSign2 = { flicker: Math.PI / 2 };

    // 11. Additional drone for orbital variety
    var drone3 = new THREE.Mesh(droneBodyGeometry, droneMaterial);
    drone3.position.set(0, 120, 100);
    drone3.castShadow = true;
    drone3.receiveShadow = true;
    scene.add(drone3);
    objects.push(drone3);
    animationStates.drone3 = { orbitAngle: Math.PI * 1.5, orbitRadius: 80, orbitCenter: [0, 120, 100] };

    // 12. Secondary barrier sphere
    var barrier3 = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier3.position.set(0, 35, 120);
    barrier3.castShadow = true;
    scene.add(barrier3);
    objects.push(barrier3);
    animationStates.barrier3 = { scale: 1, pulse: Math.PI * 0.5 };

    // 13. Additional control node for balance
    var controlNode3 = new THREE.Mesh(controlNodeGeometry, controlNodeMaterial);
    controlNode3.position.set(0, 20, 145);
    controlNode3.castShadow = true;
    controlNode3.receiveShadow = true;
    scene.add(controlNode3);
    objects.push(controlNode3);
    animationStates.controlNode3 = { scanLine: Math.PI * 1.5 };

    // 14. Additional turret for symmetry
    var turret3 = new THREE.Mesh(turretBaseGeometry, turretBaseMaterial);
    turret3.position.set(0, 75, -140);
    turret3.castShadow = true;
    turret3.receiveShadow = true;
    scene.add(turret3);
    objects.push(turret3);
    animationStates.turret3 = { rotation: Math.PI * 0.5, pitch: 0 };

    var turretBarrel3 = new THREE.Mesh(turretBarrelGeometry, turretBarrelMaterial);
    turretBarrel3.position.set(0, 80, -125);
    turretBarrel3.rotation.z = Math.PI / 6;
    turretBarrel3.castShadow = true;
    turretBarrel3.receiveShadow = true;
    scene.add(turretBarrel3);
    objects.push(turretBarrel3);
    animationStates.turretBarrel3 = { charge: Math.PI * 0.5 };

    // 15. Final tower for completion
    var tower3 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower3.position.set(0, 60, 80);
    tower3.castShadow = true;
    tower3.receiveShadow = true;
    scene.add(tower3);
    objects.push(tower3);
    animationStates.tower3 = { streamOffset: Math.PI * 1.5, rotation: 0 };
  };

  var update = function(delta) {
    if (!scene) return;

    // Animate neon sign flicker
    if (animationStates.neonSign1) {
      animationStates.neonSign1.flicker += delta * 5;
      var flicker1 = Math.abs(Math.sin(animationStates.neonSign1.flicker * 2));
      if (objects.length > 18 && objects[18].material) {
        objects[18].material.opacity = 0.5 + flicker1 * 0.5;
      }
    }

    if (animationStates.neonSign2) {
      animationStates.neonSign2.flicker += delta * 4.5;
      var flicker2 = Math.abs(Math.sin(animationStates.neonSign2.flicker * 2));
      if (objects.length > 19 && objects[19].material) {
        objects[19].material.opacity = 0.5 + flicker2 * 0.5;
      }
    }

    // Animate drone orbits
    if (animationStates.drone1) {
      animationStates.drone1.orbitAngle += delta * 0.5;
      var centerX = animationStates.drone1.orbitCenter[0];
      var centerY = animationStates.drone1.orbitCenter[1];
      var centerZ = animationStates.drone1.orbitCenter[2];
      var radius = animationStates.drone1.orbitRadius;
      objects[9].position.x = centerX + Math.cos(animationStates.drone1.orbitAngle) * radius;
      objects[9].position.y = centerY + Math.sin(animationStates.drone1.orbitAngle * 0.3) * 20;
      objects[9].position.z = centerZ + Math.sin(animationStates.drone1.orbitAngle) * radius;
    }

    if (animationStates.drone2) {
      animationStates.drone2.orbitAngle += delta * 0.6;
      var center2X = animationStates.drone2.orbitCenter[0];
      var center2Y = animationStates.drone2.orbitCenter[1];
      var center2Z = animationStates.drone2.orbitCenter[2];
      var radius2 = animationStates.drone2.orbitRadius;
      objects[12].position.x = center2X + Math.cos(animationStates.drone2.orbitAngle) * radius2;
      objects[12].position.y = center2Y + Math.sin(animationStates.drone2.orbitAngle * 0.3) * 20;
      objects[12].position.z = center2Z + Math.sin(animationStates.drone2.orbitAngle) * radius2;
    }

    if (animationStates.drone3) {
      animationStates.drone3.orbitAngle += delta * 0.55;
      var center3X = animationStates.drone3.orbitCenter[0];
      var center3Y = animationStates.drone3.orbitCenter[1];
      var center3Z = animationStates.drone3.orbitCenter[2];
      var radius3 = animationStates.drone3.orbitRadius;
      objects[21].position.x = center3X + Math.cos(animationStates.drone3.orbitAngle) * radius3;
      objects[21].position.y = center3Y + Math.sin(animationStates.drone3.orbitAngle * 0.3) * 15;
      objects[21].position.z = center3Z + Math.sin(animationStates.drone3.orbitAngle) * radius3;
    }

    // Rotate drone rotors
    if (animationStates.droneRotor1) {
      animationStates.droneRotor1.rotation += delta * 20;
      if (objects.length > 11 && objects[11]) {
        objects[11].rotation.z = animationStates.droneRotor1.rotation;
      }
    }

    // Animate holographic barrier pulses
    if (animationStates.barrier1) {
      animationStates.barrier1.pulse += delta * 2;
      var pulseScale1 = 1 + Math.sin(animationStates.barrier1.pulse) * 0.15;
      objects[5].scale.set(pulseScale1, pulseScale1, pulseScale1);
    }

    if (animationStates.barrier2) {
      animationStates.barrier2.pulse += delta * 2;
      var pulseScale2 = 1 + Math.sin(animationStates.barrier2.pulse) * 0.15;
      objects[6].scale.set(pulseScale2, pulseScale2, pulseScale2);
    }

    if (animationStates.barrier3) {
      animationStates.barrier3.pulse += delta * 1.8;
      var pulseScale3 = 1 + Math.sin(animationStates.barrier3.pulse) * 0.15;
      objects[22].scale.set(pulseScale3, pulseScale3, pulseScale3);
    }

    // Animate shield emitter pulses
    if (animationStates.shieldEmitter1) {
      animationStates.shieldEmitter1.pulsePhase += delta * 3;
      var shieldIntensity1 = 0.4 + Math.abs(Math.sin(animationStates.shieldEmitter1.pulsePhase)) * 0.6;
      objects[16].material.emissiveIntensity = shieldIntensity1;
    }

    if (animationStates.shieldEmitter2) {
      animationStates.shieldEmitter2.pulsePhase += delta * 3;
      var shieldIntensity2 = 0.4 + Math.abs(Math.sin(animationStates.shieldEmitter2.pulsePhase)) * 0.6;
      objects[17].material.emissiveIntensity = shieldIntensity2;
    }

    // Animate EMP cannon charging
    if (animationStates.empCoil) {
      animationStates.empCoil.chargeIntensity = (Math.sin(performance.now() * 0.002) + 1) * 0.5;
      if (objects.length > 28 && objects[28].material) {
        objects[28].material.emissiveIntensity = 0.3 + animationStates.empCoil.chargeIntensity * 0.7;
      }
    }

    // Animate control node scan lines
    if (animationStates.controlNode1) {
      animationStates.controlNode1.scanLine += delta * 4;
      if (objects.length > 24 && objects[24].material) {
        objects[24].material.emissiveIntensity = 0.3 + Math.abs(Math.sin(animationStates.controlNode1.scanLine)) * 0.4;
      }
    }

    if (animationStates.controlNode2) {
      animationStates.controlNode2.scanLine += delta * 4;
      if (objects.length > 25 && objects[25].material) {
        objects[25].material.emissiveIntensity = 0.3 + Math.abs(Math.sin(animationStates.controlNode2.scanLine)) * 0.4;
      }
    }

    if (animationStates.controlNode3) {
      animationStates.controlNode3.scanLine += delta * 4;
      if (objects.length > 26 && objects[26].material) {
        objects[26].material.emissiveIntensity = 0.3 + Math.abs(Math.sin(animationStates.controlNode3.scanLine)) * 0.4;
      }
    }

    // Animate data center tower rotations
    if (animationStates.tower1) {
      animationStates.tower1.rotation += delta * 0.3;
      if (objects.length > 3 && objects[3]) {
        objects[3].rotation.y = animationStates.tower1.rotation;
      }
    }

    if (animationStates.tower2) {
      animationStates.tower2.rotation += delta * 0.35;
      if (objects.length > 4 && objects[4]) {
        objects[4].rotation.y = animationStates.tower2.rotation;
      }
    }

    if (animationStates.tower3) {
      animationStates.tower3.rotation += delta * 0.32;
      if (objects.length > 30 && objects[30]) {
        objects[30].rotation.y = animationStates.tower3.rotation;
      }
    }

    // Animate turret barrel charge
    if (animationStates.turretBarrel1) {
      animationStates.turretBarrel1.charge += delta * 2;
      if (objects.length > 8 && objects[8].material) {
        objects[8].material.emissiveIntensity = 0.3 + Math.abs(Math.sin(animationStates.turretBarrel1.charge)) * 0.5;
      }
    }

    if (animationStates.turretBarrel2) {
      animationStates.turretBarrel2.charge += delta * 2.2;
      if (objects.length > 11 && objects[11].material) {
        objects[11].material.emissiveIntensity = 0.3 + Math.abs(Math.sin(animationStates.turretBarrel2.charge)) * 0.5;
      }
    }

    if (animationStates.turretBarrel3) {
      animationStates.turretBarrel3.charge += delta * 1.9;
      if (objects.length > 28 && objects[28].material) {
        objects[28].material.emissiveIntensity = 0.3 + Math.abs(Math.sin(animationStates.turretBarrel3.charge)) * 0.5;
      }
    }

    // Animate bazaar flicker
    if (animationStates.bazaarStall1) {
      animationStates.bazaarStall1.flicker += delta * 3.5;
      if (objects.length > 19 && objects[19].material) {
        objects[19].material.emissiveIntensity = 0.15 + Math.random() * 0.15;
      }
    }

    if (animationStates.bazaarStall2) {
      animationStates.bazaarStall2.flicker += delta * 3.2;
      if (objects.length > 20 && objects[20].material) {
        objects[20].material.emissiveIntensity = 0.15 + Math.random() * 0.15;
      }
    }

    // Animate wall neon glow
    if (animationStates.wall1) {
      animationStates.wall1.phase += delta * 1.5;
      if (objects.length > 0 && objects[0].material) {
        objects[0].material.emissiveIntensity = 0.15 + Math.sin(animationStates.wall1.phase) * 0.1;
      }
    }

    if (animationStates.wall2) {
      animationStates.wall2.phase += delta * 1.4;
      if (objects.length > 1 && objects[1].material) {
        objects[1].material.emissiveIntensity = 0.15 + Math.sin(animationStates.wall2.phase) * 0.1;
      }
    }

    if (animationStates.wall3) {
      animationStates.wall3.phase += delta * 1.3;
      if (objects.length > 2 && objects[2].material) {
        objects[2].material.emissiveIntensity = 0.15 + Math.sin(animationStates.wall3.phase) * 0.1;
      }
    }
  };

  var reset = function() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    animationStates = {};
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
