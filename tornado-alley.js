window.TornadoAlley = (function() {
  'use strict';

  var scene, camera, renderer;
  var tornadoGroup, debrisOrbit, debrisCloud;
  var lightningFlash, sirenLight;
  var hudElement;
  var windSpeed = 'F4';
  var militiaCount = 5;
  var civiliansRescued = 0;
  var hudVisible = false;
  var lastHKeyTime = 0;
  var lastTKeyTime = 0;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    // 1. Ground — flat dark green/brown box (400×0.3×400)
    var groundGeo = new THREE.BoxGeometry(400, 0.3, 400);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x3a4a20 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.15;
    scene.add(ground);

    // 2. Tornado funnel — 8 stacked boxes decreasing in size
    tornadoGroup = new THREE.Group();
    tornadoGroup.position.set(0, 0, 0);
    var tornadoBase = 80;
    var tornadoHeight = 200;
    var boxHeightPerSegment = tornadoHeight / 8;

    for (var i = 0; i < 8; i++) {
      var scale = 1 - (i / 8) * 0.85;
      var width = tornadoBase * scale;
      var depth = tornadoBase * scale;
      var boxGeo = new THREE.BoxGeometry(width, boxHeightPerSegment, depth);
      var boxMat = new THREE.MeshStandardMaterial({
        color: 0x404040,
        emissive: 0x101010,
        wireframe: false
      });
      var box = new THREE.Mesh(boxGeo, boxMat);
      box.position.y = i * boxHeightPerSegment + boxHeightPerSegment / 2;
      box.castShadow = true;
      box.receiveShadow = true;
      tornadoGroup.add(box);
    }
    scene.add(tornadoGroup);

    // 3. Three destroyed houses
    var housePositions = [
      { x: -120, z: -150 },
      { x: 100, z: -180 },
      { x: -80, z: 160 }
    ];
    for (var h = 0; h < 3; h++) {
      var houseGroup = new THREE.Group();
      houseGroup.position.set(housePositions[h].x, 0, housePositions[h].z);

      // Main house structure (ruins)
      var houseGeo = new THREE.BoxGeometry(40, 35, 40);
      var houseMat = new THREE.MeshStandardMaterial({ color: 0x8b6347 });
      var house = new THREE.Mesh(houseGeo, houseMat);
      house.position.y = 17.5;
      house.castShadow = true;
      house.receiveShadow = true;
      houseGroup.add(house);

      // Rubble pieces (roof missing, some chunks)
      for (var r = 0; r < 3; r++) {
        var rubbleGeo = new THREE.BoxGeometry(15, 8, 15);
        var rubbleMat = new THREE.MeshStandardMaterial({ color: 0x6b4423 });
        var rubble = new THREE.Mesh(rubbleGeo, rubbleMat);
        rubble.position.set(
          (Math.random() - 0.5) * 60,
          40 + Math.random() * 20,
          (Math.random() - 0.5) * 60
        );
        rubble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        houseGroup.add(rubble);
      }

      scene.add(houseGroup);
    }

    // 4. Four flying debris pieces orbiting tornado
    debrisOrbit = new THREE.Group();
    debrisOrbit.position.set(0, 80, 0);
    for (var d = 0; d < 4; d++) {
      var debrisGeo = new THREE.BoxGeometry(12, 6, 12);
      var debrisMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
      var debris = new THREE.Mesh(debrisGeo, debrisMat);
      var angle = (d / 4) * Math.PI * 2;
      debris.position.set(Math.cos(angle) * 60, Math.sin(angle * 0.5) * 30, Math.sin(angle) * 60);
      debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      debrisOrbit.add(debris);
    }
    scene.add(debrisOrbit);

    // 5. Storm chaser truck — white box truck
    var truckGroup = new THREE.Group();
    truckGroup.position.set(-200, 0, 100);

    var cabGeo = new THREE.BoxGeometry(20, 20, 30);
    var truckMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var cab = new THREE.Mesh(cabGeo, truckMat);
    cab.position.y = 10;
    cab.castShadow = true;
    truckGroup.add(cab);

    var bedGeo = new THREE.BoxGeometry(30, 15, 50);
    var bed = new THREE.Mesh(bedGeo, truckMat);
    bed.position.set(5, 7.5, 0);
    bed.castShadow = true;
    truckGroup.add(bed);

    // Satellite dish on roof
    var dishGeo = new THREE.BoxGeometry(15, 1, 15);
    var dishMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.y = 25;
    dish.castShadow = true;
    truckGroup.add(dish);

    scene.add(truckGroup);

    // 6. FEMA emergency tent — large green box tent
    var tentGeo = new THREE.BoxGeometry(80, 40, 60);
    var tentMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d });
    var tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.set(150, 20, 120);
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);

    // Red cross marking on tent
    var crossGeo = new THREE.BoxGeometry(2, 25, 15);
    var crossMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    var crossH = new THREE.Mesh(crossGeo, crossMat);
    crossH.position.set(150, 30, 120);
    scene.add(crossH);

    var crossVGeo = new THREE.BoxGeometry(15, 25, 2);
    var crossV = new THREE.Mesh(crossVGeo, crossMat);
    crossV.position.set(150, 30, 120);
    scene.add(crossV);

    // 7. Five militia figures — camouflage boxes
    var militiaPositions = [
      { x: -50, z: -80 },
      { x: 30, z: -100 },
      { x: -120, z: 50 },
      { x: 60, z: 120 },
      { x: -30, z: 140 }
    ];
    for (var m = 0; m < 5; m++) {
      var militiaGroup = new THREE.Group();
      militiaGroup.position.set(militiaPositions[m].x, 0, militiaPositions[m].z);

      // Body
      var militiaGeo = new THREE.BoxGeometry(8, 20, 8);
      var militiaMat = new THREE.MeshStandardMaterial({ color: 0x4a5c3a });
      var militiaBody = new THREE.Mesh(militiaGeo, militiaMat);
      militiaBody.position.y = 10;
      militiaBody.castShadow = true;
      militiaGroup.add(militiaBody);

      // Weapon (small box)
      var weaponGeo = new THREE.BoxGeometry(2, 12, 2);
      var weaponMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      var weapon = new THREE.Mesh(weaponGeo, weaponMat);
      weapon.position.set(5, 15, 0);
      weapon.rotation.z = Math.PI / 6;
      militiaGroup.add(weapon);

      scene.add(militiaGroup);
    }

    // 8. Three FEMA responder figures — orange vest boxes
    var femaPositions = [
      { x: 140, z: 110 },
      { x: 160, z: 130 },
      { x: 120, z: 125 }
    ];
    for (var f = 0; f < 3; f++) {
      var femaGroup = new THREE.Group();
      femaGroup.position.set(femaPositions[f].x, 0, femaPositions[f].z);

      // Body with orange vest
      var femaGeo = new THREE.BoxGeometry(8, 20, 8);
      var femaMat = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
      var femaBody = new THREE.Mesh(femaGeo, femaMat);
      femaBody.position.y = 10;
      femaBody.castShadow = true;
      femaGroup.add(femaBody);

      scene.add(femaGroup);
    }

    // 9. Two overturned cars
    var carPositions = [
      { x: -150, z: 50 },
      { x: 80, z: 180 }
    ];
    for (var c = 0; c < 2; c++) {
      var carGroup = new THREE.Group();
      carGroup.position.set(carPositions[c].x, 5, carPositions[c].z);
      carGroup.rotation.z = Math.PI / 4;

      // Car body
      var carGeo = new THREE.BoxGeometry(20, 15, 40);
      var carMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
      var carBody = new THREE.Mesh(carGeo, carMat);
      carBody.castShadow = true;
      carGroup.add(carBody);

      // Fire effect (orange box on top)
      if (c === 0) {
        var fireGeo = new THREE.BoxGeometry(18, 10, 35);
        var fireMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400 });
        var fire = new THREE.Mesh(fireGeo, fireMat);
        fire.position.y = 12;
        carGroup.add(fire);
      }

      scene.add(carGroup);
    }

    // 10. Uprooted tree — horizontal cylinder trunk + root sphere cluster
    var treeGroup = new THREE.Group();
    treeGroup.position.set(200, 30, -80);
    treeGroup.rotation.z = Math.PI / 3;

    // Trunk (horizontal cylinder approximation using box)
    var trunkGeo = new THREE.BoxGeometry(12, 12, 80);
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    var trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Roots cluster on one end
    for (var ro = 0; ro < 5; ro++) {
      var rootGeo = new THREE.BoxGeometry(8, 8, 8);
      var rootMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
      var root = new THREE.Mesh(rootGeo, rootMat);
      root.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        -45 + (Math.random() - 0.5) * 20
      );
      treeGroup.add(root);
    }

    scene.add(treeGroup);

    // 11. Power line pole — tall thin box pole + crossbar + drooping wire
    var poleGroup = new THREE.Group();
    poleGroup.position.set(-180, 0, -120);

    // Pole
    var poleGeo = new THREE.BoxGeometry(4, 120, 4);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 60;
    pole.castShadow = true;
    poleGroup.add(pole);

    // Crossbar
    var crossbarGeo = new THREE.BoxGeometry(40, 4, 4);
    var crossbar = new THREE.Mesh(crossbarGeo, poleMat);
    crossbar.position.y = 100;
    crossbar.castShadow = true;
    poleGroup.add(crossbar);

    // Drooping wire (sagging boxes)
    for (var w = 0; w < 3; w++) {
      var wireGeo = new THREE.BoxGeometry(2, 2, 30);
      var wireMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var wire = new THREE.Mesh(wireGeo, wireMat);
      wire.position.set(-15 + w * 15, 95 - Math.abs(w - 1) * 5, 0);
      wire.rotation.z = 0.1;
      poleGroup.add(wire);
    }

    scene.add(poleGroup);

    // 12. Dark storm sky — large dark purple box overhead
    var skyGeo = new THREE.BoxGeometry(600, 1, 600);
    var skyMat = new THREE.MeshStandardMaterial({ color: 0x1a0a30 });
    var sky = new THREE.Mesh(skyGeo, skyMat);
    sky.position.y = 280;
    scene.add(sky);

    // 13. Lightning flash — emissive white box that pulses
    var lightningGeo = new THREE.BoxGeometry(400, 1, 400);
    var lightningMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0
    });
    lightningFlash = new THREE.Mesh(lightningGeo, lightningMat);
    lightningFlash.position.y = 270;
    scene.add(lightningFlash);

    // 14. Three sandbag flood barriers — stacked flat box clusters
    var barrierPositions = [
      { x: -100, z: 200 },
      { x: 50, z: 210 },
      { x: 120, z: 190 }
    ];
    for (var b = 0; b < 3; b++) {
      var barrierGroup = new THREE.Group();
      barrierGroup.position.set(barrierPositions[b].x, 0, barrierPositions[b].z);

      for (var ba = 0; ba < 3; ba++) {
        for (var bb = 0; bb < 4; bb++) {
          var bagGeo = new THREE.BoxGeometry(12, 6, 12);
          var bagMat = new THREE.MeshStandardMaterial({ color: 0xcc9933 });
          var bag = new THREE.Mesh(bagGeo, bagMat);
          bag.position.set(ba * 14, bb * 7, 0);
          bag.castShadow = true;
          barrierGroup.add(bag);
        }
      }

      scene.add(barrierGroup);
    }

    // 15. Emergency siren tower — pole + spinning warning light sphere
    var sirenGroup = new THREE.Group();
    sirenGroup.position.set(160, 0, -100);

    // Tower pole
    var sirenPoleGeo = new THREE.BoxGeometry(3, 80, 3);
    var sirenPoleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var sirenPole = new THREE.Mesh(sirenPoleGeo, sirenPoleMat);
    sirenPole.position.y = 40;
    sirenPole.castShadow = true;
    sirenGroup.add(sirenPole);

    // Warning light (sphere that blinks)
    var lightGeo = new THREE.BoxGeometry(8, 8, 8);
    var lightMat = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff4400,
      emissiveIntensity: 0.5
    });
    sirenLight = new THREE.Mesh(lightGeo, lightMat);
    sirenLight.position.y = 85;
    sirenLight.castShadow = true;
    sirenGroup.add(sirenLight);

    scene.add(sirenGroup);

    // 16. Flooded street section — flat reflective blue box low to ground
    var floodGeo = new THREE.BoxGeometry(120, 0.5, 80);
    var floodMat = new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      metalness: 0.6,
      roughness: 0.2
    });
    var flood = new THREE.Mesh(floodGeo, floodMat);
    flood.position.set(-50, 0.2, 180);
    flood.receiveShadow = true;
    scene.add(flood);

    // 17. Debris cloud — 20 tiny rotating boxes in cluster
    debrisCloud = new THREE.Group();
    debrisCloud.position.set(0, 50, 0);
    for (var dc = 0; dc < 20; dc++) {
      var cloudDebrisGeo = new THREE.BoxGeometry(4, 4, 4);
      var cloudDebrisMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      var cloudDebris = new THREE.Mesh(cloudDebrisGeo, cloudDebrisMat);
      cloudDebris.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
      debrisCloud.add(cloudDebris);
    }
    scene.add(debrisCloud);

    // HUD setup
    createHUD();

    // Key event listeners for HUD toggle (H then T within 400ms)
    document.addEventListener('keydown', handleHUDToggle);
  }

  function createHUD() {
    if (hudElement) {
      document.body.removeChild(hudElement);
    }

    hudElement = document.createElement('div');
    hudElement.style.position = 'fixed';
    hudElement.style.top = '10px';
    hudElement.style.left = '10px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.display = hudVisible ? 'block' : 'none';
    hudElement.style.zIndex = '1000';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '1px solid #00ff00';

    hudElement.innerHTML =
      'WIND SPEED: ' + windSpeed + '<br>' +
      'MILITIA ACTIVE: ' + militiaCount + '<br>' +
      'CIVILIANS RESCUED: ' + civiliansRescued + '/3';

    document.body.appendChild(hudElement);
  }

  function handleHUDToggle(event) {
    var now = Date.now();

    if (event.key === 'h' || event.key === 'H') {
      lastHKeyTime = now;
    } else if ((event.key === 't' || event.key === 'T') && now - lastHKeyTime < 400) {
      hudVisible = !hudVisible;
      if (hudElement) {
        hudElement.style.display = hudVisible ? 'block' : 'none';
      }
      lastHKeyTime = 0;
    }
  }

  function update(delta) {
    if (!scene) return;

    // Rotate tornado funnel
    if (tornadoGroup) {
      tornadoGroup.rotation.y += 0.08;
    }

    // Orbit debris around tornado
    if (debrisOrbit) {
      debrisOrbit.rotation.y += 0.05;
      var debrisChildren = debrisOrbit.children;
      for (var i = 0; i < debrisChildren.length; i++) {
        debrisChildren[i].rotation.x += 0.02;
        debrisChildren[i].rotation.y += 0.03;
      }
    }

    // Debris cloud spin
    if (debrisCloud) {
      debrisCloud.rotation.x += 0.01;
      debrisCloud.rotation.y += 0.015;
      debrisCloud.rotation.z += 0.008;
    }

    // Lightning flash pulse
    if (lightningFlash) {
      var flashTime = (Date.now() * 0.001) % 3;
      if (flashTime > 2.5) {
        lightningFlash.material.emissiveIntensity = 0.8;
      } else {
        lightningFlash.material.emissiveIntensity = 0;
      }
    }

    // Siren blinking
    if (sirenLight) {
      var sirenTime = (Date.now() * 0.002) % 1;
      if (sirenTime > 0.7) {
        sirenLight.material.emissiveIntensity = 0.8;
      } else {
        sirenLight.material.emissiveIntensity = 0.2;
      }
    }
  }

  function reset() {
    windSpeed = 'F4';
    militiaCount = 5;
    civiliansRescued = 0;
    hudVisible = false;
    lastHKeyTime = 0;
    lastTKeyTime = 0;

    if (hudElement) {
      createHUD();
    }

    if (tornadoGroup) {
      tornadoGroup.rotation.y = 0;
    }
    if (debrisOrbit) {
      debrisOrbit.rotation.y = 0;
    }
    if (debrisCloud) {
      debrisCloud.rotation.set(0, 0, 0);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
