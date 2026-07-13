window.DesertTemple = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];
  var time = 0;

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    animatedObjects = [];
    time = 0;

    // Temple facade columns (6 tall CylinderGeometry sandstone)
    var columnGeometry = new THREE.CylinderGeometry(1.2, 1.4, 8, 12);
    var columnMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
    var columnPositions = [
      [-8, 4, 0],
      [-4, 4, 0],
      [0, 4, 0],
      [4, 4, 0],
      [8, 4, 0],
      [12, 4, 0]
    ];
    for (var i = 0; i < columnPositions.length; i++) {
      var column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(columnPositions[i][0], columnPositions[i][1], columnPositions[i][2]);
      scene.add(column);
      objects.push(column);
    }

    // Carved stone altar (BoxGeometry with ornate top layer)
    var altarBase = new THREE.Mesh(
      new THREE.BoxGeometry(6, 2, 4),
      new THREE.MeshStandardMaterial({ color: 0xC4A882 })
    );
    altarBase.position.set(2, 1, -8);
    scene.add(altarBase);
    objects.push(altarBase);

    var altarTop = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.8, 5),
      new THREE.MeshStandardMaterial({ color: 0xB8956A })
    );
    altarTop.position.set(2, 3, -8);
    scene.add(altarTop);
    objects.push(altarTop);

    // Sacrificial pit (deep dark BoxGeometry)
    var pit = new THREE.Mesh(
      new THREE.BoxGeometry(4, 6, 3),
      new THREE.MeshStandardMaterial({ color: 0x443322 })
    );
    pit.position.set(2, -2.5, -15);
    scene.add(pit);
    objects.push(pit);

    // Golden idol statue (CylinderGeometry base + SphereGeometry head)
    var idolBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.3 })
    );
    idolBase.position.set(2, 1, -8);
    scene.add(idolBase);
    objects.push(idolBase);
    animatedObjects.push({ obj: idolBase, type: 'idol' });

    var idolHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.3 })
    );
    idolHead.position.set(2, 3, -8);
    scene.add(idolHead);
    objects.push(idolHead);

    // Trap dart wall mechanisms (CylinderGeometry barrel holes)
    var dartWallPositions = [
      [-10, 3, -20],
      [0, 3, -20],
      [10, 3, -20]
    ];
    for (var i = 0; i < dartWallPositions.length; i++) {
      var dartMech = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0x888866 })
      );
      dartMech.rotation.z = Math.PI / 2;
      dartMech.position.set(dartWallPositions[i][0], dartWallPositions[i][1], dartWallPositions[i][2]);
      scene.add(dartMech);
      objects.push(dartMech);
      animatedObjects.push({ obj: dartMech, type: 'dart' });
    }

    // Pressure plate tiles (BoxGeometry slightly raised)
    var plateTiles = [
      [-5, 0.3, -5],
      [0, 0.3, -5],
      [5, 0.3, -5],
      [-5, 0.3, 0],
      [0, 0.3, 0],
      [5, 0.3, 0]
    ];
    var plateMaterial = new THREE.MeshStandardMaterial({ color: 0x998855 });
    for (var i = 0; i < plateTiles.length; i++) {
      var plate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 1.5), plateMaterial);
      plate.position.set(plateTiles[i][0], plateTiles[i][1], plateTiles[i][2]);
      scene.add(plate);
      objects.push(plate);
    }

    // Hieroglyphic wall panels with LineSegments symbol patterns
    var hierPanels = [
      [-12, 4, 0],
      [14, 4, 0]
    ];
    for (var i = 0; i < hierPanels.length; i++) {
      var panel = new THREE.Mesh(
        new THREE.BoxGeometry(2, 3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xC8A86A })
      );
      panel.position.set(hierPanels[i][0], hierPanels[i][1], hierPanels[i][2]);
      scene.add(panel);
      objects.push(panel);

      // Symbol patterns with LineSegments
      var lineGeometry = new THREE.BufferGeometry();
      var positions = new Float32Array([
        -0.8, 0.8, 0.2, -0.4, 0.8, 0.2,
        -0.6, 0.5, 0.2, -0.6, 1.0, 0.2,
        0.0, 0.8, 0.2, 0.4, 0.8, 0.2,
        0.2, 0.5, 0.2, 0.2, 1.0, 0.2
      ]);
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var lineMaterial = new THREE.LineBasicMaterial({ color: 0x7A6A4A });
      var lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
      lineSegments.position.set(hierPanels[i][0], hierPanels[i][1], hierPanels[i][2]);
      scene.add(lineSegments);
      objects.push(lineSegments);
    }

    // Sand dunes around temple (large SphereGeometry desert yellow)
    var dunePositions = [
      [-15, 1.5, 10],
      [20, 1.5, 15],
      [-18, 1.5, -15],
      [25, 1.5, -10]
    ];
    var duneMaterial = new THREE.MeshStandardMaterial({ color: 0xD4A857 });
    for (var i = 0; i < dunePositions.length; i++) {
      var dune = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 16), duneMaterial);
      dune.scale.set(2, 0.6, 2);
      dune.position.set(dunePositions[i][0], dunePositions[i][1], dunePositions[i][2]);
      scene.add(dune);
      objects.push(dune);
      animatedObjects.push({ obj: dune, type: 'dust' });
    }

    // Buried artifact excavation pits
    var pitPositions = [
      [-12, -0.5, 8],
      [10, -0.5, 12]
    ];
    var excavMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    for (var i = 0; i < pitPositions.length; i++) {
      var excavPit = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), excavMaterial);
      excavPit.position.set(pitPositions[i][0], pitPositions[i][1], pitPositions[i][2]);
      scene.add(excavPit);
      objects.push(excavPit);
    }

    // Ancient oil lamp braziers (CylinderGeometry + SphereGeometry flame)
    var brazierPositions = [
      [-6, 0.5, 0],
      [10, 0.5, 0],
      [2, 0.5, -12]
    ];
    for (var i = 0; i < brazierPositions.length; i++) {
      var brazierBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x996633 })
      );
      brazierBase.position.set(brazierPositions[i][0], brazierPositions[i][1], brazierPositions[i][2]);
      scene.add(brazierBase);
      objects.push(brazierBase);

      var flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xFF6600, emissive: 0xFF6600, emissiveIntensity: 0.6 })
      );
      flame.position.set(brazierPositions[i][0], brazierPositions[i][1] + 1.2, brazierPositions[i][2]);
      scene.add(flame);
      objects.push(flame);
      animatedObjects.push({ obj: flame, type: 'flame' });
    }

    // Stone guardian statues at gate (tall angular BoxGeometry)
    var guardianPositions = [
      [-15, 2, -5],
      [15, 2, -5]
    ];
    var guardianMaterial = new THREE.MeshStandardMaterial({ color: 0x888877 });
    for (var i = 0; i < guardianPositions.length; i++) {
      var guardian = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, 1.2), guardianMaterial);
      guardian.position.set(guardianPositions[i][0], guardianPositions[i][1], guardianPositions[i][2]);
      scene.add(guardian);
      objects.push(guardian);
    }

    // Underground crypt entrance (dark BoxGeometry)
    var cryptEntrance = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 2),
      new THREE.MeshStandardMaterial({ color: 0x332222 })
    );
    cryptEntrance.position.set(2, 1, -30);
    scene.add(cryptEntrance);
    objects.push(cryptEntrance);

    // Treasure chamber (BoxGeometry with SphereGeometry gold coin piles)
    var treasureBox = new THREE.Mesh(
      new THREE.BoxGeometry(8, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0x443311 })
    );
    treasureBox.position.set(-5, 1, -35);
    scene.add(treasureBox);
    objects.push(treasureBox);

    var coinPositions = [
      [-8, 1.5, -35],
      [-4, 1.5, -35],
      [-2, 1.5, -35],
      [0, 1.5, -35],
      [2, 1.5, -35]
    ];
    for (var i = 0; i < coinPositions.length; i++) {
      var coins = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.4 })
      );
      coins.position.set(coinPositions[i][0], coinPositions[i][1], coinPositions[i][2]);
      scene.add(coins);
      objects.push(coins);
      animatedObjects.push({ obj: coins, type: 'coins' });
    }

    // Palm tree grove (CylinderGeometry trunk + SphereGeometry foliage)
    var palmPositions = [
      [-20, 0, 5],
      [-15, 0, 10],
      [22, 0, 8],
      [25, 0, 0]
    ];
    for (var i = 0; i < palmPositions.length; i++) {
      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x8B6914 })
      );
      trunk.position.set(palmPositions[i][0], palmPositions[i][1] + 2, palmPositions[i][2]);
      scene.add(trunk);
      objects.push(trunk);

      var fronds = new THREE.Mesh(
        new THREE.SphereGeometry(2.2, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x2D5A1F })
      );
      fronds.position.set(palmPositions[i][0], palmPositions[i][1] + 5, palmPositions[i][2]);
      scene.add(fronds);
      objects.push(fronds);
      animatedObjects.push({ obj: fronds, type: 'fronds' });
    }

    // Sand dust particles (small SphereGeometry)
    var dustPositions = [
      [0, 3, -10],
      [5, 2.5, -12],
      [-8, 3.5, -8],
      [8, 2, -14]
    ];
    for (var i = 0; i < dustPositions.length; i++) {
      var dust = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 4, 4),
        new THREE.MeshStandardMaterial({ color: 0xD4A857, transparent: true, opacity: 0.6 })
      );
      dust.position.set(dustPositions[i][0], dustPositions[i][1], dustPositions[i][2]);
      scene.add(dust);
      objects.push(dust);
      animatedObjects.push({ obj: dust, type: 'particle' });
    }
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < animatedObjects.length; i++) {
      var animObj = animatedObjects[i];

      if (animObj.type === 'idol') {
        animObj.obj.rotation.y += delta * 0.5;
      } else if (animObj.type === 'dart') {
        animObj.obj.position.x += Math.sin(time * 2) * delta * 0.5;
      } else if (animObj.type === 'flame') {
        var flickerIntensity = 0.4 + Math.sin(time * 4) * 0.3 + Math.sin(time * 7) * 0.2;
        animObj.obj.material.emissiveIntensity = flickerIntensity;
      } else if (animObj.type === 'coins') {
        var coinGlint = 0.3 + Math.sin(time * 3) * 0.4;
        animObj.obj.material.emissiveIntensity = coinGlint;
        animObj.obj.rotation.y += delta * 0.3;
      } else if (animObj.type === 'dust') {
        animObj.obj.position.y += Math.sin(time * 1.5) * delta * 0.2;
      } else if (animObj.type === 'fronds') {
        animObj.obj.rotation.z = Math.sin(time * 0.8) * 0.3;
      } else if (animObj.type === 'particle') {
        animObj.obj.position.y += Math.sin(time * 2) * delta * 0.3;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
    scene = null;
    camera = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
