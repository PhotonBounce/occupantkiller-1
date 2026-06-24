window.BurningVillage = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var animationState = {};

  function init(inputScene, camera) {
    scene = inputScene;
    objects = [];
    animationState = {};

    // 1. Burning farmhouse - BoxGeometry walls + ConeGeometry roof
    var farmhouseWalls = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 10),
      new THREE.MeshStandardMaterial({ color: 0x884422 })
    );
    farmhouseWalls.position.set(-20, 3, 0);
    scene.add(farmhouseWalls);
    objects.push({ mesh: farmhouseWalls, type: 'static' });

    var farmhouseRoof = new THREE.Mesh(
      new THREE.ConeGeometry(6, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0x882211 })
    );
    farmhouseRoof.position.set(-20, 10, 0);
    farmhouseRoof.rotation.y = Math.PI / 4;
    scene.add(farmhouseRoof);
    objects.push({ mesh: farmhouseRoof, type: 'static' });

    // Fire on farmhouse
    var farmhouseFire = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xFF4400,
        emissive: 0xFF2200,
        emissiveIntensity: 0.8
      })
    );
    farmhouseFire.position.set(-20, 8, 0);
    scene.add(farmhouseFire);
    objects.push({ mesh: farmhouseFire, type: 'fire', phase: Math.random() * Math.PI * 2 });

    // 2. Barn on fire - large BoxGeometry + SphereGeometry fire
    var barnStructure = new THREE.Mesh(
      new THREE.BoxGeometry(15, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0x774411 })
    );
    barnStructure.position.set(15, 4, -5);
    scene.add(barnStructure);
    objects.push({ mesh: barnStructure, type: 'static' });

    var barnFire = new THREE.Mesh(
      new THREE.SphereGeometry(5, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xFF6600,
        emissive: 0xFF3300,
        emissiveIntensity: 0.9
      })
    );
    barnFire.position.set(15, 10, -5);
    scene.add(barnFire);
    objects.push({ mesh: barnFire, type: 'fire', phase: Math.random() * Math.PI * 2 });

    // 3. Church bell tower burning - BoxGeometry + CylinderGeometry bell
    var towerStructure = new THREE.Mesh(
      new THREE.BoxGeometry(4, 14, 4),
      new THREE.MeshStandardMaterial({ color: 0x887766 })
    );
    towerStructure.position.set(-8, 7, 15);
    scene.add(towerStructure);
    objects.push({ mesh: towerStructure, type: 'static' });

    var bell = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 2, 8),
      new THREE.MeshStandardMaterial({ color: 0x886633 })
    );
    bell.position.set(-8, 15, 15);
    scene.add(bell);
    objects.push({ mesh: bell, type: 'swinging', angle: 0 });

    var towerFire = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xFF5500,
        emissive: 0xFF2200,
        emissiveIntensity: 0.85
      })
    );
    towerFire.position.set(-8, 12, 15);
    scene.add(towerFire);
    objects.push({ mesh: towerFire, type: 'fire', phase: Math.random() * Math.PI * 2 });

    // 4. Village well - CylinderGeometry stone + wooden frame
    var wellStone = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2.2, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x887755 })
    );
    wellStone.position.set(5, 0.75, 10);
    scene.add(wellStone);
    objects.push({ mesh: wellStone, type: 'static' });

    var wellFrame = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x665533 })
    );
    wellFrame.position.set(5, 2, 10);
    scene.add(wellFrame);
    objects.push({ mesh: wellFrame, type: 'static' });

    // 5. Burning fence line - BoxGeometry posts + SphereGeometry fire
    for (var i = 0; i < 5; i++) {
      var fencePost = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 3, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x553311 })
      );
      fencePost.position.set(-25 + i * 8, 1.5, -15);
      scene.add(fencePost);
      objects.push({ mesh: fencePost, type: 'static' });

      var fenceFire = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 6, 6),
        new THREE.MeshStandardMaterial({
          color: 0xFF5500,
          emissive: 0xFF2200,
          emissiveIntensity: 0.75
        })
      );
      fenceFire.position.set(-25 + i * 8, 3, -15);
      scene.add(fenceFire);
      objects.push({ mesh: fenceFire, type: 'fire', phase: Math.random() * Math.PI * 2 });
    }

    // 6. Overturned market cart - BoxGeometry on side
    var cartBody = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 5),
      new THREE.MeshStandardMaterial({ color: 0x774422 })
    );
    cartBody.position.set(25, 1, 5);
    cartBody.rotation.z = Math.PI / 3;
    scene.add(cartBody);
    objects.push({ mesh: cartBody, type: 'static' });

    var cartWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x553322 })
    );
    cartWheel.position.set(26, 1.5, 5);
    cartWheel.rotation.x = Math.PI / 2;
    scene.add(cartWheel);
    objects.push({ mesh: cartWheel, type: 'static' });

    // 7. Smoke columns - SphereGeometry dark rising stacks (3 columns)
    for (var s = 0; s < 3; s++) {
      var smokeX = -15 + s * 15;
      for (var sh = 0; sh < 4; sh++) {
        var smoke = new THREE.Mesh(
          new THREE.SphereGeometry(2.5, 6, 6),
          new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true, opacity: 0.6 })
        );
        smoke.position.set(smokeX, 5 + sh * 3, 8);
        scene.add(smoke);
        objects.push({ mesh: smoke, type: 'smoke', baseY: 5 + sh * 3, driftX: Math.random() * 2 - 1 });
      }
    }

    // 8. Trapped animals - BoxGeometry barn animals
    for (var a = 0; a < 3; a++) {
      var animal = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x885533 })
      );
      animal.position.set(10 + a * 3, 0.5, -15);
      scene.add(animal);
      objects.push({ mesh: animal, type: 'moving', speed: 0.5 + Math.random() * 0.3 });
    }

    // 9. Military truck convoy - BoxGeometry olive + CylinderGeometry wheels
    var truckBody = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0x445533 })
    );
    truckBody.position.set(-30, 1.5, 25);
    scene.add(truckBody);
    objects.push({ mesh: truckBody, type: 'convoy', oscillation: 0 });

    for (var w = 0; w < 2; w++) {
      var wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      wheel.position.set(-30 + w * 2.5, 0.8, 25);
      wheel.rotation.x = Math.PI / 2;
      scene.add(wheel);
      objects.push({ mesh: wheel, type: 'static' });
    }

    // 10. Enemy encampment - BoxGeometry tents + fire
    for (var t = 0; t < 2; t++) {
      var tentBody = new THREE.Mesh(
        new THREE.BoxGeometry(4, 3, 4),
        new THREE.MeshStandardMaterial({ color: 0x445533 })
      );
      tentBody.position.set(-35 + t * 10, 1.5, 18);
      scene.add(tentBody);
      objects.push({ mesh: tentBody, type: 'static' });

      var tentFire = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xFF4400,
          emissive: 0xFF1100,
          emissiveIntensity: 0.8
        })
      );
      tentFire.position.set(-35 + t * 10, 4, 18);
      scene.add(tentFire);
      objects.push({ mesh: tentFire, type: 'fire', phase: Math.random() * Math.PI * 2 });
    }

    // 11. Water trough - BoxGeometry dry and cracked
    var trough = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1, 2),
      new THREE.MeshStandardMaterial({ color: 0x556633 })
    );
    trough.position.set(30, 0.5, 15);
    scene.add(trough);
    objects.push({ mesh: trough, type: 'static' });

    // 12. Village square cobblestones - BoxGeometry ground blocks
    for (var cx = 0; cx < 4; cx++) {
      for (var cz = 0; cz < 3; cz++) {
        var cobble = new THREE.Mesh(
          new THREE.BoxGeometry(2, 0.2, 2),
          new THREE.MeshStandardMaterial({ color: 0x887766 })
        );
        cobble.position.set(-8 + cx * 2.5, 0, 2 + cz * 2.5);
        scene.add(cobble);
        objects.push({ mesh: cobble, type: 'static' });
      }
    }

    // 13. Collapsed structure rubble - BoxGeometry debris piles
    for (var r = 0; r < 4; r++) {
      var rubble = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2, 3),
        new THREE.MeshStandardMaterial({ color: 0x665544 })
      );
      rubble.position.set(0 + r * 5, 1, -25);
      rubble.rotation.z = Math.random() * Math.PI / 4;
      scene.add(rubble);
      objects.push({ mesh: rubble, type: 'static' });
    }

    // 14. Burning hay bales - CylinderGeometry + SphereGeometry fire
    for (var h = 0; h < 3; h++) {
      var hayBale = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 1, 6),
        new THREE.MeshStandardMaterial({ color: 0x886622 })
      );
      hayBale.position.set(20, 0.5, 20 + h * 3);
      scene.add(hayBale);
      objects.push({ mesh: hayBale, type: 'static' });

      var hayFire = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xFF5500,
          emissive: 0xFF2200,
          emissiveIntensity: 0.8
        })
      );
      hayFire.position.set(20, 3, 20 + h * 3);
      scene.add(hayFire);
      objects.push({ mesh: hayFire, type: 'fire', phase: Math.random() * Math.PI * 2 });
    }

    // 15. Ash particles falling - SphereGeometry tiny
    for (var ap = 0; ap < 8; ap++) {
      var ashParticle = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 4, 4),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      ashParticle.position.set(Math.random() * 50 - 25, Math.random() * 15 + 5, Math.random() * 40 - 20);
      scene.add(ashParticle);
      objects.push({ mesh: ashParticle, type: 'ash', startY: ashParticle.position.y });
    }

    animationState = {
      time: 0,
      firePhases: {},
      convoyPos: 0,
      bellAngle: 0
    };
  }

  function update(delta) {
    if (!scene) return;

    animationState.time += delta;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];

      if (obj.type === 'fire') {
        var fireIntensity = 0.5 + 0.5 * Math.sin(animationState.time * 8 + obj.phase);
        obj.mesh.material.emissiveIntensity = fireIntensity;
        obj.mesh.scale.x = 0.9 + 0.2 * Math.sin(animationState.time * 6 + obj.phase);
        obj.mesh.scale.y = 0.9 + 0.2 * Math.cos(animationState.time * 5.5 + obj.phase);
        obj.mesh.scale.z = 0.9 + 0.2 * Math.sin(animationState.time * 7 + obj.phase);
      }

      if (obj.type === 'smoke') {
        obj.mesh.position.y = obj.baseY + Math.sin(animationState.time * 0.5) * 0.5 + animationState.time * 1.2;
        obj.mesh.position.x += obj.driftX * delta * 0.5;
        if (obj.mesh.position.y > 50) {
          obj.mesh.position.y = obj.baseY;
        }
      }

      if (obj.type === 'swinging') {
        obj.mesh.rotation.z = Math.sin(animationState.time * 2) * 0.3;
      }

      if (obj.type === 'convoy') {
        obj.mesh.position.z = 25 + Math.sin(animationState.time * 1.5) * 3;
      }

      if (obj.type === 'moving') {
        obj.mesh.position.x += obj.speed * delta;
        if (obj.mesh.position.x > 35) {
          obj.mesh.position.x = 5;
        }
      }

      if (obj.type === 'ash') {
        obj.mesh.position.y -= delta * 2;
        if (obj.mesh.position.y < 0) {
          obj.mesh.position.y = obj.startY;
        }
      }
    }
  }

  function reset() {
    if (scene) {
      for (var i = 0; i < objects.length; i++) {
        scene.remove(objects[i].mesh);
      }
    }
    objects = [];
    scene = null;
    animationState = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
