window.WraithShip = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var shipGroup = null;
  var ghostCrews = [];
  var navyGuns = [];
  var engineFires = [];
  var torpedoParticles = [];
  var portalRifts = [];
  var hullParts = [];
  var phaseOffset = 0;
  var pulseRotation = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    shipGroup = new THREE.Group();
    scene.add(shipGroup);

    buildHullFramework();
    buildGhostCrews();
    buildNavyGuns();
    buildEngineRoom();
    buildTorpedoHole();
    buildPortalRifts();
  }

  function buildHullFramework() {
    var hullGeometry = new THREE.BoxGeometry(40, 20, 120);
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      metalness: 0.7,
      roughness: 0.6,
      transparent: true,
      opacity: 0.5,
      emissive: 0x001a33
    });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(0, 5, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    shipGroup.add(hull);
    hullParts.push(hull);

    var bridgeGeometry = new THREE.BoxGeometry(15, 12, 18);
    var bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2a,
      metalness: 0.8,
      roughness: 0.4,
      transparent: true,
      opacity: 0.4
    });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(0, 20, -35);
    bridge.castShadow = true;
    shipGroup.add(bridge);
    hullParts.push(bridge);

    var reinforcementGeometry = new THREE.CylinderGeometry(2, 2, 40, 6);
    var reinforcementMaterial = new THREE.MeshStandardMaterial({
      color: 0x444455,
      metalness: 0.9,
      roughness: 0.3
    });
    var reinforcement = new THREE.Mesh(reinforcementGeometry, reinforcementMaterial);
    reinforcement.position.set(12, 15, 0);
    shipGroup.add(reinforcement);
    hullParts.push(reinforcement);
  }

  function buildGhostCrews() {
    var positions = [
      { x: -8, z: -20 },
      { x: 8, z: -10 },
      { x: -5, z: 10 },
      { x: 6, z: 25 },
      { x: -10, z: 40 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var crew = createGhostMannequin(positions[i].x, 5, positions[i].z);
      shipGroup.add(crew);
      ghostCrews.push({
        mesh: crew,
        rotationSpeed: 0.5 + Math.random() * 0.5,
        bobOffset: Math.random() * Math.PI * 2
      });
    }
  }

  function createGhostMannequin(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var headGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    var ghostMaterial = new THREE.MeshStandardMaterial({
      color: 0x99ccff,
      emissive: 0x4488dd,
      metalness: 0.2,
      roughness: 0.8,
      transparent: true,
      opacity: 0.6
    });
    var head = new THREE.Mesh(headGeometry, ghostMaterial);
    head.position.y = 2.5;
    group.add(head);

    var torsoGeometry = new THREE.BoxGeometry(1, 2.5, 0.8);
    var torso = new THREE.Mesh(torsoGeometry, ghostMaterial);
    torso.position.y = 0.5;
    group.add(torso);

    var armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 6);
    var armLeft = new THREE.Mesh(armGeometry, ghostMaterial);
    armLeft.position.set(-1.2, 1, 0);
    armLeft.rotation.z = Math.PI * 0.25;
    group.add(armLeft);

    var armRight = new THREE.Mesh(armGeometry, ghostMaterial);
    armRight.position.set(1.2, 1, 0);
    armRight.rotation.z = -Math.PI * 0.25;
    group.add(armRight);

    return group;
  }

  function buildNavyGuns() {
    var gunPositions = [
      { x: -12, z: -40, angle: 0 },
      { x: 12, z: -40, angle: 0 },
      { x: -12, z: 35, angle: Math.PI }
    ];

    for (var i = 0; i < gunPositions.length; i++) {
      var gun = createNavalGun(gunPositions[i].x, 12, gunPositions[i].z, gunPositions[i].angle);
      shipGroup.add(gun);
      navyGuns.push({
        mesh: gun,
        targetAngle: gunPositions[i].angle + (Math.random() - 0.5) * 0.3,
        trackingSpeed: 0.01 + Math.random() * 0.02
      });
    }
  }

  function createNavalGun(x, y, z, baseAngle) {
    var group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = baseAngle;

    var baseGeometry = new THREE.CylinderGeometry(3, 3.5, 1, 8);
    var gunMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.85,
      roughness: 0.2,
      map: null
    });
    var base = new THREE.Mesh(baseGeometry, gunMaterial);
    group.add(base);

    var barrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 12, 8);
    var barrel = new THREE.Mesh(barrelGeometry, gunMaterial);
    barrel.position.z = 6;
    barrel.rotation.x = -Math.PI * 0.15;
    group.add(barrel);

    var breechGeometry = new THREE.SphereGeometry(1.2, 6, 6);
    var breech = new THREE.Mesh(breechGeometry, gunMaterial);
    breech.position.z = -1;
    group.add(breech);

    return group;
  }

  function buildEngineRoom() {
    var engineGeometry = new THREE.BoxGeometry(18, 15, 25);
    var engineMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      transparent: true,
      opacity: 0.3,
      emissive: 0x003300
    });
    var engineBox = new THREE.Mesh(engineGeometry, engineMaterial);
    engineBox.position.set(0, 8, 45);
    shipGroup.add(engineBox);

    for (var i = 0; i < 6; i++) {
      var fireGeometry = new THREE.SphereGeometry(2 + Math.random() * 1.5, 8, 8);
      var fireMaterial = new THREE.MeshStandardMaterial({
        color: 0x0099ff,
        emissive: 0x0055ff,
        metalness: 0.3,
        roughness: 0.8,
        transparent: true,
        opacity: 0.7
      });
      var fire = new THREE.Mesh(fireGeometry, fireMaterial);
      fire.position.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10 + 8,
        40 + (Math.random() - 0.5) * 20
      );
      shipGroup.add(fire);
      engineFires.push({
        mesh: fire,
        baseScale: fire.scale.clone(),
        pulseSpeed: 2 + Math.random() * 3
      });
    }
  }

  function buildTorpedoHole() {
    var torpedoGeometry = new THREE.ConeGeometry(3, 15, 6);
    var torpedoMaterial = new THREE.MeshStandardMaterial({
      color: 0x222244,
      metalness: 0.7,
      roughness: 0.4,
      transparent: true,
      opacity: 0.5,
      emissive: 0x111133
    });
    var torpedo = new THREE.Mesh(torpedoGeometry, torpedoMaterial);
    torpedo.position.set(15, 8, 0);
    torpedo.rotation.z = Math.PI * 0.5;
    shipGroup.add(torpedo);

    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var px = Math.cos(angle) * 8 + 15;
      var py = 8 + Math.sin(angle) * 3;
      var pz = Math.cos(angle * 0.7) * 2;

      var particleGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: 0x6699ff,
        emissive: 0x3366ff,
        metalness: 0.5,
        roughness: 0.5
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(px, py, pz);
      shipGroup.add(particle);
      torpedoParticles.push({
        mesh: particle,
        orbitRadius: 8,
        orbitAngle: angle,
        orbitSpeed: 0.003 + Math.random() * 0.002
      });
    }
  }

  function buildPortalRifts() {
    var portholPositions = [
      { x: -18, z: -30 },
      { x: 18, z: -15 },
      { x: -18, z: 20 },
      { x: 18, z: 40 }
    ];

    for (var i = 0; i < portholPositions.length; i++) {
      var rift = createPortalRift(
        portholPositions[i].x,
        8,
        portholPositions[i].z
      );
      shipGroup.add(rift);
      portalRifts.push({
        mesh: rift,
        rotationSpeed: 0.01 + Math.random() * 0.008
      });
    }
  }

  function createPortalRift(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var rimGeometry = new THREE.CylinderGeometry(3, 3, 0.4, 12);
    var rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00aaff,
      metalness: 0.8,
      roughness: 0.2
    });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    group.add(rim);

    var glowGeometry = new THREE.SphereGeometry(2.8, 8, 8);
    var glowMaterial = new THREE.MeshStandardMaterial({
      color: 0x002255,
      emissive: 0x005599,
      transparent: true,
      opacity: 0.4,
      side: THREE.BackSide
    });
    var glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    return group;
  }

  function update(delta) {
    if (!shipGroup) return;

    phaseOffset += delta * 0.3;
    pulseRotation += delta * 0.2;

    for (var i = 0; i < hullParts.length; i++) {
      hullParts[i].material.opacity = 0.4 + Math.sin(phaseOffset + i) * 0.15;
    }

    for (var i = 0; i < ghostCrews.length; i++) {
      var crew = ghostCrews[i];
      crew.mesh.rotation.y += crew.rotationSpeed * delta;
      crew.mesh.position.y = 5 + Math.sin(phaseOffset + crew.bobOffset) * 1.5;
    }

    for (var i = 0; i < navyGuns.length; i++) {
      var gun = navyGuns[i];
      var diff = gun.targetAngle - gun.mesh.rotation.y;
      gun.mesh.rotation.y += diff * gun.trackingSpeed;
      if (Math.random() < 0.02) {
        gun.targetAngle += (Math.random() - 0.5) * 0.4;
      }
    }

    for (var i = 0; i < engineFires.length; i++) {
      var fire = engineFires[i];
      var pulse = 0.8 + Math.sin(phaseOffset * fire.pulseSpeed) * 0.4;
      fire.mesh.scale.copy(fire.baseScale).multiplyScalar(pulse);
      fire.mesh.material.opacity = 0.5 + Math.sin(phaseOffset * fire.pulseSpeed * 0.7) * 0.3;
    }

    for (var i = 0; i < torpedoParticles.length; i++) {
      var p = torpedoParticles[i];
      p.orbitAngle += p.orbitSpeed * delta;
      p.mesh.position.x = 15 + Math.cos(p.orbitAngle) * p.orbitRadius;
      p.mesh.position.z = Math.sin(p.orbitAngle) * p.orbitRadius;
    }

    for (var i = 0; i < portalRifts.length; i++) {
      var rift = portalRifts[i];
      rift.mesh.rotation.z += rift.rotationSpeed * delta;
      rift.mesh.rotation.x += rift.rotationSpeed * 0.5 * delta;
    }

    shipGroup.rotation.y = Math.sin(phaseOffset * 0.1) * 0.05;
    shipGroup.position.y = Math.sin(phaseOffset * 0.15) * 0.8;
  }

  function reset() {
    if (shipGroup && scene) {
      scene.remove(shipGroup);
    }
    ghostCrews = [];
    navyGuns = [];
    engineFires = [];
    torpedoParticles = [];
    portalRifts = [];
    hullParts = [];
    shipGroup = null;
    phaseOffset = 0;
    pulseRotation = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
