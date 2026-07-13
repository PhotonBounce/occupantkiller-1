window.FenGate = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var drawbridgeArm = null;
    var barrierArm = null;
    var boatsArray = [];
    var fogBanksArray = [];

    function addMesh(geo, mat, x, y, z) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function addLight(light) {
        scene.add(light);
        lights.push(light);
        return light;
    }

    function buildFenMarsh() {
        var groundMat = new THREE.MeshLambertMaterial({color: 0x2A3D1A});
        var waterMat = new THREE.MeshLambertMaterial({color: 0x1A2D0A});

        var xCount = 5;
        var zCount = 4;
        var tileSize = 45;
        var tileDepth = 35;

        for (var xi = 0; xi < xCount; xi++) {
            for (var zi = 0; zi < zCount; zi++) {
                var x = (xi - 2) * tileSize;
                var z = (zi - 1.5) * tileDepth;
                var geo = new THREE.BoxGeometry(tileSize, 0.5, tileDepth);
                addMesh(geo, groundMat, x, 0, z);
            }
        }

        var poolGeo = new THREE.BoxGeometry(15, 0.3, 20);
        addMesh(poolGeo, waterMat, -30, 0.2, -25);
        addMesh(poolGeo, waterMat, 20, 0.2, 30);
        addMesh(poolGeo, waterMat, 0, 0.2, 0);
        addMesh(poolGeo, waterMat, 40, 0.2, 10);
        addMesh(poolGeo, waterMat, -50, 0.2, 15);
    }

    function buildDrawbridge() {
        var woodMat = new THREE.MeshLambertMaterial({color: 0x8B6F47});
        var plankGeo = new THREE.BoxGeometry(12, 0.6, 8);
        drawbridgeArm = addMesh(plankGeo, woodMat, 0, 3, 0);
        drawbridgeArm.userData.isDrawbridge = true;
        drawbridgeArm.userData.hinge = new THREE.Vector3(6, 3, 0);
    }

    function buildGateTowers() {
        var stoneMat = new THREE.MeshLambertMaterial({color: 0x8A8A8A});
        var roofMat = new THREE.MeshLambertMaterial({color: 0xA0826D});

        var towerGeo = new THREE.BoxGeometry(6, 12, 6);
        var leftTower = addMesh(towerGeo, stoneMat, -15, 6, 0);
        var rightTower = addMesh(towerGeo, stoneMat, 15, 6, 0);

        var slitGeo = new THREE.BoxGeometry(1, 2, 0.5);
        addMesh(slitGeo, new THREE.MeshLambertMaterial({color: 0x444444}), -15, 8, 3.3);
        addMesh(slitGeo, new THREE.MeshLambertMaterial({color: 0x444444}), -15, 10, 3.3);
        addMesh(slitGeo, new THREE.MeshLambertMaterial({color: 0x444444}), 15, 8, 3.3);
        addMesh(slitGeo, new THREE.MeshLambertMaterial({color: 0x444444}), 15, 10, 3.3);

        var coneGeo = new THREE.ConeGeometry(4, 3, 8);
        addMesh(coneGeo, roofMat, -15, 15.5, 0);
        addMesh(coneGeo, roofMat, 15, 15.5, 0);
    }

    function buildCustomsBlock() {
        var brickMat = new THREE.MeshLambertMaterial({color: 0xA0522D});
        var roofMat = new THREE.MeshLambertMaterial({color: 0x704030});

        var mainGeo = new THREE.BoxGeometry(14, 8, 10);
        addMesh(mainGeo, brickMat, 0, 4, 25);

        var roofGeo = new THREE.BoxGeometry(15, 1, 11);
        addMesh(roofGeo, roofMat, 0, 12, 25);

        var barrierMat = new THREE.MeshLambertMaterial({color: 0xFF4444});
        var armGeo = new THREE.BoxGeometry(0.5, 0.8, 6);
        barrierArm = addMesh(armGeo, barrierMat, -8, 5, 25);
        barrierArm.userData.isBarrier = true;

        var boothGeo = new THREE.BoxGeometry(2, 3, 2);
        var boothMat = new THREE.MeshLambertMaterial({color: 0x704030});
        addMesh(boothGeo, boothMat, -5, 1.5, 22);
        addMesh(boothGeo, boothMat, 5, 1.5, 22);
    }

    function buildBorderFence() {
        var fenceMat = new THREE.MeshLambertMaterial({color: 0x555555});
        var postGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);

        var spacing = 8;
        var range = 60;
        for (var i = -range; i <= range; i += spacing) {
            addMesh(postGeo, fenceMat, i, 2, -45);
            addMesh(postGeo, fenceMat, i, 2, 45);
        }

        var wirePoints = [];
        for (var j = -range; j <= range; j += spacing) {
            wirePoints.push(new THREE.Vector3(j, 3.5, -45));
            wirePoints.push(new THREE.Vector3(j, 3.5, 45));
        }
        var wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var lineMat = new THREE.LineBasicMaterial({color: 0x333333});
        var wireframe = new THREE.LineSegments(wireGeo, lineMat);
        scene.add(wireframe);
        objects.push(wireframe);
    }

    function buildReedBeds() {
        var reedMat = new THREE.MeshLambertMaterial({color: 0x3D5C1F});
        var topMat = new THREE.MeshLambertMaterial({color: 0x654321});
        var reedGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 6);
        var topGeo = new THREE.ConeGeometry(0.4, 0.8, 6);

        var positions = [
            [-50, 2.5, -35], [-45, 2.5, -30], [-40, 2.5, -38], [-48, 2.5, -32],
            [50, 2.5, 35], [55, 2.5, 30], [45, 2.5, 38], [52, 2.5, 32],
            [-60, 2.5, 10], [-55, 2.5, 15], [-58, 2.5, 5], [-62, 2.5, 12],
            [60, 2.5, -10], [65, 2.5, -15], [58, 2.5, -5], [62, 2.5, -12],
            [-35, 2.5, 40], [-30, 2.5, 45], [-40, 2.5, 42],
            [35, 2.5, -40], [30, 2.5, -45], [40, 2.5, -42],
            [-25, 2.5, -50], [-20, 2.5, -48], [-30, 2.5, -52],
            [25, 2.5, 50], [20, 2.5, 48], [30, 2.5, 52],
            [-45, 2.5, 20], [-40, 2.5, 25], [-50, 2.5, 18],
            [45, 2.5, -20], [40, 2.5, -25], [50, 2.5, -18]
        ];

        for (var k = 0; k < positions.length; k++) {
            var pos = positions[k];
            addMesh(reedGeo, reedMat, pos[0], pos[1], pos[2]);
            addMesh(topGeo, topMat, pos[0], pos[1] + 2.8, pos[2]);
        }
    }

    function buildPatrolBoats() {
        var boatMat = new THREE.MeshLambertMaterial({color: 0x2C5282});
        var motorMat = new THREE.MeshLambertMaterial({color: 0x555555});

        var boatGeo = new THREE.BoxGeometry(4, 1.2, 2);
        var motorGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);

        var boat1 = addMesh(boatGeo, boatMat, -25, 0.8, -15);
        boat1.userData.isBoat = true;
        boat1.userData.startX = -25;
        boat1.userData.phase = 0;
        addMesh(motorGeo, motorMat, -25, 0.2, -15);
        boatsArray.push(boat1);

        var boat2 = addMesh(boatGeo, boatMat, 30, 0.8, 20);
        boat2.userData.isBoat = true;
        boat2.userData.startX = 30;
        boat2.userData.phase = Math.PI;
        addMesh(motorGeo, motorMat, 30, 0.2, 20);
        boatsArray.push(boat2);
    }

    function buildFogBanks() {
        var fogMat = new THREE.MeshLambertMaterial({color: 0xCCDDCC});
        fogMat.transparent = true;
        fogMat.opacity = 0.4;
        var fogGeo = new THREE.SphereGeometry(3, 4, 4);

        var positions = [
            [-40, 1.5, -25], [-30, 1.5, -30], [-50, 1.5, -20], [-35, 1.5, -28],
            [40, 1.5, 25], [30, 1.5, 30], [50, 1.5, 20], [35, 1.5, 28],
            [-60, 1.5, 5], [-50, 1.5, 10], [-55, 1.5, 0],
            [60, 1.5, -5], [50, 1.5, -10], [55, 1.5, 0],
            [-20, 1.5, 40], [-10, 1.5, 35], [-25, 1.5, 45],
            [20, 1.5, -40], [10, 1.5, -35], [25, 1.5, -45],
            [-5, 1.5, -50], [5, 1.5, -48], [0, 1.5, -52],
            [-5, 1.5, 50], [5, 1.5, 48], [0, 1.5, 52],
            [-15, 1.5, 15], [15, 1.5, -15], [0, 1.5, 20],
            [-25, 1.5, 0], [25, 1.5, 0]
        ];

        for (var f = 0; f < positions.length; f++) {
            var pos = positions[f];
            var fog = addMesh(fogGeo, fogMat, pos[0], pos[1], pos[2]);
            fog.userData.isFog = true;
            fog.userData.startX = pos[0];
            fog.userData.startZ = pos[2];
            fog.userData.phase = Math.random() * Math.PI * 2;
            fogBanksArray.push(fog);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x445544, 0.5);
        addLight(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFD699, 0.7);
        directionalLight.position.set(30, 20, 40);
        directionalLight.castShadow = false;
        addLight(directionalLight);

        var lantern1 = new THREE.PointLight(0xFFCC88, 0.8, 30);
        lantern1.position.set(-15, 10, 5);
        addLight(lantern1);

        var lantern2 = new THREE.PointLight(0xFFCC88, 0.8, 30);
        lantern2.position.set(15, 10, 5);
        addLight(lantern2);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        boatsArray = [];
        fogBanksArray = [];
        buildFenMarsh();
        buildDrawbridge();
        buildGateTowers();
        buildCustomsBlock();
        buildBorderFence();
        buildReedBeds();
        buildPatrolBoats();
        buildFogBanks();
        setupLighting();
    }

    function update(delta) {
        var time = Date.now() * 0.001;

        if (drawbridgeArm) {
            drawbridgeArm.rotation.x = Math.sin(time * 0.5) * 0.7;
        }

        if (barrierArm) {
            barrierArm.rotation.z = Math.sin(time * 0.3) * 1.2;
        }

        for (var b = 0; b < boatsArray.length; b++) {
            var boat = boatsArray[b];
            boat.position.x = boat.userData.startX + Math.sin(time + boat.userData.phase) * 15;
        }

        for (var f = 0; f < fogBanksArray.length; f++) {
            var fog = fogBanksArray[f];
            fog.position.x = fog.userData.startX + Math.cos(time * 0.3 + fog.userData.phase) * 5;
            fog.position.z = fog.userData.startZ + Math.sin(time * 0.25 + fog.userData.phase) * 4;
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
        boatsArray = [];
        fogBanksArray = [];
        scene = null;
        camera = null;
        drawbridgeArm = null;
        barrierArm = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
