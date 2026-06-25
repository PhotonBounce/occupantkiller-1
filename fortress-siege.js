window.FortressSiege = (function() {
  'use strict';

  var scene, camera, game;
  var castleGroup, defendersGroup, attackersGroup;
  var trebuchetArm, batteringRamBody, explosionClusters, drawbridge;
  var mercenaries, assault, hud;
  var time = 0;
  var wallHealth = 80;
  var lastHKey = 0, lastFKey = 0;
  var hudVisible = false;

  function createCastle() {
    var castle = new THREE.Group();

    // 1. Castle courtyard — gray stone flat box
    var courtyard = new THREE.Mesh(
      new THREE.BoxGeometry(400, 0.3, 400),
      new THREE.MeshStandardMaterial({ color: 0x999999 })
    );
    courtyard.position.y = -0.15;
    castle.add(courtyard);

    // 2. Main castle keep — tall stone box with battlements
    var keep = new THREE.Mesh(
      new THREE.BoxGeometry(20, 30, 20),
      new THREE.MeshStandardMaterial({ color: 0x777777 })
    );
    keep.position.set(0, 15, 0);
    castle.add(keep);

    // Battlements on top of keep
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var dist = 12;
      var battlement = new THREE.Mesh(
        new THREE.BoxGeometry(2, 4, 2),
        new THREE.MeshStandardMaterial({ color: 0x666666 })
      );
      battlement.position.set(
        Math.cos(angle) * dist,
        30,
        Math.sin(angle) * dist
      );
      castle.add(battlement);
    }

    // 3 & 4. Corner towers (4) — round-ish boxes at corners
    var corners = [
      { x: 100, z: 100 },
      { x: -100, z: 100 },
      { x: 100, z: -100 },
      { x: -100, z: -100 }
    ];
    for (var i = 0; i < 4; i++) {
      var tower = new THREE.Mesh(
        new THREE.BoxGeometry(5, 20, 5),
        new THREE.MeshStandardMaterial({ color: 0x666666 })
      );
      tower.position.set(corners[i].x, 10, corners[i].z);
      castle.add(tower);

      // Battlements on towers
      for (var j = 0; j < 4; j++) {
        var battelementT = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 3, 1.5),
          new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        battelementT.position.set(
          corners[i].x + (j % 2 === 0 ? 3 : -3),
          20,
          corners[i].z + (j < 2 ? 3 : -3)
        );
        castle.add(battelementT);
      }
    }

    // 5. Castle outer wall — perimeter stone walls
    var wallThickness = 2;
    var wallHeight = 10;
    var wallColor = 0x888888;

    // North wall
    var wallN = new THREE.Mesh(
      new THREE.BoxGeometry(250, wallHeight, wallThickness),
      new THREE.MeshStandardMaterial({ color: wallColor })
    );
    wallN.position.set(0, wallHeight / 2, 125);
    castle.add(wallN);

    // South wall
    var wallS = new THREE.Mesh(
      new THREE.BoxGeometry(250, wallHeight, wallThickness),
      new THREE.MeshStandardMaterial({ color: wallColor })
    );
    wallS.position.set(0, wallHeight / 2, -125);
    castle.add(wallS);

    // East wall
    var wallE = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 250),
      new THREE.MeshStandardMaterial({ color: wallColor })
    );
    wallE.position.set(125, wallHeight / 2, 0);
    castle.add(wallE);

    // West wall
    var wallW = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 250),
      new THREE.MeshStandardMaterial({ color: wallColor })
    );
    wallW.position.set(-125, wallHeight / 2, 0);
    castle.add(wallW);

    // 6. Moat — recessed water channel
    var moat = new THREE.Mesh(
      new THREE.BoxGeometry(290, 3, 290),
      new THREE.MeshStandardMaterial({
        color: 0x1a4d7a,
        metalness: 0.1,
        roughness: 0.4
      })
    );
    moat.position.set(0, -2, 0);
    castle.add(moat);

    // 13. Arrow slits — dark thin gaps in walls
    for (var i = 0; i < 4; i++) {
      var slit = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 3, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      slit.position.set(0, 6, 124 - i * 15);
      castle.add(slit);
    }

    // 14. Flag standards — tall pole + kingdom flag
    var flagPole = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 15, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x654321 })
    );
    flagPole.position.set(0, 15, 0);
    castle.add(flagPole);

    var flag = new THREE.Mesh(
      new THREE.BoxGeometry(8, 5, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xcc0000, emissive: 0x330000 })
    );
    flag.position.set(5, 16, 0);
    castle.add(flag);

    // 5b. Drawbridge mechanism
    var drawbridgeGroup = new THREE.Group();
    var drawbridgeBoard = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    drawbridgeBoard.position.y = 0.25;
    drawbridgeGroup.add(drawbridgeBoard);

    // Drawbridge chains
    var chain1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    chain1.position.set(-7, 3, 3);
    drawbridgeGroup.add(chain1);

    var chain2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    chain2.position.set(7, 3, 3);
    drawbridgeGroup.add(chain2);

    drawbridgeGroup.position.set(0, 2, -130);
    castle.add(drawbridgeGroup);
    drawbridge = drawbridgeGroup;

    return castle;
  }

  function createDefenders() {
    var group = new THREE.Group();

    // 7. 6 mercenary defenders on battlements with modern gear
    var positions = [
      { x: 0, z: 12 },
      { x: 10, z: 5 },
      { x: -10, z: 5 },
      { x: 8, z: -8 },
      { x: -8, z: -8 },
      { x: 0, z: -12 }
    ];

    mercenaries = [];

    for (var i = 0; i < 6; i++) {
      var merc = new THREE.Group();

      // Body
      var body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      body.position.y = 32;
      merc.add(body);

      // Head
      var head = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.7, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xc9a961 })
      );
      head.position.set(0, 33.5, 0);
      merc.add(head);

      // Modern rifle
      var rifle = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.4, 2),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      rifle.position.set(0.5, 32.5, 0.5);
      rifle.rotation.z = 0.3;
      merc.add(rifle);

      // Tactical gear box
      var gear = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
      );
      gear.position.set(0, 31.5, 0);
      merc.add(gear);

      merc.position.set(positions[i].x, 0, positions[i].z);
      merc.userData.animationOffset = i * 0.3;
      group.add(merc);
      mercenaries.push(merc);
    }

    return group;
  }

  function createAssault() {
    var group = new THREE.Group();

    // 8. 4 assault team attackers with explosives
    var positions = [
      { x: -150, z: 50 },
      { x: -180, z: -50 },
      { x: 150, z: 80 },
      { x: -120, z: -80 }
    ];

    assault = [];

    for (var i = 0; i < 4; i++) {
      var attacker = new THREE.Group();

      // Dark tactical body
      var body = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.8, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
      );
      body.position.y = 1;
      attacker.add(body);

      // Head
      var head = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.6, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x8b7355 })
      );
      head.position.set(0, 2.2, 0);
      attacker.add(head);

      // Assault rifle
      var rifle = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.35, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      rifle.position.set(0.4, 1.5, 0.3);
      rifle.rotation.z = 0.25;
      attacker.add(rifle);

      // Explosives pack on back
      var explosives = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1, 0.4),
        new THREE.MeshStandardMaterial({
          color: 0xff6600,
          emissive: 0x330000
        })
      );
      explosives.position.set(0, 1.2, -0.5);
      attacker.add(explosives);

      attacker.position.set(positions[i].x, 0, positions[i].z);
      attacker.userData.animationOffset = i * 0.5;
      group.add(attacker);
      assault.push(attacker);
    }

    return group;
  }

  function createSeigeMachinery() {
    var group = new THREE.Group();

    // 10. Medieval siege trebuchet
    var trebuchet = new THREE.Group();

    // Base frame
    var baseFrame = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1, 6),
      new THREE.MeshStandardMaterial({ color: 0x654321 })
    );
    baseFrame.position.y = 0.5;
    trebuchet.add(baseFrame);

    // Vertical supports
    var support1 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 8, 1),
      new THREE.MeshStandardMaterial({ color: 0x654321 })
    );
    support1.position.set(-3, 4.5, -2);
    trebuchet.add(support1);

    var support2 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 8, 1),
      new THREE.MeshStandardMaterial({ color: 0x654321 })
    );
    support2.position.set(3, 4.5, -2);
    trebuchet.add(support2);

    // Swinging arm
    trebuchetArm = new THREE.Group();
    var armBeam = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 12, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x8b6914 })
    );
    armBeam.position.y = 6;
    trebuchetArm.add(armBeam);

    // Sling basket
    var sling = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 3),
      new THREE.MeshStandardMaterial({ color: 0x996633 })
    );
    sling.position.set(0, 18, 0);
    trebuchetArm.add(sling);

    // Counterweight
    var counterweight = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3, 2),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    counterweight.position.set(0, 2, 0);
    trebuchetArm.add(counterweight);

    trebuchetArm.position.set(-150, 2, -120);
    trebuchet.add(trebuchetArm);

    group.add(trebuchet);

    // 11. Battering ram — long horizontal on wheeled frame
    var batteringRam = new THREE.Group();

    // Frame
    var ramFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 12),
      new THREE.MeshStandardMaterial({ color: 0x654321 })
    );
    ramFrame.position.set(0, 1, 0);
    batteringRam.add(ramFrame);

    // Log ram body (horizontal)
    batteringRamBody = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 20),
      new THREE.MeshStandardMaterial({ color: 0x8b6914 })
    );
    batteringRamBody.position.set(0, 3, 0);
    batteringRam.add(batteringRamBody);

    // Wheels
    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      var wheelX = i < 2 ? -2 : 2;
      var wheelZ = (i % 2) * 12 - 6;
      wheel.position.set(wheelX, 0.5, wheelZ);
      batteringRam.add(wheel);
    }

    batteringRam.position.set(100, 0, -150);
    group.add(batteringRam);

    // 9. RPG-7 on assault team shoulder
    var rpg = new THREE.Group();
    var rpgTube = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 3),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    rpgTube.position.z = 1;
    rpg.add(rpgTube);

    var rpgWarhead = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xcc0000 })
    );
    rpgWarhead.position.set(0, 0, 2.5);
    rpg.add(rpgWarhead);

    rpg.position.set(-150, 2.2, 50);
    rpg.rotation.set(0.4, 0.3, 0.2);
    group.add(rpg);

    return group;
  }

  function createExplosionImpacts() {
    var group = new THREE.Group();

    explosionClusters = [];

    // 12. 2 explosion impacts at wall breach points
    var breachPoints = [
      { x: 120, y: 8, z: 0 },
      { x: -120, y: 10, z: 0 }
    ];

    for (var i = 0; i < 2; i++) {
      var cluster = new THREE.Group();

      // Explosion spheres
      for (var j = 0; j < 3; j++) {
        var sphere = new THREE.Mesh(
          new THREE.BoxGeometry(
            2 + j * 0.5,
            2 + j * 0.5,
            2 + j * 0.5
          ),
          new THREE.MeshStandardMaterial({
            color: 0xff6600,
            emissive: 0xff3300,
            metalness: 0.2
          })
        );
        sphere.position.set(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        );
        cluster.add(sphere);
      }

      // Smoke/impact residue boxes
      for (var j = 0; j < 2; j++) {
        var smoke = new THREE.Mesh(
          new THREE.BoxGeometry(3, 3, 3),
          new THREE.MeshStandardMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.5
          })
        );
        smoke.position.set(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 3
        );
        cluster.add(smoke);
      }

      cluster.position.copy(breachPoints[i]);
      group.add(cluster);
      explosionClusters.push({
        mesh: cluster,
        originalScale: 1,
        pulsing: true
      });
    }

    return group;
  }

  function createSuppliesAndLadders() {
    var group = new THREE.Group();

    // 15. Supply wagons — wooden boxes + wheels
    var wagon1 = new THREE.Group();
    var wagonBody = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 4),
      new THREE.MeshStandardMaterial({ color: 0x8b6914 })
    );
    wagonBody.position.y = 1.5;
    wagon1.add(wagonBody);

    for (var i = 0; i < 2; i++) {
      var wheel = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
      );
      wheel.position.set((i === 0 ? -3 : 3), 0.5, 0);
      wagon1.add(wheel);
    }

    wagon1.position.set(-180, 0, 80);
    group.add(wagon1);

    var wagon2 = wagon1.clone();
    wagon2.position.set(-200, 0, -60);
    group.add(wagon2);

    // 16. Rope scaling ladder — vertical with rung boxes
    var ladder = new THREE.Group();

    var sideRope1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 25, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x8b6914 })
    );
    sideRope1.position.set(-1, 12.5, 0);
    ladder.add(sideRope1);

    var sideRope2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 25, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x8b6914 })
    );
    sideRope2.position.set(1, 12.5, 0);
    ladder.add(sideRope2);

    // Rungs
    for (var i = 0; i < 10; i++) {
      var rung = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.3, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x654321 })
      );
      rung.position.y = i * 2.5 + 0.5;
      ladder.add(rung);
    }

    ladder.position.set(100, 0, 120);
    ladder.rotation.z = 0.4; // Leaning against wall
    group.add(ladder);

    return group;
  }

  function createHUD() {
    // Canvas for HUD
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');

    function updateHUD() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, 512, 128);

      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('WALL INTEGRITY: ' + wallHealth + '%', 20, 40);
      ctx.fillText('ATTACKERS: 4', 20, 70);
      ctx.fillText('DEFENDERS: 6', 20, 100);
    }

    updateHUD();

    var texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    var material = new THREE.MeshBasicMaterial({ map: texture });
    var geometry = new THREE.BoxGeometry(16, 4, 0.01);
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(-78, 40, -80);
    mesh.renderOrder = 10;

    return {
      mesh: mesh,
      canvas: canvas,
      ctx: ctx,
      updateHUD: updateHUD
    };
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    // Lighting
    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(100, 50, 100);
    light.castShadow = true;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    // Build castle
    castleGroup = createCastle();
    scene.add(castleGroup);

    // Defenders
    defendersGroup = createDefenders();
    scene.add(defendersGroup);

    // Attackers
    attackersGroup = createAssault();
    scene.add(attackersGroup);

    // Siege machinery
    var siegeGroup = createSeigeMachinery();
    scene.add(siegeGroup);

    // Explosions
    var explosionGroup = createExplosionImpacts();
    scene.add(explosionGroup);

    // Supplies and ladders
    var suppliesGroup = createSuppliesAndLadders();
    scene.add(suppliesGroup);

    // HUD
    hud = createHUD();
    scene.add(hud.mesh);

    // Keyboard input for HUD toggle
    document.addEventListener('keydown', function(e) {
      if (e.key === 'h' || e.key === 'H') {
        lastHKey = Date.now();
      }
      if (e.key === 'f' || e.key === 'F') {
        lastFKey = Date.now();
      }

      // Check if H and F pressed within 400ms
      if (Math.abs(lastHKey - lastFKey) < 400 && lastHKey > 0 && lastFKey > 0) {
        hudVisible = !hudVisible;
        hud.mesh.visible = hudVisible;
        lastHKey = 0;
        lastFKey = 0;
      }
    });

    hud.mesh.visible = false;
  }

  function update(delta) {
    time += delta;

    // Trebuchet arm swing
    if (trebuchetArm) {
      var swingAngle = Math.sin(time * 0.5) * 0.6;
      trebuchetArm.rotation.z = swingAngle;
    }

    // Battering ram forward/back motion
    if (batteringRamBody) {
      var ramMotion = Math.sin(time * 0.8) * 2;
      batteringRamBody.position.x = ramMotion;
    }

    // Assault team advance
    if (assault) {
      for (var i = 0; i < assault.length; i++) {
        assault[i].position.x += delta * 3;
      }
    }

    // Defenders firing animation (bobbing)
    if (mercenaries) {
      for (var i = 0; i < mercenaries.length; i++) {
        var offset = mercenaries[i].userData.animationOffset;
        var bobAmount = Math.sin(time * 2 + offset) * 0.3;
        mercenaries[i].position.y = bobAmount;
      }
    }

    // Explosion clusters pulse
    if (explosionClusters) {
      for (var i = 0; i < explosionClusters.length; i++) {
        var cluster = explosionClusters[i];
        var pulseScale = 1 + Math.sin(time * 2 + i) * 0.2;
        cluster.mesh.scale.set(pulseScale, pulseScale, pulseScale);
      }
    }

    // Drawbridge animation (slow pivot)
    if (drawbridge) {
      drawbridge.rotation.x = Math.sin(time * 0.3) * 0.3;
    }

    // Update HUD display
    if (hud) {
      wallHealth = Math.max(20, 80 - time * 5);
      hud.updateHUD();
    }
  }

  function reset() {
    time = 0;
    wallHealth = 80;
    hudVisible = false;
    lastHKey = 0;
    lastFKey = 0;

    if (scene) {
      // Remove all children
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    }

    // Reinitialize
    if (camera) {
      init(scene, camera);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
