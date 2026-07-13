window.SniperTower = (function() {
  'use strict';

  var objects = [];
  var scene = null;
  var camera = null;
  var animationData = {};

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    animationData = {
      flagRotation: 0,
      laserBlink: 0,
      windSpin: 0,
      ropeSway: 0,
      thermoBob: 0
    };

    // Main tower lattice frame - vertical steel structure
    var latticeGeometry = new THREE.CylinderGeometry(2, 2, 35, 8);
    var latticeMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var latticeFrame = new THREE.Mesh(latticeGeometry, latticeMaterial);
    latticeFrame.position.set(0, 17.5, 0);
    latticeFrame.castShadow = true;
    latticeFrame.receiveShadow = true;
    scene.add(latticeFrame);
    objects.push(latticeFrame);

    // Climbing rungs - horizontal bars
    var rungGeometry = new THREE.CylinderGeometry(0.15, 0.15, 5, 6);
    var rungMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    for (var i = 0; i < 8; i++) {
      var rung = new THREE.Mesh(rungGeometry, rungMaterial);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, 5 + i * 4, 0);
      rung.castShadow = true;
      scene.add(rung);
      objects.push(rung);
    }

    // Platform level 1 - base platform
    var platform1Geometry = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 16);
    var platformMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var platform1 = new THREE.Mesh(platform1Geometry, platformMaterial);
    platform1.position.set(0, 10, 0);
    platform1.castShadow = true;
    platform1.receiveShadow = true;
    scene.add(platform1);
    objects.push(platform1);

    // Platform level 2 - middle platform
    var platform2 = new THREE.Mesh(platform1Geometry, platformMaterial);
    platform2.position.set(0, 20, 0);
    platform2.castShadow = true;
    platform2.receiveShadow = true;
    scene.add(platform2);
    objects.push(platform2);

    // Platform level 3 - upper platform
    var platform3Geometry = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 16);
    var platform3 = new THREE.Mesh(platform3Geometry, platformMaterial);
    platform3.position.set(0, 30, 0);
    platform3.castShadow = true;
    platform3.receiveShadow = true;
    scene.add(platform3);
    objects.push(platform3);

    // Spotting scope rig 1 - upper level
    var scopeBaseGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8);
    var scopeMaterial = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
    var scopeBase1 = new THREE.Mesh(scopeBaseGeometry, scopeMaterial);
    scopeBase1.position.set(2, 20.5, -1.5);
    scopeBase1.castShadow = true;
    scene.add(scopeBase1);
    objects.push(scopeBase1);

    var scopeTubeGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 8);
    var scopeTube1 = new THREE.Mesh(scopeTubeGeometry, scopeMaterial);
    scopeTube1.rotation.z = Math.PI / 6;
    scopeTube1.position.set(2.8, 21.2, -1.5);
    scopeTube1.castShadow = true;
    scene.add(scopeTube1);
    objects.push(scopeTube1);

    // Spotting scope rig 2 - lower level
    var scopeBase2 = new THREE.Mesh(scopeBaseGeometry, scopeMaterial);
    scopeBase2.position.set(-2, 10.5, 1.8);
    scopeBase2.castShadow = true;
    scene.add(scopeBase2);
    objects.push(scopeBase2);

    var scopeTube2 = new THREE.Mesh(scopeTubeGeometry, scopeMaterial);
    scopeTube2.rotation.z = Math.PI / 5;
    scopeTube2.position.set(-2.7, 11.3, 1.8);
    scopeTube2.castShadow = true;
    scene.add(scopeTube2);
    objects.push(scopeTube2);

    // Wind indicator flags
    var flagGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.1);
    var flagMaterial = new THREE.MeshPhongMaterial({ color: 0xff4444 });
    var flag1 = new THREE.Mesh(flagGeometry, flagMaterial);
    flag1.position.set(3.5, 28, 2);
    flag1.castShadow = true;
    scene.add(flag1);
    objects.push(flag1);
    animationData.flag1 = flag1;

    var flag2 = new THREE.Mesh(flagGeometry, flagMaterial);
    flag2.position.set(-3.5, 28, -2);
    flag2.castShadow = true;
    scene.add(flag2);
    objects.push(flag2);
    animationData.flag2 = flag2;

    // Ballistic calculation board - mounted on platform 2
    var boardGeometry = new THREE.BoxGeometry(2, 1.5, 0.1);
    var boardMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    var board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set(-3, 20.4, 2.5);
    board.rotation.y = Math.PI / 8;
    board.castShadow = true;
    scene.add(board);
    objects.push(board);

    // Empty brass casings - scattered on platform 1
    var casingGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.4, 8);
    var casingMaterial = new THREE.MeshPhongMaterial({ color: 0xcd7f32 });
    var casing1 = new THREE.Mesh(casingGeometry, casingMaterial);
    casing1.position.set(1.2, 10.3, 0.8);
    casing1.castShadow = true;
    scene.add(casing1);
    objects.push(casing1);

    var casing2 = new THREE.Mesh(casingGeometry, casingMaterial);
    casing2.position.set(-0.5, 10.3, 1.5);
    casing2.castShadow = true;
    scene.add(casing2);
    objects.push(casing2);

    var casing3 = new THREE.Mesh(casingGeometry, casingMaterial);
    casing3.position.set(2.5, 10.3, -1.2);
    casing3.castShadow = true;
    scene.add(casing3);
    objects.push(casing3);

    // Parachute drop bag
    var bagGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    var bagMaterial = new THREE.MeshPhongMaterial({ color: 0x336633 });
    var dropBag = new THREE.Mesh(bagGeometry, bagMaterial);
    dropBag.position.set(2.2, 10.8, -2.5);
    dropBag.castShadow = true;
    scene.add(dropBag);
    objects.push(dropBag);

    // Emergency rope rappel - hanging structure
    var ropeSegments = [];
    for (var j = 0; j < 10; j++) {
      var ropeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 4);
      var ropeMaterial = new THREE.MeshPhongMaterial({ color: 0xddaa44 });
      var ropePart = new THREE.Mesh(ropeGeometry, ropeMaterial);
      ropePart.position.set(3.8, 28 - (j * 2.5), 1);
      ropePart.castShadow = true;
      scene.add(ropePart);
      objects.push(ropePart);
      ropeSegments.push(ropePart);
    }
    animationData.ropeParts = ropeSegments;

    // Laser designator tripod base
    var tripodGeometry = new THREE.CylinderGeometry(0.3, 0.5, 0.8, 6);
    var tripodMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
    var tripodBase = new THREE.Mesh(tripodGeometry, tripodMaterial);
    tripodBase.position.set(-2.5, 10.3, -2.5);
    tripodBase.castShadow = true;
    scene.add(tripodBase);
    objects.push(tripodBase);

    // Laser designator head - articulated
    var laserHeadGeometry = new THREE.ConeGeometry(0.25, 0.8, 8);
    var laserMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0x330000 });
    var laserHead = new THREE.Mesh(laserHeadGeometry, laserMaterial);
    laserHead.position.set(-2.5, 11.3, -2.5);
    laserHead.rotation.z = Math.PI / 4;
    laserHead.castShadow = true;
    scene.add(laserHead);
    objects.push(laserHead);
    animationData.laserHead = laserHead;

    // Wind indicator spinner - rotating device
    var spinnerGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 16);
    var spinnerMaterial = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
    var spinner = new THREE.Mesh(spinnerGeometry, spinnerMaterial);
    spinner.position.set(0, 32, 0);
    spinner.castShadow = true;
    scene.add(spinner);
    objects.push(spinner);
    animationData.spinner = spinner;

    // Thermal monocular mount
    var monocularBaseGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.3);
    var monocularMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var monocularMount = new THREE.Mesh(monocularBaseGeometry, monocularMaterial);
    monocularMount.position.set(3.2, 30.3, -1.8);
    monocularMount.castShadow = true;
    scene.add(monocularMount);
    objects.push(monocularMount);

    var monocularHeadGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    var monocularHead = new THREE.Mesh(monocularHeadGeometry, monocularMaterial);
    monocularHead.position.set(3.2, 31.2, -1.8);
    monocularHead.castShadow = true;
    scene.add(monocularHead);
    objects.push(monocularHead);
    animationData.monocularHead = monocularHead;

    // Secondary ladder with broken rungs
    var ladderGeometry = new THREE.BoxGeometry(1.5, 0.15, 0.15);
    var ladderMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    for (var k = 0; k < 10; k++) {
      if (k !== 5 && k !== 7) {
        var ladderRung = new THREE.Mesh(ladderGeometry, ladderMaterial);
        ladderRung.position.set(-3.5, 8 + k * 2.2, 2);
        ladderRung.castShadow = true;
        scene.add(ladderRung);
        objects.push(ladderRung);
      }
    }

    // Structural cross-braces
    var braceGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4.5, 6);
    var braceMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var brace1 = new THREE.Mesh(braceGeometry, braceMaterial);
    brace1.rotation.z = Math.PI / 4;
    brace1.position.set(2.2, 15, -2.2);
    brace1.castShadow = true;
    scene.add(brace1);
    objects.push(brace1);

    var brace2 = new THREE.Mesh(braceGeometry, braceMaterial);
    brace2.rotation.z = -Math.PI / 4;
    brace2.position.set(-2.2, 25, 2.2);
    brace2.castShadow = true;
    scene.add(brace2);
    objects.push(brace2);

    // Sandbag fortifications on platform 1
    var sandbagGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.5);
    var sandbagMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7d6b });
    var sandbag1 = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
    sandbag1.position.set(3, 10.4, -2);
    sandbag1.castShadow = true;
    scene.add(sandbag1);
    objects.push(sandbag1);

    var sandbag2 = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
    sandbag2.position.set(-3, 10.4, 2);
    sandbag2.castShadow = true;
    scene.add(sandbag2);
    objects.push(sandbag2);

    return objects.length;
  }

  function update(delta) {
    if (!animationData) return;

    // Wind flag wavering animation
    if (animationData.flag1) {
      animationData.flagRotation += delta * 2;
      animationData.flag1.rotation.z = Math.sin(animationData.flagRotation) * 0.3;
      animationData.flag1.rotation.x = Math.cos(animationData.flagRotation * 0.7) * 0.15;
    }
    if (animationData.flag2) {
      animationData.flag2.rotation.z = Math.sin(animationData.flagRotation + Math.PI / 3) * 0.3;
      animationData.flag2.rotation.x = Math.cos((animationData.flagRotation + Math.PI / 3) * 0.7) * 0.15;
    }

    // Laser designator blinking and pulsing
    if (animationData.laserHead) {
      animationData.laserBlink += delta * 3;
      var blinkValue = (Math.sin(animationData.laserBlink) + 1) / 2;
      animationData.laserHead.material.emissive.setHSL(0, 1, blinkValue * 0.4);
      animationData.laserHead.rotation.y += delta * 0.5;
    }

    // Wind indicator spinner rotation
    if (animationData.spinner) {
      animationData.windSpin += delta * 1.2;
      animationData.spinner.rotation.z = animationData.windSpin;
    }

    // Rappel rope sway animation
    if (animationData.ropeParts && animationData.ropeParts.length > 0) {
      animationData.ropeSway += delta * 1.5;
      for (var i = 0; i < animationData.ropeParts.length; i++) {
        var offset = Math.sin(animationData.ropeSway + i * 0.3) * 0.15;
        animationData.ropeParts[i].position.x = 3.8 + offset;
      }
    }

    // Thermal monocular bobbing
    if (animationData.monocularHead) {
      animationData.thermoBob += delta * 2;
      var bobOffset = Math.sin(animationData.thermoBob) * 0.1;
      animationData.monocularHead.position.y = 31.2 + bobOffset;
    }
  }

  function reset() {
    if (scene && objects && objects.length > 0) {
      for (var i = objects.length - 1; i >= 0; i--) {
        scene.remove(objects[i]);
      }
    }
    objects = [];
    animationData = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
