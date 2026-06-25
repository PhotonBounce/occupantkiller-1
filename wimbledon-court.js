window.WimbledonCourt = (function() {
    'use strict';

    var OX = 5800;
    var OZ = 0;
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function box(w, h, d, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function cylinder(rt, rb, h, segs, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function sphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), (y || 0), OZ + (z || 0));
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function tree(x, y, z) {
        cylinder(0.4, 0.4, 5, 6, 0x5C3317, x, y + 2.5, z);
        sphere(3, 0x228B22, x, y + 7, z);
    }

    function buildGround() {
        // Main grass ground area
        box(300, 0.5, 200, 0x2D6A1A, 0, -0.25, 0);
        // Paths / roads
        box(120, 0.4, 6, 0x666666, 0, 0.2, 40);
        box(6, 0.4, 80, 0x666666, -55, 0.2, 0);
        box(6, 0.4, 80, 0x666666, 55, 0.2, 0);
    }

    function buildCentreCourt() {
        // Outer octagon wall — 8 BoxGeometry sections each 8×18×2
        var wallAngle = Math.PI / 4;
        var wallRadius = 28;
        for (var wi = 0; wi < 8; wi++) {
            var wangle = wi * wallAngle;
            var wx = Math.cos(wangle) * wallRadius;
            var wz = Math.sin(wangle) * wallRadius;
            box(8, 18, 2, 0xC8C8C8, wx, 9, wz, 0, wangle, 0);
        }

        // Court surface — green low box 32×0.5×24
        box(32, 0.5, 24, 0x228B22, 0, 0.25, 0);

        // Net — thin box 30×1.2×0.2
        box(30, 1.2, 0.2, 0xEEEEEE, 0, 0.85, 0);

        // Bleacher step banks — 4 levels inside the bowl
        // Level 1 — innermost low step
        box(40, 2, 6, 0x334455, 0, 1, 18);
        box(40, 2, 6, 0x334455, 0, 1, -18);
        box(6, 2, 28, 0x334455, 22, 1, 0);
        box(6, 2, 28, 0x334455, -22, 1, 0);
        // Level 2
        box(42, 2, 6, 0x3A4A5A, 0, 3, 21);
        box(42, 2, 6, 0x3A4A5A, 0, 3, -21);
        box(6, 2, 32, 0x3A4A5A, 25, 3, 0);
        box(6, 2, 32, 0x3A4A5A, -25, 3, 0);
        // Level 3
        box(44, 2, 6, 0x405060, 0, 5, 24);
        box(44, 2, 6, 0x405060, 0, 5, -24);
        box(6, 2, 36, 0x405060, 28, 5, 0);
        box(6, 2, 36, 0x405060, -28, 5, 0);
        // Level 4 — outermost upper step
        box(46, 2, 6, 0x45505F, 0, 7, 27);
        box(46, 2, 6, 0x45505F, 0, 7, -27);
        box(6, 2, 40, 0x45505F, 31, 7, 0);
        box(6, 2, 40, 0x45505F, -31, 7, 0);

        // Retractable roof — 3 large flat panels approximating AON roof
        box(32, 1, 10, 0x888888, 0, 19, -15);
        box(32, 1, 10, 0x888888, 0, 19, 15);
        box(32, 1, 8, 0x888888, 0, 20, 0);

        // Roof support pillars
        cylinder(1, 1, 20, 8, 0x999999, -30, 10, -28);
        cylinder(1, 1, 20, 8, 0x999999, 30, 10, -28);
        cylinder(1, 1, 20, 8, 0x999999, -30, 10, 28);
        cylinder(1, 1, 20, 8, 0x999999, 30, 10, 28);
    }

    function buildCourtOne() {
        // Court 1 arena — smaller, offset to east
        var cx = 80;
        var cz = -20;
        // Court surface 30×0.3×20
        box(30, 0.3, 20, 0x2D7322, cx, 0.15, cz);
        // Net
        box(28, 1, 0.2, 0xDDDDDD, cx, 0.65, cz);
        // Stands around court 1 — 6 units tall
        box(34, 6, 4, 0x334433, cx, 3, cz + 14);
        box(34, 6, 4, 0x334433, cx, 3, cz - 14);
        box(4, 6, 22, 0x334433, cx + 18, 3, cz);
        box(4, 6, 22, 0x334433, cx - 18, 3, cz);
        // Outer walls
        box(38, 8, 2, 0xAAAAAA, cx, 4, cz + 17);
        box(38, 8, 2, 0xAAAAAA, cx, 4, cz - 17);
        box(2, 8, 24, 0xAAAAAA, cx + 21, 4, cz);
        box(2, 8, 24, 0xAAAAAA, cx - 21, 4, cz);
    }

    function buildOuterCourts() {
        // 18 outer grass courts — 6 rows x 3 courts
        // Each court 20×0.3×12 surrounded by low white fences
        var startX = -80;
        var startZ = -80;
        var courtW = 22;
        var courtD = 16;

        for (var row = 0; row < 6; row++) {
            for (var col = 0; col < 3; col++) {
                var cx = startX + col * courtW;
                var cz = startZ + row * courtD;
                // Grass surface
                box(20, 0.3, 12, 0x2D6A1A, cx, 0.15, cz);
                // Net
                box(18, 0.8, 0.15, 0xEEEEEE, cx, 0.55, cz);
                // Low white fence surrounds
                box(22, 1, 0.2, 0xFFFFFF, cx, 0.5, cz + 6.2);
                box(22, 1, 0.2, 0xFFFFFF, cx, 0.5, cz - 6.2);
                box(0.2, 1, 12, 0xFFFFFF, cx + 11, 0.5, cz);
                box(0.2, 1, 12, 0xFFFFFF, cx - 11, 0.5, cz);
            }
        }
    }

    function buildClubhouse() {
        // Main clubhouse — 25×8×15, classic Wimbledon white
        var clx = 50;
        var clz = 30;
        box(25, 8, 15, 0xF5F5F5, clx, 4, clz);
        // Dark green trim stripe below roof
        box(25, 0.8, 15, 0x1A4A1A, clx, 8.4, clz);
        // Entrance portico columns
        cylinder(0.5, 0.5, 6, 8, 0xE0E0E0, clx - 4, 3, clz - 7.6);
        cylinder(0.5, 0.5, 6, 8, 0xE0E0E0, clx, 3, clz - 7.6);
        cylinder(0.5, 0.5, 6, 8, 0xE0E0E0, clx + 4, 3, clz - 7.6);
        // Portico roof
        box(12, 0.5, 2, 0xF0F0F0, clx, 6.25, clz - 8.6);
        // Windows — dark green frames
        box(2.5, 2, 0.3, 0x2D5A2D, clx - 8, 5, clz - 7.7);
        box(2.5, 2, 0.3, 0x2D5A2D, clx - 4, 5, clz - 7.7);
        box(2.5, 2, 0.3, 0x2D5A2D, clx + 4, 5, clz - 7.7);
        box(2.5, 2, 0.3, 0x2D5A2D, clx + 8, 5, clz - 7.7);
        // Roof ridge
        box(25, 1, 2, 0xD0D0D0, clx, 8.5, clz);
    }

    function buildMediaCentre() {
        // Modern curved media centre — 30×10×12
        var mx = 50;
        var mz = -30;
        box(30, 10, 12, 0x88AABB, mx, 5, mz);
        // Curved roof approximation with stacked boxes
        box(30, 1.2, 10, 0x9ABBD0, mx, 10.6, mz);
        box(28, 1, 9, 0xAAC5D8, mx, 11.5, mz);
        box(24, 0.8, 7, 0xBBD0E0, mx, 12.2, mz);
        // Glass facade
        box(0.4, 10, 12, 0x77AACC, mx - 15, 5, mz);
        box(0.4, 10, 12, 0x77AACC, mx + 15, 5, mz);
        // Entrance
        box(6, 3, 0.5, 0x99BBCC, mx, 1.5, mz - 6.3);
    }

    function buildVillagePub() {
        // Wimbledon village Georgian pub — 10×6×8
        var px = -60;
        var pz = 60;
        box(10, 6, 8, 0x8B4513, px, 3, pz);
        // Pub sign board
        box(4, 1.5, 0.2, 0x5C2A00, px, 6.5, pz - 4.1);
        // Roof — dark pitched approximation
        box(10, 1, 8, 0x5C3A1E, px, 6.5, pz);
        box(8, 1, 6, 0x4A2E15, px, 7.3, pz);
        // Windows
        box(2, 1.5, 0.3, 0xAADDFF, px - 3, 3.5, pz - 4.1);
        box(2, 1.5, 0.3, 0xAADDFF, px + 3, 3.5, pz - 4.1);
        // Door
        box(1.2, 2.5, 0.3, 0x3A1A00, px, 1.25, pz - 4.1);
        // Chimney
        cylinder(0.4, 0.4, 3, 6, 0x883322, px + 3, 8.5, pz);
    }

    function buildUndergroundStation() {
        // Wimbledon District Line station — brick arch entrance 8×5×6
        var ux = -50;
        var uz = 60;
        // Main structure
        box(8, 5, 6, 0x884422, ux, 2.5, uz);
        // Arch above entrance — approximated by two side pillars + top box
        box(1.5, 5, 1, 0x773311, ux - 3.5, 2.5, uz - 3.1);
        box(1.5, 5, 1, 0x773311, ux + 3.5, 2.5, uz - 3.1);
        box(7, 1.5, 1, 0x773311, ux, 5.25, uz - 3.1);
        // Red London Underground roundel — two crossing cylinders + outer ring
        cylinder(1.8, 1.8, 0.3, 12, 0xFF0000, ux, 4.5, uz - 3.4);
        cylinder(1.2, 1.2, 0.3, 12, 0x000090, ux, 4.5, uz - 3.3);
        // Roof
        box(9, 0.8, 7, 0x662200, ux, 5.4, uz);
        // Platform canopy inside
        box(12, 0.4, 4, 0x886644, ux, 4.5, uz + 5);
    }

    function buildCannizaroPark() {
        // Park boundary wall — 1 high beige stone
        var pkx = -80;
        var pkz = -40;
        box(40, 1, 0.8, 0x998866, pkx, 0.5, pkz - 20);
        box(40, 1, 0.8, 0x998866, pkx, 0.5, pkz + 20);
        box(0.8, 1, 40, 0x998866, pkx - 20, 0.5, pkz);
        box(0.8, 1, 40, 0x998866, pkx + 20, 0.5, pkz);
        // Park grass interior
        box(38, 0.3, 38, 0x2D6A1A, pkx, 0.15, pkz);

        // 8 tall park trees — sphere canopy + cylinder trunk
        tree(pkx - 12, 0, pkz - 12);
        tree(pkx + 12, 0, pkz - 12);
        tree(pkx - 12, 0, pkz + 12);
        tree(pkx + 12, 0, pkz + 12);
        tree(pkx - 6, 0, pkz - 6);
        tree(pkx + 6, 0, pkz - 6);
        tree(pkx - 6, 0, pkz + 6);
        tree(pkx + 6, 0, pkz + 6);

        // Park bench — thin long box
        box(2, 0.3, 0.5, 0x8B6914, pkx, 0.45, pkz - 16);
        box(2, 0.3, 0.5, 0x8B6914, pkx, 0.45, pkz + 16);
    }

    function buildBallBoysSheds() {
        // Small utility sheds behind Centre Court
        box(4, 3, 3, 0x334433, -35, 1.5, 0);
        box(4, 3, 3, 0x334433, 35, 1.5, 0);
        box(4, 3, 3, 0x334433, -35, 1.5, 10);
        box(4, 3, 3, 0x334433, 35, 1.5, -10);
    }

    function buildVillageHighStreet() {
        // Wimbledon village shops along the high street
        // Shop row — boxes representing terraced Georgian shopfronts
        var hsz = 75;
        for (var si = 0; si < 5; si++) {
            box(7, 5, 6, 0xD4C5A9, -70 + si * 8, 2.5, hsz);
        }
        // Road
        box(60, 0.3, 8, 0x555555, -60, 0.15, hsz - 10);
        // Pavement
        box(60, 0.25, 3, 0xAAAAAA, -60, 0.125, hsz - 7);
        box(60, 0.25, 3, 0xAAAAAA, -60, 0.125, hsz + 4);
    }

    function build() {
        buildGround();
        buildCentreCourt();
        buildCourtOne();
        buildOuterCourts();
        buildClubhouse();
        buildMediaCentre();
        buildVillagePub();
        buildUndergroundStation();
        buildCannizaroPark();
        buildBallBoysSheds();
        buildVillageHighStreet();
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
