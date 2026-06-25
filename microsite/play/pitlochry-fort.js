window.PitlochryFort = (function() {
    'use strict';

    var WX = 1840;
    var WZ = 2200;

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeWireBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(x, y, z);
        return lines;
    }

    function buildBlairAthollCastle(group) {
        var bx = WX - 60;
        var bz = WZ - 80;
        var wallColor = 0xF5F5F5;
        var roofColor = 0x708090;
        var turretColor = 0xDCDCDC;

        // Main tower
        var mainTower = makeBox(10, 18, 10, wallColor, bx, 9, bz);
        group.add(mainTower);

        // Main tower roof
        var mainRoof = makeCone(6, 4, 4, roofColor, bx, 20, bz);
        group.add(mainRoof);

        // East wing
        var eastWing = makeBox(14, 8, 8, wallColor, bx + 12, 4, bz);
        group.add(eastWing);

        // West wing
        var westWing = makeBox(14, 8, 8, wallColor, bx - 12, 4, bz);
        group.add(westWing);

        // North wing
        var northWing = makeBox(8, 8, 14, wallColor, bx, 4, bz - 12);
        group.add(northWing);

        // Corner turrets
        var turretPositions = [
            [bx + 18, bz + 4],
            [bx - 18, bz + 4],
            [bx + 18, bz - 4],
            [bx - 18, bz - 4]
        ];
        for (var i = 0; i < turretPositions.length; i++) {
            var tp = turretPositions[i];
            var turret = makeCylinder(1.5, 1.5, 10, 8, turretColor, tp[0], 5, tp[1]);
            group.add(turret);
            var turretRoof = makeCone(2, 3, 8, roofColor, tp[0], 11, tp[1]);
            group.add(turretRoof);
        }

        // Battlements along east wing top
        for (var bi = 0; bi < 5; bi++) {
            var battlement = makeBox(1.5, 1.5, 1.5, wallColor, bx + 6 + bi * 3, 9.75, bz + 4);
            group.add(battlement);
            var battlementBack = makeBox(1.5, 1.5, 1.5, wallColor, bx + 6 + bi * 3, 9.75, bz - 4);
            group.add(battlementBack);
        }

        // Battlements along west wing top
        for (var bj = 0; bj < 5; bj++) {
            var bwf = makeBox(1.5, 1.5, 1.5, wallColor, bx - 6 - bj * 3, 9.75, bz + 4);
            group.add(bwf);
            var bwb = makeBox(1.5, 1.5, 1.5, wallColor, bx - 6 - bj * 3, 9.75, bz - 4);
            group.add(bwb);
        }

        // Dry moat outer wall (low wall ring)
        var moatColor = 0xA0A0A0;
        var moatWallN = makeBox(50, 2, 2, moatColor, bx, 1, bz - 22);
        group.add(moatWallN);
        var moatWallS = makeBox(50, 2, 2, moatColor, bx, 1, bz + 22);
        group.add(moatWallS);
        var moatWallE = makeBox(2, 2, 44, moatColor, bx + 25, 1, bz);
        group.add(moatWallE);
        var moatWallW = makeBox(2, 2, 44, moatColor, bx - 25, 1, bz);
        group.add(moatWallW);

        // Gatehouse
        var gatehouse = makeBox(6, 10, 6, wallColor, bx, 5, bz + 20);
        group.add(gatehouse);
        var gateRoof = makeCone(4, 3, 4, roofColor, bx, 11.5, bz + 20);
        group.add(gateRoof);
    }

    function buildHydroelectricDam(group) {
        var dx = WX + 20;
        var dz = WZ + 60;
        var damColor = 0x9E9E9E;
        var waterColor = 0x1A6B8A;

        // Main dam wall
        var damWall = makeBox(40, 12, 4, damColor, dx, 6, dz);
        group.add(damWall);

        // Dam base buttresses
        for (var bi = 0; bi < 5; bi++) {
            var buttress = makeBox(3, 14, 6, 0x808080, dx - 16 + bi * 8, 7, dz + 5);
            group.add(buttress);
        }

        // Control house on top of dam
        var controlHouse = makeBox(8, 4, 4, 0x757575, dx, 16, dz);
        group.add(controlHouse);
        var controlRoof = makeBox(9, 1, 5, 0x616161, dx, 18.5, dz);
        group.add(controlRoof);

        // Fish ladder steps on the side
        var fishLadderColor = 0x8B8B8B;
        for (var fi = 0; fi < 8; fi++) {
            var stepW = 4;
            var stepH = 1;
            var stepD = 2;
            var fishStep = makeBox(stepW, stepH, stepD, fishLadderColor,
                dx + 24, 0.5 + fi * 1.2, dz - 2 - fi * 1.5);
            group.add(fishStep);
        }

        // River Tummel (water box behind the dam)
        var riverTummel = makeBox(60, 2, 30, waterColor, dx, 1, dz - 18);
        group.add(riverTummel);

        // River downstream
        var riverDown = makeBox(20, 1, 40, waterColor, dx, 0.5, dz + 24);
        group.add(riverDown);

        // Spillway
        var spillway = makeBox(10, 2, 8, 0x616161, dx, 6, dz + 6);
        group.add(spillway);
    }

    function buildFestivalTheatre(group) {
        var tx = WX + 30;
        var tz = WZ + 20;
        var theatreColor = 0xD4A97A;
        var glassColor = 0x87CEEB;
        var roofColor = 0xB8860B;

        // Main theatre building
        var mainBuilding = makeBox(12, 6, 10, theatreColor, tx, 3, tz);
        group.add(mainBuilding);

        // Curved-front approximation: stacked front boxes
        var frontBase = makeBox(12, 2, 3, theatreColor, tx, 1, tz + 6);
        group.add(frontBase);
        var frontMid = makeBox(11, 2, 2.5, theatreColor, tx, 3, tz + 6.5);
        group.add(frontMid);
        var frontTop = makeBox(10, 2, 2, theatreColor, tx, 5, tz + 7);
        group.add(frontTop);

        // Theatre roof
        var roof = makeBox(13, 1, 11, roofColor, tx, 6.5, tz);
        group.add(roof);

        // Glass foyer front
        var foyer = makeBox(8, 4, 2, glassColor, tx, 2, tz + 8);
        group.add(foyer);

        // Stage box (back extension)
        var stageBox = makeBox(8, 8, 6, theatreColor, tx, 4, tz - 8);
        group.add(stageBox);
        var stageRoof = makeBox(9, 1, 7, roofColor, tx, 8.5, tz - 8);
        group.add(stageRoof);

        // Entrance canopy
        var canopy = makeBox(6, 0.5, 3, roofColor, tx, 4, tz + 10);
        group.add(canopy);
        // Canopy supports
        var suppL = makeBox(0.3, 4, 0.3, 0x5C4033, tx - 3, 2, tz + 11);
        group.add(suppL);
        var suppR = makeBox(0.3, 4, 0.3, 0x5C4033, tx + 3, 2, tz + 11);
        group.add(suppR);

        // Parking area marker
        var carpark = makeBox(20, 0.2, 14, 0x555555, tx - 16, 0.1, tz);
        group.add(carpark);
    }

    function buildKilliecrankiePass(group) {
        var kx = WX - 20;
        var kz = WZ - 140;
        var gorgeColor = 0x3A3A3A;
        var rockColor = 0x4A4A4A;

        // Left gorge wall (west side)
        var leftWall = makeBox(6, 28, 60, gorgeColor, kx - 14, 14, kz);
        group.add(leftWall);

        // Right gorge wall (east side) — Soldier's Leap gap in the middle
        var rightWallN = makeBox(6, 28, 22, gorgeColor, kx + 14, 14, kz - 20);
        group.add(rightWallN);
        var rightWallS = makeBox(6, 28, 22, gorgeColor, kx + 14, 14, kz + 20);
        group.add(rightWallS);

        // Gap marker — low rock at the Soldier's Leap
        var leapRockL = makeBox(3, 8, 4, rockColor, kx + 14, 4, kz - 8);
        group.add(leapRockL);
        var leapRockR = makeBox(3, 8, 4, rockColor, kx + 14, 4, kz + 8);
        group.add(leapRockR);

        // River Garry through the gorge
        var gorgeRiver = makeBox(8, 1, 60, 0x1A6B8A, kx, 0.5, kz);
        group.add(gorgeRiver);

        // Rocky outcrops on gorge walls
        var outcrops = [
            [kx - 17, 8, kz - 15],
            [kx - 17, 12, kz + 10],
            [kx + 17, 6, kz - 25],
            [kx + 17, 10, kz + 22]
        ];
        for (var oi = 0; oi < outcrops.length; oi++) {
            var oc = outcrops[oi];
            var outcrop = makeBox(4, 3, 4, rockColor, oc[0], oc[1], oc[2]);
            group.add(outcrop);
        }

        // Path along the gorge (Pass of Killiecrankie trail)
        var trailN = makeBox(3, 0.2, 24, 0x8B7355, kx - 6, 0.1, kz - 18);
        group.add(trailN);
        var trailS = makeBox(3, 0.2, 24, 0x8B7355, kx - 6, 0.1, kz + 18);
        group.add(trailS);

        // Visitor centre at gorge entrance
        var visitorCentre = makeBox(8, 4, 6, 0xC4B99A, kx - 5, 2, kz + 35);
        group.add(visitorCentre);
        var vcRoof = makeBox(9, 1, 7, 0x8B7355, kx - 5, 4.5, kz + 35);
        group.add(vcRoof);
    }

    function buildTownElements(group) {
        var streetColor = 0x555555;
        var buildingColor = 0xC4A882;
        var roofColor = 0x8B6914;
        var stoneColor = 0xA0A0A0;

        // Atholl Road (main street)
        var mainStreet = makeBox(80, 0.2, 8, streetColor, WX, 0.1, WZ);
        group.add(mainStreet);

        // Pitlochry town buildings along the street
        var buildings = [
            [WX - 25, WZ - 12, 8, 5, 8, buildingColor],
            [WX - 15, WZ - 12, 7, 4, 7, buildingColor],
            [WX - 5, WZ - 12, 6, 6, 8, 0xD2B48C],
            [WX + 5, WZ - 12, 9, 5, 7, buildingColor],
            [WX + 15, WZ - 12, 8, 4, 8, 0xBDB76B],
            [WX + 25, WZ - 12, 7, 6, 7, buildingColor]
        ];
        for (var bi = 0; bi < buildings.length; bi++) {
            var b = buildings[bi];
            var bldg = makeBox(b[2], b[3], b[4], b[5], b[0], b[3] / 2, b[1]);
            group.add(bldg);
            var bRoof = makeBox(b[2] + 0.5, 1.5, b[4] + 0.5, roofColor, b[0], b[3] + 0.75, b[1]);
            group.add(bRoof);
        }

        // Church with steeple
        var churchX = WX - 40;
        var churchZ = WZ - 20;
        var church = makeBox(10, 7, 12, stoneColor, churchX, 3.5, churchZ);
        group.add(church);
        var steepleBase = makeBox(4, 4, 4, stoneColor, churchX, 9, churchZ - 3);
        group.add(steepleBase);
        var steeple = makeCone(2, 8, 4, stoneColor, churchX, 15, churchZ - 3);
        group.add(steeple);
        var churchRoof = makeBox(11, 1, 13, 0x696969, churchX, 7.5, churchZ);
        group.add(churchRoof);

        // War memorial obelisk
        var obeliskBase = makeBox(2, 0.5, 2, stoneColor, WX + 40, 0.25, WZ - 15);
        group.add(obeliskBase);
        var obelisk = makeBox(0.8, 8, 0.8, stoneColor, WX + 40, 4.25, WZ - 15);
        group.add(obelisk);
        var obeliskTop = makeCone(0.6, 2, 4, stoneColor, WX + 40, 9.25, WZ - 15);
        group.add(obeliskTop);

        // Railway station (Pitlochry station)
        var stationX = WX + 50;
        var stationZ = WZ + 10;
        var stationBuilding = makeBox(16, 5, 8, 0xC0A882, stationX, 2.5, stationZ);
        group.add(stationBuilding);
        var stationRoof = makeBox(17, 1, 9, 0x8B6914, stationX, 5.5, stationZ);
        group.add(stationRoof);
        var stationPlatform = makeBox(20, 0.5, 6, 0xBBBBBB, stationX, 0.25, stationZ + 10);
        group.add(stationPlatform);
        // Railway tracks
        var trackL = makeBox(40, 0.2, 0.5, 0x333333, stationX, 0.1, stationZ + 13);
        group.add(trackL);
        var trackR = makeBox(40, 0.2, 0.5, 0x333333, stationX, 0.1, stationZ + 15);
        group.add(trackR);

        // Trees (cone + cylinder)
        var treePositions = [
            [WX - 35, WZ + 10],
            [WX - 30, WZ + 8],
            [WX + 35, WZ - 5],
            [WX + 30, WZ + 5],
            [WX - 10, WZ + 15],
            [WX + 10, WZ + 18],
            [WX - 50, WZ + 5],
            [WX + 45, WZ + 12]
        ];
        for (var ti = 0; ti < treePositions.length; ti++) {
            var tp = treePositions[ti];
            var trunk = makeCylinder(0.3, 0.4, 2.5, 6, 0x5C4033, tp[0], 1.25, tp[1]);
            group.add(trunk);
            var canopy = makeCone(2, 4, 7, 0x2D5A27, tp[0], 5, tp[1]);
            group.add(canopy);
        }
    }

    function buildSceneryDetails(group) {
        // Loch Faskally (reservoir behind dam)
        var loch = makeBox(50, 1, 40, 0x1A6B8A, WX + 10, 0.5, WZ + 30);
        group.add(loch);

        // Loch shoreline rocks
        var shoreRocks = [
            [WX - 14, WZ + 12],
            [WX + 36, WZ + 18],
            [WX + 36, WZ + 46],
            [WX - 14, WZ + 48]
        ];
        for (var ri = 0; ri < shoreRocks.length; ri++) {
            var sr = shoreRocks[ri];
            var rock = makeBox(3, 1.5, 3, 0x696969, sr[0], 0.75, sr[1]);
            group.add(rock);
        }

        // Bridge over River Tummel
        var bridgeDeck = makeBox(14, 1, 4, 0x888888, WX + 20, 3, WZ + 60);
        group.add(bridgeDeck);
        var bridgePillarL = makeBox(1.5, 6, 1.5, 0x777777, WX + 14, 3, WZ + 60);
        group.add(bridgePillarL);
        var bridgePillarR = makeBox(1.5, 6, 1.5, 0x777777, WX + 26, 3, WZ + 60);
        group.add(bridgePillarR);
        var railingL = makeBox(14, 0.8, 0.3, 0x666666, WX + 20, 3.9, WZ + 58);
        group.add(railingL);
        var railingR = makeBox(14, 0.8, 0.3, 0x666666, WX + 20, 3.9, WZ + 62);
        group.add(railingR);

        // Surrounding hills (large dark box mounds)
        var hillColor = 0x3B5323;
        var hillN = makeBox(80, 16, 30, hillColor, WX, 8, WZ - 180);
        group.add(hillN);
        var hillS = makeBox(80, 12, 25, hillColor, WX, 6, WZ + 180);
        group.add(hillS);
        var hillE = makeBox(30, 18, 80, hillColor, WX + 160, 9, WZ);
        group.add(hillE);
        var hillW = makeBox(30, 20, 80, hillColor, WX - 160, 10, WZ);
        group.add(hillW);

        // Ground plane approximation (large flat box)
        var ground = makeBox(400, 0.5, 400, 0x5A7A3A, WX, -0.25, WZ);
        group.add(ground);
    }

    function buildWireframeAccents(group) {
        // Wireframe accent on dam
        var damAccent = makeWireBox(40, 12, 4, 0x666666, WX + 20, 6, WZ + 60);
        group.add(damAccent);

        // Wireframe accent on main castle tower
        var towerAccent = makeWireBox(10, 18, 10, 0xAAAAAA, WX - 60, 9, WZ - 80);
        group.add(towerAccent);
    }

    function create(scene) {
        var group = new THREE.Group();

        buildBlairAthollCastle(group);
        buildHydroelectricDam(group);
        buildFestivalTheatre(group);
        buildKilliecrankiePass(group);
        buildTownElements(group);
        buildSceneryDetails(group);
        buildWireframeAccents(group);

        scene.add(group);
        return group;
    }

    return {
        create: create,
        worldX: WX,
        worldZ: WZ
    };

}());
