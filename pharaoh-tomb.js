window.PharaohTomb = (function() {
  'use strict';

  var objects = [];
  var animationStates = {};
  var scene = null;
  var camera = null;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    animationStates = {};

    // 1. Sarcophagus chamber - stone box
    var sarcophagusGeom = new THREE.BoxGeometry(3, 2, 6);
    var sarcophagusMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7 });
    var sarcophagus = new THREE.Mesh(sarcophagusGeom, sarcophagusMat);
    sarcophagus.position.set(0, 1, -20);
    sarcophagus.receiveShadow = true;
    scene.add(sarcophagus);
    objects.push(sarcophagus);

    // 2. Hieroglyph-carved wall left
    var wallLeftGeom = new THREE.BoxGeometry(1, 8, 30);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.8 });
    var wallLeft = new THREE.Mesh(wallLeftGeom, wallMat);
    wallLeft.position.set(-15, 4, -15);
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);
    objects.push(wallLeft);

    // 3. Hieroglyph-carved wall right
    var wallRightGeom = new THREE.BoxGeometry(1, 8, 30);
    var wallRight = new THREE.Mesh(wallRightGeom, wallMat);
    wallRight.position.set(15, 4, -15);
    wallRight.receiveShadow = true;
    scene.add(wallRight);
    objects.push(wallRight);

    // 4. Rolling boulder trap - sphere
    var boulderGeom = new THREE.SphereGeometry(1.5, 16, 16);
    var boulderMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
    var boulder = new THREE.Mesh(boulderGeom, boulderMat);
    boulder.position.set(0, 2, 10);
    boulder.castShadow = true;
    scene.add(boulder);
    objects.push(boulder);
    animationStates.boulder = { position: 10, direction: -1, speed: 0.03 };

    // 5. Spike pit corridor left side - cylinder (spikes)
    var spikeLeftGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
    var spikeMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
    var spikeLeft = new THREE.Mesh(spikeLeftGeom, spikeMat);
    spikeLeft.position.set(-5, 0.4, 5);
    spikeLeft.castShadow = true;
    scene.add(spikeLeft);
    objects.push(spikeLeft);

    // 6. Spike pit corridor right side
    var spikeRightGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
    var spikeRight = new THREE.Mesh(spikeRightGeom, spikeMat);
    spikeRight.position.set(5, 0.4, 5);
    spikeRight.castShadow = true;
    scene.add(spikeRight);
    objects.push(spikeRight);

    // 7. Canopic jar pedestal - cylinder base
    var pedestalGeom = new THREE.CylinderGeometry(1, 1.2, 0.5, 8);
    var pedestalMat = new THREE.MeshStandardMaterial({ color: 0xA0826D, roughness: 0.7 });
    var pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
    pedestal.position.set(-10, 0.25, 0);
    pedestal.receiveShadow = true;
    scene.add(pedestal);
    objects.push(pedestal);

    // 8. Canopic jar - cone shape
    var jarGeom = new THREE.ConeGeometry(0.6, 1.5, 8);
    var jarMat = new THREE.MeshStandardMaterial({ color: 0xCD853F, roughness: 0.8 });
    var jar = new THREE.Mesh(jarGeom, jarMat);
    jar.position.set(-10, 1.25, 0);
    jar.castShadow = true;
    scene.add(jar);
    objects.push(jar);

    // 9. Second canopic jar pedestal
    var pedestal2Geom = new THREE.CylinderGeometry(1, 1.2, 0.5, 8);
    var pedestal2 = new THREE.Mesh(pedestal2Geom, pedestalMat);
    pedestal2.position.set(10, 0.25, 0);
    pedestal2.receiveShadow = true;
    scene.add(pedestal2);
    objects.push(pedestal2);

    // 10. Second canopic jar
    var jar2Geom = new THREE.ConeGeometry(0.6, 1.5, 8);
    var jar2 = new THREE.Mesh(jar2Geom, jarMat);
    jar2.position.set(10, 1.25, 0);
    jar2.castShadow = true;
    scene.add(jar2);
    objects.push(jar2);

    // 11. Cursed gold idol - sphere with glow
    var idolGeom = new THREE.SphereGeometry(0.8, 32, 32);
    var idolMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.2,
      metalness: 0.8,
      roughness: 0.1
    });
    var idol = new THREE.Mesh(idolGeom, idolMat);
    idol.position.set(0, 1, -30);
    idol.castShadow = true;
    scene.add(idol);
    objects.push(idol);
    animationStates.idol = { rotation: 0, speed: 0.02, glow: 0.2, glowDir: 1 };

    // 12. Mummy warrior guardian - cylinder (body)
    var mummyBodyGeom = new THREE.CylinderGeometry(0.6, 0.6, 2, 8);
    var mummyMat = new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.9 });
    var mummyBody = new THREE.Mesh(mummyBodyGeom, mummyMat);
    mummyBody.position.set(-12, 1, -25);
    mummyBody.castShadow = true;
    scene.add(mummyBody);
    objects.push(mummyBody);

    // 13. Mummy head - sphere
    var mummyHeadGeom = new THREE.SphereGeometry(0.5, 16, 16);
    var mummyHead = new THREE.Mesh(mummyHeadGeom, mummyMat);
    mummyHead.position.set(-12, 2.3, -25);
    mummyHead.castShadow = true;
    scene.add(mummyHead);
    objects.push(mummyHead);
    animationStates.mummy = { position: -25, direction: 1, speed: 0.02 };

    // 14. Treasure vault door - box (large)
    var vaultDoorGeom = new THREE.BoxGeometry(4, 5, 0.5);
    var vaultMat = new THREE.MeshStandardMaterial({
      color: 0x556B2F,
      metalness: 0.5,
      roughness: 0.4
    });
    var vaultDoor = new THREE.Mesh(vaultDoorGeom, vaultMat);
    vaultDoor.position.set(0, 2.5, -40);
    vaultDoor.castShadow = true;
    scene.add(vaultDoor);
    objects.push(vaultDoor);

    // 15. Torch - cylinder (pole)
    var torchPoleGeom = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    var torchPoleMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.8 });
    var torchPole = new THREE.Mesh(torchPoleGeom, torchPoleMat);
    torchPole.position.set(-8, 1.5, -35);
    torchPole.receiveShadow = true;
    scene.add(torchPole);
    objects.push(torchPole);

    // 16. Torch flame - cone
    var torchFlameGeom = new THREE.ConeGeometry(0.3, 1, 8);
    var torchFlameMat = new THREE.MeshStandardMaterial({
      color: 0xFF8C00,
      emissive: 0xFF4500,
      emissiveIntensity: 0.6
    });
    var torchFlame = new THREE.Mesh(torchFlameGeom, torchFlameMat);
    torchFlame.position.set(-8, 3.2, -35);
    scene.add(torchFlame);
    objects.push(torchFlame);
    animationStates.torch = { flicker: 0, speed: 0.08 };

    // 17. Burial boat - box (elongated)
    var boatGeom = new THREE.BoxGeometry(2, 1, 5);
    var boatMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    var boat = new THREE.Mesh(boatGeom, boatMat);
    boat.position.set(12, 0.5, -20);
    boat.receiveShadow = true;
    scene.add(boat);
    objects.push(boat);

    // 18. Spike pit floor grate - line segments
    var spikeFloorGeom = new THREE.BufferGeometry();
    var spikeFloorPositions = new Float32Array([
      -6, 0, 4,   6, 0, 4,
      -6, 0, 6,   6, 0, 6,
      -6, 0, 4,   -6, 0, 6,
      6, 0, 4,    6, 0, 6
    ]);
    spikeFloorGeom.setAttribute('position', new THREE.BufferAttribute(spikeFloorPositions, 3));
    var spikeFloorMat = new THREE.LineBasicMaterial({ color: 0x444444 });
    var spikeFloor = new THREE.LineSegments(spikeFloorGeom, spikeFloorMat);
    scene.add(spikeFloor);
    objects.push(spikeFloor);

    // 19. Chamber floor grid - line segments
    var floorGridGeom = new THREE.BufferGeometry();
    var floorGridPositions = new Float32Array([
      -14, 0, -5,    14, 0, -5,
      -14, 0, -35,   14, 0, -35,
      -14, 0, -5,    -14, 0, -35,
      14, 0, -5,     14, 0, -35,
      -14, 0, -20,   14, 0, -20
    ]);
    floorGridGeom.setAttribute('position', new THREE.BufferAttribute(floorGridPositions, 3));
    var floorGridMat = new THREE.LineBasicMaterial({ color: 0x8B7355 });
    var floorGrid = new THREE.LineSegments(floorGridGeom, floorGridMat);
    scene.add(floorGrid);
    objects.push(floorGrid);

    // 20. Ceiling support - cylinder
    var ceilingGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8);
    var ceilingMat = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.8 });
    var ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
    ceiling.position.set(0, 7.85, -20);
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    objects.push(ceiling);
  };

  var update = function(delta) {
    if (!scene) return;

    // Boulder rolling animation
    if (animationStates.boulder) {
      var boulderState = animationStates.boulder;
      boulderState.position += boulderState.direction * boulderState.speed * 100;

      if (boulderState.position > 15) {
        boulderState.direction = -1;
      } else if (boulderState.position < -10) {
        boulderState.direction = 1;
      }

      if (objects[3]) {
        objects[3].position.z = boulderState.position;
        objects[3].rotation.x += boulderState.direction * 0.05;
      }
    }

    // Cursed idol rotation and glow pulsing
    if (animationStates.idol) {
      var idolState = animationStates.idol;
      idolState.rotation += idolState.speed;

      idolState.glow += idolState.glowDir * 0.01;
      if (idolState.glow > 0.5) idolState.glowDir = -1;
      if (idolState.glow < 0.1) idolState.glowDir = 1;

      if (objects[10]) {
        objects[10].rotation.y = idolState.rotation;
        objects[10].material.emissiveIntensity = idolState.glow;
      }
    }

    // Mummy guardian patrolling
    if (animationStates.mummy) {
      var mummyState = animationStates.mummy;
      mummyState.position += mummyState.direction * mummyState.speed * 100;

      if (mummyState.position > -10) {
        mummyState.direction = -1;
      } else if (mummyState.position < -35) {
        mummyState.direction = 1;
      }

      if (objects[11]) {
        objects[11].position.z = mummyState.position;
      }
      if (objects[12]) {
        objects[12].position.z = mummyState.position;
      }
    }

    // Torch flickering
    if (animationStates.torch) {
      var torchState = animationStates.torch;
      torchState.flicker = Math.sin(Date.now() * torchState.speed * 0.001) * 0.15 + 0.85;

      if (objects[15]) {
        objects[15].material.emissiveIntensity = torchState.flicker * 0.6;
        objects[15].scale.y = torchState.flicker;
      }
    }

    // Spike pits pulsing up and down
    if (objects[4] && objects[5]) {
      var spikePulse = Math.sin(Date.now() * 0.001) * 0.2;
      objects[4].position.y = 0.4 + spikePulse;
      objects[5].position.y = 0.4 + spikePulse;
    }
  };

  var reset = function() {
    if (!scene) return;

    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
      if (objects[i].geometry) objects[i].geometry.dispose();
      if (objects[i].material) {
        if (Array.isArray(objects[i].material)) {
          for (var j = 0; j < objects[i].material.length; j++) {
            objects[i].material[j].dispose();
          }
        } else {
          objects[i].material.dispose();
        }
      }
    }

    objects = [];
    animationStates = {};
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
