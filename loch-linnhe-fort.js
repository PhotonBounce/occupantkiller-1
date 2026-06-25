window.LochLinhheFort = (function() {
    'use strict';

    var WORLD_X = 1720;
    var WORLD_Z = 2200;

    function createMesh(geometry, color) {
        var material = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geometry, material);
    }

    function buildIslandFoundation(group) {
        var geo = new THREE.BoxGeometry(12, 1, 12);
        var mesh = createMesh(geo, 0x7A7A7A);
        mesh.position.set(WORLD_X, 0.5, WORLD_Z);
        group.add(mesh);
    }

    function buildWaterBoxes(group) {
        var waterColor = 0x1A3A5A;
        var positions = [
            [WORLD_X - 16, -0.5, WORLD_Z],
            [WORLD_X + 16, -0.5, WORLD_Z],
            [WORLD_X, -0.5, WORLD_Z - 16],
            [WORLD_X, -0.5, WORLD_Z + 16],
            [WORLD_X - 16, -0.5, WORLD_Z - 16],
            [WORLD_X + 16, -0.5, WORLD_Z - 16],
            [WORLD_X - 16, -0.5, WORLD_Z + 16],
            [WORLD_X + 16, -0.5, WORLD_Z + 16]
        ];
        var i;
        for (i = 0; i < positions.length; i++) {
            var geo = new THREE.BoxGeometry(16, 1, 16);
            var mesh = createMesh(geo, waterColor);
            mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
            group.add(mesh);
        }
    }

    function buildCastleStalker(group) {
        var geo = new THREE.BoxGeometry(6, 16, 6);
        var mesh = createMesh(geo, 0x9A8A78);
        mesh.position.set(WORLD_X, 9, WORLD_Z);
        group.add(mesh);

        var battlementPositions = [
            [-2, 0], [0, 0], [2, 0],
            [-2, 2], [2, 2],
            [-2, -2], [0, -2], [2, -2]
        ];
        var j;
        for (j = 0; j < battlementPositions.length; j++) {
            var bGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            var bMesh = createMesh(bGeo, 0x9A8A78);
            bMesh.position.set(
                WORLD_X + battlementPositions[j][0],
                18,
                WORLD_Z + battlementPositions[j][1]
            );
            group.add(bMesh);
        }
    }

    function buildKingairlochBattery(group) {
        var baseX = WORLD_X + 80;
        var baseZ = WORLD_Z - 30;

        var geo = new THREE.BoxGeometry(8, 3, 10);
        var mesh = createMesh(geo, 0x8A8A7A);
        mesh.position.set(baseX, 1.5, baseZ);
        group.add(mesh);

        var wallGeo = new THREE.BoxGeometry(8, 2, 1);
        var wallMesh = createMesh(wallGeo, 0x8A8A7A);
        wallMesh.position.set(baseX, 4, baseZ - 4.5);
        group.add(wallMesh);

        var barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
        var barrelMesh = createMesh(barrelGeo, 0x2A2A2A);
        barrelMesh.rotation.z = Math.PI / 2;
        barrelMesh.position.set(baseX - 3, 4, baseZ - 3);
        group.add(barrelMesh);
    }

    function buildBallachulishBridge(group) {
        var bridgeX = WORLD_X + 150;
        var bridgeZ = WORLD_Z;
        var girderColor = 0x4A3A2A;

        var i;
        for (i = 0; i < 5; i++) {
            var topGeo = new THREE.BoxGeometry(0.4, 0.4, 60);
            var topMesh = createMesh(topGeo, girderColor);
            topMesh.position.set(bridgeX - 6 + i * 3, 8, bridgeZ);
            group.add(topMesh);

            var botGeo = new THREE.BoxGeometry(0.4, 0.4, 60);
            var botMesh = createMesh(botGeo, girderColor);
            botMesh.position.set(bridgeX - 6 + i * 3, 4, bridgeZ);
            group.add(botMesh);
        }

        var j;
        for (j = 0; j < 7; j++) {
            var vertGeo = new THREE.BoxGeometry(0.3, 4, 0.3);
            var vertMesh = createMesh(vertGeo, girderColor);
            vertMesh.position.set(bridgeX - 6, 6, bridgeZ - 24 + j * 8);
            group.add(vertMesh);

            var vertGeo2 = new THREE.BoxGeometry(0.3, 4, 0.3);
            var vertMesh2 = createMesh(vertGeo2, girderColor);
            vertMesh2.position.set(bridgeX + 6, 6, bridgeZ - 24 + j * 8);
            group.add(vertMesh2);
        }

        var pierGeo = new THREE.BoxGeometry(4, 8, 4);
        var pier1 = createMesh(pierGeo, 0x6A6A6A);
        pier1.position.set(bridgeX, 4, bridgeZ - 20);
        group.add(pier1);

        var pierGeo2 = new THREE.BoxGeometry(4, 8, 4);
        var pier2 = createMesh(pierGeo2, 0x6A6A6A);
        pier2.position.set(bridgeX, 4, bridgeZ + 20);
        group.add(pier2);
    }

    function buildSeaLockGate(group) {
        var gateX = WORLD_X + 40;
        var gateZ = WORLD_Z + 50;

        var gateGeo = new THREE.BoxGeometry(4, 8, 2);
        var gateMesh = createMesh(gateGeo, 0x5A3A1A);
        gateMesh.position.set(gateX, 4, gateZ);
        group.add(gateMesh);

        var plank1Geo = new THREE.BoxGeometry(4, 0.4, 0.3);
        var i;
        for (i = 0; i < 8; i++) {
            var plankGeo = new THREE.BoxGeometry(4, 0.4, 0.3);
            var plankMesh = createMesh(plankGeo, 0x3A2010);
            plankMesh.position.set(gateX, 1 + i * 0.9, gateZ + 0.9);
            group.add(plankMesh);
        }

        var postGeo = new THREE.BoxGeometry(0.4, 10, 0.4);
        var post1 = createMesh(postGeo, 0x4A2A0A);
        post1.position.set(gateX - 2, 5, gateZ);
        group.add(post1);

        var postGeo2 = new THREE.BoxGeometry(0.4, 10, 0.4);
        var post2 = createMesh(postGeo2, 0x4A2A0A);
        post2.position.set(gateX + 2, 5, gateZ);
        group.add(post2);
    }

    function buildSignalStation(group) {
        var stationX = WORLD_X - 60;
        var stationZ = WORLD_Z - 60;

        var buildingGeo = new THREE.BoxGeometry(4, 6, 4);
        var buildingMesh = createMesh(buildingGeo, 0xF0F0F0);
        buildingMesh.position.set(stationX, 3, stationZ);
        group.add(buildingMesh);

        var roofGeo = new THREE.BoxGeometry(5, 1, 5);
        var roofMesh = createMesh(roofGeo, 0xC0C0C0);
        roofMesh.position.set(stationX, 6.5, stationZ);
        group.add(roofMesh);

        var mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 8, 6);
        var mastMesh = createMesh(mastGeo, 0x808080);
        mastMesh.position.set(stationX, 11, stationZ);
        group.add(mastMesh);

        var flagGeo = new THREE.BoxGeometry(2, 1, 0.05);
        var flagMesh = createMesh(flagGeo, 0xCC0000);
        flagMesh.position.set(stationX + 1, 14.5, stationZ);
        group.add(flagMesh);

        var windowGeo = new THREE.BoxGeometry(1, 1, 0.1);
        var windowMesh = createMesh(windowGeo, 0x8AB0CC);
        windowMesh.position.set(stationX, 4, stationZ - 2.1);
        group.add(windowMesh);

        var doorGeo = new THREE.BoxGeometry(1, 2, 0.1);
        var doorMesh = createMesh(doorGeo, 0x5A3A1A);
        doorMesh.position.set(stationX + 1, 1, stationZ - 2.1);
        group.add(doorMesh);
    }

    function buildLochWater(group) {
        var waterColor = 0x1A3A5A;
        var waterGeo = new THREE.BoxGeometry(300, 1, 200);
        var waterMesh = createMesh(waterGeo, waterColor);
        waterMesh.position.set(WORLD_X + 50, -1, WORLD_Z);
        group.add(waterMesh);
    }

    function buildHeadlandRock(group) {
        var rockX = WORLD_X - 70;
        var rockZ = WORLD_Z - 50;

        var rockGeo = new THREE.BoxGeometry(20, 4, 20);
        var rockMesh = createMesh(rockGeo, 0x6A6050);
        rockMesh.position.set(rockX, 2, rockZ);
        group.add(rockMesh);

        var rock2Geo = new THREE.BoxGeometry(12, 2, 12);
        var rock2Mesh = createMesh(rock2Geo, 0x5A5040);
        rock2Mesh.position.set(rockX + 5, 5, rockZ - 3);
        group.add(rock2Mesh);
    }

    function build(scene) {
        var group = new THREE.Group();

        buildLochWater(group);
        buildHeadlandRock(group);
        buildIslandFoundation(group);
        buildWaterBoxes(group);
        buildCastleStalker(group);
        buildKingairlochBattery(group);
        buildBallachulishBridge(group);
        buildSeaLockGate(group);
        buildSignalStation(group);

        scene.add(group);
        return group;
    }

    return {
        build: build,
        worldX: WORLD_X,
        worldZ: WORLD_Z
    };
}());
