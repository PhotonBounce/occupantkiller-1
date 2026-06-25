window.CragBase = (function() {
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
        // Jagged rock formations - irregular box clusters
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        // Central crag cluster 1
        var rock1 = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 6), rockMat);
        rock1.position.set(-25, 6, -20);
        rock1.rotation.z = 0.3;
        scene.add(rock1);
        objects.push(rock1);

        // Central crag cluster 2
        var rock2 = new THREE.Mesh(new THREE.BoxGeometry(6, 10, 8), rockMat);
        rock2.position.set(-18, 5, -15);
        rock2.rotation.x = 0.2;
        scene.add(rock2);
        objects.push(rock2);

        // Central crag cluster 3
        var rock3 = new THREE.Mesh(new THREE.BoxGeometry(7, 11, 7), rockMat);
        rock3.position.set(-12, 5.5, -22);
        rock3.rotation.z = -0.25;
        scene.add(rock3);
        objects.push(rock3);

        // Cliff-edge gun emplacement 1 - cylindrical base
        var gunBase1 = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 2, 8), rockMat);
        gunBase1.position.set(5, 1, 10);
        scene.add(gunBase1);
        objects.push(gunBase1);

        // Gun emplacement support column 1
        var gunCol1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 6), new THREE.MeshLambertMaterial({ color: 0x696969 }));
        gunCol1.position.set(5, 5, 10);
        scene.add(gunCol1);
        objects.push(gunCol1);

        // Cliff-edge gun emplacement 2
        var gunBase2 = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 2, 8), rockMat);
        gunBase2.position.set(20, 1, 5);
        scene.add(gunBase2);
        objects.push(gunBase2);

        // Gun emplacement support column 2
        var gunCol2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 7, 6), new THREE.MeshLambertMaterial({ color: 0x696969 }));
        gunCol2.position.set(20, 4.5, 5);
        scene.add(gunCol2);
        objects.push(gunCol2);

        // Cave entrance 1 - dark rocky cone
        var cave1 = new THREE.Mesh(new THREE.ConeGeometry(5, 6, 8), new THREE.MeshLambertMaterial({ color: 0x4A4A4A }));
        cave1.position.set(-30, 3, 10);
        cave1.rotation.z = Math.PI / 2;
        scene.add(cave1);
        objects.push(cave1);

        // Cave entrance 2
        var cave2 = new THREE.Mesh(new THREE.ConeGeometry(4, 5, 8), new THREE.MeshLambertMaterial({ color: 0x3D3D3D }));
        cave2.position.set(25, 2.5, -25);
        cave2.rotation.z = Math.PI / 2;
        scene.add(cave2);
        objects.push(cave2);

        // Supply drop pod 1 - sphere
        var supply1 = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), new THREE.MeshLambertMaterial({ color: 0xFF6B00 }));
        supply1.position.set(-5, 2, 20);
        scene.add(supply1);
        objects.push(supply1);

        // Supply drop pod 2
        var supply2 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), new THREE.MeshLambertMaterial({ color: 0xFF8C00 }));
        supply2.position.set(15, 1.5, -10);
        scene.add(supply2);
        objects.push(supply2);

        // Rope bridge support 1 - vertical box
        var bridgePost1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 10, 1.5), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
        bridgePost1.position.set(-15, 5, 0);
        scene.add(bridgePost1);
        objects.push(bridgePost1);

        // Rope bridge support 2 - vertical box
        var bridgePost2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 10, 1.5), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
        bridgePost2.position.set(10, 5, 0);
        scene.add(bridgePost2);
        objects.push(bridgePost2);

        // Rope bridge cable - LineSegments
        var bridgeGeom = new THREE.BufferGeometry();
        var bridgePoints = [
            new THREE.Vector3(-15, 10, 0),
            new THREE.Vector3(10, 10, 0),
            new THREE.Vector3(-15, 9, 2),
            new THREE.Vector3(10, 9, 2)
        ];
        bridgeGeom.setFromPoints(bridgePoints);
        var bridgeMat = new THREE.LineBasicMaterial({ color: 0xA0522D, linewidth: 3 });
        var bridgeLines = new THREE.LineSegments(bridgeGeom, bridgeMat);
        scene.add(bridgeLines);
        objects.push(bridgeLines);

        // Observation tower - cylindrical structure
        var tower = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 12, 8), new THREE.MeshLambertMaterial({ color: 0x555555 }));
        tower.position.set(-8, 6, -8);
        scene.add(tower);
        objects.push(tower);

        // Ammunition storage box 1
        var ammoBox1 = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 5), new THREE.MeshLambertMaterial({ color: 0x2F4F2F }));
        ammoBox1.position.set(0, 1.5, -18);
        scene.add(ammoBox1);
        objects.push(ammoBox1);

        // Ammunition storage box 2
        var ammoBox2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.5, 4), new THREE.MeshLambertMaterial({ color: 0x3D5F3D }));
        ammoBox2.position.set(12, 1.25, 15);
        scene.add(ammoBox2);
        objects.push(ammoBox2);

        // Radar dome - sphere on pedestal
        var radarDome = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 12), new THREE.MeshLambertMaterial({ color: 0xDCDCDC }));
        radarDome.position.set(-20, 9, 5);
        scene.add(radarDome);
        objects.push(radarDome);

        // Radar pedestal
        var radarPed = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.5, 4, 6), new THREE.MeshLambertMaterial({ color: 0x696969 }));
        radarPed.position.set(-20, 2, 5);
        scene.add(radarPed);
        objects.push(radarPed);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 20, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects
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
