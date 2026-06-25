window.GairlochFort = (function() {
  'use strict';

  function create(scene) {
    var group = new THREE.Group();
    group.position.set(1140, 0, 1480);

    var concreteGray = new THREE.MeshLambertMaterial({ color: 0x999999 });
    var steelDark = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var industrialOrange = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
    var whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var redBrown = new THREE.MeshLambertMaterial({ color: 0xAA4422 });
    var yellowBright = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });

    // 1. Submarine Pen (22x6x10 BoxGeometry, open front)
    var penGeom = new THREE.BoxGeometry(22, 6, 10);
    var pen = new THREE.Mesh(penGeom, concreteGray);
    pen.position.set(0, 3, 0);
    pen.castShadow = true;
    pen.receiveShadow = true;
    group.add(pen);

    // 2. Submarine Hull (18x2x3 BoxGeometry + CylinderGeometry conning tower)
    var hullGeom = new THREE.BoxGeometry(18, 2, 3);
    var hull = new THREE.Mesh(hullGeom, steelDark);
    hull.position.set(0, 4, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    var towerGeom = new THREE.CylinderGeometry(1, 1, 2, 16);
    var tower = new THREE.Mesh(towerGeom, steelDark);
    tower.position.set(3, 6, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // 3. Torpedo Workshop (8x4x4 BoxGeometry)
    var workshopGeom = new THREE.BoxGeometry(8, 4, 4);
    var workshop = new THREE.Mesh(workshopGeom, industrialOrange);
    workshop.position.set(-12, 2, 6);
    workshop.castShadow = true;
    workshop.receiveShadow = true;
    group.add(workshop);

    // 4. Loch Shore Gun Battery (3 CylinderGeometry guns on BoxGeometry emplacements)
    var emplace1Geom = new THREE.BoxGeometry(3, 1, 3);
    var emplace1 = new THREE.Mesh(emplace1Geom, concreteGray);
    emplace1.position.set(-8, 0.5, -10);
    emplace1.castShadow = true;
    emplace1.receiveShadow = true;
    group.add(emplace1);

    var gun1Geom = new THREE.CylinderGeometry(0.3, 0.3, 4, 12);
    var gun1 = new THREE.Mesh(gun1Geom, steelDark);
    gun1.position.set(-8, 2, -10);
    gun1.rotation.z = Math.PI / 6;
    gun1.castShadow = true;
    gun1.receiveShadow = true;
    group.add(gun1);

    var emplace2Geom = new THREE.BoxGeometry(3, 1, 3);
    var emplace2 = new THREE.Mesh(emplace2Geom, concreteGray);
    emplace2.position.set(0, 0.5, -10);
    emplace2.castShadow = true;
    emplace2.receiveShadow = true;
    group.add(emplace2);

    var gun2Geom = new THREE.CylinderGeometry(0.3, 0.3, 4, 12);
    var gun2 = new THREE.Mesh(gun2Geom, steelDark);
    gun2.position.set(0, 2, -10);
    gun2.rotation.z = Math.PI / 6;
    gun2.castShadow = true;
    gun2.receiveShadow = true;
    group.add(gun2);

    var emplace3Geom = new THREE.BoxGeometry(3, 1, 3);
    var emplace3 = new THREE.Mesh(emplace3Geom, concreteGray);
    emplace3.position.set(8, 0.5, -10);
    emplace3.castShadow = true;
    emplace3.receiveShadow = true;
    group.add(emplace3);

    var gun3Geom = new THREE.CylinderGeometry(0.3, 0.3, 4, 12);
    var gun3 = new THREE.Mesh(gun3Geom, steelDark);
    gun3.position.set(8, 2, -10);
    gun3.rotation.z = Math.PI / 6;
    gun3.castShadow = true;
    gun3.receiveShadow = true;
    group.add(gun3);

    // 5. Village Pier Extended to Naval Dock (20x2x4 BoxGeometry)
    var pierGeom = new THREE.BoxGeometry(20, 2, 4);
    var pier = new THREE.Mesh(pierGeom, concreteGray);
    pier.position.set(5, 1, 15);
    pier.castShadow = true;
    pier.receiveShadow = true;
    group.add(pier);

    // 6. Radar/Sonar Dome (SphereGeometry on CylinderGeometry post)
    var postGeom = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
    var post = new THREE.Mesh(postGeom, steelDark);
    post.position.set(-15, 3, -5);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);

    var domeGeom = new THREE.SphereGeometry(5, 32, 32);
    var dome = new THREE.Mesh(domeGeom, whiteMaterial);
    dome.position.set(-15, 12, -5);
    dome.castShadow = true;
    dome.receiveShadow = true;
    group.add(dome);

    // 7. Torridon Sandstone Boulders (5 BoxGeometry deep red-brown boulders)
    var boulder1Geom = new THREE.BoxGeometry(3, 2.5, 2);
    var boulder1 = new THREE.Mesh(boulder1Geom, redBrown);
    boulder1.position.set(10, 1.25, -8);
    boulder1.rotation.set(0.3, 0.4, 0.2);
    boulder1.castShadow = true;
    boulder1.receiveShadow = true;
    group.add(boulder1);

    var boulder2Geom = new THREE.BoxGeometry(2.5, 3, 1.5);
    var boulder2 = new THREE.Mesh(boulder2Geom, redBrown);
    boulder2.position.set(14, 1.5, -6);
    boulder2.rotation.set(0.2, 0.3, 0.5);
    boulder2.castShadow = true;
    boulder2.receiveShadow = true;
    group.add(boulder2);

    var boulder3Geom = new THREE.BoxGeometry(2, 2, 2.5);
    var boulder3 = new THREE.Mesh(boulder3Geom, redBrown);
    boulder3.position.set(12, 1, -4);
    boulder3.rotation.set(0.4, 0.2, 0.1);
    boulder3.castShadow = true;
    boulder3.receiveShadow = true;
    group.add(boulder3);

    var boulder4Geom = new THREE.BoxGeometry(2.5, 2.5, 2);
    var boulder4 = new THREE.Mesh(boulder4Geom, redBrown);
    boulder4.position.set(16, 1.25, -2);
    boulder4.rotation.set(0.1, 0.5, 0.3);
    boulder4.castShadow = true;
    boulder4.receiveShadow = true;
    group.add(boulder4);

    var boulder5Geom = new THREE.BoxGeometry(3, 2, 2.5);
    var boulder5 = new THREE.Mesh(boulder5Geom, redBrown);
    boulder5.position.set(11, 1.25, 2);
    boulder5.rotation.set(0.3, 0.1, 0.4);
    boulder5.castShadow = true;
    boulder5.receiveShadow = true;
    group.add(boulder5);

    // 8. Anti-Aircraft Searchlight (CylinderGeometry base + SphereGeometry bright light)
    var lightBaseGeom = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
    var lightBase = new THREE.Mesh(lightBaseGeom, steelDark);
    lightBase.position.set(-18, 0.5, 8);
    lightBase.castShadow = true;
    lightBase.receiveShadow = true;
    group.add(lightBase);

    var lightSphereGeom = new THREE.SphereGeometry(1.2, 16, 16);
    var lightSphere = new THREE.Mesh(lightSphereGeom, yellowBright);
    lightSphere.position.set(-18, 2.5, 8);
    lightSphere.castShadow = true;
    lightSphere.receiveShadow = true;
    group.add(lightSphere);

    scene.add(group);
    return group;
  }

  return {
    create: create
  };
}());
