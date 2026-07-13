window.SubmarineGraveyard = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animationData = {};

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    objects = [];
    animationData = {};

    // 1. Submarine hull 1 - main wreck (CylinderGeometry)
    var hullGeom1 = new THREE.CylinderGeometry(2.5, 2.5, 20, 16, 8);
    var hullMat1 = new THREE.MeshStandardMaterial({ color: 0x334433 });
    var hull1 = new THREE.Mesh(hullGeom1, hullMat1);
    hull1.rotation.z = Math.PI / 6;
    hull1.position.set(-15, -8, 0);
    scene.add(hull1);
    objects.push(hull1);

    // 2. Submarine conning tower 1 (BoxGeometry)
    var towerGeom1 = new THREE.BoxGeometry(2.2, 6, 2.2);
    var towerMat1 = new THREE.MeshStandardMaterial({ color: 0x445544 });
    var tower1 = new THREE.Mesh(towerGeom1, towerMat1);
    tower1.position.set(-15, 2, 0);
    scene.add(tower1);
    objects.push(tower1);

    // 3. Torpedo tubes array (CylinderGeometry)
    for (var i = 0; i < 4; i++) {
      var tubeGeom = new THREE.CylinderGeometry(0.5, 0.5, 3, 8, 4);
      var tubeMat = new THREE.MeshStandardMaterial({ color: 0x333344 });
      var tube = new THREE.Mesh(tubeGeom, tubeMat);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(-15 + (i * 0.7), -2 + (i * 0.5), 2);
      scene.add(tube);
      objects.push(tube);
    }

    // 4. Sonar dome (SphereGeometry)
    var sonarGeom = new THREE.SphereGeometry(1.8, 16, 12);
    var sonarMat = new THREE.MeshStandardMaterial({ color: 0x334455 });
    var sonar = new THREE.Mesh(sonarGeom, sonarMat);
    sonar.position.set(-25, -5, 0);
    scene.add(sonar);
    objects.push(sonar);

    // 5. Submarine hull 2 - tilted (CylinderGeometry)
    var hullGeom2 = new THREE.CylinderGeometry(2.3, 2.3, 18, 16, 8);
    var hullMat2 = new THREE.MeshStandardMaterial({ color: 0x334433 });
    var hull2 = new THREE.Mesh(hullGeom2, hullMat2);
    hull2.rotation.z = -Math.PI / 4;
    hull2.position.set(10, -6, 15);
    scene.add(hull2);
    objects.push(hull2);

    // 6. Submarine conning tower 2 (BoxGeometry)
    var towerGeom2 = new THREE.BoxGeometry(2, 5.5, 2);
    var towerMat2 = new THREE.MeshStandardMaterial({ color: 0x445544 });
    var tower2 = new THREE.Mesh(towerGeom2, towerMat2);
    tower2.position.set(10, 3, 15);
    scene.add(tower2);
    objects.push(tower2);

    // 7. Coral growth clump 1 (SphereGeometry green)
    var coralGeom1a = new THREE.SphereGeometry(1.5, 12, 10);
    var coralMat1a = new THREE.MeshStandardMaterial({ color: 0x226644 });
    var coral1a = new THREE.Mesh(coralGeom1a, coralMat1a);
    coral1a.position.set(-18, -12, 5);
    scene.add(coral1a);
    objects.push(coral1a);
    animationData.coral1a = { baseRotation: coral1a.rotation.z };

    // 8. Coral growth clump 2 (SphereGeometry orange)
    var coralGeom1b = new THREE.SphereGeometry(1.3, 12, 10);
    var coralMat1b = new THREE.MeshStandardMaterial({ color: 0xFF6644 });
    var coral1b = new THREE.Mesh(coralGeom1b, coralMat1b);
    coral1b.position.set(-16, -14, 7);
    scene.add(coral1b);
    objects.push(coral1b);
    animationData.coral1b = { baseRotation: coral1b.rotation.z };

    // 9. Bioluminescent jellyfish (SphereGeometry emissive)
    var jellyfishGeom = new THREE.SphereGeometry(0.8, 12, 12);
    var jellyfishMat = new THREE.MeshStandardMaterial({
      color: 0x8800FF,
      emissive: 0x8800FF,
      emissiveIntensity: 0.6
    });
    var jellyfish = new THREE.Mesh(jellyfishGeom, jellyfishMat);
    jellyfish.position.set(0, 5, 25);
    scene.add(jellyfish);
    objects.push(jellyfish);
    animationData.jellyfish = {
      baseX: 0,
      baseY: 5,
      baseZ: 25,
      phase: 0
    };

    // 10. Shark patrol (BoxGeometry elongated)
    var sharkGeom = new THREE.BoxGeometry(1.2, 0.8, 4);
    var sharkMat = new THREE.MeshStandardMaterial({ color: 0x445566 });
    var shark = new THREE.Mesh(sharkGeom, sharkMat);
    shark.position.set(20, 0, -10);
    scene.add(shark);
    objects.push(shark);
    animationData.shark = {
      centerX: 20,
      centerZ: -10,
      radius: 15,
      phase: 0
    };

    // 11. Sunken naval mine (SphereGeometry with CylinderGeometry spikes)
    var mineGeom = new THREE.SphereGeometry(1.2, 12, 10);
    var mineMat = new THREE.MeshStandardMaterial({ color: 0x333322 });
    var mine = new THREE.Mesh(mineGeom, mineMat);
    mine.position.set(5, -10, -15);
    scene.add(mine);
    objects.push(mine);
    animationData.mine = { baseY: -10 };

    // Mine spike 1
    var spikeGeom1 = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6, 4);
    var spikeMat = new THREE.MeshStandardMaterial({ color: 0x333322 });
    var spike1 = new THREE.Mesh(spikeGeom1, spikeMat);
    spike1.position.set(5.5, -10, -15);
    spike1.rotation.z = Math.PI / 2;
    scene.add(spike1);
    objects.push(spike1);

    // Mine spike 2
    var spike2 = new THREE.Mesh(spikeGeom1, spikeMat);
    spike2.position.set(4.5, -10, -15);
    spike2.rotation.z = Math.PI / 2;
    scene.add(spike2);
    objects.push(spike2);

    // 12. Depth charge crater (SphereGeometry)
    var craterGeom = new THREE.SphereGeometry(3, 12, 8);
    var craterMat = new THREE.MeshStandardMaterial({ color: 0x443322 });
    var crater = new THREE.Mesh(craterGeom, craterMat);
    crater.position.set(-30, -22, 20);
    crater.scale.y = 0.6;
    scene.add(crater);
    objects.push(crater);

    // 13. Periscope (CylinderGeometry)
    var periscopeGeom = new THREE.CylinderGeometry(0.3, 0.3, 5, 8, 4);
    var periscopeMat = new THREE.MeshStandardMaterial({ color: 0x444433 });
    var periscope = new THREE.Mesh(periscopeGeom, periscopeMat);
    periscope.position.set(-12, 0, 3);
    scene.add(periscope);
    objects.push(periscope);
    animationData.periscope = { baseY: 0 };

    // 14. Naval flag remnant (BoxGeometry)
    var flagGeom = new THREE.BoxGeometry(2, 3, 0.2);
    var flagMat = new THREE.MeshStandardMaterial({ color: 0x222266 });
    var flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(-10, 6, -2);
    flag.rotation.y = Math.PI / 4;
    scene.add(flag);
    objects.push(flag);

    // 15. Pressure-cracked hull section (BoxGeometry)
    var crackGeom = new THREE.BoxGeometry(3, 4, 2);
    var crackMat = new THREE.MeshStandardMaterial({ color: 0x334433 });
    var crack = new THREE.Mesh(crackGeom, crackMat);
    crack.position.set(-20, -5, -12);
    crack.rotation.z = Math.PI / 8;
    scene.add(crack);
    objects.push(crack);

    // 16. Bubble stream particles (SphereGeometry tiny)
    var bubbleGeom = new THREE.SphereGeometry(0.15, 8, 8);
    var bubbleMat = new THREE.MeshStandardMaterial({ color: 0x88AAFF });
    var bubbles = [];
    for (var j = 0; j < 5; j++) {
      var bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
      bubble.position.set(-18 + (j * 0.5), -16, 3);
      scene.add(bubble);
      objects.push(bubble);
      bubbles.push({
        mesh: bubble,
        baseY: -16 + (j * 0.3)
      });
    }
    animationData.bubbles = bubbles;

    // 17. Enemy salvage submarine (BoxGeometry)
    var salvageGeom = new THREE.BoxGeometry(3, 1.5, 5);
    var salvageMat = new THREE.MeshStandardMaterial({ color: 0x335533 });
    var salvage = new THREE.Mesh(salvageGeom, salvageMat);
    salvage.position.set(25, 8, 30);
    scene.add(salvage);
    objects.push(salvage);
    animationData.salvage = {
      phase: 0,
      baseY: 8
    };

    // 18. Coral growth clump 3 (SphereGeometry)
    var coralGeom2 = new THREE.SphereGeometry(1.4, 12, 10);
    var coralMat2 = new THREE.MeshStandardMaterial({ color: 0x226644 });
    var coral2 = new THREE.Mesh(coralGeom2, coralMat2);
    coral2.position.set(8, -14, 18);
    scene.add(coral2);
    objects.push(coral2);
    animationData.coral2 = { baseRotation: coral2.rotation.z };
  }

  function update(delta) {
    if (!scene) return;

    // Update jellyfish - drift with oscillation
    if (animationData.jellyfish) {
      var jf = animationData.jellyfish;
      jf.phase += delta * 0.5;
      var findJellyfish = scene.getObjectByProperty('position', { x: jf.baseX, y: jf.baseY, z: jf.baseZ });
      for (var i = 0; i < objects.length; i++) {
        if (objects[i].geometry instanceof THREE.SphereGeometry &&
            objects[i].material.emissive &&
            objects[i].material.emissive.getHex &&
            objects[i].material.emissive.getHex() === 0x8800FF) {
          objects[i].position.x = jf.baseX + Math.sin(jf.phase) * 3;
          objects[i].position.y = jf.baseY + Math.cos(jf.phase * 0.7) * 2;
          objects[i].position.z = jf.baseZ + Math.sin(jf.phase * 0.6) * 2;
          objects[i].material.emissiveIntensity = 0.4 + Math.sin(jf.phase * 2) * 0.2;
          break;
        }
      }
    }

    // Update shark - orbital patrol
    if (animationData.shark) {
      var sh = animationData.shark;
      sh.phase += delta * 0.3;
      for (var i = 0; i < objects.length; i++) {
        if (objects[i].geometry instanceof THREE.BoxGeometry &&
            objects[i].material.color.getHex &&
            objects[i].material.color.getHex() === 0x445566 &&
            objects[i].position.y === 0) {
          objects[i].position.x = sh.centerX + Math.cos(sh.phase) * sh.radius;
          objects[i].position.z = sh.centerZ + Math.sin(sh.phase) * sh.radius;
          objects[i].rotation.y = sh.phase;
          break;
        }
      }
    }

    // Update bubbles - rising motion
    if (animationData.bubbles && animationData.bubbles.length > 0) {
      for (var b = 0; b < animationData.bubbles.length; b++) {
        var bubbleData = animationData.bubbles[b];
        bubbleData.mesh.position.y += delta * 4;
        if (bubbleData.mesh.position.y > 5) {
          bubbleData.mesh.position.y = bubbleData.baseY;
        }
      }
    }

    // Update periscope - slow rise oscillation
    if (animationData.periscope) {
      var per = animationData.periscope;
      var periscopeObj = null;
      for (var i = 0; i < objects.length; i++) {
        if (objects[i].geometry instanceof THREE.CylinderGeometry &&
            objects[i].position.x === -12 &&
            objects[i].position.z === 3) {
          periscopeObj = objects[i];
          break;
        }
      }
      if (periscopeObj) {
        var time = Date.now() * 0.0005;
        periscopeObj.position.y = per.baseY + Math.sin(time) * 1.5;
      }
    }

    // Update coral - sway rotation
    if (animationData.coral1a) {
      var time = Date.now() * 0.0004;
      for (var i = 0; i < objects.length; i++) {
        if (objects[i].position.x === -18 && objects[i].position.y === -12) {
          objects[i].rotation.z = animationData.coral1a.baseRotation + Math.sin(time) * 0.15;
          break;
        }
      }
    }

    if (animationData.coral1b) {
      var time = Date.now() * 0.0003;
      for (var i = 0; i < objects.length; i++) {
        if (objects[i].position.x === -16 && objects[i].position.y === -14) {
          objects[i].rotation.z = animationData.coral1b.baseRotation + Math.sin(time * 0.8) * 0.12;
          break;
        }
      }
    }

    if (animationData.coral2) {
      var time = Date.now() * 0.0005;
      for (var i = 0; i < objects.length; i++) {
        if (objects[i].position.x === 8 && objects[i].position.y === -14) {
          objects[i].rotation.z = animationData.coral2.baseRotation + Math.sin(time * 1.2) * 0.18;
          break;
        }
      }
    }

    // Update naval mines - bobbing motion
    if (animationData.mine) {
      var time = Date.now() * 0.0006;
      for (var i = 0; i < objects.length; i++) {
        if (objects[i].geometry instanceof THREE.SphereGeometry &&
            objects[i].position.x === 5 &&
            objects[i].position.z === -15 &&
            objects[i].position.y < -9) {
          objects[i].position.y = animationData.mine.baseY + Math.sin(time) * 1.2;
          break;
        }
      }
    }

    // Update salvage submarine searchlight rotation and movement
    if (animationData.salvage) {
      var sal = animationData.salvage;
      sal.phase += delta * 0.4;
      for (var i = 0; i < objects.length; i++) {
        if (objects[i].geometry instanceof THREE.BoxGeometry &&
            objects[i].material.color.getHex &&
            objects[i].material.color.getHex() === 0x335533) {
          objects[i].rotation.y = sal.phase;
          objects[i].position.y = sal.baseY + Math.sin(sal.phase * 0.5) * 0.8;
          break;
        }
      }
    }
  }

  function reset() {
    if (scene) {
      for (var i = objects.length - 1; i >= 0; i--) {
        scene.remove(objects[i]);
        if (objects[i].geometry) {
          objects[i].geometry.dispose();
        }
        if (objects[i].material) {
          if (Array.isArray(objects[i].material)) {
            for (var m = 0; m < objects[i].material.length; m++) {
              objects[i].material[m].dispose();
            }
          } else {
            objects[i].material.dispose();
          }
        }
      }
    }
    objects = [];
    animationData = {};
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
