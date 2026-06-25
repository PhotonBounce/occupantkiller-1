window.PeatDock = (function() {
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
        buildDock();
    }

    function buildDock() {
        // Floating dock platform - main structure (box sections)
        var dockMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var dockGeom1 = new THREE.BoxGeometry(40, 3, 20);
        var dock1 = new THREE.Mesh(dockGeom1, dockMat);
        dock1.position.set(0, 0, 0);
        scene.add(dock1);
        objects.push(dock1);

        var dockGeom2 = new THREE.BoxGeometry(12, 2, 12);
        var dock2 = new THREE.Mesh(dockGeom2, dockMat);
        dock2.position.set(-20, 2, 15);
        scene.add(dock2);
        objects.push(dock2);

        var dockGeom3 = new THREE.BoxGeometry(10, 2, 10);
        var dock3 = new THREE.Mesh(dockGeom3, dockMat);
        dock3.position.set(25, 2, -18);
        scene.add(dock3);
        objects.push(dock3);

        // Peat cutting machines - boxy mechanical contraptions
        var machineMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var machineGeom1 = new THREE.BoxGeometry(8, 12, 6);
        var machine1 = new THREE.Mesh(machineGeom1, machineMat);
        machine1.position.set(-15, 8, -12);
        scene.add(machine1);
        objects.push(machine1);

        var machineGeom2 = new THREE.BoxGeometry(6, 10, 8);
        var machine2 = new THREE.Mesh(machineGeom2, machineMat);
        machine2.position.set(18, 7, 20);
        scene.add(machine2);
        objects.push(machine2);

        var machineGeom3 = new THREE.BoxGeometry(7, 9, 7);
        var machine3 = new THREE.Mesh(machineGeom3, machineMat);
        machine3.position.set(-28, 6, 5);
        scene.add(machine3);
        objects.push(machine3);

        // Bog iron smelting furnace - cylinder base with cone top
        var furnaceMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var furnaceGeom1 = new THREE.CylinderGeometry(6, 8, 14, 16);
        var furnace1 = new THREE.Mesh(furnaceGeom1, furnaceMat);
        furnace1.position.set(10, 10, -20);
        scene.add(furnace1);
        objects.push(furnace1);

        var coneGeom = new THREE.ConeGeometry(7, 8, 16);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var cone1 = new THREE.Mesh(coneGeom, coneMat);
        cone1.position.set(10, 25, -20);
        scene.add(cone1);
        objects.push(cone1);

        // Sphere glow for smelting heat
        var sphereGeom = new THREE.SphereGeometry(3, 16, 16);
        var sphereMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
        var sphere1 = new THREE.Mesh(sphereGeom, sphereMat);
        sphere1.position.set(10, 30, -20);
        scene.add(sphere1);
        objects.push(sphere1);

        // Ancient preserved weapons display - various geometries
        var weaponMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var weaponGeom1 = new THREE.BoxGeometry(2, 10, 1);
        var weapon1 = new THREE.Mesh(weaponGeom1, weaponMat);
        weapon1.position.set(-10, 5, 25);
        weapon1.rotation.z = Math.PI / 6;
        scene.add(weapon1);
        objects.push(weapon1);

        var weaponGeom2 = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        var weapon2 = new THREE.Mesh(weaponGeom2, weaponMat);
        weapon2.position.set(-5, 6, 27);
        scene.add(weapon2);
        objects.push(weapon2);

        var weaponGeom3 = new THREE.ConeGeometry(1, 6, 12);
        var weapon3 = new THREE.Mesh(weaponGeom3, weaponMat);
        weapon3.position.set(0, 5, 25);
        scene.add(weapon3);
        objects.push(weapon3);

        // Camouflaged IED caches in peat bricks
        var peabrickMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var peabrickGeom1 = new THREE.BoxGeometry(15, 4, 10);
        var peabrick1 = new THREE.Mesh(peabrickGeom1, peabrickMat);
        peabrick1.position.set(-30, 2, -25);
        scene.add(peabrick1);
        objects.push(peabrick1);

        var peabrickGeom2 = new THREE.BoxGeometry(12, 3, 8);
        var peabrick2 = new THREE.Mesh(peabrickGeom2, peabrickMat);
        peabrick2.position.set(32, 2, -10);
        scene.add(peabrick2);
        objects.push(peabrick2);

        var peabrickGeom3 = new THREE.BoxGeometry(10, 3, 12);
        var peabrick3 = new THREE.Mesh(peabrickGeom3, peabrickMat);
        peabrick3.position.set(5, 2, -28);
        scene.add(peabrick3);
        objects.push(peabrick3);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Point light for furnace glow
        var pointLight = new THREE.PointLight(0xFF8800, 1.2, 50);
        pointLight.position.set(10, 30, -20);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    objects[i].rotation.y += delta * 0.1;
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
