window.FrostCamp = (function() {
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
        var ambientLight = new THREE.AmbientLight(0x7799ff, 0.5);
        lights.push(ambientLight);
        scene.add(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 20);
        lights.push(directionalLight);
        scene.add(directionalLight);

        var snowMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f8ff });
        var iceMaterial = new THREE.MeshLambertMaterial({ color: 0xb0e0e6 });
        var darkIceMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c9e });
        var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

        var iglooGeometry = new THREE.SphereGeometry(8, 16, 16);
        var igloo = new THREE.Mesh(iglooGeometry, snowMaterial);
        igloo.position.set(-20, 4, 10);
        igloo.scale.set(1, 0.9, 1);
        objects.push(igloo);
        scene.add(igloo);

        var iglooDoor = new THREE.CylinderGeometry(2, 2, 3, 8);
        var doorMesh = new THREE.Mesh(iglooDoor, darkIceMaterial);
        doorMesh.position.set(-20, 2, 18);
        doorMesh.rotation.z = Math.PI / 2;
        objects.push(doorMesh);
        scene.add(doorMesh);

        var secondIglooGeometry = new THREE.SphereGeometry(7, 14, 14);
        var igloo2 = new THREE.Mesh(secondIglooGeometry, snowMaterial);
        igloo2.position.set(15, 3.5, -15);
        igloo2.scale.set(1, 0.85, 1);
        objects.push(igloo2);
        scene.add(igloo2);

        var storageBox = new THREE.BoxGeometry(6, 8, 4);
        var storage = new THREE.Mesh(storageBox, woodMaterial);
        storage.position.set(-10, 4, -20);
        objects.push(storage);
        scene.add(storage);

        var iceWallSegments = [
            { x: -28, z: 0, w: 3, h: 15, d: 1 },
            { x: -28, z: 20, w: 3, h: 12, d: 1 },
            { x: 28, z: -5, w: 3, h: 14, d: 1 }
        ];

        for (var i = 0; i < iceWallSegments.length; i++) {
            var seg = iceWallSegments[i];
            var wallGeom = new THREE.BoxGeometry(seg.w, seg.h, seg.d);
            var wall = new THREE.Mesh(wallGeom, iceMaterial);
            wall.position.set(seg.x, seg.h / 2, seg.z);
            objects.push(wall);
            scene.add(wall);
        }

        var supplyCache = new THREE.BoxGeometry(5, 5, 5);
        var cache1 = new THREE.Mesh(supplyCache, darkIceMaterial);
        cache1.position.set(8, 2.5, 18);
        objects.push(cache1);
        scene.add(cache1);

        var cache2 = new THREE.Mesh(supplyCache, darkIceMaterial);
        cache2.position.set(-15, 2.5, 8);
        objects.push(cache2);
        scene.add(cache2);

        var cache3 = new THREE.Mesh(supplyCache, darkIceMaterial);
        cache3.position.set(20, 2.5, -20);
        objects.push(cache3);
        scene.add(cache3);

        var flagpoleGeom = new THREE.CylinderGeometry(0.5, 0.5, 12, 8);
        var flagpole = new THREE.Mesh(flagpoleGeom, metalMaterial);
        flagpole.position.set(0, 6, 0);
        objects.push(flagpole);
        scene.add(flagpole);

        var flagGeom = new THREE.BoxGeometry(4, 2.5, 0.5);
        var flag = new THREE.Mesh(flagGeom, new THREE.MeshLambertMaterial({ color: 0xff6347 }));
        flag.position.set(2.5, 11, 0);
        objects.push(flag);
        scene.add(flag);

        var frostRock1 = new THREE.SphereGeometry(3, 8, 8);
        var rock1 = new THREE.Mesh(frostRock1, iceMaterial);
        rock1.position.set(-22, 1.5, -25);
        objects.push(rock1);
        scene.add(rock1);

        var frostRock2 = new THREE.SphereGeometry(2.5, 8, 8);
        var rock2 = new THREE.Mesh(frostRock2, iceMaterial);
        rock2.position.set(25, 1.2, 10);
        objects.push(rock2);
        scene.add(rock2);

        var frostRock3 = new THREE.SphereGeometry(2, 8, 8);
        var rock3 = new THREE.Mesh(frostRock3, iceMaterial);
        rock3.position.set(10, 1, -28);
        objects.push(rock3);
        scene.add(rock3);

        var equipCone = new THREE.ConeGeometry(3, 6, 8);
        var equipment = new THREE.Mesh(equipCone, metalMaterial);
        equipment.position.set(-5, 3, 25);
        objects.push(equipment);
        scene.add(equipment);

        var equipCone2 = new THREE.ConeGeometry(2.5, 5, 8);
        var equipment2 = new THREE.Mesh(equipCone2, metalMaterial);
        equipment2.position.set(12, 2.5, 3);
        objects.push(equipment2);
        scene.add(equipment2);

        var iceChunk = new THREE.BoxGeometry(7, 3, 9);
        var chunk = new THREE.Mesh(iceChunk, iceMaterial);
        chunk.position.set(-30, 1.5, -8);
        chunk.rotation.z = 0.3;
        objects.push(chunk);
        scene.add(chunk);

        var windChimes = new THREE.CylinderGeometry(1, 1, 4, 6);
        var chimes = new THREE.Mesh(windChimes, metalMaterial);
        chimes.position.set(5, 8, -15);
        objects.push(chimes);
        scene.add(chimes);

        var testMarker = new THREE.SphereGeometry(1, 8, 8);
        var marker = new THREE.Mesh(testMarker, new THREE.MeshLambertMaterial({ color: 0xffff00 }));
        marker.position.set(0, 0.5, -30);
        objects.push(marker);
        scene.add(marker);
    }

    function update(delta) {
        if (objects.length > objects.length - 1) {
            var rotatingObj = objects[objects.length - 2];
            if (rotatingObj) {
                rotatingObj.rotation.y += 0.02;
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

    return { init: init, update: update, reset: reset };
}());
