window.MountainMonastery = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var time = 0;
  var bell = null;
  var smokeParticles = [];
  var prayerFlags = [];

  var init = function(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    time = 0;
    smokeParticles = [];
    prayerFlags = [];

    var groundMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    var stoneMaterial = new THREE.MeshPhongMaterial({ color: 0xa0a0a0 });
    var woodMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var brickMaterial = new THREE.MeshPhongMaterial({ color: 0xc87137 });

    // Ground terrain
    var groundGeom = new THREE.BoxGeometry(200, 1, 200);
    var ground = new THREE.Mesh(groundGeom, groundMaterial);
    ground.position.set(0, -20, -50);
    scene.add(ground);

    // Cliff wall backdrop - tall mountain face
    var cliffGeom = new THREE.BoxGeometry(150, 180, 20);
    var cliff = new THREE.Mesh(cliffGeom, stoneMaterial);
    cliff.position.set(0, 40, -100);
    scene.add(cliff);

    // Mountain path approach - zigzag path climbing
    var pathSegments = 5;
    for (var i = 0; i < pathSegments; i++) {
      var pathGeom = new THREE.BoxGeometry(25, 2, 40);
      var path = new THREE.Mesh(pathGeom, new THREE.MeshPhongMaterial({ color: 0x9a8578 }));
      var angle = (i % 2 === 0) ? -30 : 30;
      path.rotation.y = angle * Math.PI / 180;
      path.position.set(i * 20 - 40, -10 + i * 15, -80 + i * 12);
      scene.add(path);
    }

    // Stone wall perimeter enclosure
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x8a8a8a });
    var wallThickness = 2;
    var wallHeight = 12;
    var wallLength = 80;

    // Front wall
    var frontWallGeom = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    var frontWall = new THREE.Mesh(frontWallGeom, wallMaterial);
    frontWall.position.set(0, 5, 0);
    scene.add(frontWall);

    // Side walls
    var sideWallGeom = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    var leftWall = new THREE.Mesh(sideWallGeom, wallMaterial);
    leftWall.position.set(-40, 5, -40);
    scene.add(leftWall);
    var rightWall = new THREE.Mesh(sideWallGeom, wallMaterial);
    rightWall.position.set(40, 5, -40);
    scene.add(rightWall);

    // Wooden gate
    var gateGeom = new THREE.BoxGeometry(15, 10, 1);
    var gate = new THREE.Mesh(gateGeom, woodMaterial);
    gate.position.set(0, 5, 0.5);
    scene.add(gate);

    // Main prayer hall - elongated building with arched facade
    var hallGeom = new THREE.BoxGeometry(35, 20, 50);
    var hall = new THREE.Mesh(hallGeom, brickMaterial);
    hall.position.set(0, 10, -20);
    scene.add(hall);

    // Arched facade segments (BoxGeometry arch approximation)
    var archMaterial = new THREE.MeshPhongMaterial({ color: 0xd4a574 });
    for (var j = 0; j < 7; j++) {
      var archGeom = new THREE.BoxGeometry(3, 4, 2);
      var arch = new THREE.Mesh(archGeom, archMaterial);
      arch.position.set(-15 + j * 5, 15 + Math.sin(j / 7 * Math.PI) * 3, -19);
      scene.add(arch);
    }

    // Bell tower - tall cylinder with bell
    var towerGeom = new THREE.CylinderGeometry(8, 8, 35, 8);
    var tower = new THREE.Mesh(towerGeom, stoneMaterial);
    tower.position.set(-25, 15, -25);
    scene.add(tower);

    // Bell - large BoxGeometry bell shape
    var bellGeom = new THREE.BoxGeometry(10, 12, 3);
    bell = new THREE.Mesh(bellGeom, new THREE.MeshPhongMaterial({ color: 0xffd700 }));
    bell.position.set(-25, 30, -25);
    scene.add(bell);

    // Rope - LineSegments from tower to bell
    var ropePoints = [
      new THREE.Vector3(-25, 28, -25),
      new THREE.Vector3(-25, 31, -25)
    ];
    var ropeGeom = new THREE.BufferGeometry().setFromPoints(ropePoints);
    var ropeMat = new THREE.LineBasicMaterial({ color: 0x8b4513 });
    var rope = new THREE.LineSegments(ropeGeom, ropeMat);
    scene.add(rope);

    // Meditation chambers - small BoxGeometry rooms
    for (var k = 0; k < 3; k++) {
      var chamberGeom = new THREE.BoxGeometry(12, 10, 12);
      var chamber = new THREE.Mesh(chamberGeom, new THREE.MeshPhongMaterial({ color: 0xe6d5b8 }));
      chamber.position.set(-30 + k * 25, 5, 20);
      scene.add(chamber);

      // Altar in each chamber - BoxGeometry table
      var altarGeom = new THREE.BoxGeometry(8, 2, 8);
      var altar = new THREE.Mesh(altarGeom, woodMaterial);
      altar.position.set(-30 + k * 25, 6, 20);
      scene.add(altar);

      // Offering bowls - SphereGeometry
      for (var m = 0; m < 3; m++) {
        var bowlGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var bowl = new THREE.Mesh(bowlGeom, new THREE.MeshPhongMaterial({ color: 0xc0a080 }));
        bowl.position.set(-32 + m * 2 + (-30 + k * 25), 8, 18 + (m - 1) * 2);
        scene.add(bowl);
      }
    }

    // Garden courtyard - BoxGeometry garden plots
    for (var n = 0; n < 5; n++) {
      var plotGeom = new THREE.BoxGeometry(8, 0.5, 8);
      var plot = new THREE.Mesh(plotGeom, new THREE.MeshPhongMaterial({ color: 0x228b22 }));
      plot.position.set(-15 + n * 8, 0.2, -50);
      scene.add(plot);

      // Small plant clusters
      var plantGeom = new THREE.ConeGeometry(2, 4, 6);
      var plant = new THREE.Mesh(plantGeom, new THREE.MeshPhongMaterial({ color: 0x2d5016 }));
      plant.position.set(-15 + n * 8, 2.5, -50);
      scene.add(plant);
    }

    // Secret archives - underground library BoxGeometry room
    var archiveGeom = new THREE.BoxGeometry(40, 15, 30);
    var archive = new THREE.Mesh(archiveGeom, new THREE.MeshPhongMaterial({ color: 0x5a4a42 }));
    archive.position.set(20, 5, 10);
    scene.add(archive);

    // Bookshelf rows - BoxGeometry shelves
    for (var p = 0; p < 4; p++) {
      for (var q = 0; q < 3; q++) {
        var shelfGeom = new THREE.BoxGeometry(8, 0.4, 2);
        var shelf = new THREE.Mesh(shelfGeom, woodMaterial);
        shelf.position.set(10 + p * 8, 4 + q * 4, 10);
        scene.add(shelf);
      }
    }

    // Incense burners - CylinderGeometry urns
    for (var r = 0; r < 4; r++) {
      var urnGeom = new THREE.CylinderGeometry(2, 2.5, 5, 6);
      var urn = new THREE.Mesh(urnGeom, new THREE.MeshPhongMaterial({ color: 0xb8860b }));
      urn.position.set(-35 + r * 20, 1, -30);
      scene.add(urn);

      // Create smoke particles
      for (var s = 0; s < 3; s++) {
        var smokeGeom = new THREE.SphereGeometry(0.3, 4, 4);
        var smokeMat = new THREE.MeshPhongMaterial({
          color: 0xcccccc,
          transparent: true,
          opacity: 0.6
        });
        var smoke = new THREE.Mesh(smokeGeom, smokeMat);
        smoke.position.set(-35 + r * 20, 3 + s, -30);
        scene.add(smoke);
        smokeParticles.push({
          mesh: smoke,
          startY: smoke.position.y,
          speed: 0.3 + Math.random() * 0.2
        });
      }
    }

    // Ancient statue - BoxGeometry carved figure in courtyard
    var statueGeom = new THREE.BoxGeometry(3, 12, 2);
    var statue = new THREE.Mesh(statueGeom, new THREE.MeshPhongMaterial({ color: 0x808080 }));
    statue.position.set(0, 6, -70);
    scene.add(statue);

    // Head approximation
    var headGeom = new THREE.SphereGeometry(2, 8, 8);
    var head = new THREE.Mesh(headGeom, new THREE.MeshPhongMaterial({ color: 0x808080 }));
    head.position.set(0, 14, -70);
    scene.add(head);

    // Enemy command post additions
    // Comms equipment - BoxGeometry boxes
    var commsGeom = new THREE.BoxGeometry(6, 8, 6);
    var comms = new THREE.Mesh(commsGeom, new THREE.MeshPhongMaterial({ color: 0x444444 }));
    comms.position.set(25, 5, 0);
    scene.add(comms);

    // Satellite dishes - cone approximations
    var dishGeom = new THREE.ConeGeometry(4, 1, 8);
    var dish = new THREE.Mesh(dishGeom, new THREE.MeshPhongMaterial({ color: 0x888888 }));
    dish.position.set(35, 8, 10);
    dish.rotation.x = Math.PI / 4;
    scene.add(dish);

    // Sandbags - BoxGeometry barriers
    for (var t = 0; t < 6; t++) {
      var bagGeom = new THREE.BoxGeometry(4, 1.5, 2);
      var bag = new THREE.Mesh(bagGeom, new THREE.MeshPhongMaterial({ color: 0x8b7355 }));
      bag.position.set(20 + t * 2.5, 0.8, 5);
      scene.add(bag);
    }

    // Prayer flags - LineSegments between posts
    var flagPosts = [
      { x: -15, y: 25, z: -40 },
      { x: 15, y: 25, z: -40 }
    ];
    for (var u = 0; u < flagPosts.length - 1; u++) {
      var flagPoints = [
        new THREE.Vector3(flagPosts[u].x, flagPosts[u].y, flagPosts[u].z),
        new THREE.Vector3(flagPosts[u + 1].x, flagPosts[u + 1].y, flagPosts[u + 1].z)
      ];
      var flagGeom = new THREE.BufferGeometry().setFromPoints(flagPoints);
      var flagMat = new THREE.LineBasicMaterial({ color: 0xff6b6b });
      var flagLine = new THREE.LineSegments(flagGeom, flagMat);
      scene.add(flagLine);
      prayerFlags.push(flagLine);
    }

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);
  };

  var update = function(delta) {
    time += delta;

    // Bell sway animation
    if (bell) {
      bell.rotation.z = Math.sin(time * 1.5) * 0.1;
    }

    // Incense smoke rise animation
    for (var i = 0; i < smokeParticles.length; i++) {
      var particle = smokeParticles[i];
      particle.mesh.position.y += particle.speed * delta;
      particle.mesh.material.opacity -= 0.05 * delta;
      if (particle.mesh.position.y > particle.startY + 15) {
        particle.mesh.position.y = particle.startY;
        particle.mesh.material.opacity = 0.6;
      }
    }

    // Prayer flag flutter
    for (var j = 0; j < prayerFlags.length; j++) {
      var flag = prayerFlags[j];
      var positions = flag.geometry.attributes.position.array;
      if (positions.length >= 6) {
        var waveAmount = Math.sin(time * 3 + j) * 1;
        positions[4] = positions[3] + waveAmount;
        flag.geometry.attributes.position.needsUpdate = true;
      }
    }
  };

  var reset = function() {
    time = 0;
    for (var i = 0; i < smokeParticles.length; i++) {
      smokeParticles[i].mesh.position.y = smokeParticles[i].startY;
      smokeParticles[i].mesh.material.opacity = 0.6;
    }
    if (bell) {
      bell.rotation.z = 0;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
