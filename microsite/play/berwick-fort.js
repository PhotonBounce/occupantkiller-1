window.BerwickFort = (function() {
    'use strict';

    var WORLD_X = 2560;
    var WORLD_Z = 2200;

    function makeBox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makeCylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makeSphere(scene, r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function buildTownWalls(scene) {
        var stoneColor = 0x9A8A78;
        var wallH = 6;
        var wallThick = 3;

        // Four curtain wall segments forming rough perimeter rectangle
        // North wall
        makeBox(scene, 80, wallH, wallThick, stoneColor, WORLD_X, wallH / 2, WORLD_Z - 50);
        // South wall
        makeBox(scene, 80, wallH, wallThick, stoneColor, WORLD_X, wallH / 2, WORLD_Z + 50);
        // West wall
        makeBox(scene, wallThick, wallH, 100, stoneColor, WORLD_X - 40, wallH / 2, WORLD_Z);
        // East wall
        makeBox(scene, wallThick, wallH, 100, stoneColor, WORLD_X + 40, wallH / 2, WORLD_Z);

        // Four angled bastion boxes at corners (star-fort style)
        var bastionSize = 14;
        var bastionH = 5;
        var corners = [
            [WORLD_X - 40, WORLD_Z - 50],
            [WORLD_X + 40, WORLD_Z - 50],
            [WORLD_X - 40, WORLD_Z + 50],
            [WORLD_X + 40, WORLD_Z + 50]
        ];
        for (var i = 0; i < corners.length; i++) {
            var cx = corners[i][0];
            var cz = corners[i][1];
            // Main bastion body
            makeBox(scene, bastionSize, bastionH, bastionSize, stoneColor, cx, bastionH / 2, cz);
            // Angled forward spur (diamond point)
            var dx = (cx < WORLD_X) ? -6 : 6;
            var dz2 = (cz < WORLD_Z) ? -6 : 6;
            makeBox(scene, 6, bastionH - 1, 6, stoneColor, cx + dx, (bastionH - 1) / 2, cz + dz2);
        }

        // Parapet crenellations along north wall
        for (var n = 0; n < 8; n++) {
            makeBox(scene, 4, 1.5, 1, stoneColor,
                WORLD_X - 35 + n * 10, wallH + 0.75, WORLD_Z - 50);
        }
        // Parapet crenellations along south wall
        for (var s = 0; s < 8; s++) {
            makeBox(scene, 4, 1.5, 1, stoneColor,
                WORLD_X - 35 + s * 10, wallH + 0.75, WORLD_Z + 50);
        }
    }

    function buildBerwickCastle(scene) {
        var stoneColor = 0x9A8A78;
        var ruinColor = 0x7A6A58;

        // Square keep ruin 10x10x10
        makeBox(scene, 10, 10, 10, stoneColor, WORLD_X - 70, 5, WORLD_Z - 80);

        // Wall fragments around keep
        makeBox(scene, 20, 6, 2, ruinColor, WORLD_X - 80, 3, WORLD_Z - 70);
        makeBox(scene, 2, 8, 15, ruinColor, WORLD_X - 62, 4, WORLD_Z - 85);
        makeBox(scene, 12, 4, 2, ruinColor, WORLD_X - 75, 2, WORLD_Z - 90);
        makeBox(scene, 2, 5, 10, ruinColor, WORLD_X - 55, 2.5, WORLD_Z - 78);

        // Crumbled corner tower stub
        makeCylinder(scene, 3, 3.5, 5, 8, stoneColor, WORLD_X - 85, 2.5, WORLD_Z - 90);
    }

    function buildRoyalBorderBridge(scene) {
        var stoneColor = 0x9A8A78;

        // Bridge deck: 28-arch Victorian viaduct
        makeBox(scene, 180, 6, 8, stoneColor, WORLD_X + 60, 18, WORLD_Z + 20);

        // 28 arch piers (cylinders)
        for (var p = 0; p < 28; p++) {
            var px = WORLD_X - 27 + p * 6.5 + 60;
            // Pier shaft
            makeCylinder(scene, 1.2, 1.5, 14, 8, stoneColor, px, 7, WORLD_Z + 20);
            // Pier base
            makeCylinder(scene, 2, 2.2, 2, 8, stoneColor, px, 1, WORLD_Z + 20);
        }

        // Approach embankments
        makeBox(scene, 20, 8, 8, stoneColor, WORLD_X - 58 + 60, 4, WORLD_Z + 20);
        makeBox(scene, 20, 8, 8, stoneColor, WORLD_X + 148 + 60 - 178, 4, WORLD_Z + 20);
    }

    function buildRiverTweed(scene) {
        var waterColor = 0x1A6B8A;

        // Wide river flowing east-west under bridges
        makeBox(scene, 300, 1, 60, waterColor, WORLD_X + 30, 0, WORLD_Z + 20);

        // Deeper channel section
        makeBox(scene, 300, 0.5, 20, waterColor, WORLD_X + 30, -0.2, WORLD_Z + 15);
    }

    function buildOldBridge(scene) {
        var stoneColor = 0x8A7A68;

        // 17th century road bridge deck (60 wide, 3 high, 5 thick)
        makeBox(scene, 60, 3, 5, stoneColor, WORLD_X + 10, 5, WORLD_Z + 22);

        // 15 box arch piers under road bridge
        for (var q = 0; q < 15; q++) {
            var qx = WORLD_X - 25 + q * 4 + 10;
            makeBox(scene, 2.5, 6, 4, stoneColor, qx, 3, WORLD_Z + 22);
        }

        // Parapet rails
        makeBox(scene, 60, 1, 0.5, stoneColor, WORLD_X + 10, 7, WORLD_Z + 19.5);
        makeBox(scene, 60, 1, 0.5, stoneColor, WORLD_X + 10, 7, WORLD_Z + 24.5);

        // Bridge approach ramps
        makeBox(scene, 8, 2, 5, stoneColor, WORLD_X - 34, 3, WORLD_Z + 22);
        makeBox(scene, 8, 2, 5, stoneColor, WORLD_X + 44, 3, WORLD_Z + 22);
    }

    function buildCoastalBattery(scene) {
        var concreteColor = 0x7A8070;
        var steelColor = 0x505050;

        // Headland position — north-east of town
        var bx = WORLD_X + 80;
        var bz = WORLD_Z - 90;

        // Main gun emplacement — thick concrete bunker
        makeBox(scene, 18, 3, 14, concreteColor, bx, 1.5, bz);

        // Rear command/crew room
        makeBox(scene, 10, 4, 8, concreteColor, bx, 2, bz + 10);

        // Protective blast walls (left and right)
        makeBox(scene, 2, 4, 8, concreteColor, bx - 10, 2, bz - 2);
        makeBox(scene, 2, 4, 8, concreteColor, bx + 10, 2, bz - 2);

        // Forward lip / gun platform
        makeBox(scene, 18, 1, 4, concreteColor, bx, 3.5, bz - 7);

        // Twin gun barrels (cylinders horizontal — rotated via position tricks using tall thin boxes)
        // Left gun barrel
        makeBox(scene, 0.6, 0.6, 8, steelColor, bx - 3, 4.3, bz - 8);
        // Right gun barrel
        makeBox(scene, 0.6, 0.6, 8, steelColor, bx + 3, 4.3, bz - 8);

        // Gun cradle/mount bases
        makeCylinder(scene, 1.2, 1.5, 2, 8, steelColor, bx - 3, 3.3, bz - 4);
        makeCylinder(scene, 1.2, 1.5, 2, 8, steelColor, bx + 3, 3.3, bz - 4);

        // Ammunition store
        makeBox(scene, 6, 3, 6, concreteColor, bx - 14, 1.5, bz);

        // Observation post (small concrete box on top)
        makeBox(scene, 4, 3, 4, concreteColor, bx + 6, 5.5, bz + 8);

        // Entry trench / access
        makeBox(scene, 2, 1.5, 12, concreteColor, bx - 8, 0.75, bz + 14);
    }

    function buildHeadlandTerrain(scene) {
        var grassColor = 0x4A6030;
        var cliffsColor = 0x9A8A70;

        // Grassy headland mound
        makeBox(scene, 60, 3, 50, grassColor, WORLD_X + 80, 1.5, WORLD_Z - 80);

        // Cliff edge faces
        makeBox(scene, 60, 5, 2, cliffsColor, WORLD_X + 80, 2.5, WORLD_Z - 110);
        makeBox(scene, 2, 5, 50, cliffsColor, WORLD_X + 110, 2.5, WORLD_Z - 80);
    }

    function buildRailwayStation(scene) {
        var brickColor = 0xA05030;
        var roofColor = 0x404040;

        var sx = WORLD_X - 60;
        var sz = WORLD_Z - 60;

        // Station building
        makeBox(scene, 20, 5, 8, brickColor, sx, 2.5, sz);
        // Roof
        makeBox(scene, 22, 1, 10, roofColor, sx, 5.5, sz);

        // Platform
        makeBox(scene, 40, 1, 6, 0xC8B89A, sx, 0.5, sz + 7);

        // Canopy over platform
        makeBox(scene, 40, 0.5, 5, roofColor, sx, 4, sz + 7);

        // Platform supports
        for (var k = 0; k < 5; k++) {
            makeCylinder(scene, 0.2, 0.2, 4, 6, 0x404040, sx - 16 + k * 8, 2, sz + 7);
        }
    }

    function buildTownBuildings(scene) {
        var buildingColors = [0xC09070, 0xB08060, 0xA07050, 0xD0A080, 0x908070];

        // Scatter of townhouses within the walls
        var buildingData = [
            [8, 6, 6, WORLD_X - 20, WORLD_Z - 20],
            [6, 5, 5, WORLD_X,      WORLD_Z - 25],
            [7, 7, 6, WORLD_X + 15, WORLD_Z - 15],
            [5, 5, 5, WORLD_X - 15, WORLD_Z + 5],
            [9, 6, 7, WORLD_X + 5,  WORLD_Z + 10],
            [6, 8, 5, WORLD_X - 25, WORLD_Z + 20],
            [7, 5, 6, WORLD_X + 20, WORLD_Z + 25],
            [5, 6, 5, WORLD_X - 5,  WORLD_Z + 30],
            [8, 7, 6, WORLD_X + 30, WORLD_Z - 5]
        ];

        for (var b = 0; b < buildingData.length; b++) {
            var bd = buildingData[b];
            var bColor = buildingColors[b % buildingColors.length];
            makeBox(scene, bd[0], bd[1], bd[2], bColor, bd[3], bd[1] / 2, bd[4]);
            // Simple peaked roof
            makeBox(scene, bd[0] + 0.5, 1.5, bd[2] + 0.5, 0x804020, bd[3], bd[1] + 0.75, bd[4]);
        }

        // Church / tower
        makeBox(scene, 10, 12, 10, 0x9A8A78, WORLD_X + 25, 6, WORLD_Z - 35);
        makeBox(scene, 4, 4, 4, 0x8A7A68, WORLD_X + 25, 14, WORLD_Z - 35);
        // Cross on top
        makeBox(scene, 0.5, 3, 0.5, 0x505050, WORLD_X + 25, 17.5, WORLD_Z - 35);
        makeBox(scene, 2.5, 0.5, 0.5, 0x505050, WORLD_X + 25, 18.5, WORLD_Z - 35);
    }

    function buildGuardHouses(scene) {
        var stoneColor = 0x9A8A78;

        // Gate houses at main entrances in the walls
        // Scots Gate (north)
        makeBox(scene, 8, 8, 6, stoneColor, WORLD_X, 4, WORLD_Z - 52);
        // Cow Port (east)
        makeBox(scene, 6, 7, 8, stoneColor, WORLD_X + 42, 3.5, WORLD_Z);

        // Merlons on gate house tops
        for (var m = 0; m < 4; m++) {
            makeBox(scene, 1.5, 1.5, 1, stoneColor,
                WORLD_X - 2.25 + m * 1.5, 9, WORLD_Z - 52);
        }
    }

    function buildLineSegmentAccents(scene) {
        // Wire-frame accent on keep ruin using LineSegments
        var geo = new THREE.BoxGeometry(10.2, 10.2, 10.2);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: 0x6A5A48 });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(WORLD_X - 70, 5, WORLD_Z - 80);
        scene.add(lines);
    }

    function create(scene) {
        buildRiverTweed(scene);
        buildHeadlandTerrain(scene);
        buildTownWalls(scene);
        buildBerwickCastle(scene);
        buildRoyalBorderBridge(scene);
        buildOldBridge(scene);
        buildCoastalBattery(scene);
        buildRailwayStation(scene);
        buildTownBuildings(scene);
        buildGuardHouses(scene);
        buildLineSegmentAccents(scene);
    }

    return {
        create: create
    };

}());
