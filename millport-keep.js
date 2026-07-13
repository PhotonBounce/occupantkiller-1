window.MillportKeep = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildKeep();
    }
    function buildKeep() {
        // Cumbrae island perimeter shore defense
        var seawallGeo = new THREE.BoxGeometry(40, 3, 2);
        var seawallMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var seawall = new THREE.Mesh(seawallGeo, seawallMat);
        seawall.position.set(0, 1.5, -30);
        scene.add(seawall);
        objects.push(seawall);

        var mineGeo = new THREE.SphereGeometry(0.8, 8, 8);
        var mineMat = new THREE.MeshLambertMaterial({color: 0x333333});
        var mine1 = new THREE.Mesh(mineGeo, mineMat);
        mine1.position.set(-15, 0.8, -28);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mineGeo, mineMat);
        mine2.position.set(0, 0.8, -28);
        scene.add(mine2);
        objects.push(mine2);

        var mine3 = new THREE.Mesh(mineGeo, mineMat);
        mine3.position.set(15, 0.8, -28);
        scene.add(mine3);
        objects.push(mine3);

        // Net barrier using LineSegments
        var netGeo = new THREE.BufferGeometry();
        var netPos = new Float32Array([
            -20, 2, -26, 20, 2, -26,
            -20, 2, -24, 20, 2, -24,
            -20, 2, -26, -20, 2, -24,
            20, 2, -26, 20, 2, -24
        ]);
        netGeo.setAttribute('position', new THREE.BufferAttribute(netPos, 3));
        var netMat = new THREE.LineBasicMaterial({color: 0x00FF00});
        var net = new THREE.LineSegments(netGeo, netMat);
        scene.add(net);
        objects.push(net);

        // Cathedral of the Isles stronghold
        var chapelGeo = new THREE.BoxGeometry(12, 15, 10);
        var chapelMat = new THREE.MeshLambertMaterial({color: 0xDEAD8B});
        var chapel = new THREE.Mesh(chapelGeo, chapelMat);
        chapel.position.set(-20, 7.5, 5);
        scene.add(chapel);
        objects.push(chapel);

        var cloistersGeo = new THREE.BoxGeometry(8, 4, 8);
        var cloistersMat = new THREE.MeshLambertMaterial({color: 0xDEAD8B});
        var cloisters = new THREE.Mesh(cloistersGeo, cloistersMat);
        cloisters.position.set(-20, 2, 15);
        scene.add(cloisters);
        objects.push(cloisters);

        var bellTowerGeo = new THREE.CylinderGeometry(2, 2, 20, 8);
        var bellTowerMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var bellTower = new THREE.Mesh(bellTowerGeo, bellTowerMat);
        bellTower.position.set(-20, 10, 5);
        scene.add(bellTower);
        objects.push(bellTower);

        // Marine Biological Station research base
        var aquariumGeo = new THREE.BoxGeometry(14, 6, 12);
        var aquariumMat = new THREE.MeshLambertMaterial({color: 0x87CEEB});
        var aquarium = new THREE.Mesh(aquariumGeo, aquariumMat);
        aquarium.position.set(0, 3, 10);
        scene.add(aquarium);
        objects.push(aquarium);

        var pumpTowerGeo = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
        var pumpTowerMat = new THREE.MeshLambertMaterial({color: 0x228B22});
        var pumpTower = new THREE.Mesh(pumpTowerGeo, pumpTowerMat);
        pumpTower.position.set(8, 6, 10);
        scene.add(pumpTower);
        objects.push(pumpTower);

        var supplyStoreGeo = new THREE.BoxGeometry(6, 5, 6);
        var supplyStoreMat = new THREE.MeshLambertMaterial({color: 0x8B4513});
        var supplyStore = new THREE.Mesh(supplyStoreGeo, supplyStoreMat);
        supplyStore.position.set(-8, 2.5, 15);
        scene.add(supplyStore);
        objects.push(supplyStore);

        // Millport town checkpoints
        var barrierGeo = new THREE.BoxGeometry(3, 2, 6);
        var barrierMat = new THREE.MeshLambertMaterial({color: 0xA9A9A9});
        var barrier1 = new THREE.Mesh(barrierGeo, barrierMat);
        barrier1.position.set(20, 1, -10);
        scene.add(barrier1);
        objects.push(barrier1);

        var guardTowerGeo = new THREE.CylinderGeometry(2.5, 2.5, 10, 8);
        var guardTowerMat = new THREE.MeshLambertMaterial({color: 0x555555});
        var guardTower = new THREE.Mesh(guardTowerGeo, guardTowerMat);
        guardTower.position.set(25, 5, 0);
        scene.add(guardTower);
        objects.push(guardTower);

        var nestGeo = new THREE.BoxGeometry(5, 3, 5);
        var nestMat = new THREE.MeshLambertMaterial({color: 0x404040});
        var nest = new THREE.Mesh(nestGeo, nestMat);
        nest.position.set(28, 1.5, -5);
        scene.add(nest);
        objects.push(nest);

        // Lion Rock coastal battery
        var emplacementGeo = new THREE.BoxGeometry(8, 2, 8);
        var emplacementMat = new THREE.MeshLambertMaterial({color: 0x6B6B6B});
        var emplacement = new THREE.Mesh(emplacementGeo, emplacementMat);
        emplacement.position.set(15, 1, 25);
        scene.add(emplacement);
        objects.push(emplacement);

        var barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 8, 6);
        var barrelMat = new THREE.MeshLambertMaterial({color: 0x2F2F2F});
        var barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(15, 5, 25);
        barrel.rotation.z = 0.3;
        scene.add(barrel);
        objects.push(barrel);

        var magazineGeo = new THREE.BoxGeometry(6, 4, 6);
        var magazineMat = new THREE.MeshLambertMaterial({color: 0x543210});
        var magazine = new THREE.Mesh(magazineGeo, magazineMat);
        magazine.position.set(15, 2, 20);
        scene.add(magazine);
        objects.push(magazine);

        // Fintray Bay beach landing defense
        var positionGeo = new THREE.BoxGeometry(4, 1.5, 4);
        var positionMat = new THREE.MeshLambertMaterial({color: 0xDAA520});
        var position1 = new THREE.Mesh(positionGeo, positionMat);
        position1.position.set(-10, 0.75, -15);
        scene.add(position1);
        objects.push(position1);

        var chargeGeo = new THREE.SphereGeometry(0.6, 8, 8);
        var chargeMat = new THREE.MeshLambertMaterial({color: 0xFF6347});
        var charge = new THREE.Mesh(chargeGeo, chargeMat);
        charge.position.set(-10, 0.6, -20);
        scene.add(charge);
        objects.push(charge);

        // Cable barrier using LineSegments
        var cableGeo = new THREE.BufferGeometry();
        var cablePos = new Float32Array([
            -15, 1, -18, -5, 1, -18,
            -15, 1, -18, -15, 1, -22,
            -5, 1, -18, -5, 1, -22
        ]);
        cableGeo.setAttribute('position', new THREE.BufferAttribute(cablePos, 3));
        var cableMat = new THREE.LineBasicMaterial({color: 0xFFFF00});
        var cable = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Glaid Stone summit relay
        var shelterGeo = new THREE.BoxGeometry(5, 4, 5);
        var shelterMat = new THREE.MeshLambertMaterial({color: 0x808080});
        var shelter = new THREE.Mesh(shelterGeo, shelterMat);
        shelter.position.set(-25, 2, 25);
        scene.add(shelter);
        objects.push(shelter);

        var mastGeo = new THREE.CylinderGeometry(0.4, 0.4, 18, 6);
        var mastMat = new THREE.MeshLambertMaterial({color: 0x1C1C1C});
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(-25, 9, 25);
        scene.add(mast);
        objects.push(mast);

        var domeGeo = new THREE.SphereGeometry(1.2, 8, 8);
        var domeMat = new THREE.MeshLambertMaterial({color: 0xFFA500});
        var dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(-25, 18, 25);
        scene.add(dome);
        objects.push(dome);

        // Kames Bay patrol jetty
        var pierGeo = new THREE.BoxGeometry(10, 2, 3);
        var pierMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var pier = new THREE.Mesh(pierGeo, pierMat);
        pier.position.set(10, 1, -5);
        scene.add(pier);
        objects.push(pier);

        var hullGeo = new THREE.CylinderGeometry(2, 2, 6, 8);
        var hullMat = new THREE.MeshLambertMaterial({color: 0x000080});
        var hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.set(10, 3, -5);
        scene.add(hull);
        objects.push(hull);

        var buoyGeo = new THREE.SphereGeometry(0.7, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({color: 0xFF0000});
        var buoy1 = new THREE.Mesh(buoyGeo, buoyMat);
        buoy1.position.set(5, 0.7, -5);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeo, buoyMat);
        buoy2.position.set(15, 0.7, -5);
        scene.add(buoy2);
        objects.push(buoy2);

        // Lighting
        var ambLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(20, 20, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }
    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                if (i % 3 === 0) objects[i].rotation.y += delta * 0.3;
            }
        }
    }
    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        for (var i = 0; i < lights.length; i++) scene.remove(lights[i]);
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }
    return {init: init, update: update, reset: reset};
}());
