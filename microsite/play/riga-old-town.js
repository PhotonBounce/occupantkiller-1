window.RigaOldTown = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 23400;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.set(rx, ry, rz);
        if (sx !== undefined) mesh.scale.set(sx, sy, sz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function mat(color, opts) {
        var params = { color: color };
        if (opts) {
            if (opts.emissive !== undefined) params.emissive = opts.emissive;
            if (opts.wireframe !== undefined) params.wireframe = opts.wireframe;
        }
        return new THREE.MeshLambertMaterial(params);
    }

    function build() {
        buildGround();
        buildDaugavaRiver();
        buildOldTownStreets();
        buildHanseaticHouses();
        buildRigaCathedral();
        buildFreedomMonument();
        buildHouseOfBlackheads();
        buildLatvianNationalOpera();
        buildStPetersChurch();
        buildThreeBrothers();
        buildPowderTower();
        buildCentralMarket();
        buildCatSculptures();
        buildCityWallFragments();
        buildStreetDetails();
    }

    function buildGround() {
        // Ground plane built from box slabs — no PlaneGeometry
        var groundMat = mat(0x5A7A4A);
        var g1 = new THREE.BoxGeometry(1200, 2, 1200);
        addMesh(g1, groundMat, OX, OY - 1, OZ);

        // Cobblestone street patches (darker)
        var cobbleMat = mat(0x887766);
        var g2 = new THREE.BoxGeometry(600, 1, 800);
        addMesh(g2, cobbleMat, OX - 100, OY - 0.5, OZ);

        var g3 = new THREE.BoxGeometry(400, 1, 600);
        addMesh(g3, cobbleMat, OX + 200, OY - 0.5, OZ + 50);
    }

    function buildDaugavaRiver() {
        // Wide river west of Old Town
        var riverMat = mat(0x2A6A8A);
        var riverBase = new THREE.BoxGeometry(300, 1, 1200);
        addMesh(riverBase, riverMat, OX - 500, OY - 0.8, OZ);

        // River surface shimmer layer
        var riverSurf = new THREE.BoxGeometry(298, 0.5, 1198);
        var riverSurfMat = mat(0x3A7A9A);
        addMesh(riverSurf, riverSurfMat, OX - 500, OY + 0.1, OZ);

        // Riverbank embankment
        var bankMat = mat(0x7A6A5A);
        var bank1 = new THREE.BoxGeometry(20, 4, 1200);
        addMesh(bank1, bankMat, OX - 350, OY + 1, OZ);

        var bank2 = new THREE.BoxGeometry(20, 4, 1200);
        addMesh(bank2, bankMat, OX - 651, OY + 1, OZ);

        // Stone quay steps
        var quayMat = mat(0xAA9988);
        var quay1 = new THREE.BoxGeometry(18, 2, 600);
        addMesh(quay1, quayMat, OX - 355, OY + 0.5, OZ);
        var quay2 = new THREE.BoxGeometry(16, 1, 600);
        addMesh(quay2, quayMat, OX - 360, OY + 1, OZ);
    }

    function buildOldTownStreets() {
        var streetMat = mat(0x887766);
        // Main east-west street
        var s1 = new THREE.BoxGeometry(500, 0.5, 18);
        addMesh(s1, streetMat, OX, OY + 0.2, OZ);
        // North-south street
        var s2 = new THREE.BoxGeometry(18, 0.5, 500);
        addMesh(s2, streetMat, OX, OY + 0.2, OZ);
        // Diagonal alley
        var s3 = new THREE.BoxGeometry(300, 0.5, 12);
        var m3 = addMesh(s3, streetMat, OX + 80, OY + 0.2, OZ + 120);
        m3.rotation.y = 0.4;
        // Side streets
        var s4 = new THREE.BoxGeometry(200, 0.5, 10);
        addMesh(s4, streetMat, OX - 80, OY + 0.2, OZ - 150);
        var s5 = new THREE.BoxGeometry(200, 0.5, 10);
        addMesh(s5, streetMat, OX + 120, OY + 0.2, OZ + 200);
    }

    function buildHanseaticHouses() {
        // Row of Hanseatic merchant houses — red/orange/ochre gabled facades
        var colors = [0xCC4422, 0xDD6633, 0xCC8822, 0xBB5511, 0xEE7733, 0xCC6622, 0xDD9944];
        var roofColors = [0x882200, 0x993311, 0xAA4400, 0x771100, 0xBB5500, 0x882200, 0x993300];

        for (var i = 0; i < 7; i++) {
            var hx = OX - 120 + i * 38;
            var hz = OZ - 200;
            var width = 28 + (i % 3) * 4;
            var height = 22 + (i % 4) * 6;
            var depth = 35;

            // Main house body
            var houseMat = mat(colors[i]);
            var houseGeo = new THREE.BoxGeometry(width, height, depth);
            addMesh(houseGeo, houseMat, hx, OY + height / 2, hz);

            // Stepped gable
            var gableMat = mat(colors[i]);
            var gableGeo = new THREE.BoxGeometry(width - 4, 8, 3);
            addMesh(gableGeo, gableMat, hx, OY + height + 4, hz - depth / 2 + 1.5);

            var gableTop = new THREE.BoxGeometry(width - 10, 5, 3);
            addMesh(gableTop, gableMat, hx, OY + height + 10.5, hz - depth / 2 + 1.5);

            var gablePeak = new THREE.ConeGeometry(4, 7, 4);
            var roofMat = mat(roofColors[i]);
            addMesh(gablePeak, roofMat, hx, OY + height + 17, hz - depth / 2 + 1.5, 0, Math.PI / 4, 0);

            // Windows (dark recesses)
            var winMat = mat(0x334455);
            for (var w = 0; w < 3; w++) {
                var winGeo = new THREE.BoxGeometry(4, 5, 1);
                addMesh(winGeo, winMat, hx - 6 + w * 6, OY + height * 0.6, hz - depth / 2 - 0.5);
            }

            // Door
            var doorMat = mat(0x442200);
            var doorGeo = new THREE.BoxGeometry(4, 7, 1);
            addMesh(doorGeo, doorMat, hx, OY + 3.5, hz - depth / 2 - 0.5);
        }

        // Second row — north side
        for (var j = 0; j < 5; j++) {
            var hx2 = OX - 80 + j * 42;
            var hz2 = OZ + 180;
            var wid = 30 + (j % 3) * 6;
            var hgt = 20 + (j % 3) * 8;

            var hMat2 = mat(colors[(j + 2) % 7]);
            var hGeo2 = new THREE.BoxGeometry(wid, hgt, 30);
            addMesh(hGeo2, hMat2, hx2, OY + hgt / 2, hz2);

            var rMat2 = mat(roofColors[(j + 2) % 7]);
            var rGeo2 = new THREE.ConeGeometry(wid * 0.6, 10, 4);
            addMesh(rGeo2, rMat2, hx2, OY + hgt + 5, hz2, 0, Math.PI / 4, 0);
        }
    }

    function buildRigaCathedral() {
        // Riga Cathedral — Doma baznīca, Romanesque, widest in Baltics
        var cathedralX = OX + 50;
        var cathedralZ = OZ - 50;
        var cathedralMat = mat(0xD4C8A0);
        var stoneDarkMat = mat(0xB8AC90);

        // Main nave — wide and long
        var naveGeo = new THREE.BoxGeometry(80, 28, 120);
        addMesh(naveGeo, cathedralMat, cathedralX, OY + 14, cathedralZ);

        // Nave roof — peaked ridge
        var naveRoofGeo = new THREE.CylinderGeometry(0, 45, 20, 4, 1);
        addMesh(naveRoofGeo, stoneDarkMat, cathedralX, OY + 38, cathedralZ, 0, Math.PI / 4, 0);

        // Main tower (90m — scaled to 90 units)
        var towerGeo = new THREE.BoxGeometry(18, 90, 18);
        addMesh(towerGeo, cathedralMat, cathedralX - 20, OY + 45, cathedralZ - 55);

        // Tower spire
        var spireGeo = new THREE.ConeGeometry(10, 30, 4);
        addMesh(spireGeo, stoneDarkMat, cathedralX - 20, OY + 105, cathedralZ - 55, 0, Math.PI / 4, 0);

        // Tower cap ring
        var towerCapGeo = new THREE.CylinderGeometry(11, 11, 4, 8);
        addMesh(towerCapGeo, cathedralMat, cathedralX - 20, OY + 92, cathedralZ - 55);

        // Transept (cross arm)
        var transeptGeo = new THREE.BoxGeometry(130, 22, 35);
        addMesh(transeptGeo, cathedralMat, cathedralX, OY + 11, cathedralZ);

        // Transept roofs
        var transRoofL = new THREE.ConeGeometry(20, 15, 4);
        addMesh(transRoofL, stoneDarkMat, cathedralX - 55, OY + 29, cathedralZ, 0, Math.PI / 4, 0);
        var transRoofR = new THREE.ConeGeometry(20, 15, 4);
        addMesh(transRoofR, stoneDarkMat, cathedralX + 55, OY + 29, cathedralZ, 0, Math.PI / 4, 0);

        // Apse (semicircular east end) — approximated with cylinder
        var apseGeo = new THREE.CylinderGeometry(22, 22, 20, 8, 1, false, 0, Math.PI);
        addMesh(apseGeo, cathedralMat, cathedralX, OY + 10, cathedralZ + 60, 0, Math.PI, 0);

        var apseRoofGeo = new THREE.ConeGeometry(22, 14, 8);
        addMesh(apseRoofGeo, stoneDarkMat, cathedralX, OY + 27, cathedralZ + 60);

        // Cloister courtyard walls
        var cloisterMat = mat(0xC8BC98);
        var cloisterN = new THREE.BoxGeometry(60, 10, 4);
        addMesh(cloisterN, cloisterMat, cathedralX, OY + 5, cathedralZ + 85);
        var cloisterE = new THREE.BoxGeometry(4, 10, 40);
        addMesh(cloisterE, cloisterMat, cathedralX + 30, OY + 5, cathedralZ + 105);
        var cloisterW = new THREE.BoxGeometry(4, 10, 40);
        addMesh(cloisterW, cloisterMat, cathedralX - 30, OY + 5, cathedralZ + 105);

        // Cloister arcade pillars
        var pillarMat = mat(0xD4C8A0);
        for (var p = 0; p < 5; p++) {
            var pillarGeo = new THREE.CylinderGeometry(1.5, 1.5, 10, 6);
            addMesh(pillarGeo, pillarMat, cathedralX - 20 + p * 10, OY + 5, cathedralZ + 85);
        }

        // Buttresses
        var buttMat = mat(0xBEB290);
        for (var b = 0; b < 4; b++) {
            var buttGeo = new THREE.BoxGeometry(6, 24, 8);
            addMesh(buttGeo, buttMat, cathedralX - 38, OY + 12, cathedralZ - 40 + b * 26);
            var buttGeo2 = new THREE.BoxGeometry(6, 24, 8);
            addMesh(buttGeo2, buttMat, cathedralX + 38, OY + 12, cathedralZ - 40 + b * 26);
        }

        // Cathedral entrance portal arch
        var portalMat = mat(0xC0B488);
        var portalGeo = new THREE.BoxGeometry(14, 18, 4);
        addMesh(portalGeo, portalMat, cathedralX - 20, OY + 9, cathedralZ - 62);
        var archGeo = new THREE.CylinderGeometry(7, 7, 4, 8, 1, false, 0, Math.PI);
        addMesh(archGeo, portalMat, cathedralX - 20, OY + 18, cathedralZ - 62, Math.PI / 2, 0, 0);
    }

    function buildFreedomMonument() {
        // Brīvības piemineklis — 42m granite, Liberty figure with 3 stars
        var monX = OX + 250;
        var monZ = OZ + 20;
        var graniteMat = mat(0xC8C0A0);
        var goldMat = mat(0xFFCC00);
        var darkStoneMat = mat(0x8A8070);

        // Stepped base (wide marble steps)
        var base1Geo = new THREE.BoxGeometry(28, 3, 28);
        addMesh(base1Geo, mat(0xDDD5B8), monX, OY + 1.5, monZ);
        var base2Geo = new THREE.BoxGeometry(22, 3, 22);
        addMesh(base2Geo, graniteMat, monX, OY + 4.5, monZ);
        var base3Geo = new THREE.BoxGeometry(16, 3, 16);
        addMesh(base3Geo, graniteMat, monX, OY + 7.5, monZ);

        // Main shaft — tall granite column
        var shaftGeo = new THREE.BoxGeometry(8, 30, 8);
        addMesh(shaftGeo, graniteMat, monX, OY + 25, monZ);

        // Upper pedestal
        var pedGeo = new THREE.BoxGeometry(10, 5, 10);
        addMesh(pedGeo, darkStoneMat, monX, OY + 42.5, monZ);

        // Liberty figure — cylindrical torso
        var figBodyGeo = new THREE.CylinderGeometry(1.8, 2.2, 7, 8);
        addMesh(figBodyGeo, graniteMat, monX, OY + 48.5, monZ);

        // Liberty figure — head sphere
        var figHeadGeo = new THREE.SphereGeometry(1.5, 8, 6);
        addMesh(figHeadGeo, graniteMat, monX, OY + 53, monZ);

        // Arms outstretched holding stars aloft
        var armLGeo = new THREE.BoxGeometry(5, 1.2, 1.2);
        addMesh(armLGeo, graniteMat, monX - 3.5, OY + 51, monZ);
        var armRGeo = new THREE.BoxGeometry(5, 1.2, 1.2);
        addMesh(armRGeo, graniteMat, monX + 3.5, OY + 51, monZ);

        // Three golden stars held aloft
        var star1Geo = new THREE.SphereGeometry(1.2, 6, 4);
        addMesh(star1Geo, goldMat, monX - 2.5, OY + 55, monZ);
        var star2Geo = new THREE.SphereGeometry(1.2, 6, 4);
        addMesh(star2Geo, goldMat, monX, OY + 56, monZ);
        var star3Geo = new THREE.SphereGeometry(1.2, 6, 4);
        addMesh(star3Geo, goldMat, monX + 2.5, OY + 55, monZ);

        // Relief panels on shaft sides
        var reliefMat = mat(0xB0A888);
        var reliefGeo = new THREE.BoxGeometry(7, 10, 1);
        addMesh(reliefGeo, reliefMat, monX, OY + 18, monZ - 4.5);
        var reliefGeo2 = new THREE.BoxGeometry(7, 10, 1);
        addMesh(reliefGeo2, reliefMat, monX, OY + 18, monZ + 4.5);
    }

    function buildHouseOfBlackheads() {
        // Melngalvju nams — Dutch Renaissance-Gothic, ornate carved facade
        var bhX = OX + 80;
        var bhZ = OZ - 30;
        var facadeMat = mat(0xDD9944);
        var stoneMat = mat(0xC88833);
        var goldMat = mat(0xFFCC44);
        var darkMat = mat(0x885522);

        // Main building body — two bays
        var bodyGeo = new THREE.BoxGeometry(36, 26, 30);
        addMesh(bodyGeo, facadeMat, bhX, OY + 13, bhZ);

        // Left stepped gable
        var lgStep1 = new THREE.BoxGeometry(16, 8, 4);
        addMesh(lgStep1, facadeMat, bhX - 10, OY + 30, bhZ - 13);
        var lgStep2 = new THREE.BoxGeometry(12, 6, 4);
        addMesh(lgStep2, facadeMat, bhX - 10, OY + 37, bhZ - 13);
        var lgStep3 = new THREE.BoxGeometry(8, 5, 4);
        addMesh(lgStep3, facadeMat, bhX - 10, OY + 43, bhZ - 13);
        var lgPeak = new THREE.ConeGeometry(4, 8, 4);
        addMesh(lgPeak, stoneMat, bhX - 10, OY + 50, bhZ - 13, 0, Math.PI / 4, 0);

        // Right stepped gable
        var rgStep1 = new THREE.BoxGeometry(16, 8, 4);
        addMesh(rgStep1, facadeMat, bhX + 10, OY + 30, bhZ - 13);
        var rgStep2 = new THREE.BoxGeometry(12, 6, 4);
        addMesh(rgStep2, facadeMat, bhX + 10, OY + 37, bhZ - 13);
        var rgStep3 = new THREE.BoxGeometry(8, 5, 4);
        addMesh(rgStep3, facadeMat, bhX + 10, OY + 43, bhZ - 13);
        var rgPeak = new THREE.ConeGeometry(4, 8, 4);
        addMesh(rgPeak, stoneMat, bhX + 10, OY + 50, bhZ - 13, 0, Math.PI / 4, 0);

        // Ornate clock / rose window element
        var roseGeo = new THREE.CylinderGeometry(5, 5, 1, 12);
        addMesh(roseGeo, stoneMat, bhX, OY + 20, bhZ - 15.5, Math.PI / 2, 0, 0);

        // Windows — pointed Gothic arched approximations
        var winMat = mat(0x445566);
        for (var i = 0; i < 6; i++) {
            var wGeo = new THREE.BoxGeometry(3.5, 6, 1);
            addMesh(wGeo, winMat, bhX - 10 + i * 4, OY + 15, bhZ - 15.5);
            var wTopGeo = new THREE.ConeGeometry(1.75, 3, 4);
            addMesh(wTopGeo, winMat, bhX - 10 + i * 4, OY + 21, bhZ - 15.5, 0, Math.PI / 4, 0);
        }

        // Golden statues on facade
        var statGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 6);
        addMesh(statGeo, goldMat, bhX - 14, OY + 28, bhZ - 15);
        var statGeo2 = new THREE.CylinderGeometry(0.8, 0.8, 4, 6);
        addMesh(statGeo2, goldMat, bhX + 14, OY + 28, bhZ - 15);

        // Entrance arch
        var entryGeo = new THREE.BoxGeometry(5, 8, 2);
        addMesh(entryGeo, darkMat, bhX, OY + 4, bhZ - 15.5);
        var archTopGeo = new THREE.CylinderGeometry(2.5, 2.5, 2, 8, 1, false, 0, Math.PI);
        addMesh(archTopGeo, darkMat, bhX, OY + 8, bhZ - 15.5, Math.PI / 2, 0, 0);
    }

    function buildLatvianNationalOpera() {
        // Neoclassical opera house with white columns, green park
        var opX = OX + 220;
        var opZ = OZ - 200;
        var operaMat = mat(0xF0EDE8);
        var columnMat = mat(0xF5F2EE);
        var roofMat = mat(0xD8D4CC);

        // Main building body
        var operaBodyGeo = new THREE.BoxGeometry(70, 20, 45);
        addMesh(operaBodyGeo, operaMat, opX, OY + 10, opZ);

        // Pediment (triangular gable over entrance)
        var pedimentGeo = new THREE.CylinderGeometry(0, 38, 12, 4);
        addMesh(pedimentGeo, roofMat, opX, OY + 26, opZ - 20, 0, Math.PI / 4, 0);

        // Dome
        var domeGeo = new THREE.SphereGeometry(12, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        addMesh(domeGeo, roofMat, opX, OY + 22, opZ + 5);
        var domeDrumGeo = new THREE.CylinderGeometry(12, 12, 4, 10);
        addMesh(domeDrumGeo, operaMat, opX, OY + 20, opZ + 5);

        // Columns across facade (6 columns)
        for (var c = 0; c < 6; c++) {
            var colGeo = new THREE.CylinderGeometry(1.4, 1.6, 16, 8);
            addMesh(colGeo, columnMat, opX - 17.5 + c * 7, OY + 8, opZ - 22.5);
            // Column capital
            var capGeo = new THREE.BoxGeometry(4, 2, 4);
            addMesh(capGeo, columnMat, opX - 17.5 + c * 7, OY + 17, opZ - 22.5);
        }

        // Side wings
        var wingL = new THREE.BoxGeometry(15, 16, 40);
        addMesh(wingL, operaMat, opX - 42.5, OY + 8, opZ + 2.5);
        var wingR = new THREE.BoxGeometry(15, 16, 40);
        addMesh(wingR, operaMat, opX + 42.5, OY + 8, opZ + 2.5);

        // Green park surrounding — low hedge boxes
        var parkMat = mat(0x3A7A2A);
        var hedge1 = new THREE.BoxGeometry(80, 2, 5);
        addMesh(hedge1, parkMat, opX, OY + 1, opZ - 40);
        var hedge2 = new THREE.BoxGeometry(5, 2, 50);
        addMesh(hedge2, parkMat, opX - 45, OY + 1, opZ - 15);
        var hedge3 = new THREE.BoxGeometry(5, 2, 50);
        addMesh(hedge3, parkMat, opX + 45, OY + 1, opZ - 15);

        // Park trees — cone shapes
        var treeTrunkMat = mat(0x5A3A1A);
        var treeLeafMat = mat(0x2A6A1A);
        for (var t = 0; t < 5; t++) {
            var trunkGeo = new THREE.CylinderGeometry(0.8, 1.0, 5, 6);
            addMesh(trunkGeo, treeTrunkMat, opX - 40 + t * 20, OY + 2.5, opZ - 55);
            var leafGeo = new THREE.ConeGeometry(5, 10, 7);
            addMesh(leafGeo, treeLeafMat, opX - 40 + t * 20, OY + 12, opZ - 55);
        }
    }

    function buildStPetersChurch() {
        // Gothic red brick — 123m spire (tallest), massive presence
        var spX = OX - 50;
        var spZ = OZ + 80;
        var brickMat = mat(0x8A5A4A);
        var darkBrickMat = mat(0x6A4A3A);
        var stoneMat = mat(0x8A7A6A);

        // Red brick nave
        var naveGeo = new THREE.BoxGeometry(40, 24, 80);
        addMesh(naveGeo, brickMat, spX, OY + 12, spZ);

        // Nave roof — steep Gothic pitch
        var naveRoofGeo = new THREE.CylinderGeometry(0, 24, 20, 4);
        addMesh(naveRoofGeo, darkBrickMat, spX, OY + 34, spZ, 0, Math.PI / 4, 0);

        // Main tower base — massive
        var towerBaseGeo = new THREE.BoxGeometry(22, 40, 22);
        addMesh(towerBaseGeo, brickMat, spX, OY + 20, spZ - 38);

        // Tower middle section with gallery
        var towerMidGeo = new THREE.BoxGeometry(18, 30, 18);
        addMesh(towerMidGeo, brickMat, spX, OY + 55, spZ - 38);

        // Octagonal spire shaft
        var spireShaftGeo = new THREE.CylinderGeometry(8, 9, 35, 8);
        addMesh(spireShaftGeo, stoneMat, spX, OY + 88, spZ - 38);

        // Spire tip — very tall cone (123m total scaled)
        var spireConeGeo = new THREE.ConeGeometry(8, 50, 8);
        addMesh(spireConeGeo, darkBrickMat, spX, OY + 117, spZ - 38);

        // Side aisles
        var aisleL = new THREE.BoxGeometry(12, 16, 70);
        addMesh(aisleL, brickMat, spX - 26, OY + 8, spZ);
        var aisleR = new THREE.BoxGeometry(12, 16, 70);
        addMesh(aisleR, brickMat, spX + 26, OY + 8, spZ);

        // Flying buttresses
        var fbMat = mat(0x7A6A5A);
        for (var b = 0; b < 4; b++) {
            var fb1 = new THREE.BoxGeometry(10, 3, 2);
            var fbMesh = addMesh(fb1, fbMat, spX - 23, OY + 14, spZ - 30 + b * 22);
            fbMesh.rotation.z = 0.4;
            var fb2 = new THREE.BoxGeometry(10, 3, 2);
            var fbMesh2 = addMesh(fb2, fbMat, spX + 23, OY + 14, spZ - 30 + b * 22);
            fbMesh2.rotation.z = -0.4;
        }

        // Gothic pointed windows — tall narrow
        var winMat = mat(0x334455);
        for (var w = 0; w < 5; w++) {
            var wGeo = new THREE.BoxGeometry(3, 8, 1);
            addMesh(wGeo, winMat, spX - 14 + w * 7, OY + 16, spZ - 40.5);
        }
    }

    function buildThreeBrothers() {
        // Oldest three medieval stone houses side by side
        var tbX = OX - 150;
        var tbZ = OZ + 50;
        var stoneColors = [0xD4C8A0, 0xC8BC8C, 0xDCD0B0];
        var roofCols = [0x886644, 0x7A5A38, 0x997755];
        var widths = [14, 12, 16];
        var heights = [18, 22, 15];

        for (var i = 0; i < 3; i++) {
            var bx = tbX + i * 18;
            var hMat = mat(stoneColors[i]);
            var rMat = mat(roofCols[i]);

            // House body
            var hGeo = new THREE.BoxGeometry(widths[i], heights[i], 28);
            addMesh(hGeo, hMat, bx, OY + heights[i] / 2, tbZ);

            // Gabled roof
            var rGeo = new THREE.CylinderGeometry(0, widths[i] * 0.6, 10, 4);
            addMesh(rGeo, rMat, bx, OY + heights[i] + 5, tbZ, 0, Math.PI / 4, 0);

            // Facade details — window slots
            var wMat = mat(0x443322);
            for (var w = 0; w < 2; w++) {
                var wGeo = new THREE.BoxGeometry(2.5, 4, 1);
                addMesh(wGeo, wMat, bx - 3 + w * 6, OY + heights[i] * 0.55, tbZ - 14.5);
            }

            // Door
            var dGeo = new THREE.BoxGeometry(3, 5, 1);
            addMesh(dGeo, mat(0x332211), bx, OY + 2.5, tbZ - 14.5);
        }
    }

    function buildPowderTower() {
        // Pulvertornis — medieval round tower, only survivor of city walls
        var ptX = OX - 200;
        var ptZ = OZ + 20;
        var towerMat = mat(0xC87820);
        var merlonMat = mat(0xA86810);

        // Round tower body
        var towerGeo = new THREE.CylinderGeometry(10, 12, 35, 12);
        addMesh(towerGeo, towerMat, ptX, OY + 17.5, ptZ);

        // Conical roof
        var roofGeo = new THREE.ConeGeometry(11, 15, 12);
        addMesh(roofGeo, mat(0x663300), ptX, OY + 42.5, ptZ);

        // Battlements (merlons) around top
        for (var m = 0; m < 12; m++) {
            var angle = (m / 12) * Math.PI * 2;
            var mx = ptX + Math.cos(angle) * 10.5;
            var mz = ptZ + Math.sin(angle) * 10.5;
            var merlonGeo = new THREE.BoxGeometry(3, 4, 2.5);
            var merMesh = addMesh(merlonGeo, merlonMat, mx, OY + 36, mz);
            merMesh.rotation.y = angle;
        }

        // Arrow slits
        var slitMat = mat(0x221100);
        for (var s = 0; s < 6; s++) {
            var sAngle = (s / 6) * Math.PI * 2;
            var sx = ptX + Math.cos(sAngle) * 10;
            var sz = ptZ + Math.sin(sAngle) * 10;
            var slitGeo = new THREE.BoxGeometry(1, 4, 1);
            var slitMesh = addMesh(slitGeo, slitMat, sx, OY + 20, sz);
            slitMesh.rotation.y = sAngle;
        }

        // Attached city wall fragment — left
        var wallMat = mat(0xB87020);
        var wall1Geo = new THREE.BoxGeometry(60, 14, 5);
        addMesh(wall1Geo, wallMat, ptX + 40, OY + 7, ptZ);
        // Wall top walkway crenellations
        for (var c = 0; c < 6; c++) {
            var cGeo = new THREE.BoxGeometry(4, 3, 5);
            addMesh(cGeo, merlonMat, ptX + 15 + c * 9, OY + 15.5, ptZ);
        }
    }

    function buildCentralMarket() {
        // Five Zeppelin hangars converted — vast arched pavilions
        var cmX = OX - 100;
        var cmZ = OZ + 350;
        var hangarMat = mat(0x9A8878);
        var roofMat2 = mat(0x7A6858);

        for (var h = 0; h < 5; h++) {
            var hx = cmX + h * 60 - 120;
            var hangarLen = 90;
            var hangarW = 44;
            var hangarH = 18;

            // Hangar walls
            var wallGeo = new THREE.BoxGeometry(hangarW, hangarH, hangarLen);
            addMesh(wallGeo, hangarMat, hx, OY + hangarH / 2, cmZ);

            // Barrel-vault roof approximated with cylinder
            var barrelGeo = new THREE.CylinderGeometry(hangarW / 2, hangarW / 2, hangarLen, 10, 1, false, 0, Math.PI);
            addMesh(barrelGeo, roofMat2, hx, OY + hangarH, cmZ, 0, Math.PI / 2, 0);

            // End gable wall
            var gableGeo = new THREE.BoxGeometry(hangarW, hangarH + 4, 3);
            addMesh(gableGeo, hangarMat, hx, OY + hangarH / 2, cmZ - hangarLen / 2 - 1.5);
            // Entrance arch cutout approximation
            var archMat = mat(0x776655);
            var archGeo = new THREE.CylinderGeometry(8, 8, 3, 8, 1, false, 0, Math.PI);
            addMesh(archGeo, archMat, hx, OY + hangarH + 1, cmZ - hangarLen / 2 - 1.5, Math.PI / 2, 0, 0);

            // Back gable
            var bgGeo = new THREE.BoxGeometry(hangarW, hangarH + 4, 3);
            addMesh(bgGeo, hangarMat, hx, OY + hangarH / 2, cmZ + hangarLen / 2 + 1.5);
        }

        // Central plaza between river and market
        var plazaMat = mat(0xAAA090);
        var plazaGeo = new THREE.BoxGeometry(340, 0.5, 40);
        addMesh(plazaGeo, plazaMat, cmX, OY + 0.2, cmZ - 65);
    }

    function buildCatSculptures() {
        // Cat sculptures on Hanseatic rooftops (famous Riga cats)
        var catMat = mat(0x222222);
        var catPositions = [
            [OX - 120, 34, OZ - 200],
            [OX - 82, 30, OZ - 200],
            [OX - 44, 36, OZ - 200],
            [OX + 10, 32, OZ + 180]
        ];

        for (var i = 0; i < catPositions.length; i++) {
            var cx = catPositions[i][0];
            var cy = catPositions[i][1];
            var cz = catPositions[i][2];

            // Cat body
            var bodyGeo = new THREE.BoxGeometry(2, 2, 3);
            addMesh(bodyGeo, catMat, cx, cy, cz);
            // Cat head
            var headGeo = new THREE.SphereGeometry(1, 6, 5);
            addMesh(headGeo, catMat, cx, cy + 1.8, cz - 0.8);
            // Cat tail — cylinder arc
            var tailGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 4);
            var tailMesh = addMesh(tailGeo, catMat, cx, cy + 1.5, cz + 2);
            tailMesh.rotation.x = 0.8;
            // Cat ears
            var earL = new THREE.ConeGeometry(0.4, 0.8, 4);
            addMesh(earL, catMat, cx - 0.5, cy + 2.8, cz - 0.8);
            var earR = new THREE.ConeGeometry(0.4, 0.8, 4);
            addMesh(earR, catMat, cx + 0.5, cy + 2.8, cz - 0.8);
        }
    }

    function buildCityWallFragments() {
        // Remaining city wall sections with towers
        var wallMat = mat(0xAA8855);
        var towerMat2 = mat(0x997744);

        // North wall fragment
        var nWall = new THREE.BoxGeometry(80, 10, 5);
        addMesh(nWall, wallMat, OX - 280, OY + 5, OZ - 80);
        // Small tower on wall
        var wt1 = new THREE.CylinderGeometry(6, 7, 16, 8);
        addMesh(wt1, towerMat2, OX - 320, OY + 8, OZ - 80);
        var wt1Roof = new THREE.ConeGeometry(7, 8, 8);
        addMesh(wt1Roof, mat(0x774422), OX - 320, OY + 20, OZ - 80);

        // South wall fragment
        var sWall = new THREE.BoxGeometry(60, 10, 5);
        addMesh(sWall, wallMat, OX - 290, OY + 5, OZ + 60);
        var wt2 = new THREE.CylinderGeometry(5, 6, 14, 8);
        addMesh(wt2, towerMat2, OX - 260, OY + 7, OZ + 60);
        var wt2Roof = new THREE.ConeGeometry(6, 7, 8);
        addMesh(wt2Roof, mat(0x774422), OX - 260, OY + 18, OZ + 60);
    }

    function buildStreetDetails() {
        // Street lamps, benches, cobblestone details

        // Wrought iron lamp posts
        var lampPostMat = mat(0x222222);
        var lampGlowMat = mat(0xFFEE88);
        var lampPositions = [
            [OX - 50, OZ - 20],
            [OX + 50, OZ + 20],
            [OX - 100, OZ + 100],
            [OX + 150, OZ - 100],
            [OX + 200, OZ + 50],
            [OX - 200, OZ - 50]
        ];

        for (var l = 0; l < lampPositions.length; l++) {
            var lx = lampPositions[l][0];
            var lz = lampPositions[l][1];
            // Post
            var postGeo = new THREE.CylinderGeometry(0.3, 0.4, 7, 6);
            addMesh(postGeo, lampPostMat, lx, OY + 3.5, lz);
            // Lamp head
            var lampGeo = new THREE.SphereGeometry(0.8, 6, 5);
            addMesh(lampGeo, lampGlowMat, lx, OY + 7.5, lz);
        }

        // Stone benches in public spaces
        var benchMat = mat(0xAA9988);
        var benchPositions = [
            [OX + 230, OZ - 30],
            [OX + 230, OZ + 30],
            [OX - 5, OZ - 160],
            [OX + 5, OZ - 160]
        ];
        for (var bn = 0; bn < benchPositions.length; bn++) {
            var bx = benchPositions[bn][0];
            var bz = benchPositions[bn][1];
            var benchSeat = new THREE.BoxGeometry(6, 0.8, 2);
            addMesh(benchSeat, benchMat, bx, OY + 1.5, bz);
            var legL = new THREE.BoxGeometry(0.8, 1.5, 2);
            addMesh(legL, benchMat, bx - 2.5, OY + 0.75, bz);
            var legR = new THREE.BoxGeometry(0.8, 1.5, 2);
            addMesh(legR, benchMat, bx + 2.5, OY + 0.75, bz);
        }

        // Old town square paving — raised slabs
        var paveMat = mat(0x998877);
        for (var p = 0; p < 5; p++) {
            for (var q = 0; q < 5; q++) {
                var paveGeo = new THREE.BoxGeometry(9, 0.3, 9);
                addMesh(paveGeo, paveMat, OX + 80 + p * 10 - 20, OY + 0.3, OZ - 60 + q * 10 - 20);
            }
        }

        // Cobblestone bollards
        var bollardMat = mat(0x7A6A5A);
        for (var bo = 0; bo < 8; bo++) {
            var boGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.2, 6);
            addMesh(boGeo, bollardMat, OX + 55 + bo * 6, OY + 0.6, OZ - 8);
        }
    }

    function update(delta) { }

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
