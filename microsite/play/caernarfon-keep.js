window.CaernarfonKeep = (function() {
    'use strict';

    var WX = 3310;
    var WZ = 2200;

    function makeBox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeCylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeCone(scene, r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeSphere(scene, r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeEdges(scene, geo, color, x, y, z) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        var edges = new THREE.EdgesGeometry(geo);
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(WX + x, y, WZ + z);
        scene.add(lines);
        return lines;
    }

    function buildCastleMainWalls(scene) {
        // Main castle body — large sandstone box (35×12×25)
        makeBox(scene, 35, 12, 25, 0xD4A97A, 0, 6, 0);

        // Colour banding — dark purple-grey horizontal strips alternating with sandstone
        // Band 1 (near base)
        makeBox(scene, 35.2, 1, 25.2, 0x6A5A7A, 0, 2, 0);
        // Band 2
        makeBox(scene, 35.2, 1, 25.2, 0x6A5A7A, 0, 5, 0);
        // Band 3
        makeBox(scene, 35.2, 1, 25.2, 0x6A5A7A, 0, 8, 0);
        // Band 4 (near top)
        makeBox(scene, 35.2, 1, 25.2, 0x6A5A7A, 0, 11, 0);

        // Inner sandstone infill strips between bands (slightly recessed colour)
        makeBox(scene, 35.1, 1, 25.1, 0xD4A97A, 0, 3.5, 0);
        makeBox(scene, 35.1, 1, 25.1, 0xD4A97A, 0, 6.5, 0);
        makeBox(scene, 35.1, 1, 25.1, 0xD4A97A, 0, 9.5, 0);
    }

    function buildPolygonalTowers(scene) {
        // 13 distinctive polygonal towers around the perimeter (cylinders with 7 sides = polygonal)
        // Tower positions around the irregular polygon plan
        var towerPositions = [
            [-17, 12],   // North wall west
            [-10, 12],   // North wall centre-west
            [ -3, 12],   // North wall centre
            [  5, 12],   // North wall centre-east
            [ 13, 12],   // North wall east
            [ 17,  6],   // East wall north
            [ 17, -4],   // East wall south
            [ 13,-12],   // South wall east
            [  5,-12],   // South wall centre-east
            [ -3,-12],   // South wall centre
            [-10,-12],   // South wall centre-west
            [-17, -6],   // West wall south
            [-17,  3]    // West wall north (back toward Eagle Tower)
        ];

        var i;
        for (i = 0; i < towerPositions.length; i++) {
            var tx = towerPositions[i][0];
            var tz = towerPositions[i][1];
            // Polygonal tower shaft — 7 sides to give polygonal appearance
            makeCylinder(scene, 3, 3, 16, 7, 0xD4A97A, tx, 8, tz);
            // Colour banding on tower
            makeBox(scene, 6.5, 0.8, 6.5, 0x6A5A7A, tx, 4, tz);
            makeBox(scene, 6.5, 0.8, 6.5, 0x6A5A7A, tx, 8, tz);
            makeBox(scene, 6.5, 0.8, 6.5, 0x6A5A7A, tx, 12, tz);
            // Pointed cone top (battlemented cap)
            makeCone(scene, 3.2, 5, 7, 0x8A7A60, tx, 18.5, tz);
        }
    }

    function buildEagleTower(scene) {
        // Eagle Tower at southwest — largest tower (r=5, h=20)
        var ex = -19;
        var ez = -14;

        // Main shaft — polygonal (8 sides)
        makeCylinder(scene, 5, 5, 20, 8, 0xD4A97A, ex, 10, ez);

        // Colour banding bands on Eagle Tower
        makeBox(scene, 11, 1, 11, 0x6A5A7A, ex, 3, ez);
        makeBox(scene, 11, 1, 11, 0x6A5A7A, ex, 7, ez);
        makeBox(scene, 11, 1, 11, 0x6A5A7A, ex, 11, ez);
        makeBox(scene, 11, 1, 11, 0x6A5A7A, ex, 15, ez);
        makeBox(scene, 11, 1, 11, 0x6A5A7A, ex, 19, ez);

        // Three turrets at top of Eagle Tower (distinctive feature)
        makeCylinder(scene, 1.5, 1.5, 4, 6, 0xC49A6A, ex - 3, 22, ez - 3);
        makeCylinder(scene, 1.5, 1.5, 4, 6, 0xC49A6A, ex + 3, 22, ez - 3);
        makeCylinder(scene, 1.5, 1.5, 4, 6, 0xC49A6A, ex,     22, ez + 4);

        // Turret cone tops
        makeCone(scene, 1.6, 3, 6, 0x8A7A60, ex - 3, 25.5, ez - 3);
        makeCone(scene, 1.6, 3, 6, 0x8A7A60, ex + 3, 25.5, ez - 3);
        makeCone(scene, 1.6, 3, 6, 0x8A7A60, ex,     25.5, ez + 4);

        // Eagle Tower cone cap (main)
        makeCone(scene, 5.5, 8, 8, 0x7A6A50, ex, 26, ez);
    }

    function buildTownWalls(scene) {
        // Medieval town walls connecting castle to the town
        // Main wall section west (0x9A8A78)
        makeBox(scene, 40, 6, 2, 0x9A8A78, -30, 3, -8);
        // Banding on town walls
        makeBox(scene, 40.2, 0.8, 2.2, 0x6A5A7A, -30, 2, -8);
        makeBox(scene, 40.2, 0.8, 2.2, 0x6A5A7A, -30, 5, -8);

        // North town wall section
        makeBox(scene, 2, 6, 30, 0x9A8A78, -50, 3, 7);
        makeBox(scene, 2.2, 0.8, 30.2, 0x6A5A7A, -50, 2, 7);
        makeBox(scene, 2.2, 0.8, 30.2, 0x6A5A7A, -50, 5, 7);

        // Exchequer Gate — gateway arch represented as two thick pillars + lintel
        makeBox(scene, 3, 8, 3, 0x9A8A78, -35, 4, -8);   // Left pillar
        makeBox(scene, 3, 8, 3, 0x9A8A78, -25, 4, -8);   // Right pillar
        makeBox(scene, 13, 2, 3, 0x9A8A78, -30, 8, -8);  // Lintel

        // Towers along town walls
        makeCylinder(scene, 2.5, 2.5, 8, 7, 0x9A8A78, -50, 4,  20);
        makeCone(scene, 2.6, 4, 7, 0x7A6A50, -50, 10, 20);
        makeCylinder(scene, 2.5, 2.5, 8, 7, 0x9A8A78, -50, 4, -10);
        makeCone(scene, 2.6, 4, 7, 0x7A6A50, -50, 10, -10);
        makeCylinder(scene, 2.5, 2.5, 8, 7, 0x9A8A78, -35, 4, -8);
        makeCone(scene, 2.6, 4, 7, 0x7A6A50, -35, 10, -8);
    }

    function buildMenaiStrait(scene) {
        // Strait of Menai — water visible below the castle walls (west side)
        // Several overlapping water boxes to suggest moving water
        makeBox(scene, 60, 1, 20, 0x1A6B8A, -40, -1,  18);
        makeBox(scene, 60, 1, 20, 0x1A6B8A, -40, -1,  38);
        makeBox(scene, 60, 1, 20, 0x1A6B8A, -40, -1,  58);
        makeBox(scene, 20, 1, 80, 0x1A6B8A, -60, -1,  18);

        // Subtle water shimmer surface highlights
        makeBox(scene, 58, 0.3, 18, 0x2A8AAA, -40, -0.2, 18);
        makeBox(scene, 58, 0.3, 18, 0x2A8AAA, -40, -0.2, 38);
    }

    function buildInvestitureDais(scene) {
        // Investiture dais in castle courtyard — where Prince Charles was invested 1969
        // Stone platform (box 8×1×6, 0x9A9A9A)
        makeBox(scene, 8, 1, 6, 0x9A9A9A, 3, 12.5, 3);

        // Dais edge detail
        makeBox(scene, 8.4, 0.3, 6.4, 0x7A7A7A, 3, 12.15, 3);

        // Small throne base marker on dais
        makeBox(scene, 1.5, 0.5, 1.5, 0xAAAAAA, 3, 13.25, 3);

        // Decorative sphere on throne marker
        makeSphere(scene, 0.4, 6, 6, 0xC8C8B8, 3, 13.95, 3);

        // Dais edge wireframe for detail
        var daisGeo = new THREE.BoxGeometry(8, 1, 6);
        makeEdges(scene, daisGeo, 0x555555, 3, 12.5, 3);
    }

    function buildSegontiumRemains(scene) {
        // Roman fort Segontium remains on nearby hill (northeast of castle)
        // Ruined stone wall fragments (0x8A8A7A)
        var hx = 30;
        var hz = -25;
        var hy = 2;

        // Foundation platform
        makeBox(scene, 20, 1, 15, 0x8A8A7A, hx, hy - 0.5, hz);

        // Ruined north wall — broken segments (varying heights)
        makeBox(scene, 8, 3, 1.5, 0x8A8A7A, hx - 5, hy + 1.5, hz - 6.5);
        makeBox(scene, 3, 1.5, 1.5, 0x8A8A7A, hx + 4, hy + 0.75, hz - 6.5);
        makeBox(scene, 4, 2.5, 1.5, 0x8A8A7A, hx + 8, hy + 1.25, hz - 6.5);

        // Ruined east wall fragments
        makeBox(scene, 1.5, 2, 6, 0x8A8A7A, hx + 9.5, hy + 1, hz - 2);
        makeBox(scene, 1.5, 1.2, 4, 0x8A8A7A, hx + 9.5, hy + 0.6, hz + 5);

        // Ruined west wall fragments
        makeBox(scene, 1.5, 3, 5, 0x8A8A7A, hx - 9.5, hy + 1.5, hz - 1);
        makeBox(scene, 1.5, 1.5, 3, 0x8A8A7A, hx - 9.5, hy + 0.75, hz + 4);

        // Ruined south wall
        makeBox(scene, 6, 2, 1.5, 0x8A8A7A, hx - 3, hy + 1, hz + 6.5);
        makeBox(scene, 3, 0.8, 1.5, 0x8A8A7A, hx + 5, hy + 0.4, hz + 6.5);

        // Interior rubble piles
        makeBox(scene, 2, 1, 2, 0x7A7A6A, hx + 2, hy + 0.5, hz);
        makeBox(scene, 1.5, 0.7, 1.5, 0x7A7A6A, hx - 2, hy + 0.35, hz + 2);
        makeBox(scene, 2.5, 0.6, 1.5, 0x7A7A6A, hx + 4, hy + 0.3, hz - 2);

        // Corner post stubs (Roman fort corner towers)
        makeCylinder(scene, 1.2, 1.4, 2.5, 6, 0x8A8A7A, hx - 9, hy + 1.25, hz - 6);
        makeCylinder(scene, 1.2, 1.4, 1.5, 6, 0x8A8A7A, hx + 9, hy + 0.75, hz - 6);
        makeCylinder(scene, 1.2, 1.4, 2,   6, 0x8A8A7A, hx - 9, hy + 1,    hz + 6);
    }

    function buildGroundBase(scene) {
        // Castle mound / ground base (raised earthwork platform)
        makeBox(scene, 50, 2, 40, 0x8B7355, 0, -1, 0);
        // Outer ground level
        makeBox(scene, 120, 1, 100, 0x7A8A5A, 0, -2, 5);
        // Grassy surrounds
        makeBox(scene, 80, 0.5, 60, 0x6A7A4A, -10, -1.5, 10);
    }

    function buildCourtyard(scene) {
        // Inner courtyard floor
        makeBox(scene, 25, 0.5, 15, 0xC8B890, 2, 12.2, 2);

        // Well in courtyard
        makeCylinder(scene, 0.8, 0.9, 2, 8, 0x888878, -3, 13.5, -3);
        makeBox(scene, 3, 0.3, 0.3, 0x665544, -3, 15, -3);  // Well crossbeam
    }

    function buildBattlements(scene) {
        // Crenellations along top of main castle wall (north face)
        var i;
        for (i = -15; i <= 15; i += 3) {
            makeBox(scene, 1.5, 2, 1, 0xD4A97A, i, 13.5, -12.5);
        }
        // South face battlements
        for (i = -15; i <= 15; i += 3) {
            makeBox(scene, 1.5, 2, 1, 0xD4A97A, i, 13.5, 12.5);
        }
        // East face battlements
        for (i = -10; i <= 10; i += 3) {
            makeBox(scene, 1, 2, 1.5, 0xD4A97A, 17.5, 13.5, i);
        }
        // West face battlements
        for (i = -10; i <= 10; i += 3) {
            makeBox(scene, 1, 2, 1.5, 0xD4A97A, -17.5, 13.5, i);
        }
    }

    function buildGateway(scene) {
        // King's Gate — main castle entrance (north side)
        // Left tower pillar
        makeBox(scene, 4, 14, 4, 0xD4A97A, -5, 7, -13);
        // Right tower pillar
        makeBox(scene, 4, 14, 4, 0xD4A97A,  5, 7, -13);
        // Gate arch lintel
        makeBox(scene, 14, 2.5, 4, 0xD4A97A,  0, 13.5, -13);
        // Gate passage (darker interior)
        makeBox(scene, 6, 9, 3, 0x4A3A2A, 0, 4.5, -13.5);
        // Portcullis grooves (thin dark strips)
        makeBox(scene, 0.3, 9, 0.3, 0x222222, -2.5, 4.5, -11.5);
        makeBox(scene, 0.3, 9, 0.3, 0x222222,  2.5, 4.5, -11.5);

        // Queen's Gate (east side)
        makeBox(scene, 4, 10, 4, 0xD4A97A, 17, 5, 4);
        makeBox(scene, 2.5, 7, 3, 0x4A3A2A, 17.5, 3.5, 4);
    }

    function create(scene) {
        buildGroundBase(scene);
        buildCastleMainWalls(scene);
        buildPolygonalTowers(scene);
        buildEagleTower(scene);
        buildTownWalls(scene);
        buildMenaiStrait(scene);
        buildInvestitureDais(scene);
        buildSegontiumRemains(scene);
        buildCourtyard(scene);
        buildBattlements(scene);
        buildGateway(scene);
    }

    function getSpawnPoint() {
        return { x: WX + 2, y: 14, z: WZ + 2 };
    }

    function getBounds() {
        return {
            minX: WX - 65,
            maxX: WX + 55,
            minZ: WZ - 35,
            maxZ: WZ + 65
        };
    }

    return {
        create: create,
        getSpawnPoint: getSpawnPoint,
        getBounds: getBounds,
        worldX: WX,
        worldZ: WZ
    };

}());
