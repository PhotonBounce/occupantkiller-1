window.StormCoast = (function() {
  'use strict';

  var sceneObjects = [];
  var animatedObjects = [];
  var waveObjects = [];
  var seagullObjects = [];

  function init(scene, camera) {
    sceneObjects = [];
    animatedObjects = [];
    waveObjects = [];
    seagullObjects = [];

    // Rocky cliff faces
    var cliffGeom1 = new THREE.BoxGeometry(40, 80, 15);
    var cliffMat = new THREE.MeshStandardMaterial({ color: 0x666655, roughness: 0.8 });
    var cliff1 = new THREE.Mesh(cliffGeom1, cliffMat);
    cliff1.position.set(-50, 40, -30);
    cliff1.scale.set(1.2, 1.0, 0.9);
    scene.add(cliff1);
    sceneObjects.push(cliff1);

    var cliffGeom2 = new THREE.BoxGeometry(50, 70, 20);
    var cliff2 = new THREE.Mesh(cliffGeom2, cliffMat);
    cliff2.position.set(50, 35, -25);
    cliff2.scale.set(1.1, 0.95, 0.8);
    scene.add(cliff2);
    sceneObjects.push(cliff2);

    var cliffGeom3 = new THREE.BoxGeometry(35, 60, 18);
    var cliff3 = new THREE.Mesh(cliffGeom3, cliffMat);
    cliff3.position.set(0, 30, -35);
    cliff3.scale.set(0.95, 0.9, 0.7);
    scene.add(cliff3);
    sceneObjects.push(cliff3);

    // Naval gun battery emplacement 1
    var gunBase1Geom = new THREE.CylinderGeometry(8, 10, 4, 32);
    var gunBaseMat = new THREE.MeshStandardMaterial({ color: 0x555544, roughness: 0.9 });
    var gunBase1 = new THREE.Mesh(gunBase1Geom, gunBaseMat);
    gunBase1.position.set(-30, 2, 10);
    scene.add(gunBase1);
    sceneObjects.push(gunBase1);

    var gunBarrel1Geom = new THREE.BoxGeometry(3, 2, 20);
    var gunBarrelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    var gunBarrel1 = new THREE.Mesh(gunBarrel1Geom, gunBarrelMat);
    gunBarrel1.position.set(-30, 8, 20);
    gunBarrel1.rotation.x = -0.3;
    scene.add(gunBarrel1);
    sceneObjects.push(gunBarrel1);

    // Naval gun battery emplacement 2
    var gunBase2 = new THREE.Mesh(gunBase1Geom, gunBaseMat);
    gunBase2.position.set(30, 2, 10);
    scene.add(gunBase2);
    sceneObjects.push(gunBase2);

    var gunBarrel2 = new THREE.Mesh(gunBarrel1Geom, gunBarrelMat);
    gunBarrel2.position.set(30, 8, 20);
    gunBarrel2.rotation.x = -0.3;
    scene.add(gunBarrel2);
    sceneObjects.push(gunBarrel2);

    // Coastal defense bunker
    var bunkerGeom = new THREE.BoxGeometry(20, 12, 25);
    var bunkerMat = new THREE.MeshStandardMaterial({ color: 0x777766, roughness: 0.85 });
    var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
    bunker.position.set(-10, 6, 25);
    scene.add(bunker);
    sceneObjects.push(bunker);

    // Lighthouse
    var lighthouseMastGeom = new THREE.CylinderGeometry(1.5, 1.5, 50, 16);
    var lighthouseMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
    var lighthouseMast = new THREE.Mesh(lighthouseMastGeom, lighthouseMat);
    lighthouseMast.position.set(60, 25, -40);
    scene.add(lighthouseMast);
    sceneObjects.push(lighthouseMast);

    var lighthouseBeaconGeom = new THREE.CylinderGeometry(2, 2, 3, 16);
    var beaconMat = new THREE.MeshStandardMaterial({ color: 0xFF6600, emissive: 0xFF4400, emissiveIntensity: 0.5 });
    var lighthouseBeacon = new THREE.Mesh(lighthouseBeaconGeom, beaconMat);
    lighthouseBeacon.position.set(60, 52, -40);
    scene.add(lighthouseBeacon);
    sceneObjects.push(lighthouseBeacon);
    animatedObjects.push({ obj: lighthouseBeacon, type: 'rotate', axis: 'y' });

    // Storm waves (rows of wave forms)
    var waveData = [];
    for (var w = 0; w < 5; w++) {
      for (var i = 0; i < 4; i++) {
        var waveGeom = new THREE.BoxGeometry(12, 3, 8);
        var waveMat = new THREE.MeshStandardMaterial({ color: 0x1144AA, roughness: 0.4, metalness: 0.3 });
        var wave = new THREE.Mesh(waveGeom, waveMat);
        var xPos = -60 + (i * 30);
        var zPos = -60 + (w * 25);
        wave.position.set(xPos, 0.5, zPos);
        scene.add(wave);
        sceneObjects.push(wave);
        waveObjects.push({ obj: wave, baseY: 0.5, phase: w * 0.5 + i * 0.2 });
      }
    }

    // Supply boats at dock
    var boatHullGeom = new THREE.BoxGeometry(8, 4, 18);
    var boatMat = new THREE.MeshStandardMaterial({ color: 0x334433, roughness: 0.7 });
    var boat1 = new THREE.Mesh(boatHullGeom, boatMat);
    boat1.position.set(-70, 1, 45);
    scene.add(boat1);
    sceneObjects.push(boat1);

    var boat2 = new THREE.Mesh(boatHullGeom, boatMat);
    boat2.position.set(-85, 1, 50);
    scene.add(boat2);
    sceneObjects.push(boat2);

    // Anti-ship missile launchers
    var missileBodyGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 16);
    var missileMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6 });
    var missile1 = new THREE.Mesh(missileBodyGeom, missileMat);
    missile1.position.set(15, 8, 35);
    missile1.rotation.x = -0.5;
    scene.add(missile1);
    sceneObjects.push(missile1);

    var missile2 = new THREE.Mesh(missileBodyGeom, missileMat);
    missile2.position.set(25, 8, 38);
    missile2.rotation.x = -0.5;
    scene.add(missile2);
    sceneObjects.push(missile2);

    // Storm debris (wooden planks and barrels)
    var plankGeom = new THREE.BoxGeometry(2, 0.3, 8);
    var plankMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    var plank1 = new THREE.Mesh(plankGeom, plankMat);
    plank1.position.set(-40, 0.5, 0);
    plank1.rotation.z = 0.3;
    scene.add(plank1);
    sceneObjects.push(plank1);

    var barrelGeom = new THREE.CylinderGeometry(1.2, 1.2, 2, 16);
    var barrelMat = new THREE.MeshStandardMaterial({ color: 0x553300, roughness: 0.8 });
    var barrel1 = new THREE.Mesh(barrelGeom, barrelMat);
    barrel1.position.set(-20, 1, 15);
    scene.add(barrel1);
    sceneObjects.push(barrel1);

    var barrel2 = new THREE.Mesh(barrelGeom, barrelMat);
    barrel2.position.set(-15, 1, 18);
    scene.add(barrel2);
    sceneObjects.push(barrel2);

    // Search radar (mast + rotating dish)
    var radarMastGeom = new THREE.CylinderGeometry(0.5, 0.5, 30, 16);
    var radarMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
    var radarMast = new THREE.Mesh(radarMastGeom, radarMat);
    radarMast.position.set(40, 15, -10);
    scene.add(radarMast);
    sceneObjects.push(radarMast);

    var radarDishGeom = new THREE.BoxGeometry(12, 0.5, 12);
    var radarDishMat = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.5, metalness: 0.6 });
    var radarDish = new THREE.Mesh(radarDishGeom, radarDishMat);
    radarDish.position.set(40, 32, -10);
    scene.add(radarDish);
    sceneObjects.push(radarDish);
    animatedObjects.push({ obj: radarDish, type: 'rotate', axis: 'y' });

    // Ammunition loading crane (frame + hook)
    var craneFrameGeom = new THREE.BoxGeometry(4, 25, 4);
    var craneMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });
    var craneFrame = new THREE.Mesh(craneFrameGeom, craneMat);
    craneFrame.position.set(5, 12.5, 50);
    scene.add(craneFrame);
    sceneObjects.push(craneFrame);

    var craneHookGeom = new THREE.CylinderGeometry(0.4, 0.4, 2, 16);
    var hookMat = new THREE.MeshStandardMaterial({ color: 0xAAAAA, roughness: 0.6 });
    var craneHook = new THREE.Mesh(craneHookGeom, hookMat);
    craneHook.position.set(5, 18, 50);
    scene.add(craneHook);
    sceneObjects.push(craneHook);
    animatedObjects.push({ obj: craneHook, type: 'swing', axis: 'z', parent: craneFrame });

    // Seagull flock (small spheres orbiting)
    for (var s = 0; s < 6; s++) {
      var seagullGeom = new THREE.SphereGeometry(0.5, 8, 8);
      var seagullMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.4 });
      var seagull = new THREE.Mesh(seagullGeom, seagullMat);
      seagull.position.set(20, 40, 20);
      scene.add(seagull);
      sceneObjects.push(seagull);
      seagullObjects.push({ obj: seagull, index: s, radius: 15, height: 40 });
    }

    // Storm clouds (large spheres at height, dark)
    var cloud1Geom = new THREE.SphereGeometry(20, 32, 32);
    var cloudMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.9, emissive: 0x111122 });
    var cloud1 = new THREE.Mesh(cloud1Geom, cloudMat);
    cloud1.position.set(-40, 70, -60);
    scene.add(cloud1);
    sceneObjects.push(cloud1);
    animatedObjects.push({ obj: cloud1, type: 'drift', speed: 0.02 });

    var cloud2 = new THREE.Mesh(cloud1Geom, cloudMat);
    cloud2.position.set(30, 75, -50);
    scene.add(cloud2);
    sceneObjects.push(cloud2);
    animatedObjects.push({ obj: cloud2, type: 'drift', speed: 0.015 });

    // Emergency generator shed
    var shedGeom = new THREE.BoxGeometry(6, 4, 8);
    var shedMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.8 });
    var shed = new THREE.Mesh(shedGeom, shedMat);
    shed.position.set(-55, 2, 35);
    scene.add(shed);
    sceneObjects.push(shed);

    var shedLightGeom = new THREE.SphereGeometry(1, 16, 16);
    var shedLightMat = new THREE.MeshStandardMaterial({ color: 0xFFDD00, emissive: 0xFFDD00, emissiveIntensity: 0.8 });
    var shedLight = new THREE.Mesh(shedLightGeom, shedLightMat);
    shedLight.position.set(-55, 5, 35);
    scene.add(shedLight);
    sceneObjects.push(shedLight);
    animatedObjects.push({ obj: shedLight, type: 'flicker', intensity: 0.8 });

    // Signal fire beacon (base + flame sphere)
    var signalBaseGeom = new THREE.CylinderGeometry(2, 2, 1.5, 16);
    var signalMat = new THREE.MeshStandardMaterial({ color: 0x444433, roughness: 0.8 });
    var signalBase = new THREE.Mesh(signalBaseGeom, signalMat);
    signalBase.position.set(50, 0.75, 55);
    scene.add(signalBase);
    sceneObjects.push(signalBase);

    var flameGeom = new THREE.SphereGeometry(1.5, 16, 16);
    var flameMat = new THREE.MeshStandardMaterial({ color: 0xFF4400, emissive: 0xFF4400, emissiveIntensity: 1.0 });
    var flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.set(50, 5, 55);
    scene.add(flame);
    sceneObjects.push(flame);
    animatedObjects.push({ obj: flame, type: 'flicker', intensity: 1.0 });
  }

  function update(delta) {
    var i;

    // Update waves
    for (i = 0; i < waveObjects.length; i++) {
      var wave = waveObjects[i];
      var offset = Math.sin(wave.phase + delta * 2) * 2;
      wave.obj.position.y = wave.baseY + offset;
    }

    // Update animated objects
    for (i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];
      if (anim.type === 'rotate') {
        if (anim.axis === 'y') {
          anim.obj.rotation.y += delta * 1.5;
        }
      } else if (anim.type === 'drift') {
        anim.obj.position.x += anim.speed * delta;
        if (anim.obj.position.x > 80) {
          anim.obj.position.x = -80;
        }
      } else if (anim.type === 'swing') {
        var swing = Math.sin(delta * 1.2) * 0.4;
        anim.obj.position.z = anim.parent.position.z + swing;
      } else if (anim.type === 'flicker') {
        var flicker = 0.5 + Math.sin(delta * 8) * 0.5;
        anim.obj.material.emissiveIntensity = anim.intensity * flicker;
      }
    }

    // Update seagulls (orbiting)
    for (i = 0; i < seagullObjects.length; i++) {
      var sg = seagullObjects[i];
      var angle = (delta + sg.index * Math.PI / 3) * 0.5;
      sg.obj.position.x = Math.cos(angle) * sg.radius;
      sg.obj.position.z = Math.sin(angle) * sg.radius + 20;
      sg.obj.position.y = sg.height + Math.sin(delta * 2 + sg.index) * 3;
    }
  }

  function reset() {
    var i;
    for (i = 0; i < sceneObjects.length; i++) {
      sceneObjects[i].geometry.dispose();
      sceneObjects[i].material.dispose();
    }
    sceneObjects = [];
    animatedObjects = [];
    waveObjects = [];
    seagullObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
