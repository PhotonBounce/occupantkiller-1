window.CathedralSiege = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animations = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    animations = [];

    // 1. Main cathedral floor
    var floorGeometry = new THREE.BoxGeometry(60, 1, 80);
    var floorMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);

    // 2. Bell tower structure (left)
    var towerGeometry = new THREE.BoxGeometry(8, 25, 8);
    var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    var tower1 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower1.position.set(-20, 12.5, -25);
    tower1.castShadow = true;
    tower1.receiveShadow = true;
    scene.add(tower1);
    objects.push(tower1);

    // 3. Bell in tower (large sphere)
    var bellGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    var bellMaterial = new THREE.MeshPhongMaterial({ color: 0xd4af37 });
    var bell = new THREE.Mesh(bellGeometry, bellMaterial);
    bell.position.set(-20, 20, -25);
    bell.castShadow = true;
    bell.receiveShadow = true;
    scene.add(bell);
    objects.push(bell);
    animations.push({
      object: bell,
      type: 'sway',
      angle: 0,
      speed: 0.03
    });

    // 4. Bell tower structure (right)
    var tower2 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower2.position.set(20, 12.5, -25);
    tower2.castShadow = true;
    tower2.receiveShadow = true;
    scene.add(tower2);
    objects.push(tower2);

    // 5. Right bell
    var bell2 = new THREE.Mesh(bellGeometry, bellMaterial);
    bell2.position.set(20, 20, -25);
    bell2.castShadow = true;
    bell2.receiveShadow = true;
    scene.add(bell2);
    objects.push(bell2);
    animations.push({
      object: bell2,
      type: 'sway',
      angle: Math.PI,
      speed: 0.03
    });

    // 6. Main nave walls (left side)
    var wallGeometry = new THREE.BoxGeometry(2, 20, 80);
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x6b5d55 });
    var wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
    wallLeft.position.set(-28, 10, 0);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);
    objects.push(wallLeft);

    // 7. Nave walls (right side)
    var wallRight = new THREE.Mesh(wallGeometry, wallMaterial);
    wallRight.position.set(28, 10, 0);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    scene.add(wallRight);
    objects.push(wallRight);

    // 8. Stained glass window 1 (colored glass block - red)
    var glassGeometry = new THREE.BoxGeometry(4, 6, 0.5);
    var glassMaterial1 = new THREE.MeshPhongMaterial({ color: 0xff3333, emissive: 0x550000 });
    var glassWindow1 = new THREE.Mesh(glassGeometry, glassMaterial1);
    glassWindow1.position.set(-28.5, 12, 30);
    glassWindow1.castShadow = true;
    glassWindow1.receiveShadow = true;
    scene.add(glassWindow1);
    objects.push(glassWindow1);

    // 9. Stained glass window 2 (blue)
    var glassMaterial2 = new THREE.MeshPhongMaterial({ color: 0x3333ff, emissive: 0x000055 });
    var glassWindow2 = new THREE.Mesh(glassGeometry, glassMaterial2);
    glassWindow2.position.set(28.5, 12, 30);
    glassWindow2.castShadow = true;
    glassWindow2.receiveShadow = true;
    scene.add(glassWindow2);
    objects.push(glassWindow2);

    // 10. Rose window frame (large cylinder)
    var roseFrameGeometry = new THREE.CylinderGeometry(5, 5, 0.3, 32);
    var roseMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    var roseFrame = new THREE.Mesh(roseFrameGeometry, roseMaterial);
    roseFrame.rotation.z = Math.PI / 2;
    roseFrame.position.set(0, 18, -35);
    roseFrame.castShadow = true;
    roseFrame.receiveShadow = true;
    scene.add(roseFrame);
    objects.push(roseFrame);

    // 11. Organ pipes (cone shapes)
    var pipeGeometry = new THREE.ConeGeometry(0.6, 5, 8);
    var pipeMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    for (var i = 0; i < 8; i++) {
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.position.set(-10 + (i * 2.5), 8, 25);
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      scene.add(pipe);
      objects.push(pipe);
      animations.push({
        object: pipe,
        type: 'fire',
        index: i,
        intensity: 0
      });
    }

    // 12. Pew barricades (rectangular boxes)
    var pewGeometry = new THREE.BoxGeometry(3, 1.2, 1);
    var pewMaterial = new THREE.MeshPhongMaterial({ color: 0x5c4033 });
    for (var j = 0; j < 4; j++) {
      var pew = new THREE.Mesh(pewGeometry, pewMaterial);
      pew.position.set(-15 + (j * 10), 0.6, 5 + (j * 3));
      pew.castShadow = true;
      pew.receiveShadow = true;
      scene.add(pew);
      objects.push(pew);
    }

    // 13. Crypt entrance (below altar)
    var cryptGeometry = new THREE.BoxGeometry(6, 0.5, 8);
    var cryptMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var cryptEntrance = new THREE.Mesh(cryptGeometry, cryptMaterial);
    cryptEntrance.position.set(0, 0.25, 35);
    cryptEntrance.castShadow = true;
    cryptEntrance.receiveShadow = true;
    scene.add(cryptEntrance);
    objects.push(cryptEntrance);

    // 14. Gargoyle observation post (cone shape on pedestal)
    var gargoyleGeometry = new THREE.ConeGeometry(1.5, 3, 4);
    var gargoyleMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var gargoyle1 = new THREE.Mesh(gargoyleGeometry, gargoyleMaterial);
    gargoyle1.position.set(-15, 22, -15);
    gargoyle1.castShadow = true;
    gargoyle1.receiveShadow = true;
    scene.add(gargoyle1);
    objects.push(gargoyle1);
    animations.push({
      object: gargoyle1,
      type: 'rotate',
      speed: 0.01
    });

    // 15. Gargoyle observation post (right)
    var gargoyle2 = new THREE.Mesh(gargoyleGeometry, gargoyleMaterial);
    gargoyle2.position.set(15, 22, -15);
    gargoyle2.castShadow = true;
    gargoyle2.receiveShadow = true;
    scene.add(gargoyle2);
    objects.push(gargoyle2);
    animations.push({
      object: gargoyle2,
      type: 'rotate',
      speed: 0.01
    });

    // 16. Baptismal font (sphere)
    var fontGeometry = new THREE.SphereGeometry(2, 32, 32);
    var fontMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var baptismalFont = new THREE.Mesh(fontGeometry, fontMaterial);
    baptismalFont.position.set(-20, 1, 15);
    baptismalFont.castShadow = true;
    baptismalFont.receiveShadow = true;
    scene.add(baptismalFont);
    objects.push(baptismalFont);

    // 17. Confession booth (box structure)
    var boothGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    var boothMaterial = new THREE.MeshPhongMaterial({ color: 0x5c4033 });
    var booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.set(20, 1.25, 15);
    booth.castShadow = true;
    booth.receiveShadow = true;
    scene.add(booth);
    objects.push(booth);

    // 18. Collapsed nave ceiling rubble (scattered boxes)
    var rubbleGeometry = new THREE.BoxGeometry(2, 2, 2);
    var rubbleMaterial = new THREE.MeshPhongMaterial({ color: 0x7a6b5d });
    for (var k = 0; k < 6; k++) {
      var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
      rubble.position.set(-8 + (k * 3), 10 + (Math.random() * 2), -10 + (Math.random() * 5));
      rubble.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      scene.add(rubble);
      objects.push(rubble);
    }

    // 19. Candles (small cylinders with flame animation)
    var candleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 16);
    var candleMaterial = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
    for (var m = 0; m < 5; m++) {
      var candle = new THREE.Mesh(candleGeometry, candleMaterial);
      candle.position.set(-15 + (m * 8), 1, 40);
      candle.castShadow = true;
      candle.receiveShadow = true;
      scene.add(candle);
      objects.push(candle);
      animations.push({
        object: candle,
        type: 'flicker',
        intensity: 0.5
      });
    }

    // 20. Altar platform
    var altarGeometry = new THREE.BoxGeometry(8, 1.5, 6);
    var altarMaterial = new THREE.MeshPhongMaterial({ color: 0xc0a080 });
    var altar = new THREE.Mesh(altarGeometry, altarMaterial);
    altar.position.set(0, 0.75, 38);
    altar.castShadow = true;
    altar.receiveShadow = true;
    scene.add(altar);
    objects.push(altar);
  }

  function update(delta) {
    for (var i = 0; i < animations.length; i++) {
      var anim = animations[i];

      if (anim.type === 'sway') {
        anim.angle += anim.speed;
        var swayAmount = Math.sin(anim.angle) * 0.15;
        anim.object.rotation.z = swayAmount;
      }

      if (anim.type === 'rotate') {
        anim.object.rotation.y += anim.speed;
      }

      if (anim.type === 'flicker') {
        var flicker = Math.random() * 0.3;
        anim.object.material.emissive.setHex(Math.floor((0.8 + flicker) * 65535));
      }

      if (anim.type === 'fire') {
        anim.intensity = (anim.intensity + 0.02) % 1;
        var fireGlow = Math.sin(anim.intensity * Math.PI) * 0.5;
        anim.object.material.emissive.setHex(Math.floor(0xff6600 * fireGlow));
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    animations = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
