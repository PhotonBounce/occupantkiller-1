window.CoalMine = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var animationData = {};

  function init(sceneRef, camera) {
    scene = sceneRef;
    objects = [];
    animationData = {};

    // Main shaft elevator
    var elevatorCageGeom = new THREE.BoxGeometry(2, 3, 2);
    var elevatorCageMat = new THREE.MeshStandardMaterial({ color: 0x444433 });
    var elevatorCage = new THREE.Mesh(elevatorCageGeom, elevatorCageMat);
    elevatorCage.position.set(0, 10, -5);
    scene.add(elevatorCage);
    objects.push(elevatorCage);
    animationData.elevatorCage = { baseY: 10, phase: 0 };

    var pulleyGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    var pulleyMat = new THREE.MeshStandardMaterial({ color: 0x333322 });
    var pulley = new THREE.Mesh(pulleyGeom, pulleyMat);
    pulley.position.set(0, 15, -5);
    scene.add(pulley);
    objects.push(pulley);

    // Coal tunnel network
    var tunnelGeom = new THREE.BoxGeometry(4, 3, 20);
    var tunnelMat = new THREE.MeshStandardMaterial({ color: 0x222211 });
    var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
    tunnel.position.set(0, 0, 0);
    scene.add(tunnel);
    objects.push(tunnel);

    // Wooden support beams (H-frames every 6 units)
    for (var i = 0; i < 4; i++) {
      var zPos = -18 + i * 6;
      var beamH = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x5C3D1F })
      );
      beamH.position.set(-1.5, 0, zPos);
      scene.add(beamH);
      objects.push(beamH);

      var beamV = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x5C3D1F })
      );
      beamV.position.set(0, 1, zPos);
      scene.add(beamV);
      objects.push(beamV);

      var beamH2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x5C3D1F })
      );
      beamH2.position.set(1.5, 0, zPos);
      scene.add(beamH2);
      objects.push(beamH2);

      animationData['beam_' + i] = { baseRotZ: 0, phase: i };
    }

    // Coal seam walls with chunks
    var leftWallGeom = new THREE.BoxGeometry(1, 3, 20);
    var leftWallMat = new THREE.MeshStandardMaterial({ color: 0x111100 });
    var leftWall = new THREE.Mesh(leftWallGeom, leftWallMat);
    leftWall.position.set(-2.5, 0, 0);
    scene.add(leftWall);
    objects.push(leftWall);

    var rightWallGeom = new THREE.BoxGeometry(1, 3, 20);
    var rightWallMat = new THREE.MeshStandardMaterial({ color: 0x111100 });
    var rightWall = new THREE.Mesh(rightWallGeom, rightWallMat);
    rightWall.position.set(2.5, 0, 0);
    scene.add(rightWall);
    objects.push(rightWall);

    // Coal chunks on walls
    for (var j = 0; j < 5; j++) {
      var coalChunkGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var coalChunkMat = new THREE.MeshStandardMaterial({ color: 0x222211 });
      var coalChunk = new THREE.Mesh(coalChunkGeom, coalChunkMat);
      coalChunk.position.set(-2.5, -0.5 + j * 1.2, -15 + j * 3);
      scene.add(coalChunk);
      objects.push(coalChunk);
    }

    // Mine cart tracks (rails)
    var railGeom = new THREE.BoxGeometry(0.2, 0.2, 20);
    var railMat = new THREE.MeshStandardMaterial({ color: 0x555544 });
    var rail1 = new THREE.Mesh(railGeom, railMat);
    rail1.position.set(-1.2, -1.4, 0);
    scene.add(rail1);
    objects.push(rail1);

    var rail2 = new THREE.Mesh(railGeom, railMat);
    rail2.position.set(1.2, -1.4, 0);
    scene.add(rail2);
    objects.push(rail2);

    // Mine cart
    var cartGeom = new THREE.BoxGeometry(1.8, 1, 2);
    var cartMat = new THREE.MeshStandardMaterial({ color: 0x664433 });
    var cart = new THREE.Mesh(cartGeom, cartMat);
    cart.position.set(0, -1, 0);
    scene.add(cart);
    objects.push(cart);
    animationData.cart = { baseZ: 0, phase: 0 };

    // Pickaxe embedded in wall
    var pickaxeHandleGeom = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    var pickaxeHandleMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    var pickaxeHandle = new THREE.Mesh(pickaxeHandleGeom, pickaxeHandleMat);
    pickaxeHandle.rotation.z = 0.6;
    pickaxeHandle.position.set(2.3, 0.5, -8);
    scene.add(pickaxeHandle);
    objects.push(pickaxeHandle);

    var pickaxeHeadGeom = new THREE.BoxGeometry(0.3, 0.2, 0.8);
    var pickaxeHeadMat = new THREE.MeshStandardMaterial({ color: 0x555544 });
    var pickaxeHead = new THREE.Mesh(pickaxeHeadGeom, pickaxeHeadMat);
    pickaxeHead.position.set(2.5, 1.3, -8);
    scene.add(pickaxeHead);
    objects.push(pickaxeHead);

    // Gas pocket warning lamp
    var lampBodyGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8);
    var lampBodyMat = new THREE.MeshStandardMaterial({ color: 0x886622 });
    var lampBody = new THREE.Mesh(lampBodyGeom, lampBodyMat);
    lampBody.position.set(-2.2, 1.5, -12);
    scene.add(lampBody);
    objects.push(lampBody);

    var flameGeom = new THREE.SphereGeometry(0.2, 8, 8);
    var flameMat = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      emissive: 0xFF6600,
      emissiveIntensity: 0.8
    });
    var flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.set(-2.2, 2.2, -12);
    scene.add(flame);
    objects.push(flame);
    animationData.flame = { baseIntensity: 0.8, phase: 0 };

    // Collapse danger zone - cracked ceiling with debris
    var crackCeilingGeom = new THREE.BoxGeometry(3, 0.5, 5);
    var crackCeilingMat = new THREE.MeshStandardMaterial({ color: 0x554433 });
    var crackCeiling = new THREE.Mesh(crackCeilingGeom, crackCeilingMat);
    crackCeiling.position.set(0, 2.5, 8);
    scene.add(crackCeiling);
    objects.push(crackCeiling);
    animationData.crackCeiling = { baseY: 2.5, phase: 0 };

    var debrisGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var debrisMat = new THREE.MeshStandardMaterial({ color: 0x665544 });
    var debris = new THREE.Mesh(debrisGeom, debrisMat);
    debris.position.set(0, 1.8, 8);
    scene.add(debris);
    objects.push(debris);
    animationData.debris = { baseY: 1.8, phase: 0 };

    // Underground waterway
    var waterGeom = new THREE.BoxGeometry(1.5, 0.5, 20);
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x001133,
      emissive: 0x003366,
      emissiveIntensity: 0.6
    });
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.set(0, -1.7, 0);
    scene.add(water);
    objects.push(water);
    animationData.water = { baseIntensity: 0.6, phase: 0 };

    // Dynamite plunger station
    var plungerBoxGeom = new THREE.BoxGeometry(0.8, 1.2, 0.6);
    var plungerBoxMat = new THREE.MeshStandardMaterial({ color: 0x882222 });
    var plungerBox = new THREE.Mesh(plungerBoxGeom, plungerBoxMat);
    plungerBox.position.set(0, 0, 15);
    scene.add(plungerBox);
    objects.push(plungerBox);

    var plungerHandleGeom = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
    var plungerHandleMat = new THREE.MeshStandardMaterial({ color: 0x444433 });
    var plungerHandle = new THREE.Mesh(plungerHandleGeom, plungerHandleMat);
    plungerHandle.position.set(0, 1.2, 15);
    scene.add(plungerHandle);
    objects.push(plungerHandle);

    // Mining equipment shed (surface structure)
    var shedGeom = new THREE.BoxGeometry(3, 2.5, 3);
    var shedMat = new THREE.MeshStandardMaterial({ color: 0x665544 });
    var shed = new THREE.Mesh(shedGeom, shedMat);
    shed.position.set(5, 1.2, 0);
    scene.add(shed);
    objects.push(shed);

    // Emergency escape ladder
    var ladderRailGeom = new THREE.BoxGeometry(0.1, 4, 0.1);
    var ladderRailMat = new THREE.MeshStandardMaterial({ color: 0x555544 });
    var ladderRail1 = new THREE.Mesh(ladderRailGeom, ladderRailMat);
    ladderRail1.position.set(-3.5, 1.5, 12);
    scene.add(ladderRail1);
    objects.push(ladderRail1);

    var ladderRail2 = new THREE.Mesh(ladderRailGeom, ladderRailMat);
    ladderRail2.position.set(-3, 1.5, 12);
    scene.add(ladderRail2);
    objects.push(ladderRail2);

    for (var k = 0; k < 8; k++) {
      var rungGeom = new THREE.BoxGeometry(0.5, 0.1, 0.1);
      var rungMat = new THREE.MeshStandardMaterial({ color: 0x555544 });
      var rung = new THREE.Mesh(rungGeom, rungMat);
      rung.position.set(-3.25, 0 + k * 0.45, 12);
      scene.add(rung);
      objects.push(rung);
    }

    // Coal pile deposits
    for (var m = 0; m < 3; m++) {
      var coalPileGeom = new THREE.SphereGeometry(0.8, 8, 8);
      var coalPileMat = new THREE.MeshStandardMaterial({ color: 0x111100 });
      var coalPile = new THREE.Mesh(coalPileGeom, coalPileMat);
      coalPile.position.set(-1.5 + m * 2, -1.3, 5 + m * 2);
      scene.add(coalPile);
      objects.push(coalPile);
    }

    // Additional coal seam formations
    var coalSeam1Geom = new THREE.SphereGeometry(0.6, 8, 8);
    var coalSeamMat = new THREE.MeshStandardMaterial({ color: 0x111100 });
    var coalSeam1 = new THREE.Mesh(coalSeam1Geom, coalSeamMat);
    coalSeam1.position.set(2.2, 0.5, -10);
    scene.add(coalSeam1);
    objects.push(coalSeam1);

    var coalSeam2 = new THREE.Mesh(coalSeam1Geom, coalSeamMat);
    coalSeam2.position.set(-2.2, 0.2, 10);
    scene.add(coalSeam2);
    objects.push(coalSeam2);
  }

  function update(delta) {
    if (!scene) return;

    // Elevator cage - oscillates up/down
    if (animationData.elevatorCage) {
      animationData.elevatorCage.phase += delta * 0.5;
      var elevatorCage = objects[0];
      elevatorCage.position.y = animationData.elevatorCage.baseY +
        Math.sin(animationData.elevatorCage.phase) * 2;
    }

    // Support beams - slight rotation oscillation
    for (var i = 0; i < 4; i++) {
      if (animationData['beam_' + i]) {
        animationData['beam_' + i].phase += delta * 0.3;
        var beamIdx = 1 + i * 3;
        if (objects[beamIdx]) {
          objects[beamIdx].rotation.z = Math.sin(animationData['beam_' + i].phase) * 0.02;
        }
      }
    }

    // Mine cart - rolls along track
    if (animationData.cart) {
      animationData.cart.phase += delta * 0.8;
      var cart = objects[15];
      if (cart) {
        cart.position.z = Math.sin(animationData.cart.phase) * 8;
      }
    }

    // Gas lamp flicker
    if (animationData.flame) {
      animationData.flame.phase += delta * 3;
      var flameIdx = null;
      for (var f = 0; f < objects.length; f++) {
        if (objects[f].geometry instanceof THREE.SphereGeometry &&
            objects[f].material.emissive &&
            objects[f].position.z === -12) {
          flameIdx = f;
          break;
        }
      }
      if (flameIdx !== null) {
        var flickerIntensity = animationData.flame.baseIntensity +
          Math.sin(animationData.flame.phase) * 0.3 +
          Math.random() * 0.2;
        objects[flameIdx].material.emissiveIntensity = Math.max(0.3, flickerIntensity);
      }
    }

    // Ceiling debris shifts
    if (animationData.debris) {
      animationData.debris.phase += delta * 1.2;
      var debrisIdx = null;
      for (var d = 0; d < objects.length; d++) {
        if (objects[d].position.z === 8 &&
            objects[d].position.y < 2 &&
            objects[d].geometry instanceof THREE.BoxGeometry) {
          if (objects[d].scale.x === 1 && objects[d].scale.y === 1) {
            var testGeom = objects[d].geometry;
            if (testGeom.parameters && testGeom.parameters.width === 0.4) {
              debrisIdx = d;
              break;
            }
          }
        }
      }
      if (debrisIdx !== null) {
        objects[debrisIdx].position.y = animationData.debris.baseY +
          Math.sin(animationData.debris.phase) * 0.3;
      }
    }

    // Underground water - emissive shimmer
    if (animationData.water) {
      animationData.water.phase += delta * 1.5;
      var waterIdx = null;
      for (var w = 0; w < objects.length; w++) {
        if (objects[w].position.y < -1.5 && objects[w].position.y > -2 &&
            objects[w].material && objects[w].material.emissive) {
          if (objects[w].material.color.getHex() === 0x001133) {
            waterIdx = w;
            break;
          }
        }
      }
      if (waterIdx !== null) {
        var shimmer = animationData.water.baseIntensity +
          Math.sin(animationData.water.phase) * 0.2;
        objects[waterIdx].material.emissiveIntensity = shimmer;
      }
    }

    // Cracked ceiling shifts slightly
    if (animationData.crackCeiling) {
      animationData.crackCeiling.phase += delta * 0.4;
      var crackIdx = null;
      for (var c = 0; c < objects.length; c++) {
        if (objects[c].position.z === 8 &&
            objects[c].position.y > 2 &&
            objects[c].geometry instanceof THREE.BoxGeometry) {
          if (objects[c].geometry.parameters &&
              objects[c].geometry.parameters.width === 3) {
            crackIdx = c;
            break;
          }
        }
      }
      if (crackIdx !== null) {
        objects[crackIdx].position.y = animationData.crackCeiling.baseY +
          Math.sin(animationData.crackCeiling.phase) * 0.15;
      }
    }
  }

  function reset() {
    if (scene) {
      for (var i = 0; i < objects.length; i++) {
        scene.remove(objects[i]);
      }
    }
    objects = [];
    animationData = {};
    scene = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
