window.ConwyCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 14680;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(obj) {
        scene.add(obj);
        objects.push(obj);
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addObj(mesh);
        return mesh;
    }

    function makeLine(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var line = new THREE.LineSegments(geo, mat);
        addObj(line);
        return line;
    }

    function build() {
        buildGround();
        buildRiver();
        buildCastle();
        buildTownWalls();
        buildSuspensionBridge();
        buildRailwayBridge();
        buildModernBridge();
        buildQuay();
        buildSmallestHouse();
        buildConwyTown();
    }

    function buildGround() {
        makeBox(600, 2, 600, 0x4a7c3f, OX, -1, 0);
    }

    function buildRiver() {
        makeBox(120, 1, 600, 0x1a4a6e, OX + 180, 0.5, 0);
        makeBox(40, 0.5, 600, 0x1f5280, OX + 170, 0.8, 0);
        makeBox(40, 0.5, 600, 0x163d5e, OX + 195, 0.8, 0);
    }

    function buildCastle() {
        var stoneColor = 0x8b8577;
        var darkStone = 0x6b6560;
        var battleColor = 0x7a7570;

        // Castle base / rock outcrop
        makeBox(80, 4, 60, 0x6b5e4a, OX, 2, -30);

        // Outer ward curtain walls
        makeBox(80, 12, 3, stoneColor, OX, 7, -5);
        makeBox(80, 12, 3, stoneColor, OX, 7, -55);
        makeBox(3, 12, 50, stoneColor, OX - 38, 7, -30);
        makeBox(3, 12, 50, stoneColor, OX + 38, 7, -30);

        // Inner ward curtain walls
        makeBox(40, 14, 3, darkStone, OX, 8, -18);
        makeBox(40, 14, 3, darkStone, OX, 8, -42);
        makeBox(3, 14, 24, darkStone, OX - 18, 8, -30);
        makeBox(3, 14, 24, darkStone, OX + 18, 8, -30);

        // 8 round towers: 4 outer corners + 4 inner corners
        // Outer towers
        makeCyl(5, 5.5, 18, 12, stoneColor, OX - 36, 11, -6);
        makeCyl(5, 5.5, 18, 12, stoneColor, OX + 36, 11, -6);
        makeCyl(5, 5.5, 18, 12, stoneColor, OX - 36, 11, -54);
        makeCyl(5, 5.5, 18, 12, stoneColor, OX + 36, 11, -54);

        // Inner towers
        makeCyl(4.5, 5, 20, 12, darkStone, OX - 17, 12, -19);
        makeCyl(4.5, 5, 20, 12, darkStone, OX + 17, 12, -19);
        makeCyl(4.5, 5, 20, 12, darkStone, OX - 17, 12, -41);
        makeCyl(4.5, 5, 20, 12, darkStone, OX + 17, 12, -41);

        // Tower tops / battlements outer towers
        makeCyl(5.5, 5.5, 2, 12, battleColor, OX - 36, 20.5, -6);
        makeCyl(5.5, 5.5, 2, 12, battleColor, OX + 36, 20.5, -6);
        makeCyl(5.5, 5.5, 2, 12, battleColor, OX - 36, 20.5, -54);
        makeCyl(5.5, 5.5, 2, 12, battleColor, OX + 36, 20.5, -54);

        // Tower tops / battlements inner towers
        makeCyl(5, 5, 2, 12, battleColor, OX - 17, 23.5, -19);
        makeCyl(5, 5, 2, 12, battleColor, OX + 17, 23.5, -19);
        makeCyl(5, 5, 2, 12, battleColor, OX - 17, 23.5, -41);
        makeCyl(5, 5, 2, 12, battleColor, OX + 17, 23.5, -41);

        // Great Hall (inner ward)
        makeBox(24, 8, 10, 0x7a7060, OX, 10, -30);
        makeBox(24, 1, 10, 0x5a5040, OX, 14.5, -30);

        // Royal apartments
        makeBox(12, 10, 8, 0x807565, OX - 6, 11, -20);
        makeBox(12, 10, 8, 0x807565, OX + 6, 11, -40);

        // Chapel tower
        makeCyl(3, 3.5, 22, 8, 0x9a9080, OX, 13, -30);
        makeCone(3, 5, 8, 0x5a4a3a, OX, 25.5, -30);

        // Watchtower battlements merlons (box merlons on wall tops)
        var i;
        for (i = 0; i < 8; i++) {
            makeBox(2, 2, 1.5, battleColor, OX - 35 + i * 10, 14.5, -5);
            makeBox(2, 2, 1.5, battleColor, OX - 35 + i * 10, 14.5, -55);
        }
        for (i = 0; i < 5; i++) {
            makeBox(1.5, 2, 2, battleColor, OX - 38, 14.5, -10 + i * 10);
            makeBox(1.5, 2, 2, battleColor, OX + 38, 14.5, -10 + i * 10);
        }

        // Castle entrance gate
        makeBox(10, 12, 3, stoneColor, OX, 7, -5);
        makeBox(3, 6, 3, 0x1a1a1a, OX, 4, -5);
        makeBox(4, 2, 4, stoneColor, OX, 13.5, -5);
    }

    function buildTownWalls() {
        var wallColor = 0x8b8577;
        var turretColor = 0x7a7060;

        // North wall
        makeBox(200, 10, 3, wallColor, OX - 80, 6, 30);
        // South wall
        makeBox(200, 10, 3, wallColor, OX - 80, 6, 130);
        // East wall (connecting N and S)
        makeBox(3, 10, 100, wallColor, OX + 20, 6, 80);
        // West wall
        makeBox(3, 10, 100, wallColor, OX - 180, 6, 80);
        // NW extension
        makeBox(3, 10, 60, wallColor, OX - 180, 6, 0);
        // NE extension connecting to castle
        makeBox(3, 10, 40, wallColor, OX + 20, 6, -10);

        // Turrets along north wall
        var j;
        for (j = 0; j < 5; j++) {
            makeCyl(3, 3.5, 12, 8, turretColor, OX - 160 + j * 40, 7, 30);
        }
        // Turrets along south wall
        for (j = 0; j < 5; j++) {
            makeCyl(3, 3.5, 12, 8, turretColor, OX - 160 + j * 40, 7, 130);
        }
        // Turrets east wall
        for (j = 0; j < 3; j++) {
            makeCyl(3, 3.5, 12, 8, turretColor, OX + 20, 7, 40 + j * 30);
        }
        // Turrets west wall
        for (j = 0; j < 3; j++) {
            makeCyl(3, 3.5, 12, 8, turretColor, OX - 180, 7, 40 + j * 30);
        }

        // Upper Gate (north)
        makeBox(12, 14, 8, wallColor, OX - 60, 8, 30);
        makeBox(5, 8, 8, 0x1a1a1a, OX - 60, 5, 30);
        makeCyl(4, 4.5, 16, 8, turretColor, OX - 65, 9, 30);
        makeCyl(4, 4.5, 16, 8, turretColor, OX - 55, 9, 30);

        // Mill Gate (west)
        makeBox(8, 14, 12, wallColor, OX - 180, 8, 80);
        makeBox(4, 8, 12, 0x1a1a1a, OX - 180, 5, 80);
        makeCyl(4, 4.5, 16, 8, turretColor, OX - 180, 9, 74);
        makeCyl(4, 4.5, 16, 8, turretColor, OX - 180, 9, 86);

        // Lower Gate (quay side / east near river)
        makeBox(8, 14, 12, wallColor, OX + 20, 8, 30);
        makeBox(4, 8, 12, 0x1a1a1a, OX + 20, 5, 30);
        makeCyl(4, 4.5, 16, 8, turretColor, OX + 20, 9, 24);
        makeCyl(4, 4.5, 16, 8, turretColor, OX + 20, 9, 36);

        // Wall walk parapets (merlons on wall tops)
        var k;
        for (k = 0; k < 20; k++) {
            makeBox(2, 2, 1.5, 0x7a7570, OX - 175 + k * 10, 11.5, 30);
            makeBox(2, 2, 1.5, 0x7a7570, OX - 175 + k * 10, 11.5, 130);
        }
        for (k = 0; k < 8; k++) {
            makeBox(1.5, 2, 2, 0x7a7570, OX + 20, 11.5, 35 + k * 10);
            makeBox(1.5, 2, 2, 0x7a7570, OX - 180, 11.5, 35 + k * 10);
        }
    }

    function buildSuspensionBridge() {
        // Telford's 1826 Gothic suspension bridge over River Conwy
        var towerColor = 0x8b8577;
        var chainColor = 0x3a3a3a;
        var roadColor = 0x5a5a5a;

        // Bridge road deck
        makeBox(100, 1.5, 8, roadColor, OX + 130, 5, -20);

        // West Gothic castellated tower
        makeBox(6, 20, 6, towerColor, OX + 82, 12, -20);
        makeBox(8, 3, 8, towerColor, OX + 82, 22.5, -20);
        makeCyl(4.5, 4.5, 2, 4, towerColor, OX + 82, 24.5, -20);
        // Tower arch opening
        makeBox(3, 10, 6, 0x1a1a1a, OX + 82, 7, -20);
        // Tower battlements
        makeBox(1.5, 2, 1.5, towerColor, OX + 79, 24, -20);
        makeBox(1.5, 2, 1.5, towerColor, OX + 85, 24, -20);
        makeBox(1.5, 2, 1.5, towerColor, OX + 82, 24, -23);
        makeBox(1.5, 2, 1.5, towerColor, OX + 82, 24, -17);

        // East Gothic castellated tower
        makeBox(6, 20, 6, towerColor, OX + 178, 12, -20);
        makeBox(8, 3, 8, towerColor, OX + 178, 22.5, -20);
        makeCyl(4.5, 4.5, 2, 4, towerColor, OX + 178, 24.5, -20);
        makeBox(3, 10, 6, 0x1a1a1a, OX + 178, 7, -20);
        makeBox(1.5, 2, 1.5, towerColor, OX + 175, 24, -20);
        makeBox(1.5, 2, 1.5, towerColor, OX + 181, 24, -20);
        makeBox(1.5, 2, 1.5, towerColor, OX + 178, 24, -23);
        makeBox(1.5, 2, 1.5, towerColor, OX + 178, 24, -17);

        // Suspension chains (catenary curves approximated with LineSegments)
        var chainPtsA = [];
        var chainPtsB = [];
        var segments = 20;
        var bridgeSpan = 96;
        var chainSag = 12;
        var m;
        for (m = 0; m <= segments; m++) {
            var t = m / segments;
            var cx = OX + 82 + t * bridgeSpan;
            var cy = 22 + chainSag * (4 * t * (1 - t) - 1) * -1;
            chainPtsA.push(new THREE.Vector3(cx, cy, -18.5));
            chainPtsB.push(new THREE.Vector3(cx, cy, -21.5));
        }
        // Build line segments pairs
        var chainVertsA = [];
        var chainVertsB = [];
        for (m = 0; m < segments; m++) {
            chainVertsA.push(chainPtsA[m]);
            chainVertsA.push(chainPtsA[m + 1]);
            chainVertsB.push(chainPtsB[m]);
            chainVertsB.push(chainPtsB[m + 1]);
        }
        makeLine(chainVertsA, chainColor);
        makeLine(chainVertsB, chainColor);

        // Vertical hangers
        var n;
        for (n = 1; n < segments; n++) {
            var hx = OX + 82 + (n / segments) * bridgeSpan;
            var ht = n / segments;
            var hy = 22 + chainSag * (4 * ht * (1 - ht) - 1) * -1;
            var hangerPts = [
                new THREE.Vector3(hx, hy, -18.5),
                new THREE.Vector3(hx, 5.75, -18.5)
            ];
            makeLine(hangerPts, chainColor);
        }

        // Stone approach arches west side
        makeBox(20, 8, 8, towerColor, OX + 62, 5, -20);
        makeCyl(4, 4, 1, 8, 0x1a1a1a, OX + 62, 5, -20);
        // Stone approach arches east side
        makeBox(20, 8, 8, towerColor, OX + 198, 5, -20);
        makeCyl(4, 4, 1, 8, 0x1a1a1a, OX + 198, 5, -20);
    }

    function buildRailwayBridge() {
        // Robert Stephenson's tubular railway bridge
        var steelColor = 0x4a4a5a;
        var stoneColor = 0x8b8577;

        // Tube structure (rectangular box section)
        makeBox(130, 6, 7, steelColor, OX + 130, 8, -35);

        // Support piers
        makeCyl(3, 4, 12, 6, stoneColor, OX + 82, 5, -35);
        makeCyl(3, 4, 12, 6, stoneColor, OX + 178, 5, -35);

        // Castellated approach towers (Gothic style matching castle)
        makeBox(8, 18, 8, stoneColor, OX + 75, 10, -35);
        makeCyl(3.5, 4, 2, 4, stoneColor, OX + 75, 19.5, -35);
        makeBox(8, 18, 8, stoneColor, OX + 185, 10, -35);
        makeCyl(3.5, 4, 2, 4, stoneColor, OX + 185, 19.5, -35);
    }

    function buildModernBridge() {
        // Modern A55 road bridge
        makeBox(140, 2, 12, 0x6a6a6a, OX + 130, 4, -50);
        makeCyl(2, 2.5, 10, 6, 0x7a7a7a, OX + 82, 3, -50);
        makeCyl(2, 2.5, 10, 6, 0x7a7a7a, OX + 178, 3, -50);
        // Railings as line segments
        var railPts = [];
        var r;
        for (r = 0; r <= 14; r++) {
            railPts.push(new THREE.Vector3(OX + 65 + r * 10, 5.5, -44));
            railPts.push(new THREE.Vector3(OX + 65 + r * 10, 5.5, -44));
            railPts.push(new THREE.Vector3(OX + 65 + r * 10, 5.5, -44));
            railPts.push(new THREE.Vector3(OX + 75 + r * 10, 5.5, -44));
        }
        makeLine(railPts, 0x888888);
    }

    function buildQuay() {
        var quayColor = 0x6b6050;
        var buildingColor = 0x8a7060;
        var roofColor = 0x6a3a2a;

        // Quay wall
        makeBox(120, 5, 6, quayColor, OX + 60, 3, 5);

        // Quayside surface
        makeBox(120, 1, 20, 0x5a5040, OX + 60, 5.5, 10);

        // Fishing boats / mussel boats
        makeCyl(2, 3, 1.5, 8, 0x4a3a2a, OX + 30, 2, 2);
        makeCyl(1.5, 2.5, 1.5, 8, 0x3a4a2a, OX + 45, 2, 1);
        makeCyl(1.5, 2.5, 1.5, 8, 0x2a3a4a, OX + 60, 2, 2);
        // Boat masts
        makeBox(0.3, 8, 0.3, 0x3a2a1a, OX + 30, 7, 2);
        makeBox(0.3, 8, 0.3, 0x3a2a1a, OX + 45, 7, 1);
        makeBox(0.3, 8, 0.3, 0x3a2a1a, OX + 60, 7, 2);

        // Quayside buildings
        makeBox(15, 8, 10, buildingColor, OX + 35, 10, 15);
        makeCone(8, 3, 4, roofColor, OX + 35, 14.5, 15);
        makeBox(12, 7, 10, 0x7a6555, OX + 55, 9.5, 15);
        makeCone(7, 2.5, 4, roofColor, OX + 55, 13.25, 15);
        makeBox(18, 9, 10, buildingColor, OX + 78, 10.5, 15);
        makeCone(10, 3, 4, roofColor, OX + 78, 15, 15);

        // Mussel shed / fish market
        makeBox(25, 6, 12, 0x6a5a4a, OX + 100, 9, 15);
        makeBox(25, 1, 12, 0x4a3a2a, OX + 100, 12.5, 15);
    }

    function buildSmallestHouse() {
        // Smallest House in Britain — tiny red building approx 3m x 1.8m
        makeBox(1.8, 3.5, 3, 0xcc2200, OX + 22, 3.75, 7);
        // Roof
        makeCone(1.8, 1.2, 4, 0x882200, OX + 22, 5.6, 7);
        // Window
        makeBox(0.6, 0.6, 0.2, 0x8ab0cc, OX + 22, 4, 5.6);
        // Door
        makeBox(0.6, 1.2, 0.2, 0x5a3a2a, OX + 22, 3, 5.6);
    }

    function buildConwyTown() {
        var houseColor = 0x9a8070;
        var timberColor = 0x5a4030;
        var plasterColor = 0xf0e8d8;
        var roofColor = 0x5a3020;
        var churchColor = 0x8b8577;

        // Plas Mawr Elizabethan town house (larger, prominent)
        makeBox(20, 14, 15, plasterColor, OX - 80, 8, 65);
        makeBox(20, 2, 15, roofColor, OX - 80, 15.5, 65);
        // Plas Mawr gateway tower
        makeCyl(3.5, 4, 18, 8, 0x9a9080, OX - 74, 10, 60);
        makeBox(2.5, 10, 4, 0x1a1a1a, OX - 74, 6, 60);
        // Plas Mawr courtyard
        makeBox(20, 1, 10, 0x7a6a5a, OX - 80, 5.5, 55);
        // Timber framing details
        makeBox(0.5, 14, 15, timberColor, OX - 72, 8, 65);
        makeBox(0.5, 14, 15, timberColor, OX - 88, 8, 65);
        makeBox(20, 0.5, 15, timberColor, OX - 80, 4, 65);
        makeBox(20, 0.5, 15, timberColor, OX - 80, 9, 65);

        // St Mary's Church 12th century
        makeBox(22, 12, 14, churchColor, OX - 130, 7, 75);
        // Church tower
        makeBox(7, 22, 7, churchColor, OX - 140, 12, 75);
        makeCyl(4, 4, 2, 4, 0x6b6560, OX - 140, 23.5, 75);
        // Church nave roof
        makeCone(12, 4, 4, 0x5a4a3a, OX - 128, 16, 75);
        // Church windows (lancets)
        makeBox(1.5, 3, 0.5, 0x8ab0cc, OX - 122, 8, 68.3);
        makeBox(1.5, 3, 0.5, 0x8ab0cc, OX - 128, 8, 68.3);
        makeBox(1.5, 3, 0.5, 0x8ab0cc, OX - 134, 8, 68.3);
        // Church graveyard wall
        makeBox(30, 2, 2, 0x7a7060, OX - 128, 6, 68);
        makeBox(30, 2, 2, 0x7a7060, OX - 128, 6, 82);

        // Medieval town houses — narrow streets
        var p;
        for (p = 0; p < 6; p++) {
            makeBox(8, 8 + p * 0.5, 10, houseColor, OX - 50 + p * 12, 5 + p * 0.25, 60);
            makeCone(5, 3, 4, roofColor, OX - 50 + p * 12, 9.5 + p * 0.25, 60);
        }
        // Second row of houses
        for (p = 0; p < 5; p++) {
            makeBox(9, 7 + p * 0.3, 10, 0x8a7565, OX - 45 + p * 14, 4.5 + p * 0.15, 85);
            makeCone(5.5, 2.5, 4, 0x4a3020, OX - 45 + p * 14, 8.75 + p * 0.15, 85);
        }

        // Timber-framed buildings (black and white)
        makeBox(10, 9, 8, plasterColor, OX - 100, 5.5, 60);
        makeBox(10, 0.4, 8, timberColor, OX - 100, 3, 60);
        makeBox(10, 0.4, 8, timberColor, OX - 100, 6, 60);
        makeBox(0.4, 9, 8, timberColor, OX - 105, 5.5, 60);
        makeBox(0.4, 9, 8, timberColor, OX - 95, 5.5, 60);
        makeCone(6, 3, 4, roofColor, OX - 100, 10.5, 60);

        makeBox(10, 9, 8, plasterColor, OX - 100, 5.5, 100);
        makeBox(10, 0.4, 8, timberColor, OX - 100, 3, 100);
        makeBox(10, 0.4, 8, timberColor, OX - 100, 6, 100);
        makeBox(0.4, 9, 8, timberColor, OX - 105, 5.5, 100);
        makeBox(0.4, 9, 8, timberColor, OX - 95, 5.5, 100);
        makeCone(6, 3, 4, roofColor, OX - 100, 10.5, 100);

        // Inn / tavern
        makeBox(14, 10, 10, 0x9a8060, OX - 30, 6, 75);
        makeBox(14, 0.5, 10, timberColor, OX - 30, 11.25, 75);
        makeCone(8, 3.5, 4, roofColor, OX - 30, 13, 75);

        // Town well / market cross
        makeCyl(1, 1.2, 4, 8, 0x7a7060, OX - 70, 3, 75);
        makeCyl(2, 0.5, 0.5, 8, 0x8a8070, OX - 70, 5.25, 75);

        // Cobbled market area
        makeBox(30, 0.5, 20, 0x6a6050, OX - 70, 5.25, 80);
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
