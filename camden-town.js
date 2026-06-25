window.CamdenTown = (function() {
    'use strict';

    var WX = 5120;
    var WZ = 2200;

    var _meshes = [];
    var _lights = [];
    var _scene  = null;
    var _animMeshes = [];

    /* ── Primitive helpers ─────────────────────────────────────────────── */

    function makebox(scene, w, h, d, color, x, y, z) {
        var geo  = new THREE.BoxGeometry(w, h, d);
        var mat  = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        _meshes.push(mesh);
        return mesh;
    }

    function makeboxrot(scene, w, h, d, color, x, y, z, ry) {
        var geo  = new THREE.BoxGeometry(w, h, d);
        var mat  = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        mesh.rotation.y = ry;
        scene.add(mesh);
        _meshes.push(mesh);
        return mesh;
    }

    function makecylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo  = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat  = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        _meshes.push(mesh);
        return mesh;
    }

    function makesphere(scene, r, ws, hs, color, x, y, z) {
        var geo  = new THREE.SphereGeometry(r, ws, hs);
        var mat  = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        _meshes.push(mesh);
        return mesh;
    }

    function makecone(scene, r, h, segs, color, x, y, z) {
        var geo  = new THREE.ConeGeometry(r, h, segs);
        var mat  = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        _meshes.push(mesh);
        return mesh;
    }

    function makelinesegs(scene, positions, color, x, y, z) {
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        var mat  = new THREE.LineBasicMaterial({ color: color });
        var mesh = new THREE.LineSegments(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        _meshes.push(mesh);
        return mesh;
    }

    /* ── Lighting ──────────────────────────────────────────────────────── */

    function buildlighting(scene) {
        var amb = new THREE.AmbientLight(0xCCDDFF, 0.55);
        scene.add(amb);
        _lights.push(amb);

        var sun = new THREE.DirectionalLight(0xFFF5E0, 0.85);
        sun.position.set(WX + 50, 80, WZ + 20);
        scene.add(sun);
        _lights.push(sun);

        var fill = new THREE.PointLight(0x9FAACC, 0.4, 250);
        fill.position.set(WX - 60, 20, WZ + 60);
        scene.add(fill);
        _lights.push(fill);

        /* canal ambient glow */
        var canalLight = new THREE.PointLight(0x4169E1, 0.3, 120);
        canalLight.position.set(WX, 5, WZ + 30);
        scene.add(canalLight);
        _lights.push(canalLight);

        /* market warm glow */
        var marketLight = new THREE.PointLight(0xFF9940, 0.5, 150);
        marketLight.position.set(WX - 30, 8, WZ - 20);
        scene.add(marketLight);
        _lights.push(marketLight);

        /* Roundhouse glow */
        var rhLight = new THREE.PointLight(0xFF4400, 0.45, 100);
        rhLight.position.set(WX + 90, 10, WZ - 60);
        scene.add(rhLight);
        _lights.push(rhLight);
    }

    /* ── Ground / streets ──────────────────────────────────────────────── */

    function buildground(scene) {
        /* tarmac ground base */
        makebox(scene, 500, 0.5, 500, 0x2A2A2A, 0, -0.25, 0);
        /* pavement strips along high street */
        makebox(scene, 8, 0.3, 320, 0x888880, -20, 0.15, 0);
        makebox(scene, 8, 0.3, 320, 0x888880,  20, 0.15, 0);
        /* canal towpath */
        makebox(scene, 6, 0.3, 200, 0x9A8870, 32, 0.15, 0);
        makebox(scene, 6, 0.3, 200, 0x9A8870, -8, 0.15, 0);
        /* road markings suggestion — dark lines */
        makebox(scene, 0.3, 0.35, 300, 0xFFFFAA, 0, 0.175, 0);
        makebox(scene, 0.3, 0.35, 300, 0xFFFFAA, 5, 0.175, 0);
    }

    /* ── 1. Camden Market ──────────────────────────────────────────────── */

    function buildcamdenmarket(scene) {
        /* main brick market hall — north block */
        makebox(scene, 35, 6, 20, 0x8B3A3A, -40, 3, -30);
        /* market hall roof lip */
        makebox(scene, 37, 0.8, 22, 0x6B2A2A, -40, 6.4, -30);
        /* south market hall */
        makebox(scene, 35, 6, 20, 0x8B3A3A, -40, 3,  10);
        makebox(scene, 37, 0.8, 22, 0x6B2A2A, -40, 6.4, 10);

        /* connecting covered walkway between halls */
        makebox(scene, 6, 4, 18, 0x7A6030, -40, 2, -10);

        /* colourful awnings — red, yellow, green, blue boxes */
        var awningColors = [0xFF2020, 0xFFD020, 0x20C020, 0x2060FF, 0xFF8020, 0xCC20CC];
        var awningOffsets = [
            [-50, -28], [-44, -28], [-38, -28], [-32, -28], [-26, -28],
            [-50,  8],  [-44,  8],  [-38,  8],  [-32,  8],  [-26,  8],
            [-50, -18], [-26, -18]
        ];
        for (var i = 0; i < awningOffsets.length; i++) {
            makebox(scene, 5, 0.25, 3, awningColors[i % awningColors.length],
                awningOffsets[i][0], 4.5, awningOffsets[i][1]);
            /* awning fringe hang */
            makebox(scene, 5, 0.8, 0.2, awningColors[i % awningColors.length],
                awningOffsets[i][0], 4.1, awningOffsets[i][1] - 1.6);
        }

        /* market stall tables */
        for (var j = 0; j < 6; j++) {
            makebox(scene, 3, 0.1, 1.5, 0xCCAA70, -52 + j * 5, 1.1, -28);
            makebox(scene, 0.1, 1.1, 0.1, 0x885530, -53 + j * 5, 0.55, -27.3);
            makebox(scene, 0.1, 1.1, 0.1, 0x885530, -51 + j * 5, 0.55, -27.3);
            makebox(scene, 0.1, 1.1, 0.1, 0x885530, -53 + j * 5, 0.55, -28.7);
            makebox(scene, 0.1, 1.1, 0.1, 0x885530, -51 + j * 5, 0.55, -28.7);
        }

        /* Stables Market section — arched brick bays suggestion */
        makebox(scene, 28, 8, 18, 0x9B4040, -80, 4, -20);
        makebox(scene, 30, 0.6, 20, 0x7B2828, -80, 8.3, -20);
        /* stable bay dividers */
        for (var k = 0; k < 4; k++) {
            makebox(scene, 0.6, 8, 18, 0x7B2828, -93 + k * 9, 4, -20);
        }
        /* stable arched tops — cylinder halves suggestion via short cylinders */
        for (var m = 0; m < 3; m++) {
            makecylinder(scene, 2.5, 2.5, 0.5, 12, 0x8B3A3A, -89 + m * 9, 8, -20);
        }

        /* open-air courtyard stalls */
        for (var n = 0; n < 5; n++) {
            makebox(scene, 2.5, 2.2, 2.5, 0xCC9944, -33 + n * 5, 1.1, -22);
        }
        /* market entrance gate pillars */
        makebox(scene, 1.2, 5, 1.2, 0x8B3A3A, -24, 2.5, -40);
        makebox(scene, 1.2, 5, 1.2, 0x8B3A3A, -56, 2.5, -40);
        makebox(scene, 34, 0.8, 1, 0x6B2020, -40, 5.4, -40);
    }

    /* ── 2. Regent's Canal ─────────────────────────────────────────────── */

    function buildcanal(scene) {
        /* canal water strip */
        makebox(scene, 14, 0.4, 200, 0x4169E1, 16, 0.2, 10);
        /* canal walls */
        makebox(scene, 1.5, 2, 200, 0x7B6A55, 9.5, 1, 10);
        makebox(scene, 1.5, 2, 200, 0x7B6A55, 22.5, 1, 10);
        /* canal bed colour (darker water bottom) */
        makebox(scene, 12, 0.3, 200, 0x2A4A8B, 16, -0.05, 10);

        /* ripple surface lines */
        var ripplePos = [];
        for (var r = 0; r < 10; r++) {
            ripplePos.push(-5, 0.01, -80 + r * 20);
            ripplePos.push( 5, 0.01, -80 + r * 20);
        }
        makelinesegs(scene, ripplePos, 0x6699FF, 16, 0.25, 10);

        /* 8 narrowboats moored along canal */
        var boatColors  = [0xCC2020, 0x2050CC, 0x20AA20, 0xCC9020,
                           0xAA20AA, 0x20AAAA, 0xCC5020, 0x205020];
        var boatOffsets = [-70, -50, -30, -10, 10, 30, 50, 70];
        for (var b = 0; b < 8; b++) {
            var bx = 20; /* moor on right bank */
            var bz = boatOffsets[b];
            /* hull */
            makebox(scene, 3.5, 1.2, 10, boatColors[b], bx, 0.9, bz);
            /* cabin */
            makebox(scene, 2.8, 1.4, 7,  0xF0E8D8,       bx, 2.3, bz - 0.5);
            /* cabin roof */
            makebox(scene, 2.9, 0.3, 7.2, 0x555555,       bx, 3.05, bz - 0.5);
            /* bow taper suggestion */
            makebox(scene, 3.5, 1.2, 1,  0x333333,        bx, 0.9, bz - 5.5);
            /* chimney */
            makecylinder(scene, 0.12, 0.12, 1.2, 6, 0x222222, bx - 0.8, 3.7, bz - 1.5);
            /* tiller post */
            makebox(scene, 0.15, 1, 0.15, 0x885530, bx, 1.7, bz + 4.5);
        }
    }

    /* ── 3. Camden Lock ────────────────────────────────────────────────── */

    function buildcamdenlock(scene) {
        var lx = 16, lz = -90;
        /* raised water level in lock chamber */
        makebox(scene, 14, 1.8, 18, 0x5588CC, lx, 1.2, lz);
        /* lock gate lower */
        makebox(scene, 14, 3, 1, 0x4A3020, lx, 1.5, lz - 9.5);
        /* lock gate upper */
        makebox(scene, 14, 3, 1, 0x4A3020, lx, 1.5, lz + 9.5);
        /* gate balance beams */
        makebox(scene, 8, 0.4, 0.4, 0x3A2010, lx - 3, 3.2, lz - 9.5);
        makebox(scene, 8, 0.4, 0.4, 0x3A2010, lx + 3, 3.2, lz + 9.5);
        /* lock side walls */
        makebox(scene, 1.5, 4, 18, 0x7B6A55, lx - 7.5, 2, lz);
        makebox(scene, 1.5, 4, 18, 0x7B6A55, lx + 7.5, 2, lz);
        /* lock steps on bank */
        makebox(scene, 3, 0.4, 1, 0x998877, lx - 9, 0.4, lz + 6);
        makebox(scene, 3, 0.4, 1, 0x998877, lx - 9, 0.8, lz + 7);
        makebox(scene, 3, 0.4, 1, 0x998877, lx - 9, 1.2, lz + 8);

        /* Lock keeper's cottage */
        makebox(scene, 8, 5, 7, 0xD4B896, lx + 16, 2.5, lz);
        makebox(scene, 9, 0.6, 8, 0x886644, lx + 16, 5.3, lz);
        /* cottage chimney */
        makebox(scene, 1, 3, 1, 0x885533, lx + 16, 7.5, lz - 2);
        /* cottage door */
        makebox(scene, 1.4, 2.2, 0.3, 0x442200, lx + 12.2, 1.1, lz);
        /* cottage windows */
        makebox(scene, 1.5, 1.2, 0.2, 0xAACCDD, lx + 13.5, 2.5, lz + 3.6);
        makebox(scene, 1.5, 1.2, 0.2, 0xAACCDD, lx + 18.5, 2.5, lz + 3.6);
    }

    /* ── 4. Amy Winehouse statue ───────────────────────────────────────── */

    function buildamywinehousestatue(scene) {
        var sx = 95, sz = -50;
        /* plinth base */
        makebox(scene, 2.5, 0.4, 2.5, 0x888878, sx, 0.2, sz);
        makebox(scene, 2, 0.3, 2, 0x777767, sx, 0.55, sz);
        makebox(scene, 1.5, 2, 1.5, 0x666656, sx, 1.5, sz);
        /* figure body */
        makebox(scene, 0.7, 1.8, 0.5, 0x4A3728, sx, 3.7, sz);
        /* figure legs */
        makebox(scene, 0.25, 1.0, 0.3, 0x3A2718, sx - 0.2, 2.2, sz);
        makebox(scene, 0.25, 1.0, 0.3, 0x3A2718, sx + 0.2, 2.2, sz);
        /* figure torso/dress */
        makebox(scene, 0.8, 1.2, 0.55, 0x4A3728, sx, 4.0, sz);
        /* figure arms */
        makebox(scene, 1.2, 0.25, 0.25, 0x4A3728, sx, 4.5, sz);
        /* head */
        makebox(scene, 0.5, 0.5, 0.5, 0x4A3728, sx, 5.3, sz);
        /* iconic beehive hair */
        makebox(scene, 0.55, 0.8, 0.45, 0x2A1A10, sx, 5.95, sz);
        makecone(scene, 0.3, 0.6, 8, 0x2A1A10, sx, 6.55, sz);
        /* microphone suggestion */
        makebox(scene, 0.08, 0.7, 0.08, 0x888888, sx + 0.55, 4.8, sz);
        makesphere(scene, 0.12, 6, 4, 0x666666, sx + 0.55, 5.2, sz);
        /* statue nameplate */
        makebox(scene, 2, 0.3, 0.2, 0x4A3020, sx, 0.85, sz - 0.75);
    }

    /* ── 5. Roundhouse ─────────────────────────────────────────────────── */

    function buildroundhouse(scene) {
        var rx = 90, rz = -65;
        /* main cylindrical drum */
        makecylinder(scene, 14, 14, 8, 16, 0x8B3A3A, rx, 4, rz);
        /* drum top ring */
        makecylinder(scene, 14.5, 14.5, 0.6, 16, 0x6B2020, rx, 8.3, rz);
        /* cone roof */
        makecone(scene, 14.6, 5, 16, 0x553030, rx, 11.5, rz);
        /* central lantern on cone */
        makecylinder(scene, 1.8, 1.8, 2.5, 8, 0x8B3A3A, rx, 14.5, rz);
        makecone(scene, 2, 1.5, 8, 0x553030, rx, 16, rz);
        /* interior turntable pit suggestion */
        makecylinder(scene, 10, 10, 0.4, 16, 0x221510, rx, 0.2, rz);
        /* entrance canopy */
        makebox(scene, 12, 3.5, 5, 0x8B3A3A, rx - 14, 1.75, rz);
        makebox(scene, 13, 0.4, 6, 0x6B2020, rx - 14, 3.7, rz);
        /* entrance door */
        makebox(scene, 4, 3, 0.4, 0x221510, rx - 19, 1.5, rz);
        /* venue signage box */
        makebox(scene, 10, 1.5, 0.4, 0x1A1A1A, rx - 14, 5, rz + 2.5);
        makebox(scene, 8, 0.9, 0.5, 0xEEEEEE, rx - 14, 5, rz + 2.7);
        /* brick texture row detail — lines of box ribs */
        for (var i = 0; i < 4; i++) {
            makecylinder(scene, 14.05, 14.05, 0.15, 16, 0x7A2A2A, rx, 1.5 + i * 2, rz);
        }
    }

    /* ── 6. Electric Ballroom ──────────────────────────────────────────── */

    function buildelectricballroom(scene) {
        var bx = 0, bz = -100;
        /* main building */
        makebox(scene, 22, 12, 15, 0x1C1C1C, bx, 6, bz);
        /* parapet/stepped top */
        makebox(scene, 24, 1.5, 17, 0x141414, bx, 12.75, bz);
        makebox(scene, 20, 1.5, 13, 0x0E0E0E, bx, 14.25, bz);
        /* facade pilasters */
        makebox(scene, 1.5, 12, 1.5, 0x2A2A2A, bx - 10, 6, bz - 7.6);
        makebox(scene, 1.5, 12, 1.5, 0x2A2A2A, bx,      6, bz - 7.6);
        makebox(scene, 1.5, 12, 1.5, 0x2A2A2A, bx + 10, 6, bz - 7.6);
        /* neon sign — red letters suggestion as glowing red boxes */
        makebox(scene, 18, 2.2, 0.3, 0xFF0000, bx, 10, bz - 7.8);
        makebox(scene, 16, 1.5, 0.35, 0xFF4444, bx, 10, bz - 7.9);
        /* neon glow boxes smaller */
        makebox(scene, 3, 1.8, 0.2, 0xFF2200, bx - 7, 10, bz - 7.85);
        makebox(scene, 3, 1.8, 0.2, 0xFF2200, bx - 2, 10, bz - 7.85);
        makebox(scene, 3, 1.8, 0.2, 0xFF2200, bx + 3, 10, bz - 7.85);
        makebox(scene, 3, 1.8, 0.2, 0xFF2200, bx + 7, 10, bz - 7.85);
        /* entrance doors */
        makebox(scene, 8, 4, 0.5, 0x333333, bx, 2, bz - 7.8);
        makebox(scene, 7.5, 3.5, 0.6, 0x111111, bx, 2, bz - 7.85);
        /* box office window */
        makebox(scene, 2, 2, 0.3, 0xAACCDD, bx - 9, 2, bz - 7.75);
        /* side fire exits */
        makebox(scene, 0.1, 3, 4, 0x0E0E0E, bx - 11, 1.5, bz + 2);
        makebox(scene, 0.1, 3, 4, 0x0E0E0E, bx + 11, 1.5, bz + 2);
    }

    /* ── 7. Camden High Street shops ───────────────────────────────────── */

    function buildhighstreet(scene) {
        /* row of alternative shops either side */
        var shopColorsLeft  = [0xAA4422, 0x224488, 0x226622, 0xAA7722, 0x662266, 0x884422];
        var shopColorsRight = [0x448844, 0x994444, 0x446688, 0x888844, 0x448888, 0xAA5544];

        for (var i = 0; i < 6; i++) {
            /* left side shops */
            makebox(scene, 8, 9, 10, shopColorsLeft[i], -25, 4.5, -60 + i * 16);
            makebox(scene, 9, 0.4, 11, 0x553322, -25, 9.2, -60 + i * 16);
            /* shop window */
            makebox(scene, 5, 3, 0.2, 0xBBDDEE, -25, 3.5, -65 + i * 16);
            /* shop door */
            makebox(scene, 1.5, 3, 0.2, 0x442200, -25, 1.5, -62 + i * 16);
            /* right side shops */
            makebox(scene, 8, 9, 10, shopColorsRight[i], 25, 4.5, -60 + i * 16);
            makebox(scene, 9, 0.4, 11, 0x553322, 25, 9.2, -60 + i * 16);
            makebox(scene, 5, 3, 0.2, 0xBBDDEE, 25, 3.5, -65 + i * 16);
            makebox(scene, 1.5, 3, 0.2, 0x442200, 25, 1.5, -62 + i * 16);
        }

        /* oversized decorative rooftop sculptures */

        /* Guitar shape on left shop roof (shop index 0 at z=-60) */
        /* body */
        makebox(scene, 1.5, 4, 0.4, 0xAA6620, -25, 12.5, -60);
        /* neck */
        makebox(scene, 0.4, 4, 0.3, 0x885510, -25, 16.5, -60);
        /* headstock */
        makebox(scene, 1.2, 0.8, 0.3, 0x774410, -25, 18.8, -60);
        /* strings suggestion */
        makebox(scene, 0.05, 4, 0.05, 0xCCCCCC, -24.9, 16.5, -60);
        makebox(scene, 0.05, 4, 0.05, 0xCCCCCC, -25.1, 16.5, -60);

        /* Boot shape on right shop roof (shop index 2 at z=-28) */
        /* boot leg */
        makebox(scene, 2.5, 5, 2.5, 0x884422, 25, 14, -28);
        /* boot foot */
        makebox(scene, 4,   2, 2.5, 0x884422, 26.5, 10.5, -28);
        /* boot toe */
        makebox(scene, 1.5, 1.5, 2.5, 0x884422, 29, 9.75, -28);
        /* boot sole */
        makebox(scene, 5,   0.4, 2.8, 0x442211, 27,  9,  -28);
        /* lace detail */
        makebox(scene, 2,   0.2, 0.2, 0xEEDDCC, 25, 12.5, -26.8);
        makebox(scene, 2,   0.2, 0.2, 0xEEDDCC, 25, 13.5, -26.8);

        /* Shark shape on left shop roof (shop index 4 at z=4) */
        /* shark body */
        makebox(scene, 1.5, 2, 8, 0x8888AA, -25, 12.5, 4);
        /* dorsal fin */
        makecone(scene, 0.8, 3, 4, 0x8888AA, -25, 14.5, 2);
        /* tail fin */
        makebox(scene, 0.3, 2.5, 1.5, 0x8888AA, -25, 12.5, 8);
        /* head taper */
        makebox(scene, 1.2, 1.5, 1, 0x8888AA, -25, 12.2, -4.5);
        /* mouth */
        makebox(scene, 1.2, 0.3, 0.8, 0xFFFFFF, -25, 11.5, -4.8);

        /* hanging sign boards */
        for (var j = 0; j < 6; j++) {
            makebox(scene, 3, 1.5, 0.15, 0xFFDD80, -25, 6, -63 + j * 16);
            makebox(scene, 3, 1.5, 0.15, 0xFFDD80,  25, 6, -63 + j * 16);
        }
        /* lamp posts */
        for (var k = 0; k < 8; k++) {
            makebox(scene, 0.18, 7, 0.18, 0x555555, -17, 3.5, -65 + k * 14);
            makebox(scene, 0.18, 7, 0.18, 0x555555,  17, 3.5, -65 + k * 14);
            makebox(scene, 1.8, 0.12, 0.12, 0x555555, -16, 7.1, -65 + k * 14);
            makebox(scene, 1.8, 0.12, 0.12, 0x555555,  16, 7.1, -65 + k * 14);
            makesphere(scene, 0.3, 6, 4, 0xFFFFAA, -15.1, 7.1, -65 + k * 14);
            makesphere(scene, 0.3, 6, 4, 0xFFFFAA,  15.1, 7.1, -65 + k * 14);
        }
    }

    /* ── 8. Hawley Wharf development ───────────────────────────────────── */

    function buildhawleywharf(scene) {
        /* modern mixed-use blocks */
        makebox(scene, 20, 14, 14, 0xE8E8E8, 55, 7, 60);
        makebox(scene, 16, 10, 12, 0xDDDDDD, 55, 5, 80);
        makebox(scene, 18, 18, 12, 0xEEEEEE, 55, 9, 40);
        makebox(scene, 12, 8,  10, 0xE0E0E0, 55, 4, 96);

        /* cantilevered floor plates */
        makebox(scene, 22, 0.5, 16, 0xCCCCCC, 55, 7, 60);
        makebox(scene, 22, 0.5, 16, 0xCCCCCC, 55, 14, 60);
        makebox(scene, 20, 0.5, 14, 0xCCCCCC, 55, 5, 80);
        makebox(scene, 20, 0.5, 14, 0xCCCCCC, 55, 10, 80);

        /* glass curtain wall strips */
        makebox(scene, 18, 12, 0.25, 0x88CCEE, 55, 7, 53.1);
        makebox(scene, 14, 8,  0.25, 0x88CCEE, 55, 5, 74.1);
        makebox(scene, 16, 16, 0.25, 0x88CCEE, 55, 9, 34.1);

        /* canalside terraces */
        makebox(scene, 6, 0.3, 8, 0xDDCCAA, 42, 0.45, 60);
        makebox(scene, 6, 0.3, 8, 0xDDCCAA, 42, 0.45, 74);
        makebox(scene, 6, 0.3, 8, 0xDDCCAA, 42, 0.45, 88);

        /* terrace railings */
        for (var i = 0; i < 3; i++) {
            makebox(scene, 6, 0.05, 0.05, 0x888888, 42, 1.3, 56 + i * 14);
            makebox(scene, 6, 0.05, 0.05, 0x888888, 42, 0.9, 56 + i * 14);
            makebox(scene, 0.06, 0.9, 0.06, 0x888888, 39, 0.8, 56 + i * 14);
            makebox(scene, 0.06, 0.9, 0.06, 0x888888, 45, 0.8, 56 + i * 14);
        }

        /* restaurant/cafe ground floor boxes */
        makebox(scene, 8, 3.5, 6, 0xF5F5F0, 48, 1.75, 62);
        makebox(scene, 8, 3.5, 6, 0xF5F5F0, 48, 1.75, 78);
        /* outdoor seating boxes */
        for (var j = 0; j < 4; j++) {
            makebox(scene, 0.8, 0.7, 0.8, 0xBBBBBB, 42 + j * 1.5, 0.55, 65);
            makebox(scene, 2, 0.05, 2, 0xDDDDDD, 42 + j * 1.5, 0.9, 65);
        }
    }

    /* ── 9. Jewish Museum ──────────────────────────────────────────────── */

    function buildjewishmuseum(scene) {
        var mx = -75, mz = 70;
        /* main museum building */
        makebox(scene, 20, 9, 15, 0xFFF8DC, mx, 4.5, mz);
        /* upper floor extension */
        makebox(scene, 16, 4, 12, 0xFFFAE0, mx, 11, mz);
        /* parapet */
        makebox(scene, 22, 0.8, 17, 0xF0E8CC, mx, 13.4, mz);
        /* entrance portico */
        makebox(scene, 8, 7, 3, 0xFFF8DC, mx, 3.5, mz - 9);
        makebox(scene, 9, 0.5, 4, 0xF0E8CC, mx, 7.25, mz - 9);
        /* entrance door */
        makebox(scene, 2.5, 3.5, 0.3, 0x553300, mx, 1.75, mz - 10.7);
        /* large arched windows */
        makebox(scene, 2, 3.5, 0.3, 0xAABBCC, mx - 6, 5, mz - 7.6);
        makebox(scene, 2, 3.5, 0.3, 0xAABBCC, mx,     5, mz - 7.6);
        makebox(scene, 2, 3.5, 0.3, 0xAABBCC, mx + 6, 5, mz - 7.6);

        /* Hebrew lettering decorations — abstract box arrangements */
        /* Shin shape */
        makebox(scene, 0.3, 2,   0.3, 0xCC9944, mx - 7, 9.5, mz - 7.5);
        makebox(scene, 0.3, 1.2, 0.3, 0xCC9944, mx - 7.8, 10.2, mz - 7.5);
        makebox(scene, 0.3, 1.2, 0.3, 0xCC9944, mx - 6.2, 10.2, mz - 7.5);
        /* Aleph shape */
        makebox(scene, 0.3, 2,   0.3, 0xCC9944, mx - 4, 9.5, mz - 7.5);
        makebox(scene, 1.8, 0.3, 0.3, 0xCC9944, mx - 4, 10.2, mz - 7.5);
        makebox(scene, 0.3, 1, 0.3, 0xCC9944, mx - 3.4, 9.1, mz - 7.5);
        /* Mem shape */
        makebox(scene, 1.6, 0.3, 0.3, 0xCC9944, mx - 1, 10.5, mz - 7.5);
        makebox(scene, 0.3, 1.8, 0.3, 0xCC9944, mx - 1.7, 9.7, mz - 7.5);
        makebox(scene, 0.3, 1.8, 0.3, 0xCC9944, mx - 0.3, 9.7, mz - 7.5);
        makebox(scene, 1.6, 0.3, 0.3, 0xCC9944, mx - 1, 8.8, mz - 7.5);
        /* Star of David — two overlapping box triangles suggestion */
        makebox(scene, 2.4, 0.3, 0.3, 0x886622, mx + 5, 11.5, mz - 7.4);
        makebox(scene, 1.2, 0.3, 0.3, 0x886622, mx + 4.4, 10.5, mz - 7.4);
        makebox(scene, 1.2, 0.3, 0.3, 0x886622, mx + 5.6, 10.5, mz - 7.4);
        makebox(scene, 2.4, 0.3, 0.3, 0x886622, mx + 5, 10, mz - 7.4);
        makebox(scene, 1.2, 0.3, 0.3, 0x886622, mx + 4.4, 11.0, mz - 7.4);
        makebox(scene, 1.2, 0.3, 0.3, 0x886622, mx + 5.6, 11.0, mz - 7.4);
        /* mezuzah on door frame */
        makebox(scene, 0.2, 0.8, 0.15, 0xCC9944, mx - 1.15, 2.2, mz - 10.65);
    }

    /* ── 10. Primrose Hill park ────────────────────────────────────────── */

    function buildprimrosehill(scene) {
        var px = -100, pz = 130;
        /* hill base — wide flat mound */
        makebox(scene, 80, 2,  80, 0x3A7A3A, px, 1, pz);
        /* mid level */
        makebox(scene, 55, 4,  55, 0x3A7A3A, px, 4, pz);
        /* upper level */
        makebox(scene, 36, 6,  36, 0x3A7A3A, px, 8, pz);
        /* summit plateau */
        makebox(scene, 18, 3,  18, 0x4A8A4A, px, 12.5, pz);
        /* summit flat top */
        makebox(scene, 16, 0.4, 16, 0x5A9A5A, px, 14, pz);
        /* grass turf top */
        makebox(scene, 14, 0.25, 14, 0x60A060, px, 14.2, pz);

        /* hill path winding suggestion */
        makebox(scene, 2, 0.15, 40, 0x998877, px + 15, 3, pz + 5);
        makebox(scene, 2, 0.15, 30, 0x998877, px + 5,  7, pz);

        /* park benches on hill */
        var benchPositions = [
            [px - 5, 14.3, pz - 4],
            [px + 5, 14.3, pz - 4],
            [px,     14.3, pz + 5],
            [px - 6, 3, pz - 35],
            [px + 6, 3, pz - 35]
        ];
        for (var b = 0; b < benchPositions.length; b++) {
            var bx = benchPositions[b][0] - WX;
            var by = benchPositions[b][1];
            var bz = benchPositions[b][2] - WZ;
            /* bench seat */
            makebox(scene, 2.2, 0.15, 0.7, 0x885533, bx, by, bz);
            /* bench back */
            makebox(scene, 2.2, 0.7, 0.12, 0x885533, bx, by + 0.4, bz - 0.29);
            /* bench legs */
            makebox(scene, 0.1, 0.5, 0.7, 0x664422, bx - 0.95, by - 0.3, bz);
            makebox(scene, 0.1, 0.5, 0.7, 0x664422, bx + 0.95, by - 0.3, bz);
        }

        /* trees on slope — cylinders for trunks, spheres/cones for canopy */
        var treePositions = [
            [px - 30, pz - 30],
            [px + 25, pz - 28],
            [px - 28, pz + 30],
            [px + 22, pz + 32],
            [px - 20, pz - 10],
            [px + 18, pz - 8]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tx = treePositions[t][0] - WX;
            var tz = treePositions[t][1] - WZ;
            makecylinder(scene, 0.4, 0.5, 4, 6, 0x553311, tx, 2, tz);
            makesphere(scene, 3, 8, 6, 0x2A7A2A, tx, 6, tz);
        }

        /* London skyline boxes in distance — stylised distant towers */
        var skylineData = [
            [px + 80, 18, pz - 120, 3, 36, 3],
            [px + 90, 12, pz - 125, 4, 24, 4],
            [px + 70, 10, pz - 118, 3, 20, 3],
            [px + 100, 15, pz - 130, 5, 30, 5],
            [px + 110, 8,  pz - 122, 8, 16, 8],
            [px + 50,  6,  pz - 115, 6, 12, 6],
            [px + 60, 20, pz - 125, 2, 40, 2],
            [px - 20, 9,  pz - 120, 10, 18, 10],
            [px + 30, 7,  pz - 118, 7, 14, 7]
        ];
        var skyColors = [0x888898, 0x787888, 0x686878, 0x909098, 0x6A6A7A, 0x7A7A8A, 0x848494, 0x6C6C7C, 0x7E7E8E];
        for (var s = 0; s < skylineData.length; s++) {
            var sd = skylineData[s];
            makebox(scene, sd[3], sd[4], sd[5], skyColors[s], sd[0] - WX, sd[4] / 2, sd[2] - WZ);
        }

        /* viewing point marker at summit */
        makebox(scene, 0.3, 1.8, 0.3, 0x888888, px - WX, 15.1, pz - WZ);
        makebox(scene, 1, 0.1, 1, 0xBBAA88, px - WX, 16, pz - WZ);
    }

    /* ── Additional Camden street furniture ────────────────────────────── */

    function buildstreetfurniture(scene) {
        /* bus stops */
        makebox(scene, 0.1, 3.5, 1.5, 0xCC3333, -16, 1.75, -50);
        makebox(scene, 2, 0.1, 1.5, 0xCC3333, -16, 3.5, -50);
        makebox(scene, 0.1, 3.5, 1.5, 0xCC3333, -16, 1.75, 30);
        makebox(scene, 2, 0.1, 1.5, 0xCC3333, -16, 3.5, 30);
        makebox(scene, 0.1, 3.5, 1.5, 0xCC3333,  16, 1.75, -50);
        makebox(scene, 2, 0.1, 1.5, 0xCC3333,  16, 3.5, -50);

        /* recycling bins */
        for (var i = 0; i < 5; i++) {
            makecylinder(scene, 0.35, 0.35, 0.9, 8, 0x228822, -18, 0.45, -40 + i * 20);
            makecylinder(scene, 0.37, 0.37, 0.1, 8, 0x114411, -18, 0.95, -40 + i * 20);
        }

        /* bollards protecting pavement */
        for (var j = 0; j < 12; j++) {
            makecylinder(scene, 0.15, 0.15, 0.9, 6, 0xFFBB00, -12, 0.45, -60 + j * 10);
            makecylinder(scene, 0.15, 0.15, 0.9, 6, 0xFFBB00,  12, 0.45, -60 + j * 10);
        }

        /* manhole covers */
        makecylinder(scene, 0.5, 0.5, 0.05, 8, 0x555555, 0, 0.05, -30);
        makecylinder(scene, 0.5, 0.5, 0.05, 8, 0x555555, 5, 0.05,  20);
        makecylinder(scene, 0.5, 0.5, 0.05, 8, 0x555555, -3, 0.05, 60);

        /* pub sign boards hanging above door */
        makebox(scene, 3, 2, 0.2, 0x884422, -25, 7.5, -14);
        makebox(scene, 2.6, 1.7, 0.25, 0xFFDD66, -25, 7.5, -14.12);
        /* pub hanging chain left right */
        makebox(scene, 0.07, 0.9, 0.07, 0x888888, -26.3, 8, -14);
        makebox(scene, 0.07, 0.9, 0.07, 0x888888, -23.7, 8, -14);
    }

    /* ── Camden underground station ────────────────────────────────────── */

    function buildcamdenunderground(scene) {
        var ux = 5, uz = -130;
        /* station building */
        makebox(scene, 14, 6, 12, 0xCC3333, ux, 3, uz);
        makebox(scene, 16, 0.8, 14, 0xAA2222, ux, 6.4, uz);
        /* roundel ring — cylinder */
        makecylinder(scene, 3, 3, 0.3, 16, 0xCC3333, ux, 5.5, uz - 6.1);
        makecylinder(scene, 2.5, 2.5, 0.35, 16, 0xF0F0F0, ux, 5.5, uz - 6.15);
        /* roundel bar */
        makebox(scene, 5.5, 1, 0.4, 0x000099, ux, 5.5, uz - 6.2);
        /* station entrance */
        makebox(scene, 6, 3, 0.4, 0x111111, ux, 1.5, uz - 6.1);
        /* entrance canopy */
        makebox(scene, 14, 0.4, 4, 0xCC3333, ux, 4.2, uz - 8);
        /* tube sign pole */
        makebox(scene, 0.15, 5, 0.15, 0x444444, ux + 6, 2.5, uz - 6);
    }

    /* ── BUILD ALL ─────────────────────────────────────────────────────── */

    function buildall(scene) {
        buildlighting(scene);
        buildground(scene);
        buildcamdenmarket(scene);
        buildcanal(scene);
        buildcamdenlock(scene);
        buildamywinehousestatue(scene);
        buildroundhouse(scene);
        buildelectricballroom(scene);
        buildhighstreet(scene);
        buildhawleywharf(scene);
        buildjewishmuseum(scene);
        buildprimrosehill(scene);
        buildstreetfurniture(scene);
        buildcamdenunderground(scene);
    }

    /* ── Public API ────────────────────────────────────────────────────── */

    function init(scene) {
        _scene = scene;
        buildall(scene);
    }

    function update(dt) {
        /* no per-frame animation needed for static environment */
        void dt;
    }

    function reset() {
        var i;
        for (i = 0; i < _meshes.length; i++) {
            if (_scene) {
                _scene.remove(_meshes[i]);
            }
            if (_meshes[i].geometry) { _meshes[i].geometry.dispose(); }
            if (_meshes[i].material) { _meshes[i].material.dispose(); }
        }
        _meshes = [];
        for (i = 0; i < _lights.length; i++) {
            if (_scene) { _scene.remove(_lights[i]); }
        }
        _lights  = [];
        _scene   = null;
        _animMeshes = [];
    }

    return { init: init, update: update, reset: reset };

}());
