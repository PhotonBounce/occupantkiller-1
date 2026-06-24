window.PirateGalleon = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var time = 0;

  // Animation helpers
  var animationState = {
    shipRoll: 0,
    sailBillow: 0,
    flagWave: 0,
    smokeScale: 0,
    chainSway: 0
  };

  function init(gameScene, gameCamera) {
    scene = gameScene;
    camera = gameCamera;
    objects = [];
    time = 0;

    // Ship hull - large curved box
    var hullGeometry = new THREE.BoxGeometry(50, 30, 120);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x4A2C1A });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 0;
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    objects.push({ mesh: hull, type: 'hull' });

    // Main mast
    var mastGeometry = new THREE.CylinderGeometry(2, 2.5, 100, 16);
    var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x5C3D1F });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(0, 50, 0);
    mast.castShadow = true;
    mast.receiveShadow = true;
    scene.add(mast);
    objects.push({ mesh: mast, type: 'mast' });

    // Crow's nest at mast top
    var nestGeometry = new THREE.BoxGeometry(12, 8, 12);
    var nestMaterial = new THREE.MeshStandardMaterial({ color: 0x5C3D1F });
    var nest = new THREE.Mesh(nestGeometry, nestMaterial);
    nest.position.set(0, 95, 0);
    nest.castShadow = true;
    nest.receiveShadow = true;
    scene.add(nest);
    objects.push({ mesh: nest, type: 'nest' });

    // Jolly Roger skull flag
    var flagGeometry = new THREE.BoxGeometry(15, 15, 1);
    var flagMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x222222 });
    var flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(5, 105, 0);
    flag.castShadow = true;
    scene.add(flag);
    objects.push({ mesh: flag, type: 'flag' });

    // Sail 1 - front
    var sail1Geometry = new THREE.BoxGeometry(40, 60, 2);
    var sailMaterial = new THREE.MeshStandardMaterial({ color: 0xEEDDCC });
    var sail1 = new THREE.Mesh(sail1Geometry, sailMaterial);
    sail1.position.set(-8, 40, -20);
    sail1.castShadow = true;
    sail1.receiveShadow = true;
    scene.add(sail1);
    objects.push({ mesh: sail1, type: 'sail' });

    // Sail 2 - middle
    var sail2Geometry = new THREE.BoxGeometry(35, 55, 2);
    var sail2 = new THREE.Mesh(sail2Geometry, sailMaterial);
    sail2.position.set(-6, 35, 10);
    sail2.castShadow = true;
    sail2.receiveShadow = true;
    scene.add(sail2);
    objects.push({ mesh: sail2, type: 'sail' });

    // Sail 3 - back
    var sail3Geometry = new THREE.BoxGeometry(30, 50, 2);
    var sail3 = new THREE.Mesh(sail3Geometry, sailMaterial);
    sail3.position.set(-4, 30, 35);
    sail3.castShadow = true;
    sail3.receiveShadow = true;
    scene.add(sail3);
    objects.push({ mesh: sail3, type: 'sail' });

    // Cannon deck
    var deckGeometry = new THREE.BoxGeometry(48, 4, 80);
    var deckMaterial = new THREE.MeshStandardMaterial({ color: 0x3A2810 });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(0, 16, 10);
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    objects.push({ mesh: deck, type: 'deck' });

    // Cannons along left side
    for (var i = 0; i < 4; i++) {
      var cannonBarrelGeometry = new THREE.CylinderGeometry(1.5, 1.8, 18, 12);
      var cannonMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var cannonBarrel = new THREE.Mesh(cannonBarrelGeometry, cannonMaterial);
      cannonBarrel.rotation.z = Math.PI / 2;
      cannonBarrel.position.set(-24, 18, -30 + i * 25);
      cannonBarrel.castShadow = true;
      scene.add(cannonBarrel);
      objects.push({ mesh: cannonBarrel, type: 'cannon' });

      // Cannon base
      var baseGeometry = new THREE.CylinderGeometry(3, 3.5, 3, 12);
      var base = new THREE.Mesh(baseGeometry, cannonMaterial);
      base.position.set(-24, 16, -30 + i * 25);
      base.castShadow = true;
      scene.add(base);
      objects.push({ mesh: base, type: 'cannonBase' });
    }

    // Cannons along right side
    for (var i = 0; i < 4; i++) {
      var cannonBarrelGeometry = new THREE.CylinderGeometry(1.5, 1.8, 18, 12);
      var cannonMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var cannonBarrel = new THREE.Mesh(cannonBarrelGeometry, cannonMaterial);
      cannonBarrel.rotation.z = Math.PI / 2;
      cannonBarrel.position.set(24, 18, -30 + i * 25);
      cannonBarrel.castShadow = true;
      scene.add(cannonBarrel);
      objects.push({ mesh: cannonBarrel, type: 'cannon' });

      // Cannon base
      var baseGeometry = new THREE.CylinderGeometry(3, 3.5, 3, 12);
      var base = new THREE.Mesh(baseGeometry, cannonMaterial);
      base.position.set(24, 16, -30 + i * 25);
      base.castShadow = true;
      scene.add(base);
      objects.push({ mesh: base, type: 'cannonBase' });
    }

    // Captain's quarters
    var quartersGeometry = new THREE.BoxGeometry(32, 20, 24);
    var quartersMaterial = new THREE.MeshStandardMaterial({ color: 0x4A2810 });
    var quarters = new THREE.Mesh(quartersGeometry, quartersMaterial);
    quarters.position.set(0, 26, -45);
    quarters.castShadow = true;
    quarters.receiveShadow = true;
    scene.add(quarters);
    objects.push({ mesh: quarters, type: 'quarters' });

    // Window 1
    var windowGeometry = new THREE.BoxGeometry(8, 6, 0.5);
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x88AACC });
    var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-12, 30, -57);
    scene.add(window1);
    objects.push({ mesh: window1, type: 'window' });

    // Window 2
    var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(12, 30, -57);
    scene.add(window2);
    objects.push({ mesh: window2, type: 'window' });

    // Plank bridge to dock
    var plankGeometry = new THREE.BoxGeometry(8, 2, 35);
    var plankMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4226 });
    var plank = new THREE.Mesh(plankGeometry, plankMaterial);
    plank.position.set(0, 0, -65);
    plank.rotation.z = 0.1;
    plank.castShadow = true;
    plank.receiveShadow = true;
    scene.add(plank);
    objects.push({ mesh: plank, type: 'plank' });

    // Rum barrel storage
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var barrelGeometry = new THREE.CylinderGeometry(3, 3, 6, 12);
        var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x884422 });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(-15 + i * 15, 3 + j * 7, 45);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        scene.add(barrel);
        objects.push({ mesh: barrel, type: 'barrel' });
      }
    }

    // Treasure hold below deck
    var holdGeometry = new THREE.BoxGeometry(45, 15, 90);
    var holdMaterial = new THREE.MeshStandardMaterial({ color: 0x2A1810 });
    var hold = new THREE.Mesh(holdGeometry, holdMaterial);
    hold.position.set(0, -12, 15);
    hold.castShadow = true;
    hold.receiveShadow = true;
    scene.add(hold);
    objects.push({ mesh: hold, type: 'hold' });

    // Gold chests in hold
    for (var i = 0; i < 3; i++) {
      var chestGeometry = new THREE.BoxGeometry(8, 6, 10);
      var chestMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0x8B7500 });
      var chest = new THREE.Mesh(chestGeometry, chestMaterial);
      chest.position.set(-15 + i * 15, -10, 10 + i * 5);
      chest.castShadow = true;
      scene.add(chest);
      objects.push({ mesh: chest, type: 'chest' });
    }

    // Brig prison cage
    var brigGeometry = new THREE.BoxGeometry(20, 12, 16);
    var brigMaterial = new THREE.MeshStandardMaterial({ color: 0x333322 });
    var brig = new THREE.Mesh(brigGeometry, brigMaterial);
    brig.position.set(0, -10, 50);
    brig.castShadow = true;
    brig.receiveShadow = true;
    scene.add(brig);
    objects.push({ mesh: brig, type: 'brig' });

    // Anchor chain links
    for (var i = 0; i < 6; i++) {
      var chainLinkGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
      var chainMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
      var chainLink = new THREE.Mesh(chainLinkGeometry, chainMaterial);
      chainLink.position.set(0, 8 - i * 5, -50);
      chainLink.castShadow = true;
      scene.add(chainLink);
      objects.push({ mesh: chainLink, type: 'chain' });
    }

    // Rigging ropes using LineSegments
    var ropeGeometry = new THREE.BufferGeometry();
    var ropePositions = new Float32Array([
      // Front ropes
      0, 90, 0,  -25, 20, -20,
      0, 90, 0,  25, 20, -20,
      // Middle ropes
      0, 90, 0,  -23, 20, 10,
      0, 90, 0,  23, 20, 10,
      // Back ropes
      0, 90, 0,  -20, 20, 35,
      0, 90, 0,  20, 20, 35,
      // Lower cross braces
      -25, 20, -20,  25, 20, -20,
      -23, 20, 10,  23, 20, 10,
      -20, 20, 35,  20, 20, 35
    ]);
    ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x665533, linewidth: 2 });
    var ropes = new THREE.LineSegments(ropeGeometry, ropeMaterial);
    scene.add(ropes);
    objects.push({ mesh: ropes, type: 'rigging' });

    // Cannon smoke effects
    for (var i = 0; i < 4; i++) {
      var smokeGeometry = new THREE.SphereGeometry(3, 8, 8);
      var smokeMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        emissive: 0x444444,
        opacity: 0.6,
        transparent: true
      });
      var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smoke.position.set(-24 + i * 16, 22, -30);
      smoke.scale.set(0.5, 0.5, 0.5);
      scene.add(smoke);
      objects.push({ mesh: smoke, type: 'smoke', originalScale: 0.5 });
    }
  }

  function update(delta) {
    if (!scene || !camera) return;

    time += delta;

    // Update animation states
    animationState.shipRoll = Math.sin(time * 0.3) * 0.02;
    animationState.sailBillow = Math.sin(time * 0.4) * 0.03;
    animationState.flagWave = Math.sin(time * 0.6) * 0.05;
    animationState.smokeScale = 0.5 + Math.sin(time * 0.5) * 0.3;
    animationState.chainSway = Math.sin(time * 0.35) * 0.08;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      var mesh = obj.mesh;

      if (obj.type === 'hull') {
        mesh.rotation.z = animationState.shipRoll;
      } else if (obj.type === 'sail') {
        mesh.rotation.z = animationState.sailBillow;
        mesh.scale.x = 0.95 + Math.sin(time * 0.4) * 0.05;
      } else if (obj.type === 'flag') {
        mesh.rotation.z = animationState.flagWave;
      } else if (obj.type === 'smoke') {
        mesh.scale.set(animationState.smokeScale, animationState.smokeScale, animationState.smokeScale);
        mesh.material.opacity = 0.4 + Math.sin(time * 0.4) * 0.2;
      } else if (obj.type === 'nest') {
        mesh.position.y = 95 + Math.sin(time * 0.3) * 1.5;
      } else if (obj.type === 'chain') {
        mesh.position.x = animationState.chainSway * 5;
      }
    }
  }

  function reset() {
    if (!scene) return;

    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i].mesh);
    }
    objects = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
