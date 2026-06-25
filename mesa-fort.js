window.MesaFort = (function() {
  'use strict';

  var scene;
  var camera;
  var dustDevilParticles = [];
  var eagles = [];
  var windSockRotation = 0;
  var radarSweepAngle = 0;
  var dustDevilTime = 0;

  var init = function(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;

    // Desert floor far below - distant terrain
    var desertFloorGeom = new THREE.BoxGeometry(400, 2, 400);
    var desertFloorMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
    var desertFloor = new THREE.Mesh(desertFloorGeom, desertFloorMat);
    desertFloor.position.y = -180;
    desertFloor.receiveShadow = true;
    scene.add(desertFloor);

    // Mesa cliff faces - sheer red rock walls
    var cliffHeight = 120;
    var mesaRadius = 100;
    var cliffMat = new THREE.MeshPhongMaterial({ color: 0xA0522D });

    // Front cliff face
    var frontCliffGeom = new THREE.BoxGeometry(200, cliffHeight, 20);
    var frontCliff = new THREE.Mesh(frontCliffGeom, cliffMat);
    frontCliff.position.set(0, cliffHeight / 2 - 60, mesaRadius);
    frontCliff.receiveShadow = true;
    frontCliff.castShadow = true;
    scene.add(frontCliff);

    // Back cliff face
    var backCliffGeom = new THREE.BoxGeometry(200, cliffHeight, 20);
    var backCliff = new THREE.Mesh(backCliffGeom, cliffMat);
    backCliff.position.set(0, cliffHeight / 2 - 60, -mesaRadius);
    backCliff.receiveShadow = true;
    backCliff.castShadow = true;
    scene.add(backCliff);

    // Left cliff face
    var leftCliffGeom = new THREE.BoxGeometry(20, cliffHeight, 200);
    var leftCliff = new THREE.Mesh(leftCliffGeom, cliffMat);
    leftCliff.position.set(-mesaRadius, cliffHeight / 2 - 60, 0);
    leftCliff.receiveShadow = true;
    leftCliff.castShadow = true;
    scene.add(leftCliff);

    // Right cliff face
    var rightCliffGeom = new THREE.BoxGeometry(20, cliffHeight, 200);
    var rightCliff = new THREE.Mesh(rightCliffGeom, cliffMat);
    rightCliff.position.set(mesaRadius, cliffHeight / 2 - 60, 0);
    rightCliff.receiveShadow = true;
    rightCliff.castShadow = true;
    scene.add(rightCliff);

    // Mesa top - flat red rock plateau
    var mesaTopGeom = new THREE.BoxGeometry(200, 8, 200);
    var mesaMat = new THREE.MeshPhongMaterial({ color: 0xCD5C5C });
    var mesaTop = new THREE.Mesh(mesaTopGeom, mesaMat);
    mesaTop.position.y = 60;
    mesaTop.receiveShadow = true;
    mesaTop.castShadow = true;
    scene.add(mesaTop);

    // Fortress perimeter walls - north
    var wallGeom = new THREE.BoxGeometry(180, 6, 4);
    var wallMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    var northWall = new THREE.Mesh(wallGeom, wallMat);
    northWall.position.set(0, 70, 95);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);

    // Fortress perimeter walls - south
    var southWall = new THREE.Mesh(wallGeom, wallMat);
    southWall.position.set(0, 70, -95);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);

    // Fortress perimeter walls - east
    var wallGeom2 = new THREE.BoxGeometry(4, 6, 180);
    var eastWall = new THREE.Mesh(wallGeom2, wallMat);
    eastWall.position.set(95, 70, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);

    // Fortress perimeter walls - west
    var westWall = new THREE.Mesh(wallGeom2, wallMat);
    westWall.position.set(-95, 70, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);

    // Watchtower - northeast
    var towerGeom = new THREE.BoxGeometry(12, 14, 12);
    var towerMat = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var neTower = new THREE.Mesh(towerGeom, towerMat);
    neTower.position.set(85, 72, 85);
    neTower.castShadow = true;
    neTower.receiveShadow = true;
    scene.add(neTower);

    // Watchtower - northwest
    var nwTower = new THREE.Mesh(towerGeom, towerMat);
    nwTower.position.set(-85, 72, 85);
    nwTower.castShadow = true;
    nwTower.receiveShadow = true;
    scene.add(nwTower);

    // Watchtower - southeast
    var seTower = new THREE.Mesh(towerGeom, towerMat);
    seTower.position.set(85, 72, -85);
    seTower.castShadow = true;
    seTower.receiveShadow = true;
    scene.add(seTower);

    // Watchtower - southwest
    var swTower = new THREE.Mesh(towerGeom, towerMat);
    swTower.position.set(-85, 72, -85);
    swTower.castShadow = true;
    swTower.receiveShadow = true;
    scene.add(swTower);

    // Winding access road - switchback path up cliff (front face)
    var roadGeom = new THREE.BoxGeometry(20, 1, 60);
    var roadMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

    var roadSegment1 = new THREE.Mesh(roadGeom, roadMat);
    roadSegment1.position.set(0, -30, 60);
    roadSegment1.rotation.z = 0.2;
    roadSegment1.receiveShadow = true;
    scene.add(roadSegment1);

    var roadSegment2 = new THREE.Mesh(roadGeom, roadMat);
    roadSegment2.position.set(0, 10, 40);
    roadSegment2.rotation.z = -0.2;
    roadSegment2.receiveShadow = true;
    scene.add(roadSegment2);

    var roadSegment3 = new THREE.Mesh(roadGeom, roadMat);
    roadSegment3.position.set(0, 50, 70);
    roadSegment3.rotation.z = 0.15;
    roadSegment3.receiveShadow = true;
    scene.add(roadSegment3);

    // Sandbag walls - defensive positions at cliff edges
    var sandbagGeom = new THREE.BoxGeometry(3, 2, 4);
    var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });

    var sandbag1 = new THREE.Mesh(sandbagGeom, sandbagMat);
    sandbag1.position.set(70, 67, 85);
    sandbag1.castShadow = true;
    scene.add(sandbag1);

    var sandbag2 = new THREE.Mesh(sandbagGeom, sandbagMat);
    sandbag2.position.set(-70, 67, 85);
    sandbag2.castShadow = true;
    scene.add(sandbag2);

    var sandbag3 = new THREE.Mesh(sandbagGeom, sandbagMat);
    sandbag3.position.set(70, 67, -85);
    sandbag3.castShadow = true;
    scene.add(sandbag3);

    var sandbag4 = new THREE.Mesh(sandbagGeom, sandbagMat);
    sandbag4.position.set(-70, 67, -85);
    sandbag4.castShadow = true;
    scene.add(sandbag4);

    // Machine gun nests - BoxGeometry bunkers
    var mgNestGeom = new THREE.BoxGeometry(8, 4, 8);
    var mgMat = new THREE.MeshPhongMaterial({ color: 0x2F4F4F });

    var mgNest1 = new THREE.Mesh(mgNestGeom, mgMat);
    mgNest1.position.set(50, 67, 0);
    mgNest1.castShadow = true;
    mgNest1.receiveShadow = true;
    scene.add(mgNest1);

    var mgNest2 = new THREE.Mesh(mgNestGeom, mgMat);
    mgNest2.position.set(-50, 67, 0);
    mgNest2.castShadow = true;
    mgNest2.receiveShadow = true;
    scene.add(mgNest2);

    // Ammunition depot - recessed bunker into mesa
    var ammoDepotGeom = new THREE.BoxGeometry(20, 8, 16);
    var ammoDmat = new THREE.MeshPhongMaterial({ color: 0x4B0082 });
    var ammoDepot = new THREE.Mesh(ammoDepotGeom, ammoDmat);
    ammoDepot.position.set(0, 62, 0);
    ammoDepot.castShadow = true;
    ammoDepot.receiveShadow = true;
    scene.add(ammoDepot);

    // Water cistern - large CylinderGeometry storage tank
    var cisternGeom = new THREE.CylinderGeometry(6, 6, 16, 12);
    var cisternMat = new THREE.MeshPhongMaterial({ color: 0x4682B4 });
    var cistern = new THREE.Mesh(cisternGeom, cisternMat);
    cistern.position.set(60, 62, 50);
    cistern.castShadow = true;
    cistern.receiveShadow = true;
    scene.add(cistern);

    // Helicopter landing pad - H marking
    var heliPadGeom = new THREE.BoxGeometry(40, 0.5, 40);
    var heliMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var heliPad = new THREE.Mesh(heliPadGeom, heliMat);
    heliPad.position.set(-50, 68, -50);
    heliPad.receiveShadow = true;
    scene.add(heliPad);

    // H marking on pad - horizontal line
    var hLineGeom = new THREE.BoxGeometry(25, 0.5, 2);
    var hMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    var hLine1 = new THREE.Mesh(hLineGeom, hMat);
    hLine1.position.set(-50, 68.2, -45);
    scene.add(hLine1);

    var hLine2 = new THREE.Mesh(hLineGeom, hMat);
    hLine2.position.set(-50, 68.2, -55);
    scene.add(hLine2);

    // H marking - vertical line
    var hVLineGeom = new THREE.BoxGeometry(2, 0.5, 10);
    var hVLine = new THREE.Mesh(hVLineGeom, hMat);
    hVLine.position.set(-50, 68.2, -50);
    scene.add(hVLine);

    // Wind sock - CylinderGeometry with cone top
    var windSockBase = new THREE.CylinderGeometry(1, 1, 12, 8);
    var windSockMat = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
    var windSockPole = new THREE.Mesh(windSockBase, windSockMat);
    windSockPole.position.set(-30, 75, -50);
    windSockPole.castShadow = true;
    scene.add(windSockPole);

    var windSockTubeGeom = new THREE.CylinderGeometry(2, 1.5, 8, 8);
    var windSockTube = new THREE.Mesh(windSockTubeGeom, windSockMat);
    windSockTube.position.set(-30, 83, -50);
    windSockTube.castShadow = true;
    scene.add(windSockTube);

    // Communications antenna - CylinderGeometry mast
    var mastGeom = new THREE.CylinderGeometry(0.5, 0.5, 20, 6);
    var mastMat = new THREE.MeshPhongMaterial({ color: 0xC0C0C0 });
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(70, 80, 50);
    mast.castShadow = true;
    scene.add(mast);

    // Satellite dish - ConeGeometry bowl
    var dishGeom = new THREE.ConeGeometry(5, 3, 16);
    var dishMat = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var dish = new THREE.Mesh(dishGeom, dishMat);
    dish.position.set(70, 92, 50);
    dish.rotation.z = 0.4;
    dish.castShadow = true;
    scene.add(dish);

    // Radar dome - partial spheres for rotating sweep
    var radarGeom = new THREE.SphereGeometry(8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    var radarMat = new THREE.MeshPhongMaterial({ color: 0x228B22, emissive: 0x00AA00 });
    var radarDome = new THREE.Mesh(radarGeom, radarMat);
    radarDome.position.set(-60, 68, -60);
    radarDome.castShadow = true;
    radarDome.receiveShadow = true;
    scene.add(radarDome);

    // Radar sweep line - animated
    var radarSweepGeom = new THREE.BoxGeometry(0.2, 0.2, 8);
    var radarSweepMat = new THREE.LineBasicMaterial({ color: 0xFF0000, linewidth: 2 });
    var radarSweepLine = new THREE.Mesh(radarSweepGeom, radarSweepMat);
    radarSweepLine.position.set(-60, 69, -60);
    radarSweepLine.userData.isRadarSweep = true;
    scene.add(radarSweepLine);

    // Initialize dust devil particles
    var dustCount = 40;
    var dustGeom = new THREE.SphereGeometry(0.3, 4, 4);
    var dustMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    for (var i = 0; i < dustCount; i++) {
      var dustParticle = new THREE.Mesh(dustGeom, dustMat);
      var angle = (i / dustCount) * Math.PI * 2;
      var radius = 8;
      dustParticle.position.set(
        Math.cos(angle) * radius,
        -120 + (i / dustCount) * 30,
        Math.sin(angle) * radius
      );
      dustParticle.scale.set(0.6, 0.6, 0.6);
      scene.add(dustParticle);
      dustDevilParticles.push({
        mesh: dustParticle,
        angle: angle,
        baseHeight: -120 + (i / dustCount) * 30,
        radius: radius
      });
    }

    // Initialize eagles - BoxGeometry bird silhouettes
    var eagleCount = 3;
    for (var e = 0; e < eagleCount; e++) {
      var eagleWing = new THREE.BoxGeometry(8, 0.5, 2);
      var eagleMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
      var eagle = new THREE.Mesh(eagleWing, eagleMat);
      var startAngle = (e / eagleCount) * Math.PI * 2;
      var circleRadius = 80;
      eagle.position.set(
        Math.cos(startAngle) * circleRadius,
        -20 + e * 15,
        Math.sin(startAngle) * circleRadius
      );
      eagle.rotation.y = startAngle;
      scene.add(eagle);
      eagles.push({
        mesh: eagle,
        angle: startAngle,
        radius: circleRadius,
        height: -20 + e * 15,
        speed: 0.3 + e * 0.1
      });
    }

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 150, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
  };

  var update = function(delta) {
    // Update dust devil particles - spinning column
    dustDevilTime += delta;
    for (var i = 0; i < dustDevilParticles.length; i++) {
      var particle = dustDevilParticles[i];
      var spinSpeed = 2.0;
      var riseSpeed = 0.5;

      particle.angle += spinSpeed * delta;
      particle.mesh.position.x = Math.cos(particle.angle) * particle.radius + 20;
      particle.mesh.position.z = Math.sin(particle.angle) * particle.radius;

      var heightOffset = Math.sin(dustDevilTime + i * 0.1) * 8;
      particle.mesh.position.y = particle.baseHeight + riseSpeed * dustDevilTime * 5 + heightOffset;

      if (particle.mesh.position.y > -80) {
        particle.mesh.position.y = -150;
        dustDevilTime = 0;
      }

      var opacity = 1.0 - (particle.mesh.position.y - particle.baseHeight) / 60;
      particle.mesh.material.opacity = Math.max(0, Math.min(1, opacity));
      particle.mesh.material.transparent = true;
    }

    // Update eagles - circling patrol
    for (var e = 0; e < eagles.length; e++) {
      var eagle = eagles[e];
      eagle.angle += eagle.speed * delta;

      eagle.mesh.position.x = Math.cos(eagle.angle) * eagle.radius;
      eagle.mesh.position.z = Math.sin(eagle.angle) * eagle.radius;
      eagle.mesh.rotation.y = eagle.angle + Math.PI / 2;

      var bobOffset = Math.sin(eagle.angle * 1.5) * 3;
      eagle.mesh.position.y = eagle.height + bobOffset;
    }

    // Update wind sock - rotation animation
    windSockRotation += delta * 0.5;
    for (var j = 0; j < scene.children.length; j++) {
      var child = scene.children[j];
      if (child.userData && child.userData.isWindSock) {
        child.rotation.z = windSockRotation;
      }
    }

    // Update radar sweep - rotating antenna pattern
    radarSweepAngle += delta * 1.5;
    if (radarSweepAngle > Math.PI * 2) {
      radarSweepAngle = 0;
    }

    for (var k = 0; k < scene.children.length; k++) {
      var sceneChild = scene.children[k];
      if (sceneChild.userData && sceneChild.userData.isRadarSweep) {
        sceneChild.rotation.z = radarSweepAngle;
      }
    }
  };

  var reset = function() {
    dustDevilTime = 0;
    windSockRotation = 0;
    radarSweepAngle = 0;

    for (var i = 0; i < dustDevilParticles.length; i++) {
      var particle = dustDevilParticles[i];
      particle.angle = (i / dustDevilParticles.length) * Math.PI * 2;
      particle.mesh.position.y = particle.baseHeight;
    }

    for (var e = 0; e < eagles.length; e++) {
      var eagle = eagles[e];
      eagle.angle = (e / eagles.length) * Math.PI * 2;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
