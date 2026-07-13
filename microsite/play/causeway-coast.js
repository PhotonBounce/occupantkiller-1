window.CausewayCoast = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 19560;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        addMesh(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        addMesh(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        addMesh(mesh);
        return mesh;
    }

    function buildCausewayColumns() {
        var basaltDark = 0x2F2F2F;
        var basaltMid = 0x3A3A3A;
        var heights = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
        var cols = 10;
        var rows = 8;
        var spacing = 1.1;
        for (var ci = 0; ci < cols; ci++) {
            for (var ri = 0; ri < rows; ri++) {
                var h = heights[(ci * rows + ri) % heights.length];
                var offsetX = (ri % 2 === 0) ? 0 : 0.55;
                var px = -10 + ci * spacing + offsetX;
                var pz = -20 + ri * spacing;
                var col = (ci + ri) % 3 === 0 ? basaltMid : basaltDark;
                makeCylinder(0.5, 0.5, h, 6, col, px, h / 2, pz);
            }
        }
        for (var ei = 0; ei < 5; ei++) {
            for (var ej = 0; ej < 6; ej++) {
                var eh = heights[(ei * 6 + ej) % heights.length];
                var eoffset = (ej % 2 === 0) ? 0 : 0.55;
                var epx = 2 + ei * spacing + eoffset;
                var epz = -15 + ej * spacing;
                makeCylinder(0.5, 0.5, eh, 6, basaltDark, epx, eh / 2, epz);
            }
        }
    }

    function buildCliffs() {
        var basaltDark = 0x2F2F2F;
        makeBox(40, 28, 6, basaltDark, -30, 14, -50);
        makeBox(30, 22, 5, basaltDark, 10, 11, -52);
        makeBox(20, 18, 5, basaltDark, 35, 9, -48);
        makeBox(15, 32, 5, basaltDark, -50, 16, -45);
        makeBox(8, 24, 8, basaltDark, 55, 12, -40);
        makeBox(6, 30, 6, basaltDark, -55, 15, -42);
        makeBox(10, 20, 6, basaltDark, 60, 10, -55);
    }

    function buildChimneyTops() {
        var basaltDark = 0x2F2F2F;
        makeCylinder(1.5, 2.0, 18, 6, basaltDark, 45, 9, -35);
        makeCylinder(1.2, 1.6, 22, 6, basaltDark, 48, 11, -30);
        makeCylinder(1.0, 1.4, 15, 6, basaltDark, 43, 7.5, -38);
        makeCylinder(0.8, 1.1, 12, 6, basaltDark, 51, 6, -33);
        makeCylinder(1.3, 1.8, 20, 6, basaltDark, 55, 10, -28);
    }

    function buildVisitorCentre() {
        var concrete = 0x696969;
        var turfDark = 0x3B5323;
        var glass = 0x708090;
        makeBox(30, 6, 18, concrete, 20, 3, 30);
        makeBox(30, 1.5, 18, turfDark, 20, 6.75, 30);
        makeBox(14, 6, 18, concrete, -8, 3, 30);
        makeBox(14, 1.5, 18, turfDark, -8, 6.75, 30);
        makeBox(0.3, 5, 18, glass, 5, 3.5, 30);
        makeBox(30, 4, 0.3, glass, 20, 2, 21);
        makeBox(14, 4, 0.3, glass, -8, 2, 21);
        makeBox(4, 5, 0.3, concrete, 20, 2.5, 39);
        makeBox(4, 5, 0.3, concrete, -8, 2.5, 39);
    }

    function buildFinnMacCool() {
        var skinColor = 0xC68642;
        var cloakColor = 0x8B4513;
        var boulderColor = 0x4A4A4A;
        makeBox(3, 8, 2, cloakColor, -18, 4, -5);
        makeSphere(1.5, 8, 8, skinColor, -18, 9.5, -5);
        makeBox(5, 1.5, 1, cloakColor, -18, 7, -5);
        makeBox(1, 4, 1, cloakColor, -20.5, 4, -5);
        makeBox(1, 4, 1, cloakColor, -15.5, 4, -5);
        makeBox(6, 2, 3, boulderColor, -18, 1, -5);
        makeBox(1.5, 5, 1.5, boulderColor, -17, 2.5, -3);
    }

    function buildCarrickARede() {
        var cliffGray = 0x808080;
        var ropeColor = 0x8B6914;
        var plankColor = 0xA0522D;
        var islandColor = 0x556B2F;
        makeBox(8, 12, 8, cliffGray, -80, 6, 10);
        makeBox(6, 8, 6, islandColor, -110, 4, 10);
        makeBox(3, 10, 3, cliffGray, -110, 5, 10);
        var bridgeLen = 30;
        var numPlanks = 12;
        for (var pi = 0; pi < numPlanks; pi++) {
            var plankX = -83 - (pi * bridgeLen / numPlanks);
            makeBox(2, 0.15, 0.6, plankColor, plankX, 7.5 - pi * 0.04, 10);
        }
        makeCylinder(0.15, 0.15, 8, 6, ropeColor, -80, 11, 8);
        makeCylinder(0.15, 0.15, 8, 6, ropeColor, -80, 11, 12);
        makeCylinder(0.15, 0.15, 8, 6, ropeColor, -110, 8, 8);
        makeCylinder(0.15, 0.15, 8, 6, ropeColor, -110, 8, 12);
        makeBox(0.08, 6, 0.08, ropeColor, -95, 10, 8);
        makeBox(0.08, 6, 0.08, ropeColor, -95, 10, 12);
    }

    function buildDunluceCastle() {
        var stoneGray = 0x808080;
        var darkStone = 0x606060;
        makeBox(18, 10, 12, stoneGray, 120, 5, -30);
        makeBox(20, 6, 14, stoneGray, 120, 3, -30);
        makeCylinder(2.5, 2.5, 14, 8, darkStone, 112, 7, -24);
        makeCylinder(2.5, 2.5, 14, 8, darkStone, 128, 7, -24);
        makeCylinder(2.5, 2.5, 14, 8, darkStone, 112, 7, -36);
        makeCylinder(2.5, 2.5, 14, 8, darkStone, 128, 7, -36);
        makeCylinder(1.5, 1.5, 4, 8, darkStone, 112, 16, -24);
        makeCylinder(1.5, 1.5, 4, 8, darkStone, 128, 16, -24);
        makeCylinder(1.5, 1.5, 4, 8, darkStone, 112, 16, -36);
        makeCylinder(1.5, 1.5, 4, 8, darkStone, 128, 16, -36);
        makeBox(20, 8, 4, stoneGray, 120, 4, -44);
        makeBox(6, 14, 6, darkStone, 110, 7, -45);
        makeBox(6, 12, 6, darkStone, 130, 6, -45);
        makeBox(20, 1.5, 12, 0x4A5C40, 120, 10, -30);
        makeBox(25, 6, 5, stoneGray, 120, 3, -58);
    }

    function buildOcean() {
        var oceanBlue = 0x1E6BA8;
        var waveWhite = 0xFFFAF0;
        var deepBlue = 0x0D4C7A;
        makeBox(300, 2, 60, oceanBlue, 0, -1, -80);
        makeBox(300, 1, 40, deepBlue, 0, -2, -120);
        makeBox(300, 0.5, 20, deepBlue, 0, -1.5, -150);
        for (var wi = 0; wi < 10; wi++) {
            makeBox(20, 0.6, 1.2, waveWhite, -100 + wi * 22, 0.2, -62 - (wi % 3) * 4);
        }
        for (var wj = 0; wj < 8; wj++) {
            makeBox(15, 0.5, 1.0, waveWhite, -80 + wj * 25, 0.15, -72 - (wj % 4) * 3);
        }
        for (var wk = 0; wk < 6; wk++) {
            makeBox(18, 0.4, 0.8, waveWhite, -90 + wk * 30, 0.1, -85 - (wk % 3) * 5);
        }
    }

    function buildBushmillsVillage() {
        var villageRed = 0xCD5C5C;
        var cream = 0xFFF8DC;
        var slate = 0x708090;
        var distilleryBrick = 0xB22222;
        makeBox(8, 7, 6, cream, 80, 3.5, 60);
        makeBox(8, 1.5, 6, slate, 80, 7.75, 60);
        makeBox(7, 6, 5, villageRed, 91, 3, 60);
        makeBox(7, 1.5, 5, slate, 91, 6.75, 60);
        makeBox(6, 8, 5, cream, 100, 4, 58);
        makeBox(6, 1.5, 5, slate, 100, 8.75, 58);
        makeBox(5, 6, 5, villageRed, 70, 3, 62);
        makeBox(5, 1.5, 5, slate, 70, 6.75, 62);
        makeBox(12, 9, 10, distilleryBrick, 85, 4.5, 75);
        makeBox(12, 1.5, 10, slate, 85, 9.25, 75);
        makeCylinder(2, 2, 14, 12, distilleryBrick, 79, 7, 74);
        makeCylinder(2, 2, 14, 12, distilleryBrick, 91, 7, 74);
        makeBox(1, 6, 0.3, cream, 80, 3, 57);
        makeBox(1, 6, 0.3, cream, 91, 3, 57);
        makeBox(1, 6, 0.3, cream, 100, 3, 55.5);
        makeBox(20, 0.2, 6, 0x808070, 85, 0.1, 55);
    }

    function buildHeadlands() {
        var basaltDark = 0x2F2F2F;
        var basaltMid = 0x3D3D3D;
        makeBox(25, 8, 20, basaltDark, -70, 4, -38);
        makeBox(15, 5, 12, basaltMid, -78, 2.5, -42);
        makeBox(10, 6, 8, basaltDark, -82, 3, -36);
        makeBox(30, 10, 22, basaltDark, 65, 5, -40);
        makeBox(18, 7, 14, basaltMid, 72, 3.5, -46);
        makeBox(12, 8, 8, basaltDark, 78, 4, -38);
        makeBox(20, 9, 16, basaltDark, 100, 4.5, -50);
        makeBox(10, 6, 10, basaltMid, 107, 3, -54);
        makeCylinder(3, 4, 10, 6, basaltDark, -74, 5, -35);
        makeCylinder(2.5, 3, 8, 6, basaltDark, 70, 4, -43);
        makeCylinder(2, 2.8, 12, 6, basaltDark, 103, 6, -47);
    }

    function buildGroundTerrain() {
        var grassGreen = 0x4A7C40;
        var darkGrass = 0x3B6132;
        var pathGray = 0x9E9E8A;
        var rockGray = 0x5A5A5A;
        makeBox(300, 1, 100, grassGreen, 0, -0.5, 30);
        makeBox(300, 0.8, 40, darkGrass, 0, -0.4, -5);
        makeBox(300, 0.6, 20, rockGray, 0, -0.3, -25);
        makeBox(4, 0.3, 60, pathGray, -15, 0.15, 20);
        makeBox(3, 0.3, 80, pathGray, 60, 0.15, 40);
        makeBox(60, 0.2, 2, pathGray, 10, 0.1, 28);
    }

    function buildExtraBasaltFeatures() {
        var basaltDark = 0x2F2F2F;
        var basaltLight = 0x4F4F4F;
        makeBox(5, 3, 5, basaltDark, 20, 1.5, -10);
        makeBox(4, 2, 4, basaltLight, 24, 1, -12);
        makeBox(3, 4, 3, basaltDark, 17, 2, -8);
        makeBox(6, 2, 4, basaltDark, -5, 1, -18);
        makeBox(4, 3, 3, basaltLight, -8, 1.5, -15);
        makeCylinder(0.5, 0.6, 3, 6, basaltDark, 22, 1.5, -6);
        makeCylinder(0.4, 0.5, 4, 6, basaltDark, 24, 2, -4);
        makeCylinder(0.5, 0.55, 2.5, 6, basaltDark, 20, 1.25, -4);
        makeCylinder(0.45, 0.5, 5, 6, basaltDark, 26, 2.5, -8);
        makeCylinder(0.5, 0.6, 3.5, 6, basaltLight, 18, 1.75, -2);
        makeBox(8, 4, 5, basaltDark, -25, 2, -22);
        makeBox(5, 6, 4, basaltDark, -32, 3, -18);
    }

    function buildLighthouse() {
        var whiteColor = 0xFFFFFF;
        var redBand = 0xFF3333;
        var lightGlass = 0xFFFF99;
        makeCylinder(1.5, 2, 20, 10, whiteColor, -60, 10, 50);
        makeCylinder(1.8, 1.8, 2, 10, redBand, -60, 21, 50);
        makeCylinder(1.2, 1.2, 3, 10, lightGlass, -60, 23.5, 50);
        makeCylinder(1.5, 1.5, 1, 10, whiteColor, -60, 25.5, 50);
        makeBox(5, 3, 5, whiteColor, -60, 1.5, 50);
    }

    function buildSeabirdsAndRocks() {
        var rockColor = 0x6E6E6E;
        var darkRock = 0x454545;
        for (var ri = 0; ri < 8; ri++) {
            var rx = -40 + ri * 12;
            var rz = -60 - (ri % 3) * 6;
            var rh = 1 + (ri % 4) * 0.5;
            makeCylinder(0.8 + ri * 0.1, 1.2 + ri * 0.1, rh, 6, rockColor, rx, rh / 2, rz);
        }
        makeBox(3, 1.5, 2, darkRock, -60, 0.75, -55);
        makeBox(2, 2, 2, darkRock, -65, 1, -52);
        makeBox(4, 1, 3, darkRock, -55, 0.5, -58);
    }

    function build() {
        buildGroundTerrain();
        buildOcean();
        buildCausewayColumns();
        buildCliffs();
        buildChimneyTops();
        buildVisitorCentre();
        buildFinnMacCool();
        buildCarrickARede();
        buildDunluceCastle();
        buildBushmillsVillage();
        buildHeadlands();
        buildExtraBasaltFeatures();
        buildLighthouse();
        buildSeabirdsAndRocks();
    }

    function update(delta) {
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
