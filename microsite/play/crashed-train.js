window.CrashedTrain = (function() {
  'use strict';

  var scene, group;
  var fireParticles = [];
  var sparkParticles = [];
  var craneRotation = 0;
  var evacuationSlideSwing = 0;
  var fireFlicker = 0;

  function init(sceneParam) {
    scene = sceneParam;
    group = new THREE.Group();
    scene.add(group);

    // 1. Ravine rock face (background)
    var rockGeom = new THREE.BoxGeometry(80, 60, 5);
    var rockMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var rockFace = new THREE.Mesh(rockGeom, rockMat);
    rockFace.position.set(0, 0, -50);
    group.add(rockFace);

    // 2. Locomotive body (jackknifed)
    var locoGeom = new THREE.BoxGeometry(12, 6, 25);
    var locoMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var locomotive = new THREE.Mesh(locoGeom, locoMat);
    locomotive.position.set(-15, 5, 0);
    locomotive.rotation.z = 0.3;
    group.add(locomotive);

    // 3. Locomotive cabin
    var cabinGeom = new THREE.BoxGeometry(8, 5, 8);
    var cabinMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(-20, 8, 15);
    cabin.rotation.z = 0.3;
    group.add(cabin);

    // 4. Passenger car 1 (ripped open)
    var carGeom = new THREE.BoxGeometry(11, 5, 22);
    var carMat = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
    var carOne = new THREE.Mesh(carGeom, carMat);
    carOne.position.set(5, 2, 5);
    carOne.rotation.z = -0.15;
    group.add(carOne);

    // 5. Passenger car 2 (tipped)
    var carTwo = new THREE.Mesh(carGeom, carMat);
    carTwo.position.set(18, 1, 15);
    carTwo.rotation.z = -0.4;
    group.add(carTwo);

    // 6. Military cargo car (split open)
    var cargoGeom = new THREE.BoxGeometry(10, 5, 20);
    var cargoMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var cargoCar = new THREE.Mesh(cargoGeom, cargoMat);
    cargoCar.position.set(30, 1, 10);
    cargoCar.rotation.z = -0.2;
    group.add(cargoCar);

    // 7. Weapon crate 1
    var crateGeom = new THREE.BoxGeometry(3, 3, 3);
    var crateMat = new THREE.MeshPhongMaterial({ color: 0x228B22 });
    var crate1 = new THREE.Mesh(crateGeom, crateMat);
    crate1.position.set(32, 4, 8);
    crate1.rotation.y = 0.4;
    group.add(crate1);

    // 8. Weapon crate 2
    var crate2 = new THREE.Mesh(crateGeom, crateMat);
    crate2.position.set(35, 3, 12);
    crate2.rotation.y = -0.3;
    group.add(crate2);

    // 9. Luggage scattered
    var luggageGeom = new THREE.BoxGeometry(2, 2, 2);
    var luggageMat = new THREE.MeshPhongMaterial({ color: 0xD4A574 });
    var luggage = new THREE.Mesh(luggageGeom, luggageMat);
    luggage.position.set(12, 2, 8);
    luggage.rotation.y = 0.5;
    group.add(luggage);

    // 10. Evacuation slide 1
    var slideGeom = new THREE.BoxGeometry(2, 0.5, 15);
    var slideMat = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    var slide1 = new THREE.Mesh(slideGeom, slideMat);
    slide1.position.set(8, 1, 5);
    slide1.rotation.z = 0.5;
    slide1.userData.slideId = 'slide1';
    group.add(slide1);

    // 11. Evacuation slide 2
    var slide2 = new THREE.Mesh(slideGeom, slideMat);
    slide2.position.set(12, 1, 5);
    slide2.rotation.z = -0.5;
    slide2.userData.slideId = 'slide2';
    group.add(slide2);

    // 12. Broken rail sections
    var railGeom = new THREE.BoxGeometry(2, 0.5, 20);
    var railMat = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var rail1 = new THREE.Mesh(railGeom, railMat);
    rail1.position.set(-10, 0, 0);
    rail1.rotation.z = 0.2;
    group.add(rail1);

    // 13. Downed power line (line segments)
    var lineMat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
    var points = [
      new THREE.Vector3(-30, 20, 0),
      new THREE.Vector3(0, 5, 0),
      new THREE.Vector3(35, 10, 0)
    ];
    var lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    var powerLine = new THREE.LineSegments(lineGeom, lineMat);
    group.add(powerLine);

    // 14. Rescue crane base (stationary)
    var craneBaseGeom = new THREE.CylinderGeometry(3, 3, 2, 16);
    var craneMat = new THREE.MeshPhongMaterial({ color: 0xFF4500 });
    var craneBase = new THREE.Mesh(craneBaseGeom, craneMat);
    craneBase.position.set(40, 1, -30);
    group.add(craneBase);

    // 15. Rescue crane arm (rotates)
    var craneArmGeom = new THREE.BoxGeometry(2, 1, 20);
    var craneArm = new THREE.Mesh(craneArmGeom, craneMat);
    craneArm.position.set(40, 5, -20);
    craneArm.userData.isArm = true;
    group.add(craneArm);

    // 16. Fuel fire core (sphere)
    var fireGeom = new THREE.SphereGeometry(5, 16, 16);
    var fireMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    var fireSphere = new THREE.Mesh(fireGeom, fireMat);
    fireSphere.position.set(-10, 8, 5);
    fireSphere.userData.isFire = true;
    group.add(fireSphere);

    // Initialize fire particles
    for (var i = 0; i < 20; i++) {
      var pGeom = new THREE.SphereGeometry(0.3, 8, 8);
      var pMat = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
      var p = new THREE.Mesh(pGeom, pMat);
      p.position.copy(fireSphere.position);
      p.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 2
      );
      p.userData.life = 1;
      group.add(p);
      fireParticles.push(p);
    }

    // Initialize spark particles
    for (var j = 0; j < 15; j++) {
      var sGeom = new THREE.SphereGeometry(0.15, 6, 6);
      var sMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
      var s = new THREE.Mesh(sGeom, sMat);
      s.position.set(20, 15, 10);
      s.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 2 - 0.5,
        (Math.random() - 0.5) * 4
      );
      s.userData.life = 1;
      group.add(s);
      sparkParticles.push(s);
    }
  }

  function update() {
    if (!group) return;

    // Animate crane rotation
    craneRotation += 0.005;
    var children = group.children;
    for (var i = 0; i < children.length; i++) {
      if (children[i].userData.isArm) {
        children[i].rotation.y = craneRotation;
      }
    }

    // Animate evacuation slide swinging
    evacuationSlideSwing += 0.02;
    for (var j = 0; j < children.length; j++) {
      if (children[j].userData.slideId === 'slide1') {
        children[j].rotation.z = 0.5 + Math.sin(evacuationSlideSwing) * 0.1;
      } else if (children[j].userData.slideId === 'slide2') {
        children[j].rotation.z = -0.5 + Math.cos(evacuationSlideSwing) * 0.1;
      }
    }

    // Animate fire flicker (glow/color)
    fireFlicker += 0.05;
    for (var k = 0; k < children.length; k++) {
      if (children[k].userData.isFire) {
        var flickerVal = Math.sin(fireFlicker) * 0.3 + 0.7;
        children[k].material.color.setHex(Math.floor(0xFF0000 * flickerVal));
        children[k].scale.set(1 + Math.sin(fireFlicker * 0.5) * 0.2,
                              1 + Math.sin(fireFlicker * 0.5) * 0.2,
                              1 + Math.sin(fireFlicker * 0.5) * 0.2);
      }
    }

    // Update fire particles
    for (var fp = 0; fp < fireParticles.length; fp++) {
      var particle = fireParticles[fp];
      particle.position.add(particle.userData.velocity);
      particle.userData.life -= 0.01;
      particle.material.opacity = particle.userData.life;

      if (particle.userData.life <= 0) {
        particle.userData.life = 1;
        for (var kk = 0; kk < children.length; kk++) {
          if (children[kk].userData.isFire) {
            particle.position.copy(children[kk].position);
            break;
          }
        }
      }
    }

    // Update spark particles
    for (var sp = 0; sp < sparkParticles.length; sp++) {
      var spark = sparkParticles[sp];
      spark.position.add(spark.userData.velocity);
      spark.userData.velocity.y -= 0.1;
      spark.userData.life -= 0.008;
      spark.material.opacity = spark.userData.life;

      if (spark.userData.life <= 0) {
        spark.userData.life = 1;
        spark.position.set(20, 15, 10);
      }
    }
  }

  function reset() {
    if (scene && group) {
      scene.remove(group);
      fireParticles = [];
      sparkParticles = [];
      craneRotation = 0;
      evacuationSlideSwing = 0;
      fireFlicker = 0;
      group = null;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
