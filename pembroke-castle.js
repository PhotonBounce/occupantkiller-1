window.PembrokeCastle = (function() {
    'use strict';

    var WX = 3400;
    var WZ = 2200;

    function createMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildKeep(scene) {
        // Massive round keep — finest in Britain, r=5, h=22
        var keep = makeCylinder(5, 5, 22, 16, 0x9A8A78, WX, 11, WZ);
        scene.add(keep);

        // Conical cap on keep
        var cap = makeCone(5.5, 6, 16, 0x7A6A5A, WX, 25, WZ);
        scene.add(cap);

        // Battlements ring on keep top
        var i;
        for (i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var bx = WX + Math.cos(angle) * 5;
            var bz = WZ + Math.sin(angle) * 5;
            var battlement = makeBox(1.2, 2, 1.2, 0x8A7A68, bx, 23, bz);
            scene.add(battlement);
        }
    }

    function buildCurtainWalls(scene) {
        // Inner ward curtain walls — four sides around keep
        var wallColor = 0x9A8A78;

        // North wall
        var nWall = makeBox(30, 8, 2, wallColor, WX, 4, WZ - 18);
        scene.add(nWall);

        // South wall
        var sWall = makeBox(30, 8, 2, wallColor, WX, 4, WZ + 18);
        scene.add(sWall);

        // East wall
        var eWall = makeBox(2, 8, 36, wallColor, WX + 15, 4, WZ);
        scene.add(eWall);

        // West wall
        var wWall = makeBox(2, 8, 36, wallColor, WX - 15, 4, WZ);
        scene.add(wWall);

        // Outer ward walls
        var owN = makeBox(60, 7, 2, wallColor, WX, 3.5, WZ - 38);
        scene.add(owN);

        var owS = makeBox(60, 7, 2, wallColor, WX, 3.5, WZ + 38);
        scene.add(owS);

        var owE = makeBox(2, 7, 76, wallColor, WX + 30, 3.5, WZ);
        scene.add(owE);

        var owW = makeBox(2, 7, 76, wallColor, WX - 30, 3.5, WZ);
        scene.add(owW);
    }

    function buildGatehouse(scene) {
        // Twin gatehouse towers flanking entrance on north outer wall
        var tColor = 0x9A8A78;

        // Left gatehouse tower
        var lt = makeCylinder(3, 3, 12, 12, tColor, WX - 5, 6, WZ - 38);
        scene.add(lt);

        // Right gatehouse tower
        var rt2 = makeCylinder(3, 3, 12, 12, tColor, WX + 5, 6, WZ - 38);
        scene.add(rt2);

        // Gate arch connecting towers
        var arch = makeBox(10, 6, 3, 0x7A6A5A, WX, 3, WZ - 38);
        scene.add(arch);

        // Tower caps
        var lcap = makeCone(3.5, 4, 12, 0x7A6A5A, WX - 5, 14, WZ - 38);
        scene.add(lcap);

        var rcap = makeCone(3.5, 4, 12, 0x7A6A5A, WX + 5, 14, WZ - 38);
        scene.add(rcap);

        // Inner ward corner towers
        var se = makeCylinder(2.5, 2.5, 10, 10, tColor, WX + 15, 5, WZ + 18);
        scene.add(se);

        var sw = makeCylinder(2.5, 2.5, 10, 10, tColor, WX - 15, 5, WZ + 18);
        scene.add(sw);

        var ne2 = makeCylinder(2.5, 2.5, 10, 10, tColor, WX + 15, 5, WZ - 18);
        scene.add(ne2);

        var nw2 = makeCylinder(2.5, 2.5, 10, 10, tColor, WX - 15, 5, WZ - 18);
        scene.add(nw2);
    }

    function buildTownWalls(scene) {
        // 800-year-old Pembroke town walls, offset east of castle
        var twColor = 0x9A8A78;
        var tx = WX + 80;
        var tz = WZ;

        // Four wall segments
        var tw1 = makeBox(40, 5, 2, twColor, tx, 2.5, tz - 20);
        scene.add(tw1);

        var tw2 = makeBox(40, 5, 2, twColor, tx, 2.5, tz + 20);
        scene.add(tw2);

        var tw3 = makeBox(2, 5, 40, twColor, tx - 20, 2.5, tz);
        scene.add(tw3);

        var tw4 = makeBox(2, 5, 40, twColor, tx + 20, 2.5, tz);
        scene.add(tw4);

        // Five cylindrical towers along town walls
        var towerPositions = [
            [tx - 20, tz - 20],
            [tx + 20, tz - 20],
            [tx + 20, tz + 20],
            [tx - 20, tz + 20],
            [tx, tz - 20]
        ];

        var j;
        for (j = 0; j < towerPositions.length; j++) {
            var tp = towerPositions[j];
            var twr = makeCylinder(2, 2, 7, 10, twColor, tp[0], 3.5, tp[1]);
            scene.add(twr);
        }
    }

    function buildMilfordHaven(scene) {
        // Oil terminal across the Haven — south of castle
        var mx = WX - 60;
        var mz = WZ + 120;
        var tankColor = 0xC0C0C0;
        var pipeColor = 0x808080;

        // Storage tanks — cylinders r=4, h=8
        var tankPositions = [
            [mx, mz],
            [mx + 12, mz],
            [mx + 24, mz],
            [mx, mz + 12],
            [mx + 12, mz + 12],
            [mx + 24, mz + 12]
        ];

        var k;
        for (k = 0; k < tankPositions.length; k++) {
            var tkp = tankPositions[k];
            var tank = makeCylinder(4, 4, 8, 16, tankColor, tkp[0], 4, tkp[1]);
            scene.add(tank);

            // Tank roof dome
            var dome = makeSphere(4, 8, 4, 0xA0A0A0, tkp[0], 8.5, tkp[1]);
            scene.add(dome);
        }

        // Pipelines connecting tanks
        var pipe1 = makeBox(36, 0.8, 0.8, pipeColor, mx + 12, 8.5, mz);
        scene.add(pipe1);

        var pipe2 = makeBox(36, 0.8, 0.8, pipeColor, mx + 12, 8.5, mz + 12);
        scene.add(pipe2);

        var pipe3 = makeBox(0.8, 0.8, 12, pipeColor, mx, 8.5, mz + 6);
        scene.add(pipe3);

        var pipe4 = makeBox(0.8, 0.8, 12, pipeColor, mx + 24, 8.5, mz + 6);
        scene.add(pipe4);

        // Jetty pier extending into haven
        var jetty = makeBox(40, 2, 6, 0x808060, mx + 8, 0, mz - 20);
        scene.add(jetty);

        // Jetty supports
        var js1 = makeBox(1.5, 4, 1.5, 0x606040, mx - 10, -2, mz - 20);
        scene.add(js1);

        var js2 = makeBox(1.5, 4, 1.5, 0x606040, mx + 8, -2, mz - 20);
        scene.add(js2);

        var js3 = makeBox(1.5, 4, 1.5, 0x606040, mx + 26, -2, mz - 20);
        scene.add(js3);

        // Refinery towers / chimneys
        var ch1 = makeCylinder(1, 1, 18, 8, 0xA0A0A0, mx - 10, 9, mz + 6);
        scene.add(ch1);

        var ch2 = makeCylinder(0.8, 0.8, 14, 8, 0xB0B0B0, mx + 30, 7, mz + 4);
        scene.add(ch2);

        // Flare stack
        var flare = makeCylinder(0.5, 0.5, 22, 6, 0x909090, mx + 36, 11, mz + 8);
        scene.add(flare);
    }

    function buildStDavidsCathedral(scene) {
        // St David's — smallest city in UK, hidden in coastal hollow
        // Located west of Pembroke
        var sx = WX - 160;
        var sz = WZ - 80;
        var stoneColor = 0x9A8A78;

        // Main nave — box 28x14x10
        var nave = makeBox(28, 14, 10, stoneColor, sx, 7, sz);
        scene.add(nave);

        // Choir/chancel extension
        var choir = makeBox(12, 12, 8, stoneColor, sx + 20, 6, sz);
        scene.add(choir);

        // Central tower
        var tower = makeBox(8, 20, 8, stoneColor, sx, 10, sz);
        scene.add(tower);

        // Tower cap
        var tcap = makeCone(5, 5, 8, 0x7A6A5A, sx, 22, sz);
        scene.add(tcap);

        // West front towers
        var wt1 = makeBox(4, 16, 4, stoneColor, sx - 16, 8, sz - 5);
        scene.add(wt1);

        var wt2 = makeBox(4, 16, 4, stoneColor, sx - 16, 8, sz + 5);
        scene.add(wt2);

        // Transepts
        var transN = makeBox(8, 10, 8, stoneColor, sx, 5, sz - 9);
        scene.add(transN);

        var transS = makeBox(8, 10, 8, stoneColor, sx, 5, sz + 9);
        scene.add(transS);

        // Cathedral close wall — hidden hollow position
        var cwall1 = makeBox(50, 4, 2, 0x8A7A68, sx, 2, sz - 20);
        scene.add(cwall1);

        var cwall2 = makeBox(50, 4, 2, 0x8A7A68, sx, 2, sz + 20);
        scene.add(cwall2);

        // Hollow terrain banks — hiding from Viking raiders
        var bank1 = makeBox(60, 6, 4, 0x5A6A4A, sx - 5, 3, sz - 22);
        scene.add(bank1);

        var bank2 = makeBox(60, 6, 4, 0x5A6A4A, sx - 5, 3, sz + 22);
        scene.add(bank2);
    }

    function buildPembrokeCoast(scene) {
        // Dramatic sea cliff boxes along the coast
        var cliffColor = 0x3A4A5A;
        var cx = WX + 40;
        var cz = WZ + 60;

        // Main cliff face
        var cliff1 = makeBox(50, 18, 8, cliffColor, cx, 9, cz);
        scene.add(cliff1);

        var cliff2 = makeBox(30, 22, 6, cliffColor, cx + 45, 11, cz + 5);
        scene.add(cliff2);

        var cliff3 = makeBox(35, 15, 8, cliffColor, cx - 45, 7, cz - 3);
        scene.add(cliff3);

        var cliff4 = makeBox(20, 25, 7, cliffColor, cx + 85, 12, cz);
        scene.add(cliff4);

        // Sea arch box — natural rock arch
        var archBase = makeBox(14, 10, 6, cliffColor, cx + 110, 5, cz + 8);
        scene.add(archBase);

        var archTop = makeBox(14, 3, 6, cliffColor, cx + 110, 12, cz + 8);
        scene.add(archTop);

        var archLeft = makeBox(3, 10, 6, cliffColor, cx + 103, 5, cz + 8);
        scene.add(archLeft);

        var archRight = makeBox(3, 10, 6, cliffColor, cx + 117, 5, cz + 8);
        scene.add(archRight);

        // Beach caves
        var cave1 = makeBox(8, 6, 4, 0x2A3A4A, cx + 20, 3, cz + 15);
        scene.add(cave1);

        var cave2 = makeBox(6, 5, 4, 0x2A3A4A, cx - 15, 2.5, cz + 12);
        scene.add(cave2);

        // Rock stacks in sea
        var stack1 = makeCylinder(2, 3, 12, 6, cliffColor, cx + 130, 6, cz + 20);
        scene.add(stack1);

        var stack2 = makeCylinder(1.5, 2.5, 8, 6, cliffColor, cx + 140, 4, cz + 30);
        scene.add(stack2);

        // Beach sand strip
        var beach = makeBox(80, 1, 12, 0xD4C090, cx + 20, 0, cz + 20);
        scene.add(beach);
    }

    function buildTenby(scene) {
        // Tenby — colourful harbour town, row of 8 pastel houses 6x6x5
        // Located northeast of Pembroke
        var tx = WX + 100;
        var tz = WZ - 80;

        var houseColors = [
            0xFF9A9A,
            0xFFE0A0,
            0xA0E0FF,
            0xFFB0C8,
            0xB0FFB0,
            0xFFE0A0,
            0xFF9A9A,
            0xA0E0FF
        ];

        var m;
        for (m = 0; m < 8; m++) {
            var hx = tx + m * 7;
            var hColor = houseColors[m];

            // House body
            var house = makeBox(6, 5, 6, hColor, hx, 2.5, tz);
            scene.add(house);

            // Roof — cone on each house
            var roofColor = (m % 2 === 0) ? 0xC04040 : 0x804020;
            var roof = makeCone(4.5, 3, 4, roofColor, hx, 6.5, tz);
            scene.add(roof);

            // Windows — small dark boxes
            var win1 = makeBox(1, 1, 0.2, 0x204060, hx - 1.5, 3, tz - 3.1);
            scene.add(win1);

            var win2 = makeBox(1, 1, 0.2, 0x204060, hx + 1.5, 3, tz - 3.1);
            scene.add(win2);
        }

        // Harbour wall
        var harbourWall = makeBox(56, 3, 3, 0x9A8A78, tx + 27, 1.5, tz + 15);
        scene.add(harbourWall);

        // Harbour pier
        var pier = makeBox(3, 2, 20, 0x8A7A68, tx + 56, 1, tz + 5);
        scene.add(pier);

        // Boats in harbour — small boxes
        var boat1 = makeBox(4, 1.5, 2, 0xFFFFFF, tx + 20, 0.75, tz + 10);
        scene.add(boat1);

        var boat2 = makeBox(5, 1.5, 2, 0xFFCC00, tx + 35, 0.75, tz + 10);
        scene.add(boat2);

        var boat3 = makeBox(3, 1.2, 1.5, 0xFF6060, tx + 48, 0.6, tz + 8);
        scene.add(boat3);

        // Masts
        var mast1 = makeBox(0.3, 8, 0.3, 0x604020, tx + 20, 5, tz + 10);
        scene.add(mast1);

        var mast2 = makeBox(0.3, 9, 0.3, 0x604020, tx + 35, 5.5, tz + 10);
        scene.add(mast2);

        // Town walls of Tenby
        var tenbyWall1 = makeBox(56, 4, 2, 0x9A8A78, tx + 27, 2, tz - 18);
        scene.add(tenbyWall1);

        // Tenby castle ruins on headland
        var tcRuin1 = makeBox(8, 6, 2, 0x8A7A68, tx + 55, 3, tz - 10);
        scene.add(tcRuin1);

        var tcRuin2 = makeBox(2, 8, 6, 0x8A7A68, tx + 59, 4, tz - 8);
        scene.add(tcRuin2);
    }

    function buildGrounds(scene) {
        // Castle grounds — courtyard floor
        var ground = makeBox(60, 0.5, 76, 0x7A8A6A, WX, 0, WZ);
        scene.add(ground);

        // Moat-like depression suggestion
        var moat1 = makeBox(64, 1, 4, 0x3A5A7A, WX, -0.5, WZ - 40);
        scene.add(moat1);

        var moat2 = makeBox(64, 1, 4, 0x3A5A7A, WX, -0.5, WZ + 40);
        scene.add(moat2);

        var moat3 = makeBox(4, 1, 76, 0x3A5A7A, WX - 32, -0.5, WZ);
        scene.add(moat3);

        var moat4 = makeBox(4, 1, 76, 0x3A5A7A, WX + 32, -0.5, WZ);
        scene.add(moat4);

        // Great Hall within inner ward
        var hall = makeBox(12, 6, 8, 0x8A7A68, WX + 6, 3, WZ + 8);
        scene.add(hall);

        // Chapel
        var chapel = makeBox(6, 5, 4, 0x9A8A78, WX - 8, 2.5, WZ + 10);
        scene.add(chapel);

        var chapelRoof = makeCone(4, 3, 4, 0x7A6A5A, WX - 8, 6.5, WZ + 10);
        scene.add(chapelRoof);
    }

    function init(scene) {
        buildKeep(scene);
        buildCurtainWalls(scene);
        buildGatehouse(scene);
        buildTownWalls(scene);
        buildMilfordHaven(scene);
        buildStDavidsCathedral(scene);
        buildPembrokeCoast(scene);
        buildTenby(scene);
        buildGrounds(scene);
    }

    return {
        init: init,
        worldX: WX,
        worldZ: WZ
    };
}());
