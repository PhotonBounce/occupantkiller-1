window.DarkCitadel = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var citadelObjects = [];
  var voidPortal = null;
  var energyConduits = [];
  var torches = [];
  var portalRotation = 0;
  var portalScale = 1;
  var portalDirection = 1;

  var shadowBlack = 0x0a0a0a;
  var deepPurple = 0x3d1a5f;
  var voidBlue = 0x0d1b2a;
  var boneWhite = 0xf5f5dc;
  var darkStone = 0x1a1a1a;
  var ironGray = 0x2a2a2a;

  function addObject(obj) {
    citadelObjects.push(obj);
    scene.add(obj);
  }

  function createOuterWalls() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: shadowBlack, roughness: 0.9, metalness: 0.1 });

    // North wall
    var northGeom = new THREE.BoxGeometry(80, 35, 4);
    var northWall = new THREE.Mesh(northGeom, wallMaterial);
    northWall.position.set(0, 17.5, -40);
    addObject(northWall);

    // South wall
    var southGeom = new THREE.BoxGeometry(80, 35, 4);
    var southWall = new THREE.Mesh(southGeom, wallMaterial);
    southWall.position.set(0, 17.5, 40);
    addObject(southWall);

    // East wall
    var eastGeom = new THREE.BoxGeometry(4, 35, 80);
    var eastWall = new THREE.Mesh(eastGeom, wallMaterial);
    eastWall.position.set(40, 17.5, 0);
    addObject(eastWall);

    // West wall
    var westGeom = new THREE.BoxGeometry(4, 35, 80);
    var westWall = new THREE.Mesh(westGeom, wallMaterial);
    westWall.position.set(-40, 17.5, 0);
    addObject(westWall);

    // Jagged battlements on north wall
    for (var i = 0; i < 16; i++) {
      var battlementGeom = new THREE.BoxGeometry(4, 8, 3);
      var battlementMaterial = new THREE.MeshStandardMaterial({ color: shadowBlack, roughness: 0.95 });
      var battlement = new THREE.Mesh(battlementGeom, battlementMaterial);
      var xPos = -38 + (i * 10);
      battlement.position.set(xPos, 35, -41);
      addObject(battlement);
    }

    // Jagged battlements on south wall
    for (var i = 0; i < 16; i++) {
      var battlementGeom = new THREE.BoxGeometry(4, 8, 3);
      var battlementMaterial = new THREE.MeshStandardMaterial({ color: shadowBlack, roughness: 0.95 });
      var battlement = new THREE.Mesh(battlementGeom, battlementMaterial);
      var xPos = -38 + (i * 10);
      battlement.position.set(xPos, 35, 41);
      addObject(battlement);
    }

    // Jagged battlements on east wall
    for (var i = 0; i < 16; i++) {
      var battlementGeom = new THREE.BoxGeometry(3, 8, 4);
      var battlementMaterial = new THREE.MeshStandardMaterial({ color: shadowBlack, roughness: 0.95 });
      var battlement = new THREE.Mesh(battlementGeom, battlementMaterial);
      var zPos = -38 + (i * 10);
      battlement.position.set(41, 35, zPos);
      addObject(battlement);
    }

    // Jagged battlements on west wall
    for (var i = 0; i < 16; i++) {
      var battlementGeom = new THREE.BoxGeometry(3, 8, 4);
      var battlementMaterial = new THREE.MeshStandardMaterial({ color: shadowBlack, roughness: 0.95 });
      var battlement = new THREE.Mesh(battlementGeom, battlementMaterial);
      var zPos = -38 + (i * 10);
      battlement.position.set(-41, 35, zPos);
      addObject(battlement);
    }
  }

  function createObsidianTowers() {
    var towerPositions = [
      { x: -32, z: -32 },
      { x: 32, z: -32 },
      { x: -32, z: 32 },
      { x: 32, z: 32 }
    ];

    for (var i = 0; i < towerPositions.length; i++) {
      var pos = towerPositions[i];
      var towerGeom = new THREE.CylinderGeometry(6, 7, 45, 16);
      var towerMaterial = new THREE.MeshStandardMaterial({ color: voidBlue, roughness: 0.85, metalness: 0.2 });
      var tower = new THREE.Mesh(towerGeom, towerMaterial);
      tower.position.set(pos.x, 22.5, pos.z);
      addObject(tower);

      // Tower cap - spiked cone
      var capGeom = new THREE.ConeGeometry(6.5, 12, 16);
      var capMaterial = new THREE.MeshStandardMaterial({ color: deepPurple, roughness: 0.9, metalness: 0.3 });
      var cap = new THREE.Mesh(capGeom, capMaterial);
      cap.position.set(pos.x, 51.5, pos.z);
      addObject(cap);

      // Spikes on tower cap
      for (var j = 0; j < 8; j++) {
        var spikeGeom = new THREE.ConeGeometry(0.8, 6, 6);
        var spikeMaterial = new THREE.MeshStandardMaterial({ color: shadowBlack, roughness: 0.95 });
        var spike = new THREE.Mesh(spikeGeom, spikeMaterial);
        var angle = (j / 8) * Math.PI * 2;
        var radius = 5;
        spike.position.set(pos.x + Math.cos(angle) * radius, 50, pos.z + Math.sin(angle) * radius);
        spike.rotation.x = 0.3;
        addObject(spike);
      }
    }
  }

  function createMainGate() {
    // Gate frame
    var gateGeom = new THREE.BoxGeometry(18, 28, 2);
    var gateMaterial = new THREE.MeshStandardMaterial({ color: ironGray, roughness: 0.8, metalness: 0.4 });
    var gate = new THREE.Mesh(gateGeom, gateMaterial);
    gate.position.set(0, 14, -40);
    addObject(gate);

    // Portcullis pattern with LineSegments
    var portcullisPoints = [];
    for (var i = 0; i < 10; i++) {
      var x = -8 + (i * 1.8);
      portcullisPoints.push(new THREE.Vector3(x, 28, -40));
      portcullisPoints.push(new THREE.Vector3(x, 0, -40));
    }
    for (var i = 0; i < 15; i++) {
      var y = (i * 2);
      portcullisPoints.push(new THREE.Vector3(-8, y, -40));
      portcullisPoints.push(new THREE.Vector3(8, y, -40));
    }
    var portcullisGeom = new THREE.BufferGeometry().setFromPoints(portcullisPoints);
    var portcullisMaterial = new THREE.LineBasicMaterial({ color: ironGray, linewidth: 2 });
    var portcullis = new THREE.LineSegments(portcullisGeom, portcullisMaterial);
    addObject(portcullis);

    // Gate hinges
    for (var i = 0; i < 4; i++) {
      var hingeGeom = new THREE.SphereGeometry(1.2, 8, 8);
      var hingeMaterial = new THREE.MeshStandardMaterial({ color: ironGray, roughness: 0.7 });
      var hinge = new THREE.Mesh(hingeGeom, hingeMaterial);
      hinge.position.set(-9 + (i * 6), 4 + (i % 2) * 20, -39.5);
      addObject(hinge);
    }
  }

  function createCourtyard() {
    var tileMaterial = new THREE.MeshStandardMaterial({ color: darkStone, roughness: 0.95, map: null });

    // Courtyard tiles in grid pattern
    for (var x = -35; x < 35; x += 7) {
      for (var z = -35; z < 35; z += 7) {
        var tileGeom = new THREE.BoxGeometry(6.5, 0.5, 6.5);
        var tileColor = Math.random() > 0.7 ? 0x1a0a0a : darkStone;
        var tileMat = new THREE.MeshStandardMaterial({ color: tileColor, roughness: 0.95 });
        var tile = new THREE.Mesh(tileGeom, tileMat);
        tile.position.set(x + 3.5, 0.25, z + 3.5);
        addObject(tile);
      }
    }

    // Stain marks on courtyard
    for (var i = 0; i < 15; i++) {
      var stainGeom = new THREE.BoxGeometry(4, 0.1, 4);
      var stainMat = new THREE.MeshStandardMaterial({ color: 0x2a1a2a, roughness: 0.98 });
      var stain = new THREE.Mesh(stainGeom, stainMat);
      stain.position.set((Math.random() - 0.5) * 60, 0.3, (Math.random() - 0.5) * 60);
      addObject(stain);
    }
  }

  function createCentralSpire() {
    // Main spire - extremely tall
    var spireGeom = new THREE.BoxGeometry(8, 80, 8);
    var spireMaterial = new THREE.MeshStandardMaterial({ color: shadowBlack, roughness: 0.95, metalness: 0.05 });
    var spire = new THREE.Mesh(spireGeom, spireMaterial);
    spire.position.set(0, 40, 0);
    addObject(spire);

    // Spire tip - cone
    var tipGeom = new THREE.ConeGeometry(5, 20, 12);
    var tipMaterial = new THREE.MeshStandardMaterial({ color: deepPurple, roughness: 0.9 });
    var tip = new THREE.Mesh(tipGeom, tipMaterial);
    tip.position.set(0, 80, 0);
    addObject(tip);

    // Spire ridges
    for (var i = 0; i < 4; i++) {
      var ridgeGeom = new THREE.BoxGeometry(1, 80, 0.5);
      var ridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
      var ridge = new THREE.Mesh(ridgeGeom, ridgeMaterial);
      var angle = (i / 4) * Math.PI * 2;
      ridge.position.set(0, 40, 0);
      ridge.rotation.y = angle;
      addObject(ridge);
    }

    // Floating orbs around spire
    for (var i = 0; i < 6; i++) {
      var orbGeom = new THREE.SphereGeometry(1.5, 8, 8);
      var orbMaterial = new THREE.MeshStandardMaterial({ color: deepPurple, emissive: 0x5d2a7f, roughness: 0.6 });
      var orb = new THREE.Mesh(orbGeom, orbMaterial);
      var angle = (i / 6) * Math.PI * 2;
      var radius = 12;
      var height = 30 + (i % 3) * 15;
      orb.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      addObject(orb);
    }
  }

  function createShadowEnergyConduits() {
    var conduitPositions = [
      { from: { x: -32, y: 20, z: -32 }, to: { x: 32, y: 20, z: -32 } },
      { from: { x: -32, y: 20, z: -32 }, to: { x: -32, y: 20, z: 32 } },
      { from: { x: 32, y: 20, z: -32 }, to: { x: 32, y: 20, z: 32 } },
      { from: { x: -32, y: 20, z: 32 }, to: { x: 32, y: 20, z: 32 } },
      { from: { x: -32, y: 35, z: -32 }, to: { x: 0, y: 60, z: 0 } },
      { from: { x: 32, y: 35, z: -32 }, to: { x: 0, y: 60, z: 0 } },
      { from: { x: -32, y: 35, z: 32 }, to: { x: 0, y: 60, z: 0 } },
      { from: { x: 32, y: 35, z: 32 }, to: { x: 0, y: 60, z: 0 } }
    ];

    for (var i = 0; i < conduitPositions.length; i++) {
      var conduit = conduitPositions[i];
      var points = [
        new THREE.Vector3(conduit.from.x, conduit.from.y, conduit.from.z),
        new THREE.Vector3(conduit.to.x, conduit.to.y, conduit.to.z)
      ];
      var geom = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: deepPurple, linewidth: 3 });
      var line = new THREE.LineSegments(geom, material);
      addObject(line);
      energyConduits.push({ line: line, material: material });
    }
  }

  function createVoidPortal() {
    var portalGeom = new THREE.SphereGeometry(8, 32, 32);
    var portalMaterial = new THREE.MeshStandardMaterial({
      color: voidBlue,
      emissive: 0x1a3a5a,
      roughness: 0.3,
      metalness: 0.5
    });
    voidPortal = new THREE.Mesh(portalGeom, portalMaterial);
    voidPortal.position.set(0, 8, 0);
    addObject(voidPortal);

    // Portal inner sphere
    var innerGeom = new THREE.SphereGeometry(7, 16, 16);
    var innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x050a15,
      emissive: 0x2a1a5f,
      roughness: 0.8
    });
    var innerSphere = new THREE.Mesh(innerGeom, innerMaterial);
    innerSphere.position.set(0, 8, 0);
    addObject(innerSphere);
  }

  function createBoneDecorations() {
    var wallSpikes = [
      { x: -32, z: -32 },
      { x: 32, z: -32 },
      { x: -32, z: 32 },
      { x: 32, z: 32 }
    ];

    for (var i = 0; i < wallSpikes.length; i++) {
      var pos = wallSpikes[i];
      for (var j = 0; j < 3; j++) {
        var skullGeom = new THREE.SphereGeometry(2, 12, 12);
        var skullMaterial = new THREE.MeshStandardMaterial({ color: boneWhite, roughness: 0.4 });
        var skull = new THREE.Mesh(skullGeom, skullMaterial);
        skull.position.set(pos.x, 38 + (j * 5), pos.z);
        addObject(skull);

        // Eye sockets
        var eyeGeom = new THREE.SphereGeometry(0.5, 8, 8);
        var eyeMaterial = new THREE.MeshStandardMaterial({ color: shadowBlack });
        var eye1 = new THREE.Mesh(eyeGeom, eyeMaterial);
        eye1.position.set(pos.x - 0.8, 39 + (j * 5), pos.z + 1.5);
        addObject(eye1);
        var eye2 = new THREE.Mesh(eyeGeom, eyeMaterial);
        eye2.position.set(pos.x + 0.8, 39 + (j * 5), pos.z + 1.5);
        addObject(eye2);
      }
    }
  }

  function createDarkKnightStatues() {
    var statuePositions = [
      { x: -20, z: -25 },
      { x: 20, z: -25 },
      { x: -20, z: 25 },
      { x: 20, z: 25 }
    ];

    for (var i = 0; i < statuePositions.length; i++) {
      var pos = statuePositions[i];

      // Body
      var bodyGeom = new THREE.BoxGeometry(3, 8, 2);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: ironGray, roughness: 0.7 });
      var body = new THREE.Mesh(bodyGeom, bodyMaterial);
      body.position.set(pos.x, 4, pos.z);
      addObject(body);

      // Head
      var headGeom = new THREE.BoxGeometry(2.5, 2.5, 2);
      var headMaterial = new THREE.MeshStandardMaterial({ color: ironGray, roughness: 0.7 });
      var head = new THREE.Mesh(headGeom, headMaterial);
      head.position.set(pos.x, 9.5, pos.z);
      addObject(head);

      // Helmet spike
      var helmetGeom = new THREE.ConeGeometry(0.8, 3, 6);
      var helmetMaterial = new THREE.MeshStandardMaterial({ color: shadowBlack, roughness: 0.9 });
      var helmet = new THREE.Mesh(helmetGeom, helmetMaterial);
      helmet.position.set(pos.x, 11.5, pos.z);
      addObject(helmet);

      // Arms
      var armGeom = new THREE.BoxGeometry(1, 6, 1);
      var armMaterial = new THREE.MeshStandardMaterial({ color: ironGray, roughness: 0.7 });
      var arm1 = new THREE.Mesh(armGeom, armMaterial);
      arm1.position.set(pos.x - 2.5, 5, pos.z);
      addObject(arm1);
      var arm2 = new THREE.Mesh(armGeom, armMaterial);
      arm2.position.set(pos.x + 2.5, 5, pos.z);
      addObject(arm2);

      // Sword
      var swordGeom = new THREE.BoxGeometry(0.3, 10, 0.1);
      var swordMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6 });
      var sword = new THREE.Mesh(swordGeom, swordMaterial);
      sword.position.set(pos.x + 2, 8, pos.z - 1.5);
      sword.rotation.z = 0.3;
      addObject(sword);
    }
  }

  function createDungeonEntrance() {
    // Door frame
    var frameGeom = new THREE.BoxGeometry(10, 16, 1);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: ironGray, roughness: 0.8 });
    var frame = new THREE.Mesh(frameGeom, frameMaterial);
    frame.position.set(0, 8, 39.5);
    addObject(frame);

    // Door
    var doorGeom = new THREE.BoxGeometry(9.5, 15.5, 0.8);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a0a0a, roughness: 0.9 });
    var door = new THREE.Mesh(doorGeom, doorMaterial);
    door.position.set(0, 8, 39);
    addObject(door);

    // Iron bands
    for (var i = 0; i < 5; i++) {
      var bandGeom = new THREE.BoxGeometry(9.5, 0.5, 0.5);
      var bandMaterial = new THREE.MeshStandardMaterial({ color: ironGray, roughness: 0.7 });
      var band = new THREE.Mesh(bandGeom, bandMaterial);
      band.position.set(0, 3 + (i * 3), 39.3);
      addObject(band);
    }

    // Chains
    var chainPoints = [];
    for (var i = 0; i < 5; i++) {
      chainPoints.push(new THREE.Vector3(-4.5, 2 + (i * 3.5), 39.5));
      chainPoints.push(new THREE.Vector3(-4.5, 2 + (i * 3.5) + 1.8, 40.5));
    }
    for (var i = 0; i < 5; i++) {
      chainPoints.push(new THREE.Vector3(4.5, 2 + (i * 3.5), 39.5));
      chainPoints.push(new THREE.Vector3(4.5, 2 + (i * 3.5) + 1.8, 40.5));
    }
    var chainGeom = new THREE.BufferGeometry().setFromPoints(chainPoints);
    var chainMaterial = new THREE.LineBasicMaterial({ color: ironGray, linewidth: 2 });
    var chains = new THREE.LineSegments(chainGeom, chainMaterial);
    addObject(chains);
  }

  function createShadowFlameTorches() {
    var torchPositions = [
      { x: -28, z: -28 },
      { x: 28, z: -28 },
      { x: -28, z: 28 },
      { x: 28, z: 28 },
      { x: -15, z: -35 },
      { x: 15, z: -35 },
      { x: -15, z: 35 },
      { x: 15, z: 35 }
    ];

    for (var i = 0; i < torchPositions.length; i++) {
      var pos = torchPositions[i];

      // Torch pole
      var poleGeom = new THREE.CylinderGeometry(0.6, 0.8, 12, 8);
      var poleMaterial = new THREE.MeshStandardMaterial({ color: ironGray, roughness: 0.8 });
      var pole = new THREE.Mesh(poleGeom, poleMaterial);
      pole.position.set(pos.x, 6, pos.z);
      addObject(pole);

      // Flame base
      var flameBaseGeom = new THREE.CylinderGeometry(1.5, 1.5, 1, 8);
      var flameBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x2a0a2a, roughness: 0.7 });
      var flameBase = new THREE.Mesh(flameBaseGeom, flameBaseMaterial);
      flameBase.position.set(pos.x, 12, pos.z);
      addObject(flameBase);

      // Purple fire spheres (animated)
      for (var j = 0; j < 3; j++) {
        var fireGeom = new THREE.SphereGeometry(0.8 - (j * 0.2), 6, 6);
        var fireMaterial = new THREE.MeshStandardMaterial({
          color: deepPurple,
          emissive: 0x5d2a7f,
          roughness: 0.5
        });
        var fire = new THREE.Mesh(fireGeom, fireMaterial);
        fire.position.set(pos.x, 12.5 + (j * 0.8), pos.z);
        addObject(fire);
        torches.push({ fire: fire, baseY: 12.5 + (j * 0.8) });
      }
    }
  }

  function createSacrificeAltar() {
    // Altar platform
    var platformGeom = new THREE.BoxGeometry(12, 2, 12);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x1a0a0a, roughness: 0.95 });
    var platform = new THREE.Mesh(platformGeom, platformMaterial);
    platform.position.set(-20, 1, -15);
    addObject(platform);

    // Stain marks on altar
    var stainGeom = new THREE.BoxGeometry(11, 0.1, 11);
    var stainMaterial = new THREE.MeshStandardMaterial({ color: 0x2a1a1a, roughness: 0.98 });
    var stain = new THREE.Mesh(stainGeom, stainMaterial);
    stain.position.set(-20, 2.1, -15);
    addObject(stain);

    // Altar center pillar
    var pillarGeom = new THREE.CylinderGeometry(2, 2.5, 8, 8);
    var pillarMaterial = new THREE.MeshStandardMaterial({ color: shadowBlack, roughness: 0.9 });
    var pillar = new THREE.Mesh(pillarGeom, pillarMaterial);
    pillar.position.set(-20, 5, -15);
    addObject(pillar);

    // Chains around altar
    var chainPoints = [];
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x1 = -20 + Math.cos(angle) * 5;
      var z1 = -15 + Math.sin(angle) * 5;
      var x2 = -20 + Math.cos(angle) * 6.5;
      var z2 = -15 + Math.sin(angle) * 6.5;
      chainPoints.push(new THREE.Vector3(x1, 3, z1));
      chainPoints.push(new THREE.Vector3(x2, 1, z2));
    }
    var chainGeom = new THREE.BufferGeometry().setFromPoints(chainPoints);
    var chainMaterial = new THREE.LineBasicMaterial({ color: ironGray, linewidth: 2 });
    var chains = new THREE.LineSegments(chainGeom, chainMaterial);
    addObject(chains);
  }

  function createFlyingButtresses() {
    var buttressPositions = [
      { x: -30, z: -30, angle: 0 },
      { x: 30, z: -30, angle: Math.PI / 2 },
      { x: 30, z: 30, angle: Math.PI },
      { x: -30, z: 30, angle: 3 * Math.PI / 2 }
    ];

    for (var i = 0; i < buttressPositions.length; i++) {
      var pos = buttressPositions[i];
      for (var j = 0; j < 2; j++) {
        var buttressGeom = new THREE.BoxGeometry(2, 1, 14);
        var buttressMaterial = new THREE.MeshStandardMaterial({ color: shadowBlack, roughness: 0.9 });
        var buttress = new THREE.Mesh(buttressGeom, buttressMaterial);
        var offsetDist = 18 + (j * 8);
        var offsetHeight = 15 + (j * 8);
        var dx = Math.cos(pos.angle) * offsetDist;
        var dz = Math.sin(pos.angle) * offsetDist;
        buttress.position.set(pos.x - dx, offsetHeight, pos.z - dz);
        buttress.rotation.z = pos.angle + Math.PI / 4;
        addObject(buttress);
      }
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    citadelObjects = [];
    energyConduits = [];
    torches = [];

    createOuterWalls();
    createObsidianTowers();
    createMainGate();
    createCourtyard();
    createCentralSpire();
    createShadowEnergyConduits();
    createVoidPortal();
    createBoneDecorations();
    createDarkKnightStatues();
    createDungeonEntrance();
    createShadowFlameTorches();
    createSacrificeAltar();
    createFlyingButtresses();
  }

  function update(delta) {
    if (voidPortal) {
      portalRotation += delta * 0.3;
      voidPortal.rotation.x = portalRotation;
      voidPortal.rotation.y = portalRotation * 1.3;

      portalScale += portalDirection * delta * 0.2;
      if (portalScale >= 1.15) {
        portalDirection = -1;
      }
      if (portalScale <= 0.85) {
        portalDirection = 1;
      }
      voidPortal.scale.set(portalScale, portalScale, portalScale);
    }

    for (var i = 0; i < energyConduits.length; i++) {
      var conduit = energyConduits[i];
      var hue = (Date.now() * 0.0005 + i * 0.1) % 1;
      var color = new THREE.Color().setHSL(0.75 + hue * 0.1, 0.8, 0.4);
      conduit.material.color.set(color);
    }

    for (var i = 0; i < torches.length; i++) {
      var torch = torches[i];
      var flicker = 0.5 + Math.sin(Date.now() * 0.005 + i) * 0.5;
      torch.fire.position.y = torch.baseY + flicker * 0.8;
      torch.fire.scale.set(0.8 + flicker * 0.4, 1 + flicker * 0.3, 0.8 + flicker * 0.4);
    }
  }

  function reset() {
    for (var i = citadelObjects.length - 1; i >= 0; i--) {
      scene.remove(citadelObjects[i]);
    }
    citadelObjects = [];
    energyConduits = [];
    torches = [];
    voidPortal = null;
    portalRotation = 0;
    portalScale = 1;
    portalDirection = 1;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
