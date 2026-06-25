window.CoveBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        // Rocky cliff walls - tall stacked boxes
        var cliffGeom1 = new THREE.BoxGeometry(8, 25, 6);
        var cliffMat1 = new THREE.MeshLambertMaterial({ color: 0x6B5D54 });
        var cliff1 = new THREE.Mesh(cliffGeom1, cliffMat1);
        cliff1.position.set(-28, 12, -20);
        scene.add(cliff1);
        objects.push(cliff1);

        var cliffGeom2 = new THREE.BoxGeometry(6, 28, 5);
        var cliffMat2 = new THREE.MeshLambertMaterial({ color: 0x7A6B60 });
        var cliff2 = new THREE.Mesh(cliffGeom2, cliffMat2);
        cliff2.position.set(-20, 14, -22);
        scene.add(cliff2);
        objects.push(cliff2);

        var cliffGeom3 = new THREE.BoxGeometry(7, 30, 6);
        var cliffMat3 = new THREE.MeshLambertMaterial({ color: 0x8B7D6F });
        var cliff3 = new THREE.Mesh(cliffGeom3, cliffMat3);
        cliff3.position.set(25, 15, -18);
        scene.add(cliff3);
        objects.push(cliff3);

        // Camouflaged submarine pen - long box tunnel mouth
        var penGeom = new THREE.BoxGeometry(18, 12, 16);
        var penMat = new THREE.MeshLambertMaterial({ color: 0x556B3C });
        var pen = new THREE.Mesh(penGeom, penMat);
        pen.position.set(0, 8, -8);
        scene.add(pen);
        objects.push(pen);

        var penDoorGeom = new THREE.BoxGeometry(16, 11, 2);
        var penDoorMat = new THREE.MeshLambertMaterial({ color: 0x4A5530 });
        var penDoor = new THREE.Mesh(penDoorGeom, penDoorMat);
        penDoor.position.set(0, 8, 2);
        scene.add(penDoor);
        objects.push(penDoor);

        // Sea mine storage racks - sphere arrays
        var mineGeom1 = new THREE.SphereGeometry(2.5, 16, 16);
        var mineMat1 = new THREE.MeshLambertMaterial({ color: 0x2C2C2C });
        var mine1 = new THREE.Mesh(mineGeom1, mineMat1);
        mine1.position.set(-15, 5, 8);
        scene.add(mine1);
        objects.push(mine1);

        var mineGeom2 = new THREE.SphereGeometry(2.5, 16, 16);
        var mineMat2 = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var mine2 = new THREE.Mesh(mineGeom2, mineMat2);
        mine2.position.set(-8, 5, 10);
        scene.add(mine2);
        objects.push(mine2);

        var mineGeom3 = new THREE.SphereGeometry(2.5, 16, 16);
        var mineMat3 = new THREE.MeshLambertMaterial({ color: 0x2C2C2C });
        var mine3 = new THREE.Mesh(mineGeom3, mineMat3);
        mine3.position.set(-1, 5, 12);
        scene.add(mine3);
        objects.push(mine3);

        var mineGeom4 = new THREE.SphereGeometry(2.5, 16, 16);
        var mineMat4 = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var mine4 = new THREE.Mesh(mineGeom4, mineMat4);
        mine4.position.set(6, 5, 9);
        scene.add(mine4);
        objects.push(mine4);

        // Torpedo launch ramp - angled box
        var rampGeom = new THREE.BoxGeometry(6, 3, 20);
        var rampMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var ramp = new THREE.Mesh(rampGeom, rampMat);
        ramp.position.set(15, 4, 5);
        ramp.rotation.z = 0.3;
        scene.add(ramp);
        objects.push(ramp);

        // Coastal artillery emplacement - cylinder base with box structure
        var artilleryBaseGeom = new THREE.CylinderGeometry(6, 7, 2, 32);
        var artilleryBaseMat = new THREE.MeshLambertMaterial({ color: 0x6B5D54 });
        var artilleryBase = new THREE.Mesh(artilleryBaseGeom, artilleryBaseMat);
        artilleryBase.position.set(-8, 1, -28);
        scene.add(artilleryBase);
        objects.push(artilleryBase);

        var bunkerGeom = new THREE.BoxGeometry(8, 6, 8);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x704D31 });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(-8, 5, -28);
        scene.add(bunker);
        objects.push(bunker);

        var gunGeom = new THREE.CylinderGeometry(1.2, 1, 14, 16);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var gun = new THREE.Mesh(gunGeom, gunMat);
        gun.position.set(-8, 11, -28);
        gun.rotation.z = 0.4;
        scene.add(gun);
        objects.push(gun);

        // Radar cone structure
        var radarGeom = new THREE.ConeGeometry(3.5, 8, 16);
        var radarMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var radar = new THREE.Mesh(radarGeom, radarMat);
        radar.position.set(20, 10, -15);
        scene.add(radar);
        objects.push(radar);

        // Ammunition storage crate
        var crateGeom = new THREE.BoxGeometry(5, 4, 5);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
        var crate = new THREE.Mesh(crateGeom, crateMat);
        crate.position.set(-2, 2, 20);
        scene.add(crate);
        objects.push(crate);

        // Fuel tank cylinder
        var tankGeom = new THREE.CylinderGeometry(2.5, 2.5, 10, 16);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0xCC6633 });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(12, 5, 15);
        scene.add(tank);
        objects.push(tank);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 25, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects if needed
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.05;
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
