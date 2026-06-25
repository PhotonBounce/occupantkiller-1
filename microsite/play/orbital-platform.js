window.OrbitalPlatform = (function() {
  'use strict';

  var scene, camera;
  var platformGroup, solarPanelGroup, debrisGroup, starfieldGroup;
  var railgunBarrel, earthSphere, thrusterArray;
  var totalElapsedTime = 0;

  var init = function(scene_, camera_) {
    scene = scene_;
    camera = camera_;

    platformGroup = new THREE.Group();
    solarPanelGroup = new THREE.Group();
    debrisGroup = new THREE.Group();
    starfieldGroup = new THREE.Group();

    scene.add(platformGroup);
    scene.add(solarPanelGroup);
    scene.add(debrisGroup);
    scene.add(starfieldGroup);

    // Main platform hub - hexagonal core structure
    var hubGeometry = new THREE.BoxGeometry(40, 8, 40);
    var hubMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.8, roughness: 0.2 });
    var hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.set(0, 0, 0);
    platformGroup.add(hub);

    // Docking arms extending outward
    var armCount = 6;
    var armAngleStep = Math.PI * 2 / armCount;
    for (var i = 0; i < armCount; i++) {
      var angle = i * armAngleStep;
      var armX = Math.cos(angle) * 60;
      var armZ = Math.sin(angle) * 60;

      var armGeometry = new THREE.BoxGeometry(12, 4, 30);
      var armMaterial = new THREE.MeshStandardMaterial({ color: 0x16213e, metalness: 0.7, roughness: 0.3 });
      var arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(armX * 0.5, 0, armZ * 0.5);
      arm.rotation.z = angle;
      platformGroup.add(arm);

      // Docking port at arm end
      var dockRingGeometry = new THREE.CylinderGeometry(8, 8, 3, 32);
      var dockMaterial = new THREE.MeshStandardMaterial({ color: 0x0f3460, metalness: 0.9, roughness: 0.1 });
      var dockRing = new THREE.Mesh(dockRingGeometry, dockMaterial);
      dockRing.position.set(armX, 0, armZ);
      dockRing.rotation.x = Math.PI / 2;
      platformGroup.add(dockRing);

      // Airlock door
      var airlockGeometry = new THREE.BoxGeometry(6, 6, 1);
      var airlockMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b, metalness: 0.6, roughness: 0.4 });
      var airlock = new THREE.Mesh(airlockGeometry, airlockMaterial);
      airlock.position.set(armX, 0, armZ + 6);
      platformGroup.add(airlock);
    }

    // Solar panel arrays - dark blue metallic
    var panelCount = 4;
    for (var p = 0; p < panelCount; p++) {
      var panelAngle = (p / panelCount) * Math.PI * 2;
      var panelX = Math.cos(panelAngle) * 80;
      var panelZ = Math.sin(panelAngle) * 80;

      var panelGeometry = new THREE.BoxGeometry(50, 1, 80);
      var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x001a4d, metalness: 0.85, roughness: 0.15 });
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(panelX, 25, panelZ);
      panel.rotation.y = panelAngle;
      panel.userData.baseRotationY = panelAngle;
      solarPanelGroup.add(panel);

      // Panel mounting structure
      var mountGeometry = new THREE.BoxGeometry(8, 20, 8);
      var mountMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, metalness: 0.8, roughness: 0.3 });
      var mount = new THREE.Mesh(mountGeometry, mountMaterial);
      mount.position.set(panelX, 8, panelZ);
      platformGroup.add(mount);
    }

    // Railgun installation
    var turretGeometry = new THREE.BoxGeometry(20, 15, 20);
    var turretMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a4e, metalness: 0.8, roughness: 0.3 });
    var turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.set(45, 15, -35);
    platformGroup.add(turret);

    // Railgun barrel
    var barrelGeometry = new THREE.CylinderGeometry(2, 2, 60, 32);
    var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.95, roughness: 0.05 });
    railgunBarrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    railgunBarrel.position.set(45, 20, -35);
    railgunBarrel.rotation.z = Math.PI / 6;
    platformGroup.add(railgunBarrel);

    // Targeting systems on turret
    var targetGeometry = new THREE.SphereGeometry(3, 16, 16);
    var targetMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 0.9, roughness: 0.1, emissive: 0x00aa00 });
    var target = new THREE.Mesh(targetGeometry, targetMaterial);
    target.position.set(60, 25, -35);
    platformGroup.add(target);

    // Satellite dishes - ConeGeometry bowls
    var dishCount = 3;
    for (var d = 0; d < dishCount; d++) {
      var dishAngle = (d / dishCount) * Math.PI * 2;
      var dishX = Math.cos(dishAngle) * 50;
      var dishZ = Math.sin(dishAngle) * 50;

      var mountGeometry = new THREE.CylinderGeometry(3, 3, 18, 16);
      var mountMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, metalness: 0.8, roughness: 0.3 });
      var mount = new THREE.Mesh(mountGeometry, mountMaterial);
      mount.position.set(dishX, 20, dishZ);
      platformGroup.add(mount);

      var dishGeometry = new THREE.ConeGeometry(12, 8, 32);
      var dishMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.1 });
      var dish = new THREE.Mesh(dishGeometry, dishMaterial);
      dish.position.set(dishX, 32, dishZ);
      platformGroup.add(dish);
    }

    // Thruster arrays - CylinderGeometry nozzles with blue glow
    thrusterArray = new THREE.Group();
    var thrusterCount = 8;
    for (var t = 0; t < thrusterCount; t++) {
      var thrustAngle = (t / thrusterCount) * Math.PI * 2;
      var thrustX = Math.cos(thrustAngle) * 45;
      var thrustZ = Math.sin(thrustAngle) * 45;

      var nozzleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 16);
      var nozzleMaterial = new THREE.MeshStandardMaterial({ color: 0x0a1a3a, metalness: 0.8, roughness: 0.3 });
      var nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
      nozzle.position.set(thrustX, -15, thrustZ);
      nozzle.rotation.x = Math.PI / 2;
      thrusterArray.add(nozzle);

      // Glow effect behind nozzle
      var glowGeometry = new THREE.CylinderGeometry(2, 2, 3, 16);
      var glowMaterial = new THREE.MeshStandardMaterial({ color: 0x0088ff, metalness: 0.5, roughness: 0.5, emissive: 0x0066ff });
      var glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(thrustX, -20, thrustZ);
      thrusterArray.add(glow);
    }
    platformGroup.add(thrusterArray);

    // Interior access hatches with seal rings
    var hatchCount = 4;
    for (var h = 0; h < hatchCount; h++) {
      var hatchX = (h % 2) * 30 - 15;
      var hatchZ = Math.floor(h / 2) * 30 - 15;

      var hatchGeometry = new THREE.BoxGeometry(8, 8, 0.5);
      var hatchMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a5e, metalness: 0.7, roughness: 0.4 });
      var hatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
      hatch.position.set(hatchX, 4, hatchZ);
      platformGroup.add(hatch);

      // Seal ring using LineSegments
      var sealPoints = [];
      var ringRadius = 5;
      var ringSegments = 16;
      for (var s = 0; s < ringSegments; s++) {
        var sealAngle = (s / ringSegments) * Math.PI * 2;
        var sx = hatchX + Math.cos(sealAngle) * ringRadius;
        var sz = hatchZ + Math.sin(sealAngle) * ringRadius;
        sealPoints.push(new THREE.Vector3(sx, 4.5, sz));
      }
      sealPoints.push(sealPoints[0]);

      var sealGeometry = new THREE.BufferGeometry().setFromPoints(sealPoints);
      var sealMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88 });
      var sealRing = new THREE.LineSegments(sealGeometry, sealMaterial);
      platformGroup.add(sealRing);
    }

    // Microgravity floating equipment boxes
    var floatBoxCount = 12;
    for (var f = 0; f < floatBoxCount; f++) {
      var floatX = (Math.random() - 0.5) * 150;
      var floatY = (Math.random() - 0.5) * 100;
      var floatZ = (Math.random() - 0.5) * 150;

      var floatGeometry = new THREE.BoxGeometry(4, 4, 4);
      var floatMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a6e, metalness: 0.6, roughness: 0.5 });
      var floatBox = new THREE.Mesh(floatGeometry, floatMaterial);
      floatBox.position.set(floatX, floatY, floatZ);
      floatBox.rotation.x = Math.random() * Math.PI * 2;
      floatBox.rotation.y = Math.random() * Math.PI * 2;
      floatBox.userData.rotationVel = {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 0.5
      };
      debrisGroup.add(floatBox);
    }

    // Space debris - floating chunks
    var debrisCount = 20;
    for (var db = 0; db < debrisCount; db++) {
      var debrisType = Math.floor(Math.random() * 2);
      var debrisGeometry;

      if (debrisType === 0) {
        debrisGeometry = new THREE.BoxGeometry(
          Math.random() * 5 + 2,
          Math.random() * 5 + 2,
          Math.random() * 5 + 2
        );
      } else {
        debrisGeometry = new THREE.SphereGeometry(Math.random() * 3 + 1.5, 8, 8);
      }

      var debrisMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.3, 0.5),
        metalness: 0.7,
        roughness: 0.4
      });
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);

      debris.position.set(
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 250,
        (Math.random() - 0.5) * 300
      );
      debris.rotation.x = Math.random() * Math.PI * 2;
      debris.rotation.y = Math.random() * Math.PI * 2;

      debris.userData.velocity = {
        x: (Math.random() - 0.5) * 15,
        y: (Math.random() - 0.5) * 15,
        z: (Math.random() - 0.5) * 15
      };
      debris.userData.rotationVel = {
        x: (Math.random() - 0.5) * 1,
        y: (Math.random() - 0.5) * 1,
        z: (Math.random() - 0.5) * 1
      };

      debrisGroup.add(debris);
    }

    // Starfield - tiny white spheres in background
    var starCount = 300;
    for (var st = 0; st < starCount; st++) {
      var starGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var starMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: 0, emissive: 0xffffff });
      var star = new THREE.Mesh(starGeometry, starMaterial);

      var starRadius = 800;
      var phi = Math.acos(2 * Math.random() - 1);
      var theta = Math.random() * Math.PI * 2;

      star.position.set(
        starRadius * Math.sin(phi) * Math.cos(theta),
        starRadius * Math.sin(phi) * Math.sin(theta),
        starRadius * Math.cos(phi)
      );

      starfieldGroup.add(star);
    }

    // Earth below - massive SphereGeometry
    var earthGeometry = new THREE.SphereGeometry(120, 64, 64);
    var earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a4d8f,
      metalness: 0.1,
      roughness: 0.8
    });
    earthSphere = new THREE.Mesh(earthGeometry, earthMaterial);
    earthSphere.position.set(0, -400, 0);
    scene.add(earthSphere);

    // Add cloud-like texture detail to Earth using white hemispheres
    var cloudCount = 50;
    for (var c = 0; c < cloudCount; c++) {
      var cloudGeometry = new THREE.SphereGeometry(Math.random() * 15 + 5, 8, 8);
      var cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.9,
        transparent: true,
        opacity: 0.4
      });
      var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

      var cloudPhi = Math.acos(2 * Math.random() - 1);
      var cloudTheta = Math.random() * Math.PI * 2;
      var cloudDist = 121;

      cloud.position.set(
        -400 + cloudDist * Math.sin(cloudPhi) * Math.cos(cloudTheta),
        -400 + cloudDist * Math.cos(cloudPhi),
        cloudDist * Math.sin(cloudPhi) * Math.sin(cloudTheta)
      );

      earthSphere.add(cloud);
    }
  };

  var update = function(delta) {
    totalElapsedTime += delta;

    // Animate solar panels rotating slowly
    var panelChildren = solarPanelGroup.children;
    for (var p = 0; p < panelChildren.length; p++) {
      var panel = panelChildren[p];
      if (panel.userData.baseRotationY !== undefined) {
        panel.rotation.y = panel.userData.baseRotationY + Math.sin(totalElapsedTime * 0.3) * 0.15;
      }
    }

    // Animate railgun barrel rotation for scanning
    railgunBarrel.rotation.z = Math.PI / 6 + Math.sin(totalElapsedTime * 0.4) * 0.3;

    // Drift floating equipment boxes
    var floatChildren = debrisGroup.children;
    for (var f = 0; f < floatChildren.length; f++) {
      var floatBox = floatChildren[f];
      if (floatBox.userData.rotationVel) {
        floatBox.rotation.x += floatBox.userData.rotationVel.x * delta;
        floatBox.rotation.y += floatBox.userData.rotationVel.y * delta;
        floatBox.rotation.z += floatBox.userData.rotationVel.z * delta;

        floatBox.position.x += Math.sin(totalElapsedTime * 0.2 + f) * 0.1;
        floatBox.position.y += Math.cos(totalElapsedTime * 0.15 + f * 0.5) * 0.1;
        floatBox.position.z += Math.sin(totalElapsedTime * 0.25 + f * 0.3) * 0.1;
      }
    }

    // Animate drifting debris
    for (var d = 0; d < floatChildren.length; d++) {
      var debris = floatChildren[d];
      if (debris.userData.velocity) {
        debris.position.x += debris.userData.velocity.x * delta;
        debris.position.y += debris.userData.velocity.y * delta;
        debris.position.z += debris.userData.velocity.z * delta;

        debris.rotation.x += debris.userData.rotationVel.x * delta;
        debris.rotation.y += debris.userData.rotationVel.y * delta;
        debris.rotation.z += debris.userData.rotationVel.z * delta;

        // Wrap debris around if too far
        if (Math.abs(debris.position.x) > 400) debris.position.x *= -0.9;
        if (Math.abs(debris.position.y) > 350) debris.position.y *= -0.9;
        if (Math.abs(debris.position.z) > 400) debris.position.z *= -0.9;
      }
    }

    // Slow spin of Earth
    earthSphere.rotation.y += delta * 0.02;

    // Thruster array subtle bobbing
    thrusterArray.position.y = Math.sin(totalElapsedTime * 0.5) * 2;
  };

  var reset = function() {
    totalElapsedTime = 0;
    if (earthSphere) {
      earthSphere.rotation.y = 0;
    }
    if (platformGroup) {
      platformGroup.position.set(0, 0, 0);
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
