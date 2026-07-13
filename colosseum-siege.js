window.ColosseumSiege = (function() {
  'use strict';

  var objects = [];
  var scene = null;
  var camera = null;
  var time = 0;

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];

    // Material definitions
    var stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
    var sandMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.9 });
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.8 });
    var fireMaterial = new THREE.MeshBasicMaterial({ color: 0xFF6B2C });
    var woodMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 });

    // 1. Main arena floor (sand)
    var floorGeometry = new THREE.CylinderGeometry(25, 25, 0.5, 32);
    var floorMesh = new THREE.Mesh(floorGeometry, sandMaterial);
    floorMesh.position.y = -0.25;
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    objects.push(floorMesh);

    // 2. Central arena structure - cylindrical stone wall
    var arenaWallGeometry = new THREE.CylinderGeometry(26, 26, 3, 32);
    var arenaWallMesh = new THREE.Mesh(arenaWallGeometry, stoneMaterial);
    arenaWallMesh.position.y = 1.5;
    arenaWallMesh.castShadow = true;
    arenaWallMesh.receiveShadow = true;
    scene.add(arenaWallMesh);
    objects.push(arenaWallMesh);

    // 3. First tier of spectator stands (outer ring)
    var tier1Geometry = new THREE.CylinderGeometry(32, 32, 1, 32);
    var tier1Mesh = new THREE.Mesh(tier1Geometry, stoneMaterial);
    tier1Mesh.position.y = 3.5;
    tier1Mesh.castShadow = true;
    tier1Mesh.receiveShadow = true;
    scene.add(tier1Mesh);
    objects.push(tier1Mesh);

    // 4. Second tier of spectator stands
    var tier2Geometry = new THREE.CylinderGeometry(40, 40, 1, 32);
    var tier2Mesh = new THREE.Mesh(tier2Geometry, stoneMaterial);
    tier2Mesh.position.y = 6;
    tier2Mesh.castShadow = true;
    tier2Mesh.receiveShadow = true;
    scene.add(tier2Mesh);
    objects.push(tier2Mesh);

    // 5. Crumbling arch 1 (using cylinder as arch base)
    var arch1Geometry = new THREE.CylinderGeometry(8, 8, 2, 16);
    var arch1Mesh = new THREE.Mesh(arch1Geometry, stoneMaterial);
    arch1Mesh.position.set(28, 5, 0);
    arch1Mesh.scale.set(1, 2.5, 0.3);
    arch1Mesh.castShadow = true;
    arch1Mesh.receiveShadow = true;
    scene.add(arch1Mesh);
    objects.push(arch1Mesh);

    // 6. Crumbling arch 2
    var arch2Geometry = new THREE.CylinderGeometry(8, 8, 2, 16);
    var arch2Mesh = new THREE.Mesh(arch2Geometry, stoneMaterial);
    arch2Mesh.position.set(-28, 5, 0);
    arch2Mesh.scale.set(1, 2.5, 0.3);
    arch2Mesh.castShadow = true;
    arch2Mesh.receiveShadow = true;
    scene.add(arch2Mesh);
    objects.push(arch2Mesh);

    // 7. Crumbling arch 3
    var arch3Geometry = new THREE.CylinderGeometry(8, 8, 2, 16);
    var arch3Mesh = new THREE.Mesh(arch3Geometry, stoneMaterial);
    arch3Mesh.position.set(0, 5, 28);
    arch3Mesh.scale.set(1, 2.5, 0.3);
    arch3Mesh.castShadow = true;
    arch3Mesh.receiveShadow = true;
    scene.add(arch3Mesh);
    objects.push(arch3Mesh);

    // 8. Crumbling arch 4
    var arch4Geometry = new THREE.CylinderGeometry(8, 8, 2, 16);
    var arch4Mesh = new THREE.Mesh(arch4Geometry, stoneMaterial);
    arch4Mesh.position.set(0, 5, -28);
    arch4Mesh.scale.set(1, 2.5, 0.3);
    arch4Mesh.castShadow = true;
    arch4Mesh.receiveShadow = true;
    scene.add(arch4Mesh);
    objects.push(arch4Mesh);

    // 9. Burning brazier 1 (cone for fire)
    var brazier1BowlGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    var brazier1BowlMesh = new THREE.Mesh(brazier1BowlGeometry, metalMaterial);
    brazier1BowlMesh.position.set(15, 2, 10);
    brazier1BowlMesh.castShadow = true;
    brazier1BowlMesh.receiveShadow = true;
    scene.add(brazier1BowlMesh);
    objects.push(brazier1BowlMesh);

    var brazier1FlameGeometry = new THREE.ConeGeometry(1, 2.5, 8);
    var brazier1FlameMesh = new THREE.Mesh(brazier1FlameGeometry, fireMaterial);
    brazier1FlameMesh.position.set(15, 3.5, 10);
    brazier1FlameMesh.castShadow = true;
    scene.add(brazier1FlameMesh);
    objects.push(brazier1FlameMesh);

    // 10. Burning brazier 2
    var brazier2BowlGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    var brazier2BowlMesh = new THREE.Mesh(brazier2BowlGeometry, metalMaterial);
    brazier2BowlMesh.position.set(-15, 2, 10);
    brazier2BowlMesh.castShadow = true;
    brazier2BowlMesh.receiveShadow = true;
    scene.add(brazier2BowlMesh);
    objects.push(brazier2BowlMesh);

    var brazier2FlameGeometry = new THREE.ConeGeometry(1, 2.5, 8);
    var brazier2FlameMesh = new THREE.Mesh(brazier2FlameGeometry, fireMaterial);
    brazier2FlameMesh.position.set(-15, 3.5, 10);
    brazier2FlameMesh.castShadow = true;
    scene.add(brazier2FlameMesh);
    objects.push(brazier2FlameMesh);

    // 11. Siege catapult (using basic geometries)
    var catapultBaseGeometry = new THREE.BoxGeometry(2, 0.5, 3);
    var catapultBaseMesh = new THREE.Mesh(catapultBaseGeometry, woodMaterial);
    catapultBaseMesh.position.set(20, 1, -15);
    catapultBaseMesh.castShadow = true;
    catapultBaseMesh.receiveShadow = true;
    scene.add(catapultBaseMesh);
    objects.push(catapultBaseMesh);

    var catapultArmGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
    var catapultArmMesh = new THREE.Mesh(catapultArmGeometry, woodMaterial);
    catapultArmMesh.position.set(20, 2, -15);
    catapultArmMesh.castShadow = true;
    catapultArmMesh.receiveShadow = true;
    catapultArmMesh.userData.isCatapult = true;
    scene.add(catapultArmMesh);
    objects.push(catapultArmMesh);

    // 12. Retractable iron gate 1
    var gate1Geometry = new THREE.BoxGeometry(2, 4, 0.2);
    var gate1Mesh = new THREE.Mesh(gate1Geometry, metalMaterial);
    gate1Mesh.position.set(22, 2, 0);
    gate1Mesh.castShadow = true;
    gate1Mesh.receiveShadow = true;
    gate1Mesh.userData.isGate = true;
    gate1Mesh.userData.gatePhase = 0;
    scene.add(gate1Mesh);
    objects.push(gate1Mesh);

    // 13. Retractable iron gate 2
    var gate2Geometry = new THREE.BoxGeometry(2, 4, 0.2);
    var gate2Mesh = new THREE.Mesh(gate2Geometry, metalMaterial);
    gate2Mesh.position.set(-22, 2, 0);
    gate2Mesh.castShadow = true;
    gate2Mesh.receiveShadow = true;
    gate2Mesh.userData.isGate = true;
    gate2Mesh.userData.gatePhase = Math.PI;
    scene.add(gate2Mesh);
    objects.push(gate2Mesh);

    // 14. Tactical barrier (sandbag defense)
    var barrierGeometry = new THREE.BoxGeometry(4, 1.5, 0.5);
    var barrierMesh = new THREE.Mesh(barrierGeometry, sandMaterial);
    barrierMesh.position.set(0, 0.75, 15);
    barrierMesh.castShadow = true;
    barrierMesh.receiveShadow = true;
    scene.add(barrierMesh);
    objects.push(barrierMesh);

    // 15. Weapon rack (sphere for weapons storage)
    var weaponRackGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    var weaponRackMesh = new THREE.Mesh(weaponRackGeometry, metalMaterial);
    weaponRackMesh.position.set(-12, 1.5, -12);
    weaponRackMesh.castShadow = true;
    weaponRackMesh.receiveShadow = true;
    scene.add(weaponRackMesh);
    objects.push(weaponRackMesh);

    // 16. Gladiator cell entrance (underground structure)
    var cellEntranceGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.3);
    var cellEntranceMesh = new THREE.Mesh(cellEntranceGeometry, metalMaterial);
    cellEntranceMesh.position.set(10, 1, -20);
    cellEntranceMesh.castShadow = true;
    cellEntranceMesh.receiveShadow = true;
    scene.add(cellEntranceMesh);
    objects.push(cellEntranceMesh);

    // 17. Sand debris swirl center (sphere for effect anchor)
    var debrisAnchorGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    var debrisAnchorMesh = new THREE.Mesh(debrisAnchorGeometry, sandMaterial);
    debrisAnchorMesh.position.set(0, 1, 0);
    debrisAnchorMesh.userData.isDebrisAnchor = true;
    scene.add(debrisAnchorMesh);
    objects.push(debrisAnchorMesh);
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];

      // Brazier flame flicker animation
      if (obj.userData && !obj.userData.isCatapult && !obj.userData.isGate && !obj.userData.isDebrisAnchor) {
        if (obj.geometry instanceof THREE.ConeGeometry) {
          var flickerScale = 1 + Math.sin(time * 5) * 0.2;
          obj.scale.y = flickerScale;
        }
      }

      // Catapult arm swing animation
      if (obj.userData && obj.userData.isCatapult) {
        var swingAngle = Math.sin(time * 1.5) * 0.6;
        obj.rotation.z = swingAngle;
      }

      // Gate rise/fall animation
      if (obj.userData && obj.userData.isGate) {
        var gatePhase = obj.userData.gatePhase;
        var gateMovement = Math.sin(time * 2 + gatePhase) * 3;
        var originalY = gatePhase < Math.PI ? 2 : 2;
        obj.position.y = originalY + gateMovement;
      }

      // Debris swirl animation
      if (obj.userData && obj.userData.isDebrisAnchor) {
        var debrisRotation = time * 0.8;
        obj.rotation.y = debrisRotation;
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
