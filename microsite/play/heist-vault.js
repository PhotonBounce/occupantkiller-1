window.HeistVault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];

    // Circular vault door (main centerpiece)
    var vaultDoorGeom = new THREE.CylinderGeometry(8, 8, 0.5, 32);
    var vaultDoorMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.9,
      roughness: 0.1
    });
    var vaultDoor = new THREE.Mesh(vaultDoorGeom, vaultDoorMat);
    vaultDoor.position.set(0, 0, 0);
    vaultDoor.rotation.x = Math.PI / 2;
    vaultDoor.userData.type = 'vaultDoor';
    vaultDoor.userData.angle = 0;
    scene.add(vaultDoor);
    objects.push(vaultDoor);

    // Locking bolts around vault door (12 bolts)
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var x = Math.cos(angle) * 8.5;
      var z = Math.sin(angle) * 8.5;

      var boltGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
      var boltMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.95,
        roughness: 0.05
      });
      var bolt = new THREE.Mesh(boltGeom, boltMat);
      bolt.position.set(x, 0, z);
      bolt.rotation.z = angle;
      bolt.userData.type = 'bolt';
      bolt.userData.baseAngle = angle;
      scene.add(bolt);
      objects.push(bolt);
    }

    // Safety deposit box walls (metal shelving)
    var boxWallGeom = new THREE.BoxGeometry(20, 6, 1);
    var boxWallMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.7,
      roughness: 0.2
    });
    var boxWall1 = new THREE.Mesh(boxWallGeom, boxWallMat);
    boxWall1.position.set(10, 0, -12);
    boxWall1.userData.type = 'boxWall';
    scene.add(boxWall1);
    objects.push(boxWall1);

    var boxWall2 = new THREE.Mesh(boxWallGeom, boxWallMat);
    boxWall2.position.set(-10, 0, -12);
    boxWall2.userData.type = 'boxWall';
    scene.add(boxWall2);
    objects.push(boxWall2);

    // Gold bullion stack pallets
    for (var g = 0; g < 3; g++) {
      var goldGeom = new THREE.BoxGeometry(3, 2, 2);
      var goldMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.85,
        roughness: 0.15
      });
      var goldStack = new THREE.Mesh(goldGeom, goldMat);
      goldStack.position.set(-8 + g * 6, 2, 8);
      goldStack.userData.type = 'gold';
      goldStack.userData.offset = g * 0.2;
      scene.add(goldStack);
      objects.push(goldStack);
    }

    // Laser trip-wire grid alarm system
    var laserMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });

    // Horizontal laser lines
    for (var lh = 0; lh < 5; lh++) {
      var laserGeomH = new THREE.BufferGeometry();
      var pointsH = [
        new THREE.Vector3(-15, 1 + lh * 1.5, 0),
        new THREE.Vector3(15, 1 + lh * 1.5, 0)
      ];
      laserGeomH.setFromPoints(pointsH);
      var laserH = new THREE.LineSegments(laserGeomH, laserMaterial);
      laserH.userData.type = 'laser';
      laserH.userData.pulseFactor = 0.5 + lh * 0.1;
      scene.add(laserH);
      objects.push(laserH);
    }

    // Vertical laser lines
    for (var lv = 0; lv < 5; lv++) {
      var laserGeomV = new THREE.BufferGeometry();
      var pointsV = [
        new THREE.Vector3(-15 + lv * 7.5, 0, -5),
        new THREE.Vector3(-15 + lv * 7.5, 8, -5)
      ];
      laserGeomV.setFromPoints(pointsV);
      var laserV = new THREE.LineSegments(laserGeomV, laserMaterial);
      laserV.userData.type = 'laser';
      laserV.userData.pulseFactor = 0.3 + lv * 0.15;
      scene.add(laserV);
      objects.push(laserV);
    }

    // Armored cash cart
    var cartBodyGeom = new THREE.BoxGeometry(3, 2.5, 2);
    var cartMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a4a,
      metalness: 0.8,
      roughness: 0.3
    });
    var cartBody = new THREE.Mesh(cartBodyGeom, cartMat);
    cartBody.position.set(12, 1.5, -5);
    cartBody.userData.type = 'cart';
    scene.add(cartBody);
    objects.push(cartBody);

    // Cart wheels (4 wheels)
    for (var w = 0; w < 4; w++) {
      var wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
      var wheelMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        metalness: 0.9,
        roughness: 0.2
      });
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      var xOffset = (w % 2) === 0 ? -1.2 : 1.2;
      var zOffset = w < 2 ? -0.9 : 0.9;
      wheel.position.set(12 + xOffset, 0.6, -5 + zOffset);
      wheel.rotation.z = Math.PI / 2;
      wheel.userData.type = 'wheel';
      wheel.userData.wheelIndex = w;
      scene.add(wheel);
      objects.push(wheel);
    }

    // Destroyed wall with breach charges explosion
    var wallFragGeom = new THREE.BoxGeometry(8, 6, 1);
    var wallFragMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a3a,
      metalness: 0.4,
      roughness: 0.6
    });
    var wallFragment = new THREE.Mesh(wallFragGeom, wallFragMat);
    wallFragment.position.set(-15, 2, 10);
    wallFragment.rotation.z = 0.3;
    wallFragment.userData.type = 'wallFragment';
    scene.add(wallFragment);
    objects.push(wallFragment);

    // Breach charges (small explosive cylinders)
    for (var b = 0; b < 4; b++) {
      var chargeGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
      var chargeMat = new THREE.MeshStandardMaterial({
        color: 0xff6b00,
        metalness: 0.6,
        roughness: 0.4
      });
      var charge = new THREE.Mesh(chargeGeom, chargeMat);
      charge.position.set(-15 + b * 2, 1 + Math.sin(b) * 0.5, 10);
      charge.userData.type = 'charge';
      charge.userData.index = b;
      scene.add(charge);
      objects.push(charge);
    }

    // Guard security station desk
    var deskGeom = new THREE.BoxGeometry(4, 1, 2.5);
    var deskMat = new THREE.MeshStandardMaterial({
      color: 0x654321,
      metalness: 0.3,
      roughness: 0.6
    });
    var desk = new THREE.Mesh(deskGeom, deskMat);
    desk.position.set(0, 0.5, 12);
    desk.userData.type = 'desk';
    scene.add(desk);
    objects.push(desk);

    // Monitor screens on desk (3 screens)
    for (var m = 0; m < 3; m++) {
      var screenGeom = new THREE.BoxGeometry(1.2, 0.8, 0.1);
      var screenMat = new THREE.MeshStandardMaterial({
        color: 0x001a00,
        emissive: 0x00ff00,
        metalness: 0.7,
        roughness: 0.1
      });
      var screen = new THREE.Mesh(screenGeom, screenMat);
      screen.position.set(-1.2 + m * 1.2, 1.8, 12);
      screen.userData.type = 'screen';
      screen.userData.screenIndex = m;
      scene.add(screen);
      objects.push(screen);
    }

    // Money counting machine (on desk)
    var machineGeom = new THREE.BoxGeometry(1.5, 0.8, 1.2);
    var machineMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.75,
      roughness: 0.2
    });
    var machine = new THREE.Mesh(machineGeom, machineMat);
    machine.position.set(1.5, 1.2, 12);
    machine.userData.type = 'machine';
    scene.add(machine);
    objects.push(machine);

    // Surveillance camera mount (corner)
    var cameraMountGeom = new THREE.ConeGeometry(0.5, 1.5, 8);
    var cameraMountMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.85,
      roughness: 0.15
    });
    var cameraMount = new THREE.Mesh(cameraMountGeom, cameraMountMat);
    cameraMount.position.set(18, 8, 15);
    cameraMount.rotation.z = -0.4;
    cameraMount.userData.type = 'cameraMount';
    scene.add(cameraMount);
    objects.push(cameraMount);

    // Camera lens (sphere on mount)
    var cameraLensGeom = new THREE.SphereGeometry(0.3, 8, 8);
    var cameraLensMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.95,
      roughness: 0.05
    });
    var cameraLens = new THREE.Mesh(cameraLensGeom, cameraLensMat);
    cameraLens.position.set(18, 8.5, 15);
    cameraLens.userData.type = 'cameraLens';
    scene.add(cameraLens);
    objects.push(cameraLens);

    // Escape tunnel blasted through floor
    var tunnelGeom = new THREE.CylinderGeometry(4, 4, 2, 16);
    var tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.7
    });
    var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
    tunnel.position.set(0, -3, -20);
    tunnel.userData.type = 'tunnel';
    tunnel.userData.lightIntensity = 0.5;
    scene.add(tunnel);
    objects.push(tunnel);

    // Tunnel opening light effect (using LineSegments for rim)
    var tunnelRimGeom = new THREE.BufferGeometry();
    var rimPoints = [];
    for (var r = 0; r < 16; r++) {
      var rimAngle = (r / 16) * Math.PI * 2;
      rimPoints.push(new THREE.Vector3(
        Math.cos(rimAngle) * 4,
        -2.5,
        Math.sin(rimAngle) * 4 - 20
      ));
    }
    rimPoints.push(rimPoints[0]);
    tunnelRimGeom.setFromPoints(rimPoints);
    var rimMat = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 3 });
    var tunnelRim = new THREE.LineSegments(tunnelRimGeom, rimMat);
    tunnelRim.userData.type = 'tunnelRim';
    tunnelRim.userData.flicker = Math.random();
    scene.add(tunnelRim);
    objects.push(tunnelRim);

    return objects.length;
  }

  function update(delta) {
    if (!scene) return;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      var type = obj.userData.type;

      if (type === 'vaultDoor') {
        var doorSpeed = 0.5;
        obj.userData.angle += delta * doorSpeed;
        obj.rotation.z = Math.sin(obj.userData.angle) * 0.8;
      }

      if (type === 'bolt') {
        var boltWave = Math.sin(obj.userData.baseAngle + Date.now() * 0.001) * 0.15;
        obj.scale.z = 1 + boltWave;
      }

      if (type === 'gold') {
        obj.rotation.y += delta * 0.3;
        obj.position.y = 2 + Math.sin(Date.now() * 0.0005 + obj.userData.offset) * 0.3;
      }

      if (type === 'laser') {
        var laserPulse = Math.sin(Date.now() * 0.004 + obj.userData.pulseFactor) * 0.5 + 0.5;
        obj.material.opacity = laserPulse;
        obj.material.transparent = true;
      }

      if (type === 'wheel') {
        obj.rotation.x += delta * 2;
      }

      if (type === 'wallFragment') {
        obj.rotation.z += delta * 0.1;
        obj.position.y = 2 + Math.sin(Date.now() * 0.0003) * 0.2;
      }

      if (type === 'charge') {
        var chargeGlow = Math.sin(Date.now() * 0.002 + obj.userData.index * 0.5) * 0.3 + 0.7;
        obj.material.emissive.setHex(0xff6b00);
        obj.material.emissiveIntensity = chargeGlow * 0.5;
      }

      if (type === 'screen') {
        var screenFlicker = Math.sin(Date.now() * 0.01 + obj.userData.screenIndex) * 0.2 + 0.8;
        obj.material.emissiveIntensity = screenFlicker;
      }

      if (type === 'machine') {
        obj.rotation.y += delta * 0.8;
      }

      if (type === 'cameraMount') {
        obj.rotation.y += delta * 0.2;
      }

      if (type === 'tunnelRim') {
        var flicker = Math.sin(Date.now() * 0.005 + obj.userData.flicker) * 0.4 + 0.6;
        obj.material.linewidth = 3 * flicker;
      }
    }
  }

  function reset() {
    if (!scene) return;

    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
