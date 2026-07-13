window.CoastGuard = (function() {
  'use strict';

  var scene, camera;
  var beaconGroup;
  var radarDish;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    buildLighthouse();
    buildCutter();
    buildBoatRamp();
    buildRadar();
    buildHelicopterPad();
    buildRescueShed();
    buildLifeRingStations();
    buildFuelDock();
    buildBreakwater();
    buildSignalTower();
  }

  function buildLighthouse() {
    var towerGeo = new THREE.CylinderGeometry(8, 8, 35, 16);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-60, 0, 50);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);

    var coneGeo = new THREE.ConeGeometry(8, 12, 16);
    var coneMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.5 });
    var cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(-60, 23, 50);
    cone.castShadow = true;
    scene.add(cone);

    beaconGroup = new THREE.Group();
    var beaconGeo = new THREE.SphereGeometry(6, 8, 8);
    var beaconMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8
    });
    var beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 5;
    beaconGroup.add(beacon);
    beaconGroup.position.set(-60, 32, 50);
    scene.add(beaconGroup);
  }

  function buildCutter() {
    var hullGeo = new THREE.BoxGeometry(8, 5, 25);
    var hullMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.6 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.set(20, 2.5, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);

    var superGeo = new THREE.BoxGeometry(6, 8, 10);
    var superMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 });
    var super1 = new THREE.Mesh(superGeo, superMat);
    super1.position.set(20, 8, -3);
    super1.castShadow = true;
    scene.add(super1);

    var funnelGeo = new THREE.CylinderGeometry(1.5, 1.8, 7, 8);
    var funnelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    var funnel = new THREE.Mesh(funnelGeo, funnelMat);
    funnel.position.set(18, 11, -4);
    funnel.castShadow = true;
    scene.add(funnel);
  }

  function buildBoatRamp() {
    var rampGeo = new THREE.BoxGeometry(12, 3, 15);
    var rampMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
    var ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(0, 0.5, -30);
    ramp.rotation.z = 0.3;
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    scene.add(ramp);
  }

  function buildRadar() {
    var cabinGeo = new THREE.BoxGeometry(6, 5, 6);
    var cabinMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
    var cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-40, 2.5, -40);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    scene.add(cabin);

    radarDish = new THREE.CylinderGeometry(10, 10, 2, 16);
    var dishMat = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.4 });
    var dish = new THREE.Mesh(radarDish, dishMat);
    dish.position.set(-40, 7, -40);
    dish.castShadow = true;
    scene.add(dish);
  }

  function buildHelicopterPad() {
    var baseGeo = new THREE.BoxGeometry(25, 2, 25);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(45, 8, 20);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);

    for (var i = 0; i < 4; i++) {
      var colGeo = new THREE.CylinderGeometry(1.2, 1.5, 8, 8);
      var colMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });
      var col = new THREE.Mesh(colGeo, colMat);
      var angle = (i / 4) * Math.PI * 2;
      col.position.set(45 + Math.cos(angle) * 10, 4, 20 + Math.sin(angle) * 10);
      col.castShadow = true;
      scene.add(col);
    }
  }

  function buildRescueShed() {
    var shedGeo = new THREE.BoxGeometry(12, 8, 16);
    var shedMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6 });
    var shed = new THREE.Mesh(shedGeo, shedMat);
    shed.position.set(-25, 4, 70);
    shed.castShadow = true;
    shed.receiveShadow = true;
    scene.add(shed);
  }

  function buildLifeRingStations() {
    for (var i = 0; i < 3; i++) {
      var postGeo = new THREE.CylinderGeometry(0.6, 0.8, 6, 8);
      var postMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 });
      var post = new THREE.Mesh(postGeo, postMat);
      var xPos = -70 + i * 20;
      post.position.set(xPos, 3, 30);
      post.castShadow = true;
      scene.add(post);

      var ringGeo = new THREE.CylinderGeometry(3, 3, 0.8, 16);
      var ringMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5 });
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(xPos, 6.5, 30);
      ring.castShadow = true;
      scene.add(ring);
    }
  }

  function buildFuelDock() {
    var dockGeo = new THREE.BoxGeometry(20, 2, 8);
    var dockMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
    var dock = new THREE.Mesh(dockGeo, dockMat);
    dock.position.set(10, 0, 50);
    dock.castShadow = true;
    dock.receiveShadow = true;
    scene.add(dock);

    for (var i = 0; i < 3; i++) {
      var tankGeo = new THREE.CylinderGeometry(3, 3, 8, 16);
      var tankMat = new THREE.MeshStandardMaterial({ color: 0xdd4444, roughness: 0.6 });
      var tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(5 + i * 8, 4, 55);
      tank.castShadow = true;
      scene.add(tank);
    }
  }

  function buildBreakwater() {
    for (var i = 0; i < 8; i++) {
      var rockGeo = new THREE.BoxGeometry(6 + Math.random() * 4, 4 + Math.random() * 3, 5 + Math.random() * 4);
      var rockMat = new THREE.MeshStandardMaterial({ color: 0x555544, roughness: 0.9 });
      var rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(-80 + i * 12, 2, -60 + Math.random() * 10);
      rock.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }
  }

  function buildSignalTower() {
    var baseGeo = new THREE.BoxGeometry(3, 20, 3);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(60, 10, -50);
    base.castShadow = true;
    scene.add(base);

    var antennaMat = new THREE.LineBasicMaterial({ color: 0x0088ff, linewidth: 2 });
    var antennaGeo = new THREE.BufferGeometry();
    var positions = new Float32Array([
      60, 20, -50,
      70, 25, -45,
      60, 25, -50,
      50, 25, -45,
      60, 20, -50,
      65, 32, -55
    ]);
    antennaGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var antenna = new THREE.LineSegments(antennaGeo, antennaMat);
    scene.add(antenna);
  }

  function update(delta) {
    if (beaconGroup) {
      beaconGroup.rotation.y += delta * 3;
    }
    if (radarDish) {
      radarDish.rotation.y += delta * 1.5;
    }
  }

  function reset() {
    beaconGroup.rotation.y = 0;
    if (radarDish) {
      radarDish.rotation.y = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
