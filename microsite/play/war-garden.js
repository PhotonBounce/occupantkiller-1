window.WarGarden = (function() {
  'use strict';

  var scene;
  var camera;
  var environmentObjects;
  var updateables;
  var fountainWaterDroplets;
  var fallingPetals;
  var rotatingLights;
  var time;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    environmentObjects = [];
    updateables = [];
    fountainWaterDroplets = [];
    fallingPetals = [];
    rotatingLights = [];
    time = 0;

    scene.background = new THREE.Color(0x2a3a2a);
    scene.fog = new THREE.Fog(0x2a3a2a, 150, 300);

    createGround();
    createPerimeterHedges();
    createCentralFountain();
    createGreenhouseStructure();
    createRoseGardenTracks();
    createGardenPartyShelter();
    createMarbleStatuePedestals();
    createIrrigationTunnelEntrances();
    createGardenGnomeBunkers();
    createTopiarRubble();
    createLighting();
    createFountainEffects();
    createPetalEmitters();

    return true;
  }

  function createGround() {
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x3d4d3d,
      roughness: 0.8,
      metalness: 0.0
    });

    var groundGeo = new THREE.BoxGeometry(80, 0.5, 80);
    var groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.25;
    groundMesh.castShadow = true;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
    environmentObjects.push(groundMesh);
  }

  function createPerimeterHedges() {
    var hedgeMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a1a,
      roughness: 0.6,
      metalness: 0.0
    });

    var positions = [
      { x: -38, z: 0, length: 76 },
      { x: 38, z: 0, length: 76 },
      { x: 0, z: -38, length: 76 },
      { x: 0, z: 38, length: 76 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var isHorizontal = i < 2;
      var width = isHorizontal ? 2 : pos.length;
      var depth = isHorizontal ? pos.length : 2;

      var hedgeGeo = new THREE.BoxGeometry(width, 8, depth);
      var hedgeMesh = new THREE.Mesh(hedgeGeo, hedgeMat);
      hedgeMesh.position.set(pos.x, 4, pos.z);
      hedgeMesh.castShadow = true;
      hedgeMesh.receiveShadow = true;
      scene.add(hedgeMesh);
      environmentObjects.push(hedgeMesh);
    }
  }

  function createCentralFountain() {
    var baseRadius = 12;
    var columnRadius = 1.5;

    var marbleMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.3,
      metalness: 0.1
    });

    var basGeo = new THREE.CylinderGeometry(baseRadius, baseRadius, 1.5, 32);
    var baseMesh = new THREE.Mesh(basGeo, marbleMat);
    baseMesh.position.set(0, 0.75, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    environmentObjects.push(baseMesh);

    var rimGeo = new THREE.CylinderGeometry(baseRadius + 0.3, baseRadius - 0.5, 0.8, 32);
    var rimMesh = new THREE.Mesh(rimGeo, marbleMat);
    rimMesh.position.set(0, 2.2, 0);
    rimMesh.castShadow = true;
    rimMesh.receiveShadow = true;
    scene.add(rimMesh);
    environmentObjects.push(rimMesh);

    var colGeo = new THREE.CylinderGeometry(columnRadius, columnRadius, 6, 16);
    var colMesh = new THREE.Mesh(colGeo, marbleMat);
    colMesh.position.set(0, 4, 0);
    colMesh.castShadow = true;
    colMesh.receiveShadow = true;
    scene.add(colMesh);
    environmentObjects.push(colMesh);

    var capGeo = new THREE.SphereGeometry(columnRadius * 1.3, 16, 16);
    var capMesh = new THREE.Mesh(capGeo, marbleMat);
    capMesh.position.set(0, 7.2, 0);
    capMesh.castShadow = true;
    capMesh.receiveShadow = true;
    scene.add(capMesh);
    environmentObjects.push(capMesh);

    createCrackedFountainSection();
  }

  function createCrackedFountainSection() {
    var damageColor = new THREE.Color(0x8b7355);
    var damageMat = new THREE.MeshStandardMaterial({
      color: damageColor,
      roughness: 0.7,
      metalness: 0.0
    });

    var debrisGeo1 = new THREE.BoxGeometry(3, 2, 1.5);
    var debrisMesh1 = new THREE.Mesh(debrisGeo1, damageMat);
    debrisMesh1.position.set(-8, 2, -5);
    debrisMesh1.rotation.z = 0.5;
    debrisMesh1.castShadow = true;
    debrisMesh1.receiveShadow = true;
    scene.add(debrisMesh1);
    environmentObjects.push(debrisMesh1);

    var debrisGeo2 = new THREE.BoxGeometry(2.5, 1.8, 2);
    var debrisMesh2 = new THREE.Mesh(debrisGeo2, damageMat);
    debrisMesh2.position.set(7, 1.5, -6);
    debrisMesh2.rotation.z = -0.6;
    debrisMesh2.castShadow = true;
    debrisMesh2.receiveShadow = true;
    scene.add(debrisMesh2);
    environmentObjects.push(debrisMesh2);
  }

  function createGreenhouseStructure() {
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.4,
      metalness: 0.8
    });

    var glassMat = new THREE.MeshStandardMaterial({
      color: 0x4a9eff,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });

    var gwBase = 22;
    var gwHeight = 10;

    var mainWall1 = new THREE.BoxGeometry(gwBase, gwHeight, 0.4);
    var wall1Mesh = new THREE.Mesh(mainWall1, glassMat);
    wall1Mesh.position.set(-20, gwHeight / 2, 22);
    wall1Mesh.castShadow = true;
    wall1Mesh.receiveShadow = true;
    scene.add(wall1Mesh);
    environmentObjects.push(wall1Mesh);

    var mainWall2 = new THREE.BoxGeometry(gwBase, gwHeight, 0.4);
    var wall2Mesh = new THREE.Mesh(mainWall2, glassMat);
    wall2Mesh.position.set(-20, gwHeight / 2, -22);
    wall2Mesh.castShadow = true;
    wall2Mesh.receiveShadow = true;
    scene.add(wall2Mesh);
    environmentObjects.push(wall2Mesh);

    var sideWall1 = new THREE.BoxGeometry(0.4, gwHeight, 44);
    var swall1Mesh = new THREE.Mesh(sideWall1, glassMat);
    swall1Mesh.position.set(-31, gwHeight / 2, 0);
    swall1Mesh.castShadow = true;
    swall1Mesh.receiveShadow = true;
    scene.add(swall1Mesh);
    environmentObjects.push(swall1Mesh);

    var sideWall2 = new THREE.BoxGeometry(0.4, gwHeight, 44);
    var swall2Mesh = new THREE.Mesh(sideWall2, glassMat);
    swall2Mesh.position.set(-9, gwHeight / 2, 0);
    swall2Mesh.castShadow = true;
    swall2Mesh.receiveShadow = true;
    scene.add(swall2Mesh);
    environmentObjects.push(swall2Mesh);

    var roofGeo = new THREE.ConeGeometry(gwBase / 2, 4, 4);
    var roofMesh = new THREE.Mesh(roofGeo, frameMat);
    roofMesh.position.set(-20, gwHeight, 0);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    scene.add(roofMesh);
    environmentObjects.push(roofMesh);

    var frameGeo = new THREE.BoxGeometry(20, 0.3, 0.3);
    var frame1 = new THREE.Mesh(frameGeo, frameMat);
    frame1.position.set(-20, 2, 22);
    frame1.castShadow = true;
    frame1.receiveShadow = true;
    scene.add(frame1);
    environmentObjects.push(frame1);

    var frame2 = new THREE.Mesh(frameGeo, frameMat);
    frame2.position.set(-20, 5, 22);
    frame2.castShadow = true;
    frame2.receiveShadow = true;
    scene.add(frame2);
    environmentObjects.push(frame2);

    var frame3 = new THREE.Mesh(frameGeo, frameMat);
    frame3.position.set(-20, 8, 22);
    frame3.castShadow = true;
    frame3.receiveShadow = true;
    scene.add(frame3);
    environmentObjects.push(frame3);
  }

  function createRoseGardenTracks() {
    var mudMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.9,
      metalness: 0.0
    });

    var trackGeo = new THREE.BoxGeometry(4, 0.2, 25);
    var track1 = new THREE.Mesh(trackGeo, mudMat);
    track1.position.set(15, 0.1, -10);
    track1.castShadow = true;
    track1.receiveShadow = true;
    scene.add(track1);
    environmentObjects.push(track1);

    var track2 = new THREE.Mesh(trackGeo, mudMat);
    track2.position.set(25, 0.1, 5);
    track2.castShadow = true;
    track2.receiveShadow = true;
    scene.add(track2);
    environmentObjects.push(track2);

    var trackGeo2 = new THREE.BoxGeometry(2, 0.15, 15);
    var track3 = new THREE.Mesh(trackGeo2, mudMat);
    track3.position.set(18, 0.08, 15);
    track3.castShadow = true;
    track3.receiveShadow = true;
    scene.add(track3);
    environmentObjects.push(track3);
  }

  function createGardenPartyShelter() {
    var tableMat = new THREE.MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.6,
      metalness: 0.1
    });

    var tableTop = new THREE.BoxGeometry(6, 0.4, 4);
    var table1Top = new THREE.Mesh(tableTop, tableMat);
    table1Top.position.set(20, 1.5, -25);
    table1Top.castShadow = true;
    table1Top.receiveShadow = true;
    scene.add(table1Top);
    environmentObjects.push(table1Top);

    var tableLeg = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    var leg1 = new THREE.Mesh(tableLeg, tableMat);
    leg1.position.set(17, 0.75, -23.5);
    leg1.castShadow = true;
    leg1.receiveShadow = true;
    scene.add(leg1);
    environmentObjects.push(leg1);

    var leg2 = new THREE.Mesh(tableLeg, tableMat);
    leg2.position.set(23, 0.75, -23.5);
    leg2.castShadow = true;
    leg2.receiveShadow = true;
    scene.add(leg2);
    environmentObjects.push(leg2);

    var leg3 = new THREE.Mesh(tableLeg, tableMat);
    leg3.position.set(17, 0.75, -26.5);
    leg3.castShadow = true;
    leg3.receiveShadow = true;
    scene.add(leg3);
    environmentObjects.push(leg3);

    var leg4 = new THREE.Mesh(tableLeg, tableMat);
    leg4.position.set(23, 0.75, -26.5);
    leg4.castShadow = true;
    leg4.receiveShadow = true;
    scene.add(leg4);
    environmentObjects.push(leg4);

    var table2Top = new THREE.Mesh(tableTop, tableMat);
    table2Top.position.set(-15, 1.5, 20);
    table2Top.castShadow = true;
    table2Top.receiveShadow = true;
    scene.add(table2Top);
    environmentObjects.push(table2Top);

    var leg5 = new THREE.Mesh(tableLeg, tableMat);
    leg5.position.set(-18, 0.75, 18.5);
    leg5.castShadow = true;
    leg5.receiveShadow = true;
    scene.add(leg5);
    environmentObjects.push(leg5);

    var leg6 = new THREE.Mesh(tableLeg, tableMat);
    leg6.position.set(-12, 0.75, 18.5);
    leg6.castShadow = true;
    leg6.receiveShadow = true;
    scene.add(leg6);
    environmentObjects.push(leg6);

    var leg7 = new THREE.Mesh(tableLeg, tableMat);
    leg7.position.set(-18, 0.75, 21.5);
    leg7.castShadow = true;
    leg7.receiveShadow = true;
    scene.add(leg7);
    environmentObjects.push(leg7);

    var leg8 = new THREE.Mesh(tableLeg, tableMat);
    leg8.position.set(-12, 0.75, 21.5);
    leg8.castShadow = true;
    leg8.receiveShadow = true;
    scene.add(leg8);
    environmentObjects.push(leg8);
  }

  function createMarbleStatuePedestals() {
    var pedalMat = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      roughness: 0.2,
      metalness: 0.3
    });

    var pedalGeo = new THREE.BoxGeometry(3, 5, 3);
    var pedalPos1 = new THREE.Mesh(pedalGeo, pedalMat);
    pedalPos1.position.set(-30, 2.5, 20);
    pedalPos1.castShadow = true;
    pedalPos1.receiveShadow = true;
    scene.add(pedalPos1);
    environmentObjects.push(pedalPos1);

    var capGeo = new THREE.SphereGeometry(2, 16, 16);
    var cap1 = new THREE.Mesh(capGeo, pedalMat);
    cap1.position.set(-30, 6, 20);
    cap1.castShadow = true;
    cap1.receiveShadow = true;
    scene.add(cap1);
    environmentObjects.push(cap1);

    var pedalPos2 = new THREE.Mesh(pedalGeo, pedalMat);
    pedalPos2.position.set(30, 2.5, -15);
    pedalPos2.castShadow = true;
    pedalPos2.receiveShadow = true;
    scene.add(pedalPos2);
    environmentObjects.push(pedalPos2);

    var cap2 = new THREE.Mesh(capGeo, pedalMat);
    cap2.position.set(30, 6, -15);
    cap2.castShadow = true;
    cap2.receiveShadow = true;
    scene.add(cap2);
    environmentObjects.push(cap2);

    var pedalPos3 = new THREE.Mesh(pedalGeo, pedalMat);
    pedalPos3.position.set(25, 2.5, 25);
    pedalPos3.castShadow = true;
    pedalPos3.receiveShadow = true;
    scene.add(pedalPos3);
    environmentObjects.push(pedalPos3);

    var cap3 = new THREE.Mesh(capGeo, pedalMat);
    cap3.position.set(25, 6, 25);
    cap3.castShadow = true;
    cap3.receiveShadow = true;
    scene.add(cap3);
    environmentObjects.push(cap3);
  }

  function createIrrigationTunnelEntrances() {
    var entranceMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.0
    });

    var tunnelGeo = new THREE.CylinderGeometry(2.5, 2.5, 3, 16);
    var tunnel1 = new THREE.Mesh(tunnelGeo, entranceMat);
    tunnel1.position.set(-20, 1.5, -30);
    tunnel1.castShadow = true;
    tunnel1.receiveShadow = true;
    scene.add(tunnel1);
    environmentObjects.push(tunnel1);

    var tunnel2 = new THREE.Mesh(tunnelGeo, entranceMat);
    tunnel2.position.set(20, 1.5, 30);
    tunnel2.castShadow = true;
    tunnel2.receiveShadow = true;
    scene.add(tunnel2);
    environmentObjects.push(tunnel2);

    var rimGeo = new THREE.CylinderGeometry(2.8, 2.5, 0.3, 16);
    var rim1 = new THREE.Mesh(rimGeo, entranceMat);
    rim1.position.set(-20, 3.2, -30);
    rim1.castShadow = true;
    rim1.receiveShadow = true;
    scene.add(rim1);
    environmentObjects.push(rim1);

    var rim2 = new THREE.Mesh(rimGeo, entranceMat);
    rim2.position.set(20, 3.2, 30);
    rim2.castShadow = true;
    rim2.receiveShadow = true;
    scene.add(rim2);
    environmentObjects.push(rim2);
  }

  function createGardenGnomeBunkers() {
    var gnomeMat = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      roughness: 0.5,
      metalness: 0.2
    });

    var bodyGeo = new THREE.SphereGeometry(1, 16, 16);
    var gnome1Body = new THREE.Mesh(bodyGeo, gnomeMat);
    gnome1Body.position.set(-35, 0.8, 0);
    gnome1Body.castShadow = true;
    gnome1Body.receiveShadow = true;
    scene.add(gnome1Body);
    environmentObjects.push(gnome1Body);

    var hatGeo = new THREE.ConeGeometry(0.8, 1.2, 16);
    var hat1 = new THREE.Mesh(hatGeo, gnomeMat);
    hat1.position.set(-35, 1.9, 0);
    hat1.castShadow = true;
    hat1.receiveShadow = true;
    scene.add(hat1);
    environmentObjects.push(hat1);

    var gnome2Body = new THREE.Mesh(bodyGeo, gnomeMat);
    gnome2Body.position.set(35, 0.8, -35);
    gnome2Body.castShadow = true;
    gnome2Body.receiveShadow = true;
    scene.add(gnome2Body);
    environmentObjects.push(gnome2Body);

    var hat2 = new THREE.Mesh(hatGeo, gnomeMat);
    hat2.position.set(35, 1.9, -35);
    hat2.castShadow = true;
    hat2.receiveShadow = true;
    scene.add(hat2);
    environmentObjects.push(hat2);

    var gnome3Body = new THREE.Mesh(bodyGeo, gnomeMat);
    gnome3Body.position.set(-10, 0.8, 35);
    gnome3Body.castShadow = true;
    gnome3Body.receiveShadow = true;
    scene.add(gnome3Body);
    environmentObjects.push(gnome3Body);

    var hat3 = new THREE.Mesh(hatGeo, gnomeMat);
    hat3.position.set(-10, 1.9, 35);
    hat3.castShadow = true;
    hat3.receiveShadow = true;
    scene.add(hat3);
    environmentObjects.push(hat3);
  }

  function createTopiarRubble() {
    var rubbeMat = new THREE.MeshStandardMaterial({
      color: 0x4a6b4a,
      roughness: 0.7,
      metalness: 0.0
    });

    var rubblePositions = [
      { x: 8, z: -20, scale: 1.2 },
      { x: -25, z: 10, scale: 1.0 },
      { x: 30, z: 15, scale: 1.1 },
      { x: -8, z: -35, scale: 0.9 }
    ];

    for (var i = 0; i < rubblePositions.length; i++) {
      var rub = rubblePositions[i];
      var rubGeo = new THREE.BoxGeometry(4 * rub.scale, 2 * rub.scale, 3 * rub.scale);
      var rubMesh = new THREE.Mesh(rubGeo, rubbeMat);
      rubMesh.position.set(rub.x, 1 * rub.scale, rub.z);
      rubMesh.rotation.z = Math.random() * 0.5;
      rubMesh.rotation.x = Math.random() * 0.3;
      rubMesh.castShadow = true;
      rubMesh.receiveShadow = true;
      scene.add(rubMesh);
      environmentObjects.push(rubMesh);
    }
  }

  function createLighting() {
    var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(40, 50, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    scene.add(sunLight);
    updateables.push({ object: sunLight, type: 'sun' });

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var fountainLight = new THREE.PointLight(0x87ceeb, 0.6, 30);
    fountainLight.position.set(0, 8, 0);
    fountainLight.castShadow = true;
    scene.add(fountainLight);
    rotatingLights.push(fountainLight);

    var greenLight = new THREE.PointLight(0x00ff00, 0.4, 25);
    greenLight.position.set(-20, 6, 22);
    greenLight.castShadow = true;
    scene.add(greenLight);
    rotatingLights.push(greenLight);

    var amberLight = new THREE.PointLight(0xffaa00, 0.5, 20);
    amberLight.position.set(25, 5, -25);
    amberLight.castShadow = true;
    scene.add(amberLight);
    rotatingLights.push(amberLight);
  }

  function createFountainEffects() {
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
      metalness: 0.0
    });

    var dropletGeo = new THREE.SphereGeometry(0.1, 8, 8);

    for (var i = 0; i < 20; i++) {
      var droplet = new THREE.Mesh(dropletGeo, waterMat);
      var angle = (i / 20) * Math.PI * 2;
      var radius = 2 + Math.random() * 2;
      droplet.position.set(
        Math.cos(angle) * radius,
        4 + Math.random() * 3,
        Math.sin(angle) * radius
      );
      droplet.velocity = {
        x: Math.cos(angle) * (0.5 + Math.random() * 1),
        y: -0.5 - Math.random() * 0.5,
        z: Math.sin(angle) * (0.5 + Math.random() * 1)
      };
      scene.add(droplet);
      fountainWaterDroplets.push(droplet);
    }
  }

  function createPetalEmitters() {
    var petalMat = new THREE.MeshStandardMaterial({
      color: 0xff69b4,
      emissive: 0xff1493,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

    var petalGeo = new THREE.ConeGeometry(0.15, 0.3, 4);

    for (var i = 0; i < 15; i++) {
      var petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(
        (Math.random() - 0.5) * 40,
        30 + Math.random() * 10,
        (Math.random() - 0.5) * 40
      );
      petal.velocity = {
        x: (Math.random() - 0.5) * 0.3,
        y: -(0.3 + Math.random() * 0.2),
        z: (Math.random() - 0.5) * 0.3
      };
      petal.rotation.x = Math.random() * Math.PI;
      petal.rotation.z = Math.random() * Math.PI;
      scene.add(petal);
      fallingPetals.push(petal);
    }
  }

  function updateFountainWater(delta) {
    for (var i = fountainWaterDroplets.length - 1; i >= 0; i--) {
      var drop = fountainWaterDroplets[i];
      drop.velocity.y -= 9.8 * delta;
      drop.position.add(new THREE.Vector3(
        drop.velocity.x * delta,
        drop.velocity.y * delta,
        drop.velocity.z * delta
      ));

      if (drop.position.y < 0) {
        drop.position.set(
          Math.cos(Math.random() * Math.PI * 2) * (2 + Math.random() * 2),
          4 + Math.random() * 2,
          Math.sin(Math.random() * Math.PI * 2) * (2 + Math.random() * 2)
        );
        drop.velocity.y = -0.5 - Math.random() * 0.5;
      }
    }
  }

  function updatePetals(delta) {
    for (var i = fallingPetals.length - 1; i >= 0; i--) {
      var petal = fallingPetals[i];
      petal.position.add(new THREE.Vector3(
        petal.velocity.x * delta,
        petal.velocity.y * delta,
        petal.velocity.z * delta
      ));

      petal.rotation.x += (Math.random() - 0.5) * delta;
      petal.rotation.z += (Math.random() - 0.5) * delta;

      if (petal.position.y < -5) {
        petal.position.set(
          (Math.random() - 0.5) * 40,
          30 + Math.random() * 10,
          (Math.random() - 0.5) * 40
        );
      }
    }
  }

  function updateLights(delta) {
    time += delta;

    for (var i = 0; i < rotatingLights.length; i++) {
      var light = rotatingLights[i];
      if (i === 0) {
        light.intensity = 0.6 + Math.sin(time * 1.5) * 0.3;
      } else if (i === 1) {
        light.intensity = 0.4 + Math.sin(time * 1.2 + Math.PI / 3) * 0.2;
      } else if (i === 2) {
        light.intensity = 0.5 + Math.sin(time * 1.8 + Math.PI / 2) * 0.25;
      }
    }
  }

  function update(delta) {
    if (!scene || !camera) {
      return;
    }

    updateFountainWater(delta);
    updatePetals(delta);
    updateLights(delta);
  }

  function reset() {
    if (!scene) {
      return;
    }

    var objectsToRemove = [];
    for (var i = 0; i < scene.children.length; i++) {
      var child = scene.children[i];
      if (child !== camera) {
        objectsToRemove.push(child);
      }
    }

    for (var j = 0; j < objectsToRemove.length; j++) {
      scene.remove(objectsToRemove[j]);
    }

    environmentObjects = [];
    updateables = [];
    fountainWaterDroplets = [];
    fallingPetals = [];
    rotatingLights = [];
    time = 0;

    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
