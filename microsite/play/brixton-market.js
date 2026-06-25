window.BrixtonMarket = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11400;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeWireBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var line = new THREE.LineSegments(edges, mat);
        line.position.set(x, y, z);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function buildGroundPlate() {
        makeBox(600, 1, 600, 0x555555, X_OFFSET, -0.5, 0);
    }

    function buildMarketArcades() {
        var bx = X_OFFSET - 80;
        var bz = -60;

        // Granville Arcade - main structure
        makeBox(120, 14, 30, 0xc8b8a2, bx, 7, bz);

        // Arcade roof - corrugated style panels
        var roofColors = [0x8a8a8a, 0x999999, 0x888888, 0x9a9a9a, 0x878787];
        for (var ri = 0; ri < 5; ri++) {
            makeBox(24, 1.5, 32, roofColors[ri], bx - 48 + ri * 24, 14.5, bz);
        }

        // Iron column supports along arcade - left side
        var ironColor = 0x4a4a4a;
        for (var ci = 0; ci < 7; ci++) {
            makeCylinder(0.8, 0.8, 14, 8, ironColor, bx - 54 + ci * 18, 7, bz - 14);
            makeCylinder(0.8, 0.8, 14, 8, ironColor, bx - 54 + ci * 18, 7, bz + 14);
        }

        // Colorful stall canopies inside arcade
        var canopyColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0xe67e22, 0x1abc9c];
        for (var si = 0; si < 7; si++) {
            makeBox(16, 3, 10, canopyColors[si % 7], bx - 48 + si * 16 + 8, 10, bz - 6);
            makeBox(16, 3, 10, canopyColors[(si + 3) % 7], bx - 48 + si * 16 + 8, 10, bz + 6);
        }

        // Stall fronts / display tables
        for (var di = 0; di < 7; di++) {
            makeBox(14, 2, 4, 0xd4a96a, bx - 48 + di * 16 + 8, 2, bz - 8);
            makeBox(14, 2, 4, 0xd4a96a, bx - 48 + di * 16 + 8, 2, bz + 8);
        }

        // Market Row arcade - parallel alley
        var mrz = bz + 50;
        makeBox(120, 12, 26, 0xbfaa90, bx, 6, mrz);

        // Market Row roof
        for (var mri = 0; mri < 5; mri++) {
            makeBox(24, 1.2, 28, 0x7a7a7a, bx - 48 + mri * 24, 12.8, mrz);
        }

        // Market Row columns
        for (var mci = 0; mci < 6; mci++) {
            makeCylinder(0.7, 0.7, 12, 8, ironColor, bx - 50 + mci * 20, 6, mrz - 12);
            makeCylinder(0.7, 0.7, 12, 8, ironColor, bx - 50 + mci * 20, 6, mrz + 12);
        }

        // Market Row stall canopies
        for (var msi = 0; msi < 6; msi++) {
            makeBox(18, 2.5, 8, canopyColors[(msi + 2) % 7], bx - 45 + msi * 18, 9, mrz);
        }

        // Alley passage between arcades
        makeBox(4, 14, 20, 0xb0a090, bx - 60, 7, bz + 25);
        makeBox(4, 14, 20, 0xb0a090, bx + 60, 7, bz + 25);

        // Arcade entrance arches
        makeBox(30, 16, 2, 0xc8b8a2, bx - 60, 8, bz);
        makeBox(6, 16, 2, 0x998877, bx - 60, 8, bz);
        makeBox(30, 16, 2, 0xc8b8a2, bx + 60, 8, bz);
        makeBox(6, 16, 2, 0x998877, bx + 60, 8, bz);

        // Produce boxes on stalls
        var produceColors = [0xff6600, 0xffcc00, 0xff3333, 0x66cc00, 0xff9900];
        for (var pi = 0; pi < 14; pi++) {
            makeSphere(1.2, 6, 6, produceColors[pi % 5], bx - 46 + pi * 9, 3.8, bz - 8);
            makeSphere(1.2, 6, 6, produceColors[(pi + 2) % 5], bx - 46 + pi * 9, 3.8, bz + 8);
        }
    }

    function buildElectricAvenue() {
        var ax = X_OFFSET + 60;
        var az = 40;

        // Electric Avenue road - gentle curve simulated with offset segments
        makeBox(12, 0.5, 200, 0x3a3a3a, ax, 0.25, az);
        makeBox(12, 0.5, 80, 0x3a3a3a, ax + 6, 0.25, az + 140);
        makeBox(12, 0.5, 40, 0x3a3a3a, ax + 12, 0.25, az + 210);

        // Victorian buildings left side of avenue
        var victorianColors = [0xc87941, 0xb87333, 0xd4956a, 0xc08060, 0xb06840];
        for (var vi = 0; vi < 8; vi++) {
            var vbh = 18 + (vi % 3) * 4;
            makeBox(20, vbh, 18, victorianColors[vi % 5], ax - 22, vbh / 2, az - 80 + vi * 28);
            // Victorian building windows
            makeBox(3, 4, 0.5, 0x87ceeb, ax - 22 - 5, vbh * 0.6, az - 80 + vi * 28 - 9.1);
            makeBox(3, 4, 0.5, 0x87ceeb, ax - 22 + 5, vbh * 0.6, az - 80 + vi * 28 - 9.1);
            // Decorative cornices
            makeBox(22, 1.5, 2, 0xddddcc, ax - 22, vbh + 0.5, az - 80 + vi * 28 - 8);
        }

        // Victorian buildings right side
        for (var vri = 0; vri < 8; vri++) {
            var vrbh = 16 + (vri % 4) * 3;
            makeBox(20, vrbh, 18, victorianColors[(vri + 2) % 5], ax + 22, vrbh / 2, az - 80 + vri * 28);
            makeBox(3, 4, 0.5, 0x87ceeb, ax + 22 - 5, vrbh * 0.6, az - 80 + vri * 28 - 9.1);
            makeBox(3, 4, 0.5, 0x87ceeb, ax + 22 + 5, vrbh * 0.6, az - 80 + vri * 28 - 9.1);
            makeBox(22, 1.5, 2, 0xddddcc, ax + 22, vrbh + 0.5, az - 80 + vri * 28 - 8);
        }

        // Market stalls along avenue
        var stallColors = [0xe74c3c, 0xf39c12, 0x3498db, 0x2ecc71, 0xe67e22, 0x9b59b6];
        for (var sti = 0; sti < 10; sti++) {
            // Left side stalls
            makeBox(8, 0.3, 10, stallColors[sti % 6], ax - 13, 2.8, az - 100 + sti * 22);
            makeBox(8, 3, 0.3, stallColors[sti % 6], ax - 13, 1.5, az - 95 + sti * 22);
            makeCylinder(0.3, 0.3, 3, 6, 0x666666, ax - 17, 1.5, az - 100 + sti * 22);
            makeCylinder(0.3, 0.3, 3, 6, 0x666666, ax - 9, 1.5, az - 100 + sti * 22);
            // Right side stalls
            makeBox(8, 0.3, 10, stallColors[(sti + 3) % 6], ax + 13, 2.8, az - 100 + sti * 22);
            makeBox(8, 3, 0.3, stallColors[(sti + 3) % 6], ax + 13, 1.5, az - 95 + sti * 22);
            makeCylinder(0.3, 0.3, 3, 6, 0x666666, ax + 9, 1.5, az - 100 + sti * 22);
            makeCylinder(0.3, 0.3, 3, 6, 0x666666, ax + 17, 1.5, az - 100 + sti * 22);
        }

        // Fruit and veg displays
        var fruitColors = [0xff4500, 0xffd700, 0x32cd32, 0xff6347, 0xffa500, 0xdc143c];
        for (var fi = 0; fi < 10; fi++) {
            for (var fj = 0; fj < 3; fj++) {
                makeSphere(0.9, 5, 5, fruitColors[(fi + fj) % 6], ax - 13 + fj * 0.8 - 0.8, 3.8, az - 100 + fi * 22 + 2);
                makeSphere(0.9, 5, 5, fruitColors[(fi + fj + 2) % 6], ax + 13 + fj * 0.8 - 0.8, 3.8, az - 100 + fi * 22 + 2);
            }
        }

        // Early electric street lamps (distinctive feature)
        for (var li = 0; li < 8; li++) {
            makeCylinder(0.25, 0.3, 12, 8, 0x888866, ax - 8, 6, az - 90 + li * 28);
            makeCylinder(0.25, 0.3, 12, 8, 0x888866, ax + 8, 6, az - 90 + li * 28);
            makeSphere(0.8, 6, 6, 0xffffcc, ax - 8, 12.5, az - 90 + li * 28);
            makeSphere(0.8, 6, 6, 0xffffcc, ax + 8, 12.5, az - 90 + li * 28);
        }
    }

    function buildWindrushSquare() {
        var wx = X_OFFSET - 20;
        var wz = 160;

        // Square paving
        makeBox(100, 0.4, 80, 0x9a9a9a, wx, 0.2, wz);

        // Windrush monument - central column
        makeCylinder(2.5, 3, 1.5, 8, 0x888888, wx, 0.75, wz);
        makeCylinder(1.8, 2.5, 12, 8, 0x777777, wx, 7.5, wz);
        makeCylinder(3.5, 3.5, 1, 6, 0x999999, wx, 14, wz);
        makeSphere(2.5, 8, 8, 0xaaaaaa, wx, 16, wz);

        // Decorative elements on monument
        makeCylinder(0.4, 0.4, 4, 6, 0xddaa44, wx - 2, 5, wz);
        makeCylinder(0.4, 0.4, 4, 6, 0xddaa44, wx + 2, 5, wz);
        makeCylinder(0.4, 0.4, 4, 6, 0xddaa44, wx, 5, wz - 2);
        makeCylinder(0.4, 0.4, 4, 6, 0xddaa44, wx, 5, wz + 2);

        // Benches around square
        for (var bi = 0; bi < 6; bi++) {
            var bangle = (bi / 6) * Math.PI * 2;
            var bsx = wx + Math.cos(bangle) * 20;
            var bsz = wz + Math.sin(bangle) * 20;
            makeBox(6, 0.5, 2, 0x8b6914, bsx, 1, bsz);
            makeBox(0.4, 1.5, 2, 0x6b4f10, bsx - 2.8, 0.75, bsz);
            makeBox(0.4, 1.5, 2, 0x6b4f10, bsx + 2.8, 0.75, bsz);
        }

        // Trees in square
        for (var ti = 0; ti < 8; ti++) {
            var tangle = (ti / 8) * Math.PI * 2;
            var tx = wx + Math.cos(tangle) * 35;
            var tz = wz + Math.sin(tangle) * 30;
            makeCylinder(0.6, 0.8, 8, 6, 0x5c3d11, tx, 4, tz);
            makeSphere(4, 6, 6, 0x3a7a3a, tx, 11, tz);
        }

        // Windrush Square Town Hall - neoclassical building
        var thx = wx - 50;
        var thz = wz;
        makeBox(60, 25, 20, 0xe8e0d0, thx, 12.5, thz);

        // Town Hall pediment / triangular gable
        makeBox(62, 3, 22, 0xd8d0c0, thx, 26, thz);
        makeCone(0, 0, 0, 0xd8d0c0, thx, 0, thz); // placeholder - use box for triangle
        makeBox(60, 8, 4, 0xc8c0b0, thx, 30, thz);

        // Neoclassical columns on Town Hall facade
        for (var tci = 0; tci < 7; tci++) {
            makeCylinder(1.2, 1.4, 18, 8, 0xf0e8d8, thx - 24 + tci * 8, 9, thz - 10.5);
            // Column capital
            makeBox(3, 1.5, 3, 0xf0e8d8, thx - 24 + tci * 8, 18.5, thz - 10.5);
        }

        // Town Hall steps
        makeBox(50, 1, 6, 0xddd8cc, thx, 0.5, thz - 13);
        makeBox(46, 1, 5, 0xddd8cc, thx, 1.5, thz - 11.5);
        makeBox(42, 1, 4, 0xddd8cc, thx, 2.5, thz - 10.5);

        // Town Hall windows
        for (var twi = 0; twi < 5; twi++) {
            makeBox(4, 7, 0.5, 0x99bbdd, thx - 20 + twi * 10, 14, thz - 10.2);
        }

        // Town Hall clock tower
        makeBox(10, 35, 10, 0xe0d8c8, thx, 17.5, thz + 5);
        makeCylinder(1, 1, 3, 8, 0xdddddd, thx, 36.5, thz + 5);
        makeSphere(3, 8, 8, 0xcc9900, thx, 38, thz + 5);
    }

    function buildBrixtonAcademy() {
        var bax = X_OFFSET + 120;
        var baz = -100;

        // Main Academy building body
        makeBox(80, 30, 40, 0x4a3520, bax, 15, baz);

        // Art Deco facade - ornate front
        makeBox(82, 32, 2, 0x6b5030, bax, 16, baz - 21);

        // Art Deco stepped parapet
        makeBox(80, 6, 4, 0x7a6040, bax, 34, baz - 20);
        makeBox(60, 5, 5, 0x8a7050, bax, 38, baz - 19.5);
        makeBox(40, 4, 5, 0x9a8060, bax, 42, baz - 19);
        makeBox(20, 3, 5, 0xaa9070, bax, 45.5, baz - 18.5);

        // Ornate facade details - vertical pilasters
        for (var pi2 = 0; pi2 < 6; pi2++) {
            makeBox(3, 30, 3, 0x5a4028, bax - 35 + pi2 * 14, 16, baz - 20);
        }

        // Art Deco horizontal bands
        makeBox(82, 1.5, 3, 0xc8a060, bax, 8, baz - 20);
        makeBox(82, 1.5, 3, 0xc8a060, bax, 16, baz - 20);
        makeBox(82, 1.5, 3, 0xc8a060, bax, 24, baz - 20);

        // Neon sign suggestion - BRIXTON ACADEMY lettering blocks
        makeBox(50, 4, 1, 0xcc0000, bax, 27, baz - 22);
        makeBox(48, 2, 1, 0xff4444, bax, 27, baz - 22.1);
        // Neon glow panels
        makeBox(10, 3, 0.5, 0xff6600, bax - 15, 27, baz - 22.5);
        makeBox(10, 3, 0.5, 0xff6600, bax, 27, baz - 22.5);
        makeBox(10, 3, 0.5, 0xff6600, bax + 15, 27, baz - 22.5);

        // Tiled entrance foyer
        makeBox(30, 12, 8, 0x8a7a6a, bax, 6, baz - 25);
        makeBox(32, 1, 10, 0xb0a090, bax, 0.5, baz - 25);

        // Entrance doors
        makeBox(8, 10, 0.5, 0x3a2a1a, bax - 6, 5, baz - 29.2);
        makeBox(8, 10, 0.5, 0x3a2a1a, bax + 6, 5, baz - 29.2);

        // Entrance pillars
        makeCylinder(1.5, 1.5, 12, 8, 0x9a8a7a, bax - 15, 6, baz - 25);
        makeCylinder(1.5, 1.5, 12, 8, 0x9a8a7a, bax + 15, 6, baz - 25);

        // Decorative entrance tiles (colored panels)
        var tileColors = [0x8b0000, 0xb8860b, 0x006400, 0x00008b];
        for (var tli = 0; tli < 8; tli++) {
            makeBox(4, 4, 0.3, tileColors[tli % 4], bax - 28 + tli * 8, 3, baz - 20.2);
        }

        // Crowd outside - people suggestion using spheres
        var crowdColors = [0x1a1a2e, 0x16213e, 0x0f3460, 0x533483, 0xe94560, 0x2c3e50];
        for (var ci2 = 0; ci2 < 20; ci2++) {
            var cx = bax - 35 + (ci2 % 10) * 7;
            var cz2 = baz - 32 - Math.floor(ci2 / 10) * 5;
            makeCylinder(1, 1, 5, 6, crowdColors[ci2 % 6], cx, 2.5, cz2);
            makeSphere(1.2, 6, 6, 0xd4a574, cx, 5.5, cz2);
        }

        // Queue barriers
        for (var qi = 0; qi < 5; qi++) {
            makeCylinder(0.2, 0.2, 3, 6, 0x888888, bax - 30 + qi * 14, 1.5, baz - 38);
            makeBox(14, 0.2, 0.2, 0xcc0000, bax - 23 + qi * 14, 2.5, baz - 38);
        }

        // Side walls of Academy with graffiti suggestion
        makeBox(2, 30, 40, 0x4a3520, bax - 42, 15, baz);
        makeBox(2, 30, 40, 0x4a3520, bax + 42, 15, baz);

        // Colorful graffiti panels on side wall
        var grafColors = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff];
        for (var gi = 0; gi < 6; gi++) {
            makeBox(0.3, 6, 8, grafColors[gi], bax - 43.2, 8 + gi * 3, baz - 10 + gi * 6);
        }
    }

    function buildBowieMural() {
        var mux = X_OFFSET + 30;
        var muz = -180;

        // Wall base building
        makeBox(40, 22, 6, 0x8a7a6a, mux, 11, muz);

        // Mural panels - large colorful sections (Ziggy Stardust)
        // Lightning bolt - iconic image
        makeBox(38, 20, 0.5, 0x222222, mux, 11, muz - 3.3);

        // Colored panels forming the mural
        makeBox(12, 20, 0.3, 0xff6b35, mux - 13, 11, muz - 3.5);
        makeBox(8, 20, 0.3, 0xf7c59f, mux - 2, 11, muz - 3.5);
        makeBox(10, 20, 0.3, 0x1e3a5f, mux + 8, 11, muz - 3.5);
        makeBox(10, 20, 0.3, 0x4a90d9, mux + 16, 11, muz - 3.5);

        // Lightning bolt suggestion (diagonal panels)
        makeBox(6, 3, 0.2, 0xffdd00, mux - 4, 16, muz - 3.6);
        makeBox(8, 3, 0.2, 0xffdd00, mux + 1, 13, muz - 3.6);
        makeBox(6, 3, 0.2, 0xffdd00, mux - 2, 10, muz - 3.6);

        // Red circle - iconic face element
        makeSphere(4, 8, 8, 0xff2222, mux + 5, 15, muz - 3.5);
        makeSphere(2.5, 8, 8, 0xf7c59f, mux + 5, 15, muz - 3.3);

        // Mural frame / border
        makeBox(42, 1, 7, 0x666666, mux, 21.5, muz);
        makeBox(42, 1, 7, 0x666666, mux, 0.5, muz);
        makeBox(1, 22, 7, 0x666666, mux - 21, 11, muz);
        makeBox(1, 22, 7, 0x666666, mux + 21, 11, muz);

        // Building above mural
        makeBox(40, 10, 6, 0x8a7a6a, mux, 27, muz);
        makeBox(5, 8, 1, 0x6a5a4a, mux - 12, 26, muz - 3.5);
        makeBox(5, 8, 1, 0x6a5a4a, mux + 12, 26, muz - 3.5);

        // Makeshift memorial flowers at base
        var flowerColors = [0xff69b4, 0xff0000, 0xffffff, 0xffff00, 0xff4500, 0xda70d6];
        for (var fli = 0; fli < 18; fli++) {
            var flx = mux - 17 + fli * 2;
            var flz = muz - 4.5;
            makeSphere(0.7, 5, 5, flowerColors[fli % 6], flx, 0.8, flz);
            makeCylinder(0.15, 0.15, 1.5, 4, 0x228b22, flx, 0.4, flz);
        }

        // Candles and small offerings
        for (var cli = 0; cli < 8; cli++) {
            makeCylinder(0.3, 0.3, 1, 6, 0xffffee, mux - 14 + cli * 4, 0.5, muz - 3.8);
            makeSphere(0.35, 4, 4, 0xffd700, mux - 14 + cli * 4, 1.1, muz - 3.8);
        }

        // Stuffed animals / tributes suggestion
        makeSphere(1.5, 6, 6, 0xcc6622, mux - 8, 1.2, muz - 3.5);
        makeSphere(1.5, 6, 6, 0x8844aa, mux + 2, 1.2, muz - 3.5);
        makeSphere(1.5, 6, 6, 0x228844, mux + 10, 1.2, muz - 3.5);

        // Signage nearby
        makeBox(8, 3, 0.5, 0x2244aa, mux + 22, 10, muz - 3.5);

        // Adjacent shopfront
        makeBox(20, 16, 6, 0x7a6a5a, mux - 32, 8, muz);
        makeBox(20, 2, 7, 0x5a4a3a, mux - 32, 16.5, muz);
        makeBox(8, 8, 0.5, 0x88aacc, mux - 32, 6, muz - 3.2);
    }

    function buildStreetFurniture() {
        // Rubbish bins
        var binPositions = [
            [X_OFFSET - 40, 0, 20],
            [X_OFFSET + 40, 0, 20],
            [X_OFFSET - 80, 0, -30],
            [X_OFFSET + 100, 0, -80],
            [X_OFFSET + 60, 0, 100]
        ];
        for (var bni = 0; bni < binPositions.length; bni++) {
            makeCylinder(1.2, 1, 3, 8, 0x444444, binPositions[bni][0], 1.5, binPositions[bni][2]);
            makeCylinder(1.3, 1.3, 0.3, 8, 0x333333, binPositions[bni][0], 3.15, binPositions[bni][2]);
        }

        // Street signs
        makeCylinder(0.2, 0.2, 5, 6, 0x888888, X_OFFSET, 2.5, -5);
        makeBox(8, 1.5, 0.3, 0x003399, X_OFFSET, 5.5, -5);
        makeCylinder(0.2, 0.2, 5, 6, 0x888888, X_OFFSET + 50, 2.5, 50);
        makeBox(8, 1.5, 0.3, 0x003399, X_OFFSET + 50, 5.5, 50);

        // Electricity pylons / cables suggestion
        makeBox(1, 8, 1, 0x777777, X_OFFSET - 100, 4, -150);
        makeBox(1, 8, 1, 0x777777, X_OFFSET + 100, 4, -150);
        makeBox(10, 0.2, 0.2, 0x333333, X_OFFSET, 8, -150);

        // Pavement kerbs
        makeBox(200, 0.4, 1.5, 0xaaaaaa, X_OFFSET, 0.2, -10);
        makeBox(200, 0.4, 1.5, 0xaaaaaa, X_OFFSET, 0.2, 10);

        // Road markings
        for (var rmi = 0; rmi < 10; rmi++) {
            makeBox(1, 0.05, 8, 0xffffff, X_OFFSET, 0.05, -120 + rmi * 28);
        }

        // Pigeons
        var pigeonPositions = [
            [X_OFFSET - 20, 1, 155],
            [X_OFFSET + 10, 1, 158],
            [X_OFFSET - 5, 1, 162],
            [X_OFFSET + 25, 1, 163]
        ];
        for (var pgi = 0; pgi < pigeonPositions.length; pgi++) {
            makeSphere(0.5, 5, 5, 0x888899, pigeonPositions[pgi][0], pigeonPositions[pgi][1], pigeonPositions[pgi][2]);
            makeCone(0.2, 0.6, 4, 0x888899, pigeonPositions[pgi][0] + 0.6, pigeonPositions[pgi][1], pigeonPositions[pgi][2]);
        }
    }

    function buildSurroundingStreets() {
        // Main connecting road
        makeBox(18, 0.5, 400, 0x3a3a3a, X_OFFSET, 0.25, 0);

        // Pavements
        makeBox(8, 0.3, 400, 0x999999, X_OFFSET - 13, 0.15, 0);
        makeBox(8, 0.3, 400, 0x999999, X_OFFSET + 13, 0.15, 0);

        // Background buildings to fill the neighbourhood
        var bgColors = [0xb87333, 0xc87941, 0xd4956a, 0xa06030, 0xb85020, 0x8a6040];
        for (var bgi = 0; bgi < 12; bgi++) {
            var bgh = 10 + (bgi % 4) * 5;
            makeBox(16, bgh, 14, bgColors[bgi % 6], X_OFFSET - 150 + bgi * 14, bgh / 2, -200);
            makeBox(16, bgh, 14, bgColors[(bgi + 3) % 6], X_OFFSET - 150 + bgi * 14, bgh / 2, 250);
        }

        // Side street
        makeBox(300, 0.5, 12, 0x3a3a3a, X_OFFSET - 150, 0.25, 130);
        makeBox(300, 0.3, 6, 0x999999, X_OFFSET - 150, 0.15, 123);
        makeBox(300, 0.3, 6, 0x999999, X_OFFSET - 150, 0.15, 137);
    }

    function build() {
        buildGroundPlate();
        buildMarketArcades();
        buildElectricAvenue();
        buildWindrushSquare();
        buildBrixtonAcademy();
        buildBowieMural();
        buildStreetFurniture();
        buildSurroundingStreets();
    }

    function update(delta) {
        // Static environment — no per-frame logic needed
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
