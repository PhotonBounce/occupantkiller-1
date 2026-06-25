window.MudGate = (function() {
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
        buildGate();
    }

    function buildGate() {
        // Main mud wall - left side
        var wallLeftGeom = new THREE.BoxGeometry(8, 12, 3);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var wallLeft = new THREE.Mesh(wallLeftGeom, wallMat);
        wallLeft.position.set(-20, 6, 0);
        wallLeft.castShadow = true;
        wallLeft.receiveShadow = true;
        scene.add(wallLeft);
        objects.push(wallLeft);

        // Main mud wall - right side
        var wallRightGeom = new THREE.BoxGeometry(8, 12, 3);
        var wallRight = new THREE.Mesh(wallRightGeom, wallMat);
        wallRight.position.set(20, 6, 0);
        wallRight.castShadow = true;
        wallRight.receiveShadow = true;
        scene.add(wallRight);
        objects.push(wallRight);

        // Gate frame - top horizontal beam
        var gateTopGeom = new THREE.BoxGeometry(10, 1, 2);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        var gateTop = new THREE.Mesh(gateTopGeom, gateMat);
        gateTop.position.set(0, 10, -2);
        gateTop.castShadow = true;
        gateTop.receiveShadow = true;
        scene.add(gateTop);
        objects.push(gateTop);

        // Gate frame - left vertical beam
        var gateLeftGeom = new THREE.BoxGeometry(1, 9, 2);
        var gateLeft = new THREE.Mesh(gateLeftGeom, gateMat);
        gateLeft.position.set(-5, 5, -2);
        gateLeft.castShadow = true;
        gateLeft.receiveShadow = true;
        scene.add(gateLeft);
        objects.push(gateLeft);

        // Gate frame - right vertical beam
        var gateRightGeom = new THREE.BoxGeometry(1, 9, 2);
        var gateRight = new THREE.Mesh(gateRightGeom, gateMat);
        gateRight.position.set(5, 5, -2);
        gateRight.castShadow = true;
        gateRight.receiveShadow = true;
        scene.add(gateRight);
        objects.push(gateRight);

        // Guard post - left tower
        var guardLeftGeom = new THREE.CylinderGeometry(3, 3.5, 10, 8);
        var guardMat = new THREE.MeshLambertMaterial({ color: 0x7B5839 });
        var guardLeft = new THREE.Mesh(guardLeftGeom, guardMat);
        guardLeft.position.set(-18, 5, -12);
        guardLeft.castShadow = true;
        guardLeft.receiveShadow = true;
        scene.add(guardLeft);
        objects.push(guardLeft);

        // Guard post - right tower
        var guardRightGeom = new THREE.CylinderGeometry(3, 3.5, 10, 8);
        var guardRight = new THREE.Mesh(guardRightGeom, guardMat);
        guardRight.position.set(18, 5, -12);
        guardRight.castShadow = true;
        guardRight.receiveShadow = true;
        scene.add(guardRight);
        objects.push(guardRight);

        // Vehicle barrier bollard 1
        var bollard1Geom = new THREE.CylinderGeometry(0.8, 0.9, 2, 8);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var bollard1 = new THREE.Mesh(bollard1Geom, bollardMat);
        bollard1.position.set(-8, 1, 8);
        bollard1.castShadow = true;
        bollard1.receiveShadow = true;
        scene.add(bollard1);
        objects.push(bollard1);

        // Vehicle barrier bollard 2
        var bollard2Geom = new THREE.CylinderGeometry(0.8, 0.9, 2, 8);
        var bollard2 = new THREE.Mesh(bollard2Geom, bollardMat);
        bollard2.position.set(0, 1, 10);
        bollard2.castShadow = true;
        bollard2.receiveShadow = true;
        scene.add(bollard2);
        objects.push(bollard2);

        // Vehicle barrier bollard 3
        var bollard3Geom = new THREE.CylinderGeometry(0.8, 0.9, 2, 8);
        var bollard3 = new THREE.Mesh(bollard3Geom, bollardMat);
        bollard3.position.set(8, 1, 8);
        bollard3.castShadow = true;
        bollard3.receiveShadow = true;
        scene.add(bollard3);
        objects.push(bollard3);

        // Muddy ground patch
        var groundGeom = new THREE.BoxGeometry(50, 0.5, 40);
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x5C4B3C });
        var ground = new THREE.Mesh(groundGeom, groundMat);
        ground.position.set(0, -0.5, 0);
        ground.receiveShadow = true;
        scene.add(ground);
        objects.push(ground);

        // Cone-shaped mud mound 1
        var mound1Geom = new THREE.ConeGeometry(4, 3, 8);
        var moundMat = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
        var mound1 = new THREE.Mesh(mound1Geom, moundMat);
        mound1.position.set(-25, 1.5, 15);
        mound1.castShadow = true;
        mound1.receiveShadow = true;
        scene.add(mound1);
        objects.push(mound1);

        // Cone-shaped mud mound 2
        var mound2Geom = new THREE.ConeGeometry(3.5, 2.5, 8);
        var mound2 = new THREE.Mesh(mound2Geom, moundMat);
        mound2.position.set(28, 1.25, 18);
        mound2.castShadow = true;
        mound2.receiveShadow = true;
        scene.add(mound2);
        objects.push(mound2);

        // Barbed wire fence line 1 - left stretch
        var wirePoints1 = [
            new THREE.Vector3(-30, 5, -8),
            new THREE.Vector3(-15, 5.5, -10)
        ];
        var wireGeom1 = new THREE.BufferGeometry().setFromPoints(wirePoints1);
        var wireMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        var wire1 = new THREE.LineSegments(wireGeom1, wireMat);
        scene.add(wire1);
        objects.push(wire1);

        // Barbed wire fence line 2 - right stretch
        var wirePoints2 = [
            new THREE.Vector3(15, 5.5, -10),
            new THREE.Vector3(30, 5, -8)
        ];
        var wireGeom2 = new THREE.BufferGeometry().setFromPoints(wirePoints2);
        var wire2 = new THREE.LineSegments(wireGeom2, wireMat);
        scene.add(wire2);
        objects.push(wire2);

        // Roof cone on left guard post
        var roofLeftGeom = new THREE.ConeGeometry(3.5, 2, 8);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
        var roofLeft = new THREE.Mesh(roofLeftGeom, roofMat);
        roofLeft.position.set(-18, 10.5, -12);
        roofLeft.castShadow = true;
        roofLeft.receiveShadow = true;
        scene.add(roofLeft);
        objects.push(roofLeft);

        // Roof cone on right guard post
        var roofRightGeom = new THREE.ConeGeometry(3.5, 2, 8);
        var roofRight = new THREE.Mesh(roofRightGeom, roofMat);
        roofRight.position.set(18, 10.5, -12);
        roofRight.castShadow = true;
        roofRight.receiveShadow = true;
        scene.add(roofRight);
        objects.push(roofRight);

        // Muddy spheres for environmental detail
        var sphereGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var sphereMat = new THREE.MeshLambertMaterial({ color: 0x4A3728 });
        var sphere1 = new THREE.Mesh(sphereGeom, sphereMat);
        sphere1.position.set(-12, 1, 12);
        sphere1.castShadow = true;
        sphere1.receiveShadow = true;
        scene.add(sphere1);
        objects.push(sphere1);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xAA9966, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for sun
        var sunLight = new THREE.DirectionalLight(0xFFDD88, 0.8);
        sunLight.position.set(30, 25, 20);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.far = 100;
        scene.add(sunLight);
        lights.push(sunLight);
    }

    function update(delta) {
        // Could add animation here if needed
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
