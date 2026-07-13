window.TintagelCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14200;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(geo, mat);
        return addObj(lines);
    }

    function buildHeadland() {
        // Main headland plateau - dark Cornish slate
        makeBox(120, 18, 80, 0x3a3a4a, X_OFFSET, 9, -60);
        // Headland cliffs south face
        makeBox(120, 30, 8, 0x2a2a38, X_OFFSET, -6, -98);
        // Headland cliffs north face
        makeBox(120, 30, 8, 0x2a2a38, X_OFFSET, -6, -22);
        // West cliff edge
        makeBox(8, 30, 80, 0x2a2a38, X_OFFSET - 58, -6, -60);
        // Connecting neck of land (narrow)
        makeBox(24, 14, 40, 0x3d3d4e, X_OFFSET, 7, 0);
        // Mainland plateau
        makeBox(160, 12, 120, 0x4a4a5a, X_OFFSET + 60, 6, 20);
    }

    function buildSlateCliffs() {
        var cliffColor = 0x2e2e3d;
        var cliffColor2 = 0x252535;
        var i;

        // South cliffs - layered slate
        for (i = 0; i < 8; i++) {
            makeBox(18 + Math.floor(i * 3), 4, 10, (i % 2 === 0) ? cliffColor : cliffColor2,
                X_OFFSET - 50 + i * 16, -5 - i * 2, -100 + i * 2);
        }
        // North cliffs
        for (i = 0; i < 6; i++) {
            makeBox(20, 6 + i, 8, (i % 2 === 0) ? cliffColor : cliffColor2,
                X_OFFSET - 40 + i * 20, -8, -18 - i * 3);
        }
        // Jagged cliff tops - slate spires
        makeCone(2, 8, 4, 0x1e1e2d, X_OFFSET - 55, 24, -95);
        makeCone(1.5, 6, 4, 0x1e1e2d, X_OFFSET - 48, 22, -90);
        makeCone(2.5, 10, 4, 0x1e1e2d, X_OFFSET - 62, 20, -85);
        makeCone(1.8, 7, 4, 0x1e1e2d, X_OFFSET + 55, 20, -92);
        makeCone(2.2, 9, 4, 0x1e1e2d, X_OFFSET + 50, 18, -88);

        // Wave-cut platform at base
        makeBox(140, 2, 20, 0x3a3a48, X_OFFSET, -16, -105);
        // Sea cave notch south
        makeBox(12, 8, 6, 0x1a1a28, X_OFFSET - 20, -12, -102);
        // Sea cave notch north
        makeBox(10, 6, 6, 0x1a1a28, X_OFFSET + 15, -10, -20);

        // Offshore rock stacks
        makeCylinder(3, 5, 20, 5, 0x2a2a38, X_OFFSET - 90, 2, -80);
        makeCylinder(2, 4, 14, 5, 0x252535, X_OFFSET - 100, -1, -65);
        makeCylinder(4, 6, 16, 5, 0x2e2e3d, X_OFFSET + 85, 0, -70);
        makeCylinder(2, 3, 10, 5, 0x252535, X_OFFSET + 100, -3, -55);

        // Rocky outcrops at shore
        makeBox(8, 4, 6, cliffColor, X_OFFSET - 75, -14, -75);
        makeBox(6, 3, 5, cliffColor2, X_OFFSET - 80, -15, -60);
        makeBox(10, 5, 7, cliffColor, X_OFFSET + 70, -13, -72);
    }

    function buildSeascape() {
        // Deep Atlantic sea plane
        makeBox(400, 2, 300, 0x1a2d4a, X_OFFSET - 80, -19, -100);
        // Darker deep water
        makeBox(200, 1, 150, 0x142038, X_OFFSET - 120, -20, -140);

        // Surf clusters - white sphere clusters at cliff bases
        var surfPositions = [
            [X_OFFSET - 60, -16, -102],
            [X_OFFSET - 30, -16, -104],
            [X_OFFSET, -16, -103],
            [X_OFFSET + 30, -16, -102],
            [X_OFFSET + 55, -16, -100],
            [X_OFFSET - 55, -16, -22],
            [X_OFFSET - 30, -16, -20]
        ];
        var s;
        for (s = 0; s < surfPositions.length; s++) {
            makeSphere(2.5, 6, 4, 0xe8f0f8, surfPositions[s][0], surfPositions[s][1], surfPositions[s][2]);
            makeSphere(1.5, 6, 4, 0xf0f5fa, surfPositions[s][0] + 3, surfPositions[s][1], surfPositions[s][2] + 2);
            makeSphere(1.8, 6, 4, 0xe0ecf8, surfPositions[s][0] - 2, surfPositions[s][1] + 0.5, surfPositions[s][2] - 1);
        }

        // Offshore surf at rock stacks
        makeSphere(3, 6, 4, 0xe8f0f8, X_OFFSET - 90, -8, -75);
        makeSphere(3, 6, 4, 0xe8f0f8, X_OFFSET + 85, -9, -68);
    }

    function buildMerlinsCave() {
        var caveColor = 0x1a1a2a;
        var caveInner = 0x0f0f1a;

        // Cave entrance - south side of headland base
        makeBox(14, 10, 8, caveColor, X_OFFSET - 10, -12, -100);
        // Cave tunnel through headland
        makeBox(12, 8, 50, caveColor, X_OFFSET - 10, -13, -75);
        // Cave exit - north side
        makeBox(14, 10, 8, caveColor, X_OFFSET - 10, -12, -52);
        // Dark interior
        makeBox(8, 6, 48, caveInner, X_OFFSET - 10, -14, -76);

        // Water inside cave - dark blue-green
        makeBox(8, 1, 45, 0x0a1520, X_OFFSET - 10, -18, -76);

        // Stalactite formations
        makeCone(0.8, 4, 5, 0x2a2a3a, X_OFFSET - 8, -8, -70);
        makeCone(0.6, 3, 5, 0x252535, X_OFFSET - 12, -9, -75);
        makeCone(1.0, 5, 5, 0x2a2a3a, X_OFFSET - 6, -7, -80);
        makeCone(0.7, 3.5, 5, 0x252535, X_OFFSET - 14, -8, -85);
        makeCone(0.5, 2.5, 5, 0x2a2a3a, X_OFFSET - 9, -9, -90);
        makeCone(0.9, 4, 5, 0x252535, X_OFFSET - 11, -8, -65);

        // Stalagmites from cave floor
        makeCone(0.7, 3, 5, 0x252535, X_OFFSET - 9, -17, -72);
        makeCone(0.5, 2, 5, 0x2a2a3a, X_OFFSET - 13, -17, -82);

        // Cave rock walls - jagged
        makeBox(4, 10, 50, 0x222232, X_OFFSET - 18, -12, -76);
        makeBox(4, 10, 50, 0x222232, X_OFFSET - 2, -12, -76);
    }

    function buildFootbridge() {
        var steelColor = 0x5a6070;
        var cableColor = 0x404855;
        var deckColor = 0x686878;

        // Bridge deck - box spanning neck of land
        makeBox(4, 1.5, 44, deckColor, X_OFFSET - 4, 20, -4);

        // Left pylon tower 1
        makeBox(2, 18, 2, steelColor, X_OFFSET - 4, 29, -16);
        // Left pylon tower 2
        makeBox(2, 18, 2, steelColor, X_OFFSET + 4, 29, -16);
        // Cross beam left pylons
        makeBox(10, 1.5, 2, steelColor, X_OFFSET, 37, -16);

        // Right pylon tower 1
        makeBox(2, 18, 2, steelColor, X_OFFSET - 4, 29, 12);
        // Right pylon tower 2
        makeBox(2, 18, 2, steelColor, X_OFFSET + 4, 29, 12);
        // Cross beam right pylons
        makeBox(10, 1.5, 2, steelColor, X_OFFSET, 37, 12);

        // Handrail left side
        makeBox(1, 1, 44, steelColor, X_OFFSET - 6, 22, -4);
        // Handrail right side
        makeBox(1, 1, 44, steelColor, X_OFFSET + 6, 22, -4);

        // Cable lines from pylons to deck ends - LineSegments
        var cablePoints1 = [
            new THREE.Vector3(X_OFFSET, 37, -16),
            new THREE.Vector3(X_OFFSET - 4, 20, -24),
            new THREE.Vector3(X_OFFSET, 37, -16),
            new THREE.Vector3(X_OFFSET - 4, 20, 8),
            new THREE.Vector3(X_OFFSET, 37, -16),
            new THREE.Vector3(X_OFFSET - 4, 20, -10),
            new THREE.Vector3(X_OFFSET, 37, -16),
            new THREE.Vector3(X_OFFSET - 4, 20, -2)
        ];
        makeLines(cablePoints1, cableColor);

        var cablePoints2 = [
            new THREE.Vector3(X_OFFSET, 37, 12),
            new THREE.Vector3(X_OFFSET - 4, 20, -24),
            new THREE.Vector3(X_OFFSET, 37, 12),
            new THREE.Vector3(X_OFFSET - 4, 20, 8),
            new THREE.Vector3(X_OFFSET, 37, 12),
            new THREE.Vector3(X_OFFSET - 4, 20, -10),
            new THREE.Vector3(X_OFFSET, 37, 12),
            new THREE.Vector3(X_OFFSET - 4, 20, -2)
        ];
        makeLines(cablePoints2, cableColor);

        // Deck support verticals
        var deckSupportPoints = [
            new THREE.Vector3(X_OFFSET - 4, 20, -20),
            new THREE.Vector3(X_OFFSET - 4, 22, -20),
            new THREE.Vector3(X_OFFSET - 4, 20, -12),
            new THREE.Vector3(X_OFFSET - 4, 22, -12),
            new THREE.Vector3(X_OFFSET - 4, 20, -4),
            new THREE.Vector3(X_OFFSET - 4, 22, -4),
            new THREE.Vector3(X_OFFSET - 4, 20, 4),
            new THREE.Vector3(X_OFFSET - 4, 22, 4)
        ];
        makeLines(deckSupportPoints, cableColor);
    }

    function buildCastleRuins() {
        var wallColor = 0x5a5060;
        var stoneColor = 0x6a6070;
        var darkWall = 0x404050;

        // Outer ward walls - ruined sections
        // North outer wall - partial
        makeBox(60, 8, 3, wallColor, X_OFFSET - 20, 23, -30);
        // South outer wall - more ruined
        makeBox(40, 5, 3, darkWall, X_OFFSET - 30, 20, -72);
        // East outer wall remnant
        makeBox(3, 10, 45, wallColor, X_OFFSET + 28, 24, -52);
        // West outer wall - cliff edge
        makeBox(3, 12, 50, darkWall, X_OFFSET - 55, 22, -50);

        // Inner ward walls
        makeBox(35, 10, 3, stoneColor, X_OFFSET - 5, 25, -42);
        makeBox(35, 8, 3, stoneColor, X_OFFSET - 5, 23, -58);
        makeBox(3, 10, 18, stoneColor, X_OFFSET + 12, 25, -50);
        makeBox(3, 12, 18, wallColor, X_OFFSET - 22, 26, -50);

        // Ruined wall tops - jagged merlons
        var m;
        for (m = 0; m < 5; m++) {
            makeBox(2.5, 3, 2.5, stoneColor, X_OFFSET - 22 + m * 7, 31, -42);
        }
        for (m = 0; m < 4; m++) {
            makeBox(2.5, 2.5, 2.5, darkWall, X_OFFSET - 18 + m * 7, 28, -58);
        }

        // Round tower stump - main keep remnant
        makeCylinder(6, 7, 20, 10, wallColor, X_OFFSET + 8, 28, -40);
        // Tower stump rubble top - irregular
        makeBox(8, 2, 8, darkWall, X_OFFSET + 8, 39, -40);
        makeCylinder(3, 4, 5, 8, darkWall, X_OFFSET + 8, 41, -40);

        // Second tower remnant
        makeCylinder(4, 5, 12, 10, darkWall, X_OFFSET - 20, 24, -35);

        // Great Hall ruins - large rectangular footprint
        makeBox(3, 14, 28, stoneColor, X_OFFSET - 5, 25, -62);
        makeBox(3, 14, 28, stoneColor, X_OFFSET + 20, 25, -62);
        makeBox(28, 14, 3, stoneColor, X_OFFSET + 7, 25, -48);
        // Great hall floor/rubble
        makeBox(28, 2, 25, 0x504858, X_OFFSET + 7, 19, -62);
        // Remaining arch/window
        makeBox(3, 6, 2, stoneColor, X_OFFSET - 5, 28, -62);
        makeBox(3, 6, 2, stoneColor, X_OFFSET - 5, 28, -55);
        makeBox(3, 1.5, 9, stoneColor, X_OFFSET - 5, 33, -58);

        // Courtyard
        makeBox(30, 1, 22, 0x484858, X_OFFSET - 4, 19.5, -50);

        // Steps cut into rock
        var step;
        for (step = 0; step < 6; step++) {
            makeBox(6, 1.5, 3, stoneColor, X_OFFSET + 15, 19 + step * 1.5, -38 - step * 2);
        }
        // More steps to lower level
        for (step = 0; step < 4; step++) {
            makeBox(5, 1.5, 3, 0x484858, X_OFFSET - 18, 19 - step * 2, -35 + step * 2);
        }

        // Rubble piles - fallen masonry
        makeBox(5, 2, 4, darkWall, X_OFFSET + 5, 19.5, -45);
        makeBox(4, 1.5, 3, darkWall, X_OFFSET - 10, 19.5, -55);
        makeBox(6, 2.5, 5, darkWall, X_OFFSET + 18, 19.5, -65);
        makeBox(3, 1.5, 3, stoneColor, X_OFFSET - 8, 19.5, -45);

        // Gate passage remnant
        makeBox(2, 10, 6, wallColor, X_OFFSET + 29, 24, -40);
        makeBox(2, 10, 6, wallColor, X_OFFSET + 29, 24, -52);
        makeBox(8, 3, 6, wallColor, X_OFFSET + 29, 31, -46);
    }

    function buildVillage() {
        var stoneBuilding = 0x706878;
        var slateRoof = 0x352d40;
        var hotelColor = 0x806888;
        var shopColor = 0x685868;

        // King Arthur's Great Hall - local stone building on main street
        makeBox(22, 10, 14, stoneBuilding, X_OFFSET + 80, 12, 30);
        makeBox(22, 2, 14, slateRoof, X_OFFSET + 80, 17.5, 30);
        makeCone(11, 6, 4, slateRoof, X_OFFSET + 80, 23, 30);
        // Hall entrance porch
        makeBox(6, 6, 4, stoneBuilding, X_OFFSET + 80, 9, 37);
        makeBox(6, 1, 4, slateRoof, X_OFFSET + 80, 12, 37);
        // Arthur statue plinth outside
        makeCylinder(1.2, 1.5, 4, 6, 0x504858, X_OFFSET + 80, 8, 42);
        makeSphere(1.2, 6, 5, 0x706070, X_OFFSET + 80, 12, 42);

        // Camelot Castle Hotel - large Victorian building
        makeBox(28, 16, 18, hotelColor, X_OFFSET + 55, 14, 55);
        makeBox(28, 1.5, 18, slateRoof, X_OFFSET + 55, 22.5, 55);
        // Hotel turrets at corners
        makeCylinder(2.5, 2.5, 20, 8, hotelColor, X_OFFSET + 40, 16, 45);
        makeCone(2.5, 5, 8, slateRoof, X_OFFSET + 40, 28, 45);
        makeCylinder(2.5, 2.5, 20, 8, hotelColor, X_OFFSET + 70, 16, 45);
        makeCone(2.5, 5, 8, slateRoof, X_OFFSET + 70, 28, 45);
        makeCylinder(2.5, 2.5, 20, 8, hotelColor, X_OFFSET + 40, 16, 65);
        makeCone(2.5, 5, 8, slateRoof, X_OFFSET + 40, 28, 65);
        makeCylinder(2.5, 2.5, 20, 8, hotelColor, X_OFFSET + 70, 16, 65);
        makeCone(2.5, 5, 8, slateRoof, X_OFFSET + 70, 28, 65);

        // Arthurian themed shops - main street
        makeBox(10, 7, 8, shopColor, X_OFFSET + 100, 9.5, 25);
        makeBox(10, 1, 8, slateRoof, X_OFFSET + 100, 13.5, 25);
        makeBox(10, 7, 8, shopColor, X_OFFSET + 112, 9.5, 25);
        makeBox(10, 1, 8, slateRoof, X_OFFSET + 112, 13.5, 25);
        makeBox(10, 7, 8, shopColor, X_OFFSET + 124, 9.5, 25);
        makeBox(10, 1, 8, slateRoof, X_OFFSET + 124, 13.5, 25);
        makeBox(10, 7, 8, shopColor, X_OFFSET + 136, 9.5, 25);
        makeBox(10, 1, 8, slateRoof, X_OFFSET + 136, 13.5, 25);

        // Shops on opposite side of road
        makeBox(10, 7, 8, 0x5a5060, X_OFFSET + 100, 9.5, 40);
        makeBox(10, 1, 8, slateRoof, X_OFFSET + 100, 13.5, 40);
        makeBox(10, 7, 8, 0x5a5060, X_OFFSET + 112, 9.5, 40);
        makeBox(10, 1, 8, slateRoof, X_OFFSET + 112, 13.5, 40);

        // Main road/street
        makeBox(80, 0.5, 10, 0x3a3848, X_OFFSET + 110, 7, 32);

        // Car park
        makeBox(50, 0.5, 30, 0x302e3a, X_OFFSET + 145, 7, 38);
        // Car park markings - line segments
        var parkLines = [
            new THREE.Vector3(X_OFFSET + 122, 7.5, 25),
            new THREE.Vector3(X_OFFSET + 122, 7.5, 52),
            new THREE.Vector3(X_OFFSET + 130, 7.5, 25),
            new THREE.Vector3(X_OFFSET + 130, 7.5, 52),
            new THREE.Vector3(X_OFFSET + 138, 7.5, 25),
            new THREE.Vector3(X_OFFSET + 138, 7.5, 52),
            new THREE.Vector3(X_OFFSET + 146, 7.5, 25),
            new THREE.Vector3(X_OFFSET + 146, 7.5, 52),
            new THREE.Vector3(X_OFFSET + 154, 7.5, 25),
            new THREE.Vector3(X_OFFSET + 154, 7.5, 52),
            new THREE.Vector3(X_OFFSET + 162, 7.5, 25),
            new THREE.Vector3(X_OFFSET + 162, 7.5, 52),
            new THREE.Vector3(X_OFFSET + 170, 7.5, 25),
            new THREE.Vector3(X_OFFSET + 170, 7.5, 52)
        ];
        makeLines(parkLines, 0xffffff);

        // Church/Chapel
        makeBox(8, 10, 12, stoneBuilding, X_OFFSET + 90, 11, 58);
        makeBox(8, 1, 12, slateRoof, X_OFFSET + 90, 16.5, 58);
        makeCylinder(1, 1, 8, 4, stoneBuilding, X_OFFSET + 90, 23, 52);
        makeCone(1, 3, 4, slateRoof, X_OFFSET + 90, 28, 52);

        // Village boundary walls/hedges
        makeBox(80, 2, 2, 0x404838, X_OFFSET + 110, 8, 68);
        makeBox(2, 2, 60, 0x404838, X_OFFSET + 70, 8, 38);

        // Information centre / ticket office for castle
        makeBox(10, 5, 8, shopColor, X_OFFSET + 42, 9.5, 20);
        makeBox(10, 1, 8, slateRoof, X_OFFSET + 42, 12.5, 20);
    }

    function buildPathsAndAccess() {
        var pathColor = 0x504858;

        // Main path from village to castle/bridge
        makeBox(4, 0.5, 80, pathColor, X_OFFSET + 38, 7.5, -14);
        // Steps down to bridge level
        var ps;
        for (ps = 0; ps < 5; ps++) {
            makeBox(5, 1, 4, pathColor, X_OFFSET + 38, 7 - ps, -50 - ps * 3);
        }
        // Path across mainland plateau
        makeBox(5, 0.5, 40, pathColor, X_OFFSET + 20, 7.5, 14);

        // Path down to Merlin's Cave - steep stepped
        for (ps = 0; ps < 8; ps++) {
            makeBox(3, 1, 3, 0x404050, X_OFFSET - 15, 16 - ps * 3, -92 + ps * 2);
        }

        // Visitors centre path
        makeBox(5, 0.5, 20, pathColor, X_OFFSET + 42, 7.5, 10);
    }

    function build() {
        buildHeadland();
        buildSlateCliffs();
        buildSeascape();
        buildMerlinsCave();
        buildFootbridge();
        buildCastleRuins();
        buildVillage();
        buildPathsAndAccess();
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
