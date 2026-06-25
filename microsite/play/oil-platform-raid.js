window.OilPlatformRaid = (function() {
  'use strict';

  var scene, camera;
  var sceneObjects = {};
  var hostages = [];
  var terrorists = [];
  var seals = [];
  var helicopter = null;
  var gameTime = 0;
  var hudDisplay = null;
  var keyTracker = { lastH: 0, lastO: 0 };

  // Initialize scene with all environment elements
  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    // Set dark ocean-night atmosphere
    scene.background = new THREE.Color(0x001a33);
    scene.fog = new THREE.Fog(0x001a33, 200, 400);

    // 1. Ocean base - dark blue flat box (400×3×400)
    var oceanGeom = new THREE.BoxGeometry(400, 3, 400);
    var oceanMat = new THREE.MeshStandardMaterial({ color: 0x05152e });
    var ocean = new THREE.Mesh(oceanGeom, oceanMat);
    ocean.position.y = -50;
    ocean.castShadow = true;
    ocean.receiveShadow = true;
    scene.add(ocean);
    sceneObjects.ocean = ocean;

    // 2. Platform deck - gray steel flat box (60×1×60), elevated on legs
    var deckGeom = new THREE.BoxGeometry(60, 1, 60);
    var deckMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.5 });
    var deck = new THREE.Mesh(deckGeom, deckMat);
    deck.position.y = 20;
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    sceneObjects.deck = deck;

    // 3-6. Four platform support legs - cylinder-like tall pillars
    var legPositions = [
      { x: -28, z: -28 },
      { x: 28, z: -28 },
      { x: -28, z: 28 },
      { x: 28, z: 28 }
    ];

    legPositions.forEach(function(pos, i) {
      var legGeom = new THREE.BoxGeometry(2, 70, 2);
      var legMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 });
      var leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(pos.x, -5, pos.z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      scene.add(leg);
      sceneObjects['leg' + (i + 1)] = leg;
    });

    // 4. Derrick tower - tall lattice box structure (4×40×4) center platform
    var derrickGeom = new THREE.BoxGeometry(4, 40, 4);
    var derrickMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 });
    var derrick = new THREE.Mesh(derrickGeom, derrickMat);
    derrick.position.set(0, 40, 0);
    derrick.castShadow = true;
    derrick.receiveShadow = true;
    scene.add(derrick);
    sceneObjects.derrick = derrick;

    // 5. Helipad - circular marked flat box on platform corner
    var helipadGeom = new THREE.BoxGeometry(15, 0.5, 15);
    var helipadMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    var helipad = new THREE.Mesh(helipadGeom, helipadMat);
    helipad.position.set(25, 21, 25);
    helipad.castShadow = true;
    helipad.receiveShadow = true;
    scene.add(helipad);
    sceneObjects.helipad = helipad;

    // 6. Oil wellhead manifold - cluster of pipe boxes + valve handles
    var manifestGeom = new THREE.BoxGeometry(8, 6, 8);
    var manifestMat = new THREE.MeshStandardMaterial({ color: 0xcc3300, metalness: 0.8 });
    var manifest = new THREE.Mesh(manifestGeom, manifestMat);
    manifest.position.set(-15, 21, -15);
    manifest.castShadow = true;
    manifest.receiveShadow = true;
    scene.add(manifest);
    sceneObjects.manifest = manifest;

    // Valve handles on manifold
    for (var vi = 0; vi < 3; vi++) {
      var valveGeom = new THREE.BoxGeometry(1, 2, 1);
      var valveMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
      var valve = new THREE.Mesh(valveGeom, valveMat);
      valve.position.set(-12 + vi * 3, 25, -15);
      valve.castShadow = true;
      scene.add(valve);
      sceneObjects['valve' + vi] = valve;
    }

    // 7. Two oil fire jets - emissive orange/red flame columns
    for (var fi = 0; fi < 2; fi++) {
      var fireGeom = new THREE.BoxGeometry(2, 12, 2);
      var fireMat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff3300,
        emissiveIntensity: 0.8
      });
      var fire = new THREE.Mesh(fireGeom, fireMat);
      fire.position.set(-20 + fi * 40, 27, 0);
      fire.castShadow = true;
      scene.add(fire);
      sceneObjects['fire' + fi] = fire;
    }

    // 8. Four terrorist figures - dark box bodies with weapons
    for (var ti = 0; ti < 4; ti++) {
      var terroristGroup = createTerrorist(
        -20 + ti * 15,
        21,
        -15 + (ti % 2) * 20
      );
      scene.add(terroristGroup);
      terrorists.push(terroristGroup);
    }

    // 9. Five oil rig worker hostages - orange hardhat figures, hands up
    for (var hi = 0; hi < 5; hi++) {
      var hostageGroup = createHostage(
        -10 + hi * 8,
        21,
        10
      );
      scene.add(hostageGroup);
      hostages.push(hostageGroup);
    }

    // 10. Three SEAL team figures - dark wetsuit boxes
    for (var si = 0; si < 3; si++) {
      var sealGroup = createSeal(
        25 + si * 5,
        60,
        25 + si * 5
      );
      scene.add(sealGroup);
      seals.push(sealGroup);
    }

    // 11. Rescue helicopter - box body + rotor disc
    helicopter = createHelicopter();
    helicopter.position.set(25, 80, 25);
    scene.add(helicopter);
    sceneObjects.helicopter = helicopter;

    // 12. Two platform cranes - boom arm boxes + cable + hook
    for (var ci = 0; ci < 2; ci++) {
      var craneGroup = createCrane(
        -25 + ci * 50,
        25,
        -20
      );
      scene.add(craneGroup);
      sceneObjects['crane' + ci] = craneGroup;
    }

    // 13. Lifeboat davit station - orange box lifeboat on davit arm
    var lifeBoatGeom = new THREE.BoxGeometry(10, 4, 5);
    var lifeBoatMat = new THREE.MeshStandardMaterial({ color: 0xff9900 });
    var lifeBoat = new THREE.Mesh(lifeBoatGeom, lifeBoatMat);
    lifeBoat.position.set(20, 25, -25);
    lifeBoat.castShadow = true;
    lifeBoat.receiveShadow = true;
    scene.add(lifeBoat);
    sceneObjects.lifeboat = lifeBoat;

    // 14. Accommodation block - box building (20×10×15)
    var accomGeom = new THREE.BoxGeometry(20, 10, 15);
    var accomMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var accom = new THREE.Mesh(accomGeom, accomMat);
    accom.position.set(-20, 25, 15);
    accom.castShadow = true;
    accom.receiveShadow = true;
    scene.add(accom);
    sceneObjects.accom = accom;

    // Portholes on accommodation
    for (var pi = 0; pi < 6; pi++) {
      var portholeGeom = new THREE.BoxGeometry(2, 2, 0.1);
      var portholeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      var porthole = new THREE.Mesh(portholeGeom, portholeMat);
      porthole.position.set(-25 + pi * 4, 20 + (pi % 2) * 5, 22.5);
      scene.add(porthole);
    }

    // 15. Fog horn / siren - pole + emissive red sphere flashing
    var hornPoleGeom = new THREE.BoxGeometry(1, 8, 1);
    var hornPoleMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    var hornPole = new THREE.Mesh(hornPoleGeom, hornPoleMat);
    hornPole.position.set(28, 25, -25);
    scene.add(hornPole);
    sceneObjects.hornPole = hornPole;

    var hornSphereGeom = new THREE.SphereGeometry(1, 8, 8);
    var hornSphereMat = new THREE.MeshStandardMaterial({
      color: 0xdd0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    var hornSphere = new THREE.Mesh(hornSphereGeom, hornSphereMat);
    hornSphere.position.set(28, 33, -25);
    hornSphere.castShadow = true;
    scene.add(hornSphere);
    sceneObjects.hornSphere = hornSphere;

    // 16. Underwater intake pipes - box pipe sections descending
    for (var upi = 0; upi < 4; upi++) {
      var pipeGeom = new THREE.BoxGeometry(2, 40, 2);
      var pipeMat = new THREE.MeshStandardMaterial({ color: 0x222266 });
      var pipe = new THREE.Mesh(pipeGeom, pipeMat);
      pipe.position.set(-15 + upi * 10, -35, 0);
      pipe.receiveShadow = true;
      scene.add(pipe);
      sceneObjects['intakePipe' + upi] = pipe;
    }

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // HUD Display
    createHUD();
  }

  function createTerrorist(x, y, z) {
    var group = new THREE.Group();

    // Body
    var bodyGeom = new THREE.BoxGeometry(2, 4, 1.5);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Head
    var headGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var headMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 2.5;
    head.castShadow = true;
    group.add(head);

    // Weapon
    var weaponGeom = new THREE.BoxGeometry(0.5, 3, 0.3);
    var weaponMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var weapon = new THREE.Mesh(weaponGeom, weaponMat);
    weapon.position.set(1.2, 1, 0.5);
    weapon.rotation.z = 0.3;
    weapon.castShadow = true;
    group.add(weapon);

    group.position.set(x, y, z);
    group.userData.originalPos = new THREE.Vector3(x, y, z);
    group.userData.type = 'terrorist';

    return group;
  }

  function createHostage(x, y, z) {
    var group = new THREE.Group();

    // Body
    var bodyGeom = new THREE.BoxGeometry(1.5, 3.5, 1.2);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xffaa44 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Hardhat
    var hatGeom = new THREE.BoxGeometry(1.8, 1, 1.8);
    var hatMat = new THREE.MeshStandardMaterial({ color: 0xff9900 });
    var hat = new THREE.Mesh(hatGeom, hatMat);
    hat.position.y = 2.25;
    hat.castShadow = true;
    group.add(hat);

    // Raised arms
    var armGeom = new THREE.BoxGeometry(0.4, 2, 0.4);
    var armMat = new THREE.MeshStandardMaterial({ color: 0xffaa44 });

    var leftArm = new THREE.Mesh(armGeom, armMat);
    leftArm.position.set(-1.2, 1.5, 0);
    leftArm.rotation.z = -1.2;
    leftArm.castShadow = true;
    group.add(leftArm);

    var rightArm = new THREE.Mesh(armGeom, armMat);
    rightArm.position.set(1.2, 1.5, 0);
    rightArm.rotation.z = 1.2;
    rightArm.castShadow = true;
    group.add(rightArm);

    group.position.set(x, y, z);
    group.userData.type = 'hostage';

    return group;
  }

  function createSeal(x, y, z) {
    var group = new THREE.Group();

    // Body
    var bodyGeom = new THREE.BoxGeometry(1.8, 4, 1.2);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Head
    var headGeom = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    var headMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 2.5;
    head.castShadow = true;
    group.add(head);

    // Weapon
    var rifleGeom = new THREE.BoxGeometry(0.4, 2.5, 0.2);
    var rifleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var rifle = new THREE.Mesh(rifleGeom, rifleMat);
    rifle.position.set(1.3, 1, 0.5);
    rifle.rotation.z = -0.2;
    rifle.castShadow = true;
    group.add(rifle);

    // Rappel rope (thin line above)
    var ropeGeom = new THREE.BoxGeometry(0.15, 30, 0.15);
    var ropeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var rope = new THREE.Mesh(ropeGeom, ropeMat);
    rope.position.set(0, 15, 0);
    group.add(rope);

    group.position.set(x, y, z);
    group.userData.type = 'seal';
    group.userData.ropeLength = 30;
    group.userData.rappelProgress = 0;

    return group;
  }

  function createHelicopter() {
    var group = new THREE.Group();

    // Fuselage
    var fuselageGeom = new THREE.BoxGeometry(4, 2.5, 8);
    var fuselageMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var fuselage = new THREE.Mesh(fuselageGeom, fuselageMat);
    fuselage.castShadow = true;
    group.add(fuselage);

    // Cockpit
    var cockpitGeom = new THREE.BoxGeometry(2, 1.5, 2);
    var cockpitMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    var cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
    cockpit.position.set(0, 2, 2);
    cockpit.castShadow = true;
    group.add(cockpit);

    // Rotor disc (main blade assembly)
    var rotorGeom = new THREE.CylinderGeometry(10, 10, 0.3, 32);
    var rotorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var rotor = new THREE.Mesh(rotorGeom, rotorMat);
    rotor.position.y = 2;
    rotor.castShadow = true;
    group.add(rotor);
    group.userData.rotor = rotor;

    // Tail boom
    var tailGeom = new THREE.BoxGeometry(0.6, 0.6, 4);
    var tailMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var tail = new THREE.Mesh(tailGeom, tailMat);
    tail.position.set(0, 0, -4);
    tail.castShadow = true;
    group.add(tail);

    // Tail rotor
    var tailRotorGeom = new THREE.CylinderGeometry(2, 2, 0.2, 16);
    var tailRotorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var tailRotor = new THREE.Mesh(tailRotorGeom, tailRotorMat);
    tailRotor.position.set(1, 0.5, -4.5);
    tailRotor.castShadow = true;
    group.add(tailRotor);
    group.userData.tailRotor = tailRotor;

    group.userData.oscillation = 0;
    return group;
  }

  function createCrane(x, y, z) {
    var group = new THREE.Group();

    // Base
    var baseGeom = new THREE.BoxGeometry(3, 2, 3);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.castShadow = true;
    group.add(base);

    // Tower
    var towerGeom = new THREE.BoxGeometry(1.5, 15, 1.5);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.y = 8;
    tower.castShadow = true;
    group.add(tower);

    // Boom arm
    var boomGeom = new THREE.BoxGeometry(1, 20, 1);
    var boomMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var boom = new THREE.Mesh(boomGeom, boomMat);
    boom.position.set(10, 15, 0);
    boom.rotation.z = 0.3;
    boom.castShadow = true;
    group.add(boom);
    group.userData.boom = boom;

    // Cable
    var cableGeom = new THREE.BoxGeometry(0.15, 12, 0.15);
    var cableMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var cable = new THREE.Mesh(cableGeom, cableMat);
    cable.position.set(10, 5, 0);
    group.add(cable);
    group.userData.cable = cable;

    // Hook
    var hookGeom = new THREE.BoxGeometry(1, 1, 1);
    var hookMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var hook = new THREE.Mesh(hookGeom, hookMat);
    hook.position.set(10, -2, 0);
    hook.castShadow = true;
    group.add(hook);
    group.userData.hook = hook;

    group.position.set(x, y, z);
    group.userData.swingAngle = 0;

    return group;
  }

  function createHUD() {
    var hudCanvas = document.createElement('canvas');
    hudCanvas.width = 256;
    hudCanvas.height = 128;
    var ctx = hudCanvas.getContext('2d');

    // Store for update
    hudDisplay = {
      canvas: hudCanvas,
      ctx: ctx,
      hostageCount: 5,
      sealCount: 3,
      fireActive: true
    };

    updateHUD();
  }

  function updateHUD() {
    if (!hudDisplay) return;

    var ctx = hudDisplay.ctx;
    var canvas = hudDisplay.canvas;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('HOSTAGES: ' + hudDisplay.hostageCount, 10, 25);
    ctx.fillText('SEALS DEPLOYED: ' + hudDisplay.sealCount, 10, 50);

    ctx.fillStyle = hudDisplay.fireActive ? '#ff0000' : '#888888';
    ctx.fillText('OIL FIRE: ' + (hudDisplay.fireActive ? 'ACTIVE' : 'CONTAINED'), 10, 75);

    ctx.fillStyle = '#ffff00';
    ctx.font = '10px monospace';
    ctx.fillText('[Press H+O to toggle]', 10, 105);
  }

  function update(delta) {
    if (!scene) return;

    gameTime += delta;

    // Helicopter hovers with slight oscillation
    if (helicopter) {
      helicopter.userData.oscillation = Math.sin(gameTime * 1.5) * 0.5;
      helicopter.position.y = 80 + helicopter.userData.oscillation;

      if (helicopter.userData.rotor) {
        helicopter.userData.rotor.rotation.y += delta * 15;
      }
      if (helicopter.userData.tailRotor) {
        helicopter.userData.tailRotor.rotation.x += delta * 30;
      }
    }

    // SEAL team descends rope
    seals.forEach(function(seal, idx) {
      if (seal.userData.rappelProgress < 1) {
        seal.userData.rappelProgress += delta * 0.3;
        var targetY = 21;
        var startY = 60;
        seal.position.y = startY + (targetY - startY) * seal.userData.rappelProgress;
      }
    });

    // Platform cranes swing
    var cranes = [sceneObjects.crane0, sceneObjects.crane1];
    cranes.forEach(function(crane, idx) {
      if (crane && crane.userData.boom) {
        var swingAmount = Math.sin(gameTime * 0.5 + idx) * 0.4;
        crane.userData.boom.rotation.z = 0.3 + swingAmount;

        // Update cable and hook position
        if (crane.userData.cable && crane.userData.hook) {
          var boomWorldPos = new THREE.Vector3();
          crane.userData.boom.getWorldPosition(boomWorldPos);

          var hookZ = crane.userData.hook.position.z;
          crane.userData.hook.position.y = -2 + Math.sin(gameTime * 0.7) * 0.5;
        }
      }
    });

    // Oil fires pulse
    for (var fi = 0; fi < 2; fi++) {
      var fire = sceneObjects['fire' + fi];
      if (fire && fire.material) {
        var intensity = 0.5 + Math.sin(gameTime * 3) * 0.3;
        fire.material.emissiveIntensity = intensity;
      }
    }

    // Fog siren flashes
    if (sceneObjects.hornSphere && sceneObjects.hornSphere.material) {
      var flashIntensity = Math.abs(Math.sin(gameTime * 2.5)) > 0.5 ? 0.8 : 0.2;
      sceneObjects.hornSphere.material.emissiveIntensity = flashIntensity;
    }

    // Wellhead valves rotate
    for (var vi = 0; vi < 3; vi++) {
      var valve = sceneObjects['valve' + vi];
      if (valve) {
        valve.rotation.x += delta * 1.5;
      }
    }

    // Hostages kept in group
    hostages.forEach(function(hostage, idx) {
      hostage.position.x = -10 + idx * 8 + Math.sin(gameTime * 0.5 + idx) * 0.2;
      hostage.position.z = 10 + Math.cos(gameTime * 0.5 + idx) * 0.3;
    });

    // Terrorists patrol deck
    terrorists.forEach(function(terrorist, idx) {
      var origPos = terrorist.userData.originalPos;
      var patrolDist = Math.sin(gameTime * 0.4 + idx) * 3;
      terrorist.position.x = origPos.x + patrolDist;
      terrorist.position.z = origPos.z + Math.cos(gameTime * 0.35 + idx) * 2;
      terrorist.rotation.y = Math.atan2(Math.cos(gameTime * 0.4 + idx), Math.sin(gameTime * 0.35 + idx));
    });

    // Handle HUD toggle
    handleHUDToggle();
  }

  function handleHUDToggle() {
    // Key tracking for H + O combo within 400ms
    if (window.keysPressed) {
      if (window.keysPressed['h'] || window.keysPressed['H']) {
        var now = Date.now();
        if (keyTracker.lastH === 0) {
          keyTracker.lastH = now;
        } else if (now - keyTracker.lastH > 400) {
          keyTracker.lastH = now;
        }
      }

      if ((window.keysPressed['o'] || window.keysPressed['O']) && keyTracker.lastH > 0) {
        var now = Date.now();
        if (now - keyTracker.lastH < 400) {
          // Toggle HUD
          if (hudDisplay) {
            hudDisplay.fireActive = !hudDisplay.fireActive;
            updateHUD();
          }
          keyTracker.lastH = 0;
        }
      }
    }
  }

  function reset() {
    gameTime = 0;
    keyTracker = { lastH: 0, lastO: 0 };

    // Reset SEAL positions
    seals.forEach(function(seal) {
      seal.position.y = 60;
      seal.userData.rappelProgress = 0;
    });

    // Reset terrorist positions
    terrorists.forEach(function(terrorist) {
      var origPos = terrorist.userData.originalPos;
      terrorist.position.copy(origPos);
    });

    // Reset crane angles
    var cranes = [sceneObjects.crane0, sceneObjects.crane1];
    cranes.forEach(function(crane) {
      if (crane && crane.userData.boom) {
        crane.userData.boom.rotation.z = 0.3;
      }
    });

    if (hudDisplay) {
      hudDisplay.hostageCount = 5;
      hudDisplay.sealCount = 3;
      hudDisplay.fireActive = true;
      updateHUD();
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
