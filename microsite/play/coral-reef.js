window.CoralReef = (function() {
  'use strict';

  var scene;
  var camera;
  var fishes = [];
  var kelps = [];
  var bubbles = [];
  var lightRays = [];
  var shark;
  var sharkDirection = 1;
  var time = 0;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    fishes = [];
    kelps = [];
    bubbles = [];
    lightRays = [];
    time = 0;

    // Seafloor - sandy bottom with rocks
    var floorGeometry = new THREE.BoxGeometry(200, 5, 200);
    var floorMaterial = new THREE.MeshPhongMaterial({ color: 0xC2B280 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -50;
    floor.receiveShadow = true;
    scene.add(floor);

    // Rock formations on seafloor
    for (var i = 0; i < 8; i++) {
      var rockGeo = new THREE.BoxGeometry(
        Math.random() * 15 + 8,
        Math.random() * 12 + 6,
        Math.random() * 15 + 8
      );
      var rockMat = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
      var rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(
        (Math.random() - 0.5) * 180,
        -47,
        (Math.random() - 0.5) * 180
      );
      rock.rotation.x = Math.random() * 0.4;
      rock.rotation.z = Math.random() * 0.4;
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }

    // Coral formations - clusters of cones and cylinders
    for (var i = 0; i < 6; i++) {
      var coralX = (Math.random() - 0.5) * 160;
      var coralZ = (Math.random() - 0.5) * 160;

      // Base coral cluster with multiple pieces
      for (var j = 0; j < 5; j++) {
        var coralColor = [0xFF69B4, 0xFF8C00, 0xFFD700, 0xDA70D6][Math.floor(Math.random() * 4)];
        var isCone = Math.random() > 0.5;

        var coralGeo;
        if (isCone) {
          coralGeo = new THREE.ConeGeometry(
            Math.random() * 4 + 2,
            Math.random() * 12 + 8,
            6
          );
        } else {
          coralGeo = new THREE.CylinderGeometry(
            Math.random() * 2 + 1,
            Math.random() * 3 + 1.5,
            Math.random() * 10 + 6,
            5
          );
        }

        var coralMat = new THREE.MeshPhongMaterial({ color: coralColor });
        var coral = new THREE.Mesh(coralGeo, coralMat);
        coral.position.set(
          coralX + (Math.random() - 0.5) * 20,
          -45 + Math.random() * 8,
          coralZ + (Math.random() - 0.5) * 20
        );
        coral.rotation.x = (Math.random() - 0.5) * 0.3;
        coral.rotation.z = Math.random() * Math.PI * 2;
        coral.castShadow = true;
        coral.receiveShadow = true;
        scene.add(coral);
      }
    }

    // Sunken warship hull
    var shipGeo = new THREE.BoxGeometry(60, 25, 15);
    var shipMat = new THREE.MeshPhongMaterial({ color: 0x2F4F4F });
    var ship = new THREE.Mesh(shipGeo, shipMat);
    ship.position.set(-80, -40, 60);
    ship.rotation.z = 0.15;
    ship.castShadow = true;
    ship.receiveShadow = true;
    scene.add(ship);

    // Add coral encrustation on ship
    for (var i = 0; i < 8; i++) {
      var encrustColor = [0xFF69B4, 0xFF8C00][Math.floor(Math.random() * 2)];
      var encrustGeo = new THREE.ConeGeometry(Math.random() * 3 + 1, Math.random() * 5 + 3, 4);
      var encrustMat = new THREE.MeshPhongMaterial({ color: encrustColor });
      var encrust = new THREE.Mesh(encrustGeo, encrustMat);
      encrust.position.set(
        -80 + (Math.random() - 0.5) * 50,
        -40 + (Math.random() - 0.5) * 20,
        60 + (Math.random() - 0.5) * 12
      );
      encrust.castShadow = true;
      scene.add(encrust);
    }

    // Kelp forest - tall cylinder strands
    for (var i = 0; i < 12; i++) {
      var kelpX = (Math.random() - 0.5) * 150;
      var kelpZ = (Math.random() - 0.5) * 150;
      var kelpHeight = Math.random() * 40 + 50;

      var kelpGeo = new THREE.CylinderGeometry(0.8, 1.2, kelpHeight, 4);
      var kelpMat = new THREE.MeshPhongMaterial({ color: 0x2D5016 });
      var kelpMesh = new THREE.Mesh(kelpGeo, kelpMat);
      kelpMesh.position.set(kelpX, -45 + kelpHeight / 2, kelpZ);
      kelpMesh.castShadow = true;
      kelpMesh.receiveShadow = true;
      scene.add(kelpMesh);

      kelps.push({
        mesh: kelpMesh,
        baseX: kelpX,
        baseZ: kelpZ,
        baseRotZ: kelpMesh.rotation.z,
        height: kelpHeight
      });
    }

    // Sea anemones - cylinder stalks with cone tentacles
    for (var i = 0; i < 8; i++) {
      var anemoneX = (Math.random() - 0.5) * 140;
      var anemoneZ = (Math.random() - 0.5) * 140;

      // Stalk
      var stalkGeo = new THREE.CylinderGeometry(1.5, 2, 12, 5);
      var anemoneColor = [0xFF69B4, 0xDA70D6, 0x00CED1][Math.floor(Math.random() * 3)];
      var stalkMat = new THREE.MeshPhongMaterial({ color: anemoneColor });
      var stalk = new THREE.Mesh(stalkGeo, stalkMat);
      stalk.position.set(anemoneX, -44, anemoneZ);
      stalk.castShadow = true;
      scene.add(stalk);

      // Tentacles - cone geometry arranged in circle
      for (var j = 0; j < 8; j++) {
        var angle = (j / 8) * Math.PI * 2;
        var tentacleGeo = new THREE.ConeGeometry(0.8, 10, 4);
        var tentacleMat = new THREE.MeshPhongMaterial({ color: anemoneColor });
        var tentacle = new THREE.Mesh(tentacleGeo, tentacleMat);
        tentacle.position.set(
          anemoneX + Math.cos(angle) * 2.5,
          -35,
          anemoneZ + Math.sin(angle) * 2.5
        );
        tentacle.rotation.z = Math.random() * 0.3;
        tentacle.castShadow = true;
        scene.add(tentacle);
      }
    }

    // Underwater combat station - box structure with sphere domes
    var stationGeo = new THREE.BoxGeometry(40, 20, 30);
    var stationMat = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var station = new THREE.Mesh(stationGeo, stationMat);
    station.position.set(70, -35, -50);
    station.castShadow = true;
    station.receiveShadow = true;
    scene.add(station);

    // Viewing domes - spheres on top of station
    for (var i = 0; i < 3; i++) {
      var domeGeo = new THREE.SphereGeometry(6, 8, 8);
      var domeMat = new THREE.MeshPhongMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.3
      });
      var dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(
        70 + (i - 1) * 18,
        -15,
        -50
      );
      dome.castShadow = true;
      scene.add(dome);
    }

    // Fish schools - groups of small box fish
    for (var schoolIdx = 0; schoolIdx < 4; schoolIdx++) {
      var schoolCenterX = (Math.random() - 0.5) * 140;
      var schoolCenterY = (Math.random() - 0.5) * 50 - 30;
      var schoolCenterZ = (Math.random() - 0.5) * 140;

      for (var i = 0; i < 25; i++) {
        var fishGeo = new THREE.BoxGeometry(1.5, 0.8, 0.4);
        var fishColor = [0xFF6347, 0xFFD700, 0x00BFFF, 0x32CD32][Math.floor(Math.random() * 4)];
        var fishMat = new THREE.MeshPhongMaterial({ color: fishColor });
        var fish = new THREE.Mesh(fishGeo, fishMat);

        fish.position.set(
          schoolCenterX + (Math.random() - 0.5) * 25,
          schoolCenterY + (Math.random() - 0.5) * 15,
          schoolCenterZ + (Math.random() - 0.5) * 25
        );

        fish.rotation.y = Math.random() * Math.PI * 2;
        fish.castShadow = true;
        scene.add(fish);

        fishes.push({
          mesh: fish,
          centerX: schoolCenterX,
          centerY: schoolCenterY,
          centerZ: schoolCenterZ,
          offsetX: fish.position.x - schoolCenterX,
          offsetY: fish.position.y - schoolCenterY,
          offsetZ: fish.position.z - schoolCenterZ,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    // Air bubble streams - small spheres rising from vents
    for (var i = 0; i < 20; i++) {
      var bubbleGeo = new THREE.SphereGeometry(0.4, 4, 4);
      var bubbleMat = new THREE.MeshPhongMaterial({
        color: 0xBFEFFF,
        transparent: true,
        opacity: 0.6
      });
      var bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set(
        (Math.random() - 0.5) * 160,
        -48 + Math.random() * 2,
        (Math.random() - 0.5) * 160
      );
      bubble.castShadow = true;
      scene.add(bubble);

      bubbles.push({
        mesh: bubble,
        startY: bubble.position.y,
        speed: Math.random() * 15 + 10,
        drift: (Math.random() - 0.5) * 8,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Light rays - thin tall boxes filtered sunlight shafts
    for (var i = 0; i < 5; i++) {
      var rayGeo = new THREE.BoxGeometry(8, 200, 3);
      var rayMat = new THREE.MeshPhongMaterial({
        color: 0xAADDFF,
        transparent: true,
        opacity: 0.15
      });
      var ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(
        (Math.random() - 0.5) * 150,
        0,
        (Math.random() - 0.5) * 150
      );
      scene.add(ray);

      lightRays.push({
        mesh: ray,
        baseX: ray.position.x,
        baseZ: ray.position.z,
        amplitude: Math.random() * 2 + 1
      });
    }

    // Shark - box body + cone nose + cylinder fins
    var sharkGroup = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(6, 3, 2.5);
    var bodyMat = new THREE.MeshPhongMaterial({ color: 0x2F4F4F });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    sharkGroup.add(body);

    // Shark nose - cone
    var noseGeo = new THREE.ConeGeometry(1.2, 4, 6);
    var noseMat = new THREE.MeshPhongMaterial({ color: 0x1C1C1C });
    var nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.z = 3;
    nose.rotation.z = Math.PI / 2;
    nose.castShadow = true;
    sharkGroup.add(nose);

    // Shark fins - cylinders
    for (var i = 0; i < 3; i++) {
      var finGeo = new THREE.CylinderGeometry(0.4, 0.8, 2.5, 4);
      var finMat = new THREE.MeshPhongMaterial({ color: 0x1C1C1C });
      var fin = new THREE.Mesh(finGeo, finMat);
      fin.position.set(
        (i - 1) * 2,
        1.5,
        0
      );
      fin.rotation.z = 0.3;
      fin.castShadow = true;
      sharkGroup.add(fin);
    }

    sharkGroup.position.set(0, -25, 80);
    sharkGroup.castShadow = true;
    scene.add(sharkGroup);

    shark = {
      group: sharkGroup,
      baseX: 0,
      baseZ: 80,
      radius: 60,
      speed: 20
    };

    // Sea mine - sphere with cylinder prongs
    var mineGeo = new THREE.SphereGeometry(5, 6, 6);
    var mineMat = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
    var mineSphere = new THREE.Mesh(mineGeo, mineMat);
    mineSphere.position.set(-60, -35, -70);
    mineSphere.castShadow = true;
    scene.add(mineSphere);

    // Add prongs to mine
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var prongGeo = new THREE.CylinderGeometry(0.5, 0.3, 6, 3);
      var prongMat = new THREE.MeshPhongMaterial({ color: 0x654321 });
      var prong = new THREE.Mesh(prongGeo, prongMat);
      prong.position.set(
        -60 + Math.cos(angle) * 5.5,
        -35 + Math.sin(angle) * 2.5,
        -70 + Math.sin(angle * 0.7) * 3
      );
      prong.rotation.z = angle;
      prong.castShadow = true;
      scene.add(prong);
    }
  };

  var update = function(delta) {
    time += delta;

    // Animate fish schools - schooling behavior
    for (var i = 0; i < fishes.length; i++) {
      var f = fishes[i];
      f.phase += delta * 2;

      var schoolMotion = Math.sin(time * 0.5 + f.phase) * 8;
      var verticalMotion = Math.cos(time * 0.3 + f.phase) * 5;

      f.mesh.position.x = f.centerX + f.offsetX + schoolMotion;
      f.mesh.position.y = f.centerY + f.offsetY + verticalMotion;
      f.mesh.position.z = f.centerZ + f.offsetZ + Math.cos(time * 0.4 + f.phase) * 8;

      f.mesh.rotation.y = Math.atan2(
        Math.cos(time * 0.4 + f.phase),
        Math.sin(time * 0.5 + f.phase)
      );
    }

    // Animate kelp sway
    for (var i = 0; i < kelps.length; i++) {
      var k = kelps[i];
      var sway = Math.sin(time + i) * 0.08;
      k.mesh.rotation.z = sway;
    }

    // Animate bubbles rising
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      var elapsed = (time + b.phase) % 6;
      b.mesh.position.y = b.startY + elapsed * b.speed;

      if (b.mesh.position.y > 60) {
        b.mesh.position.y = b.startY;
      }

      b.mesh.position.x += Math.sin(time * 0.5 + b.phase) * b.drift * delta;
    }

    // Animate light rays shimmer
    for (var i = 0; i < lightRays.length; i++) {
      var ray = lightRays[i];
      var shimmer = Math.sin(time * 0.8 + i) * ray.amplitude;
      ray.mesh.position.x = ray.baseX + shimmer;
    }

    // Animate shark patrol - circling
    if (shark) {
      var angle = time * 0.3;
      shark.group.position.x = shark.baseX + Math.cos(angle) * shark.radius;
      shark.group.position.z = shark.baseZ + Math.sin(angle) * shark.radius;
      shark.group.rotation.y = angle + Math.PI / 2;
    }
  };

  var reset = function() {
    time = 0;
    fishes = [];
    kelps = [];
    bubbles = [];
    lightRays = [];
    shark = null;

    // Clear all objects from scene
    var objectsToRemove = [];
    scene.traverse(function(child) {
      if (child !== scene && child.parent === scene) {
        objectsToRemove.push(child);
      }
    });

    for (var i = 0; i < objectsToRemove.length; i++) {
      scene.remove(objectsToRemove[i]);
    }

    // Re-initialize
    init(scene, camera);
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
