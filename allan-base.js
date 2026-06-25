window.AllanBase = (function() {
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
        // Farming valley box terrain
        var terrainGeom = new THREE.BoxGeometry(80, 2, 80);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x4a5c2a });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -1, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Converted distillery HQ - main box building
        var distilleryGeom = new THREE.BoxGeometry(20, 15, 16);
        var distilleryMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        var distillery = new THREE.Mesh(distilleryGeom, distilleryMat);
        distillery.position.set(-25, 7.5, 10);
        scene.add(distillery);
        objects.push(distillery);

        // Distillery pot still 1 - cylinder
        var potStill1Geom = new THREE.CylinderGeometry(2.5, 2.5, 12, 16);
        var potStillMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var potStill1 = new THREE.Mesh(potStill1Geom, potStillMat);
        potStill1.position.set(-30, 6, 5);
        scene.add(potStill1);
        objects.push(potStill1);

        // Distillery pot still 2 - cylinder
        var potStill2 = new THREE.Mesh(potStill1Geom, potStillMat);
        potStill2.position.set(-20, 6, 5);
        scene.add(potStill2);
        objects.push(potStill2);

        // Grain store ammunition depot - main barn
        var grainStoreGeom = new THREE.BoxGeometry(24, 12, 28);
        var grainStoreMat = new THREE.MeshLambertMaterial({ color: 0x7a6b5d });
        var grainStore = new THREE.Mesh(grainStoreGeom, grainStoreMat);
        grainStore.position.set(20, 6, -15);
        scene.add(grainStore);
        objects.push(grainStore);

        // Ammunition crates - box stack 1
        var crateGeom = new THREE.BoxGeometry(4, 4, 4);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        var crate1 = new THREE.Mesh(crateGeom, crateMat);
        crate1.position.set(15, 2, -20);
        scene.add(crate1);
        objects.push(crate1);

        // Ammunition crates - box stack 2
        var crate2 = new THREE.Mesh(crateGeom, crateMat);
        crate2.position.set(25, 2, -20);
        scene.add(crate2);
        objects.push(crate2);

        // River mill fortification - box mill building
        var millGeom = new THREE.BoxGeometry(16, 10, 14);
        var millMat = new THREE.MeshLambertMaterial({ color: 0x9b8b7e });
        var mill = new THREE.Mesh(millGeom, millMat);
        mill.position.set(-15, 5, -20);
        scene.add(mill);
        objects.push(mill);

        // Mill waterwheel - cylinder side-on
        var waterwheelGeom = new THREE.CylinderGeometry(6, 6, 1, 16);
        var waterwheelMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        var waterwheel = new THREE.Mesh(waterwheelGeom, waterwheelMat);
        waterwheel.rotation.z = Math.PI / 2;
        waterwheel.position.set(-8, 5, -20);
        scene.add(waterwheel);
        objects.push(waterwheel);

        // Road viaduct defense - box viaduct arch
        var viaductGeom = new THREE.BoxGeometry(40, 3, 6);
        var viaductMat = new THREE.MeshLambertMaterial({ color: 0xaabbcc });
        var viaduct = new THREE.Mesh(viaductGeom, viaductMat);
        viaduct.position.set(0, 12, 25);
        scene.add(viaduct);
        objects.push(viaduct);

        // Viaduct pier 1 - cylinder
        var pierGeom = new THREE.CylinderGeometry(1.5, 1.5, 10, 12);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var pier1 = new THREE.Mesh(pierGeom, pierMat);
        pier1.position.set(-15, 5, 25);
        scene.add(pier1);
        objects.push(pier1);

        // Viaduct pier 2 - cylinder
        var pier2 = new THREE.Mesh(pierGeom, pierMat);
        pier2.position.set(15, 5, 25);
        scene.add(pier2);
        objects.push(pier2);

        // Home Guard pillbox - small box with slit
        var pillboxGeom = new THREE.BoxGeometry(6, 5, 6);
        var pillboxMat = new THREE.MeshLambertMaterial({ color: 0x4a5c2a });
        var pillbox = new THREE.Mesh(pillboxGeom, pillboxMat);
        pillbox.position.set(30, 2.5, 0);
        scene.add(pillbox);
        objects.push(pillbox);

        // Pillbox camouflage boulder 1 - sphere
        var boulderGeom = new THREE.SphereGeometry(2.5, 12, 12);
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });
        var boulder1 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder1.position.set(32, 3, 3);
        scene.add(boulder1);
        objects.push(boulder1);

        // Pillbox camouflage boulder 2 - sphere
        var boulder2 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder2.position.set(28, 3, -3);
        scene.add(boulder2);
        objects.push(boulder2);

        // Communications cable trench - LineSegments cable run
        var cablePoints = [];
        cablePoints.push(new THREE.Vector3(-20, 1, -5));
        cablePoints.push(new THREE.Vector3(-10, 1, -10));
        cablePoints.push(new THREE.Vector3(0, 1, -12));
        cablePoints.push(new THREE.Vector3(10, 1, -10));
        cablePoints.push(new THREE.Vector3(20, 1, -5));
        var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableMat = new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 2 });
        var cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Cable junction box - box
        var junctionGeom = new THREE.BoxGeometry(3, 3, 3);
        var junctionMat = new THREE.MeshLambertMaterial({ color: 0xcc6600 });
        var junction = new THREE.Mesh(junctionGeom, junctionMat);
        junction.position.set(0, 2, -12);
        scene.add(junction);
        objects.push(junction);

        // Air-raid shelter mound - box bermed structure
        var shelterGeom = new THREE.BoxGeometry(18, 8, 20);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x3a4a2a });
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(-30, 4, -30);
        scene.add(shelter);
        objects.push(shelter);

        // Air-raid shelter entrance - cylinder
        var entranceGeom = new THREE.CylinderGeometry(2, 2, 4, 12);
        var entranceMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var entrance = new THREE.Mesh(entranceGeom, entranceMat);
        entrance.rotation.z = Math.PI / 2;
        entrance.position.set(-30, 4, -25);
        scene.add(entrance);
        objects.push(entrance);

        // Cone structure for variety - lookout post
        var lookoutGeom = new THREE.ConeGeometry(2, 6, 12);
        var lookoutMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var lookout = new THREE.Mesh(lookoutGeom, lookoutMat);
        lookout.position.set(5, 3, 15);
        scene.add(lookout);
        objects.push(lookout);

        // Additional sphere for guard post
        var guardGeom = new THREE.SphereGeometry(1.8, 10, 10);
        var guardMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var guard = new THREE.Mesh(guardGeom, guardMat);
        guard.position.set(-5, 1, 20);
        scene.add(guard);
        objects.push(guard);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Rotate waterwheel for animation
        if (objects.length > 8 && objects[8]) {
            objects[8].rotation.z += delta * 0.5;
        }
        // Pulse cable visibility subtly
        if (objects.length > 16 && objects[16]) {
            objects[16].material.opacity = 0.7 + Math.sin(Date.now() * 0.001) * 0.2;
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

    return { init: init, update: update, reset: reset };
}());
