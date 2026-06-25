window.ElyCathedral = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 16040;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rTop, rBot, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildNave() {
        // Main nave: 55w x 18d x 24h, Barnack limestone
        makeBox(55, 24, 18, 0xDDD0B8, 0, 12, 0);
    }

    function buildWestTower() {
        // Massive west tower: 12w x 12d x 42h
        makeBox(12, 42, 12, 0xD0C4AE, -33.5, 21, 0);

        // 4 corner turrets at top of west tower
        makeCylinder(2.5, 2.5, 10, 8, 0xD0C4AE, -33.5 - 6, 42 + 5, -6);
        makeCylinder(2.5, 2.5, 10, 8, 0xD0C4AE, -33.5 + 6, 42 + 5, -6);
        makeCylinder(2.5, 2.5, 10, 8, 0xD0C4AE, -33.5 - 6, 42 + 5, 6);
        makeCylinder(2.5, 2.5, 10, 8, 0xD0C4AE, -33.5 + 6, 42 + 5, 6);

        // Octagonal lantern cap on west tower
        makeCylinder(6, 6, 8, 8, 0xC8BAA0, -33.5, 42 + 4, 0);
    }

    function buildOctagonalLanternTower() {
        // Famous 14th-century octagonal lantern tower over crossing
        // 8-sided stone base tower
        makeCylinder(10, 10, 20, 8, 0xD0C4AE, 0, 24 + 10, 0);

        // Timber lantern cap (dark wood)
        makeCylinder(8, 8, 12, 8, 0x6B4423, 0, 24 + 20 + 6, 0);

        // Glass octagon (glass light effect)
        makeCylinder(7, 7, 8, 8, 0x87CEEB, 0, 24 + 20 + 4, 0);
    }

    function buildTransepts() {
        // North transept wing: 14w x 18d x 20h
        makeBox(14, 20, 18, 0xD0C4AE, 0, 10, -18);

        // South transept wing: 14w x 18d x 20h
        makeBox(14, 20, 18, 0xD0C4AE, 0, 10, 18);
    }

    function buildChancel() {
        // East end Lady Chapel: 20w x 15d x 22h
        makeBox(20, 22, 15, 0xD0C4AE, 37.5, 11, 0);

        // Elaborate east window: 3 dark inset boxes (5w x 16h x 0.5d) in a trio
        makeBox(5, 16, 0.5, 0x87CEEB, 48, 11, -5);
        makeBox(5, 16, 0.5, 0x87CEEB, 48, 11, 0);
        makeBox(5, 16, 0.5, 0x87CEEB, 48, 11, 5);
    }

    function buildPriorsGate() {
        // Ornate Benedictine gatehouse: 12w x 6d x 18h
        makeBox(12, 18, 6, 0xC8BAA0, -50, 9, -30);

        // Arch opening: 6w x 10h x 0.5d (dark inset)
        makeBox(6, 10, 0.5, 0x222222, -50, 5, -27);

        // Carved pinnacles at corners: 2w x 2d x 5h
        makeBox(2, 5, 2, 0xC8BAA0, -50 - 5, 18 + 2.5, -30 - 2.5);
        makeBox(2, 5, 2, 0xC8BAA0, -50 + 5, 18 + 2.5, -30 - 2.5);
        makeBox(2, 5, 2, 0xC8BAA0, -50 - 5, 18 + 2.5, -30 + 2.5);
        makeBox(2, 5, 2, 0xC8BAA0, -50 + 5, 18 + 2.5, -30 + 2.5);
    }

    function buildFenLandscape() {
        var i;

        // 8 flat fenland patches: 25w x 0.5h x 15d, grass green
        var fenPositions = [
            [-70, -25],
            [-70, 25],
            [-40, -40],
            [-40, 40],
            [20, -40],
            [20, 40],
            [60, -25],
            [60, 25]
        ];
        for (i = 0; i < fenPositions.length; i++) {
            makeBox(25, 0.5, 15, 0x4A7A4A, fenPositions[i][0], 0.25, fenPositions[i][1]);
        }

        // Drainage ditch: 40w x 2h x 2d, water blue
        makeBox(40, 2, 2, 0x1B5E8A, -55, 1, 0);

        // Reeds at water edge: 20 thin cylinders r=0.2 h=4, reed color
        var reedOffsets = [
            [-45, -3],
            [-47, -1],
            [-49,  2],
            [-51, -2],
            [-53,  1],
            [-55, -4],
            [-57,  3],
            [-59, -1],
            [-61,  2],
            [-63, -3],
            [-45,  4],
            [-47,  6],
            [-49, -5],
            [-51,  5],
            [-53, -6],
            [-55,  6],
            [-57, -5],
            [-59,  4],
            [-61, -4],
            [-63,  5]
        ];
        for (i = 0; i < reedOffsets.length; i++) {
            makeCylinder(0.2, 0.2, 4, 6, 0x8B7355, reedOffsets[i][0], 2, reedOffsets[i][1]);
        }
    }

    function buildBishopsPalace() {
        // Main palace block: 28w x 12d x 16h
        makeBox(28, 16, 12, 0xC8BAA0, 55, 8, -45);

        // Ruined east wing: 3 partial wall boxes 2w x 14d x 16h at angles
        var palaceWall1 = new THREE.BoxGeometry(2, 16, 14);
        var palaceWall2 = new THREE.BoxGeometry(2, 16, 14);
        var palaceWall3 = new THREE.BoxGeometry(2, 16, 14);
        var palaceMat = new THREE.MeshLambertMaterial({ color: 0xC8BAA0 });

        var wall1 = new THREE.Mesh(palaceWall1, palaceMat);
        wall1.position.set(OFFSET_X + 70, 8, OFFSET_Z - 38);
        wall1.rotation.y = 0.2;
        scene.add(wall1);
        objects.push(wall1);

        var wall2 = new THREE.Mesh(palaceWall2, palaceMat);
        wall2.position.set(OFFSET_X + 73, 8, OFFSET_Z - 45);
        wall2.rotation.y = -0.15;
        scene.add(wall2);
        objects.push(wall2);

        var wall3 = new THREE.Mesh(palaceWall3, palaceMat);
        wall3.position.set(OFFSET_X + 69, 8, OFFSET_Z - 52);
        wall3.rotation.y = 0.1;
        scene.add(wall3);
        objects.push(wall3);

        // Arched windows: 3x dark insets 3w x 8h x 0.5d
        makeBox(3, 8, 0.5, 0x222222, 42, 8, -39.3);
        makeBox(3, 8, 0.5, 0x222222, 55, 8, -39.3);
        makeBox(3, 8, 0.5, 0x222222, 68, 8, -39.3);
    }

    function build() {
        buildNave();
        buildWestTower();
        buildOctagonalLanternTower();
        buildTransepts();
        buildChancel();
        buildPriorsGate();
        buildFenLandscape();
        buildBishopsPalace();
    }

    function update(delta) {
        // Static environment — no animation needed
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
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
