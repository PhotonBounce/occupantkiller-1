window.AbandonedChurch = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];
  var time = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    animatedObjects = [];
    time = 0;

    // Church nave - large stone box with gothic arches
    var naveGeometry = new THREE.BoxGeometry(20, 25, 40);
    var naveMaterial = new THREE.MeshPhongMaterial({ color: 0x888877 });
    var nave = new THREE.Mesh(naveGeometry, naveMaterial);
    nave.position.set(0, 12.5, 0);
    scene.add(nave);
    objects.push(nave);

    // Gothic arches - overlapping boxes for arch effect
    for (var i = 0; i < 4; i++) {
      var archGeometry = new THREE.BoxGeometry(3, 20, 1);
      var archMaterial = new THREE.MeshPhongMaterial({ color: 0x666655 });
      var arch = new THREE.Mesh(archGeometry, archMaterial);
      arch.position.set(-7 + i * 5, 15, 0);
      arch.rotation.z = Math.PI * 0.15;
      scene.add(arch);
      objects.push(arch);
    }

    // Bell tower - tall box with cylindrical bell
    var towerGeometry = new THREE.BoxGeometry(6, 30, 6);
    var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x777766 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(15, 15, -18);
    scene.add(tower);
    objects.push(tower);

    // Bell - cylinder that will swing
    var bellGeometry = new THREE.CylinderGeometry(2.5, 2.5, 3, 16);
    var bellMaterial = new THREE.MeshPhongMaterial({ color: 0x886633 });
    var bell = new THREE.Mesh(bellGeometry, bellMaterial);
    bell.position.set(15, 28, -18);
    scene.add(bell);
    objects.push(bell);
    animatedObjects.push({ object: bell, type: 'bell' });

    // Stained glass windows - colored panes with emissive
    var windowPositions = [
      { x: -10, z: 5 }, { x: -10, z: 15 }, { x: -10, z: 25 },
      { x: 10, z: 5 }, { x: 10, z: 15 }, { x: 10, z: 25 }
    ];
    var windowColors = [0xAA2244, 0x2244AA, 0xAA2244, 0x2244AA, 0xAA2244, 0x2244AA];
    for (var w = 0; w < windowPositions.length; w++) {
      var windowGeometry = new THREE.BoxGeometry(2, 5, 0.5);
      var windowMaterial = new THREE.MeshPhongMaterial({
        color: windowColors[w],
        emissive: windowColors[w],
        emissiveIntensity: 0.3
      });
      var window_obj = new THREE.Mesh(windowGeometry, windowMaterial);
      window_obj.position.set(windowPositions[w].x, 12, windowPositions[w].z);
      scene.add(window_obj);
      objects.push(window_obj);
      animatedObjects.push({ object: window_obj, type: 'stainedglass' });
    }

    // Pews - rows of dark wood boxes, some overturned
    var pewColor = 0x5C3D1F;
    var pewPositions = [
      { x: -6, z: -15, rotated: false }, { x: 0, z: -15, rotated: false }, { x: 6, z: -15, rotated: false },
      { x: -6, z: -5, rotated: false }, { x: 0, z: -5, rotated: true }, { x: 6, z: -5, rotated: false },
      { x: -6, z: 5, rotated: false }, { x: 0, z: 5, rotated: false }, { x: 6, z: 5, rotated: false },
      { x: -6, z: 15, rotated: true }, { x: 0, z: 15, rotated: false }, { x: 6, z: 15, rotated: false }
    ];
    for (var p = 0; p < pewPositions.length; p++) {
      var pewGeometry = new THREE.BoxGeometry(3, 2, 4);
      var pewMaterial = new THREE.MeshPhongMaterial({ color: pewColor });
      var pew = new THREE.Mesh(pewGeometry, pewMaterial);
      pew.position.set(pewPositions[p].x, 1, pewPositions[p].z);
      if (pewPositions[p].rotated) {
        pew.rotation.z = Math.PI * 0.3;
      }
      scene.add(pew);
      objects.push(pew);
    }

    // Altar platform - raised stone with ornate cross
    var altarGeometry = new THREE.BoxGeometry(8, 1, 8);
    var altarMaterial = new THREE.MeshPhongMaterial({ color: 0x888877 });
    var altar = new THREE.Mesh(altarGeometry, altarMaterial);
    altar.position.set(0, 1, 30);
    scene.add(altar);
    objects.push(altar);

    // Ornate cross - vertical and horizontal BoxGeometry pieces
    var crossVertGeometry = new THREE.BoxGeometry(1, 8, 1);
    var crossMaterial = new THREE.MeshPhongMaterial({ color: 0x886622 });
    var crossVert = new THREE.Mesh(crossVertGeometry, crossMaterial);
    crossVert.position.set(0, 6, 30);
    scene.add(crossVert);
    objects.push(crossVert);

    var crossHorizGeometry = new THREE.BoxGeometry(5, 1, 1);
    var crossHoriz = new THREE.Mesh(crossHorizGeometry, crossMaterial);
    crossHoriz.position.set(0, 3, 30);
    scene.add(crossHoriz);
    objects.push(crossHoriz);

    // Pipe organ - large box with tall cylinder pipes
    var organBoxGeometry = new THREE.BoxGeometry(8, 12, 3);
    var organMaterial = new THREE.MeshPhongMaterial({ color: 0x4A3A1F });
    var organBox = new THREE.Mesh(organBoxGeometry, organMaterial);
    organBox.position.set(-12, 8, 28);
    scene.add(organBox);
    objects.push(organBox);

    // Organ pipes - tall cylinders
    for (var o = 0; o < 5; o++) {
      var pipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 15, 8);
      var pipeMaterial = new THREE.MeshPhongMaterial({ color: 0x886633 });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.position.set(-14 + o * 2, 12, 28);
      scene.add(pipe);
      objects.push(pipe);
    }

    // Crypt entrance - dark stairwell going down
    var cryptGeometry = new THREE.BoxGeometry(6, 4, 6);
    var cryptMaterial = new THREE.MeshPhongMaterial({ color: 0x332222 });
    var crypt = new THREE.Mesh(cryptGeometry, cryptMaterial);
    crypt.position.set(12, 2, 20);
    scene.add(crypt);
    objects.push(crypt);

    // Candle stands with flickering flames
    var candlePositions = [
      { x: -8, z: 25 }, { x: 8, z: 25 }, { x: -4, z: 30 }, { x: 4, z: 30 }
    ];
    for (var c = 0; c < candlePositions.length; c++) {
      // Stand
      var standGeometry = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 8);
      var standMaterial = new THREE.MeshPhongMaterial({ color: 0x886633 });
      var stand = new THREE.Mesh(standGeometry, standMaterial);
      stand.position.set(candlePositions[c].x, 1, candlePositions[c].z);
      scene.add(stand);
      objects.push(stand);

      // Flame - sphere with emissive
      var flameGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var flameMaterial = new THREE.MeshPhongMaterial({
        color: 0xFF6600,
        emissive: 0xFF6600,
        emissiveIntensity: 0.6
      });
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(candlePositions[c].x, 2.5, candlePositions[c].z);
      scene.add(flame);
      objects.push(flame);
      animatedObjects.push({ object: flame, type: 'candle' });
    }

    // Collapsed roof sections - angled rubble
    var rubblePositions = [
      { x: -8, z: 10, angle: 0.4 }, { x: 8, z: 12, angle: -0.35 }, { x: 0, z: 5, angle: 0.3 },
      { x: -12, z: 20, angle: -0.4 }
    ];
    for (var r = 0; r < rubblePositions.length; r++) {
      var rubbleGeometry = new THREE.BoxGeometry(6, 1, 8);
      var rubbleMaterial = new THREE.MeshPhongMaterial({ color: 0x665544 });
      var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
      rubble.position.set(rubblePositions[r].x, 15 + r * 2, rubblePositions[r].z);
      rubble.rotation.z = rubblePositions[r].angle;
      scene.add(rubble);
      objects.push(rubble);
      animatedObjects.push({ object: rubble, type: 'rubble', baseY: rubble.position.y });
    }

    // Graveyard outside - headstones
    var headstonePositions = [
      { x: -25, z: -30 }, { x: -20, z: -35 }, { x: -15, z: -32 },
      { x: 20, z: -30 }, { x: 25, z: -35 }, { x: 30, z: -28 },
      { x: -28, z: 25 }, { x: -22, z: 28 }, { x: -30, z: 35 }
    ];
    for (var h = 0; h < headstonePositions.length; h++) {
      var stoneGeometry = new THREE.BoxGeometry(1.5, 3, 0.5);
      var stoneMaterial = new THREE.MeshPhongMaterial({ color: 0x888877 });
      var stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      stone.position.set(headstonePositions[h].x, 1.5, headstonePositions[h].z);
      stone.rotation.z = (Math.random() - 0.5) * 0.4;
      scene.add(stone);
      objects.push(stone);
    }

    // Cult ritual circle - emissive dark red sphere marking
    var circleGeometry = new THREE.SphereGeometry(4, 16, 2);
    var circleMaterial = new THREE.MeshPhongMaterial({
      color: 0x440000,
      emissive: 0x440000,
      emissiveIntensity: 0.2
    });
    var circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.position.set(-8, 0.1, 35);
    scene.add(circle);
    objects.push(circle);
    animatedObjects.push({ object: circle, type: 'ritual' });

    // Bat colony roost - small dark spheres circling
    for (var b = 0; b < 8; b++) {
      var batGeometry = new THREE.SphereGeometry(0.3, 6, 6);
      var batMaterial = new THREE.MeshPhongMaterial({ color: 0x221122 });
      var bat = new THREE.Mesh(batGeometry, batMaterial);
      var angle = (b / 8) * Math.PI * 2;
      bat.position.set(
        Math.cos(angle) * 5,
        20 + Math.sin(angle) * 3,
        Math.sin(angle) * 5
      );
      scene.add(bat);
      objects.push(bat);
      animatedObjects.push({ object: bat, type: 'bat', baseX: bat.position.x, baseZ: bat.position.z, index: b });
    }

    // Broken statues - toppled saint figures
    var statuePositions = [
      { x: 15, z: 5, rotated: true }, { x: -18, z: 10, rotated: true }, { x: 8, z: 32, rotated: false }
    ];
    for (var s = 0; s < statuePositions.length; s++) {
      var statueGeometry = new THREE.BoxGeometry(2, 5, 2);
      var statueMaterial = new THREE.MeshPhongMaterial({ color: 0x887766 });
      var statue = new THREE.Mesh(statueGeometry, statueMaterial);
      statue.position.set(statuePositions[s].x, 2.5, statuePositions[s].z);
      if (statuePositions[s].rotated) {
        statue.rotation.z = Math.PI * 0.4;
      }
      scene.add(statue);
      objects.push(statue);
    }

    // Enemy sniper nest in bell tower - implied location
    var nestGeometry = new THREE.BoxGeometry(3, 1, 3);
    var nestMaterial = new THREE.MeshPhongMaterial({ color: 0x555544 });
    var nest = new THREE.Mesh(nestGeometry, nestMaterial);
    nest.position.set(15, 26, -18);
    scene.add(nest);
    objects.push(nest);
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < animatedObjects.length; i++) {
      var item = animatedObjects[i];

      if (item.type === 'bell') {
        // Bell swinging
        item.object.rotation.z = Math.sin(time * 1.5) * 0.3;
      }
      else if (item.type === 'stainedglass') {
        // Stained glass pulsing
        var intensity = 0.2 + Math.sin(time * 2) * 0.15;
        item.object.material.emissiveIntensity = intensity;
      }
      else if (item.type === 'candle') {
        // Candle flames flickering
        var flicker = 0.5 + Math.sin(time * 8 + i) * 0.3 + Math.random() * 0.2;
        item.object.material.emissiveIntensity = flicker;
      }
      else if (item.type === 'rubble') {
        // Rubble dust settling
        var dustOffset = Math.sin(time * 0.5 + i) * 0.15;
        item.object.position.y = item.baseY + dustOffset;
      }
      else if (item.type === 'ritual') {
        // Cult ritual circle pulsing
        var ritualIntensity = 0.15 + Math.sin(time * 1.2) * 0.1;
        item.object.material.emissiveIntensity = ritualIntensity;
      }
      else if (item.type === 'bat') {
        // Bats circling
        var angle = (item.index / 8) * Math.PI * 2 + time * 1.2;
        var radius = 5 + Math.sin(time * 0.8) * 0.5;
        item.object.position.x = Math.cos(angle) * radius;
        item.object.position.z = Math.sin(angle) * radius;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
