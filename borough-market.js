window.BoroughMarket = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11320;

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

    function makeMat(color, opts) {
        var params = { color: color };
        if (opts) {
            if (opts.transparent !== undefined) params.transparent = opts.transparent;
            if (opts.opacity !== undefined) params.opacity = opts.opacity;
            if (opts.side !== undefined) params.side = opts.side;
        }
        return new THREE.MeshLambertMaterial(params);
    }

    function makeBox(w, h, d, color, x, y, z, opts) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color, opts);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z, opts) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color, opts);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function makeLines(pts, color) {
        var geo = new THREE.BufferGeometry();
        var verts = [];
        for (var i = 0; i < pts.length; i++) {
            verts.push(pts[i][0], pts[i][1], pts[i][2]);
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(geo, mat);
        scene.add(lines);
        objects.push(lines);
        return lines;
    }

    function buildGround() {
        makeBox(600, 1, 600, 0x5a5a4a, X_OFFSET, -0.5, 0);
    }

    function buildBoroughMarket() {
        var mx = X_OFFSET - 60;
        var mz = -20;

        // Main market hall floor slab
        makeBox(120, 1, 80, 0x8b7355, mx, 0.5, mz);

        // Iron columns - grid of columns supporting the roof
        var colPositions = [
            [-50, -30], [-50, -10], [-50, 10], [-50, 30],
            [-30, -30], [-30, -10], [-30, 10], [-30, 30],
            [-10, -30], [-10, -10], [-10, 10], [-10, 30],
            [10, -30],  [10, -10],  [10, 10],  [10, 30],
            [30, -30],  [30, -10],  [30, 10],  [30, 30],
            [50, -30],  [50, -10],  [50, 10],  [50, 30]
        ];
        for (var i = 0; i < colPositions.length; i++) {
            makeCyl(0.4, 0.4, 14, 8, 0x2a2a2a, mx + colPositions[i][0], 7, mz + colPositions[i][1]);
        }

        // Arched roof sections - series of curved barrel vault panels
        var roofColors = [0x7ab8c8, 0x6aa8b8, 0x8ac8d8];
        for (var r = 0; r < 3; r++) {
            var rz = mz - 25 + r * 25;
            makeBox(120, 1.5, 24, roofColors[r % 3], mx, 14.5, rz);
            // Arch ribs
            for (var a = 0; a < 7; a++) {
                makeCyl(0.2, 0.2, 14, 6, 0x1a1a1a, mx - 50 + a * 18, 7, rz - 11);
                makeCyl(0.2, 0.2, 14, 6, 0x1a1a1a, mx - 50 + a * 18, 7, rz + 11);
            }
        }

        // Railway arches overhead - large brick arches
        for (var arch = 0; arch < 5; arch++) {
            var ax = mx - 60 + arch * 30;
            // Arch pier left
            makeBox(4, 18, 8, 0x8b4513, ax - 15, 9, mz - 45);
            // Arch pier right
            makeBox(4, 18, 8, 0x8b4513, ax - 15, 9, mz + 45);
            // Arch crown
            makeBox(6, 4, 96, 0x7a3d0f, ax - 15, 18, mz);
        }

        // Railway track on top of arches
        makeBox(150, 2, 8, 0x4a4a4a, mx, 20, mz - 41);
        makeBox(150, 1, 1, 0x3a3a3a, mx, 21, mz - 43);
        makeBox(150, 1, 1, 0x3a3a3a, mx, 21, mz - 39);

        // Market stalls - rows of stalls with colorful canopies
        var stallColors = [0xcc3333, 0x33aa33, 0x3333cc, 0xcc9933, 0x993399, 0x33aacc, 0xcc6633, 0x66cc33];
        var stallPositions = [
            [-50, -20], [-50, 0], [-50, 20],
            [-30, -20], [-30, 0], [-30, 20],
            [-10, -20], [-10, 0], [-10, 20],
            [10, -20],  [10, 0],  [10, 20],
            [30, -20],  [30, 0],  [30, 20],
            [50, -20],  [50, 0],  [50, 20]
        ];
        for (var s = 0; s < stallPositions.length; s++) {
            var sx = mx + stallPositions[s][0];
            var sz = mz + stallPositions[s][1];
            var sc = stallColors[s % stallColors.length];
            // Stall table
            makeBox(7, 1, 4, 0x9b8b6b, sx, 1, sz);
            // Stall legs
            makeCyl(0.15, 0.15, 2, 4, 0x5a4a3a, sx - 3, 1, sz - 1.5);
            makeCyl(0.15, 0.15, 2, 4, 0x5a4a3a, sx + 3, 1, sz - 1.5);
            makeCyl(0.15, 0.15, 2, 4, 0x5a4a3a, sx - 3, 1, sz + 1.5);
            makeCyl(0.15, 0.15, 2, 4, 0x5a4a3a, sx + 3, 1, sz + 1.5);
            // Canopy
            makeBox(8, 0.4, 5, sc, sx, 4, sz);
            // Canopy supports
            makeCyl(0.12, 0.12, 3, 4, 0x3a3a3a, sx - 3.5, 2.5, sz - 2);
            makeCyl(0.12, 0.12, 3, 4, 0x3a3a3a, sx + 3.5, 2.5, sz - 2);
            // Food display boxes
            makeBox(1.5, 0.8, 1, 0xcc6644, sx - 2, 1.9, sz);
            makeBox(1.5, 0.8, 1, 0x44aa44, sx, 1.9, sz);
            makeBox(1.5, 0.8, 1, 0xddcc33, sx + 2, 1.9, sz);
        }

        // Market entrance gates
        makeBox(2, 8, 1, 0x2a2a2a, mx - 60, 4, mz - 20);
        makeBox(2, 8, 1, 0x2a2a2a, mx - 60, 4, mz + 20);
        makeBox(44, 2, 1, 0x2a2a2a, mx - 38, 8, mz - 20);
        makeBox(44, 2, 1, 0x2a2a2a, mx - 38, 8, mz + 20);

        // Market perimeter walls
        makeBox(1.5, 6, 82, 0x9b8b6b, mx - 61, 3, mz);
        makeBox(1.5, 6, 82, 0x9b8b6b, mx + 61, 3, mz);
        makeBox(122, 1.5, 1.5, 0x9b8b6b, mx, 3, mz - 41);
    }

    function buildSouthwarkCathedral() {
        var cx = X_OFFSET + 60;
        var cz = -100;

        // Churchyard ground
        makeBox(80, 0.5, 100, 0x4a6a3a, cx, 0.25, cz);

        // Nave - long central body
        makeBox(22, 16, 60, 0xc4a882, cx, 8, cz + 10);

        // Nave roof
        makeBox(24, 4, 62, 0x8b7355, cx, 17, cz + 10);

        // Choir - east end
        makeBox(18, 14, 30, 0xc4a882, cx, 7, cz + 55);
        makeBox(20, 3, 32, 0x8b7355, cx, 15, cz + 55);

        // Harvard Chapel - north transept
        makeBox(14, 12, 14, 0xb89a72, cx + 20, 6, cz + 30);
        makeBox(15, 3, 15, 0x8b7355, cx + 20, 13, cz + 30);

        // Main perpendicular gothic tower - square tower with battlements
        makeBox(14, 40, 14, 0xc4a882, cx, 20, cz - 20);

        // Tower upper section
        makeBox(12, 10, 12, 0xb89a72, cx, 45, cz - 20);

        // Battlements on tower
        for (var bt = 0; bt < 4; bt++) {
            makeBox(2.5, 2.5, 2.5, 0xb89a72, cx - 5 + bt * 3.5, 51.5, cz - 26.5);
            makeBox(2.5, 2.5, 2.5, 0xb89a72, cx - 5 + bt * 3.5, 51.5, cz - 13.5);
            makeBox(2.5, 2.5, 2.5, 0xb89a72, cx - 6.5, 51.5, cz - 23 + bt * 3.5);
            makeBox(2.5, 2.5, 2.5, 0xb89a72, cx + 6.5, 51.5, cz - 23 + bt * 3.5);
        }

        // Tower pinnacles
        makeCone(1, 6, 4, 0x9b8b6b, cx - 6, 54, cz - 26);
        makeCone(1, 6, 4, 0x9b8b6b, cx + 6, 54, cz - 26);
        makeCone(1, 6, 4, 0x9b8b6b, cx - 6, 54, cz - 14);
        makeCone(1, 6, 4, 0x9b8b6b, cx + 6, 54, cz - 14);

        // Gothic windows - vertical slot windows on nave
        for (var ww = 0; ww < 5; ww++) {
            makeBox(2.5, 8, 0.5, 0x7ab8d8, cx - 12, 10, cz - 15 + ww * 10);
            makeBox(2.5, 8, 0.5, 0x7ab8d8, cx + 12, 10, cz - 15 + ww * 10);
        }

        // Entrance porch
        makeBox(10, 6, 8, 0xb89a72, cx, 3, cz - 51);
        makeCone(5.5, 4, 4, 0x9b8b6b, cx, 8, cz - 51);

        // Flying buttresses
        for (var fb = 0; fb < 4; fb++) {
            makeBox(6, 1.5, 1.5, 0x9b8b6b, cx - 16, 10, cz - 10 + fb * 12);
            makeBox(1.5, 1.5, 1.5, 0x9b8b6b, cx - 19, 10, cz - 10 + fb * 12);
            makeBox(6, 1.5, 1.5, 0x9b8b6b, cx + 16, 10, cz - 10 + fb * 12);
            makeBox(1.5, 1.5, 1.5, 0x9b8b6b, cx + 19, 10, cz - 10 + fb * 12);
        }

        // Churchyard monuments - grave markers
        for (var gm = 0; gm < 8; gm++) {
            var gmx = cx - 30 + (gm % 4) * 10;
            var gmz = cz - 20 + Math.floor(gm / 4) * 10;
            makeBox(1.2, 2.5, 0.3, 0xaaaaaa, gmx, 1.25, gmz);
            makeSphere(0.6, 6, 4, 0x999999, gmx, 3.1, gmz);
        }
    }

    function buildTheShard() {
        var sx = X_OFFSET + 100;
        var sz = 100;

        // Foundation base
        makeBox(50, 4, 40, 0x5a5a5a, sx, 2, sz);

        // The Shard - tapering glass tower with stacked narrowing floors
        // Lower floors (1-20): wide base
        for (var fl = 0; fl < 20; fl++) {
            var fw = 48 - fl * 1.2;
            var fd = 38 - fl * 0.9;
            makeBox(fw, 4, fd, 0x8ab4cc, sx, 4 + fl * 4 + 2, sz);
        }

        // Mid floors (20-50): narrowing more steeply
        for (var fm = 0; fm < 30; fm++) {
            var mw = 24 - fm * 0.6;
            var md = 20 - fm * 0.45;
            if (mw < 2) mw = 2;
            if (md < 2) md = 2;
            makeBox(mw, 4, md, 0x8ab4cc, sx, 84 + fm * 4 + 2, sz);
        }

        // Upper floors (50-70): spire section
        for (var fu = 0; fu < 20; fu++) {
            var uw = 6 - fu * 0.22;
            var ud = 5 - fu * 0.18;
            if (uw < 0.5) uw = 0.5;
            if (ud < 0.5) ud = 0.5;
            makeBox(uw, 4, ud, 0x9ac4dc, sx, 204 + fu * 4 + 2, sz);
        }

        // Spire tip floors (70-87)
        for (var fs = 0; fs < 17; fs++) {
            var sw = 1.5 - fs * 0.07;
            if (sw < 0.3) sw = 0.3;
            makeBox(sw, 3, sw, 0xb0d4e8, sx, 284 + fs * 3 + 1.5, sz);
        }

        // Illuminated spire top
        makeSphere(1.2, 8, 6, 0xffffff, sx, 337, sz);

        // Horizontal floor bands / glazing mullions
        for (var hb = 0; hb < 15; hb++) {
            makeBox(50, 0.5, 40, 0x4a6a7a, sx, 6 + hb * 22, sz);
        }

        // Corner structural elements
        makeCyl(1.5, 1.5, 320, 4, 0x5a7a8a, sx - 22, 160, sz - 17);
        makeCyl(1.5, 1.5, 320, 4, 0x5a7a8a, sx + 22, 160, sz - 17);
        makeCyl(1.5, 1.5, 320, 4, 0x5a7a8a, sx, 160, sz + 18);

        // Base lobby / podium
        makeBox(60, 8, 50, 0x7a8a9a, sx, 4, sz);
        makeBox(64, 1, 54, 0x6a7a8a, sx, 8, sz);
    }

    function buildLondonBridge() {
        var bx = X_OFFSET + 20;
        var bz = 60;

        // River Thames water
        makeBox(300, 2, 80, 0x1a3a5a, bx, -1, bz + 20);

        // Bridge deck - 5 spans
        makeBox(200, 3, 22, 0x888888, bx, 3, bz);

        // Bridge piers - 4 intermediate piers
        for (var bp = 0; bp < 4; bp++) {
            makeCyl(4, 5, 12, 8, 0x7a7a7a, bx - 80 + bp * 40, -3, bz);
        }

        // Abutments at each end
        makeBox(12, 10, 24, 0x888888, bx - 100, 0, bz);
        makeBox(12, 10, 24, 0x888888, bx + 100, 0, bz);

        // Parapets - both sides
        makeBox(200, 1.5, 1.5, 0x999999, bx, 5, bz - 10.5);
        makeBox(200, 1.5, 1.5, 0x999999, bx, 5, bz + 10.5);

        // Parapet posts along length
        for (var pp = 0; pp < 20; pp++) {
            makeBox(0.5, 2, 0.5, 0x888888, bx - 95 + pp * 10, 5.5, bz - 10.5);
            makeBox(0.5, 2, 0.5, 0x888888, bx - 95 + pp * 10, 5.5, bz + 10.5);
        }

        // Bridge roadway markings / center divider
        makeBox(200, 0.2, 0.5, 0xcccccc, bx, 4.6, bz);

        // Approach roads - south side
        makeBox(200, 1, 22, 0x666666, bx, 2, bz + 80);

        // Approach roads - north side
        makeBox(200, 1, 22, 0x666666, bx, 2, bz - 70);

        // Street lamps on bridge
        for (var sl = 0; sl < 10; sl++) {
            makeCyl(0.2, 0.2, 6, 6, 0x444444, bx - 90 + sl * 20, 7, bz - 10.5);
            makeSphere(0.5, 6, 4, 0xffffcc, bx - 90 + sl * 20, 10.5, bz - 10.5);
            makeCyl(0.2, 0.2, 6, 6, 0x444444, bx - 90 + sl * 20, 7, bz + 10.5);
            makeSphere(0.5, 6, 4, 0xffffcc, bx - 90 + sl * 20, 10.5, bz + 10.5);
        }
    }

    function buildBoroughHighStreet() {
        var hx = X_OFFSET - 10;
        var hz = 80;

        // High Street pavement
        makeBox(20, 0.5, 200, 0x8a8a7a, hx, 0.25, hz);

        // Road
        makeBox(14, 0.5, 200, 0x4a4a4a, hx, 0.3, hz);

        // Georgian commercial buildings - west side
        for (var gb = 0; gb < 6; gb++) {
            var gbz = hz - 80 + gb * 30;
            // Building body
            makeBox(18, 18, 22, 0xc4a882, hx - 24, 9, gbz);
            // Roof
            makeBox(19, 3, 23, 0x8b7355, hx - 24, 19.5, gbz);
            // Windows rows
            for (var gwr = 0; gwr < 3; gwr++) {
                for (var gwc = 0; gwc < 3; gwc++) {
                    makeBox(2.5, 3.5, 0.4, 0x7ab8d8, hx - 31 + gwc * 7, 6 + gwr * 5, gbz - 8);
                }
            }
            // Shopfront
            makeBox(12, 4, 0.4, 0x5a4a3a, hx - 24, 2, gbz - 11);
        }

        // East side - coaching inn: The George Inn
        var giz = hz - 50;
        // George Inn main building
        makeBox(30, 14, 20, 0xc4a882, hx + 26, 7, giz);
        makeBox(31, 2, 21, 0x8b7355, hx + 26, 15, giz);
        // Inn courtyard gate archway
        makeBox(2, 10, 8, 0x9b7355, hx + 14, 5, giz - 5);
        makeBox(2, 10, 8, 0x9b7355, hx + 14, 5, giz + 5);
        makeBox(6, 3, 0.5, 0x8b6344, hx + 14, 11, giz);
        // Inn sign
        makeBox(3, 2, 0.2, 0x2a1a0a, hx + 12, 9, giz - 11);
        // Inn windows - gallery style
        for (var iw = 0; iw < 4; iw++) {
            makeBox(3, 2.5, 0.3, 0x7ab8d8, hx + 14 + iw * 5, 10, giz - 10.2);
        }

        // White Hart coaching inn archway (slightly north)
        var whz = hz - 10;
        makeBox(2, 10, 6, 0x9b7355, hx + 14, 5, whz - 3);
        makeBox(2, 10, 6, 0x9b7355, hx + 14, 5, whz + 3);
        makeBox(8, 3, 0.5, 0x8b6344, hx + 14, 11, whz);
        makeBox(30, 14, 18, 0xc4a882, hx + 28, 7, whz);
        makeBox(31, 2, 19, 0x8b7355, hx + 28, 15, whz);

        // Market entrance gates - ornamental iron gates
        var gateZ = hz + 40;
        makeBox(1.5, 10, 1.5, 0x1a1a1a, hx - 12, 5, gateZ);
        makeBox(1.5, 10, 1.5, 0x1a1a1a, hx + 12, 5, gateZ);
        // Gate bars
        for (var gtb = 0; gtb < 9; gtb++) {
            makeBox(0.4, 9, 0.4, 0x2a2a2a, hx - 10 + gtb * 2.5, 4.5, gateZ);
        }
        // Gate top bar
        makeBox(28, 1, 1, 0x1a1a1a, hx, 10, gateZ);
        // Gate decorative spikes
        for (var gts = 0; gts < 9; gts++) {
            makeCone(0.25, 1.5, 4, 0x1a1a1a, hx - 10 + gts * 2.5, 11, gateZ);
        }

        // Street furniture - bins and bollards
        for (var boll = 0; boll < 8; boll++) {
            makeCyl(0.3, 0.4, 1.2, 6, 0x333333, hx - 8 + boll * 20, 0.6, hz - 90);
            makeCyl(0.3, 0.4, 1.2, 6, 0x333333, hx - 8 + boll * 20, 0.6, hz + 90);
        }

        // Street lamps along High Street
        for (var hsl = 0; hsl < 7; hsl++) {
            makeCyl(0.18, 0.18, 8, 6, 0x2a2a2a, hx - 8, 4, hz - 80 + hsl * 30);
            makeSphere(0.5, 6, 4, 0xffffcc, hx - 8, 8.5, hz - 80 + hsl * 30);
            makeCyl(0.18, 0.18, 8, 6, 0x2a2a2a, hx + 8, 4, hz - 80 + hsl * 30);
            makeSphere(0.5, 6, 4, 0xffffcc, hx + 8, 8.5, hz - 80 + hsl * 30);
        }
    }

    function build() {
        buildGround();
        buildBoroughMarket();
        buildSouthwarkCathedral();
        buildTheShard();
        buildLondonBridge();
        buildBoroughHighStreet();
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
