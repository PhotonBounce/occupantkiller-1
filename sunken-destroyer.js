window.SunkenDestroyer = (function() {
  'use strict';

  var sceneObjects = [];
  var animations = [];

  function addObject(mesh, scene) {
    sceneObjects.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function createHullSection(x, y, z, scene) {
    var geometry = new THREE.BoxGeometry(40, 8, 15);
    var material = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, emissive: 0x1a1a1a });
    var hull = new THREE.Mesh(geometry, material);
    hull.position.set(x, y, z);
    hull.rotation.z = -0.15;
    hull.castShadow = true;
    hull.receiveShadow = true;
    addObject(hull, scene);
    return hull;
  }

  function createGunTurret(x, y, z, scene) {
    var turretGeometry = new THREE.CylinderGeometry(3, 4, 5, 16);
    var turretMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, emissive: 0x0a0a0a });
    var turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.set(x, y, z);
    turret.castShadow = true;
    turret.receiveShadow = true;

    var barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
    var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(0, 1.5, 0);
    barrel.rotation.x = 0.3;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    turret.add(barrel);

    addObject(turret, scene);
    return turret;
  }

  function createRadarMast(x, y, z, scene) {
    var mastGeometry = new THREE.CylinderGeometry(0.5, 0.5, 25, 8);
    var mastMaterial = new THREE.MeshPhongMaterial({ color: 0x1f1f1f });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(x, y, z);
    mast.castShadow = true;
    mast.receiveShadow = true;

    var radarGeometry = new THREE.CylinderGeometry(3, 3, 1, 16);
    var radarMaterial = new THREE.MeshPhongMaterial({ color: 0x2a4a4a, emissive: 0x1a3a3a });
    var radar = new THREE.Mesh(radarGeometry, radarMaterial);
    radar.position.set(0, 10, 0);
    radar.castShadow = true;
    radar.receiveShadow = true;
    mast.add(radar);

    addObject(mast, scene);
    return mast;
  }

  function createTorpedoTube(x, y, z, scene) {
    var tubeGeometry = new THREE.CylinderGeometry(1.2, 1.2, 8, 12);
    var tubeMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, metalness: 0.6 });
    var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.position.set(x, y, z);
    tube.rotation.z = 0.1;
    tube.castShadow = true;
    tube.receiveShadow = true;

    var capGeometry = new THREE.SphereGeometry(1.3, 8, 8);
    var capMaterial = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
    var cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(0, 0, 4.5);
    cap.scale.set(1, 1, 0.6);
    cap.castShadow = true;
    cap.receiveShadow = true;
    tube.add(cap);

    addObject(tube, scene);
    return tube;
  }

  function createDepthCharge(x, y, z, scene) {
    var chargeGeometry = new THREE.SphereGeometry(1.5, 12, 12);
    var chargeMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, emissive: 0x0a0a0a });
    var charge = new THREE.Mesh(chargeGeometry, chargeMaterial);
    charge.position.set(x, y, z);
    charge.castShadow = true;
    charge.receiveShadow = true;

    var ringGeometry = new THREE.TorusGeometry(2, 0.3, 8, 16);
    var ringMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(0, 0, 0);
    ring.rotation.y = 0.5;
    ring.castShadow = true;
    ring.receiveShadow = true;
    charge.add(ring);

    addObject(charge, scene);
    return charge;
  }

  function createSuperstructure(x, y, z, scene) {
    var superGeometry = new THREE.BoxGeometry(8, 12, 6);
    var superMaterial = new THREE.MeshPhongMaterial({ color: 0x222222, emissive: 0x0a0a0a });
    var super_structure = new THREE.Mesh(superGeometry, superMaterial);
    super_structure.position.set(x, y, z);
    super_structure.rotation.z = -0.2;
    super_structure.rotation.x = 0.1;
    super_structure.castShadow = true;
    super_structure.receiveShadow = true;

    var brokenPartGeometry = new THREE.BoxGeometry(4, 3, 5);
    var brokenPartMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var brokenPart = new THREE.Mesh(brokenPartGeometry, brokenPartMaterial);
    brokenPart.position.set(2, -4, 0);
    brokenPart.rotation.z = 0.3;
    brokenPart.castShadow = true;
    brokenPart.receiveShadow = true;
    super_structure.add(brokenPart);

    addObject(super_structure, scene);
    return super_structure;
  }

  function createAnchorChain(x, y, z, scene) {
    var chainPoints = [];
    var chainSegments = 15;
    for (var i = 0; i <= chainSegments; i++) {
      var t = i / chainSegments;
      chainPoints.push(new THREE.Vector3(
        x,
        y - (i * 2),
        z + Math.sin(t * Math.PI) * 3
      ));
    }

    var chainGeometry = new THREE.BufferGeometry().setFromPoints(chainPoints);
    var chainMaterial = new THREE.LineBasicMaterial({ color: 0x3a3a3a, linewidth: 2 });
    var chainLine = new THREE.Line(chainGeometry, chainMaterial);
    addObject(chainLine, scene);

    var linkGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 6);
    var linkMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    for (var j = 0; j < 8; j++) {
      var link = new THREE.Mesh(linkGeometry, linkMaterial);
      link.position.copy(chainPoints[Math.floor((j / 8) * chainSegments)]);
      link.rotation.z = Math.random() * Math.PI;
      link.castShadow = true;
      link.receiveShadow = true;
      addObject(link, scene);
    }

    return chainLine;
  }

  function createKelpStrands(x, y, z, scene) {
    for (var k = 0; k < 5; k++) {
      var kelpPoints = [];
      var kelpSegments = 12;
      var offsetX = x + (Math.random() - 0.5) * 8;
      var offsetZ = z + (Math.random() - 0.5) * 8;

      for (var i = 0; i <= kelpSegments; i++) {
        var t = i / kelpSegments;
        kelpPoints.push(new THREE.Vector3(
          offsetX + Math.sin(t * Math.PI * 2) * 1.5,
          y - (i * 1.8),
          offsetZ + Math.cos(t * Math.PI * 2) * 1.5
        ));
      }

      var kelpGeometry = new THREE.BufferGeometry().setFromPoints(kelpPoints);
      var kelpMaterial = new THREE.LineBasicMaterial({ color: 0x2a5a2a, linewidth: 1.5 });
      var kelpLine = new THREE.Line(kelpGeometry, kelpMaterial);
      addObject(kelpLine, scene);

      animations.push({
        type: 'kelp',
        object: kelpLine,
        originalPoints: kelpPoints.slice(),
        time: Math.random() * Math.PI * 2
      });
    }
  }

  function createBioluminescentFish(x, y, z, scene) {
    for (var f = 0; f < 6; f++) {
      var fishBodyGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      var fishMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        emissive: 0x003333,
        emissiveIntensity: 0.6
      });
      var fishBody = new THREE.Mesh(fishBodyGeometry, fishMaterial);
      fishBody.position.set(
        x + (Math.random() - 0.5) * 15,
        y + (Math.random() - 0.5) * 10,
        z + (Math.random() - 0.5) * 15
      );
      fishBody.scale.set(1.5, 0.8, 0.8);
      fishBody.castShadow = true;
      fishBody.receiveShadow = true;

      var tailGeometry = new THREE.ConeGeometry(0.4, 1.2, 8);
      var tailMaterial = new THREE.MeshPhongMaterial({ color: 0x0a2a2a, emissive: 0x002a2a });
      var tail = new THREE.Mesh(tailGeometry, tailMaterial);
      tail.position.set(1, 0, 0);
      tail.rotation.z = Math.PI / 2;
      tail.castShadow = true;
      tail.receiveShadow = true;
      fishBody.add(tail);

      var eyeGeometry = new THREE.SphereGeometry(0.2, 6, 6);
      var eyeMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff99,
        emissive: 0x00ff99,
        emissiveIntensity: 0.8
      });
      var eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye.position.set(-0.4, 0.2, 0.5);
      fishBody.add(eye);

      addObject(fishBody, scene);

      animations.push({
        type: 'fish',
        object: fishBody,
        targetX: fishBody.position.x,
        targetY: fishBody.position.y,
        targetZ: fishBody.position.z,
        speed: 0.01 + Math.random() * 0.02,
        time: Math.random() * Math.PI * 2
      });
    }
  }

  function createEmergencyLighting(x, y, z, scene) {
    var lightGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    var lightMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a, emissive: 0x1a1a1a });

    for (var l = 0; l < 4; l++) {
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(
        x + (l - 1.5) * 6,
        y,
        z
      );
      light.castShadow = true;
      light.receiveShadow = true;

      var bulbGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      var bulbMaterial = new THREE.MeshPhongMaterial({
        color: 0x6a6a2a,
        emissive: 0x6a6a1a,
        emissiveIntensity: 0.7
      });
      var bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
      bulb.position.set(0, 1.2, 0);
      light.add(bulb);

      addObject(light, scene);

      animations.push({
        type: 'light',
        object: bulb,
        material: bulbMaterial,
        baseEmissive: 0x6a6a1a,
        baseIntensity: 0.7,
        time: Math.random() * Math.PI * 2
      });
    }
  }

  function createBubbles(x, y, z, scene) {
    for (var b = 0; b < 8; b++) {
      var bubbleGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 6, 6);
      var bubbleMaterial = new THREE.MeshPhongMaterial({
        color: 0x3a4a6a,
        transparent: true,
        opacity: 0.4,
        emissive: 0x1a2a4a,
        emissiveIntensity: 0.3
      });
      var bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      bubble.position.set(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 10,
        z + (Math.random() - 0.5) * 20
      );
      bubble.castShadow = true;
      bubble.receiveShadow = true;

      addObject(bubble, scene);

      animations.push({
        type: 'bubble',
        object: bubble,
        startY: bubble.position.y,
        speed: 0.02 + Math.random() * 0.03,
        wobble: Math.random() * 0.1,
        wobbleAmount: 0
      });
    }
  }

  function createAirDucts(x, y, z, scene) {
    var ductGeometry = new THREE.CylinderGeometry(1, 1, 6, 8);
    var ductMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, emissive: 0x0a0a0a });

    for (var d = 0; d < 3; d++) {
      var duct = new THREE.Mesh(ductGeometry, ductMaterial);
      duct.position.set(x + d * 8, y, z);
      duct.rotation.z = 0.3;
      duct.castShadow = true;
      duct.receiveShadow = true;
      addObject(duct, scene);
    }
  }

  function init(scene, camera) {
    sceneObjects = [];
    animations = [];

    createHullSection(0, -8, 0, scene);
    createHullSection(0, -16, 8, scene);
    createHullSection(0, -22, -8, scene);

    createGunTurret(-12, -5, 0, scene);
    createGunTurret(12, -5, 0, scene);
    createGunTurret(0, -8, -10, scene);

    createRadarMast(-8, 5, -10, scene);
    createRadarMast(8, 5, 10, scene);

    createTorpedoTube(-15, -10, 0, scene);
    createTorpedoTube(15, -10, 0, scene);
    createTorpedoTube(-15, -10, -5, scene);
    createTorpedoTube(15, -10, 5, scene);

    createDepthCharge(-10, -12, 5, scene);
    createDepthCharge(10, -12, -5, scene);
    createDepthCharge(0, -14, 8, scene);

    createSuperstructure(-5, 0, -8, scene);
    createSuperstructure(5, 2, 8, scene);

    createAnchorChain(-20, 0, -15, scene);

    createKelpStrands(0, -5, 0, scene);

    createBioluminescentFish(0, -10, 0, scene);

    createEmergencyLighting(-10, -6, -5, scene);
    createEmergencyLighting(10, -8, 5, scene);

    createBubbles(0, -5, 0, scene);

    createAirDucts(0, -10, 5, scene);
  }

  function update(delta) {
    for (var i = 0; i < animations.length; i++) {
      var anim = animations[i];

      if (anim.type === 'kelp') {
        anim.time += delta * 0.5;
        var geometry = anim.object.geometry;
        var positions = geometry.attributes.position.array;

        for (var j = 0; j < anim.originalPoints.length; j++) {
          var point = anim.originalPoints[j];
          positions[j * 3] = point.x + Math.sin(anim.time + j * 0.3) * 0.5;
          positions[j * 3 + 1] = point.y;
          positions[j * 3 + 2] = point.z + Math.cos(anim.time + j * 0.3) * 0.5;
        }
        geometry.attributes.position.needsUpdate = true;
      }

      if (anim.type === 'fish') {
        anim.time += delta * anim.speed;

        anim.targetX += (Math.random() - 0.5) * 0.1;
        anim.targetY += (Math.random() - 0.5) * 0.08;
        anim.targetZ += (Math.random() - 0.5) * 0.1;

        anim.object.position.x += (anim.targetX - anim.object.position.x) * 0.02;
        anim.object.position.y += (anim.targetY - anim.object.position.y) * 0.02;
        anim.object.position.z += (anim.targetZ - anim.object.position.z) * 0.02;

        anim.object.rotation.y += delta * 0.5;
        anim.object.rotation.z = Math.sin(anim.time) * 0.2;
      }

      if (anim.type === 'light') {
        anim.time += delta * 2;
        var flicker = Math.sin(anim.time) * 0.5 + 0.5;
        var randomFlicker = Math.random() < 0.1 ? Math.random() * 0.3 : 0;
        anim.material.emissiveIntensity = (anim.baseIntensity * flicker) + randomFlicker;
      }

      if (anim.type === 'bubble') {
        anim.object.position.y += anim.speed;
        anim.wobbleAmount += anim.wobble;
        anim.object.position.x += Math.sin(anim.wobbleAmount) * 0.05;

        if (anim.object.position.y > anim.startY + 30) {
          anim.object.position.y = anim.startY;
        }
      }
    }
  }

  function reset() {
    for (var i = sceneObjects.length - 1; i >= 0; i--) {
      var obj = sceneObjects[i];
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
    }
    sceneObjects = [];
    animations = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
