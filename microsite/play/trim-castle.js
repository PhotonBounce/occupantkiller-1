window.TrimCastle = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 17360;
    var OFFSET_Z = 0;

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        return mesh;
    }

    function place(mesh, x, y, z) {
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildGreatTower() {
        // Central keep 20x28x20
        var keepGeo = new THREE.BoxGeometry(20, 28, 20);
        place(makeMesh(keepGeo, 0x8B7355), 0, 14, 0);

        // 4 cruciform towers protruding from each wall face
        var tGeoN = new THREE.BoxGeometry(8, 30, 8);
        place(makeMesh(tGeoN, 0x8B7355), 0, 15, -14);

        var tGeoS = new THREE.BoxGeometry(8, 30, 8);
        place(makeMesh(tGeoS, 0x8B7355), 0, 15, 14);

        var tGeoE = new THREE.BoxGeometry(8, 30, 8);
        place(makeMesh(tGeoE, 0x8B7355), 14, 15, 0);

        var tGeoW = new THREE.BoxGeometry(8, 30, 8);
        place(makeMesh(tGeoW, 0x8B7355), -14, 15, 0);

        // Corner merlons — 12 total
        var merlon = new THREE.BoxGeometry(2, 4, 2);
        var merPositions = [
            [-9, 30, -9], [9, 30, -9], [-9, 30, 9], [9, 30, 9],
            [0, 30, -18], [0, 30, 18], [-18, 30, 0], [18, 30, 0],
            [-4, 30, -18], [4, 30, -18], [-4, 30, 18], [4, 30, 18]
        ];
        for (var i = 0; i < merPositions.length; i++) {
            var mp = merPositions[i];
            var mg = new THREE.BoxGeometry(2, 4, 2);
            place(makeMesh(mg, 0x8B7355), mp[0], mp[1], mp[2]);
        }
    }

    function buildCurtainWall() {
        // 4 wall sections forming rough 500m perimeter
        // North wall 60 long
        var wallN = new THREE.BoxGeometry(60, 14, 2);
        place(makeMesh(wallN, 0x7A6545), 0, 7, -55);

        // South wall 60 long
        var wallS = new THREE.BoxGeometry(60, 14, 2);
        place(makeMesh(wallS, 0x7A6545), 0, 7, 55);

        // East wall 50 long
        var wallE = new THREE.BoxGeometry(2, 14, 50);
        place(makeMesh(wallE, 0x7A6545), 50, 7, 0);

        // West wall 50 long
        var wallW = new THREE.BoxGeometry(2, 14, 50);
        place(makeMesh(wallW, 0x7A6545), -50, 7, 0);

        // 8 rectangular wall towers BoxGeometry 8x8x18
        var towerPositions = [
            [-25, 9, -55], [25, 9, -55],
            [-25, 9, 55],  [25, 9, 55],
            [50, 9, -25],  [50, 9, 25],
            [-50, 9, -25], [-50, 9, 25]
        ];
        for (var i = 0; i < towerPositions.length; i++) {
            var tp = towerPositions[i];
            var tg = new THREE.BoxGeometry(8, 18, 8);
            place(makeMesh(tg, 0x6A5535), tp[0], tp[1], tp[2]);
        }
    }

    function buildDublinGate() {
        // Main gate body 14w x 8d x 20h
        var gateGeo = new THREE.BoxGeometry(14, 20, 8);
        place(makeMesh(gateGeo, 0x7A6545), -30, 10, -55);

        // Round gate towers each side r=4 h=22 seg=6
        var cylL = new THREE.CylinderGeometry(4, 4, 22, 6);
        place(makeMesh(cylL, 0x7A6545), -38, 11, -55);

        var cylR = new THREE.CylinderGeometry(4, 4, 22, 6);
        place(makeMesh(cylR, 0x7A6545), -22, 11, -55);

        // Dark archway inset 6x12
        var archGeo = new THREE.BoxGeometry(6, 12, 2);
        place(makeMesh(archGeo, 0x222222), -30, 6, -52);

        // Drawbridge 8x1x16 wood
        var drawGeo = new THREE.BoxGeometry(8, 1, 16);
        place(makeMesh(drawGeo, 0x6B4423), -30, 0.5, -45);
    }

    function buildWaterGate() {
        // Gate body 10w x 6d x 16h
        var wgGeo = new THREE.BoxGeometry(10, 16, 6);
        place(makeMesh(wgGeo, 0x7A6545), 50, 8, 0);

        // Water channel 8x0.5x8
        var chanGeo = new THREE.BoxGeometry(8, 0.5, 8);
        place(makeMesh(chanGeo, 0x1B6CA8), 50, 0.25, 0);
    }

    function buildRiverBoyne() {
        // 6 water tiles 20x0.5x15
        var waterPositions = [
            [70, 0, -35], [70, 0, -20], [70, 0, -5],
            [70, 0, 10],  [70, 0, 25],  [70, 0, 40]
        ];
        for (var i = 0; i < waterPositions.length; i++) {
            var wp = waterPositions[i];
            var wg = new THREE.BoxGeometry(20, 0.5, 15);
            place(makeMesh(wg, 0x1B6CA8), wp[0], wp[1], wp[2]);
        }

        // Grassy bank 50x1x10
        var bankGeo = new THREE.BoxGeometry(50, 1, 10);
        place(makeMesh(bankGeo, 0x4A8A4A), 55, 0.5, 0);

        // Sheep Gate town gate 8x12x4
        var sheepGeo = new THREE.BoxGeometry(8, 12, 4);
        place(makeMesh(sheepGeo, 0x7A6545), 80, 6, 0);
    }

    function buildYellowSteeple() {
        // Base offset for Yellow Steeple ruins
        var rx = 120;
        var rz = -40;

        // Main ruined tower 6x30x6
        var mainGeo = new THREE.BoxGeometry(6, 30, 6);
        place(makeMesh(mainGeo, 0xC8C0A8), rx, 15, rz);

        // Partially collapsed stub 2x22x6
        var stub1Geo = new THREE.BoxGeometry(2, 22, 6);
        place(makeMesh(stub1Geo, 0xC8C0A8), rx + 7, 11, rz);

        // Shorter jagged stub 6x16x6
        var stub2Geo = new THREE.BoxGeometry(6, 16, 6);
        place(makeMesh(stub2Geo, 0xC8C0A8), rx - 7, 8, rz);

        // Foundation walls 2x4x20
        var fw1Geo = new THREE.BoxGeometry(2, 4, 20);
        place(makeMesh(fw1Geo, 0xC8C0A8), rx + 10, 2, rz);

        // Foundation wall 20x4x2
        var fw2Geo = new THREE.BoxGeometry(20, 4, 2);
        place(makeMesh(fw2Geo, 0xC8C0A8), rx, 2, rz + 12);
    }

    function buildTownOfTrim() {
        // 8 town buildings with varied sizes and colors
        var buildingData = [
            { x: -80, z: -30, w: 10, h: 10, d: 6, color: 0xCC5500 },
            { x: -70, z: -20, w: 8,  h: 12, d: 7, color: 0xF5DEB3 },
            { x: -90, z: -15, w: 14, h: 8,  d: 8, color: 0xD4C5A9 },
            { x: -75, z: 10,  w: 6,  h: 11, d: 6, color: 0xCC5500 },
            { x: -85, z: 25,  w: 12, h: 9,  d: 7, color: 0xF5DEB3 },
            { x: -65, z: 30,  w: 9,  h: 10, d: 8, color: 0xD4C5A9 },
            { x: -95, z: 5,   w: 11, h: 12, d: 6, color: 0xCC5500 },
            { x: -60, z: -5,  w: 7,  h: 8,  d: 7, color: 0xF5DEB3 }
        ];

        for (var i = 0; i < buildingData.length; i++) {
            var bd = buildingData[i];
            var bg = new THREE.BoxGeometry(bd.w, bd.h, bd.d);
            place(makeMesh(bg, bd.color), bd.x, bd.h / 2, bd.z);
        }

        // Town square 25x0.5x25
        var squareGeo = new THREE.BoxGeometry(25, 0.5, 25);
        place(makeMesh(squareGeo, 0xC0B0A0), -78, 0.25, 5);

        // Market Cross — vertical shaft 0.8x12x0.8
        var crossShaftGeo = new THREE.BoxGeometry(0.8, 12, 0.8);
        place(makeMesh(crossShaftGeo, 0xD4C5A9), -78, 6, 5);

        // Market Cross arms 4x0.8x0.8
        var crossArmsGeo = new THREE.BoxGeometry(4, 0.8, 0.8);
        place(makeMesh(crossArmsGeo, 0xD4C5A9), -78, 10, 5);
    }

    function buildCastleBridge() {
        // Bridge deck 6x2x30
        var deckGeo = new THREE.BoxGeometry(6, 2, 30);
        place(makeMesh(deckGeo, 0xD4C5A9), 68, 1, 0);

        // 3 arch piers CylinderGeometry r=3 h=8 below waterline
        var pierPositions = [
            [68, -4, -10],
            [68, -4, 0],
            [68, -4, 10]
        ];
        for (var i = 0; i < pierPositions.length; i++) {
            var pp = pierPositions[i];
            var pg = new THREE.CylinderGeometry(3, 3, 8, 8);
            place(makeMesh(pg, 0xC4B59A), pp[0], pp[1], pp[2]);
        }

        // Stone parapet left side 0.5x2x30
        var paraLeftGeo = new THREE.BoxGeometry(0.5, 2, 30);
        place(makeMesh(paraLeftGeo, 0xC8C0A8), 71, 3, 0);

        // Stone parapet right side 0.5x2x30
        var paraRightGeo = new THREE.BoxGeometry(0.5, 2, 30);
        place(makeMesh(paraRightGeo, 0xC8C0A8), 65, 3, 0);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
    }

    function build() {
        if (!scene) { return; }
        buildGreatTower();
        buildCurtainWall();
        buildDublinGate();
        buildWaterGate();
        buildRiverBoyne();
        buildYellowSteeple();
        buildTownOfTrim();
        buildCastleBridge();
    }

    function update(delta) {
        // Static environment — no animation required
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.parent) {
                obj.parent.remove(obj);
            }
            if (obj.geometry) { obj.geometry.dispose(); }
            if (obj.material) { obj.material.dispose(); }
        }
        objects = [];
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
