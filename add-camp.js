window.AddCamp = (function() {
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
        buildCamp();
    }

    function buildCamp() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 40, 50);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var bogTerrainGeom = new THREE.BoxGeometry(80, 4, 60);
        var bogMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var bogTerrain = new THREE.Mesh(bogTerrainGeom, bogMaterial);
        bogTerrain.position.set(0, -2, 0);
        scene.add(bogTerrain);
        objects.push(bogTerrain);

        var dunadd1Geom = new THREE.BoxGeometry(16, 8, 16);
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var dunadd1 = new THREE.Mesh(dunadd1Geom, stoneMaterial);
        dunadd1.position.set(0, 2, 0);
        scene.add(dunadd1);
        objects.push(dunadd1);

        var dunadd2Geom = new THREE.BoxGeometry(14, 6, 14);
        var dunadd2 = new THREE.Mesh(dunadd2Geom, stoneMaterial);
        dunadd2.position.set(1, 8, 1);
        scene.add(dunadd2);
        objects.push(dunadd2);

        var dunTowerGeom = new THREE.CylinderGeometry(3, 3.5, 12, 8);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var dunTower = new THREE.Mesh(dunTowerGeom, towerMaterial);
        dunTower.position.set(0, 14, 0);
        scene.add(dunTower);
        objects.push(dunTower);

        var duckboard1Geom = new THREE.BoxGeometry(6, 0.5, 24);
        var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var duckboard1 = new THREE.Mesh(duckboard1Geom, woodMaterial);
        duckboard1.position.set(-15, 0, -10);
        duckboard1.rotation.z = 0.2;
        scene.add(duckboard1);
        objects.push(duckboard1);

        var duckboard2Geom = new THREE.BoxGeometry(6, 0.5, 24);
        var duckboard2 = new THREE.Mesh(duckboard2Geom, woodMaterial);
        duckboard2.position.set(15, 0, 10);
        duckboard2.rotation.z = -0.2;
        scene.add(duckboard2);
        objects.push(duckboard2);

        var chargeGeom = new THREE.SphereGeometry(1.5, 6, 6);
        var chargeMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var charge1 = new THREE.Mesh(chargeGeom, chargeMaterial);
        charge1.position.set(-20, 1, -15);
        scene.add(charge1);
        objects.push(charge1);

        var charge2 = new THREE.Mesh(chargeGeom, chargeMaterial);
        charge2.position.set(-10, 1, -20);
        scene.add(charge2);
        objects.push(charge2);

        var wireGeom = new THREE.BufferGeometry();
        var wireVerts = new Float32Array([
            -20, 1.5, -15,
            -10, 1.5, -20
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wireVerts, 3));
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
        var triggerWire = new THREE.LineSegments(wireGeom, wireMaterial);
        scene.add(triggerWire);
        objects.push(triggerWire);

        var ammoCacheGeom = new THREE.BoxGeometry(8, 3, 8);
        var ammoCacheMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var ammoCache = new THREE.Mesh(ammoCacheGeom, ammoCacheMaterial);
        ammoCache.position.set(25, 0.5, -20);
        scene.add(ammoCache);
        objects.push(ammoCache);

        var peatClod1Geom = new THREE.SphereGeometry(2, 8, 8);
        var peatMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        var peatClod1 = new THREE.Mesh(peatClod1Geom, peatMaterial);
        peatClod1.position.set(25, 2, -20);
        scene.add(peatClod1);
        objects.push(peatClod1);

        var sandbag1Geom = new THREE.BoxGeometry(6, 1.2, 2);
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var sandbag1 = new THREE.Mesh(sandbag1Geom, sandbagMaterial);
        sandbag1.position.set(-30, 1.5, 20);
        scene.add(sandbag1);
        objects.push(sandbag1);

        var sandbag2Geom = new THREE.BoxGeometry(6, 1.2, 2);
        var sandbag2 = new THREE.Mesh(sandbag2Geom, sandbagMaterial);
        sandbag2.position.set(30, 1.5, 20);
        scene.add(sandbag2);
        objects.push(sandbag2);

        var hideGeom = new THREE.BoxGeometry(5, 4, 5);
        var hideMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var hide = new THREE.Mesh(hideGeom, hideMaterial);
        hide.position.set(-25, 2, 0);
        scene.add(hide);
        objects.push(hide);

        var scopeBarrelGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 6);
        var scopeMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var scopeBarrel = new THREE.Mesh(scopeBarrelGeom, scopeMaterial);
        scopeBarrel.position.set(-25, 5, 1);
        scopeBarrel.rotation.z = 0.3;
        scene.add(scopeBarrel);
        objects.push(scopeBarrel);

        var mastGeom = new THREE.CylinderGeometry(0.8, 0.8, 24, 8);
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var mast = new THREE.Mesh(mastGeom, mastMaterial);
        mast.position.set(28, 12, -10);
        scene.add(mast);
        objects.push(mast);

        var beaconGeom = new THREE.ConeGeometry(2, 3, 8);
        var beaconMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var beacon = new THREE.Mesh(beaconGeom, beaconMaterial);
        beacon.position.set(28, 26, -10);
        scene.add(beacon);
        objects.push(beacon);

        var guyWireGeom = new THREE.BufferGeometry();
        var guyVerts = new Float32Array([
            28, 24, -10,
            20, 18, -5,
            28, 24, -10,
            35, 18, -15
        ]);
        guyWireGeom.setAttribute('position', new THREE.BufferAttribute(guyVerts, 3));
        var guyWireMaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 });
        var guyWire = new THREE.LineSegments(guyWireGeom, guyWireMaterial);
        scene.add(guyWire);
        objects.push(guyWire);
    }

    function update(delta) {
        if (objects && objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    objects[i].rotation.y += 0.001;
                }
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
