window.WarPrison = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lights = [];
  var animatedObjects = [];
  var searchlights = [];
  var fenceSegments = [];
  var hatchState = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    lights = [];
    animatedObjects = [];
    searchlights = [];
    fenceSegments = [];
    hatchState = 0;

    buildground();
    buildperimeter();
    buildfences();
    buildguardtowers();
    buildcellblocks();
    buildcourtyard();
    buildoffice();
    buildtunnel();
    buildbus();
    buildriotstorage();
    buildenvironment();
  }

  function buildground() {
    var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var groundGeom = new THREE.BoxGeometry(200, 0.5, 200);
    var ground = new THREE.Mesh(groundGeom, groundMaterial);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);
    objects.push(ground);
  }

  function buildperimeter() {
    var perMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    var cornerGap = 95;

    var corner1 = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 100), perMat);
    corner1.position.set(-cornerGap, 4, 0);
    scene.add(corner1);
    objects.push(corner1);

    var corner2 = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 100), perMat);
    corner2.position.set(cornerGap, 4, 0);
    scene.add(corner2);
    objects.push(corner2);

    var corner3 = new THREE.Mesh(new THREE.BoxGeometry(100, 8, 2), perMat);
    corner3.position.set(0, 4, -cornerGap);
    scene.add(corner3);
    objects.push(corner3);

    var corner4 = new THREE.Mesh(new THREE.BoxGeometry(100, 8, 2), perMat);
    corner4.position.set(0, 4, cornerGap);
    scene.add(corner4);
    objects.push(corner4);
  }

  function buildfences() {
    var fenceMat = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0x888800 });

    var positions = [
      [[-90, 1.5, 0], [90, 1.5, 0]],
      [[0, 1.5, -90], [0, 1.5, 90]],
      [[-90, 1.5, -50], [90, 1.5, -50]],
      [[-90, 1.5, 50], [90, 1.5, 50]]
    ];

    for (var i = 0; i < positions.length; i++) {
      var start = new THREE.Vector3(positions[i][0][0], positions[i][0][1], positions[i][0][2]);
      var end = new THREE.Vector3(positions[i][1][0], positions[i][1][1], positions[i][1][2]);
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        start.x, start.y, start.z,
        end.x, end.y, end.z
      ]), 3));
      var line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 }));
      scene.add(line);
      fenceSegments.push(line);
      objects.push(line);
    }
  }

  function buildguardtowers() {
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x665533 });
    var platformMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

    var towers = [
      [-70, 0, -70],
      [70, 0, -70],
      [-70, 0, 70],
      [70, 0, 70]
    ];

    for (var i = 0; i < towers.length; i++) {
      var tx = towers[i][0];
      var ty = towers[i][1];
      var tz = towers[i][2];

      var base = new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 12, 8), towerMat);
      base.position.set(tx, ty + 6, tz);
      scene.add(base);
      objects.push(base);

      var platform = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), platformMat);
      platform.position.set(tx, ty + 12.5, tz);
      scene.add(platform);
      objects.push(platform);

      var rail1 = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 0.5), towerMat);
      rail1.position.set(tx, ty + 13.5, tz - 5);
      scene.add(rail1);
      objects.push(rail1);

      var rail2 = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 0.5), towerMat);
      rail2.position.set(tx, ty + 13.5, tz + 5);
      scene.add(rail2);
      objects.push(rail2);

      var rail3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 10), towerMat);
      rail3.position.set(tx - 5, ty + 13.5, tz);
      scene.add(rail3);
      objects.push(rail3);

      var rail4 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 10), towerMat);
      rail4.position.set(tx + 5, ty + 13.5, tz);
      scene.add(rail4);
      objects.push(rail4);

      var spotlight = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3, 16), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xcccccc }));
      spotlight.position.set(tx, ty + 15, tz);
      scene.add(spotlight);
      objects.push(spotlight);

      searchlights.push({
        mesh: spotlight,
        angle: Math.random() * Math.PI * 2,
        tower: [tx, ty + 15, tz]
      });

      var light = new THREE.PointLight(0xffffff, 0.6, 50);
      light.position.set(tx, ty + 15, tz);
      scene.add(light);
      lights.push(light);
    }
  }

  function buildcellblocks() {
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var barMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

    var blockPositions = [
      [-30, 0, -30],
      [30, 0, -30],
      [-30, 0, 30],
      [30, 0, 30]
    ];

    for (var i = 0; i < blockPositions.length; i++) {
      var bx = blockPositions[i][0];
      var by = blockPositions[i][1];
      var bz = blockPositions[i][2];

      var block = new THREE.Mesh(new THREE.BoxGeometry(20, 15, 20), wallMat);
      block.position.set(bx, by + 7.5, bz);
      scene.add(block);
      objects.push(block);

      for (var j = 0; j < 4; j++) {
        for (var k = 0; k < 3; k++) {
          var window1 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.5), barMat);
          window1.position.set(bx - 8 + j * 5, by + 8 + k * 4, bz - 10);
          scene.add(window1);
          objects.push(window1);

          var bar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 8), barMat);
          bar1.position.set(bx - 8 + j * 5, by + 8 + k * 4, bz - 10.5);
          bar1.rotation.z = Math.PI / 2;
          scene.add(bar1);
          objects.push(bar1);
        }
      }

      var roof = new THREE.Mesh(new THREE.BoxGeometry(22, 1, 22), new THREE.MeshLambertMaterial({ color: 0x333333 }));
      roof.position.set(bx, by + 15, bz);
      scene.add(roof);
      objects.push(roof);
    }
  }

  function buildcourtyard() {
    var concrMat = new THREE.MeshLambertMaterial({ color: 0x777777 });

    var groundquad = new THREE.Mesh(new THREE.BoxGeometry(40, 0.2, 40), concrMat);
    groundquad.position.set(0, 0.1, 0);
    scene.add(groundquad);
    objects.push(groundquad);

    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var px = Math.cos(angle) * 15;
      var pz = Math.sin(angle) * 15;

      var soldier = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 1), new THREE.MeshLambertMaterial({ color: 0x333333 }));
      soldier.position.set(px, 1, pz);
      scene.add(soldier);
      objects.push(soldier);

      var weapon = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 8), new THREE.MeshLambertMaterial({ color: 0x222222 }));
      weapon.position.set(px + 1, pz + 1.5, 0.5);
      weapon.rotation.z = Math.PI / 4;
      scene.add(weapon);
      objects.push(weapon);
    }
  }

  function buildoffice() {
    var officeMat = new THREE.MeshLambertMaterial({ color: 0x995533 });
    var glassMat = new THREE.MeshLambertMaterial({ color: 0x99ccff, emissive: 0x3366aa });

    var officeBuilding = new THREE.Mesh(new THREE.BoxGeometry(25, 12, 20), officeMat);
    officeBuilding.position.set(0, 6, -50);
    scene.add(officeBuilding);
    objects.push(officeBuilding);

    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 3; j++) {
        var window1 = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.5), glassMat);
        window1.position.set(-10 + i * 5, 4 + j * 3, -50.5);
        scene.add(window1);
        objects.push(window1);
      }
    }

    var controlRoomLight = new THREE.PointLight(0xffff99, 1.2, 40);
    controlRoomLight.position.set(0, 8, -50);
    scene.add(controlRoomLight);
    lights.push(controlRoomLight);
  }

  function buildtunnel() {
    var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var hatchMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var tunnelSection1 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 30), tunnelMat);
    tunnelSection1.position.set(50, -8, 0);
    scene.add(tunnelSection1);
    objects.push(tunnelSection1);

    var tunnelSection2 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 20), tunnelMat);
    tunnelSection2.position.set(50, -8, -30);
    scene.add(tunnelSection2);
    objects.push(tunnelSection2);

    var hatch = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 5), hatchMat);
    hatch.position.set(50, -4.5, 15);
    scene.add(hatch);
    objects.push(hatch);
    animatedObjects.push({
      mesh: hatch,
      type: 'hatch'
    });

    var ladder1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 15, 0.3), new THREE.MeshLambertMaterial({ color: 0x666666 }));
    ladder1.position.set(48, -6, 15);
    scene.add(ladder1);
    objects.push(ladder1);

    var ladder2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 15, 0.3), new THREE.MeshLambertMaterial({ color: 0x666666 }));
    ladder2.position.set(52, -6, 15);
    scene.add(ladder2);
    objects.push(ladder2);

    for (var i = 0; i < 10; i++) {
      var rung = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.5, 8), new THREE.MeshLambertMaterial({ color: 0x666666 }));
      rung.position.set(50, -12 + i * 1.5, 15);
      rung.rotation.z = Math.PI / 2;
      scene.add(rung);
      objects.push(rung);
    }
  }

  function buildbus() {
    var busMat = new THREE.MeshLambertMaterial({ color: 0xccaa00 });
    var windowMat = new THREE.MeshLambertMaterial({ color: 0x6699cc });

    var busBody = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 18), busMat);
    busBody.position.set(-50, 3, 0);
    busBody.rotation.z = 0.2;
    scene.add(busBody);
    objects.push(busBody);

    var busCab = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 4), busMat);
    busCab.position.set(-50, 3, 10);
    scene.add(busCab);
    objects.push(busCab);

    for (var i = 0; i < 4; i++) {
      var window1 = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.5), windowMat);
      window1.position.set(-50, 4, -5 + i * 4);
      scene.add(window1);
      objects.push(window1);
    }

    for (var j = 0; j < 2; j++) {
      var wheel = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.5, 16), new THREE.MeshLambertMaterial({ color: 0x222222 }));
      wheel.position.set(-50 + j * 8, 2, -7);
      wheel.rotation.z = Math.PI / 2;
      scene.add(wheel);
      objects.push(wheel);

      var wheel2 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.5, 16), new THREE.MeshLambertMaterial({ color: 0x222222 }));
      wheel2.position.set(-50 + j * 8, 2, 7);
      wheel2.rotation.z = Math.PI / 2;
      scene.add(wheel2);
      objects.push(wheel2);
    }
  }

  function buildriotstorage() {
    var storageMat = new THREE.MeshLambertMaterial({ color: 0x446644 });
    var rackMat = new THREE.MeshLambertMaterial({ color: 0x777777 });

    var storageBuilding = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 15), storageMat);
    storageBuilding.position.set(50, 5, -50);
    scene.add(storageBuilding);
    objects.push(storageBuilding);

    for (var i = 0; i < 3; i++) {
      var rack = new THREE.Mesh(new THREE.BoxGeometry(15, 8, 2), rackMat);
      rack.position.set(50, 5 + i * 3, -50);
      scene.add(rack);
      objects.push(rack);

      for (var j = 0; j < 8; j++) {
        var gear = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshLambertMaterial({ color: 0x333333 }));
        gear.position.set(50 - 6 + j * 2, 5 + i * 3, -50);
        scene.add(gear);
        objects.push(gear);
      }
    }

    var helmet = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), new THREE.MeshLambertMaterial({ color: 0x444444 }));
    helmet.position.set(50, 10, -50);
    scene.add(helmet);
    objects.push(helmet);
  }

  function buildenvironment() {
    var postMat = new THREE.MeshLambertMaterial({ color: 0x665533 });

    for (var i = 0; i < 16; i++) {
      var angle = (i / 16) * Math.PI * 2;
      var px = Math.cos(angle) * 80;
      var pz = Math.sin(angle) * 80;

      var post = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 16, 8), postMat);
      post.position.set(px, 8, pz);
      scene.add(post);
      objects.push(post);
    }

    var ammoBall1 = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), new THREE.MeshLambertMaterial({ color: 0x666666 }));
    ammoBall1.position.set(40, 2, 40);
    scene.add(ammoBall1);
    objects.push(ammoBall1);

    var ammoBall2 = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), new THREE.MeshLambertMaterial({ color: 0x666666 }));
    ammoBall2.position.set(-40, 2, -40);
    scene.add(ammoBall2);
    objects.push(ammoBall2);

    var barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.5, 16), new THREE.MeshLambertMaterial({ color: 0x555555 }));
    barrel1.position.set(60, 1.75, 60);
    scene.add(barrel1);
    objects.push(barrel1);

    var barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.5, 16), new THREE.MeshLambertMaterial({ color: 0x555555 }));
    barrel2.position.set(-60, 1.75, -60);
    scene.add(barrel2);
    objects.push(barrel2);

    var coneWarn = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 16), new THREE.MeshLambertMaterial({ color: 0xffaa00 }));
    coneWarn.position.set(0, 1, 60);
    scene.add(coneWarn);
    objects.push(coneWarn);

    var coneWarn2 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 16), new THREE.MeshLambertMaterial({ color: 0xffaa00 }));
    coneWarn2.position.set(0, 1, -60);
    scene.add(coneWarn2);
    objects.push(coneWarn2);

    var ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambLight);
    lights.push(ambLight);

    var directLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directLight.position.set(100, 100, 100);
    scene.add(directLight);
    lights.push(directLight);
  }

  function update(delta) {
    var i = 0;

    for (i = 0; i < searchlights.length; i++) {
      searchlights[i].angle += delta * 0.5;
      var sl = searchlights[i];
      var radius = 15;
      var newX = sl.tower[0] + Math.cos(sl.angle) * radius;
      var newZ = sl.tower[2] + Math.sin(sl.angle) * radius;
      var light = lights[i];
      if (light) {
        light.position.set(newX, sl.tower[1], newZ);
      }
    }

    for (i = 0; i < fenceSegments.length; i++) {
      var spark1 = Math.sin(Date.now() * 0.001 + i) * 0.3;
      var spark2 = Math.cos(Date.now() * 0.0015 + i) * 0.2;
      fenceSegments[i].material.opacity = 0.7 + spark1 * 0.3;
    }

    for (i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      if (obj.type === 'hatch') {
        hatchState += delta * 0.5;
        if (hatchState > 1) {
          hatchState = 0;
        }
        var hatchOpenAngle = hatchState * Math.PI * 0.4;
        obj.mesh.rotation.x = hatchOpenAngle;
      }
    }
  }

  function reset() {
    var i = 0;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }

    for (i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }

    objects = [];
    lights = [];
    animatedObjects = [];
    searchlights = [];
    fenceSegments = [];
    scene = null;
    camera = null;
    hatchState = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
