window.StirlingDock = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  var create = function(scene) {
    // Stirling Castle silhouette on crag
    var rockPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(10, 25, 15),
      new THREE.MeshLambertMaterial({ color: 0x554433 })
    );
    rockPlinth.position.set(0, 12.5, -40);
    scene.add(rockPlinth);
    objects.push(rockPlinth);

    var castleKeep = new THREE.Mesh(
      new THREE.BoxGeometry(30, 20, 20),
      new THREE.MeshLambertMaterial({ color: 0x554433 })
    );
    castleKeep.position.set(0, 32.5, -40);
    scene.add(castleKeep);
    objects.push(castleKeep);

    // Wallace Monument tower
    var monumentTower = new THREE.Mesh(
      new THREE.BoxGeometry(4, 24, 4),
      new THREE.MeshLambertMaterial({ color: 0x666655 })
    );
    monumentTower.position.set(25, 12, -35);
    scene.add(monumentTower);
    objects.push(monumentTower);

    var monumentTop = new THREE.Mesh(
      new THREE.SphereGeometry(3, 16, 16),
      new THREE.MeshLambertMaterial({ color: 0x666655 })
    );
    monumentTop.position.set(25, 28, -35);
    scene.add(monumentTop);
    objects.push(monumentTop);

    // River Forth dock basin
    var dockBasin = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1, 12),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    dockBasin.position.set(0, 0.5, 10);
    scene.add(dockBasin);
    objects.push(dockBasin);

    // Crane on dock (vertical pole + horizontal arm)
    var cranePole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    cranePole.position.set(-8, 5, 10);
    scene.add(cranePole);
    objects.push(cranePole);

    var craneArm = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.5, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    craneArm.position.set(-8, 10, 10);
    scene.add(craneArm);
    objects.push(craneArm);

    // Stirling Old Bridge (4-arch stone bridge)
    var bridgeBase = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.8, 4),
      new THREE.MeshLambertMaterial({ color: 0x999988 })
    );
    bridgeBase.position.set(-5, 2, 0);
    scene.add(bridgeBase);
    objects.push(bridgeBase);

    var arch1 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.6, 12, 4),
      new THREE.MeshLambertMaterial({ color: 0x999988 })
    );
    arch1.position.set(-10, 3.5, 0);
    arch1.rotation.z = Math.PI / 2;
    scene.add(arch1);
    objects.push(arch1);

    var arch2 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.6, 12, 4),
      new THREE.MeshLambertMaterial({ color: 0x999988 })
    );
    arch2.position.set(-5, 3.5, 0);
    arch2.rotation.z = Math.PI / 2;
    scene.add(arch2);
    objects.push(arch2);

    var arch3 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.6, 12, 4),
      new THREE.MeshLambertMaterial({ color: 0x999988 })
    );
    arch3.position.set(0, 3.5, 0);
    arch3.rotation.z = Math.PI / 2;
    scene.add(arch3);
    objects.push(arch3);

    var arch4 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.6, 12, 4),
      new THREE.MeshLambertMaterial({ color: 0x999988 })
    );
    arch4.position.set(5, 3.5, 0);
    arch4.rotation.z = Math.PI / 2;
    scene.add(arch4);
    objects.push(arch4);

    // River patrol gunboat
    var boatHull = new THREE.Mesh(
      new THREE.BoxGeometry(14, 2.5, 5),
      new THREE.MeshLambertMaterial({ color: 0x667788 })
    );
    boatHull.position.set(15, 1.5, 8);
    boatHull.userData.baseY = 1.5;
    scene.add(boatHull);
    objects.push(boatHull);

    var boatTurret = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 1.5, 16),
      new THREE.MeshLambertMaterial({ color: 0x667788 })
    );
    boatTurret.position.set(15, 3.5, 8);
    scene.add(boatTurret);
    objects.push(boatTurret);

    // Bannockburn battlefield earthworks (mound rows)
    var mound1 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 14),
      new THREE.MeshLambertMaterial({ color: 0x665544 })
    );
    mound1.position.set(-12, 1, 20);
    scene.add(mound1);
    objects.push(mound1);

    var mound2 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 14),
      new THREE.MeshLambertMaterial({ color: 0x665544 })
    );
    mound2.position.set(-8, 1, 20);
    scene.add(mound2);
    objects.push(mound2);

    var mound3 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 14),
      new THREE.MeshLambertMaterial({ color: 0x665544 })
    );
    mound3.position.set(-4, 1, 20);
    scene.add(mound3);
    objects.push(mound3);

    // Military checkpoint on bridge (barrier arm + blockers + guard box)
    var barrierPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 3, 8),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    barrierPost.position.set(-5, 1.5, 2);
    scene.add(barrierPost);
    objects.push(barrierPost);

    var barrierArm = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.3, 0.3),
      new THREE.MeshLambertMaterial({ color: 0xFF6600 })
    );
    barrierArm.position.set(-2, 3, 2);
    barrierArm.userData.baseRotation = 0;
    scene.add(barrierArm);
    objects.push(barrierArm);

    var blocker1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    blocker1.position.set(-8, 0.5, 3);
    scene.add(blocker1);
    objects.push(blocker1);

    var blocker2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    blocker2.position.set(-2, 0.5, 3);
    scene.add(blocker2);
    objects.push(blocker2);

    var guardBox = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 4),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    guardBox.position.set(-12, 1.5, 2);
    scene.add(guardBox);
    objects.push(guardBox);

    // The Thistles shopping centre barricaded
    var shoppingCentre = new THREE.Mesh(
      new THREE.BoxGeometry(20, 6, 14),
      new THREE.MeshLambertMaterial({ color: 0x88AACC })
    );
    shoppingCentre.position.set(12, 3, -15);
    scene.add(shoppingCentre);
    objects.push(shoppingCentre);

    var blastBarrier1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 20),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    blastBarrier1.position.set(20, 1, -15);
    scene.add(blastBarrier1);
    objects.push(blastBarrier1);

    var blastBarrier2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 20),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    blastBarrier2.position.set(4, 1, -15);
    scene.add(blastBarrier2);
    objects.push(blastBarrier2);

    // Castle floodlights
    var floodlight = new THREE.PointLight(0xFFCC66, 1.2);
    floodlight.position.set(0, 35, -40);
    floodlight.userData.baseRotation = 0;
    scene.add(floodlight);
    lights.push(floodlight);

    // River mist ambient
    var ambientLight = new THREE.AmbientLight(0x8899BB, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);
  };

  var update = function(delta) {
    // Bob the river gunboat
    var i;
    for (i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.userData && obj.userData.baseY !== undefined) {
        obj.position.y = obj.userData.baseY + Math.sin(Date.now() * 0.001) * 0.3;
      }
    }

    // Rotate castle searchlight
    for (i = 0; i < lights.length; i++) {
      var light = lights[i];
      if (light instanceof THREE.PointLight && light.color.getHex() === 0xFFCC66) {
        light.position.x = Math.cos(Date.now() * 0.0005) * 8;
        light.position.z = -40 + Math.sin(Date.now() * 0.0005) * 8;
      }
    }
  };

  var reset = function(scene) {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    objects = [];
    lights = [];
  };

  return {
    create: create,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
