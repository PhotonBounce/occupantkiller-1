window.GillDock = (function() {
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
        // Dock platform stilts and platform
        var stiltGeom = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
        var stiltMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });

        var stilt1 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt1.position.set(-20, 0, -15);
        scene.add(stilt1);
        objects.push(stilt1);

        var stilt2 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt2.position.set(20, 0, -15);
        scene.add(stilt2);
        objects.push(stilt2);

        var stilt3 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt3.position.set(-20, 0, 10);
        scene.add(stilt3);
        objects.push(stilt3);

        var stilt4 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt4.position.set(20, 0, 10);
        scene.add(stilt4);
        objects.push(stilt4);

        // Main dock platform
        var platformGeom = new THREE.BoxGeometry(45, 3, 30);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(0, 10, -2);
        scene.add(platform);
        objects.push(platform);

        // Rope ferry drum system
        var drumGeom = new THREE.CylinderGeometry(3, 3, 8, 16);
        var drumMat = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
        var drum = new THREE.Mesh(drumGeom, drumMat);
        drum.position.set(-25, 12, 20);
        drum.rotation.z = Math.PI / 2;
        scene.add(drum);
        objects.push(drum);

        // Rope ferry cable (LineSegments)
        var cableGeom = new THREE.BufferGeometry();
        var cablePos = new Float32Array([
            -25, 12, 20,
            -25, 12, -25,
            25, 12, -25,
            25, 12, 20
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePos, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 2 });
        var cableLines = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cableLines);
        objects.push(cableLines);

        // Watermill building (box)
        var millGeom = new THREE.BoxGeometry(12, 10, 10);
        var millMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        var mill = new THREE.Mesh(millGeom, millMat);
        mill.position.set(15, 5, 25);
        scene.add(mill);
        objects.push(mill);

        // Watermill wheel (cylinder)
        var wheelGeom = new THREE.CylinderGeometry(4, 4, 1, 32);
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(15, 5, 30);
        wheel.rotation.z = Math.PI / 4;
        scene.add(wheel);
        objects.push(wheel);

        // Flash flood warning tower (stacked cylinders and cone)
        var towerBaseGeom = new THREE.CylinderGeometry(2, 2.5, 15, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0xcd5c5c });
        var towerBase = new THREE.Mesh(towerBaseGeom, towerMat);
        towerBase.position.set(-28, 7, -20);
        scene.add(towerBase);
        objects.push(towerBase);

        var towerTopGeom = new THREE.ConeGeometry(1.8, 6, 8);
        var towerTopMat = new THREE.MeshLambertMaterial({ color: 0xff6347 });
        var towerTop = new THREE.Mesh(towerTopGeom, towerTopMat);
        towerTop.position.set(-28, 19, -20);
        scene.add(towerTop);
        objects.push(towerTop);

        // Mountain rescue cache hut (box structure)
        var hutGeom = new THREE.BoxGeometry(8, 7, 10);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(28, 3, -15);
        scene.add(hut);
        objects.push(hut);

        // Hut roof (cone)
        var roofGeom = new THREE.ConeGeometry(5, 5, 4);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var roof = new THREE.Mesh(roofGeom, roofMat);
        roof.position.set(28, 10.5, -15);
        scene.add(roof);
        objects.push(roof);

        // Supply boxes (small boxes around hut)
        var boxGeom = new THREE.BoxGeometry(2, 2, 2);
        var boxMat = new THREE.MeshLambertMaterial({ color: 0xffa500 });

        var box1 = new THREE.Mesh(boxGeom, boxMat);
        box1.position.set(24, 1, -18);
        scene.add(box1);
        objects.push(box1);

        var box2 = new THREE.Mesh(boxGeom, boxMat);
        box2.position.set(32, 1, -18);
        scene.add(box2);
        objects.push(box2);

        // Stream water sphere (decorative)
        var waterGeom = new THREE.SphereGeometry(2, 16, 12);
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x4da6ff });
        var water = new THREE.Mesh(waterGeom, waterMat);
        water.position.set(-5, -5, 0);
        scene.add(water);
        objects.push(water);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (sunlight)
        var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(30, 40, 30);
        scene.add(sunLight);
        lights.push(sunLight);
    }

    function update(delta) {
        if (objects.length > 0 && objects[8]) {
            objects[8].rotation.y += delta * 0.5;
        }
        if (objects.length > 0 && objects[10]) {
            objects[10].rotation.z += delta * 0.3;
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
