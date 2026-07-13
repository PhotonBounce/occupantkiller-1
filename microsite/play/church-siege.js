var ChurchSiege = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var church = null;
  var bells = [];
  var candles = [];
  var stainedGlass = [];
  var graveyardMist = [];
  var time = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    church = new THREE.Group();
    scene.add(church);

    // Main nave - central stone body
    var naveGeometry = new THREE.BoxGeometry(15, 20, 40);
    var naveMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.8,
      metalness: 0.1
    });
    var nave = new THREE.Mesh(naveGeometry, naveMaterial);
    nave.position.z = 0;
    church.add(nave);

    // Roof ridge - cone geometry
    var roofGeometry = new THREE.ConeGeometry(11, 8, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.7
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 14;
    roof.position.z = 0;
    roof.rotation.z = Math.PI / 4;
    church.add(roof);

    // Bell tower - square stone tower
    var towerGeometry = new THREE.BoxGeometry(6, 28, 6);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.85
    });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(12, 0, -8);
    church.add(tower);

    // Tower roof spire - cone
    var spireGeometry = new THREE.ConeGeometry(4, 10, 4);
    var spireMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f,
      roughness: 0.6
    });
    var spire = new THREE.Mesh(spireGeometry, spireMaterial);
    spire.position.set(12, 23, -8);
    church.add(spire);

    // Large bell in tower - cylinder
    var bellGeometry = new THREE.CylinderGeometry(2.5, 2.8, 3, 32);
    var bellMaterial = new THREE.MeshStandardMaterial({
      color: 0xcd853f,
      roughness: 0.3,
      metalness: 0.7
    });
    var bell = new THREE.Mesh(bellGeometry, bellMaterial);
    bell.position.set(12, 8, -8);
    church.add(bell);
    bells.push({
      mesh: bell,
      initialY: 8,
      swing: 0
    });

    // Stained glass windows - emissive colored panels
    var windowPositions = [
      { x: -7.5, z: -15, color: 0xff6347 }, // Red
      { x: -7.5, z: -5, color: 0x4169e1 },  // Blue
      { x: -7.5, z: 5, color: 0x32cd32 },   // Green
      { x: 7.5, z: -15, color: 0xffa500 },  // Orange
      { x: 7.5, z: -5, color: 0xffd700 },   // Gold
      { x: 7.5, z: 5, color: 0x9370db }     // Purple
    ];

    var windowGeometry = new THREE.BoxGeometry(1.5, 4, 0.3);
    windowPositions.forEach(function(pos) {
      var windowMaterial = new THREE.MeshStandardMaterial({
        color: pos.color,
        emissive: pos.color,
        emissiveIntensity: 0.3,
        metalness: 0.2,
        roughness: 0.4
      });
      var windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
      windowMesh.position.set(pos.x, 4, pos.z);
      church.add(windowMesh);
      stainedGlass.push({
        mesh: windowMesh,
        baseIntensity: 0.3,
        color: pos.color
      });
    });

    // Flying buttress pillars - angled stone supports
    var buttressGeometry = new THREE.BoxGeometry(1.5, 12, 1);
    var buttressMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.8
    });
    var buttressPositions = [
      { x: -8, z: -12 },
      { x: 8, z: -12 },
      { x: -8, z: 12 },
      { x: 8, z: 12 }
    ];
    buttressPositions.forEach(function(pos) {
      var buttress = new THREE.Mesh(buttressGeometry, buttressMaterial);
      buttress.position.set(pos.x, 4, pos.z);
      buttress.rotation.z = 0.3;
      church.add(buttress);
    });

    // Ornate entrance doorway frame
    var doorFrameGeometry = new THREE.BoxGeometry(5, 8, 0.5);
    var doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d4e37,
      roughness: 0.7
    });
    var doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrame.position.set(0, 2, -20.5);
    church.add(doorFrame);

    // Door arch top - cone
    var doorArchGeometry = new THREE.ConeGeometry(2.5, 2, 16);
    var doorArchMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d4e37,
      roughness: 0.7
    });
    var doorArch = new THREE.Mesh(doorArchGeometry, doorArchMaterial);
    doorArch.position.set(0, 8, -20.5);
    doorArch.rotation.z = Math.PI / 2;
    church.add(doorArch);

    // Pews inside - wooden benches
    var pewGeometry = new THREE.BoxGeometry(3, 1.5, 1);
    var pewMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.6
    });
    for (var i = 0; i < 6; i++) {
      var pew = new THREE.Mesh(pewGeometry, pewMaterial);
      pew.position.set(i < 3 ? -3 : 3, 0.8, -12 + i * 6);
      church.add(pew);
    }

    // Altar - raised stone platform with ornate backing
    var altarBaseGeometry = new THREE.BoxGeometry(6, 1, 8);
    var altarBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.5
    });
    var altarBase = new THREE.Mesh(altarBaseGeometry, altarBaseMaterial);
    altarBase.position.set(0, 0.5, 20);
    church.add(altarBase);

    // Altar backing
    var altarBackGeometry = new THREE.BoxGeometry(8, 10, 1);
    var altarBackMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.7
    });
    var altarBack = new THREE.Mesh(altarBackGeometry, altarBackMaterial);
    altarBack.position.set(0, 6, 23.5);
    church.add(altarBack);

    // Pulpit - elevated platform
    var pulpitGeometry = new THREE.BoxGeometry(3, 4, 3);
    var pulpitMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.6
    });
    var pulpit = new THREE.Mesh(pulpitGeometry, pulpitMaterial);
    pulpit.position.set(-6, 2, 10);
    church.add(pulpit);

    // Crypt entrance - stone stairs down
    var cryptGeometry = new THREE.BoxGeometry(5, 0.5, 5);
    var cryptMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d4d4d,
      roughness: 0.85
    });
    for (var j = 0; j < 4; j++) {
      var stair = new THREE.Mesh(cryptGeometry, cryptMaterial);
      stair.position.set(0, -j * 0.8, -18 + j * 1);
      church.add(stair);
    }

    // Graveyard perimeter - stone wall
    var wallGeometry = new THREE.BoxGeometry(50, 2, 1);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.8
    });
    var wallFront = new THREE.Mesh(wallGeometry, wallMaterial);
    wallFront.position.set(0, 0.5, -35);
    church.add(wallFront);
    var wallBack = new THREE.Mesh(wallGeometry, wallMaterial);
    wallBack.position.set(0, 0.5, 35);
    church.add(wallBack);
    var wallLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 70), wallMaterial);
    wallLeft.position.set(-25, 0.5, 0);
    church.add(wallLeft);
    var wallRight = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 70), wallMaterial);
    wallRight.position.set(25, 0.5, 0);
    church.add(wallRight);

    // Grave markers - cylinders
    var graveMarkerGeometry = new THREE.CylinderGeometry(0.5, 0.6, 2, 16);
    var graveMarkerMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d5d5d,
      roughness: 0.9
    });
    var gravePositions = [
      { x: -15, z: -25 },
      { x: -10, z: -28 },
      { x: -5, z: -25 },
      { x: 5, z: -28 },
      { x: 10, z: -25 },
      { x: 15, z: -26 },
      { x: -18, z: 25 },
      { x: -8, z: 28 },
      { x: 8, z: 25 },
      { x: 18, z: 26 }
    ];
    gravePositions.forEach(function(pos) {
      var marker = new THREE.Mesh(graveMarkerGeometry, graveMarkerMaterial);
      marker.position.set(pos.x, 1, pos.z);
      church.add(marker);
    });

    // Grave crosses - box geometry crosses
    gravePositions.forEach(function(pos) {
      var crossVert = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.3), new THREE.MeshStandardMaterial({ color: 0x3d3d3d }));
      crossVert.position.set(pos.x, 1.5, pos.z);
      church.add(crossVert);
      var crossHoriz = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x3d3d3d }));
      crossHoriz.position.set(pos.x, 2.5, pos.z);
      church.add(crossHoriz);
    });

    // Refugee shelters - sleeping figures represented by boxes
    var shelterGeometry = new THREE.BoxGeometry(2, 1, 1.5);
    var shelterMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.7
    });
    for (var k = 0; k < 5; k++) {
      var shelter = new THREE.Mesh(shelterGeometry, shelterMaterial);
      shelter.position.set(-5 + k * 2, 0.5, 5);
      church.add(shelter);
    }

    // Sandbag barricade at entrance
    var sandbagGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    var sandbagMaterial = new THREE.MeshStandardMaterial({
      color: 0xd2b48c,
      roughness: 0.9
    });
    for (var m = 0; m < 8; m++) {
      var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbag.position.set(-3 + m * 0.9, 0.4 + (m % 2) * 0.8, -19);
      church.add(sandbag);
    }

    // Supply cache in vestry - crates
    var crateGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var crateMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.8
    });
    for (var n = 0; n < 6; n++) {
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(-8 + (n % 3) * 2, 0.75 + (n > 2 ? 1.5 : 0), 15 + Math.floor(n / 3) * 2);
      church.add(crate);
    }

    // Bell tower fighting position - sandbags and hide
    var towerBarricadeGeometry = new THREE.BoxGeometry(1, 0.6, 0.5);
    var towerBarricadeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd2b48c,
      roughness: 0.9
    });
    for (var p = 0; p < 5; p++) {
      var towerBag = new THREE.Mesh(towerBarricadeGeometry, towerBarricadeMaterial);
      towerBag.position.set(12 - 2 + p * 0.8, 12 + (p % 2) * 0.6, -8);
      church.add(towerBag);
    }

    // Pipe organ - large structure with cylinders for pipes
    var organBaseGeometry = new THREE.BoxGeometry(6, 12, 2);
    var organBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d4d4d,
      roughness: 0.7
    });
    var organBase = new THREE.Mesh(organBaseGeometry, organBaseMaterial);
    organBase.position.set(9, 6, 18);
    church.add(organBase);

    // Organ pipes - cylinders of varying heights
    var pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 16);
    var pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.6,
      metalness: 0.3
    });
    for (var q = 0; q < 8; q++) {
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      var pipeHeight = 3 + (q % 4) * 2;
      pipe.scale.y = pipeHeight / 6;
      pipe.position.set(6 + q * 0.7, 6 + pipeHeight / 2, 18);
      church.add(pipe);
    }

    // Candle stands - cylinders with sphere flames
    var candleStandPositions = [
      { x: -4, z: 18 },
      { x: 4, z: 18 },
      { x: -4, z: 22 },
      { x: 4, z: 22 }
    ];
    var standGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2, 16);
    var standMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.6
    });
    candleStandPositions.forEach(function(pos) {
      var stand = new THREE.Mesh(standGeometry, standMaterial);
      stand.position.set(pos.x, 1, pos.z);
      church.add(stand);

      // Flame - sphere with emissive
      var flameGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var flameMaterial = new THREE.MeshStandardMaterial({
        color: 0xffa500,
        emissive: 0xff8c00,
        emissiveIntensity: 0.8,
        roughness: 0.5
      });
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(pos.x, 2.5, pos.z);
      church.add(flame);
      candles.push({
        mesh: flame,
        baseIntensity: 0.8,
        flicker: Math.random()
      });
    });

    // Iron fence sections - box posts with line segments
    var fencePostGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
    var fencePostMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f,
      roughness: 0.8,
      metalness: 0.5
    });
    var fencePositions = [
      { x: -20, z: -32 },
      { x: -10, z: -32 },
      { x: 0, z: -32 },
      { x: 10, z: -32 },
      { x: 20, z: -32 }
    ];
    fencePositions.forEach(function(pos, idx) {
      var post = new THREE.Mesh(fencePostGeometry, fencePostMaterial);
      post.position.set(pos.x, 1.5, pos.z);
      church.add(post);

      // Iron rails between posts
      if (idx < fencePositions.length - 1) {
        var nextPos = fencePositions[idx + 1];
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array([
          pos.x, 1, pos.z,
          nextPos.x, 1, pos.z,
          nextPos.x, 2.5, pos.z,
          pos.x, 2.5, pos.z
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var linesMaterial = new THREE.LineBasicMaterial({ color: 0x2f4f4f, linewidth: 2 });
        var lines = new THREE.LineSegments(geometry, linesMaterial);
        church.add(lines);
      }
    });

    // Blast damage - crumbled wall section
    var blastDamageGeometry = new THREE.BoxGeometry(4, 5, 0.8);
    var blastDamageMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d5d5d,
      roughness: 0.95
    });
    var blastDamage = new THREE.Mesh(blastDamageGeometry, blastDamageMaterial);
    blastDamage.position.set(-6, 6, -20.2);
    blastDamage.rotation.z = 0.2;
    church.add(blastDamage);

    // Crumbled debris pieces
    for (var r = 0; r < 4; r++) {
      var debris = new THREE.Mesh(
        new THREE.BoxGeometry(1 + Math.random(), 0.8 + Math.random(), 0.5),
        blastDamageMaterial
      );
      debris.position.set(-8 + Math.random() * 4, 4 + Math.random() * 3, -19 + Math.random());
      debris.rotation.set(Math.random(), Math.random(), Math.random());
      church.add(debris);
    }

    // Graveyard mist - spheres for atmospheric effect
    var mistGeometry = new THREE.SphereGeometry(3, 8, 8);
    var mistMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      emissive: 0x888888,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.15,
      roughness: 0.9
    });
    for (var s = 0; s < 4; s++) {
      var mist = new THREE.Mesh(mistGeometry, mistMaterial);
      mist.position.set(-15 + Math.random() * 30, 2, -25 + Math.random() * 10);
      church.add(mist);
      graveyardMist.push({
        mesh: mist,
        baseX: mist.position.x,
        baseY: mist.position.y,
        baseZ: mist.position.z,
        drift: Math.random() * Math.PI * 2
      });
    }
  }

  function update(delta) {
    time += delta;

    // Bell sway animation
    bells.forEach(function(bellData) {
      bellData.swing = Math.sin(time * 0.5) * 0.2;
      bellData.mesh.rotation.z = bellData.swing;
    });

    // Candle flame flicker
    candles.forEach(function(candleData) {
      var flicker = Math.sin(time * 3 + candleData.flicker) * 0.15 + 1;
      candleData.mesh.material.emissiveIntensity = candleData.baseIntensity * flicker;
      var flickerScale = 0.9 + Math.sin(time * 4 + candleData.flicker) * 0.08;
      candleData.mesh.scale.set(flickerScale, flickerScale, flickerScale);
    });

    // Stained glass emissive pulse
    stainedGlass.forEach(function(glassData) {
      var pulse = Math.sin(time * 1.2) * 0.2 + 0.3;
      glassData.mesh.material.emissiveIntensity = pulse;
    });

    // Graveyard mist drift and fade
    graveyardMist.forEach(function(mistData, idx) {
      mistData.drift += delta * 0.3;
      var driftX = Math.cos(mistData.drift) * 2;
      var driftY = Math.sin(time * 0.3 + idx) * 0.5;
      var driftZ = Math.sin(mistData.drift) * 2;
      mistData.mesh.position.set(
        mistData.baseX + driftX,
        mistData.baseY + driftY,
        mistData.baseZ + driftZ
      );
      var mistFade = Math.sin(time * 0.8 + idx) * 0.05 + 0.15;
      mistData.mesh.material.opacity = mistFade;
    });
  }

  function reset() {
    time = 0;
    bells.forEach(function(bellData) {
      bellData.swing = 0;
      bellData.mesh.rotation.z = 0;
    });
    candles.forEach(function(candleData) {
      candleData.mesh.material.emissiveIntensity = candleData.baseIntensity;
      candleData.mesh.scale.set(1, 1, 1);
    });
    stainedGlass.forEach(function(glassData) {
      glassData.mesh.material.emissiveIntensity = glassData.baseIntensity;
    });
    graveyardMist.forEach(function(mistData) {
      mistData.mesh.position.set(mistData.baseX, mistData.baseY, mistData.baseZ);
      mistData.mesh.material.opacity = 0.15;
      mistData.drift = 0;
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
