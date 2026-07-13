window.FortressGate = (function() {
  'use strict';

  // Module state
  var gateState = {
    portcullisOpen: true,
    portcullisTarget: 1,
    portcullisPosition: 1,
    drawbridgeOpen: true,
    drawbridgeTarget: 0,
    drawbridgeRotation: 0,
    fireIntensity: {},
    chainSway: {}
  };

  var meshes = {
    gateComplex: null,
    portcullis: null,
    drawbridge: null,
    burningBarrels: [],
    chains: [],
    windlass: null,
    portcullisGroup: null,
    drawbridgeGroup: null
  };

  var PORTCULLIS_SPEED = 1.5;
  var DRAWBRIDGE_SPEED = 0.8;

  function createGateComplex(scene) {
    var gateGroup = new THREE.Group();
    gateGroup.name = 'FortressGateComplex';

    // Materials
    var stoneMat = new THREE.MeshStandardMaterial({
      color: 0x8b8b7a,
      roughness: 0.8,
      metalness: 0.1
    });
    var darkstoneMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a4a,
      roughness: 0.85,
      metalness: 0.05
    });
    var ironMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.7,
      metalness: 0.9
    });
    var woodMat = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.9,
      metalness: 0.0
    });
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x1a4d6d,
      roughness: 0.3,
      metalness: 0.4,
      transparent: true,
      opacity: 0.7
    });

    // Left tower - cylindrical stone tower
    var leftTowerGeom = new THREE.CylinderGeometry(3, 3.5, 12, 12);
    var leftTower = new THREE.Mesh(leftTowerGeom, stoneMat);
    leftTower.position.set(-8, 6, 0);
    leftTower.castShadow = true;
    leftTower.receiveShadow = true;
    gateGroup.add(leftTower);

    // Right tower - cylindrical stone tower
    var rightTowerGeom = new THREE.CylinderGeometry(3, 3.5, 12, 12);
    var rightTower = new THREE.Mesh(rightTowerGeom, stoneMat);
    rightTower.position.set(8, 6, 0);
    rightTower.castShadow = true;
    rightTower.receiveShadow = true;
    gateGroup.add(rightTower);

    // Central gatehouse structure - stacked stone blocks
    var gateHouseGeom = new THREE.BoxGeometry(10, 4, 3);
    var gateHouse = new THREE.Mesh(gateHouseGeom, stoneMat);
    gateHouse.position.set(0, 2, -1);
    gateHouse.castShadow = true;
    gateHouse.receiveShadow = true;
    gateGroup.add(gateHouse);

    // Upper gatehouse section
    var upperGateGeom = new THREE.BoxGeometry(10, 3.5, 3);
    var upperGate = new THREE.Mesh(upperGateGeom, darkstoneMat);
    upperGate.position.set(0, 5.5, -1);
    upperGate.castShadow = true;
    upperGate.receiveShadow = true;
    gateGroup.add(upperGate);

    // Battlements (merlons) - alternating stone blocks on top
    var merlonSpacing = 1.5;
    for (var i = -3; i <= 3; i++) {
      var merlonGeom = new THREE.BoxGeometry(0.8, 1.2, 2.5);
      var merlon = new THREE.Mesh(merlonGeom, stoneMat);
      merlon.position.set(i * merlonSpacing, 7.5, -1);
      merlon.castShadow = true;
      merlon.receiveShadow = true;
      gateGroup.add(merlon);
    }

    // Portcullis group (will contain the grating and chains)
    var portcullisGroup = new THREE.Group();
    portcullisGroup.position.set(0, 4, 1);
    portcullisGroup.name = 'PortcullisGroup';
    meshes.portcullisGroup = portcullisGroup;

    // Portcullis grating - iron lattice
    var portcullisGeom = new THREE.BoxGeometry(8, 5, 0.3);
    var portcullis = new THREE.Mesh(portcullisGeom, ironMat);
    portcullis.castShadow = true;
    portcullis.receiveShadow = true;
    portcullisGroup.add(portcullis);
    meshes.portcullis = portcullis;

    // Add vertical bars to portcullis
    for (var pi = 0; pi < 9; pi++) {
      var barGeom = new THREE.BoxGeometry(0.15, 5, 0.15);
      var bar = new THREE.Mesh(barGeom, ironMat);
      bar.position.set(-4 + pi * 1, 0, 0);
      portcullis.add(bar);
    }

    // Add horizontal bars
    for (var ph = 0; ph < 6; ph++) {
      var hbarGeom = new THREE.BoxGeometry(8, 0.15, 0.15);
      var hbar = new THREE.Mesh(hbarGeom, ironMat);
      hbar.position.set(0, -2.5 + ph * 1, 0);
      portcullis.add(hbar);
    }

    gateGroup.add(portcullisGroup);

    // Portcullis chains - LineSegments
    var chainPoints = [
      new THREE.Vector3(-3, 2.5, 0),
      new THREE.Vector3(-3, -3, 0),
      new THREE.Vector3(3, 2.5, 0),
      new THREE.Vector3(3, -3, 0)
    ];
    var chainGeom = new THREE.BufferGeometry().setFromPoints(chainPoints);
    var chainMat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 3 });
    var chains = new THREE.LineSegments(chainGeom, chainMat);
    portcullisGroup.add(chains);
    meshes.chains.push(chains);
    gateState.chainSway['portcullis'] = 0;

    // Murder holes in ceiling (gaps in upper structure)
    var ceilingY = 6.8;
    for (var mh = 0; mh < 4; mh++) {
      var holeGeom = new THREE.BoxGeometry(1.2, 1.2, 2);
      var hole = new THREE.Mesh(holeGeom, new THREE.MeshStandardMaterial({ color: 0x000000 }));
      hole.position.set(-3 + mh * 2, ceilingY, -1);
      gateGroup.add(hole);
    }

    // Drawbridge group
    var drawbridgeGroup = new THREE.Group();
    drawbridgeGroup.position.set(0, 1.5, 3);
    drawbridgeGroup.name = 'DrawbridgeGroup';
    meshes.drawbridgeGroup = drawbridgeGroup;

    // Drawbridge - wooden planks
    var drawbridgeGeom = new THREE.BoxGeometry(9, 0.4, 3);
    var drawbridge = new THREE.Mesh(drawbridgeGeom, woodMat);
    drawbridge.castShadow = true;
    drawbridge.receiveShadow = true;
    drawbridgeGroup.add(drawbridge);
    meshes.drawbridge = drawbridge;

    // Drawbridge reinforcement bands (iron strips)
    for (var db = 0; db < 4; db++) {
      var bandGeom = new THREE.BoxGeometry(9, 0.15, 0.15);
      var band = new THREE.Mesh(bandGeom, ironMat);
      band.position.set(0, -0.15 - db * 0.35, 0);
      drawbridge.add(band);
    }

    // Set rotation origin to front edge
    drawbridge.geometry.center();
    drawbridge.position.y = 0.2;

    gateGroup.add(drawbridgeGroup);

    // Moat - water feature
    var moatGeom = new THREE.BoxGeometry(20, 0.05, 5);
    var moat = new THREE.Mesh(moatGeom, waterMat);
    moat.position.set(0, -0.3, 3);
    moat.receiveShadow = true;
    gateGroup.add(moat);

    // Gate doors - reinforced wooden doors
    var doorGeom = new THREE.BoxGeometry(3.8, 4, 0.2);
    var leftDoor = new THREE.Mesh(doorGeom, woodMat);
    leftDoor.position.set(-2.2, 2.5, 1.5);
    leftDoor.castShadow = true;
    leftDoor.receiveShadow = true;
    gateGroup.add(leftDoor);

    var rightDoor = new THREE.Mesh(doorGeom, woodMat);
    rightDoor.position.set(2.2, 2.5, 1.5);
    rightDoor.castShadow = true;
    rightDoor.receiveShadow = true;
    gateGroup.add(rightDoor);

    // Iron door bands and studs
    for (var db2 = 0; db2 < 5; db2++) {
      var studGeom = new THREE.BoxGeometry(0.15, 0.15, 0.3);
      var stud1 = new THREE.Mesh(studGeom, ironMat);
      stud1.position.set(-2.2, 1 + db2 * 0.8, 1.5);
      gateGroup.add(stud1);
      var stud2 = new THREE.Mesh(studGeom, ironMat);
      stud2.position.set(2.2, 1 + db2 * 0.8, 1.5);
      gateGroup.add(stud2);
    }

    // Windlass mechanism (drum for chains)
    var windlassGeom = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16);
    var windlass = new THREE.Mesh(windlassGeom, ironMat);
    windlass.rotation.z = Math.PI / 2;
    windlass.position.set(0, 5, -2.5);
    windlass.castShadow = true;
    windlass.receiveShadow = true;
    gateGroup.add(windlass);
    meshes.windlass = windlass;

    // Windlass support frame
    var supportGeom = new THREE.BoxGeometry(0.3, 3, 0.3);
    var support1 = new THREE.Mesh(supportGeom, stoneMat);
    support1.position.set(-1.5, 4, -2.5);
    gateGroup.add(support1);
    var support2 = new THREE.Mesh(supportGeom, stoneMat);
    support2.position.set(1.5, 4, -2.5);
    gateGroup.add(support2);

    // Siege ladders against tower
    var ladderRungGeom = new THREE.BoxGeometry(2.5, 0.15, 0.15);
    for (var lr = 0; lr < 8; lr++) {
      var rung = new THREE.Mesh(ladderRungGeom, woodMat);
      rung.position.set(-7.5, 0.5 + lr * 1.2, 2);
      rung.castShadow = true;
      rung.receiveShadow = true;
      gateGroup.add(rung);
    }

    // Ladder side rails
    var railGeom = new THREE.BoxGeometry(0.2, 10, 0.15);
    var rail1 = new THREE.Mesh(railGeom, woodMat);
    rail1.position.set(-8.5, 5, 2);
    rail1.castShadow = true;
    rail1.receiveShadow = true;
    gateGroup.add(rail1);
    var rail2 = new THREE.Mesh(railGeom, woodMat);
    rail2.position.set(-6.5, 5, 2);
    rail2.castShadow = true;
    rail2.receiveShadow = true;
    gateGroup.add(rail2);

    // Arrow slits - window gaps
    for (var as = 0; as < 3; as++) {
      var slitGeom = new THREE.BoxGeometry(0.4, 1.2, 2);
      var slit = new THREE.Mesh(slitGeom, new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
      slit.position.set(-3 + as * 3, 5.5, -1);
      gateGroup.add(slit);
    }

    // Burning barrels - fire siege
    var barrelPositions = [
      { x: -7, y: 0.5, z: 5 },
      { x: 7, y: 0.5, z: 5 },
      { x: -5, y: 0.5, z: 6 },
      { x: 5, y: 0.5, z: 6 }
    ];

    var fireMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff4400,
      emissiveIntensity: 0.8
    });

    barrelPositions.forEach(function(pos, idx) {
      var barrelGeom = new THREE.CylinderGeometry(0.6, 0.7, 1, 8);
      var barrel = new THREE.Mesh(barrelGeom, new THREE.MeshStandardMaterial({
        color: 0x3a2a1a,
        roughness: 0.9
      }));
      barrel.position.set(pos.x, pos.y, pos.z);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      gateGroup.add(barrel);

      // Fire sphere on barrel
      var fireGeom = new THREE.SphereGeometry(0.8, 8, 8);
      var fire = new THREE.Mesh(fireGeom, fireMat);
      fire.position.set(pos.x, pos.y + 0.8, pos.z);
      fire.castShadow = true;
      fire.scale.set(1, 1.5, 1);
      gateGroup.add(fire);
      meshes.burningBarrels.push(fire);
      gateState.fireIntensity[idx] = 0.5;
    });

    // Rubble piles - broken stone blocks
    for (var rb = 0; rb < 6; rb++) {
      var rubbleGeom = new THREE.BoxGeometry(
        0.8 + Math.random() * 0.6,
        0.6 + Math.random() * 0.5,
        0.8 + Math.random() * 0.6
      );
      var rubble = new THREE.Mesh(rubbleGeom, darkstoneMat);
      rubble.position.set(
        -6 + Math.random() * 12,
        0.3,
        4 + Math.random() * 3
      );
      rubble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      gateGroup.add(rubble);
    }

    // Stone battlements on towers
    for (var tbt = 0; tbt < 4; tbt++) {
      var towerBattleGeom = new THREE.BoxGeometry(0.8, 1.2, 2.5);
      var tb1 = new THREE.Mesh(towerBattleGeom, stoneMat);
      tb1.position.set(-8, 8 + (tbt % 2) * 1.5, -1.5 - (Math.floor(tbt / 2)) * 2.5);
      tb1.castShadow = true;
      tb1.receiveShadow = true;
      gateGroup.add(tb1);

      var tb2 = new THREE.Mesh(towerBattleGeom, stoneMat);
      tb2.position.set(8, 8 + (tbt % 2) * 1.5, -1.5 - (Math.floor(tbt / 2)) * 2.5);
      tb2.castShadow = true;
      tb2.receiveShadow = true;
      gateGroup.add(tb2);
    }

    meshes.gateComplex = gateGroup;
    scene.add(gateGroup);
  }

  function init(scene, camera) {
    createGateComplex(scene);

    // Reset state
    gateState.portcullisOpen = true;
    gateState.portcullisPosition = 1;
    gateState.drawbridgeOpen = true;
    gateState.drawbridgeRotation = 0;

    return true;
  }

  function updatePortcullis(delta) {
    if (!meshes.portcullisGroup) return;

    // Smooth interpolation toward target
    var diff = gateState.portcullisTarget - gateState.portcullisPosition;
    if (Math.abs(diff) > 0.01) {
      gateState.portcullisPosition += diff * PORTCULLIS_SPEED * delta;
    } else {
      gateState.portcullisPosition = gateState.portcullisTarget;
    }

    // Y position: 4 (open) to -1.5 (closed)
    var targetY = 4 - gateState.portcullisPosition * 5.5;
    meshes.portcullisGroup.position.y += (targetY - meshes.portcullisGroup.position.y) * 0.1;

    // Animate chains sway
    gateState.chainSway['portcullis'] += delta * 2;
    var swayAmount = Math.sin(gateState.chainSway['portcullis']) * 0.05;

    if (meshes.chains.length > 0) {
      meshes.chains[0].rotation.z = swayAmount;
    }
  }

  function updateDrawbridge(delta) {
    if (!meshes.drawbridgeGroup || !meshes.drawbridge) return;

    // Smooth rotation toward target
    var rotDiff = gateState.drawbridgeTarget - gateState.drawbridgeRotation;
    if (Math.abs(rotDiff) > 0.01) {
      gateState.drawbridgeRotation += rotDiff * DRAWBRIDGE_SPEED * delta;
    } else {
      gateState.drawbridgeRotation = gateState.drawbridgeTarget;
    }

    // Apply rotation: 0 (open/flat) to ~1.57 (90 degrees up)
    meshes.drawbridge.rotation.z = gateState.drawbridgeRotation * Math.PI / 2;
  }

  function updateFire(delta) {
    meshes.burningBarrels.forEach(function(fire, idx) {
      if (gateState.fireIntensity.hasOwnProperty(idx)) {
        // Flicker effect
        gateState.fireIntensity[idx] += (Math.random() - 0.5) * 0.3;
        gateState.fireIntensity[idx] = Math.max(0.3, Math.min(1, gateState.fireIntensity[idx]));

        // Apply to emissive intensity
        fire.material.emissiveIntensity = 0.6 + gateState.fireIntensity[idx] * 0.4;

        // Scale flicker
        var scaleVal = 1 + (gateState.fireIntensity[idx] - 0.5) * 0.2;
        fire.scale.y = 1.5 * scaleVal;
      }
    });
  }

  function update(delta) {
    if (!delta) delta = 0.016; // Default to ~60fps

    updatePortcullis(delta);
    updateDrawbridge(delta);
    updateFire(delta);

    // Windlass rotation when portcullis moves
    if (meshes.windlass && gateState.portcullisPosition !== 1) {
      meshes.windlass.rotation.x += delta * 0.5;
    }
  }

  function reset() {
    gateState.portcullisOpen = true;
    gateState.portcullisTarget = 1;
    gateState.portcullisPosition = 1;
    gateState.drawbridgeOpen = true;
    gateState.drawbridgeTarget = 0;
    gateState.drawbridgeRotation = 0;

    if (meshes.portcullisGroup) {
      meshes.portcullisGroup.position.y = 4;
    }
    if (meshes.drawbridge) {
      meshes.drawbridge.rotation.z = 0;
    }

    // Reset fire intensities
    Object.keys(gateState.fireIntensity).forEach(function(key) {
      gateState.fireIntensity[key] = 0.5;
    });

    return true;
  }

  // Public API
  return {
    init: init,
    update: update,
    reset: reset,
    lowerPortcullis: function() {
      gateState.portcullisTarget = 0;
      gateState.portcullisOpen = false;
    },
    raisePortcullis: function() {
      gateState.portcullisTarget = 1;
      gateState.portcullisOpen = true;
    },
    lowerDrawbridge: function() {
      gateState.drawbridgeTarget = 0;
      gateState.drawbridgeOpen = false;
    },
    raiseDrawbridge: function() {
      gateState.drawbridgeTarget = 1;
      gateState.drawbridgeOpen = true;
    },
    getState: function() {
      return gateState;
    }
  };
}());
