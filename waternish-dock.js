var WaternishDock = (function() {
  'use strict';

  var structures = [];

  function init(scene) {
    var baseX = 1420;
    var baseZ = 1900;

    // 1. Trumpan Church ruins - BoxGeometry roofless burned stone
    var ruinsGeom = new THREE.BoxGeometry(8, 3, 5);
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
    var ruins = new THREE.Mesh(ruinsGeom, stoneMat);
    ruins.position.set(baseX, 1, baseZ);
    ruins.castShadow = true;
    ruins.receiveShadow = true;
    scene.add(ruins);
    structures.push(ruins);

    // 1b. Charred walls detail - additional vertical structure
    var charredGeom = new THREE.BoxGeometry(8.2, 2.5, 0.4);
    var charredMat = new THREE.MeshLambertMaterial({ color: 0x443322 });
    var charred = new THREE.Mesh(charredGeom, charredMat);
    charred.position.set(baseX, 1.2, baseZ + 2.3);
    charred.castShadow = true;
    charred.receiveShadow = true;
    scene.add(charred);
    structures.push(charred);

    // 2. Church graveyard wall - 3 low BoxGeometry mossy stone walls
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x556644 });

    var wall1Geom = new THREE.BoxGeometry(12, 1.2, 0.6);
    var wall1 = new THREE.Mesh(wall1Geom, wallMat);
    wall1.position.set(baseX - 8, 0.6, baseZ - 5);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);
    structures.push(wall1);

    var wall2Geom = new THREE.BoxGeometry(0.6, 1.2, 10);
    var wall2 = new THREE.Mesh(wall2Geom, wallMat);
    wall2.position.set(baseX - 12, 0.6, baseZ + 2);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    scene.add(wall2);
    structures.push(wall2);

    var wall3Geom = new THREE.BoxGeometry(12, 1.2, 0.6);
    var wall3 = new THREE.Mesh(wall3Geom, wallMat);
    wall3.position.set(baseX - 8, 0.6, baseZ + 8);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    scene.add(wall3);
    structures.push(wall3);

    // 3. Ardmore Point lighthouse - CylinderGeometry white tower + red cone + sphere lantern
    var towerGeom = new THREE.CylinderGeometry(1.8, 1.8, 12, 16);
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var tower = new THREE.Mesh(towerGeom, whiteMat);
    tower.position.set(baseX + 40, 6, baseZ - 60);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    structures.push(tower);

    var coneGeom = new THREE.ConeGeometry(2.2, 3, 16);
    var redMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
    var cone = new THREE.Mesh(coneGeom, redMat);
    cone.position.set(baseX + 40, 13.5, baseZ - 60);
    cone.castShadow = true;
    cone.receiveShadow = true;
    scene.add(cone);
    structures.push(cone);

    var lanternGeom = new THREE.SphereGeometry(1.5, 12, 12);
    var yellowMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var lantern = new THREE.Mesh(lanternGeom, yellowMat);
    lantern.position.set(baseX + 40, 15.8, baseZ - 60);
    lantern.castShadow = true;
    lantern.receiveShadow = true;
    scene.add(lantern);
    structures.push(lantern);

    // 4. Birlinn beach landing site - BoxGeometry hull + CylinderGeometry mast
    var hullGeom = new THREE.BoxGeometry(6, 1.5, 14);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(baseX - 35, 0.8, baseZ + 30);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    structures.push(hull);

    var mastGeom = new THREE.CylinderGeometry(0.3, 0.3, 18, 8);
    var mastMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(baseX - 35, 9.5, baseZ + 30);
    mast.castShadow = true;
    mast.receiveShadow = true;
    scene.add(mast);
    structures.push(mast);

    // 5. Waternish peninsula cliff battery - 2 CylinderGeometry guns on BoxGeometry clifftop
    var clifftopGeom = new THREE.BoxGeometry(20, 2, 18);
    var rockMat = new THREE.MeshLambertMaterial({ color: 0x777666 });
    var clifftop = new THREE.Mesh(clifftopGeom, rockMat);
    clifftop.position.set(baseX + 50, 8, baseZ + 40);
    clifftop.castShadow = true;
    clifftop.receiveShadow = true;
    scene.add(clifftop);
    structures.push(clifftop);

    var gun1Geom = new THREE.CylinderGeometry(0.4, 0.5, 6, 12);
    var gunMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var gun1 = new THREE.Mesh(gun1Geom, gunMat);
    gun1.rotation.z = 0.4;
    gun1.position.set(baseX + 35, 10.5, baseZ + 35);
    gun1.castShadow = true;
    gun1.receiveShadow = true;
    scene.add(gun1);
    structures.push(gun1);

    var gun2Geom = new THREE.CylinderGeometry(0.4, 0.5, 6, 12);
    var gun2 = new THREE.Mesh(gun2Geom, gunMat);
    gun2.rotation.z = -0.4;
    gun2.position.set(baseX + 65, 10.5, baseZ + 45);
    gun2.castShadow = true;
    gun2.receiveShadow = true;
    scene.add(gun2);
    structures.push(gun2);

    // 6. Harris Sound radar - CylinderGeometry mast + SphereGeometry dish
    var radarMastGeom = new THREE.CylinderGeometry(0.25, 0.25, 16, 8);
    var metalMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    var radarMast = new THREE.Mesh(radarMastGeom, metalMat);
    radarMast.position.set(baseX - 60, 8, baseZ - 50);
    radarMast.castShadow = true;
    radarMast.receiveShadow = true;
    scene.add(radarMast);
    structures.push(radarMast);

    var dishGeom = new THREE.SphereGeometry(2.8, 16, 16);
    var dishMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var dish = new THREE.Mesh(dishGeom, dishMat);
    dish.scale.set(1, 0.6, 0.5);
    dish.position.set(baseX - 60 + 5, 15, baseZ - 50);
    dish.castShadow = true;
    dish.receiveShadow = true;
    scene.add(dish);
    structures.push(dish);

    // 7. Fishing village remnants - 4 ruined BoxGeometry cottage outlines
    var cottageMat = new THREE.MeshLambertMaterial({ color: 0x888877 });

    var cottage1Geom = new THREE.BoxGeometry(5, 2.2, 6);
    var cottage1 = new THREE.Mesh(cottage1Geom, cottageMat);
    cottage1.position.set(baseX - 50, 1.1, baseZ - 25);
    cottage1.castShadow = true;
    cottage1.receiveShadow = true;
    scene.add(cottage1);
    structures.push(cottage1);

    var cottage2Geom = new THREE.BoxGeometry(4.5, 2, 5);
    var cottage2 = new THREE.Mesh(cottage2Geom, cottageMat);
    cottage2.position.set(baseX - 35, 1, baseZ - 35);
    cottage2.castShadow = true;
    cottage2.receiveShadow = true;
    scene.add(cottage2);
    structures.push(cottage2);

    var cottage3Geom = new THREE.BoxGeometry(5.5, 2.3, 6);
    var cottage3 = new THREE.Mesh(cottage3Geom, cottageMat);
    cottage3.position.set(baseX - 20, 1.15, baseZ - 30);
    cottage3.castShadow = true;
    cottage3.receiveShadow = true;
    scene.add(cottage3);
    structures.push(cottage3);

    var cottage4Geom = new THREE.BoxGeometry(4.8, 2.1, 5.5);
    var cottage4 = new THREE.Mesh(cottage4Geom, cottageMat);
    cottage4.position.set(baseX - 40, 1.05, baseZ - 15);
    cottage4.castShadow = true;
    cottage4.receiveShadow = true;
    scene.add(cottage4);
    structures.push(cottage4);

    // 8. Coastal watchtower - CylinderGeometry slender tower on BoxGeometry base
    var towerBaseGeom = new THREE.BoxGeometry(8, 1.5, 8);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
    var towerBase = new THREE.Mesh(towerBaseGeom, baseMat);
    towerBase.position.set(baseX + 70, 0.75, baseZ + 70);
    towerBase.castShadow = true;
    towerBase.receiveShadow = true;
    scene.add(towerBase);
    structures.push(towerBase);

    var slenderGeom = new THREE.CylinderGeometry(1.2, 1.2, 12, 12);
    var slenderMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var slender = new THREE.Mesh(slenderGeom, slenderMat);
    slender.position.set(baseX + 70, 7.5, baseZ + 70);
    slender.castShadow = true;
    slender.receiveShadow = true;
    scene.add(slender);
    structures.push(slender);

    return structures;
  }

  function render(renderer, camera) {
    renderer.render(camera.getScene(), camera.getCamera());
  }

  return {
    init: init,
    render: render,
    structures: structures
  };
}());
