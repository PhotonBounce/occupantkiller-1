window.SevenoaksPark = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 10800;

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

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildGround() {
        var ground = makeBox(2400, 2, 2400, 0x5a7a3a, X_OFFSET, -1, 0);
        addMesh(ground);
    }

    function buildNorthDowns() {
        // Chalk ridge to the north — stepped terrain blocks
        var downs = [
            [2400, 18, 400, 0x8faa6a, X_OFFSET,      9,  -900],
            [2400, 36, 300, 0x9db87a, X_OFFSET,     27, -1100],
            [2400, 54, 200, 0xb0c890, X_OFFSET,     45, -1250],
            [2000, 70, 150, 0xd4e0b8, X_OFFSET,     59, -1350],
            [1600, 85, 100, 0xe8f0d0, X_OFFSET,     71, -1420]
        ];
        for (var i = 0; i < downs.length; i++) {
            var d = downs[i];
            addMesh(makeBox(d[0], d[1], d[2], d[3], d[4], d[5], d[6]));
        }
    }

    function buildKnoleHouse() {
        var bx = X_OFFSET;
        var bz = -200;

        // Main outer perimeter wall — enormous Jacobean house footprint
        // South range
        addMesh(makeBox(320, 22, 18, 0x8b7355, bx, 11, bz + 140));
        // North range
        addMesh(makeBox(320, 22, 18, 0x8b7355, bx, 11, bz - 140));
        // East range
        addMesh(makeBox(18, 22, 280, 0x8b7355, bx + 151, 11, bz));
        // West range
        addMesh(makeBox(18, 22, 280, 0x8b7355, bx - 151, 11, bz));

        // Interior courtyard dividers suggesting 7 courtyards
        // Cross ranges within the house
        addMesh(makeBox(320, 20, 12, 0x7a6545, bx,       10, bz + 60));
        addMesh(makeBox(320, 20, 12, 0x7a6545, bx,       10, bz - 60));
        addMesh(makeBox(12,  20, 280, 0x7a6545, bx + 60,  10, bz));
        addMesh(makeBox(12,  20, 280, 0x7a6545, bx - 60,  10, bz));
        addMesh(makeBox(12,  20, 140, 0x7a6545, bx + 110, 10, bz + 70));
        addMesh(makeBox(12,  20, 140, 0x7a6545, bx - 110, 10, bz + 70));

        // Tower gatehouse — south entrance, central
        addMesh(makeBox(28, 55, 20, 0x7a6545, bx, 27, bz + 148));
        // Gatehouse turrets
        addMesh(makeCylinder(4, 4, 60, 8, 0x6e5a3a, bx - 14, 30, bz + 148));
        addMesh(makeCylinder(4, 4, 60, 8, 0x6e5a3a, bx + 14, 30, bz + 148));
        // Gatehouse cone caps
        addMesh(makeCone(5, 14, 8, 0x4a3a28, bx - 14, 64, bz + 148));
        addMesh(makeCone(5, 14, 8, 0x4a3a28, bx + 14, 64, bz + 148));
        addMesh(makeCone(6, 16, 8, 0x4a3a28, bx,      70, bz + 148));

        // Corner towers on outer perimeter
        var corners = [
            [bx - 151, bz + 140],
            [bx + 151, bz + 140],
            [bx - 151, bz - 140],
            [bx + 151, bz - 140]
        ];
        for (var c = 0; c < corners.length; c++) {
            var cx = corners[c][0];
            var cz = corners[c][1];
            addMesh(makeCylinder(8, 8, 40, 8, 0x6e5a3a, cx, 20, cz));
            addMesh(makeCone(9, 18, 8, 0x4a3a28, cx, 47, cz));
        }

        // Mullioned window suggestion: rows of thin boxes across ranges
        // South facade windows
        for (var w = 0; w < 14; w++) {
            addMesh(makeBox(5, 8, 1, 0xc8b88a, bx - 140 + w * 21, 15, bz + 149));
        }
        // North facade windows
        for (var wn = 0; wn < 14; wn++) {
            addMesh(makeBox(5, 8, 1, 0xc8b88a, bx - 140 + wn * 21, 15, bz - 149));
        }
        // East facade windows
        for (var we = 0; we < 12; we++) {
            addMesh(makeBox(1, 8, 5, 0xc8b88a, bx + 160, 15, bz - 110 + we * 20));
        }
        // West facade windows
        for (var ww = 0; ww < 12; ww++) {
            addMesh(makeBox(1, 8, 5, 0xc8b88a, bx - 160, 15, bz - 110 + ww * 20));
        }

        // Roof level — long low boxes across wings
        addMesh(makeBox(322, 6, 20, 0x5a4a2e, bx, 28, bz + 140));
        addMesh(makeBox(322, 6, 20, 0x5a4a2e, bx, 28, bz - 140));
        addMesh(makeBox(20, 6, 282, 0x5a4a2e, bx + 151, 28, bz));
        addMesh(makeBox(20, 6, 282, 0x5a4a2e, bx - 151, 28, bz));

        // Interior wing roofs
        addMesh(makeBox(322, 5, 14, 0x5a4a2e, bx, 27, bz + 60));
        addMesh(makeBox(322, 5, 14, 0x5a4a2e, bx, 27, bz - 60));
    }

    function buildKnoleParkTrees() {
        // 7 ancient park trees scattered in the deer park
        var trees = [
            [X_OFFSET - 400, 0,  200],
            [X_OFFSET - 300, 0,  350],
            [X_OFFSET + 380, 0,  280],
            [X_OFFSET + 450, 0,   80],
            [X_OFFSET - 200, 0,  480],
            [X_OFFSET + 150, 0,  550],
            [X_OFFSET - 500, 0,  100]
        ];
        for (var t = 0; t < trees.length; t++) {
            var tx = trees[t][0];
            var ty = trees[t][1];
            var tz = trees[t][2];
            // Trunk
            addMesh(makeCylinder(3, 5, 22, 7, 0x5c3d1a, tx, 11, tz));
            // Canopy
            addMesh(makeSphere(18, 10, 8, 0x2d5a1a, tx, 32, tz));
        }
    }

    function buildDeerHerd() {
        // 12 deer scattered in the park — box bodies, cylinder legs
        var deerPositions = [
            [X_OFFSET - 350, 130],
            [X_OFFSET - 320, 160],
            [X_OFFSET - 290, 120],
            [X_OFFSET - 360, 90],
            [X_OFFSET + 300, 200],
            [X_OFFSET + 330, 230],
            [X_OFFSET + 260, 190],
            [X_OFFSET - 150, 400],
            [X_OFFSET - 120, 430],
            [X_OFFSET + 100, 380],
            [X_OFFSET + 200, 300],
            [X_OFFSET - 50,  350]
        ];
        for (var d = 0; d < deerPositions.length; d++) {
            var dx = deerPositions[d][0];
            var dz = deerPositions[d][1];
            // Body
            addMesh(makeBox(10, 5, 6, 0xa07840, dx, 6, dz));
            // Head
            addMesh(makeBox(4, 4, 4, 0x9a7038, dx + 6, 8, dz));
            // Legs — 4 cylinders
            addMesh(makeCylinder(0.8, 0.8, 5, 4, 0x8a6030, dx - 3, 2, dz - 2));
            addMesh(makeCylinder(0.8, 0.8, 5, 4, 0x8a6030, dx + 3, 2, dz - 2));
            addMesh(makeCylinder(0.8, 0.8, 5, 4, 0x8a6030, dx - 3, 2, dz + 2));
            addMesh(makeCylinder(0.8, 0.8, 5, 4, 0x8a6030, dx + 3, 2, dz + 2));
        }
    }

    function buildHaHaWall() {
        // Ha-ha boundary wall around the deer park — sunken wall / ditch suggestion
        // North side
        addMesh(makeBox(1200, 4, 4, 0x8a7a60, X_OFFSET, 1, -550));
        // South side
        addMesh(makeBox(1200, 4, 4, 0x8a7a60, X_OFFSET, 1,  620));
        // East side
        addMesh(makeBox(4, 4, 1170, 0x8a7a60, X_OFFSET + 600, 1, 35));
        // West side
        addMesh(makeBox(4, 4, 1170, 0x8a7a60, X_OFFSET - 600, 1, 35));
    }

    function buildSevenoaksTown() {
        var tx = X_OFFSET;
        var tz = 700;

        // Georgian High Street — row of terraced buildings
        for (var i = 0; i < 10; i++) {
            var hx = tx - 220 + i * 48;
            var hh = 16 + (i % 3) * 4;
            addMesh(makeBox(44, hh, 22, 0xc8a87a, hx, hh / 2, tz));
            // Window rows
            addMesh(makeBox(6, 5, 1, 0xd4c8aa, hx - 10, hh * 0.6, tz - 12));
            addMesh(makeBox(6, 5, 1, 0xd4c8aa, hx + 10, hh * 0.6, tz - 12));
        }

        // East side of High Street
        for (var j = 0; j < 8; j++) {
            var ehx = tx - 180 + j * 50;
            var ehh = 14 + (j % 2) * 6;
            addMesh(makeBox(44, ehh, 22, 0xb89870, ehx, ehh / 2, tz + 40));
        }

        // Market square — open paved area
        addMesh(makeBox(120, 0.5, 80, 0xa09080, tx + 80, 0.5, tz + 20));

        // Market cross / bandstand — central cylinder
        addMesh(makeCylinder(5, 5, 10, 8, 0xd0c0a0, tx + 80, 5, tz + 20));
        addMesh(makeCone(8, 8, 8, 0x8a7050, tx + 80, 14, tz + 20));

        // St Nicholas Church tower
        addMesh(makeBox(20, 55, 20, 0x8a7a6a, tx + 260, 27, tz + 10));
        addMesh(makeBox(24, 6,  24, 0x7a6a5a, tx + 260, 58, tz + 10));
        // Church nave
        addMesh(makeBox(50, 22, 26, 0x9a8a7a, tx + 235, 11, tz + 10));
        // Church roof
        addMesh(makeCone(6, 20, 4, 0x6a5a4a, tx + 260, 72, tz + 10));
        // Church windows
        addMesh(makeBox(4, 10, 1, 0xc8c0b0, tx + 260, 30, tz + 21));
        addMesh(makeBox(4, 10, 1, 0xc8c0b0, tx + 260, 30, tz - 1));
        addMesh(makeBox(4, 10, 1, 0xc8c0b0, tx + 260, 50, tz + 11));
    }

    function buildVineCricketGround() {
        var cx = X_OFFSET - 250;
        var cz = 780;

        // Outfield — slightly lighter green oval suggestion (box approximation)
        addMesh(makeBox(280, 0.5, 220, 0x4a8a2a, cx, 0.5, cz));

        // Cricket square in the centre
        addMesh(makeBox(40, 0.6, 28, 0x8aaa5a, cx, 0.6, cz));

        // Boundary rope suggestion — thin box ring (4 sides)
        // North boundary
        addMesh(makeBox(284, 1, 2, 0xffffff, cx, 1, cz - 110));
        // South boundary
        addMesh(makeBox(284, 1, 2, 0xffffff, cx, 1, cz + 110));
        // East boundary
        addMesh(makeBox(2, 1, 220, 0xffffff, cx + 142, 1, cz));
        // West boundary
        addMesh(makeBox(2, 1, 220, 0xffffff, cx - 142, 1, cz));

        // White pavilion — long low building
        addMesh(makeBox(80, 12, 18, 0xf8f8f0, cx - 110, 6, cz - 120));
        // Pavilion roof
        addMesh(makeBox(84, 4, 22, 0xe0d8c8, cx - 110, 14, cz - 120));
        // Pavilion veranda columns — 5 cylinders
        for (var p = 0; p < 5; p++) {
            addMesh(makeCylinder(1, 1, 10, 6, 0xffffff, cx - 148 + p * 18, 5, cz - 130));
        }
        // Scoreboard — simple box
        addMesh(makeBox(22, 18, 4, 0x5a4030, cx + 120, 9, cz - 110));
        addMesh(makeBox(20, 14, 2, 0xf0f0e0, cx + 120, 10, cz - 112));
    }

    function build() {
        buildGround();
        buildNorthDowns();
        buildKnoleHouse();
        buildKnoleParkTrees();
        buildDeerHerd();
        buildHaHaWall();
        buildSevenoaksTown();
        buildVineCricketGround();
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
