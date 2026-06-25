window.GaleFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // Main fort base - heavy stone foundation
        var baseGeom = new THREE.BoxGeometry(60, 8, 50);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x5a4a42 });
        var baseMesh = new THREE.Mesh(baseGeom, baseMat);
        baseMesh.position.set(0, 4, 0);
        baseMesh.receiveShadow = true;
        scene.add(baseMesh);
        objects.push(baseMesh);

        // Left sea-facing wall - reinforced massive
        var leftWallGeom = new THREE.BoxGeometry(8, 35, 50);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x4a3a32 });
        var leftWall = new THREE.Mesh(leftWallGeom, wallMat);
        leftWall.position.set(-28, 18, 0);
        leftWall.receiveShadow = true;
        scene.add(leftWall);
        objects.push(leftWall);

        // Right sea-facing wall - matching reinforcement
        var rightWall = new THREE.Mesh(leftWallGeom, wallMat);
        rightWall.position.set(28, 18, 0);
        rightWall.receiveShadow = true;
        scene.add(rightWall);
        objects.push(rightWall);

        // Front battering wall
        var frontWallGeom = new THREE.BoxGeometry(50, 30, 10);
        var frontWall = new THREE.Mesh(frontWallGeom, wallMat);
        frontWall.position.set(0, 15, -22);
        frontWall.receiveShadow = true;
        scene.add(frontWall);
        objects.push(frontWall);

        // Back wall
        var backWall = new THREE.Mesh(frontWallGeom, wallMat);
        backWall.position.set(0, 15, 22);
        backWall.receiveShadow = true;
        scene.add(backWall);
        objects.push(backWall);

        // Broken battlement stack 1 - irregular stone blocks
        var battGeom1 = new THREE.BoxGeometry(12, 10, 10);
        var battMat1 = new THREE.MeshLambertMaterial({ color: 0x6b5a52 });
        var batt1 = new THREE.Mesh(battGeom1, battMat1);
        batt1.position.set(-18, 32, -15);
        batt1.rotation.z = 0.2;
        batt1.receiveShadow = true;
        scene.add(batt1);
        objects.push(batt1);

        // Broken battlement stack 2
        var battGeom2 = new THREE.BoxGeometry(10, 12, 9);
        var battMat2 = new THREE.MeshLambertMaterial({ color: 0x7a6a62 });
        var batt2 = new THREE.Mesh(battGeom2, battMat2);
        batt2.position.set(8, 35, 12);
        batt2.rotation.z = -0.25;
        batt2.receiveShadow = true;
        scene.add(batt2);
        objects.push(batt2);

        // Broken battlement stack 3 - wind-damaged
        var battGeom3 = new THREE.BoxGeometry(11, 11, 8);
        var battMat3 = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var batt3 = new THREE.Mesh(battGeom3, battMat3);
        batt3.position.set(20, 33, -10);
        batt3.rotation.z = 0.15;
        batt3.receiveShadow = true;
        scene.add(batt3);
        objects.push(batt3);

        // Storm drain channel left
        var drainGeom1 = new THREE.CylinderGeometry(3, 3, 55, 8);
        var drainMat = new THREE.MeshLambertMaterial({ color: 0x3a2a22 });
        var drain1 = new THREE.Mesh(drainGeom1, drainMat);
        drain1.position.set(-20, 5, 0);
        drain1.rotation.z = Math.PI / 2;
        drain1.receiveShadow = true;
        scene.add(drain1);
        objects.push(drain1);

        // Storm drain channel right
        var drain2 = new THREE.Mesh(drainGeom1, drainMat);
        drain2.position.set(20, 5, 0);
        drain2.rotation.z = Math.PI / 2;
        drain2.receiveShadow = true;
        scene.add(drain2);
        objects.push(drain2);

        // Wind vane tower base - tall reinforced tower
        var towerBaseGeom = new THREE.CylinderGeometry(6, 8, 40, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x4a3a32 });
        var towerBase = new THREE.Mesh(towerBaseGeom, towerMat);
        towerBase.position.set(-25, 20, 18);
        towerBase.receiveShadow = true;
        scene.add(towerBase);
        objects.push(towerBase);

        // Wind vane tower cap
        var towerCapGeom = new THREE.ConeGeometry(8, 12, 12);
        var capMat = new THREE.MeshLambertMaterial({ color: 0x6a5a52 });
        var towerCap = new THREE.Mesh(towerCapGeom, capMat);
        towerCap.position.set(-25, 46, 18);
        towerCap.receiveShadow = true;
        scene.add(towerCap);
        objects.push(towerCap);

        // Wind-sculpted spherical erosion element 1
        var erosionGeom1 = new THREE.SphereGeometry(4, 6, 6);
        var erosionMat1 = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        var erosion1 = new THREE.Mesh(erosionGeom1, erosionMat1);
        erosion1.position.set(15, 28, -18);
        erosion1.scale.set(1.3, 0.8, 1);
        erosion1.receiveShadow = true;
        scene.add(erosion1);
        objects.push(erosion1);

        // Wind-sculpted spherical erosion element 2
        var erosionGeom2 = new THREE.SphereGeometry(5, 6, 6);
        var erosionMat2 = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        var erosion2 = new THREE.Mesh(erosionGeom2, erosionMat2);
        erosion2.position.set(-12, 25, 20);
        erosion2.scale.set(1.2, 0.85, 1.1);
        erosion2.receiveShadow = true;
        scene.add(erosion2);
        objects.push(erosion2);

        // Reinforced corner tower - cylindrical strength
        var cornerGeom = new THREE.CylinderGeometry(7, 7, 38, 10);
        var cornerMat = new THREE.MeshLambertMaterial({ color: 0x5a4a42 });
        var corner1 = new THREE.Mesh(cornerGeom, cornerMat);
        corner1.position.set(-28, 19, -22);
        corner1.receiveShadow = true;
        scene.add(corner1);
        objects.push(corner1);

        // Opposite corner tower
        var corner2 = new THREE.Mesh(cornerGeom, cornerMat);
        corner2.position.set(28, 19, 22);
        corner2.receiveShadow = true;
        scene.add(corner2);
        objects.push(corner2);

        // Central citadel - cone shaped defensive structure
        var citadelGeom = new THREE.ConeGeometry(10, 25, 10);
        var citadelMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var citadel = new THREE.Mesh(citadelGeom, citadelMat);
        citadel.position.set(0, 24, 0);
        citadel.receiveShadow = true;
        scene.add(citadel);
        objects.push(citadel);

        // Add lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 40, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate wind effects - gentle swaying
        if (objects.length > 0) {
            var windTime = Date.now() * 0.0003;
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry && objects[i].geometry instanceof THREE.ConeGeometry) {
                    objects[i].rotation.y += Math.sin(windTime + i) * 0.001;
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
