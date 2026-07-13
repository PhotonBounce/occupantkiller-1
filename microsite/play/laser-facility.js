window.LaserFacility = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];

    // 1. Massive laser aperture lens housing
    var lensGeometry = new THREE.CylinderGeometry(3, 3, 1.5, 32);
    var lensMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a2e, metalness: 0.8, roughness: 0.2 });
    var lensHousing = new THREE.Mesh(lensGeometry, lensMaterial);
    lensHousing.position.set(0, 3, 0);
    lensHousing.castShadow = true;
    lensHousing.receiveShadow = true;
    scene.add(lensHousing);
    objects.push(lensHousing);

    // 2. Lens cap (glass)
    var capGeometry = new THREE.CylinderGeometry(2.9, 2.9, 0.2, 32);
    var capMaterial = new THREE.MeshPhongMaterial({ color: 0x4da6ff, transparent: true, opacity: 0.6 });
    var lensCap = new THREE.Mesh(capGeometry, capMaterial);
    lensCap.position.set(0, 4.05, 0);
    lensCap.castShadow = true;
    scene.add(lensCap);
    objects.push(lensCap);

    // 3. Targeting mirror array on gimbals (main gimbal base)
    var gimbalBaseGeometry = new THREE.BoxGeometry(2, 0.3, 2);
    var gimbalMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });
    var gimbalBase = new THREE.Mesh(gimbalBaseGeometry, gimbalMaterial);
    gimbalBase.position.set(5, 2, 0);
    gimbalBase.castShadow = true;
    gimbalBase.receiveShadow = true;
    scene.add(gimbalBase);
    objects.push(gimbalBase);

    // 4. Vertical gimbal arm
    var armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 16);
    var armMaterial = new THREE.MeshPhongMaterial({ color: 0x595959 });
    var gimbalArm = new THREE.Mesh(armGeometry, armMaterial);
    gimbalArm.position.set(5, 3, 0);
    gimbalArm.castShadow = true;
    gimbalArm.receiveShadow = true;
    scene.add(gimbalArm);
    objects.push(gimbalArm);

    // 5. Mirror array (rotating)
    var mirrorGeometry = new THREE.BoxGeometry(1.2, 0.1, 1.2);
    var mirrorMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.05 });
    var mirrorArray = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
    mirrorArray.position.set(5, 3.8, 0);
    mirrorArray.castShadow = true;
    mirrorArray.receiveShadow = true;
    mirrorArray.userData.isGimbal = true;
    scene.add(mirrorArray);
    objects.push(mirrorArray);

    // 6. Power capacitor bank 1
    var capGeom1 = new THREE.CylinderGeometry(0.4, 0.4, 2, 16);
    var capMat1 = new THREE.MeshPhongMaterial({ color: 0xff6600 });
    var capacitor1 = new THREE.Mesh(capGeom1, capMat1);
    capacitor1.position.set(-4, 0.5, 3);
    capacitor1.castShadow = true;
    capacitor1.receiveShadow = true;
    capacitor1.userData.isCapacitor = true;
    scene.add(capacitor1);
    objects.push(capacitor1);

    // 7. Power capacitor bank 2
    var capacitor2 = new THREE.Mesh(capGeom1, capMat1);
    capacitor2.position.set(-4, 0.5, -3);
    capacitor2.castShadow = true;
    capacitor2.receiveShadow = true;
    capacitor2.userData.isCapacitor = true;
    scene.add(capacitor2);
    objects.push(capacitor2);

    // 8. Capacitor discharge band (indicator)
    var bandGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.15, 16);
    var bandMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    var dischargeBand1 = new THREE.Mesh(bandGeometry, bandMaterial);
    dischargeBand1.position.set(-4, 1.5, 3);
    scene.add(dischargeBand1);
    objects.push(dischargeBand1);

    // 9. Cooling water loop tower 1
    var towerGeometry = new THREE.CylinderGeometry(0.5, 0.6, 3, 12);
    var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x3366ff });
    var tower1 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower1.position.set(-6, 1.5, 0);
    tower1.castShadow = true;
    tower1.receiveShadow = true;
    scene.add(tower1);
    objects.push(tower1);

    // 10. Cooling water loop tower 2
    var tower2 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower2.position.set(6, 1.5, 0);
    tower2.castShadow = true;
    tower2.receiveShadow = true;
    scene.add(tower2);
    objects.push(tower2);

    // 11. Beam director telescope
    var telescopeBodyGeometry = new THREE.CylinderGeometry(0.6, 0.7, 2.5, 16);
    var telescopeMaterial = new THREE.MeshPhongMaterial({ color: 0x2d2d2d });
    var telescopeBody = new THREE.Mesh(telescopeBodyGeometry, telescopeMaterial);
    telescopeBody.position.set(0, 4.5, 4);
    telescopeBody.rotation.z = Math.PI / 6;
    telescopeBody.castShadow = true;
    telescopeBody.receiveShadow = true;
    telescopeBody.userData.isBeamDirector = true;
    scene.add(telescopeBody);
    objects.push(telescopeBody);

    // 12. Telescope lens ring
    var lensRingGeometry = new THREE.CylinderGeometry(0.75, 0.75, 0.2, 16);
    var lensRingMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var telescopeLens = new THREE.Mesh(lensRingGeometry, lensRingMaterial);
    telescopeLens.position.set(1.2, 5.5, 4.8);
    telescopeLens.rotation.z = Math.PI / 6;
    telescopeLens.castShadow = true;
    scene.add(telescopeLens);
    objects.push(telescopeLens);

    // 13. Blast shields (box structure)
    var shieldGeometry = new THREE.BoxGeometry(8, 3, 0.3);
    var shieldMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var blastShield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    blastShield.position.set(0, 2, -5);
    blastShield.castShadow = true;
    blastShield.receiveShadow = true;
    scene.add(blastShield);
    objects.push(blastShield);

    // 14. Test target range scorched dummy
    var dummyHeadGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    var dummyMaterial = new THREE.MeshPhongMaterial({ color: 0x4d4d4d });
    var dummyHead = new THREE.Mesh(dummyHeadGeometry, dummyMaterial);
    dummyHead.position.set(8, 1.8, 0);
    dummyHead.castShadow = true;
    dummyHead.receiveShadow = true;
    scene.add(dummyHead);
    objects.push(dummyHead);

    // 15. Dummy body (torso)
    var dummyBodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var dummyBody = new THREE.Mesh(dummyBodyGeometry, dummyMaterial);
    dummyBody.position.set(8, 0.8, 0);
    dummyBody.castShadow = true;
    dummyBody.receiveShadow = true;
    scene.add(dummyBody);
    objects.push(dummyBody);

    // 16. Laser safety goggles rack (mounting frame)
    var rackGeometry = new THREE.BoxGeometry(1.5, 2, 0.2);
    var rackMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var gogglesRack = new THREE.Mesh(rackGeometry, rackMaterial);
    gogglesRack.position.set(-7, 1, 3);
    gogglesRack.castShadow = true;
    gogglesRack.receiveShadow = true;
    scene.add(gogglesRack);
    objects.push(gogglesRack);

    // 17. Goggles (pairs on rack)
    var gogglesLensGeometry = new THREE.SphereGeometry(0.15, 12, 12);
    var gogglesMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.7 });
    var goggles1 = new THREE.Mesh(gogglesLensGeometry, gogglesMaterial);
    goggles1.position.set(-7.3, 1.5, 3.1);
    scene.add(goggles1);
    objects.push(goggles1);

    var goggles2 = new THREE.Mesh(gogglesLensGeometry, gogglesMaterial);
    goggles2.position.set(-6.7, 1.5, 3.1);
    scene.add(goggles2);
    objects.push(goggles2);

    // 18. Optical bench calibration rig (structural frame)
    var benchGeometry = new THREE.BoxGeometry(3, 0.2, 1.5);
    var benchMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var opticalBench = new THREE.Mesh(benchGeometry, benchMaterial);
    opticalBench.position.set(-5, 0.1, -3);
    opticalBench.castShadow = true;
    opticalBench.receiveShadow = true;
    scene.add(opticalBench);
    objects.push(opticalBench);

    // 19. Bench support pillars
    var pillarGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    var pillarMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar1.position.set(-6, 0.4, -2.5);
    scene.add(pillar1);
    objects.push(pillar1);

    var pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar2.position.set(-4, 0.4, -3.5);
    scene.add(pillar2);
    objects.push(pillar2);

    // 20. Emergency power cutoff stations (red buttons)
    var buttonGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12);
    var buttonMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var powerCutoff1 = new THREE.Mesh(buttonGeometry, buttonMaterial);
    powerCutoff1.position.set(-8, 2, 0);
    powerCutoff1.castShadow = true;
    scene.add(powerCutoff1);
    objects.push(powerCutoff1);

    var powerCutoff2 = new THREE.Mesh(buttonGeometry, buttonMaterial);
    powerCutoff2.position.set(8, 2, 0);
    powerCutoff2.castShadow = true;
    scene.add(powerCutoff2);
    objects.push(powerCutoff2);

    // 21. Cooling fan (on tower)
    var fanGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16);
    var fanMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var fan1 = new THREE.Mesh(fanGeometry, fanMaterial);
    fan1.position.set(-6, 2.8, 0);
    fan1.userData.isFan = true;
    scene.add(fan1);
    objects.push(fan1);

    var fan2 = new THREE.Mesh(fanGeometry, fanMaterial);
    fan2.position.set(6, 2.8, 0);
    fan2.userData.isFan = true;
    scene.add(fan2);
    objects.push(fan2);
  }

  function update(delta) {
    if (!scene) return;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];

      // Gimbal mirror rotation
      if (obj.userData.isGimbal) {
        obj.rotation.x += delta * 0.5;
        obj.rotation.y += delta * 0.3;
      }

      // Capacitor pulsing (scaling)
      if (obj.userData.isCapacitor) {
        var pulseAmount = Math.sin(Date.now() * 0.003) * 0.1 + 1;
        obj.scale.set(1, pulseAmount, 1);
      }

      // Beam director sweep
      if (obj.userData.isBeamDirector) {
        obj.rotation.y = Math.sin(Date.now() * 0.001) * 0.4;
      }

      // Cooling fan spin
      if (obj.userData.isFan) {
        obj.rotation.z += delta * 5;
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
