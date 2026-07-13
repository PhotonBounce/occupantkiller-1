window.GritDock = (function() {
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
        // Grit storage silo - tall cylinder
        var siloGeom = new THREE.CylinderGeometry(4, 4, 16, 8);
        var siloMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var silo = new THREE.Mesh(siloGeom, siloMat);
        silo.position.set(-25, 8, -20);
        scene.add(silo);
        objects.push(silo);

        // Sand blasting tank 1
        var tank1Geom = new THREE.CylinderGeometry(3.5, 3.5, 10, 8);
        var tank1Mat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var tank1 = new THREE.Mesh(tank1Geom, tank1Mat);
        tank1.position.set(-15, 5, -15);
        scene.add(tank1);
        objects.push(tank1);

        // Sand blasting tank 2
        var tank2Geom = new THREE.CylinderGeometry(3.5, 3.5, 10, 8);
        var tank2Mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var tank2 = new THREE.Mesh(tank2Geom, tank2Mat);
        tank2.position.set(-10, 5, 5);
        scene.add(tank2);
        objects.push(tank2);

        // Pipe segment 1 - connecting tanks
        var pipe1Geom = new THREE.CylinderGeometry(0.8, 0.8, 12, 6);
        var pipe1Mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var pipe1 = new THREE.Mesh(pipe1Geom, pipe1Mat);
        pipe1.position.set(-12, 8, -5);
        pipe1.rotation.z = Math.PI / 4;
        scene.add(pipe1);
        objects.push(pipe1);

        // Grinding machine building 1 - box
        var building1Geom = new THREE.BoxGeometry(8, 6, 8);
        var building1Mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var building1 = new THREE.Mesh(building1Geom, building1Mat);
        building1.position.set(8, 3, 12);
        scene.add(building1);
        objects.push(building1);

        // Grinding machine building 2 - box
        var building2Geom = new THREE.BoxGeometry(6, 5, 6);
        var building2Mat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var building2 = new THREE.Mesh(building2Geom, building2Mat);
        building2.position.set(20, 2.5, 8);
        scene.add(building2);
        objects.push(building2);

        // Metal scrap heap 1 - irregular pile with boxes
        var scrap1aGeom = new THREE.BoxGeometry(6, 4, 5);
        var scrap1aMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var scrap1a = new THREE.Mesh(scrap1aGeom, scrap1aMat);
        scrap1a.position.set(15, 2, -18);
        scrap1a.rotation.y = 0.3;
        scene.add(scrap1a);
        objects.push(scrap1a);

        // Metal scrap heap 2 - sphere atop box
        var scrap2Geom = new THREE.SphereGeometry(3, 8, 8);
        var scrap2Mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var scrap2 = new THREE.Mesh(scrap2Geom, scrap2Mat);
        scrap2.position.set(22, 4, -10);
        scene.add(scrap2);
        objects.push(scrap2);

        // Industrial barge 1 - large elongated box
        var barge1Geom = new THREE.BoxGeometry(16, 3, 8);
        var barge1Mat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var barge1 = new THREE.Mesh(barge1Geom, barge1Mat);
        barge1.position.set(5, 1.5, -28);
        scene.add(barge1);
        objects.push(barge1);

        // Industrial barge 2
        var barge2Geom = new THREE.BoxGeometry(12, 3, 7);
        var barge2Mat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var barge2 = new THREE.Mesh(barge2Geom, barge2Mat);
        barge2.position.set(-8, 1.5, 22);
        scene.add(barge2);
        objects.push(barge2);

        // Cone-shaped hopper 1
        var hopper1Geom = new THREE.ConeGeometry(2.5, 5, 8);
        var hopper1Mat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var hopper1 = new THREE.Mesh(hopper1Geom, hopper1Mat);
        hopper1.position.set(28, 2.5, 15);
        scene.add(hopper1);
        objects.push(hopper1);

        // Cone-shaped hopper 2
        var hopper2Geom = new THREE.ConeGeometry(2, 4, 8);
        var hopper2Mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var hopper2 = new THREE.Mesh(hopper2Geom, hopper2Mat);
        hopper2.position.set(-20, 2, 18);
        scene.add(hopper2);
        objects.push(hopper2);

        // Metal scrap pile - mixed geometry
        var scrap3Geom = new THREE.BoxGeometry(4, 3, 4);
        var scrap3Mat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var scrap3 = new THREE.Mesh(scrap3Geom, scrap3Mat);
        scrap3.position.set(30, 1.5, -5);
        scrap3.rotation.z = 0.2;
        scene.add(scrap3);
        objects.push(scrap3);

        // Storage tank base - cylindrical
        var storageGeom = new THREE.CylinderGeometry(2.5, 2.5, 6, 8);
        var storageMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var storage = new THREE.Mesh(storageGeom, storageMat);
        storage.position.set(-30, 3, 10);
        scene.add(storage);
        objects.push(storage);

        // Platform support - horizontal cylinder
        var platformGeom = new THREE.CylinderGeometry(0.6, 0.6, 20, 6);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(0, 6, 0);
        platform.rotation.z = Math.PI / 2;
        scene.add(platform);
        objects.push(platform);

        // Crane support beam - vertical cylinder
        var craneGeom = new THREE.CylinderGeometry(0.5, 0.5, 14, 6);
        var craneMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var crane = new THREE.Mesh(craneGeom, craneMat);
        crane.position.set(25, 7, 25);
        scene.add(crane);
        objects.push(crane);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light for industrial feel
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(30, 20, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Gentle rotation for some elements to show they're operational
        if (objects.length > 0) {
            objects[0].rotation.y += delta * 0.2;
        }
        if (objects.length > 1) {
            objects[1].rotation.x += delta * 0.15;
        }
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (i = 0; i < lights.length; i++) {
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
