window.WestminsterAbbey = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11520;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mesh = makeMesh(geo, color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mesh = makeMesh(geo, color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mesh = makeMesh(geo, color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildGroundPlane() {
        // Parliament Square grass area
        makeBox(120, 0.5, 100, 0x4a7c3f, X_OFFSET, 0.25, -60);
    }

    function buildWestminsterAbbey() {
        var abbeyColor = 0xc8b89a;
        var stoneLight = 0xd4c4a8;
        var roofColor = 0x6b8c6b;
        var pinnacleColor = 0xb8a888;

        // Long gothic nave (running east-west)
        makeBox(40, 18, 14, abbeyColor, X_OFFSET - 10, 9, -30);

        // Nave roof ridge
        makeCyl(0.5, 0.5, 42, 4, roofColor, X_OFFSET - 10, 18.5, -30);

        // Nave clerestory windows suggestion (thin darker panels)
        for (var wi = 0; wi < 5; wi++) {
            makeBox(2, 5, 0.3, 0x8899aa, X_OFFSET - 25 + wi * 8, 14, -23.1);
            makeBox(2, 5, 0.3, 0x8899aa, X_OFFSET - 25 + wi * 8, 14, -36.9);
        }

        // Twin western towers (each 8x8x32)
        makeBox(8, 32, 8, abbeyColor, X_OFFSET - 28, 16, -26);
        makeBox(8, 32, 8, abbeyColor, X_OFFSET - 28, 16, -34);

        // Tower gothic pinnacles (tops)
        makeCone(1.5, 8, 4, pinnacleColor, X_OFFSET - 28, 36, -26);
        makeCone(1.5, 8, 4, pinnacleColor, X_OFFSET - 28, 36, -34);

        // Corner pinnacles on each tower
        makeCone(0.8, 4, 4, pinnacleColor, X_OFFSET - 24.5, 34, -22.5);
        makeCone(0.8, 4, 4, pinnacleColor, X_OFFSET - 31.5, 34, -22.5);
        makeCone(0.8, 4, 4, pinnacleColor, X_OFFSET - 24.5, 34, -29.5);
        makeCone(0.8, 4, 4, pinnacleColor, X_OFFSET - 31.5, 34, -29.5);
        makeCone(0.8, 4, 4, pinnacleColor, X_OFFSET - 24.5, 34, -30.5);
        makeCone(0.8, 4, 4, pinnacleColor, X_OFFSET - 31.5, 34, -30.5);
        makeCone(0.8, 4, 4, pinnacleColor, X_OFFSET - 24.5, 34, -37.5);
        makeCone(0.8, 4, 4, pinnacleColor, X_OFFSET - 31.5, 34, -37.5);

        // Central tower / crossing tower
        makeBox(10, 24, 10, abbeyColor, X_OFFSET - 8, 12, -30);
        makeCone(2, 6, 4, pinnacleColor, X_OFFSET - 8, 27, -30);

        // Flying buttresses - north side
        for (var bi = 0; bi < 4; bi++) {
            makeBox(0.8, 8, 5, stoneLight, X_OFFSET - 22 + bi * 7, 14, -22);
        }
        // Flying buttresses - south side
        for (var bj = 0; bj < 4; bj++) {
            makeBox(0.8, 8, 5, stoneLight, X_OFFSET - 22 + bj * 7, 14, -38);
        }

        // Transept (north-south cross arm)
        makeBox(12, 20, 28, abbeyColor, X_OFFSET - 8, 10, -30);

        // Transept roof
        makeCone(2, 5, 4, pinnacleColor, X_OFFSET - 8, 23, -17);
        makeCone(2, 5, 4, pinnacleColor, X_OFFSET - 8, 23, -43);

        // Chapter House (octagonal) - east side
        makeCyl(7, 7, 10, 8, abbeyColor, X_OFFSET + 6, 5, -22);
        makeCone(4, 6, 8, roofColor, X_OFFSET + 6, 13, -22);

        // Henry VII Lady Chapel at east end
        makeBox(16, 14, 12, stoneLight, X_OFFSET + 12, 7, -30);
        // Lady Chapel ornate roof
        makeCone(3, 5, 4, roofColor, X_OFFSET + 12, 16.5, -30);

        // Lady Chapel corner turrets
        makeCyl(1.2, 1.2, 16, 6, stoneLight, X_OFFSET + 5, 8, -25);
        makeCyl(1.2, 1.2, 16, 6, stoneLight, X_OFFSET + 5, 8, -35);
        makeCyl(1.2, 1.2, 16, 6, stoneLight, X_OFFSET + 19, 8, -25);
        makeCyl(1.2, 1.2, 16, 6, stoneLight, X_OFFSET + 19, 8, -35);

        // Lady Chapel turret spires
        makeCone(0.8, 4, 6, pinnacleColor, X_OFFSET + 5, 18, -25);
        makeCone(0.8, 4, 6, pinnacleColor, X_OFFSET + 5, 18, -35);
        makeCone(0.8, 4, 6, pinnacleColor, X_OFFSET + 19, 18, -25);
        makeCone(0.8, 4, 6, pinnacleColor, X_OFFSET + 19, 18, -35);

        // West front entrance porch
        makeBox(14, 10, 4, abbeyColor, X_OFFSET - 28, 5, -30);

        // Nave side aisles
        makeBox(40, 12, 5, abbeyColor, X_OFFSET - 10, 6, -18.5);
        makeBox(40, 12, 5, abbeyColor, X_OFFSET - 10, 6, -41.5);
    }

    function buildHousesOfParliament() {
        var palaceColor = 0xd4b483;
        var stoneGrey = 0xb8a878;
        var roofDark = 0x5a5a4a;
        var clockColor = 0xc8c070;

        // Long central range - gothic riverside palace
        makeBox(90, 16, 18, palaceColor, X_OFFSET + 25, 8, 30);

        // Ornate gothic window panels along river facade
        for (var wi = 0; wi < 10; wi++) {
            makeBox(3, 8, 0.4, 0x8a9aaa, X_OFFSET - 18 + wi * 9, 10, 21.2);
        }

        // Gothic crenellations along roofline
        for (var ci = 0; ci < 18; ci++) {
            makeBox(2, 2, 1.5, palaceColor, X_OFFSET - 18 + ci * 5, 17.5, 21);
            makeBox(2, 2, 1.5, palaceColor, X_OFFSET - 18 + ci * 5, 17.5, 39);
        }

        // Roof of central range
        makeBox(90, 2, 18, roofDark, X_OFFSET + 25, 17, 30);

        // Victoria Tower at SW corner (12x12x40)
        makeBox(12, 40, 12, palaceColor, X_OFFSET - 20, 20, 39);
        // Victoria Tower pinnacles and crown
        makeCone(2, 6, 4, stoneGrey, X_OFFSET - 20, 43, 39);
        makeCone(0.8, 3, 4, stoneGrey, X_OFFSET - 14, 41.5, 33);
        makeCone(0.8, 3, 4, stoneGrey, X_OFFSET - 26, 41.5, 33);
        makeCone(0.8, 3, 4, stoneGrey, X_OFFSET - 14, 41.5, 45);
        makeCone(0.8, 3, 4, stoneGrey, X_OFFSET - 26, 41.5, 45);

        // Victoria Tower flag pole
        makeCyl(0.2, 0.2, 8, 4, 0x888888, X_OFFSET - 20, 48, 39);

        // Clock Tower / Big Ben - Elizabeth Tower (8x8x36 at NE corner)
        makeBox(8, 36, 8, palaceColor, X_OFFSET + 70, 18, 21);

        // Big Ben belfry section (wider)
        makeBox(10, 6, 10, stoneGrey, X_OFFSET + 70, 37, 21);

        // Clock face panels (four sides)
        makeBox(8, 5, 0.5, clockColor, X_OFFSET + 70, 32, 16.2);
        makeBox(8, 5, 0.5, clockColor, X_OFFSET + 70, 32, 25.8);
        makeBox(0.5, 5, 8, clockColor, X_OFFSET + 65.2, 32, 21);
        makeBox(0.5, 5, 8, clockColor, X_OFFSET + 74.8, 32, 21);

        // Big Ben spire / pyramidal roof
        makeCone(4, 10, 4, stoneGrey, X_OFFSET + 70, 45, 21);

        // Big Ben flag pole
        makeCyl(0.2, 0.2, 6, 4, 0x888888, X_OFFSET + 70, 53, 21);

        // Central Lobby dome
        makeCyl(8, 10, 12, 12, palaceColor, X_OFFSET + 25, 22, 30);
        makeSphere(8, 0x8a8a7a, X_OFFSET + 25, 30, 30);
        makeCyl(1, 1, 6, 8, stoneGrey, X_OFFSET + 25, 37, 30);

        // North wing
        makeBox(20, 14, 18, palaceColor, X_OFFSET + 70, 7, 30);

        // South wing
        makeBox(20, 14, 18, palaceColor, X_OFFSET - 20, 7, 30);

        // Ornate roofline turrets along palace
        for (var ti = 0; ti < 8; ti++) {
            makeCyl(1, 1.2, 8, 6, stoneGrey, X_OFFSET - 10 + ti * 12, 20, 21);
            makeCone(0.7, 3, 6, stoneGrey, X_OFFSET - 10 + ti * 12, 25, 21);
        }

        // Speaker's Tower mid-facade
        makeBox(8, 22, 8, palaceColor, X_OFFSET + 25, 11, 21);
        makeCone(1.5, 4, 4, stoneGrey, X_OFFSET + 25, 24, 21);
    }

    function makeSphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 10, 8);
        var mesh = makeMesh(geo, color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildWestminsterBridge() {
        var bridgeColor = 0x4a7a4a;
        var stoneColor = 0x9a9a8a;

        // Bridge deck
        makeBox(80, 1.5, 12, bridgeColor, X_OFFSET + 30, 1, 55);

        // 7 arches - represented as cylinder pier pairs with deck above
        for (var ai = 0; ai < 7; ai++) {
            // Pier left
            makeCyl(1.2, 1.5, 6, 6, stoneColor, X_OFFSET - 8 + ai * 11, -2, 51);
            // Pier right
            makeCyl(1.2, 1.5, 6, 6, stoneColor, X_OFFSET - 8 + ai * 11, -2, 59);
            // Arch suggestion - box under deck
            makeBox(10, 2, 10, bridgeColor, X_OFFSET - 3 + ai * 11, 0.5, 55);
        }

        // Bridge railings
        makeBox(80, 1, 0.3, bridgeColor, X_OFFSET + 30, 2.5, 49.2);
        makeBox(80, 1, 0.3, bridgeColor, X_OFFSET + 30, 2.5, 60.8);

        // Decorative lamp posts
        for (var li = 0; li < 8; li++) {
            makeCyl(0.2, 0.2, 4, 4, 0x888855, X_OFFSET - 15 + li * 10, 4, 49.5);
            makeSphere(0.5, 0xffffcc, X_OFFSET - 15 + li * 10, 6.5, 49.5);
            makeCyl(0.2, 0.2, 4, 4, 0x888855, X_OFFSET - 15 + li * 10, 4, 60.5);
            makeSphere(0.5, 0xffffcc, X_OFFSET - 15 + li * 10, 6.5, 60.5);
        }

        // Bridge abutments
        makeBox(6, 5, 14, stoneColor, X_OFFSET - 13, 2.5, 55);
        makeBox(6, 5, 14, stoneColor, X_OFFSET + 73, 2.5, 55);
    }

    function buildJewelTower() {
        var towerColor = 0x9a8a6a;
        var moatColor = 0x3a6a8a;

        // Jewel Tower (5x5x12) medieval tower
        makeBox(5, 12, 5, towerColor, X_OFFSET - 35, 6, 10);

        // Tower battlements
        makeCone(1, 2, 4, towerColor, X_OFFSET - 35, 13.5, 10);
        makeBox(7, 1.5, 7, towerColor, X_OFFSET - 35, 12.75, 10);

        // Corner merlons
        makeBox(1.5, 2, 1.5, towerColor, X_OFFSET - 37.5, 13.5, 12.5);
        makeBox(1.5, 2, 1.5, towerColor, X_OFFSET - 32.5, 13.5, 12.5);
        makeBox(1.5, 2, 1.5, towerColor, X_OFFSET - 37.5, 13.5, 7.5);
        makeBox(1.5, 2, 1.5, towerColor, X_OFFSET - 32.5, 13.5, 7.5);

        // Door
        makeBox(1.5, 3, 0.4, 0x5a4a2a, X_OFFSET - 35, 1.5, 7.6);

        // Moat suggestion - flat water planes
        makeBox(14, 0.2, 14, moatColor, X_OFFSET - 35, 0.1, 10);

        // Moat banks
        makeBox(16, 0.5, 2, 0x6a7a3a, X_OFFSET - 35, 0.25, 3.5);
        makeBox(16, 0.5, 2, 0x6a7a3a, X_OFFSET - 35, 0.25, 16.5);
        makeBox(2, 0.5, 14, 0x6a7a3a, X_OFFSET - 42.5, 0.25, 10);
        makeBox(2, 0.5, 14, 0x6a7a3a, X_OFFSET - 27.5, 0.25, 10);
    }

    function buildParliamentSquare() {
        // Open square paving
        makeBox(60, 0.3, 60, 0x9a9a8a, X_OFFSET - 10, 0.15, -10);

        // Churchill statue suggestion - plinth + figure
        makeBox(2, 1.5, 2, 0x888878, X_OFFSET - 5, 0.75, -5);
        makeCyl(0.4, 0.5, 2.5, 6, 0x888878, X_OFFSET - 5, 2.75, -5);
        makeSphere(0.5, 0x888878, X_OFFSET - 5, 4.25, -5);

        // Square perimeter bollards
        for (var pi = 0; pi < 8; pi++) {
            makeCyl(0.3, 0.3, 1, 6, 0x555555, X_OFFSET - 28 + pi * 8, 0.5, -38);
            makeCyl(0.3, 0.3, 1, 6, 0x555555, X_OFFSET - 28 + pi * 8, 0.5, 18);
        }

        // Trees around square
        makeCyl(0.3, 0.3, 4, 6, 0x5a3a1a, X_OFFSET - 20, 2, -35);
        makeCone(2.5, 4, 6, 0x2d5a1b, X_OFFSET - 20, 6, -35);
        makeCyl(0.3, 0.3, 4, 6, 0x5a3a1a, X_OFFSET, 2, -35);
        makeCone(2.5, 4, 6, 0x2d5a1b, X_OFFSET, 6, -35);
        makeCyl(0.3, 0.3, 4, 6, 0x5a3a1a, X_OFFSET + 20, 2, -35);
        makeCone(2.5, 4, 6, 0x2d5a1b, X_OFFSET + 20, 6, -35);
        makeCyl(0.3, 0.3, 4, 6, 0x5a3a1a, X_OFFSET - 20, 2, 15);
        makeCone(2.5, 4, 6, 0x2d5a1b, X_OFFSET - 20, 6, 15);
        makeCyl(0.3, 0.3, 4, 6, 0x5a3a1a, X_OFFSET, 2, 15);
        makeCone(2.5, 4, 6, 0x2d5a1b, X_OFFSET, 6, 15);
    }

    function buildRoadAndSurrounds() {
        // Road between Abbey and Parliament
        makeBox(20, 0.2, 80, 0x333333, X_OFFSET - 5, 0.1, 0);

        // Thames riverbank
        makeBox(160, 0.4, 20, 0x8a7a5a, X_OFFSET + 30, 0.2, 68);
        makeBox(160, 0.5, 8, 0x3a6a9a, X_OFFSET + 30, 0.25, 80);

        // Footpath along embankment
        makeBox(160, 0.3, 8, 0xaaaaaa, X_OFFSET + 30, 0.15, 63);
    }

    function build() {
        buildGroundPlane();
        buildWestminsterAbbey();
        buildHousesOfParliament();
        buildWestminsterBridge();
        buildJewelTower();
        buildParliamentSquare();
        buildRoadAndSurrounds();
    }

    function update(delta) {
        // No animated elements
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };

}());
